import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { 
  ChannelConfig, 
  TransmittedMessage, 
  SimulationStats, 
  SignalSample 
} from './types/simulation';
import { runAnimatedTransmission, simulateTransmissionSync } from './simulation/simulationEngine';
import { createInitialStats, updateStats } from './simulation/metrics';
import { Header } from './components/Header';
import { OpticalLink } from './components/OpticalLink';
import { DevicePanel } from './components/DevicePanel';
import { SignalWaveform } from './components/SignalWaveform';
import { SignalInspector } from './components/SignalInspector';
import { SimulationControls } from './components/SimulationControls';
import { StatisticsPanel } from './components/StatisticsPanel';
import { InfoModal } from './components/InfoModal';

const initialConfig: ChannelConfig = {
  enabled: true,
  distanceMeters: 1.5,
  attenuationFactor: 1.0,
  ambientLight: 0.08,
  noiseLevel: 0.03,
  receiverSensitivity: 0.35,
  propagationDelayMs: 25,
  bitDurationMs: 30, // 30ms per bit: smooth visual animation while fast enough
  modulation: 'OOK',
  errorInjection: false,
};

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Channel Configuration
  const [config, setConfig] = useState<ChannelConfig>(initialConfig);

  // Statistics
  const [stats, setStats] = useState<SimulationStats>(createInitialStats);

  // Message history (All completed messages)
  const [messages, setMessages] = useState<TransmittedMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<TransmittedMessage | undefined>(undefined);

  // Sequence counters for Device A and Device B
  const seqCounterA = useRef(1);
  const seqCounterB = useRef(1);

  // Active Transmission States for Device A
  const [isTransmittingA, setIsTransmittingA] = useState(false);
  const [currentBitA, setCurrentBitA] = useState(0);
  const [ledOnA, setLedOnA] = useState(false);
  const [progressA, setProgressA] = useState(0);
  const [liveSamplesA, setLiveSamplesA] = useState<SignalSample[]>([]);
  const controllerA = useRef<{ cancel: () => void } | null>(null);

  // Active Transmission States for Device B
  const [isTransmittingB, setIsTransmittingB] = useState(false);
  const [currentBitB, setCurrentBitB] = useState(0);
  const [ledOnB, setLedOnB] = useState(false);
  const [progressB, setProgressB] = useState(0);
  const [liveSamplesB, setLiveSamplesB] = useState<SignalSample[]>([]);
  const controllerB = useRef<{ cancel: () => void } | null>(null);

  // Receiver active flags
  // When A transmits, B receives
  const isReceivingB = isTransmittingA;
  const currentRxBitB = liveSamplesA.length > 0 ? liveSamplesA[liveSamplesA.length - 1].rxBit : 0;

  // When B transmits, A receives
  const isReceivingA = isTransmittingB;
  const currentRxBitA = liveSamplesB.length > 0 ? liveSamplesB[liveSamplesB.length - 1].rxBit : 0;

  // Theme synchronization with HTML document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial demo transmission on mount so inspector and waveforms are ready to view!
  useEffect(() => {
    const demoMsg = simulateTransmissionSync(
      'Li-Fi Link Initialized 💡',
      'DEVICE_A',
      'DEVICE_B',
      1,
      initialConfig
    );
    seqCounterA.current = 2;
    setMessages([demoMsg]);
    setSelectedMessage(demoMsg);
    setStats(prev => updateStats(prev, demoMsg, initialConfig.propagationDelayMs, initialConfig.bitDurationMs));
  }, []);

  // Transmit message from Device A -> Device B
  const handleSendFromA = useCallback((text: string) => {
    if (isTransmittingA) return;

    setIsTransmittingA(true);
    setProgressA(0);
    setLiveSamplesA([]);

    const seq = seqCounterA.current++;
    const ctrl = runAnimatedTransmission(
      text,
      'DEVICE_A',
      'DEVICE_B',
      seq,
      config,
      (stepData) => {
        setCurrentBitA(stepData.currentTxBit);
        setLedOnA(stepData.isLedOn);
        setProgressA(stepData.progress);
        setLiveSamplesA(stepData.accumulatedSamples);
      },
      (finalMessage) => {
        setIsTransmittingA(false);
        setLedOnA(false);
        setProgressA(1.0);
        setMessages(prev => [finalMessage, ...prev]);
        setSelectedMessage(finalMessage);
        setStats(prev => updateStats(prev, finalMessage, config.propagationDelayMs, config.bitDurationMs));
      }
    );

    controllerA.current = ctrl;
  }, [isTransmittingA, config]);

  // Transmit message from Device B -> Device A
  const handleSendFromB = useCallback((text: string) => {
    if (isTransmittingB) return;

    setIsTransmittingB(true);
    setProgressB(0);
    setLiveSamplesB([]);

    const seq = seqCounterB.current++;
    const ctrl = runAnimatedTransmission(
      text,
      'DEVICE_B',
      'DEVICE_A',
      seq,
      config,
      (stepData) => {
        setCurrentBitB(stepData.currentTxBit);
        setLedOnB(stepData.isLedOn);
        setProgressB(stepData.progress);
        setLiveSamplesB(stepData.accumulatedSamples);
      },
      (finalMessage) => {
        setIsTransmittingB(false);
        setLedOnB(false);
        setProgressB(1.0);
        setMessages(prev => [finalMessage, ...prev]);
        setSelectedMessage(finalMessage);
        setStats(prev => updateStats(prev, finalMessage, config.propagationDelayMs, config.bitDurationMs));
      }
    );

    controllerB.current = ctrl;
  }, [isTransmittingB, config]);

  // 1-Click Simultaneous Send from both devices
  const handleSimultaneousSend = useCallback(() => {
    if (isTransmittingA || isTransmittingB) return;

    handleSendFromA('Telemetry from Device A ⚡');
    handleSendFromB('Acknowledgment from Device B 📡');
  }, [isTransmittingA, isTransmittingB, handleSendFromA, handleSendFromB]);

  // Reset simulation
  const handleReset = useCallback(() => {
    if (controllerA.current) controllerA.current.cancel();
    if (controllerB.current) controllerB.current.cancel();

    setIsTransmittingA(false);
    setIsTransmittingB(false);
    setLedOnA(false);
    setLedOnB(false);
    setProgressA(0);
    setProgressB(0);
    setLiveSamplesA([]);
    setLiveSamplesB([]);

    seqCounterA.current = 1;
    seqCounterB.current = 1;

    setMessages([]);
    setSelectedMessage(undefined);
    setStats(createInitialStats());
  }, []);

  // Clear message history
  const handleClearHistory = useCallback(() => {
    setMessages([]);
    setSelectedMessage(undefined);
  }, []);

  // Select message to inspect
  const handleInspectMessage = useCallback((msg: TransmittedMessage) => {
    setSelectedMessage(msg);
  }, []);

  // Toggle theme
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Toggle optical beam obstruction
  const handleToggleObstruction = () => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // Update channel config
  const handleChangeConfig = (newConf: Partial<ChannelConfig>) => {
    setConfig(prev => ({ ...prev, ...newConf }));
  };

  return (
    <div className="lifi-app-container">
      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onReset={handleReset}
        onOpenDocs={() => setIsDocsOpen(true)}
        config={config}
        stats={stats}
      />

      <main className="lifi-main-content">
        {/* Optical Link Channel Visualizer */}
        <OpticalLink
          config={config}
          isTransmittingA={isTransmittingA}
          isTransmittingB={isTransmittingB}
          ledOnA={ledOnA}
          ledOnB={ledOnB}
          currentRxBitA={currentRxBitA}
          currentRxBitB={currentRxBitB}
          progressA={progressA}
          progressB={progressB}
          onToggleObstruction={handleToggleObstruction}
        />

        {/* Two Devices Side-by-Side (Device A and Device B) */}
        <div className="devices-grid">
          {/* Device A */}
          <DevicePanel
            deviceId="DEVICE_A"
            deviceName="Device A (Node 1)"
            themeColor="cyan"
            isTransmitting={isTransmittingA}
            currentBit={currentBitA}
            ledOn={ledOnA}
            currentRxBit={currentRxBitA}
            isReceiving={isReceivingA}
            progress={progressA}
            messages={messages}
            selectedMessageId={selectedMessage?.id}
            onSendMessage={handleSendFromA}
            onInspectMessage={handleInspectMessage}
          />

          {/* Center Connection Indicator Divider */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem 0',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <div style={{
              width: '1px',
              height: '40px',
              background: 'linear-gradient(to bottom, transparent, var(--border-color), transparent)'
            }} />
            <span style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: '9999px'
            }}>
              Bidirectional OWC
            </span>
            <div style={{
              width: '1px',
              height: '40px',
              background: 'linear-gradient(to bottom, transparent, var(--border-color), transparent)'
            }} />
          </div>

          {/* Device B */}
          <DevicePanel
            deviceId="DEVICE_B"
            deviceName="Device B (Node 2)"
            themeColor="amber"
            isTransmitting={isTransmittingB}
            currentBit={currentBitB}
            ledOn={ledOnB}
            currentRxBit={currentRxBitB}
            isReceiving={isReceivingB}
            progress={progressB}
            messages={messages}
            selectedMessageId={selectedMessage?.id}
            onSendMessage={handleSendFromB}
            onInspectMessage={handleInspectMessage}
          />
        </div>

        {/* Simulation Controls Panel */}
        <SimulationControls
          config={config}
          onChangeConfig={handleChangeConfig}
          onSimultaneousSend={handleSimultaneousSend}
          onClearHistory={handleClearHistory}
          onReset={handleReset}
          isTransmittingA={isTransmittingA}
          isTransmittingB={isTransmittingB}
        />

        {/* Oscilloscope Waveform Viewer */}
        <SignalWaveform
          message={selectedMessage}
          liveSamples={isTransmittingA ? liveSamplesA : (isTransmittingB ? liveSamplesB : undefined)}
        />

        {/* Protocol Frame & Signal Inspector */}
        <SignalInspector message={selectedMessage} />

        {/* Real-Time Performance Metrics & Statistics */}
        <StatisticsPanel stats={stats} config={config} />
      </main>

      {/* Faculty Guide / Documentation Modal */}
      <InfoModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
};

export default App;
