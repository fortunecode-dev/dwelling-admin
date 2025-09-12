import { useState, useEffect, useCallback } from "react";
import DropzoneComponent from "../../components/form/form-elements/DropZone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import { getProspect, postProspect, updateProspect } from "../../services/prospects.service";
import { useSearchParams } from "react-router";
import FileTree from "./components/FileTree";
import { getZipName } from "../../utils/prospects-parsing";

/** === METADATA FORM SPEC === */
const formMeta = [
  { name: "propertyAddress", label: "Property Address", type: "text", category: "PROPERTY INFORMATION", multiline: true, placeholder: "Enter full property address..." },
  { name: "city", label: "City", type: "text", category: "PROPERTY INFORMATION", placeholder: "Enter city name..." },
  { name: "zoning", label: "Zoning", type: "text", category: "PROPERTY INFORMATION", placeholder: "Enter zoning info..." },
  { name: "lotArea", label: "Lot Area", type: "number", category: "PROPERTY INFORMATION", placeholder: "Enter lot area in sqft..." },
  { name: "houseType", label: "House Type", type: "text", category: "PROPERTY INFORMATION", placeholder: "Enter house type..." },
  { name: "ownerOccupation", label: "Owner Occupation", type: "text", category: "PROPERTY INFORMATION", placeholder: "Enter owner occupation..." },
  { name: "buildingArea", label: "Building Area", type: "number", category: "PROPERTY INFORMATION", placeholder: "Enter building area in sqft..." },
  { name: "units", label: "# Units", type: "number", category: "PROPERTY INFORMATION", placeholder: "Number of units..." },
  { name: "bedrooms", label: "Bedrooms", type: "number", category: "PROPERTY INFORMATION", placeholder: "Number of bedrooms..." },
  { name: "bathrooms", label: "Bathrooms", type: "number", category: "PROPERTY INFORMATION", placeholder: "Number of bathrooms..." },
  { name: "propertyValue", label: "Property Value", type: "number", category: "PROPERTY INFORMATION", placeholder: "Estimated property value..." },
  { name: "character", label: "Character", type: "text", category: "OWNER PROFILE", placeholder: "Enter character..." },
  { name: "fico", label: "FICO", type: "number", category: "OWNER PROFILE", placeholder: "FICO score..." },
  { name: "income", label: "Income", type: "number", category: "OWNER PROFILE", placeholder: "Annual income..." },
  { name: "loanAmount", label: "L/A", type: "number", category: "OWNER PROFILE", placeholder: "Loan amount..." },
  { name: "rate", label: "Rate", type: "number", category: "OWNER PROFILE", placeholder: "Interest rate..." },
  { name: "pi", label: "PI", type: "number", category: "OWNER PROFILE", placeholder: "Principal & Interest..." },
  { name: "pt", label: "PT", type: "number", category: "OWNER PROFILE", placeholder: "Property Tax..." },
  { name: "debt", label: "Debt", type: "number", category: "OWNER PROFILE", placeholder: "Current debts..." },
  {
    name: "objective",
    label: "Objective",
    type: "checkbox",
    options: ["ADU", "JADU", "New Unit(s)", "Interior Remodeling", "Home Addition", "Repair", "Yard Improvement"],
    category: "OBJECTIVE",
  },
  {
    name: "cautiousNotes",
    label: "CAUTIOUS (easements, p.u.e, tree, slopes, illegal structures, nonconforming setbacks, existing main panel capacity, existing fire sprinklers)",
    type: "text",
    category: "NOTES",
    multiline: true,
    placeholder: "Notas sobre condiciones que deben ser tenidas en cuenta...",
  },
  { name: "finalScopeOfWork", label: "FINAL SCOPE OF WORK", type: "text", category: "NOTES", multiline: true, placeholder: "Notas sobre alcance final del trabajo..." },
  { name: "generalNotes", label: "GENERAL NOTES", type: "text", category: "NOTES", multiline: true, placeholder: "Notas generales..." },
];

const categories = [...new Set(formMeta.map((f) => f.category)), "FILES"];

export default function ClientForm() {
  /** === STATE === */
  const [formData, setFormData] = useState<any>({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [metadata, setMetadata] = useState<any>({});
  const [activeTab, setActiveTab] = useState("Basic Data");
  const [activeCategory, setActiveCategory] = useState("PROPERTY INFORMATION");

  // Loader / bloqueo global
  const [isLoading, setIsLoading] = useState(false);

  // Árbol de archivos
  const [tree, setTree] = useState<any[]>([]);

  // id de la URL
  const [searchParams] = useSearchParams();

  // === NUEVO HOOK id (según requerimiento) ===
  const [prospectId, setProspectId] = useState<string | null>(searchParams.get("id"));

  // Atajo para pasar a hijos (Dropzone / FileTree)
  const setBusy = useCallback((v: boolean) => setIsLoading(v), []);

  /** === HELPERS === */

  // Carga/recarga del árbol en base al id actual (o el id devuelto por el submit)
  const refreshTree = useCallback(
    async (submitResponse: any = null) => {
      try {
        // Si la respuesta del submit trae id, setearlo
        if (submitResponse?.id) {
          setProspectId(String(submitResponse.id));
          // opcionalmente inyectar también en formData
          setFormData((prev: any) => ({ ...prev, id: submitResponse.id }));
        }

        const currentId = submitResponse?.id || prospectId;
        if (!currentId) return;

        setIsLoading(true);
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/${currentId}`);
        const data = await res.json();
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

  /** === EFFECTS === */
  useEffect(() => {
    // Si hay id en URL (o ya seteado), buscar datos del prospecto
    const load = async () => {
      if (!prospectId) return;
      setIsLoading(true);
      try {
        const data = await getProspect(prospectId as string);
        // separa metadata del resto
        const { metadata: md, ...rest } = data || {};
        setMetadata(md || {});
        setFormData(rest || {});
      } catch (e) {
        console.error(e);
        alert("Error al cargar el cliente");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [prospectId]);

  useEffect(() => {
    // cada vez que cambie el id, refrescar árbol
    refreshTree();
  }, [prospectId, refreshTree]);

  /** === VALIDATIONS === */
  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.name?.trim()) newErrors["name"] = "First name is required";
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors["email"] = "Invalid email";
    if (formData.phone && !/^[\d\s\+\-\(\)]{10,15}$/.test(formData.phone)) newErrors["phone"] = "Invalid phone";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** === HANDLERS === */
  const handleStaticChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev: any) => ({ ...prev, [key]: undefined }));
  };

  const handleMetaChange = (key: string, value: any) => {
    setMetadata((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleChangeExtra = (key: string, value: any) => {
    setMetadata((prev: any) => {
      if (!value) delete prev.extra?.[key];
      return { ...prev, extra: { ...prev.extra, [key]: value } };
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const payload = { ...formData, metadata };
      // Crear o actualizar
      if (payload.id) {
        const updated = await updateProspect(payload.id, payload);
        // opcional: mantener consistencia
        await refreshTree(updated);
      } else {
        // postProspect devuelve los datos del cliente → destructurar id y setear en hook
        const created = await postProspect(payload);
        const { id: newId } = created || {};
        if (newId) {
          setProspectId(String(newId)); // <-- Hook id creado
          setFormData((prev: any) => ({ ...prev, id: newId }));
        }
        await refreshTree(created);
      }
      alert("Datos guardados correctamente ✔️");
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  /** === RENDER META FIELD === */
  const renderMetaField = (field: any) => {
    const value = metadata[field.name] ?? (field.type === "checkbox" ? [] : "");
    const extra = metadata.extra ?? {};

    if (field.type === "checkbox") {
      return field.options.map((item: any) => (
        <Checkbox
          key={item}
          className="m-4"
          note={extra[field.name + item]}
          onChange={(val: any, note: any) => {
            handleMetaChange(
              field.name,
              !val ? value.filter((v: string) => v !== item) : Array.from(new Set([...value, item]))
            );
            handleChangeExtra(field.name + item, val ? { context: item, value: note } : "");
          }}
          checked={value?.includes(item)}
          label={item}
          id={item}
          disabled={isLoading}
        />
      ));
    }

    return (
      <Input
        type={field.multiline ? "text" : field.type}
        placeholder={field.placeholder}
        value={value}
        onChange={(e: any) => handleMetaChange(field.name, e.target.value)}
        disabled={isLoading}
      />
    );
  };

  return (
    <div className="relative p-6" aria-busy={isLoading}>
      <PageMeta title="Client Form Web" description="Formulario de clientes con Tailwind + React" />
      <PageBreadcrumb pageTitle="Client Form" />

      {/* === LOADER OVERLAY === */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Procesando...</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex space-x-6 border-b">
        {["Basic Data", "Metadata", "Attachments"].map((tab) => (
          <button
            key={tab}
            onClick={() => !isLoading && setActiveTab(tab)}
            disabled={isLoading}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "border-b-2 border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-emerald-500"
            } ${isLoading ? "opacity-50" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "Basic Data" && (
        <div className={`grid gap-4 rounded-lg bg-white p-6 shadow sm:grid-cols-2 ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
          {[
            { key: "name", label: "First Name *" },
            { key: "lastName", label: "Last Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
            { key: "city", label: "City" },
            { key: "state", label: "State/Province" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <Input
                placeholder={`Enter ${label}`}
                value={formData[key] ?? ""}
                onChange={(e: any) => handleStaticChange(key, e.target.value)}
                disabled={isLoading}
              />
              {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === "Metadata" && (
        <div className={`rounded-lg bg-white p-6 shadow ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
          {/* Sub-tabs for metadata categories */}
          <div className="no-scrollbar mb-4 flex space-x-4 overflow-x-auto border-b">
            {categories
              .filter((c) => c !== "FILES")
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => !isLoading && setActiveCategory(cat)}
                  disabled={isLoading}
                  className={`mr-4 pb-2 ${
                    activeCategory === cat ? "border-b-2 border-emerald-500 text-emerald-500" : "border-transparent text-gray-500"
                  } ${isLoading ? "opacity-50" : ""}`}
                >
                  {cat}
                </button>
              ))}
          </div>

          {formMeta
            .filter((f) => f.category === activeCategory)
            .map((field) => (
              <div key={field.name} className="mb-4">
                <label className="mb-1 block text-sm font-medium">{field.label}</label>
                {renderMetaField(field)}
              </div>
            ))}
        </div>
      )}

      {activeTab === "Attachments" && (
        <div className={`rounded-lg bg-white p-6 shadow ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
          {/* === Pasamos setBusy al Dropzone para que active el loader durante uploads === */}
          <DropzoneComponent
            data={formData}
            mandatory="name"
            error={"You need to add at least a name"}
            afterSubmit={refreshTree}
            setBusy={setBusy} // <-- NUEVO
          />

          <FileTree
            nodes={tree}
            // En todas las acciones, activamos y desactivamos el loader
            onDelete={async (path) => {
              if (!confirm("¿Estás seguro que deseas eliminar este archivo?")) return;
              try {
                setIsLoading(true);
                await fetch(`${import.meta.env.VITE_SERVER_URL}/files/delete`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path }),
                });
                await refreshTree();
              } catch (e) {
                alert("Error al eliminar");
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
                alert("Error al mover");
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
                alert("Error al renombrar");
              } finally {
                setIsLoading(false);
              }
            }}
            onDownloadZip={async (path) => {
              try {
                setIsLoading(true);
                window.open(`${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(path)}`, "_blank");
              } finally {
                setIsLoading(false);
              }
            }}
            onShare={async (path, type) => {
              const email = prompt("¿Correo con quien compartir?");
              if (!email) return;
              try {
                setIsLoading(true);
                await fetch(`${import.meta.env.VITE_SERVER_URL}/share/send`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path, type: type.toUpperCase(), email }),
                });
                alert("Compartido ✔️");
              } catch (e) {
                alert("Error al compartir");
              } finally {
                setIsLoading(false);
              }
            }}
            getZipName={getZipName}
            // (Opcional) si el FileTree también puede mostrar su propio loading:
          />
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full rounded-md py-3 font-semibold text-white ${
            isLoading ? "bg-gray-500" : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {isLoading ? "Saving..." : formData.id ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}
