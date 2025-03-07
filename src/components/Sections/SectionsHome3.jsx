import React, { useEffect, useState, useRef } from "react";
import bottiglia from "../../assets/bottiglia123.png";

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
    <div id="prodotto" className="bg-[#808473] flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white">
      {/* Left Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start  moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-black">IL PRODOTTO</h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
        Produzione e Qualità
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md">
          Il nostro olio extravergine d’oliva nasce da un processo che unisce
          tradizione e innovazione per garantire eccellenza. Le olive, raccolte
          con cura, vengono frante entro poche ore con estrazione a freddo per
          preservarne sapore e proprietà. Ogni fase, dalla selezione alla
          filtrazione, segue rigorosi standard qualitativi. L’olio viene
          conservato a temperatura controllata e imbottigliato per mantenere
          freschezza e autenticità, offrendo un prodotto puro e ricco di
          benefici.ravergine d’oliva puro, autentico e ricco di benefici per la
          salute.
        </p>
      </div>

      {/* Right Section - Single Image */}
      <div className="flex justify-center mt-6 md:mt-0 moving-paragraph">
  <div className="w-3/4 flex justify-center"> {/* Aggiunto flex + justify-center */}
    <img
      src={bottiglia}
      alt="Piatto raffinato"
      className="w-[20vh] h-auto rounded-lg mx-auto"
    />
  </div>
</div>

    </div>
  );
};

export default Sectionhome1;
