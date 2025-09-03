import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import { deleteProspect, getActiveProspects } from "../../services/prospects.service";
import { exportProspectPDF } from "../../libs/exportProspectToPdf";
import Button from "../../components/ui/button/Button";

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
      default: "#f9fafb", // gris muy claro
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
          backgroundColor: "rgba(59,130,246,0.06)", // similar a bg-blue-100/20
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

export default function ClientsMRT() {
  const navigate = useNavigate();

  // Estado remoto
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
          onClick={() => console.log("Marcar como atendido", p.id)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
        >
          <CheckCircleIcon className="h-5 w-5" /> Marcar como atendido
        </button>,
        <button
          key="verify"
          onClick={() => console.log("Verificar cliente", p.id)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
        >
          <CheckIcon className="h-5 w-5" /> Verificar cliente
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
        <button
          key="edit"
          onClick={() => navigate(`/manage/client?id=${p.id}`)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-100"
        >
          <PencilSquareIcon className="h-5 w-5" /> Editar
        </button>,
        <button
          key="archive"
          onClick={async () => {
            await deleteProspect(p.id);
            await reload();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
        >
          <TrashIcon className="h-5 w-5" /> Archivar
        </button>,
      ];
    },

    // Estado inicial
    initialState: {
      density: "comfortable",
      pagination: { pageIndex: 0, pageSize: 10 },
      showGlobalFilter: true, // mostrar busqueda nativa desde el inicio
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
  const disabled = selectedRows.length === 0;

  const selectedProspects: Prospect[] = selectedRows.map((r: any) => r.original);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={async () => {
          await Promise.all(selectedProspects.map((p) => exportProspectPDF(p)));
        }}
        startIcon={<DocumentArrowDownIcon className="size-5" />}
      >
        Exportar PDF (selección)
      </Button>

      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={async () => {
          await Promise.all(selectedProspects.map((p) => deleteProspect(p.id)));
          await onReload();
        }}
        startIcon={<TrashIcon className="size-5" />}
      >
        Archivar (selección)
      </Button>
    </div>
  );
}
