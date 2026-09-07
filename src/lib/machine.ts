import type { PaletteId } from "./palettes";

export type ScreenId =
  | "boot"
  | "home"
  | "work"
  | "case"
  | "studio"
  | "contact"
  | "system"
  | "privacy"
  | "cookies";

export type ButtonId =
  | "up"
  | "down"
  | "left"
  | "right"
  | "a"
  | "b"
  | "start"
  | "select";

export type Machine = {
  powered: boolean;
  booting: boolean;
  bootY: number;
  screen: ScreenId;
  cursor: number;
  caseIndex: number;
  palette: PaletteId;
  sound: boolean;
  contrast: number;
  pressed: ButtonId | null;
  legalOffset: number;
  pulse: number;
};

export const HOME_ITEMS = ["WORK", "STUDIO", "CONTACT", "SYSTEM"] as const;
export const SYSTEM_ITEMS = ["PALETTE", "SOUND", "PRIVACY", "COOKIES"] as const;

export function initialMachine(start: ScreenId): Machine {
  const skipBoot = start === "privacy" || start === "cookies";
  return {
    powered: true,
    booting: !skipBoot,
    bootY: -56,
    screen: skipBoot ? start : "boot",
    cursor: 0,
    caseIndex: 0,
    palette: "field",
    sound: true,
    contrast: 0.72,
    pressed: null,
    legalOffset: 0,
    pulse: 0,
  };
}

export function screenFromPath(path: string): ScreenId {
  if (path.startsWith("/privacy")) return "privacy";
  if (path.startsWith("/cookies")) return "cookies";
  return "boot";
}
