import React, { useState } from "react";
import emailjs from "emailjs-com";
import logo from "../assets/logo nero.png"
const ContactDetails = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    description: "",
  });
  const [status, setStatus] = useState(""); // "sending", "success", "error"
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validazione dei campi
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.description) {
      setErrorMessage("Tutti i campi sono obbligatori.");
      return;
    }

    setStatus("sending");
    emailjs
      .send("your_service_id", "your_template_id", formData, "your_user_id")
      .then(
        (response) => {
          setStatus("success");
          setErrorMessage(""); // Resetta eventuali errori
        },
        (error) => {
          setStatus("error");
          setErrorMessage("Errore nell'invio del messaggio. Riprova più tardi.");
        }
      );
  };

  return (
    <div  id="contatti" className="bg-[#808473] min-h-screen flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 md:w-[70%] mx-auto max-w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Dettagli dei Contatti</h2>
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Tenute Colonico Srl</h3>
            {/* <p className="text-gray-600">Tenute Colonico</p> */}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Email</h3>
            <p className="text-gray-600">info@tenutecolonico.it</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Indirizzo</h3>
            <p className="text-gray-600">Via Giuseppe de Blasiis, 1 67039 Sulmona AQ</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Recapiti Telefonici</h3>
            <div className="flex flex-col space-y-2">
              <p className="text-gray-600">Mario Colonico - 347 1037125</p>
              <p className="text-gray-600">Alessandro Colonico - 392 5718098</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Sito Web</h3>
            <a href="https://www.tenutecolonico.it" className="text-blue-500 hover:underline">
              www.tenutecolonico.it
            </a>
          </div>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Grazie per averci contattato!</h2>
            <img
              src={logo} // Sostituisci con l'immagine che preferisci
              alt="Thank You"
              className="mx-auto mb-4"
            />
            <p className="text-gray-600">Il tuo messaggio è stato inviato con successo. Ti risponderemo il prima possibile.</p>
          </div>
        ) : status === "error" ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ops, c'è stato un errore!</h2>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Oppure Contattaci</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="text-xl font-semibold text-gray-700">Nome</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-xl font-semibold text-gray-700">Cognome</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-xl font-semibold text-gray-700">Recapito Telefonico</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-xl font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="description" className="text-xl font-semibold text-gray-700">Descrizione</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              {errorMessage && <p className="text-red-600">{errorMessage}</p>}

              <button
                type="submit"
                className="w-full p-3 bg-blue-500 text-white font-semibold rounded-lg"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Invio in corso..." : "Invia Messaggio"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetails;
