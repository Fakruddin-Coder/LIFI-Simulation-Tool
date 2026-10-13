/**
 * Li-Fi Communication Protocol Definition
 * Encapsulation, bit-packing, CRC verification, and byte-to-text conversion.
 */

import { computeCRC16, formatHex16, formatHex8 } from './crc';
import type { DeviceId, LiFiFrame, ProtocolHeader, DecodedResult } from '../types/simulation';

export const PREAMBLE_BYTE = 0xAA; // 10101010b - Clock acquisition & AGC
export const SOF_BYTE = 0x7E;      // 01111110b - Start of Frame delimiter
export const EOF_BYTE = 0x7F;      // 01111111b - End of Frame delimiter

export const DEVICE_A_ID = 0x01;
export const DEVICE_B_ID = 0x02;

/**
 * Converts text string to UTF-8 bytes
 */
export function textToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

/**
 * Converts UTF-8 bytes back to string
 */
export function bytesToText(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(bytes);
}

/**
 * Converts byte array to an array of individual bits (MSB first)
 */
export function bytesToBits(bytes: Uint8Array | number[]): number[] {
  const bits: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    for (let b = 7; b >= 0; b--) {
      bits.push((byte >> b) & 1);
    }
  }
  return bits;
}

/**
 * Converts an array of bits (multiples of 8) back to bytes
 */
export function bitsToBytes(bits: number[]): Uint8Array {
  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | (bits[i * 8 + b] ? 1 : 0);
    }
    bytes[i] = byteVal;
  }
  return bytes;
}

export function deviceToId(device: DeviceId): number {
  return device === 'DEVICE_A' ? DEVICE_A_ID : DEVICE_B_ID;
}

export function idToDevice(id: number): DeviceId | null {
  if (id === DEVICE_A_ID) return 'DEVICE_A';
  if (id === DEVICE_B_ID) return 'DEVICE_B';
  return null;
}

/**
 * Encodes text into a complete Li-Fi binary protocol frame
 */
export function encodeFrame(
  text: string,
  sender: DeviceId,
  receiver: DeviceId,
  sequenceId: number,
  modulation: 'OOK' | 'MANCHESTER'
): LiFiFrame {
  const payloadBytes = textToBytes(text);
  const senderId = deviceToId(sender);
  const targetId = deviceToId(receiver);
  const modCode = modulation === 'OOK' ? 0x00 : 0x01;
  const payloadLen = payloadBytes.length;

  // Header: 5 bytes [senderId, targetId, sequenceId, modCode, lenMSB, lenLSB] => actually 6 bytes
  const headerBytes = new Uint8Array([
    senderId,
    targetId,
    sequenceId & 0xFF,
    modCode,
    (payloadLen >> 8) & 0xFF,
    payloadLen & 0xFF,
  ]);

  const header: ProtocolHeader = {
    senderId,
    targetId,
    sequenceId: sequenceId & 0xFF,
    modulation: modCode,
    payloadLength: payloadLen,
  };

  // CRC-16 computed over Header + Payload
  const protectedData = new Uint8Array(headerBytes.length + payloadBytes.length);
  protectedData.set(headerBytes, 0);
  protectedData.set(payloadBytes, headerBytes.length);

  const crc16 = computeCRC16(protectedData);

  // Raw frame bytes:
  // [PREAMBLE (1B), SOF (1B), HEADER (6B), PAYLOAD (NB), CRC_MSB (1B), CRC_LSB (1B), EOF (1B)]
  const totalFrameSize = 1 + 1 + headerBytes.length + payloadBytes.length + 2 + 1;
  const rawFrameBytes = new Uint8Array(totalFrameSize);

  let offset = 0;
  rawFrameBytes[offset++] = PREAMBLE_BYTE;
  rawFrameBytes[offset++] = SOF_BYTE;
  rawFrameBytes.set(headerBytes, offset);
  offset += headerBytes.length;
  rawFrameBytes.set(payloadBytes, offset);
  offset += payloadBytes.length;
  rawFrameBytes[offset++] = (crc16 >> 8) & 0xFF;
  rawFrameBytes[offset++] = crc16 & 0xFF;
  rawFrameBytes[offset++] = EOF_BYTE;

  const rawBits = bytesToBits(rawFrameBytes);

  return {
    preamble: bytesToBits([PREAMBLE_BYTE]),
    sof: bytesToBits([SOF_BYTE]),
    header,
    headerBytes,
    payloadBytes,
    crc16,
    eof: bytesToBits([EOF_BYTE]),
    rawFrameBytes,
    rawBits,
  };
}

/**
 * Decodes raw bytes into frame components and verifies integrity
 */
export function decodeFrame(rawBytes: Uint8Array): DecodedResult {
  if (rawBytes.length < 11) { // 1 (Preamble) + 1 (SOF) + 6 (Header) + 0 (Payload) + 2 (CRC) + 1 (EOF) = 11 bytes min
    return {
      success: false,
      text: '',
      recoveredBytes: new Uint8Array(0),
      expectedCrc: 0,
      computedCrc: 0,
      errorReason: `Frame too short (${rawBytes.length} bytes, minimum 11 bytes required)`,
      bitErrors: 0,
      status: 'FRAME_ERROR',
    };
  }

  // 1. Scan for Preamble and SOF
  let sofIndex = -1;
  for (let i = 0; i <= rawBytes.length - 10; i++) {
    if (rawBytes[i] === PREAMBLE_BYTE && rawBytes[i + 1] === SOF_BYTE) {
      sofIndex = i + 1;
      break;
    }
  }

  if (sofIndex === -1) {
    // Check if SOF alone is present
    for (let i = 0; i <= rawBytes.length - 10; i++) {
      if (rawBytes[i] === SOF_BYTE) {
        sofIndex = i;
        break;
      }
    }
  }

  if (sofIndex === -1) {
    return {
      success: false,
      text: '',
      recoveredBytes: new Uint8Array(0),
      expectedCrc: 0,
      computedCrc: 0,
      errorReason: 'Start-of-Frame delimiter (0x7E) not found in received optical stream',
      bitErrors: 0,
      status: 'FRAME_ERROR',
    };
  }

  const frameStart = sofIndex + 1; // start of header
  if (frameStart + 6 > rawBytes.length) {
    return {
      success: false,
      text: '',
      recoveredBytes: new Uint8Array(0),
      expectedCrc: 0,
      computedCrc: 0,
      errorReason: 'Truncated frame: header incomplete',
      bitErrors: 0,
      status: 'FRAME_ERROR',
    };
  }

  const payloadLen = (rawBytes[frameStart + 4] << 8) | rawBytes[frameStart + 5];

  const headerBytes = rawBytes.slice(frameStart, frameStart + 6);
  const payloadStart = frameStart + 6;
  const payloadEnd = payloadStart + payloadLen;

  if (payloadEnd + 3 > rawBytes.length) {
    return {
      success: false,
      text: '',
      recoveredBytes: new Uint8Array(0),
      expectedCrc: 0,
      computedCrc: 0,
      errorReason: `Truncated payload: expected ${payloadLen} bytes but frame ended early`,
      bitErrors: 0,
      status: 'FRAME_ERROR',
    };
  }

  const payloadBytes = rawBytes.slice(payloadStart, payloadEnd);
  const receivedCrc = (rawBytes[payloadEnd] << 8) | rawBytes[payloadEnd + 1];
  const receivedEof = rawBytes[payloadEnd + 2];

  if (receivedEof !== EOF_BYTE) {
    return {
      success: false,
      text: '',
      recoveredBytes: payloadBytes,
      expectedCrc: receivedCrc,
      computedCrc: 0,
      errorReason: `Invalid End-of-Frame delimiter: expected ${formatHex8(EOF_BYTE)}, got ${formatHex8(receivedEof)}`,
      bitErrors: 0,
      status: 'FRAME_ERROR',
    };
  }

  // Compute CRC-16 over Header + Payload
  const protectedData = new Uint8Array(headerBytes.length + payloadBytes.length);
  protectedData.set(headerBytes, 0);
  protectedData.set(payloadBytes, headerBytes.length);

  const calculatedCrc = computeCRC16(protectedData);

  if (calculatedCrc !== receivedCrc) {
    return {
      success: false,
      text: bytesToText(payloadBytes),
      recoveredBytes: payloadBytes,
      expectedCrc: receivedCrc,
      computedCrc: calculatedCrc,
      errorReason: `CRC-16 mismatch: expected ${formatHex16(receivedCrc)}, computed ${formatHex16(calculatedCrc)}. Optical noise caused frame corruption.`,
      bitErrors: 0,
      status: 'CHECKSUM_ERROR',
    };
  }

  // Success
  const decodedText = bytesToText(payloadBytes);
  return {
    success: true,
    text: decodedText,
    recoveredBytes: payloadBytes,
    expectedCrc: receivedCrc,
    computedCrc: calculatedCrc,
    bitErrors: 0,
    status: 'DELIVERED',
  };
}
