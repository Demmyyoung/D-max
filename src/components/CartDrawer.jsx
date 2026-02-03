import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

const CartDrawer = () => {
  const { isOpen, toggleCart, cartItems, updateQuantity, removeFromCart } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
          />
          <motion.div 
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cart-header">
              <h2>Your Bag ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h2>
              <button onClick={toggleCart} className="close-btn"><X size={24} /></button>
            </div>

            <div className="cart-items">
              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <p>Your bag is empty.</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="cart-item-details">
                      <div className="item-top">
                         <h3>{item.title}</h3>
                         <p className="item-price">${item.price}</p>
                      </div>
                      <div className="item-controls">
                        <div className="qty-selector">
                           <button onClick={() => updateQuantity(item.id, -1)}><Minus size={16} /></button>
                           <span>{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)}><Plus size={16} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="remove-btn">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="subtotal">
                <span>Subtotal</span>
                <span>${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              <button className="checkout-btn">Checkout</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
