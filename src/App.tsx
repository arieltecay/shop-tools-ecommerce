import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ShopLayout from './layout/ShopLayout';
import Home from './pages/home/Home';
import ProductCatalog from './pages/products/ProductCatalog';
import ProductDetail from './pages/products/ProductDetail';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';

function App() {
  return (
    <HelmetProvider>
      <Routes>
        <Route path="/" element={<ShopLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="products/:categorySlug" element={<ProductCatalog />} />
          <Route path="products/:categorySlug/:productSlug" element={<ProductDetail />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>
      </Routes>
    </HelmetProvider>
  );
}

export default App;
