import { AXES, JOINT_IDS } from "./types.js";
import type { Axis, JointId, SensorVector } from "./types.js";
import type { Pose } from "./simulator.js";

export type JointRange = readonly [min: number, max: number];
export type JointLimits = Record<Axis, JointRange>;

/**
 * Rangos articulares conservadores para el simulador, expresados en grados.
 *
 * Son límites de movimiento local, no límites para los datos crudos de los
 * sensores. De esta forma una IMU puede seguir entregando su orientación
 * completa mientras el gemelo digital evita poses anatómicamente imposibles.
 *
 * En el avatar, pitch negativo desplaza un miembro hacia delante. Como el
 * cuerpo mira hacia +Z, roll positivo separa el lado izquierdo del torso y
 * roll negativo separa el derecho. La flexión del codo es por tanto negativa,
 * mientras que la de la rodilla es positiva porque la pierna inferior se
 * pliega hacia atrás.
 */
export const JOINT_LIMITS: Record<JointId, JointLimits> = {
  head: {
    pitch: [-45, 45],
    roll: [-35, 35],
    yaw: [-80, 80]
  },
  chest: {
    pitch: [-45, 30],
    roll: [-30, 30],
    yaw: [-45, 45]
  },
  left_shoulder: {
    pitch: [-160, 60],
    roll: [-40, 130],
    yaw: [-90, 90]
  },
  right_shoulder: {
    pitch: [-160, 60],
    roll: [-130, 40],
    yaw: [-90, 90]
  },
  left_elbow: {
    pitch: [-145, 0],
    roll: [0, 0],
    yaw: [-80, 80]
  },
  right_elbow: {
    pitch: [-145, 0],
    roll: [0, 0],
    yaw: [-80, 80]
  },
  left_wrist: {
    pitch: [-70, 80],
    roll: [-25, 35],
    yaw: [-30, 30]
  },
  right_wrist: {
    pitch: [-70, 80],
    roll: [-35, 25],
    yaw: [-30, 30]
  },
  left_hip: {
    pitch: [-120, 30],
    roll: [-25, 45],
    yaw: [-45, 45]
  },
  right_hip: {
    pitch: [-120, 30],
    roll: [-45, 25],
    yaw: [-45, 45]
  },
  left_knee: {
    pitch: [0, 135],
    roll: [0, 0],
    yaw: [-10, 10]
  },
  right_knee: {
    pitch: [0, 135],
    roll: [0, 0],
    yaw: [-10, 10]
  },
  left_ankle: {
    pitch: [-40, 55],
    roll: [-25, 25],
    yaw: [-20, 20]
  },
  right_ankle: {
    pitch: [-40, 55],
    roll: [-25, 25],
    yaw: [-20, 20]
  }
};

export function clampJointValue(joint: JointId, axis: Axis, value: number): number {
  const [min, max] = JOINT_LIMITS[joint][axis];
  return Math.min(max, Math.max(min, value));
}

export function clampJointVector(joint: JointId, vector: SensorVector): SensorVector {
  return Object.fromEntries(
    AXES.map((axis) => [axis, clampJointValue(joint, axis, vector[axis])])
  ) as SensorVector;
}

export function clampPose(pose: Pose): Pose {
  return Object.fromEntries(
    JOINT_IDS.flatMap((joint) => {
      const vector = pose[joint];
      return vector ? [[joint, clampJointVector(joint, vector)]] : [];
    })
  ) as Pose;
}
