import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import image1 from "../../assets/prodotti unici/1.jpg";
import image2 from "../../assets/prodotti unici/2.jpg";
import image3 from "../../assets/prodotti unici/3.jpg";
import image4 from "../../assets/prodotti unici/4.jpg";

const images = [image1, image2, image3, image4];

const Sectionhome10 = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    const elements = document.querySelectorAll(".moving-paragraph");
    if (elements.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            }
          });
        },
        { threshold: 0.3 }
      );
      elements.forEach((element) => observer.observe(element));
      return () => observer.disconnect();
    }
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="bg-[#191919] bg-opacity-60 flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white">
      {/* Left Section - Text */}
      <div className="md:w-1/2 text-center md:text-center flex flex-col items-center md:items-center moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-[#8b0000]">
          PRODOTTI E PEZZI UNICI
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Prodotti unici
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md"></p>
      </div>

      {/* Right Section - Carousel */}
      <div
        className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0 moving-paragraph"
        onClick={openModal}
      >
        <Slider
          {...settings}
          ref={sliderRef}
          className="w-[30vh] md:w-[40vh] cursor-pointer"
        >
          {images.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-auto rounded-lg shadow-lg"
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
              {images.map((image, index) => (
                <div key={index} className="w-full h-auto">
                  <img
                    src={image}
                    alt={`Carosello Ingrandito ${index + 1}`}
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

export default Sectionhome10;
