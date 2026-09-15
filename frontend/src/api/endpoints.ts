import { apiClient, TOKEN_STORAGE_KEY } from "./client";
import type {
  Assignment,
  ChatAskResponse,
  GuidelineDocument,
  User,
  UserRole,
} from "../types";

export async function login(email: string, password: string): Promise<string> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const { data } = await apiClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
  return data.access_token as string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  student_number?: string;
  school_name?: string;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post("/auth/register", payload);
  return data as User;
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get("/auth/me");
  return data as User;
}

export function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function listAssignments(): Promise<Assignment[]> {
  const { data } = await apiClient.get("/assignments");
  return data as Assignment[];
}

export async function getAssignment(id: number): Promise<Assignment> {
  const { data } = await apiClient.get(`/assignments/${id}`);
  return data as Assignment;
}

export interface AssignmentPayload {
  subject: string;
  title: string;
  description?: string;
  ai_policy_level: string;
  policy_detail?: string;
  due_date?: string | null;
}

export async function createAssignment(
  payload: AssignmentPayload
): Promise<Assignment> {
  const { data } = await apiClient.post("/assignments", payload);
  return data as Assignment;
}

export async function agreeToAssignment(id: number) {
  const { data } = await apiClient.post(`/assignments/${id}/consent`);
  return data;
}

export async function getCurrentDashboardAssignment(): Promise<Assignment | null> {
  const { data } = await apiClient.get("/dashboard/current-assignment");
  return data as Assignment | null;
}

export async function listGuidelines(): Promise<GuidelineDocument[]> {
  const { data } = await apiClient.get("/guidelines");
  return data as GuidelineDocument[];
}

export async function uploadGuideline(
  title: string,
  source: string,
  version: string,
  file: File
): Promise<{ document: GuidelineDocument; clause_count: number }> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("source", source);
  if (version) formData.append("version", version);
  formData.append("file", file);
  const { data } = await apiClient.post("/guidelines/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function askChatbot(question: string): Promise<ChatAskResponse> {
  const { data } = await apiClient.post("/chatbot/ask", { question });
  return data as ChatAskResponse;
}
