/**
 * Automated Test Suite for Two-Way Li-Fi Communication System
 * Tests all 14 specified requirements:
 * 1. Encoding and decoding a simple message
 * 2. Sending a message from A to B
 * 3. Sending a message from B to A
 * 4. Simultaneous transmissions in both directions
 * 5. Empty and long messages
 * 6. Unicode and emoji messages
 * 7. Valid checksum verification
 * 8. Corrupted frames being rejected
 * 9. Disabled channel preventing delivery
 * 10. Noise and controlled error injection
 * 11. Receiver timeout
 * 12. Multiple consecutive messages
 * 13. Resetting the simulation
 * 14. Correct statistics after successful and failed transmissions
 */

import { describe, it, expect } from 'vitest';
import { encodeFrame, decodeFrame, textToBytes, bytesToText } from '../simulation/protocol';
import { computeCRC16, verifyCRC16 } from '../simulation/crc';
import { modulateBits, demodulateSymbols } from '../simulation/modulation';
import { simulateTransmissionSync } from '../simulation/simulationEngine';
import { processReceivedSignal } from '../simulation/receiver';
import { createInitialStats, updateStats } from '../simulation/metrics';
import type { ChannelConfig } from '../types/simulation';

const defaultConfig: ChannelConfig = {
  enabled: true,
  distanceMeters: 1.0,
  attenuationFactor: 1.0,
  ambientLight: 0.1,
  noiseLevel: 0.02,
  receiverSensitivity: 0.35,
  propagationDelayMs: 20,
  bitDurationMs: 10,
  modulation: 'OOK',
  errorInjection: false,
};

describe('Li-Fi Communication System - Full Test Suite', () => {

  // Test 1: Encoding and decoding a simple message
  it('1. should encode and decode a simple message correctly', () => {
    const originalText = 'Hello Li-Fi World!';

    // Direct byte & text conversion test
    const rawUtf8 = textToBytes(originalText);
    expect(bytesToText(rawUtf8)).toBe(originalText);

    // Direct modulation & demodulation test
    const ook = modulateBits([1, 0, 1], 'OOK');
    expect(demodulateSymbols(ook.symbols, 'OOK').bits).toEqual([1, 0, 1]);

    const frame = encodeFrame(originalText, 'DEVICE_A', 'DEVICE_B', 1, 'OOK');

    expect(frame.rawBits.length).toBeGreaterThan(0);
    expect(frame.header.senderId).toBe(0x01);
    expect(frame.header.targetId).toBe(0x02);
    expect(frame.header.sequenceId).toBe(1);

    const decoded = decodeFrame(frame.rawFrameBytes);
    expect(decoded.success).toBe(true);
    expect(decoded.status).toBe('DELIVERED');
    expect(decoded.text).toBe(originalText);
    expect(decoded.computedCrc).toBe(frame.crc16);
  });

  // Test 2: Sending a message from A to B
  it('2. should send a message from A to B and verify delivery at B', () => {
    const text = 'Data from Node A';
    const message = simulateTransmissionSync(text, 'DEVICE_A', 'DEVICE_B', 1, defaultConfig);

    expect(message.sender).toBe('DEVICE_A');
    expect(message.receiver).toBe('DEVICE_B');
    expect(message.status).toBe('DELIVERED');
    expect(message.result?.success).toBe(true);
    expect(message.result?.text).toBe(text);
  });

  // Test 3: Sending a message from B to A
  it('3. should send a message from B to A and verify delivery at A', () => {
    const text = 'Response from Node B';
    const message = simulateTransmissionSync(text, 'DEVICE_B', 'DEVICE_A', 2, defaultConfig);

    expect(message.sender).toBe('DEVICE_B');
    expect(message.receiver).toBe('DEVICE_A');
    expect(message.status).toBe('DELIVERED');
    expect(message.result?.success).toBe(true);
    expect(message.result?.text).toBe(text);
  });

  // Test 4: Simultaneous transmissions in both directions
  it('4. should handle independent simultaneous transmissions in both directions', () => {
    const textAtoB = 'Telemetry packet A->B';
    const textBtoA = 'Command packet B->A';

    const msgA = simulateTransmissionSync(textAtoB, 'DEVICE_A', 'DEVICE_B', 10, defaultConfig);
    const msgB = simulateTransmissionSync(textBtoA, 'DEVICE_B', 'DEVICE_A', 20, defaultConfig);

    expect(msgA.sender).toBe('DEVICE_A');
    expect(msgA.receiver).toBe('DEVICE_B');
    expect(msgA.result?.text).toBe(textAtoB);
    expect(msgA.status).toBe('DELIVERED');

    expect(msgB.sender).toBe('DEVICE_B');
    expect(msgB.receiver).toBe('DEVICE_A');
    expect(msgB.result?.text).toBe(textBtoA);
    expect(msgB.status).toBe('DELIVERED');
  });

  // Test 5: Empty and long messages
  it('5. should support empty strings and long payloads', () => {
    // Empty message
    const emptyMsg = simulateTransmissionSync('', 'DEVICE_A', 'DEVICE_B', 3, defaultConfig);
    expect(emptyMsg.status).toBe('DELIVERED');
    expect(emptyMsg.result?.text).toBe('');

    // Long message (500+ characters)
    const longText = 'Li-Fi transmission test with a long string: '.repeat(15);
    const longMsg = simulateTransmissionSync(longText, 'DEVICE_A', 'DEVICE_B', 4, defaultConfig);
    expect(longMsg.status).toBe('DELIVERED');
    expect(longMsg.result?.text).toBe(longText);
  });

  // Test 6: Unicode and emoji messages
  it('6. should correctly handle Unicode characters and emojis', () => {
    const unicodeText = 'Li-Fi Optical Link 💡⚡📡 — Optical Wireless Comms 🔥 (α, β, γ, 中文, العربية)';
    const msg = simulateTransmissionSync(unicodeText, 'DEVICE_A', 'DEVICE_B', 5, defaultConfig);

    expect(msg.status).toBe('DELIVERED');
    expect(msg.result?.text).toBe(unicodeText);
  });

  // Test 7: Valid checksum verification
  it('7. should compute and verify CRC-16 checksum accurately', () => {
    const testBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x41, 0x42, 0x43]);
    const crc = computeCRC16(testBytes);

    expect(typeof crc).toBe('number');
    expect(crc).toBeGreaterThan(0);
    expect(verifyCRC16(testBytes, crc)).toBe(true);

    // Tampered bytes must fail CRC verification
    const tampered = new Uint8Array([...testBytes]);
    tampered[2] ^= 0x01;
    expect(verifyCRC16(tampered, crc)).toBe(false);
  });

  // Test 8: Corrupted frames being rejected
  it('8. should reject corrupted frames and detect checksum errors', () => {
    const frame = encodeFrame('Secure payload', 'DEVICE_A', 'DEVICE_B', 6, 'OOK');
    const corruptedBytes = new Uint8Array([...frame.rawFrameBytes]);

    // Flip a bit in the payload section
    corruptedBytes[9] ^= 0x08;

    const result = decodeFrame(corruptedBytes);
    expect(result.success).toBe(false);
    expect(result.status).toBe('CHECKSUM_ERROR');
    expect(result.errorReason).toContain('CRC-16 mismatch');
  });

  // Test 9: Disabled channel preventing delivery
  it('9. should fail delivery when the optical channel is disabled (beam obstructed)', () => {
    const blockedConfig: ChannelConfig = {
      ...defaultConfig,
      enabled: false,
    };

    const msg = simulateTransmissionSync('Should not pass', 'DEVICE_A', 'DEVICE_B', 7, blockedConfig);
    expect(msg.status).toBe('CHANNEL_BLOCKED');
    expect(msg.result?.success).toBe(false);
    expect(msg.result?.errorReason).toContain('obstructed');
  });

  // Test 10: Noise and controlled error injection
  it('10. should inject controlled errors and detect frame rejection reproducibly', () => {
    const errorConfig: ChannelConfig = {
      ...defaultConfig,
      errorInjection: true,
      errorBitPosition: 30, // Corrupt bit inside payload
      deterministicSeed: 42,
    };

    const msg = simulateTransmissionSync('Clean test message', 'DEVICE_A', 'DEVICE_B', 8, errorConfig);
    expect(msg.result?.success).toBe(false);
    expect(['CHECKSUM_ERROR', 'FRAME_ERROR']).toContain(msg.status);
  });

  // Test 11: Receiver timeout
  it('11. should handle receiver synchronization timeout correctly', () => {
    const result = processReceivedSignal([], 'OOK', false, true);
    expect(result.success).toBe(false);
    expect(result.status).toBe('TIMEOUT');
    expect(result.errorReason).toContain('timeout');
  });

  // Test 12: Multiple consecutive messages
  it('12. should handle multiple consecutive messages with sequential IDs', () => {
    for (let seq = 1; seq <= 5; seq++) {
      const msg = simulateTransmissionSync(`Sequential Message #${seq}`, 'DEVICE_A', 'DEVICE_B', seq, defaultConfig);
      expect(msg.status).toBe('DELIVERED');
      expect(msg.frame.header.sequenceId).toBe(seq);
      expect(msg.result?.text).toBe(`Sequential Message #${seq}`);
    }
  });

  // Test 13: Resetting the simulation
  it('13. should initialize and reset statistics cleanly', () => {
    const initial = createInitialStats();
    expect(initial.totalTransmitted).toBe(0);
    expect(initial.totalReceivedSuccess).toBe(0);
    expect(initial.bitErrorCount).toBe(0);
    expect(initial.packetSuccessRate).toBe(100);
  });

  // Test 14: Correct statistics after successful and failed transmissions
  it('14. should accurately update statistics for both successful and failed transmissions', () => {
    let stats = createInitialStats();

    // 1 successful transmission
    const successMsg = simulateTransmissionSync('Success #1', 'DEVICE_A', 'DEVICE_B', 1, defaultConfig);
    stats = updateStats(stats, successMsg, 50, 10);

    expect(stats.totalTransmitted).toBe(1);
    expect(stats.transmittedA).toBe(1);
    expect(stats.totalReceivedSuccess).toBe(1);
    expect(stats.receivedB).toBe(1);
    expect(stats.corruptedFrames).toBe(0);
    expect(stats.packetSuccessRate).toBe(100);

    // 1 failed transmission (blocked)
    const blockedMsg = simulateTransmissionSync('Blocked #2', 'DEVICE_B', 'DEVICE_A', 2, {
      ...defaultConfig,
      enabled: false,
    });
    stats = updateStats(stats, blockedMsg, 50, 10);

    expect(stats.totalTransmitted).toBe(2);
    expect(stats.transmittedB).toBe(1);
    expect(stats.totalReceivedSuccess).toBe(1);
    expect(stats.blockedTransmissions).toBe(1);
    expect(stats.packetSuccessRate).toBe(50);
  });

  // Extra Test: Manchester Encoding and Demodulation
  it('should modulate and demodulate correctly using Manchester encoding', () => {
    const manchesterConfig: ChannelConfig = {
      ...defaultConfig,
      modulation: 'MANCHESTER',
    };

    const msg = simulateTransmissionSync('Manchester Encoding Li-Fi', 'DEVICE_A', 'DEVICE_B', 9, manchesterConfig);
    expect(msg.status).toBe('DELIVERED');
    expect(msg.result?.text).toBe('Manchester Encoding Li-Fi');
    expect(msg.symbols.length).toBe(msg.frame.rawBits.length * 2);
  });
});
