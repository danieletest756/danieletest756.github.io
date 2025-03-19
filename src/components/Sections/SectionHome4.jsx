import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import dipendente1 from "../../assets/Dipendenti/test1.gif";
import dipendente2 from "../../assets/Dipendenti/test2.gif";
import dipendente3 from "../../assets/Dipendenti/test3.gif";
import dipendente4 from "../../assets/Dipendenti/test4.gif";
import dipendente5 from "../../assets/Dipendenti/test5.gif";
import dipendente6 from "../../assets/Dipendenti/test6.gif";
import dipendente7 from "../../assets/Dipendenti/test7.gif";
import dipendente8 from "../../assets/Dipendenti/test8.gif";

const carouselImages = [
  dipendente1,
  dipendente3,
  dipendente7,
  dipendente2,
  dipendente4,
  dipendente5,
  dipendente6,
  dipendente8,
];

const Sectionhome4 = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: true,
    adaptiveHeight: true,
    beforeChange: (oldIndex, newIndex) => setActiveIndex(newIndex), // aggiorna l'indice della slide attiva
  };

  return (
    <div
      id="chi-siamo"
      className="bg-[#191919] flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-8 md:p-16 text-white"
    >
      {/* Right Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-end moving-paragraph">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">
          IL NOSTRO TEAM
        </h1>
        <p className="mt-4 text-sm md:text-base max-w-md text-left">
          YA&V Project Engineering srls, fondata nel 2016 dai fratelli Yuri
          Andrea e Veronica Piastra, affonda le sue radici in una tradizione
          familiare nel settore meccanico che risale al 1960. L'azienda si
          distingue per la sua competenza nella progettazione e lavorazione di
          materie plastiche e metalliche, offrendo soluzioni che spaziano
          dall’industria al design. Produciamo complementi d’arredo, trofei,
          medaglie e insegne personalizzate, combinando lavorazioni plastiche e
          metalliche per realizzare prodotti unici.
        </p>
      </div>

      {/* Left Section - Carousel */}
      <div className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0 moving-paragraph">
        <div className="w-full md:w-1/3 min-h-[50vh] flex justify-center mt-6 md:mt-0 moving-paragraph">
          <Slider {...settings} className="w-[30vh] md:w-[40vh]">
            {carouselImages.map((image, idx) => (
              <div key={idx} className="w-full h-auto">
                <img
                  src={idx === activeIndex ? image : ""}
                  //alt={`Carosello Immagine ${idx + 1}`}
                  className="w-full h-auto object-cover rounded-lg shadow-lg"
                />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Sectionhome4;
