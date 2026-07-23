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
  capturesToCsv,
  mapFrame,
  poseToFrame,
  predictGesture,
  trainGestureModel,
  type Axis,
  type GesturePrediction,
  type JointId,
  type LabeledCapture,
  type MappingOutput,
  type MotionMapping,
  type Pose,
  type SensorFrame,
  type TrainedGestureModel
} from "@cybermorph/core";
import { motionAudio, midiController } from "./audio";
import { ConnectionBar } from "./ConnectionBar";
import { DatasetPanel } from "./DatasetPanel";
import { MappingEditor } from "./MappingEditor";
import { POSES } from "./poses";
import { SuitAvatar } from "./SuitAvatar";
import { WebSerialSuit } from "./serial";

const isDesktop = Boolean(window.cybermorph);
const DOWNLOAD_URL = "./downloads/CyberMorph-Setup.exe";

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
  return (
    <section className="hero" id="home">
      <div className="noise" />
      <nav className="site-nav">
        <a className="brand" href="#home"><i>CM</i><span>CYBER<br />MORPH</span></a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#studio">Simulator</a>
          <a href="https://github.com/davefrassoni/cybermorph" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <a className="nav-download" href={DOWNLOAD_URL}><Download size={15} /> Windows</a>
      </nav>
      <div className="hero-copy">
        <div className="hero-kicker"><Sparkles size={13} /> WEARABLE MUSIC INSTRUMENT</div>
        <h1>Your body<br />is the <em>interface.</em></h1>
        <p>Turn every bend, twist and impact into MIDI, evolving sound and living loops. Train the suit to understand the way you move.</p>
        <div className="hero-actions">
          <button className="hero-primary" onClick={onLaunch}>Launch simulator <ArrowRight size={18} /></button>
          <a className="hero-secondary" href={DOWNLOAD_URL}><Download size={17} /> Download for Windows</a>
        </div>
        <span className="build-note">v0.1 preview · Windows 10/11 · open source</span>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orb"><span /><span /><span /></div>
        <div className="motion-trace trace-a" />
        <div className="motion-trace trace-b" />
        <div className="data-tag tag-a">LEFT_ELBOW <strong>84.2°</strong></div>
        <div className="data-tag tag-b">MIDI CC 74 <strong>108</strong></div>
        <div className="data-tag tag-c">GESTURE <strong>REACH 96%</strong></div>
      </div>
      <a className="scroll-cue" href="#how">EXPLORE <ArrowDown size={14} /></a>
    </section>
  );
}

function ProcessStrip() {
  const steps = [
    { icon: Cable, number: "01", title: "Connect", text: "Stream orientation from Arduino IMUs over USB serial." },
    { icon: SlidersHorizontal, number: "02", title: "Map", text: "Shape any joint axis into MIDI, filters, pitch or loops." },
    { icon: BrainCircuit, number: "03", title: "Learn", text: "Record examples and train gesture recognition on-device." },
    { icon: AudioWaveform, number: "04", title: "Perform", text: "Route into your DAW and make movement audible." }
  ];
  return (
    <section className="process" id="how">
      <span className="section-number">001 / SIGNAL FLOW</span>
      <div className="process-grid">
        {steps.map(({ icon: Icon, ...step }) => (
          <article key={step.number}><span>{step.number}</span><Icon size={25} /><h3>{step.title}</h3><p>{step.text}</p></article>
        ))}
      </div>
    </section>
  );
}

function Studio() {
  const [source, setSource] = useState<"simulator" | "hardware">("simulator");
  const [pose, setPose] = useState<Pose>(POSES.neutral!);
  const poseRef = useRef(pose);
  const [selected, setSelected] = useState<JointId>("left_elbow");
  const [mappings, setMappings] = useState<MotionMapping[]>(() => readStored("cm.mappings", DEFAULT_MAPPINGS));
  const mappingsRef = useRef(mappings);
  const [outputs, setOutputs] = useState<MappingOutput[]>([]);
  const smoothingValues = useRef(new Map<string, number>());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialMessage, setSerialMessage] = useState("Not connected");
  const serialSuit = useRef(new WebSerialSuit());
  const [captures, setCaptures] = useState<LabeledCapture[]>(() => readStored("cm.captures", []));
  const [label, setLabel] = useState("reach");
  const [recording, setRecording] = useState(false);
  const recordingFrames = useRef<SensorFrame[]>([]);
  const [model, setModel] = useState<TrainedGestureModel | null>(() => readStored("cm.model", null));
  const modelRef = useRef(model);
  const gestureWindow = useRef<SensorFrame[]>([]);
  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const lastPrediction = useRef("");
  const predictionTick = useRef(0);
  const [error, setError] = useState("");

  useEffect(() => { poseRef.current = pose; }, [pose]);
  useEffect(() => { mappingsRef.current = mappings; localStorage.setItem("cm.mappings", JSON.stringify(mappings)); }, [mappings]);
  useEffect(() => { localStorage.setItem("cm.captures", JSON.stringify(captures)); }, [captures]);
  useEffect(() => { modelRef.current = model; if (model) localStorage.setItem("cm.model", JSON.stringify(model)); }, [model]);

  const processFrame = useCallback((frame: SensorFrame) => {
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
    const interval = window.setInterval(() => processFrame(poseToFrame(poseRef.current)), 33);
    return () => window.clearInterval(interval);
  }, [processFrame, source]);

  useEffect(() => () => { void serialSuit.current.disconnect(); }, []);

  const selectedVector = pose[selected] ?? { pitch: 0, roll: 0, yaw: 0 };
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not import dataset");
    }
  };

  return (
    <section className="studio-shell" id="studio">
      <div className="studio-header">
        <div><span className="section-number">002 / LIVE WORKSPACE</span><h2>Movement laboratory</h2></div>
        <div className="live-badge"><i /> ENGINE 30 FPS</div>
      </div>
      <ConnectionBar source={source} onSource={setSource} serialConnected={serialConnected} serialMessage={serialMessage} audioEnabled={audioEnabled} onSerial={() => {
        if (serialConnected) {
          void serialSuit.current.disconnect().then(() => {
            setSerialConnected(false);
            setSerialMessage("Disconnected");
            setSource("simulator");
          });
        } else {
          setSource("hardware");
          void serialSuit.current.connect(
            processFrame,
            (connected, message) => { setSerialConnected(connected); setSerialMessage(message); }
          ).catch((reason) => {
            setSerialConnected(false);
            setSource("simulator");
            setError(reason instanceof Error ? reason.message : "Could not open Arduino");
          });
        }
      }} onAudio={async () => {
        try { await motionAudio.start(); setAudioEnabled(true); } catch { setError("Audio could not be started in this browser."); }
      }} />
      {error && <button className="error-toast" onClick={() => setError("")}>{error} ×</button>}
      <div className="studio-grid">
        <section className="panel avatar-panel">
          <div className="avatar-toolbar">
            <div><span className="eyebrow">DIGITAL TWIN</span><strong>{selected.replaceAll("_", " ")}</strong></div>
            <button className="icon-button" title="Reset pose" onClick={() => setPose(POSES.neutral!)}><RotateCcw size={17} /></button>
          </div>
          <div className="avatar-stage"><SuitAvatar pose={pose} selected={selected} onSelect={setSelected} /></div>
          <div className="pose-presets">
            {Object.keys(POSES).map((name) => <button key={name} className={pose === POSES[name] ? "active" : ""} onClick={() => setPose(POSES[name]!)}>{name}</button>)}
          </div>
          <div className="joint-controls">
            {AXES.map((axis: Axis) => (
              <label key={axis}><span>{axis}<b>{Math.round(selectedVector[axis])}°</b></span><input type="range" min="-180" max="180" value={selectedVector[axis]} onChange={(event) => setPose((current) => ({
                ...current,
                [selected]: { ...selectedVector, [axis]: Number(event.target.value) }
              }))} /></label>
            ))}
          </div>
        </section>
        <MappingEditor mappings={mappings} values={valueMap} onChange={setMappings} />
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
            catch (reason) { setError(reason instanceof Error ? reason.message : "Training failed"); }
          }}
          onClear={() => { setCaptures([]); setModel(null); localStorage.removeItem("cm.model"); }}
          onExport={(format) => {
            const content = format === "csv" ? capturesToCsv(captures) : JSON.stringify({ version: 1, captures, model }, null, 2);
            void saveData(`cybermorph-dataset.${format}`, content);
          }}
          onImport={() => void importDataset()}
        />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <a className="brand" href="#home"><i>CM</i><span>CYBER<br />MORPH</span></a>
      <p>Built for bodies that refuse to stand still.</p>
      <div><a href="https://github.com/davefrassoni/cybermorph"><Github size={17} /> Source</a><a href="#studio"><Box size={17} /> Simulator</a></div>
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
