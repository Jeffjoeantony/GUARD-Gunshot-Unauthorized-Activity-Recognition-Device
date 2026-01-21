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
// WIFI CONFIG
// ======================
const char* ssid = "OnePlus 13";   // ✔ exact name (case-sensitive)
const char* password = "12345678";

// ======================
// BACKEND API
// ======================
const char* serverUrl = "http://10.120.49.48:5000/api/alerts";

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
#define ENERGY_THRESHOLD 800000
#define GUNSHOT_THRESHOLD 0.75
#define ALERT_CONFIDENCE_THRESHOLD 0.90
#define DETECTION_GAP_MS 3000
#define ALERT_COOLDOWN_MS 8000   // 2 minutes

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
// SEND ALERT TO DASHBOARD
// ======================
void sendAlert(float confidence, long energy) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"type\":\"gunshot\",";
  payload += "\"confidence\":" + String(confidence, 3) + ",";
  payload += "\"energy\":" + String(energy) + ",";
  payload += "\"time\":\"" + getSystemTime() + "\"";
  payload += "}";

  int code = http.POST(payload);
  Serial.print("📡 Alert sent | HTTP Code: ");
  Serial.println(code);

  http.end();
}

// ======================
// SETUP
// ======================
void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(LED_PIN, OUTPUT);

  Serial.println("\n=================================");
  Serial.println("🔊 GUNSHOT DETECTION SYSTEM");
  Serial.println("=================================");

  // ---------- WIFI ----------
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED &&
         millis() - startAttempt < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi failed (will retry later)");
  }

  // ---------- I2S ----------
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
  i2s_set_clk(I2S_NUM_0,
              EI_CLASSIFIER_FREQUENCY,
              I2S_BITS_PER_SAMPLE_32BIT,
              I2S_CHANNEL_MONO);

  i2s_zero_dma_buffer(I2S_NUM_0);
  i2s_start(I2S_NUM_0);

  Serial.println("🎤 Microphone initialized\n");
}

// ======================
// LOOP
// ======================
void loop() {
  size_t bytes_read;

  i2s_read(I2S_NUM_0,
           i2s_raw_buffer,
           sizeof(i2s_raw_buffer),
           &bytes_read,
           portMAX_DELAY);

  long energy = 0;
  for (int i = 0; i < EI_CLASSIFIER_RAW_SAMPLE_COUNT; i++) {
    int32_t s = i2s_raw_buffer[i] >> 8;
    audio_buffer[i] = constrain(s, -32768, 32767);
    energy += abs(audio_buffer[i]);
  }

  if (energy < ENERGY_THRESHOLD) return;

  signal_t signal;
  signal.total_length = EI_CLASSIFIER_RAW_SAMPLE_COUNT;
  signal.get_data = [](size_t off, size_t len, float* out) {
    for (size_t i = 0; i < len; i++)
      out[i] = audio_buffer[off + i] / 32768.0f;
    return 0;
  };

  ei_impulse_result_t result;
  if (run_classifier(&signal, &result, false) != EI_IMPULSE_OK)
    return;

  float gunshot = 0;
  float background = 0;

  for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {
    if (!strcmp(result.classification[i].label, "gunshot"))
      gunshot = result.classification[i].value;
    else
      background = result.classification[i].value;
  }

  Serial.println("---- MODEL OUTPUT ----");
  Serial.print("background: ");
  Serial.println(background, 4);
  Serial.print("gunshot: ");
  Serial.println(gunshot, 4);
  Serial.print("energy: ");
  Serial.println(energy);

  // ---------- FINAL DECISION ----------
  if (gunshot > GUNSHOT_THRESHOLD &&
      gunshot >= ALERT_CONFIDENCE_THRESHOLD &&
      gunshot > last_gunshot_score &&
      millis() - last_detection > DETECTION_GAP_MS &&
      millis() - last_alert_sent > ALERT_COOLDOWN_MS) {

    last_detection = millis();
    last_alert_sent = millis();

    Serial.println("\n🔫🔫🔫 GUNSHOT CONFIRMED 🔫🔫🔫");
    Serial.print("Time: ");
    Serial.println(getSystemTime());
    Serial.print("Confidence: ");
    Serial.println(gunshot, 3);

    digitalWrite(LED_PIN, HIGH);
    delay(300);
    digitalWrite(LED_PIN, LOW);

    sendAlert(gunshot, energy);
  }

  last_gunshot_score = gunshot;
}
