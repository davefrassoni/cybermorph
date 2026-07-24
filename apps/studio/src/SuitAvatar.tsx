import { ContactShadows, Environment, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { PropsWithChildren } from "react";
import * as THREE from "three";
import {
  clampJointVector,
  type JointId,
  type Pose,
  type SensorVector
} from "@cybermorph/core";

type Props = {
  pose: Pose;
  selected: JointId;
  onSelect: (joint: JointId) => void;
};

type JointNodeProps = PropsWithChildren<{
  joint: JointId;
  pose: Pose;
  selected: JointId;
  onSelect: (joint: JointId) => void;
  position?: [number, number, number];
  baseRotation?: [number, number, number];
  markerScale?: number;
}>;

const ZERO_VECTOR: SensorVector = { pitch: 0, roll: 0, yaw: 0 };
const SUIT = "#101720";
const SUIT_LIGHT = "#1b2530";
const ACID = "#c9ff3d";
const CYAN = "#66f4db";
const PINK = "#ff52d7";

function radians(value: number): number {
  return THREE.MathUtils.degToRad(value);
}

function localRotation(
  joint: JointId,
  pose: Pose,
  baseRotation: [number, number, number]
): [number, number, number] {
  const vector = clampJointVector(joint, pose[joint] ?? ZERO_VECTOR);
  return [
    baseRotation[0] + radians(vector.pitch),
    baseRotation[1] + radians(vector.yaw),
    baseRotation[2] + radians(vector.roll)
  ];
}

function JointMarker({ active, scale = 1 }: { active: boolean; scale?: number }) {
  return (
    <group scale={scale}>
      <mesh>
        <sphereGeometry args={[0.105, 20, 16]} />
        <meshStandardMaterial
          color={active ? ACID : SUIT_LIGHT}
          emissive={active ? ACID : "#000000"}
          emissiveIntensity={active ? 0.45 : 0}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.018, 8, 24]} />
        <meshBasicMaterial color={active ? "#ffffff" : PINK} />
      </mesh>
      <mesh position={[0, 0, 0.105]}>
        <circleGeometry args={[0.035, 18]} />
        <meshBasicMaterial color={active ? "#ffffff" : CYAN} />
      </mesh>
    </group>
  );
}

function JointNode({
  joint,
  pose,
  selected,
  onSelect,
  position = [0, 0, 0],
  baseRotation = [0, 0, 0],
  markerScale = 1,
  children
}: JointNodeProps) {
  const active = selected === joint;
  return (
    <group
      position={position}
      rotation={localRotation(joint, pose, baseRotation)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(joint);
      }}
    >
      <JointMarker active={active} scale={markerScale} />
      {children}
    </group>
  );
}

function Limb({
  length,
  radius,
  active = false
}: {
  length: number;
  radius: number;
  active?: boolean;
}) {
  const capsuleLength = Math.max(0.08, length - radius * 2);
  return (
    <group>
      <mesh position={[0, -length / 2, 0]} castShadow>
        <capsuleGeometry args={[radius, capsuleLength, 10, 20]} />
        <meshStandardMaterial
          color={active ? "#263514" : SUIT}
          emissive={active ? ACID : "#000000"}
          emissiveIntensity={active ? 0.12 : 0}
          roughness={0.48}
          metalness={0.58}
        />
      </mesh>
      <mesh position={[0, -length / 2, radius * 0.88]} scale={[0.72, 0.88, 0.22]}>
        <capsuleGeometry args={[radius, capsuleLength, 6, 12]} />
        <meshStandardMaterial
          color={active ? ACID : SUIT_LIGHT}
          emissive={active ? ACID : CYAN}
          emissiveIntensity={active ? 0.42 : 0.05}
          roughness={0.34}
          metalness={0.72}
        />
      </mesh>
      <mesh position={[0, -length / 2, 0]} scale={1.025}>
        <capsuleGeometry args={[radius, capsuleLength, 6, 12]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function Hand({ active }: { active: boolean }) {
  return (
    <group position={[0, -0.2, 0]}>
      <mesh castShadow scale={[0.12, 0.23, 0.075]}>
        <capsuleGeometry args={[0.5, 0.9, 8, 14]} />
        <meshStandardMaterial
          color={active ? "#33451a" : SUIT_LIGHT}
          emissive={active ? ACID : "#000000"}
          emissiveIntensity={active ? 0.18 : 0}
          roughness={0.44}
          metalness={0.55}
        />
      </mesh>
      <mesh position={[0, 0.02, 0.078]} scale={[0.07, 0.12, 0.018]}>
        <boxGeometry />
        <meshBasicMaterial color={CYAN} />
      </mesh>
    </group>
  );
}

function Foot({ active }: { active: boolean }) {
  return (
    <group position={[0, -0.08, 0.2]}>
      <RoundedBox args={[0.27, 0.19, 0.58]} radius={0.08} smoothness={3} castShadow>
        <meshStandardMaterial
          color={active ? "#33451a" : SUIT_LIGHT}
          emissive={active ? ACID : "#000000"}
          emissiveIntensity={active ? 0.16 : 0}
          roughness={0.5}
          metalness={0.55}
        />
      </RoundedBox>
      <mesh position={[0, -0.105, 0.045]} scale={[0.29, 0.03, 0.61]}>
        <boxGeometry />
        <meshStandardMaterial color="#05080c" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Arm({
  side,
  pose,
  selected,
  onSelect
}: Props & { side: "left" | "right" }) {
  const shoulder = `${side}_shoulder` as JointId;
  const elbow = `${side}_elbow` as JointId;
  const wrist = `${side}_wrist` as JointId;
  const direction = side === "left" ? -1 : 1;
  const upperLength = 0.76;
  const forearmLength = 0.68;

  return (
    <JointNode
      joint={shoulder}
      position={[direction * 0.59, 1.25, 0]}
      baseRotation={[0, 0, direction * 0.1]}
      pose={pose}
      selected={selected}
      onSelect={onSelect}
      markerScale={1.08}
    >
      <Limb length={upperLength} radius={0.145} active={selected === shoulder} />
      <JointNode
        joint={elbow}
        position={[0, -upperLength, 0]}
        pose={pose}
        selected={selected}
        onSelect={onSelect}
      >
        <Limb length={forearmLength} radius={0.115} active={selected === elbow} />
        <JointNode
          joint={wrist}
          position={[0, -forearmLength, 0]}
          pose={pose}
          selected={selected}
          onSelect={onSelect}
          markerScale={0.78}
        >
          <Hand active={selected === wrist} />
        </JointNode>
      </JointNode>
    </JointNode>
  );
}

function Leg({
  side,
  pose,
  selected,
  onSelect
}: Props & { side: "left" | "right" }) {
  const hip = `${side}_hip` as JointId;
  const knee = `${side}_knee` as JointId;
  const ankle = `${side}_ankle` as JointId;
  const direction = side === "left" ? -1 : 1;
  const thighLength = 0.92;
  const shinLength = 0.86;

  return (
    <JointNode
      joint={hip}
      position={[direction * 0.27, 0.17, 0]}
      pose={pose}
      selected={selected}
      onSelect={onSelect}
      markerScale={1.08}
    >
      <Limb length={thighLength} radius={0.18} active={selected === hip} />
      <JointNode
        joint={knee}
        position={[0, -thighLength, 0]}
        pose={pose}
        selected={selected}
        onSelect={onSelect}
        markerScale={1.05}
      >
        <Limb length={shinLength} radius={0.14} active={selected === knee} />
        <JointNode
          joint={ankle}
          position={[0, -shinLength, 0]}
          pose={pose}
          selected={selected}
          onSelect={onSelect}
          markerScale={0.82}
        >
          <Foot active={selected === ankle} />
        </JointNode>
      </JointNode>
    </JointNode>
  );
}

function Torso({ active }: { active: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.72, 0]} scale={[0.74, 1, 0.42]} castShadow>
        <capsuleGeometry args={[0.43, 0.72, 12, 24]} />
        <meshStandardMaterial
          color={active ? "#263514" : SUIT}
          emissive={active ? ACID : "#000000"}
          emissiveIntensity={active ? 0.12 : 0}
          roughness={0.38}
          metalness={0.65}
        />
      </mesh>
      <RoundedBox position={[0, 0.89, 0.36]} args={[0.64, 0.65, 0.09]} radius={0.08} smoothness={3}>
        <meshStandardMaterial color={SUIT_LIGHT} metalness={0.75} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.9, 0.415]}>
        <boxGeometry args={[0.035, 0.52, 0.018]} />
        <meshBasicMaterial color={active ? "#ffffff" : ACID} />
      </mesh>
      <mesh position={[-0.22, 0.91, 0.415]} rotation={[0, 0, -0.14]}>
        <boxGeometry args={[0.018, 0.42, 0.018]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0.22, 0.91, 0.415]} rotation={[0, 0, 0.14]}>
        <boxGeometry args={[0.018, 0.42, 0.018]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 0.56, 0.44]}>
        <circleGeometry args={[0.065, 24]} />
        <meshBasicMaterial color={PINK} />
      </mesh>
    </group>
  );
}

function Head({ active }: { active: boolean }) {
  return (
    <group position={[0, 0.25, 0]}>
      <mesh position={[0, -0.27, 0]} castShadow>
        <cylinderGeometry args={[0.105, 0.12, 0.22, 18]} />
        <meshStandardMaterial color={SUIT_LIGHT} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh castShadow scale={[0.92, 1.06, 0.94]}>
        <sphereGeometry args={[0.31, 30, 24]} />
        <meshStandardMaterial
          color={active ? "#33451a" : "#151e28"}
          emissive={active ? ACID : "#000000"}
          emissiveIntensity={active ? 0.14 : 0}
          metalness={0.68}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.025, 0.285]} scale={[0.88, 0.42, 0.18]}>
        <sphereGeometry args={[0.28, 24, 16]} />
        <meshStandardMaterial
          color="#071016"
          emissive={CYAN}
          emissiveIntensity={0.14}
          metalness={0.9}
          roughness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.04, 0.342]} scale={[1, 0.55, 1]}>
        <torusGeometry args={[0.115, 0.012, 8, 28, Math.PI]} />
        <meshBasicMaterial color={active ? "#ffffff" : CYAN} />
      </mesh>
    </group>
  );
}

function Avatar({ pose, selected, onSelect }: Props) {
  return (
    <group position={[0, -0.42, 0]} rotation={[0, 0.18, 0]}>
      <mesh position={[0, 0.22, 0]} scale={[0.58, 0.36, 0.42]} castShadow>
        <capsuleGeometry args={[0.48, 0.35, 10, 20]} />
        <meshStandardMaterial color={SUIT} metalness={0.62} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.22, 0.39]}>
        <boxGeometry args={[0.4, 0.18, 0.06]} />
        <meshStandardMaterial color={SUIT_LIGHT} emissive={PINK} emissiveIntensity={0.08} metalness={0.8} />
      </mesh>

      <JointNode
        joint="chest"
        position={[0, 0.2, 0]}
        pose={pose}
        selected={selected}
        onSelect={onSelect}
        markerScale={0.9}
      >
        <Torso active={selected === "chest"} />
        <Arm side="left" pose={pose} selected={selected} onSelect={onSelect} />
        <Arm side="right" pose={pose} selected={selected} onSelect={onSelect} />
        <JointNode
          joint="head"
          position={[0, 1.58, 0]}
          pose={pose}
          selected={selected}
          onSelect={onSelect}
          markerScale={0.78}
        >
          <Head active={selected === "head"} />
        </JointNode>
      </JointNode>

      <Leg side="left" pose={pose} selected={selected} onSelect={onSelect} />
      <Leg side="right" pose={pose} selected={selected} onSelect={onSelect} />
    </group>
  );
}

function Stage() {
  return (
    <group position={[0, -2.26, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.12, 64]} />
        <meshStandardMaterial color="#0d131a" metalness={0.76} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.018, 8, 64]} />
        <meshBasicMaterial color={ACID} transparent opacity={0.68} />
      </mesh>
      <mesh position={[0, 0.068, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.74, 0.75, 64]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

export function SuitAvatar(props: Props) {
  return (
    <Canvas camera={{ position: [0, 0.55, 6.2], fov: 37 }} shadows dpr={[1, 1.7]}>
      <color attach="background" args={["#080c12"]} />
      <fog attach="fog" args={["#080c12", 6.5, 11]} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={["#b8e9ff", "#10130c", 1.25]} />
      <spotLight position={[4, 6, 5]} angle={0.48} penumbra={1} intensity={72} color={ACID} castShadow />
      <pointLight position={[-4, 1.5, 2.5]} intensity={26} color="#675cff" />
      <pointLight position={[0, -1, 4]} intensity={12} color={CYAN} />
      <Avatar {...props} />
      <Stage />
      <gridHelper args={[12, 24, "#27303d", "#151a22"]} position={[0, -2.2, 0]} />
      <ContactShadows position={[0, -2.19, 0]} opacity={0.72} scale={7} blur={2.4} />
      <Environment preset="city" environmentIntensity={0.22} />
      <OrbitControls
        enablePan={false}
        minDistance={4.5}
        maxDistance={8}
        minPolarAngle={0.7}
        maxPolarAngle={2.05}
        target={[0, 0.15, 0]}
      />
    </Canvas>
  );
}
