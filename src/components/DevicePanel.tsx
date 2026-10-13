import React, { useState } from 'react';
import { 
  Send, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Search, 
  Clock 
} from 'lucide-react';
import type { DeviceId, TransmittedMessage } from '../types/simulation';

interface DevicePanelProps {
  deviceId: DeviceId;
  deviceName: string;
  themeColor: 'cyan' | 'amber';
  isTransmitting: boolean;
  currentBit: number;
  ledOn: boolean;
  currentRxBit: number;
  isReceiving: boolean;
  progress: number;
  messages: TransmittedMessage[];
  selectedMessageId?: string;
  onSendMessage: (text: string) => void;
  onInspectMessage: (message: TransmittedMessage) => void;
}

export const DevicePanel: React.FC<DevicePanelProps> = ({
  deviceId,
  deviceName,
  themeColor,
  isTransmitting,
  currentBit,
  ledOn,
  currentRxBit,
  isReceiving,
  progress,
  messages,
  selectedMessageId,
  onSendMessage,
  onInspectMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [historyTab, setHistoryTab] = useState<'all' | 'rx' | 'tx'>('all');

  const presets = deviceId === 'DEVICE_A' 
    ? [
        'Hello Li-Fi World! 💡',
        'Telemetry Packet #42',
        'Optical test 123',
        'Security token: 0x9AF2',
        'Long payload test string for Li-Fi channel analysis'
      ]
    : [
        'Received loud & clear! 👍',
        'Sensor reading: 23.8°C',
        'Ack sequence #42',
        'Bidirectional optical link OK',
        'Light communication verified'
      ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && inputText !== '') return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handlePresetClick = (presetText: string) => {
    setInputText(presetText);
  };

  const filteredMessages = messages.filter(m => {
    const isTx = m.sender === deviceId;
    const isRx = m.receiver === deviceId;
    if (historyTab === 'tx') return isTx;
    if (historyTab === 'rx') return isRx;
    return isTx || isRx;
  });

  const isCyan = themeColor === 'cyan';
  const badgeClass = isCyan ? 'device-badge-a' : 'device-badge-b';
  const sendBtnClass = isCyan ? 'send-btn-a' : 'send-btn-b';
  const ledActiveClass = isCyan ? 'active-a' : 'active-b';
  const progressClass = isCyan ? 'progress-a' : 'progress-b';

  return (
    <div className={`lifi-card device-card ${isCyan ? 'device-a' : 'device-b'}`}>
      {/* Device Header */}
      <div className="device-title-bar">
        <div className="device-name">
          <span>{deviceName}</span>
          <span className={badgeClass}>{deviceId === 'DEVICE_A' ? 'Node 0x01' : 'Node 0x02'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--emerald-400)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-400)', display: 'inline-block' }}></span>
          <span>Online</span>
        </div>
      </div>

      {/* Optical Transceiver Indicators */}
      <div className="transceiver-indicators">
        {/* Transmitter Indicator */}
        <div className="indicator-box">
          <div className={`led-bulb ${ledOn ? ledActiveClass : ''}`} title={ledOn ? 'LED ON' : 'LED OFF'} />
          <div className="indicator-labels">
            <span className="indicator-title">Optical Transmitter</span>
            <span className="indicator-value">
              {isTransmitting ? `TX: ${ledOn ? 'HIGH (1)' : 'LOW (0)'} [Bit ${currentBit}]` : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Receiver Indicator */}
        <div className="indicator-box">
          <div className={`pd-sensor ${isReceiving ? 'receiving' : ''}`} title="Photodetector">
            <Activity size={12} color={isReceiving ? 'var(--emerald-400)' : 'var(--text-muted)'} />
          </div>
          <div className="indicator-labels">
            <span className="indicator-title">Photodetector</span>
            <span className="indicator-value">
              {isReceiving ? `RX: ${currentRxBit === 1 ? 'HIGH (1)' : 'LOW (0)'}` : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Message Composer */}
      <form className="message-composer" onSubmit={handleSend}>
        <div className="input-container">
          <input
            type="text"
            className="input-field"
            placeholder={`Enter text to transmit from ${deviceName}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTransmitting}
          />
          <button
            type="submit"
            className={`send-btn ${sendBtnClass}`}
            disabled={isTransmitting}
            title={`Transmit message from ${deviceName}`}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </div>

        {/* Preset Prompt Pills */}
        <div className="preset-pills">
          {presets.slice(0, 3).map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="pill-btn"
              onClick={() => handlePresetClick(preset)}
              disabled={isTransmitting}
            >
              {preset.length > 22 ? preset.substring(0, 20) + '...' : preset}
            </button>
          ))}
        </div>
      </form>

      {/* Active Transmission Progress Bar */}
      {isTransmitting && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            <span>Transmitting optical pulses...</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="tx-progress-bar-container">
            <div 
              className={`tx-progress-bar-fill ${progressClass}`} 
              style={{ width: `${Math.round(progress * 100)}%` }} 
            />
          </div>
        </div>
      )}

      {/* Message History Section */}
      <div className="messages-history-section">
        <div className="history-tabs">
          <button 
            type="button"
            className={`tab-btn ${historyTab === 'all' ? 'active' : ''}`}
            onClick={() => setHistoryTab('all')}
          >
            All ({messages.length})
          </button>
          <button 
            type="button"
            className={`tab-btn ${historyTab === 'rx' ? 'active' : ''}`}
            onClick={() => setHistoryTab('rx')}
          >
            Received ({messages.filter(m => m.receiver === deviceId).length})
          </button>
          <button 
            type="button"
            className={`tab-btn ${historyTab === 'tx' ? 'active' : ''}`}
            onClick={() => setHistoryTab('tx')}
          >
            Sent ({messages.filter(m => m.sender === deviceId).length})
          </button>
        </div>

        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              <Clock size={24} style={{ opacity: 0.5 }} />
              <span>No messages in history yet. Send a message to initiate optical link.</span>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isOutgoing = msg.sender === deviceId;
              const isSelected = selectedMessageId === msg.id;

              return (
                <div 
                  key={msg.id} 
                  className={`message-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="message-item-header">
                    <span className={`message-direction-badge ${isOutgoing ? 'direction-tx' : 'direction-rx'}`}>
                      {isOutgoing ? (
                        <>
                          <ArrowUpRight size={11} />
                          <span>OUTGOING (TX)</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft size={11} />
                          <span>INCOMING (RX)</span>
                        </>
                      )}
                    </span>
                    <span>Seq #{msg.frame.header.sequenceId} | {new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="message-payload">
                    {/* If received and corrupted, show what was recovered or error note */}
                    {!isOutgoing && msg.result && !msg.result.success ? (
                      <span style={{ color: 'var(--rose-400)', fontStyle: 'italic' }}>
                        [Frame Corrupted]: {msg.result.text || 'Unable to decode payload'}
                      </span>
                    ) : (
                      <span>{msg.text || '<Empty Payload>'}</span>
                    )}
                  </div>

                  <div className="message-item-footer">
                    <span className={`status-pill status-${msg.status}`}>
                      {msg.status.replace('_', ' ')}
                    </span>

                    <button
                      type="button"
                      className="inspect-btn"
                      onClick={() => onInspectMessage(msg)}
                      title="Inspect signal waveforms and protocol frame details"
                    >
                      <Search size={11} />
                      <span>Inspect Signal</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
