import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import image1 from "../../assets/idee regalo/1.jpg";
import image2 from "../../assets/idee regalo/2.jpg";
import image3 from "../../assets/idee regalo/3.jpg";
import image4 from "../../assets/idee regalo/4.jpg";
import image5 from "../../assets/idee regalo/5.jpg";
import image6 from "../../assets/idee regalo/6.jpg";
import image7 from "../../assets/idee regalo/7.jpg";
import image8 from "../../assets/idee regalo/8.jpg";
import image9 from "../../assets/idee regalo/9.jpg";
import image10 from "../../assets/idee regalo/10.jpg";
import image11 from "../../assets/idee regalo/11.jpg";
import image12 from "../../assets/idee regalo/12.jpg";
import image13 from "../../assets/idee regalo/13.jpg";
import image14 from "../../assets/idee regalo/14.jpg";
import image15 from "../../assets/idee regalo/15.jpg";
import image16 from "../../assets/idee regalo/16.jpg";
import image17 from "../../assets/idee regalo/17.jpg";
import image18 from "../../assets/idee regalo/18.jpg";
import image19 from "../../assets/idee regalo/19.jpg";
import image20 from "../../assets/idee regalo/20.jpg";
import image21 from "../../assets/idee regalo/21.jpg";
import image22 from "../../assets/idee regalo/22.jpg";
import image23 from "../../assets/idee regalo/23.jpg";
import image24 from "../../assets/idee regalo/24.jpg";
import image25 from "../../assets/idee regalo/25.jpg";
import image26 from "../../assets/idee regalo/26.jpg";
import image27 from "../../assets/idee regalo/27.jpg";
import image28 from "../../assets/idee regalo/28.jpg";
import image29 from "../../assets/idee regalo/29.jpg";
import image30 from "../../assets/idee regalo/30.jpg";
import image31 from "../../assets/idee regalo/31.jpg";
import image32 from "../../assets/idee regalo/32.jpg";

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
  image17,
  image18,
  image19,
  image20,
  image21,
  image22,
  image23,
  image24,
  image25,
  image26,
  image27,
  image28,
  image29,
  image30,
  image31,
  image32,
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
          IDEE REGALO
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Gadget e idee regalo
        </h2>
        {/*  <p className="mt-4 text-lg md:text-xl max-w-lg md:max-w-xl">
          Offriamo soluzioni meccaniche personalizzate, dalla produzione
          artigianale a progetti complessi. Utilizziamo tecnologie avanzate come
          CNC e laser CO2 per garantire precisione.
        </p> */}
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
