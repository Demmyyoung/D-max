import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <h2>D-MAX</h2>
            <p>Engineered for the future.</p>
          </div>
          
          <div className="footer-links">
            <div className="link-column">
              <h3>Shop</h3>
              <a href="#">New Arrivals</a>
              <a href="#">Best Sellers</a>
              <a href="#">Accessories</a>
              <a href="#">Collections</a>
            </div>
            
            <div className="link-column">
              <h3>Support</h3>
              <a href="#">Help Center</a>
              <a href="#">Shipping & Returns</a>
              <a href="#">Size Guide</a>
              <a href="#">Contact Us</a>
            </div>
            
            <div className="link-column">
              <h3>Legal</h3>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} D-MAX Studios. All rights reserved.</p>
          <div className="social-links">
             <a href="#">Instagram</a>
             <a href="#">Twitter</a>
             <a href="#">TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
