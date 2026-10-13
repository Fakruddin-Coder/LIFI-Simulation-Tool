/**
 * Li-Fi Simulation Type Definitions
 * Covers protocol frames, modulation, physical channel parameters, and signal capture.
 */

export type ModulationType = 'OOK' | 'MANCHESTER';

export type DeviceId = 'DEVICE_A' | 'DEVICE_B';

export type MessageStatus = 
  | 'PENDING'
  | 'TRANSMITTING'
  | 'DELIVERED'
  | 'CHECKSUM_ERROR'
  | 'FRAME_ERROR'
  | 'CHANNEL_BLOCKED'
  | 'TIMEOUT';

export interface ProtocolHeader {
  senderId: number;      // 0x01: A, 0x02: B
  targetId: number;      // 0x02: B, 0x01: A
  sequenceId: number;    // 0-255
  modulation: number;    // 0x00: OOK, 0x01: MANCHESTER
  payloadLength: number; // 2 bytes (0-65535)
}

export interface LiFiFrame {
  preamble: number[];    // [0xAA] -> 8 bits
  sof: number[];         // [0x7E] -> 8 bits
  header: ProtocolHeader;
  headerBytes: Uint8Array;
  payloadBytes: Uint8Array;
  crc16: number;         // 16-bit uint
  eof: number[];         // [0x7F] -> 8 bits
  rawFrameBytes: Uint8Array;
  rawBits: number[];     // Serialized bitstream
}

export interface SignalSample {
  timeMs: number;
  bitIndex: number;
  txBit: number;             // Digital bit (0 or 1)
  txVoltage: number;         // Electrical logic level (0V or 3.3V)
  txOpticalPower: number;    // Normalized optical power (0.0 to 1.0)
  rxOpticalPower: number;    // Attenuated + noisy light at photodetector
  rxThreshold: number;       // Photodetector comparator threshold
  rxVoltage: number;         // Recovered electrical logic level (0V or 3.3V)
  rxBit: number;             // Recovered bit (0 or 1)
}

export interface DecodedResult {
  success: boolean;
  text: string;
  recoveredBytes: Uint8Array;
  expectedCrc: number;
  computedCrc: number;
  errorReason?: string;
  bitErrors: number;
  status: MessageStatus;
}

export interface TransmittedMessage {
  id: string;
  sender: DeviceId;
  receiver: DeviceId;
  timestamp: number;
  text: string;
  frame: LiFiFrame;
  symbols: number[];           // Modulated symbol stream
  samples: SignalSample[];     // Recorded waveform samples
  result?: DecodedResult;
  status: MessageStatus;
  progress: number;            // 0 to 1
  bitDurationMs: number;
  modulation: ModulationType;
}

export interface ChannelConfig {
  enabled: boolean;            // Optical path unobstructed
  distanceMeters: number;      // Distance between devices (0.5m - 10m)
  attenuationFactor: number;   // Geometric / atmospheric loss factor
  ambientLight: number;        // Ambient background optical lux/offset (0.0 - 0.5)
  noiseLevel: number;          // Gaussian noise standard deviation (0.0 - 0.3)
  receiverSensitivity: number; // Photodetector threshold voltage/level
  propagationDelayMs: number;  // Light propagation / buffer delay (ms)
  bitDurationMs: number;       // Symbol/bit period in ms (10ms - 200ms)
  modulation: ModulationType;  // OOK or Manchester
  errorInjection: boolean;     // Controlled bit-flip error injection
  errorBitPosition?: number;   // Specific bit to flip (optional)
  deterministicSeed?: number;  // Fixed PRNG seed for reproducible test results
}

export interface SimulationStats {
  totalTransmitted: number;
  transmittedA: number;
  transmittedB: number;
  totalReceivedSuccess: number;
  receivedA: number;
  receivedB: number;
  corruptedFrames: number;
  blockedTransmissions: number;
  totalBitsTransmitted: number;
  bitErrorCount: number;
  bitErrorRate: number;        // BER = bitErrorCount / totalBits
  packetSuccessRate: number;   // PSR %
  currentBitRateBps: number;   // 1000 / bitDurationMs
  averageLatencyMs: number;    // Latency
}
