import React, { useEffect, useState, useRef } from "react";
import "./Home.css";
import videoBackground from "../../assets/background2.mp4";
import logonero from "../../assets/logo nero.png";

const Home = () => {
  useEffect(() => {
    const elements = document.querySelectorAll(".moving-paragraph"); // Seleziona tutti gli elementi con la classe moving-paragraph

    // Verifica che ci siano elementi da osservare
    if (elements.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            } /*  else {
              entry.target.classList.remove("visible");
            } */
          });
        },
        {
          threshold: 0.3, // La visibilità minima dell'elemento per attivare la transizione
        }
      );

      // Osserva ogni elemento con la classe 'moving-paragraph'
      elements.forEach((element) => observer.observe(element));

      // Cleanup dell'observer al momento dello smontaggio
      return () => observer.disconnect();
    }
  }, []); // Solo al primo render
  
  return (
    <div className="home-container">
      <video autoPlay loop muted className="background-video">
        <source src={videoBackground} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content">
        {/* <h1>Benvenuto nella Home</h1>
        <p>Esplora i nostri servizi e prodotti.</p> */}
        <img className="moving-paragraph" style={{width:'15vh'}} src={logonero} alt={"logo"} />
      </div>
    </div>
  );
};

export default Home;