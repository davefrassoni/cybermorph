import { Cable, CirclePower, Cpu, Music2, Usb } from "lucide-react";
import { useState } from "react";
import type { SerialFrameFormat } from "@cybermorph/core";
import { useI18n } from "./i18n";

type Props = {
  source: "simulator" | "hardware";
  onSource: (source: "simulator" | "hardware") => void;
  serialConnected: boolean;
  serialMessage: string;
  serialFormat: SerialFrameFormat;
  onSerialFormat: (format: SerialFrameFormat) => void;
  audioEnabled: boolean;
  onAudio: () => void;
  onSerial: () => void;
  onFirmware: () => void;
};

export function ConnectionBar({
  source,
  onSource,
  serialConnected,
  serialMessage,
  serialFormat,
  onSerialFormat,
  audioEnabled,
  onAudio,
  onSerial,
  onFirmware
}: Props) {
  const { t } = useI18n();
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const [midiSelected, setMidiSelected] = useState("");
  const serialSupported = "serial" in navigator;

  const connectMidi = async () => {
    const { midiController } = await import("./audio");
    try {
      const outputs = await midiController.connect(midiSelected);
      setMidiOutputs(outputs);
      const id = midiSelected || outputs[0]?.id || "";
      setMidiSelected(id);
      if (id) midiController.select(id);
    } catch {
      setMidiOutputs([]);
    }
  };

  return (
    <div className="connection-bar">
      <div className="source-switch">
        <button className={source === "simulator" ? "active" : ""} onClick={() => onSource("simulator")}>{t("source.sim")}</button>
        <button className={source === "hardware" ? "active" : ""} onClick={() => onSource("hardware")} disabled={!serialSupported}>{t("source.suit")}</button>
      </div>
      <div className="connection-item">
        <Usb size={16} />
        {serialSupported ? (
          <>
            <button
              className={`compact-button ${serialConnected ? "connected" : ""}`}
              onClick={onSerial}
            >
              <Cable size={14} /> {serialConnected ? t("serial.disconnect") : t("serial.choose")}
            </button>
          </>
        ) : <span>{t("serial.unsupported")}</span>}
        <select
          aria-label={t("serial.format")}
          value={serialFormat}
          disabled={serialConnected}
          onChange={(event) => onSerialFormat(event.target.value as SerialFrameFormat)}
        >
          <option value="auto">{t("serial.format.auto")}</option>
          <option value="json">{t("serial.format.json")}</option>
          <option value="esp32-wearable">{t("serial.format.esp32")}</option>
          <option value="pd-accel-gyro">{t("serial.format.pdAccel")}</option>
          <option value="pd-gyro-accel">{t("serial.format.pdGyro")}</option>
        </select>
        <span className={`status-dot ${serialConnected ? "online" : ""}`} title={serialMessage} />
        <button className="compact-button" onClick={onFirmware}><Cpu size={14} /> {t("firmware.open")}</button>
      </div>
      <div className="connection-item midi">
        <Music2 size={16} />
        <select value={midiSelected} onChange={(event) => {
          setMidiSelected(event.target.value);
          import("./audio").then(({ midiController }) => midiController.select(event.target.value));
        }}>
          {!midiOutputs.length && <option value="">{t("midi.output")}</option>}
          {midiOutputs.map((output) => <option key={output.id} value={output.id}>{output.name ?? output.id}</option>)}
        </select>
        <button className="compact-button" onClick={connectMidi}>{midiOutputs.length ? t("action.refresh") : t("action.enable")}</button>
      </div>
      <button className={`audio-button ${audioEnabled ? "enabled" : ""}`} onClick={onAudio}>
        <CirclePower size={16} /> {audioEnabled ? t("audio.on") : t("audio.start")}
      </button>
    </div>
  );
}
