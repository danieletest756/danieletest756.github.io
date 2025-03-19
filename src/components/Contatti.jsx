import React, { useState } from "react";
import emailjs from "emailjs-com";
import loading from "../assets/loading.gif"
import successo from "../assets/invio riuscito.png"
import fallito from "../assets/invio non riuscito.png"
const ContactForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || formData.message.length < 10) {
      setErrorMessage("Tutti i campi sono obbligatori e il messaggio deve avere almeno 10 caratteri.");
      return;
    }
    setStatus("sending");
    setErrorMessage("");

    //emailjs.send("your_service_id", "your_template_id", formData, "your_user_id")
    emailjs.send("service_ufn07wj", "template_oow4yfl", formData, "kUKFRip13HUcba4s_")
      .then(() => setStatus("success"))
      .catch(() => {
        setStatus("error");
        setErrorMessage("Errore nell'invio del messaggio. Riprova più tardi.");
      });
  };

  return (
    <div id="contatti" className="bg-[whitesmoke] text-center flex flex-col items-center justify-center p-6 w-full"><h1 className="text-4xl font-bold text-gray-800">CONTATTI</h1>
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between p-6">
        {/* Contatti */}
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-2xl font-bold text-gray-800">YA&V Project Engineering srls
          </h2>
          <p className="text-gray-700"><b>Email</b> - yav.project@gmail.com</p>
          <p className="text-gray-700"><b>Indirizzo</b>- Via Pretoro 15 , 00132 Roma</p>
          <p className="text-gray-600"><b>Ufficio</b> - 06 22 61 741</p>
          <p className="text-gray-600"><b>P.I./C.F. </b> - 13977941007</p>
        </div>

        {/* Stato della Form */}
        <div className="w-full md:w-1/2 p-6">
          {status === "idle"  ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">CONTATTACI</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Nome e Cognome"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <textarea
                  name="message"
                  placeholder="Messaggio (min. 10 caratteri)"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="4"
                />
                {errorMessage && <p className="text-red-600">{errorMessage}</p>}
                <button
                  type="submit"
                  className="w-full p-3 bg-[#D1A969] text-white font-semibold rounded-lg"
                  disabled={status === "sending"}
                >
                  Invia
                </button>
              </form>
            </>
          ) : status === "sending" ? (
            <div className="flex flex-col items-center">
              <p className="text-lg font-semibold text-gray-800">Invio in corso...</p>
              <img src={loading} alt="Invio in corso" className="w-26 h-16 mt-4" />
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center">
              <p className="text-lg font-semibold text-green-600">Messaggio inviato con successo!</p>
              <img src={successo} alt="Successo" className="w-16 h-16 mt-4" />
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center">
              <p className="text-lg text-center font-semibold text-red-600">Errore nell'invio. Riprova più tardi.</p>
              <img src={fallito} alt="Errore" className="w-16 h-16 mt-4" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;