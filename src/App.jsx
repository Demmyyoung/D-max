import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Studio from './pages/Studio';
import './App.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/create" element={<Studio />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
