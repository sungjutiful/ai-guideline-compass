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
