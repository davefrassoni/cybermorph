import { Cable, CirclePower, Music2, Usb } from "lucide-react";
import { useState } from "react";

type Props = {
  source: "simulator" | "hardware";
  onSource: (source: "simulator" | "hardware") => void;
  serialConnected: boolean;
  serialMessage: string;
  audioEnabled: boolean;
  onAudio: () => void;
  onSerial: () => void;
};

export function ConnectionBar({
  source,
  onSource,
  serialConnected,
  serialMessage,
  audioEnabled,
  onAudio,
  onSerial
}: Props) {
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const [midiSelected, setMidiSelected] = useState("");

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
        <button className={source === "simulator" ? "active" : ""} onClick={() => onSource("simulator")}>SIM</button>
        <button className={source === "hardware" ? "active" : ""} onClick={() => onSource("hardware")} disabled={!window.cybermorph}>SUIT</button>
      </div>
      <div className="connection-item">
        <Usb size={16} />
        {window.cybermorph ? (
          <>
            <button
              className={`compact-button ${serialConnected ? "connected" : ""}`}
              onClick={onSerial}
            >
              <Cable size={14} /> {serialConnected ? "Disconnect" : "Choose Arduino"}
            </button>
          </>
        ) : <span>Desktop app required for Arduino</span>}
        <span className={`status-dot ${serialConnected ? "online" : ""}`} title={serialMessage} />
      </div>
      <div className="connection-item midi">
        <Music2 size={16} />
        <select value={midiSelected} onChange={(event) => {
          setMidiSelected(event.target.value);
          import("./audio").then(({ midiController }) => midiController.select(event.target.value));
        }}>
          {!midiOutputs.length && <option value="">MIDI output</option>}
          {midiOutputs.map((output) => <option key={output.id} value={output.id}>{output.name ?? output.id}</option>)}
        </select>
        <button className="compact-button" onClick={connectMidi}>{midiOutputs.length ? "Refresh" : "Enable"}</button>
      </div>
      <button className={`audio-button ${audioEnabled ? "enabled" : ""}`} onClick={onAudio}>
        <CirclePower size={16} /> {audioEnabled ? "Audio on" : "Start audio"}
      </button>
    </div>
  );
}
