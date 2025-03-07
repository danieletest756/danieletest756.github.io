import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import logonero from "../../assets/logo nero.png";
import carosello1 from "../../assets/carosello1.jpg";
import carosello2 from "../../assets/carosello2.jpg";
import carosello3 from "../../assets/carosello3.jpg";
import carosello4 from "../../assets/carosello4.jpg";

const images = [
  { src: carosello1, title: "Storia", link: "#storia" },
  { src: carosello2, title: "Prodotto", link: "#prodotto" },
  { src: carosello3, title: "Chi Siamo", link: "#chi-siamo" },
  { src: carosello4, title: "Contatti", link: "#contatti" },
];

const Home = () => {
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);

  const startAutoPlay = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      sliderRef.current?.slickNext();
    }, 5000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleManualChange = (index) => {
    sliderRef.current?.slickGoTo(index);
    startAutoPlay(); // Riavvia l'autoplay senza aumentare la velocità
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    fade: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: true,
    pauseOnHover: false,
  };

  const handleScroll = (e, target) => {
    e.preventDefault();
    const section = document.querySelector(target);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full bg-white bg-opacity-80 flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 z-50">
        <div className="flex space-x-4 md:space-x-6 text-lg font-semibold">
          <a href="#storia" onClick={(e) => handleScroll(e, "#storia")} className="hover:text-gray-600 transition-colors">
            Storia
          </a>
          <a href="#prodotto" onClick={(e) => handleScroll(e, "#prodotto")} className="hover:text-gray-600 transition-colors">
            Prodotto
          </a>
        </div>

        <div className="flex justify-center py-2 md:py-0">
          <img src={logonero} alt="logo" className="w-24 md:w-28 filter drop-shadow-lg" />
        </div>

        <div className="flex space-x-4 md:space-x-6 text-lg font-semibold">
          <a href="#chi-siamo" onClick={(e) => handleScroll(e, "#chi-siamo")} className="hover:text-gray-600 transition-colors">
            Chi Siamo
          </a>
          <a href="#contatti" onClick={(e) => handleScroll(e, "#contatti")} className="hover:text-gray-600 transition-colors">
            Contatti
          </a>
        </div>
      </nav>

      {/* Slider */}
      <Slider {...settings} ref={sliderRef} className="w-full h-full">
        {images.map((image, index) => (
          <div key={index} className="relative w-full h-screen">
            <img src={image.src} alt={image.title} className="w-full h-full object-cover transition-opacity duration-1000" />
            <a href={image.link} onClick={(e) => handleScroll(e, image.link)}
              className="absolute bottom-14 left-10 text-white bg-gradient-to-r from-black via-gray-800 to-black px-6 py-3 rounded-lg text-xl font-semibold shadow-lg hover:scale-105 transition-transform">
              {image.title}
            </a>
          </div>
        ))}
      </Slider>

      {/* Indicatori Manuali */}
      <div className="absolute bottom-5 left-10 flex space-x-4 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualChange(index)}
            className="w-6 h-6 bg-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
