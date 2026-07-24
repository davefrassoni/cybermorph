import { JOINT_IDS } from "./types.js";
import type { JointId, SensorFrame, SensorVector } from "./types.js";

export type Pose = Partial<Record<JointId, SensorVector>>;
export type MovementKeyframe = {
  at: number;
  pose: Pose;
};
export type MovementClip = {
  id: string;
  name: string;
  createdAt: string;
  duration: number;
  loop: boolean;
  source: "preset" | "recorded";
  keyframes: MovementKeyframe[];
};

export const NEUTRAL_POSE: Pose = Object.fromEntries(
  JOINT_IDS.map((joint) => [
    joint,
    { pitch: 0, roll: 0, yaw: 0 }
  ])
) as Pose;

export function poseToFrame(
  pose: Pose,
  timestamp = performanceNow()
): SensorFrame {
  return { timestamp, sensors: pose };
}

export function interpolatePose(from: Pose, to: Pose, progress: number): Pose {
  const t = Math.min(1, Math.max(0, progress));
  return Object.fromEntries(
    JOINT_IDS.map((joint) => {
      const a = from[joint] ?? { pitch: 0, roll: 0, yaw: 0 };
      const b = to[joint] ?? { pitch: 0, roll: 0, yaw: 0 };
      return [
        joint,
        {
          pitch: a.pitch + (b.pitch - a.pitch) * t,
          roll: a.roll + (b.roll - a.roll) * t,
          yaw: a.yaw + (b.yaw - a.yaw) * t
        }
      ];
    })
  ) as Pose;
}

export function sampleMovement(clip: MovementClip, elapsed: number): Pose {
  if (!clip.keyframes.length) return {};
  const duration = Math.max(1, clip.duration);
  const time = clip.loop
    ? ((elapsed % duration) + duration) % duration
    : Math.max(0, Math.min(duration, elapsed));
  const first = clip.keyframes[0]!;
  const last = clip.keyframes[clip.keyframes.length - 1]!;
  if (time <= first.at) return first.pose;
  if (time >= last.at) return last.pose;
  const nextIndex = clip.keyframes.findIndex((keyframe) => keyframe.at >= time);
  const next = clip.keyframes[Math.max(1, nextIndex)]!;
  const previous = clip.keyframes[Math.max(0, nextIndex - 1)]!;
  const span = Math.max(1, next.at - previous.at);
  const linear = (time - previous.at) / span;
  const eased = linear * linear * (3 - 2 * linear);
  return interpolatePose(previous.pose, next.pose, eased);
}

function performanceNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
