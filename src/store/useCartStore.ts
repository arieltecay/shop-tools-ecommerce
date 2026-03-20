import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  uuid: string;
  _id: string; // Internal ID needed for order creation
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: any, quantity: number) => void;
  removeItem: (uuid: string) => void;
  updateQuantity: (uuid: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const items = get().items;
        const existingItem = items.find((i) => i.uuid === product.uuid);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.uuid === product.uuid
                ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                uuid: product.uuid,
                _id: product._id,
                name: product.name,
                price: product.price,
                quantity,
                image: product.images.find((img: any) => img.isPrimary)?.url || product.images[0]?.url,
                sku: product.sku,
                stock: product.stock
              },
            ],
          });
        }
      },
      removeItem: (uuid) => {
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
      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
