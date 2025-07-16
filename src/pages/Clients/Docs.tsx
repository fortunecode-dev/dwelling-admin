import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import FileTree from "./components/FileTree";

export default function Docs() {
    const [tree, setTree] = useState([]);
    const refreshTree = useCallback((submitResponse: any = null) => {

        fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/`)
            .then((res) => res.json())
            .then(setTree)
            .catch(() => alert("Error al cargar árbol de archivos"));
    }, []);
    useEffect(() => {
        refreshTree()
    }, [])
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <PageMeta title="Send Mail" description="Contact with a client" />
            <PageBreadcrumb pageTitle="Client Form" />

            <div className="max-w-xl mx-auto bg-white p-6 rounded shadow mt-8">
                <h2 className="text-2xl font-bold mb-4">Archivos</h2>
                <FileTree nodes={tree}
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
                    onDownloadZip={(path) => {
                        window.open(`${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(path)}`, "_blank");
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
                />
            </div>
        </div>
    );
}
