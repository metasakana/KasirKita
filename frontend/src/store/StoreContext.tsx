import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Product = {
  id: string;
  name: string;
  qty: number;
  costPrice: number; // harga modal / beli
  sellPrice: number; // harga jual
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type TxItem = {
  productId: string;
  name: string;
  qty: number;
  sellPrice: number;
  costPrice: number;
};

export type Transaction = {
  id: string;
  items: TxItem[];
  subtotal: number;
  totalCost: number;
  profit: number;
  paid: number;
  change: number;
  createdAt: string;
};

export const CATEGORIES = [
  "Sembako",
  "Minuman",
  "Snacking",
  "Sabun/Detergen",
  "Rokok",
  "Lainnya",
];

export const LOW_STOCK_THRESHOLD = 5;

const KEY_PRODUCTS = "wp_products";
const KEY_TX = "wp_transactions";
const KEY_STORE_NAME = "wp_store_name";
const KEY_SEEDED = "wp_seeded_v1";
const PIN_KEY = "wp_pin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowIso(): string {
  return new Date().toISOString();
}

const SEED: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Minyak Goreng Bimoli 1L", qty: 12, costPrice: 16000, sellPrice: 19000, category: "Sembako" },
  { name: "Beras Pandan Wangi 5kg", qty: 8, costPrice: 62000, sellPrice: 70000, category: "Sembako" },
  { name: "Gula Pasir 1kg", qty: 3, costPrice: 14000, sellPrice: 16000, category: "Sembako" },
  { name: "Aqua Botol 600ml", qty: 24, costPrice: 2500, sellPrice: 4000, category: "Minuman" },
  { name: "Teh Botol Sosro 350ml", qty: 18, costPrice: 3000, sellPrice: 5000, category: "Minuman" },
  { name: "Chitato Sapi Panggang", qty: 15, costPrice: 8000, sellPrice: 11000, category: "Snacking" },
  { name: "Indomie Goreng", qty: 40, costPrice: 2800, sellPrice: 3500, category: "Sembako" },
  { name: "Rinso Deterjen 770g", qty: 4, costPrice: 18000, sellPrice: 22000, category: "Sabun/Detergen" },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type StoreCtx = {
  ready: boolean;
  products: Product[];
  transactions: Transaction[];
  storeName: string;

  // auth
  pinSet: boolean;
  unlocked: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
  clearPin: () => Promise<void>;

  // product CRUD
  addProduct: (p: Omit<Product, "id" | "createdAt" | "updatedAt">) => Product;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;

  // cart
  cart: Record<string, number>;
  addToCart: (id: string) => boolean;
  setCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // checkout
  checkout: (paid: number) => Transaction | null;

  // settings
  setStoreName: (name: string) => void;
  resetAllData: () => Promise<void>;
};

const Ctx = createContext<StoreCtx | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeName, setStoreNameState] = useState("Toko Saya");
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});

  // Load persisted data on boot
  useEffect(() => {
    (async () => {
      let prods = await storage.getItem<Product[]>(KEY_PRODUCTS, []);
      const seeded = await storage.getItem<boolean>(KEY_SEEDED, false);
      if ((!prods || prods.length === 0) && !seeded) {
        prods = SEED.map((s) => ({
          ...s,
          id: uid(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }));
        await storage.setItem(KEY_PRODUCTS, prods);
        await storage.setItem(KEY_SEEDED, true);
      }
      const txs = await storage.getItem<Transaction[]>(KEY_TX, []);
      const name = await storage.getItem<string>(KEY_STORE_NAME, "Toko Saya");
      const pin = await storage.secureGet<string>(PIN_KEY, "");

      setProducts(prods || []);
      setTransactions(txs || []);
      setStoreNameState(name || "Toko Saya");
      setPinSet(!!pin);
      setReady(true);
    })();
  }, []);

  const persistProducts = useCallback((next: Product[]) => {
    setProducts(next);
    storage.setItem(KEY_PRODUCTS, next);
  }, []);

  const persistTx = useCallback((next: Transaction[]) => {
    setTransactions(next);
    storage.setItem(KEY_TX, next);
  }, []);

  // ---- Auth ----
  const setPin = useCallback(async (pin: string) => {
    await storage.secureSet(PIN_KEY, pin);
    setPinSet(true);
    setUnlocked(true);
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const saved = await storage.secureGet<string>(PIN_KEY, "");
    return saved === pin;
  }, []);

  const unlock = useCallback(() => setUnlocked(true), []);
  const lock = useCallback(() => setUnlocked(false), []);

  const clearPin = useCallback(async () => {
    await storage.secureRemove(PIN_KEY);
    setPinSet(false);
    setUnlocked(false);
  }, []);

  // ---- Product CRUD ----
  const addProduct: StoreCtx["addProduct"] = useCallback(
    (p) => {
      const item: Product = { ...p, id: uid(), createdAt: nowIso(), updatedAt: nowIso() };
      persistProducts([item, ...products]);
      return item;
    },
    [products, persistProducts],
  );

  const updateProduct = useCallback(
    (id: string, p: Partial<Product>) => {
      persistProducts(
        products.map((x) => (x.id === id ? { ...x, ...p, updatedAt: nowIso() } : x)),
      );
    },
    [products, persistProducts],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      persistProducts(products.filter((x) => x.id !== id));
      setCart((c) => {
        const n = { ...c };
        delete n[id];
        return n;
      });
    },
    [products, persistProducts],
  );

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  // ---- Cart ----
  const addToCart = useCallback(
    (id: string): boolean => {
      const p = products.find((x) => x.id === id);
      if (!p) return false;
      const current = cart[id] || 0;
      if (current + 1 > p.qty) return false; // not enough stock
      setCart({ ...cart, [id]: current + 1 });
      return true;
    },
    [cart, products],
  );

  const setCartQty = useCallback(
    (id: string, qty: number) => {
      const p = products.find((x) => x.id === id);
      const max = p ? p.qty : 0;
      const clamped = Math.max(0, Math.min(qty, max));
      setCart((c) => {
        const n = { ...c };
        if (clamped <= 0) delete n[id];
        else n[id] = clamped;
        return n;
      });
    },
    [products],
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  // ---- Checkout ----
  const checkout = useCallback(
    (paid: number): Transaction | null => {
      const items: TxItem[] = [];
      let subtotal = 0;
      let totalCost = 0;
      for (const [id, qty] of Object.entries(cart)) {
        const p = products.find((x) => x.id === id);
        if (!p || qty <= 0) continue;
        items.push({
          productId: id,
          name: p.name,
          qty,
          sellPrice: p.sellPrice,
          costPrice: p.costPrice,
        });
        subtotal += p.sellPrice * qty;
        totalCost += p.costPrice * qty;
      }
      if (items.length === 0) return null;

      const tx: Transaction = {
        id: uid(),
        items,
        subtotal,
        totalCost,
        profit: subtotal - totalCost,
        paid,
        change: paid - subtotal,
        createdAt: nowIso(),
      };

      // decrement stock
      const nextProducts = products.map((p) => {
        const sold = cart[p.id];
        if (sold) return { ...p, qty: Math.max(0, p.qty - sold), updatedAt: nowIso() };
        return p;
      });
      persistProducts(nextProducts);
      persistTx([tx, ...transactions]);
      setCart({});
      return tx;
    },
    [cart, products, transactions, persistProducts, persistTx],
  );

  // ---- Settings ----
  const setStoreName = useCallback((name: string) => {
    setStoreNameState(name);
    storage.setItem(KEY_STORE_NAME, name);
  }, []);

  const resetAllData = useCallback(async () => {
    await storage.setItem(KEY_PRODUCTS, []);
    await storage.setItem(KEY_TX, []);
    await storage.setItem(KEY_SEEDED, true);
    setProducts([]);
    setTransactions([]);
    setCart({});
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      ready,
      products,
      transactions,
      storeName,
      pinSet,
      unlocked,
      setPin,
      verifyPin,
      unlock,
      lock,
      clearPin,
      addProduct,
      updateProduct,
      deleteProduct,
      getProduct,
      cart,
      addToCart,
      setCartQty,
      removeFromCart,
      clearCart,
      checkout,
      setStoreName,
      resetAllData,
    }),
    [
      ready, products, transactions, storeName, pinSet, unlocked, setPin, verifyPin,
      unlock, lock, clearPin, addProduct, updateProduct, deleteProduct, getProduct, cart,
      addToCart, setCartQty, removeFromCart, clearCart, checkout, setStoreName, resetAllData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
