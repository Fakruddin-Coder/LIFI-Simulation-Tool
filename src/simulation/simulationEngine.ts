/**
 * Li-Fi Simulation Engine
 * Orchestrates framing, modulation, channel propagation, real-time animation,
 * and receiver decoding for both Device A and Device B.
 */

import { encodeFrame } from './protocol';
import { modulateBits } from './modulation';
import { transmitThroughOpticalChannel } from './opticalChannel';
import { processReceivedSignal } from './receiver';
import type { 
  DeviceId, 
  ChannelConfig, 
  TransmittedMessage, 
  SignalSample 
} from '../types/simulation';

/**
 * Executes a full transmission synchronously (used for unit tests and instant recalculation)
 */
export function simulateTransmissionSync(
  text: string,
  sender: DeviceId,
  receiver: DeviceId,
  sequenceId: number,
  config: ChannelConfig
): TransmittedMessage {
  const startTime = Date.now();
  const id = `msg_${sender}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Framing
  const frame = encodeFrame(text, sender, receiver, sequenceId, config.modulation);

  // 2. Modulation
  const { symbols } = modulateBits(frame.rawBits, config.modulation);

  // 3. Optical channel propagation
  const channelResult = transmitThroughOpticalChannel(symbols, config);

  // 4. Photodetector & Receiver processing
  const decodedResult = processReceivedSignal(
    channelResult.receivedSymbols,
    config.modulation,
    !config.enabled
  );

  return {
    id,
    sender,
    receiver,
    timestamp: startTime,
    text,
    frame,
    symbols,
    samples: channelResult.samples,
    result: decodedResult,
    status: decodedResult.status,
    progress: 1.0,
    bitDurationMs: config.bitDurationMs,
    modulation: config.modulation,
  };
}

/**
 * Controller for an active animated transmission
 */
export interface AnimatedTransmissionController {
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Step callback data during animated transmission
 */
export interface AnimationStepData {
  messageId: string;
  sender: DeviceId;
  receiver: DeviceId;
  currentBitIndex: number;
  totalBits: number;
  progress: number;
  currentTxBit: number;
  currentTxOpticalPower: number;
  currentRxOpticalPower: number;
  currentRxBit: number;
  isLedOn: boolean;
  photonsPosition: number; // 0.0 to 1.0 between sender and receiver
  latestSample: SignalSample;
  accumulatedSamples: SignalSample[];
}

/**
 * Runs an animated step-by-step transmission with real-time callbacks
 */
export function runAnimatedTransmission(
  text: string,
  sender: DeviceId,
  receiver: DeviceId,
  sequenceId: number,
  config: ChannelConfig,
  onStep: (data: AnimationStepData) => void,
  onComplete: (message: TransmittedMessage) => void
): AnimatedTransmissionController {
  const startTime = Date.now();
  const id = `msg_${sender}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Framing
  const frame = encodeFrame(text, sender, receiver, sequenceId, config.modulation);

  // 2. Modulation
  const { symbols } = modulateBits(frame.rawBits, config.modulation);

  // 3. Precompute channel physics
  const channelResult = transmitThroughOpticalChannel(symbols, config);

  let currentIndex = 0;
  let isCancelled = false;
  let isPaused = false;
  let timeoutId: any = null;

  const accumulatedSamples: SignalSample[] = [];

  const totalBits = symbols.length;
  // Step duration in ms
  const stepDuration = Math.max(16, config.bitDurationMs);

  function tick() {
    if (isCancelled) return;

    if (isPaused) {
      timeoutId = setTimeout(tick, 100);
      return;
    }

    if (currentIndex < totalBits) {
      const sample = channelResult.samples[currentIndex];
      accumulatedSamples.push(sample);

      const progress = (currentIndex + 1) / totalBits;
      const photonPos = (currentIndex % 5) / 5; // wave effect

      onStep({
        messageId: id,
        sender,
        receiver,
        currentBitIndex: currentIndex,
        totalBits,
        progress,
        currentTxBit: sample.txBit,
        currentTxOpticalPower: sample.txOpticalPower,
        currentRxOpticalPower: sample.rxOpticalPower,
        currentRxBit: sample.rxBit,
        isLedOn: sample.txBit === 1,
        photonsPosition: photonPos,
        latestSample: sample,
        accumulatedSamples: [...accumulatedSamples],
      });

      currentIndex++;
      timeoutId = setTimeout(tick, stepDuration);
    } else {
      // Completed! Decode final result at receiver
      const decodedResult = processReceivedSignal(
        channelResult.receivedSymbols,
        config.modulation,
        !config.enabled
      );

      const finalMessage: TransmittedMessage = {
        id,
        sender,
        receiver,
        timestamp: startTime,
        text,
        frame,
        symbols,
        samples: channelResult.samples,
        result: decodedResult,
        status: decodedResult.status,
        progress: 1.0,
        bitDurationMs: config.bitDurationMs,
        modulation: config.modulation,
      };

      onComplete(finalMessage);
    }
  }

  // Start with propagation delay
  timeoutId = setTimeout(tick, Math.max(10, config.propagationDelayMs));

  return {
    cancel: () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
  };
}
