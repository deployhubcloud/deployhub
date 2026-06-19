import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Pricing from './pages/Pricing';
import Developers from './pages/Developers';
import LaunchingSoonModal from './components/LaunchingSoonModal';
import { LaunchModalProvider } from './lib/launch-modal';

function App() {
  return (
    <BrowserRouter>
      <LaunchModalProvider>
        <div className="min-h-screen flex flex-col bg-page text-primary">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/developers" element={<Developers />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <LaunchingSoonModal />
      </LaunchModalProvider>
    </BrowserRouter>
  );
}

export default App;
