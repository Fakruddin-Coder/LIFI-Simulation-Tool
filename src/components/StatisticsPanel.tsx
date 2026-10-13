import React from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  AlertOctagon, 
  Zap, 
  Clock, 
  Signal, 
  HelpCircle,
  Percent
} from 'lucide-react';
import type { SimulationStats, ChannelConfig } from '../types/simulation';
import { calculateOpticalSNR } from '../simulation/metrics';

interface StatisticsPanelProps {
  stats: SimulationStats;
  config: ChannelConfig;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats, config }) => {
  const snrdB = calculateOpticalSNR(config);

  return (
    <div className="lifi-card">
      <div className="card-header">
        <div className="card-title">
          <BarChart3 size={18} />
          <span>Real-Time Performance Metrics & Transmission Statistics</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Calculated from real simulation telemetry
        </div>
      </div>

      <div className="stats-grid">
        {/* Total Transmissions */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Transmissions</span>
            <Zap size={14} color="var(--cyan-400)" />
          </div>
          <div className="stat-value">{stats.totalTransmitted}</div>
          <div className="stat-subtext">
            A→B: {stats.transmittedA} | B→A: {stats.transmittedB}
          </div>
        </div>

        {/* Successfully Delivered */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Delivered Packets</span>
            <CheckCircle size={14} color="var(--emerald-400)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--emerald-400)' }}>
            {stats.totalReceivedSuccess}
          </div>
          <div className="stat-subtext">
            Received A: {stats.receivedA} | B: {stats.receivedB}
          </div>
        </div>

        {/* Corrupted / Rejected */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Corrupted / Rejected</span>
            <AlertOctagon size={14} color="var(--rose-400)" />
          </div>
          <div className="stat-value" style={{ color: stats.corruptedFrames > 0 ? 'var(--rose-400)' : 'var(--text-primary)' }}>
            {stats.corruptedFrames}
          </div>
          <div className="stat-subtext">
            CRC errors & framing faults
          </div>
        </div>

        {/* Packet Success Rate (PSR) */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Success Rate (PSR)</span>
            <Percent size={14} color="var(--indigo-400)" />
          </div>
          <div className="stat-value" style={{
            color: stats.packetSuccessRate >= 90 ? 'var(--emerald-400)' :
                   stats.packetSuccessRate >= 50 ? 'var(--amber-400)' : 'var(--rose-400)'
          }}>
            {stats.packetSuccessRate}%
          </div>
          <div className="stat-subtext">
            Delivered / Total * 100%
          </div>
        </div>

        {/* Bit Error Rate (BER) */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Bit Error Rate (BER)</span>
            <HelpCircle size={14} color="var(--amber-400)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.125rem' }}>
            {stats.bitErrorCount} / {stats.totalBitsTransmitted}
          </div>
          <div className="stat-subtext">
            BER: {stats.bitErrorRate.toExponential(2)}
          </div>
        </div>

        {/* Optical SNR */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Optical SNR</span>
            <Signal size={14} color="var(--cyan-400)" />
          </div>
          <div className="stat-value">
            {config.enabled ? `${snrdB} dB` : '0 dB'}
          </div>
          <div className="stat-subtext">
            10 · log10(P_signal / P_noise)
          </div>
        </div>

        {/* Average Latency */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Avg Latency</span>
            <Clock size={14} color="var(--text-secondary)" />
          </div>
          <div className="stat-value">
            {stats.averageLatencyMs} ms
          </div>
          <div className="stat-subtext">
            Propagation + sampling delay
          </div>
        </div>

        {/* Configured Data Rate */}
        <div className="stat-card">
          <div className="stat-label">
            <span>Bit Rate</span>
            <Zap size={14} color="var(--amber-400)" />
          </div>
          <div className="stat-value">
            {stats.currentBitRateBps} bps
          </div>
          <div className="stat-subtext">
            1000 / {config.bitDurationMs}ms symbol duration
          </div>
        </div>
      </div>
    </div>
  );
};
