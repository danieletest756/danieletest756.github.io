import React, { useEffect, useState, useRef } from "react";
import storia from "../../assets/logo bianco.png";

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
    <div
      id="storia"
      className="bg-[#191919] flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white"
    >
      {/* Left Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start  moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-[#8b0000]">
          LA STORIA
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          YA&V PROJECT ENGINEERING
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md">
          Fondata nel 2016 dai fratelli Yuri Andrea e Veronica Piastra, YA&V
          Project Engineering srls si inserisce in una tradizione familiare che
          affonda le radici nel 1960, con tre generazioni di esperienza nel
          settore meccanico. L'azienda si distingue per la sua competenza nella
          progettazione e ingegneria, supportata da un team altamente
          specializzato e versatile.
        </p>
      </div>

      {/* Right Section - Single Image */}
      <div className="md:w-1/4 flex justify-center mt-6 md:mt-0  moving-paragraph">
        <div className="w-3/4">
          <img
            src={storia}
            alt="Piatto raffinato"
            className="w-full h-auto rounded-lg "
          />
        </div>
      </div>
    </div>
  );
};

export default Sectionhome1;
