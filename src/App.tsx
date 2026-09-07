import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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

export function App() {
  const reduced = usePrefersReducedMotion();
  const [state, dispatch] = useReducer(
    reduce,
    screenFromPath(typeof window === "undefined" ? "/" : window.location.pathname),
    initialMachine,
  );
  const [notice, setNotice] = useState(false);
  const soundRef = useRef(state.sound);
  soundRef.current = state.sound;

  useEffect(() => {
    const seen = localStorage.getItem(CONSENT_KEY);
    if (!seen) setNotice(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
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
      window.setTimeout(() => dispatch({ type: "release" }), 160);
    },
    [notice],
  );

  const live =
    !state.powered
      ? "Unit off"
      : notice
        ? "Cookie notice. Click A to continue."
        : state.booting
          ? "GR Studio loading"
          : `${state.screen} screen`;

  return (
    <main className="stage">
      <h1 className="sr-only">GR Studio Field Unit</h1>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      <div className="stage-glow" aria-hidden />
      <FieldUnit
        model={{ ...state, notice }}
        onPress={fire}
        onPower={() => {
          resumeAudio();
          dispatch({ type: "power" });
        }}
      />
    </main>
  );
}
