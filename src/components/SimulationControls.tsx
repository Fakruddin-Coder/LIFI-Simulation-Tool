import React from 'react';
import { 
  Sliders, 
  Zap, 
  ShieldAlert, 
  Bug, 
  Trash2, 
  RotateCcw
} from 'lucide-react';
import type { ChannelConfig, ModulationType } from '../types/simulation';

interface SimulationControlsProps {
  config: ChannelConfig;
  onChangeConfig: (newConfig: Partial<ChannelConfig>) => void;
  onSimultaneousSend: () => void;
  onClearHistory: () => void;
  onReset: () => void;
  isTransmittingA: boolean;
  isTransmittingB: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  onChangeConfig,
  onSimultaneousSend,
  onClearHistory,
  onReset,
  isTransmittingA,
  isTransmittingB,
}) => {
  const isTransmittingAny = isTransmittingA || isTransmittingB;

  const handleSpeedPreset = (ms: number) => {
    onChangeConfig({ bitDurationMs: ms });
  };

  const handleModulationChange = (mod: ModulationType) => {
    onChangeConfig({ modulation: mod });
  };

  return (
    <div className="lifi-card">
      <div className="card-header">
        <div className="card-title">
          <Sliders size={18} />
          <span>Interactive Simulation & Physical Channel Controls</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Simultaneous Send Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={onSimultaneousSend}
            disabled={isTransmittingAny}
            title="Transmit messages simultaneously from Device A and Device B to demonstrate bidirectional concurrency"
          >
            <Zap size={14} />
            <span>Simultaneous Send (A ⇄ B)</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={onClearHistory}
            title="Clear message history and waveform buffer"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={onReset}
            title="Reset simulation parameters and metrics"
          >
            <RotateCcw size={14} />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      <div className="controls-grid">
        {/* Group 1: Physical Layer Modulation & Speed */}
        <div className="control-group">
          <div className="control-label-row">
            <span>Modulation Scheme</span>
            <span className="control-value">{config.modulation}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`tab-btn ${config.modulation === 'OOK' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center', border: '1px solid var(--border-color)' }}
              onClick={() => handleModulationChange('OOK')}
              title="On-Off Keying: 1 = LED ON, 0 = LED OFF"
            >
              OOK (Direct)
            </button>
            <button
              type="button"
              className={`tab-btn ${config.modulation === 'MANCHESTER' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center', border: '1px solid var(--border-color)' }}
              onClick={() => handleModulationChange('MANCHESTER')}
              title="Manchester Encoding (IEEE 802.15.7): Guarantees transitions & eliminates optical flicker"
            >
              Manchester (VLC)
            </button>
          </div>

          <div className="control-label-row" style={{ marginTop: '0.5rem' }}>
            <span>Transmission Speed (Bit Duration)</span>
            <span className="control-value">{config.bitDurationMs} ms / bit</span>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.25rem' }}>
            <button
              type="button"
              className="pill-btn"
              onClick={() => handleSpeedPreset(100)}
              style={{ borderColor: config.bitDurationMs === 100 ? 'var(--cyan-400)' : undefined }}
            >
              Slow-Mo (100ms)
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={() => handleSpeedPreset(35)}
              style={{ borderColor: config.bitDurationMs === 35 ? 'var(--cyan-400)' : undefined }}
            >
              Normal (35ms)
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={() => handleSpeedPreset(12)}
              style={{ borderColor: config.bitDurationMs === 12 ? 'var(--cyan-400)' : undefined }}
            >
              Fast (12ms)
            </button>
          </div>
          <input
            type="range"
            className="slider-input"
            min={10}
            max={200}
            step={5}
            value={config.bitDurationMs}
            onChange={(e) => onChangeConfig({ bitDurationMs: Number(e.target.value) })}
          />
        </div>

        {/* Group 2: Optical Channel & Distance */}
        <div className="control-group">
          <div className="control-label-row">
            <span>Transmission Distance</span>
            <span className="control-value">{config.distanceMeters.toFixed(1)} meters</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min={0.5}
            max={10.0}
            step={0.5}
            value={config.distanceMeters}
            onChange={(e) => onChangeConfig({ distanceMeters: Number(e.target.value) })}
          />

          <div className="control-label-row" style={{ marginTop: '0.5rem' }}>
            <span>Propagation Delay</span>
            <span className="control-value">{config.propagationDelayMs} ms</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min={5}
            max={150}
            step={5}
            value={config.propagationDelayMs}
            onChange={(e) => onChangeConfig({ propagationDelayMs: Number(e.target.value) })}
          />

          <div className="control-label-row" style={{ marginTop: '0.5rem' }}>
            <span>Receiver Sensitivity Threshold (V_th)</span>
            <span className="control-value">{config.receiverSensitivity.toFixed(2)} V</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min={0.15}
            max={0.80}
            step={0.05}
            value={config.receiverSensitivity}
            onChange={(e) => onChangeConfig({ receiverSensitivity: Number(e.target.value) })}
          />
        </div>

        {/* Group 3: Channel Noise & Impairments */}
        <div className="control-group">
          <div className="control-label-row">
            <span>Ambient Light DC Interference</span>
            <span className="control-value">{Math.round(config.ambientLight * 100)}%</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min={0.0}
            max={0.5}
            step={0.02}
            value={config.ambientLight}
            onChange={(e) => onChangeConfig({ ambientLight: Number(e.target.value) })}
          />

          <div className="control-label-row" style={{ marginTop: '0.5rem' }}>
            <span>Gaussian Optical Noise (AWGN)</span>
            <span className="control-value">{Math.round(config.noiseLevel * 100)}%</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min={0.0}
            max={0.3}
            step={0.02}
            value={config.noiseLevel}
            onChange={(e) => onChangeConfig({ noiseLevel: Number(e.target.value) })}
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {/* Error Injection Toggle */}
            <button
              type="button"
              className={`btn-outline ${config.errorInjection ? 'badge-blocked' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onChangeConfig({ errorInjection: !config.errorInjection })}
              title="Force a bit flip in transmission to verify CRC error detection"
            >
              <Bug size={13} />
              <span>{config.errorInjection ? 'Bit-Flip Injected' : 'Inject Bit-Flip'}</span>
            </button>

            {/* Link Obstruct Toggle */}
            <button
              type="button"
              className={`btn-outline ${!config.enabled ? 'badge-blocked' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onChangeConfig({ enabled: !config.enabled })}
              title="Obstruct optical path line-of-sight"
            >
              <ShieldAlert size={13} />
              <span>{config.enabled ? 'Clear Path' : 'Obstructed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
