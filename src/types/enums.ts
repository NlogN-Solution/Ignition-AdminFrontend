// Mirrors backend/app/models/enums.py exactly. Keep in sync by hand — no codegen yet.

export const UserRole = {
  STUDENT: "student",
  COUNSELLOR: "counsellor",
  FRONTDESK: "frontdesk",
  STAFF: "staff",
  FINANCE: "finance",
  MARKETING: "marketing",
  SUPPORT: "support",
  ADMISSIONS: "admissions",
  MANAGER: "manager",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Gender = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const UserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const EmploymentType = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract",
  INTERN: "intern",
  FREELANCE: "freelance",
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const AttendanceStatus = {
  PRESENT: "present",
  LATE: "late",
  HALF_DAY: "half_day",
  ON_LEAVE: "on_leave",
  HOLIDAY: "holiday",
  ABSENT: "absent",
  WEEKEND: "weekend",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const AttendanceSource = {
  WEB: "web",
  MANUAL: "manual",
} as const;
export type AttendanceSource = (typeof AttendanceSource)[keyof typeof AttendanceSource];

export const LeaveStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;
export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];

export const EmploymentEventType = {
  JOINED: "joined",
  PROMOTED: "promoted",
  DEPARTMENT_CHANGED: "department_changed",
  MANAGER_CHANGED: "manager_changed",
  DESIGNATION_CHANGED: "designation_changed",
  STATUS_CHANGED: "status_changed",
  PROBATION_COMPLETED: "probation_completed",
  CONTRACT_RENEWED: "contract_renewed",
  SALARY_CHANGED: "salary_changed",
  OTHER: "other",
} as const;
export type EmploymentEventType = (typeof EmploymentEventType)[keyof typeof EmploymentEventType];

export const PayrollRunStatus = {
  DRAFT: "draft",
  FINALIZED: "finalized",
  PAID: "paid",
} as const;
export type PayrollRunStatus = (typeof PayrollRunStatus)[keyof typeof PayrollRunStatus];

export const PayslipLineType = {
  ADDITION: "addition",
  DEDUCTION: "deduction",
} as const;
export type PayslipLineType = (typeof PayslipLineType)[keyof typeof PayslipLineType];

export const InstitutionType = {
  BACHELOR: "bachelor",
  DIPLOMA: "diploma",
  PLUS_TWO: "10+2",
  MASTERS: "masters",
} as const;
export type InstitutionType = (typeof InstitutionType)[keyof typeof InstitutionType];

export const LeadStatus = {
  NEW: "new",
  CONTACTED: "contacted",
  FOLLOW_UP: "follow_up",
  QUALIFIED: "qualified",
  CONVERTED: "converted",
  LOST: "lost",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadSource = {
  WEBSITE: "website",
  WALK_IN: "walk_in",
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  GOOGLE: "google",
  TIKTOK: "tiktok",
  LINKEDIN: "linkedin",
  WHATSAPP: "whatsapp",
  PHONE: "phone",
  REFERRAL: "referral",
  EVENT: "event",
  OTHER: "other",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const DocumentType = {
  PASSPORT: "passport",
  CITIZENSHIP: "citizenship",
  NATIONAL_ID: "national_id",
  ACADEMIC_TRANSCRIPT: "academic_transcript",
  ACADEMIC_CERTIFICATE: "academic_certificate",
  PROVISIONAL_CERTIFICATE: "provisional_certificate",
  CHARACTER_CERTIFICATE: "character_certificate",
  ENGLISH_TEST: "english_test",
  CV: "cv",
  STATEMENT_OF_PURPOSE: "statement_of_purpose",
  RECOMMENDATION_LETTER: "recommendation_letter",
  OFFER_LETTER: "offer_letter",
  VISA: "visa",
  FINANCIAL_DOCUMENT: "financial_document",
  MEDICAL_REPORT: "medical_report",
  PHOTO: "photo",
  OTHER: "other",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = {
  PENDING: "pending",
  UPLOADED: "uploaded",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const LeadActivityType = {
  LEAD_CREATED: "lead_created",
  CALL: "call",
  EMAIL: "email",
  WHATSAPP: "whatsapp",
  SMS: "sms",
  MEETING: "meeting",
  NOTE: "note",
  STATUS_CHANGED: "status_changed",
  ASSIGNED: "assigned",
  FOLLOW_UP: "follow_up",
  DOCUMENT_RECEIVED: "document_received",
  CONVERTED: "converted",
  LOST: "lost",
} as const;
export type LeadActivityType = (typeof LeadActivityType)[keyof typeof LeadActivityType];

export const ApplicationStatus = {
  DRAFT: "draft",
  DOCUMENTS_PENDING: "documents_pending",
  READY_TO_SUBMIT: "ready_to_submit",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  OFFER_RECEIVED: "offer_received",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_DECLINED: "offer_declined",
  VISA_PROCESSING: "visa_processing",
  VISA_APPROVED: "visa_approved",
  VISA_REJECTED: "visa_rejected",
  ENROLLED: "enrolled",
  WITHDRAWN: "withdrawn",
  REJECTED: "rejected",
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const AppointmentStatus = {
  REQUESTED: "requested",
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  RESCHEDULED: "rescheduled",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentType = {
  CONSULTATION: "consultation",
  DOCUMENT_REVIEW: "document_review",
  APPLICATION_REVIEW: "application_review",
  VISA_CONSULTATION: "visa_consultation",
  FOLLOW_UP: "follow_up",
  PHONE_CALL: "phone_call",
  VIDEO_CALL: "video_call",
  OFFICE_VISIT: "office_visit",
  OTHER: "other",
} as const;
export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType];

export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskType = {
  FOLLOW_UP: "follow_up",
  DOCUMENT_COLLECTION: "document_collection",
  DOCUMENT_VERIFICATION: "document_verification",
  APPLICATION_SUBMISSION: "application_submission",
  VISA_PROCESSING: "visa_processing",
  PAYMENT_FOLLOW_UP: "payment_follow_up",
  APPOINTMENT: "appointment",
  CALL: "call",
  EMAIL: "email",
  OTHER: "other",
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const PaymentStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  ESEWA: "esewa",
  KHALTI: "khalti",
  FONEPAY: "fonepay",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  OTHER: "other",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const NotificationType = {
  SYSTEM: "system",
  APPLICATION: "application",
  PAYMENT: "payment",
  APPOINTMENT: "appointment",
  TASK: "task",
  DOCUMENT: "document",
  LEAD: "lead",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationChannel = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const DegreeLevel = {
  CERTIFICATE: "certificate",
  DIPLOMA: "diploma",
  ADVANCED_DIPLOMA: "advanced_diploma",
  BACHELOR: "bachelor",
  POSTGRADUATE_DIPLOMA: "postgraduate_diploma",
  MASTER: "master",
  DOCTORATE: "doctorate",
} as const;
export type DegreeLevel = (typeof DegreeLevel)[keyof typeof DegreeLevel];

export const EnglishTestType = {
  IELTS: "ielts",
  PTE: "pte",
  TOEFL: "toefl",
  DUOLINGO: "duolingo",
  OTHER: "other",
} as const;
export type EnglishTestType = (typeof EnglishTestType)[keyof typeof EnglishTestType];

export const WorkflowStepStatus = {
  PENDING: "pending",
  CURRENT: "current",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
  CANCELLED: "cancelled",
} as const;
export type WorkflowStepStatus = (typeof WorkflowStepStatus)[keyof typeof WorkflowStepStatus];

export const WorkflowActivityType = {
  CREATED: "created",
  STATUS_CHANGED: "status_changed",
  NOTE_ADDED: "note_added",
  ASSIGNED: "assigned",
  DOCUMENT_LINKED: "document_linked",
  COMMENT: "comment",
} as const;
export type WorkflowActivityType = (typeof WorkflowActivityType)[keyof typeof WorkflowActivityType];

export const ApplicationWorkflowStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export type ApplicationWorkflowStatus = (typeof ApplicationWorkflowStatus)[keyof typeof ApplicationWorkflowStatus];

export const ChecklistItemStatus = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  VERIFIED: "verified",
  REJECTED: "rejected",
  WAIVED: "waived",
} as const;
export type ChecklistItemStatus = (typeof ChecklistItemStatus)[keyof typeof ChecklistItemStatus];

export const LeadPriority = {
  HOT: "hot",
  WARM: "warm",
  COLD: "cold",
} as const;
export type LeadPriority = (typeof LeadPriority)[keyof typeof LeadPriority];

export const FollowUpMethod = {
  PHONE_CALL: "phone_call",
  WHATSAPP: "whatsapp",
  EMAIL: "email",
  SMS: "sms",
  IN_PERSON: "in_person",
  VIDEO_MEETING: "video_meeting",
} as const;
export type FollowUpMethod = (typeof FollowUpMethod)[keyof typeof FollowUpMethod];

export const FollowUpOutcome = {
  NO_ANSWER: "no_answer",
  BUSY: "busy",
  CALL_BACK_LATER: "call_back_later",
  INTERESTED: "interested",
  VERY_INTERESTED: "very_interested",
  DOCUMENTS_PENDING: "documents_pending",
  THINKING: "thinking",
  WRONG_NUMBER: "wrong_number",
  NOT_ELIGIBLE: "not_eligible",
  DUPLICATE: "duplicate",
  CONVERTED_TO_PROSPECT: "converted_to_prospect",
  CONVERTED_TO_CLIENT: "converted_to_client",
} as const;
export type FollowUpOutcome = (typeof FollowUpOutcome)[keyof typeof FollowUpOutcome];

export const LostReason = {
  NO_RESPONSE_AFTER_7_ATTEMPTS: "no_response_after_7_attempts",
  NOT_INTERESTED: "not_interested",
  BUDGET_ISSUE: "budget_issue",
  CHOSE_ANOTHER_CONSULTANCY: "chose_another_consultancy",
  WRONG_NUMBER: "wrong_number",
  INVALID_LEAD: "invalid_lead",
  NOT_ELIGIBLE: "not_eligible",
  DUPLICATE_LEAD: "duplicate_lead",
  OTHER: "other",
} as const;
export type LostReason = (typeof LostReason)[keyof typeof LostReason];

export const ConversionSource = {
  AGREEMENT_SIGNED: "agreement_signed",
  SERVICE_PURCHASED: "service_purchased",
  REGISTRATION_COMPLETED: "registration_completed",
  PAYMENT_RECEIVED: "payment_received",
  OTHER: "other",
} as const;
export type ConversionSource = (typeof ConversionSource)[keyof typeof ConversionSource];
