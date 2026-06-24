import { create } from "zustand";
import {
  checkRobot,
  clearEmergency,
  connectRobot,
  defaultRobotConfig,
  disconnectRobot,
  emergencyStop,
  openWifiSettings,
  setDriveControl,
  type DriveControl,
  type RobotConfig,
  type RobotConnectionState,
  type RobotStatus
} from "../lib/robot";

type RobotStore = {
  status: RobotStatus;
  config: RobotConfig;
  drive: DriveControl;
  busy: boolean;
  error: string | null;
  showConnectSheet: boolean;
  splashDone: boolean;
  setSplashDone: (value: boolean) => void;
  setShowConnectSheet: (value: boolean) => void;
  setSpeedLimit: (value: number) => void;
  connect: () => Promise<void>;
  check: () => Promise<void>;
  disconnect: () => Promise<void>;
  setDrive: (control: DriveControl) => Promise<void>;
  stop: () => Promise<void>;
  clearStop: () => Promise<void>;
  openWifi: () => Promise<void>;
};

const now = Date.now();

const initialStatus: RobotStatus = {
  state: "wifiRequired",
  online: false,
  emergency: false,
  ackFailures: 0,
  robotIp: defaultRobotConfig.robotIp,
  robotPort: defaultRobotConfig.robotPort,
  lastPayload: null,
  lastAck: null,
  leftPwm: null,
  rightPwm: null,
  updatedAtMs: now
};

function stateFromError(): RobotConnectionState {
  return "offline";
}

export const useRobotStore = create<RobotStore>((set, get) => ({
  status: initialStatus,
  config: defaultRobotConfig,
  drive: { throttle: 0, steer: 0, speedLimit: 80 },
  busy: false,
  error: null,
  showConnectSheet: true,
  splashDone: false,
  setSplashDone: (value) => set({ splashDone: value }),
  setShowConnectSheet: (value) => set({ showConnectSheet: value }),
  setSpeedLimit: (value) => {
    const speedLimit = Math.max(0, Math.min(100, Math.round(value)));
    set((state) => ({ drive: { ...state.drive, speedLimit } }));
  },
  connect: async () => {
    set({ busy: true, error: null, status: { ...get().status, state: "checking" } });
    try {
      const status = await connectRobot(get().config);
      set({ status, busy: false, showConnectSheet: !status.online, error: null });
    } catch (error) {
      set({
        busy: false,
        error: String(error),
        showConnectSheet: true,
        status: { ...get().status, state: stateFromError(), online: false }
      });
    }
  },
  check: async () => {
    set({ busy: true, error: null, status: { ...get().status, state: "checking" } });
    try {
      const status = await checkRobot(get().config);
      set({ status, busy: false, showConnectSheet: !status.online, error: null });
    } catch (error) {
      set({
        busy: false,
        error: String(error),
        showConnectSheet: true,
        status: { ...get().status, state: stateFromError(), online: false }
      });
    }
  },
  disconnect: async () => {
    try {
      const status = await disconnectRobot();
      set({ status, showConnectSheet: true });
    } catch (error) {
      set({ error: String(error) });
    }
  },
  setDrive: async (control) => {
    const clamped = {
      throttle: Math.max(-100, Math.min(100, Math.round(control.throttle))),
      steer: Math.max(-100, Math.min(100, Math.round(control.steer))),
      speedLimit: Math.max(0, Math.min(100, Math.round(control.speedLimit)))
    };
    set({ drive: clamped });

    const status = get().status;
    if (!status.online || status.emergency) return;

    try {
      const next = await setDriveControl(clamped);
      set({ status: next, showConnectSheet: !next.online && next.state !== "degraded" });
    } catch (error) {
      set({
        error: String(error),
        showConnectSheet: true,
        status: { ...get().status, state: "offline", online: false }
      });
    }
  },
  stop: async () => {
    try {
      const status = await emergencyStop();
      set({ status, drive: { ...get().drive, throttle: 0, steer: 0 }, showConnectSheet: false });
    } catch (error) {
      set({ error: String(error) });
    }
  },
  clearStop: async () => {
    try {
      const status = await clearEmergency();
      set({ status });
    } catch (error) {
      set({ error: String(error) });
    }
  },
  openWifi: async () => {
    try {
      await openWifiSettings();
    } catch (error) {
      set({ error: String(error) });
    }
  }
}));
