import { AXES } from "./types.js";
import type { SensorFrame, SensorVector } from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseVector(value: unknown): SensorVector | null {
  if (Array.isArray(value) && value.length >= 3) {
    const [pitch, roll, yaw] = value.map(Number);
    if ([pitch, roll, yaw].every(Number.isFinite)) {
      return { pitch: pitch!, roll: roll!, yaw: yaw! };
    }
  }
  if (isRecord(value)) {
    const result = Object.fromEntries(
      AXES.map((axis) => [axis, Number(value[axis] ?? 0)])
    ) as SensorVector;
    const acceleration = Array.isArray(value.accel)
      ? value.accel.map(Number)
      : [value.accel_x ?? value.ax, value.accel_y ?? value.ay, value.accel_z ?? value.az].map(Number);
    const gyroscope = Array.isArray(value.gyro)
      ? value.gyro.map(Number)
      : [value.gyro_x ?? value.gx, value.gyro_y ?? value.gy, value.gyro_z ?? value.gz].map(Number);
    const hasOrientation = AXES.some((axis) => Number.isFinite(Number(value[axis])));
    const hasAcceleration = acceleration.some(Number.isFinite);
    const hasGyroscope = gyroscope.some(Number.isFinite);
    if (!hasOrientation && !hasAcceleration && !hasGyroscope) return null;
    if (Number.isFinite(acceleration[0])) result.accel_x = acceleration[0];
    if (Number.isFinite(acceleration[1])) result.accel_y = acceleration[1];
    if (Number.isFinite(acceleration[2])) result.accel_z = acceleration[2];
    if (Number.isFinite(gyroscope[0])) result.gyro_x = gyroscope[0];
    if (Number.isFinite(gyroscope[1])) result.gyro_y = gyroscope[1];
    if (Number.isFinite(gyroscope[2])) result.gyro_z = gyroscope[2];
    return result;
  }
  return null;
}

export function parseSensorLine(
  line: string,
  receivedAt = Date.now()
): SensorFrame | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  const source = isRecord(parsed.sensors) ? parsed.sensors : parsed;
  const sensors: SensorFrame["sensors"] = {};
  for (const [id, value] of Object.entries(source).slice(0, 32)) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(id)) continue;
    const vector = parseVector(value);
    if (vector) sensors[id] = vector;
  }
  if (!Object.keys(sensors).length) return null;
  const rawTimestamp = Number(parsed.t ?? parsed.timestamp);
  return {
    timestamp: Number.isFinite(rawTimestamp) ? rawTimestamp : receivedAt,
    sensors
  };
}
