import type { MouseEvent } from "react";
import type { ButtonId } from "../lib/machine";
import { GrStudioLogo } from "./brand/GrStudioLogo";
import { Lcd, type LcdModel } from "./Lcd";
import unitPhoto from "../assets/field-unit-clean.jpg";

const MARK_SRC = "/favicon.svg";

type Props = {
  model: LcdModel;
  onPress: (id: ButtonId) => void;
  onPower: () => void;
};

function down(model: LcdModel, id: ButtonId) {
  return model.pressed === id ? " is-down" : "";
}

export function FieldUnit({ model, onPress, onPower }: Props) {
  const click = (id: ButtonId) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(id);
  };

  return (
    <div className="unit">
      <img className="unit-photo" src={unitPhoto} alt="" draggable={false} />

      <p className="slogan-cover">GR STUDIO FIELD UNIT</p>

      <div className="lcd-well">
        <Lcd model={model} markSrc={MARK_SRC} />
        <div className="lcd-glass" aria-hidden />
        <div className="lcd-scan" aria-hidden />
      </div>

      <div className={`battery-led${model.powered ? " is-on" : ""}`} aria-hidden />

      <p className="logo-cover">GR STUDIO</p>

      <button
        type="button"
        className="hot hot-power"
        aria-label={model.powered ? "Power off" : "Power on"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPower();
        }}
      />

      <div className="hot-dpad" role="group" aria-label="Direction pad">
        <button type="button" className={`hot pad-up${down(model, "up")}`} aria-label="Up" onClick={click("up")} />
        <button type="button" className={`hot pad-left${down(model, "left")}`} aria-label="Left" onClick={click("left")} />
        <button type="button" className={`hot pad-right${down(model, "right")}`} aria-label="Right" onClick={click("right")} />
        <button type="button" className={`hot pad-down${down(model, "down")}`} aria-label="Down" onClick={click("down")} />
      </div>

      <button type="button" className={`hot hot-b${down(model, "b")}`} aria-label="B, back" onClick={click("b")} />
      <button type="button" className={`hot hot-a${down(model, "a")}`} aria-label="A, confirm" onClick={click("a")} />
      <button type="button" className={`hot hot-select${down(model, "select")}`} aria-label="Select, system" onClick={click("select")} />
      <button type="button" className={`hot hot-start${down(model, "start")}`} aria-label="Start, mail" onClick={click("start")} />

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
