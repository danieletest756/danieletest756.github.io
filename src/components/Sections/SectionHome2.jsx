import React, { useEffect, useState, useRef } from "react";
import bottiglia from "../../assets/fratelli.png";

const Sectionhome2 = () => {
  useEffect(() => {
    const elements = document.querySelectorAll(".moving-paragraph");

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

      elements.forEach((element) => observer.observe(element));

      return () => observer.disconnect();
    }
  }, []);
  return (
    <div className="bg-[#808473] flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-16 text-white">
      {/* Right Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-end md:ml-16 moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-left">CHI SIAMO</h1>
        <h2 className="italic text-lg md:text-xl mt-2 text-left">
         Tenute Colonico
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md text-left">
          La Tenuta Colonico è gestita con passione e dedizione da due fratelli,
          che da anni lavorano insieme per portare avanti la tradizione
          familiare nella produzione di olio d'oliva. Unendo esperienza, amore
          per la terra e impegno quotidiano, si occupano di ogni fase del
          processo, dalla coltivazione degli ulivi alla trasformazione delle
          olive, per offrire un olio di alta qualità che rappresenta il frutto
          del loro lavoro e della loro passione.
        </p>
      </div>

      {/* Left Section - Single Image */}
      <div className="md:w-1/4 flex justify-center mt-6 md:mt-0 moving-paragraph">
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

export default Sectionhome2;
