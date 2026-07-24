import type { Pose } from "@cybermorph/core";

export const POSES: Record<string, Pose> = {
  neutral: {},
  reach: {
    left_shoulder: { pitch: -110, roll: 10, yaw: -20 },
    left_elbow: { pitch: -18, roll: 0, yaw: 0 },
    right_shoulder: { pitch: -105, roll: -10, yaw: 20 },
    right_elbow: { pitch: -22, roll: 0, yaw: 0 },
    chest: { pitch: -5, roll: 0, yaw: 0 }
  },
  twist: {
    chest: { pitch: 0, roll: 0, yaw: 38 },
    left_shoulder: { pitch: -30, roll: 35, yaw: 0 },
    right_shoulder: { pitch: -30, roll: -35, yaw: 0 },
    left_elbow: { pitch: -95, roll: 0, yaw: 0 },
    right_elbow: { pitch: -95, roll: 0, yaw: 0 }
  },
  crouch: {
    chest: { pitch: -22, roll: 0, yaw: 0 },
    left_hip: { pitch: -55, roll: 0, yaw: 0 },
    right_hip: { pitch: -55, roll: 0, yaw: 0 },
    left_knee: { pitch: 105, roll: 0, yaw: 0 },
    right_knee: { pitch: 105, roll: 0, yaw: 0 },
    left_ankle: { pitch: -22, roll: 0, yaw: 0 },
    right_ankle: { pitch: -22, roll: 0, yaw: 0 }
  },
  kick: {
    right_hip: { pitch: -70, roll: 0, yaw: 0 },
    right_knee: { pitch: 28, roll: 0, yaw: 0 },
    left_knee: { pitch: 10, roll: 0, yaw: 0 },
    left_shoulder: { pitch: 35, roll: 25, yaw: 0 },
    right_shoulder: { pitch: 20, roll: -25, yaw: 0 }
  }
};
