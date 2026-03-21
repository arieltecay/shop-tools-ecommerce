// src/utils/whatsapp-utils.ts

/**
 * Genera un enlace de "Click to Chat" de WhatsApp con un mensaje pre-cargado.
 * El número de teléfono se obtiene de las variables de entorno.
 *
 * @param productName - El nombre del producto para incluir en el mensaje.
 * @param productSku - El SKU del producto para incluir en el mensaje.
 * @returns La URL completa y codificada para WhatsApp.
 */
export const getWhatsAppLink = (productName: string, productSku: string): string => {
  // Obtener el número de WhatsApp desde las variables de entorno de Vite
  const whatsAppNumber = import.meta.env.VITE_WHATSAPP_NUMBER;

  if (!whatsAppNumber) {
    console.error("La variable de entorno VITE_WHATSAPP_NUMBER no está definida.");
    // Devuelve un enlace a la página de inicio o un enlace nulo para evitar errores
    return '/'; 
  }

  const message = `Hola, estoy interesado en el producto: *${productName}* (SKU: ${productSku}). ¿Podrían darme más información?`;
  
  return `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
};
