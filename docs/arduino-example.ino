/*
 * Plantilla del transmisor Arduino para CyberMorph
 *
 * Reemplazar readImu() con las llamadas a la biblioteca de la IMU. Cada
 * frame es un objeto JSON terminado por un salto de línea. CyberMorph Studio
 * utiliza 115200 baudios de forma predeterminada.
 */

struct ImuReading {
  float pitch;
  float roll;
  float yaw;
  float ax;
  float ay;
  float az;
  float gx;
  float gy;
  float gz;
};

ImuReading readImu(const char* id) {
  // TODO: leer el MPU6050/BNO055/ICM20948 aquí.
  // Si no hay fusión de orientación, dejar pitch/roll/yaw en cero.
  return {0.0, 0.0, 0.0, 0.0, 0.0, 9.81, 0.0, 0.0, 0.0};
}

void printImu(const char* id, ImuReading value, bool comma) {
  Serial.print("\"");
  Serial.print(id);
  Serial.print("\":{\"pitch\":");
  Serial.print(value.pitch, 2);
  Serial.print(",\"roll\":");
  Serial.print(value.roll, 2);
  Serial.print(",\"yaw\":");
  Serial.print(value.yaw, 2);
  Serial.print(",\"accel\":[");
  Serial.print(value.ax, 3);
  Serial.print(",");
  Serial.print(value.ay, 3);
  Serial.print(",");
  Serial.print(value.az, 3);
  Serial.print("],\"gyro\":[");
  Serial.print(value.gx, 3);
  Serial.print(",");
  Serial.print(value.gy, 3);
  Serial.print(",");
  Serial.print(value.gz, 3);
  Serial.print("]");
  Serial.print("}");
  if (comma) Serial.print(",");
}

void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.print("{\"t\":");
  Serial.print(millis());
  Serial.print(",\"sensors\":{");
  printImu("left_hand", readImu("left_hand"), true);
  printImu("right_hand", readImu("right_hand"), true);
  printImu("left_foot", readImu("left_foot"), true);
  printImu("right_foot", readImu("right_foot"), false);
  Serial.println("}}");
  delay(16); // ~60 Hz
}
