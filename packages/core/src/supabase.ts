import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Eine gemeinsame Datenbank und ein Konto für alle Apps.
 * Die Werte kommen aus der .env-Datei der jeweiligen App bzw. aus den
 * Netlify-Umgebungsvariablen. Ohne sie läuft die App im Demo-Modus.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isDemoMode = supabase === null;
