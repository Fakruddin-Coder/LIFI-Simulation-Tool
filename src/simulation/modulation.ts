/**
 * Modulation & Demodulation Schemes for Li-Fi
 * - OOK (On-Off Keying): Direct intensity modulation
 * - Manchester (Bi-Phase-L): IEEE 802.15.7 VLC standard with guaranteed transitions
 */

import type { ModulationType } from '../types/simulation';

export interface ModulationResult {
  symbols: number[];           // Modulated symbol sequence (0 or 1)
  symbolDurationFactor: number; // 1 for OOK, 2 for Manchester
}

export interface DemodulationResult {
  bits: number[];
  codingViolations: number;
}

/**
 * Modulates digital bits into optical transmission symbols
 */
export function modulateBits(bits: number[], scheme: ModulationType): ModulationResult {
  if (scheme === 'OOK') {
    return {
      symbols: [...bits],
      symbolDurationFactor: 1,
    };
  }

  // Manchester Encoding:
  // Bit 0 -> [0, 1] (Low-to-High transition)
  // Bit 1 -> [1, 0] (High-to-Low transition)
  const symbols: number[] = [];
  for (const bit of bits) {
    if (bit === 0) {
      symbols.push(0, 1);
    } else {
      symbols.push(1, 0);
    }
  }

  return {
    symbols,
    symbolDurationFactor: 2,
  };
}

/**
 * Demodulates optical symbols back into digital bits
 */
export function demodulateSymbols(symbols: number[], scheme: ModulationType): DemodulationResult {
  if (scheme === 'OOK') {
    return {
      bits: [...symbols],
      codingViolations: 0,
    };
  }

  // Manchester Demodulation
  const bits: number[] = [];
  let codingViolations = 0;

  for (let i = 0; i < symbols.length; i += 2) {
    if (i + 1 >= symbols.length) {
      // Incomplete pair at end
      codingViolations++;
      break;
    }
    const s0 = symbols[i];
    const s1 = symbols[i + 1];

    if (s0 === 0 && s1 === 1) {
      bits.push(0);
    } else if (s0 === 1 && s1 === 0) {
      bits.push(1);
    } else {
      // Transition violation (00 or 11) caused by optical noise
      codingViolations++;
      // Best-effort decision or default to 0
      bits.push(s0);
    }
  }

  return {
    bits,
    codingViolations,
  };
}
