/*
 * Plantilla del transmisor Arduino para CyberMorph
 *
 * Reemplazar readJoint() con las llamadas a la biblioteca de la IMU. Cada
 * frame es un objeto JSON terminado por un salto de línea. CyberMorph Studio
 * utiliza 115200 baudios de forma predeterminada.
 */

struct Rotation {
  float pitch;
  float roll;
  float yaw;
};

Rotation readJoint(const char* id) {
  // TODO: leer el MPU6050/BNO055/ICM20948 aquí.
  return {0.0, 0.0, 0.0};
}

void printJoint(const char* id, Rotation value, bool comma) {
  Serial.print("\"");
  Serial.print(id);
  Serial.print("\":{\"pitch\":");
  Serial.print(value.pitch, 2);
  Serial.print(",\"roll\":");
  Serial.print(value.roll, 2);
  Serial.print(",\"yaw\":");
  Serial.print(value.yaw, 2);
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
  printJoint("chest", readJoint("chest"), true);
  printJoint("left_elbow", readJoint("left_elbow"), true);
  printJoint("right_elbow", readJoint("right_elbow"), true);
  printJoint("left_knee", readJoint("left_knee"), true);
  printJoint("right_knee", readJoint("right_knee"), false);
  Serial.println("}}");
  delay(16); // ~60 Hz
}
