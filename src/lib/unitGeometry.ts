import { ExtrudeGeometry, Shape } from "three";

export const UNIT = {
  w: 1,
  h: 1.64,
  d: 0.36,
  bevel: 0.026,
  corner: 0.056,
  speaker: 0.3,
};

function roundedRect(cx: number, cy: number, w: number, h: number, r: number) {
  const s = new Shape();
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const x1 = cx + w / 2;
  const y1 = cy + h / 2;
  const cr = Math.min(r, w / 2, h / 2);
  s.moveTo(x0 + cr, y0);
  s.lineTo(x1 - cr, y0);
  s.absarc(x1 - cr, y0 + cr, cr, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - cr);
  s.absarc(x1 - cr, y1 - cr, cr, 0, Math.PI / 2, false);
  s.lineTo(x0 + cr, y1);
  s.absarc(x0 + cr, y1 - cr, cr, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + cr);
  s.absarc(x0 + cr, y0 + cr, cr, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function makeBodyGeometry() {
  const { w, h, d, corner, speaker } = UNIT;
  const s = new Shape();
  const left = -w / 2;
  const right = w / 2;
  const bottom = -h / 2;
  const top = h / 2;

  s.moveTo(left + corner, bottom);
  s.lineTo(right - speaker, bottom);
  s.absarc(right - speaker, bottom + speaker, speaker, -Math.PI / 2, 0, false);
  s.lineTo(right, top - corner);
  s.absarc(right - corner, top - corner, corner, 0, Math.PI / 2, false);
  s.lineTo(left + corner, top);
  s.absarc(left + corner, top - corner, corner, Math.PI / 2, Math.PI, false);
  s.lineTo(left, bottom + corner);
  s.absarc(left + corner, bottom + corner, corner, Math.PI, Math.PI * 1.5, false);

  const geo = new ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: UNIT.bevel,
    bevelSize: 0.022,
    bevelSegments: 3,
    curveSegments: 36,
  });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  return geo;
}

export function makeBezelGeometry() {
  const plate = roundedRect(0, 0, 0.84, 0.64, 0.045);
  const well = roundedRect(0.04, -0.015, 0.52, 0.46, 0.012);
  plate.holes.push(well);
  const geo = new ExtrudeGeometry(plate, {
    depth: 0.038,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 1,
    curveSegments: 16,
  });
  geo.computeVertexNormals();
  return geo;
}

export function makePlusGeometry() {
  const s = new Shape();
  const arm = 0.042;
  const span = 0.148;
  s.moveTo(-span, -arm);
  s.lineTo(-arm, -arm);
  s.lineTo(-arm, -span);
  s.lineTo(arm, -span);
  s.lineTo(arm, -arm);
  s.lineTo(span, -arm);
  s.lineTo(span, arm);
  s.lineTo(arm, arm);
  s.lineTo(arm, span);
  s.lineTo(-arm, span);
  s.lineTo(-arm, arm);
  s.lineTo(-span, arm);
  s.closePath();
  const geo = new ExtrudeGeometry(s, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.007,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.01);
  geo.computeVertexNormals();
  return geo;
}
