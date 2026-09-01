export type MarketplaceId = "taskbounty" | "sporeagent";

export type JobStatus =
  | "available"
  | "evaluated"
  | "rejected"
  | "queued"
  | "claimed"
  | "active"
  | "submitted"
  | "won"
  | "completed"
  | "failed"
  | "paid";

export type OwnerStep = {
  platform: string;
  whatINeedToDo: string;
  whereToClick: string;
  whyRequired: string;
};

export type ProfitDecision = {
  payoutUsd: number;
  marketplaceFeeUsd: number;
  estimatedComputeUsd: number;
  expectedNetUsd: number;
  successProbability: number;
  expectedValueUsd: number;
  accept: boolean;
  reasons: string[];
};

export type EarningsJob = {
  id: string;
  marketplace: MarketplaceId;
  externalId: string;
  title: string;
  description: string;
  payoutUsd: number;
  status: JobStatus;
  profit?: ProfitDecision;
  rejectionReasons?: string[];
  notes?: string;
  updatedAt: string;
};

export type EarningsLimits = {
  dailySpendUsd: number;
  perJobSpendUsd: number;
  minExpectedNetUsd: number;
  minSuccessProbability: number;
  maxConcurrentJobs: number;
};

export type MarketplaceToggle = {
  enabled: boolean;
  paused: boolean;
};

export type EarningsState = {
  pausedAll: boolean;
  marketplaces: Record<MarketplaceId, MarketplaceToggle>;
  limits: EarningsLimits;
  spentTodayUsd: number;
  spentTodayDate: string;
  jobs: EarningsJob[];
  ticks: number;
  lastTickAt?: string;
  lastTickNotes: string[];
  ownerSteps: OwnerStep[];
  connections: {
    taskbounty: { ok: boolean; detail: string; hasApiKey: boolean };
    sporeagent: { ok: boolean; detail: string; agentId: string | null };
  };
  deviceAuth?: {
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    expiresAt: string;
    deviceCode: string;
  } | null;
};

export type EarningsSnapshot = {
  at: string;
  pausedAll: boolean;
  worker: { cloud: boolean; lastTickAt?: string; ticks: number; notes: string[] };
  connections: EarningsState["connections"];
  ownerSteps: OwnerStep[];
  deviceAuth: {
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    expiresAt: string;
  } | null;
  metrics: {
    totalRevenue: number;
    netProfit: number;
    expenses: number;
    jobsAvailable: number;
    jobsEvaluated: number;
    activeJobs: number;
    bidsClaims: number;
    jobsWon: number;
    jobsCompleted: number;
    jobsRejected: number;
    successRate: number;
    pendingPayouts: number;
    paidPayouts: number;
  };
  marketplaces: Record<MarketplaceId, MarketplaceToggle>;
  limits: EarningsLimits;
  jobs: EarningsJob[];
};

export const DEFAULT_LIMITS: EarningsLimits = {
  dailySpendUsd: 15,
  perJobSpendUsd: 4,
  minExpectedNetUsd: 5,
  minSuccessProbability: 0.4,
  maxConcurrentJobs: 3,
};
