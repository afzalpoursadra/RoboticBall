import { useEffect } from "react";
import { ConnectionSheet } from "./components/ConnectionSheet";
import { DesktopDashboard } from "./components/DesktopDashboard";
import { MobileControlScreen } from "./components/MobileControlScreen";
import { SplashScreen } from "./components/SplashScreen";
import { defaultRobotConfig } from "./lib/robot";
import { useRobotStore } from "./store/robotStore";

function applyPreviewState() {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get("preview");
  if (!preview) return;

  const baseStatus = {
    emergency: false,
    ackFailures: 0,
    robotIp: defaultRobotConfig.robotIp,
    robotPort: defaultRobotConfig.robotPort,
    lastPayload: "J,58,-18,80",
    lastAck: "OK:1:172:148",
    leftPwm: 172,
    rightPwm: 148,
    updatedAtMs: Date.now()
  };

  if (preview === "splash") {
    useRobotStore.setState({ splashDone: false, showConnectSheet: false });
    return;
  }

  if (preview === "connect") {
    useRobotStore.setState({
      splashDone: true,
      showConnectSheet: true,
      busy: false,
      error: null,
      status: {
        ...baseStatus,
        state: "wifiRequired",
        online: false,
        lastPayload: null,
        lastAck: null,
        leftPwm: null,
        rightPwm: null
      },
      drive: { throttle: 0, steer: 0, speedLimit: 80 }
    });
    return;
  }

  if (preview === "online") {
    useRobotStore.setState({
      splashDone: true,
      showConnectSheet: false,
      busy: false,
      error: null,
      status: {
        ...baseStatus,
        state: "online",
        online: true
      },
      drive: { throttle: 58, steer: -18, speedLimit: 80 }
    });
    return;
  }

  if (preview === "degraded") {
    useRobotStore.setState({
      splashDone: true,
      showConnectSheet: false,
      busy: false,
      error: null,
      status: {
        ...baseStatus,
        state: "degraded",
        online: true,
        ackFailures: 2,
        lastAck: "OK:2:132:94",
        leftPwm: 132,
        rightPwm: 94
      },
      drive: { throttle: 48, steer: 32, speedLimit: 72 }
    });
  }
}

export default function App() {
  const { splashDone, setSplashDone, showConnectSheet, status, check } = useRobotStore();

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview) {
      applyPreviewState();
      return;
    }

    const timer = window.setTimeout(() => setSplashDone(true), 1200);
    return () => window.clearTimeout(timer);
  }, [setSplashDone]);

  useEffect(() => {
    if (!splashDone) return;
    if (new URLSearchParams(window.location.search).get("preview")) return;
    const timer = window.setInterval(() => {
      if (status.online || status.state === "degraded") void check();
    }, 1800);
    return () => window.clearInterval(timer);
  }, [splashDone, status.online, status.state, check]);

  if (!splashDone) return <SplashScreen />;

  return (
    <div className="app-shell">
      <div className="mobile-only"><MobileControlScreen /></div>
      <div className="desktop-only"><DesktopDashboard /></div>
      {showConnectSheet && <ConnectionSheet />}
    </div>
  );
}
