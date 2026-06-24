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

      int cmd = atoi(incomingPacket);

      // ===== Command Validation ===== //

      if (cmd >= 0 && cmd <= 3) {
        result = cmd;
        lastPacketTime = millis();
        send_ack("OK");
      } else {
        result = 0;
        send_ack("ERR");
      }
    }
}

void send_ack(const char *message) {
  udp.beginPacket(udp.remoteIP(), udp.remotePort());
  udp.print(message);
  udp.print(":");
  udp.print(result);
  udp.endPacket();
}

void stop_motors() {
  digitalWrite(left, LOW);
  digitalWrite(right, LOW);
}