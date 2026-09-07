import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

export function makeLabelTexture(
  text: string,
  {
    color = "#2a3f8f",
    width = 512,
    height = 128,
    size = 72,
    italic = false,
    tracking = 0,
    weight = "800",
  }: {
    color?: string;
    width?: number;
    height?: number;
    size?: number;
    italic?: boolean;
    tracking?: number;
    weight?: string;
  } = {},
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${italic ? "italic " : ""}${weight} ${size}px Arial, Helvetica, sans-serif`;
  if (italic) {
    ctx.setTransform(1, 0, -0.28, 1, width * 0.06, 0);
  }
  if (tracking) {
    const chars = text.split("");
    const base = ctx.measureText(text).width;
    const extra = tracking * (chars.length - 1);
    let x = width / 2 - (base + extra) / 2;
    for (const ch of chars) {
      const w = ctx.measureText(ch).width;
      ctx.fillText(ch, x + w / 2, height / 2);
      x += w + tracking;
    }
  } else {
    ctx.fillText(text, width / 2, height / 2);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
