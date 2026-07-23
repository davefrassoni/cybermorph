import { Copy, Plus, Trash2 } from "lucide-react";
import {
  AXES,
  JOINT_IDS,
  type MotionMapping
} from "@cybermorph/core";
import { useI18n, type TranslationKey } from "./i18n";

type Props = {
  mappings: MotionMapping[];
  values: Map<string, number>;
  onChange: (mappings: MotionMapping[]) => void;
};

const targets: MotionMapping["target"][] = [
  "midi_cc",
  "midi_note",
  "filter",
  "volume",
  "pitch",
  "loop"
];

const curves: MotionMapping["curve"][] = [
  "linear",
  "exponential",
  "logarithmic",
  "s_curve"
];

const defaultNameKeys: Partial<Record<string, TranslationKey>> = {
  "left-elbow-filter": "mapping.default.leftElbow",
  "right-wrist-cc": "mapping.default.rightWrist",
  "chest-volume": "mapping.default.chest"
};

const defaultNameVariants = new Set([
  "Left elbow → filter",
  "Right wrist → CC 1",
  "Chest twist → volume",
  "Codo izquierdo → filtro",
  "Muñeca derecha → CC 1",
  "Giro del pecho → volumen"
]);

function newMapping(name: string): MotionMapping {
  return {
    id: crypto.randomUUID(),
    name,
    enabled: true,
    joint: "left_elbow",
    axis: "pitch",
    inputMin: -90,
    inputMax: 90,
    invert: false,
    curve: "linear",
    smoothing: 0.25,
    target: "midi_cc",
    midiChannel: 1,
    midiControl: 1,
    outputMin: 0,
    outputMax: 127
  };
}

export function MappingEditor({ mappings, values, onChange }: Props) {
  const { t } = useI18n();
  const patch = (id: string, change: Partial<MotionMapping>) => {
    onChange(mappings.map((mapping) => mapping.id === id ? { ...mapping, ...change } : mapping));
  };
  return (
    <section className="panel mapping-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t("mapping.eyebrow")}</span>
          <h2>{t("mapping.title")}</h2>
        </div>
        <button className="icon-button" title={t("mapping.add")} onClick={() => onChange([...mappings, newMapping(t("mapping.new"))])}>
          <Plus size={18} />
        </button>
      </div>
      <div className="mapping-list">
        {mappings.map((mapping) => {
          const defaultNameKey = defaultNameKeys[mapping.id];
          const displayedName =
            defaultNameKey && defaultNameVariants.has(mapping.name)
              ? t(defaultNameKey)
              : mapping.name;
          return (
          <article className={`mapping-card ${mapping.enabled ? "" : "muted"}`} key={mapping.id}>
            <div className="mapping-title">
              <label className="toggle">
                <input type="checkbox" checked={mapping.enabled} onChange={(event) => patch(mapping.id, { enabled: event.target.checked })} />
                <span />
              </label>
              <input className="name-input" value={displayedName} onChange={(event) => patch(mapping.id, { name: event.target.value })} />
              <button className="ghost-icon" title={t("mapping.duplicate")} onClick={() => onChange([...mappings, { ...mapping, id: crypto.randomUUID(), name: `${displayedName} ${t("mapping.copy")}` }])}><Copy size={14} /></button>
              <button className="ghost-icon danger" title={t("mapping.delete")} onClick={() => onChange(mappings.filter((item) => item.id !== mapping.id))}><Trash2 size={14} /></button>
            </div>
            <div className="mapping-grid">
              <label>{t("mapping.joint")}<select value={mapping.joint} onChange={(event) => patch(mapping.id, { joint: event.target.value as MotionMapping["joint"] })}>{JOINT_IDS.map((joint) => <option key={joint} value={joint}>{t(`joint.${joint}` as TranslationKey)}</option>)}</select></label>
              <label>{t("mapping.axis")}<select value={mapping.axis} onChange={(event) => patch(mapping.id, { axis: event.target.value as MotionMapping["axis"] })}>{AXES.map((axis) => <option key={axis}>{axis}</option>)}</select></label>
              <label>{t("mapping.function")}<select value={mapping.target} onChange={(event) => patch(mapping.id, { target: event.target.value as MotionMapping["target"] })}>{targets.map((target) => <option key={target} value={target}>{t(`target.${target}` as TranslationKey)}</option>)}</select></label>
              <label>{t("mapping.curve")}<select value={mapping.curve} onChange={(event) => patch(mapping.id, { curve: event.target.value as MotionMapping["curve"] })}>{curves.map((curve) => <option key={curve} value={curve}>{t(`curve.${curve}` as TranslationKey)}</option>)}</select></label>
              <label>{t("mapping.inputMin")}<input type="number" value={mapping.inputMin} onChange={(event) => patch(mapping.id, { inputMin: Number(event.target.value) })} /></label>
              <label>{t("mapping.inputMax")}<input type="number" value={mapping.inputMax} onChange={(event) => patch(mapping.id, { inputMax: Number(event.target.value) })} /></label>
              <label>{t("mapping.outputMin")}<input type="number" value={mapping.outputMin} onChange={(event) => patch(mapping.id, { outputMin: Number(event.target.value) })} /></label>
              <label>{t("mapping.outputMax")}<input type="number" value={mapping.outputMax} onChange={(event) => patch(mapping.id, { outputMax: Number(event.target.value) })} /></label>
              <label>{t("mapping.ccNote")}<input type="number" min="0" max="127" value={mapping.midiControl} onChange={(event) => patch(mapping.id, { midiControl: Number(event.target.value) })} /></label>
              <label>{t("mapping.channel")}<input type="number" min="1" max="16" value={mapping.midiChannel} onChange={(event) => patch(mapping.id, { midiChannel: Number(event.target.value) })} /></label>
            </div>
            <div className="mapping-footer">
              <label className="range-label">{t("mapping.smooth")} <input type="range" min="0" max="0.95" step="0.05" value={mapping.smoothing} onChange={(event) => patch(mapping.id, { smoothing: Number(event.target.value) })} /><span>{Math.round(mapping.smoothing * 100)}%</span></label>
              <label className="check-label"><input type="checkbox" checked={mapping.invert} onChange={(event) => patch(mapping.id, { invert: event.target.checked })} /> {t("mapping.invert")}</label>
              <div className="signal-meter"><i style={{ width: `${(values.get(mapping.id) ?? 0) * 100}%` }} /></div>
            </div>
          </article>
        )})}
      </div>
    </section>
  );
}
