import React, { useEffect, useState } from "react";
import logonero from "../../assets/logo bianco.png";
import logobianco from "../../assets/logo bianco.png";
import sfondo from "../../assets/background.jpg";
import { Menu, X } from "lucide-react"; // Icone per il menu

const Home = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 200);
  }, []);
  const handleScroll = (e, target) => {
    e.preventDefault();
    const section = document.querySelector(target);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative w-full h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${sfondo})` }}
    >
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full  bg-opacity-90  text-[white] px-6 md:px-10 py-4 z-50">
      <div className="flex justify-between items-center">
         {/* Menu Desktop */}
         <div className="hidden md:flex space-x-6 text-xl font-semibold">
          <a onClick={(e) => handleScroll(e, "#storia")} href="#storia" className="hover:text-gray-600 transition-colors">
            Storia
          </a>
          <a onClick={(e) => handleScroll(e, "#prodotto")} href="#prodotto" className="hover:text-gray-600 transition-colors">
            Prodotti
          </a>
          <a onClick={(e) => handleScroll(e, "#chi-siamo")} href="#chi-siamo" className="hover:text-gray-600 transition-colors">
            Team
          </a>
          <a onClick={(e) => handleScroll(e, "#contatti")} href="#contatti" className="hover:text-gray-600 transition-colors">
            Contatti
          </a>
        </div>
        {/* Logo */}
        <img src={logonero} alt="logo" className="w-14 md:w-18 filter drop-shadow-lg" />

       

        {/* Icona menu per Mobile */}
        <button className="md:hidden focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden flex flex-col text-[black] items-center mt-4 space-y-4 text-lg font-semibold bg-white p-4 rounded-lg shadow-lg">
          <a onClick={(e) => handleScroll(e, "#storia")} href="#storia" className="hover:text-gray-600 transition-colors">
            Storia
          </a>
          <a onClick={(e) => handleScroll(e, "#prodotto")} href="#prodotto" className="hover:text-gray-600 transition-colors">
            Prodotti
          </a>
          <a onClick={(e) => handleScroll(e, "#chi-siamo")} href="#chi-siamo" className="hover:text-gray-600 transition-colors">
            Team
          </a>
          <a onClick={(e) => handleScroll(e, "#contatti")} href="#contatti" className="hover:text-gray-600 transition-colors">
            Contatti
          </a>
        </div>
      )}
    </nav>

      {/* Contenuto Animato */}
      <div className="absolute w-full h-full flex flex-col items-center justify-center">
        <img
          src={logobianco}
          alt="Logo"
          className={`w-80 md:w-96 transition-transform duration-[2000ms] ${
            animate ? "translate-y-0" : "-translate-y-20 opacity-0"
          }`}
        />
        <p
          className={`text-white text-3xl md:text-5xl mt-10 transition-transform duration-[2000ms] ${
            animate ? "translate-y-0" : "translate-y-20 opacity-0"
          }`}
        >
          L'UNICO LIMITE, L'IMMAGINAZIONE
        </p>
      </div>
    </div>
  );
};

export default Home;
