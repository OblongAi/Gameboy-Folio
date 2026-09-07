import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent } from "react";
import { FieldUnit } from "./components/FieldUnit";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { playBack, playBootChime, playClick, playConfirm, resumeAudio } from "./lib/audio";
import {
  HOME_ITEMS,
  SYSTEM_ITEMS,
  initialMachine,
  screenFromPath,
  type ButtonId,
  type Machine,
  type ScreenId,
} from "./lib/machine";
import { nextPalette, prevPalette } from "./lib/palettes";
import { WORK, mailtoHref } from "./lib/work";
import { wrapLines } from "./lib/font";
import { COOKIE_TEXT, PRIVACY_TEXT } from "./lib/legal";

const CONSENT_KEY = "gr-field-consent";

type Action =
  | { type: "power" }
  | { type: "bootY"; y: number }
  | { type: "bootDone" }
  | { type: "press"; id: ButtonId }
  | { type: "release" }
  | { type: "contrast"; value: number }
  | { type: "pulse"; value: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function legalLines(screen: ScreenId) {
  return wrapLines(screen === "privacy" ? PRIVACY_TEXT : COOKIE_TEXT, 24);
}

function openMail() {
  window.location.href = mailtoHref();
}

function openLive(index: number) {
  const item = WORK[index];
  if (!item) return;
  window.open(item.href, "_blank", "noopener,noreferrer");
}

function reduce(state: Machine, action: Action): Machine {
  if (action.type === "power") {
    if (state.powered) {
      return {
        ...state,
        powered: false,
        booting: false,
        pressed: null,
        pulse: 0,
      };
    }
    return {
      ...state,
      powered: true,
      booting: true,
      bootY: -56,
      screen: "boot",
      cursor: 0,
      legalOffset: 0,
    };
  }
  if (action.type === "bootY") return { ...state, bootY: action.y };
  if (action.type === "bootDone") {
    return { ...state, booting: false, screen: "home", bootY: 52, cursor: 0 };
  }
  if (action.type === "release") return { ...state, pressed: null };
  if (action.type === "contrast") return { ...state, contrast: action.value };
  if (action.type === "pulse") return { ...state, pulse: action.value };
  if (action.type !== "press") return state;
  if (!state.powered) return state;

  const id = action.id;
  const next = { ...state, pressed: id };

  if (state.booting || state.screen === "boot") {
    if (id === "start" || id === "a") {
      return { ...next, booting: false, screen: "home", bootY: 52, cursor: 0 };
    }
    return next;
  }

  if (id === "select") {
    return { ...next, screen: "system", cursor: 0, legalOffset: 0 };
  }

  if (id === "start") {
    if (state.screen === "contact") {
      openMail();
      return next;
    }
    return { ...next, screen: "contact", cursor: 0 };
  }

  if (id === "b") {
    if (state.screen === "home") return next;
    if (state.screen === "case") return { ...next, screen: "work" };
    if (state.screen === "privacy" || state.screen === "cookies") {
      return { ...next, screen: "system", cursor: 0, legalOffset: 0 };
    }
    return { ...next, screen: "home", cursor: 0, legalOffset: 0 };
  }

  if (id === "a") {
    if (state.screen === "home") {
      const pick = HOME_ITEMS[state.cursor];
      if (pick === "WORK") return { ...next, screen: "work", cursor: 0 };
      if (pick === "STUDIO") return { ...next, screen: "studio", cursor: 0 };
      if (pick === "CONTACT") return { ...next, screen: "contact", cursor: 0 };
      return { ...next, screen: "system", cursor: 0 };
    }
    if (state.screen === "work") {
      return { ...next, screen: "case", caseIndex: state.cursor };
    }
    if (state.screen === "case") {
      openLive(state.caseIndex);
      return next;
    }
    if (state.screen === "contact") {
      openMail();
      return next;
    }
    if (state.screen === "system") {
      const pick = SYSTEM_ITEMS[state.cursor];
      if (pick === "PALETTE") return { ...next, palette: nextPalette(state.palette) };
      if (pick === "SOUND") return { ...next, sound: !state.sound };
      if (pick === "PRIVACY") return { ...next, screen: "privacy", legalOffset: 0 };
      if (pick === "COOKIES") return { ...next, screen: "cookies", legalOffset: 0 };
    }
    return next;
  }

  const listLen =
    state.screen === "home"
      ? HOME_ITEMS.length
      : state.screen === "work"
        ? WORK.length
        : state.screen === "system"
          ? SYSTEM_ITEMS.length
          : 0;

  if (id === "up") {
    if (state.screen === "privacy" || state.screen === "cookies") {
      return { ...next, legalOffset: Math.max(0, state.legalOffset - 1) };
    }
    if (state.screen === "case") {
      return { ...next, caseIndex: clamp(state.caseIndex - 1, 0, WORK.length - 1) };
    }
    if (listLen) return { ...next, cursor: (state.cursor - 1 + listLen) % listLen };
    return next;
  }

  if (id === "down") {
    if (state.screen === "privacy" || state.screen === "cookies") {
      const max = Math.max(0, legalLines(state.screen).length - 15);
      return { ...next, legalOffset: Math.min(max, state.legalOffset + 1) };
    }
    if (state.screen === "case") {
      return { ...next, caseIndex: clamp(state.caseIndex + 1, 0, WORK.length - 1) };
    }
    if (listLen) return { ...next, cursor: (state.cursor + 1) % listLen };
    return next;
  }

  if (id === "left") {
    if (state.screen === "work" || state.screen === "case") {
      const idx = state.screen === "case" ? state.caseIndex : state.cursor;
      const n = clamp(idx - 1, 0, WORK.length - 1);
      return state.screen === "case"
        ? { ...next, caseIndex: n }
        : { ...next, cursor: n };
    }
    if (state.screen === "system" && SYSTEM_ITEMS[state.cursor] === "PALETTE") {
      return { ...next, palette: prevPalette(state.palette) };
    }
    return next;
  }

  if (id === "right") {
    if (state.screen === "work" || state.screen === "case") {
      const idx = state.screen === "case" ? state.caseIndex : state.cursor;
      const n = clamp(idx + 1, 0, WORK.length - 1);
      return state.screen === "case"
        ? { ...next, caseIndex: n }
        : { ...next, cursor: n };
    }
    if (state.screen === "system" && SYSTEM_ITEMS[state.cursor] === "PALETTE") {
      return { ...next, palette: nextPalette(state.palette) };
    }
    return next;
  }

  return next;
}

function keyToButton(e: KeyboardEvent): ButtonId | null {
  switch (e.key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "z":
    case "Z":
    case "Enter":
      return "a";
    case "x":
    case "X":
    case "Backspace":
    case "Escape":
      return "b";
    case " ":
      return "start";
    case "Tab":
    case "c":
    case "C":
    case "Shift":
      return "select";
    default:
      return null;
  }
}

export function App() {
  const reduced = usePrefersReducedMotion();
  const [state, dispatch] = useReducer(
    reduce,
    screenFromPath(typeof window === "undefined" ? "/" : window.location.pathname),
    initialMachine,
  );
  const [notice, setNotice] = useState(false);
  const [tilt, setTilt] = useState({ x: 8, y: -6 });
  const soundRef = useRef(state.sound);
  soundRef.current = state.sound;

  useEffect(() => {
    const seen = localStorage.getItem(CONSENT_KEY);
    if (!seen) setNotice(true);
  }, []);

  useEffect(() => {
    const lock = (e: Event) => e.preventDefault();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.addEventListener("wheel", lock, { passive: false });
    document.body.addEventListener("touchmove", lock, { passive: false });
    return () => {
      document.body.removeEventListener("wheel", lock);
      document.body.removeEventListener("touchmove", lock);
    };
  }, []);

  useEffect(() => {
    if (!state.powered || !state.booting) return;
    if (reduced) {
      dispatch({ type: "bootDone" });
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 920);
      const eased = 1 - (1 - t) ** 3;
      dispatch({ type: "bootY", y: -56 + 108 * eased });
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        if (soundRef.current) {
          playBootChime();
          dispatch({ type: "pulse", value: 1 });
          window.setTimeout(() => dispatch({ type: "pulse", value: 0 }), 420);
        }
        window.setTimeout(() => dispatch({ type: "bootDone" }), 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.powered, state.booting, reduced]);

  const fire = useCallback(
    (id: ButtonId) => {
      resumeAudio();
      if (notice) {
        if (id === "a" || id === "start") {
          localStorage.setItem(CONSENT_KEY, "necessary");
          setNotice(false);
          if (soundRef.current) playConfirm();
        }
        return;
      }
      if (soundRef.current) {
        if (id === "a" || id === "start") playConfirm();
        else if (id === "b") playBack();
        else playClick();
      }
      dispatch({ type: "press", id });
      window.setTimeout(() => dispatch({ type: "release" }), 140);
    },
    [notice],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const id = keyToButton(e);
      if (!id) return;
      e.preventDefault();
      if (e.repeat && id !== "up" && id !== "down") return;
      fire(id);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [fire]);

  useEffect(() => {
    let raf = 0;
    const held = new Set<number>();
    const map: Array<[number, ButtonId]> = [
      [12, "up"],
      [13, "down"],
      [14, "left"],
      [15, "right"],
      [0, "a"],
      [1, "b"],
      [9, "start"],
      [8, "select"],
    ];
    const poll = () => {
      const pad = navigator.getGamepads?.()[0];
      if (pad) {
        for (const [index, id] of map) {
          const down = Boolean(pad.buttons[index]?.pressed);
          if (down && !held.has(index)) fire(id);
          if (down) held.add(index);
          else held.delete(index);
        }
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [fire]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 16;
    const y = (0.5 - e.clientY / window.innerHeight) * 10;
    setTilt({ x: y + 6, y: x - 2 });
  };

  const live =
    !state.powered
      ? "Unit off"
      : notice
        ? "Cookie notice. Press A to continue."
        : state.booting
          ? "GR Studio loading"
          : `${state.screen} screen`;

  return (
    <main className="stage" onPointerMove={onMove}>
      <h1 className="sr-only">GR Studio Field Unit</h1>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      <div className="stage-glow" aria-hidden />
      <FieldUnit
        model={{ ...state, notice }}
        tilt={reduced ? { x: 6, y: -4 } : tilt}
        onPress={fire}
        onRelease={() => dispatch({ type: "release" })}
        onPower={() => {
          resumeAudio();
          dispatch({ type: "power" });
        }}
        onContrast={(value) => dispatch({ type: "contrast", value })}
      />
    </main>
  );
}
