import { Canvas } from "@react-three/fiber";
import { useCallback, useState } from "react";
import type { ButtonId } from "../lib/machine";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { GrStudioLogo } from "./brand/GrStudioLogo";
import { Lcd, type LcdModel } from "./Lcd";
import { UnitModel } from "./unit/UnitModel";

const MARK_SRC = "/favicon.svg";

type Props = {
  model: LcdModel;
  onPress: (id: ButtonId) => void;
  onPower: () => void;
};

export function FieldUnit({ model, onPress, onPower }: Props) {
  const reduced = usePrefersReducedMotion();
  const [lcd, setLcd] = useState<HTMLCanvasElement | null>(null);
  const onReady = useCallback((canvas: HTMLCanvasElement) => {
    setLcd(canvas);
  }, []);

  const click = (id: ButtonId) => () => onPress(id);

  return (
    <div className="unit-stage">
      <div className="lcd-source" aria-hidden>
        <Lcd model={model} markSrc={MARK_SRC} onReady={onReady} />
      </div>

      <Canvas
        className="unit-canvas"
        dpr={[1, 2]}
        camera={{ position: [0.15, 0.12, 2.85], fov: 30, near: 0.1, far: 20 }}
        gl={{ antialias: true }}
        onCreated={({ camera }) => {
          camera.lookAt(0.02, 0, 0);
        }}
      >
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.38} />
        <directionalLight position={[-1.6, 2.4, 2.8]} intensity={1.75} />
        <directionalLight position={[2.2, 0.6, 1.4]} intensity={0.45} />
        <directionalLight position={[0.4, -0.8, -1.6]} intensity={0.28} />
        <UnitModel model={model} lcd={lcd} reduced={reduced} onPress={onPress} onPower={onPower} />
      </Canvas>

      <div className="sr-only" role="group" aria-label="Field unit controls">
        <button type="button" onClick={onPower}>
          {model.powered ? "Power off" : "Power on"}
        </button>
        <button type="button" onClick={click("up")}>
          Up
        </button>
        <button type="button" onClick={click("down")}>
          Down
        </button>
        <button type="button" onClick={click("left")}>
          Left
        </button>
        <button type="button" onClick={click("right")}>
          Right
        </button>
        <button type="button" data-testid="pad-a" onClick={click("a")}>
          A, confirm
        </button>
        <button type="button" onClick={click("b")}>
          B, back
        </button>
        <button type="button" onClick={click("select")}>
          Select, system
        </button>
        <button type="button" onClick={click("start")}>
          Start, mail
        </button>
      </div>

      <a
        className="studio-credit"
        href="https://grstudio.site/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bygget av GR Studio"
      >
        <GrStudioLogo className="credit-svg" title="GR Studio" />
      </a>
    </div>
  );
}
