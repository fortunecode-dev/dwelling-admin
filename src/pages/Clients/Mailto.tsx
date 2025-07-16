import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { postAnswer } from "../../services/contact.service";

export default function MailTo() {
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get("mail") || "";

  const [email, setEmail] = useState(emailFromParams);
  const [answer, setAnswer] = useState("");

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    try {
      await postAnswer({ email, answer });
      alert("Respuesta enviada exitosamente!");
      setAnswer("");
    } catch (error) {
      console.error("Error enviando la respuesta:", error);
      alert("Ocurrió un error al enviar la respuesta.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageMeta title="Send Mail" description="Contact with a client" />
      <PageBreadcrumb pageTitle="Client Form" />

      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow mt-8">
        <h2 className="text-2xl font-bold mb-4">Responder al Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Correo electrónico:</label>
            <input
              type="email"
              className="w-full border border-gray-300 p-3 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Tu respuesta:</label>
            <textarea
              className="w-full border border-gray-300 p-3 rounded h-32 resize-none"
              placeholder="Escribe tu respuesta aquí..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Enviar Respuesta
          </button>
        </form>
      </div>
    </div>
  );
}
