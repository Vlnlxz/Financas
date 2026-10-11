// Reduz a foto (máx. 1000px, JPEG) e devolve data URL, para caber no localStorage (~5 MB no total).
export async function compressToDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  let url = c.toDataURL("image/jpeg", 0.7);
  if (url.length > 300_000) url = c.toDataURL("image/jpeg", 0.5);
  return url;
}
