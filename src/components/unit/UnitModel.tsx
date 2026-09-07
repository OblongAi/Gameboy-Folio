import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CanvasTexture,
  Color,
  Group,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace,
} from "three";
import { makeLabelTexture } from "../../lib/labelTexture";
import type { ButtonId } from "../../lib/machine";
import { makePlasticMaps } from "../../lib/plasticTexture";
import { makeBezelGeometry, makeBodyGeometry, makePlusGeometry, UNIT } from "../../lib/unitGeometry";
import type { LcdModel } from "../Lcd";

type Props = {
  model: LcdModel;
  lcd: HTMLCanvasElement | null;
  reduced: boolean;
  onPress: (id: ButtonId) => void;
  onPower: () => void;
};

const SHELL = "#c8c5bb";
const MAGENTA = "#b01e62";
const PAD = "#141418";
const PILL = "#8a8883";

function useTravel(restZ: number, down: boolean, reduced: boolean, travel = 0.02) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const group = ref.current;
    if (!group) return;
    const target = restZ - (down ? travel : 0);
    if (reduced) {
      group.position.z = target;
      return;
    }
    group.position.z += (target - group.position.z) * Math.min(1, dt * 26);
  });
  return ref;
}

function Hit({
  onPress,
  children,
  position,
  rotation,
}: {
  onPress: () => void;
  children?: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group
      position={position}
      rotation={rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPress();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {children}
    </group>
  );
}

function Label({
  map,
  position,
  scale,
  rotation,
}: {
  map: CanvasTexture;
  position: [number, number, number];
  scale: [number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} renderOrder={2}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function UnitModel({ model, lcd, reduced, onPress, onPower }: Props) {
  const [held, setHeld] = useState<ButtonId | "power" | null>(null);
  const grain = useMemo(() => makePlasticMaps(), []);
  const bodyGeo = useMemo(() => makeBodyGeometry(), []);
  const bezelGeo = useMemo(() => makeBezelGeometry(), []);
  const plusGeo = useMemo(() => makePlusGeometry(), []);
  const labels = useMemo(
    () => ({
      slogan: makeLabelTexture("GR STUDIO FIELD UNIT", {
        color: "#dedad2",
        width: 768,
        height: 80,
        size: 42,
        tracking: 6,
        weight: "600",
      }),
      brand: makeLabelTexture("GR STUDIO", {
        color: "#2a3f8f",
        width: 768,
        height: 180,
        size: 92,
        italic: true,
      }),
      a: makeLabelTexture("A", { color: "#2a3f8f", width: 128, height: 128, size: 78, italic: true }),
      b: makeLabelTexture("B", { color: "#2a3f8f", width: 128, height: 128, size: 78, italic: true }),
      select: makeLabelTexture("SELECT", { color: "#2a3f8f", width: 256, height: 80, size: 48, italic: true }),
      start: makeLabelTexture("START", { color: "#2a3f8f", width: 256, height: 80, size: 48, italic: true }),
      battery: makeLabelTexture("BATTERY", { color: "#c8c4bc", width: 256, height: 64, size: 36, weight: "600" }),
      power: makeLabelTexture("OFF   ON", { color: "#3f3d39", width: 256, height: 64, size: 34, weight: "700" }),
      phones: makeLabelTexture("PHONES", { color: "#4c4a46", width: 256, height: 64, size: 34, weight: "700" }),
    }),
    [],
  );

  const shellMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(SHELL),
        roughness: 0.74,
        metalness: 0.04,
        bumpMap: grain,
        bumpScale: 0.022,
      }),
    [grain],
  );

  const screenTex = useMemo(() => {
    if (!lcd) return null;
    const tex = new CanvasTexture(lcd);
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, [lcd]);

  useFrame(() => {
    if (screenTex) screenTex.needsUpdate = true;
  });

  useEffect(() => {
    const up = () => setHeld(null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  useEffect(
    () => () => {
      grain.dispose();
      bodyGeo.dispose();
      bezelGeo.dispose();
      plusGeo.dispose();
      shellMat.dispose();
      screenTex?.dispose();
      Object.values(labels).forEach((t) => t.dispose());
    },
    [grain, bodyGeo, bezelGeo, plusGeo, shellMat, screenTex, labels],
  );

  const fire = (id: ButtonId) => {
    setHeld(id);
    onPress(id);
  };

  const down = held && held !== "power" ? held : model.pressed;
  const front = UNIT.d / 2 + UNIT.bevel + 0.004;
  const bezelZ = front + 0.004;
  const dpadRef = useRef<Group>(null);
  const aRef = useTravel(front + 0.034, down === "a", reduced, 0.022);
  const bRef = useTravel(front + 0.034, down === "b", reduced, 0.022);
  const selectRef = useTravel(front + 0.026, down === "select", reduced, 0.016);
  const startRef = useTravel(front + 0.026, down === "start", reduced, 0.016);
  const powerRef = useRef<Group>(null);

  useFrame((_, dt) => {
    const g = dpadRef.current;
    if (g) {
      const rx = down === "down" ? 0.2 : down === "up" ? -0.2 : 0;
      const ry = down === "left" ? -0.2 : down === "right" ? 0.2 : 0;
      const k = reduced ? 1 : Math.min(1, dt * 22);
      g.rotation.x += (rx - g.rotation.x) * k;
      g.rotation.y += (ry - g.rotation.y) * k;
      const z = front + 0.026 - (down && ["up", "down", "left", "right"].includes(down) ? 0.012 : 0);
      g.position.z += (z - g.position.z) * k;
    }
    const p = powerRef.current;
    if (p) {
      const target = model.powered ? 0.048 : -0.048;
      const k = reduced ? 1 : Math.min(1, dt * 14);
      p.position.x += (target - p.position.x) * k;
    }
  });

  return (
    <group rotation={[0.2, -0.46, 0]}>
      <mesh geometry={bodyGeo} material={shellMat} />

      <mesh geometry={bezelGeo} position={[0, 0.42, bezelZ]}>
        <meshStandardMaterial color="#4a4a54" roughness={0.46} metalness={0.08} />
      </mesh>

      <mesh position={[0.035, 0.405, bezelZ + 0.012]}>
        <planeGeometry args={[0.5, 0.45]} />
        <meshBasicMaterial
          color={screenTex ? "#ffffff" : "#8c9448"}
          map={screenTex ?? undefined}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[-0.32, 0.46, bezelZ + 0.042]}>
        <sphereGeometry args={[0.014, 16, 12]} />
        <meshStandardMaterial
          color={model.powered ? "#ff2a3a" : "#2a1010"}
          emissive={model.powered ? "#ff2030" : "#000000"}
          emissiveIntensity={model.powered ? 2.1 : 0}
        />
      </mesh>

      <Label map={labels.slogan} position={[0.04, 0.675, bezelZ + 0.044]} scale={[0.56, 0.058]} />
      <mesh position={[-0.28, 0.692, bezelZ + 0.04]}>
        <boxGeometry args={[0.1, 0.005, 0.003]} />
        <meshStandardMaterial color="#8a3a82" />
      </mesh>
      <mesh position={[-0.28, 0.668, bezelZ + 0.04]}>
        <boxGeometry args={[0.1, 0.005, 0.003]} />
        <meshStandardMaterial color="#2a4a8a" />
      </mesh>
      <mesh position={[0.36, 0.692, bezelZ + 0.04]}>
        <boxGeometry args={[0.1, 0.005, 0.003]} />
        <meshStandardMaterial color="#8a3a82" />
      </mesh>
      <mesh position={[0.36, 0.668, bezelZ + 0.04]}>
        <boxGeometry args={[0.1, 0.005, 0.003]} />
        <meshStandardMaterial color="#2a4a8a" />
      </mesh>
      <Label map={labels.battery} position={[-0.32, 0.4, bezelZ + 0.042]} scale={[0.11, 0.028]} />
      <Label map={labels.brand} position={[-0.02, 0.02, front + 0.016]} scale={[0.7, 0.16]} />

      <mesh position={[-0.26, -0.28, front + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.162, 0.162, 0.028, 36]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.72} />
      </mesh>
      <group ref={dpadRef} position={[-0.26, -0.28, front + 0.026]}>
        <mesh
          geometry={plusGeo}
          onPointerDown={(e) => {
            e.stopPropagation();
            const local = e.object.worldToLocal(e.point.clone());
            if (Math.abs(local.x) > Math.abs(local.y)) fire(local.x > 0 ? "right" : "left");
            else fire(local.y > 0 ? "up" : "down");
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <meshStandardMaterial color={PAD} roughness={0.38} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0, 0.046]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.01, 20]} />
          <meshStandardMaterial color="#0c0c10" />
        </mesh>
      </group>

      <mesh position={[0.2, -0.33, front + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.074, 0.074, 0.022, 28]} />
        <meshStandardMaterial color="#9b9892" roughness={0.7} />
      </mesh>
      <mesh position={[0.35, -0.22, front + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.074, 0.074, 0.022, 28]} />
        <meshStandardMaterial color="#9b9892" roughness={0.7} />
      </mesh>

      <group ref={bRef} position={[0.2, -0.33, front + 0.034]}>
        <Hit onPress={() => fire("b")}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.056, 0.064, 0.046, 32]} />
            <meshStandardMaterial color={MAGENTA} roughness={0.24} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <torusGeometry args={[0.054, 0.005, 10, 28]} />
            <meshStandardMaterial color="#7d1546" roughness={0.35} />
          </mesh>
        </Hit>
      </group>
      <group ref={aRef} position={[0.35, -0.22, front + 0.034]}>
        <Hit onPress={() => fire("a")}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.056, 0.064, 0.046, 32]} />
            <meshStandardMaterial color={MAGENTA} roughness={0.24} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <torusGeometry args={[0.054, 0.005, 10, 28]} />
            <meshStandardMaterial color="#7d1546" roughness={0.35} />
          </mesh>
        </Hit>
      </group>
      <Label map={labels.b} position={[0.275, -0.41, front + 0.012]} scale={[0.05, 0.05]} />
      <Label map={labels.a} position={[0.425, -0.3, front + 0.012]} scale={[0.05, 0.05]} />

      <group ref={selectRef} position={[-0.06, -0.58, front + 0.026]} rotation={[0, 0, 0.42]}>
        <Hit onPress={() => fire("select")}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.018, 0.078, 6, 14]} />
            <meshStandardMaterial color={PILL} roughness={0.5} />
          </mesh>
        </Hit>
      </group>
      <group ref={startRef} position={[0.11, -0.545, front + 0.026]} rotation={[0, 0, 0.42]}>
        <Hit onPress={() => fire("start")}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.018, 0.078, 6, 14]} />
            <meshStandardMaterial color={PILL} roughness={0.5} />
          </mesh>
        </Hit>
      </group>
      <Label map={labels.select} position={[-0.05, -0.66, front + 0.012]} scale={[0.12, 0.036]} rotation={[0, 0, 0.42]} />
      <Label map={labels.start} position={[0.12, -0.625, front + 0.012]} scale={[0.11, 0.036]} rotation={[0, 0, 0.42]} />

      <group position={[-0.26, UNIT.h / 2 + 0.002, 0.01]}>
        <mesh>
          <boxGeometry args={[0.24, 0.02, 0.09]} />
          <meshStandardMaterial color="#b4b1a8" roughness={0.7} />
        </mesh>
        <Hit
          onPress={() => {
            setHeld("power");
            onPower();
          }}
        >
          <group ref={powerRef} position={[-0.048, 0.014, 0]}>
            <mesh>
              <boxGeometry args={[0.06, 0.024, 0.052]} />
              <meshStandardMaterial color="#8f8d87" roughness={0.4} />
            </mesh>
          </group>
        </Hit>
        <Label map={labels.power} position={[0, 0.03, 0.06]} scale={[0.16, 0.04]} rotation={[-Math.PI / 2, 0, 0]} />
      </group>

      {Array.from({ length: 6 }, (_, i) => {
        const t = i / 5;
        return (
          <mesh
            key={i}
            position={[0.34 + t * 0.08, -0.68 + t * 0.2, front - 0.01]}
            rotation={[0.15, 0.1, -0.72]}
          >
            <boxGeometry args={[0.13, 0.014, 0.1]} />
            <meshStandardMaterial color="#141416" roughness={0.92} />
          </mesh>
        );
      })}

      <Label map={labels.phones} position={[0, -0.79, front + 0.01]} scale={[0.14, 0.034]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.08, -0.9, 0.05]}>
        <circleGeometry args={[0.72, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.38} />
      </mesh>
    </group>
  );
}
