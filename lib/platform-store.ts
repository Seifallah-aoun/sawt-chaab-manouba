import { supabase } from "./supabase";

// In-memory cache to guarantee sub-millisecond responses and resilient fallback in serverless
const memoryStoreCache: Record<string, any> = {};

/**
 * Retrieve a JSON collection from Supabase public.platform_store.
 * Falls back to defaultFallback and in-memory cache if network issue occurs.
 */
export async function getStoreItem<T>(key: string, defaultFallback: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from("platform_store")
      .select("data")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.warn(`[platform_store] Supabase get error for "${key}":`, error.message);
      return (memoryStoreCache[key] as T) ?? defaultFallback;
    }

    if (!data || data.data === undefined || data.data === null) {
      // Key does not exist in Supabase yet, save fallback asynchronously
      memoryStoreCache[key] = defaultFallback;
      setStoreItem(key, defaultFallback).catch((err) =>
        console.warn(`[platform_store] Auto-seed failed for "${key}":`, err)
      );
      return defaultFallback;
    }

    memoryStoreCache[key] = data.data;
    return data.data as T;
  } catch (err) {
    console.warn(`[platform_store] Exception reading "${key}":`, err);
    return (memoryStoreCache[key] as T) ?? defaultFallback;
  }
}

/**
 * Persist a JSON collection to Supabase public.platform_store.
 * Overwrites/upserts by primary key `key`.
 */
export async function setStoreItem<T>(key: string, data: T): Promise<boolean> {
  memoryStoreCache[key] = data;
  try {
    const { error } = await supabase.from("platform_store").upsert(
      {
        key,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error(`[platform_store] Failed to save key "${key}":`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[platform_store] Exception saving key "${key}":`, err);
    return false;
  }
}

/**
 * Read current collection, apply updater callback, and save updated result back to Supabase.
 */
export async function updateStoreItem<T>(
  key: string,
  updater: (current: T) => T,
  defaultFallback: T
): Promise<T> {
  const current = await getStoreItem<T>(key, defaultFallback);
  const updated = updater(current);
  await setStoreItem(key, updated);
  return updated;
}
