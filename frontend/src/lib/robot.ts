import { invoke } from "@tauri-apps/api/core";

export type RobotConnectionState =
  | "splash"
  | "wifiRequired"
  | "checking"
  | "online"
  | "degraded"
  | "offline"
  | "emergency";

export type RobotConfig = {
  robotIp: string;
  robotPort: number;
  localBind: string;
  ackTimeoutMs: number;
  maxAckFailures: number;
};

export type RobotStatus = {
  state: RobotConnectionState;
  online: boolean;
  emergency: boolean;
  ackFailures: number;
  robotIp: string;
  robotPort: number;
  lastPayload: string | null;
  lastAck: string | null;
  leftPwm: number | null;
  rightPwm: number | null;
  updatedAtMs: number;
};

export type DriveControl = {
  throttle: number;
  steer: number;
  speedLimit: number;
};

export const defaultRobotConfig: RobotConfig = {
  robotIp: "192.168.4.1",
  robotPort: 4210,
  localBind: "0.0.0.0:0",
  ackTimeoutMs: 90,
  maxAckFailures: 3
};

export function connectRobot(config: RobotConfig = defaultRobotConfig) {
  return invoke<RobotStatus>("connect_robot", { config });
}

export function disconnectRobot() {
  return invoke<RobotStatus>("disconnect_robot");
}

export function checkRobot(config: RobotConfig = defaultRobotConfig) {
  return invoke<RobotStatus>("check_robot", { config });
}

export function setDriveControl(control: DriveControl) {
  return invoke<RobotStatus>("set_drive_control", { control });
}

export function emergencyStop() {
  return invoke<RobotStatus>("emergency_stop");
}

export function clearEmergency() {
  return invoke<RobotStatus>("clear_emergency");
}

export function openWifiSettings() {
  return invoke<void>("open_wifi_settings");
}
