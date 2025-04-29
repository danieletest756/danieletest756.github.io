import React from "react";
import { motion } from "framer-motion";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import background from "../assets/background.jpg";
import image1 from "../assets/1.jpg";
import image2 from "../assets/2.jpg";
import image3 from "../assets/3.jpg";
import image4 from "../assets/4.jpg";
import chiSiamoImage from "../assets/background.jpg"; // Inserisci un'immagine elegante rappresentativa
import { Scissors, Palette, Sparkles } from "lucide-react"; // Usa icone eleganti opzionali
import logo from "../assets/logo.png";
const images = [
  {
    original: image1,
    thumbnail: image1,
  },
  {
    original: image2,
    thumbnail: image2,
  },
  {
    original: image3,
    thumbnail: image3,
  },
  {
    original: image4,
    thumbnail: image4,
  },
  {
    original: image1,
    thumbnail: image1,
  },
  {
    original: image2,
    thumbnail: image2,
  },
  {
    original: image3,
    thumbnail: image3,
  },
  {
    original: image4,
    thumbnail: image4,
  },
];

const HomePage = () => {
  return (
    <div className="font-sans text-gray-800">
      {/* HERO */}
      <section
        className="relative h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-center px-4">
          <motion.img
            src={logo}
            alt="Logo"
            className="w-24 md:w-32 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.h1
            className="text-white text-4xl md:text-6xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Benvenuti da Denise
          </motion.h1>
          <motion.p
            className="text-white text-lg md:text-xl mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            La tua bellezza, la nostra passione.
          </motion.p>
        </div>
      </section>

      {/* CHI SIAMO */}
      <section className="py-20 px-4 md:px-20 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Chi siamo</h2>
            <p className="text-lg leading-relaxed mb-4">
              Siamo un team appassionato di hairstylist con anni di esperienza.
              Offriamo servizi di taglio, colore e trattamenti per valorizzare
              ogni cliente con uno stile unico e raffinato, in un ambiente
              accogliente e moderno.
            </p>
            <div className="bg-yellow-100 p-4 rounded-lg text-gray-800">
              <h3 className="font-semibold text-lg mb-2">Orari di apertura</h3>
              <ul className="text-sm">
                <li>Lunedì: Chiuso</li>
                <li>Martedì - Venerdì: 9:00 - 19:00</li>
                <li>Sabato: 9:00 - 17:00</li>
                <li>Domenica: Chiuso</li>
              </ul>
            </div>
          </motion.div>
          <motion.img
            src={chiSiamoImage}
            alt="Chi siamo"
            className="rounded-2xl shadow-lg w-full object-cover h-[400px]"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          />
        </div>
      </section>
      {/* TEAM */}
      <section className="py-20 px-4 md:px-20 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-12">Il nostro team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            { name: "Denise", role: "Founder & Hairstylist", img: image1 },
            { name: "Martina", role: "Color Specialist", img: image2 },
            { name: "Alessia", role: "Event Stylist", img: image3 },
          ].map((member, i) => (
            <motion.div
              key={i}
              className="bg-white p-6 rounded-xl shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={member.img}
                alt={member.name}
                className="w-full h-60 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* SERVIZI */}
      <section className="py-20 px-4 md:px-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">I nostri servizi</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <Scissors className="mx-auto text-yellow-600 mb-4" size={40} />
            <h3 className="text-xl font-semibold mb-2">Taglio</h3>
            <p className="text-gray-600">
              Donna, uomo e bambino con stile e precisione.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <Palette className="mx-auto text-yellow-600 mb-4" size={40} />
            <h3 className="text-xl font-semibold mb-2">Colore</h3>
            <p className="text-gray-600">
              Colorazioni personalizzate, meches e balayage.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <Sparkles className="mx-auto text-yellow-600 mb-4" size={40} />
            <h3 className="text-xl font-semibold mb-2">Eventi</h3>
            <p className="text-gray-600">
              Acconciature da sogno per spose ed eventi speciali.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <Sparkles className="mx-auto text-yellow-600 mb-4" size={40} />
            <h3 className="text-xl font-semibold mb-2">Trattamenti</h3>
            <p className="text-gray-600">
              Rigeneranti, ristrutturanti e alla cheratina.
            </p>
          </motion.div>
        </div>
      </section>

      {/* GALLERIA */}
      <section className="py-20 px-4 md:px-20 bg-white text-center">
        <h2 className="text-3xl font-bold mb-8">Galleria</h2>
        <div className="max-w-4xl mx-auto">
          <ImageGallery items={images} showPlayButton={false} />
        </div>
      </section>

      {/* CONTATTI */}
      <section
        id="contatti"
        className="py-20 px-4 md:px-20 bg-gray-100 text-center"
      >
        <h2 className="text-3xl font-bold mb-12">Contattaci</h2>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 text-left">
          {/* Info contatto */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-semibold text-yellow-600 mb-4">
              Informazioni
            </h3>
            <p className="mb-2">
              📍 <span className="font-medium">Via Roma 123, Milano</span>
            </p>
            <p className="mb-2">
              📞{" "}
              <a
                href="tel:+39123456789"
                className="text-gray-700 hover:text-yellow-600 transition"
              >
                +39 123 456 789
              </a>
            </p>
            <p className="mb-2">
              📧{" "}
              <a
                href="mailto:info@glamourhair.it"
                className="text-gray-700 hover:text-yellow-600 transition"
              >
                info@glamourhair.it
              </a>
            </p>
            <p className="mt-4">
              📱 Seguici su{" "}
              <a href="#" className="text-yellow-600 hover:underline">
                Instagram
              </a>{" "}
              e{" "}
              <a href="#" className="text-yellow-600 hover:underline">
                Facebook
              </a>
            </p>
          </div>

          {/* Orari */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-semibold text-yellow-600 mb-4">
              Orari di apertura
            </h3>
            <ul className="text-gray-700 space-y-2">
              <li>
                <strong>Lunedì:</strong> Chiuso
              </li>
              <li>
                <strong>Martedì - Venerdì:</strong> 9:00 - 19:00
              </li>
              <li>
                <strong>Sabato:</strong> 9:00 - 17:00
              </li>
              <li>
                <strong>Domenica:</strong> Chiuso
              </li>
            </ul>
          </div>

          {/* Mappa */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <iframe
              title="Glamour Hair by Denise - Mappa"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2793.0624710746734!2d9.190498415877522!3d45.464203779100106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786c6a7e75959cb%3A0x123456789abcdef0!2sVia%20Roma%20123%2C%20Milano!5e0!3m2!1sit!2sit!4v1714412345678"
              width="100%"
              height="100%"
              className="w-full h-80 border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/39123456789"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg text-2xl z-50"
        target="_blank"
        rel="noopener noreferrer"
      >
        💬
      </a>
      <footer className="bg-black text-white py-10 px-4 md:px-20 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} Glamour Hair di Denise – Tutti i diritti
          riservati
        </p>
        <p className="text-sm mt-2">Sito realizzato con ❤️</p>
      </footer>
    </div>
  );
};

export default HomePage;
