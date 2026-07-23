import { BrainCircuit, Download, Radio, Square, Trash2, Upload } from "lucide-react";
import type {
  GesturePrediction,
  LabeledCapture,
  TrainedGestureModel
} from "@cybermorph/core";

type Props = {
  captures: LabeledCapture[];
  recording: boolean;
  label: string;
  model: TrainedGestureModel | null;
  prediction: GesturePrediction | null;
  onLabel: (label: string) => void;
  onRecord: () => void;
  onStop: () => void;
  onTrain: () => void;
  onClear: () => void;
  onExport: (format: "json" | "csv") => void;
  onImport: () => void;
};

export function DatasetPanel({
  captures,
  recording,
  label,
  model,
  prediction,
  onLabel,
  onRecord,
  onStop,
  onTrain,
  onClear,
  onExport,
  onImport
}: Props) {
  const frameCount = captures.reduce((sum, capture) => sum + capture.frames.length, 0);
  const labels = new Set(captures.map((capture) => capture.label)).size;
  return (
    <section className="panel dataset-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">BEHAVIOUR LAB</span>
          <h2>Gesture learning</h2>
        </div>
        <div className={`prediction-pill ${prediction ? "live" : ""}`}>
          <i />
          {prediction ? `${prediction.label} · ${Math.round(prediction.confidence * 100)}%` : "waiting"}
        </div>
      </div>

      <div className="dataset-stats">
        <div><strong>{captures.length}</strong><span>captures</span></div>
        <div><strong>{labels}</strong><span>labels</span></div>
        <div><strong>{frameCount}</strong><span>frames</span></div>
      </div>

      <label className="record-label">
        Behaviour label
        <input value={label} onChange={(event) => onLabel(event.target.value)} placeholder="e.g. left_arm_hit" disabled={recording} />
      </label>
      {!recording ? (
        <button className="primary-button record-button" onClick={onRecord} disabled={!label.trim()}>
          <Radio size={17} /> Record sample
        </button>
      ) : (
        <button className="primary-button recording" onClick={onStop}>
          <Square size={15} fill="currentColor" /> Stop recording
        </button>
      )}

      <div className="capture-list">
        {captures.slice(-5).reverse().map((capture) => (
          <div key={capture.id}>
            <span className="capture-dot" />
            <strong>{capture.label}</strong>
            <small>{(capture.frames.length / 30).toFixed(1)}s · {capture.frames.length} frames</small>
          </div>
        ))}
        {!captures.length && <p>Record at least two examples. Five per gesture works better.</p>}
      </div>

      <button className="train-button" disabled={captures.length < 2} onClick={onTrain}>
        <BrainCircuit size={18} />
        <span>{model ? "Retrain model" : "Train local model"}<small>{model ? `${model.vectors.length} examples loaded` : "K-nearest neighbours · on-device"}</small></span>
      </button>

      <div className="dataset-actions">
        <button onClick={() => onExport("json")} disabled={!captures.length}><Download size={14} /> JSON</button>
        <button onClick={() => onExport("csv")} disabled={!captures.length}><Download size={14} /> CSV</button>
        <button onClick={onImport}><Upload size={14} /> Import</button>
        <button onClick={onClear} disabled={!captures.length} className="danger"><Trash2 size={14} /></button>
      </div>
    </section>
  );
}
