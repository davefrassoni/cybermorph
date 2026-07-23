import { JOINT_IDS } from "./types.js";
import type { JointId, SensorFrame, SensorVector } from "./types.js";

export type Pose = Partial<Record<JointId, SensorVector>>;

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

function performanceNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
