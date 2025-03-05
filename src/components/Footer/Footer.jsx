import React from 'react';
import { FaFacebook, FaInstagram, FaEnvelope } from 'react-icons/fa'; // Icone per social e mail
import logo  from '../../assets/logoverde.png'
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Lato sinistro: Logo e scritta */}
        <div className="footer-logo">
          <img src={logo} alt="Logo Tenute Colonico" className="footer-logo-img" />
          <p>Tenute Colonico srl</p>
        </div>

        {/* Lato centrale: Icone social e mail */}
        <div className="footer-social">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FaFacebook size={30} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FaInstagram size={30} />
          </a>
          <a href="mailto:info@tenutecolonico.com" className="social-icon">
            <FaEnvelope size={30} />
          </a>
        </div>

        {/* Lato destro: Link chi siamo, nostro prodotto, contatti */}
        <div className="footer-links">
          <ul>
            <li><a href="/">Chi Siamo</a></li>
            <li><a href="/">Il Nostro Prodotto</a></li>
            <li><a href="/">Contatti</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Tenute Colonico srl. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
