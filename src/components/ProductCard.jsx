import { useState } from "react";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already exists in cart
    const existingItemIndex = existingCart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // If item exists, increase quantity
      existingCart[existingItemIndex].quantity += 1;
    } else {
      // If item doesn't exist, add it to cart
      existingCart.push({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity: 1
      });
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    // Show feedback
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;

  return (
    <div className="product-card">
      {product.imageUrl && (
        <div className="product-image">
          <img src={product.imageUrl} alt={product.name} />
        </div>
      )}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        {product.category && (
          <span className="product-category">{product.category}</span>
        )}
        <div className="product-footer">
          <span className="product-price">₹{product.price}</span>
          {product.stockQuantity !== undefined && (
            <span className={`stock ${product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          )}
        </div>
        <button
          className={`add-to-cart-btn ${addedToCart ? 'added' : ''} ${isOutOfStock ? 'disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {addedToCart ? '✓ Added to Cart' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
