import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

const BUCKET = "menu-media";

/**
 * Resolve a stored media reference to a displayable URL.
 * - Absolute URLs / data URIs / root-absolute paths are returned as-is.
 * - Bare storage paths (e.g. "products/uuid.webp") are served through the
 *   public media proxy route, since the storage bucket is private.
 */
export function mediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("/")) {
    return pathOrUrl;
  }
  return `/api/public/media/${pathOrUrl}`;
}

/** Compress then upload an image, returning the stored storage path. */
export async function uploadImage(file: File, folder = "uploads"): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.9,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: "31536000",
    upsert: false,
    contentType: "image/webp",
  });
  if (error) throw error;

  return path;
}
