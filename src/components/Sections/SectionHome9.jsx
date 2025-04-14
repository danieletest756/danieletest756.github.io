import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import carosello1 from "../../assets/panca da giardino/panca1.jpg";
import carosello2 from "../../assets/panca da giardino/panca2.jpg";
import carosello3 from "../../assets/panca da giardino/panca3.jpg";
import carosello4 from "../../assets/panca da giardino/panca4.jpg";
import carosello5 from "../../assets/panca da giardino/giardino1.jpg";
import carosello6 from "../../assets/panca da giardino/giardino2.jpg";
import carosello7 from "../../assets/panca da giardino/giardino3.jpg";
import carosello8 from "../../assets/panca da giardino/giardino4.jpg";

const carouselImages = [
  carosello1,
  carosello2,
  carosello3,
  carosello4,
  carosello5,
  carosello6,
  carosello7,
  carosello8,
];

const Sectionhome7 = () => {
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
    <div className="bg-[#191919] bg-opacity-60 flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-8 md:p-16 text-white">
      {/* Right Section - Text */}
      <div className="md:w-1/2 text-center md:text-center flex flex-col items-center md:items-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">
          PRODOTTI DI DESIGN ARREDO GIARDINO
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Panche e Prodotti Giardino
        </h2>
        <p className="mt-4 text-lg md:text-xl max-w-lg md:max-w-xl">
          Scopri la nostra selezione di arredi da giardino dal design elegante e
          funzionale.
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

export default Sectionhome7;
