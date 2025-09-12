import { useDropzone } from "react-dropzone";
import Alert from "../../ui/alert/Alert";

const DropzoneComponent: React.FC<any> = ({data,mandatory,error,afterSubmit,setBusy}:{setBusy:any,data:any,mandatory:string,error:string,afterSubmit:any}) => {
 const onDrop = (acceptedFiles: File[]) => {
  console.log("Archivos recibidos:", acceptedFiles);
  acceptedFiles.forEach(uploadFile);
};

const uploadFile = async (file: File) => {
  setBusy(true)
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type.startsWith("image") ? "image" : "video");
  formData.append("prospect", JSON.stringify(data)); // remplazar dinámicamente

  try {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/files/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log("✅ Archivo subido:", data);
    afterSubmit(data)
    alert("Archivo subido correctamente");
  } catch (err) {
    console.error("Error al subir archivo:", err);
    alert("Error al subir archivo");
  }
};

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "*": [],
    },
  });

  return (
    
     data?.[mandatory]?<div className="flex flex-col gap-6">
        {/* Dropzone */}
        <div className="transition border border-dashed border-gray-300 cursor-pointer rounded-xl hover:border-brand-500">
          <form
            {...getRootProps()}
            className={`dropzone rounded-xl p-2 lg:p-10 ${
              isDragActive
                ? "border-brand-500 bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="dz-message flex flex-col items-center text-center">
              <span className="underline text-brand-500 font-medium">
                Buscar archivo  o arrástralo aquí
              </span>
            </div>
          </form>
        </div>

        {/* Cámara y grabación */}
       
      </div>:<Alert
            variant="info"
            title="Info"
            message={error}
           
          />
  );
};

export default DropzoneComponent;
