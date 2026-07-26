import { Activity, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SensorFrame } from "@cybermorph/core";
import { useI18n } from "./i18n";

export type SerialMonitorLine = {
  id: number;
  receivedAt: number;
  text: string;
  frame: SensorFrame | null;
};

type Props = {
  connected: boolean;
  lastLine: SerialMonitorLine | null;
  onClear: () => void;
};

const channels = [
  { key: "accel_x", label: "Ax" },
  { key: "accel_y", label: "Ay" },
  { key: "accel_z", label: "Az" },
  { key: "gyro_x", label: "Gx" },
  { key: "gyro_y", label: "Gy" },
  { key: "gyro_z", label: "Gz" }
] as const;

function formatValue(value: number | undefined): string {
  return Number.isFinite(value) ? Number(value).toFixed(2) : "—";
}

export function SerialMonitor({ connected, lastLine, onClear }: Props) {
  const { t } = useI18n();
  const [initialWidth, setInitialWidth] = useState<number>();

  useEffect(() => {
    if (!lastLine || initialWidth !== undefined) return;
    // DM Mono at 9px is approximately 5.5px per character. Keep room for the frame metadata.
    setInitialWidth(Math.min(1080, Math.max(360, Math.ceil(lastLine.text.length * 5.5) + 130)));
  }, [initialWidth, lastLine]);

  const sensors = Object.entries(lastLine?.frame?.sensors ?? {});
  const panelStyle = initialWidth
    ? { width: `min(100%, ${initialWidth}px)`, maxWidth: "100%" }
    : { width: "100%", maxWidth: "100%" };

  return (
    <section className="panel serial-monitor" aria-live="polite" style={panelStyle}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">USB / ESP32</span>
          <h2>{t("serial.monitor.title")}</h2>
        </div>
        <div className="serial-monitor-actions">
          <span className={connected ? "serial-monitor-state online" : "serial-monitor-state"}>
            <Activity size={13} /> {connected ? t("serial.monitor.live") : t("serial.monitor.waiting")}
          </span>
          <button className="ghost-icon" title={t("serial.monitor.clear")} onClick={onClear}><Trash2 size={15} /></button>
        </div>
      </div>
      <p>{t("serial.monitor.description")}</p>
      <div className="serial-monitor-data" role="log">
        {!lastLine && <span className="serial-monitor-empty">{t("serial.monitor.empty")}</span>}
        {lastLine && <>
          <div className={lastLine.frame ? "serial-frame valid" : "serial-frame invalid"}>
            <time>{new Date(lastLine.receivedAt).toLocaleTimeString()}</time>
            <i>{lastLine.frame ? "OK" : "RAW"}</i>
            <code title={lastLine.text}>{lastLine.text || "∅"}</code>
          </div>
          {lastLine.frame ? <div className="serial-sensor-grid">
            {sensors.map(([sensorId, vector], index) => (
              <article key={sensorId}>
                <header><strong>IMU {index + 1}</strong><small>{sensorId}</small></header>
                <div>
                  {channels.map((channel) => <span key={channel.key}>
                    <b>{channel.label}{index + 1}</b>
                    <i>{formatValue(vector?.[channel.key])}</i>
                  </span>)}
                </div>
              </article>
            ))}
          </div> : <span className="serial-monitor-empty">{t("serial.monitor.invalid")}</span>}
        </>}
      </div>
    </section>
  );
}
