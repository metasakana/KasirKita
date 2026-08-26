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
  discount: number; // potongan harga (Rp)
  total: number; // subtotal - discount
  totalCost: number;
  profit: number;
  paid: number;
  change: number;
  status: "lunas" | "hutang";
  customerName?: string;
  createdAt: string;
};

export type DebtPayment = {
  id: string;
  amount: number;
  date: string;
};

export type Debt = {
  id: string;
  txId: string;
  customerName: string;
  phone: string;
  note: string;
  amount: number; // total hutang awal
  payments: DebtPayment[];
  status: "belum" | "lunas";
  createdAt: string;
};

export function debtPaidSum(d: Debt): number {
  return d.payments.reduce((s, p) => s + p.amount, 0);
}

export function debtRemaining(d: Debt): number {
  return Math.max(0, d.amount - debtPaidSum(d));
}

export type StockEntry = {
  id: string;
  productId: string;
  name: string;
  qty: number;
  note: string;
  costPrice?: number; // harga beli saat stok masuk
  createdAt: string;
};

const DEFAULT_CATEGORIES = [
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
const KEY_DEBTS = "wp_debts";
const KEY_CATEGORIES = "wp_categories";
const KEY_STOCK_ENTRIES = "wp_stock_entries";
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
export type CheckoutOpts = {
  paid: number;
  discount?: number;
  debt?: { customerName: string; phone?: string; note?: string };
};

type StoreCtx = {
  ready: boolean;
  products: Product[];
  transactions: Transaction[];
  debts: Debt[];
  categories: string[];
  stockEntries: StockEntry[];
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
  checkout: (opts: CheckoutOpts) => Transaction | null;

  // debts (kasbon)
  payDebt: (debtId: string, amount: number) => void;

  // stok masuk (restock)
  restock: (productId: string, qty: number, note?: string, newCostPrice?: number) => "ok" | "new" | "merged" | false;

  // categories
  addCategory: (name: string) => boolean;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (name: string) => void;

  // settings
  setStoreName: (name: string) => void;
  resetAllData: () => Promise<void>;
};

const Ctx = createContext<StoreCtx | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
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
      const txsRaw = await storage.getItem<Transaction[]>(KEY_TX, []);
      // normalisasi transaksi lama (sebelum fitur diskon & kasbon)
      const txs = (txsRaw || []).map((t) => ({
        ...t,
        discount: t.discount || 0,
        total: t.total ?? t.subtotal,
        status: t.status ?? ("lunas" as const),
      }));
      const savedDebts = await storage.getItem<Debt[]>(KEY_DEBTS, []);
      const savedEntries = await storage.getItem<StockEntry[]>(KEY_STOCK_ENTRIES, []);
      let cats = await storage.getItem<string[] | null>(KEY_CATEGORIES, null);
      if (!cats || cats.length === 0) {
        cats = DEFAULT_CATEGORIES;
        await storage.setItem(KEY_CATEGORIES, cats);
      }
      const name = await storage.getItem<string>(KEY_STORE_NAME, "Toko Saya");
      const pin = await storage.secureGet<string>(PIN_KEY, "");

      setProducts(prods || []);
      setTransactions(txs);
      setDebts(savedDebts || []);
      setStockEntries(savedEntries || []);
      setCategories(cats);
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

  const persistDebts = useCallback((next: Debt[]) => {
    setDebts(next);
    storage.setItem(KEY_DEBTS, next);
  }, []);

  const persistCategories = useCallback((next: string[]) => {
    setCategories(next);
    storage.setItem(KEY_CATEGORIES, next);
  }, []);

  const persistStockEntries = useCallback((next: StockEntry[]) => {
    setStockEntries(next);
    storage.setItem(KEY_STOCK_ENTRIES, next);
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
    (opts: CheckoutOpts): Transaction | null => {
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

      const discount = Math.max(0, Math.min(Math.round(opts.discount || 0), subtotal));
      const total = subtotal - discount;
      const isDebt = !!opts.debt;
      const paid = isDebt ? Math.max(0, Math.min(opts.paid, total)) : opts.paid;

      const tx: Transaction = {
        id: uid(),
        items,
        subtotal,
        discount,
        total,
        totalCost,
        profit: total - totalCost,
        paid,
        change: isDebt ? 0 : paid - total,
        status: isDebt ? "hutang" : "lunas",
        customerName: opts.debt?.customerName?.trim() || undefined,
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

      if (isDebt && opts.debt) {
        const debt: Debt = {
          id: uid(),
          txId: tx.id,
          customerName: opts.debt.customerName.trim(),
          phone: opts.debt.phone?.trim() || "",
          note: opts.debt.note?.trim() || "",
          amount: total - paid,
          payments: [],
          status: "belum",
          createdAt: nowIso(),
        };
        persistDebts([debt, ...debts]);
      }

      setCart({});
      return tx;
    },
    [cart, products, transactions, debts, persistProducts, persistTx, persistDebts],
  );

  // ---- Debts (kasbon) ----
  const payDebt = useCallback(
    (debtId: string, amount: number) => {
      if (amount <= 0) return;
      persistDebts(
        debts.map((d) => {
          if (d.id !== debtId) return d;
          const payments = [...d.payments, { id: uid(), amount: Math.round(amount), date: nowIso() }];
          const paidSum = payments.reduce((s, p) => s + p.amount, 0);
          return { ...d, payments, status: paidSum >= d.amount ? ("lunas" as const) : ("belum" as const) };
        }),
      );
    },
    [debts, persistDebts],
  );

  // ---- Stok masuk (restock) ----
  const restock = useCallback(
    (productId: string, qty: number, note?: string, newCostPrice?: number): "ok" | "new" | "merged" | false => {
      const q = Math.round(qty);
      if (q <= 0) return false;
      const p = products.find((x) => x.id === productId);
      if (!p) return false;

      const cost = newCostPrice && newCostPrice > 0 ? Math.round(newCostPrice) : p.costPrice;
      let result: "ok" | "new" | "merged" = "ok";

      if (cost === p.costPrice) {
        // modal sama -> tambah qty ke barang yang sama
        persistProducts(
          products.map((x) => (x.id === productId ? { ...x, qty: x.qty + q, updatedAt: nowIso() } : x)),
        );
      } else {
        // modal beda -> cari varian dengan nama & kategori sama dan modal sama
        const variant = products.find(
          (x) =>
            x.id !== p.id &&
            x.name.toLowerCase() === p.name.toLowerCase() &&
            x.category === p.category &&
            x.costPrice === cost,
        );
        if (variant) {
          persistProducts(
            products.map((x) => (x.id === variant.id ? { ...x, qty: x.qty + q, updatedAt: nowIso() } : x)),
          );
          result = "merged";
        } else {
          // buat stok baru: nama sama, modal beda
          const newProd: Product = {
            id: uid(),
            name: p.name,
            category: p.category,
            qty: q,
            costPrice: cost,
            sellPrice: p.sellPrice,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          persistProducts([newProd, ...products]);
          result = "new";
        }
      }

      persistStockEntries([
        { id: uid(), productId, name: p.name, qty: q, note: note?.trim() || "", costPrice: cost, createdAt: nowIso() },
        ...stockEntries,
      ]);
      return result;
    },
    [products, stockEntries, persistProducts, persistStockEntries],
  );

  // ---- Categories ----
  const addCategory = useCallback(
    (name: string): boolean => {
      const n = name.trim();
      if (!n) return false;
      if (categories.some((c) => c.toLowerCase() === n.toLowerCase())) return false;
      persistCategories([...categories, n]);
      return true;
    },
    [categories, persistCategories],
  );

  const renameCategory = useCallback(
    (oldName: string, newName: string): boolean => {
      const n = newName.trim();
      if (!n) return false;
      if (categories.some((c) => c !== oldName && c.toLowerCase() === n.toLowerCase())) return false;
      persistCategories(categories.map((c) => (c === oldName ? n : c)));
      persistProducts(
        products.map((p) => (p.category === oldName ? { ...p, category: n, updatedAt: nowIso() } : p)),
      );
      return true;
    },
    [categories, products, persistCategories, persistProducts],
  );

  const deleteCategory = useCallback(
    (name: string) => {
      if (categories.length <= 1) return;
      const next = categories.filter((c) => c !== name);
      const fallback = next.includes("Lainnya") ? "Lainnya" : next[next.length - 1];
      persistCategories(next);
      persistProducts(
        products.map((p) => (p.category === name ? { ...p, category: fallback, updatedAt: nowIso() } : p)),
      );
    },
    [categories, products, persistCategories, persistProducts],
  );

  // ---- Settings ----
  const setStoreName = useCallback((name: string) => {
    setStoreNameState(name);
    storage.setItem(KEY_STORE_NAME, name);
  }, []);

  const resetAllData = useCallback(async () => {
    await storage.setItem(KEY_PRODUCTS, []);
    await storage.setItem(KEY_TX, []);
    await storage.setItem(KEY_DEBTS, []);
    await storage.setItem(KEY_STOCK_ENTRIES, []);
    await storage.setItem(KEY_SEEDED, true);
    setProducts([]);
    setTransactions([]);
    setDebts([]);
    setStockEntries([]);
    setCart({});
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      ready,
      products,
      transactions,
      debts,
      categories,
      stockEntries,
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
      payDebt,
      restock,
      addCategory,
      renameCategory,
      deleteCategory,
      setStoreName,
      resetAllData,
    }),
    [
      ready, products, transactions, debts, categories, stockEntries, storeName, pinSet, unlocked, setPin, verifyPin,
      unlock, lock, clearPin, addProduct, updateProduct, deleteProduct, getProduct, cart,
      addToCart, setCartQty, removeFromCart, clearCart, checkout, payDebt, restock,
      addCategory, renameCategory, deleteCategory, setStoreName, resetAllData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
