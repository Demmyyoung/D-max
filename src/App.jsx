import { useRef, useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./App.css";

import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1, // High inertia feel
      smoothWheel: true,
      direction: "vertical",
      gestureDirection: "vertical",
      mouseMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <CartProvider>
      <div className="app">
        <Header />
        <CartDrawer />
        
        <main>
          <Hero />
          
          <div className="container" style={{ position: 'relative', zIndex: 20, background: 'var(--bg-primary)' }}>
             <div className="content-spacer" style={{ height: '100px' }}></div>
             <div className="section-header" style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>Latest Drops</h1>
             </div>
             <ProductGrid />
          </div>
        </main>
        
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;
