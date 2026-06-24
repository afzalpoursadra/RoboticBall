#include <ESP8266WiFi.h> 
#include <WiFiUdp.h>
#include <cstring>
#include <stdio.h>

const int left = 2;  
const int right = 0;  

const char *ssidSTA = "botball";
const char *passwordSTA = "01020304";

WiFiUDP udp;
const char *udpAddress = "192.168.4.1"; 
const int udpPort = 4210;
char incomingPacket[255];

int input_switch = 3;
int i = 0;
int result_data = 0;
int result = 0;

unsigned long lastPacketTime = 0;
const unsigned long failsafeTimeout = 500;

// ===== Network Config ===== //

IPAddress ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// ===== PWM Config ===== //

const int pwmRange = 255;
const int pwmFrequency = 1000;
const int defaultSpeed = 200;
const int minSpeed = 0;
const int maxSpeed = 255;
const int turnInnerPercent = 15;

// ===== Motion State ===== //

int commandSpeed = defaultSpeed;

int targetLeftPwm = 0;
int targetRightPwm = 0;

int currentLeftPwm = 0;
int currentRightPwm = 0;

const int rampStep = 12;
const unsigned long rampInterval = 15;
unsigned long lastRampTime = 0;

const int joystickDeadZone = 12;

unsigned long lastPrintTime = 0;
const unsigned long printInterval = 120;

void setup() {
  pinMode(left, OUTPUT);
  pinMode(right, OUTPUT);
// digitalWrite(left, LOW);
//digitalWrite(right, LOW);

  analogWriteRange(pwmRange);
  analogWriteFreq(pwmFrequency);

  stop_motors();

  Serial.begin(115200); 

  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(ip, gateway, subnet);
  //WiFi.softAPConfig(udpAddress, gateway, subnet);
  WiFi.softAP(ssidSTA, passwordSTA);

  Serial.println("Access Point started");
  Serial.print("IP address: ");
  Serial.println(WiFi.softAPIP()); 

  udp.begin(udpPort);

  lastPacketTime = millis();
}

// the loop function runs over and over again forever
void loop() {
  get_data();

  if (millis() - lastPacketTime > failsafeTimeout) {
    result = 0;
    set_target_pwm(0, 0);
  }

  update_motors();

  if (millis() - lastPrintTime > printInterval) {
    Serial.print("CMD: ");
    Serial.print(result);
    Serial.print(" | L: ");
    Serial.print(currentLeftPwm);
    Serial.print(" | R: ");
    Serial.println(currentRightPwm);
    lastPrintTime = millis();
  }
}

void get_data(){
    incomingPacket[0] = '\0';

    int packetSize = udp.parsePacket(); 

    if (packetSize) {
      int len = udp.read(incomingPacket, sizeof(incomingPacket) - 1);

      if (len > 0) {
        incomingPacket[len] = 0;
      }

      Serial.printf("Received packet: %s\n", incomingPacket); 

      // ===== Command Parser ===== //

      bool ok = parse_packet(incomingPacket);

      if (ok) {
        lastPacketTime = millis();
        send_ack("OK");
      } else {
        result = 0;
        set_target_pwm(0, 0);
        send_ack("ERR");
      }
    }
}

bool parse_packet(char *packet) {
  char *first = strtok(packet, ",");

  if (first == NULL) {
    return false;
  }

  if (strcmp(first, "J") == 0 || strcmp(first, "j") == 0) {
    return parse_joystick_packet();
  }

  int cmd = atoi(first);

  char *speedToken = strtok(NULL, ",");

  int speed = defaultSpeed;

  if (speedToken != NULL) {
    speed = atoi(speedToken);
  }

  speed = constrain(speed, minSpeed, maxSpeed);

  if (cmd < 0 || cmd > 3) {
    return false;
  }

  result = cmd;
  commandSpeed = speed;
  apply_command(result, commandSpeed);

  return true;
}

bool parse_joystick_packet() {
  char *throttleToken = strtok(NULL, ",");
  char *steerToken = strtok(NULL, ",");
  char *limitToken = strtok(NULL, ",");

  if (throttleToken == NULL || steerToken == NULL) {
    return false;
  }

  int throttle = atoi(throttleToken);
  int steer = atoi(steerToken);
  int speedLimit = 100;

  if (limitToken != NULL) {
    speedLimit = atoi(limitToken);
  }

  throttle = constrain(throttle, -100, 100);
  steer = constrain(steer, -100, 100);
  speedLimit = constrain(speedLimit, 0, 100);

  apply_joystick(throttle, steer, speedLimit);

  return true;
}

void apply_command(int cmd, int speed) {
  switch(cmd){ 
      case 0:
      //get_data();
          set_target_pwm(0, 0);
        break;

      case 1:
      //get_data();
          set_target_pwm(speed, speed);
        break; 

      case 2:
      //get_data();
          set_soft_turn_left(speed);
        break; 

      case 3:
      //get_data();
          set_soft_turn_right(speed);
        break;

      default:
          set_target_pwm(0, 0);
        break;
  }
}

void apply_joystick(int throttle, int steer, int speedLimit) {
  if (abs(throttle) < joystickDeadZone && abs(steer) < joystickDeadZone) {
    result = 0;
    set_target_pwm(0, 0);
    return;
  }

  if (throttle < -joystickDeadZone) {
    result = 0;
    set_target_pwm(0, 0);
    return;
  }

  int limitedMax = map(speedLimit, 0, 100, 0, maxSpeed);
  int speed = map(abs(throttle), 0, 100, 0, limitedMax);

  speed = constrain(speed, minSpeed, maxSpeed);

  if (speed == 0 && abs(steer) >= joystickDeadZone) {
    speed = map(abs(steer), 0, 100, 0, limitedMax);
  }

  if (abs(steer) < joystickDeadZone) {
    result = 1;
    set_target_pwm(speed, speed);
    return;
  }

  int steerAmount = constrain(abs(steer), 0, 100);
  int innerPwm = map(steerAmount, 0, 100, speed, get_turn_inner_pwm(speed));

  if (steer < 0) {
    result = 2;
    set_target_pwm(speed, innerPwm);
  } else {
    result = 3;
    set_target_pwm(innerPwm, speed);
  }
}

void set_soft_turn_left(int speed) {
  int innerPwm = get_turn_inner_pwm(speed);
  set_target_pwm(speed, innerPwm);
}

void set_soft_turn_right(int speed) {
  int innerPwm = get_turn_inner_pwm(speed);
  set_target_pwm(innerPwm, speed);
}

int get_turn_inner_pwm(int speed) {
  int innerPwm = (speed * turnInnerPercent) / 100;
  return constrain(innerPwm, 0, speed);
}

void set_target_pwm(int leftPwm, int rightPwm) {
  targetLeftPwm = constrain(leftPwm, minSpeed, maxSpeed);
  targetRightPwm = constrain(rightPwm, minSpeed, maxSpeed);
}

void update_motors() {
  if (millis() - lastRampTime < rampInterval) {
    return;
  }

  currentLeftPwm = ramp_value(currentLeftPwm, targetLeftPwm);
  currentRightPwm = ramp_value(currentRightPwm, targetRightPwm);

  analogWrite(left, currentLeftPwm);
  analogWrite(right, currentRightPwm);

  lastRampTime = millis();
}

int ramp_value(int currentValue, int targetValue) {
  if (currentValue < targetValue) {
    currentValue += rampStep;

    if (currentValue > targetValue) {
      currentValue = targetValue;
    }
  } else if (currentValue > targetValue) {
    currentValue -= rampStep;

    if (currentValue < targetValue) {
      currentValue = targetValue;
    }
  }

  return currentValue;
}

void send_ack(const char *message) {
  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.print(message);
  udp.print(":");
  udp.print(result);
  udp.print(":");
  udp.print(currentLeftPwm);
  udp.print(":");
  udp.print(currentRightPwm);
  udp.endPacket();
}

void stop_motors() {
  targetLeftPwm = 0;
  targetRightPwm = 0;
  currentLeftPwm = 0;
  currentRightPwm = 0;

  analogWrite(left, 0);
  analogWrite(right, 0);
}