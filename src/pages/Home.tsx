import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingCart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Product {
  uuid: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string; isPrimary: boolean }[];
  category: { name: string; slug: string };
  brand: { name: string };
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const response = await api.get('/products', {
        params: { featured: 'true', limit: 4, status: 'active' }
      });
      setFeaturedProducts(response.data.products);
    } catch (err) {
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden bg-gray-900 text-white">
        <div className="container mx-auto flex h-full items-center px-4 relative z-10">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
              Equípate con lo mejor en herramientas
            </h1>
            <p className="text-lg text-gray-300">
              Calidad profesional para tus proyectos más exigentes. Envíos a todo el país.
            </p>
            <div className="flex gap-4">
              <Link to="/products" className="rounded-lg bg-blue-600 px-8 py-3 font-semibold hover:bg-blue-700 transition-colors">
                Ver catálogo
              </Link>
              <Link to="/products?featured=true" className="rounded-lg border border-white px-8 py-3 font-semibold hover:bg-white hover:text-gray-900 transition-colors">
                Ofertas
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-blue-600/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4">
        <h2 className="mb-8 text-3xl font-bold">Categorías Populares</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Herramientas Eléctricas', slug: 'power-tools' },
            { name: 'Herramientas de Mano', slug: 'hand-tools' },
            { name: 'Accesorios', slug: 'accessories' }
          ].map((cat) => (
            <Link key={cat.slug} to={`/products/${cat.slug}`} className="group relative h-64 overflow-hidden rounded-xl bg-gray-100">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-bold">{cat.name}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                  Explorar <ArrowRight size={16} />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Productos Destacados</h2>
          <Link to="/products" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <div key={product.uuid} className="group relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <Link to={`/products/${product.category.slug}/${product.slug}`}>
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                    {product.images.length > 0 ? (
                      <img 
                        src={product.images.find(img => img.isPrimary)?.url || product.images[0].url} 
                        alt={product.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">No image</div>
                    )}
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-gray-500 uppercase">{product.category.name}</p>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-1">{product.name}</h3>
                    <p className="text-lg font-bold text-blue-600">${product.price.toLocaleString()}</p>
                  </div>
                </Link>
                <button className="absolute bottom-4 right-4 rounded-full bg-blue-600 p-2 text-white shadow-lg transition-transform hover:scale-110">
                  <ShoppingCart size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
