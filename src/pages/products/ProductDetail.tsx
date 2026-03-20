import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import { useCartStore } from '../../store/useCartStore';
import { IProduct } from '../../types';
import { getOptimizedUrl } from '../../utils/image-utils';

const ProductDetail = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productSlug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get<IProduct>(`/products/slug/${productSlug}`);
      setProduct(response.data);
      if (response.data.images && response.data.images.length > 0) {
        const primaryIdx = response.data.images.findIndex(img => img.isPrimary);
        setActiveImage(primaryIdx !== -1 ? primaryIdx : 0);
      }
      setError(null);
    } catch (err) {
      setError('Producto no encontrado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Helmet>
          <title>Producto no encontrado | Tools Store</title>
        </Helmet>
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
        <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline">
          Volver al catálogo
        </button>
      </div>
    );
  }

  const mainImageUrl = product.images?.[activeImage]?.url;
  const pageTitle = `${product.name} | ${product.brand?.name || 'Tools Store'}`;
  const pageDescription = product.shortDescription || `Compra ${product.name} en Tools Store. Calidad profesional al mejor precio.`;

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {mainImageUrl && <meta property="og:image" content={getOptimizedUrl(mainImageUrl, 1200, 630, 'pad')} />}
        <meta property="og:type" content="product" />
      </Helmet>

      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-4">
            {product.images && product.images.length > 0 ? (
              <img 
                src={getOptimizedUrl(mainImageUrl, 800, 800, 'pad')} 
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">No image</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-20 flex-shrink-0 rounded-lg border-2 transition-all ${
                    activeImage === idx ? 'border-blue-600' : 'border-transparent hover:border-gray-200'
                  } overflow-hidden bg-gray-50 p-1`}
                >
                  <img src={getOptimizedUrl(img.url, 150, 150, 'pad')} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{product.brand?.name}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
          <p className="mt-1 text-xs font-medium text-gray-400">SKU: {product.sku}</p>

          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-4xl font-black text-gray-900">${product.price.toLocaleString()}</span>
            <span className="text-sm text-gray-400">IVA incluido</span>
          </div>

          <div className="mt-6 border-t border-b border-gray-100 py-6">
            <p className="text-gray-600 leading-relaxed text-lg">{product.shortDescription}</p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold"
                >-</button>
                <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold"
                >+</button>
              </div>
              <div>
                {product.stock > 0 ? (
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                      <Check size={16} strokeWidth={3} /> En stock
                    </span>
                    <span className="text-xs text-gray-400">{product.stock} disponibles</span>
                  </div>
                ) : (
                  <span className="text-red-600 font-bold flex items-center gap-1.5">
                    <AlertCircle size={16} strokeWidth={3} /> Sin stock
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0 || added}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-5 text-xl font-black text-white transition-all shadow-xl ${
                added ? 'bg-green-600 shadow-green-200 scale-[0.98]' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5 active:scale-95'
              } disabled:bg-gray-200 disabled:shadow-none disabled:translate-y-0 disabled:scale-100`}
            >
              {added ? <Check size={28} strokeWidth={3} /> : <ShoppingCart size={28} />}
              {added ? '¡EN EL CARRITO!' : 'COMPRAR AHORA'}
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-20 border-t border-gray-100 pt-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black text-gray-900 mb-8">Información Técnica</h2>
          <div 
            className="prose prose-blue prose-lg max-w-none text-gray-600 leading-relaxed
              prose-headings:font-black prose-headings:text-gray-900
              prose-strong:text-gray-900 prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: product.longDescription }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
