import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Alert from "../../ui/alert/Alert";

type DropzoneProps = {
  data: any;
  mandatory: string;                // key required in data to enable the dropzone
  error: string;                    // message when mandatory is missing
  afterSubmit?: (resp?: any) => void | Promise<void>;
  setBusy?: (b: boolean) => void;

  /**
   * NEW: Ask parent for extra metadata BEFORE uploading.
   * Parent should open a modal and resolve with e.g. { type: string }.
   * If user cancels, this promise should reject.
   */
  getUploadMetadata?: (files: File[]) => Promise<{ type: string }>;
};

const DropzoneComponent: React.FC<DropzoneProps> = ({
  data,
  mandatory,
  error,
  afterSubmit,
  setBusy,
  getUploadMetadata,
}) => {
  /** Upload a single file with optional providedType (from modal) */
  const uploadFile = useCallback(
    async (file: File, providedType?: string) => {
      const formData = new FormData();
      formData.append("file", file);

      // Use the provided modal type if present; else infer a basic type
      const fallback =
        file.type?.startsWith("image")
          ? "image"
          : file.type?.startsWith("video")
          ? "video"
          : "file";

      formData.append("type", providedType || fallback);

      // Keep your existing payload contract
      formData.append("prospect", JSON.stringify(data));

      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Upload failed");
        throw new Error(msg || "Upload failed");
      }
      return res.json().catch(() => ({}));
    },
    [data]
  );

  /** onDrop handles multiple files as a batch */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) return;

      try {
        setBusy?.(true);

        // 1) Ask parent for metadata (opens modal there). Can throw if cancelled.
        const meta = await (getUploadMetadata ? getUploadMetadata(acceptedFiles) : Promise.resolve({ type: "" }));

        // 2) Upload all in parallel (or you can do sequential if your API prefers)
        const results = await Promise.allSettled(
          acceptedFiles.map((f) => uploadFile(f, meta?.type))
        );

        const rejected = results.filter((r) => r.status === "rejected");
        if (rejected.length) {
          console.error("Some uploads failed:", rejected);
          alert(`Some files failed to upload (${rejected.length}/${acceptedFiles.length}).`);
        } else {
          alert("All files uploaded successfully ✔️");
        }

        // 3) Notify parent to refresh
        await afterSubmit?.(results);
      } catch (err: any) {
        // If user cancelled the modal or any unexpected error
        console.error("Upload aborted or failed:", err);
        if (err?.message && !/cancel/i.test(String(err.message))) {
          alert("Error uploading files");
        }
      } finally {
        setBusy?.(false);
      }
    },
    [afterSubmit, getUploadMetadata, setBusy, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "*": [] }, // keep as you had - accepts any type
    noClick: true,       // we'll provide our own explicit "Browse" button
  });

  if (!data?.[mandatory]) {
    return (
      <Alert
        variant="info"
        title="Info"
        message={error}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Dropzone */}
      <div className="rounded-xl border border-dashed border-gray-300 transition hover:border-emerald-500">
        <form
          {...getRootProps()}
          className={`dropzone rounded-xl p-4 lg:p-10 ${
            isDragActive ? "bg-gray-100" : "bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="dz-message flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the files here…"
                : "Drag & drop files here"}
            </p>
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              title="Select files"
            >
              Browse files
            </button>
            <span className="text-xs text-gray-400">
              Any file type is allowed.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DropzoneComponent;
