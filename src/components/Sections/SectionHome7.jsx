import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import image1 from "../../assets/design per la casa/1.jpg";
import image2 from "../../assets/design per la casa/2.jpg";
import image3 from "../../assets/design per la casa/3.jpg";
import image4 from "../../assets/design per la casa/4.jpg";
import image5 from "../../assets/design per la casa/5.jpg";
import image6 from "../../assets/design per la casa/6.jpg";
import image7 from "../../assets/design per la casa/7.jpg";
import image8 from "../../assets/design per la casa/8.jpg";
import image9 from "../../assets/design per la casa/9.jpg";
import image10 from "../../assets/design per la casa/10.jpg";
import image11 from "../../assets/design per la casa/11.jpg";
import image12 from "../../assets/design per la casa/12.jpg";
import image13 from "../../assets/design per la casa/13.jpg";
import image14 from "../../assets/design per la casa/14.jpg";
import image15 from "../../assets/design per la casa/15.jpg";
import image16 from "../../assets/design per la casa/16.jpg";

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
  image15,
  image16,
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
          PRODOTTI DI DESIGN PER LA CASA
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Design per la casa e il giardino
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
