import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import carosello1 from "../../assets/immagini lavorazioni/iconadesign.jpg";
import carosello2 from "../../assets/immagini lavorazioni/iconameccanica.jpg";
import carosello3 from "../../assets/immagini lavorazioni/iconaplastica.jpg";

const carouselImages = [
  carosello1,
  carosello2,
  carosello3,
];

const imageTexts = [
  "Design Innovativo", // Testo per la prima immagine
  "Lavorazioni Meccaniche", // Testo per la seconda immagine
  "Materie Plastiche", // Testo per la terza immagine
];

const CarouselComponent = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    adaptiveHeight: true,
    beforeChange: (oldIndex, newIndex) => setActiveIndex(newIndex),
    fade: false,
  };

  return (
    <div
      className="bg-[#191919] flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-8 md:p-16 text-white"
    >
      {/* Right Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-end moving-paragraph">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">IL NOSTRO BUSINESS</h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Materie Plastiche, Metalliche e di design
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md text-left">
          Siamo specializzati nella lavorazione di materie plastiche e
          metalliche, con un focus non solo industriale ma anche su design e
          oggettistica. Produciamo complementi d’arredo, trofei, medaglie e
          insegne personalizzate, sfruttando la nostra capacità di lavorare
          materiali plastici e metallici in maniera complementare per offrire
          soluzioni complete e innovative.
        </p>
      </div>

      {/* Left Section - Carousel */}
      <div className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0 moving-paragraph">
        <div className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0 moving-paragraph">
          <Slider {...settings} className="w-[30vh] md:w-[40vh]">
            {carouselImages.map((image, idx) => (
              <div key={idx} className="w-full h-auto">
                <img
                  src={image}
                  alt={`Carosello Immagine ${idx + 1}`}
                  className="w-full h-auto object-cover rounded-lg shadow-lg transition-opacity duration-500"
                />
                <p>{imageTexts[activeIndex]}</p> {/* Mostra il testo basato sull'indice attivo */}
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default CarouselComponent;
