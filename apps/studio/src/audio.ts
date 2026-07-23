import * as Tone from "tone";
import type { MappingOutput } from "@cybermorph/core";

class MotionAudio {
  private synth?: Tone.PolySynth;
  private filter?: Tone.Filter;
  private gain?: Tone.Gain;
  private loop?: Tone.Loop;
  private started = false;
  private noteActive = false;

  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.filter = new Tone.Filter(1200, "lowpass");
    this.gain = new Tone.Gain(0.25).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth" },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.35, release: 0.8 }
    }).connect(this.filter);
    this.filter.connect(this.gain);
    this.loop = new Tone.Loop((time) => {
      this.synth?.triggerAttackRelease(["C2", "G2", "Bb2"], "16n", time, 0.32);
    }, "4n");
    Tone.getTransport().bpm.value = 122;
    Tone.getTransport().start();
    this.started = true;
  }

  apply(outputs: MappingOutput[]): void {
    if (!this.started) return;
    for (const output of outputs) {
      if (output.target === "filter" && this.filter) {
        this.filter.frequency.rampTo(Math.max(80, output.value), 0.04);
      }
      if (output.target === "volume" && this.gain) {
        this.gain.gain.rampTo(Math.max(0, Math.min(1, output.value)), 0.04);
      }
      if (output.target === "pitch" && this.synth) {
        const note = Tone.Frequency(Math.round(output.value), "midi").toNote();
        this.synth.triggerAttackRelease(note, "16n", undefined, 0.3);
      }
      if (output.target === "loop" && this.loop) {
        if (output.normalized > 0.62 && this.loop.state !== "started") {
          this.loop.start(0);
        } else if (output.normalized < 0.38 && this.loop.state === "started") {
          this.loop.stop();
        }
      }
      if (output.target === "midi_note" && this.synth) {
        if (output.normalized > 0.7 && !this.noteActive) {
          this.synth.triggerAttack(Tone.Frequency(output.value, "midi").toNote());
          this.noteActive = true;
        } else if (output.normalized < 0.55 && this.noteActive) {
          this.synth.releaseAll();
          this.noteActive = false;
        }
      }
    }
  }

  triggerGesture(label: string): void {
    if (!this.started || !this.synth) return;
    const notes = ["C3", "Eb3", "G3", "Bb3", "D4"];
    const hash = [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    this.synth.triggerAttackRelease(notes[hash % notes.length]!, "8n", undefined, 0.7);
  }
}

export const motionAudio = new MotionAudio();

class MidiController {
  private access?: MIDIAccess;
  private output?: MIDIOutput;
  private lastValues = new Map<string, number>();

  async connect(outputId?: string): Promise<MIDIOutput[]> {
    if (!navigator.requestMIDIAccess) return [];
    this.access = await navigator.requestMIDIAccess({ sysex: false });
    const outputs = [...this.access.outputs.values()];
    this.output = outputs.find((candidate) => candidate.id === outputId) ?? outputs[0];
    return outputs;
  }

  select(id: string): void {
    this.output = this.access?.outputs.get(id);
  }

  send(outputs: MappingOutput[]): void {
    if (!this.output) return;
    for (const item of outputs) {
      const key = item.mappingId;
      const value = Math.round(Math.max(0, Math.min(127, item.value)));
      if (this.lastValues.get(key) === value) continue;
      this.lastValues.set(key, value);
      const channel = Math.max(0, Math.min(15, item.midiChannel - 1));
      if (item.target === "midi_cc") {
        this.output.send([0xb0 + channel, item.midiControl, value]);
      } else if (item.target === "midi_note") {
        const velocity = item.normalized > 0.65 ? 110 : 0;
        this.output.send([velocity ? 0x90 + channel : 0x80 + channel, value, velocity]);
      }
    }
  }
}

export const midiController = new MidiController();
