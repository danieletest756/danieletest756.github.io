import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import idea2 from "../../assets/plastici matrimoni e regalo/idea2.jpg";
import idea3 from "../../assets/plastici matrimoni e regalo/idea3.jpg";
import idea1 from "../../assets/plastici matrimoni e regalo/idea1.jpg";
import idea5 from "../../assets/plastici matrimoni e regalo/idea5.jpg";
import idea6 from "../../assets/plastici matrimoni e regalo/idea6.jpg";
import idea7 from "../../assets/plastici matrimoni e regalo/idea7.jpg";
import idea8 from "../../assets/plastici matrimoni e regalo/idea8.jpg";
import matrimoni2 from "../../assets/plastici matrimoni e regalo/matrimoni2.jpg";
import matrimoni3 from "../../assets/plastici matrimoni e regalo/matrimoni3.jpg";
import matrimoni4 from "../../assets/plastici matrimoni e regalo/matrimoni4.jpg";
import matrimoni1 from "../../assets/plastici matrimoni e regalo/matrimoni1.jpg";

const carouselImages = [
  idea2,
  idea3,
  idea1,
  idea5,
  idea6,
  idea7,
  idea8,
  matrimoni2,
  matrimoni3,
  matrimoni4,
  matrimoni1,
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
      <div className="md:w-1/2 text-center flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">
          PRODOTTI PLASTICI ARREDO E DESIGN
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Matrimoni e idee Regalo
        </h2>
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

export default Sectionhome7;
