import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png"
import sfondo from "../assets/padel.jpg"
import pallina from "../assets/images-removebg-preview.png"

export default function HeroSection() {
  const [showBalls, setShowBalls] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShowBalls(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  const ballPositions = [
    { top: "33%", left: "10%" },
    { top: "40%", right: "15%" },
    { top: "70%", left: "40%" },
    { top: "15%", right: "30%" },
  ];

  return (
    <div className="relative w-full h-screen bg-cover bg-center" style={{ backgroundImage:`url(${sfondo})`}}>
      {/* Logo e Nome Circolo */}
      <div className="flex flex-col items-center justify-center h-full text-white">
        <img src={logo} alt="Logo" className="w-16 h-16 mb-4" />
        <h1 className="text-5xl font-bold">blackPadel</h1>
      </div>

      {/* Palline animate */}
      {showBalls &&
        ballPositions.map((pos, idx) => (
            <motion.img
            key={idx}
            src={pallina}
            initial={{ y: -300, rotate: 0, opacity: 0 }}
            animate={{ 
              y: [-300, 0, -20, 0], 
              rotate: 360,
              opacity: 1
            }}
            transition={{ 
              delay: idx * 0.3,
              duration: 1.6, 
              ease: "easeOut"
            }}
            className="w-16 h-12 absolute"
            style={pos}
          />
        ))}
    </div>
  );
}
