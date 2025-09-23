import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { prospectNameFallback } from "../utils/prospects-parsing";

export function exportProspectPDF(prospect: any) {
  const doc = new jsPDF();
  let y = 20;

  const meta = prospect.metadata || {};
  const extra = meta.extra || {};
  const metaRest = { ...meta };
  delete metaRest.extra;
  delete metaRest.objective;
  delete metaRest.question; // <-- IMPORTANT: remove questions so they don't show again in "Otros"

  const categorias: Record<string, string[]> = {
    Propiedad: [
      "propertyAddress", "zoning", "lotArea", "buildingArea", "houseType",
      "bedrooms", "bathrooms", "ownerOccupation", "propertyValue"
    ],
    Finanzas: ["income", "loanAmount", "debt", "rate", "fico", "pi", "pt"],
    Evaluación: ["character", "generalNotes", "cautiousNotes", "finalScopeOfWork"]
  };

  const formatLabel = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const section = (title: string, rows: any[]) => {
    if (!rows.length) return;
    doc.setFontSize(14);
    doc.text(title, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: 14 },
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak",   // <-- wrap long text
      },
      didDrawPage: (d: any) => (y = d.cursor.y + 10),
    });
  };

  // Datos personales
  section("Datos del Prospecto", [
    ["Nombre", prospect.name],
    ["Apellidos", prospect.lastName],
    ["Correo electrónico", prospect.email],
    ["Teléfono", prospect.phone],
    ["Dirección", prospect.address],
    ["Ciudad", prospect.city],
    ["Estado", prospect.state],
    ["Código Postal", prospect.postal],
  ].filter(([, v]) => !!v));

  // Categorías
  for (const key in categorias) {
    const campos = categorias[key];
    const rows = campos
      .filter((k) => meta[k])
      .map((k) => [formatLabel(k), String(meta[k])]);
    section(key, rows);
  }

  // Objetivos (array)
  if (Array.isArray(meta.objective)) {
    doc.setFontSize(14);
    doc.text("Objetivos", 14, y);
    y += 6;
    meta.objective.forEach((item: string) => {
      doc.setFontSize(11);
      doc.text("• " + item, 18, y);
      y += 5;
    });
    y += 5;
  }

  // Objetivos detallados (extra)
  const extraRows: any[] = Object.entries(extra).map(([k, v]: any) => [
    formatLabel(v?.context || k),
    v?.value ?? "",
  ]);
  section("Objetivos Detallados", extraRows);

  // Otros campos no incluidos (ya sin extra, objective ni question)
  const usados = new Set(Object.values(categorias).flat());
  const otros: any[] = Object.entries(metaRest)
    .filter(([k]) => !usados.has(k))
    .map(([k, v]) => [formatLabel(k), String(v)]);
  section("Otros", otros);

  // === NEW: Questions and Messages (multilínea + headers en inglés) ===
  const questionsObj = meta?.question || {};
  const qEntries = Object.entries(questionsObj);

  if (qEntries.length > 0) {
    doc.setFontSize(14);
    doc.text("Questions and Messages", 14, y);
    y += 6;

    const qRows: any[] = qEntries
      // opcional: orden por ID descendente si son timestamps
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([id, qData]: any) => {
        const q = (qData?.question ?? `Question ${id}`).toString();
        const a = (qData?.answer ?? "-").toString().trim() || "-";
        return [q, a];
      });

    autoTable(doc, {
      startY: y,
      margin: { left: 14 },
      theme: "grid",
      head: [["Question", "Answer"]], // <-- headers en inglés
      body: qRows,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak", // <-- wrap multilínea
      },
      headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
      // Ancho de columnas flexible; si quieres forzar proporciones, descomenta:
      // columnStyles: { 0: { cellWidth: 115 }, 1: { cellWidth: 70 } },
      didDrawPage: (d: any) => (y = d.cursor.y + 10),
    });
  }

  // Guardar PDF
  doc.save(`${prospectNameFallback(prospect as never) || "Prospect file"} - Summary.pdf`);
}
