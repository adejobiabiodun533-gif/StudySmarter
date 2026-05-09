export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: any;
}

export interface Topic {
  title: string;
  content: string;
}

export interface Mnemonic {
  concept: string;
  mnemonic: string;
  explanation: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'theory' | 'fill-gap' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  category?: string;
  rawContent: string;
  summary?: string;
  topics?: Topic[];
  mnemonics?: Mnemonic[];
  practiceQuestions?: Question[];
  createdAt: any;
  updatedAt: any;
}
