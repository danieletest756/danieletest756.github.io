import React from "react";

const reviews = [
  {
    name: "Marco, CEO",
    text: "Abbiamo collaborato con YA&V Project Engineering per la realizzazione di complementi d’arredo personalizzati per il nostro ufficio e siamo rimasti entusiasti! La qualità del lavoro e l’attenzione ai dettagli sono sorprendenti. Consigliatissimi!",
  },
  {
    name: "Anna, Event Manager",
    text: "Lavoriamo con YA&V da anni per la realizzazione di trofei e medaglie personalizzate per eventi aziendali. La professionalità e la capacità di adattarsi alle nostre esigenze li rende una scelta ideale. Ogni volta un lavoro impeccabile!",
  },
  {
    name: "Luca, Proprietario",
    text: "La qualità dei materiali e la precisione nelle lavorazioni sono eccezionali. Ci hanno aiutato a creare insegne personalizzate per il nostro negozio, e il risultato finale è stato oltre le aspettative!",
  },
  {
    name: "Giovanni, Designer",
    text: "YA&V Project Engineering ha realizzato per noi un progetto su misura che combinava metallo e plastica in maniera perfetta. Il loro approccio innovativo ci ha permesso di ottenere un prodotto finale che ha davvero impattato i nostri clienti. Ottima esperienza!",
  },
  {
    name: "Francesca, Responsabile Marketing",
    text: "Ho commissionato una serie di oggetti personalizzati per un evento speciale. Il risultato finale è stato straordinario, con lavorazioni dettagliate e finiture impeccabili. Un partner su cui fare affidamento per ogni progetto!",
  },
  {
    name: "Paolo, Art Director",
    text: "YA&V Project Engineering ha realizzato per noi prototipi innovativi con grande cura e precisione. La qualità del servizio è impeccabile e i risultati hanno superato le nostre aspettative!",
  },
];

const Testimonials = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-center text-3xl font-bold mb-6">Dicono di noi</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-lg p-6 text-center transition-transform transform hover:scale-105"
          >
            <div className="flex justify-center mb-3">
              {"⭐".repeat(5)}
            </div>
            <p className="text-gray-700 italic">"{review.text}"</p>
            <h4 className="mt-4 font-semibold text-lg text-gray-900">{review.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
