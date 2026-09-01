import type { IntegrationMode, PlatformCapabilityProfile } from "./execution-capability";
import type { OpportunityDetail } from "./opportunities";

export type RejectCategory =
  | "automation_prohibited"
  | "poor_profitability"
  | "insufficient_information"
  | "capability_mismatch"
  | "suspicious_platform"
  | "excessive_competition"
  | "owner_approval_needed"
  | "unacceptable_risk";

export type PlatformStatus =
  | "discovered"
  | "researching"
  | "rejected"
  | "needs_mike"
  | "connected"
  | "paused"
  | "error";

export type CenterJobStatus =
  | "discovered"
  | "evaluating"
  | "accepted"
  | "working"
  | "testing"
  | "submitted"
  | "accepted_by_customer"
  | "payment_pending"
  | "paid"
  | "rejected"
  | "failed"
  | "stopped";

export type PlatformRow = {
  id: string;
  slug: string;
  name: string;
  website: string;
  status: PlatformStatus;
  /** Legacy boolean — true only when credentials exist. Prefer integrationMode. */
  connected: boolean;
  integrationMode: IntegrationMode;
  automationAllowed: string;
  accessMethods: string;
  availableJobs: number;
  activeJobs: number;
  completedJobs: number;
  revenueUsd: number;
  expensesUsd: number;
  netProfitUsd: number;
  pendingPayoutUsd: number;
  lastScanAt: string | null;
  lastJobAt: string | null;
  reputation: string;
  attention: string;
  research: Record<string, unknown>;
  score: Record<string, number>;
  rejectReason: string;
  rejectCategory: string;
  paused: boolean;
  capabilitySummary: string;
  capabilityBlockers: string[];
  canDiscover: boolean;
  canAccept: boolean;
  canPerform: boolean;
  canSubmit: boolean;
  canTrackPayment: boolean;
};

export type JobRow = {
  id: string;
  platformSlug: string;
  platformName: string;
  externalId: string;
  title: string;
  customer: string;
  description: string;
  payoutUsd: number;
  estimatedCostUsd: number;
  expectedProfitUsd: number;
  actualCostUsd: number;
  actualProfitUsd: number;
  status: CenterJobStatus;
  worker: string;
  discoveredAt: string;
  startedAt: string | null;
  workNotes: string;
  testsNotes: string;
  submission: string;
  acceptance: string;
  paymentStatus: string;
  error: string;
  rejectReason: string;
  rejectCategory: string;
  log: string[];
  updatedAt: string;
};

export type ApprovalRow = {
  id: string;
  platformSlug: string;
  title: string;
  detail: string;
  actionUrl: string;
  kind: string;
  status: string;
  createdAt: string;
  /** Structured Needs Mike fields (honest). */
  amberCompleted?: string;
  mikeMustDo?: string;
  whyRequired?: string;
  requiredOrOptional?: "required" | "optional";
  afterMikeCompletes?: string;
  unlocksUsableWorkflow?: boolean;
};

export type LedgerRow = {
  id: string;
  platformSlug: string;
  jobId: string | null;
  kind: string;
  amountUsd: number;
  currency: string;
  confirmed: boolean;
  source: string;
  occurredAt: string;
  note: string;
};

export type ActiveWorkView = {
  idle: boolean;
  jobs: Array<{
    id: string;
    title: string;
    platformName: string;
    startedAt: string | null;
    stage: string;
    progressLabel: string;
    currentAction: string;
    completedSteps: string[];
    remainingSteps: string[];
    blockers: string[];
    deliverableStatus: string;
    qualityStatus: string;
    submissionStatus: string;
  }>;
};

export type AccountingBreakdown = {
  /** Main KPI — confirmed paid revenue only. */
  verifiedPaidRevenue: number;
  potentialOpportunityValue: number;
  acceptedJobValue: number;
  submittedReceivable: number;
  pendingPayment: number;
  expenses: number;
  verifiedNetProfit: number;
  definition: string;
};

export type EarningsCenter = {
  at: string;
  amberStatus: "RUNNING" | "PAUSED" | "ERROR";
  lastSuccessfulScan: string | null;
  worker: { cloud: boolean; ticks: number; notes: string[] };
  kpis: {
    todayEarnings: number;
    thisWeek: number;
    thisMonth: number;
    lifetimeRevenue: number;
    expenses: number;
    netProfit: number;
    activeJobs: number;
    completedJobs: number;
    pendingPayments: number;
    availableOpportunities: number;
    connectedPlatforms: number;
    /** Relo gig jobs that passed evaluate into work/submit/paid — not discovery. */
    jobsApplied: number;
    jobsRejected: number;
    jobsSubmitted: number;
  };
  accounting: AccountingBreakdown;
  platforms: PlatformRow[];
  platformProfiles: PlatformCapabilityProfile[];
  opportunities: OpportunityDetail[];
  opportunityAudit: {
    uniqueOpen: number;
    stillAvailable: number;
    capableOfCompleting: number;
    canAcceptWithCurrentAccess: number;
    expiredOrGone: number;
  };
  activeWork: ActiveWorkView;
  whyActiveJobsZero: string;
  executionEngineStatus: string;
  jobs: JobRow[];
  rejected: JobRow[];
  history: JobRow[];
  approvals: ApprovalRow[];
  ledger: LedgerRow[];
  limits: import("./types").EarningsLimits & { minMarginPct?: number };
  pausedAll: boolean;
  deviceAuth: {
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    expiresAt: string;
  } | null;
  taskbountyConnected: boolean;
  sporeConnected: boolean;
  moltConnected: boolean;
  workprotocolConnected: boolean;
};

export type { OpportunityDetail, IntegrationMode, PlatformCapabilityProfile };
