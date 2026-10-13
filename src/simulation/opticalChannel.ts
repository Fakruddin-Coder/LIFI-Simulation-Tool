/**
 * Simulated Free-Space Optical Channel for Li-Fi
 * Models LED emission, path loss attenuation, ambient light, AWGN optical noise,
 * beam obstruction, and photodetector response.
 */

import type { ChannelConfig, SignalSample } from '../types/simulation';

/**
 * Simple seeded pseudo-random number generator for reproducible noise simulation
 */
class SeededRNG {
  private state: number;

  constructor(seed: number = 123456789) {
    this.state = seed & 0xFFFFFFFF;
  }

  // Linear congruential generator
  next(): number {
    this.state = (1664525 * this.state + 1013904223) & 0xFFFFFFFF;
    return (this.state >>> 0) / 4294967296;
  }

  // Box-Muller transform for Gaussian noise
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    // Avoid u1 == 0
    while (u1 <= 1e-15) {
      u1 = this.next();
    }
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

/**
 * Calculates optical path loss as a function of distance
 */
export function calculateOpticalPathLoss(distanceMeters: number, attenuationFactor: number = 1.0): number {
  // Geometric optical propagation loss: inverse-square like attenuation
  const effectiveDistance = Math.max(0.1, distanceMeters);
  const geometricLoss = 1.0 / Math.pow(1.0 + 0.18 * effectiveDistance, 1.8);
  return Math.max(0.01, Math.min(1.0, geometricLoss * attenuationFactor));
}

export interface ChannelSimulationResult {
  receivedSymbols: number[];
  samples: SignalSample[];
  bitErrors: number;
}

/**
 * Propagates symbols through the optical channel and produces received symbols & waveform samples
 */
export function transmitThroughOpticalChannel(
  transmittedSymbols: number[],
  config: ChannelConfig
): ChannelSimulationResult {
  const rng = config.deterministicSeed !== undefined 
    ? new SeededRNG(config.deterministicSeed) 
    : new SeededRNG(Math.floor(Math.random() * 1000000) + 1);

  const pathLoss = calculateOpticalPathLoss(config.distanceMeters, config.attenuationFactor);
  const isBeamBlocked = !config.enabled;
  const samples: SignalSample[] = [];
  const receivedSymbols: number[] = [];
  let bitErrors = 0;

  // Determine error injection target index if enabled
  const injectErrorIndex = config.errorInjection 
    ? (config.errorBitPosition !== undefined ? config.errorBitPosition : Math.floor(transmittedSymbols.length / 2))
    : -1;

  for (let i = 0; i < transmittedSymbols.length; i++) {
    let txBit = transmittedSymbols[i];

    // Controlled error injection
    if (i === injectErrorIndex) {
      txBit = txBit === 1 ? 0 : 1;
    }

    const txVoltage = txBit === 1 ? 3.3 : 0.0;
    const txOpticalPower = txBit === 1 ? 1.0 : 0.0;

    // Optical propagation
    let rxOpticalPower = 0.0;
    if (!isBeamBlocked) {
      const attenuatedLight = txOpticalPower * pathLoss;
      const noise = rng.nextGaussian(0, config.noiseLevel);
      rxOpticalPower = Math.max(0.0, attenuatedLight + config.ambientLight + noise);
    } else {
      // Beam is blocked: only ambient light and noise arrive
      const noise = rng.nextGaussian(0, config.noiseLevel * 0.5);
      rxOpticalPower = Math.max(0.0, config.ambientLight * 0.2 + noise);
    }

    // Photodetector comparator threshold
    // Default threshold is typically 0.35 to 0.5
    const threshold = config.receiverSensitivity;
    const rxBit = rxOpticalPower >= threshold ? 1 : 0;
    const rxVoltage = rxBit === 1 ? 3.3 : 0.0;

    if (rxBit !== txBit) {
      bitErrors++;
    }

    receivedSymbols.push(rxBit);

    samples.push({
      timeMs: i * config.bitDurationMs,
      bitIndex: i,
      txBit,
      txVoltage,
      txOpticalPower,
      rxOpticalPower: Number(rxOpticalPower.toFixed(3)),
      rxThreshold: threshold,
      rxVoltage,
      rxBit,
    });
  }

  return {
    receivedSymbols,
    samples,
    bitErrors,
  };
}
