import { useState, useEffect, useCallback, useRef } from "react";
import DropzoneComponent from "../../components/form/form-elements/DropZone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import { getProspect, postAnswerQuestion, postProspect, updateProspect } from "../../services/prospects.service";
import { useSearchParams } from "react-router";
import FileTree from "./components/FileTree";
import { getZipName, prospectNameFallback } from "../../utils/prospects-parsing";

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
    placeholder: "Notes about conditions to consider...",
  },
  { name: "finalScopeOfWork", label: "FINAL SCOPE OF WORK", type: "text", category: "NOTES", multiline: true, placeholder: "Notes about final scope..." },
  { name: "generalNotes", label: "GENERAL NOTES", type: "text", category: "NOTES", multiline: true, placeholder: "General notes..." },
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

  // Global loader / blocker
  const [isLoading, setIsLoading] = useState(false);

  // File tree state
  const [tree, setTree] = useState<any[]>([]);

  // URL id
  const [searchParams] = useSearchParams();

  // Prospect id
  const [prospectId, setProspectId] = useState<string | null>(searchParams.get("id"));

  // Expose to Dropzone / FileTree
  const setBusy = useCallback((v: boolean) => setIsLoading(v), []);

  /** Questions modal state */
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string>("");

  /** === NEW: Upload Type modal state === */
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [uploadTypeText, setUploadTypeText] = useState("");
  // Promise resolver to return metadata to Dropzone
  const pendingResolverRef = useRef<{ resolve: (meta: { type: string }) => void; reject: (err?: any) => void } | null>(null);

  /** === HELPERS === */
  const refreshTree = useCallback(
    async (submitResponse: any = null) => {
      try {
        if (submitResponse?.id) {
          setProspectId(String(submitResponse.id));
          setFormData((prev: any) => ({ ...prev, id: submitResponse.id }));
        }

        const currentId = submitResponse?.id || prospectId;
        if (!currentId) return;

        setIsLoading(true);
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/tree/${currentId}`);
        if (!res.ok) throw new Error("Failed fetching file tree");
        const data = await res.json();
        setTree(Array.isArray(data) ? data : []);
      } catch (e) {
        alert("Error loading file tree");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [prospectId]
  );

  const openAnswerModal = useCallback(
    (qId: string) => {
      setActiveQuestionId(qId);
      const current = (metadata?.question?.[qId] as any) || {};
      setAnswerText(current?.answer ?? "");
      setShowAnswerModal(true);
    },
    [metadata]
  );

  const handleSendAnswer = useCallback(async () => {
    if (!activeQuestionId) return;
    if (!answerText.trim()) {
      alert("Answer cannot be empty.");
      return;
    }

    try {
      setIsLoading(true);
      await postAnswerQuestion(activeQuestionId, formData.email, answerText);

      const prevQ = { ...(metadata?.question || {}) };
      const prevItem = { ...(prevQ[activeQuestionId] || {}) };
      const nextQ = {
        ...prevQ,
        [activeQuestionId]: { ...prevItem, answer: answerText.trim() },
      };
      const nextMetadata = { ...(metadata || {}), question: nextQ };

      setMetadata(nextMetadata);
      setShowAnswerModal(false);
      setActiveQuestionId(null);
      setAnswerText("");
      alert("Answer saved ✔️");
    } catch (e) {
      console.error(e);
      alert("Error saving answer");
    } finally {
      setIsLoading(false);
    }
  }, [activeQuestionId, answerText, formData, metadata]);

  /** === TYPE MODAL: called by Dropzone before uploading === */
  const getUploadMetadata = useCallback(async (_files: File[]) => {
    // open modal and wait for user input
    setUploadTypeText("");
    setShowTypeModal(true);

    return new Promise<{ type: string }>((resolve, reject) => {
      pendingResolverRef.current = { resolve, reject };
    });
  }, []);

  const confirmUploadType = useCallback(() => {
    const type = uploadTypeText.trim();
    if (!type) {
      alert("Please enter a file type.");
      return;
    }
    const resolver = pendingResolverRef.current;
    pendingResolverRef.current = null;
    setShowTypeModal(false);
    resolver?.resolve({ type });
  }, [uploadTypeText]);

  const cancelUploadType = useCallback(() => {
    const resolver = pendingResolverRef.current;
    pendingResolverRef.current = null;
    setShowTypeModal(false);
    resolver?.reject(new Error("User cancelled upload type input"));
  }, []);

  /** === EFFECTS === */
  useEffect(() => {
    const load = async () => {
      if (!prospectId) return;
      setIsLoading(true);
      try {
        const data = await getProspect(prospectId as string);
        const { metadata: md, ...rest } = data || {};
        setMetadata(md || {});
        setFormData(rest || {});
      } catch (e) {
        console.error(e);
        alert("Error loading client");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [prospectId]);

  useEffect(() => {
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
      if (payload.id) {
        const updated = await updateProspect(payload.id, payload);
        await refreshTree(updated);
      } else {
        const created = await postProspect(payload);
        const { id: newId } = created || {};
        if (newId) {
          setProspectId(String(newId));
          setFormData((prev: any) => ({ ...prev, id: newId }));
        }
        await refreshTree(created);
      }
      alert("Saved ✔️");
    } catch (err) {
      console.error(err);
      alert("Error saving");
    } finally {
      setIsLoading(false);
    }
  };

  /** === RENDER HELPERS === */
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

  const renderQuestionsTab = () => {
    const entries = Object.entries(metadata?.question || {});
    if (!entries.length) {
      return (
        <div className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow">
          No questions to show.
        </div>
      );
    }

    entries.sort((a: any, b: any) => {
      const an = Number(a[0]); const bn = Number(b[0]);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return bn - an;
      return String(b[0]).localeCompare(String(a[0]));
    });

    return (
      <div className={`space-y-4 ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
        {entries.map(([qid, payload]: any) => {
          const q = payload?.question ?? "";
          const ans = payload?.answer ?? "";
          const dateHint =
            !Number.isNaN(Number(qid)) && Number(qid) > 1000000000000
              ? new Date(Number(qid)).toLocaleString()
              : `ID: ${qid}`;

          return (
            <div key={qid} className="rounded-lg bg-white p-5 shadow">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">{dateHint}</div>
                <div className="text-[11px] uppercase tracking-wide text-emerald-600">Question</div>
              </div>

              <p className="mb-3 text-sm font-medium text-gray-800">{q || <em className="text-gray-500">[Empty]</em>}</p>

              {ans ? (
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase text-emerald-700">Answer</div>
                  <p className="whitespace-pre-wrap text-sm text-emerald-900">{ans}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">No answer yet</span>
                  <button
                    type="button"
                    onClick={() => openAnswerModal(qid)}
                    disabled={isLoading}
                    className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Answer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative p-6" aria-busy={isLoading}>
      <PageMeta title="Client Form Web" description="Client form with attachments" />
      <PageBreadcrumb pageTitle="Client Form" />

      {/* === GLOBAL LOADER OVERLAY === */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Processing…</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex space-x-6 border-b">
        {["Basic Data", "Metadata", "Attachments", "Questions & Messages"].map((tab) => (
          <button
            key={tab}
            onClick={() => !isLoading && setActiveTab(tab)}
            disabled={isLoading}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-emerald-500"
              } ${isLoading ? "opacity-50" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Basic Data */}
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

      {/* Metadata */}
      {activeTab === "Metadata" && (
        <div className={`rounded-lg bg-white p-6 shadow ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
          <div className="no-scrollbar mb-4 flex space-x-4 overflow-x-auto border-b">
            {categories
              .filter((c) => c !== "FILES")
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => !isLoading && setActiveCategory(cat)}
                  disabled={isLoading}
                  className={`mr-4 pb-2 ${activeCategory === cat ? "border-b-2 border-emerald-500 text-emerald-500" : "border-transparent text-gray-500"
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

      {/* Attachments */}
      {activeTab === "Attachments" && (
        <div className={`rounded-lg bg-white p-6 shadow ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
          {/* Dropzone: pass setBusy + getUploadMetadata so it prompts for 'type' before uploading */}
          <DropzoneComponent
            data={formData}
            mandatory="name"
            error={"You need to add at least a name"}
            afterSubmit={refreshTree}
            setBusy={setBusy}
            /** NEW: before uploading, ask for a 'type' via modal and return it */
            getUploadMetadata={getUploadMetadata}
          />

          {/* Empty state if no files */}
          {(!tree || tree.length === 0) && !isLoading ? (
            <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-base font-medium text-gray-700">No attachments yet</p>
              <p className="mt-1 text-sm text-gray-500">Upload files to see them listed here.</p>
            </div>
          ) : (
            <FileTree
              nodes={tree}
              /** Disable actions while global loading */
              isBusy={isLoading}
              /** Allow internal operations (if any) in FileTree to toggle loader */
              onBusyChange={setBusy}
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
                } catch {
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
                } catch {
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
                } catch {
                  alert("Error renaming");
                } finally {
                  setIsLoading(false);
                }
              }}
              onDownloadZip={async (path, name) => {
                try {
                  setIsLoading(true);
                  const url = `${import.meta.env.VITE_SERVER_URL}/files/zip?folder=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}&expires=120`;
                  const splitPath = path.split("/")
                  const res = await fetch(url);
                  if (!res.ok) throw new Error(`Fallo: ${res.status}`);
                  const blob = await res.blob();
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${prospectNameFallback(formData as never)}(${splitPath.length == 3 ? "file - " + splitPath[2] : splitPath[1]}).zip`;
                  document.body.appendChild(a);
                  a.click();
                  URL.revokeObjectURL(a.href);
                  a.remove();
                } catch {
                  alert("Error downloading ZIP");
                } finally {
                  setIsLoading(false);
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
                } catch {
                  alert("Error sharing");
                } finally {
                  setIsLoading(false);
                }
              }}
              getZipName={getZipName}
            />
          )}
        </div>
      )}

      {/* Questions & Messages */}
      {activeTab === "Questions & Messages" && (
        <div className="rounded-lg bg-white p-6 shadow">{renderQuestionsTab()}</div>
      )}

      {/* Save button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full rounded-md py-3 font-semibold text-white ${isLoading ? "bg-gray-500" : "bg-emerald-500 hover:bg-emerald-600"
            }`}
        >
          {isLoading ? "Saving..." : formData.id ? "Update" : "Create"}
        </button>
      </div>

      {/* === ANSWER MODAL === */}
      {showAnswerModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
            <button
              type="button"
              onClick={() => setShowAnswerModal(false)}
              className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="mb-4 text-center text-lg font-bold text-gray-800">Answer question</h3>

            <div className="mb-3 rounded-md border bg-gray-50 p-3">
              <div className="mb-1 text-[11px] font-semibold uppercase text-gray-600">Question</div>
              <p className="whitespace-pre-wrap text-sm text-gray-800">
                {activeQuestionId ? metadata?.question?.[activeQuestionId]?.question : ""}
              </p>
            </div>

            <label className="mb-1 block text-sm font-medium text-gray-700">Your answer</label>
            <textarea
              className="h-40 w-full resize-none rounded-md border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              disabled={isLoading}
              placeholder="Type your answer..."
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAnswerModal(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAnswer}
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                disabled={isLoading}
              >
                Send answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === NEW: FILE TYPE MODAL (before uploads) === */}
      {showTypeModal && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <button
              type="button"
              onClick={cancelUploadType}
              className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
              aria-label="Close"
              title="Cancel"
            >
              ✕
            </button>

            <h3 className="mb-4 text-center text-lg font-bold text-gray-800">
              Specify file type
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              Please select the category of files you are uploading.
            </p>

            <select
              value={uploadTypeText}
              onChange={(e) => setUploadTypeText(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            >
              <option value="">Select a type...</option>
              <option value="photos">Photos</option>
              <option value="videos">Videos</option>
              <option value="blueprints">Blueprints</option>
              <option value="documents/forms">Documents/Forms</option>
            </select>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelUploadType}
                className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUploadType}
                disabled={!uploadTypeText}
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
