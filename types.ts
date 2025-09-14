export interface FormState {
  songFile: File | null;
  lyricsFile: File | null;
  actorImageFile: File | null;
  directorialStyle: string;
  videoStyle: string;
  songLength: string;
}

export interface TransitionFormState {
  shotListFile: File | null;
  scene1VideoFile: File | null;
  scene2VideoFile: File | null;
  fromShot: string;
  toShot: string;
  directorialStyle: string;
  videoStyle: string;
}

export interface Shot {
  shotNumber: number;
  timestamp: string;
  cameraAngle: string;
  shotDescription: string;
  lighting: string;
  location: string;
  midjourneyPrompt?: string; // Kept for main shot list, optional now
  videoPrompt?: string; // For transition shots
}
