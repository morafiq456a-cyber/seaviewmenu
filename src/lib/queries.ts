import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type RestaurantSettings = Tables<"restaurant_settings">;
export type SocialLinks = Tables<"social_links">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type Offer = Tables<"offers">;
export type ThemeRow = Tables<"theme_settings">;

export interface WorkingHour {
  day: number; // 0=Sunday
  open: string;
  close: string;
  closed: boolean;
}

/* ------------------------------------------------------------------ */
/* Query option factories (shared by loaders + components)            */
/* ------------------------------------------------------------------ */

export const settingsQuery = queryOptions({
  queryKey: ["restaurant_settings"],
  queryFn: async (): Promise<RestaurantSettings | null> => {
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const socialQuery = queryOptions({
  queryKey: ["social_links"],
  queryFn: async (): Promise<SocialLinks | null> => {
    const { data, error } = await supabase.from("social_links").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const themeQuery = queryOptions({
  queryKey: ["theme_settings"],
  queryFn: async (): Promise<ThemeRow | null> => {
    const { data, error } = await supabase
      .from("theme_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const offersQuery = queryOptions({
  queryKey: ["offers"],
  queryFn: async (): Promise<Offer[]> => {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

/** Soft-deleted rows, newest first — powers the Trash page. */
export const trashedProductsQuery = queryOptions({
  queryKey: ["trash", "products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const trashedCategoriesQuery = queryOptions({
  queryKey: ["trash", "categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

/* ------------------------------------------------------------------ */
/* Convenience hooks                                                  */
/* ------------------------------------------------------------------ */

export const useSettings = () => useQuery(settingsQuery);
export const useSocial = () => useQuery(socialQuery);
export const useThemeRow = () => useQuery(themeQuery);
export const useCategories = () => useQuery(categoriesQuery);
export const useProducts = () => useQuery(productsQuery);
export const useOffers = () => useQuery(offersQuery);
export const useTrashedProducts = () => useQuery(trashedProductsQuery);
export const useTrashedCategories = () => useQuery(trashedCategoriesQuery);

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export function productImages(p: Product): string[] {
  const imgs = p.images;
  if (Array.isArray(imgs)) return imgs.filter((x): x is string => typeof x === "string");
  return [];
}

/** Gallery ordered with the chosen cover image first. */
export function orderedImages(p: Product): string[] {
  const imgs = productImages(p);
  const cover = typeof p.cover_index === "number" ? p.cover_index : 0;
  if (cover <= 0 || cover >= imgs.length) return imgs;
  return [imgs[cover], ...imgs.filter((_, i) => i !== cover)];
}

/** Primary (cover) image for cards and previews. */
export function coverImage(p: Product): string {
  return orderedImages(p)[0] ?? "";
}

/** Parse the free-form tags array stored as jsonb. */
export function productTags(p: Product): string[] {
  const tags = p.tags;
  if (Array.isArray(tags)) return tags.filter((x): x is string => typeof x === "string");
  return [];
}

export function parseWorkingHours(row: RestaurantSettings | null | undefined): WorkingHour[] {
  const wh = row?.working_hours;
  if (Array.isArray(wh)) return wh as unknown as WorkingHour[];
  return [];
}

export function isOpenNow(hours: WorkingHour[]): boolean {
  if (!hours.length) return false;
  const now = new Date();
  const today = hours.find((h) => h.day === now.getDay());
  if (!today || today.closed) return false;
  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const openM = oh * 60 + (om || 0);
  let closeM = ch * 60 + (cm || 0);
  if (closeM <= openM) closeM += 24 * 60; // past midnight
  return cur >= openM && cur <= closeM;
}
