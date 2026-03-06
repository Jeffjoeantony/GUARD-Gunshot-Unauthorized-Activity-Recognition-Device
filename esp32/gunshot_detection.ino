#include "Gunshot_Detection_ESP32_inferencing.h"
#include "driver/i2s.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ======================
// DEVICE CONFIG
// ======================
#define DEVICE_ID "ESP32_NODE_01"
#define LED_PIN 2

// ======================
// STATIC DEVICE LOCATION
// ======================
#define DEVICE_LATITUDE  9.533445
#define DEVICE_LONGITUDE 76.823377

// ======================
// WIFI CONFIG (2.4 GHz ONLY)
// ======================
const char* ssid = "abcdefgh";
const char* password = "12345678";

// ======================
// BACKEND API
// ======================
const char* serverUrl = "http://10.119.120.48:5000/api/alerts";

// ======================
// I2S PINS
// ======================
#define I2S_SCK 14
#define I2S_WS  15
#define I2S_SD  16

// ======================
// BUFFERS
// ======================
static int32_t i2s_raw_buffer[EI_CLASSIFIER_RAW_SAMPLE_COUNT];
static int16_t audio_buffer[EI_CLASSIFIER_RAW_SAMPLE_COUNT];

// ======================
// DETECTION TUNING
// ======================
#define ENERGY_THRESHOLD 1200000
#define GUNSHOT_THRESHOLD 0.75
#define ALERT_CONFIDENCE_THRESHOLD 0.90
#define DETECTION_GAP_MS 1000
#define ALERT_COOLDOWN_MS 80000

unsigned long last_detection = 0;
unsigned long last_alert_sent = 0;
float last_gunshot_score = 0.0;

// ======================
// TIME (UPTIME)
// ======================
String getSystemTime() {
  unsigned long t = millis() / 1000;
  char buf[16];
  sprintf(buf, "%02lu:%02lu:%02lu",
          t / 3600,
          (t % 3600) / 60,
          t % 60);
  return String(buf);
}

// ======================
// WIFI CONNECT
// ======================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("\n📶 Connecting to WiFi...");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  delay(500);

  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED &&
         millis() - start < 20000) {
    Serial.print(".");
    delay(500);
    yield();
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi CONNECTED");
    Serial.print("📡 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi NOT CONNECTED (will retry)");
  }
}

// ======================
// SEND ALERT
// ======================
void sendAlert(float confidence, long energy) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Alert skipped (WiFi down)");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"type\":\"gunshot\",";
  payload += "\"confidence\":" + String(confidence, 3) + ",";
  payload += "\"energy\":" + String(energy) + ",";
  payload += "\"time\":\"" + getSystemTime() + "\",";
  payload += "\"latitude\":" + String(DEVICE_LATITUDE, 6) + ",";
  payload += "\"longitude\":" + String(DEVICE_LONGITUDE, 6);
  payload += "}";

  int code = http.POST(payload);

  Serial.print("📡 Alert HTTP code: ");
  Serial.println(code);

  http.end();
}

// ======================
// SETUP
// ======================
void setup() {

  Serial.begin(115200);
  while (!Serial) delay(10);

  pinMode(LED_PIN, OUTPUT);

  Serial.println("\n=================================");
  Serial.println("🔊 GUNSHOT DETECTION SYSTEM");
  Serial.println("=================================");

  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());

  connectWiFi();

  // ---------- I2S CONFIG ----------
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = EI_CLASSIFIER_FREQUENCY,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S_MSB,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 512,
    .use_apll = false
  };

  i2s_pin_config_t pins = {
    .bck_io_num = I2S_SCK,
    .ws_io_num  = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num  = I2S_SD
  };

  i2s_driver_install(I2S_NUM_0, &cfg, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pins);
  i2s_set_clk(
    I2S_NUM_0,
    EI_CLASSIFIER_FREQUENCY,
    I2S_BITS_PER_SAMPLE_32BIT,
    I2S_CHANNEL_MONO
  );

  i2s_zero_dma_buffer(I2S_NUM_0);
  i2s_start(I2S_NUM_0);

  Serial.println("🎤 Microphone READY");
}

// ======================
// LOOP
// ======================
void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  size_t bytes_read = 0;

  esp_err_t res = i2s_read(
    I2S_NUM_0,
    i2s_raw_buffer,
    sizeof(i2s_raw_buffer),
    &bytes_read,
    50 / portTICK_PERIOD_MS
  );

  if (res != ESP_OK || bytes_read == 0) {
    yield();
    return;
  }

  long energy = 0;

  for (int i = 0; i < EI_CLASSIFIER_RAW_SAMPLE_COUNT; i++) {
    int32_t s = i2s_raw_buffer[i] >> 8;
    audio_buffer[i] = constrain(s, -32768, 32767);
    energy += abs(audio_buffer[i]);
  }

  if (energy < ENERGY_THRESHOLD) {
    yield();
    return;
  }

  signal_t signal;
  signal.total_length = EI_CLASSIFIER_RAW_SAMPLE_COUNT;

  signal.get_data = [](size_t off, size_t len, float* out) {
    for (size_t i = 0; i < len; i++) {
      out[i] = audio_buffer[off + i] / 32768.0f;
    }
    return 0;
  };

  ei_impulse_result_t result;

  if (run_classifier(&signal, &result, false) != EI_IMPULSE_OK) {
    yield();
    return;
  }

  float gunshot = 0;
  float background = 0;

  for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {

    if (!strcmp(result.classification[i].label, "gunshot"))
      gunshot = result.classification[i].value;
    else
      background = result.classification[i].value;
  }

  Serial.println("\n---- MODEL OUTPUT ----");
  Serial.print("Background: ");
  Serial.println(background, 4);
  Serial.print("Gunshot: ");
  Serial.println(gunshot, 4);
  Serial.print("Energy: ");
  Serial.println(energy);

  if (gunshot > GUNSHOT_THRESHOLD &&
      gunshot >= ALERT_CONFIDENCE_THRESHOLD &&
      gunshot > last_gunshot_score &&
      millis() - last_detection > DETECTION_GAP_MS &&
      millis() - last_alert_sent > ALERT_COOLDOWN_MS) {

    last_detection = millis();
    last_alert_sent = millis();

    Serial.println("🔫🔫🔫 GUNSHOT CONFIRMED 🔫🔫🔫");

    digitalWrite(LED_PIN, HIGH);
    delay(300);
    digitalWrite(LED_PIN, LOW);

    sendAlert(gunshot, energy);
  }

  last_gunshot_score = gunshot;

  yield();
}
