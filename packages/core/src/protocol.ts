import { AXES, JOINT_IDS } from "./types.js";
import type { JointId, SensorFrame, SensorVector } from "./types.js";

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
      AXES.map((axis) => [axis, Number(value[axis])])
    ) as SensorVector;
    if (AXES.every((axis) => Number.isFinite(result[axis]))) return result;
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
  for (const joint of JOINT_IDS) {
    const vector = parseVector(source[joint]);
    if (vector) sensors[joint as JointId] = vector;
  }
  if (!Object.keys(sensors).length) return null;
  const rawTimestamp = Number(parsed.t ?? parsed.timestamp);
  return {
    timestamp: Number.isFinite(rawTimestamp) ? rawTimestamp : receivedAt,
    sensors
  };
}
