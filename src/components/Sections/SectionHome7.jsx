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
        <h1 className="text-3xl md:text-5xl font-bold text-[#8b0000]">PRODOTTI PLASTICI ARREDO E DESIGN</h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Matrimoni e idee Regalo
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
