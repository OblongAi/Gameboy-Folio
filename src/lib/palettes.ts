export type PaletteId = "field" | "lime" | "slate" | "paper";

export type Palette = {
  id: PaletteId;
  name: string;
  paper: string;
  mid: string;
  ink: string;
  deep: string;
};

export const PALETTES: Record<PaletteId, Palette> = {
  field: {
    id: "field",
    name: "FIELD",
    paper: "#9AA54C",
    mid: "#6F7A38",
    ink: "#2C3416",
    deep: "#1A2210",
  },
  lime: {
    id: "lime",
    name: "LIME",
    paper: "#9BBC0F",
    mid: "#8BAC0F",
    ink: "#306230",
    deep: "#0F380F",
  },
  slate: {
    id: "slate",
    name: "SLATE",
    paper: "#D4D4D0",
    mid: "#8E8E8A",
    ink: "#3A3A38",
    deep: "#121211",
  },
  paper: {
    id: "paper",
    name: "PAPER",
    paper: "#F7F5F1",
    mid: "#C4B8A0",
    ink: "#5C4A32",
    deep: "#0B0907",
  },
};

export const PALETTE_ORDER: PaletteId[] = ["field", "lime", "slate", "paper"];

export function nextPalette(id: PaletteId): PaletteId {
  const i = PALETTE_ORDER.indexOf(id);
  return PALETTE_ORDER[(i + 1) % PALETTE_ORDER.length];
}

export function prevPalette(id: PaletteId): PaletteId {
  const i = PALETTE_ORDER.indexOf(id);
  return PALETTE_ORDER[(i - 1 + PALETTE_ORDER.length) % PALETTE_ORDER.length];
}
