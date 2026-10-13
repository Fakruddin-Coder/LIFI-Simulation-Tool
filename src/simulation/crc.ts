/**
 * CRC-16-CCITT (Polynomial 0x1021, Initial 0xFFFF)
 * Standard error detection for optical frames.
 */

export function computeCRC16(data: Uint8Array): number {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= (data[i] << 8);
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc;
}

export function verifyCRC16(data: Uint8Array, expectedCrc: number): boolean {
  const calculated = computeCRC16(data);
  return calculated === expectedCrc;
}

export function formatHex16(val: number): string {
  return '0x' + (val & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function formatHex8(val: number): string {
  return '0x' + (val & 0xFF).toString(16).toUpperCase().padStart(2, '0');
}
