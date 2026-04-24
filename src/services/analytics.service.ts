/**
 * AnalyticsService - High-Level Observability Layer (v4 - Secure & Stealth)
 * 
 * Orquestador central de métricas. Implementa blindaje de entorno para evitar
 * contaminación de datos en local y elimina logs de consola para mayor seguridad.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// GA4 Standard Event Keys
export type EcommerceEvent = 
  | 'view_item_list'
  | 'select_item'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase';

interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  quantity?: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  
  // Validación de entorno local para bloqueo de métricas
  private isAllowedHost = 
    typeof window !== 'undefined' && 
    !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Pushes a raw event to the dataLayer (Only on allowed hosts)
   */
  public pushEvent(eventName: string, params?: Record<string, any>) {
    if (this.isAllowedHost && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...params,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Tracks SPA page navigation (Only on allowed hosts)
   */
  public trackPageView(url: string, title?: string) {
    if (this.isAllowedHost && window.gtag) {
      window.gtag('event', 'page_view', {
        page_location: url,
        page_title: title || document.title,
      });
    }
  }

  /**
   * Enhanced E-commerce Tracking (GA4 Standard)
   * Maps technical keys to Spanish events for GTM Triggers
   */
  public trackEcommerce(event: EcommerceEvent, items: AnalyticsItem[], extras?: Record<string, any>) {
    const spanishEventMapping: Record<string, string> = {
      'view_item_list': 'visualizacion_catalogo',
      'select_item': 'clic_en_producto',
      'view_item': 'ver_detalle_producto',
      'add_to_cart': 'producto_anadido_al_carrito',
      'remove_from_cart': 'producto_quitado_del_carrito',
      'view_cart': 'revisar_carrito',
      'begin_checkout': 'inicio_proceso_pago',
      'add_shipping_info': 'datos_envio_completados',
      'add_payment_info': 'metodo_pago_seleccionado',
      'purchase': 'compra_exitosa'
    };

    const eventName = spanishEventMapping[event] || event;

    this.pushEvent(eventName, {
      ecommerce: {
        items: items.map(p => ({
          ...p,
          price: Number(p.price.toFixed(2)),
          quantity: p.quantity || 1
        })),
        ...extras
      }
    });
  }

  /**
   * Tracks User Interactions (UI/UX)
   */
  public trackInteraction(action: string, label: string, category: string = 'User Interaction') {
    this.pushEvent('interaccion_usuario', {
      action,
      label,
      category
    });
  }

  /**
   * System Error Tracking
   */
  public trackError(description: string, fatal: boolean = false) {
    this.pushEvent('error_sistema', {
      description,
      fatal
    });
  }
}

export const analytics = AnalyticsService.getInstance();
