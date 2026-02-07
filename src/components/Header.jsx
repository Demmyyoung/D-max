import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { toggleCart, cartItems } = useCart();
  const { scrollY } = useScroll();

  /* Scroll logic */
  // We want a PHYSICAL feel. 1:1 movement with scroll until it locks.
  // Distance from Center (50vh) to Header Center (approx 40px).
  // Formula: Distance = (windowHeight / 2) - 40;
  // If we scroll 'Distance' pixels, and translate 'Distance' pixels up, it looks static.
  // Then it stops (clamps), looking like it stuck.
  
  const [dimensions, setDimensions] = React.useState({ height: 800 }); // Default safest
  
  React.useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const travelDistance = (dimensions.height / 2) - 35; // Target 35px from top
  const range = [0, travelDistance];
  
  // Scale: 1 (Hero) -> 0.12 (Header)
  const logoScale = useTransform(scrollY, range, [1, 0.12]);
  
  // Y Position: Moves UP exactly as much as we scroll down.
  const logoY = useTransform(scrollY, range, ['0px', `-${travelDistance}px`]);
  
  // Shadow "Lift": Increases as we speed up/move, settles when locked?
  // Or just constant "lift" during travel.
  const textShadow = useTransform(
    scrollY, 
    [0, travelDistance * 0.5, travelDistance], 
    ['0px 0px 0px rgba(0,0,0,0)', '0px 20px 40px rgba(0,0,0,0.2)', '0px 0px 0px rgba(0,0,0,0)']
  );
  // Wait, if it "locks" into header, maybe no shadow at the end? Or subtle?
  // User said: "Add a subtle depth shadow as it 'lifts' off the page during travel."
  // So shadow should appear during move (0-150) and maybe disappear or settle at 300?
  // "Lifts off the page" -> Shadow increases.
  
  // Nav Opacity: Fade in near the end of travel
  const navOpacity = useTransform(scrollY, [travelDistance - 100, travelDistance], [0, 1]);

  return (
    <>
      <motion.header className="header">
        <motion.nav className="nav-left" style={{ opacity: navOpacity }}>
           <a href="#" className="nav-link">Shop</a>
        </motion.nav>

        <div className="logo-placeholder" style={{ width: '120px' }}></div>

        <motion.nav className="nav-right" style={{ opacity: navOpacity }}>
          <Link to="/create" className="create-btn">Create</Link>
          <button onClick={toggleCart} className="nav-link"><ShoppingBag size={20} /> ({cartItems.length})</button>
          <a href="#" className="nav-link"><User size={20} /></a>
        </motion.nav>
      </motion.header>

      <motion.div 
        className="brand-logo"
        style={{ pointerEvents: 'none' }}
      >
        <motion.h1 
          className="brand-text"
          style={{
            scale: logoScale,
            y: logoY, 
            textShadow: textShadow,
            filter: useTransform(scrollY, [0, travelDistance], ["blur(0px)", "blur(0px)"]) // Placeholder for any filter if needed
          }}
        >
          D-MAX
        </motion.h1>
      </motion.div>
    </>
  );
};

export default Header;
