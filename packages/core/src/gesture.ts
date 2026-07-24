import { IMU_CHANNELS } from "./types.js";
import type {
  FeatureVector,
  GesturePrediction,
  LabeledCapture,
  SensorFrame,
  TrainedGestureModel
} from "./types.js";

function stats(values: number[]): [number, number, number, number, number] {
  if (!values.length) return [0, 0, 0, 0, 0];
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const velocity =
    values.length < 2
      ? 0
      : values
          .slice(1)
          .reduce(
            (sum, value, index) =>
              sum + Math.abs(value - (values[index] ?? value)),
            0
          ) /
        (values.length - 1);
  return [mean, Math.sqrt(variance), max - min, max, velocity];
}

export function extractFeatures(frames: SensorFrame[]): FeatureVector {
  const result: FeatureVector = {};
  const sensorIds = Array.from(
    new Set(frames.flatMap((frame) => Object.keys(frame.sensors)))
  ).sort();
  for (const sensorId of sensorIds) {
    for (const axis of IMU_CHANNELS) {
      const values = frames
        .map((frame) => frame.sensors[sensorId]?.[axis])
        .filter((value): value is number => Number.isFinite(value));
      if (!values.length) continue;
      const [mean, deviation, range, peak, velocity] = stats(values);
      const prefix = `${sensorId}.${axis}`;
      result[`${prefix}.mean`] = mean;
      result[`${prefix}.std`] = deviation;
      result[`${prefix}.range`] = range;
      result[`${prefix}.peak`] = peak;
      result[`${prefix}.velocity`] = velocity;
    }
  }
  return result;
}

function distance(a: number[], b: number[]): number {
  if (!a.length) return Number.POSITIVE_INFINITY;
  return Math.sqrt(
    a.reduce((sum, value, index) => sum + (value - (b[index] ?? 0)) ** 2, 0) /
      a.length
  );
}

export function trainGestureModel(
  captures: LabeledCapture[],
  k = 3
): TrainedGestureModel {
  const valid = captures.filter(
    (capture) => capture.label.trim() && capture.frames.length >= 2
  );
  if (valid.length < 2) {
    throw new Error("At least two labeled captures are required.");
  }

  const extracted = valid.map((capture) => ({
    label: capture.label.trim(),
    feature: extractFeatures(capture.frames)
  }));
  const featureKeys = Array.from(
    new Set(extracted.flatMap((entry) => Object.keys(entry.feature)))
  ).sort();
  const rawVectors = extracted.map((entry) =>
    featureKeys.map((key) => entry.feature[key] ?? 0)
  );
  const mean = featureKeys.map(
    (_, column) =>
      rawVectors.reduce((sum, vector) => sum + (vector[column] ?? 0), 0) /
      rawVectors.length
  );
  const scale = featureKeys.map((_, column) => {
    const variance =
      rawVectors.reduce(
        (sum, vector) =>
          sum + ((vector[column] ?? 0) - (mean[column] ?? 0)) ** 2,
        0
      ) / rawVectors.length;
    return Math.sqrt(variance) || 1;
  });
  const vectors = rawVectors.map((vector, index) => ({
    label: extracted[index]?.label ?? "unknown",
    features: vector.map(
      (value, column) =>
        (value - (mean[column] ?? 0)) / (scale[column] ?? 1)
    )
  }));

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    featureKeys,
    vectors,
    normalization: { mean, scale },
    k: Math.max(1, Math.min(k, vectors.length))
  };
}

export function predictGesture(
  model: TrainedGestureModel,
  frames: SensorFrame[]
): GesturePrediction | null {
  if (!frames.length || !model.vectors.length) return null;
  const feature = extractFeatures(frames);
  const vector = model.featureKeys.map(
    (key, index) =>
      ((feature[key] ?? 0) - (model.normalization.mean[index] ?? 0)) /
      (model.normalization.scale[index] ?? 1)
  );
  const neighbors = model.vectors
    .map((sample) => ({
      label: sample.label,
      distance: distance(vector, sample.features)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, model.k);

  if (!neighbors.length) return null;
  const votes = new Map<string, number>();
  for (const neighbor of neighbors) {
    const weight = 1 / (neighbor.distance + 0.001);
    votes.set(neighbor.label, (votes.get(neighbor.label) ?? 0) + weight);
  }
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((sum, [, weight]) => sum + weight, 0);
  const winner = ranked[0];
  if (!winner) return null;
  return {
    label: winner[0],
    confidence: Math.min(1, winner[1] / total),
    neighbors
  };
}

export function capturesToCsv(captures: LabeledCapture[]): string {
  const header = ["capture_id", "label", "timestamp", "sensor", ...IMU_CHANNELS];
  const rows = [header.map(csvCell).join(",")];
  for (const capture of captures) {
    for (const frame of capture.frames) {
      for (const [sensorId, sensor] of Object.entries(frame.sensors)) {
        if (!sensor) continue;
        rows.push(
          [
            capture.id,
            capture.label,
            frame.timestamp,
            sensorId,
            ...IMU_CHANNELS.map((channel) => sensor[channel] ?? "")
          ]
            .map(csvCell)
            .join(",")
        );
      }
    }
  }
  return rows.join("\n");
}

function csvCell(value: unknown): string {
  const stringValue = String(value);
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
}
