import React from "react";
import { FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa"; // Icone per social e mail
import logo from "../../assets/logo bianco.png";
import "./Footer.css";

const Footer = () => {
  const handleScroll = (e, target) => {
    e.preventDefault();
    const section = document.querySelector(target);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Lato sinistro: Logo e scritta */}
        <div className="footer-logo">
          <img src={logo} alt="Logo yav.project" className="footer-logo-img" />
          {/* <p>Tenute Colonico srl</p> */}
        </div>

        {/* Lato centrale: Icone social e mail */}
        <div className="footer-social">
          <a
            href="https://facebook.com/yav.project"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
          >
            <FaFacebook size={30} />
          </a>
          <a
            href="https://instagram.com/yav.project"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
          >
            <FaInstagram size={30} />
          </a>
          <a
            href="mailto:yav.project@gmail.com?subject=Informazioni&body=Ciao%20sono%20interessato%20a:"
            className="social-icon"
          >
            <FaEnvelope size={30} />
          </a>
        </div>

        {/* Lato destro: Link chi siamo, nostro prodotto, contatti */}
        <div className="footer-links">
          <ul>
            <li>
              {" "}
              <a
                href="#prodotto"
                onClick={(e) => handleScroll(e, "#storia")}
                className="hover:text-gray-600 transition-colors"
              >
                Storia
              </a>
            </li>
            <li>
              {" "}
              <a
                href="#prodotto"
                onClick={(e) => handleScroll(e, "#prodotto")}
                className="hover:text-gray-600 transition-colors"
              >
                Prodotti
              </a>
            </li>
            <li>
              {" "}
              <a
                href="#chi-siamo"
                onClick={(e) => handleScroll(e, "#chi-siamo")}
                className="hover:text-gray-600 transition-colors"
              >
                Team
              </a>
            </li>
            <li>
              <a
                href="#contatti"
                onClick={(e) => handleScroll(e, "#contatti")}
                className="hover:text-gray-600 transition-colors"
              >
                Contatti
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; Copyright YA&V | Tutti i Diritti Sono Riservati |
          yav.project@gmail.com | YA&V Project Engineering srls Via Pretoro 15 ,
          00132 Roma P.I./C.F. 13977941007
        </p>
      </div>
    </footer>
  );
};

export default Footer;
