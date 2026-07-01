export type UserRole = 'candidate' | 'company' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  title?: string;
  bio?: string;
  skills: string[];
  reputationScore: number; // AI-evaluated score 0 - 1000
  verifiedSkills: Record<string, { verified: boolean; score: number; date: string }>;
  subscribed: boolean;
  subscriptionDate?: string;
  phone?: string;
  savedJobs?: string[];
  githubUrl?: string;
  portfolioUrl?: string;
  subscriberId?: string;
}

export interface JobPost {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  department: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string[];
  skillsRequired: string[];
  tasksCount: number;
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  requiredSkillsList?: string[];
  optionalSkillsList?: string[];
  skillMatrix?: Array<{
    skill: string;
    importance: 'High' | 'Medium' | 'Low';
    category: string;
    proficiency: string;
  }>;
}

export interface SkillAssessment {
  id: string;
  title: string;
  skill: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface AssessmentAttempt {
  id: string;
  candidateId: string;
  assessmentId: string;
  skill: string;
  score: number; // percentage
  passed: boolean;
  answers: Record<string, number>;
  verifiedDate: string;
}

export interface ResumeScanResult {
  matchScore: number; // 0 - 100
  feedback: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestedImprovement: string;
}

export interface MockInterviewSession {
  id: string;
  candidateId: string;
  jobTitle: string;
  questions: string[];
  currentQuestionIndex: number;
  answers: Record<number, string>; // question index -> text answer
  completed: boolean;
  evaluation?: {
    overallScore: number; // 0-100
    strengths: string[];
    improvements: string[];
    feedback: string;
  };
}

export interface PracticalTask {
  id: string;
  title: string;
  description: string;
  skill: string;
  timeLimit: string;
  starterCode: string;
  testCases: { input: string; output: string }[];
  jobId?: string;
  status?: 'draft' | 'published';
}

export interface AIEvaluation {
  requirementCoverage: number;
  problemSolving: number;
  quality: number;
  creativity: number;
  accuracy: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  learningSuggestions: string[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  candidateId: string;
  code?: string;
  status: 'pending' | 'success' | 'failed';
  score: number;
  aiReview?: string;
  submittedAt: string;
  submissionType?: 'code' | 'github' | 'portfolio' | 'pdf';
  githubUrl?: string;
  portfolioUrl?: string;
  pdfDataUrl?: string;
  evaluation?: AIEvaluation;
}

export interface CarrierBillingState {
  phone: string;
  status: 'unsubscribed' | 'otp_pending' | 'subscribed';
  transactionId?: string;
}
