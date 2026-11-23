/** Datentypen passend zu den Supabase-Tabellen (Geld immer in Santim). */

export type Category = { id: string; name_am: string; name_om: string; name_en: string; sort: number };

export type Region = {
  code: string; name_am: string; name_om: string; name_en: string;
  fee_santim: number | null; eta_min_days: number | null; eta_max_days: number | null;
  enabled: boolean; sort: number;
};

export type Seller = {
  id: string; owner_id: string; shop_name: string; city: string; phone: string;
  status: "pending" | "approved" | "blocked"; tier: "standard" | "premium";
  region: string | null; description: string | null; logo_path: string | null;
  pickup_address: string | null; pickup_enabled: boolean; created_at: string;
};

export type Product = {
  id: string; seller_id: string; category_id: string; subcategory: string | null;
  title: string; description: string | null; price_santim: number;
  compare_at_price_santim: number | null; stock: number;
  status: "draft" | "live" | "blocked"; images: string[];
  rating_avg: number; rating_count: number; sold_count: number; created_at: string;
};

export type OrderStatus = "placed" | "packed" | "shipped" | "delivered" | "cancelled";

export type Address = {
  full_name: string; phone: string; region?: string; city?: string;
  subcity?: string; kebele?: string; street?: string; landmark?: string;
};

export type Order = {
  id: string; order_no: string; customer_id: string; address: Address;
  subtotal_santim: number; delivery_fee_santim: number; total_santim: number;
  payment_method: "cod"; payment_status: "unpaid" | "paid" | "refunded";
  delivery_method: "delivery" | "pickup"; status: OrderStatus;
  cancel_requested: boolean; note: string | null; created_at: string;
  shop_order_items?: OrderItem[];
};

export type OrderItem = {
  id: string; order_id: string; product_id: string | null; seller_id: string;
  title: string; unit_price_santim: number; qty: number; commission_pct: number;
};

export type Review = {
  id: string; product_id: string; user_id: string; author_name: string;
  rating: number; comment: string | null; hidden: boolean; created_at: string;
};

export type Settings = {
  commission_pct: number; premium_commission_pct: number;
  free_delivery_from_santim: number | null; support_email: string | null; support_phone: string | null;
};
