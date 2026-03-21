import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';

const ShopLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-[50] w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-black text-blue-600 tracking-tighter uppercase italic">Tools Store</Link>
            <nav className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
              <Link to="/products" className="text-gray-900 hover:text-blue-600 transition-colors">Catálogo</Link>
              <Link to="/products/herramientas-electricas" className="text-gray-900 hover:text-blue-600 transition-colors">Eléctricas</Link>
              <Link to="/products/herramientas-manuales" className="text-gray-900 hover:text-blue-600 transition-colors">Manuales</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-4">
            <form onSubmit={handleSearch} className="hidden md:flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-transparent focus-within:border-blue-500 transition-all">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="ml-2 bg-transparent outline-none text-xs font-bold w-32 lg:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <Link to="/cart" className="relative p-2.5 text-gray-900 hover:text-blue-600 transition-all">
              <ShoppingCart size={22} strokeWidth={2.5} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2.5 text-gray-900 active:scale-90 transition-all"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Side Drawer - Independent from Header for stability */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 ease-out flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-50">
              <span className="text-xs font-black text-blue-600 uppercase italic tracking-widest">Navegación</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-gray-50 rounded-xl"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <form onSubmit={handleSearch} className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border-2 border-transparent focus-within:border-blue-500 transition-all">
                <Search size={18} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="ml-2 bg-transparent outline-none text-sm font-bold flex-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <nav className="flex flex-col gap-2">
                <Link to="/products" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 text-xs font-black uppercase italic text-gray-900 active:bg-blue-600 active:text-white transition-all">
                  Catálogo <span className="opacity-30">→</span>
                </Link>
                <Link to="/products/herramientas-electricas" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 text-xs font-black uppercase italic text-gray-900 active:bg-blue-600 active:text-white transition-all">
                  Eléctricas <span className="opacity-30">→</span>
                </Link>
                <Link to="/products/herramientas-manuales" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 text-xs font-black uppercase italic text-gray-900 active:bg-blue-600 active:text-white transition-all">
                  Manuales <span className="opacity-30">→</span>
                </Link>
              </nav>
            </div>

            <div className="p-6 bg-gray-50 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                © Tools Store {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-blue-600">Tools Store</h3>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">Las mejores herramientas para tu trabajo y hogar con la mejor calidad del mercado.</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-4">Compañía</h4>
              <ul className="space-y-2 text-xs font-bold text-gray-500">
                <li><Link to="/about" className="hover:text-blue-600">Sobre nosotros</Link></li>
                <li><Link to="/contact" className="hover:text-blue-600">Contacto</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} Tools Store. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ShopLayout;
