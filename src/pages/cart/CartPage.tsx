import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const navigate = useNavigate();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 text-gray-300">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">¿Aún no sabes qué comprar? Tenemos miles de herramientas esperándote.</p>
        <Link to="/products" className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700 transition-colors">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Carrito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.uuid} className="flex gap-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border">
                <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 uppercase mt-1">SKU: {item.sku}</p>
                  </div>
                  <button 
                    onClick={() => removeItem(item.uuid)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button 
                      onClick={() => updateQuantity(item.uuid, item.quantity - 1)}
                      className="p-1 hover:bg-gray-50"
                    ><Minus size={16} /></button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.uuid, item.quantity + 1)}
                      className="p-1 hover:bg-gray-50"
                    ><Plus size={16} /></button>
                  </div>
                  <span className="font-bold text-gray-900">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          <Link to="/products" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline">
            <ArrowLeft size={18} />
            Continuar comprando
          </Link>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen de compra</h2>
            <div className="space-y-3 text-sm text-gray-600 border-b pb-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} productos)</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-green-600 font-medium">Calculado en el checkout</span>
              </div>
            </div>
            <div className="flex justify-between pt-4 mb-6">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">${total.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
            >
              Finalizar Compra
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">
            Aceptamos tarjetas de crédito, débito y transferencia bancaria.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
