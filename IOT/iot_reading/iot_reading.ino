#include "DHT.h"

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

  Serial.println("System starting...");
  Serial.println("Warming up MQ sensor...");
  delay(30000);
  Serial.println("Ready");
}

void loop() {
  delay(2000);

  /* -------- READ SENSORS -------- */
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
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
}