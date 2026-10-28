export type UserRole = 
  | 'INSTITUTION_USER' 
  | 'VERIFIER' 
  | 'APPROVING_AUTHORITY' 
  | 'ADMIN' 
  | 'AUDITOR';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution_id?: string | null;
  institution_name?: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface Institution {
  id: string;
  institution_code: string;
  legal_name: string;
  institution_type: string;
  address: string;
  state: string;
  contact_email: string;
  contact_phone: string;
  status: string;
}

export type FDRStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Returned for Clarification'
  | 'Discrepancy Flagged'
  | 'Verified / Active'
  | 'Renewal Pending'
  | 'Matured / Action Required'
  | 'Replaced / Superseded'
  | 'Release Pending'
  | 'Released / Closed'
  | 'Rejected';

export interface FDRItem {
  id: string;
  institution_id: string;
  institution_name?: string;
  institution_code?: string;
  fdr_number: string;
  normalized_reference?: string;
  bank_name_snapshot: string;
  amount: number;
  currency: string;
  issue_date: string;
  maturity_date: string;
  deposit_type: string;
  status: FDRStatus;
  verification_status: string;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  predecessor_instrument_id?: string | null;
  successor_instrument_id?: string | null;
}

export interface DocumentItem {
  id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  scan_status: string;
  version: number;
}

export interface VerificationCheck {
  id: string;
  check_type: string;
  submitted_value?: string;
  extracted_value?: string;
  result: 'PASS' | 'FAIL' | 'DISCREPANCY' | 'PENDING';
  evidence_source: string;
  evidence_reference?: string;
  checked_by: string;
  checked_at: string;
  notes?: string;
}

export interface ScrutinyObservation {
  id: string;
  author_id: string;
  author_name: string;
  category: 'MISMATCH' | 'MISSING_DATA' | 'DATE_ANOMALY' | 'CLARIFICATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_note?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface FDRDetail extends FDRItem {
  institution_address?: string;
  institution_state?: string;
  remarks?: string;
  version: number;
  predecessor?: { id: string; fdr_number: string; bank: string; amount: number; status: string } | null;
  successor?: { id: string; fdr_number: string; bank: string; amount: number; status: string } | null;
  documents: DocumentItem[];
  checks: VerificationCheck[];
  observations: ScrutinyObservation[];
}

export interface RequestCase {
  id: string;
  institution_id: string;
  institution_name?: string;
  institution_code?: string;
  instrument_id: string;
  fdr_number?: string;
  amount?: number;
  bank_name?: string;
  fdr_status?: string;
  request_type: 'RELEASE_REFUND' | 'RENEWAL_REPLACEMENT' | 'CLARIFICATION_RESPONSE';
  status: 'Submitted' | 'Under Scrutiny' | 'Returned for Clarification' | 'Under Decision' | 'Approved' | 'Rejected' | 'Completed / Released';
  reason: string;
  submitted_by: string;
  submitted_at: string;
  decided_by?: string;
  decided_at?: string;
  decision_reason?: string;
  completion_reference?: string;
  completed_at?: string;
  events?: {
    id: string;
    actor_name: string;
    event_type: string;
    from_status: string;
    to_status: string;
    comment?: string;
    created_at: string;
  }[];
}

export interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  delivery_status: string;
  read_at?: string | null;
  created_at: string;
}

export interface DashboardSummary {
  user_role: UserRole;
  total_fdrs: number;
  total_amount: number;
  active_verified_count: number;
  verification_backlog_count: number;
  clarification_count: number;
  overdue_count: number;
  due_today_count: number;
  approaching_maturity_count: number;
  release_requests_pending_count: number;
  maturity_horizon: {
    overdue: number;
    due_today: number;
    next_7_days: number;
    next_30_days: number;
    next_90_days: number;
  };
  urgent_alerts: NotificationItem[];
  recent_activity: {
    id: string;
    actor_name: string;
    actor_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    reason?: string;
    created_at: string;
  }[];
}

export interface AuditEvent {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json?: string;
  after_json?: string;
  reason?: string;
  created_at: string;
}
