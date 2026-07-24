import {
  clampPose,
  type MovementClip,
  type Pose
} from "@cybermorph/core";

const frame = (at: number, pose: Pose) => ({ at, pose: clampPose(pose) });

export const DANCE_MOVEMENTS: MovementClip[] = [
  {
    id: "dance-side-groove",
    name: "Side groove",
    createdAt: "2026-01-01T00:00:00.000Z",
    duration: 3200,
    loop: true,
    source: "preset",
    keyframes: [
      frame(0, {}),
      frame(800, {
        chest: { pitch: 6, roll: -18, yaw: -18 },
        left_shoulder: { pitch: -35, roll: 72, yaw: -15 },
        right_shoulder: { pitch: -20, roll: -28, yaw: 12 },
        left_elbow: { pitch: 74, roll: 0, yaw: 10 },
        right_elbow: { pitch: 105, roll: 0, yaw: -8 },
        left_hip: { pitch: -16, roll: -16, yaw: 8 },
        right_knee: { pitch: 32, roll: 0, yaw: 0 },
        right_ankle: { pitch: -14, roll: 7, yaw: 0 }
      }),
      frame(1600, {}),
      frame(2400, {
        chest: { pitch: 6, roll: 18, yaw: 18 },
        left_shoulder: { pitch: -20, roll: 28, yaw: -12 },
        right_shoulder: { pitch: -35, roll: -72, yaw: 15 },
        left_elbow: { pitch: 105, roll: 0, yaw: 8 },
        right_elbow: { pitch: 74, roll: 0, yaw: -10 },
        right_hip: { pitch: -16, roll: 16, yaw: -8 },
        left_knee: { pitch: 32, roll: 0, yaw: 0 },
        left_ankle: { pitch: -14, roll: -7, yaw: 0 }
      }),
      frame(3200, {})
    ]
  },
  {
    id: "dance-robot-pulse",
    name: "Robot pulse",
    createdAt: "2026-01-01T00:00:00.000Z",
    duration: 2400,
    loop: true,
    source: "preset",
    keyframes: [
      frame(0, {
        left_shoulder: { pitch: -78, roll: 30, yaw: -12 },
        right_shoulder: { pitch: -78, roll: -30, yaw: 12 },
        left_elbow: { pitch: 90, roll: 0, yaw: 0 },
        right_elbow: { pitch: 90, roll: 0, yaw: 0 }
      }),
      frame(600, {
        chest: { pitch: -8, roll: 0, yaw: 28 },
        left_shoulder: { pitch: -110, roll: 60, yaw: -35 },
        right_shoulder: { pitch: -45, roll: -18, yaw: 32 },
        left_elbow: { pitch: 48, roll: 0, yaw: 18 },
        right_elbow: { pitch: 126, roll: 0, yaw: -18 },
        left_wrist: { pitch: 45, roll: 20, yaw: 18 },
        right_wrist: { pitch: -35, roll: -20, yaw: -18 }
      }),
      frame(1200, {
        chest: { pitch: 12, roll: 0, yaw: 0 },
        left_shoulder: { pitch: -55, roll: 20, yaw: 0 },
        right_shoulder: { pitch: -55, roll: -20, yaw: 0 },
        left_elbow: { pitch: 115, roll: 0, yaw: 0 },
        right_elbow: { pitch: 115, roll: 0, yaw: 0 },
        left_knee: { pitch: 35, roll: 0, yaw: 0 },
        right_knee: { pitch: 35, roll: 0, yaw: 0 }
      }),
      frame(1800, {
        chest: { pitch: -8, roll: 0, yaw: -28 },
        left_shoulder: { pitch: -45, roll: 18, yaw: -32 },
        right_shoulder: { pitch: -110, roll: -60, yaw: 35 },
        left_elbow: { pitch: 126, roll: 0, yaw: 18 },
        right_elbow: { pitch: 48, roll: 0, yaw: -18 },
        left_wrist: { pitch: -35, roll: 20, yaw: 18 },
        right_wrist: { pitch: 45, roll: -20, yaw: -18 }
      }),
      frame(2400, {
        left_shoulder: { pitch: -78, roll: 30, yaw: -12 },
        right_shoulder: { pitch: -78, roll: -30, yaw: 12 },
        left_elbow: { pitch: 90, roll: 0, yaw: 0 },
        right_elbow: { pitch: 90, roll: 0, yaw: 0 }
      })
    ]
  },
  {
    id: "dance-hand-wave",
    name: "Hand wave",
    createdAt: "2026-01-01T00:00:00.000Z",
    duration: 2000,
    loop: true,
    source: "preset",
    keyframes: [
      frame(0, {
        right_shoulder: { pitch: -88, roll: -72, yaw: 5 },
        right_elbow: { pitch: 95, roll: 0, yaw: -10 },
        right_wrist: { pitch: 0, roll: -20, yaw: -25 }
      }),
      frame(500, {
        right_shoulder: { pitch: -92, roll: -78, yaw: 5 },
        right_elbow: { pitch: 72, roll: 0, yaw: -25 },
        right_wrist: { pitch: 38, roll: 20, yaw: 25 },
        chest: { pitch: 0, roll: -5, yaw: -10 }
      }),
      frame(1000, {
        right_shoulder: { pitch: -88, roll: -72, yaw: 5 },
        right_elbow: { pitch: 105, roll: 0, yaw: 12 },
        right_wrist: { pitch: -35, roll: -20, yaw: -25 }
      }),
      frame(1500, {
        right_shoulder: { pitch: -92, roll: -78, yaw: 5 },
        right_elbow: { pitch: 72, roll: 0, yaw: -25 },
        right_wrist: { pitch: 38, roll: 20, yaw: 25 },
        chest: { pitch: 0, roll: -5, yaw: -10 }
      }),
      frame(2000, {
        right_shoulder: { pitch: -88, roll: -72, yaw: 5 },
        right_elbow: { pitch: 95, roll: 0, yaw: -10 },
        right_wrist: { pitch: 0, roll: -20, yaw: -25 }
      })
    ]
  },
  {
    id: "dance-kick-step",
    name: "Kick step",
    createdAt: "2026-01-01T00:00:00.000Z",
    duration: 3000,
    loop: true,
    source: "preset",
    keyframes: [
      frame(0, {}),
      frame(750, {
        chest: { pitch: 8, roll: -8, yaw: -12 },
        left_hip: { pitch: -28, roll: -8, yaw: 0 },
        left_knee: { pitch: 72, roll: 0, yaw: 0 },
        left_ankle: { pitch: -22, roll: 0, yaw: 0 },
        left_shoulder: { pitch: -45, roll: 55, yaw: 0 },
        right_shoulder: { pitch: 15, roll: -35, yaw: 0 }
      }),
      frame(1500, {}),
      frame(2250, {
        chest: { pitch: 8, roll: 8, yaw: 12 },
        right_hip: { pitch: -28, roll: 8, yaw: 0 },
        right_knee: { pitch: 72, roll: 0, yaw: 0 },
        right_ankle: { pitch: -22, roll: 0, yaw: 0 },
        right_shoulder: { pitch: -45, roll: -55, yaw: 0 },
        left_shoulder: { pitch: 15, roll: 35, yaw: 0 }
      }),
      frame(3000, {})
    ]
  }
];
