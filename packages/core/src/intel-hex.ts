export function parseIntelHex(
  source: string,
  maxFlash: number,
  pageSize = 128
): Uint8Array {
  const memory = new Uint8Array(maxFlash);
  memory.fill(0xff);
  let addressBase = 0;
  let highestAddress = 0;
  let foundData = false;
  let foundEof = false;

  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!/^:[0-9a-f]+$/i.test(line) || line.length % 2 !== 1) {
      throw new Error(`Invalid Intel HEX record on line ${index + 1}.`);
    }
    const bytes = Uint8Array.from(
      line.slice(1).match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []
    );
    const byteCount = bytes[0] ?? 0;
    if (bytes.length !== byteCount + 5) {
      throw new Error(`Invalid Intel HEX length on line ${index + 1}.`);
    }
    if (bytes.reduce((sum, value) => sum + value, 0) % 256 !== 0) {
      throw new Error(`Intel HEX checksum failed on line ${index + 1}.`);
    }

    const offset = ((bytes[1] ?? 0) << 8) | (bytes[2] ?? 0);
    const recordType = bytes[3];
    if (recordType === 0x00) {
      const absoluteAddress = addressBase + offset;
      const end = absoluteAddress + byteCount;
      if (end > maxFlash) {
        throw new Error(`Firmware exceeds the board application limit (${maxFlash} bytes).`);
      }
      memory.set(bytes.slice(4, 4 + byteCount), absoluteAddress);
      highestAddress = Math.max(highestAddress, end);
      foundData = true;
    } else if (recordType === 0x01) {
      foundEof = true;
      break;
    } else if (recordType === 0x02) {
      addressBase = (((bytes[4] ?? 0) << 8) | (bytes[5] ?? 0)) << 4;
    } else if (recordType === 0x04) {
      addressBase = (((bytes[4] ?? 0) << 8) | (bytes[5] ?? 0)) << 16;
    } else if (recordType !== 0x03 && recordType !== 0x05) {
      throw new Error(`Unsupported Intel HEX record type ${recordType}.`);
    }
  }

  if (!foundData || !foundEof) throw new Error("The Intel HEX file is incomplete.");
  return memory.slice(0, Math.ceil(highestAddress / pageSize) * pageSize);
}
