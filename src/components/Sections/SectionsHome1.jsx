import React, { useEffect, useState, useRef } from "react";
import bottiglia from "../../assets/logonero completo.png";

const Sectionhome1 = () => {

    useEffect(() => {
        const elements = document.querySelectorAll(".moving-paragraph"); // Seleziona tutti gli elementi con la classe moving-paragraph
    
        // Verifica che ci siano elementi da osservare
        if (elements.length > 0) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("visible");
                } /*  else {
                  entry.target.classList.remove("visible");
                } */
              });
            },
            {
              threshold: 0.3, // La visibilità minima dell'elemento per attivare la transizione
            }
          );
    
          // Osserva ogni elemento con la classe 'moving-paragraph'
          elements.forEach((element) => observer.observe(element));
    
          // Cleanup dell'observer al momento dello smontaggio
          return () => observer.disconnect();
        }
      }, []); // Solo al primo render
  return (
    <div className="bg-[#808473] flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white">
      {/* Left Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start  moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold">LA STORIA</h1>
        <h2 className="italic text-lg md:text-xl mt-2">Tenute Colonico</h2>
        <p className="mt-4 text-sm md:text-base max-w-md">
          La Tenuta Colonico, situata in Abruzzo, è un'azienda agricola che da
          generazioni si dedica con passione alla coltivazione degli ulivi. Le
          olive vengono raccolte a mano e trasformate con metodi artigianali a
          freddo, producendo un olio d'oliva di alta qualità, dal sapore
          fruttato e delicato. Ogni bottiglia racchiude la tradizione, la cura e
          l'impegno che caratterizzano questa storica realtà, simbolo della
          bellezza e dei sapori autentici dell'Abruzzo.{" "}
        </p>
      </div>

      {/* Right Section - Single Image */}
      <div className="md:w-1/4 flex justify-center mt-6 md:mt-0  moving-paragraph">
        <div className="w-3/4">
          <img
            src={bottiglia}
            alt="Piatto raffinato"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Sectionhome1;
