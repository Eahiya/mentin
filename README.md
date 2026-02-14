RAPID-100: Neural Emergency Triage Intelligence
RAPID-100 is a conceptual, high-performance emergency dispatch dashboard that leverages multi-modal AI to augment human dispatchers. By utilizing the Google Gemini API, it provides real-time semantic analysis, intent classification, and hybrid priority scoring for emergency voice streams.

Key Features

Neural Triage Core
Real-time Inference: Analyzes incoming audio transcripts using gemini-3-flash-preview.
Semantic Classification: Automatically categorizes calls into Medical, Fire, Crime, or Accident types.
Risk Detection: Identifies secondary threats (e.g., trapped victims, weapons, gas leaks) before the dispatcher even finishes the call.
Inference Logic Trace: Displays the "reasoning" behind every classification for dispatcher transparency.

Advanced Audio Pipeline
Voice Simulation & Demos: Test the system with pre-configured high-stress scenarios or generate synthetic voice clips to verify the triage pipeline.
Neural TTS (Dispatcher Takeover): When a dispatcher takes over, their instructions are synthesized into a calm, authoritative voice using gemini-2.5-flash-preview-tts.
Hardware Mic Integration: Process live audio directly from the dispatcher's hardware with real-time waveform visualization.
Keyword Highlighting: Automatically flags "Danger" terms (e.g., bleeding, unconscious) in the live transcript.

Hybrid Priority Scoring
Combines AI Confidence with Heuristic Distress Analysis.
Triggers "Distress Alerts" based on voice intensity and keyword matches.
Automatically upgrades calls to P1 (Critical) status when life-safety risks are detected.

Dispatcher Guardrails
Confirmation Modals: Prevents accidental unit deployment with a secure "Confirm Dispatch" flow.
Manual Override: Total human control over unit routing (Police, Fire, Medical).
Secure Edge Logs: Real-time logging of all neural inferences and system events.

Technical Stack
Framework: React 19 (Functional Components, Hooks)
Styling: Tailwind CSS (Cyber-Tactical Dark Theme)
AI Models:
gemini-3-flash-preview (Logic, Summarization, Triage)
gemini-2.5-flash-preview-tts (Synthetic Speech Engine)
Visualization: Recharts (Edge Latency Telemetry), Canvas API (Live Waveforms)
Icons: Lucide-React
Language: TypeScript

Setup & Installation
API Key: This application requires a valid Google Gemini API Key.
Environment Variable: The key must be provided via process.env.API_KEY.
Permissions: The application will request Microphone access for the Live Mic feature (see metadata.json).

📖 Usage Guide
Run Simulation: Click one of the scenario buttons (e.g., "Cardiac", "Fire") to start a simulated emergency call.
Monitor Triage: Watch the Neural Triage Intelligence panel for real-time risk assessment and priority scoring.
Manual Takeover: Click "Take Over" to enter Manual Mode. Type instructions into the command line to speak to the caller via Neural TTS.
Confirm Dispatch: Once the triage is complete, click "Confirm" to deploy units.
