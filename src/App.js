import logo from './logo.svg';
import './App.css';
import Home from '../src/pages/Home/Home'
import Sectionhome1 from '../src/components/Sections/SectionsHome1'
import Sectionhome2 from '../src/components/Sections/SectionHome2'
import Sectionhome3 from '../src/components/Sections/SectionsHome3'

import Footer from './components/Footer/Footer';
import Sectionhome4 from './components/Sections/SectionHome4';
import ContactDetails from './components/Contatti';
import ContactForm from './components/FormContattaci';

function App() {
  return (
    <div className="App">
      <header /* className="App-header" */>
        <Home/>
        <Sectionhome1 />
        <Sectionhome2 />
        <Sectionhome3 />
        <Sectionhome4 />
        <ContactDetails />
        {/* <ContactForm/> */}
        <Footer/>
      </header>
    </div>
  );
}

export default App;
