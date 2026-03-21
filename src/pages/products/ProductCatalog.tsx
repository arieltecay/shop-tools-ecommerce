import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Search, Filter, Loader2, ShoppingCart, ChevronDown, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import { IProduct, ICategory, IBrand } from '../../types';
import { getOptimizedUrl } from '../../utils/image-utils';
import { useCartStore } from '../../store/useCartStore';

const ProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  
  const category = categorySlug || searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const q = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [category, brand, q, minPrice, maxPrice, sort]);

  const fetchInitialData = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        api.get<ICategory[]>('/categories'),
        api.get<IBrand[]>('/brands')
      ]);
      setCategories(catsRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error('Error fetching initial filter data', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ products: IProduct[] }>('/products', {
        params: {
          category,
          brand,
          q,
          minPrice,
          maxPrice,
          sort,
          status: 'active'
        }
      });
      setProducts(response.data.products);
      setError(null);
    } catch (err) {
      setError('Error al cargar el catálogo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setShowMobileFilters(false);
  };

  const currentCategoryName = categories.find(c => c.slug === categorySlug)?.name || 'Catálogo';

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Helmet>
        <title>{currentCategoryName} | Tools Store</title>
      </Helmet>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-10">
        {/* Header section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase tracking-tighter italic">
              {currentCategoryName}
            </h1>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {products.length} productos encontrados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 lg:hidden"
            >
              <Filter size={14} />
              Filtrar
            </button>
            
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-900 outline-none"
              >
                <option value="newest">Recientes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Drawer */}
          <aside className={`
            fixed inset-0 z-[10000] bg-white transition-transform duration-300 lg:static lg:z-10 lg:block lg:w-64 lg:bg-transparent lg:translate-x-0
            ${showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="flex flex-col h-full lg:h-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-50 lg:hidden">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Filtros Avanzados</span>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-50 rounded-xl">
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 lg:p-0 space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Buscador</h4>
                  <div className="relative">
                    <input 
                      type="text" placeholder="Ej: Taladro..." defaultValue={q}
                      onBlur={(e) => handleFilterChange('q', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rango de Precio</h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" placeholder="Mín" defaultValue={minPrice}
                      onBlur={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                    />
                    <div className="w-2 h-0.5 bg-gray-200" />
                    <input 
                      type="number" placeholder="Máx" defaultValue={maxPrice}
                      onBlur={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Brands */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Marcas</h4>
                  <div className="flex flex-col gap-1">
                    {brands.map((b) => (
                      <label key={b.uuid} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all ${brand.includes(b.name) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" checked={brand.includes(b.name)}
                          onChange={(e) => {
                            const currentBrands = brand ? brand.split(',') : [];
                            const nextBrands = e.target.checked ? [...currentBrands, b.name] : currentBrands.filter(n => n !== b.name);
                            handleFilterChange('brand', nextBrands.join(','));
                          }}
                          className="w-4 h-4 rounded text-blue-600 border-gray-300"
                        />
                        <span className={`text-[10px] font-black uppercase ${brand.includes(b.name) ? 'text-blue-700' : 'text-gray-600'}`}>
                          {b.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={clearFilters} className="w-full py-3 rounded-xl border border-gray-100 text-[9px] font-black uppercase text-gray-400 lg:hidden">
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                <p className="text-gray-900 text-xs font-black uppercase italic tracking-tighter">Sin resultados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => {
                  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                  return (
                    <div key={product.uuid} className="group flex flex-col rounded-3xl border border-gray-100 bg-white overflow-hidden transition-all hover:border-blue-500 hover:shadow-lg">
                      <Link to={`/products/${product.category.slug}/${product.slug}`} className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-6">
                        {primaryImage ? (
                          <img src={getOptimizedUrl(primaryImage.url, 400, 400, 'pad')} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <div className="text-gray-200 font-black uppercase italic text-[8px]">Sin imagen</div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="absolute top-4 left-4 bg-orange-500 text-white text-[7px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                            Stock: {product.stock}
                          </div>
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[8px] text-blue-600 font-black uppercase tracking-widest mb-1">{product.brand?.name}</p>
                        <Link to={`/products/${product.category.slug}/${product.slug}`} className="mb-3 block text-sm font-black text-gray-900 leading-tight uppercase tracking-tighter italic line-clamp-2">
                          {product.name}
                        </Link>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-gray-900 leading-none italic">${product.price.toLocaleString()}</span>
                          </div>
                          <button 
                            disabled={product.stock === 0}
                            onClick={() => addItem(product, 1)}
                            className="rounded-xl p-3 bg-blue-600 text-white active:bg-black transition-all"
                          >
                            <ShoppingCart size={18} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;
