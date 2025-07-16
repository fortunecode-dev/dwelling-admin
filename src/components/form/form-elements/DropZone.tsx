import { useDropzone } from "react-dropzone";
import ComponentCard from "../../common/ComponentCard";
import { useRef, useState } from "react";
import Alert from "../../ui/alert/Alert";

const DropzoneComponent: React.FC<any> = ({data,mandatory,error,afterSubmit}:{data:any,mandatory:string,error:string,afterSubmit:any}) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

 const onDrop = (acceptedFiles: File[]) => {
  console.log("Archivos recibidos:", acceptedFiles);
  acceptedFiles.forEach(uploadFile);
};

const uploadFile = async (file: File) => {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const recorder = new MediaRecorder(stream);
      setRecordedChunks([]);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const file = new File([blob], `recorded-${Date.now()}.webm`, { type: "video/webm" });
        onDrop([file]); // Reutilizamos la lógica de subida
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("No se pudo acceder a la cámara:", err);
      alert("Permiso denegado o error al acceder a la cámara.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  return (
    <ComponentCard title="Dropzone & Cámara" >
     {data?.[mandatory]?<div className="flex flex-col gap-6">
        {/* Dropzone */}
        <div className="transition border border-dashed border-gray-300 cursor-pointer rounded-xl hover:border-brand-500">
          <form
            {...getRootProps()}
            className={`dropzone rounded-xl p-7 lg:p-10 ${
              isDragActive
                ? "border-brand-500 bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="dz-message flex flex-col items-center text-center">
              <h4 className="mb-3 font-semibold text-gray-800">
                {isDragActive ? "Suelta los archivos aquí" : "Arrastra imágenes o videos"}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                JPG, PNG, WebP, MP4, WebM o graba directamente desde tu cámara.
              </p>
              <span className="underline text-brand-500 font-medium">
                Buscar archivo
              </span>
            

            </div>
          </form>
        </div>

        {/* Cámara y grabación */}
        <div className="flex flex-col items-center">
          <video ref={videoRef} autoPlay muted className="w-full max-w-md rounded mb-3" />
          {!recording ? (
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              🎥 Empezar a Grabar
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ⏹️ Detener Grabación
            </button>
          )}
        </div>
      </div>:<Alert
            variant="info"
            title="Info"
            message={error}
           
          />} 
    </ComponentCard>
  );
};

export default DropzoneComponent;
