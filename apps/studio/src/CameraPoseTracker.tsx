import { Camera, CameraOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  clampPose,
  type Pose
} from "@cybermorph/core";
import type {
  Landmark,
  NormalizedLandmark,
  PoseLandmarker
} from "@mediapipe/tasks-vision";
import { useI18n } from "./i18n";

type Props = {
  onPose: (pose: Pose) => void;
};

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [27, 31], [28, 32]
] as const;

type Point = Pick<Landmark, "x" | "y" | "z" | "visibility">;

function angle(a: Point, pivot: Point, b: Point): number {
  const first = [a.x - pivot.x, a.y - pivot.y, a.z - pivot.z];
  const second = [b.x - pivot.x, b.y - pivot.y, b.z - pivot.z];
  const product = first[0]! * second[0]! + first[1]! * second[1]! + first[2]! * second[2]!;
  const lengths = Math.hypot(...first) * Math.hypot(...second);
  return Math.acos(Math.max(-1, Math.min(1, product / Math.max(0.0001, lengths)))) * 180 / Math.PI;
}

function visible(points: Point[], ...indexes: number[]): boolean {
  return indexes.every((index) => (points[index]?.visibility ?? 1) > 0.45);
}

function vector(from: Point, to: Point) {
  return { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
}

function cameraLandmarksToPose(points: Point[]): Pose {
  if (points.length < 33) return {};
  const pose: Pose = {};
  const side = (
    name: "left" | "right",
    shoulder: number,
    elbow: number,
    wrist: number,
    hip: number,
    knee: number,
    ankle: number
  ) => {
    const sign = name === "left" ? 1 : -1;
    if (visible(points, shoulder, elbow, wrist)) {
      const arm = vector(points[shoulder]!, points[elbow]!);
      pose[`${name}_shoulder`] = {
        pitch: Math.atan2(arm.z, Math.max(0.01, -arm.y)) * 180 / Math.PI,
        roll: sign * Math.atan2(Math.abs(arm.x), Math.max(0.01, -arm.y)) * 180 / Math.PI,
        yaw: Math.atan2(arm.z, Math.max(0.01, Math.abs(arm.x))) * 180 / Math.PI
      };
      pose[`${name}_elbow`] = {
        pitch: 180 - angle(points[shoulder]!, points[elbow]!, points[wrist]!),
        roll: 0,
        yaw: 0
      };
    }
    if (visible(points, elbow, wrist, name === "left" ? 19 : 20)) {
      const hand = vector(points[wrist]!, points[name === "left" ? 19 : 20]!);
      pose[`${name}_wrist`] = {
        pitch: Math.atan2(hand.z, Math.max(0.01, Math.abs(hand.y))) * 180 / Math.PI,
        roll: sign * Math.atan2(hand.x * sign, Math.max(0.01, Math.abs(hand.y))) * 45 / Math.PI,
        yaw: 0
      };
    }
    if (visible(points, hip, knee, ankle)) {
      const thigh = vector(points[hip]!, points[knee]!);
      pose[`${name}_hip`] = {
        pitch: Math.atan2(thigh.z, Math.max(0.01, -thigh.y)) * 180 / Math.PI,
        roll: sign * Math.atan2(Math.abs(thigh.x), Math.max(0.01, -thigh.y)) * 180 / Math.PI,
        yaw: 0
      };
      pose[`${name}_knee`] = {
        pitch: 180 - angle(points[hip]!, points[knee]!, points[ankle]!),
        roll: 0,
        yaw: 0
      };
      const footIndex = name === "left" ? 31 : 32;
      if (visible(points, knee, ankle, footIndex)) {
        const foot = vector(points[ankle]!, points[footIndex]!);
        pose[`${name}_ankle`] = {
          pitch: Math.atan2(foot.y, Math.max(0.01, Math.abs(foot.z))) * 180 / Math.PI,
          roll: 0,
          yaw: Math.atan2(foot.x * sign, Math.max(0.01, Math.abs(foot.z))) * 180 / Math.PI
        };
      }
    }
  };

  side("left", 11, 13, 15, 23, 25, 27);
  side("right", 12, 14, 16, 24, 26, 28);

  if (visible(points, 11, 12, 23, 24)) {
    const shoulders = vector(points[11]!, points[12]!);
    const shoulderMiddle = {
      x: (points[11]!.x + points[12]!.x) / 2,
      y: (points[11]!.y + points[12]!.y) / 2,
      z: (points[11]!.z + points[12]!.z) / 2,
      visibility: 1
    };
    const hipMiddle = {
      x: (points[23]!.x + points[24]!.x) / 2,
      y: (points[23]!.y + points[24]!.y) / 2,
      z: (points[23]!.z + points[24]!.z) / 2,
      visibility: 1
    };
    const torso = vector(hipMiddle, shoulderMiddle);
    pose.chest = {
      pitch: Math.atan2(torso.z, Math.max(0.01, torso.y)) * 180 / Math.PI,
      roll: Math.atan2(torso.x, Math.max(0.01, torso.y)) * 180 / Math.PI,
      yaw: Math.atan2(shoulders.z, Math.max(0.01, shoulders.x)) * 180 / Math.PI
    };
  }
  return clampPose(pose);
}

function drawSkeleton(canvas: HTMLCanvasElement, points: NormalizedLandmark[]) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 3;
  context.strokeStyle = "#c9ff3d";
  context.fillStyle = "#66f4db";
  for (const [from, to] of CONNECTIONS) {
    const a = points[from];
    const b = points[to];
    if (!a || !b || a.visibility < 0.45 || b.visibility < 0.45) continue;
    context.beginPath();
    context.moveTo(a.x * canvas.width, a.y * canvas.height);
    context.lineTo(b.x * canvas.width, b.y * canvas.height);
    context.stroke();
  }
  for (const point of points) {
    if (point.visibility < 0.45) continue;
    context.beginPath();
    context.arc(point.x * canvas.width, point.y * canvas.height, 3.2, 0, Math.PI * 2);
    context.fill();
  }
}

export function CameraPoseTracker({ onPose }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const landmarkerRef = useRef<PoseLandmarker | undefined>(undefined);
  const onPoseRef = useRef(onPose);
  const animationRef = useRef(0);
  const lastInference = useRef(0);
  const [state, setState] = useState<"off" | "loading" | "live" | "error">("off");

  useEffect(() => {
    onPoseRef.current = onPose;
  }, [onPose]);

  const stop = () => {
    cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = undefined;
    landmarkerRef.current?.close();
    landmarkerRef.current = undefined;
    const context = canvasRef.current?.getContext("2d");
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setState("off");
  };

  useEffect(() => stop, []);

  const start = async () => {
    setState("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
      });
      const video = videoRef.current;
      if (!video) throw new Error("Video element unavailable");
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      const { FilesetResolver, PoseLandmarker: Landmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const options = {
        runningMode: "VIDEO" as const,
        numPoses: 1,
        minPoseDetectionConfidence: 0.55,
        minPosePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55
      };
      try {
        landmarkerRef.current = await Landmarker.createFromOptions(fileset, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }
        });
      } catch {
        landmarkerRef.current = await Landmarker.createFromOptions(fileset, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" }
        });
      }
      setState("live");

      const detect = (time: number) => {
        const landmarker = landmarkerRef.current;
        const target = videoRef.current;
        if (!landmarker || !target) return;
        if (target.readyState >= 2 && time - lastInference.current >= 66) {
          lastInference.current = time;
          const result = landmarker.detectForVideo(target, time);
          const landmarks = result.landmarks[0];
          const world = result.worldLandmarks[0];
          if (landmarks && world) {
            drawSkeleton(canvasRef.current!, landmarks);
            onPoseRef.current(cameraLandmarksToPose(world));
          }
        }
        animationRef.current = requestAnimationFrame(detect);
      };
      animationRef.current = requestAnimationFrame(detect);
    } catch {
      stop();
      setState("error");
    }
  };

  return (
    <section className="camera-reference">
      <div className="camera-copy">
        <span className="eyebrow">{t("camera.eyebrow")}</span>
        <strong>{t("camera.title")}</strong>
        <small>{t("camera.local")}</small>
      </div>
      <div className={`camera-preview ${state}`}>
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} width={640} height={480} />
        {state !== "live" && (
          <div>
            {state === "loading" ? <LoaderCircle className="spin" size={24} /> : <Camera size={24} />}
            <span>{state === "error" ? t("camera.error") : t("camera.ready")}</span>
          </div>
        )}
      </div>
      {state === "off" || state === "error" ? (
        <button className="compact-button" onClick={() => void start()}>
          <Camera size={14} /> {t("camera.start")}
        </button>
      ) : (
        <button className="compact-button" onClick={stop} disabled={state === "loading"}>
          <CameraOff size={14} /> {t("camera.stop")}
        </button>
      )}
      <p>{t("camera.note")}</p>
    </section>
  );
}
