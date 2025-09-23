import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import FileTree from "./components/FileTree";
import { getProspectFolderNamesMap, getZipName } from "../../utils/prospects-parsing";
import { getAllProspects } from "../../services/prospects.service";

type TreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: TreeNode[];
  rootName?: string;
};

export default function Docs() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [pendingOps, setPendingOps] = useState(0);

  const isBusy = pendingOps > 0;

  const runWithBusy = useCallback(async <T,>(op: () => Promise<T>): Promise<T> => {
    setPendingOps((n) => n + 1);
    try {
      return await op();
    } finally {
      setPendingOps((n) => Math.max(0, n - 1));
    }
  }, []);

  const onBusyChange = useCallback((busy: boolean) => {
    setPendingOps((n) => (busy ? n + 1 : Math.max(0, n - 1)));
  }, []);

  const refreshTree = useCallback(() => {
    return runWithBusy(async () => {
      const [treeData, prospectsData] = await Promise.all([
        fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/`).then((res) => {
          if (!res.ok) throw new Error("Error fetching file tree");
          return res.json();
        }),
        getAllProspects(),
      ]);

      const nameMap = getProspectFolderNamesMap(prospectsData);

      const renamedTree: TreeNode[] = (treeData as TreeNode[]).map((node) => ({
        ...node,
        name: nameMap[node.name] || node.name,
        rootName: nameMap[node.name],
      }));

      setTree(renamedTree);
    }).catch((error) => {
      console.error(error);
      alert("Error loading documents");
    });
  }, [runWithBusy]);

  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      <PageMeta title="Docs" description="Documents management" />
      <PageBreadcrumb pageTitle="Client's Documentation" />

      {isBusy && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
            <p className="text-sm font-medium text-gray-700">Processing…</p>
          </div>
        </div>
      )}

      {tree.length === 0 && !isBusy ? (
        <div className="mt-20 text-center text-gray-500">
          No documents available
        </div>
      ) : (
        <FileTree
          parentsInitiallyOpen={false}
          nodes={tree}
          onBusyChange={onBusyChange}
          isBusy={isBusy}
          onDelete={(path) =>
            runWithBusy(async () => {
              const ok = confirm("Are you sure you want to delete this file?");
              if (!ok) return;
              const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path }),
              });
              if (!res.ok) throw new Error("Failed to delete file");
              await refreshTree();
            }).catch(() => alert("Error deleting file"))
          }
          onMove={(sourcePath, destinationPath) =>
            runWithBusy(async () => {
              const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from: sourcePath, to: destinationPath }),
              });
              if (!res.ok) throw new Error("Failed to move file/folder");
              await refreshTree();
            }).catch(() => alert("Error moving file/folder"))
          }
          onRename={(oldPath, newName) =>
            runWithBusy(async () => {
              const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/rename`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPath, newName }),
              });
              if (!res.ok) throw new Error("Failed to rename file/folder");
              await refreshTree();
            }).catch(() => alert("Error renaming file/folder"))
          }
          onDownloadZip={async (path, name) =>
            runWithBusy(async () => {
              const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(
                path
              )}&name=${encodeURIComponent(name)}&expires=120`;
              const splitPath = path.split("/");
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Failed: ${res.status}`);
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${name} (${
                splitPath.length == 3 ? "file - " + splitPath[2] :splitPath.length == 2? splitPath[1]:"_all"
              }).zip`;
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(a.href);
              a.remove();
            }).catch(() => alert("Error downloading ZIP"))
          }
          onShare={(path, type) =>
            runWithBusy(async () => {
              const email = prompt("Email to share with?");
              if (!email) return;
              const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/share/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, type: type.toUpperCase(), email }),
              });
              if (!res.ok) throw new Error("Failed to share file/folder");
              alert("Shared ✔️");
            }).catch(() => alert("Error sharing"))
          }
          getZipName={getZipName}
        />
      )}
    </div>
  );
}
