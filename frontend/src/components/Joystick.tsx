import { useEffect, useRef, useState } from "react";
import type { DriveControl } from "../lib/robot";
import { SvgIcon } from "./SvgIcon";

type JoystickProps = {
  disabled: boolean;
  speedLimit: number;
  onDrive: (control: DriveControl) => void;
};

const radius = 108;
const knobLimit = 68;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Joystick({ disabled, speedLimit, onDrive }: JoystickProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const latest = useRef<DriveControl>({ throttle: 0, steer: 0, speedLimit });
  const active = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    latest.current = { ...latest.current, speedLimit };
  }, [speedLimit]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!disabled && active.current) onDrive(latest.current);
    }, 80);
    return () => window.clearInterval(timer);
  }, [disabled, onDrive]);

  function updateFromPointer(clientX: number, clientY: number) {
    const pad = padRef.current;
    if (!pad || disabled) return;

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const length = Math.hypot(dx, dy);
    const scale = length > knobLimit ? knobLimit / length : 1;
    const x = dx * scale;
    const y = dy * scale;

    setKnob({ x, y });

    const steer = clamp(Math.round((x / knobLimit) * 100), -100, 100);
    const throttle = clamp(Math.round((-y / knobLimit) * 100), -100, 100);

    latest.current = { throttle, steer, speedLimit };
    onDrive(latest.current);
  }

  function reset() {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    latest.current = { throttle: 0, steer: 0, speedLimit };
    onDrive(latest.current);
  }

  return (
    <div className={`joystick-wrap ${disabled ? "is-disabled" : ""}`}>
      <div className="joystick-caption">
        <SvgIcon name="radar" />
        <span>Drive</span>
      </div>
      <div
        ref={padRef}
        className="joystick-pad"
        onPointerDown={(event) => {
          active.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (active.current) updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        style={{ width: radius * 2, height: radius * 2 }}
      >
        <div className="axis x" />
        <div className="axis y" />
        <div className="joy-rings" />
        <div
          className="joystick-knob"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        >
          <SvgIcon name="spark" />
        </div>
      </div>
    </div>
  );
}
