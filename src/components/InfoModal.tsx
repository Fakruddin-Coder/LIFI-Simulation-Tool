import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <BookOpen size={20} color="var(--cyan-400)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Li-Fi Communication System — Engineering Reference & Faculty Guide
            </h2>
          </div>
          <button className="btn-icon modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
          {/* Section 1: Overview */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan-400)', marginBottom: '0.375rem' }}>
              1. What is Li-Fi (Light Fidelity)?
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Li-Fi is a high-speed, bidirectional Optical Wireless Communication (OWC) technology that utilizes 
              the visible light spectrum (400 THz – 800 THz) rather than traditional radio frequency (RF) bands. 
              Data is transmitted by modulating the luminous intensity of Light Emitting Diodes (LEDs) at rapid rates 
              imperceptible to the human eye, and detected by a photodiode or phototransistor on the receiver device.
            </p>
          </div>

          {/* Section 2: End-to-End Pipeline */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan-400)', marginBottom: '0.375rem' }}>
              2. Implemented Communication Pipeline
            </h3>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>User Text Input:</strong> Accepts user-specified strings, including Unicode and emoji.</li>
              <li><strong>UTF-8 Serialization:</strong> Encoded into standard UTF-8 raw byte sequences.</li>
              <li><strong>Binary Bit Extraction:</strong> Each byte is mapped to 8 digital bits (MSB first).</li>
              <li><strong>Frame Encapsulation:</strong> Packaged with Preamble (0xAA), SOF (0x7E), Header (6B), CRC-16 (2B), and EOF (0x7F).</li>
              <li><strong>Digital Modulation:</strong> Modulated into optical symbols via On-Off Keying (OOK) or Manchester encoding.</li>
              <li><strong>Simulated LED Emission:</strong> Modulated optical flux emitted with high/low photon states.</li>
              <li><strong>Free-Space Propagation:</strong> Modeled with distance attenuation (inverse-square-like path loss) and propagation delay.</li>
              <li><strong>Optical Noise & Interference:</strong> Ambient room lighting DC floor and Gaussian noise (AWGN) added.</li>
              <li><strong>Photodetector Current Conversion:</strong> Light received by PIN photodiode converted to analog voltage.</li>
              <li><strong>Threshold Comparator:</strong> Analog voltage compared against Vth threshold to reconstruct digital symbols.</li>
              <li><strong>Demodulation & Frame Parsing:</strong> Recovers digital bitstream, searches for synchronization flags, and parses payload.</li>
              <li><strong>CRC-16 Error Verification:</strong> Recomputes CRC over header+payload; detects corrupted bits or rejects malformed frames.</li>
              <li><strong>UTF-8 Deserialization:</strong> Valid payload bytes converted back into original text and rendered at destination device.</li>
            </ol>
          </div>

          {/* Section 3: Why Manchester Encoding */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan-400)', marginBottom: '0.375rem' }}>
              3. Modulation Modes: OOK vs Manchester (IEEE 802.15.7)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>On-Off Keying (OOK)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Direct intensity modulation: Bit 1 = LED ON (100% light), Bit 0 = LED OFF (0% light). 
                  Simple to implement, but consecutive zeros or ones cause DC bias drift and visible optical flicker at low speeds.
                </p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Manchester Encoding</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Standard optical line coding (IEEE 802.15.7): Bit 0 = [0, 1] transition, Bit 1 = [1, 0] transition. 
                  Guarantees a 50% average optical duty cycle (completely eliminating visible flicker) and provides self-clocking synchronization transitions on every bit.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Software Simulation vs Physical Hardware */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan-400)', marginBottom: '0.375rem' }}>
              4. Software Simulation vs Physical Hardware Implementation
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              In physical hardware, Li-Fi uses high-speed MOSFET drivers switching power LEDs at MHz frequencies, 
              optical lenses, transimpedance amplifiers (TIA), and hardware comparator ICs. 
              This software implementation models the exact deterministic mathematical and physical principles of 
              path loss, noise addition, comparator thresholding, frame validation, and bidirectional asynchronous communication 
              directly within the browser environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
