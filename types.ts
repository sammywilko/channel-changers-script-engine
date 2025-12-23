export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  images?: string[];
  generatedImage?: string;
}

export enum Phase {
  DevelopmentHell = 1,
  CharacterWorldLab = 2,
  StructureBeatMap = 3,
  WritersRoom = 4,
  VisualProduction = 5,
}

export interface CharacterProfile {
  name: string;
  archetype?: string;
  dialogueDNA?: string; // Specific speech patterns
}

export interface VisualAsset {
  id: string;
  type: 'reference' | 'generated';
  data: string; // base64
  label: string;
  timestamp: number;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  label: string;
  data: ProjectData;
}

export interface ProjectData {
  title: string;
  logline: string;
  format: string;
  tone: string;
  characters: string[]; // Legacy simple list
  characterProfiles: CharacterProfile[]; // Richer data
  locations: string[];
  beats: string[];
  scenesWritten: number;
  productionNotes: string[];
  scriptContent: string; // The Master Script
  snapshots: Snapshot[];
  visuals: VisualAsset[]; // The Visual Bible
}

export interface ProjectState {
  currentPhase: Phase;
  data: ProjectData;
}

export interface GenerationConfig {
  thinkingBudget?: number;
}

export interface MapSearchResult {
  title: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
}