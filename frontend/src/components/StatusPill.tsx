import type { RobotStatus } from "../lib/robot";

export function StatusPill({ status }: { status: RobotStatus }) {
  const label = status.emergency ? "Stop" : status.online ? "Online" : status.state === "checking" ? "Check" : "Offline";
  return <span className={`status-pill state-${status.state}`}>{label}</span>;
}
