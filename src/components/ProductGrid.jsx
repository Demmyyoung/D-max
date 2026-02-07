import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { fetchProducts } from '../services/strapi';
import './ProductGrid.css';

// Fallback products if Strapi is not running
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Oversized Heavy Tee",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
    size: "M"
  },
  {
    id: 2,
    name: "Wide Leg Cargo",
    price: 85.00,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop",
    size: "M"
  },
  {
    id: 3,
    name: "Structure Hoodie",
    price: 120.00,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop",
    size: "L"
  },
  {
    id: 4,
    name: "Tactical Vest",
    price: 150.00,
    image: "https://images.unsplash.com/photo-1617114919297-3c8ddbec0145?w=800&auto=format&fit=crop",
    size: "M"
  }
];

const ProductGrid = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const data = await fetchProducts();
      
      if (data.length > 0) {
        setProducts(data);
      } else {
        // Use fallback if Strapi is not running
        setProducts(FALLBACK_PRODUCTS);
      }
      setLoading(false);
    };
    
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="product-grid loading">
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
      </div>
    );
  }

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
             <img src={product.image} alt={product.name} />
             <div className="product-overlay">
                <button onClick={() => addToCart(product)} className="add-btn">Add to Cart</button>
             </div>
          </div>
          <div className="product-info">
             <div className="info-row">
               <h3>{product.name}</h3>
               <span>${product.price.toFixed(2)}</span>
             </div>
             {product.size && <p className="size">Size: {product.size}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProductGrid;
