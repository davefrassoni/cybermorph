import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { JointId, Pose } from "@cybermorph/core";

type Props = {
  pose: Pose;
  selected: JointId;
  onSelect: (joint: JointId) => void;
};

type SegmentProps = {
  joint: JointId;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  pose: Pose;
  selected: JointId;
  onSelect: (joint: JointId) => void;
};

function radians(value = 0): number {
  return THREE.MathUtils.degToRad(value);
}

function Segment({
  joint,
  position,
  scale,
  rotation = [0, 0, 0],
  pose,
  selected,
  onSelect
}: SegmentProps) {
  const sensor = pose[joint];
  const active = selected === joint;
  const calculated = useMemo<[number, number, number]>(
    () => [
      rotation[0] + radians(sensor?.pitch),
      rotation[1] + radians(sensor?.yaw),
      rotation[2] + radians(sensor?.roll)
    ],
    [rotation, sensor?.pitch, sensor?.roll, sensor?.yaw]
  );
  return (
    <group
      position={position}
      rotation={calculated}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(joint);
      }}
    >
      <mesh scale={scale} castShadow>
        <capsuleGeometry args={[0.18, 0.72, 8, 16]} />
        <meshStandardMaterial
          color={active ? "#c8ff38" : "#131921"}
          roughness={0.42}
          metalness={0.48}
        />
      </mesh>
      <mesh scale={[scale[0] * 1.18, scale[1] * 0.95, scale[2] * 1.18]}>
        <capsuleGeometry args={[0.185, 0.72, 6, 12]} />
        <meshBasicMaterial color="#72f7df" wireframe transparent opacity={0.28} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <sphereGeometry args={[0.075, 14, 14]} />
        <meshBasicMaterial color={active ? "#ffffff" : "#c8ff38"} />
      </mesh>
    </group>
  );
}

function Avatar({ pose, selected, onSelect }: Props) {
  return (
    <group position={[0, -0.2, 0]} rotation={[0, 0.25, 0]}>
      <mesh
        position={[0, 2.42, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect("head");
        }}
        castShadow
      >
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color={selected === "head" ? "#c8ff38" : "#171d26"} metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.53, 0]} scale={[0.85, 1.05, 0.5]} castShadow onClick={() => onSelect("chest")}>
        <capsuleGeometry args={[0.42, 0.9, 10, 20]} />
        <meshStandardMaterial color={selected === "chest" ? "#c8ff38" : "#111720"} metalness={0.55} roughness={0.38} />
      </mesh>
      <mesh position={[0, 1.53, 0]} scale={[0.9, 1.08, 0.54]}>
        <capsuleGeometry args={[0.43, 0.9, 8, 16]} />
        <meshBasicMaterial color="#c8ff38" wireframe transparent opacity={0.18} />
      </mesh>

      <Segment joint="left_shoulder" position={[-0.72, 1.82, 0]} scale={[0.78, 0.92, 0.78]} rotation={[0, 0, -0.15]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="left_elbow" position={[-0.92, 1.02, 0]} scale={[0.62, 0.8, 0.62]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="left_wrist" position={[-0.98, 0.36, 0]} scale={[0.46, 0.52, 0.46]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="right_shoulder" position={[0.72, 1.82, 0]} scale={[0.78, 0.92, 0.78]} rotation={[0, 0, 0.15]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="right_elbow" position={[0.92, 1.02, 0]} scale={[0.62, 0.8, 0.62]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="right_wrist" position={[0.98, 0.36, 0]} scale={[0.46, 0.52, 0.46]} pose={pose} selected={selected} onSelect={onSelect} />

      <Segment joint="left_hip" position={[-0.3, 0.22, 0]} scale={[0.8, 1.02, 0.8]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="left_knee" position={[-0.3, -0.72, 0]} scale={[0.68, 1.0, 0.68]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="left_ankle" position={[-0.3, -1.56, 0.08]} scale={[0.52, 0.66, 0.7]} rotation={[0.3, 0, 0]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="right_hip" position={[0.3, 0.22, 0]} scale={[0.8, 1.02, 0.8]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="right_knee" position={[0.3, -0.72, 0]} scale={[0.68, 1.0, 0.68]} pose={pose} selected={selected} onSelect={onSelect} />
      <Segment joint="right_ankle" position={[0.3, -1.56, 0.08]} scale={[0.52, 0.66, 0.7]} rotation={[0.3, 0, 0]} pose={pose} selected={selected} onSelect={onSelect} />

      {[
        [-0.5, 2.0, 0.32], [0.5, 2.0, 0.32], [-0.52, 1.36, 0.37],
        [0.52, 1.36, 0.37], [-0.3, 0.15, 0.28], [0.3, 0.15, 0.28]
      ].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]}>
          <torusGeometry args={[0.07, 0.025, 8, 20]} />
          <meshBasicMaterial color="#ff4fd8" />
        </mesh>
      ))}
    </group>
  );
}

export function SuitAvatar(props: Props) {
  return (
    <Canvas camera={{ position: [0, 0.75, 6], fov: 39 }} shadows dpr={[1, 1.7]}>
      <color attach="background" args={["#090d13"]} />
      <fog attach="fog" args={["#090d13", 6, 10]} />
      <ambientLight intensity={0.72} />
      <spotLight position={[4, 6, 5]} angle={0.5} penumbra={1} intensity={80} color="#c8ff38" castShadow />
      <pointLight position={[-4, 1, 2]} intensity={24} color="#675cff" />
      <Avatar {...props} />
      <gridHelper args={[12, 20, "#27303d", "#151a22"]} position={[0, -2.15, 0]} />
      <ContactShadows position={[0, -2.12, 0]} opacity={0.6} scale={8} blur={2.3} />
      <Environment preset="city" environmentIntensity={0.18} />
      <OrbitControls enablePan={false} minDistance={4.5} maxDistance={8} target={[0, 0.2, 0]} />
    </Canvas>
  );
}
