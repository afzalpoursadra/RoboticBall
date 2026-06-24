use serde::{Deserialize, Serialize};
use std::{
    io,
    net::{SocketAddr, UdpSocket},
    process::Command,
    str::FromStr,
    sync::Mutex,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

#[derive(Default)]
struct AppState {
    robot: Mutex<RobotRuntime>,
}

#[derive(Default)]
struct RobotRuntime {
    socket: Option<UdpSocket>,
    config: RobotConfig,
    status: RobotStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RobotConfig {
    pub robot_ip: String,
    pub robot_port: u16,
    pub local_bind: String,
    pub ack_timeout_ms: u64,
    pub max_ack_failures: u8,
}

impl Default for RobotConfig {
    fn default() -> Self {
        Self {
            robot_ip: "192.168.4.1".to_string(),
            robot_port: 4210,
            local_bind: "0.0.0.0:0".to_string(),
            ack_timeout_ms: 90,
            max_ack_failures: 3,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveControl {
    pub throttle: i16,
    pub steer: i16,
    pub speed_limit: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RobotConnectionState {
    Splash,
    WifiRequired,
    Checking,
    Online,
    Degraded,
    Offline,
    Emergency,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RobotStatus {
    pub state: RobotConnectionState,
    pub online: bool,
    pub emergency: bool,
    pub ack_failures: u8,
    pub robot_ip: String,
    pub robot_port: u16,
    pub last_payload: Option<String>,
    pub last_ack: Option<String>,
    pub left_pwm: Option<i32>,
    pub right_pwm: Option<i32>,
    pub updated_at_ms: u128,
}

impl Default for RobotStatus {
    fn default() -> Self {
        Self {
            state: RobotConnectionState::WifiRequired,
            online: false,
            emergency: false,
            ack_failures: 0,
            robot_ip: "192.168.4.1".to_string(),
            robot_port: 4210,
            last_payload: None,
            last_ack: None,
            left_pwm: None,
            right_pwm: None,
            updated_at_ms: now_ms(),
        }
    }
}

#[tauri::command]
fn connect_robot(state: tauri::State<'_, AppState>, config: RobotConfig) -> Result<RobotStatus, String> {
    let mut runtime = lock_runtime(&state)?;
    runtime.config = config.clone();
    runtime.status.robot_ip = config.robot_ip.clone();
    runtime.status.robot_port = config.robot_port;
    runtime.status.state = RobotConnectionState::Checking;
    runtime.status.updated_at_ms = now_ms();

    let socket = build_socket(&config)?;
    runtime.socket = Some(socket);

    send_payload(&mut runtime, "0,0")?;
    Ok(runtime.status.clone())
}

#[tauri::command]
fn check_robot(state: tauri::State<'_, AppState>, config: RobotConfig) -> Result<RobotStatus, String> {
    let mut runtime = lock_runtime(&state)?;
    if runtime.socket.is_none() {
        runtime.config = config.clone();
        runtime.status.robot_ip = config.robot_ip.clone();
        runtime.status.robot_port = config.robot_port;
        runtime.socket = Some(build_socket(&config)?);
    }
    send_payload(&mut runtime, "0,0")?;
    Ok(runtime.status.clone())
}

#[tauri::command]
fn disconnect_robot(state: tauri::State<'_, AppState>) -> Result<RobotStatus, String> {
    let mut runtime = lock_runtime(&state)?;
    if runtime.socket.is_some() {
        for _ in 0..2 {
            let _ = send_payload(&mut runtime, "0,0");
            thread::sleep(Duration::from_millis(20));
        }
    }
    runtime.socket = None;
    runtime.status.online = false;
    runtime.status.emergency = false;
    runtime.status.state = RobotConnectionState::WifiRequired;
    runtime.status.updated_at_ms = now_ms();
    Ok(runtime.status.clone())
}

#[tauri::command]
fn set_drive_control(state: tauri::State<'_, AppState>, control: DriveControl) -> Result<RobotStatus, String> {
    let mut runtime = lock_runtime(&state)?;
    if runtime.status.emergency {
        send_payload(&mut runtime, "0,0")?;
        runtime.status.state = RobotConnectionState::Emergency;
        return Ok(runtime.status.clone());
    }

    let throttle = control.throttle.clamp(-100, 100);
    let steer = control.steer.clamp(-100, 100);
    let speed_limit = control.speed_limit.clamp(0, 100);
    let payload = format!("J,{},{},{}", throttle, steer, speed_limit);
    send_payload(&mut runtime, &payload)?;
    Ok(runtime.status.clone())
}

#[tauri::command]
fn emergency_stop(state: tauri::State<'_, AppState>) -> Result<RobotStatus, String> {
    let mut runtime = lock_runtime(&state)?;
    runtime.status.emergency = true;
    for _ in 0..3 {
        let _ = send_payload(&mut runtime, "0,0");
        thread::sleep(Duration::from_millis(20));
    }
    runtime.status.state = RobotConnectionState::Emergency;
    runtime.status.online = false;
    runtime.status.updated_at_ms = now_ms();
    Ok(runtime.status.clone())
}

#[tauri::command]
fn clear_emergency(state: tauri::State<'_, AppState>) -> Result<RobotStatus, String> {
    let mut runtime = lock_runtime(&state)?;
    runtime.status.emergency = false;
    runtime.status.state = if runtime.status.ack_failures == 0 {
        RobotConnectionState::Online
    } else {
        RobotConnectionState::Offline
    };
    runtime.status.online = matches!(runtime.status.state, RobotConnectionState::Online);
    runtime.status.updated_at_ms = now_ms();
    Ok(runtime.status.clone())
}

#[tauri::command]
fn open_wifi_settings() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "ms-settings:network-wifi"])
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.Network-Settings.extension")
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("sh")
            .arg("-c")
            .arg("nm-connection-editor >/dev/null 2>&1 || true")
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    Ok(())
}

fn build_socket(config: &RobotConfig) -> Result<UdpSocket, String> {
    let target = format!("{}:{}", config.robot_ip, config.robot_port);
    let target_addr = SocketAddr::from_str(&target).map_err(|_| format!("invalid_target:{target}"))?;
    let socket = UdpSocket::bind(&config.local_bind).map_err(|err| format!("bind_failed:{err}"))?;
    socket.connect(target_addr).map_err(|err| format!("connect_failed:{err}"))?;
    socket
        .set_read_timeout(Some(Duration::from_millis(config.ack_timeout_ms)))
        .map_err(|err| format!("read_timeout_failed:{err}"))?;
    socket
        .set_write_timeout(Some(Duration::from_millis(80)))
        .map_err(|err| format!("write_timeout_failed:{err}"))?;
    Ok(socket)
}

fn send_payload(runtime: &mut RobotRuntime, payload: &str) -> Result<(), String> {
    let Some(socket) = runtime.socket.as_ref() else {
        runtime.status.online = false;
        runtime.status.state = RobotConnectionState::WifiRequired;
        runtime.status.updated_at_ms = now_ms();
        return Err("robot_not_connected".to_string());
    };

    socket
        .send(payload.as_bytes())
        .map_err(|err| format!("udp_send_failed:{err}"))?;

    runtime.status.last_payload = Some(payload.to_string());

    match read_ack(socket) {
        Ok(ack) => {
            runtime.status.last_ack = Some(ack.clone());
            runtime.status.ack_failures = 0;
            runtime.status.online = !runtime.status.emergency;
            runtime.status.state = if runtime.status.emergency {
                RobotConnectionState::Emergency
            } else {
                RobotConnectionState::Online
            };
            parse_pwm(&ack, &mut runtime.status);
        }
        Err(err) if err == "ack_timeout" => {
            runtime.status.ack_failures = runtime.status.ack_failures.saturating_add(1);
            runtime.status.last_ack = None;
            if runtime.status.ack_failures >= runtime.config.max_ack_failures {
                runtime.status.online = false;
                runtime.status.state = RobotConnectionState::Offline;
            } else {
                runtime.status.online = true;
                runtime.status.state = RobotConnectionState::Degraded;
            }
        }
        Err(err) => return Err(err),
    }

    runtime.status.updated_at_ms = now_ms();
    Ok(())
}

fn read_ack(socket: &UdpSocket) -> Result<String, String> {
    let mut buf = [0u8; 256];
    match socket.recv(&mut buf) {
        Ok(len) => Ok(String::from_utf8_lossy(&buf[..len]).trim().to_string()),
        Err(err) if is_timeout(&err) => Err("ack_timeout".to_string()),
        Err(err) => Err(format!("udp_recv_failed:{err}")),
    }
}

fn parse_pwm(ack: &str, status: &mut RobotStatus) {
    let parts: Vec<&str> = ack.split(':').collect();
    if parts.len() >= 4 {
        status.left_pwm = parts[2].parse::<i32>().ok();
        status.right_pwm = parts[3].parse::<i32>().ok();
    }
}

fn lock_runtime<'a>(state: &'a tauri::State<'a, AppState>) -> Result<std::sync::MutexGuard<'a, RobotRuntime>, String> {
    state.robot.lock().map_err(|_| "runtime_lock_failed".to_string())
}

fn is_timeout(err: &io::Error) -> bool {
    matches!(err.kind(), io::ErrorKind::WouldBlock | io::ErrorKind::TimedOut)
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            connect_robot,
            check_robot,
            disconnect_robot,
            set_drive_control,
            emergency_stop,
            clear_emergency,
            open_wifi_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running Gyrobit");
}
