import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import carosello1 from "../../assets/immagini lavorazioni/iconaprogettazione.jpg";
import carosello2 from "../../assets/immagini lavorazioni/iconariparazione.jpg";
import carosello3 from "../../assets/immagini lavorazioni/iconamanutenzione.jpg";

const images = [carosello1, carosello2, carosello3];
const imageTexts = [
  "Progettazione", // Testo per la prima immagine
  "Riparazione", // Testo per la seconda immagine
  "Manutenzione", // Testo per la terza immagine
];

const Sectionhome1 = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const elements = document.querySelectorAll(".moving-paragraph");
    if (elements.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            }
          });
        },
        { threshold: 0.3 }
      );
      elements.forEach((element) => observer.observe(element));
      return () => observer.disconnect();
    }
  }, []);

  const sliderRef = useRef(null);
  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    beforeChange: (current, next) => setActiveIndex(next), // Aggiorna l'indice attivo
  };

  return (
    <div className="bg-[#191919] flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white">
      {/* Left Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-[#8b0000]">
          I NOSTRI SERVIZI
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Produzione e Qualità
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md">
          <strong>Progettazione:</strong> Unione di competenze di Architetto e
          Ingegnere Meccanico per trasformare le tue idee in soluzioni concrete.
          Offriamo anche manutenzione per macchinari e impianti, garantendo
          efficienza in vari settori.
          <br />
          <strong>Riparazione:</strong> Specializzati nella riparazione di
          componenti meccanici e plastici con lavorazione CNC. Offriamo anche
          trofei e medaglie personalizzate per eventi sportivi e culturali.
          <br />
          <strong>Manutenzione:</strong> Servizi di manutenzione preventiva e
          correttiva per garantire l'efficienza e la longevità di macchinari e
          impianti.
          <br />
          Con <strong>YA&V Project Engineering srls</strong>, ogni servizio è
          realizzato con passione e competenza.
        </p>
      </div>

      {/* Right Section - Carousel */}
      <div className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0 moving-paragraph">
        <Slider {...settings} ref={sliderRef} className="w-[30vh] md:w-[40vh]">
          {images.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <p>{imageTexts[activeIndex]}</p> {/* Mostra il testo basato sull'indice attivo */}
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Sectionhome1;
