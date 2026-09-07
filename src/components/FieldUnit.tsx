import type { MouseEvent } from "react";
import type { ButtonId } from "../lib/machine";
import { GrStudioLogo } from "./brand/GrStudioLogo";
import { Lcd, type LcdModel } from "./Lcd";

const MARK_SRC = "/favicon.svg";

type Props = {
  model: LcdModel;
  onPress: (id: ButtonId) => void;
  onPower: () => void;
};

export function FieldUnit({ model, onPress, onPower }: Props) {
  const click = (id: ButtonId) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(id);
  };

  return (
    <div className="unit">
      <div className="unit-shadow" aria-hidden />
      <div className="shell">
        <div className="shell-edge" aria-hidden />
        <div className="shell-grain" aria-hidden />

        <button
          type="button"
          className={`power ${model.powered ? "on" : ""}`}
          aria-label={model.powered ? "Power off" : "Power on"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPower();
          }}
        >
          <span className="power-knob" />
          <span className="power-caption">OFF ON</span>
        </button>

        <div className="bezel">
          <div className="bezel-rules" aria-hidden>
            <i className="rule rule-purple" />
            <p className="bezel-caption">GR STUDIO FIELD UNIT</p>
            <i className="rule rule-blue" />
          </div>
          <div className="battery">
            <span className={`led ${model.powered ? "lit" : ""}`} />
            <span>BATTERY</span>
          </div>
          <div className="lcd-well">
            <Lcd model={model} markSrc={MARK_SRC} />
            <div className="lcd-glass" aria-hidden />
            <div className="lcd-scan" aria-hidden />
          </div>
        </div>

        <p className="wordmark" aria-hidden>
          GR STUDIO
        </p>

        <div className="dpad-well">
          <div className="dpad" role="group" aria-label="Direction pad">
            <button type="button" className="pad pad-up" aria-label="Up" onClick={click("up")} />
            <button type="button" className="pad pad-left" aria-label="Left" onClick={click("left")} />
            <button type="button" className="pad pad-right" aria-label="Right" onClick={click("right")} />
            <button type="button" className="pad pad-down" aria-label="Down" onClick={click("down")} />
            <span className="pad-hub" aria-hidden />
          </div>
        </div>

        <div className="face" role="group" aria-label="Action buttons">
          <button type="button" className="face-btn b" aria-label="B, back" onClick={click("b")} />
          <span className="face-letter letter-b">B</span>
          <button type="button" className="face-btn a" aria-label="A, confirm" onClick={click("a")} />
          <span className="face-letter letter-a">A</span>
        </div>

        <div className="pills" role="group" aria-label="Start and Select">
          <button type="button" className="pill" aria-label="Select, system" onClick={click("select")} />
          <button type="button" className="pill" aria-label="Start, mail" onClick={click("start")} />
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

        <p className="phones" aria-hidden>
          PHONES
        </p>

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
