import { parseSensorLine, type SensorFrame } from "@cybermorph/core";

export class WebSerialSuit {
  private port?: SerialPort;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private active = false;

  async connect(
    onFrame: (frame: SensorFrame) => void,
    onStatus: (connected: boolean, message: string) => void
  ): Promise<void> {
    if (!navigator.serial) {
      throw new Error("Web Serial is unavailable. Use the Windows desktop app.");
    }
    await this.disconnect();
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200, bufferSize: 65536 });
    this.port = port;
    this.active = true;
    onStatus(true, "Arduino connected at 115200 baud");

    const reader = port.readable?.getReader();
    if (!reader) throw new Error("The serial port has no readable stream.");
    this.reader = reader;
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (this.active) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > 1024 * 1024) buffer = "";
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const frame = parseSensorLine(line);
          if (frame) onFrame(frame);
        }
      }
    } catch (error) {
      if (this.active) {
        onStatus(false, error instanceof Error ? error.message : "Serial stream failed");
      }
    } finally {
      reader.releaseLock();
      if (this.reader === reader) this.reader = undefined;
    }
  }

  async disconnect(): Promise<void> {
    this.active = false;
    try { await this.reader?.cancel(); } catch { /* stream may already be closed */ }
    this.reader = undefined;
    try { await this.port?.close(); } catch { /* device may have been removed */ }
    this.port = undefined;
  }
}
