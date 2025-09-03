import { useState } from "react";
import {
  DownloadIcon,
  FileIcon,
  FolderIcon,
  PencilIcon,
  TrashBinIcon
} from "../../../icons";
import { ShareIcon } from "@heroicons/react/24/outline";
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  DragOverlay
} from "@dnd-kit/core";

export type TreeNode = {
  name: string;
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
  getZipName: (name:string,path: string, type: "file" | "folder",father:string) => string;
  enableMove?: boolean;
  father?:string
};

const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  onRename,
  onDownloadZip,
  onShare,
  onMove,
  onDelete,
  getZipName,
  enableMove = true
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const findNodeByPath = (nodes: TreeNode[], path: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const result = findNodeByPath(node.children, path);
        if (result) return result;
      }
    }
    return null;
  };

  const content = (
    <div className="text-base text-gray-800">
      {nodes.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          level={0}
          onRename={onRename}
          onDownloadZip={onDownloadZip}
          onShare={onShare}
          onDelete={onDelete}
          onMove={onMove}
          overId={enableMove ? overId : null}
          activeId={activeId}
          getZipName={getZipName}
        />
      ))}
    </div>
  );

  return enableMove ? (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragOver={({ over }) => setOverId(over?.id as string || null)}
      onDragEnd={({ active, over }) => {
        if (active.id && over?.id && active.id !== over.id) {
          const fromPath = active.id as string;
          const toFolderPath = over.id as string;

          const draggedNode = findNodeByPath(nodes, fromPath);
          const targetFolder = findNodeByPath(nodes, toFolderPath);

          if (
            draggedNode?.type === "file" &&
            targetFolder?.type === "folder"
          ) {
            const collision = targetFolder.children?.some(
              (child) => child.name === draggedNode.name && child.type === "file"
            );
            if (collision) {
              alert("Ya existe un archivo con ese nombre en la carpeta destino.");
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
          <div className="p-2 bg-white shadow rounded text-xs">{activeId}</div>
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
  onRename: (oldPath: string, newPath: string) => void;
  onDownloadZip: (path: string, zipName: string) => void;
  onShare: (path: string, type: "file" | "folder") => void;
  onDelete: (path: string) => void;
  onMove: (from: string, to: string) => void;
  getZipName: (name:string,path: string, type: "file" | "folder") => string;
  overId?: string | null;
  activeId?: string | null;
  father?:string
}> = ({
  node,
  level,
  onRename,
  onDownloadZip,
  onShare,
  onDelete,
  onMove,
  getZipName,
  overId,
  father
}) => {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);

  const paddingLeft = `${level * 1.5}rem`;

  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: node.path,
    disabled: node.type !== "file"
  });

  const { setNodeRef: setDropRef } = useDroppable({ id: node.path });

  const handleRename = () => {
    if (name && name !== node.name) {
      let newName = node.path.split("/");
      newName[newName.length - 1] = name;
      onRename(node.path, newName.join("/"));
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
      className={`mb-1 ${isTarget ? "bg-blue-50 border-l-4 border-blue-400" : ""}`}
    >
      <div className="flex items-center gap-3 group">
        {node.type === "folder" ? (
          <FolderIcon
            className="w-5 h-5 text-gray-500"
            onClick={() => setOpen((prev) => !prev)}
          />
        ) : (
          <FileIcon className="w-5 h-5 text-gray-500" />
        )}

        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            className="text-base border border-gray-300 rounded px-2 py-1 w-full max-w-xs"
          />
        ) : (
          <span
            className="text-gray-700 truncate w-full max-w-xs cursor-pointer"
            onDoubleClick={() => setEditing(true)}
            {...(node.type === "file" ? attributes : {})}
            {...(node.type === "file" ? listeners : {})}
          >
            {node.name}
          </span>
        )}

        <div className="flex gap-2 ml-auto opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onDownloadZip(node.path, getZipName(node.name,node.path, node.type,father))}
            title="Descargar"
          >
            <DownloadIcon className="w-5 h-5 text-indigo-600 hover:text-indigo-800" />
          </button>

          <button onClick={() => onShare(node.path, node.type)} title="Compartir">
            <ShareIcon className="w-5 h-5 text-blue-600 hover:text-blue-800" />
          </button>

          <button onClick={() => setEditing(true)} title="Renombrar">
            <PencilIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>

          {node.type === "file" && (
            <button onClick={() => onDelete(node.path)} title="Eliminar">
              <TrashBinIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {open && node.children && (
        <div className="mt-1">
          {node.children.map((child) => (
            <FileTreeItem
            father={father?father:node.path.split("/").length==1?node.name:undefined}
              key={child.path}
              node={child}
              level={level + 1}
              onRename={onRename}
              onDownloadZip={onDownloadZip}
              onShare={onShare}
              onDelete={onDelete}
              onMove={onMove}
              getZipName={getZipName}
              overId={overId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTree;
