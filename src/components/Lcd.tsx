import { useEffect, useRef, useState } from "react";
import { CELL_H, CELL_W, COLS, LCD_H, LCD_W, glyph, wrapLines } from "../lib/font";
import { PALETTES, type PaletteId } from "../lib/palettes";
import type { ButtonId, ScreenId } from "../lib/machine";
import { HOME_ITEMS, SYSTEM_ITEMS } from "../lib/machine";
import { CONTACT_EMAIL, WORK } from "../lib/work";
import { COOKIE_TEXT, PRIVACY_TEXT } from "../lib/legal";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mix(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r} ${g} ${bl})`;
}

function applyContrast(hex: string, contrast: number) {
  return mix(hex, "#0a0e06", 1 - contrast);
}

function fill(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, LCD_W, LCD_H);
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  color: string,
) {
  const rows = glyph(ch.toUpperCase());
  ctx.fillStyle = color;
  for (let row = 0; row < 7; row++) {
    const bits = rows[row] ?? 0;
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  col: number,
  row: number,
  color: string,
  invert?: { bg: string; fg: string },
) {
  const x = col * CELL_W;
  const y = row * CELL_H;
  if (invert) {
    ctx.fillStyle = invert.bg;
    ctx.fillRect(x - 1, y - 1, text.length * CELL_W + 1, CELL_H);
  }
  const ink = invert ? invert.fg : color;
  for (let i = 0; i < text.length; i++) {
    drawGlyph(ctx, text[i] ?? " ", x + i * CELL_W, y, ink);
  }
}

function drawCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  row: number,
  color: string,
) {
  const col = Math.max(0, Math.floor((COLS - text.length) / 2));
  drawText(ctx, text, col, row, color);
}

function ditherImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  paper: string,
  ink: string,
  mid: string,
) {
  const off = document.createElement("canvas");
  off.width = dw;
  off.height = dh;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return;
  octx.drawImage(img, 0, 0, dw, dh);
  const data = octx.getImageData(0, 0, dw, dh);
  const pPaper = hexToRgb(paper);
  const pMid = hexToRgb(mid);
  const pInk = hexToRgb(ink);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const i = (y * dw + x) * 4;
      const lum =
        (data.data[i]! * 0.3 + data.data[i + 1]! * 0.59 + data.data[i + 2]! * 0.11) /
        255;
      const threshold = (BAYER[y % 4]![x % 4]! + 0.5) / 16;
      let pick = pInk;
      if (lum > threshold + 0.12) pick = pPaper;
      else if (lum > threshold - 0.12) pick = pMid;
      data.data[i] = pick[0];
      data.data[i + 1] = pick[1];
      data.data[i + 2] = pick[2];
      data.data[i + 3] = 255;
    }
  }
  octx.putImageData(data, 0, 0);
  ctx.drawImage(off, dx, dy);
}

function stampIcon(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  y: number,
  ink: string,
  paper: string,
) {
  const w = 56;
  const h = 36;
  const x = Math.floor((LCD_W - w) / 2);
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return;
  octx.fillStyle = paper;
  octx.fillRect(0, 0, w, h);
  octx.drawImage(img, 4, 2, w - 8, h - 4);
  const data = octx.getImageData(0, 0, w, h);
  const pInk = hexToRgb(ink);
  const pPaper = hexToRgb(paper);
  for (let i = 0; i < data.data.length; i += 4) {
    const a = data.data[i + 3]!;
    const lum = (data.data[i]! + data.data[i + 1]! + data.data[i + 2]!) / 3;
    const on = a > 40 && lum < 200;
    const p = on ? pInk : pPaper;
    data.data[i] = p[0];
    data.data[i + 1] = p[1];
    data.data[i + 2] = p[2];
    data.data[i + 3] = 255;
  }
  octx.putImageData(data, 0, 0);
  ctx.drawImage(off, x, y);
}

export type LcdModel = {
  powered: boolean;
  booting: boolean;
  bootY: number;
  screen: ScreenId;
  cursor: number;
  caseIndex: number;
  palette: PaletteId;
  sound: boolean;
  contrast: number;
  legalOffset: number;
  notice: boolean;
  pressed: ButtonId | null;
  pulse: number;
};

const cache = new Map<string, HTMLImageElement>();

function useImage(src: string | undefined) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const hit = cache.get(src);
    if (hit?.complete) {
      setImg(hit);
      return;
    }
    const next = new Image();
    next.src = src;
    next.onload = () => {
      cache.set(src, next);
      setImg(next);
    };
  }, [src]);
  return img;
}

export function Lcd({
  model,
  markSrc,
  onReady,
}: {
  model: LcdModel;
  markSrc: string;
  onReady?: (canvas: HTMLCanvasElement) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mark = useImage(markSrc);
  const stillSrc = WORK[model.caseIndex]?.still;
  const still = useImage(stillSrc);

  useEffect(() => {
    if (canvasRef.current) onReady?.(canvasRef.current);
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const pal = PALETTES[model.palette];
    const paper = applyContrast(pal.paper, model.contrast);
    const mid = applyContrast(pal.mid, model.contrast);
    const ink = applyContrast(pal.ink, model.contrast);

    if (!model.powered) {
      fill(ctx, mix(pal.mid, "#3a4028", 0.55));
      return;
    }

    fill(ctx, paper);

    if (model.notice) {
      drawCentered(ctx, "GR STUDIO", 4, ink);
      drawCentered(ctx, "NECESSARY ONLY", 7, ink);
      drawCentered(ctx, "NO TRACKING", 8, ink);
      drawCentered(ctx, "PRESS A", 12, ink);
      return;
    }

    if (model.booting || model.screen === "boot") {
      if (mark?.complete) {
        stampIcon(ctx, mark, Math.round(model.bootY), ink, paper);
      }
      if (model.bootY > 40) {
        drawCentered(ctx, "GR STUDIO", 13, ink);
      }
      return;
    }

    if (model.screen === "home") {
      drawCentered(ctx, "GR STUDIO", 2, ink);
      drawCentered(ctx, "FIELD UNIT", 3, mid);
      HOME_ITEMS.forEach((label, i) => {
        const line = `${i === model.cursor ? ">" : " "} ${label}`;
        const invert = i === model.cursor ? { bg: ink, fg: paper } : undefined;
        drawText(ctx, line, 4, 6 + i * 2, ink, invert);
      });
      drawText(ctx, "PAD MOVE  A OK", 1, 16, mid);
      return;
    }

    if (model.screen === "work") {
      drawText(ctx, "WORK", 1, 0, ink);
      WORK.forEach((item, i) => {
        const prefix = i === model.cursor ? ">" : " ";
        const line = `${prefix} ${item.title}`.slice(0, COLS);
        const invert = i === model.cursor ? { bg: ink, fg: paper } : undefined;
        drawText(ctx, line, 0, 2 + i, ink, invert);
      });
      drawText(ctx, "A OPEN  B BACK", 1, 16, mid);
      return;
    }

    if (model.screen === "case") {
      const item = WORK[model.caseIndex];
      if (!item) return;
      if (still?.complete) {
        ditherImage(ctx, still, 4, 4, 152, 80, paper, ink, mid);
        ctx.strokeStyle = ink;
        ctx.strokeRect(4, 4, 152, 80);
      }
      drawText(ctx, item.title.slice(0, COLS), 1, 11, ink);
      drawText(ctx, item.tag.slice(0, COLS), 1, 12, mid);
      wrapLines(item.blurb, COLS - 2)
        .slice(0, 3)
        .forEach((line, i) => drawText(ctx, line, 1, 13 + i, ink));
      drawText(ctx, "A LIVE  B BACK", 1, 16, mid);
      return;
    }

    if (model.screen === "studio") {
      drawCentered(ctx, "GR STUDIO", 1, ink);
      const lines = wrapLines(
        "We design and build websites people remember. This unit is a showpiece. The work inside is real.",
        COLS - 2,
      );
      lines.forEach((line, i) => drawText(ctx, line, 1, 4 + i, ink));
      drawText(ctx, "B BACK", 1, 16, mid);
      return;
    }

    if (model.screen === "contact") {
      drawCentered(ctx, "START A PROJECT", 2, ink);
      const lines = wrapLines(
        "Press A or START to open your mail app. Write Glenn at GR Studio.",
        COLS - 2,
      );
      lines.forEach((line, i) => drawText(ctx, line, 1, 5 + i, ink));
      drawCentered(ctx, CONTACT_EMAIL.toUpperCase(), 11, ink);
      drawText(ctx, "A MAIL  B BACK", 1, 16, mid);
      return;
    }

    if (model.screen === "system") {
      drawText(ctx, "SYSTEM", 1, 1, ink);
      SYSTEM_ITEMS.forEach((label, i) => {
        let extra = "";
        if (label === "PALETTE") extra = ` ${pal.name}`;
        if (label === "SOUND") extra = model.sound ? " ON" : " OFF";
        const line = `${i === model.cursor ? ">" : " "} ${label}${extra}`.slice(
          0,
          COLS,
        );
        const invert = i === model.cursor ? { bg: ink, fg: paper } : undefined;
        drawText(ctx, line, 1, 4 + i * 2, ink, invert);
      });
      drawText(ctx, "A USE  B BACK", 1, 16, mid);
      return;
    }

    const legal = model.screen === "privacy" ? PRIVACY_TEXT : COOKIE_TEXT;
    const lines = wrapLines(legal, COLS - 2);
    const view = lines.slice(model.legalOffset, model.legalOffset + 15);
    view.forEach((line, i) => drawText(ctx, line, 1, i + 1, ink));
    drawText(ctx, "PAD SCROLL  B BACK", 1, 16, mid);
  }, [model, mark, still, markSrc, stillSrc]);

  return (
    <canvas
      ref={canvasRef}
      className="lcd-canvas"
      width={LCD_W}
      height={LCD_H}
      aria-hidden
    />
  );
}
