import React, { useEffect, useState, useRef } from "react";
import abruzzo from "../../assets/abruzzo.jpg";

const Sectionhome4 = () => {
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
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center  md:ml-16 moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-left text-black">
          TERRITORIO
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 text-left font-bold">
          Abbruzzo
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md text-center">
          L'Abruzzo, ricco di storia, tradizioni e paesaggi incontaminati, è il
          luogo ideale per la coltivazione dell'olivo. Il nostro olio nasce in
          un ambiente unico, con un clima mite, influenzato dal mare Adriatico e
          protetto dalle montagne. I terreni fertili e ricchi di minerali
          assicurano una produzione di altissima qualità. La nostra filosofia si
          basa sulla sostenibilità, utilizzando metodi agricoli rispettosi
          dell'ambiente e minimizzando l'uso di pesticidi. Ogni goccia del
          nostro olio racconta il legame con questa terra straordinaria.
        </p>
      </div>

      {/* Left Section - Single Image */}
      <div className="md:w-1/2 flex justify-center mt-6 md:mt-0 moving-paragraph">
        <div className="">
          <img
            src={abruzzo}
            alt="Piatto raffinato"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Sectionhome4;
