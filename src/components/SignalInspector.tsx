import React, { useState } from 'react';
import { 
  Layers, 
  Binary, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import type { TransmittedMessage } from '../types/simulation';
import { formatHex8, formatHex16 } from '../simulation/crc';

interface SignalInspectorProps {
  message?: TransmittedMessage;
}

export const SignalInspector: React.FC<SignalInspectorProps> = ({ message }) => {
  const [showFullBytes, setShowFullBytes] = useState(false);

  if (!message) {
    return (
      <div className="lifi-card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} />
            <span>Protocol & Signal Inspector</span>
          </div>
        </div>
        <div className="empty-state">
          <Binary size={28} style={{ opacity: 0.5 }} />
          <span>No packet selected for inspection. Click "Inspect Signal" on any message in history.</span>
        </div>
      </div>
    );
  }

  const { frame, result, symbols, modulation, status } = message;
  const isSuccess = result?.success ?? false;
  const crcMatch = result ? (result.expectedCrc === result.computedCrc && isSuccess) : false;

  // Format bytes for inspection
  const rawBytes = Array.from(frame.rawFrameBytes);
  const payloadBytes = Array.from(frame.payloadBytes);

  return (
    <div className="lifi-card">
      <div className="card-header">
        <div className="card-title">
          <Layers size={18} />
          <span>Protocol Frame & Signal Inspector</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Packet ID: {message.id}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`status-pill status-${status}`}>
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Frame Structure Blocks */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Encapsulated Frame Architecture (IEEE 802.15.7 Li-Fi Protocol)
        </div>

        <div className="frame-breakdown-grid">
          {/* Preamble */}
          <div className="frame-block">
            <span className="frame-block-label">Preamble (1B)</span>
            <span className="frame-block-val">0xAA</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>10101010b Clock</span>
          </div>

          {/* Start of Frame */}
          <div className="frame-block">
            <span className="frame-block-label">SOF Delimiter (1B)</span>
            <span className="frame-block-val">0x7E</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>01111110b Sync</span>
          </div>

          {/* Header */}
          <div className="frame-block">
            <span className="frame-block-label">Header (6B)</span>
            <span className="frame-block-val">
              Src:{formatHex8(frame.header.senderId)} Dst:{formatHex8(frame.header.targetId)}
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              Seq #{frame.header.sequenceId} | {modulation}
            </span>
          </div>

          {/* Payload Length */}
          <div className="frame-block">
            <span className="frame-block-label">Length (2B)</span>
            <span className="frame-block-val">{frame.header.payloadLength} Bytes</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              UTF-8 Encoded
            </span>
          </div>

          {/* CRC-16 */}
          <div className="frame-block" style={{
            borderColor: crcMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
          }}>
            <span className="frame-block-label">CRC-16 CCITT (2B)</span>
            <span className="frame-block-val" style={{
              color: crcMatch ? 'var(--emerald-400)' : 'var(--rose-400)'
            }}>
              {formatHex16(frame.crc16)}
            </span>
            <span style={{ fontSize: '0.625rem', color: crcMatch ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
              {crcMatch ? 'Checksum OK' : 'CRC Mismatch'}
            </span>
          </div>

          {/* End of Frame */}
          <div className="frame-block">
            <span className="frame-block-label">EOF Delimiter (1B)</span>
            <span className="frame-block-val">0x7F</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>01111111b Boundary</span>
          </div>
        </div>
      </div>

      {/* Payload Comparison: Transmitted vs Decoded */}
      <div style={{
        marginTop: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.75rem'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem'
        }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--cyan-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Transmitted Payload (Sender: {message.sender})
          </div>
          <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
            "{message.text}"
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {payloadBytes.length} UTF-8 bytes | {frame.rawBits.length} frame bits | {symbols.length} modulated optical symbols
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem'
        }}>
          <div style={{ 
            fontSize: '0.6875rem', 
            fontWeight: 700, 
            color: isSuccess ? 'var(--emerald-400)' : 'var(--rose-400)', 
            textTransform: 'uppercase', 
            marginBottom: '0.25rem' 
          }}>
            Decoded Payload (Receiver: {message.receiver})
          </div>
          <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
            {result?.text ? `"${result.text}"` : (
              <span style={{ color: 'var(--rose-400)', fontStyle: 'italic' }}>
                [Decoding Failed: {result?.errorReason || 'Signal corrupted'}]
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Verification: {crcMatch ? 'Valid Frame Integrity' : 'Integrity Check Failed'}
          </div>
        </div>
      </div>

      {/* Hex Dump of Raw Bytes */}
      <div style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setShowFullBytes(!showFullBytes)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}
        >
          {showFullBytes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Detailed Hex Dump & Bitstream View ({rawBytes.length} Frame Bytes)</span>
        </button>

        {showFullBytes && (
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {rawBytes.map((b, idx) => (
                <div key={idx} style={{
                  padding: '2px 4px',
                  borderRadius: '3px',
                  background: idx === 0 ? 'rgba(56, 189, 248, 0.2)' :
                              idx === 1 ? 'rgba(168, 85, 247, 0.2)' :
                              idx < 8 ? 'rgba(245, 158, 11, 0.2)' :
                              idx < rawBytes.length - 3 ? 'rgba(16, 185, 129, 0.15)' :
                              idx < rawBytes.length - 1 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatHex8(b)}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    {b.toString(2).padStart(8, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
