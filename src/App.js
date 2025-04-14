import logo from "./logo.svg";
import "./App.css";
import Home from "../src/pages/Home/Home";
import Sectionhome1 from "../src/components/Sections/SectionsHome1";
import Sectionhome2 from "../src/components/Sections/SectionHome2";
import Sectionhome3 from "../src/components/Sections/SectionsHome3";

import Footer from "./components/Footer/Footer";
import Sectionhome4 from "./components/Sections/SectionHome4";
import ContactDetails from "./components/Contatti";
import PartnersSection from "./components/Partners";
import Recensioni from "./components/Recensioni";
import SectionHome5 from "./components/Sections/SectionHome5";
import Sectionhome6 from "./components/Sections/SectionHome6";
import Sectionhome7 from "./components/Sections/SectionHome7";
import Sectionhome8 from "./components/Sections/SectionHome8";
import Sectionhome9 from "./components/Sections/SectionHome9";
import TeamGrid from "./components/TeamSection.jsx/SectionTeam";
import Testimonials from "./components/Reviews";

function App() {
  return (
    <div className="App">
      <header /* className="App-header" */>
        <Home />
        <div className="backgroundHome">
          <Sectionhome1 />
          <Sectionhome2 />
          <Sectionhome3 />
          <SectionHome5 />
          <Sectionhome6 />
          <Sectionhome7 />
          <Sectionhome8 />
          <Sectionhome9 />
        </div>
        <PartnersSection />
        {/* <Sectionhome4 /> */}
        <div className="backgroundHome">
          <TeamGrid />
        </div>

        <ContactDetails />
        {/* <Recensioni/> */}
        <Testimonials />
        <Footer />
      </header>
    </div>
  );
}

export default App;
