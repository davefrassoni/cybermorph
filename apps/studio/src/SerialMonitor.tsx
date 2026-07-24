import { Activity, Trash2 } from "lucide-react";
import { useI18n } from "./i18n";

export type SerialMonitorLine = {
  id: number;
  receivedAt: number;
  text: string;
  parsed: boolean;
};

type Props = {
  connected: boolean;
  lines: SerialMonitorLine[];
  onClear: () => void;
};

export function SerialMonitor({ connected, lines, onClear }: Props) {
  const { t } = useI18n();
  return (
    <section className="panel serial-monitor" aria-live="polite">
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
      <div className="serial-monitor-log" role="log">
        {!lines.length && <span className="serial-monitor-empty">{t("serial.monitor.empty")}</span>}
        {lines.map((line) => (
          <div key={line.id} className={line.parsed ? "valid" : "invalid"}>
            <time>{new Date(line.receivedAt).toLocaleTimeString()}</time>
            <i>{line.parsed ? "OK" : "RAW"}</i>
            <code>{line.text || "∅"}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
