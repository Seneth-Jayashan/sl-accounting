import { api } from "./api";

// --- CONFIGURATION ---
const QUIZ_BASE = "/quizzes";
const SUBMISSION_BASE = "/submissions";

// --- TYPES ---

export interface QuizOption {
  _id?: string;
  optionText: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  _id?: string;
  questionText: string;
  questionImage?: string;
  questionType: "mcq" | "multi-select" | "true-false" | "short-answer";
  options: QuizOption[];
  explanation?: string;
  points: number;
}

export interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBacktrack: boolean;
  maxAttempts: number;
  showResultImmediately: boolean;
  requirePassword?: string | null;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  class: string | { _id: string; className: string };
  questions: QuizQuestion[];
  quizType: "live" | "schedule" | "practice";
  scheduledAt?: string;
  expiresAt?: string;
  duration: number;
  settings: QuizSettings;
  totalPoints: number;
  passingPercentage: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
}

// Payload for creating/updating a Quiz
export interface QuizPayload extends Partial<Omit<Quiz, "_id" | "createdAt" | "totalPoints">> {}

// Interface for Student Answer Submission
export interface StudentAnswer {
  questionId: string;
  selectedOptions?: number[];
  shortAnswer?: string;
}

export interface QuizSubmission {
  _id: string;
  quiz: string | Partial<Quiz>;
  student: string | any; // Can be populated with user details
  answers: Array<{
    questionId: string;
    selectedOptions: number[];
    shortAnswer?: string;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
  totalPointsEarned: number;
  percentageScore: number;
  passed: boolean;
  status: "in-progress" | "completed" | "time-out";
  startedAt: string;
  completedAt?: string;
  timeTaken?: number;
}

// Result summary returned directly upon submission
export interface SubmissionSummary {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}

// --- SERVICE ---

const QuizService = {
  // ==========================================
  // 1. ADMIN MANAGEMENT (Creation & Status)
  // ==========================================

  createQuiz: async (data: QuizPayload) => {
    const response = await api.post<{ success: boolean; data: Quiz }>(QUIZ_BASE, data);
    return response.data;
  },

  getAllQuizzes: async () => {
    const response = await api.get<{ success: boolean; count: number; data: Quiz[] }>(`${QUIZ_BASE}/all`);
    return response.data;
  },

  updateQuiz: async (id: string, data: QuizPayload) => {
    const response = await api.put<{ success: boolean; data: Quiz }>(`${QUIZ_BASE}/${id}`, data);
    return response.data;
  },

  deleteQuiz: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`${QUIZ_BASE}/${id}`);
    return response.data;
  },

  togglePublish: async (id: string) => {
    const response = await api.patch<{ success: boolean; isPublished: boolean; message: string }>(`${QUIZ_BASE}/${id}/publish`);
    return response.data;
  },

  toggleActive: async (id: string) => {
    const response = await api.patch<{ success: boolean; isActive: boolean }>(`${QUIZ_BASE}/${id}/active`);
    return response.data;
  },

  // ==========================================
  // 2. STUDENT VIEW & PARTICIPATION
  // ==========================================

  getQuizzesByClass: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: Quiz[] }>(`${QUIZ_BASE}/class/${classId}`);
    return response.data;
  },

  getQuizById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Quiz }>(`${QUIZ_BASE}/${id}`);
    return response.data;
  },

  startQuiz: async (quizId: string) => {
    const response = await api.post<{ success: boolean; submissionId: string }>(`${SUBMISSION_BASE}/start`, { quizId });
    return response.data;
  },

  submitQuiz: async (submissionId: string, answers: StudentAnswer[], isTimeOut: boolean = false) => {
    const response = await api.post<{ success: boolean; data: SubmissionSummary }>(
      `${SUBMISSION_BASE}/${submissionId}/submit`,
      { answers, isTimeOut }
    );
    return response.data;
  },

  // ==========================================
  // 3. RESULTS & ANALYTICS
  // ==========================================

  // Student views their own attempt history
  getMyAttempts: async () => {
    const response = await api.get<{ success: boolean; count: number; data: QuizSubmission[] }>(`${SUBMISSION_BASE}/my-attempts`);
    return response.data;
  },

  // Student views their detailed marked paper
  getDetailedReview: async (submissionId: string) => {
    const response = await api.get<{ success: boolean; quizTitle?: string; summary?: any; review?: any; message?: string }>(`${SUBMISSION_BASE}/review/${submissionId}`);
    return response.data;
  },

  // Admin views all submissions for a specific quiz
  getQuizAnalytics: async (quizId: string) => {
    const response = await api.get<{ success: boolean; count: number; data: QuizSubmission[] }>(`${SUBMISSION_BASE}/analytics/${quizId}`);
    return response.data;
  },

  // Admin views a specific student's paper
  getAdminSubmissionView: async (submissionId: string) => {
    const response = await api.get<{ success: boolean; data: QuizSubmission }>(`${SUBMISSION_BASE}/admin/view/${submissionId}`);
    return response.data;
  }
};

export default QuizService;