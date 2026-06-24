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
  }

  Serial.println(result); 

  switch(result){ 
      case 0:
      //get_data();
          digitalWrite(left, LOW);
          digitalWrite(right, LOW);
        break;

      case 1:
      //get_data();
          digitalWrite(left, HIGH);
          digitalWrite(right, HIGH);
        break; 

      case 2:
      //get_data();
          digitalWrite(left, HIGH);
          digitalWrite(right, HIGH);
          delay(5);
          digitalWrite(right, LOW);
          delay(50);
        break; 

      case 3:
      //get_data();
          digitalWrite(right, HIGH);
          digitalWrite(left, HIGH);
          delay(5);
          digitalWrite(left, LOW);
          delay(50);
        break;

      default:
          digitalWrite(left, LOW);
          digitalWrite(right, LOW);
        break;
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
      } else {
        result = 0;
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

void apply_joystick(int throttle, int steer, int speedLimit) {
  if (abs(throttle) < joystickDeadZone && abs(steer) < joystickDeadZone) {
    result = 0;
    return;
  }

  if (throttle < -joystickDeadZone) {
    result = 0;
    return;
  }

  if (abs(steer) < joystickDeadZone) {
    result = 1;
    return;
  }

  if (steer < 0) {
    result = 2;
  } else {
    result = 3;
  }
}
