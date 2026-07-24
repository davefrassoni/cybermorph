import { AlertTriangle, Check, Cpu, ExternalLink, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AVR_BOARD_PROFILES, flashAvr328p } from "./firmware";
import { useI18n, type TranslationKey } from "./i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onBeforeFlash: () => Promise<void>;
};

type FlashState = "idle" | "flashing" | "success" | "error";

export function FirmwareFlasher({ open, onClose, onBeforeFlash }: Props) {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState("uno");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<FlashState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const profile = useMemo(
    () => AVR_BOARD_PROFILES.find((candidate) => candidate.id === profileId) ?? AVR_BOARD_PROFILES[0]!,
    [profileId]
  );

  if (!open) return null;

  const flash = async (bundled: boolean) => {
    setState("flashing");
    setProgress(0);
    setMessage("");
    try {
      await onBeforeFlash();
      const source = bundled
        ? await fetch("./firmware/cybermorph-atmega328p.hex").then((response) => {
            if (!response.ok) throw new Error("Bundled firmware could not be downloaded.");
            return response.text();
          })
        : await file?.text();
      if (!source) throw new Error("Choose an Intel HEX firmware file first.");
      await flashAvr328p(source, profile, setProgress);
      setState("success");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : t("firmware.error"));
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && state !== "flashing") onClose();
    }}>
      <section className="firmware-modal" role="dialog" aria-modal="true" aria-labelledby="firmware-title">
        <button className="modal-close" onClick={onClose} disabled={state === "flashing"} aria-label={t("firmware.close")}><X size={17} /></button>
        <span className="eyebrow">{t("firmware.eyebrow")}</span>
        <h2 id="firmware-title">{t("firmware.title")}</h2>
        <p>{t("firmware.description")}</p>

        {!navigator.serial && (
          <div className="firmware-warning"><AlertTriangle size={17} /><span>{t("firmware.unsupported")}</span></div>
        )}

        <label className="firmware-board">
          <span>{t("firmware.board")}</span>
          <select value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={state === "flashing"}>
            {AVR_BOARD_PROFILES.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {t(`firmware.board.${candidate.id}` as TranslationKey)}
              </option>
            ))}
          </select>
        </label>

        <div className="firmware-actions">
          <button className="firmware-primary" disabled={!navigator.serial || state === "flashing"} onClick={() => void flash(true)}>
            <Cpu size={17} /> {t("firmware.installBase")}
          </button>
          <button className="firmware-secondary" disabled={state === "flashing"} onClick={() => fileInput.current?.click()}>
            <Upload size={16} /> {file?.name ?? t("firmware.chooseHex")}
          </button>
          <input ref={fileInput} type="file" accept=".hex,text/plain" hidden onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setState("idle");
          }} />
          {file && (
            <button className="firmware-secondary" disabled={!navigator.serial || state === "flashing"} onClick={() => void flash(false)}>
              {t("firmware.installCustom")}
            </button>
          )}
        </div>

        {state === "flashing" && (
          <div className="firmware-progress">
            <span><i>{t("firmware.flashing")}</i><b>{progress}%</b></span>
            <div><i style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {state === "success" && <div className="firmware-result success"><Check size={17} /> {t("firmware.success")}</div>}
        {state === "error" && <div className="firmware-result error"><AlertTriangle size={17} /><span>{t("firmware.error")}<small>{message}</small></span></div>}

        <div className="firmware-notes">
          <strong>{t("firmware.scopeTitle")}</strong>
          <p>{t("firmware.scope")}</p>
          <a href="https://app.arduino.cc/sketches" target="_blank" rel="noreferrer">{t("firmware.otherBoards")} <ExternalLink size={13} /></a>
        </div>
      </section>
    </div>
  );
}
