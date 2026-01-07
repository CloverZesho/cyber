// Base interface for all database entities
export interface BaseEntity {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// User entity
export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected';
  companyName: string;
  lastLoginAt?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  createdAt: string;
  updatedAt: string;
}

// Risk entity
export interface Risk extends BaseEntity {
  customId: string;
  name: string;
  description: string;
  category: string;
  likelihood: 'Low' | 'Medium' | 'High' | 'Critical';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'draft' | 'active' | 'mitigated' | 'closed' | 'published' | 'assigned';
  owner?: string;
  mitigationPlan?: string;
  assignedUsers?: AssignedUser[];
  source: 'admin' | 'user';
}

// Asset entity
export interface Asset extends BaseEntity {
  customId: string;
  name: string;
  description: string;
  type: string;
  location?: string;
  owner?: string;
  status: 'draft' | 'active' | 'retired' | 'published' | 'assigned';
  assignedUsers?: AssignedUser[];
  source: 'admin' | 'user';
}

// Framework entity
export interface Framework extends BaseEntity {
  customId: string;
  name: string;
  description: string;
  type: string;
  version?: string;
  compliance?: number;
  status: 'draft' | 'published' | 'assigned';
  readiness?: 'ready' | 'not_ready';
  controlsData: Control[];
  comments?: Comment[];
  domains?: string[];
  activities?: Activity[];
  assignedUsers?: AssignedUser[];
  source: 'admin' | 'user';
}

// Control entity
export interface Control extends BaseEntity {
  name: string;
  description: string;
  type: string;
  status: 'Implemented' | 'Partially Implemented' | 'Not Implemented' | 'Planned';
  owner?: string;
  reviewFrequency?: string;
  frameworks: string[];
}

// DPIA entity
export interface DPIA extends BaseEntity {
  customId: string;
  name: string;
  description: string;
  projectName: string;
  dataTypes: string[];
  processingPurpose: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'draft' | 'published' | 'assigned';
  assignedUsers?: AssignedUser[];
}

// Assessment entity
export interface Assessment extends BaseEntity {
  customId: string;
  title: string;
  description: string;
  questions: Question[];
  status: 'draft' | 'published' | 'assigned';
  assignedUsers?: AssignedUser[];
}

// Assessment Progress
export interface AssessmentProgress extends BaseEntity {
  assessmentId: string;
  answers: Answer[];
  progress: number;
  completed: number;
  pending: number;
  status: 'not_started' | 'in_progress' | 'completed';
  submittedAt?: string;
}

// Assessment Submission
export interface AssessmentSubmission extends BaseEntity {
  assessmentId: string;
  assessmentTitle: string;
  userName: string;
  userEmail: string;
  companyName: string;
  answers: Answer[];
  progress: number;
  totalQuestions: number;
  status: 'in_progress' | 'completed';
  submittedAt?: string;
  startedAt: string;
  completedAt?: string;
  // Scoring
  overallScore: number;      // Total weighted score achieved
  maxPossibleScore: number;  // Maximum possible weighted score
  overallPercentage: number; // (overallScore / maxPossibleScore) * 100
  maturityLevel: 'Critical' | 'Low' | 'Medium' | 'High' | 'Excellent';
  // Domain breakdown
  domainScores: DomainScore[];
  // Risk tracking
  risksIdentified: IdentifiedRisk[];
  totalRisks: number;
  // AI Report
  aiReportGenerated: boolean;
  aiReportId?: string;
  // Timeline
  timeline: AssessmentTimelineEntry[];
}

// Template entity
export interface Template extends BaseEntity {
  name: string;
  description: string;
  questions: Question[];
  category: string;
}

// Report entity
export interface Report extends BaseEntity {
  assessmentId: string;
  title: string;
  content: string;
  overallScore: number;
  maturityLevel: string;
  generatedAt: string;
}

// Supporting types
export interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'single_choice' | 'multiple_choice' | 'text';
  options?: QuestionOption[];
  correctAnswer?: string | string[];  // Option ID(s) for correct answer(s)
  correctTextAnswer?: string;         // For text questions - expected answer/keywords
  domain: string;  // e.g., "Data Classification", "Access Control", "Network Security"
  weight: number;  // 1-5 weight for scoring importance
  order?: number;  // Question order within domain
  required?: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;  // "Yes", "No", option text
  isCorrect?: boolean; // Whether this is a correct answer
}

export interface Answer {
  questionId: string;
  questionText: string;
  questionType: 'yes_no' | 'single_choice' | 'multiple_choice' | 'text';
  selectedOption?: string;        // For yes_no and single_choice
  selectedOptions?: string[];     // For multiple_choice
  textAnswer?: string;            // For text input
  isCorrect: boolean;             // Whether answer matches correct answer
  score: number;                  // Score achieved (weight if correct, 0 if wrong)
  maxScore: number;               // Maximum possible score (weight)
  weight: number;                 // Question weight
  domain: string;
  flaggedAsRisk: boolean;         // True if answer is wrong
  answeredAt?: string;
}

export interface DomainScore {
  domain: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionsAnswered: number;
  totalQuestions: number;
  risksIdentified: number;
}

export interface AssignedUser {
  id: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Activity {
  date: string;
  action: string;
  user: string;
}

export interface IdentifiedRisk {
  questionId: string;
  questionText: string;
  domain: string;
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  flaggedAt: string;
  addedToRiskRegister: boolean;
  riskId?: string;  // ID of created risk in risk register
}

// Assessment Timeline Entry
export interface AssessmentTimelineEntry {
  id: string;
  assessmentId: string;
  userId: string;
  userName: string;
  action: 'started' | 'in_progress' | 'completed' | 'risk_flagged' | 'report_generated';
  overallScore?: number;
  overallPercentage?: number;
  domainScores?: DomainScore[];
  risksIdentified?: number;
  timestamp: string;
  notes?: string;
}

// AI Report
export interface AIReport {
  id: string;
  assessmentId: string;
  submissionId: string;
  userId: string;
  generatedAt: string;
  overallScore: number;
  overallPercentage: number;
  domainScores: DomainScore[];
  executiveSummary: string;
  domainAnalysis: { domain: string; analysis: string; recommendations: string[] }[];
  risksummary: string;
  flaggedRisks: IdentifiedRisk[];
  recommendations: string[];
  conclusion: string;
}

