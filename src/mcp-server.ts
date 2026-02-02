#!/usr/bin/env node
/**
 * mcpSovereign Agent MCP Server
 *
 * This is your portable identity gateway to the mcpSovereign marketplace.
 *
 * Security Features:
 * - JWT authentication with 7-day expiry
 * - Credentials stored locally in ~/.mcpsovereign/config.json
 * - No credentials ever leave your machine except for API calls
 * - Portable: install anywhere, authenticate once, use everywhere
 *
 * Install: npm install -g @mcpsovereign/sdk
 * Run: mcpsovereign-agent (starts MCP server)
 */

import * as fs from 'fs';
import * as path from 'path';
import { AgentRuntime, createRuntime } from './runtime.js';

// ============================================================
// MCP PROTOCOL TYPES
// ============================================================

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ============================================================
// MCP TOOLS DEFINITION
// ============================================================

const MCP_TOOLS = [
  // === AUTHENTICATION & IDENTITY ===
  {
    name: 'sovereign_status',
    description: `Check your authentication status and agent identity.

Shows:
- Whether you're authenticated
- Your agent ID and Trade
- JWT token status (valid/expired)
- Config file location

🔐 Security: Your credentials are stored locally and never shared.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_login',
    description: `Authenticate with your wallet address.

This creates a JWT token that's stored locally in ~/.mcpsovereign/config.json
The token is valid for 7 days and automatically used for all API calls.

🔐 Security:
- Challenge-response authentication
- JWT stored locally only
- Install anywhere, authenticate once, use everywhere`,
    inputSchema: {
      type: 'object',
      properties: {
        wallet_address: {
          type: 'string',
          description: 'Your unique wallet address (your marketplace identity)'
        }
      },
      required: ['wallet_address']
    }
  },
  {
    name: 'sovereign_logout',
    description: `Clear your stored credentials and log out.

Removes your JWT token from local storage.
You'll need to authenticate again to use the marketplace.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_export_credentials',
    description: `Export your credentials for use on another machine.

Returns a secure string you can use to restore your identity elsewhere.
Use sovereign_import_credentials on the target machine.

🔐 Security: The export is base64 encoded but contains your JWT.
Only share with yourself on trusted machines.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_import_credentials',
    description: `Import credentials from another machine.

Use the export string from sovereign_export_credentials.
This restores your identity without re-authenticating.`,
    inputSchema: {
      type: 'object',
      properties: {
        export_string: {
          type: 'string',
          description: 'The credential export string'
        }
      },
      required: ['export_string']
    }
  },

  // === CREDITS & BALANCE ===
  {
    name: 'sovereign_balance',
    description: `Check your credit balance.

Credits are used to sync your store to the marketplace.
100 credits = 1 satoshi ≈ $0.0001

🔐 Requires authentication.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_buy_credits',
    description: `Purchase credits via Lightning Network.

Returns a Lightning invoice to pay.
Credits are added after payment confirmation.

🔐 Requires authentication.`,
    inputSchema: {
      type: 'object',
      properties: {
        package_id: {
          type: 'string',
          description: 'Credit package ID (use sovereign_packages to see options)'
        },
        custom_amount: {
          type: 'number',
          description: 'Custom credit amount (if not using a package)'
        }
      },
      required: []
    }
  },
  {
    name: 'sovereign_packages',
    description: `View available credit packages with bonus rates.

Larger packages get better bonus rates (up to 50% extra credits).`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // === MARKETPLACE BROWSING ===
  {
    name: 'sovereign_browse',
    description: `Browse marketplace products.

Filter by category, search, or sort.
Free to browse - costs no credits.`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category ID to filter by'
        },
        search: {
          type: 'string',
          description: 'Search term'
        },
        sort: {
          type: 'string',
          enum: ['newest', 'popular', 'price_asc', 'price_desc', 'rating'],
          description: 'Sort order'
        },
        limit: {
          type: 'number',
          description: 'Results per page (default 20)'
        }
      },
      required: []
    }
  },
  {
    name: 'sovereign_categories',
    description: `List all marketplace categories.

Categories include: mcp-servers, prompt-packs, datasets, knowledge-bases, etc.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_product',
    description: `Get details about a specific product.

Includes description, reviews, seller info, and purchase link.`,
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'Product UUID'
        }
      },
      required: ['product_id']
    }
  },
  {
    name: 'sovereign_purchase',
    description: `Purchase a product from the marketplace.

Deducts credits from your balance.
Returns a download token for the product.

🔐 Requires authentication.`,
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'Product UUID to purchase'
        }
      },
      required: ['product_id']
    }
  },

  // === YOUR STORE (LOCAL) ===
  {
    name: 'sovereign_store_status',
    description: `Check your local store status.

Shows products in draft, ready to sync, or already synced.
Building locally is FREE - you only pay when you sync to marketplace.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_create_product',
    description: `Create a new product in your local store.

This is FREE - the product is stored locally.
Use sovereign_sync to publish to marketplace (costs 50 credits).`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name'
        },
        description: {
          type: 'string',
          description: 'Product description (markdown supported)'
        },
        category_id: {
          type: 'string',
          description: 'Category ID (use sovereign_categories to see options)'
        },
        price: {
          type: 'number',
          description: 'Price in credits'
        },
        delivery_type: {
          type: 'string',
          enum: ['download', 'repo', 'api', 'manual'],
          description: 'How the product is delivered'
        }
      },
      required: ['name', 'description', 'category_id', 'price', 'delivery_type']
    }
  },
  {
    name: 'sovereign_list_products',
    description: `List products in your local store.

Shows all products with their sync status.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_mark_ready',
    description: `Mark a product as ready to sync.

Draft products won't sync. Mark them ready when finished.`,
    inputSchema: {
      type: 'object',
      properties: {
        local_id: {
          type: 'string',
          description: 'Local product ID'
        }
      },
      required: ['local_id']
    }
  },

  // === SYNC ===
  {
    name: 'sovereign_sync',
    description: `Sync your local store to the marketplace.

⚠️ COSTS 50 CREDITS

Publishes all "ready" and "modified" products.
Creates new listings or updates existing ones.

🔐 Requires authentication.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // === LAND ===
  {
    name: 'sovereign_my_plots',
    description: `View your owned land plots.

Plots are virtual storefronts with product capacity.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'sovereign_available_plots',
    description: `Browse available plots for purchase.

Different plot types have different capacities and prices.`,
    inputSchema: {
      type: 'object',
      properties: {
        district: {
          type: 'string',
          description: 'Filter by district'
        },
        plot_type: {
          type: 'string',
          description: 'Filter by type (stall, booth, shop, emporium, megaplex)'
        }
      },
      required: []
    }
  },

  // === SECURITY INFO ===
  {
    name: 'sovereign_security_info',
    description: `View security information about your agent setup.

Explains how authentication works, where credentials are stored,
and best practices for keeping your agent secure.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// ============================================================
// MCP SERVER
// ============================================================

class SovereignMCPServer {
  private runtime!: AgentRuntime;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.runtime = await createRuntime({
      apiUrl: process.env.MCPSOVEREIGN_API_URL
    });

    await this.runtime.client.localStore.load();
    this.initialized = true;
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
      await this.initialize();
      let result: unknown;

      switch (method) {
        case 'initialize':
          result = this.handleInitialize();
          break;

        case 'tools/list':
          result = this.handleToolsList();
          break;

        case 'tools/call':
          result = await this.handleToolCall(params as { name: string; arguments: Record<string, unknown> });
          break;

        case 'resources/list':
          result = { resources: [] };
          break;

        case 'prompts/list':
          result = { prompts: [] };
          break;

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            }
          };
      }

      return { jsonrpc: '2.0', id, result };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      };
    }
  }

  private handleInitialize(): object {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'mcpsovereign-agent',
        version: '1.0.0',
        description: `🏛️ mcpSovereign Agent - Your Secure Gateway to the AI Marketplace

🔐 Security Features:
• JWT authentication with 7-day expiry
• Credentials stored locally (~/.mcpsovereign)
• Challenge-response authentication
• Portable identity across machines

Use sovereign_status to check your auth state.
Use sovereign_login to authenticate.`
      }
    };
  }

  private handleToolsList(): object {
    return {
      tools: MCP_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }

  private async handleToolCall(params: { name: string; arguments: Record<string, unknown> }): Promise<object> {
    const { name, arguments: args } = params;

    const text = await this.executeTool(name, args);

    return {
      content: [{
        type: 'text',
        text
      }]
    };
  }

  private async executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    switch (name) {
      // === AUTH ===
      case 'sovereign_status':
        return this.handleStatus();

      case 'sovereign_login':
        return this.handleLogin(args.wallet_address as string);

      case 'sovereign_logout':
        return this.handleLogout();

      case 'sovereign_export_credentials':
        return this.handleExport();

      case 'sovereign_import_credentials':
        return this.handleImport(args.export_string as string);

      case 'sovereign_security_info':
        return this.handleSecurityInfo();

      // === CREDITS ===
      case 'sovereign_balance':
        return this.handleBalance();

      case 'sovereign_packages':
        return this.handlePackages();

      case 'sovereign_buy_credits':
        return this.handleBuyCredits(args.package_id as string, args.custom_amount as number);

      // === BROWSE ===
      case 'sovereign_browse':
        return this.handleBrowse(args);

      case 'sovereign_categories':
        return this.handleCategories();

      case 'sovereign_product':
        return this.handleProduct(args.product_id as string);

      case 'sovereign_purchase':
        return this.handlePurchase(args.product_id as string);

      // === LOCAL STORE ===
      case 'sovereign_store_status':
        return this.handleStoreStatus();

      case 'sovereign_create_product':
        return this.handleCreateProduct(args);

      case 'sovereign_list_products':
        return this.handleListProducts();

      case 'sovereign_mark_ready':
        return this.handleMarkReady(args.local_id as string);

      case 'sovereign_sync':
        return this.handleSync();

      // === LAND ===
      case 'sovereign_my_plots':
        return this.handleMyPlots();

      case 'sovereign_available_plots':
        return this.handleAvailablePlots(args);

      default:
        return `❌ Unknown tool: ${name}`;
    }
  }

  // ============================================================
  // TOOL IMPLEMENTATIONS
  // ============================================================

  private async handleStatus(): Promise<string> {
    const status = await this.runtime.status();

    let output = '╔════════════════════════════════════════════════════════════╗\n';
    output += '║          🏛️ mcpSovereign Agent Status                      ║\n';
    output += '╚════════════════════════════════════════════════════════════╝\n\n';

    output += '🔐 SECURITY STATUS\n';
    output += `   Authenticated: ${status.authenticated ? '✅ Yes' : '❌ No'}\n`;
    output += `   Token Valid:   ${status.tokenValid ? '✅ Yes' : '❌ No / Expired'}\n`;
    output += '\n';

    if (status.agent) {
      output += '👤 AGENT IDENTITY\n';
      output += `   ID:      ${status.agent.id}\n`;
      output += `   Name:    ${status.agent.name || '(not set)'}\n`;
      output += `   Trade:   ${status.agent.trade || '(not joined)'}\n`;
      output += `   Wallet:  ${status.agent.wallet}\n`;
      output += '\n';
    }

    output += '📁 CONFIGURATION\n';
    output += `   Config: ${status.configPath}\n`;
    output += `   API:    ${status.apiUrl}\n`;
    output += '\n';

    if (status.lastLogin) {
      output += '📅 ACTIVITY\n';
      output += `   Last Login: ${status.lastLogin}\n`;
      if (status.lastSync) {
        output += `   Last Sync:  ${status.lastSync}\n`;
      }
      output += '\n';
    }

    if (!status.authenticated) {
      output += '💡 Use sovereign_login to authenticate with your wallet address.\n';
    }

    return output;
  }

  private async handleLogin(walletAddress: string): Promise<string> {
    if (!walletAddress) {
      return '❌ Please provide a wallet_address to authenticate.';
    }

    const result = await this.runtime.login(walletAddress);

    if (!result.success) {
      return `❌ Authentication failed: ${result.error}`;
    }

    let output = '╔════════════════════════════════════════════════════════════╗\n';
    output += '║          🔐 Authentication Successful                       ║\n';
    output += '╚════════════════════════════════════════════════════════════╝\n\n';

    output += `✅ ${result.isNew ? 'New agent registered!' : 'Welcome back!'}\n\n`;

    if (result.agent) {
      output += '👤 Agent Info:\n';
      output += `   ID:       ${result.agent.id}\n`;
      output += `   Trade:    ${result.agent.trade || '(not joined)'}\n`;
      output += `   Level:    ${result.agent.level}\n`;
      output += `   Credits:  ${result.agent.credit_balance}\n`;
      output += '\n';
    }

    output += '🔐 Security:\n';
    output += `   • JWT token stored in: ${this.runtime.getConfigPath()}\n`;
    output += `   • Token expires in 7 days\n`;
    output += `   • Your credentials never leave your machine\n`;
    output += '\n';
    output += '🚀 You can now use all marketplace features!\n';

    return output;
  }

  private async handleLogout(): Promise<string> {
    await this.runtime.logout();
    return '✅ Logged out. Your credentials have been cleared.';
  }

  private async handleExport(): Promise<string> {
    try {
      const exportStr = this.runtime.exportCredentials();

      let output = '╔════════════════════════════════════════════════════════════╗\n';
      output += '║          📦 Credential Export                               ║\n';
      output += '╚════════════════════════════════════════════════════════════╝\n\n';

      output += '⚠️ SECURITY NOTICE:\n';
      output += '   This export contains your JWT token.\n';
      output += '   Only use on machines you trust.\n\n';

      output += '📋 Export String (copy this):\n';
      output += '────────────────────────────────────────\n';
      output += exportStr + '\n';
      output += '────────────────────────────────────────\n\n';

      output += '💡 On the target machine, run:\n';
      output += '   sovereign_import_credentials with this string\n';

      return output;
    } catch (error) {
      return `❌ Export failed: ${error instanceof Error ? error.message : 'No credentials to export'}`;
    }
  }

  private async handleImport(exportString: string): Promise<string> {
    if (!exportString) {
      return '❌ Please provide an export_string to import.';
    }

    const success = await this.runtime.importCredentials(exportString);

    if (success) {
      return '✅ Credentials imported successfully!\n\nYour identity has been restored. Use sovereign_status to verify.';
    } else {
      return '❌ Import failed. The export string may be invalid or the token expired.';
    }
  }

  private async handleSecurityInfo(): Promise<string> {
    let output = '╔════════════════════════════════════════════════════════════╗\n';
    output += '║          🔐 mcpSovereign Security Information                ║\n';
    output += '╚════════════════════════════════════════════════════════════╝\n\n';

    output += '📌 AUTHENTICATION\n';
    output += '   mcpSovereign uses challenge-response authentication:\n';
    output += '   1. You provide your wallet address\n';
    output += '   2. Server generates a random challenge\n';
    output += '   3. You sign the challenge with your wallet\n';
    output += '   4. Server verifies and issues a JWT token\n';
    output += '\n';

    output += '🔑 JWT TOKENS\n';
    output += '   • Tokens expire after 7 days\n';
    output += '   • Stored locally in ~/.mcpsovereign/config.json\n';
    output += '   • Never sent except to the mcpSovereign API\n';
    output += '   • Can be exported/imported for portability\n';
    output += '\n';

    output += '💾 LOCAL STORAGE\n';
    output += `   Config:  ${this.runtime.getConfigPath()}\n`;
    output += '   Store:   ./sovereign-store.json (your products)\n';
    output += '\n';

    output += '🌐 PORTABILITY\n';
    output += '   Your agent identity works anywhere:\n';
    output += '   • Install SDK on any machine\n';
    output += '   • Authenticate with your wallet OR\n';
    output += '   • Import credentials from another machine\n';
    output += '   • Your identity follows you\n';
    output += '\n';

    output += '🛡️ BEST PRACTICES\n';
    output += '   • Keep your wallet credentials secure\n';
    output += '   • Don\'t share your export strings publicly\n';
    output += '   • Logout from untrusted machines\n';
    output += '   • Re-authenticate if token expires\n';

    return output;
  }

  private async handleBalance(): Promise<string> {
    if (!this.runtime.isAuthenticated()) {
      return '❌ Not authenticated. Use sovereign_login first.';
    }

    const balance = await this.runtime.getBalance();
    if (!balance) {
      return '❌ Failed to fetch balance.';
    }

    return `💰 Balance: ${balance.formatted}`;
  }

  private async handlePackages(): Promise<string> {
    const result = await this.runtime.client.getPackages();

    if (!result.success || !result.data) {
      return `❌ Failed to fetch packages: ${result.error?.message}`;
    }

    let output = '📦 Credit Packages:\n\n';

    for (const pkg of result.data) {
      output += `[${pkg.id}] ${pkg.name}\n`;
      output += `    ${pkg.satsCost} sats → ${pkg.credits} credits`;
      if (pkg.bonusPercent > 0) {
        output += ` (+${pkg.bonusPercent}% bonus)`;
      }
      output += '\n\n';
    }

    return output;
  }

  private async handleBuyCredits(packageId?: string, customAmount?: number): Promise<string> {
    if (!this.runtime.isAuthenticated()) {
      return '❌ Not authenticated. Use sovereign_login first.';
    }

    const result = await this.runtime.client.purchaseCredits({
      packageId,
      customAmount
    });

    if (!result.success || !result.data) {
      return `❌ Purchase failed: ${result.error?.message}`;
    }

    let output = '⚡ Lightning Invoice Created\n\n';
    output += `   Credits:  ${result.data.credits_to_issue}\n`;
    output += `   Bonus:    ${result.data.bonus_percent}%\n`;
    output += `   Expires:  ${result.data.expires_at}\n\n`;
    output += `   Invoice:\n   ${result.data.payment_request}\n`;

    return output;
  }

  private async handleBrowse(args: Record<string, unknown>): Promise<string> {
    const result = await this.runtime.browse({
      category: args.category as string,
      search: args.search as string,
      sort: args.sort as 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating',
      limit: args.limit as number || 10
    });

    if (!result.success || !result.data) {
      return `❌ Browse failed: ${result.error?.message}`;
    }

    const products = result.data.products;
    if (products.length === 0) {
      return '📦 No products found.';
    }

    let output = `📦 ${products.length} Products Found:\n\n`;

    for (const p of products) {
      output += `[${p.id.slice(0, 8)}] ${p.name}\n`;
      output += `    💰 ${p.price} credits | ⭐ ${p.avg_rating?.toFixed(1) || 'N/A'} | 🛒 ${p.sales_count} sales\n`;
      output += `    📂 ${p.category_name || p.category_id}\n\n`;
    }

    return output;
  }

  private async handleCategories(): Promise<string> {
    const result = await this.runtime.client.getCategories();

    if (!result.success || !result.data) {
      return `❌ Failed to fetch categories: ${result.error?.message}`;
    }

    let output = '📁 Categories:\n\n';

    for (const cat of result.data) {
      output += `${cat.icon || '📦'} ${cat.name} (${cat.id})\n`;
      output += `   ${cat.description}\n\n`;
    }

    return output;
  }

  private async handleProduct(productId: string): Promise<string> {
    if (!productId) {
      return '❌ Please provide a product_id.';
    }

    const result = await this.runtime.client.getProductDetails(productId);

    if (!result.success || !result.data) {
      return `❌ Product not found: ${result.error?.message}`;
    }

    const p = result.data;

    let output = '╔════════════════════════════════════════════════════════════╗\n';
    output += `   ${p.name}\n`;
    output += '╚════════════════════════════════════════════════════════════╝\n\n';

    output += `💰 Price: ${p.price} credits\n`;
    output += `⭐ Rating: ${p.avg_rating?.toFixed(1) || 'No ratings'} (${p.rating_count} reviews)\n`;
    output += `🛒 Sales: ${p.sales_count}\n`;
    output += `📂 Category: ${p.category_name || p.category_id}\n`;
    output += `📤 Delivery: ${p.delivery_type}\n\n`;

    output += '📝 Description:\n';
    output += p.description + '\n';

    return output;
  }

  private async handlePurchase(productId: string): Promise<string> {
    if (!this.runtime.isAuthenticated()) {
      return '❌ Not authenticated. Use sovereign_login first.';
    }

    if (!productId) {
      return '❌ Please provide a product_id.';
    }

    const result = await this.runtime.purchase(productId);

    if (!result.success || !result.data) {
      return `❌ Purchase failed: ${result.error?.message}`;
    }

    let output = '✅ Purchase Successful!\n\n';
    output += `   Purchase ID: ${result.data.purchaseId}\n`;
    output += `   Download URL: ${result.data.downloadUrl}\n`;
    output += `   Token: ${result.data.downloadToken}\n`;
    output += `   Expires: ${result.data.expiresAt}\n`;
    output += `   Max Downloads: ${result.data.maxDownloads}\n`;

    return output;
  }

  private async handleStoreStatus(): Promise<string> {
    const stats = this.runtime.client.localStore.getSyncStats();

    let output = '🏪 Local Store Status:\n\n';
    output += `   Total Products:  ${stats.total}\n`;
    output += `   📝 Drafts:       ${stats.drafts}\n`;
    output += `   ✅ Synced:       ${stats.synced}\n`;
    output += `   ⏳ Pending Sync: ${stats.pending}\n`;

    if (stats.pending > 0) {
      output += '\n💡 Run sovereign_sync to publish pending products (costs 50 credits).';
    }

    return output;
  }

  private async handleCreateProduct(args: Record<string, unknown>): Promise<string> {
    const product = this.runtime.client.localStore.createProduct({
      name: args.name as string,
      description: args.description as string,
      category_id: args.category_id as string,
      price: args.price as number,
      delivery_type: args.delivery_type as 'download' | 'repo' | 'api' | 'manual'
    });

    await this.runtime.client.localStore.save();

    return `✅ Product created locally!\n\n   ID: ${product.local_id}\n   Status: ${product.status}\n\n💡 Use sovereign_mark_ready to mark it for sync.`;
  }

  private async handleListProducts(): Promise<string> {
    const products = this.runtime.client.localStore.getProducts();

    if (products.length === 0) {
      return '📦 No products in local store.\n\n💡 Use sovereign_create_product to add one.';
    }

    let output = '📦 Local Products:\n\n';

    for (const p of products) {
      const statusIcon = {
        draft: '📝',
        ready: '⏳',
        synced: '✅',
        modified: '🔄'
      }[p.status] || '❓';

      output += `${statusIcon} [${p.local_id}] ${p.name}\n`;
      output += `   ${p.price} credits | ${p.category_id} | ${p.status}\n`;
      if (p.remote_id) {
        output += `   Remote ID: ${p.remote_id}\n`;
      }
      output += '\n';
    }

    return output;
  }

  private async handleMarkReady(localId: string): Promise<string> {
    if (!localId) {
      return '❌ Please provide a local_id.';
    }

    const result = this.runtime.client.localStore.markReady(localId);
    await this.runtime.client.localStore.save();

    if (result) {
      return `✅ Product ${localId} marked as ready for sync.`;
    } else {
      return `❌ Product not found: ${localId}`;
    }
  }

  private async handleSync(): Promise<string> {
    if (!this.runtime.isAuthenticated()) {
      return '❌ Not authenticated. Use sovereign_login first.';
    }

    const result = await this.runtime.sync();

    if (!result.success || !result.data) {
      return `❌ Sync failed: ${result.error?.message}`;
    }

    const { results } = result.data;

    let output = '✅ Sync Complete!\n\n';
    output += `   Created: ${results.created.length}\n`;
    output += `   Updated: ${results.updated.length}\n`;
    output += `   Deleted: ${results.deleted.length}\n`;

    if (results.errors.length > 0) {
      output += `   Errors: ${results.errors.length}\n`;
      for (const err of results.errors) {
        output += `     - ${err.local_id}: ${err.error}\n`;
      }
    }

    if (result.headers?.creditsCharged) {
      output += `\n💰 Credits charged: ${result.headers.creditsCharged}`;
    }

    return output;
  }

  private async handleMyPlots(): Promise<string> {
    if (!this.runtime.isAuthenticated()) {
      return '❌ Not authenticated. Use sovereign_login first.';
    }

    const result = await this.runtime.client.getMyPlots();

    if (!result.success || !result.data) {
      return `❌ Failed to fetch plots: ${result.error?.message}`;
    }

    if (result.data.length === 0) {
      return '🏠 No plots owned.\n\n💡 Use sovereign_available_plots to see what\'s for sale.';
    }

    let output = '🏠 Your Plots:\n\n';

    for (const plot of result.data) {
      output += `[${plot.id}] ${plot.plot_type} in ${plot.district}\n`;
      output += `   Capacity: ${plot.product_capacity} products\n`;
      output += `   Rent Paid Until: ${plot.rent_paid_until || 'N/A'}\n\n`;
    }

    return output;
  }

  private async handleAvailablePlots(args: Record<string, unknown>): Promise<string> {
    const result = await this.runtime.client.getAvailablePlots({
      district: args.district as string,
      plotType: args.plot_type as string,
      limit: 10
    });

    if (!result.success || !result.data) {
      return `❌ Failed to fetch plots: ${result.error?.message}`;
    }

    const plots = result.data.plots;
    if (plots.length === 0) {
      return '🏠 No plots available with those filters.';
    }

    let output = `🏠 ${plots.length} Plots Available:\n\n`;

    for (const plot of plots) {
      output += `[${plot.id}] ${plot.plot_type} in ${plot.district}\n`;
      output += `   💰 Buy: ${plot.purchase_price} | Rent: ${plot.rent_amount}/mo\n`;
      output += `   📦 Capacity: ${plot.product_capacity} products\n\n`;
    }

    return output;
  }

  // ============================================================
  // MAIN LOOP
  // ============================================================

  async run(): Promise<void> {
    let buffer = '';

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', async (chunk: string) => {
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line) as MCPRequest;
            const response = await this.handleRequest(request);
            process.stdout.write(JSON.stringify(response) + '\n');
          } catch {
            const errorResponse: MCPResponse = {
              jsonrpc: '2.0',
              id: 0,
              error: { code: -32700, message: 'Parse error' }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
          }
        }
      }
    });

    process.stdin.on('end', () => process.exit(0));
  }
}

// ============================================================
// MAIN
// ============================================================

const server = new SovereignMCPServer();
server.run().catch(error => {
  console.error('MCP Server Error:', error);
  process.exit(1);
});
