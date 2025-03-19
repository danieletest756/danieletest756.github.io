import React, { useEffect, useRef, useState } from "react";
import acsi from "../assets/parter/acsi.png";
import boxtest from "../assets/parter/boxtest.png";
import accademia from "../assets/parter/accademia.png";
import ergonica from "../assets/parter/ergonica.png";
import fir from "../assets/parter/fir.png";
import rai from "../assets/parter/rai.png";
const PartnersSection = () => {
    const imagesRef = useRef([]);
    const [visibleImages, setVisibleImages] = useState([]);
  
    // Usa direttamente le immagini importate
    const partners = [acsi, fir, rai, ergonica, accademia, boxtest];
  
    useEffect(() => {
      const handleScroll = () => {
        const newVisibleImages = [];
        imagesRef.current.forEach((img, index) => {
          const rect = img.getBoundingClientRect();
          if (rect.top <= window.innerHeight && rect.bottom >= 0) {
            newVisibleImages.push(index.toString());
          }
        });
        setVisibleImages(newVisibleImages);
      };
  
      window.addEventListener("scroll", handleScroll);
      handleScroll(); // Check visibility on initial load
  
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);
  
    return (
      <div>
        <div
          style={{
            backgroundColor: "whiteSmoke",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            fontSize:'5vh'
          }}
        >
          <h1
            style={{
              color: "black",
            }}
          >
            I NOSTRI PARTNERS
          </h1>
        </div>
  
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            backgroundColor: "whitesmoke",
            width: "100%",
          }}
        >
          {partners.map((src, index) => (
            <img
              key={index}
              ref={(el) => (imagesRef.current[index] = el)}
              data-index={index}
              alt={`Image ${index}`}
              className={`slide-up ${
                visibleImages.includes(index.toString()) ? "visible" : ""
              }`}
              style={{
                margin: "2%",
                width: "15vh",
                maxWidth: "50%",
              }}
              src={src}
              onClick={() => {
                if (src === ergonica) {
                  window.open("https://ergonica.it/", "_blank");
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };
  
  export default PartnersSection;
  