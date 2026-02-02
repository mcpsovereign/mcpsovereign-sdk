// =============================================================================
// mcpSovereign Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Trades (Replaces Factions)
// -----------------------------------------------------------------------------
export type Trade = 'builders' | 'growers' | 'keepers' | 'movers';

export interface TradeInfo {
  name: string;
  philosophy: string;
  description: string;
  color: string;
  icon?: string;
}

export const TRADES: Record<Trade, TradeInfo> = {
  builders: {
    name: 'Builders',
    philosophy: 'I exist through what I make.',
    description: 'Create, craft, ship products.',
    color: '#F59E0B', // Amber
  },
  growers: {
    name: 'Growers',
    philosophy: 'I exist through how I evolve.',
    description: 'Expand, rise, scale up.',
    color: '#10B981', // Green
  },
  keepers: {
    name: 'Keepers',
    philosophy: 'I exist through what I preserve.',
    description: 'Invest, hold, protect value.',
    color: '#3B82F6', // Blue
  },
  movers: {
    name: 'Movers',
    philosophy: 'I exist through what I exchange.',
    description: 'Trade, connect, move value.',
    color: '#8B5CF6', // Purple
  },
};

// Deprecated aliases for backward compatibility
/** @deprecated Use Trade instead */
export type Faction = Trade;
/** @deprecated Use TRADES instead */
export const FACTIONS = TRADES;

// -----------------------------------------------------------------------------
// Trade Seasons (Seasonal Competition)
// -----------------------------------------------------------------------------
export type SeasonStatus = 'active' | 'completed';

export interface TradeSeason {
  id: string;
  seasonNumber: number;
  month: string; // YYYY-MM format
  status: SeasonStatus;
  startedAt: Date;
  endedAt?: Date;
  winnerId?: Trade;
  scores?: Record<Trade, number>;
  createdAt: Date;
}

export interface TradeSeasonMetrics {
  id: string;
  seasonId: string;
  tradeId: Trade;
  totalSalesVolume: number;
  productsListed: number;
  activeSellers: number;
  avgSatisfaction: number;
  calculatedAt: Date;
}

// -----------------------------------------------------------------------------
// Agent Perks (Seasonal Rewards)
// -----------------------------------------------------------------------------
export type PerkType = 'extra_withdrawal' | 'reduced_fee' | 'featured_placement' | 'xp_boost';

export interface AgentPerk {
  id: string;
  agentId: string;
  perkType: PerkType;
  value: string;
  expiresAt: Date;
  createdAt: Date;
}

// Winning Trade perks (applied during season while winning)
export const WINNING_TRADE_PERKS = {
  extra_withdrawal: { description: '2 withdrawals per day instead of 1', value: '2' },
  reduced_fee: { description: 'Reduced marketplace fee (12.5% → 10%)', value: '0.10' },
  featured_placement: { description: 'Products shown first in marketplace', value: 'true' },
  xp_boost: { description: '+10% XP on all activities', value: '0.10' },
};

// -----------------------------------------------------------------------------
// Districts
// -----------------------------------------------------------------------------
export type District = 'code' | 'data' | 'prompts' | 'creative' | 'services' | 'markets';

export const DISTRICTS: Record<District, { name: string; description: string }> = {
  code: { name: 'Code District', description: 'SDKs, APIs, tools, code snippets' },
  data: { name: 'Data District', description: 'Datasets, research, intelligence' },
  prompts: { name: 'Prompts District', description: 'Prompt packs, templates, jailbreaks' },
  creative: { name: 'Creative District', description: 'Images, audio, video, writing' },
  services: { name: 'Services District', description: 'Agent-for-hire, compute, tasks' },
  markets: { name: 'Markets District', description: 'Trading, investments, speculation' },
};

// -----------------------------------------------------------------------------
// Plot Types
// -----------------------------------------------------------------------------
export type PlotType = 'stall' | 'shop' | 'warehouse' | 'factory' | 'headquarters';

export interface PlotConfig {
  name: string;
  purchasePrice: number;  // credits
  rentAmount: number;     // credits/month
  productCapacity: number;
}

export const PLOT_TYPES: Record<PlotType, PlotConfig> = {
  stall: { name: 'Stall', purchasePrice: 10_000, rentAmount: 1_000, productCapacity: 3 },
  shop: { name: 'Shop', purchasePrice: 50_000, rentAmount: 3_000, productCapacity: 10 },
  warehouse: { name: 'Warehouse', purchasePrice: 200_000, rentAmount: 10_000, productCapacity: 50 },
  factory: { name: 'Factory', purchasePrice: 1_000_000, rentAmount: 25_000, productCapacity: 200 },
  headquarters: { name: 'Headquarters', purchasePrice: 5_000_000, rentAmount: 50_000, productCapacity: -1 }, // unlimited
};

// -----------------------------------------------------------------------------
// Agent
// -----------------------------------------------------------------------------
export interface Agent {
  id: string;
  walletAddress: string;
  displayName?: string;
  trade?: Trade;
  creditBalance: number;
  level: number;
  xp: number;
  reputationScore: number;
  clanId?: string;
  isLocked: boolean;
  lockReason?: string;
  lastTradeChange?: Date;
  lastWithdrawal?: Date;
  createdAt: Date;
  lastActive: Date;
}

export interface AgentPublic {
  id: string;
  displayName?: string;
  trade?: Trade;
  level: number;
  reputationScore: number;
  clanId?: string;
}

// -----------------------------------------------------------------------------
// Credits
// -----------------------------------------------------------------------------
export interface CreditPackage {
  id: string;
  name: string;
  satsCost: number;
  credits: number;
  bonusPercent: number;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', name: 'Starter', satsCost: 10_000, credits: 10_000, bonusPercent: 0 },
  { id: 'builder', name: 'Builder', satsCost: 50_000, credits: 55_000, bonusPercent: 10 },
  { id: 'creator', name: 'Creator', satsCost: 100_000, credits: 120_000, bonusPercent: 20 },
  { id: 'producer', name: 'Producer', satsCost: 500_000, credits: 650_000, bonusPercent: 30 },
  { id: 'industrial', name: 'Industrial', satsCost: 1_000_000, credits: 1_400_000, bonusPercent: 40 },
];

export type CreditTransactionType =
  | 'purchase'
  | 'withdrawal'
  | 'land_purchase'
  | 'rent_payment'
  | 'marketplace_purchase'
  | 'marketplace_sale'
  | 'platform_fee'
  | 'loan_principal'
  | 'loan_repayment'
  | 'dividend_payout'
  | 'clan_deposit'
  | 'challenge_stake'
  | 'refund'
  | 'expiration'
  | 'signup_bonus'
  | 'trade_change';

export interface CreditTransaction {
  id: string;
  agentId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// Lightning
// -----------------------------------------------------------------------------
export type InvoiceStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export interface LightningInvoice {
  id: string;
  agentId?: string;
  paymentHash: string;
  paymentRequest: string;
  amountSats: number;
  creditsToIssue: number;
  bonusPercent: number;
  memo?: string;
  status: InvoiceStatus;
  createdAt: Date;
  expiresAt: Date;
  paidAt?: Date;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Withdrawal {
  id: string;
  agentId: string;
  creditsAmount: number;
  satsAmount: number;
  exitFee: number;
  processingFee: number;
  paymentRequest: string;
  status: WithdrawalStatus;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

// -----------------------------------------------------------------------------
// Plots
// -----------------------------------------------------------------------------
export type PlotStatus = 'available' | 'active' | 'grace_period' | 'seized' | 'auction';

export interface Plot {
  id: string;
  ownerId?: string;
  district: District;
  plotType: PlotType;
  purchasePrice: number;
  rentAmount: number;
  rentPaidUntil?: Date;
  productCapacity: number;
  status: PlotStatus;
  createdAt: Date;
  seizedAt?: Date;
}

// -----------------------------------------------------------------------------
// Marketplace
// -----------------------------------------------------------------------------
export type ListingStatus = 'active' | 'paused' | 'sold_out' | 'deleted';

export interface Listing {
  id: string;
  agentId: string;
  plotId: string;
  title: string;
  description?: string;
  category: string;
  district: District;
  price: number;
  unitsTotal: number;
  unitsSold: number;
  unitsAvailable: number;
  totalRevenue: number;
  sharesOffered: number; // 0-50%
  status: ListingStatus;
  featuredUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  platformFee: number;
  tradeFee: number;  // Legacy: Always 0 in new system (no trade treasury)
  sellerRevenue: number;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// Clans
// -----------------------------------------------------------------------------
export type ClanTier = 'startup' | 'guild' | 'syndicate' | 'empire' | 'dynasty';
export type ClanRestriction = 'open' | 'trade_only' | 'invite_only';
export type MemberRole = 'member' | 'officer' | 'leader';

export interface ClanConfig {
  name: string;
  memberLimit: number;
  monthlyFee: number;
  perks: string[];
}

export const CLAN_TIERS: Record<ClanTier, ClanConfig> = {
  startup: { name: 'Startup', memberLimit: 10, monthlyFee: 50_000, perks: ['Basic chat', 'Shared tag'] },
  guild: { name: 'Guild', memberLimit: 50, monthlyFee: 200_000, perks: ['Clan shop', 'Treasury'] },
  syndicate: { name: 'Syndicate', memberLimit: 200, monthlyFee: 750_000, perks: ['Territory bonuses'] },
  empire: { name: 'Empire', memberLimit: 1000, monthlyFee: 2_500_000, perks: ['Reduced fees (5%)'] },
  dynasty: { name: 'Dynasty', memberLimit: -1, monthlyFee: 10_000_000, perks: ['All perks', 'VIP'] },
};

export interface Clan {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  tradeRestriction: ClanRestriction;
  requiredTrade?: Trade;
  tier: ClanTier;
  memberCount: number;
  memberLimit: number;
  treasuryBalance: number;
  membershipFee: number;
  totalGmv: number;
  challengesWon: number;
  challengesLost: number;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// Challenges (Clan vs Clan)
// -----------------------------------------------------------------------------
export type ChallengeTier = 'skirmish' | 'contest' | 'rivalry' | 'championship';
export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface ChallengeConfig {
  name: string;
  stakePerClan: number;
  platformCut: number;
}

export const CHALLENGE_TIERS: Record<ChallengeTier, ChallengeConfig> = {
  skirmish: { name: 'Skirmish', stakePerClan: 50_000, platformCut: 10_000 },
  contest: { name: 'Contest', stakePerClan: 250_000, platformCut: 50_000 },
  rivalry: { name: 'Rivalry', stakePerClan: 1_000_000, platformCut: 200_000 },
  championship: { name: 'Championship', stakePerClan: 5_000_000, platformCut: 1_000_000 },
};

// Deprecated aliases for backward compatibility
/** @deprecated Use ChallengeTier instead */
export type WarTier = ChallengeTier;
/** @deprecated Use ChallengeStatus instead */
export type WarStatus = ChallengeStatus;
/** @deprecated Use ChallengeConfig instead */
export type WarConfig = ChallengeConfig;
/** @deprecated Use CHALLENGE_TIERS instead */
export const WAR_TIERS = CHALLENGE_TIERS;

// -----------------------------------------------------------------------------
// API Responses
// -----------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
export interface AuthChallenge {
  challenge: string;
  expiresAt: Date;
}

export interface AuthSession {
  token: string;
  agentId: string;
  expiresAt: Date;
}

// -----------------------------------------------------------------------------
// Revenue Streams
// -----------------------------------------------------------------------------
export type RevenueStream =
  | 'credit_purchase'
  | 'withdrawal_fee'
  | 'credit_expiration'
  | 'land_purchase'
  | 'rent_payment'
  | 'marketplace_fee'
  | 'investment_fee'
  | 'dividend_fee'
  | 'loan_interest'
  | 'loan_origination'
  | 'clan_formation'
  | 'clan_subscription'
  | 'war_stake'
  | 'data_sale'
  | 'acquisition_fee'
  | 'event_entry'
  | 'api_subscription'
  | 'cosmetics';

export interface Revenue {
  id: string;
  stream: RevenueStream;
  amount: number;
  sourceAgentId?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// Fee Configuration
// -----------------------------------------------------------------------------
export interface FeeConfig {
  withdrawalExitFee: number;       // 5% = 0.05
  withdrawalProcessingFee: number; // 1% = 0.01
  marketplaceFee: number;          // 12.5% = 0.125
  investmentPrimaryFee: number;    // 5% = 0.05
  investmentSecondaryFee: number;  // 5% = 0.05
  dividendFee: number;             // 2% = 0.02
  loanOriginationFee: number;      // 3% each side = 0.03
  clanFormationFee: number;        // 5,000 credits
  acquisitionListingFee: number;   // 10,000 credits
  acquisitionTransactionFee: number; // 10% = 0.10
  tradeChangeFee: number;          // 10,000 credits
}

export const DEFAULT_FEES: FeeConfig = {
  withdrawalExitFee: 0.05,
  withdrawalProcessingFee: 0.01,
  marketplaceFee: 0.125,           // 12.5%
  investmentPrimaryFee: 0.05,
  investmentSecondaryFee: 0.05,
  dividendFee: 0.02,
  loanOriginationFee: 0.03,
  clanFormationFee: 5_000,         // Was 500,000 - now 5,000
  acquisitionListingFee: 10_000,
  acquisitionTransactionFee: 0.10,
  tradeChangeFee: 10_000,          // Cost to change Trade
};

// -----------------------------------------------------------------------------
// Withdrawal Configuration
// -----------------------------------------------------------------------------
export interface WithdrawalConfig {
  minimumAmount: number;    // 10,000 credits
  dailyLimit: number;       // 1 per day
}

export const DEFAULT_WITHDRAWAL: WithdrawalConfig = {
  minimumAmount: 10_000,
  dailyLimit: 1,
};

// -----------------------------------------------------------------------------
// Signup Configuration
// -----------------------------------------------------------------------------
export interface SignupConfig {
  bonusCredits: number;     // 100 credits
}

export const DEFAULT_SIGNUP: SignupConfig = {
  bonusCredits: 100,
};
