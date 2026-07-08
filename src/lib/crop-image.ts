/** Canvas helpers for the image cropper (crop + rotate → File). */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function radians(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Produce a cropped + rotated image File from a source URL.
 * The output is rendered to a canvas at the crop's pixel size; final
 * compression to WebP happens later in `uploadImage`.
 */
export async function getCroppedImageFile(
  src: string,
  crop: PixelCrop,
  rotation: number,
  fileName = "image.png",
): Promise<File> {
  const image = await loadImage(src);

  // Render the (possibly rotated) image onto a canvas large enough to hold it.
  const rot = radians(rotation);
  const bBoxWidth = Math.abs(Math.cos(rot) * image.width) + Math.abs(Math.sin(rot) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rot) * image.width) + Math.abs(Math.cos(rot) * image.height);

  const stage = document.createElement("canvas");
  stage.width = bBoxWidth;
  stage.height = bBoxHeight;
  const sctx = stage.getContext("2d");
  if (!sctx) throw new Error("Canvas not supported");
  sctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  sctx.rotate(rot);
  sctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Extract the crop region from the rotated stage.
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(crop.width));
  out.height = Math.max(1, Math.round(crop.height));
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported");
  octx.drawImage(stage, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  const blob: Blob = await new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render image"))), "image/png");
  });

  return new File([blob], fileName.replace(/\.[^.]+$/, "") + ".png", {
    type: "image/png",
  });
}
