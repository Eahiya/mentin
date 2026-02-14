export enum EmergencyType {
  Medical = 'Medical',
  Fire = 'Fire',
  Crime = 'Crime',
  Accident = 'Accident',
  Unknown = 'Unknown'
}

export enum SeverityLevel {
  P1 = 'P1', // Critical / Life Threatening
  P2 = 'P2', // Urgent
  P3 = 'P3', // Routine
}

export interface EmergencyAnalysis {
  emergency_type: EmergencyType;
  severity: SeverityLevel;
  summary: string;
  key_risks: string[];
  confidence: number;
  recommended_route: string;
  reasoning_trace: string;
}

export interface HybridScore {
  final_priority: SeverityLevel;
  distress_score: number;
  keyword_matches: string[];
  ai_confidence: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'alert' | 'success' | 'warning';
}

export interface CallScenario {
  id: string;
  name: string;
  audioScript: string[]; // Simulated audio chunks
  expectedType: EmergencyType;
}