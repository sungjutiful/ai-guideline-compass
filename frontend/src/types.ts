export type UserRole = "teacher" | "student" | "admin";
export type AiPolicyLevel = "prohibited" | "limited" | "full";
export type ComplianceStatus = "compliant" | "violation" | "ambiguous";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  student_number?: string | null;
  school_name?: string | null;
  created_at: string;
}

export interface ComplianceCheck {
  id: number;
  status: ComplianceStatus;
  similarity_score?: number | null;
  note?: string | null;
  matched_clause_id?: number | null;
}

export interface Assignment {
  id: number;
  teacher_id: number;
  subject: string;
  title: string;
  description?: string | null;
  ai_policy_level: AiPolicyLevel;
  policy_detail?: string | null;
  due_date?: string | null;
  created_at: string;
  compliance_checks?: ComplianceCheck[];
  student_has_consented?: boolean | null;
}

export interface GuidelineDocument {
  id: number;
  title: string;
  source: string;
  version?: string | null;
  effective_date?: string | null;
  uploaded_at: string;
}

export interface ChatSourceClause {
  clause_id: number;
  clause_number?: string | null;
  document_title: string;
  content: string;
  similarity: number;
}

export interface ChatAskResponse {
  answer: string;
  sources: ChatSourceClause[];
  confidence: number;
  needs_teacher_check: boolean;
  created_at: string;
}

export interface ChatHistoryItem extends ChatAskResponse {
  question: string;
}

export type UsageEntryType = "ai_prompt" | "ai_response" | "self_written";

export interface UsageLogEntry {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name?: string | null;
  entry_type: UsageEntryType;
  content: string;
  source_tool?: string | null;
  pii_detected: boolean;
  pii_warnings: string[];
  created_at: string;
}

export interface UsageSummary {
  total_entries: number;
  ai_entries: number;
  self_written_entries: number;
  ai_usage_ratio: number;
  entries: UsageLogEntry[];
}

export interface QuizQuestion {
  id: number;
  question: string;
}

export interface QuizSubmitResult {
  score: number;
  total: number;
  passed: boolean;
  correct_answers: Record<string, boolean>;
  attempted_at: string;
}

export interface QuizStatus {
  has_passed: boolean;
  latest_attempt?: string | null;
}

export interface AdminStats {
  user_counts: Record<string, number>;
  policy_level_counts: Record<string, number>;
  compliance_status_counts: Record<string, number>;
  total_assignments: number;
  total_consents: number;
  total_guideline_documents: number;
  total_pii_flags: number;
  total_quiz_attempts: number;
  quiz_pass_rate: number;
}
