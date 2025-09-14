
export interface FormState {
  songFile: File | null;
  lyricsFile: File | null;
  actorImageFile: File | null;
  directorialStyle: string;
  videoStyle: string;
  artStyle: string;
  songLength: string;
  promptFormat: 'midjourney' | 'stable-diffusion' | 'flux-ai';
  temperature: number;
  shotLength: number;
  format: 'horizontal' | 'vertical';
}

export interface TransitionFormState {
  shotListFile: File | null;
  scene1VideoFile: File | null;
  scene2VideoFile: File | null;
  fromShot: string;
  toShot: string;
  directorialStyle: string;
  videoStyle: string;
  artStyle: string;
  temperature: number;
  transitionLength: number;
  format: 'horizontal' | 'vertical';
}

export interface Shot {
  shotNumber: number;
  timestamp: string;
  cameraAngle: string;
  shotDescription: string;
  lighting: string;
  location: string;
  imagePrompt?: string; // Renamed from midjourneyPrompt for generality
  videoPrompt?: string; // For transition shots
}