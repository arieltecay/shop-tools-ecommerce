import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IProduct, IProductImage } from '../types';
import { analytics } from '../services/analytics.service';

interface CartItem {
  uuid: string;
  _id: string; 
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: IProduct, quantity: number) => void;
  removeItem: (uuid: string) => void;
  updateQuantity: (uuid: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.uuid === product.uuid);

        // Tracking de e-commerce (add_to_cart)
        analytics.trackEcommerce('add_to_cart', [{
          item_id: product._id,
          item_name: product.name,
          price: product.price,
          quantity
        }]);


        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.uuid === product.uuid
                ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...currentItems,
              {
                uuid: product.uuid,
                _id: product._id,
                name: product.name,
                price: product.price,
                quantity,
                image: product.images.find((img: IProductImage) => img.isPrimary)?.url || product.images[0]?.url,
                sku: product.sku,
                stock: product.stock
              },
            ],
          });
        }
      },
      removeItem: (uuid) => {
        const itemToRemove = get().items.find(i => i.uuid === uuid);
        if (itemToRemove) {
          // Tracking de e-commerce (remove_from_cart)
          analytics.trackEcommerce('remove_from_cart', [{
            item_id: itemToRemove._id,
            item_name: itemToRemove.name,
            price: itemToRemove.price,
            quantity: itemToRemove.quantity
          }]);

        }
        set({ items: get().items.filter((i) => i.uuid !== uuid) });
      },
      updateQuantity: (uuid, quantity) => {
        set({
          items: get().items.map((i) =>
            i.uuid === uuid ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
