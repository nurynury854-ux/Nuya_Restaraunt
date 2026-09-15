export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Renders the cropped region of `imageSrc` (an object URL) onto an
 * `outputWidth`x`outputHeight` canvas and returns it as a JPEG blob — the
 * banner is stored already-cropped, so nothing at render time needs to know
 * about crop coordinates.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: PixelCrop,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported in this browser");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode the cropped image"))),
      "image/jpeg",
      0.9
    );
  });
}
