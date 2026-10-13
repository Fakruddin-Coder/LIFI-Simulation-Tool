/**
 * Li-Fi Simulation Metrics & Performance Statistics Tracker
 */

import type { SimulationStats, TransmittedMessage, ChannelConfig } from '../types/simulation';

export function createInitialStats(): SimulationStats {
  return {
    totalTransmitted: 0,
    transmittedA: 0,
    transmittedB: 0,
    totalReceivedSuccess: 0,
    receivedA: 0,
    receivedB: 0,
    corruptedFrames: 0,
    blockedTransmissions: 0,
    totalBitsTransmitted: 0,
    bitErrorCount: 0,
    bitErrorRate: 0,
    packetSuccessRate: 100,
    currentBitRateBps: 50, // default 20ms per bit -> 50 bps
    averageLatencyMs: 0,
  };
}

export function updateStats(
  prevStats: SimulationStats,
  message: TransmittedMessage,
  latencyMs: number,
  bitDurationMs: number
): SimulationStats {
  const totalTransmitted = prevStats.totalTransmitted + 1;
  const transmittedA = prevStats.transmittedA + (message.sender === 'DEVICE_A' ? 1 : 0);
  const transmittedB = prevStats.transmittedB + (message.sender === 'DEVICE_B' ? 1 : 0);

  const isSuccess = message.status === 'DELIVERED';
  const isBlocked = message.status === 'CHANNEL_BLOCKED';
  const isCorrupted = message.status === 'CHECKSUM_ERROR' || message.status === 'FRAME_ERROR';

  const totalReceivedSuccess = prevStats.totalReceivedSuccess + (isSuccess ? 1 : 0);
  const receivedA = prevStats.receivedA + (isSuccess && message.receiver === 'DEVICE_A' ? 1 : 0);
  const receivedB = prevStats.receivedB + (isSuccess && message.receiver === 'DEVICE_B' ? 1 : 0);

  const corruptedFrames = prevStats.corruptedFrames + (isCorrupted ? 1 : 0);
  const blockedTransmissions = prevStats.blockedTransmissions + (isBlocked ? 1 : 0);

  const bitsInMessage = message.symbols.length;
  const totalBitsTransmitted = prevStats.totalBitsTransmitted + bitsInMessage;

  // Calculate bit errors from samples
  let messageBitErrors = 0;
  if (message.samples && message.samples.length > 0) {
    messageBitErrors = message.samples.filter(s => s.txBit !== s.rxBit).length;
  }
  const bitErrorCount = prevStats.bitErrorCount + messageBitErrors;

  const bitErrorRate = totalBitsTransmitted > 0 
    ? Number((bitErrorCount / totalBitsTransmitted).toFixed(5))
    : 0;

  const packetSuccessRate = totalTransmitted > 0 
    ? Number(((totalReceivedSuccess / totalTransmitted) * 100).toFixed(1))
    : 100;

  const currentBitRateBps = Math.round(1000 / Math.max(1, bitDurationMs));

  // Running average latency
  const currentAvgLatency = prevStats.averageLatencyMs || latencyMs;
  const averageLatencyMs = Math.round(
    ((currentAvgLatency * (totalTransmitted - 1)) + latencyMs) / totalTransmitted
  );

  return {
    totalTransmitted,
    transmittedA,
    transmittedB,
    totalReceivedSuccess,
    receivedA,
    receivedB,
    corruptedFrames,
    blockedTransmissions,
    totalBitsTransmitted,
    bitErrorCount,
    bitErrorRate,
    packetSuccessRate,
    currentBitRateBps,
    averageLatencyMs,
  };
}

/**
 * Calculates optical SNR in decibels (dB)
 */
export function calculateOpticalSNR(config: ChannelConfig): number {
  if (!config.enabled) return 0;
  const noise = Math.max(0.001, config.noiseLevel);
  // Signal power relative to noise variance
  const signalPower = 1.0 / Math.pow(1.0 + 0.18 * config.distanceMeters, 1.8);
  const snrLinear = signalPower / (noise * noise);
  const snrdB = 10 * Math.log10(Math.max(1, snrLinear));
  return Number(snrdB.toFixed(1));
}
