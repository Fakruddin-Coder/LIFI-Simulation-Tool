import React, { useEffect, useRef } from 'react';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import type { ChannelConfig } from '../types/simulation';
import { calculateOpticalPathLoss } from '../simulation/opticalChannel';

interface OpticalLinkProps {
  config: ChannelConfig;
  isTransmittingA: boolean;
  isTransmittingB: boolean;
  ledOnA: boolean;
  ledOnB: boolean;
  currentRxBitA: number;
  currentRxBitB: number;
  progressA: number;
  progressB: number;
  onToggleObstruction: () => void;
}

export const OpticalLink: React.FC<OpticalLinkProps> = ({
  config,
  isTransmittingA,
  isTransmittingB,
  ledOnA,
  ledOnB,
  currentRxBitA,
  currentRxBitB,
  progressA,
  progressB,
  onToggleObstruction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pathLoss = calculateOpticalPathLoss(config.distanceMeters, config.attenuationFactor);
  const pathLossPercent = (pathLoss * 100).toFixed(1);

  // Canvas animation loop for optical rays and photon particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffsetA = 0;
    let particleOffsetB = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const yBeamA = height * 0.35; // Top beam: A -> B
      const yBeamB = height * 0.65; // Bottom beam: B -> A
      const startX = 60;
      const endX = width - 60;
      const midX = width / 2;

      // 1. Draw Channel Grid / Spatial Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, height / 2);
      ctx.lineTo(endX, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Beam A -> B (Top Beam)
      if (config.enabled) {
        // Base optical beam glow
        const gradientA = ctx.createLinearGradient(startX, yBeamA, endX, yBeamA);
        const alphaA = isTransmittingA ? (ledOnA ? 0.8 : 0.15) : 0.08;
        gradientA.addColorStop(0, `rgba(56, 189, 248, ${alphaA})`);
        gradientA.addColorStop(1, `rgba(56, 189, 248, ${alphaA * 0.6})`);

        ctx.strokeStyle = gradientA;
        ctx.lineWidth = isTransmittingA && ledOnA ? 6 : 2;
        ctx.beginPath();
        ctx.moveTo(startX, yBeamA);
        ctx.lineTo(endX, yBeamA);
        ctx.stroke();

        // Photons traveling A -> B
        if (isTransmittingA) {
          particleOffsetA = (particleOffsetA + 3) % 40;
          for (let x = startX + particleOffsetA; x < endX; x += 40) {
            ctx.fillStyle = ledOnA ? '#ffffff' : 'rgba(56, 189, 248, 0.4)';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = ledOnA ? 10 : 2;
            ctx.beginPath();
            ctx.arc(x, yBeamA, ledOnA ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else {
        // Obstructed A -> B beam blocked halfway
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, yBeamA);
        ctx.lineTo(midX - 20, yBeamA);
        ctx.stroke();
      }

      // 3. Beam B -> A (Bottom Beam)
      if (config.enabled) {
        const gradientB = ctx.createLinearGradient(endX, yBeamB, startX, yBeamB);
        const alphaB = isTransmittingB ? (ledOnB ? 0.8 : 0.15) : 0.08;
        gradientB.addColorStop(0, `rgba(251, 191, 36, ${alphaB})`);
        gradientB.addColorStop(1, `rgba(251, 191, 36, ${alphaB * 0.6})`);

        ctx.strokeStyle = gradientB;
        ctx.lineWidth = isTransmittingB && ledOnB ? 6 : 2;
        ctx.beginPath();
        ctx.moveTo(endX, yBeamB);
        ctx.lineTo(startX, yBeamB);
        ctx.stroke();

        // Photons traveling B -> A
        if (isTransmittingB) {
          particleOffsetB = (particleOffsetB + 3) % 40;
          for (let x = endX - particleOffsetB; x > startX; x -= 40) {
            ctx.fillStyle = ledOnB ? '#ffffff' : 'rgba(251, 191, 36, 0.4)';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = ledOnB ? 10 : 2;
            ctx.beginPath();
            ctx.arc(x, yBeamB, ledOnB ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else {
        // Obstructed B -> A beam blocked halfway
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(endX, yBeamB);
        ctx.lineTo(midX + 20, yBeamB);
        ctx.stroke();
      }

      // 4. Physical Obstacle in center if channel is blocked
      if (!config.enabled) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.fillRect(midX - 16, height * 0.2, 32, height * 0.6);
        ctx.strokeRect(midX - 16, height * 0.2, 32, height * 0.6);

        // Caution diagonal stripes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let dy = height * 0.25; dy < height * 0.8; dy += 12) {
          ctx.beginPath();
          ctx.moveTo(midX - 14, dy);
          ctx.lineTo(midX + 14, dy + 8);
          ctx.stroke();
        }
      }

      // 5. Transceiver Terminals (Nodes at ends)
      // Node A TX LED Terminal (Top Left)
      ctx.fillStyle = ledOnA ? '#38bdf8' : '#334155';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = ledOnA ? 16 : 0;
      ctx.beginPath();
      ctx.arc(startX, yBeamA, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Node A RX Photodiode Terminal (Bottom Left)
      ctx.fillStyle = currentRxBitA === 1 ? '#10b981' : '#334155';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = currentRxBitA === 1 ? 14 : 0;
      ctx.fillRect(startX - 7, yBeamB - 7, 14, 14);
      ctx.shadowBlur = 0;

      // Node B RX Photodiode Terminal (Top Right)
      ctx.fillStyle = currentRxBitB === 1 ? '#10b981' : '#334155';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = currentRxBitB === 1 ? 14 : 0;
      ctx.fillRect(endX - 7, yBeamA - 7, 14, 14);
      ctx.shadowBlur = 0;

      // Node B TX LED Terminal (Bottom Right)
      ctx.fillStyle = ledOnB ? '#fbbf24' : '#334155';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = ledOnB ? 16 : 0;
      ctx.beginPath();
      ctx.arc(endX, yBeamB, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [config.enabled, isTransmittingA, isTransmittingB, ledOnA, ledOnB, currentRxBitA, currentRxBitB]);

  return (
    <div className="lifi-card optical-link-card">
      <div className="card-header">
        <div className="card-title">
          <span>Free-Space Optical Channel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className={`btn-outline ${!config.enabled ? 'badge-blocked' : ''}`}
            onClick={onToggleObstruction}
            title={config.enabled ? 'Click to obstruct optical path' : 'Click to clear optical path'}
          >
            {config.enabled ? 'Obstruct Beam' : 'Clear Path'}
          </button>
        </div>
      </div>

      <div className="optical-stage-canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          style={{ width: '100%', height: '100%' }}
        />

        {!config.enabled && (
          <div className="optical-obstacle-banner">
            <ShieldAlert size={16} />
            <span>OPTICAL BEAM INTERRUPTED (LINE-OF-SIGHT BLOCKED)</span>
          </div>
        )}

        {/* Direction labels on canvas */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '70px',
          fontSize: '0.75rem',
          color: 'var(--cyan-400)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          <span>Device A TX → Device B RX {isTransmittingA ? `(${Math.round(progressA * 100)}%)` : ''}</span>
          <ArrowRight size={12} />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '70px',
          fontSize: '0.75rem',
          color: 'var(--amber-400)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          <ArrowLeft size={12} />
          <span>Device B TX → Device A RX {isTransmittingB ? `(${Math.round(progressB * 100)}%)` : ''}</span>
        </div>

        {/* Center telemetry pill */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-color)',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Distance: {config.distanceMeters.toFixed(1)}m | Path Loss: {pathLossPercent}%
          </span>
          <span>Optical Delay: {config.propagationDelayMs}ms</span>
        </div>
      </div>
    </div>
  );
};
