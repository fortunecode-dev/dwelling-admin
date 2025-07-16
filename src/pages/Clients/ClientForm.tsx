import { useState, useEffect, useCallback } from "react";
import DropzoneComponent from "../../components/form/form-elements/DropZone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import { getProspect, postProspect, updateProspect } from "../../services/prospects.service";
import { useSearchParams } from "react-router";
import FileTree from "./components/FileTree";
const formMeta = [
    {
        name: "propertyAddress",
        label: "Property Address",
        type: "text",
        category: "PROPERTY INFORMATION",
        multiline: true,
        placeholder: "Enter full property address...",
    },
    {
        name: "city",
        label: "City",
        type: "text",
        category: "PROPERTY INFORMATION",
        placeholder: "Enter city name...",
    },
    {
        name: "zoning",
        label: "Zoning",
        type: "text",
        category: "PROPERTY INFORMATION",
        placeholder: "Enter zoning info...",
    },
    {
        name: "lotArea",
        label: "Lot Area",
        type: "number",
        category: "PROPERTY INFORMATION",
        placeholder: "Enter lot area in sqft...",
    },
    {
        name: "houseType",
        label: "House Type",
        type: "text",
        category: "PROPERTY INFORMATION",
        placeholder: "Enter house type...",
    },
    {
        name: "ownerOccupation",
        label: "Owner Occupation",
        type: "text",
        category: "PROPERTY INFORMATION",
        placeholder: "Enter owner occupation...",
    },
    {
        name: "buildingArea",
        label: "Building Area",
        type: "number",
        category: "PROPERTY INFORMATION",
        placeholder: "Enter building area in sqft...",
    },
    {
        name: "units",
        label: "# Units",
        type: "number",
        category: "PROPERTY INFORMATION",
        placeholder: "Number of units...",
    },
    {
        name: "bedrooms",
        label: "Bedrooms",
        type: "number",
        category: "PROPERTY INFORMATION",
        placeholder: "Number of bedrooms...",
    },
    {
        name: "bathrooms",
        label: "Bathrooms",
        type: "number",
        category: "PROPERTY INFORMATION",
        placeholder: "Number of bathrooms...",
    },
    {
        name: "propertyValue",
        label: "Property Value",
        type: "number",
        category: "PROPERTY INFORMATION",
        placeholder: "Estimated property value...",
    },
    {
        name: "character",
        label: "Character",
        type: "text",
        category: "OWNER PROFILE",
        placeholder: "Enter character...",
    },
    {
        name: "fico",
        label: "FICO",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "FICO score...",
    },
    {
        name: "income",
        label: "Income",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "Annual income...",
    },
    {
        name: "loanAmount",
        label: "L/A",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "Loan amount...",
    },
    {
        name: "rate",
        label: "Rate",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "Interest rate...",
    },
    {
        name: "pi",
        label: "PI",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "Principal & Interest...",
    },
    {
        name: "pt",
        label: "PT",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "Property Tax...",
    },
    {
        name: "debt",
        label: "Debt",
        type: "number",
        category: "OWNER PROFILE",
        placeholder: "Current debts...",
    },
    {
        name: "objective",
        label: "Objective",
        type: "checkbox",
        options: [
            "ADU",
            "JADU",
            "New Unit(s)",
            "Interior Remodeling",
            "Home Addition",
            "Repair",
            "Yard Improvement",
        ],
        category: "OBJECTIVE",
    },
    {
        name: "cautiousNotes",
        label:
            "CAUTIOUS (easements, p.u.e, tree, slopes, illegal structures, nonconforming setbacks, existing main panel capacity, existing fire sprinklers)",
        type: "text",
        category: "NOTES",
        multiline: true,
        placeholder: "Notas sobre condiciones que deben ser tenidas en cuenta...",
    },
    {
        name: "finalScopeOfWork",
        label: "FINAL SCOPE OF WORK",
        type: "text",
        category: "NOTES",
        multiline: true,
        placeholder: "Notas sobre alcance final del trabajo...",
    },
    {
        name: "generalNotes",
        label: "GENERAL NOTES",
        type: "text",
        category: "NOTES",
        multiline: true,
        placeholder: "Notas generales...",
    },
];

const categories = [...new Set(formMeta.map(f => f.category)), "FILES"];



export default function ClientForm() {
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

    const [isLoading, setIsLoading] = useState(false);
    const [tree, setTree] = useState([]);
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const refreshTree = useCallback((submitResponse: any = null) => {
        console.log("submitResponse", submitResponse)
        if (submitResponse?.id) {
            setFormData((prev: any) => {
                prev.id = submitResponse?.id
                return prev
            })
        }
        if (id || submitResponse?.id) {
            fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/${id || submitResponse?.id}`)
                .then((res) => res.json())
                .then(setTree)
                .catch(() => alert("Error al cargar árbol de archivos"));
        }
    }, [id]);
   
    useEffect(() => {
        if (id)
            getProspect(id as string).then((data) => {
                setMetadata(data.metadata)
                delete data.metadata
                setFormData(data)
            })
        refreshTree()
    }, [id])

    const handleStaticChange = (key: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev: any) => ({ ...prev, [key]: undefined }));
        }
    };

    const handleMetaChange = (key: string, value: any) => {
        setMetadata((prev: any) => ({ ...prev, [key]: value }));
    };
    const handleChangeExtra = (key: string, value: any) => {
        setMetadata((prev: any) => {
            if (!value) delete prev.extra?.[key]
            return { ...prev, extra: { ...prev.extra, [key]: value } }
        });
    };


    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.name.trim()) newErrors["name"] = "First name is required";
        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors["email"] = "Invalid email";
        if (formData.phone && !/^[\d\s\+\-\(\)]{10,15}$/.test(formData.phone)) newErrors["phone"] = "Invalid phone";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsLoading(true);

        try {
            const payload = { ...formData, metadata };
            console.log("Submitting:", payload);
            if(payload.id) updateProspect(payload.id,payload)
            else postProspect(payload)
            alert("Formulario enviado (simulado)");
        } catch (err) {
            console.error(err);
            alert("Error al enviar");
        } finally {
            setIsLoading(false);
        }
    };

    const renderMetaField = (field: any) => {
        const value = metadata[field.name] ?? (field.type === "checkbox" ? [] : "");
        const extra = metadata.extra ?? {};

        if (field.type === "checkbox") {
            return (field.options.map((item: any) =>
                <Checkbox
                    className="m-4"
                    note={extra[field.name + item]}
                    onChange={(val: any, note: any) => {
                        handleMetaChange(field.name, !val ? value.filter((itemFilter: string) => itemFilter !== item) : Array.from(new Set([...value, item])))
                        handleChangeExtra(field.name + item, val ? {context:item,value:note} : "")
                    }}
                    checked={value?.includes(item)}
                    label={item}
                    id={item} />)
            );
        }

        if (field.multiline) {
            return (
                <Input
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e: any) => handleMetaChange(field.name, e.target.value)}
                />
            );
        }

        return (
            <Input
                type={field.type}
                placeholder={field.placeholder}
                value={value}
                onChange={(e: any) => handleMetaChange(field.name, e.target.value)}
            />
        );
    };

    return (
        <div className="p-6">
            <PageMeta title="Client Form Web" description="Formulario de clientes con Tailwind + React" />
            <PageBreadcrumb pageTitle="Client Form" />

            {/* Tabs */}
            <div className="flex border-b mb-6 space-x-6">
                {["Basic Data", "Metadata", "Attachments"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-emerald-500"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            {activeTab === "Basic Data" && (
                <div className="bg-white rounded-lg p-6 shadow grid gap-4 sm:grid-cols-2">
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
                            <label className="block text-sm font-medium mb-1">{label}</label>
                            <Input
                                placeholder={`Enter ${label}`}
                                value={formData[key]}
                                onChange={(e: any) => handleStaticChange(key, e.target.value)}
                            />
                            {errors[key] && (
                                <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "Metadata" && (
                <div className="bg-white rounded-lg p-6 shadow">
                    {/* Sub-tabs for metadata categories */}
                    <div className="flex overflow-x-auto border-b mb-4 no-scrollbar space-x-4">
                        {categories.filter((c) => c !== "FILES").map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`mr-4 pb-2 border-b-2 ${activeCategory === cat
                                    ? "border-emerald-500 text-emerald-500"
                                    : "border-transparent text-gray-500"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}

                    </div>

                    {formMeta
                        .filter((f) => f.category === activeCategory)
                        .map((field) => (
                            <div key={field.name} className="mb-4">
                                <label className="block text-sm font-medium mb-1">{field.label}</label>
                                {renderMetaField(field)}
                            </div>
                        ))}
                </div>
            )}

            {activeTab === "Attachments" && (
                <div className="bg-white rounded-lg p-6 shadow">
                    <DropzoneComponent data={formData} mandatory="name" error={"You need to add at least a name"} afterSubmit={refreshTree} />
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
            )}

            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-md text-white font-semibold ${isLoading ? "bg-gray-500" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                >
                    {isLoading ? "Saving..." : formData.id ? "Update" : "Create"}
                </button>
            </div>
        </div>
    );

}
