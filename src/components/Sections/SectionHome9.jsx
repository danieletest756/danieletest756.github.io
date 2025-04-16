import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import image1 from "../../assets/insegne/1.jpg";
import image2 from "../../assets/insegne/2.jpg";
import image3 from "../../assets/insegne/3.jpg";
import image4 from "../../assets/insegne/4.jpg";
import image5 from "../../assets/insegne/5.jpg";
import image6 from "../../assets/insegne/6.jpg";
import image7 from "../../assets/insegne/7.jpg";
import image8 from "../../assets/insegne/8.jpg";
import image9 from "../../assets/insegne/9.jpg";
import image10 from "../../assets/insegne/10.jpg";
import image11 from "../../assets/insegne/11.jpg";
import image12 from "../../assets/insegne/12.jpg";
import image13 from "../../assets/insegne/13.jpg";
import image14 from "../../assets/insegne/14.jpg";

const carouselImages = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
  image11,
  image12,
  image13,
  image14,
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
          INSEGNE E PRODOTTI PER NEGOZI
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          NEGOZI E ALTRO
        </h2>
        {/* <p className="mt-4 text-lg md:text-xl max-w-lg md:max-w-xl">
          Scopri la nostra selezione di arredi da giardino dal design elegante e
          funzionale.
        </p> */}
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
