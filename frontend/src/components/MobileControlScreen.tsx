import icon from "../assets/icons/gyrobit-icon.png";
import { useRobotStore } from "../store/robotStore";
import { Joystick } from "./Joystick";
import { StatusPill } from "./StatusPill";
import { SvgIcon } from "./SvgIcon";

export function MobileControlScreen() {
  const { status, drive, setDrive, setSpeedLimit, stop, clearStop, setShowConnectSheet } = useRobotStore();
  const locked = !status.online || status.emergency;

  return (
    <main className="mobile-screen">
      <header className="mobile-top motion-down" style={{ ["--delay" as string]: "0.06s" }}>
        <div className="brand-chip">
          <img src={icon} alt="" />
          <span>Gyrobit</span>
        </div>
        <button className="tiny-button" onClick={() => setShowConnectSheet(true)}>
          <StatusPill status={status} />
        </button>
      </header>

      <section className="hero-card motion-left" style={{ ["--delay" as string]: "0.12s" }}>
        <div>
          <p className="eyebrow">Robot</p>
          <h1>{status.online ? "Ready" : "Locked"}</h1>
        </div>
        <SvgIcon name={status.online ? "bolt" : "wifi"} className="hero-svg" />
      </section>

      <section className="quick-row motion-right" style={{ ["--delay" as string]: "0.18s" }}>
        <div className="quick-card"><SvgIcon name="gauge" /><span>{drive.speedLimit}%</span></div>
        <div className="quick-card"><SvgIcon name="wave" /><span>{status.leftPwm ?? 0}/{status.rightPwm ?? 0}</span></div>
      </section>

      <div className="motion-up" style={{ ["--delay" as string]: "0.24s" }}><Joystick disabled={locked} speedLimit={drive.speedLimit} onDrive={setDrive} /></div>

      <section className="bottom-controls motion-up" style={{ ["--delay" as string]: "0.3s" }}>
        <label className="speed-card">
          <span>Speed</span>
          <strong>{drive.speedLimit}%</strong>
          <input
            type="range"
            min="20"
            max="100"
            value={drive.speedLimit}
            onChange={(event) => setSpeedLimit(Number(event.target.value))}
            disabled={!status.online}
          />
        </label>
        {status.emergency ? (
          <button className="primary-button safe" onClick={clearStop}>Reset</button>
        ) : (
          <button className="danger-button" onClick={stop}>Stop</button>
        )}
      </section>
    </main>
  );
}
