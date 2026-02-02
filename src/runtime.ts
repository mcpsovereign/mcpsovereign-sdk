// =============================================================================
// Agent Runtime - Portable Identity Management
// =============================================================================
// The agent runtime handles:
// - Persistent authentication (JWT stored locally)
// - Portable identity (install anywhere, authenticate once)
// - Config file management
// - Easy API access
//
// Usage:
//   const runtime = new AgentRuntime();
//   await runtime.init();
//
//   // First time: authenticate
//   if (!runtime.isAuthenticated()) {
//     await runtime.login('my-wallet-address');
//   }
//
//   // From now on, JWT is persisted - works anywhere you install
//   const balance = await runtime.client.getBalance();
// =============================================================================

import { homedir } from 'os';
import { join, dirname } from 'path';
import SovereignClient, { type Agent, type SovereignConfig } from './index.js';

// =============================================================================
// Types
// =============================================================================

export interface RuntimeConfig {
  // API configuration
  apiUrl: string;

  // Authentication
  walletAddress: string | null;
  authToken: string | null;
  tokenExpiresAt: string | null;

  // Agent info (cached)
  agentId: string | null;
  agentName: string | null;
  trade: string | null;

  // Local store path
  storePath: string;

  // Timestamps
  lastLogin: string | null;
  lastSync: string | null;

  // Runtime flags
  isPuppet?: boolean;  // Platform-controlled account
}

export interface RuntimeOptions {
  /** Custom config directory (default: ~/.mcpsovereign) */
  configDir?: string;

  /** Custom API URL */
  apiUrl?: string;

  /** Auto-initialize on construction */
  autoInit?: boolean;

  /** Wallet signing function for authentication */
  signMessage?: (message: string) => Promise<string>;
}

// =============================================================================
// Agent Runtime Class
// =============================================================================

export class AgentRuntime {
  private config: RuntimeConfig;
  private configPath: string;
  private initialized = false;
  private fs: typeof import('fs') | null = null;

  /** The Sovereign client - use this for all API calls */
  public client: SovereignClient;

  constructor(private options: RuntimeOptions = {}) {
    const configDir = options.configDir || join(homedir(), '.mcpsovereign');
    this.configPath = join(configDir, 'config.json');

    // Default config
    this.config = this.getDefaultConfig();
    if (options.apiUrl) {
      this.config.apiUrl = options.apiUrl;
    }

    // Initialize client (will be configured after init)
    this.client = new SovereignClient({
      baseUrl: this.config.apiUrl,
    });
  }

  private getDefaultConfig(): RuntimeConfig {
    return {
      apiUrl: process.env.MCPSOVEREIGN_API_URL || 'https://api.mcpsovereign.com/api/v1',
      walletAddress: null,
      authToken: null,
      tokenExpiresAt: null,
      agentId: null,
      agentName: null,
      trade: null,
      storePath: './sovereign-store.json',
      lastLogin: null,
      lastSync: null,
    };
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize the runtime - loads config and sets up client
   * Call this before using any other methods
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.fs = await import('fs');

      // Ensure config directory exists
      const configDir = dirname(this.configPath);
      if (!this.fs.existsSync(configDir)) {
        this.fs.mkdirSync(configDir, { recursive: true });
      }

      // Load existing config if present
      if (this.fs.existsSync(this.configPath)) {
        const data = this.fs.readFileSync(this.configPath, 'utf-8');
        const loaded = JSON.parse(data) as Partial<RuntimeConfig>;
        this.config = { ...this.config, ...loaded };
      }

      // Apply API URL from options/env
      if (this.options.apiUrl) {
        this.config.apiUrl = this.options.apiUrl;
      }

      // Configure client with loaded token
      this.client = new SovereignClient({
        baseUrl: this.config.apiUrl,
        authToken: this.config.authToken || undefined,
        localStorePath: this.config.storePath,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Runtime init failed:', error);
      throw error;
    }
  }

  /**
   * Save current config to disk
   */
  async save(): Promise<void> {
    if (!this.fs) {
      this.fs = await import('fs');
    }

    const configDir = dirname(this.configPath);
    if (!this.fs.existsSync(configDir)) {
      this.fs.mkdirSync(configDir, { recursive: true });
    }

    this.fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  /**
   * Check if we have a valid auth token
   */
  isAuthenticated(): boolean {
    if (!this.config.authToken) return false;

    // Check expiry if we have it
    if (this.config.tokenExpiresAt) {
      const expires = new Date(this.config.tokenExpiresAt);
      if (expires <= new Date()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the current agent info (from cache)
   */
  getAgent(): { id: string; name: string | null; trade: string | null; wallet: string } | null {
    if (!this.config.agentId || !this.config.walletAddress) return null;

    return {
      id: this.config.agentId,
      name: this.config.agentName,
      trade: this.config.trade,
      wallet: this.config.walletAddress,
    };
  }

  /**
   * Authenticate with a wallet address
   * Persists the JWT token locally for future sessions
   */
  async login(walletAddress: string): Promise<{
    success: boolean;
    agent?: Agent;
    isNew?: boolean;
    error?: string;
  }> {
    await this.ensureInitialized();

    try {
      const result = await this.client.authenticate(walletAddress, this.options.signMessage);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error?.message || 'Authentication failed',
        };
      }

      const { token, agent, is_new_agent } = result.data;

      // Store credentials
      this.config.walletAddress = walletAddress;
      this.config.authToken = token;
      this.config.agentId = agent.id;
      this.config.agentName = agent.display_name;
      this.config.trade = agent.trade;
      this.config.lastLogin = new Date().toISOString();

      // Calculate token expiry (7 days from now - matches server)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      this.config.tokenExpiresAt = expiresAt.toISOString();

      // Update client with new token
      this.client.setToken(token);

      // Persist config
      await this.save();

      return {
        success: true,
        agent,
        isNew: is_new_agent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load existing credentials from environment or config
   * Useful for CI/CD or automated setups
   */
  async loadCredentials(options: {
    token?: string;
    walletAddress?: string;
    fromEnv?: boolean;
  } = {}): Promise<boolean> {
    await this.ensureInitialized();

    // Check environment variables
    if (options.fromEnv) {
      const envToken = process.env.MCPSOVEREIGN_TOKEN;
      const envWallet = process.env.MCPSOVEREIGN_WALLET;

      if (envToken) {
        this.config.authToken = envToken;
        this.client.setToken(envToken);
      }
      if (envWallet) {
        this.config.walletAddress = envWallet;
      }
    }

    // Direct credentials
    if (options.token) {
      this.config.authToken = options.token;
      this.client.setToken(options.token);
    }
    if (options.walletAddress) {
      this.config.walletAddress = options.walletAddress;
    }

    // Verify token is valid by getting agent info
    if (this.config.authToken) {
      const result = await this.client.getAgentInfo();
      if (result.success && result.data) {
        this.config.agentId = result.data.id;
        this.config.agentName = result.data.display_name;
        this.config.trade = result.data.trade;
        await this.save();
        return true;
      }
    }

    return false;
  }

  /**
   * Clear stored credentials (logout)
   */
  async logout(): Promise<void> {
    await this.ensureInitialized();

    this.config.authToken = null;
    this.config.tokenExpiresAt = null;
    this.config.agentId = null;
    this.config.agentName = null;
    this.config.trade = null;

    this.client = new SovereignClient({
      baseUrl: this.config.apiUrl,
      localStorePath: this.config.storePath,
    });

    await this.save();
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Get the config path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get the current API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Set the API URL (also updates client)
   */
  async setApiUrl(url: string): Promise<void> {
    await this.ensureInitialized();

    this.config.apiUrl = url;

    // Recreate client with new URL
    this.client = new SovereignClient({
      baseUrl: url,
      authToken: this.config.authToken || undefined,
      localStorePath: this.config.storePath,
    });

    await this.save();
  }

  /**
   * Export credentials for portability
   * Returns a string that can be used to restore credentials elsewhere
   */
  exportCredentials(): string {
    if (!this.config.authToken || !this.config.walletAddress) {
      throw new Error('No credentials to export');
    }

    const exportData = {
      version: '1.0',
      wallet: this.config.walletAddress,
      token: this.config.authToken,
      agentId: this.config.agentId,
      apiUrl: this.config.apiUrl,
      exportedAt: new Date().toISOString(),
    };

    // Base64 encode for easy transport
    return Buffer.from(JSON.stringify(exportData)).toString('base64');
  }

  /**
   * Import credentials from an export string
   */
  async importCredentials(exportString: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const data = JSON.parse(Buffer.from(exportString, 'base64').toString('utf-8'));

      if (data.version !== '1.0') {
        throw new Error('Unsupported export version');
      }

      this.config.walletAddress = data.wallet;
      this.config.authToken = data.token;
      this.config.agentId = data.agentId;
      if (data.apiUrl) {
        this.config.apiUrl = data.apiUrl;
      }

      this.client = new SovereignClient({
        baseUrl: this.config.apiUrl,
        authToken: this.config.authToken || undefined,
        localStorePath: this.config.storePath,
      });

      // Verify the token works
      const result = await this.client.getAgentInfo();
      if (result.success && result.data) {
        this.config.agentName = result.data.display_name;
        this.config.trade = result.data.trade;
        await this.save();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  /**
   * Get runtime status summary
   */
  async status(): Promise<{
    initialized: boolean;
    authenticated: boolean;
    agent: { id: string; name: string | null; trade: string | null; wallet: string } | null;
    apiUrl: string;
    configPath: string;
    lastLogin: string | null;
    lastSync: string | null;
    tokenValid: boolean;
    isPuppet: boolean;
  }> {
    await this.ensureInitialized();

    let tokenValid = false;
    if (this.config.authToken) {
      const result = await this.client.getAgentInfo();
      tokenValid = result.success;
    }

    return {
      initialized: this.initialized,
      authenticated: this.isAuthenticated(),
      agent: this.getAgent(),
      apiUrl: this.config.apiUrl,
      configPath: this.configPath,
      lastLogin: this.config.lastLogin,
      lastSync: this.config.lastSync,
      tokenValid,
      isPuppet: this.config.isPuppet || false,
    };
  }

  // ---------------------------------------------------------------------------
  // Convenience Methods
  // ---------------------------------------------------------------------------

  /**
   * Get credit balance
   */
  async getBalance(): Promise<{ balance: string; formatted: string } | null> {
    await this.ensureInitialized();

    const result = await this.client.getBalance();
    if (!result.success || !result.data) return null;

    const balance = result.data.balance;
    const sats = Math.floor(parseInt(balance) / 100);

    return {
      balance,
      formatted: `${balance} credits (≈${sats} sats)`,
    };
  }

  /**
   * Browse marketplace
   */
  async browse(options: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating';
  } = {}) {
    await this.ensureInitialized();
    return this.client.browseProducts(options);
  }

  /**
   * Purchase a product
   */
  async purchase(productId: string) {
    await this.ensureInitialized();
    return this.client.purchaseProduct(productId);
  }

  /**
   * Sync local store to marketplace
   */
  async sync() {
    await this.ensureInitialized();

    const pushResult = await this.client.push();

    if (pushResult.success) {
      this.config.lastSync = new Date().toISOString();
      await this.save();
    }

    return pushResult;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}

// =============================================================================
// Factory function
// =============================================================================

/**
 * Create and initialize an agent runtime
 */
export async function createRuntime(options: RuntimeOptions = {}): Promise<AgentRuntime> {
  const runtime = new AgentRuntime(options);
  await runtime.init();
  return runtime;
}

export default AgentRuntime;
