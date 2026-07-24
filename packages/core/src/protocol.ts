import { AXES } from "./types.js";
import type { ImuChannel, SensorFrame, SensorVector } from "./types.js";

type UnknownRecord = Record<string, unknown>;

export type SerialFrameFormat =
  | "auto"
  | "json"
  | "pd-accel-gyro"
  | "pd-gyro-accel";

export type SensorLineOptions = {
  format?: SerialFrameFormat;
  sensorIds?: string[];
};

const DEFAULT_LEGACY_SENSOR_IDS = [
  "left_hand",
  "right_hand",
  "left_foot",
  "right_foot"
];
const LEGACY_PD_SENSOR_ORDER = [
  "left_foot",
  "left_hand",
  "right_hand",
  "right_foot"
];
const ACCEL_GYRO_CHANNELS: ImuChannel[] = [
  "accel_x",
  "accel_y",
  "accel_z",
  "gyro_x",
  "gyro_y",
  "gyro_z",
  "pitch",
  "roll",
  "yaw"
];
const GYRO_ACCEL_CHANNELS: ImuChannel[] = [
  "gyro_x",
  "gyro_y",
  "gyro_z",
  "accel_x",
  "accel_y",
  "accel_z",
  "pitch",
  "roll",
  "yaw"
];

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
  receivedAt = Date.now(),
  options: SensorLineOptions = {}
): SensorFrame | null {
  const format = options.format ?? "auto";
  if (format !== "pd-accel-gyro" && format !== "pd-gyro-accel") {
    const jsonFrame = parseJsonSensorLine(line, receivedAt);
    if (jsonFrame || format === "json") return jsonFrame;
  }
  return parseLegacySensorLine(line, receivedAt, options);
}

function parseJsonSensorLine(
  line: string,
  receivedAt: number
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

/**
 * Adapta las listas de números que el patch histórico `pd 32serial` enviaba a
 * `unpack`. Se admite el prefijo opcional `list` y separadores por espacios,
 * comas o punto y coma.
 */
function parseLegacySensorLine(
  line: string,
  receivedAt: number,
  options: SensorLineOptions
): SensorFrame | null {
  const cleaned = line.trim().replace(/^list\s+/i, "").replace(/;$/, "").trim();
  if (!cleaned) return null;
  const atoms = cleaned.split(/[\s,;]+/);
  if (!atoms.length || atoms.length > 288) return null;
  const values = atoms.map(Number);
  if (!values.every(Number.isFinite)) return null;

  const configuredSensorIds = orderLegacySensorIds((options.sensorIds?.length
    ? options.sensorIds
    : DEFAULT_LEGACY_SENSOR_IDS
  ).slice(0, 32));
  if (!configuredSensorIds.length) return null;
  const allowedChannelCounts = [3, 6, 8, 9];
  const exactChannelCount = values.length / configuredSensorIds.length;
  const channelsPerSensor = allowedChannelCounts.includes(exactChannelCount)
    ? exactChannelCount
    : allowedChannelCounts
      .map((count) => ({ count, sensors: values.length / count }))
      .filter(({ sensors }) =>
        Number.isInteger(sensors) &&
        sensors > 0 &&
        sensors <= configuredSensorIds.length
      )
      .sort((left, right) => right.sensors - left.sensors)[0]?.count;
  if (!channelsPerSensor) return null;
  const sensorIds = configuredSensorIds.slice(0, values.length / channelsPerSensor);

  const channelOrder = options.format === "pd-gyro-accel"
    ? GYRO_ACCEL_CHANNELS
    : ACCEL_GYRO_CHANNELS;
  const sensors: SensorFrame["sensors"] = {};

  for (const [sensorIndex, sensorId] of sensorIds.entries()) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(sensorId)) continue;
    const offset = sensorIndex * channelsPerSensor;
    const vector: SensorVector = { pitch: 0, roll: 0, yaw: 0 };
    const channels = channelsPerSensor === 3 ? AXES : channelOrder;
    for (let index = 0; index < channelsPerSensor; index += 1) {
      const channel = channels[index];
      const value = values[offset + index];
      if (channel && value !== undefined) vector[channel] = value;
    }
    sensors[sensorId] = vector;
  }

  return Object.keys(sensors).length
    ? { timestamp: receivedAt, sensors }
    : null;
}

function orderLegacySensorIds(sensorIds: string[]): string[] {
  const known = LEGACY_PD_SENSOR_ORDER.filter((id) => sensorIds.includes(id));
  const remaining = sensorIds.filter((id) => !LEGACY_PD_SENSOR_ORDER.includes(id));
  return [...known, ...remaining];
}
