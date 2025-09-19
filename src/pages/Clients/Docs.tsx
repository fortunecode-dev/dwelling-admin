import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import FileTree from "./components/FileTree";
import { getProspectFolderNamesMap, getZipName } from "../../utils/prospects-parsing";
import { getActiveProspects } from "../../services/prospects.service";

type TreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: TreeNode[];
};


export default function Docs() {
  const [tree, setTree] = useState<TreeNode[]>([]);

  const refreshTree = useCallback(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/`).then(res => res.json()),
      getActiveProspects().then(data => data)
    ])
      .then(([treeData, prospectsData]) => {
        // Convertir createdAt a Date y aplicar función generadora de nombres

        const nameMap = getProspectFolderNamesMap(prospectsData);

        // Mapear los nombres de los nodos del primer nivel
        const renamedTree = treeData.map((node: TreeNode) => {
          return {
            ...node,
            name: nameMap[node.name] || node.name
          };
        });

        setTree(renamedTree);
      })
      .catch((error) => {
        console.error(error)
        alert("Error al cargar árbol de archivos o prospectos")
      });
  }, []);

  useEffect(() => {
    refreshTree();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageMeta title="Docs" description="Documents management" />
      <PageBreadcrumb pageTitle="Client's Documentation" />
      <FileTree
        parentsInitiallyOpen={false}
        nodes={tree}
        onDelete={(path) => {
          if (confirm("¿Estás seguro que deseas eliminar este archivo?")) {
            fetch(`${import.meta.env.VITE_SERVER_URL}/files/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path })
            }).then(() => refreshTree());
          }
        }}
        onMove={(sourcePath, destinationPath) => {
          fetch(`${import.meta.env.VITE_SERVER_URL}/files/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from: sourcePath, to: destinationPath }),
          }).then(() => refreshTree());
        }}
        onRename={(oldPath, newName) => {
          fetch(`${import.meta.env.VITE_SERVER_URL}/files/rename`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPath, newName }),
          }).then(() => refreshTree());
        }}
        onDownloadZip={async (path, name) => {

          const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}&expires=120`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Fallo: ${res.status}`);
          const blob = await res.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${name}.zip`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(a.href);
          a.remove();
        }}
        onShare={(path, type) => {
          const email = prompt("¿Correo con quien compartir?");
          if (email)
            fetch(`${import.meta.env.VITE_SERVER_URL}/share/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path, type: type.toUpperCase(), email }),
            }).then(() => alert("Compartido ✔️"));
        }}
        getZipName={getZipName}
      />
    </div>
  );
}
