import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import './ProductGrid.css';

const products = [
  {
    id: 1,
    title: "Oversized Heavy Tee",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
    category: "Tops"
  },
  {
    id: 2,
    title: "Wide Leg Cargo",
    price: 85.00,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop",
    category: "Bottoms"
  },
  {
    id: 3,
    title: "Structure Hoodie",
    price: 120.00,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop",
    category: "Outerwear"
  },
  {
    id: 4,
    title: "Tactical Vest",
    price: 150.00,
    image: "https://images.unsplash.com/photo-1617114919297-3c8ddbec0145?w=800&auto=format&fit=crop",
    category: "Outerwear"
  },
  {
    id: 5,
    title: "Essential Cap",
    price: 35.00,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop",
    category: "Accessories"
  },
  {
    id: 6,
    title: "Boxy Knit Sweater",
    price: 95.00,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop",
    category: "Tops"
  }
];

const ProductGrid = () => {
  const { addToCart } = useCart();

  return (
    <div className="product-grid">
      {products.map((product) => (
        <motion.div 
            key={product.id} 
            className="product-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="product-image-wrapper">
             <img src={product.image} alt={product.title} />
             <div className="product-overlay">
                <button onClick={() => addToCart(product)} className="add-btn">Add to Cart</button>
             </div>
          </div>
          <div className="product-info">
             <div className="info-row">
               <h3>{product.title}</h3>
               <span>${product.price.toFixed(2)}</span>
             </div>
             <p className="category">{product.category}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProductGrid;
