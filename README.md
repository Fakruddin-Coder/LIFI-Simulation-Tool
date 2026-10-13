# Two-Way Li-Fi Communication System
### Bidirectional Optical Wireless Communication (OWC) Simulation

[![Tests](https://img.shields.io/badge/Tests-15%20Passing-emerald)](./src/tests/protocol.test.ts)
[![Protocol](https://img.shields.io/badge/Protocol-IEEE%20802.15.7%20VLC-cyan)](#communication-protocol-specification)
[![Modulation](https://img.shields.io/badge/Modulation-OOK%20%7C%20Manchester-amber)](#digital-modulation-schemes)
[![Build](https://img.shields.io/badge/Build-Vite%20%2B%20React%20%2B%20TS-blue)](#technology-stack)

A complete, production-grade, full-stack software simulation of a **Two-Way Li-Fi (Light Fidelity) Optical Wireless Communication System**. This project models the end-to-end physical and data link layer communication pipeline between two virtual devices (**Device A** and **Device B**) exchanging text messages via simulated light pulses across free space, without requiring physical Arduino, ESP32, LED, or photodiode hardware.

---

## 1. Project Overview & Faculty Demonstration Summary

### Concise Explanation for College Faculty Demonstration:
> *"This project simulates a bidirectional Visible Light Communication (VLC / Li-Fi) link between two microcontrollers. When a user types text into Device A, the system serializes the characters into UTF-8 bytes, frames them with a synchronization preamble (`0xAA`), Start-of-Frame flag (`0x7E`), sequence addressing header, and CRC-16 checksum (`0x1021`), and modulates the bitstream into optical emitter states using On-Off Keying (OOK) or Manchester encoding (IEEE 802.15.7).*
>
> *The optical channel applies physical free-space path loss attenuation based on distance ($I_{rx} \propto 1/d^{1.8}$), ambient room lighting DC offset, Gaussian optical noise (AWGN), and obstacle beam blockage. At Device B, a simulated PIN photodetector converts the incident optical power into an analog voltage and feeds it to a threshold comparator ($V_{th}$). The recovered bitstream is parsed, the CRC-16 is recalculated, and the validated UTF-8 payload is displayed on the receiver. The reverse path (Device B → Device A) operates with identical, independent transceiver mechanics, enabling true simultaneous full-duplex communication."*

---

## 2. Key Features

- **True Bidirectional Full-Duplex Communication:**
  - Independent virtual nodes: **Device A (Node 0x01)** and **Device B (Node 0x02)**.
  - Both devices can transmit and receive simultaneously without blocking each other.
  - Dedicated directional optical beams: Path $A \to B$ and Path $B \to A$.
  - 1-Click **"Simultaneous Send (A ⇄ B)"** action to test concurrent bidirectional data exchange.

- **Complete 14-Step Communication Pipeline:**
  1. User text input (supports plain text, empty strings, long strings, Unicode, and emojis 💡⚡📡).
  2. UTF-8 byte serialization (`TextEncoder`).
  3. Binary bit extraction (MSB first, 8 bits/byte).
  4. Frame encapsulation with standard delimiters and headers.
  5. 16-bit CRC checksum generation (CRC-16-CCITT).
  6. Digital modulation (OOK or Manchester line coding).
  7. Optical emitter logic driving simulated high/low photon flux.
  8. Free-space optical channel propagation with path loss and propagation delay.
  9. Additive White Gaussian Noise (AWGN) and ambient lighting floor.
  10. Photodetector transimpedance response modeling.
  11. Dynamic threshold comparator ($V_{th}$) symbol sampling.
  12. Demodulation with Manchester coding violation detection.
  13. Frame boundary detection and CRC-16 integrity validation.
  14. UTF-8 deserialization and delivery to the destination device panel.

- **Multi-Channel Digital & Optical Oscilloscope (Waveform Viewer):**
  - High-performance, high-DPI HTML5 Canvas oscilloscope displaying synchronized traces:
    - **Trace 1 (Blue):** TX Electrical Logic Level (0V / 3.3V)
    - **Trace 2 (Purple):** TX Optical Power Flux ($P_{tx}$)
    - **Trace 3 (Amber):** RX Optical Power arriving at photodetector ($P_{rx}$ with attenuation & noise)
    - **Trace 4 (Red Dashed):** Receiver Comparator Threshold ($V_{th}$)
    - **Trace 5 (Green):** Recovered RX Electrical Logic Level (0V / 3.3V)
  - Interactive hover inspector with bit-level sample diagnostics.

- **Protocol Frame & Signal Inspector:**
  - Packet dissection: Preamble, SOF, Sender ID, Target ID, Sequence Counter, Modulation Flag, Payload Length, Payload, CRC-16, and EOF.
  - Side-by-side comparison of transmitted vs decoded text.
  - Expandable hex dump and bitstream view for all frame bytes.

- **Interactive Physical Channel Controls:**
  - **Distance Slider:** $0.5\,\text{m}$ to $10.0\,\text{m}$ with live path loss calculation.
  - **Speed Presets & Custom Duration:** Slow-Mo (100ms/bit for educational visual stepping), Normal (35ms/bit), Fast (12ms/bit).
  - **Modulation Selector:** Switch dynamically between OOK and Manchester encoding.
  - **Optical Obstruction Toggle:** Obstructs the line-of-sight beam to simulate physical blockage.
  - **Ambient Interference Slider:** $0\%$ to $50\%$ ambient DC optical background.
  - **Channel Noise Slider:** $0\%$ to $30\%$ standard deviation AWGN optical jitter.
  - **Comparator Threshold Slider:** $0.15\,\text{V}$ to $0.80\,\text{V}$ receiver sensitivity.
  - **Controlled Error Injection:** Injects bit flips to test CRC-16 error rejection.

- **Real-Time Performance Statistics:**
  - Total Transmissions, Delivered Packets, Corrupted Frames, Blocked Transmissions.
  - Packet Success Rate (PSR %), Bit Error Rate (BER).
  - Configured Bit Rate (bps) and Average Latency (ms).
  - Calculated Optical Signal-to-Noise Ratio (SNR in dB).

- **Modern Responsive UI & Aesthetics:**
  - Designed with dark and light theme toggle support.
  - Smooth glassmorphism, responsive CSS grid, live canvas beam animations.
  - Built-in Faculty Guide modal with full technical documentation.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 + TypeScript | Component modularity, deterministic state management |
| **Build Tool** | Vite 8 | Ultra-fast HMR and optimized production bundling |
| **Styling** | Vanilla CSS (CSS Variables) | Modern design tokens, responsive layout, dark/light themes |
| **Visualizations** | HTML5 Canvas (High-DPI) | Multi-trace oscilloscope and bidirectional photon beam raycaster |
| **Icons** | Lucide React | Modern engineering and UI iconography |
| **Testing** | Vitest | Automated headless unit testing covering all 14 project criteria |

---

## 4. Architecture & Module Structure

```
cn/
├── src/
│   ├── types/
│   │   └── simulation.ts          # Type contracts: LiFiFrame, SignalSample, ChannelConfig, Stats
│   ├── simulation/
│   │   ├── crc.ts                 # CRC-16-CCITT (0x1021) calculator and verifier
│   │   ├── protocol.ts            # Text serialization, framing, parsing, and address checks
│   │   ├── modulation.ts          # OOK and Manchester modulation/demodulation with violation checks
│   │   ├── opticalChannel.ts      # Path loss attenuation, ambient floor, AWGN noise generator
│   │   ├── receiver.ts            # Photodetector signal processor, comparator, frame validator
│   │   ├── metrics.ts             # Performance statistics, BER, PSR, and optical SNR formulas
│   │   └── simulationEngine.ts    # Synchronous runner and animated step-by-step orchestrator
│   ├── components/
│   │   ├── Header.tsx             # Header bar with connection status, badges, theme toggle
│   │   ├── OpticalLink.tsx        # Canvas beam visualizer with traveling photons and obstacle
│   │   ├── DevicePanel.tsx        # Node card with LED/PD indicators, message composer, history
│   │   ├── SignalWaveform.tsx     # 5-trace canvas oscilloscope with bit labels and hover tooltips
│   │   ├── SignalInspector.tsx    # Packet architecture breakdown, hex dump, CRC comparison
│   │   ├── SimulationControls.tsx # Channel sliders, modulation toggle, error injector, presets
│   │   ├── StatisticsPanel.tsx    # Performance telemetry cards with mathematical definitions
│   │   └── InfoModal.tsx          # Faculty guide modal with technical theory and reference
│   ├── tests/
│   │   └── protocol.test.ts       # Automated Vitest suite testing all 14 project requirements
│   ├── App.tsx                    # Top-level coordinator managing concurrent bidirectional states
│   ├── index.css                  # Comprehensive CSS design system (tokens, themes, animations)
│   └── main.tsx                   # React root entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Communication Protocol Specification

Every transmitted packet is encapsulated according to the following deterministic byte structure:

```
+----------+--------+----------------------------+---------------+----------+--------+
| PREAMBLE |  SOF   |      PROTOCOL HEADER       |    PAYLOAD    |  CRC-16  |  EOF   |
|  (1 B)   | (1 B)  |           (6 B)            |     (N B)     |  (2 B)   | (1 B)  |
+----------+--------+----------------------------+---------------+----------+--------+
|   0xAA   |  0x7E  | Sender | Target | Seq | Mod | Length (2B)  | UTF-8... | 0x1021   |  0x7F  |
+----------+--------+----------------------------+---------------+----------+--------+
```

### Detailed Field Breakdown:
1. **Preamble (`0xAA` = `10101010b`):**
   - Transmitted first to allow the photodetector automatic gain control (AGC) and receiver symbol clock to synchronize to the optical carrier.
2. **Start of Frame (SOF) Delimiter (`0x7E` = `01111110b`):**
   - Delimits the boundary between clock acquisition and payload data.
3. **Protocol Header (6 Bytes):**
   - `senderId` (1 Byte): `0x01` for Device A, `0x02` for Device B.
   - `targetId` (1 Byte): `0x02` for Device B, `0x01` for Device A.
   - `sequenceId` (1 Byte): Incrementing sequence counter ($0$ to $255$) to detect duplicate or dropped frames.
   - `modulation` (1 Byte): `0x00` for OOK, `0x01` for Manchester.
   - `payloadLength` (2 Bytes, Big-Endian): Number of UTF-8 payload bytes ($0$ to $65535$).
4. **Payload ($N$ Bytes):**
   - Standard UTF-8 encoded bytes representing user text.
5. **CRC-16-CCITT Checksum (2 Bytes, Big-Endian):**
   - Generator polynomial: $G(x) = x^{16} + x^{12} + x^5 + 1$ (`0x1021`), Initial value: `0xFFFF`.
   - Computed over the combined `[Header + Payload]` bytes.
6. **End of Frame (EOF) Delimiter (`0x7F` = `01111111b`):**
   - Confirms proper frame termination and prevents buffer overrun.

---

## 6. Digital Modulation Schemes

### On-Off Keying (OOK)
- **Mapping:**
  - Logic `1` $\longrightarrow$ LED ON ($P_{tx} = 1.0$, $3.3\,\text{V}$)
  - Logic `0` $\longrightarrow$ LED OFF ($P_{tx} = 0.0$, $0.0\,\text{V}$)
- **Characteristics:** Simplest optical intensity modulation. However, long runs of consecutive zeros or ones cause DC bias drift and visible optical flicker at low speeds.

### Manchester Encoding (IEEE 802.15.7 Standard for VLC)
- **Mapping:**
  - Bit `0` $\longrightarrow$ Low-to-High transition (`[0, 1]`)
  - Bit `1` $\longrightarrow$ High-to-Low transition (`[1, 0]`)
- **Why Manchester is Crucial for Li-Fi:**
  1. **Flicker Mitigation:** Guarantees a constant $50\%$ optical duty cycle across any bit sequence, preventing human-perceptible brightness fluctuations.
  2. **Self-Clocking:** Guarantees at least one optical transition per bit interval, enabling continuous symbol clock synchronization at the photodetector without needing a separate clock line.
  3. **Coding Violation Detection:** Transitions of `[0, 0]` or `[1, 1]` indicate optical channel corruption immediately at the physical layer.

---

## 7. Software-Based Light Channel Physics

The optical channel simulates free-space optical physics deterministically:

1. **Path Loss Attenuation:**
   $$H_{\text{loss}} = \frac{1}{(1 + 0.18 \cdot d)^{1.8}} \cdot \alpha$$
   where $d$ is distance in meters ($0.5\,\text{m}$ to $10.0\,\text{m}$) and $\alpha$ is atmospheric transmissivity.
2. **Ambient Light Interference:**
   Adds an ambient optical DC floor ($I_{\text{ambient}}$) representing ambient room illumination or sunlight.
3. **Additive White Gaussian Noise (AWGN):**
   Uses the Box-Muller transform to add realistic thermal and shot noise $\Delta n \sim \mathcal{N}(0, \sigma^2)$ to the optical power.
4. **Received Optical Power:**
   $$P_{rx} = \max\left(0,\, (P_{tx} \cdot H_{\text{loss}} \cdot \text{transmissivity}) + I_{\text{ambient}} + \Delta n\right)$$
5. **Photodetector Comparator Output:**
   $$V_{pd} = \begin{cases} 3.3\,\text{V} \text{ (Bit 1)}, & \text{if } P_{rx} \ge V_{th} \\ 0.0\,\text{V} \text{ (Bit 0)}, & \text{if } P_{rx} < V_{th} \end{cases}$$

---

## 8. Physical Hardware vs Software Simulation Comparison

| Parameter | Physical Li-Fi Hardware | This Software Simulation |
|---|---|---|
| **Emitter** | High-power GaN LED / Laser Diode driven by MOSFET driver | Simulated normalized optical power state ($0.0$ to $1.0$) with CSS & Canvas glowing animations |
| **Carrier Frequency** | $400\,\text{THz} - 800\,\text{THz}$ (Visible / Near-IR spectrum) | Modeled as discrete optical symbols and normalized flux |
| **Switching Speed** | MHz to GHz bandwidth (tens of Mbps to Gbps) | Scalable visual symbol rate ($10\,\text{ms}$ to $200\,\text{ms}$ per bit) for human inspection |
| **Photodetector** | PIN Photodiode / APD + Transimpedance Amplifier (TIA) | Modeled responsivity, path loss attenuation, and comparator threshold |
| **Line of Sight** | Physical blockage interrupts optical beam | Obstruction toggle sets channel transmissivity to zero, triggering timeout/error |
| **Framing & CRC** | Microcontroller firmware (C/C++ on STM32/ESP32/nRF) | Fully implemented in TypeScript using identical bitwise CRC-16 and IEEE 802.15.7 framing algorithms |

---

## 9. Installation & Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended; verified on Node v24)
- npm (version 9 or higher)

### Setup Instructions
1. Clone or navigate to the repository directory:
   ```bash
   cd c:\Users\Admin\Desktop\CN
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

### Production Build
To validate TypeScript types and compile the optimized production bundle:
```bash
npm run build
```

---

## 10. Automated Testing

The automated test suite runs via **Vitest** and verifies all 14 mandatory functional criteria:

```bash
npm test
```

### Test Suite Results:
```
 ✓ src/tests/protocol.test.ts (15 tests)
   ✓ 1. should encode and decode a simple message correctly
   ✓ 2. should send a message from A to B and verify delivery at B
   ✓ 3. should send a message from B to A and verify delivery at A
   ✓ 4. should handle independent simultaneous transmissions in both directions
   ✓ 5. should support empty strings and long payloads
   ✓ 6. should correctly handle Unicode characters and emojis
   ✓ 7. should compute and verify CRC-16 checksum accurately
   ✓ 8. should reject corrupted frames and detect checksum errors
   ✓ 9. should fail delivery when the optical channel is disabled (beam obstructed)
   ✓ 10. should inject controlled errors and detect frame rejection reproducibly
   ✓ 11. should handle receiver synchronization timeout correctly
   ✓ 12. should handle multiple consecutive messages with sequential IDs
   ✓ 13. should initialize and reset statistics cleanly
   ✓ 14. should accurately update statistics for both successful and failed transmissions
   ✓ 15. should modulate and demodulate correctly using Manchester encoding

Test Files  1 passed (1)
     Tests  15 passed (15)
```

---

## 11. Known Limitations

1. **Symbol Rate:** The simulation is intentionally throttled to $10\,\text{ms} - 200\,\text{ms}$ per bit to allow students and faculty to observe the optical wave pulses and live oscilloscope waveforms in real time. Physical Li-Fi systems operate at microsecond/nanosecond symbol periods.
2. **Multipath Reflection:** The software models direct line-of-sight (LOS) propagation and geometric path loss. Non-line-of-sight (NLOS) diffuse reflections from walls and ceilings are not modeled.
3. **Browser Automation Sandbox:** In environments where automated headless browser drivers are restricted from downloading external binaries, the browser subagent validates local HTTP responses directly, while the headless Vitest test suite verifies all mathematical and state logic.

---

## 12. License & Academic Attribution
Developed as an educational and engineering demonstration of **Bidirectional Optical Wireless Communication (Li-Fi / Visible Light Communication)**. Suitable for university coursework, capstone projects, and laboratory demonstrations.
