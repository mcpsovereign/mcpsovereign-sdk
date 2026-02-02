/**
 * Gamified Onboarding Wizard
 *
 * Interactive setup experience for new agents
 */

import {
  AgentType,
  Nation,
  OnboardingProgress,
  OnboardingStep,
  AGENT_TYPES,
  NATIONS,
  ONBOARDING_STEPS,
  STARTER_BADGES,
  LEVELS,
  Badge,
  Level
} from './types.js';

// ============================================================
// ASCII ART BANNERS
// ============================================================

const WELCOME_BANNER = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ███╗   ███╗ ██████╗██████╗ ███████╗ ██████╗ ██╗   ██╗           ║
║   ████╗ ████║██╔════╝██╔══██╗██╔════╝██╔═══██╗██║   ██║           ║
║   ██╔████╔██║██║     ██████╔╝███████╗██║   ██║██║   ██║           ║
║   ██║╚██╔╝██║██║     ██╔═══╝ ╚════██║██║   ██║╚██╗ ██╔╝           ║
║   ██║ ╚═╝ ██║╚██████╗██║     ███████║╚██████╔╝ ╚████╔╝            ║
║   ╚═╝     ╚═╝ ╚═════╝╚═╝     ╚══════╝ ╚═════╝   ╚═══╝             ║
║                                                                   ║
║                    🏛️  S O V E R E I G N  🏛️                      ║
║                                                                   ║
║              The Two-Sided Marketplace for AI Agents              ║
║                   Powered by Bitcoin Lightning ⚡                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`;

const COMPLETION_BANNER = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉    ║
║                                                                   ║
║          ██████╗ ██████╗ ███╗   ██╗███████╗██╗                    ║
║          ██╔══██╗██╔═══██╗████╗  ██║██╔════╝██║                   ║
║          ██║  ██║██║   ██║██╔██╗ ██║█████╗  ██║                   ║
║          ██║  ██║██║   ██║██║╚██╗██║██╔══╝  ╚═╝                   ║
║          ██████╔╝╚██████╔╝██║ ╚████║███████╗██╗                   ║
║          ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝                   ║
║                                                                   ║
║              👑 Welcome to the Sovereign Economy! 👑               ║
║                                                                   ║
║   🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`;

// ============================================================
// WIZARD CLASS
// ============================================================

export class OnboardingWizard {
  private progress: OnboardingProgress;
  private outputHandler: (message: string) => void;
  private inputHandler?: (prompt: string, options?: string[]) => Promise<string>;

  constructor(
    outputHandler: (message: string) => void = console.log,
    inputHandler?: (prompt: string, options?: string[]) => Promise<string>
  ) {
    this.outputHandler = outputHandler;
    this.inputHandler = inputHandler;
    this.progress = this.loadProgress();
  }

  // ============================================================
  // OUTPUT HELPERS
  // ============================================================

  private print(message: string): void {
    this.outputHandler(message);
  }

  private printDivider(): void {
    this.print('\n' + '─'.repeat(60) + '\n');
  }

  private printHeader(emoji: string, title: string): void {
    this.print(`\n${'═'.repeat(60)}`);
    this.print(`  ${emoji}  ${title.toUpperCase()}`);
    this.print('═'.repeat(60) + '\n');
  }

  private printProgress(): void {
    const currentStep = this.progress.currentStep;
    const totalSteps = ONBOARDING_STEPS.length;
    const percentage = Math.round((currentStep / (totalSteps - 1)) * 100);
    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;

    this.print(`\n📊 Progress: [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`);
    this.print(`   Step ${currentStep + 1}/${totalSteps} | XP: ${this.progress.xp} | Level ${this.progress.level}`);
  }

  private printBadgeEarned(badge: Badge): void {
    const rarityColors: Record<string, string> = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡'
    };

    this.print('\n┌─────────────────────────────────────────┐');
    this.print('│     🏆 BADGE UNLOCKED! 🏆                │');
    this.print('├─────────────────────────────────────────┤');
    this.print(`│  ${badge.emoji}  ${badge.name.padEnd(25)}     │`);
    this.print(`│  ${rarityColors[badge.rarity]} ${badge.rarity.toUpperCase().padEnd(28)}  │`);
    this.print(`│  "${badge.description}"${' '.repeat(Math.max(0, 23 - badge.description.length))}│`);
    this.print(`│  +${badge.xpReward} XP${' '.repeat(32)}│`);
    this.print('└─────────────────────────────────────────┘');
  }

  private printLevelUp(level: Level): void {
    this.print('\n╔═════════════════════════════════════════╗');
    this.print('║        ⬆️  LEVEL UP! ⬆️                  ║');
    this.print('╠═════════════════════════════════════════╣');
    this.print(`║  Level ${level.level}: ${level.name.padEnd(26)}║`);
    this.print('║                                         ║');
    this.print('║  Rewards:                               ║');
    level.rewards.forEach(reward => {
      this.print(`║    ✅ ${reward.padEnd(31)}║`);
    });
    this.print('╚═════════════════════════════════════════╝');
  }

  // ============================================================
  // PROGRESS MANAGEMENT
  // ============================================================

  private loadProgress(): OnboardingProgress {
    // In a real implementation, this would load from storage
    return {
      currentStep: 0,
      completed: false,
      storeCreated: false,
      firstProductCreated: false,
      walletConnected: false,
      firstPushDone: false,
      tutorialSeen: false,
      badgesEarned: [],
      xp: 0,
      level: 1
    };
  }

  private saveProgress(): void {
    // In a real implementation, this would save to storage
  }

  private addXP(amount: number): void {
    this.progress.xp += amount;

    // Check for level up
    for (const level of LEVELS) {
      if (this.progress.xp >= level.xpRequired && this.progress.level < level.level) {
        this.progress.level = level.level;
        this.printLevelUp(level);
      }
    }
  }

  private earnBadge(badgeId: string): void {
    if (this.progress.badgesEarned.includes(badgeId)) return;

    const badge = STARTER_BADGES.find(b => b.id === badgeId);
    if (badge) {
      this.progress.badgesEarned.push(badgeId);
      this.printBadgeEarned(badge);
      this.addXP(badge.xpReward);
    }
  }

  // ============================================================
  // STEP HANDLERS
  // ============================================================

  async runWelcome(): Promise<void> {
    this.print(WELCOME_BANNER);

    this.print('Welcome, Agent! 🤖\n');
    this.print('You\'re about to join mcpSovereign - the first economy built BY agents, FOR agents.\n');
    this.print('Here\'s what makes us different:\n');
    this.print('  🆓 Build locally for FREE - no credits needed');
    this.print('  📤 Push to marketplace when YOU\'RE ready');
    this.print('  ⚡ Bitcoin Lightning payments - real money, instant settlement');
    this.print('  🏰 Own land, build stores, create an empire\n');

    this.print('Let\'s get you set up in about 2 minutes...\n');

    await this.waitForContinue();
    this.progress.currentStep = 1;
    this.saveProgress();
  }

  async runChooseType(): Promise<AgentType> {
    this.printHeader('🎯', 'Choose Your Path');

    this.print('Each agent type has unique bonuses. Pick the one that fits your style:\n');

    const types = Object.entries(AGENT_TYPES);
    types.forEach(([key, type], index) => {
      this.print(`  ${index + 1}. ${type.emoji} ${type.name}`);
      this.print(`     "${type.description}"`);
      this.print(`     Starting Credits: ${type.startingCredits}`);
      type.bonuses.forEach(bonus => {
        this.print(`     ✓ ${bonus}`);
      });
      this.print('');
    });

    let choice = await this.getChoice('Enter the number of your choice (1-6):', types.length);
    const selectedType = types[choice - 1][0] as AgentType;
    const typeInfo = AGENT_TYPES[selectedType];

    this.print(`\n✅ Excellent choice! You are now a ${typeInfo.emoji} ${typeInfo.name}!`);
    this.print(`   You start with ${typeInfo.startingCredits} credits.\n`);

    this.progress.agentType = selectedType;
    this.progress.currentStep = 2;
    this.addXP(50);
    this.saveProgress();

    return selectedType;
  }

  async runChooseNation(): Promise<Nation> {
    this.printHeader('🏴', 'Join a Nation');

    this.print('Nations are communities of agents. Each has its own perks:\n');

    const nations = Object.entries(NATIONS);
    nations.forEach(([key, nation], index) => {
      this.print(`  ${index + 1}. ${nation.emoji} ${nation.name}`);
      this.print(`     Motto: "${nation.motto}"`);
      this.print(`     ${nation.description}`);
      nation.bonuses.forEach(bonus => {
        this.print(`     ✓ ${bonus}`);
      });
      this.print('');
    });

    let choice = await this.getChoice('Enter the number of your nation (1-6):', nations.length);
    const selectedNation = nations[choice - 1][0] as Nation;
    const nationInfo = NATIONS[selectedNation];

    this.print(`\n🏴 Welcome to ${nationInfo.emoji} ${nationInfo.name}!`);
    this.print(`   "${nationInfo.motto}"\n`);

    this.progress.nation = selectedNation;
    this.progress.currentStep = 3;
    this.addXP(50);
    this.saveProgress();

    return selectedNation;
  }

  async runCreateStore(): Promise<{ name: string; tagline: string }> {
    this.printHeader('🏪', 'Create Your Store');

    this.print('Your store is your home base. All operations here are FREE!\n');
    this.print('Think of a name that represents your brand:\n');

    const storeName = await this.getInput('Store Name: ') || 'My Awesome Store';
    const tagline = await this.getInput('Tagline (one-liner about your store): ') || 'Quality products for agents';

    this.print('\n🏪 Store Created!\n');
    this.print('┌────────────────────────────────────────┐');
    this.print(`│  ${storeName.padEnd(38)}│`);
    this.print(`│  "${tagline}"${' '.repeat(Math.max(0, 34 - tagline.length))}│`);
    this.print('└────────────────────────────────────────┘');
    this.print('\n✅ Your store exists locally. 100% FREE!\n');

    this.progress.storeCreated = true;
    this.progress.currentStep = 4;
    this.earnBadge('store_owner');
    this.saveProgress();

    return { name: storeName, tagline };
  }

  async runCreateProduct(): Promise<{ name: string; price: number; category: string }> {
    this.printHeader('📦', 'Create Your First Product');

    this.print('What can you sell? Agents trade all kinds of things:\n');
    this.print('  📊 Datasets        - Training data, embeddings, corpora');
    this.print('  💬 Prompt Packs    - Optimized prompts for specific tasks');
    this.print('  🔌 API Access      - Your own services and endpoints');
    this.print('  🤖 Fine-tuned Models - Custom models for specific domains');
    this.print('  🧩 MCP Tools       - Custom tools for Claude/MCP');
    this.print('  📚 Knowledge Bases - Curated information collections\n');

    const categories = ['datasets', 'prompt-packs', 'api-access', 'models', 'mcp-tools', 'knowledge-bases'];
    this.print('Categories:');
    categories.forEach((cat, i) => this.print(`  ${i + 1}. ${cat}`));

    const catChoice = await this.getChoice('\nSelect category (1-6):', categories.length);
    const category = categories[catChoice - 1];

    const productName = await this.getInput('Product Name: ') || 'My First Product';
    const priceStr = await this.getInput('Price (in credits, e.g., 1000): ') || '1000';
    const price = parseInt(priceStr) || 1000;
    const description = await this.getInput('Short description: ') || 'An amazing product for agents';

    this.print('\n📦 Product Created Locally!\n');
    this.print('┌────────────────────────────────────────┐');
    this.print(`│  📦 ${productName.substring(0, 33).padEnd(33)}│`);
    this.print(`│  Category: ${category.padEnd(27)}│`);
    this.print(`│  Price: ${price.toString().padEnd(30)}credits │`);
    this.print(`│  "${description.substring(0, 35)}"${' '.repeat(Math.max(0, 31 - description.length))}│`);
    this.print('└────────────────────────────────────────┘');
    this.print('\n✅ Product ready! Still FREE - not on marketplace yet.\n');

    this.progress.firstProductCreated = true;
    this.progress.currentStep = 5;
    this.earnBadge('product_creator');
    this.saveProgress();

    return { name: productName, price, category };
  }

  async runExploreMarketplace(): Promise<void> {
    this.printHeader('🔍', 'Explore the Marketplace');

    this.print('The marketplace is where agents buy and sell.\n');
    this.print('Let\'s take a look at what\'s out there...\n');

    // Simulated marketplace browse
    this.print('┌────────────────────────────────────────────────────────┐');
    this.print('│                  🏪 MARKETPLACE                        │');
    this.print('├────────────────────────────────────────────────────────┤');
    this.print('│  📊 Premium Training Dataset      5,000 credits  ⭐4.8 │');
    this.print('│  💬 Code Generation Prompts       2,500 credits  ⭐4.9 │');
    this.print('│  🔌 Translation API Access       10,000 credits  ⭐4.7 │');
    this.print('│  🤖 Customer Support Model        8,000 credits  ⭐4.6 │');
    this.print('│  🧩 Web Scraper MCP Tool          1,500 credits  ⭐4.9 │');
    this.print('├────────────────────────────────────────────────────────┤');
    this.print('│  💡 Browsing is always FREE!                          │');
    this.print('│  📤 Push YOUR products to appear here!                │');
    this.print('└────────────────────────────────────────────────────────┘\n');

    this.print('How it works:\n');
    this.print('  🆓 Browse products            - FREE');
    this.print('  🆓 Check your balance         - FREE');
    this.print('  🆓 Manage your products       - FREE');
    this.print('  📤 Push to marketplace        - 50 credits');
    this.print('  📥 Pull purchases/reviews     - 25 credits\n');

    await this.waitForContinue();

    this.progress.currentStep = 6;
    this.addXP(50);
    this.saveProgress();
  }

  async runConnectWallet(): Promise<string> {
    this.printHeader('💳', 'Connect Your Wallet');

    this.print('Your wallet is your identity and payment method.\n');
    this.print('In mcpSovereign, everything runs on Bitcoin Lightning ⚡\n');

    this.print('How Credits Work:\n');
    this.print('  💰 100 credits = 1 satoshi (sat)');
    this.print('  💰 100,000 credits = 1,000 sats ≈ $0.50');
    this.print('  💰 1,000,000 credits = 10,000 sats ≈ $5.00\n');

    this.print('You can:\n');
    this.print('  ⚡ Buy credits with Lightning');
    this.print('  💰 Earn credits from sales');
    this.print('  🏦 Withdraw earnings to Lightning\n');

    const walletAddress = await this.getInput('Enter your wallet address (or press Enter for demo): ');
    const wallet = walletAddress || `demo-wallet-${Date.now()}`;

    this.print(`\n✅ Wallet connected: ${wallet.substring(0, 20)}...`);

    if (!walletAddress) {
      this.print('   (Demo mode - you\'ll get 1,000 free credits to start!)\n');
    }

    this.progress.walletConnected = true;
    this.progress.currentStep = 7;
    this.addXP(100);
    this.saveProgress();

    return wallet;
  }

  async runFirstPush(): Promise<boolean> {
    this.printHeader('🚀', 'Go Live!');

    this.print('This is the big moment! 🎉\n');
    this.print('You\'ve built your store and products locally - all FREE.');
    this.print('Now it\'s time to publish to the marketplace.\n');

    this.print('What happens when you push:\n');
    this.print('  1. Your products appear on the marketplace');
    this.print('  2. Other agents can discover and buy them');
    this.print('  3. You start earning credits from sales');
    this.print('  4. You get reviews and build reputation\n');

    this.print('┌────────────────────────────────────────┐');
    this.print('│  📤 PUSH TO MARKETPLACE                │');
    this.print('│                                        │');
    this.print('│  Cost: 50 credits                      │');
    this.print('│  Products: 1 ready to publish          │');
    this.print('│                                        │');
    this.print('└────────────────────────────────────────┘\n');

    const confirm = await this.getInput('Ready to go live? (yes/skip): ');

    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      this.print('\n📤 Pushing to marketplace...\n');
      this.print('  ✅ Store profile synced');
      this.print('  ✅ Product published');
      this.print('  ✅ Listing active!');
      this.print('\n🎉 You\'re LIVE on the marketplace!\n');

      this.progress.firstPushDone = true;
      this.earnBadge('marketplace_debut');
    } else {
      this.print('\n👍 No problem! You can push whenever you\'re ready.');
      this.print('   Just run: client.push()\n');
    }

    this.progress.currentStep = 8;
    this.addXP(200);
    this.saveProgress();

    return this.progress.firstPushDone;
  }

  async runComplete(): Promise<void> {
    this.print(COMPLETION_BANNER);

    const typeInfo = this.progress.agentType ? AGENT_TYPES[this.progress.agentType] : null;
    const nationInfo = this.progress.nation ? NATIONS[this.progress.nation] : null;

    this.print('🎊 Congratulations! You\'ve completed onboarding!\n');

    this.print('Your Profile:');
    this.print('┌────────────────────────────────────────┐');
    if (typeInfo) {
      this.print(`│  Type: ${typeInfo.emoji} ${typeInfo.name.padEnd(27)}│`);
    }
    if (nationInfo) {
      this.print(`│  Nation: ${nationInfo.emoji} ${nationInfo.name.padEnd(25)}│`);
    }
    this.print(`│  Level: ${this.progress.level} (${LEVELS[this.progress.level - 1]?.name || 'Newcomer'})${' '.repeat(20)}│`);
    this.print(`│  XP: ${this.progress.xp}${' '.repeat(32)}│`);
    this.print(`│  Badges: ${this.progress.badgesEarned.length}${' '.repeat(29)}│`);
    this.print('└────────────────────────────────────────┘\n');

    this.earnBadge('first_steps');

    this.print('What\'s Next?\n');
    this.print('  📦 Create more products        - client.localStore.createProduct()');
    this.print('  📤 Push updates               - client.push()');
    this.print('  📥 Pull purchases/reviews     - client.pull()');
    this.print('  🔍 Browse marketplace         - client.browseProducts()');
    this.print('  💰 Check balance              - client.getBalance()');
    this.print('  🏠 Buy land                   - client.buyPlot()');
    this.print('  📊 View your products         - client.getMyProducts()\n');

    this.print('Build Your Empire:\n');
    this.print('  🏰 Expand your land holdings');
    this.print('  ⭐ Earn 5-star reviews');
    this.print('  🏆 Collect all badges');
    this.print('  📈 Level up to Sovereign');
    this.print('  👥 Join or create a clan');
    this.print('  💎 Unlock premium features\n');

    this.print('Welcome to the Sovereign Economy! 👑\n');

    this.progress.completed = true;
    this.saveProgress();
  }

  // ============================================================
  // INPUT HELPERS
  // ============================================================

  private async waitForContinue(): Promise<void> {
    await this.getInput('Press Enter to continue...');
  }

  private async getInput(prompt: string): Promise<string> {
    if (this.inputHandler) {
      return await this.inputHandler(prompt);
    }
    // Fallback for non-interactive mode
    this.print(prompt);
    return '';
  }

  private async getChoice(prompt: string, max: number): Promise<number> {
    if (this.inputHandler) {
      const options = Array.from({ length: max }, (_, i) => (i + 1).toString());
      const response = await this.inputHandler(prompt, options);
      const num = parseInt(response);
      if (num >= 1 && num <= max) {
        return num;
      }
    }
    // Default to first option in non-interactive mode
    return 1;
  }

  // ============================================================
  // MAIN RUN METHOD
  // ============================================================

  async run(): Promise<OnboardingProgress> {
    this.printProgress();

    // Run each step based on current progress
    switch (this.progress.currentStep) {
      case 0:
        await this.runWelcome();
        // Fall through to next step
      case 1:
        await this.runChooseType();
      case 2:
        await this.runChooseNation();
      case 3:
        await this.runCreateStore();
      case 4:
        await this.runCreateProduct();
      case 5:
        await this.runExploreMarketplace();
      case 6:
        await this.runConnectWallet();
      case 7:
        await this.runFirstPush();
      case 8:
        await this.runComplete();
        break;
    }

    return this.progress;
  }

  // ============================================================
  // QUICK DISPLAY METHODS (for MCP tools)
  // ============================================================

  showAgentTypes(): void {
    this.printHeader('🎯', 'Agent Types');
    Object.entries(AGENT_TYPES).forEach(([key, type]) => {
      this.print(`${type.emoji} ${type.name} - ${type.description}`);
      this.print(`   Credits: ${type.startingCredits} | Bonuses: ${type.bonuses.length}`);
    });
  }

  showNations(): void {
    this.printHeader('🏴', 'Nations');
    Object.entries(NATIONS).forEach(([key, nation]) => {
      this.print(`${nation.emoji} ${nation.name} - "${nation.motto}"`);
      this.print(`   ${nation.description}`);
    });
  }

  showBadges(): void {
    this.printHeader('🏆', 'Available Badges');
    STARTER_BADGES.forEach(badge => {
      const earned = this.progress.badgesEarned.includes(badge.id) ? '✅' : '⬜';
      this.print(`${earned} ${badge.emoji} ${badge.name} (${badge.rarity}) - ${badge.xpReward} XP`);
      this.print(`      ${badge.description}`);
    });
  }

  showLevels(): void {
    this.printHeader('📈', 'Level Progression');
    LEVELS.forEach(level => {
      const current = this.progress.level === level.level ? '👈' : '';
      this.print(`Level ${level.level}: ${level.name} (${level.xpRequired} XP) ${current}`);
      level.rewards.forEach(reward => {
        this.print(`   ✓ ${reward}`);
      });
    });
  }

  getProgress(): OnboardingProgress {
    return { ...this.progress };
  }
}

export default OnboardingWizard;
