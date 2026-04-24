import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Truck, ReceiptText, MapPin, Warehouse, ExternalLink, Banknote, Check, CreditCard, Building2 } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import api from '../../services/api';
import { IOrder, IDiscountCode } from '../../types';
import axios, { AxiosError } from 'axios';
import { analytics } from '../../services/analytics.service';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const LIBRARIES: ("places")[] = ["places"];

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
    method: 'cash' | 'bank_transfer' | 'bbva';
  };
  shippingMethod: 'pickup' | 'uber';
  pickupLocationId: string;
  whatsappConsent: boolean;
}

interface IPickupLocation {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

const CheckoutPage = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { items, getTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const total = getTotal();
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: { fullName: '', email: '', phone: '', idNumber: '' },
    shippingAddress: { street: '', city: '', province: 'Tucumán', postalCode: '' },
    payment: { method: 'cash' },
    shippingMethod: 'pickup',
    pickupLocationId: '',
    whatsappConsent: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<IOrder | null>(null);

  const [pickupLocations, setPickupLocations] = useState<IPickupLocation[]>([]);
  const [uberQuote, setUberQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<IDiscountCode | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get<IPickupLocation[]>('/pickup-locations');
        setPickupLocations(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, pickupLocationId: response.data[0]._id }));
        }
      } catch (err) {
        console.error('Error al cargar sucursales');
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const getQuote = async () => {
      const { street, city, province } = formData.shippingAddress;
      if (formData.shippingMethod === 'uber' && street && city && province && formData.pickupLocationId) {
        setQuoteLoading(true);
        try {
          const fullAddress = `${street}, ${city}, ${province}, Argentina`;
          const response = await api.post('/uber/quote', {
            pickupLocationId: formData.pickupLocationId,
            dropoffAddress: fullAddress
          });
          setUberQuote(response.data);
          setError(null);
        } catch (err: any) {
          setUberQuote(null);
          setError('No hay servicio de Uber disponible o faltan datos de dirección.');
        } finally {
          setQuoteLoading(false);
        }
      } else {
        setUberQuote(null);
      }
    };

    const timeoutId = setTimeout(getQuote, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.shippingAddress, formData.shippingMethod, formData.pickupLocationId]);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (!place || !place.address_components) return;

      let streetNumber = '';
      let route = '';
      let city = '';
      let postalCode = '';

      for (const component of place.address_components) {
        const type = component.types[0];
        if (type === "street_number") streetNumber = component.long_name;
        if (type === "route") route = component.long_name;
        if (type === "locality") city = component.long_name;
        if (type === "postal_code") postalCode = component.long_name;
      }

      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          street: `${route} ${streetNumber}`.trim(),
          city,
          province: 'Tucumán',
          postalCode
        }
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Tracking: Método de Envío
    if (name === 'shippingMethod') {
      analytics.trackInteraction('select_shipping_method', value, 'Checkout');
    }

    // Tracking: Medio de Pago
    if (name === 'payment.method') {
      analytics.trackInteraction('select_payment_method', value, 'Checkout');
    }

    if (name.includes('.')) {
      const [section, field] = name.split('.') as [keyof CheckoutFormData, string];
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section as keyof typeof prev.customer | keyof typeof prev.shippingAddress | keyof typeof prev.payment] as any, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.type === 'percentage' ? total * (appliedCoupon.value / 100) : appliedCoupon.value;
  };

  const shippingCost = uberQuote ? (uberQuote.quote.fee / 100) : 0;
  const finalTotal = total - calculateDiscount() + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.shippingMethod === 'uber' && !uberQuote) {
      setError('POR FAVOR, BUSQUE UNA DIRECCIÓN VÁLIDA PARA EL ENVÍO.');
      setLoading(false); return;
    }

    const selectedLoc = pickupLocations.find(l => l._id === formData.pickupLocationId);

    try {
      const orderData = {
        customer: formData.customer,
        shippingAddress: formData.shippingAddress,
        items: items.map(i => ({ 
          product: { 
            _id: i._id, 
            uuid: i.uuid, 
            sku: i.sku, 
            name: i.name, 
            primaryImageUrl: i.image 
          }, 
          quantity: i.quantity, 
          unitPrice: i.price, 
          subtotal: i.price * i.quantity 
        })),
        pricing: { 
          subtotal: total, 
          discountCode: appliedCoupon?.code, 
          discountAmount: calculateDiscount(), 
          shippingCost, 
          total: finalTotal 
        },
        shipping: {
          method: formData.shippingMethod,
          carrier: formData.shippingMethod === 'uber' ? 'Uber Direct' : 'Retiro en Local',
          pickupLocation: selectedLoc ? {
            id: selectedLoc._id,
            name: selectedLoc.name,
            address: `${selectedLoc.address.street}, ${selectedLoc.address.city}`,
            coordinates: selectedLoc.address.coordinates
          } : undefined,
          uber: formData.shippingMethod === 'uber' ? { 
            quoteId: uberQuote.quote.quote_id, 
            fee: shippingCost 
          } : undefined,
          destinationCoordinates: uberQuote?.coordinates
        },
        payment: {
          method: formData.payment.method,
          status: 'pending'
        },
        whatsappConsent: formData.whatsappConsent,
        source: 'storefront'
      };

      const response = await api.post<IOrder>('/orders', orderData);
      setOrderConfirmed(response.data);
      clearCart();
    } catch (err: any) {
      console.error('Error creating order:', err.response?.data);
      setError(err.response?.data?.message || 'ERROR AL CREAR LA ORDEN. INTENTE NUEVAMENTE.');
    } finally {
      setLoading(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100"><CheckCircle2 size={40} className="text-green-500" /></div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">¡Pedido Recibido!</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8">NÚMERO DE ORDEN: #{orderConfirmed.orderNumber}</p>
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-8 text-left">
          <div className="flex items-center gap-2 mb-3 text-blue-900 font-black uppercase text-[11px]"><ReceiptText size={16} /> Próximos Pasos</div>
          <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed">Nos pondremos en contacto contigo vía WhatsApp para coordinar el pago y la entrega.</p>
        </div>
        <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">Finalizar</button>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[12px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all";
  const labelClass = "text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1 block";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/cart')} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Finalizar Compra</h1>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tucumán, Argentina</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-200 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">01</span>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Tus Datos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="customer.fullName" placeholder="NOMBRE COMPLETO" required value={formData.customer.fullName} onChange={handleInputChange} className={inputClass} />
              <input type="email" name="customer.email" placeholder="CORREO ELECTRÓNICO" required value={formData.customer.email} onChange={handleInputChange} className={inputClass} />
              <input type="tel" name="customer.phone" placeholder="WHATSAPP DE CONTACTO" required value={formData.customer.phone} onChange={handleInputChange} className={inputClass} />
              <input type="text" name="customer.idNumber" placeholder="DNI / CUIT (FACTURACIÓN)" value={formData.customer.idNumber} onChange={handleInputChange} className={inputClass} />
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-200 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">02</span>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Método de Entrega</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${formData.shippingMethod === 'pickup' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="shippingMethod" value="pickup" checked={formData.shippingMethod === 'pickup'} onChange={handleInputChange} className="h-4 w-4 text-blue-600" />
                <div><p className="text-[10px] font-black uppercase text-gray-900">Retiro en Local</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Gratis $0</p></div>
              </label>
              <label className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${formData.shippingMethod === 'uber' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="shippingMethod" value="uber" checked={formData.shippingMethod === 'uber'} onChange={handleInputChange} className="h-4 w-4 text-blue-600" />
                <div><p className="text-[10px] font-black uppercase text-gray-900">Envío Uber Direct</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{quoteLoading ? 'CALCULANDO...' : 'Costo Dinámico'}</p></div>
              </label>
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-50">
              <p className={labelClass}>Seleccionar Punto de Origen / Retiro</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pickupLocations.map(loc => (
                  <div key={loc._id} onClick={() => setFormData(prev => ({ ...prev, pickupLocationId: loc._id }))} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.pickupLocationId === loc._id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3"><div className={`p-2 rounded-xl ${formData.pickupLocationId === loc._id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}><Warehouse size={20} /></div>{formData.pickupLocationId === loc._id && <CheckCircle2 size={16} className="text-blue-600" />}</div>
                    <h3 className="text-[11px] font-black uppercase text-gray-900 mb-1">{loc.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight mb-4">{loc.address.street}, {loc.address.city}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${loc.address.coordinates.lat},${loc.address.coordinates.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase hover:underline"><ExternalLink size={10} /> Ver Mapa</a>
                  </div>
                ))}
              </div>
              {formData.shippingMethod === 'uber' && (
                <div className="space-y-4 pt-4 animate-in fade-in duration-500">
                  <p className={labelClass}>¿A dónde lo enviamos? (Tucumán)</p>
                  {isLoaded ? <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged} options={{ componentRestrictions: { country: "ar" }, bounds: new google.maps.LatLngBounds(new google.maps.LatLng(-27.6, -65.9), new google.maps.LatLng(-26.3, -64.4)) }}><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="ESCRIBE TU CALLE Y ALTURA..." className={`${inputClass} pl-12 h-14 text-[14px] shadow-sm`} /></div></Autocomplete> : <div className="h-14 bg-gray-50 rounded-2xl animate-pulse" />}
                  {formData.shippingAddress.street && <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={16} /></div><div><p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Dirección Detectada</p><p className="text-[11px] font-black text-emerald-900 uppercase">{formData.shippingAddress.street}, {formData.shippingAddress.city}</p></div></div>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-200 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">03</span><h2 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Medio de Pago</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`relative flex flex-col gap-3 rounded-[24px] border-2 p-5 cursor-pointer transition-all ${formData.payment.method === 'cash' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200 bg-white'}`}><input type="radio" name="payment.method" value="cash" checked={formData.payment.method === 'cash'} onChange={handleInputChange} className="absolute top-4 right-4 h-4 w-4 text-blue-600" /><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${formData.payment.method === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}><Banknote size={20} /></div><div><p className="text-[11px] font-black uppercase text-gray-900">Efectivo</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Al retirar / recibir</p></div></label>
              <div className="relative flex flex-col gap-3 rounded-[24px] border-2 border-gray-50 p-5 bg-gray-50/50 opacity-60 cursor-not-allowed"><span className="absolute top-3 right-3 bg-gray-200 text-gray-500 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Próximamente</span><div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-300 flex items-center justify-center"><Building2 size={20} /></div><div><p className="text-[11px] font-black uppercase text-gray-300">Transferencia</p><p className="text-[9px] font-bold text-gray-300 uppercase tracking-tight">CBU / Alias</p></div></div>
              <div className="relative flex flex-col gap-3 rounded-[24px] border-2 border-gray-50 p-5 bg-gray-50/50 opacity-60 cursor-not-allowed"><span className="absolute top-3 right-3 bg-gray-200 text-gray-500 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Próximamente</span><div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-300 flex items-center justify-center"><CreditCard size={20} /></div><div><p className="text-[11px] font-black uppercase text-gray-300">Tarjeta BBVA</p><p className="text-[9px] font-bold text-gray-300 uppercase tracking-tight">Vía Decidir</p></div></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-900 rounded-[32px] p-8 text-white sticky top-24 shadow-2xl shadow-blue-900/20">
            <h2 className="text-[11px] font-black uppercase mb-8 text-blue-400 tracking-widest">Resumen de Orden</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase"><span>Subtotal</span><span>${total.toLocaleString()}</span></div>
              <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase"><span>Envío</span><span>{shippingCost > 0 ? `$${shippingCost.toLocaleString()}` : 'GRATIS'}</span></div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-end"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Final</span><span className="text-3xl font-black tracking-tighter leading-none">${finalTotal.toLocaleString()}</span></div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/10 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">{formData.payment.method === 'cash' ? <Banknote size={20} /> : <CreditCard size={20} />}</div><div><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Medio de Pago</p><p className="text-[10px] font-black text-white uppercase">{formData.payment.method === 'cash' ? 'Efectivo / A Coordinar' : formData.payment.method === 'bank_transfer' ? 'Transferencia' : 'Tarjeta BBVA'}</p></div></div>
            {error && <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase text-center">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[13px] shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Compra'}</button>
            <p className="text-center text-[7px] text-gray-500 font-black uppercase tracking-[0.3em] mt-6">Gestión Segura via Tools E-Commerce</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
