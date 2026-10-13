/**
 * Li-Fi Optical Receiver Subsystem
 * Demodulates photodetector symbol samples, reconstructs the bitstream,
 * validates frames, and decodes the final text payload.
 */

import { demodulateSymbols } from './modulation';
import { bitsToBytes, decodeFrame } from './protocol';
import type { ModulationType, DecodedResult } from '../types/simulation';

export function processReceivedSignal(
  receivedSymbols: number[],
  modulation: ModulationType,
  isChannelBlocked: boolean,
  hardwareTimeoutMs: boolean = false
): DecodedResult {
  if (hardwareTimeoutMs) {
    return {
      success: false,
      text: '',
      recoveredBytes: new Uint8Array(0),
      expectedCrc: 0,
      computedCrc: 0,
      errorReason: 'Receiver timeout: optical carrier synchronization lost',
      bitErrors: 0,
      status: 'TIMEOUT',
    };
  }

  if (isChannelBlocked) {
    return {
      success: false,
      text: '',
      recoveredBytes: new Uint8Array(0),
      expectedCrc: 0,
      computedCrc: 0,
      errorReason: 'Optical beam obstructed: line-of-sight path is blocked, zero light received',
      bitErrors: receivedSymbols.filter(s => s === 1).length,
      status: 'CHANNEL_BLOCKED',
    };
  }

  // Demodulate symbols back into bits
  const { bits, codingViolations } = demodulateSymbols(receivedSymbols, modulation);

  // Convert bits to bytes
  const recoveredBytes = bitsToBytes(bits);

  // Decode and validate frame
  const decodedResult = decodeFrame(recoveredBytes);

  if (codingViolations > 0 && decodedResult.success) {
    // If Manchester detected violations but frame miraculously passed CRC (rare), log warning
    return {
      ...decodedResult,
      bitErrors: codingViolations,
    };
  }

  return decodedResult;
}
