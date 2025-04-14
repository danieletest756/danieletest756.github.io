import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import carosello1 from "../../assets/immagini lavorazioni/design.jpg";
import carosello2 from "../../assets/immagini lavorazioni/meccanica.png";
import carosello3 from "../../assets/immagini lavorazioni/plastica.jpg";

const carouselImages = [carosello1, carosello2, carosello3];
const imageTexts = [
  "Design Innovativo",
  "Lavorazioni Meccaniche",
  "Materie Plastiche",
];

const CarouselComponent = () => {
  const [activeIndex, setActiveIndex] = useState(0);
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
    beforeChange: (oldIndex, newIndex) => setActiveIndex(newIndex),
    fade: false,
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div className="bg-[#191919] bg-opacity-60 flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-8 md:p-16 text-white">
      {/* Right Section - Text */}
      <div className="md:w-1/2 text-center md:text-center flex flex-col items-center md:items-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">
          IL NOSTRO BUSINESS
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Materie Plastiche, Metalliche e di design
        </h2>
        <p className="mt-4 text-lg md:text-xl max-w-lg md:max-w-xl">
          Siamo specializzati nella lavorazione di materie plastiche e
          metalliche, con un focus non solo industriale ma anche su design e
          oggettistica. Produciamo complementi d’arredo, trofei, medaglie e
          insegne personalizzate, sfruttando la nostra capacità di lavorare
          materiali plastici e metallici in maniera complementare per offrire
          soluzioni complete e innovative.
        </p>
      </div>

      {/* Left Section - Carousel */}
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
              <p className="text-center mt-2">{imageTexts[activeIndex]}</p>
            </div>
          ))}
        </Slider>
      </div>

      {/* Modal */}
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
                  <p className="text-center mt-2 text-white">
                    {imageTexts[idx]}
                  </p>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselComponent;
