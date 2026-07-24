import {
  ArrowDown,
  ArrowRight,
  AudioWaveform,
  Box,
  BrainCircuit,
  Cable,
  Download,
  Github,
  RotateCcw,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AXES,
  DEFAULT_MAPPINGS,
  DEFAULT_SENSORS,
  JOINT_LIMITS,
  applySensorReadingsToPose,
  capturesToCsv,
  clampPose,
  clampJointValue,
  clampJointVector,
  mapFrame,
  predictGesture,
  sampleMovement,
  selectConfiguredSensors,
  simulateImuFrame,
  trainGestureModel,
  type Axis,
  type GesturePrediction,
  type JointId,
  type LabeledCapture,
  type MappingOutput,
  type MovementClip,
  type MovementKeyframe,
  type MotionMapping,
  type Pose,
  type SensorFrame,
  type SimulatorMotionState,
  type SuitSensor,
  type TrainedGestureModel
} from "@cybermorph/core";
import { motionAudio, midiController } from "./audio";
import { ConnectionBar } from "./ConnectionBar";
import { DatasetPanel } from "./DatasetPanel";
import { MappingEditor } from "./MappingEditor";
import { FirmwareFlasher } from "./FirmwareFlasher";
import { CameraPoseTracker } from "./CameraPoseTracker";
import { MovementPanel } from "./MovementPanel";
import { POSES } from "./poses";
import { SensorManager } from "./SensorManager";
import { SuitAvatar } from "./SuitAvatar";
import { WebSerialSuit } from "./serial";
import { UpdateControl } from "./UpdateControl";
import {
  LanguageToggle,
  useI18n,
  type TranslationKey
} from "./i18n";

const isDesktop = Boolean(window.cybermorph);
const DOWNLOAD_FALLBACK = "./downloads/CyberMorph-Setup.exe?channel=rolling";

function downloadBrowser(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "application/octet-stream" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function Hero({ onLaunch }: { onLaunch: () => void }) {
  const { t } = useI18n();
  const [downloadUrl, setDownloadUrl] = useState(DOWNLOAD_FALLBACK);
  useEffect(() => {
    void fetch("./downloads/latest.yml", { cache: "no-store" })
      .then((response) => response.ok ? response.text() : "")
      .then((manifest) => {
        const path = manifest.match(/^path:\s*(CyberMorph-Setup-[0-9]+\.[0-9]+\.[0-9]+\.exe)\s*$/m)?.[1];
        if (path) setDownloadUrl(`./downloads/${path}`);
      })
      .catch(() => { /* the generic installer remains available as a fallback */ });
  }, []);
  return (
    <section className="hero" id="home">
      <div className="noise" />
      <nav className="site-nav">
        <a className="brand" href="#home"><i>CM</i><span>CYBER<br />MORPH</span></a>
        <div className="nav-links">
          <a href="#how">{t("nav.how")}</a>
          <a href="#studio">{t("nav.simulator")}</a>
          <a href="https://github.com/davefrassoni/cybermorph" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="nav-actions">
          <LanguageToggle compact />
          <a className="nav-download" href={downloadUrl}><Download size={15} /> {t("nav.windows")}</a>
        </div>
      </nav>
      <div className="hero-copy">
        <div className="hero-kicker"><Sparkles size={13} /> {t("hero.kicker")}</div>
        <h1>{t("hero.line1")}<br />{t("hero.line2")} <em>{t("hero.emphasis")}</em></h1>
        <p>{t("hero.description")}</p>
        <div className="hero-actions">
          <button className="hero-primary" onClick={onLaunch}>{t("hero.launch")} <ArrowRight size={18} /></button>
          <a className="hero-secondary" href={downloadUrl}><Download size={17} /> {t("hero.download")}</a>
        </div>
        <span className="build-note">{t("hero.build")}</span>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orb"><span /><span /><span /></div>
        <div className="motion-trace trace-a" />
        <div className="motion-trace trace-b" />
        <div className="data-tag tag-a">LEFT_ELBOW <strong>84.2°</strong></div>
        <div className="data-tag tag-b">MIDI CC 74 <strong>108</strong></div>
        <div className="data-tag tag-c">{t("hero.gesture")} <strong>{t("pose.reach").toUpperCase()} 96%</strong></div>
      </div>
      <a className="scroll-cue" href="#how">{t("hero.explore")} <ArrowDown size={14} /></a>
    </section>
  );
}

function ProcessStrip() {
  const { t } = useI18n();
  const steps = [
    { icon: Cable, number: "01", title: t("process.connect.title"), text: t("process.connect.text") },
    { icon: SlidersHorizontal, number: "02", title: t("process.map.title"), text: t("process.map.text") },
    { icon: BrainCircuit, number: "03", title: t("process.learn.title"), text: t("process.learn.text") },
    { icon: AudioWaveform, number: "04", title: t("process.perform.title"), text: t("process.perform.text") }
  ];
  return (
    <section className="process" id="how">
      <span className="section-number">{t("process.eyebrow")}</span>
      <div className="process-grid">
        {steps.map(({ icon: Icon, ...step }) => (
          <article key={step.number}><span>{step.number}</span><Icon size={25} /><h3>{step.title}</h3><p>{step.text}</p></article>
        ))}
      </div>
    </section>
  );
}

function Studio() {
  const { t } = useI18n();
  const [source, setSource] = useState<"simulator" | "hardware">("simulator");
  const [pose, setPose] = useState<Pose>(POSES.neutral!);
  const poseRef = useRef(pose);
  const sourceRef = useRef(source);
  const [sensors, setSensors] = useState<SuitSensor[]>(() => readStored("cm.sensors.v1", DEFAULT_SENSORS));
  const sensorsRef = useRef(sensors);
  const simulatorMotion = useRef<SimulatorMotionState | undefined>(undefined);
  const [selected, setSelected] = useState<JointId>("left_elbow");
  const [mappings, setMappings] = useState<MotionMapping[]>(() => readStored("cm.mappings.v2", DEFAULT_MAPPINGS));
  const mappingsRef = useRef(mappings);
  const [outputs, setOutputs] = useState<MappingOutput[]>([]);
  const smoothingValues = useRef(new Map<string, number>());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialStatus, setSerialStatus] = useState<"notConnected" | "connected" | "disconnected">("notConnected");
  const serialSuit = useRef(new WebSerialSuit());
  const [captures, setCaptures] = useState<LabeledCapture[]>(() => readStored("cm.captures.v2", []));
  const [label, setLabel] = useState("reach");
  const [recording, setRecording] = useState(false);
  const recordingFrames = useRef<SensorFrame[]>([]);
  const [model, setModel] = useState<TrainedGestureModel | null>(() => readStored("cm.model.v2", null));
  const modelRef = useRef(model);
  const gestureWindow = useRef<SensorFrame[]>([]);
  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const lastPrediction = useRef("");
  const predictionTick = useRef(0);
  const [error, setError] = useState("");
  const [firmwareOpen, setFirmwareOpen] = useState(false);
  const [movements, setMovements] = useState<MovementClip[]>(() => readStored("cm.movements.v1", []));
  const [movementName, setMovementName] = useState(() => t("movement.defaultName"));
  const [movementRecording, setMovementRecording] = useState(false);
  const movementRecordingRef = useRef(false);
  const movementStartedAt = useRef(0);
  const movementFrames = useRef<MovementKeyframe[]>([]);
  const [activeMovement, setActiveMovement] = useState<MovementClip | null>(null);
  const [movementPlaying, setMovementPlaying] = useState(false);

  useEffect(() => { poseRef.current = pose; }, [pose]);
  useEffect(() => { sourceRef.current = source; }, [source]);
  useEffect(() => {
    sensorsRef.current = sensors;
    localStorage.setItem("cm.sensors.v1", JSON.stringify(sensors));
  }, [sensors]);
  useEffect(() => { mappingsRef.current = mappings; localStorage.setItem("cm.mappings.v2", JSON.stringify(mappings)); }, [mappings]);
  useEffect(() => { localStorage.setItem("cm.captures.v2", JSON.stringify(captures)); }, [captures]);
  useEffect(() => { modelRef.current = model; if (model) localStorage.setItem("cm.model.v2", JSON.stringify(model)); }, [model]);
  useEffect(() => { localStorage.setItem("cm.movements.v1", JSON.stringify(movements)); }, [movements]);

  const processFrame = useCallback((incoming: SensorFrame) => {
    const frame = selectConfiguredSensors(incoming, sensorsRef.current);
    if (sourceRef.current === "hardware") {
      setPose((current) => clampPose(applySensorReadingsToPose(current, incoming, sensorsRef.current)));
    }
    const mapped = mapFrame(frame, mappingsRef.current, smoothingValues.current);
    setOutputs(mapped);
    motionAudio.apply(mapped);
    midiController.send(mapped);
    if (recordingFrames.current) {
      if ((window as unknown as { __cmRecording?: boolean }).__cmRecording) {
        recordingFrames.current.push(frame);
      }
    }
    gestureWindow.current.push(frame);
    if (gestureWindow.current.length > 75) gestureWindow.current.shift();
    predictionTick.current += 1;
    if (modelRef.current && predictionTick.current % 12 === 0 && gestureWindow.current.length > 25) {
      const next = predictGesture(modelRef.current, gestureWindow.current);
      setPrediction(next);
      if (next && next.confidence > 0.7 && next.label !== lastPrediction.current) {
        motionAudio.triggerGesture(next.label);
        lastPrediction.current = next.label;
      }
    }
  }, []);

  useEffect(() => {
    if (source !== "simulator") return;
    const interval = window.setInterval(() => {
      const now = performance.now();
      const simulated = simulateImuFrame(
        poseRef.current,
        sensorsRef.current,
        simulatorMotion.current,
        now
      );
      simulatorMotion.current = simulated.state;
      processFrame(simulated.frame);
    }, 33);
    return () => window.clearInterval(interval);
  }, [processFrame, source]);

  useEffect(() => {
    if (!movementRecording) return;
    const interval = window.setInterval(() => {
      if (!movementRecordingRef.current || movementFrames.current.length >= 1800) return;
      const now = performance.now();
      movementFrames.current.push({
        at: now - movementStartedAt.current,
        pose: structuredClone(poseRef.current)
      });
    }, 66);
    return () => window.clearInterval(interval);
  }, [movementRecording]);

  useEffect(() => {
    if (!movementPlaying || !activeMovement) return;
    const started = performance.now();
    let animation = 0;
    const animate = (now: number) => {
      const elapsed = now - started;
      setPose(clampPose(sampleMovement(activeMovement, elapsed)));
      if (!activeMovement.loop && elapsed >= activeMovement.duration) {
        setMovementPlaying(false);
        setActiveMovement(null);
        return;
      }
      animation = requestAnimationFrame(animate);
    };
    animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, [activeMovement, movementPlaying]);

  useEffect(() => () => { void serialSuit.current.disconnect(); }, []);

  const selectedVector = clampJointVector(
    selected,
    pose[selected] ?? { pitch: 0, roll: 0, yaw: 0 }
  );
  const valueMap = useMemo(() => new Map(outputs.map((output) => [output.mappingId, output.normalized])), [outputs]);

  const saveData = async (name: string, content: string) => {
    if (window.cybermorph) await window.cybermorph.saveFile({ name, content });
    else downloadBrowser(name, content);
  };

  const stopRecording = () => {
    (window as unknown as { __cmRecording?: boolean }).__cmRecording = false;
    setRecording(false);
    if (recordingFrames.current.length > 1) {
      setCaptures((current) => [...current, {
        id: crypto.randomUUID(),
        label: label.trim(),
        createdAt: new Date().toISOString(),
        frames: [...recordingFrames.current]
      }]);
    }
    recordingFrames.current = [];
  };

  const importDataset = async () => {
    try {
      if (!window.cybermorph) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (file) {
            const parsed = JSON.parse(await file.text()) as { captures?: LabeledCapture[]; model?: TrainedGestureModel };
            if (parsed.captures) setCaptures(parsed.captures);
            if (parsed.model) setModel(parsed.model);
          }
        };
        input.click();
      } else {
        const file = await window.cybermorph.loadFile();
        if (file) {
          const parsed = JSON.parse(file.content) as { captures?: LabeledCapture[]; model?: TrainedGestureModel };
          if (parsed.captures) setCaptures(parsed.captures);
          if (parsed.model) setModel(parsed.model);
        }
      }
    } catch {
      setError(t("error.import"));
    }
  };

  const startMovementRecording = () => {
    setMovementPlaying(false);
    setActiveMovement(null);
    const now = performance.now();
    movementStartedAt.current = now;
    movementFrames.current = [{ at: 0, pose: structuredClone(poseRef.current) }];
    movementRecordingRef.current = true;
    setMovementRecording(true);
  };

  const stopMovementRecording = () => {
    const now = performance.now();
    movementRecordingRef.current = false;
    setMovementRecording(false);
    const frames = [...movementFrames.current, {
      at: now - movementStartedAt.current,
      pose: structuredClone(poseRef.current)
    }];
    movementFrames.current = [];
    if (frames.length < 2) return;
    setMovements((current) => [...current, {
      id: crypto.randomUUID(),
      name: movementName.trim(),
      createdAt: new Date().toISOString(),
      duration: Math.max(100, frames.at(-1)?.at ?? 100),
      loop: false,
      source: "recorded",
      keyframes: frames
    }]);
  };

  const importMovements = async () => {
    const load = async (content: string) => {
      const parsed = JSON.parse(content) as { movements?: MovementClip[] };
      const valid = (parsed.movements ?? []).filter((clip) =>
        clip &&
        typeof clip.id === "string" &&
        typeof clip.name === "string" &&
        Number.isFinite(clip.duration) &&
        Array.isArray(clip.keyframes) &&
        clip.keyframes.length >= 2 &&
        clip.keyframes.length <= 5000 &&
        clip.keyframes.every((keyframe) =>
          Number.isFinite(keyframe.at) &&
          typeof keyframe.pose === "object" &&
          keyframe.pose !== null
        )
      ).slice(0, 100).map((clip) => ({
        ...clip,
        id: crypto.randomUUID(),
        source: "recorded" as const,
        loop: Boolean(clip.loop)
      }));
      if (!valid.length) throw new Error("No valid movements");
      setMovements((current) => [...current, ...valid]);
    };
    try {
      if (window.cybermorph) {
        const file = await window.cybermorph.loadFile();
        if (file) await load(file.content);
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
          try {
            const file = input.files?.[0];
            if (file) await load(await file.text());
          } catch {
            setError(t("error.movementImport"));
          }
        };
        input.click();
      }
    } catch {
      setError(t("error.movementImport"));
    }
  };

  return (
    <section className="studio-shell" id="studio">
      <div className="studio-header">
        <div><span className="section-number">{t("studio.eyebrow")}</span><h2>{t("studio.title")}</h2></div>
        <div className="studio-header-actions">
          <UpdateControl />
          <LanguageToggle compact />
          <div className="live-badge"><i /> {t("studio.engine")}</div>
        </div>
      </div>
      <ConnectionBar source={source} onSource={setSource} serialConnected={serialConnected} serialMessage={t(`serial.${serialStatus}` as TranslationKey)} audioEnabled={audioEnabled} onSerial={() => {
        if (serialConnected) {
          void serialSuit.current.disconnect().then(() => {
            setSerialConnected(false);
            setSerialStatus("disconnected");
            setSource("simulator");
          });
        } else {
          setSource("hardware");
          void serialSuit.current.connect(
            processFrame,
            (connected) => {
              setSerialConnected(connected);
              setSerialStatus(connected ? "connected" : "disconnected");
            }
          ).catch(() => {
            setSerialConnected(false);
            setSource("simulator");
            setError(t("error.serial"));
          });
        }
      }} onFirmware={() => setFirmwareOpen(true)} onAudio={async () => {
        try { await motionAudio.start(); setAudioEnabled(true); } catch { setError(t("error.audio")); }
      }} />
      <FirmwareFlasher
        open={firmwareOpen}
        onClose={() => setFirmwareOpen(false)}
        onBeforeFlash={async () => {
          await serialSuit.current.disconnect();
          setSerialConnected(false);
          setSerialStatus("disconnected");
          setSource("simulator");
        }}
      />
      {error && <button className="error-toast" onClick={() => setError("")}>{error} ×</button>}
      <div className="studio-grid">
        <div className="studio-column">
          <section className="panel avatar-panel">
          <div className="avatar-toolbar">
            <div><span className="eyebrow">{t("avatar.eyebrow")}</span><strong>{t(`joint.${selected}` as TranslationKey)}</strong><small>{t("avatar.limits")}</small></div>
            <button className="icon-button" title={t("avatar.reset")} onClick={() => setPose(POSES.neutral!)}><RotateCcw size={17} /></button>
          </div>
          <div className="avatar-stage"><SuitAvatar pose={pose} selected={selected} onSelect={setSelected} sensors={sensors} /></div>
          <div className="pose-presets">
            {Object.keys(POSES).map((name) => <button key={name} className={pose === POSES[name] ? "active" : ""} onClick={() => setPose(POSES[name]!)}>{t(`pose.${name}` as TranslationKey)}</button>)}
          </div>
          <div className="joint-controls">
            {AXES.map((axis: Axis) => {
              const [min, max] = JOINT_LIMITS[selected][axis];
              return (
                <label key={axis}>
                  <span>{axis}<b>{Math.round(selectedVector[axis])}°</b></span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={selectedVector[axis]}
                    onChange={(event) => setPose((current) => ({
                      ...current,
                      [selected]: {
                        ...selectedVector,
                        [axis]: clampJointValue(selected, axis, Number(event.target.value))
                      }
                    }))}
                  />
                  <small><i>{min}°</i><i>{max}°</i></small>
                </label>
              );
            })}
          </div>
          </section>
          <SensorManager sensors={sensors} onChange={setSensors} />
          <CameraPoseTracker onPose={(cameraPose) => {
            if (!movementPlaying) setPose(cameraPose);
          }} />
        </div>
        <div className="studio-column">
          <MappingEditor mappings={mappings} sensors={sensors} values={valueMap} onChange={setMappings} />
          <MovementPanel
            recordings={movements}
            activeId={activeMovement?.id ?? ""}
            playing={movementPlaying}
            recording={movementRecording}
            recordingName={movementName}
            onRecordingName={setMovementName}
            onPlay={(clip) => {
              if (movementRecordingRef.current) stopMovementRecording();
              setActiveMovement(clip);
              setMovementPlaying(true);
            }}
            onStop={() => {
              setMovementPlaying(false);
              setActiveMovement(null);
            }}
            onRecord={startMovementRecording}
            onStopRecording={stopMovementRecording}
            onDelete={(id) => setMovements((current) => current.filter((clip) => clip.id !== id))}
            onExport={() => void saveData("cybermorph-movimientos.json", JSON.stringify({
              version: 1,
              movements
            }, null, 2))}
            onImport={() => void importMovements()}
          />
          <DatasetPanel
          captures={captures}
          recording={recording}
          label={label}
          model={model}
          prediction={prediction}
          onLabel={setLabel}
          onRecord={() => {
            recordingFrames.current = [];
            (window as unknown as { __cmRecording?: boolean }).__cmRecording = true;
            setRecording(true);
          }}
          onStop={stopRecording}
          onTrain={() => {
            try { setModel(trainGestureModel(captures)); setError(""); }
            catch { setError(t("error.training")); }
          }}
          onClear={() => { setCaptures([]); setModel(null); localStorage.removeItem("cm.model.v2"); }}
          onExport={(format) => {
            const content = format === "csv" ? capturesToCsv(captures) : JSON.stringify({ version: 1, captures, model }, null, 2);
            void saveData(`cybermorph-dataset.${format}`, content);
          }}
          onImport={() => void importDataset()}
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer>
      <a className="brand" href="#home"><i>CM</i><span>CYBER<br />MORPH</span></a>
      <p>{t("footer.tagline")}</p>
      <div><a href="https://github.com/davefrassoni/cybermorph"><Github size={17} /> {t("footer.source")}</a><a href="#studio"><Box size={17} /> {t("footer.simulator")}</a></div>
    </footer>
  );
}

export default function App() {
  const launch = () => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
  if (isDesktop) {
    return <main className="desktop-mode"><Studio /></main>;
  }
  return <main><Hero onLaunch={launch} /><ProcessStrip /><Studio /><Footer /></main>;
}
