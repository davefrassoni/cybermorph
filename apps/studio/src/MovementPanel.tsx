import {
  CircleStop,
  Download,
  Pause,
  Play,
  Radio,
  Repeat2,
  Trash2,
  Upload
} from "lucide-react";
import type { MovementClip } from "@cybermorph/core";
import { DANCE_MOVEMENTS } from "./movements";
import { useI18n, type TranslationKey } from "./i18n";

type Props = {
  recordings: MovementClip[];
  activeId: string;
  playing: boolean;
  recording: boolean;
  recordingName: string;
  onRecordingName: (name: string) => void;
  onPlay: (clip: MovementClip) => void;
  onStop: () => void;
  onRecord: () => void;
  onStopRecording: () => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
};

export function MovementPanel({
  recordings,
  activeId,
  playing,
  recording,
  recordingName,
  onRecordingName,
  onPlay,
  onStop,
  onRecord,
  onStopRecording,
  onDelete,
  onExport,
  onImport
}: Props) {
  const { t } = useI18n();
  const item = (clip: MovementClip, removable: boolean) => (
    <article key={clip.id} className={activeId === clip.id ? "active" : ""}>
      <button
        className="movement-play"
        title={playing && activeId === clip.id ? t("movement.pause") : t("movement.play")}
        onClick={() => playing && activeId === clip.id ? onStop() : onPlay(clip)}
      >
        {playing && activeId === clip.id ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div>
        <strong>{clip.source === "preset" ? t(`dance.${clip.id}` as TranslationKey) : clip.name}</strong>
        <small>{(clip.duration / 1000).toFixed(1)}s · {clip.keyframes.length} {t("movement.frames")}</small>
      </div>
      {clip.loop && <Repeat2 size={13} />}
      {removable && (
        <button className="ghost-icon danger" title={t("movement.delete")} onClick={() => onDelete(clip.id)}>
          <Trash2 size={13} />
        </button>
      )}
    </article>
  );

  return (
    <section className="panel movement-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">{t("movement.eyebrow")}</span><h2>{t("movement.title")}</h2></div>
      </div>
      <div className="movement-section">
        <strong>{t("movement.dances")}</strong>
        <div className="movement-list">{DANCE_MOVEMENTS.map((clip) => item(clip, false))}</div>
      </div>
      <div className="movement-recorder">
        <label>
          {t("movement.name")}
          <input value={recordingName} onChange={(event) => onRecordingName(event.target.value)} disabled={recording} />
        </label>
        {recording ? (
          <button className="primary-button recording" onClick={onStopRecording}>
            <CircleStop size={15} /> {t("movement.stopRecord")}
          </button>
        ) : (
          <button className="primary-button" onClick={onRecord} disabled={!recordingName.trim()}>
            <Radio size={15} /> {t("movement.record")}
          </button>
        )}
      </div>
      <div className="movement-section saved">
        <strong>{t("movement.saved")}</strong>
        <div className="movement-list">
          {recordings.map((clip) => item(clip, true))}
          {!recordings.length && <p>{t("movement.empty")}</p>}
        </div>
      </div>
      <div className="movement-actions">
        <button onClick={onExport} disabled={!recordings.length}><Download size={14} /> {t("movement.export")}</button>
        <button onClick={onImport}><Upload size={14} /> {t("movement.import")}</button>
        {playing && <button onClick={onStop}><CircleStop size={14} /> {t("movement.stop")}</button>}
      </div>
    </section>
  );
}
