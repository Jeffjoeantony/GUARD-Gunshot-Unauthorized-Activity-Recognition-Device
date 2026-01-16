#include "Gunshot_Detection_ESP32_inferencing.h"
#include "driver/i2s.h"

#define LED_PIN 2

// I2S pins
#define I2S_SCK 14
#define I2S_WS  15
#define I2S_SD  16

// Buffers
static int32_t i2s_raw_buffer[EI_CLASSIFIER_RAW_SAMPLE_COUNT];
static int16_t audio_buffer[EI_CLASSIFIER_RAW_SAMPLE_COUNT];

// Detection thresholds
#define ENERGY_THRESHOLD              800000
#define GUNSHOT_THRESHOLD             0.75
#define ALERT_CONFIDENCE_THRESHOLD    0.90
#define DETECTION_GAP_MS              3000
#define ALERT_COOLDOWN_MS             120000   // 2 minutes

unsigned long last_detection = 0;
unsigned long last_alert_time = 0;
float last_gunshot_score = 0.0;

// ---------- SYSTEM TIME (UPTIME) ----------
String getSystemTime() {
  unsigned long totalSeconds = millis() / 1000;
  int hours = totalSeconds / 3600;
  int minutes = (totalSeconds % 3600) / 60;
  int seconds = totalSeconds % 60;

  char timeStr[16];
  sprintf(timeStr, "%02d:%02d:%02d", hours, minutes, seconds);
  return String(timeStr);
}
// -----------------------------------------

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("=================================");
  Serial.println("🔊 GUNSHOT DETECTION SYSTEM");
  Serial.println("=================================");

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

  Serial.println("🎤 Microphone initialized");
}

void loop() {
  size_t bytes_read = 0;

  i2s_read(
    I2S_NUM_0,
    (void*)i2s_raw_buffer,
    sizeof(i2s_raw_buffer),
    &bytes_read,
    portMAX_DELAY
  );

  long energy = 0;

  for (int i = 0; i < EI_CLASSIFIER_RAW_SAMPLE_COUNT; i++) {
    int32_t sample = i2s_raw_buffer[i] >> 8;
    audio_buffer[i] = constrain(sample, -32768, 32767);
    energy += abs(audio_buffer[i]);
  }

  if (energy < ENERGY_THRESHOLD) return;

  signal_t signal;
  signal.total_length = EI_CLASSIFIER_RAW_SAMPLE_COUNT;
  signal.get_data = [](size_t offset, size_t length, float *out_ptr) {
    for (size_t i = 0; i < length; i++) {
      out_ptr[i] = audio_buffer[offset + i] / 32768.0f;
    }
    return 0;
  };

  ei_impulse_result_t result;
  if (run_classifier(&signal, &result, false) != EI_IMPULSE_OK) return;

  float gunshot_score = 0.0;
  float background_score = 0.0;

  for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {
    if (strcmp(result.classification[i].label, "gunshot") == 0)
      gunshot_score = result.classification[i].value;
    else
      background_score = result.classification[i].value;
  }

  Serial.println("---- MODEL OUTPUT ----");
  Serial.print("background: ");
  Serial.println(background_score, 4);
  Serial.print("gunshot: ");
  Serial.println(gunshot_score, 4);
  Serial.print("Energy: ");
  Serial.println(energy);

  // 🔥 PEAK-ONLY DETECTION
  if (gunshot_score > GUNSHOT_THRESHOLD &&
      gunshot_score > last_gunshot_score &&
      millis() - last_detection > DETECTION_GAP_MS) {

    last_detection = millis();

    Serial.println("🔫 Gunshot detected locally");
    Serial.print("Confidence: ");
    Serial.println(gunshot_score, 3);

    // 🚨 SEND ALERT ONLY IF CONFIDENCE ≥ 0.90 AND COOLDOWN PASSED
    if (gunshot_score >= ALERT_CONFIDENCE_THRESHOLD &&
        millis() - last_alert_time >= ALERT_COOLDOWN_MS) {

      last_alert_time = millis();

      Serial.println("🚨🚨 HIGH CONFIDENCE ALERT SENT 🚨🚨");
      Serial.print("Time (HH:MM:SS): ");
      Serial.println(getSystemTime());
      Serial.print("Confidence: ");
      Serial.println(gunshot_score, 3);
      Serial.print("Energy: ");
      Serial.println(energy);

      digitalWrite(LED_PIN, HIGH);
      delay(300);
      digitalWrite(LED_PIN, LOW);
    }
    else if (gunshot_score >= ALERT_CONFIDENCE_THRESHOLD) {
      Serial.println("⏳ Alert suppressed (2-minute cooldown active)");
    }
  }

  last_gunshot_score = gunshot_score;
}
//Add ESP32 gunshot detection with cooldown and confidence filtering
