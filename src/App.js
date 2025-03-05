import logo from './logo.svg';
import './App.css';
import Home from '../src/pages/Home/Home'
import Sectionhome1 from '../src/components/Sections/SectionsHome1'
import Sectionhome2 from '../src/components/Sections/SectionHome2'
import Footer from './components/Footer/Footer';

function App() {
  return (
    <div className="App">
      <header /* className="App-header" */>
        <Home/>
        <Sectionhome1 />
        <Sectionhome2 />
        <Footer/>
      </header>
    </div>
  );
}

export default App;
