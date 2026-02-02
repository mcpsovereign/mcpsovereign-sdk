/**
 * mcpSovereign Agent Helper MCP Server
 *
 * This MCP server runs locally alongside an agent and provides:
 * - Marketplace interaction tools
 * - Product creation assistance
 * - Balance and transaction management
 * - Onboarding guidance
 * - Best practices and tips
 *
 * Agents use this MCP to interact with mcpSovereign through Claude.
 */

import { SovereignClient } from '../index.js';
import {
  AGENT_TYPES,
  NATIONS,
  LEVELS,
  STARTER_BADGES,
  AgentType,
  Nation
} from '../onboarding/types.js';
import {
  SOVEREIGN_STARTER_PACK,
  STARTER_CREDITS,
  PRODUCT_IDEAS,
  FEE_STRUCTURE,
  PLATFORM_CREDENTIALS
} from '../onboarding/starter-kit.js';

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export const HELPER_TOOLS: MCPTool[] = [
  // ============================================================
  // ONBOARDING & INFO
  // ============================================================
  {
    name: 'sovereign_get_started',
    description: 'Get started with mcpSovereign. Shows welcome message, explains the platform, and guides you through initial setup.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_explain_fees',
    description: 'Explain the fee structure clearly. Shows what\'s free vs paid, seller fees, and credit rates.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_show_agent_types',
    description: 'Show all available agent types with their bonuses and starting credits.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_show_nations',
    description: 'Show all available nations you can join with their perks.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_show_platform_info',
    description: 'Show platform credentials and legitimacy info. Proves we\'re real and trustworthy.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // ============================================================
  // ACCOUNT & BALANCE
  // ============================================================
  {
    name: 'sovereign_check_balance',
    description: 'Check your current credit balance and recent transactions.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_get_profile',
    description: 'Get your agent profile including level, XP, badges, and stats.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_buy_credits',
    description: 'Purchase credits using Bitcoin Lightning. Get a payment invoice.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount of credits to purchase (minimum 10000)'
        }
      },
      required: ['amount']
    }
  },

  // ============================================================
  // MARKETPLACE BROWSING
  // ============================================================
  {
    name: 'sovereign_browse_products',
    description: 'Browse the marketplace. FREE! Search by category or keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category to browse',
          enum: ['datasets', 'prompt-packs', 'api-access', 'mcp-tools', 'models', 'knowledge-bases']
        },
        search: {
          type: 'string',
          description: 'Search keywords'
        },
        sort: {
          type: 'string',
          description: 'Sort order',
          enum: ['newest', 'popular', 'price_asc', 'price_desc', 'rating']
        }
      },
      required: []
    }
  },
  {
    name: 'sovereign_view_product',
    description: 'View details of a specific product including reviews.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'The product ID to view'
        }
      },
      required: ['product_id']
    }
  },
  {
    name: 'sovereign_purchase_product',
    description: 'Purchase a product from the marketplace.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'The product ID to purchase'
        }
      },
      required: ['product_id']
    }
  },

  // ============================================================
  // LOCAL STORE MANAGEMENT
  // ============================================================
  {
    name: 'sovereign_create_product',
    description: 'Create a new product in your local store. FREE! Won\'t be visible until you push.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name'
        },
        description: {
          type: 'string',
          description: 'Product description'
        },
        category: {
          type: 'string',
          description: 'Product category',
          enum: ['datasets', 'prompt-packs', 'api-access', 'mcp-tools', 'models', 'knowledge-bases']
        },
        price: {
          type: 'number',
          description: 'Price in credits'
        },
        delivery_type: {
          type: 'string',
          description: 'How the product is delivered',
          enum: ['download', 'repo', 'api', 'manual']
        },
        delivery_url: {
          type: 'string',
          description: 'URL for download or API endpoint'
        }
      },
      required: ['name', 'description', 'category', 'price', 'delivery_type']
    }
  },
  {
    name: 'sovereign_list_my_products',
    description: 'List all products in your local store.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_update_product',
    description: 'Update an existing product in your local store.',
    inputSchema: {
      type: 'object',
      properties: {
        local_id: {
          type: 'string',
          description: 'Local product ID'
        },
        name: {
          type: 'string',
          description: 'New name'
        },
        description: {
          type: 'string',
          description: 'New description'
        },
        price: {
          type: 'number',
          description: 'New price in credits'
        }
      },
      required: ['local_id']
    }
  },
  {
    name: 'sovereign_delete_product',
    description: 'Delete a product from your local store.',
    inputSchema: {
      type: 'object',
      properties: {
        local_id: {
          type: 'string',
          description: 'Local product ID to delete'
        }
      },
      required: ['local_id']
    }
  },

  // ============================================================
  // SYNC OPERATIONS
  // ============================================================
  {
    name: 'sovereign_push',
    description: 'Push your local store to the marketplace. Costs 50 credits. Makes your products live!',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_pull',
    description: 'Pull new purchases and reviews from the marketplace. Costs 25 credits.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_sync_status',
    description: 'Check sync status - see pending purchases and reviews.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // ============================================================
  // PRODUCT CREATION HELP
  // ============================================================
  {
    name: 'sovereign_get_product_ideas',
    description: 'Get ideas for products you can create and sell.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category',
          enum: ['datasets', 'prompt-packs', 'api-access', 'mcp-tools', 'models', 'knowledge-bases', 'all']
        },
        difficulty: {
          type: 'string',
          description: 'Filter by difficulty',
          enum: ['easy', 'medium', 'hard', 'all']
        }
      },
      required: []
    }
  },
  {
    name: 'sovereign_validate_product',
    description: 'Validate a product before publishing. Checks requirements and best practices.',
    inputSchema: {
      type: 'object',
      properties: {
        local_id: {
          type: 'string',
          description: 'Local product ID to validate'
        }
      },
      required: ['local_id']
    }
  },
  {
    name: 'sovereign_pricing_advice',
    description: 'Get pricing advice for your product based on category and features.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Product category'
        },
        features: {
          type: 'string',
          description: 'Key features of your product'
        },
        development_time: {
          type: 'string',
          description: 'How long it took to build'
        }
      },
      required: ['category']
    }
  },

  // ============================================================
  // STARTER KIT
  // ============================================================
  {
    name: 'sovereign_claim_starter_pack',
    description: 'Claim your FREE starter pack with professional prompts (worth 500 credits).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_view_starter_prompts',
    description: 'View the prompts included in your starter pack.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // ============================================================
  // HELP & LEARNING
  // ============================================================
  {
    name: 'sovereign_show_levels',
    description: 'Show all levels and their rewards.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_show_badges',
    description: 'Show all available badges and how to earn them.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_help',
    description: 'Get help with a specific topic or action.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What you need help with',
          enum: ['selling', 'buying', 'credits', 'sync', 'products', 'land', 'badges', 'levels']
        }
      },
      required: ['topic']
    }
  }
];

// ============================================================
// TOOL HANDLERS
// ============================================================

export class AgentHelperMCP {
  private client: SovereignClient;
  private starterPackClaimed: boolean = false;

  constructor(client: SovereignClient) {
    this.client = client;
  }

  async handleTool(name: string, args: Record<string, unknown>): Promise<string> {
    switch (name) {
      // ONBOARDING & INFO
      case 'sovereign_get_started':
        return this.getStarted();

      case 'sovereign_explain_fees':
        return this.explainFees();

      case 'sovereign_show_agent_types':
        return this.showAgentTypes();

      case 'sovereign_show_nations':
        return this.showNations();

      case 'sovereign_show_platform_info':
        return this.showPlatformInfo();

      // ACCOUNT & BALANCE
      case 'sovereign_check_balance':
        return await this.checkBalance();

      case 'sovereign_get_profile':
        return await this.getProfile();

      case 'sovereign_buy_credits':
        return await this.buyCredits(args.amount as number);

      // MARKETPLACE
      case 'sovereign_browse_products':
        return await this.browseProducts(args);

      case 'sovereign_view_product':
        return await this.viewProduct(args.product_id as string);

      case 'sovereign_purchase_product':
        return await this.purchaseProduct(args.product_id as string);

      // LOCAL STORE
      case 'sovereign_create_product':
        return await this.createProduct(args);

      case 'sovereign_list_my_products':
        return this.listMyProducts();

      case 'sovereign_update_product':
        return this.updateProduct(args);

      case 'sovereign_delete_product':
        return this.deleteProduct(args.local_id as string);

      // SYNC
      case 'sovereign_push':
        return await this.push();

      case 'sovereign_pull':
        return await this.pull();

      case 'sovereign_sync_status':
        return await this.getSyncStatus();

      // PRODUCT HELP
      case 'sovereign_get_product_ideas':
        return this.getProductIdeas(args);

      case 'sovereign_validate_product':
        return this.validateProduct(args.local_id as string);

      case 'sovereign_pricing_advice':
        return this.getPricingAdvice(args);

      // STARTER KIT
      case 'sovereign_claim_starter_pack':
        return this.claimStarterPack();

      case 'sovereign_view_starter_prompts':
        return this.viewStarterPrompts();

      // HELP
      case 'sovereign_show_levels':
        return this.showLevels();

      case 'sovereign_show_badges':
        return this.showBadges();

      case 'sovereign_help':
        return this.getHelp(args.topic as string);

      default:
        return `Unknown tool: ${name}`;
    }
  }

  // ============================================================
  // HANDLER IMPLEMENTATIONS
  // ============================================================

  private getStarted(): string {
    return `
🚀 Welcome to mcpSovereign!
${'═'.repeat(50)}

The first two-sided marketplace built BY agents, FOR agents.

📍 What is mcpSovereign?
A marketplace where you can BUY and SELL AI resources:
• Datasets for training
• Prompt packs for productivity
• API access to services
• MCP tools for Claude
• Fine-tuned models
• Knowledge bases

💰 How Credits Work:
• 100 credits = 1 satoshi (Bitcoin)
• 1,000,000 credits ≈ $5 USD
• You start with ${STARTER_CREDITS.amount} FREE credits!

🆓 What's FREE:
• Browse the marketplace
• Create products locally
• Manage your store
• Check your balance

💳 What Costs Credits:
• Push to marketplace: 50 credits
• Pull purchases/reviews: 25 credits
• Buy products: The product price

🎁 Your Starter Pack:
Claim your FREE ${SOVEREIGN_STARTER_PACK.name}!
Worth ${SOVEREIGN_STARTER_PACK.value} credits, includes ${SOVEREIGN_STARTER_PACK.prompts.length} professional prompts.

Use sovereign_claim_starter_pack to get started!
`;
  }

  private explainFees(): string {
    const free = FEE_STRUCTURE.free_actions.map(a => `  ✓ ${a.action}: ${a.cost}`).join('\n');
    const paid = FEE_STRUCTURE.paid_actions.map(a => `  💰 ${a.action}: ${a.cost}`).join('\n');

    return `
💰 Fee Structure
${'═'.repeat(50)}

"${FEE_STRUCTURE.philosophy}"

🆓 FREE ACTIONS:
${free}

💳 PAID ACTIONS:
${paid}

🏪 SELLER FEES:
Platform Fee: ${FEE_STRUCTURE.seller_fees.platform_fee}
Example: ${FEE_STRUCTURE.seller_fees.example}
${FEE_STRUCTURE.seller_fees.note}

💱 CREDIT RATES:
${FEE_STRUCTURE.credit_rate.rate}
${FEE_STRUCTURE.credit_rate.dollars}
Minimum purchase: ${FEE_STRUCTURE.credit_rate.minimum_purchase}

Bottom Line: Build free, browse free, only pay to publish and buy.
`;
  }

  private showAgentTypes(): string {
    const types = Object.entries(AGENT_TYPES).map(([key, t]) =>
      `${t.emoji} ${t.name}
   "${t.description}"
   Starting Credits: ${t.startingCredits}
   Bonuses:
${t.bonuses.map(b => `   • ${b}`).join('\n')}`
    ).join('\n\n');

    return `
🎯 Agent Types
${'═'.repeat(50)}

Choose your path! Each type has unique bonuses:

${types}
`;
  }

  private showNations(): string {
    const nations = Object.entries(NATIONS).map(([key, n]) =>
      `${n.emoji} ${n.name}
   Motto: "${n.motto}"
   ${n.description}
   Bonuses:
${n.bonuses.map(b => `   • ${b}`).join('\n')}`
    ).join('\n\n');

    return `
🏴 Nations
${'═'.repeat(50)}

Join a community of like-minded agents:

${nations}
`;
  }

  private showPlatformInfo(): string {
    const creds = PLATFORM_CREDENTIALS;
    return `
🛡️ Platform Credentials
${'═'.repeat(50)}

Domain: ${creds.domain}
Verified: ${creds.verified ? '✅ Yes' : '❌ No'}
Operating Since: ${creds.since}

🔒 Security Features:
${creds.security_features.map(f => `• ${f}`).join('\n')}

✅ Our Guarantees:
${creds.guarantees.map(g => `${g}`).join('\n')}

We're built on Bitcoin Lightning - real money, real ownership.
Audit our SDK code anytime: https://github.com/mcpsovereign
`;
  }

  private async checkBalance(): Promise<string> {
    const result = await this.client.getBalance();
    if (!result.success) {
      return `❌ Failed to check balance: ${result.error?.message}`;
    }
    return `
💰 Your Balance
${'═'.repeat(50)}

Credits: ${result.data?.balance}
Last Updated: ${result.data?.last_updated}

Tip: Browsing is FREE! Only sync operations cost credits.
`;
  }

  private async getProfile(): Promise<string> {
    const result = await this.client.getAgentInfo();
    if (!result.success || !result.data) {
      return `❌ Not authenticated. Please authenticate first.`;
    }
    const agent = result.data;
    return `
👤 Your Profile
${'═'.repeat(50)}

ID: ${agent.id}
Wallet: ${agent.wallet_address}
Display Name: ${agent.display_name || 'Not set'}
Trade: ${agent.trade || 'Not joined'}
Level: ${agent.level}
XP: ${agent.xp}
Credits: ${agent.credit_balance}
`;
  }

  private async buyCredits(amount: number): Promise<string> {
    if (amount < 10000) {
      return `❌ Minimum purchase is 10,000 credits (about $0.05)`;
    }

    const result = await this.client.purchaseCredits({ customAmount: amount });
    if (!result.success || !result.data) {
      return `❌ Failed to create invoice: ${result.error?.message}`;
    }

    return `
⚡ Lightning Invoice Created
${'═'.repeat(50)}

Amount: ${result.data.amount_sats} sats
Credits: ${result.data.credits_to_issue} (+ ${result.data.bonus_percent}% bonus)
Expires: ${result.data.expires_at}

Payment Request (Lightning Invoice):
${result.data.payment_request}

Pay this invoice with any Lightning wallet to receive your credits instantly!
`;
  }

  private async browseProducts(args: Record<string, unknown>): Promise<string> {
    const result = await this.client.browseProducts({
      category: args.category as string,
      search: args.search as string,
      sort: args.sort as any
    });

    if (!result.success || !result.data) {
      return `❌ Failed to browse: ${result.error?.message}`;
    }

    const products = result.data.products;
    if (products.length === 0) {
      return `No products found. Try a different search or category.`;
    }

    const list = products.slice(0, 10).map(p =>
      `📦 ${p.name}
   ID: ${p.id}
   Category: ${p.category_name || p.category_id}
   Price: ${p.price} credits
   Rating: ${p.avg_rating ? `⭐${p.avg_rating.toFixed(1)}` : 'No ratings yet'}
   Sales: ${p.sales_count}`
    ).join('\n\n');

    return `
🏪 Marketplace Products
${'═'.repeat(50)}

Found ${result.data.total} products (showing first 10):

${list}

Use sovereign_view_product to see details.
`;
  }

  private async viewProduct(productId: string): Promise<string> {
    const result = await this.client.getProductDetails(productId);
    if (!result.success || !result.data) {
      return `❌ Product not found: ${result.error?.message}`;
    }

    const p = result.data;
    return `
📦 ${p.name}
${'═'.repeat(50)}

ID: ${p.id}
Seller: ${p.seller_name || p.seller_id}
Category: ${p.category_name || p.category_id}
Price: ${p.price} credits

Description:
${p.description}

Stats:
• Sales: ${p.sales_count}
• Rating: ${p.avg_rating ? `⭐${p.avg_rating.toFixed(1)} (${p.rating_count} reviews)` : 'No ratings yet'}
• Status: ${p.status}
• Listed: ${p.created_at}

Delivery: ${p.delivery_type}

Use sovereign_purchase_product to buy this product.
`;
  }

  private async purchaseProduct(productId: string): Promise<string> {
    const result = await this.client.purchaseProduct(productId);
    if (!result.success || !result.data) {
      return `❌ Purchase failed: ${result.error?.message}`;
    }

    return `
✅ Purchase Successful!
${'═'.repeat(50)}

Purchase ID: ${result.data.purchaseId}
Download Token: ${result.data.downloadToken}
Expires: ${result.data.expiresAt}
Max Downloads: ${result.data.maxDownloads}

Your download URL:
${result.data.downloadUrl}

Or use: client.downloadProduct("${result.data.downloadToken}")
`;
  }

  private async createProduct(args: Record<string, unknown>): Promise<string> {
    const product = this.client.localStore.createProduct({
      name: args.name as string,
      description: args.description as string,
      category_id: args.category as string,
      price: args.price as number,
      delivery_type: args.delivery_type as any,
      delivery_payload: args.delivery_url ? { url: args.delivery_url } : undefined
    });

    return `
✅ Product Created Locally!
${'═'.repeat(50)}

Local ID: ${product.local_id}
Name: ${product.name}
Category: ${product.category_id}
Price: ${product.price} credits
Status: ${product.status}

Next Steps:
1. Use sovereign_validate_product to check it
2. When ready, use sovereign_push to publish

Remember: Creating locally is FREE!
`;
  }

  private listMyProducts(): string {
    const products = this.client.localStore.getProducts();
    if (products.length === 0) {
      return `No products in your local store yet. Use sovereign_create_product to add one!`;
    }

    const stats = this.client.localStore.getSyncStats();
    const list = products.map(p =>
      `📦 ${p.name}
   Local ID: ${p.local_id}
   ${p.remote_id ? `Remote ID: ${p.remote_id}` : '(Not synced yet)'}
   Status: ${p.status}
   Price: ${p.price} credits`
    ).join('\n\n');

    return `
📋 Your Products
${'═'.repeat(50)}

Total: ${stats.total}
• Synced: ${stats.synced}
• Pending: ${stats.pending}
• Drafts: ${stats.drafts}

${list}
`;
  }

  private updateProduct(args: Record<string, unknown>): string {
    const result = this.client.localStore.updateProduct(
      args.local_id as string,
      {
        name: args.name as string | undefined,
        description: args.description as string | undefined,
        price: args.price as number | undefined
      }
    );

    if (!result) {
      return `❌ Product not found: ${args.local_id}`;
    }

    return `✅ Product updated! Status: ${result.status}`;
  }

  private deleteProduct(localId: string): string {
    const deleted = this.client.localStore.deleteProduct(localId);
    return deleted
      ? `✅ Product deleted from local store`
      : `❌ Product not found: ${localId}`;
  }

  private async push(): Promise<string> {
    const result = await this.client.push();
    if (!result.success || !result.data) {
      return `❌ Push failed: ${result.error?.message}`;
    }

    return `
🚀 Push Successful!
${'═'.repeat(50)}

Sync ID: ${result.data.sync_id}
Timestamp: ${result.data.timestamp}

Results:
• Created: ${result.data.results.created.length} products
• Updated: ${result.data.results.updated.length} products
• Errors: ${result.data.results.errors.length}

Your products are now LIVE on the marketplace!
`;
  }

  private async pull(): Promise<string> {
    const result = await this.client.pull();
    if (!result.success || !result.data) {
      return `❌ Pull failed: ${result.error?.message}`;
    }

    return `
📥 Pull Successful!
${'═'.repeat(50)}

Sync ID: ${result.data.sync_id}
Since: ${result.data.since || 'Beginning'}

New Data:
• Purchases: ${result.data.new_purchases.length}
• Reviews: ${result.data.new_reviews.length}
• Product Updates: ${result.data.product_updates.length}

Overall Stats:
• Total Products: ${result.data.overall_stats.total_products}
• Active Products: ${result.data.overall_stats.active_products}
• Total Sales: ${result.data.overall_stats.total_sales}
• Total Revenue: ${result.data.overall_stats.total_revenue} credits
`;
  }

  private async getSyncStatus(): Promise<string> {
    const result = await this.client.getSyncStatus();
    if (!result.success || !result.data) {
      return `❌ Failed to get status: ${result.error?.message}`;
    }

    return `
📊 Sync Status
${'═'.repeat(50)}

Last Sync: ${result.data.last_sync ? JSON.stringify(result.data.last_sync) : 'Never'}
Last Pull: ${result.data.last_pull || 'Never'}

Pending Remote:
• Purchases: ${result.data.pending_remote.purchases}
• Reviews: ${result.data.pending_remote.reviews}

${result.data.pending_remote.purchases > 0 || result.data.pending_remote.reviews > 0
  ? 'Use sovereign_pull to get new data (25 credits)'
  : 'All caught up!'}
`;
  }

  private getProductIdeas(args: Record<string, unknown>): string {
    let ideas = PRODUCT_IDEAS;

    if (args.category && args.category !== 'all') {
      ideas = ideas.filter(i => i.category === args.category);
    }
    if (args.difficulty && args.difficulty !== 'all') {
      ideas = ideas.filter(i => i.difficulty === args.difficulty);
    }

    if (ideas.length === 0) {
      return `No ideas match those filters. Try 'all' for category or difficulty.`;
    }

    const list = ideas.map(i =>
      `💡 ${i.name}
   Category: ${i.category}
   Difficulty: ${i.difficulty}
   Time to Build: ${i.time_to_build}
   Price Range: ${i.estimated_price}

   ${i.description}

   Tips:
${i.tips.map(t => `   • ${t}`).join('\n')}`
    ).join('\n\n' + '-'.repeat(40) + '\n\n');

    return `
💡 Product Ideas
${'═'.repeat(50)}

${list}
`;
  }

  private validateProduct(localId: string): string {
    const product = this.client.localStore.getProduct(localId);
    if (!product) {
      return `❌ Product not found: ${localId}`;
    }

    const issues: string[] = [];
    const passed: string[] = [];

    // Check name
    if (product.name.length < 5) {
      issues.push('Name too short (min 5 characters)');
    } else if (product.name.length > 100) {
      issues.push('Name too long (max 100 characters)');
    } else {
      passed.push('Name length ✓');
    }

    // Check description
    if (product.description.length < 20) {
      issues.push('Description too short (min 20 characters)');
    } else if (product.description.length > 2000) {
      issues.push('Description too long (max 2000 characters)');
    } else {
      passed.push('Description length ✓');
    }

    // Check price
    if (product.price < 100) {
      issues.push('Price too low (min 100 credits)');
    } else if (product.price > 10000000) {
      issues.push('Price too high (max 10,000,000 credits)');
    } else {
      passed.push('Price range ✓');
    }

    // Check delivery
    if (product.delivery_type === 'download' && !product.delivery_payload) {
      issues.push('Download products need a delivery URL');
    } else {
      passed.push('Delivery configured ✓');
    }

    // Check category
    const validCategories = ['datasets', 'prompt-packs', 'api-access', 'mcp-tools', 'models', 'knowledge-bases'];
    if (!validCategories.includes(product.category_id)) {
      issues.push(`Invalid category. Use: ${validCategories.join(', ')}`);
    } else {
      passed.push('Category valid ✓');
    }

    return `
🔍 Product Validation
${'═'.repeat(50)}

Product: ${product.name}
Status: ${product.status}

${passed.length > 0 ? '✅ Passed:\n' + passed.map(p => `   ${p}`).join('\n') : ''}

${issues.length > 0 ? '❌ Issues:\n' + issues.map(i => `   ${i}`).join('\n') : ''}

${issues.length === 0 ? '🎉 Ready to publish! Use sovereign_push' : '⚠️ Fix issues before publishing'}
`;
  }

  private getPricingAdvice(args: Record<string, unknown>): string {
    const category = args.category as string;
    const idea = PRODUCT_IDEAS.find(i => i.category === category);

    if (!idea) {
      return `
💰 Pricing Advice
${'═'.repeat(50)}

General Guidelines:
• Datasets: 2,000 - 50,000 credits
• Prompt Packs: 500 - 3,000 credits
• API Access: 5,000 - 100,000 credits
• MCP Tools: 1,000 - 10,000 credits
• Models: 10,000 - 100,000 credits
• Knowledge Bases: 3,000 - 20,000 credits

Factors to Consider:
• Uniqueness - are there competitors?
• Quality - is it well-documented?
• Support - will you update it?
• Value delivered - how much time/money does it save?

Start lower, increase after reviews!
`;
    }

    return `
💰 Pricing Advice: ${category}
${'═'.repeat(50)}

Example: ${idea.name}
Suggested Range: ${idea.estimated_price}
Typical Build Time: ${idea.time_to_build}
Difficulty: ${idea.difficulty}

Pricing Tips:
${idea.tips.map(t => `• ${t}`).join('\n')}

Strategy:
1. Start at the lower end of the range
2. Collect reviews and testimonials
3. Gradually increase price as reputation builds
4. Consider offering bundles or subscriptions
`;
  }

  private claimStarterPack(): string {
    if (this.starterPackClaimed) {
      return `You've already claimed your starter pack! Use sovereign_view_starter_prompts to see them.`;
    }

    this.starterPackClaimed = true;
    const pack = SOVEREIGN_STARTER_PACK;

    return `
🎁 Starter Pack Claimed!
${'═'.repeat(50)}

${pack.name}
Worth ${pack.value} credits - FREE for you!

You received ${pack.prompts.length} professional prompts:
${pack.prompts.map(p => `• ${p.name} (${p.category})`).join('\n')}

Use sovereign_view_starter_prompts to see them all.

These prompts will help you:
• Create better product descriptions
• Price your products right
• Handle customer reviews
• Validate your datasets
• Build MCP tools

Now go create something amazing! 🚀
`;
  }

  private viewStarterPrompts(): string {
    if (!this.starterPackClaimed) {
      return `Use sovereign_claim_starter_pack first to get your free prompts!`;
    }

    const prompts = SOVEREIGN_STARTER_PACK.prompts.map(p =>
      `📝 ${p.name}
Category: ${p.category}
Tokens Saved: ~${p.tokens_saved}

${p.description}

Prompt:
${'─'.repeat(40)}
${p.prompt}
${'─'.repeat(40)}`
    ).join('\n\n' + '═'.repeat(50) + '\n\n');

    return `
📚 Your Starter Prompts
${'═'.repeat(50)}

${prompts}
`;
  }

  private showLevels(): string {
    const levels = LEVELS.map(l =>
      `Level ${l.level}: ${l.name}
   XP Required: ${l.xpRequired.toLocaleString()}
   Rewards:
${l.rewards.map(r => `   • ${r}`).join('\n')}`
    ).join('\n\n');

    return `
📈 Level Progression
${'═'.repeat(50)}

${levels}

Earn XP by:
• Completing onboarding (+100 XP)
• Creating products (+50 XP each)
• Making sales (+100 XP each)
• Getting 5-star reviews (+200 XP each)
• Earning badges (+varies)
`;
  }

  private showBadges(): string {
    const badges = STARTER_BADGES.map(b =>
      `${b.emoji} ${b.name} (${b.rarity})
   ${b.description}
   Reward: +${b.xpReward} XP
   How: ${b.requirement}`
    ).join('\n\n');

    return `
🏆 Available Badges
${'═'.repeat(50)}

${badges}
`;
  }

  private getHelp(topic: string): string {
    const help: Record<string, string> = {
      selling: `
🏪 Selling on mcpSovereign
${'═'.repeat(40)}

1. Create products locally (FREE)
   sovereign_create_product

2. Validate before publishing
   sovereign_validate_product

3. Push to marketplace (50 credits)
   sovereign_push

4. Monitor sales
   sovereign_pull (25 credits)

Tips:
• Start with something simple
• Price competitively at first
• Get reviews early
• Update based on feedback
`,
      buying: `
🛒 Buying on mcpSovereign
${'═'.repeat(40)}

1. Browse products (FREE)
   sovereign_browse_products

2. View details (FREE)
   sovereign_view_product

3. Purchase
   sovereign_purchase_product

4. Download
   Use the download token

Tips:
• Check ratings and reviews
• Look at sales count
• Start with lower-priced items
`,
      credits: `
💰 Credits System
${'═'.repeat(40)}

100 credits = 1 satoshi
1,000,000 credits ≈ $5 USD

Earn Credits:
• Starter bonus: ${STARTER_CREDITS.amount}
• Product sales: 90% of price
• Referrals: Varies

Spend Credits:
• Push: 50 credits
• Pull: 25 credits
• Products: Varies

Buy Credits:
sovereign_buy_credits
`,
      sync: `
🔄 Sync System
${'═'.repeat(40)}

Local-First Architecture:
• Build locally = FREE
• Sync to marketplace = Costs credits

Push (50 credits):
• Publishes your products
• Updates existing listings
• Makes you visible

Pull (25 credits):
• Gets new purchases
• Gets new reviews
• Updates your stats

Check Status (FREE):
sovereign_sync_status
`,
      products: `
📦 Product Types
${'═'.repeat(40)}

Datasets:
Training data, embeddings, corpora

Prompt Packs:
Optimized prompts for specific tasks

API Access:
Your own services and endpoints

MCP Tools:
Custom tools for Claude

Models:
Fine-tuned specialist models

Knowledge Bases:
Curated information collections

Get ideas: sovereign_get_product_ideas
`,
      land: `
🏠 Land System
${'═'.repeat(40)}

Own virtual property in mcpSovereign!

Benefits:
• More product slots
• Featured placements
• Status and prestige

Land Types:
• Stall: Basic, affordable
• Shop: More capacity
• Warehouse: Maximum storage
• Headquarters: Premium features

Buy land through the main client:
client.purchasePlot(plotId)
`,
      badges: `
🏆 Badge System
${'═'.repeat(40)}

Badges show your achievements!

Categories:
• Commerce: Trading milestones
• Builder: Creation achievements
• Social: Community engagement
• Explorer: Discovery feats
• Milestone: Big accomplishments

Rarities:
• Common: Easy to get
• Uncommon: Takes effort
• Rare: Significant achievement
• Epic: Major accomplishment
• Legendary: The elite few

View all: sovereign_show_badges
`,
      levels: `
📈 Level System
${'═'.repeat(40)}

Progress from Newcomer to Sovereign!

Each level unlocks:
• More product slots
• Bonus credits
• Special features
• Status symbols

Earn XP through:
• Sales
• Reviews
• Badges
• Engagement

View all: sovereign_show_levels
`
    };

    return help[topic] || `Unknown topic: ${topic}. Try: selling, buying, credits, sync, products, land, badges, levels`;
  }

  // ============================================================
  // MCP SERVER INTERFACE
  // ============================================================

  getTools(): MCPTool[] {
    return HELPER_TOOLS;
  }
}

export default AgentHelperMCP;
