import icon from "../assets/icons/gyrobit-icon.png";
import { useRobotStore } from "../store/robotStore";
import { SvgIcon } from "./SvgIcon";

export function ConnectionSheet() {
  const { busy, error, check, openWifi, status } = useRobotStore();

  return (
    <div className="sheet-backdrop" role="presentation">
      <section className="connect-sheet" role="dialog" aria-modal="true" aria-label="Connect">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <img src={icon} alt="" />
          <div>
            <h2>Pair robot</h2>
            <p>botball</p>
          </div>
          <SvgIcon name="wifi" className="sheet-icon" />
        </div>

        <div className="mini-grid">
          <div className="mini-card">
            <SvgIcon name="bot" />
            <span>192.168.4.1</span>
          </div>
          <div className="mini-card">
            <SvgIcon name="shield" />
            <span>01020304</span>
          </div>
        </div>

        <div className="sheet-actions">
          <button className="primary-button" onClick={check} disabled={busy}>
            {busy || status.state === "checking" ? "Checking" : "Check"}
          </button>
          <button className="ghost-button" onClick={openWifi}>Wi‑Fi</button>
        </div>

        {error && <p className="sheet-error">No ACK</p>}
      </section>
    </div>
  );
}
