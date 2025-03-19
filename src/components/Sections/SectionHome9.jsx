import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import carosello1 from "../../assets/panca da giardino/panca1.jpg";
import carosello2 from "../../assets/panca da giardino/panca2.jpg";
import carosello4 from "../../assets/panca da giardino/panca3.jpg";
import carosello3 from "../../assets/panca da giardino/panca4.jpg";
import carosello6 from "../../assets/panca da giardino/giardino1.jpg";
import carosello7 from "../../assets/panca da giardino/giardino2.jpg";
import carosello8 from "../../assets/panca da giardino/giardino3.jpg";
import carosello5 from "../../assets/panca da giardino/giardino4.jpg";

const carouselImages = [carosello1,
    carosello2,
    carosello4,
    carosello3,
    carosello6,
    carosello7,
    carosello8,
    carosello5,
];

const Sectionhome7 = () => {
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
    // Apply transition for smooth effect
    fade: false, // Adds fade transition
  };

  return (
    <div
      className="bg-[#191919] flex flex-col md:flex-row-reverse items-center justify-center min-h-[60vh] p-8 md:p-16 text-white"
    >
      {/* Right Section - Text */}
      <div className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-center moving-paragraph">
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">PRODOTTI DI DESIGN ARREDO GIARDINO</h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Panche e Prodotti Giardino
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md text-left">
      
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
                  className="w-full h-auto object-cover rounded-lg shadow-lg transition-opacity duration-500" // Transition for smooth fade
                />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Sectionhome7;
