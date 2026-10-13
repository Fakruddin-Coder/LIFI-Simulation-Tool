import React, { useRef, useEffect, useState } from 'react';
import type { SignalSample, TransmittedMessage } from '../types/simulation';

interface SignalWaveformProps {
  message?: TransmittedMessage;
  liveSamples?: SignalSample[];
}

export const SignalWaveform: React.FC<SignalWaveformProps> = ({
  message,
  liveSamples,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Use live samples if transmitting, otherwise use completed message samples
  const samples = (liveSamples && liveSamples.length > 0) 
    ? liveSamples 
    : (message?.samples || []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth || 800;
    const height = 300;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (samples.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No optical signal data recorded yet. Send a message to capture waveforms.', width / 2, height / 2);
      return;
    }

    const paddingLeft = 50;
    const paddingRight = 20;
    const plotWidth = width - paddingLeft - paddingRight;
    const totalSamples = samples.length;
    const stepX = Math.max(8, plotWidth / totalSamples);

    // 4 Tracks:
    // Track 1: TX Logic Level (0V - 3.3V)
    // Track 2: TX Optical Power (0.0 - 1.0)
    // Track 3: RX Optical Power & Threshold (Noisy Light + Comparator)
    // Track 4: RX Logic Level (0V - 3.3V)
    const trackHeight = 52;
    const gap = 14;
    const track1Y = 30;
    const track2Y = track1Y + trackHeight + gap;
    const track3Y = track2Y + trackHeight + gap;
    const track4Y = track3Y + trackHeight + gap;

    // Helper to draw horizontal baseline & grid
    const drawTrackBase = (y: number, label: string, color: string) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + plotWidth, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y + trackHeight);
      ctx.lineTo(paddingLeft + plotWidth, y + trackHeight);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(label, paddingLeft - 8, y + trackHeight / 2 + 3);
    };

    drawTrackBase(track1Y, 'TX 3.3V', '#38bdf8');
    drawTrackBase(track2Y, 'TX Light', '#a855f7');
    drawTrackBase(track3Y, 'RX Light', '#fbbf24');
    drawTrackBase(track4Y, 'RX 3.3V', '#10b981');

    // 1. Draw TX Logic (Track 1)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < totalSamples; i++) {
      const s = samples[i];
      const x = paddingLeft + i * stepX;
      const nextX = x + stepX;
      const yVal = s.txBit === 1 ? track1Y + 6 : track1Y + trackHeight - 4;

      if (i === 0) {
        ctx.moveTo(x, yVal);
      } else {
        ctx.lineTo(x, yVal);
      }
      ctx.lineTo(nextX, yVal);
    }
    ctx.stroke();

    // 2. Draw TX Optical Power (Track 2)
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < totalSamples; i++) {
      const s = samples[i];
      const x = paddingLeft + i * stepX;
      const nextX = x + stepX;
      const yVal = track2Y + trackHeight - (s.txOpticalPower * (trackHeight - 10)) - 5;

      if (i === 0) {
        ctx.moveTo(x, yVal);
      } else {
        ctx.lineTo(x, yVal);
      }
      ctx.lineTo(nextX, yVal);
    }
    ctx.stroke();

    // 3. Draw RX Optical Power (Track 3) - Analog wave with noise
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < totalSamples; i++) {
      const s = samples[i];
      const x = paddingLeft + i * stepX + stepX / 2;
      const normalizedP = Math.min(1.4, Math.max(0, s.rxOpticalPower));
      const yVal = track3Y + trackHeight - (normalizedP * (trackHeight - 12)) - 6;

      if (i === 0) {
        ctx.moveTo(x, yVal);
      } else {
        ctx.lineTo(x, yVal);
      }
    }
    ctx.stroke();

    // Draw Comparator Threshold Line on Track 3
    if (samples.length > 0) {
      const thresholdVal = samples[0].rxThreshold;
      const threshY = track3Y + trackHeight - (thresholdVal * (trackHeight - 12)) - 6;
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, threshY);
      ctx.lineTo(paddingLeft + plotWidth, threshY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Vth: ${thresholdVal.toFixed(2)}`, paddingLeft + plotWidth - 55, threshY - 3);
    }

    // 4. Draw RX Logic Level (Track 4)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < totalSamples; i++) {
      const s = samples[i];
      const x = paddingLeft + i * stepX;
      const nextX = x + stepX;
      const yVal = s.rxBit === 1 ? track4Y + 6 : track4Y + trackHeight - 4;

      if (i === 0) {
        ctx.moveTo(x, yVal);
      } else {
        ctx.lineTo(x, yVal);
      }
      ctx.lineTo(nextX, yVal);
    }
    ctx.stroke();

    // Bit labels along the top axis
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < totalSamples; i++) {
      const s = samples[i];
      const x = paddingLeft + i * stepX + stepX / 2;

      // Draw bit value
      ctx.fillStyle = s.txBit === 1 ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(s.txBit.toString(), x, 18);

      // Vertical tick
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, height - 10);
      ctx.stroke();
    }

    // Draw hover indicator if mouse is over a sample
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < totalSamples) {
      const hx = paddingLeft + hoverIndex * stepX + stepX / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [samples, hoverIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 50;
    const paddingRight = 20;
    const plotWidth = canvas.clientWidth - paddingLeft - paddingRight;
    const stepX = Math.max(8, plotWidth / samples.length);

    if (x >= paddingLeft && x <= paddingLeft + plotWidth) {
      const idx = Math.floor((x - paddingLeft) / stepX);
      if (idx >= 0 && idx < samples.length) {
        setHoverIndex(idx);
        return;
      }
    }
    setHoverIndex(null);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeSample = hoverIndex !== null && samples[hoverIndex] ? samples[hoverIndex] : null;

  return (
    <div className="lifi-card" ref={containerRef}>
      <div className="card-header">
        <div className="card-title">
          <span>Digital & Optical Oscilloscope (Waveforms)</span>
          {message && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
              [{message.sender} → {message.receiver} | {samples.length} Symbols]
            </span>
          )}
        </div>

        {activeSample && (
          <div style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            background: 'var(--bg-secondary)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            color: 'var(--cyan-400)'
          }}>
            Bit #{activeSample.bitIndex} | TX: {activeSample.txBit} ({activeSample.txVoltage}V) | 
            RX Light: {activeSample.rxOpticalPower} | RX: {activeSample.rxBit}
          </div>
        )}
      </div>

      <div className="waveform-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#38bdf8' }} />
          <span>TX Electrical (3.3V)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#a855f7' }} />
          <span>TX Optical Flux (P_tx)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#fbbf24' }} />
          <span>RX Optical Power + Noise (P_rx)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f43f5e' }} />
          <span>Vth Comparator Threshold</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#10b981' }} />
          <span>Recovered RX Electrical (3.3V)</span>
        </div>
      </div>

      <div className="waveform-container" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ width: '100%', height: '300px', cursor: 'crosshair', display: 'block' }}
        />
      </div>
    </div>
  );
};
