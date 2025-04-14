import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import immaginemeccanica2 from "../../assets/lavorazioni meccaniche/2.jpg";
import immaginemeccanica3 from "../../assets/lavorazioni meccaniche/3.jpg";
import immaginemeccanica4 from "../../assets/lavorazioni meccaniche/4.jpg";
import immaginemeccanica5 from "../../assets/lavorazioni meccaniche/5.jpg";
import MacchinettaPULIZIA from "../../assets/lavorazioni meccaniche/Macchinetta pulizia condotti aria.jpg";
import portainterna from "../../assets/lavorazioni meccaniche/Porte garage interna.jpg";
import portaesterna from "../../assets/lavorazioni meccaniche/Porte per garage.jpg";
import telaio from "../../assets/lavorazioni meccaniche/Telaio per moto.jpg";
import Tirafondi from "../../assets/lavorazioni meccaniche/Tirafondi.jpg";
import Ugelli from "../../assets/lavorazioni meccaniche/Ugelli.jpg";
import Argani from "../../assets/lavorazioni meccaniche/Argani.jpg";
import Carrucole from "../../assets/lavorazioni meccaniche/Carrucole.jpg";
import braccio from "../../assets/lavorazioni meccaniche/braccio.jpg";
import forcella from "../../assets/lavorazioni meccaniche/Forcella per moto.jpg";

const carouselImages = [
  immaginemeccanica2,
  immaginemeccanica3,
  immaginemeccanica4,
  immaginemeccanica5,
  MacchinettaPULIZIA,
  portainterna,
  portaesterna,
  telaio,
  Tirafondi,
  Ugelli,
  Argani,
  Carrucole,
  braccio,
  forcella,
];

const Sectionhome5 = () => {
  const [modalOpen, setModalOpen] = useState(false);

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
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div
      id="prodotto"
      className="bg-[#191919] bg-opacity-60 flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-8 md:p-16 text-white"
    >
      <div className="md:w-1/2 text-center md:text-center flex flex-col items-center md:items-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">
          PRODOTTI MECCANICI
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Meccanici e di Precisione
        </h2>
        <p className="mt-4 text-lg md:text-xl max-w-lg md:max-w-xl">
          Offriamo soluzioni meccaniche personalizzate, dalla produzione
          artigianale a progetti complessi. Utilizziamo tecnologie avanzate come
          CNC e laser CO2 per garantire precisione.
        </p>
      </div>

      <div
        className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0"
        onClick={openModal}
      >
        <Slider {...settings} className="w-[30vh] md:w-[40vh] cursor-pointer">
          {carouselImages.map((image, idx) => (
            <div key={idx} className="w-full h-auto">
              <img
                src={image}
                alt={`Carosello Immagine ${idx + 1}`}
                className="w-full h-auto object-cover rounded-lg shadow-lg"
              />
            </div>
          ))}
        </Slider>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={closeModal}
        >
          <div
            className="relative p-4 max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-[-1em] right-2 text-white text-3xl"
              onClick={closeModal}
            >
              &times;
            </button>
            <Slider {...settings} className="w-[98%] max-w-4xl mx-auto">
              {carouselImages.map((image, idx) => (
                <div key={idx} className="w-full h-auto">
                  <img
                    src={image}
                    alt={`Carosello Ingrandito ${idx + 1}`}
                    className="w-full h-auto object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sectionhome5;
