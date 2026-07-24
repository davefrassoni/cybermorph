import { Check, DownloadCloud, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n, type TranslationKey } from "./i18n";

export function UpdateControl() {
  const { t } = useI18n();
  const [status, setStatus] = useState<DesktopUpdateStatus | null>(null);

  useEffect(() => {
    const bridge = window.cybermorph;
    if (!bridge) return;
    void bridge.updateStatus().then(setStatus);
    return bridge.onUpdateStatus(setStatus);
  }, []);

  if (!window.cybermorph || !status) return null;
  const busy = status.state === "checking" || status.state === "available" || status.state === "downloading";
  const labelKey = `update.${status.state}` as TranslationKey;
  const label = status.state === "downloading"
    ? t(labelKey, { percent: status.percent ?? 0 })
    : t(labelKey);

  return (
    <div className={`update-control ${status.state}`} title={status.message}>
      <button
        disabled={busy}
        onClick={() => {
          if (status.state === "ready") void window.cybermorph?.installUpdate();
          else void window.cybermorph?.checkForUpdates();
        }}
      >
        {status.state === "ready" ? <DownloadCloud size={14} /> : status.state === "current" ? <Check size={14} /> : <RefreshCw size={14} />}
        <span>{label}</span>
      </button>
      <small>v{status.currentVersion}</small>
    </div>
  );
}
