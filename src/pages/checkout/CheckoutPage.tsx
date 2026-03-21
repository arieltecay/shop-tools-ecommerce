import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, CreditCard, Tag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import api from '../../services/api';
import { IOrder, IDiscountCode } from '../../types';

interface CheckoutFormData {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    idNumber: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  payment: {
    method: 'bank_transfer' | 'card';
  };
  whatsappConsent: boolean;
}

const CheckoutPage = () => {
  const { items, getTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const total = getTotal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<IOrder | null>(null);
  const decidirRef = useRef<unknown>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<IDiscountCode | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: {
      fullName: '',
      email: '',
      phone: '',
      idNumber: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    },
    payment: {
      method: 'bank_transfer'
    },
    whatsappConsent: true
  });

  useEffect(() => {
    if (formData.payment.method === 'card' && !decidirRef.current && typeof (window as any).Decidir !== 'undefined') {
      // decidirRef.current = new (window as any).Decidir('your_public_key_here');
    }
  }, [formData.payment.method]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.') as [keyof CheckoutFormData, string];
      const sectionData = formData[section];
      if (typeof sectionData === 'object' && sectionData !== null) {
        setFormData(prev => ({
          ...prev,
          [section]: { ...sectionData, [field]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await api.post<{ code: IDiscountCode }>('/discount-codes/validate', {
        code: couponCode,
        email: formData.customer.email,
        orderAmount: total
      });
      setAppliedCoupon(response.data.code);
      setCouponError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cupón no válido';
      setCouponError(message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return total * (appliedCoupon.value / 100);
    }
    return appliedCoupon.value;
  };

  const finalTotal = total - calculateDiscount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.payment.method === 'card') {
        setError('La integración con tarjeta requiere una configuración completa de llaves de Decidir.');
        setLoading(false);
        return;
      }

      const orderData = {
        ...formData,
        items: items.map(item => ({
          product: {
            _id: item._id,
            uuid: item.uuid,
            sku: item.sku,
            name: item.name,
            primaryImageUrl: item.image
          },
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        })),
        pricing: {
          subtotal: total,
          discountCode: appliedCoupon?.code,
          discountAmount: calculateDiscount(),
          shippingCost: 0,
          total: finalTotal
        }
      };

      const response = await api.post<IOrder>('/orders', orderData);
      setOrderConfirmed(response.data);
      clearCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pedido. Intenta de nuevo.';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <CheckCircle2 size={64} className="mx-auto mb-6 text-green-500" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Gracias por tu compra!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Tu pedido <span className="font-bold text-gray-900">#{orderConfirmed.orderNumber}</span> ha sido recibido con éxito.
        </p>
        <div className="bg-blue-50 p-6 rounded-xl text-left border border-blue-100 mb-8">
          <h2 className="font-bold text-blue-800 mb-2">Instrucciones de pago</h2>
          <p className="text-blue-700 text-sm">
            Te hemos enviado un correo electrónico con los datos para realizar la transferencia bancaria. 
            Tu pedido será procesado una vez que verifiquemos el pago.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No hay productos para el checkout</h1>
        <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline">Ir al catálogo</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/cart')} className="rounded-full p-2 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Customer */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm text-white">1</span>
              Datos Personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" name="customer.fullName" placeholder="Nombre completo" required
                value={formData.customer.fullName} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
              <input 
                type="email" name="customer.email" placeholder="Correo electrónico" required
                value={formData.customer.email} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
              <input 
                type="tel" name="customer.phone" placeholder="Teléfono / WhatsApp" required
                value={formData.customer.phone} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
              <input 
                type="text" name="customer.idNumber" placeholder="DNI / CUIT"
                value={formData.customer.idNumber} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Shipping */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm text-white">2</span>
              Dirección de Envío
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" name="shippingAddress.street" placeholder="Calle y número" required
                value={formData.shippingAddress.street} onChange={handleInputChange}
                className="md:col-span-2 rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
              <input 
                type="text" name="shippingAddress.city" placeholder="Ciudad" required
                value={formData.shippingAddress.city} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
              <select 
                name="shippingAddress.province" required
                value={formData.shippingAddress.province} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Seleccionar provincia</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="CABA">Capital Federal</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Santa Fe">Santa Fe</option>
                <option value="Tucumán">Tucumán</option>
              </select>
              <input 
                type="text" name="shippingAddress.postalCode" placeholder="Código Postal" required
                value={formData.shippingAddress.postalCode} onChange={handleInputChange}
                className="rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 3: Payment */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm text-white">3</span>
              Método de Pago
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                formData.payment.method === 'bank_transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" name="payment.method" value="bank_transfer"
                  checked={formData.payment.method === 'bank_transfer'}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600"
                />
                <div>
                  <p className="font-bold text-gray-900">Transferencia Bancaria</p>
                  <p className="text-sm text-gray-500">Te enviamos los datos por email para que pagues.</p>
                </div>
              </label>
              
              <label className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                formData.payment.method === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" name="payment.method" value="card"
                  checked={formData.payment.method === 'card'}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600"
                />
                <div>
                  <p className="font-bold text-gray-900">Tarjeta de Crédito / Débito</p>
                  <p className="text-sm text-gray-500">Pago seguro vía Decidir (BBVA).</p>
                </div>
              </label>

              {formData.payment.method === 'card' && (
                <div className="mt-4 p-6 bg-white border rounded-xl space-y-4 border-blue-200 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-sm uppercase">
                    <CreditCard size={16} /> Datos de la tarjeta
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Número de tarjeta</label>
                      <div id="card-number" className="h-10 border rounded-lg p-2 bg-gray-50 flex items-center text-gray-400 text-xs italic">Iframe de Decidir</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Vencimiento</label>
                        <div id="expiry-date" className="h-10 border rounded-lg p-2 bg-gray-50 flex items-center text-gray-400 text-xs italic">Iframe de Decidir</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">CVV</label>
                        <div id="security-code" className="h-10 border rounded-lg p-2 bg-gray-50 flex items-center text-gray-400 text-xs italic">Iframe de Decidir</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Tus datos son procesados de forma segura por Decidir. No guardamos información de tu tarjeta.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <input 
              type="checkbox" id="whatsapp"
              checked={formData.whatsappConsent}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsappConsent: e.target.checked }))}
              className="mt-1 h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="whatsapp" className="text-sm text-gray-600 cursor-pointer">
              Acepto recibir notificaciones sobre el estado de mi pedido por WhatsApp.
            </label>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h2>
            <div className="max-h-64 overflow-y-auto mb-4 space-y-4 pr-2">
              {items.map(item => (
                <div key={item.uuid} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-600">{item.quantity}x {item.name}</span>
                  <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="border-t pt-4 mt-4 space-y-3">
              <label className="text-sm font-bold text-gray-700 block">¿Tienes un cupón?</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Código" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 uppercase disabled:bg-gray-50"
                />
                {!appliedCoupon ? (
                  <button 
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors disabled:bg-gray-300"
                  >
                    {couponLoading ? <Loader2 className="animate-spin" size={16} /> : 'Aplicar'}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    className="text-red-500 text-xs font-bold hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Tag size={14} />
                  <span>Descuento aplicado: {appliedCoupon.code} ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`})</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-gray-600 border-t pt-4 border-b pb-4 mb-4 mt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-${calculateDiscount().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>
            </div>
            <div className="flex justify-between mb-8">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-blue-600">${finalTotal.toLocaleString()}</span>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
