#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>

/* -------- WIFI + API CONFIG -------- */
#define WIFI_SSID     "12th man"
#define WIFI_PASSWORD "23232323"
const char *serverUrl = "http://10.52.132.132:5000/api/iot/ingest";
const char *deviceId = "esp32-greenhouse-1";
const char *iotApiKey = "some-strong-key";
const char *userId = "68a0ff564cbfd4081d6d7972";


/* -------- PIN DEFINITIONS -------- */
#define DHTPIN 4
#define DHTTYPE DHT11

#define GAS_PIN   34
#define LDR_PIN   32
#define SOIL_PIN  33

/* -------- OBJECTS -------- */
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  delay(2000);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed");
  }

  Serial.println("System starting...");
  Serial.println("Warming up MQ sensor...");
  delay(30000);
  Serial.println("Ready");
}

void loop() {
  delay(2500);

  /* -------- READ SENSORS -------- */
  float temperature = NAN;
  float humidity = NAN;
  for (int i = 0; i < 5; i++) {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    if (!isnan(temperature) && !isnan(humidity)) break;
    delay(1000);
  }
  int gasRaw        = analogRead(GAS_PIN);
  int ldrRaw        = analogRead(LDR_PIN);
  int soilRaw       = analogRead(SOIL_PIN);

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT read failed!");
    return;
  }

  /* -------- GAS -------- */
  String gasStatus;
  if (gasRaw < 1800) gasStatus = "LOW";
  else if (gasRaw < 2500) gasStatus = "NORMAL";
  else if (gasRaw < 3200) gasStatus = "HIGH";
  else gasStatus = "DANGER";

  int gasPercent = map(gasRaw, 0, 4095, 0, 100);

  /* -------- LIGHT (INVERTED LDR) -------- */
  String lightStatus;
  int lightPercent = 0;

  if (ldrRaw > 300) {              // Dark
    lightStatus = "OFF";
  } else {
    lightStatus = "ON";
    lightPercent = map(ldrRaw, 3000, 0, 0, 100);
    lightPercent = constrain(lightPercent, 0, 100);
  }

  /* -------- SOIL MOISTURE -------- */
  String soilStatus;
  int soilPercent = map(soilRaw, 4095, 0, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  if (soilRaw > 3000) {
    soilStatus = "DRY";
  } else if (soilRaw > 1800) {
    soilStatus = "NORMAL";
  } else {
    soilStatus = "WET";
  }

  /* -------- PRINT -------- */
  Serial.print("Temp: ");
  Serial.print(temperature);
  Serial.print(" °C | Hum: ");
  Serial.print(humidity);
  Serial.print(" % | Gas: ");
  Serial.print(gasPercent);
  Serial.print("% (");
  Serial.print(gasStatus);
  Serial.print(") | Light: ");
  Serial.print(lightStatus);

  if (lightStatus == "ON") {
    Serial.print(" ");
    Serial.print(lightPercent);
    Serial.print("%");
  }

  Serial.print(" | Soil: ");
  Serial.print(soilPercent);
  Serial.print("% (");
  Serial.print(soilStatus);
  Serial.println(")");

  /* -------- SEND TO BACKEND -------- */
  if (WiFi.status() == WL_CONNECTED) {
    float co2ppm = gasPercent * 100.0;   // map 0-100% to 0-10000 ppm scale
    float lightLux = lightPercent * 10.0; // map 0-100% to 0-1000 lux scale

    String payload = "{";
    payload += "\"deviceId\":\"" + String(deviceId) + "\",";
    payload += "\"userId\":\"" + String(userId) + "\",";
    payload += "\"readings\":[";
    payload += "{\"type\":\"temperature\",\"value\":" + String(temperature, 2) + ",\"unit\":\"C\"},";
    payload += "{\"type\":\"humidity\",\"value\":" + String(humidity, 2) + ",\"unit\":\"%\"},";
    payload += "{\"type\":\"co2\",\"value\":" + String(co2ppm, 1) + ",\"unit\":\"ppm\"},";
    payload += "{\"type\":\"light\",\"value\":" + String(lightLux, 1) + ",\"unit\":\"lux\"},";
    payload += "{\"type\":\"soilMoisture\",\"value\":" + String(soilPercent, 1) + ",\"unit\":\"%\"}";
    payload += "]}";

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-iot-key", String(iotApiKey));

    int httpCode = http.POST(payload);
    Serial.print("POST /api/iot/ingest -> ");
    Serial.println(httpCode);
    http.end();
  } else {
    Serial.println("WiFi not connected, skipping HTTP POST");
  }
}
