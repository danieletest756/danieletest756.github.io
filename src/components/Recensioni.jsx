import React, { useEffect, useRef, useState } from "react";

const Recensioni = () => {

  
    return (
        <div style={{ backgroundColor: "white", fontFamily: "ui-sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 10%",
            padding: "20px",
          }}
        >
          <h2 style={{ textAlign: "center" }}>Dicono di noi</h2>

          <div
            style={{ width: "100%", marginBottom: "30px", textAlign: "center" }}
          >
            <h3>⭐⭐⭐⭐⭐</h3>
            <p>
              "Abbiamo collaborato con YA&V Project Engineering per la
              realizzazione di complementi d'arredo personalizzati per il nostro
              ufficio e siamo rimasti entusiasti! La qualità del lavoro e
              l'attenzione ai dettagli sono sorprendenti. Consigliatissimi!"
            </p>
            <span>- Mario, CEO</span>
          </div>

          <div
            style={{ width: "100%", marginBottom: "30px", textAlign: "center" }}
          >
            <h3>⭐⭐⭐⭐⭐</h3>
            <p>
              "Lavoriamo con YA&V da anni per la realizzazione di trofei e
              medaglie personalizzate per eventi aziendali. La professionalità e
              la capacità di adattarsi alle nostre esigenze li rende una scelta
              ideale. Ogni volta un lavoro impeccabile!"
            </p>
            <span>- Anna, Event Manager</span>
          </div>

          <div
            style={{ width: "100%", marginBottom: "30px", textAlign: "center" }}
          >
            <h3>⭐⭐⭐⭐⭐</h3>
            <p>
              "La qualità dei materiali e la precisione nelle lavorazioni sono
              eccezionali. Ci hanno aiutato a creare insegne personalizzate per
              il nostro negozio, e il risultato finale è stato oltre le
              aspettative!"
            </p>
            <span>- Luca, Proprietario</span>
          </div>

          <div
            style={{ width: "100%", marginBottom: "30px", textAlign: "center" }}
          >
            <h3>⭐⭐⭐⭐⭐</h3>
            <p>
              "YA&V Project Engineering ha realizzato per noi un progetto su
              misura che combinava metallo e plastica in maniera perfetta. Il
              loro approccio innovativo ci ha permesso di ottenere un prodotto
              finale che ha davvero impattato i nostri clienti. Ottima
              esperienza!"
            </p>
            <span>- Giovanni, Designer</span>
          </div>

          <div
            style={{ width: "100%", marginBottom: "30px", textAlign: "center" }}
          >
            <h3>⭐⭐⭐⭐⭐</h3>
            <p>
              "Ho commissionato una serie di oggetti personalizzati per un
              evento speciale. Il risultato finale è stato straordinario, con
              lavorazioni dettagliate e rifiniture impeccabili. Un partner su
              cui fare affidamento per ogni progetto!"
            </p>
            <span>- Francesca, Responsabile Marketing</span>
          </div>
        </div>
      </div>
    );
  };
  
  export default Recensioni;
  