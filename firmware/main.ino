#include <ESP8266WiFi.h> 
#include <WiFiUdp.h>
#include <cstring>
#include <stdio.h>

const int left = 2;  
const int right = 0;  

const char *ssidSTA = "botball";
const char *passwordSTA = "01020304";

WiFiUDP udp;
const char *udpAddress = "192.168.1.1"; 
const int udpPort = 4210;
char incomingPacket[255];

int input_switch = 3;
int i = 0;
int result_data = 0;
int result = 0;
void setup() {
  pinMode(left, OUTPUT);
  pinMode(right, OUTPUT);
// digitalWrite(left, LOW);
//digitalWrite(right, LOW);
  Serial.begin(115200); 
  IPAddress ip;
  IPAddress gateway;
  IPAddress subnet;


  WiFi.softAPConfig(ip, gateway, subnet);
  //WiFi.softAPConfig(udpAddress, gateway, subnet);
  WiFi.softAP(ssidSTA, passwordSTA);
  Serial.println("Access Point started");
  Serial.print("IP address: ");
  Serial.println(WiFi.softAPIP()); 
  udp.begin(udpPort);
}

// the loop function runs over and over again forever
void loop() {
  get_data();
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
        
  }
}
void get_data(){
    incomingPacket[0] = '\0';

    int packetSize = udp.parsePacket(); 
    if (packetSize) {
    int len = udp.read(incomingPacket, 255);
    if (len > 0) {
      incomingPacket[len] = 0;
    }
    Serial.printf("Received packet: %s", incomingPacket); 
    result = atoi(incomingPacket);
  }
}
