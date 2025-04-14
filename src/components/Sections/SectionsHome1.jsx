import React, { useEffect, useState } from "react";
import videoStoria from "../../assets/video.mp4";

const Sectionhome1 = () => {
  const [modalOpen, setModalOpen] = useState(false);

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
        {
          threshold: 0.3,
        }
      );

      elements.forEach((element) => observer.observe(element));
      return () => observer.disconnect();
    }
  }, []);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div
      id="storia"
      className="bg-[#191919] bg-opacity-60 flex flex-col md:flex-row items-center justify-center min-h-[60vh] p-8 text-white"
    >
      {/* Left Section - Text */}
      <div className="md:w-1/2 text-center md:text-center flex flex-col items-center md:items-center moving-paragraph">
        <h1 className="text-4xl md:text-5xl font-bold text-[#8b0000]">
          LA STORIA
        </h1>
        <h2 className="italic text-lg md:text-xl mt-2 font-bold">
          YA&V PROJECT ENGINEERING
        </h2>
        <p className="mt-4 text-lg md:text-xl max-w-lg md:max-w-xl">
          Fondata nel 2016 dai fratelli Yuri Andrea e Veronica Piastra, YA&V
          Project Engineering srls si inserisce in una tradizione familiare che
          affonda le radici nel 1960, con tre generazioni di esperienza nel
          settore meccanico. L'azienda si distingue per la sua competenza nella
          progettazione e ingegneria, supportata da un team altamente
          specializzato e versatile.
        </p>
      </div>

      {/* Right Section - Video */}
      <div className="md:w-1/4 flex justify-center mt-6 md:mt-0 moving-paragraph">
        <div className="w-3/4 cursor-pointer" onClick={openModal}>
          <video
            src={videoStoria}
            autoPlay
            loop
            muted
            className="w-full h-auto rounded-lg"
          />
        </div>
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
            <video
              src={videoStoria}
              controls
              autoPlay
              className="w-full h-[90vh] rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sectionhome1;
