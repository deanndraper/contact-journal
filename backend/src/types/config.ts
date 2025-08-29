// Configuration types for the therapeutic app system

export interface InteractionType {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export interface ComfortLevel {
  id: string;
  label: string;
  color: string;
  emoji?: string;
  description?: string;
}

export interface Theme {
  primary: string;
  secondary: string;
  background?: string;
}

export interface UIConfig {
  welcomeMessage?: string;
  interactionPrompt?: string;
  comfortPrompt?: string;
  notesPrompt?: string;
  notesPlaceholder?: string;
  submitButton?: string;
  recentEntriesTitle?: string;
}

export interface AIConfig {
  promptTemplate?: string;
  enabled?: boolean;
}

export interface AppConfig {
  appId: string;
  appName: string;
  description?: string;
  interactions: InteractionType[];
  comfortLevels: ComfortLevel[];
  theme: Theme;
  ui?: UIConfig;
  ai?: AIConfig;
  version?: string;
}

export interface ConfigValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ConfigError extends Error {
  public errors: ConfigValidationError[];

  constructor(message: string, errors: ConfigValidationError[] = []) {
    super(message);
    this.name = 'ConfigError';
    this.errors = errors;
  }
}