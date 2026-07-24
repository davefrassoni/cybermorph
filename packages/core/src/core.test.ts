import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAPPINGS,
  clampJointValue,
  clampPose,
  mapFrame,
  parseIntelHex,
  parseSensorLine,
  predictGesture,
  trainGestureModel,
  type LabeledCapture,
  type SensorFrame
} from "./index.js";

const frame = (value: number): SensorFrame => ({
  timestamp: value,
  sensors: {
    left_elbow: { pitch: value, roll: 0, yaw: 0 }
  }
});

describe("sensor protocol", () => {
  it("parses long and compact JSON frames", () => {
    expect(
      parseSensorLine('{"sensors":{"left_elbow":{"pitch":1,"roll":2,"yaw":3}}}')
        ?.sensors.left_elbow?.roll
    ).toBe(2);
    expect(parseSensorLine('{"left_elbow":[4,5,6]}')?.sensors.left_elbow?.yaw).toBe(
      6
    );
    expect(parseSensorLine("bad data")).toBeNull();
  });
});

describe("mapping engine", () => {
  it("maps an angle to the configured output range", () => {
    const mapping = { ...DEFAULT_MAPPINGS[0]!, smoothing: 0 };
    const output = mapFrame(frame(130), [mapping]);
    expect(output[0]?.normalized).toBe(1);
    expect(output[0]?.value).toBe(12000);
  });
});

describe("biomechanical limits", () => {
  it("prevents impossible forearm and knee rotations", () => {
    expect(clampJointValue("left_elbow", "pitch", 180)).toBe(145);
    expect(clampJointValue("right_elbow", "roll", -180)).toBe(-10);
    expect(clampJointValue("left_knee", "pitch", -40)).toBe(0);
  });

  it("clamps a pose without adding absent joints", () => {
    expect(clampPose({
      left_elbow: { pitch: 190, roll: 40, yaw: -120 }
    })).toEqual({
      left_elbow: { pitch: 145, roll: 10, yaw: -80 }
    });
  });
});

describe("Intel HEX firmware", () => {
  const blinkRecord = ":100000000C945C000C946E000C946E000C946E00CA\n:00000001FF";

  it("validates and pads firmware to an AVR flash page", () => {
    const firmware = parseIntelHex(blinkRecord, 32256);
    expect(firmware).toHaveLength(128);
    expect(Array.from(firmware.slice(0, 4))).toEqual([0x0c, 0x94, 0x5c, 0x00]);
    expect(firmware[127]).toBe(0xff);
  });

  it("rejects a corrupt firmware checksum", () => {
    expect(() => parseIntelHex(blinkRecord.replace("CA", "CB"), 32256)).toThrow(
      "checksum"
    );
  });
});

describe("gesture model", () => {
  it("learns two separated movement classes", () => {
    const captures: LabeledCapture[] = [
      {
        id: "low-1",
        label: "low",
        createdAt: "",
        frames: [frame(0), frame(3), frame(2)]
      },
      {
        id: "low-2",
        label: "low",
        createdAt: "",
        frames: [frame(1), frame(4), frame(2)]
      },
      {
        id: "high-1",
        label: "high",
        createdAt: "",
        frames: [frame(90), frame(120), frame(100)]
      },
      {
        id: "high-2",
        label: "high",
        createdAt: "",
        frames: [frame(95), frame(125), frame(110)]
      }
    ];
    const model = trainGestureModel(captures, 3);
    expect(predictGesture(model, [frame(92), frame(122), frame(105)])?.label).toBe(
      "high"
    );
  });
});
