import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Search, Filter, Loader2, ShoppingCart, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import { IProduct, ICategory, IBrand } from '../../types';
import { getOptimizedUrl } from '../../utils/image-utils';

const ProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  };

  const currentCategoryName = categories.find(c => c.slug === categorySlug)?.name || 'Catálogo';
  const seoTitle = `${currentCategoryName} | Tools Store`;
  const seoDescription = `Explora nuestro catálogo de ${currentCategoryName.toLowerCase()}. Herramientas profesionales de alta calidad al mejor precio.`;

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
      </Helmet>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between border-bottom pb-4 border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Filter size={20} className="text-blue-600" />
              Filtros
            </h3>
            {(brand || minPrice || maxPrice || q) && (
              <button 
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Buscar</h4>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nombre o SKU..."
                defaultValue={q}
                onBlur={(e) => handleFilterChange('q', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('q', (e.target as HTMLInputElement).value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Precio</h4>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Min"
                defaultValue={minPrice}
                onBlur={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="number" 
                placeholder="Max"
                defaultValue={maxPrice}
                onBlur={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Marcas</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
              {brands.map((b) => (
                <label key={b.uuid} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={brand.includes(b.name)}
                    onChange={(e) => {
                      const currentBrands = brand ? brand.split(',') : [];
                      let nextBrands;
                      if (e.target.checked) {
                        nextBrands = [...currentBrands, b.name];
                      } else {
                        nextBrands = currentBrands.filter(name => name !== b.name);
                      }
                      handleFilterChange('brand', nextBrands.join(','));
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition-colors"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">{b.name}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {currentCategoryName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Mostrando {products.length} productos</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 whitespace-nowrap">Ordenar por:</span>
              <div className="relative">
                <select 
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                >
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="oldest">Más antiguos</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-96 items-center justify-center bg-white/50 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="text-gray-500 font-medium">Buscando herramientas...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-8 rounded-2xl text-red-700 text-center border border-red-100 font-medium">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-900 text-xl font-bold mb-2">No encontramos coincidencias</p>
              <p className="text-gray-500 max-w-sm mx-auto">Prueba ajustando los filtros o realizando una búsqueda más general.</p>
              <button onClick={clearFilters} className="mt-6 text-blue-600 font-bold hover:underline underline-offset-4">
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => {
                const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                return (
                  <div key={product.uuid} className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <Link to={`/products/${product.category.slug}/${product.slug}`} className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-gray-50 flex items-center justify-center p-4">
                      {primaryImage ? (
                        <img 
                          src={getOptimizedUrl(primaryImage.url, 400, 300, 'pad')} 
                          alt={product.name}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300 font-bold">Sin imagen</div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-3 left-3 bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                          ¡Últimas unidades!
                        </span>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="bg-gray-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase">Agotado</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">{product.brand?.name}</p>
                      <Link to={`/products/${product.category.slug}/${product.slug}`} className="mb-3 block text-base font-bold text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors">
                        {product.name}
                      </Link>
                      <div className="mt-auto flex items-end justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-2xl font-black text-gray-900 leading-none">
                            ${product.price.toLocaleString()}
                          </span>
                        </div>
                        <button 
                          disabled={product.stock === 0}
                          className={`rounded-xl p-3 text-white transition-all shadow-lg ${product.stock === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:scale-95'}`}
                        >
                          <ShoppingCart size={20} strokeWidth={3} />
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
  );
};

export default ProductCatalog;
