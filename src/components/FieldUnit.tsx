import type { ButtonId } from "../lib/machine";
import { GrStudioLogo } from "./brand/GrStudioLogo";
import { Lcd, type LcdModel } from "./Lcd";

const MARK_SRC = "/favicon.svg";

type Props = {
  model: LcdModel;
  tilt: { x: number; y: number };
  onPress: (id: ButtonId) => void;
  onRelease: () => void;
  onPower: () => void;
  onContrast: (value: number) => void;
};

export function FieldUnit({
  model,
  tilt,
  onPress,
  onRelease,
  onPower,
  onContrast,
}: Props) {
  const press = (id: ButtonId) => () => onPress(id);
  const is = (id: ButtonId) => model.pressed === id;

  return (
    <div
      className="unit"
      style={{
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <div className="unit-shadow" aria-hidden />
      <div className="shell">
        <div className="shell-lip" aria-hidden />
        <div className="shell-grain" aria-hidden />

        <button
          type="button"
          className={`power ${model.powered ? "on" : ""}`}
          aria-label={model.powered ? "Power off" : "Power on"}
          onClick={onPower}
        >
          <span />
        </button>

        <label className="contrast">
          <span className="sr-only">Contrast</span>
          <input
            type="range"
            min={0.35}
            max={1}
            step={0.01}
            value={model.contrast}
            onChange={(e) => onContrast(Number(e.target.value))}
          />
        </label>

        <div className="lens">
          <div className={`led ${model.powered ? "lit" : ""}`} aria-hidden />
          <p className="battery-label">BATTERY</p>
          <div className="lcd-well">
            <Lcd model={model} markSrc={MARK_SRC} />
            <div className="lcd-glass" aria-hidden />
            <div className="lcd-scan" aria-hidden />
          </div>
        </div>

        <div className="wordmark">
          <GrStudioLogo className="wordmark-svg" title="GR Studio" />
        </div>

        <div className="controls">
          <div className="dpad" role="group" aria-label="Direction pad">
            <button
              type="button"
              className={`pad pad-up ${is("up") ? "down" : ""}`}
              aria-label="Up"
              onPointerDown={press("up")}
              onPointerUp={onRelease}
              onPointerLeave={onRelease}
            />
            <button
              type="button"
              className={`pad pad-left ${is("left") ? "down" : ""}`}
              aria-label="Left"
              onPointerDown={press("left")}
              onPointerUp={onRelease}
              onPointerLeave={onRelease}
            />
            <span className="pad-hub" aria-hidden />
            <button
              type="button"
              className={`pad pad-right ${is("right") ? "down" : ""}`}
              aria-label="Right"
              onPointerDown={press("right")}
              onPointerUp={onRelease}
              onPointerLeave={onRelease}
            />
            <button
              type="button"
              className={`pad pad-down ${is("down") ? "down" : ""}`}
              aria-label="Down"
              onPointerDown={press("down")}
              onPointerUp={onRelease}
              onPointerLeave={onRelease}
            />
          </div>

          <div className="face" role="group" aria-label="Action buttons">
            <button
              type="button"
              className={`face-btn b ${is("b") ? "down" : ""}`}
              aria-label="B, back"
              onPointerDown={press("b")}
              onPointerUp={onRelease}
              onPointerLeave={onRelease}
            />
            <span className="face-letter letter-b" aria-hidden>
              B
            </span>
            <button
              type="button"
              className={`face-btn a ${is("a") ? "down" : ""}`}
              aria-label="A, confirm"
              onPointerDown={press("a")}
              onPointerUp={onRelease}
              onPointerLeave={onRelease}
            />
            <span className="face-letter letter-a" aria-hidden>
              A
            </span>
          </div>
        </div>

        <div className="pills" role="group" aria-label="Start and Select">
          <button
            type="button"
            className={`pill ${is("select") ? "down" : ""}`}
            aria-label="Select, system"
            onPointerDown={press("select")}
            onPointerUp={onRelease}
            onPointerLeave={onRelease}
          />
          <button
            type="button"
            className={`pill ${is("start") ? "down" : ""}`}
            aria-label="Start, mail"
            onPointerDown={press("start")}
            onPointerUp={onRelease}
            onPointerLeave={onRelease}
          />
          <div className="pill-labels">
            <span>SELECT</span>
            <span>START</span>
          </div>
        </div>

        <div className={`speaker ${model.pulse > 0 ? "sing" : ""}`} aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} />
          ))}
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
    </div>
  );
}
