export const JOINT_IDS = [
  "head",
  "chest",
  "left_shoulder",
  "left_elbow",
  "left_wrist",
  "right_shoulder",
  "right_elbow",
  "right_wrist",
  "left_hip",
  "left_knee",
  "left_ankle",
  "right_hip",
  "right_knee",
  "right_ankle"
] as const;

export const AXES = ["pitch", "roll", "yaw"] as const;

export type JointId = (typeof JOINT_IDS)[number];
export type Axis = (typeof AXES)[number];
export type SensorVector = Record<Axis, number>;
export type SensorFrame = {
  timestamp: number;
  sensors: Partial<Record<JointId, SensorVector>>;
};

export type MappingTarget =
  | "midi_cc"
  | "midi_note"
  | "filter"
  | "volume"
  | "pitch"
  | "loop";

export type Curve = "linear" | "exponential" | "logarithmic" | "s_curve";

export type MotionMapping = {
  id: string;
  name: string;
  enabled: boolean;
  joint: JointId;
  axis: Axis;
  inputMin: number;
  inputMax: number;
  invert: boolean;
  curve: Curve;
  smoothing: number;
  target: MappingTarget;
  midiChannel: number;
  midiControl: number;
  outputMin: number;
  outputMax: number;
};

export type MappingOutput = {
  mappingId: string;
  target: MappingTarget;
  normalized: number;
  value: number;
  midiChannel: number;
  midiControl: number;
};

export type LabeledCapture = {
  id: string;
  label: string;
  createdAt: string;
  frames: SensorFrame[];
};

export type FeatureVector = Record<string, number>;

export type TrainedGestureModel = {
  version: 1;
  createdAt: string;
  featureKeys: string[];
  vectors: Array<{ label: string; features: number[] }>;
  normalization: {
    mean: number[];
    scale: number[];
  };
  k: number;
};

export type GesturePrediction = {
  label: string;
  confidence: number;
  neighbors: Array<{ label: string; distance: number }>;
};
