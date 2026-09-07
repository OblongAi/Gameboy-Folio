import { CanvasTexture, RepeatWrapping } from "three";

export function makePlasticMaps(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 132 + ((Math.sin(i * 0.17) * 7 + Math.cos(i * 0.09) * 6 + Math.random() * 18) | 0);
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const map = new CanvasTexture(canvas);
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(2.4, 3.8);
  map.anisotropy = 4;
  return map;
}
