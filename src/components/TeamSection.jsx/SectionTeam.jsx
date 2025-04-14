import React from "react";
import "./sectionTeam.css";
import dipendente1 from "../../assets/Dipendenti/test1-ezgif.com-crop.gif";
import dipendente2 from "../../assets/Dipendenti/test2-ezgif.com-crop.gif";
import dipendente3 from "../../assets/Dipendenti/test3.gif";
import dipendente4 from "../../assets/Dipendenti/test4-ezgif.com-crop.gif";
import dipendente5 from "../../assets/Dipendenti/test5-ezgif.com-crop.gif";
import dipendente6 from "../../assets/Dipendenti/test6-ezgif.com-crop.gif";
import dipendente7 from "../../assets/Dipendenti/test7-ezgif.com-crop.gif";
import dipendente8 from "../../assets/Dipendenti/test8-ezgif.com-crop.gif";

const teamMembers = [
  {
    name: "Vladimiro Piastra",
    role: "Pianificazione Produzione e Sviluppo Nuovi Prodotti",
    img: dipendente1,
  },
  {
    name: "Yuri Andrea Piastra",
    role: "Socio e ingegnere meccanico, progettista innovativo.",
    img: dipendente7,
  },
  {
    name: "Veronica Piastra",
    role: "Amministratrice, laureata in Scienza dell'Architettura.",
    img: dipendente3,
  },
  {
    name: "Michele Lepore",
    role: "Capo officina, esperto in lavorazioni CNC.",
    img: dipendente6,
  },
  {
    name: "Adrian Tujan",
    role: "Specialista in saldatura, tornitura e carpenteria.",
    img: dipendente2,
  },
  {
    name: "Isidoro Lagonegro",
    role: "Progettista Meccanico, Esperto in Tecnologie CNC",
    img: dipendente4,
  },
  {
    name: "Valerio Vallucci",
    role: "Giovane talento, esperto in pantografo, laser e lavorazioni plastiche.",
    img: dipendente8,
  },
  { name: "Severino Fiorentini", role: "", img: dipendente5 },
];

const TeamGrid = () => {
  return (
    <div id="chi-siamo" className="team-container">
      <h1 className="team-title">IL NOSTRO TEAM</h1>
      <div className="team-grid">
        {teamMembers.map((member, index) => (
          <div className="team-member" key={index}>
            <img src={member.img} alt={member.name} className="team-photo" />
            <h3 className="team-name">{member.name}</h3>
            <p className="team-role">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamGrid;
