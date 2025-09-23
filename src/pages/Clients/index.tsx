import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  CheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

import { deleteProspect, getActiveProspects } from "../../services/prospects.service";
import { exportProspectPDF } from "../../libs/exportProspectToPdf";
import Button from "../../components/ui/button/Button";
import FileTree from "./components/FileTree";
import { getZipName, prospectNameFallback } from "../../utils/prospects-parsing";
import { DownloadIcon } from "../../icons";

/* ---------------------------------------------
 * Tipo mínimo esperado desde tu backend
 * ------------------------------------------- */
type Prospect = {
  id: string;
  name?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

const showOrNotSet = (v?: unknown) =>
  !v || String(v).trim() === "" ? "Not set" : String(v);

/* ---------------------------------------------
 * Tema MUI: SOLO MODO CLARO (minimalista)
 * ------------------------------------------- */
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3b82f6" }, // azul suave
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "rgba(17,24,39,0.65)",
    },
    divider: "rgba(17,24,39,0.08)",
  },
  typography: {
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif",
    fontSize: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
          border: "1px solid rgba(17,24,39,0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(17,24,39,0.06)",
        },
        head: {
          fontWeight: 700,
          color: "rgba(17,24,39,0.65)",
          backgroundColor: "rgba(59,130,246,0.06)",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
        },
      },
    },
  },
});


/**
 * Descarga resúmenes de múltiples prospectos.
 * Implementación por defecto: genera PDF individual por prospecto.
 * Si tienes endpoint que devuelve un ZIP con todos, cámbialo aquí.
 */
async function downloadSummaries(selected: Prospect[]) {
  // Opción A (rápida): PDF por cada prospecto (usa tu exportador actual).
  for (const p of selected) {
    await exportProspectPDF(p);
  }

  // Opción B (recomendada si ya existe en tu backend):
  // const ids = selected.map((p) => p.id);
  // const res = await fetch(`/api/prospects/summary-zip`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ ids }),
  // });
  // if (!res.ok) throw new Error("No se pudo generar el ZIP de resúmenes");
  // const blob = await res.blob();
  // await downloadBlobAsFile(blob, `prospect-summaries_${new Date().toISOString().slice(0,10)}.zip`);
}

/**
 * Descarga resúmenes + archivos adjuntos de múltiples prospectos.
 * Implementación de ejemplo llamando a un endpoint que genere el ZIP.
 */
async function downloadSummariesWithFiles(selected: Prospect[]) {
  for (const p of selected) {
    await exportProspectPDF(p);
    const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(p.id)}&name=${encodeURIComponent(prospectNameFallback(p as never))}&expires=120`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fallo: ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${prospectNameFallback(p as never)}_all.zip`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

}

export default function ClientsMRT() {
  const navigate = useNavigate();

  // Estado remoto
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado modal "Ver archivos"
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [filesModalLoading, setFilesModalLoading] = useState(false);
  const [tree, setTree] = useState<any[]>([]);
  const [prospectId, setProspectId] = useState<null | string>(null);
  const [filesModalProspect, setFilesModalProspect] = useState<Prospect>();
  const refreshTree = useCallback(
    async (id = "") => {
      try {
        if (!id && !prospectId) return;
        setIsLoading(true);
        setFilesModalLoading(true)
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/${id || prospectId}`);
        const data = await res.json();
        setIsLoading(false);
        setFilesModalLoading(false)
        setTree(data);
      } catch (e) {
        alert("Error al cargar árbol de archivos");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [prospectId]
  );
  const [downloading, setDownloading] = useState(false);

  // Carga inicial
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const list = await getActiveProspects();
        setProspects(list ?? []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Columnas
  const columns = useMemo<MRT_ColumnDef<Prospect>[]>(() => [
    {
      header: "Name",
      id: "name",
      accessorFn: (row) =>
        `${row?.name ?? ""} ${row?.lastName ?? ""}`.trim() || "Not set",
      size: 220,
      minSize: 160,
    },
    {
      header: "Email",
      id: "email",
      accessorFn: (row) => showOrNotSet(row.email),
      size: 240,
      minSize: 180,
    },
    {
      header: "Phone",
      id: "phone",
      accessorFn: (row) => showOrNotSet(row.phone),
      size: 160,
      minSize: 120,
    },
    {
      header: "Address",
      id: "address",
      accessorFn: (row) => showOrNotSet(row.address),
      size: 260,
      minSize: 180,
    },
    {
      header: "Status",
      id: "status",
      accessorFn: (row) => showOrNotSet(row.status),
      size: 140,
      minSize: 120,
    },
  ], []);
  
  // Recarga tras acciones
  const reload = async () => {
    setIsLoading(true);
    try {
      const list = await getActiveProspects();
      setProspects(list ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal de archivos
  const openFilesModal = async (p: Prospect) => {
    setFilesModalProspect(p)
    setProspectId(p.id)
    setFilesModalLoading(true);
    setFilesModalOpen(true);
    refreshTree(p.id)
  };

  // Instancia MRT
  const table = useMaterialReactTable<Prospect>({
    columns,
    data: prospects,
    localization: MRT_Localization_ES,
    // Herramientas de gestión
    enableSorting: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,       // buscador nativo en toolbar
    enablePagination: true,
    enableRowActions: true,
    enableRowSelection: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,
    enableColumnPinning: true,
    enableHiding: true,
    enableStickyHeader: true,
    enableDensityToggle: true,
    enableFullScreenToggle: false,

    // Toolbar: botón + acciones masivas
    renderTopToolbarCustomActions: ({ table }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/manage/client")}
          startIcon={<PlusIcon className="size-5" />}
        >
          New Prospect
        </Button>
        <BulkActions table={table} onReload={reload} />
      </div>
    ),

    // Acciones por fila (Heroicons)
    renderRowActionMenuItems: ({ row }) => {
      const p = row.original;
      return [
        <button
          key="attended"
          disabled
          onClick={() => console.log("Marcar como atendido", p.id)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100 disabled:text-gray-400"
        >
          <CheckCircleIcon className="h-5 w-5" /> Mark as attended (En desarrollo)
        </button>,
        <button
          key="verify"
          disabled
          onClick={() => console.log("Verificar cliente", p.id)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100 disabled:text-gray-400"
        >
          <CheckIcon className="h-5 w-5" /> Verify client (En desarrollo)
        </button>,
        <button
          key="email"
          disabled={!p.email}
          onClick={() => {
            if (!p.email) return;
            navigate(`/mail-to?mail=${encodeURIComponent(p.email)}`);
          }}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
        >
          <EnvelopeIcon className="h-5 w-5" /> Send an E-Mail
        </button>,
        <button
          key="download"
          onClick={() => exportProspectPDF(p)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
        >
          <DocumentArrowDownIcon className="h-5 w-5" /> Download Client Summary
        </button>,

        /* NUEVO: Ver archivos -> abre modal con autoscroll */
        <button
          key="files"
          onClick={() => openFilesModal(p)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
        >
          <EyeIcon className="h-5 w-5" /> View files
        </button>,
        <button
          key="files"
          onClick={async () => {
            const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(p.id)}&name=${encodeURIComponent(prospectNameFallback(p as never))}&expires=120`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fallo: ${res.status}`);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${prospectNameFallback(p as never)}_all.zip`;
            document.body.appendChild(a);
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(a.href);
            a.remove();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100 disabled:text-gray-500"
        >
          <DownloadIcon className="h-5 w-5" /> Download all files
        </button>,

        <button
          key="edit"
          onClick={() => navigate(`/manage/client?id=${p.id}`)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
        >
          <PencilSquareIcon className="h-5 w-5" /> Edit
        </button>,
        <button
          key="archive"
          onClick={async () => {
            await deleteProspect(p.id);
            await reload();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
        >
          <TrashIcon className="h-5 w-5" /> Delete
        </button>,
      ];
    },

    // Estado inicial
    initialState: {
      density: "comfortable",
      pagination: { pageIndex: 0, pageSize: 10 },
      showGlobalFilter: true, // mostrar búsqueda nativa desde el inicio
      columnPinning: { left: ["mrt-row-select"] },
    },

    // Loading remoto
    state: { isLoading },

    // Estilos finos
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 700,
        color: "text.secondary",
        bgcolor: "rgba(59,130,246,0.06)",
      },
    },
    muiTableBodyProps: {
      sx: { "& tr:not(:last-of-type) td": { borderBottomColor: "divider" } },
    },
  });

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <MaterialReactTable table={table} />
    <Dialog
      open={filesModalOpen}
      onClose={() => !downloading && setFilesModalOpen(false)}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, position: "relative" } }}
    >
      {/* Overlay only inside modal while downloading */}
      {downloading && (
        <div
          aria-live="polite"
          aria-busy="true"
          className="absolute inset-0 z-50 flex items-center justify-center bg-white/70"
        >
          <div className="flex flex-col items-center gap-2">
            <CircularProgress size={26} />
            <span className="text-sm text-gray-700">Downloading…</span>
          </div>
        </div>
      )}

      <DialogTitle sx={{ fontWeight: 700 }}>
        Files {filesModalProspect ? `of ${(filesModalProspect.name ?? "")} ${(filesModalProspect.lastName ?? "")}`.trim() : ""}
      </DialogTitle>

      {/* Auto-scroll content */}
      <DialogContent dividers sx={{ maxHeight: 420, overflow: "auto" }}>
        {filesModalLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CircularProgress size={22} />
            <span>Loading files…</span>
          </div>
        ) : tree.length === 0 ? (
          <span>No files to show.</span>
        ) : (
          <FileTree
            nodes={tree}
            // All actions set page-level loader, but download shows modal-level loader too
            onDelete={async (path) => {
              if (!confirm("Are you sure you want to delete this file?")) return;
              try {
                setIsLoading(true);
                await fetch(`${import.meta.env.VITE_SERVER_URL}/files/delete`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path }),
                });
                await refreshTree();
              } catch (e) {
                alert("Error deleting file");
              } finally {
                setIsLoading(false);
              }
            }}
            onMove={async (sourcePath, destinationPath) => {
              try {
                setIsLoading(true);
                await fetch(`${import.meta.env.VITE_SERVER_URL}/files/move`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ from: sourcePath, to: destinationPath }),
                });
                await refreshTree();
              } catch (e) {
                alert("Error moving");
              } finally {
                setIsLoading(false);
              }
            }}
            onRename={async (oldPath, newName) => {
              try {
                setIsLoading(true);
                await fetch(`${import.meta.env.VITE_SERVER_URL}/files/rename`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ oldPath, newName }),
                });
                await refreshTree();
              } catch (e) {
                alert("Error renaming");
              } finally {
                setIsLoading(false);
              }
            }}
            onDownloadZip={async (path, name) => {
              setDownloading(true); // << activate modal loader
              try {
                const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}&expires=120`;
                const splitPath = path.split("/");
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed: ${res.status}`);
                const blob = await res.blob();
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${prospectNameFallback(filesModalProspect as never)} (${splitPath.length === 3 ? "file - " + splitPath[2] : splitPath[1]}).zip`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(a.href);
                a.remove();
              } catch (e) {
                console.error(e);
                alert("Error downloading ZIP");
              } finally {
                setDownloading(false); // << deactivate modal loader
              }
            }}
            onShare={async (path, type) => {
              const email = prompt("Email to share with?");
              if (!email) return;
              try {
                setIsLoading(true);
                await fetch(`${import.meta.env.VITE_SERVER_URL}/share/send`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path, type: type.toUpperCase(), email }),
                });
                alert("Shared ✔️");
              } catch (e) {
                alert("Error sharing");
              } finally {
                setIsLoading(false);
              }
            }}
            getZipName={getZipName}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="primary"
          size="sm"
          disabled={downloading}
          onClick={async () => {
            if (!prospectId) return;
            setDownloading(true); // << activate modal loader
            try {
              const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(prospectId)}&expires=120`;
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Failed: ${res.status}`);
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${prospectNameFallback(filesModalProspect as never)}_all.zip`;
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(a.href);
              a.remove();
            } catch (e) {
              console.error(e);
              alert("Error downloading ZIP");
            } finally {
              setDownloading(false); // << deactivate modal loader
            }
          }}
        >
          Download all
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilesModalOpen(false)}
          disabled={downloading}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>


    </ThemeProvider>
  );
}

/* ---------------------------------------------
 * Acciones masivas (selección de filas)
 * ------------------------------------------- */
function BulkActions({
  table,
  onReload,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  onReload: () => Promise<void>;
}) {
  const selectedRows = table.getSelectedRowModel().rows ?? [];
  const selectedProspects: Prospect[] = selectedRows.map((r: any) => r.original);

  const hasSelection = selectedProspects.length > 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Exportar PDF individual por cada seleccionado (ya existente) */}
      {/* <Button
        size="sm"
        variant="outline"
        disabled={!hasSelection}
        onClick={async () => {
          await Promise.all(selectedProspects.map((p) => exportProspectPDF(p)));
        }}
        startIcon={<DocumentArrowDownIcon className="size-5" />}
      >
        Export PDF
      </Button> */}

      {/* NUEVO: Descargar resúmenes (se habilita solo con 2+) */}
      <Button
        size="sm"
        variant="outline"
        disabled={!hasSelection}
        onClick={async () => {
          await downloadSummaries(selectedProspects);
        }}
        startIcon={<DocumentArrowDownIcon className="size-5" />}
      >
        Download summary
      </Button>

      {/* NUEVO: Descargar resúmenes con archivos (se habilita solo con 2+) */}
      <Button
        size="sm"
        variant="outline"
        disabled={!hasSelection}
        onClick={async () => {
          await downloadSummariesWithFiles(selectedProspects);
        }}
        startIcon={<DocumentArrowDownIcon className="size-5" />}
      >
        Summary + Files
      </Button>

      {/* Archivar seleccionados */}
      <Button
        size="sm"
        variant="outline"
        disabled={!hasSelection}
        onClick={async () => {
          await Promise.all(selectedProspects.map((p) => deleteProspect(p.id)));
          await onReload();
        }}
        startIcon={<TrashIcon className="size-5" />}
      >
        Delete
      </Button>
    </div>
  );
}
