import React, { useEffect, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import carosello1 from "../../assets/arredo casa/casa1.jpg";
import carosello2 from "../../assets/arredo casa/casa2.jpg";
import carosello3 from "../../assets/arredo casa/casa3.jpg";
import carosello5 from "../../assets/arredo casa/casa4.jpg";

const images = [carosello1, carosello2,carosello5,];

const Sectionhome6 = () => {
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

  const sliderRef = useRef(null);
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

  return (
    <div
      className="bg-[#191919] flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white"
    >
      {/* Left Section - Text */}
      <div  className="md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-[#8b0000]">
          PRODOTTI PLASTICI, ARREDO E DESIGN
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          Plastici e di design Per la casa
        </h2>
        <p className="mt-4 text-sm md:text-base max-w-md">
          Offriamo soluzioni su misura che combinano estetica e funzionalità:
          arredi personalizzati, installazioni creative in metallo e plastica,
          progetti innovativi come ERGONICA e lavorazioni in plexiglass, forex e
          dibond per complementi d’arredo, trofei, e insegne aziendali.
          Trasformiamo le tue idee con cura artigianale e tecnologie avanzate.
        </p>
      </div>

      {/* Right Section - Carousel */}
      <div className="w-full md:w-1/3 flex justify-center mt-6 md:mt-0 moving-paragraph">
        <Slider {...settings} ref={sliderRef} className="w-[30vh] md:w-[40vh]">
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
    </div>
  );
};

export default Sectionhome6;
