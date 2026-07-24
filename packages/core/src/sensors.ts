import type {
  JointId,
  SensorFrame,
  SensorVector,
  SuitSensor
} from "./types.js";
import type { Pose } from "./simulator.js";

const ZERO: SensorVector = { pitch: 0, roll: 0, yaw: 0 };
const PARENTS: Partial<Record<JointId, JointId>> = {
  head: "chest",
  left_shoulder: "chest",
  left_elbow: "left_shoulder",
  left_wrist: "left_elbow",
  right_shoulder: "chest",
  right_elbow: "right_shoulder",
  right_wrist: "right_elbow",
  left_knee: "left_hip",
  left_ankle: "left_knee",
  right_knee: "right_hip",
  right_ankle: "right_knee"
};

export const DEFAULT_SENSORS: SuitSensor[] = [
  { id: "left_hand", name: "IMU mano izquierda", enabled: true, location: "left_wrist" },
  { id: "right_hand", name: "IMU mano derecha", enabled: true, location: "right_wrist" },
  { id: "left_foot", name: "IMU pie izquierdo", enabled: true, location: "left_ankle" },
  { id: "right_foot", name: "IMU pie derecho", enabled: true, location: "right_ankle" }
];

export type SimulatorMotionState = {
  timestamp: number;
  pose: Pose;
  angularVelocity: Record<string, {
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
  }>;
};

export function selectConfiguredSensors(
  frame: SensorFrame,
  sensors: SuitSensor[]
): SensorFrame {
  const selected: SensorFrame["sensors"] = {};
  for (const sensor of sensors) {
    if (!sensor.enabled) continue;
    const reading = frame.sensors[sensor.id] ?? frame.sensors[sensor.location];
    if (reading) selected[sensor.id] = reading;
  }
  return { timestamp: frame.timestamp, sensors: selected };
}

export function applySensorReadingsToPose(
  pose: Pose,
  frame: SensorFrame,
  sensors: SuitSensor[]
): Pose {
  const next = { ...pose };
  for (const sensor of sensors) {
    if (!sensor.enabled) continue;
    const reading = frame.sensors[sensor.id] ?? frame.sensors[sensor.location];
    if (!reading) continue;
    next[sensor.location] = {
      pitch: reading.pitch,
      roll: reading.roll,
      yaw: reading.yaw
    };
  }
  return next;
}

export function simulateImuFrame(
  pose: Pose,
  sensors: SuitSensor[],
  previous?: SimulatorMotionState,
  timestamp = performanceNow()
): { frame: SensorFrame; state: SimulatorMotionState } {
  const seconds = previous
    ? Math.max(1 / 120, Math.min(0.25, (timestamp - previous.timestamp) / 1000))
    : 1 / 30;
  const readings: SensorFrame["sensors"] = {};
  const angularVelocity: SimulatorMotionState["angularVelocity"] = {};

  for (const sensor of sensors) {
    if (!sensor.enabled) continue;
    const current = globalOrientation(pose, sensor.location);
    const before = previous
      ? globalOrientation(previous.pose, sensor.location)
      : current;
    const gyro = {
      gyro_x: (current.pitch - before.pitch) / seconds,
      gyro_y: (current.roll - before.roll) / seconds,
      gyro_z: (current.yaw - before.yaw) / seconds
    };
    const oldGyro = previous?.angularVelocity[sensor.id] ?? {
      gyro_x: 0,
      gyro_y: 0,
      gyro_z: 0
    };
    const scale = Math.PI / 180 * 0.18;
    readings[sensor.id] = {
      ...current,
      accel_x: clampAcceleration((gyro.gyro_x - oldGyro.gyro_x) / seconds * scale),
      accel_y: clampAcceleration((gyro.gyro_y - oldGyro.gyro_y) / seconds * scale),
      accel_z: clampAcceleration(9.81 + (gyro.gyro_z - oldGyro.gyro_z) / seconds * scale),
      ...gyro
    };
    angularVelocity[sensor.id] = gyro;
  }

  return {
    frame: { timestamp, sensors: readings },
    state: { timestamp, pose, angularVelocity }
  };
}

export function sensorAtLocation(
  sensors: SuitSensor[],
  location: JointId
): SuitSensor[] {
  return sensors.filter((sensor) => sensor.location === location);
}

function clampAcceleration(value: number): number {
  return Math.max(-32, Math.min(32, value));
}

function globalOrientation(pose: Pose, location: JointId): SensorVector {
  const result = { ...ZERO };
  let current: JointId | undefined = location;
  while (current) {
    const local = pose[current];
    if (local) {
      result.pitch += local.pitch;
      result.roll += local.roll;
      result.yaw += local.yaw;
    }
    current = PARENTS[current];
  }
  return result;
}

function performanceNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
