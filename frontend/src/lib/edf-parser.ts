import type { EdfHeader, EdfSignalHeader, ChannelData, EEGData } from "./types";

function readString(view: DataView, offset: number, length: number): string {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str.trim();
}

function readFloat(view: DataView, offset: number, length: number): number {
  return parseFloat(readString(view, offset, length));
}

function readInt(view: DataView, offset: number, length: number): number {
  return parseInt(readString(view, offset, length), 10);
}

export function parseEdfHeader(buffer: ArrayBuffer): EdfHeader {
  const view = new DataView(buffer);

  return {
    version: readString(view, 0, 8),
    patientId: readString(view, 8, 80),
    recordingId: readString(view, 88, 80),
    startDate: readString(view, 168, 8),
    startTime: readString(view, 176, 8),
    headerBytes: readInt(view, 184, 8),
    dataFormat: readString(view, 192, 44),
    numDataRecords: readInt(view, 236, 8),
    dataRecordDuration: readFloat(view, 244, 8),
    numSignals: readInt(view, 252, 4),
  };
}

export function parseEdfSignalHeaders(
  buffer: ArrayBuffer,
  numSignals: number,
): EdfSignalHeader[] {
  const view = new DataView(buffer);
  const base = 256;
  const signals: EdfSignalHeader[] = [];

  for (let i = 0; i < numSignals; i++) {
    signals.push({
      label: readString(view, base + i * 16, 16),
      transducerType: readString(view, base + numSignals * 16 + i * 80, 80),
      physicalDimension: readString(view, base + numSignals * 96 + i * 8, 8),
      physicalMin: readFloat(view, base + numSignals * 104 + i * 8, 8),
      physicalMax: readFloat(view, base + numSignals * 112 + i * 8, 8),
      digitalMin: readInt(view, base + numSignals * 120 + i * 8, 8),
      digitalMax: readInt(view, base + numSignals * 128 + i * 8, 8),
      prefiltering: readString(view, base + numSignals * 136 + i * 80, 80),
      numSamples: readInt(view, base + numSignals * 216 + i * 8, 8),
    });
  }

  return signals;
}

export function parseEdf(buffer: ArrayBuffer): EEGData {
  const header = parseEdfHeader(buffer);
  const signalHeaders = parseEdfSignalHeaders(buffer, header.numSignals);

  const dataOffset = header.headerBytes;
  const view = new DataView(buffer);

  const channels: ChannelData[] = signalHeaders.map((sh) => {
    const totalSamples = sh.numSamples * header.numDataRecords;
    return {
      label: sh.label,
      samples: new Float32Array(totalSamples),
      sampleRate: sh.numSamples / header.dataRecordDuration,
      physicalMin: sh.physicalMin,
      physicalMax: sh.physicalMax,
    };
  });

  const channelWriteIndex = new Array(header.numSignals).fill(0);

  for (let rec = 0; rec < header.numDataRecords; rec++) {
    let byteOffset = dataOffset;
    for (let r = 0; r < rec; r++) {
      for (let s = 0; s < header.numSignals; s++) {
        byteOffset += signalHeaders[s].numSamples * 2;
      }
    }

    for (let sig = 0; sig < header.numSignals; sig++) {
      const sh = signalHeaders[sig];
      const scale = (sh.physicalMax - sh.physicalMin) / (sh.digitalMax - sh.digitalMin);

      for (let s = 0; s < sh.numSamples; s++) {
        const digitalValue = view.getInt16(byteOffset, true);
        byteOffset += 2;
        const physicalValue = sh.physicalMin + (digitalValue - sh.digitalMin) * scale;
        channels[sig].samples[channelWriteIndex[sig]++] = physicalValue;
      }
    }
  }

  return {
    channels,
    durationSeconds: header.numDataRecords * header.dataRecordDuration,
    startDate: header.startDate,
    patientInfo: header.patientId,
  };
}

export function validateEdfFile(buffer: ArrayBuffer): { valid: boolean; error?: string } {
  if (buffer.byteLength < 256) {
    return { valid: false, error: "File too small to be a valid EDF" };
  }

  try {
    const header = parseEdfHeader(buffer);
    if (header.version !== "0") {
      return { valid: false, error: `Unexpected EDF version: ${header.version}` };
    }
    if (header.numSignals < 1 || header.numSignals > 256) {
      return { valid: false, error: `Invalid signal count: ${header.numSignals}` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Failed to parse EDF header" };
  }
}
