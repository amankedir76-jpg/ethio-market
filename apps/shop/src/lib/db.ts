import { supabase } from "@ethio/core";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Datenbank-Zugang für den Shop. Ohne VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * kann der Shop nicht arbeiten; dann zeigt die App einen klaren Hinweis statt leerer Seiten.
 */
export const db = supabase as SupabaseClient;
export const dbReady = supabase !== null;

const BUCKET = "shop-media";

/** Öffentliche Bild-URL aus einem Speicherpfad. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path || !dbReady) return null;
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Bild im Browser verkleinern und als WebP speichern (spart Datenvolumen). */
export async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("image"))), "image/webp", quality),
  );
}

/** Lädt ein Bild in den Ordner des eigenen Shops hoch und gibt den Pfad zurück. */
export async function uploadImage(sellerId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not_an_image");
  const blob = await compressImage(file);
  if (blob.size > 2 * 1024 * 1024) throw new Error("image_too_large");
  const path = `${sellerId}/${crypto.randomUUID()}.webp`;
  const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw error;
  return path;
}

export async function deleteImage(path: string) {
  await db.storage.from(BUCKET).remove([path]);
}

/** Übersetzt technische Fehler aus der Datenbank in Text-Schlüssel. */
export function errorKey(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  const known = [
    "out_of_stock", "product_unavailable", "region_not_served", "pickup_single_seller_only",
    "pickup_not_available", "invalid_contact", "invalid_address", "not_allowed", "empty_cart",
    "Invalid login credentials", "User already registered", "Email not confirmed", "image_too_large", "not_an_image",
  ];
  const hit = known.find((k) => msg.includes(k));
  return hit ? "err." + hit : "err.generic";
}
