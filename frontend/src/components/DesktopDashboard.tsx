import icon from "../assets/icons/gyrobit-icon.png";
import { useRobotStore } from "../store/robotStore";
import { Joystick } from "./Joystick";
import { StatusPill } from "./StatusPill";
import { SvgIcon } from "./SvgIcon";

export function DesktopDashboard() {
  const { status, drive, setDrive, setSpeedLimit, check, disconnect, stop, clearStop, setShowConnectSheet } = useRobotStore();
  const locked = !status.online || status.emergency;

  return (
    <main className="desktop-shell">
      <aside className="side-panel motion-left">
        <div className="side-brand">
          <img src={icon} alt="" />
          <div>
            <h1>Gyrobit</h1>
            <p>Motion control</p>
          </div>
        </div>
        <button className="panel-button" onClick={() => setShowConnectSheet(true)}><SvgIcon name="wifi" />Pair</button>
        <button className="panel-button" onClick={check}><SvgIcon name="radar" />Check</button>
        <button className="panel-button" onClick={disconnect}><SvgIcon name="shield" />Drop</button>
        <div className="panel-spacer" />
        <StatusPill status={status} />
      </aside>

      <section className="desktop-main motion-right">
        <header className="desktop-topbar">
          <div>
            <p className="eyebrow">Robot</p>
            <h2>{status.online ? "Online" : "Standby"}</h2>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={check}>Ping</button>
            {status.emergency ? <button className="primary-button safe" onClick={clearStop}>Reset</button> : <button className="danger-button" onClick={stop}>Stop</button>}
          </div>
        </header>

        <div className="desktop-grid">
          <section className="console-card large">
            <div className="card-title"><SvgIcon name="radar" />Control</div>
            <Joystick disabled={locked} speedLimit={drive.speedLimit} onDrive={setDrive} />
          </section>

          <section className="console-card">
            <div className="card-title"><SvgIcon name="gauge" />Speed</div>
            <div className="dial-value">{drive.speedLimit}%</div>
            <input type="range" min="20" max="100" value={drive.speedLimit} onChange={(event) => setSpeedLimit(Number(event.target.value))} disabled={!status.online} />
          </section>

          <section className="console-card">
            <div className="card-title"><SvgIcon name="wave" />PWM</div>
            <div className="telemetry-line"><span>Left</span><strong>{status.leftPwm ?? 0}</strong></div>
            <div className="telemetry-line"><span>Right</span><strong>{status.rightPwm ?? 0}</strong></div>
            <div className="telemetry-line"><span>ACK</span><strong>{status.lastAck ?? "—"}</strong></div>
          </section>
        </div>
      </section>
    </main>
  );
}
