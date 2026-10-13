import React from 'react';
import { 
  Sun, 
  Moon, 
  RotateCcw, 
  BookOpen, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import type { ChannelConfig, SimulationStats } from '../types/simulation';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onReset: () => void;
  onOpenDocs: () => void;
  config: ChannelConfig;
  stats: SimulationStats;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onReset,
  onOpenDocs,
  config,
  stats,
}) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-branding">
          <div className="brand-icon-wrapper" title="Optical Wireless Communication">
            <Radio size={24} />
          </div>
          <div className="header-title-box">
            <h1>Two-Way Li-Fi Communication System</h1>
            <p>Bidirectional Optical Wireless Communication (OWC) Simulation</p>
          </div>
        </div>

        <div className="header-badges">
          {/* Channel status badge */}
          <div className={`badge ${config.enabled ? 'badge-active' : 'badge-blocked'}`}>
            {config.enabled ? (
              <>
                <CheckCircle2 size={13} />
                <span>Optical Link Active</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} />
                <span>Optical Path Obstructed</span>
              </>
            )}
          </div>

          {/* Modulation badge */}
          <div className="badge badge-info" title="Current physical layer modulation scheme">
            <Zap size={13} />
            <span>Mod: {config.modulation}</span>
          </div>

          {/* Bit rate badge */}
          <div className="badge" title="Configured transmission symbol rate">
            <span>{stats.currentBitRateBps} bps</span>
          </div>

          {/* Distance badge */}
          <div className="badge" title="Simulated optical path distance">
            <span>{config.distanceMeters.toFixed(1)} m</span>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="btn-outline"
            onClick={onOpenDocs}
            title="View Li-Fi System Principles & Faculty Guide"
          >
            <BookOpen size={15} />
            <span>Faculty Guide</span>
          </button>

          <button
            className="btn-icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            className="btn-icon"
            onClick={onReset}
            title="Reset Simulation & Clear Metrics"
            aria-label="Reset Simulation"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
