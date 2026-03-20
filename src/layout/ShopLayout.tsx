import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';

const ShopLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">Tools Store</Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/products" className="hover:text-blue-600 transition-colors">Herramientas</Link>
              <Link to="/products/power-tools" className="hover:text-blue-600 transition-colors">Eléctricas</Link>
              <Link to="/products/hand-tools" className="hover:text-blue-600 transition-colors">Manuales</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden sm:flex items-center border rounded-lg px-2 py-1 focus-within:border-blue-500">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="ml-2 bg-transparent outline-none text-sm w-32 md:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <button className="md:hidden p-2">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Tools Store</h3>
              <p className="text-sm text-gray-600">Las mejores herramientas para tu trabajo y hogar.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/about">Sobre nosotros</Link></li>
                <li><Link to="/contact">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/order/tracking">Seguimiento</Link></li>
                <li><Link to="/shipping">Envíos</Link></li>
                <li><Link to="/returns">Devoluciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/privacy">Privacidad</Link></li>
                <li><Link to="/terms">Términos</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Tools Store. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ShopLayout;
