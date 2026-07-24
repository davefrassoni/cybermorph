import type {
  Curve,
  MappingOutput,
  MotionMapping,
  SensorFrame
} from "./types.js";

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function applyCurve(value: number, curve: Curve): number {
  const x = clamp(value);
  switch (curve) {
    case "exponential":
      return x * x;
    case "logarithmic":
      return Math.sqrt(x);
    case "s_curve":
      return x * x * (3 - 2 * x);
    default:
      return x;
  }
}

export function normalizeInput(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  if (min === max) return 0;
  const normalized = clamp((value - min) / (max - min));
  return invert ? 1 - normalized : normalized;
}

export function mapFrame(
  frame: SensorFrame,
  mappings: MotionMapping[],
  previousValues: Map<string, number> = new Map()
): MappingOutput[] {
  return mappings.flatMap((mapping) => {
    if (!mapping.enabled) return [];
    const sensor = frame.sensors[mapping.sensorId ?? mapping.joint];
    if (!sensor) return [];
    const input = sensor[mapping.channel ?? mapping.axis];
    if (typeof input !== "number" || !Number.isFinite(input)) return [];

    const raw = normalizeInput(
      input,
      mapping.inputMin,
      mapping.inputMax,
      mapping.invert
    );
    const curved = applyCurve(raw, mapping.curve);
    const previous = previousValues.get(mapping.id) ?? curved;
    const smoothing = clamp(mapping.smoothing);
    const normalized = previous * smoothing + curved * (1 - smoothing);
    previousValues.set(mapping.id, normalized);

    const continuous =
      mapping.outputMin +
      normalized * (mapping.outputMax - mapping.outputMin);
    const value =
      mapping.target === "midi_cc" ||
      mapping.target === "midi_note" ||
      mapping.target === "loop"
        ? Math.round(clamp(continuous, 0, 127))
        : continuous;

    return [
      {
        mappingId: mapping.id,
        target: mapping.target,
        normalized,
        value,
        midiChannel: clamp(Math.round(mapping.midiChannel), 1, 16),
        midiControl: clamp(Math.round(mapping.midiControl), 0, 127)
      }
    ];
  });
}

export const DEFAULT_MAPPINGS: MotionMapping[] = [
  {
    id: "left-hand-filter",
    name: "Left hand gyro → filter",
    enabled: true,
    joint: "left_wrist",
    axis: "pitch",
    sensorId: "left_hand",
    channel: "gyro_x",
    inputMin: -220,
    inputMax: 220,
    invert: false,
    curve: "s_curve",
    smoothing: 0.35,
    target: "filter",
    midiChannel: 1,
    midiControl: 74,
    outputMin: 120,
    outputMax: 12000
  },
  {
    id: "right-hand-cc",
    name: "Right hand acceleration → CC 1",
    enabled: true,
    joint: "right_wrist",
    axis: "roll",
    sensorId: "right_hand",
    channel: "accel_y",
    inputMin: -12,
    inputMax: 12,
    invert: false,
    curve: "linear",
    smoothing: 0.2,
    target: "midi_cc",
    midiChannel: 1,
    midiControl: 1,
    outputMin: 0,
    outputMax: 127
  },
  {
    id: "right-foot-loop",
    name: "Right foot acceleration → loop",
    enabled: true,
    joint: "right_ankle",
    axis: "pitch",
    sensorId: "right_foot",
    channel: "accel_z",
    inputMin: 6,
    inputMax: 20,
    invert: false,
    curve: "logarithmic",
    smoothing: 0.5,
    target: "loop",
    midiChannel: 1,
    midiControl: 7,
    outputMin: 0,
    outputMax: 127
  }
];
