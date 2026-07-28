export interface GameRecord {
  id: string;
  date: string;
  durationPerBlock: number;
  totalBlocks: number;
  completedBlocks: number;
  results: boolean[];
  strike: number;
  actualSeconds?: number;
  status?: 'completed' | 'abandoned';
}

export interface Stats {
  totalGames: number;
  totalBlocks: number;
  completedBlocks: number;
  failedBlocks: number;
  bestStrike: number;
  history: GameRecord[];
  abandonedGames?: number;
}

export interface VoiceSettings {
  enabled: boolean;
  startPhrase: string;
  endPhrase: string;
  idlePhrase: string;
  phrases: string[];
  voiceType: 'es-ES-Journey-F' | 'es-ES-Journey-D' | 'es-PE-AlexNeural' | 'es-PE-CamilaNeural' | 'female1' | 'female2' | 'female3' | 'femaleSexy1' | 'femaleSexy2' | 'femaleSexy3' | 'male1' | 'male2' | 'male3';
  frequencyType: 'interval' | 'random';
  intervalSeconds: number;
  randomTimes: number;
}

export interface ReminderSettings {
  enabled: boolean;
  phrase: string;
  intervalMinutes: number;
  voiceType: 'es-ES-Journey-F' | 'es-ES-Journey-D' | 'es-PE-AlexNeural' | 'es-PE-CamilaNeural' | 'female1' | 'female2' | 'female3' | 'femaleSexy1' | 'femaleSexy2' | 'femaleSexy3' | 'male1' | 'male2' | 'male3';
}

export interface GameSettings {
  duration: number;
  blocksCount: number;
  backgroundSound: string;
  voiceSettings: VoiceSettings;
  alertSoundEnabled: boolean;
  alertVisualEnabled: boolean;
}

export interface Template {
  id: string;
  name: string;
  duration: number;
  blocksCount: number;
}
