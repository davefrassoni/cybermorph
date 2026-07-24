import { parseIntelHex } from "@cybermorph/core";

export type AvrBoardProfile = {
  id: "uno" | "nano" | "nano-old";
  baudRate: number;
  maxFlash: number;
};

export const AVR_BOARD_PROFILES: AvrBoardProfile[] = [
  { id: "uno", baudRate: 115200, maxFlash: 32256 },
  { id: "nano", baudRate: 115200, maxFlash: 30720 },
  { id: "nano-old", baudRate: 57600, maxFlash: 30720 }
];

const STK_OK = 0x10;
const STK_INSYNC = 0x14;
const CRC_EOP = 0x20;
const PAGE_SIZE = 128;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

class SerialTransport {
  private readonly buffered: number[] = [];
  private pendingRead?: Promise<ReadableStreamReadResult<Uint8Array>>;

  constructor(
    private readonly reader: ReadableStreamDefaultReader<Uint8Array>,
    private readonly writer: WritableStreamDefaultWriter<Uint8Array>
  ) {}

  async write(bytes: number[] | Uint8Array): Promise<void> {
    await this.writer.write(Uint8Array.from(bytes));
  }

  async readByte(timeoutMs: number): Promise<number> {
    if (this.buffered.length) return this.buffered.shift()!;
    if (!this.pendingRead) this.pendingRead = this.reader.read();
    let timeoutId = 0;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error("The Arduino bootloader did not respond.")), timeoutMs);
    });
    try {
      const result = await Promise.race([this.pendingRead, timeout]);
      this.pendingRead = undefined;
      if (result.done || !result.value?.length) throw new Error("The serial port was closed.");
      this.buffered.push(...result.value);
      return this.buffered.shift()!;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async expectOk(timeoutMs = 1200): Promise<void> {
    const started = Date.now();
    let previous = -1;
    while (Date.now() - started < timeoutMs) {
      const byte = await this.readByte(Math.max(50, timeoutMs - (Date.now() - started)));
      if (previous === STK_INSYNC && byte === STK_OK) return;
      previous = byte;
    }
    throw new Error("Unexpected response from the Arduino bootloader.");
  }

  async command(bytes: number[] | Uint8Array, timeoutMs = 1200): Promise<void> {
    await this.write(bytes);
    await this.expectOk(timeoutMs);
  }

  async close(): Promise<void> {
    try { await this.reader.cancel(); } catch { /* the bootloader may already have reset */ }
    this.reader.releaseLock();
    this.writer.releaseLock();
  }
}

export async function flashAvr328p(
  hexSource: string,
  profile: AvrBoardProfile,
  onProgress: (progress: number) => void
): Promise<void> {
  if (!navigator.serial) throw new Error("Web Serial is unavailable.");
  const firmware = parseIntelHex(hexSource, profile.maxFlash);
  const port = await navigator.serial.requestPort();
  let transport: SerialTransport | undefined;

  try {
    await port.open({ baudRate: profile.baudRate, bufferSize: 4096 });
    if (!port.readable || !port.writable) {
      throw new Error("The selected port is not readable and writable.");
    }
    const reader = port.readable.getReader();
    const writer = port.writable.getWriter();
    transport = new SerialTransport(reader, writer);

    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    await delay(120);
    await port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await delay(profile.id === "nano-old" ? 550 : 300);

    await transport.command([0x30, CRC_EOP], 1800);
    await transport.command([0x50, CRC_EOP]);

    for (let offset = 0; offset < firmware.length; offset += PAGE_SIZE) {
      const wordAddress = offset >> 1;
      await transport.command([
        0x55,
        wordAddress & 0xff,
        (wordAddress >> 8) & 0xff,
        CRC_EOP
      ]);
      const page = firmware.slice(offset, offset + PAGE_SIZE);
      await transport.command(Uint8Array.from([
        0x64,
        (page.length >> 8) & 0xff,
        page.length & 0xff,
        0x46,
        ...page,
        CRC_EOP
      ]), 2500);
      onProgress(Math.round(((offset + page.length) / firmware.length) * 100));
    }

    await transport.command([0x51, CRC_EOP]);
    await delay(180);
  } finally {
    await transport?.close();
    try { await port.close(); } catch { /* the board may reset while closing */ }
  }
}
