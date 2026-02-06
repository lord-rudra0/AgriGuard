#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiManager.h>
#include <Preferences.h>

/* -------- WIFI + API CONFIG -------- */
const char *deviceId = "esp32-greenhouse-1";
String serverUrlStr = "http://10.52.132.132:5000/api/iot/ingest";
String deviceTokenStr = "";
Preferences prefs;


/* -------- PIN DEFINITIONS -------- */
#define DHTPIN 4
#define DHTTYPE DHT11

#define GAS_PIN   34
#define LDR_PIN   32
#define SOIL_PIN  33

// Calibrate these with your sensor (raw ADC values)
// Put probe in dry soil and note raw value, then in wet soil
#define SOIL_RAW_DRY  4095
#define SOIL_RAW_WET  1200

/* -------- OBJECTS -------- */
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  delay(2000);

  prefs.begin("agri", false);
  serverUrlStr = prefs.getString("serverUrl", serverUrlStr);
  deviceTokenStr = prefs.getString("deviceToken", deviceTokenStr);

  WiFiManager wm;
  WiFiManagerParameter p_server("server", "Server URL", serverUrlStr.c_str(), 120);
  WiFiManagerParameter p_token("token", "Device Token", deviceTokenStr.c_str(), 80);
  wm.addParameter(&p_server);
  wm.addParameter(&p_token);

  bool res = wm.autoConnect("AgriGuard-Setup");
  if (!res) {
    Serial.println("WiFiManager failed, restarting...");
    delay(3000);
    ESP.restart();
  }

  serverUrlStr = String(p_server.getValue());
  deviceTokenStr = String(p_token.getValue());
  prefs.putString("serverUrl", serverUrlStr);
  prefs.putString("deviceToken", deviceTokenStr);

  Serial.print("WiFi connected, IP: ");
  Serial.println(WiFi.localIP());

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

  /* -------- LIGHT -------- */
  String lightStatus;
  int lightPercent = map(ldrRaw, 3000, 0, 0, 100);
  lightPercent = constrain(lightPercent, 0, 100);
  lightStatus = (lightPercent > 5) ? "ON" : "OFF";

  /* -------- SOIL MOISTURE -------- */
  String soilStatus;
  int soilPercent = map(soilRaw, SOIL_RAW_DRY, SOIL_RAW_WET, 0, 100);
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
    if (!isfinite(temperature)) temperature = 0.0;
    if (!isfinite(humidity)) humidity = 0.0;
    if (!isfinite(co2ppm)) co2ppm = 0.0;
    if (!isfinite(lightLux)) lightLux = 0.0;

    String payload = "{";
    payload += "\"deviceId\":\"" + String(deviceId) + "\",";
    payload += "\"readings\":[";
    payload += "{\"type\":\"temperature\",\"value\":" + String(temperature, 2) + ",\"unit\":\"C\"},";
    payload += "{\"type\":\"humidity\",\"value\":" + String(humidity, 2) + ",\"unit\":\"%\"},";
    payload += "{\"type\":\"co2\",\"value\":" + String(co2ppm, 1) + ",\"unit\":\"ppm\"},";
    payload += "{\"type\":\"light\",\"value\":" + String(lightLux, 1) + ",\"unit\":\"lux\"},";
    payload += "{\"type\":\"soilMoisture\",\"value\":" + String(soilPercent) + ",\"unit\":\"%\"}";
    payload += "]}";

    Serial.print("Payload: ");
    Serial.println(payload);

    HTTPClient http;
    http.begin(serverUrlStr.c_str());
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-token", deviceTokenStr);

    int httpCode = http.POST(payload);
    Serial.print("POST /api/iot/ingest -> ");
    Serial.println(httpCode);
    http.end();
  } else {
    Serial.println("WiFi not connected, skipping HTTP POST");
  }
}
