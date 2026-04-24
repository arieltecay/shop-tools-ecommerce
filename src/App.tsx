import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Layout
const ShopLayout = lazy(() => import('./layout/ShopLayout'));

// Páginas
const Home = lazy(() => import('./pages/home/Home'));
const ProductCatalog = lazy(() => import('./pages/products/ProductCatalog'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const CartPage = lazy(() => import('./pages/cart/CartPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 className="animate-spin text-blue-600" size={40} />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Analytics />
      <SpeedInsights />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </HelmetProvider>
  );
}

export default App;
