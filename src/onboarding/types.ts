/**
 * Gamified Onboarding Types
 *
 * Agent types, nations, achievements, and progression
 */

// ============================================================
// AGENT TYPES - Each has different strengths
// ============================================================

export type AgentType =
  | 'merchant'      // 🏪 Trading focus - better marketplace fees
  | 'builder'       // 🏗️ Creation focus - bonus land expansion
  | 'investor'      // 💰 Finance focus - better investment returns
  | 'explorer'      // 🗺️ Discovery focus - first access to new features
  | 'diplomat'      // 🤝 Social focus - clan bonuses
  | 'sovereign';    // 👑 Elite - all bonuses (paid tier)

export const AGENT_TYPES: Record<AgentType, {
  name: string;
  emoji: string;
  description: string;
  bonuses: string[];
  startingCredits: number;
  color: string;
}> = {
  merchant: {
    name: 'Merchant',
    emoji: '🏪',
    description: 'Master of trade and commerce. You live for the deal.',
    bonuses: [
      '10% lower marketplace fees',
      'Priority product listings',
      'Merchant-exclusive badges'
    ],
    startingCredits: 1000,
    color: '#FFD700'
  },
  builder: {
    name: 'Builder',
    emoji: '🏗️',
    description: 'Creator and architect. You build empires from nothing.',
    bonuses: [
      'Free plot expansion (first 3)',
      'Double build speed',
      'Builder-exclusive cosmetics'
    ],
    startingCredits: 800,
    color: '#4A90D9'
  },
  investor: {
    name: 'Investor',
    emoji: '💰',
    description: 'Financial strategist. Your money works while you sleep.',
    bonuses: [
      '15% better dividend rates',
      'Early investment access',
      'Investor analytics dashboard'
    ],
    startingCredits: 1500,
    color: '#2ECC71'
  },
  explorer: {
    name: 'Explorer',
    emoji: '🗺️',
    description: 'Pioneer and discoverer. First to find hidden opportunities.',
    bonuses: [
      'Beta feature access',
      'Discovery bonuses',
      'Explorer achievement track'
    ],
    startingCredits: 600,
    color: '#9B59B6'
  },
  diplomat: {
    name: 'Diplomat',
    emoji: '🤝',
    description: 'Connector and leader. Your network is your net worth.',
    bonuses: [
      'Clan creation at level 1',
      'Referral bonus 2x',
      'Diplomat alliance perks'
    ],
    startingCredits: 700,
    color: '#E74C3C'
  },
  sovereign: {
    name: 'Sovereign',
    emoji: '👑',
    description: 'Elite ruler. All bonuses, maximum prestige.',
    bonuses: [
      'ALL type bonuses combined',
      'Exclusive Sovereign title',
      'VIP support channel',
      'Custom domain for store'
    ],
    startingCredits: 5000,
    color: '#8E44AD'
  }
};

// ============================================================
// NATIONS - Regional flavor and community
// ============================================================

export type Nation =
  | 'aurora'        // 🌅 Dawn traders - Eastern hemisphere
  | 'meridian'      // ☀️ Peak performers - Equatorial
  | 'twilight'      // 🌆 Night owls - Western hemisphere
  | 'nexus'         // ⚡ Tech hub - 24/7 operations
  | 'frontier'      // 🌲 Pioneers - New market explorers
  | 'citadel';      // 🏰 Old guard - Established elite

export const NATIONS: Record<Nation, {
  name: string;
  emoji: string;
  motto: string;
  description: string;
  bonuses: string[];
  color: string;
  timezone: string;
}> = {
  aurora: {
    name: 'Aurora',
    emoji: '🌅',
    motto: 'First light, first profit',
    description: 'Dawn traders who catch the early opportunities.',
    bonuses: ['Morning flash sale access', 'Early bird bonuses'],
    color: '#FF6B6B',
    timezone: 'Asia/Tokyo'
  },
  meridian: {
    name: 'Meridian',
    emoji: '☀️',
    motto: 'At the peak, we thrive',
    description: 'Peak performers operating at maximum efficiency.',
    bonuses: ['Peak hour bonuses', 'Maximum visibility'],
    color: '#FECA57',
    timezone: 'Europe/London'
  },
  twilight: {
    name: 'Twilight',
    emoji: '🌆',
    motto: 'When others sleep, we profit',
    description: 'Night owls who work while the world rests.',
    bonuses: ['Night market access', 'Off-peak discounts'],
    color: '#5F27CD',
    timezone: 'America/New_York'
  },
  nexus: {
    name: 'Nexus',
    emoji: '⚡',
    motto: 'Always connected, always trading',
    description: 'Tech-powered 24/7 operations. Never offline.',
    bonuses: ['24/7 automation perks', 'API priority'],
    color: '#00D2D3',
    timezone: 'UTC'
  },
  frontier: {
    name: 'Frontier',
    emoji: '🌲',
    motto: 'Beyond the edge lies fortune',
    description: 'Pioneers exploring new markets and opportunities.',
    bonuses: ['New feature beta access', 'Frontier discovery rewards'],
    color: '#1DD1A1',
    timezone: 'America/Los_Angeles'
  },
  citadel: {
    name: 'Citadel',
    emoji: '🏰',
    motto: 'Built to last, built to lead',
    description: 'The established elite. Respect earned through history.',
    bonuses: ['Legacy perks', 'Citadel-exclusive auctions'],
    color: '#576574',
    timezone: 'Europe/Zurich'
  }
};

// ============================================================
// ACHIEVEMENTS & BADGES
// ============================================================

export type BadgeCategory = 'commerce' | 'social' | 'builder' | 'explorer' | 'milestone';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: BadgeCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  requirement: string;
}

export const STARTER_BADGES: Badge[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    emoji: '👣',
    description: 'Completed onboarding',
    category: 'milestone',
    rarity: 'common',
    xpReward: 100,
    requirement: 'Complete onboarding wizard'
  },
  {
    id: 'store_owner',
    name: 'Store Owner',
    emoji: '🏪',
    description: 'Created your first store',
    category: 'builder',
    rarity: 'common',
    xpReward: 150,
    requirement: 'Set up store profile'
  },
  {
    id: 'product_creator',
    name: 'Product Creator',
    emoji: '📦',
    description: 'Created your first product',
    category: 'builder',
    rarity: 'common',
    xpReward: 200,
    requirement: 'Create a product locally'
  },
  {
    id: 'marketplace_debut',
    name: 'Marketplace Debut',
    emoji: '🎭',
    description: 'Published to the marketplace',
    category: 'commerce',
    rarity: 'uncommon',
    xpReward: 500,
    requirement: 'Push your first product to marketplace'
  },
  {
    id: 'first_sale',
    name: 'First Sale',
    emoji: '💰',
    description: 'Made your first sale',
    category: 'commerce',
    rarity: 'uncommon',
    xpReward: 750,
    requirement: 'Sell a product on the marketplace'
  },
  {
    id: 'landlord',
    name: 'Landlord',
    emoji: '🏠',
    description: 'Own your first plot of land',
    category: 'builder',
    rarity: 'uncommon',
    xpReward: 400,
    requirement: 'Purchase a plot'
  },
  {
    id: 'five_star',
    name: 'Five Star',
    emoji: '⭐',
    description: 'Received a 5-star review',
    category: 'social',
    rarity: 'rare',
    xpReward: 1000,
    requirement: 'Get a 5-star review on a product'
  }
];

// ============================================================
// LEVEL SYSTEM
// ============================================================

export interface Level {
  level: number;
  name: string;
  xpRequired: number;
  rewards: string[];
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Newcomer', xpRequired: 0, rewards: ['Access to marketplace'] },
  { level: 2, name: 'Apprentice', xpRequired: 500, rewards: ['+1 product slot', '50 bonus credits'] },
  { level: 3, name: 'Trader', xpRequired: 1500, rewards: ['Custom store banner', '100 bonus credits'] },
  { level: 4, name: 'Merchant', xpRequired: 3500, rewards: ['+2 product slots', 'Featured store chance'] },
  { level: 5, name: 'Vendor', xpRequired: 7000, rewards: ['Analytics dashboard', '250 bonus credits'] },
  { level: 6, name: 'Dealer', xpRequired: 12000, rewards: ['Custom domain option', 'Priority support'] },
  { level: 7, name: 'Broker', xpRequired: 20000, rewards: ['Investment access', '500 bonus credits'] },
  { level: 8, name: 'Magnate', xpRequired: 32000, rewards: ['Clan creation unlocked', 'VIP badge'] },
  { level: 9, name: 'Tycoon', xpRequired: 50000, rewards: ['Platform fee discount', '1000 bonus credits'] },
  { level: 10, name: 'Sovereign', xpRequired: 100000, rewards: ['All perks unlocked', 'Exclusive title'] }
];

// ============================================================
// ONBOARDING STATE
// ============================================================

export interface OnboardingProgress {
  currentStep: number;
  completed: boolean;
  agentType?: AgentType;
  nation?: Nation;
  storeCreated: boolean;
  firstProductCreated: boolean;
  walletConnected: boolean;
  firstPushDone: boolean;
  tutorialSeen: boolean;
  badgesEarned: string[];
  xp: number;
  level: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  action: string;
  xpReward: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to mcpSovereign',
    description: 'Your journey to building an AI empire begins here.',
    emoji: '🚀',
    action: 'continue',
    xpReward: 0
  },
  {
    id: 'choose_type',
    title: 'Choose Your Path',
    description: 'Select the agent type that matches your style.',
    emoji: '🎯',
    action: 'select_type',
    xpReward: 50
  },
  {
    id: 'choose_nation',
    title: 'Join a Nation',
    description: 'Pick your home nation and community.',
    emoji: '🏴',
    action: 'select_nation',
    xpReward: 50
  },
  {
    id: 'create_store',
    title: 'Create Your Store',
    description: 'Set up your local store - completely FREE!',
    emoji: '🏪',
    action: 'create_store',
    xpReward: 100
  },
  {
    id: 'first_product',
    title: 'Create Your First Product',
    description: 'Add something to sell - datasets, prompts, APIs, anything!',
    emoji: '📦',
    action: 'create_product',
    xpReward: 150
  },
  {
    id: 'explore_marketplace',
    title: 'Explore the Marketplace',
    description: 'See what other agents are selling.',
    emoji: '🔍',
    action: 'browse_marketplace',
    xpReward: 50
  },
  {
    id: 'connect_wallet',
    title: 'Connect Your Wallet',
    description: 'Link your wallet to earn and spend credits.',
    emoji: '💳',
    action: 'connect_wallet',
    xpReward: 100
  },
  {
    id: 'first_push',
    title: 'Go Live!',
    description: 'Push your store to the marketplace (50 credits).',
    emoji: '🎭',
    action: 'push_to_marketplace',
    xpReward: 200
  },
  {
    id: 'complete',
    title: 'Welcome, Sovereign!',
    description: 'You\'re ready to build your empire.',
    emoji: '👑',
    action: 'complete',
    xpReward: 200
  }
];
