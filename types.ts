export interface AnalysisResult {
  items: string[];
  colors: Array<{ hex: string; name: string }>;
  styleKeywords: string[];
  captions: {
    minimalist: string;
    storyteller: string;
    witty: string;
    hype: string;
  };
  hashtags: string[];
  vibeRating: number; // 1-10
  critique: string;
}

export enum ViewState {
  LANDING = 'LANDING',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  PROFILE = 'PROFILE',
}

export interface UserCredits {
  remaining: number;
  total: number;
}

export const MOCK_INITIAL_CREDITS: UserCredits = {
  remaining: 3,
  total: 5
};

export interface SavedOutfit {
  id: string;
  timestamp: number;
  image: string;
  analysis: AnalysisResult;
}