import { useMemo, useState } from "react";
import {
  DownloadIcon,
  FileIcon,
  FolderIcon,
  PencilIcon,
  TrashBinIcon,
} from "../../../icons";
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";

export type TreeNode = {
  name: string;
  rootName?: string;
  path: string;
  type: "folder" | "file";
  children?: TreeNode[];
};

type FileTreeProps = {
  nodes: TreeNode[];
  onRename: (oldPath: string, newPath: string) => void;
  onDownloadZip: (path: string, zipName: string) => void;
  onShare: (path: string, type: "file" | "folder") => void;
  onMove: (from: string, toFolder: string) => void;
  onDelete: (path: string) => void;
  getZipName: (name: string, path: string, type: "file" | "folder", father?: string) => string;
  enableMove?: boolean;
  father?: string;

  /** New: define if level-0 folders start open */
  parentsInitiallyOpen?: boolean;

  /** New: parent-managed busy flag to disable actions */
  isBusy?: boolean;

  /**
   * New: notify parent when FileTree runs internal async work (e.g., uploads).
   * Use ONLY for operations that do NOT already call the parent's runWithBusy.
   */
  onBusyChange?: (busy: boolean) => void;
};

const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  onRename,
  onDownloadZip,
  onShare,
  onMove,
  onDelete,
  getZipName,
  enableMove = true,
  parentsInitiallyOpen = true,
  isBusy = false,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const findNodeByPath = (nodesList: TreeNode[], path: string): TreeNode | null => {
    for (const node of nodesList) {
      if (node.path === path) return node;
      if (node.children) {
        const result = findNodeByPath(node.children, path);
        if (result) return result;
      }
    }
    return null;
  };



  const content = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return (
        <div className="mt-14 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-base text-gray-600 font-medium">No documents available</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload files or create a folder to get started.
          </p>
          {/* Example button to show how to trigger an internal upload */}
          {/* <button
            disabled={isBusy}
            onClick={() => handleUploadExample("/", new File([], "example.txt"))}
            className="mt-4 inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Upload (example)"
          >
            Simulate Upload
          </button> */}
        </div>
      );
    }

    return (
      <div className="text-base text-gray-800">
        {nodes.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            level={0}
            rootName={node.rootName}
            onRename={onRename}
            onDownloadZip={onDownloadZip}
            onShare={onShare}
            onDelete={onDelete}
            onMove={onMove}
            overId={enableMove ? overId : null}
            activeId={activeId}
            getZipName={getZipName}
            parentsInitiallyOpen={parentsInitiallyOpen}
            isBusy={isBusy}
          />
        ))}
      </div>
    );
  }, [nodes, enableMove, overId, activeId, onRename, onDownloadZip, onShare, onDelete, onMove, getZipName, parentsInitiallyOpen, isBusy]);

  return enableMove ? (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragOver={({ over }) => setOverId((over?.id as string) || null)}
      onDragEnd={({ active, over }) => {
        if (active.id && over?.id && active.id !== over.id) {
          const fromPath = active.id as string;
          const toFolderPath = over.id as string;

          const draggedNode = findNodeByPath(nodes, fromPath);
          const targetFolder = findNodeByPath(nodes, toFolderPath);

          if (draggedNode?.type === "file" && targetFolder?.type === "folder") {
            const collision = targetFolder.children?.some(
              (child) => child.name === draggedNode.name && child.type === "file"
            );
            if (collision) {
              alert("A file with the same name already exists in the target folder.");
            } else {
              onMove(fromPath, toFolderPath);
            }
          }
        }
        setActiveId(null);
        setOverId(null);
      }}
    >
      {content}
      <DragOverlay>
        {activeId ? (
          <div className="rounded bg-white p-2 text-xs shadow">{activeId}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    content
  );
};

const FileTreeItem: React.FC<{
  node: TreeNode;
  level: number;
  rootName?: string;
  onRename: (oldPath: string, newPath: string) => void;
  onDownloadZip: (path: string, zipName: string) => void;
  onShare: (path: string, type: "file" | "folder") => void;
  onDelete: (path: string) => void;
  onMove: (from: string, to: string) => void;
  getZipName: (name: string, path: string, type: "file" | "folder", father?: string) => string;
  overId?: string | null;
  activeId?: string | null;
  father?: string;
  parentsInitiallyOpen?: boolean;
  isBusy?: boolean;
}> = ({
  node,
  level,
  rootName,
  onRename,
  onDownloadZip,
  onShare,
  onDelete,
  onMove,
  getZipName,
  overId,
  father,
  parentsInitiallyOpen = true,
  isBusy = false,
}) => {
    const initialOpen =
      node.type === "folder" ? (level === 0 ? parentsInitiallyOpen : true) : false;

    const [open, setOpen] = useState<boolean>(initialOpen);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(node.name);

    const paddingLeft = `${level * 1.5}rem`;

    const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
      id: node.path,
      disabled: node.type !== "file" || isBusy,
    });

    const { setNodeRef: setDropRef } = useDroppable({ id: node.path });

    const handleRename = () => {
      if (name && name !== node.name) {
        const parts = node.path.split("/");
        parts[parts.length - 1] = name;
        onRename(node.path, parts.join("/"));
      }
      setEditing(false);
    };

    const isTarget = overId === node.path && node.type === "folder";

    return (
      <div
        ref={(el) => {
          setDragRef(el);
          setDropRef(el);
        }}
        style={{ paddingLeft }}
        className={`mb-1 ${isTarget ? "border-l-4 border-blue-400 bg-blue-50" : ""}`}
      >
        <div className="group flex items-center gap-3">
          {node.type === "folder" ? (
            <FolderIcon
              className={`h-5 w-5 cursor-pointer text-gray-500 ${isBusy ? "opacity-50" : ""}`}
              onClick={() => !isBusy && setOpen((prev) => !prev)}
            />
          ) : (
            <FileIcon className="h-5 w-5 text-gray-500" />
          )}

          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="w-full max-w-xs rounded border border-gray-300 px-2 py-1 text-base"
              disabled={isBusy}
              aria-label="Rename file or folder"
              placeholder="Type new name…"
            />
          ) : (
            <span
              className={`w-full overflow-hidden text-gray-700 ${node.type === "file" ? "cursor-pointer" : ""}`}
              onDoubleClick={() => !isBusy && setEditing(true)}
              {...(node.type === "file" ? attributes : {})}
              {...(node.type === "file" ? listeners : {})}
              title={node.path}
            >
              {node.name}
            </span>
          )}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => onDownloadZip(node.path, rootName ?? "")}
              title="Download ZIP"
              disabled={isBusy}
              className="disabled:opacity-50"
            >
              <DownloadIcon className="h-5 w-5 text-indigo-600 hover:text-indigo-800" />
            </button>

            {node.type !== "folder" && <button
              onClick={() => !isBusy && setEditing(true)}
              title="Rename"
              disabled={isBusy}
              className="disabled:opacity-50"
            >
              <PencilIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>}

            {node.type === "file" && (
              <button
                onClick={() => onDelete(node.path)}
                title="Delete"
                disabled={isBusy}
                className="disabled:opacity-50"
              >
                <TrashBinIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {open && node.children && (
          <div className="mt-1">
            {node.children.map((child) => (
              <FileTreeItem
                father={father ? father : node.path.split("/").length == 1 ? node.name : ""}
                key={child.path}
                node={child}
                level={level + 1}
                rootName={rootName}
                onRename={onRename}
                onDownloadZip={onDownloadZip}
                onShare={onShare}
                onDelete={onDelete}
                onMove={onMove}
                getZipName={getZipName}
                overId={overId}
                parentsInitiallyOpen={parentsInitiallyOpen}
                isBusy={isBusy}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

export default FileTree;
