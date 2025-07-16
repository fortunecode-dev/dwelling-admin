export function generateProspectSummary(prospect: any): string {
  const datosPersonales = [
    ["Nombre", prospect.name],
    ["Apellidos", prospect.lastName],
    ["Correo electrónico", prospect.email],
    ["Teléfono", prospect.phone],
    ["Dirección", prospect.address],
    ["Ciudad", prospect.city],
    ["Estado", prospect.state],
    ["Código Postal", prospect.postal]
  ]
    .filter(([, val]) => val)
    .map(([label, val]) => `<tr><td><strong>${label}</strong></td><td>${val}</td></tr>`);

  const meta = prospect.metadata || {};
  const extra = meta.extra || {};
  const metaRest = { ...meta };
  delete metaRest.extra;
  delete metaRest.objective;

  const categorias: Record<string, string[]> = {
    Propiedad: [
      "propertyAddress", "zoning", "lotArea", "buildingArea", "houseType",
      "bedrooms", "bathrooms", "ownerOccupation", "propertyValue"
    ],
    Finanzas: ["income", "loanAmount", "debt", "rate", "fico", "pi", "pt"],
    Evaluación: ["character", "generalNotes", "cautiousNotes", "finalScopeOfWork"]
  };

  const renderCategoria = (titulo: string, campos: string[]) => {
    const rows = campos
      .filter((k) => meta[k])
      .map((k) =>
        `<tr><td><strong>${k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</strong></td><td>${meta[k]}</td></tr>`
      );
    return rows.length
      ? `<h2>${titulo}</h2><table>${rows.join("")}</table>`
      : "";
  };

  const otros = Object.entries(metaRest)
    .filter(([k]) => !Object.values(categorias).flat().includes(k))
    .map(([k, v]) =>
      `<tr><td><strong>${k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</strong></td><td>${v}</td></tr>`
    );

  const extras = Object.entries(extra).map(([, v]:[k:any,v:any]) =>
    `<tr><td><strong>${v.context.replace(/_/g, " ").replace(/\b\w/g, (l:any) => l.toUpperCase())}</strong></td><td>${v.value}</td></tr>`
  );

  const objetivos = Array.isArray(meta.objective)
    ? `<ul>${meta.objective.map((item: string) => `<li>${item}</li>`).join("")}</ul>`
    : "";

  return `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 1rem; color: #333; }
          h2 { margin-top: 2rem; font-size: 1.2rem; border-bottom: 1px solid #ccc; }
          table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
          td { padding: 4px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
          strong { font-weight: 600; }
        </style>
      </head>
      <body>
        <h2>Datos del Prospecto</h2>
        <table>${datosPersonales.join("")}</table>

        ${renderCategoria("Propiedad", categorias.Propiedad)}
        ${renderCategoria("Finanzas", categorias.Finanzas)}
        ${renderCategoria("Evaluación", categorias.Evaluación)}

        ${objetivos ? `<h2>Objetivos</h2>${objetivos}` : ""}
        ${extras.length > 0 ? `<h2>Objetivos Detallados</h2><table>${extras.join("")}</table>` : ""}
        ${otros.length > 0 ? `<h2>Otros</h2><table>${otros.join("")}</table>` : ""}
      </body>
    </html>
  `;
}
