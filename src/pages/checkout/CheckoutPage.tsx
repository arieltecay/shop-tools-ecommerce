import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, CreditCard, Tag, ShieldCheck, Truck, ReceiptText } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import api from '../../services/api';
import { IOrder, IDiscountCode } from '../../types';

interface CheckoutFormData {
  customer: { fullName: string; email: string; phone: string; idNumber: string; };
  shippingAddress: { street: string; city: string; province: string; postalCode: string; };
  payment: { method: 'bank_transfer' | 'card'; };
  whatsappConsent: boolean;
}

const CheckoutPage = () => {
  const { items, getTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const total = getTotal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<IOrder | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<IDiscountCode | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: { fullName: '', email: '', phone: '', idNumber: '' },
    shippingAddress: { street: '', city: '', province: '', postalCode: '' },
    payment: { method: 'bank_transfer' },
    whatsappConsent: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.') as [keyof CheckoutFormData, string];
      const sectionData = formData[section] as any;
      setFormData(prev => ({ ...prev, [section]: { ...sectionData, [field]: value } }));
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
        code: couponCode, email: formData.customer.email, orderAmount: total
      });
      setAppliedCoupon(response.data.code);
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Cupón no válido');
      setAppliedCoupon(null);
    } finally { setLoading(false); setCouponLoading(false); }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.type === 'percentage' ? total * (appliedCoupon.value / 100) : appliedCoupon.value;
  };

  const finalTotal = total - calculateDiscount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (formData.payment.method === 'card') {
        setError('PAGO CON TARJETA EN MANTENIMIENTO. POR FAVOR USE TRANSFERENCIA.');
        setLoading(false);
        return;
      }
      const orderData = {
        ...formData,
        items: items.map(item => ({
          product: { _id: item._id, uuid: item.uuid, sku: item.sku, name: item.name, primaryImageUrl: item.image },
          quantity: item.quantity, unitPrice: item.price, subtotal: item.price * item.quantity
        })),
        pricing: { subtotal: total, discountCode: appliedCoupon?.code, discountAmount: calculateDiscount(), shippingCost: 0, total: finalTotal }
      };
      const response = await api.post<IOrder>('/orders', orderData);
      setOrderConfirmed(response.data);
      clearCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'ERROR EN EL PROCESAMIENTO');
    } finally { setLoading(false); }
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-50 mb-6 border border-green-100 animate-bounce">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">Orden Confirmada</h1>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">PEDIDO #{orderConfirmed.orderNumber}</p>
        
        <div className="bg-blue-50/50 p-6 rounded-2xl text-left border border-blue-100 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <ReceiptText size={18} className="text-blue-600" />
            <h2 className="text-[11px] font-black text-blue-900 uppercase tracking-widest italic">Instrucciones de Pago</h2>
          </div>
          <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">
            Hemos enviado un comprobante a <span className="underline">{formData.customer.email}</span> con los datos bancarios. 
            Su pedido será despachado una vez validado el ingreso de los fondos.
          </p>
        </div>
        <button onClick={() => navigate('/')} className="rounded-xl bg-gray-900 px-10 py-4 text-[11px] font-black uppercase tracking-widest text-white hover:bg-black shadow-xl transition-all active:scale-95">
          Finalizar y Volver
        </button>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all";
  const labelClass = "text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1 block";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/cart')} className="rounded-xl p-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Checkout Profesional</h1>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estación de despacho seguro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white italic">01</span>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Identificación del Cliente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Nombre Completo</label>
                <input type="text" name="customer.fullName" placeholder="EJ: JUAN PÉREZ" required value={formData.customer.fullName} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Correo Electrónico</label>
                <input type="email" name="customer.email" placeholder="EJ: JUAN@GMAIL.COM" required value={formData.customer.email} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>WhatsApp de Contacto</label>
                <input type="tel" name="customer.phone" placeholder="EJ: 54911..." required value={formData.customer.phone} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>DNI / CUIT (FACTURACIÓN)</label>
                <input type="text" name="customer.idNumber" placeholder="SIN PUNTOS" value={formData.customer.idNumber} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 2: Shipping */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white italic">02</span>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Logística de Entrega</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className={labelClass}>Calle y Altura / Piso / Depto</label>
                <input type="text" name="shippingAddress.street" placeholder="EJ: AV. RIVADAVIA 1234, 4TO B" required value={formData.shippingAddress.street} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Ciudad / Localidad</label>
                <input type="text" name="shippingAddress.city" placeholder="EJ: ROSARIO" required value={formData.shippingAddress.city} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Provincia</label>
                <select name="shippingAddress.province" required value={formData.shippingAddress.province} onChange={handleInputChange} className={inputClass}>
                  <option value="">SELECCIONAR...</option>
                  <option value="Buenos Aires">BUENOS AIRES</option>
                  <option value="CABA">CAPITAL FEDERAL</option>
                  <option value="Córdoba">CÓRDOBA</option>
                  <option value="Santa Fe">SANTA FE</option>
                  <option value="Tucumán">TUCUMÁN</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Código Postal</label>
                <input type="text" name="shippingAddress.postalCode" placeholder="EJ: 1000" required value={formData.shippingAddress.postalCode} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 3: Payment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white italic">03</span>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Medio de Pago Seguro</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                formData.payment.method === 'bank_transfer' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50/50' : 'border-gray-100 bg-gray-50 hover:bg-white'
              }`}>
                <input type="radio" name="payment.method" value="bank_transfer" checked={formData.payment.method === 'bank_transfer'} onChange={handleInputChange} className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Transferencia</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Sin recargos</p>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                formData.payment.method === 'card' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50/50' : 'border-gray-100 bg-gray-50 hover:bg-white'
              }`}>
                <input type="radio" name="payment.method" value="card" checked={formData.payment.method === 'card'} onChange={handleInputChange} className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Tarjeta BBVA</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Vía Decidir (Safe)</p>
                </div>
              </label>
            </div>

            {formData.payment.method === 'card' && (
              <div className="mt-4 p-5 bg-blue-900 rounded-2xl space-y-4 border border-blue-800 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> Encriptación 256-bit activa
                  </div>
                  <CreditCard className="text-blue-400 opacity-50" size={24} />
                </div>
                <div className="space-y-3">
                  <div id="card-number" className="h-10 border border-blue-700 rounded-xl p-3 bg-blue-950/50 flex items-center text-blue-300 text-[10px] font-mono italic">NUMERO DE TARJETA (FRAME DECIDIR)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div id="expiry-date" className="h-10 border border-blue-700 rounded-xl p-3 bg-blue-950/50 flex items-center text-blue-300 text-[10px] font-mono italic">MM/YY</div>
                    <div id="security-code" className="h-10 border border-blue-700 rounded-xl p-3 bg-blue-950/50 flex items-center text-blue-300 text-[10px] font-mono italic">CVV</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl shadow-blue-900/20 sticky top-24">
            <h2 className="text-[11px] font-black uppercase tracking-widest italic mb-6 text-blue-400">Resumen de Despacho</h2>
            
            <div className="max-h-48 overflow-y-auto mb-6 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-blue-800">
              {items.map(item => (
                <div key={item.uuid} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase leading-tight italic">{item.name}</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">CANT: {item.quantity}</p>
                  </div>
                  <span className="text-[10px] font-black italic tracking-tighter">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-2 block italic">Cupón de Descuento</label>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="CÓDIGO" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon} className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-[10px] font-black outline-none focus:border-blue-500 uppercase disabled:opacity-50"
                />
                <button 
                  type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode || !!appliedCoupon}
                  className="bg-blue-600 text-[9px] font-black uppercase px-3 py-2 rounded-xl hover:bg-blue-700 disabled:bg-gray-700 transition-all"
                >
                  {couponLoading ? <Loader2 className="animate-spin" size={12} /> : (appliedCoupon ? <CheckCircle2 size={12} /> : 'APLICAR')}
                </button>
              </div>
              {appliedCoupon && (
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="mt-2 text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline italic">Remover Cupón</button>
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-white">${total.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">
                  <span>Descuento</span>
                  <span>-${calculateDiscount().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Logística</span>
                <span className="text-emerald-400 flex items-center gap-1"><Truck size={10} /> GRATIS</span>
              </div>
              <div className="flex justify-between text-lg font-black italic tracking-tighter pt-2 border-t border-white/10">
                <span className="text-blue-400 uppercase text-xs">Total Final</span>
                <span className="text-2xl">${finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20 italic">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-5 text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 transition-all hover:bg-blue-700 hover:-translate-y-1 active:scale-95 disabled:bg-gray-800 disabled:text-gray-600 italic"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Confirmar y Despachar'}
            </button>
            <p className="mt-4 text-[7px] text-gray-600 font-black uppercase tracking-widest text-center">Transferencia o Tarjeta BBVA Certificada</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
