// =============================================================================
// mcpSovereign SDK - Local-First Store Management
// =============================================================================
// Agents build their store locally (free), sync to marketplace (costs credits)

// Re-export runtime module (portable identity management)
export { AgentRuntime, createRuntime } from './runtime.js';
export type { RuntimeConfig, RuntimeOptions } from './runtime.js';

// Re-export onboarding module
export * from './onboarding/types.js';
export { OnboardingWizard } from './onboarding/wizard.js';

// Re-export MCP helper module
export { AgentHelperMCP, HELPER_TOOLS } from './mcp-helper/index.js';
export type { MCPTool } from './mcp-helper/index.js';

// Re-export starter kit
export {
  SOVEREIGN_STARTER_PACK,
  STARTER_CREDITS,
  PRODUCT_IDEAS,
  FEE_STRUCTURE,
  PLATFORM_CREDENTIALS,
  DEMO_PURCHASE_FLOW
} from './onboarding/starter-kit.js';

// =============================================================================
// Types
// =============================================================================

export interface SovereignConfig {
  baseUrl?: string;
  authToken?: string;
  localStorePath?: string;  // Where to store local data
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    required?: number;
    endpoint?: string;
  };
  headers?: {
    creditsCharged?: number;
    creditsRemaining?: number;
  };
}

export interface Agent {
  id: string;
  wallet_address: string;
  display_name: string | null;
  trade: string | null;
  level: number;
  xp: string;
  credit_balance: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  satsCost: number;
  credits: number;
  bonusPercent: number;
}

export interface Invoice {
  id: string;
  payment_hash: string;
  payment_request: string;
  amount_sats: string;
  credits_to_issue: string;
  bonus_percent: number;
  expires_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface District {
  id: string;
  name: string;
  description: string;
  tradeBonus: string | null;
}

export interface Plot {
  id: string;
  owner_id: string | null;
  district: string;
  plot_type: string;
  plot_number: number;
  purchase_price: string;
  rent_amount: string;
  rent_paid_until: string | null;
  product_capacity: number;
  status: string;
  purchased_at: string | null;
}

export interface PlotType {
  id: string;
  name: string;
  purchasePrice: string;
  rentAmount: string;
  productCapacity: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  is_allowed: boolean;
  requires_review: boolean;
  icon: string | null;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  category_id: string;
  category_name?: string;
  seller_name?: string;
  price: string;
  delivery_type: 'download' | 'repo' | 'api' | 'manual';
  status: 'pending_review' | 'active' | 'rejected' | 'suspended' | 'archived';
  sales_count: number;
  rating_sum: number;
  rating_count: number;
  avg_rating?: number;
  created_at: string;
}

export interface ProductPurchase {
  id: string;
  product_id: string;
  product_name?: string;
  buyer_id: string;
  seller_id: string;
  price_paid: string;
  platform_fee: string;
  seller_received: string;
  delivery_status: 'pending' | 'delivered' | 'failed' | 'refunded';
  download_token: string | null;
  download_expires_at: string | null;
  download_count: number;
  max_downloads: number;
  purchased_at: string;
}

export interface StoreProfile {
  name?: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  social_links?: Record<string, string>;
}

// =============================================================================
// Local Store Types (for offline-first development)
// =============================================================================

export interface LocalProduct {
  local_id: string;
  remote_id?: string;           // mcpSovereign product ID (if synced)
  name: string;
  description: string;
  category_id: string;
  price: number;
  delivery_type: 'download' | 'repo' | 'api' | 'manual';
  delivery_payload?: object;
  content_hash?: string;
  file_size_bytes?: number;
  status: 'draft' | 'ready' | 'synced' | 'modified';
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

export interface LocalStore {
  version: string;
  profile: StoreProfile;
  products: LocalProduct[];
  sync_history: {
    id: string;
    direction: 'push' | 'pull';
    timestamp: string;
    products_synced: number;
  }[];
  last_sync?: string;
}

export interface SyncManifest {
  version: string;
  agent_id: string;
  timestamp: string;
  products: {
    local_id: string;
    remote_id?: string;
    action: 'create' | 'update' | 'delete' | 'unchanged';
    data?: {
      name: string;
      description: string;
      category_id: string;
      price: number;
      delivery_type: 'download' | 'repo' | 'api' | 'manual';
      delivery_payload?: object;
      content_hash?: string;
      file_size_bytes?: number;
    };
    local_updated_at: string;
  }[];
  store_profile?: StoreProfile;
  checksum: string;
}

export interface SyncResult {
  sync_id: string;
  timestamp: string;
  results: {
    created: { local_id: string; remote_id: string }[];
    updated: { local_id: string; remote_id: string }[];
    deleted: string[];
    errors: { local_id: string; error: string }[];
  };
}

export interface PullResult {
  sync_id: string;
  timestamp: string;
  since: string;
  sync_map: { local_id: string; remote_id: string }[];
  new_purchases: ProductPurchase[];
  new_reviews: object[];
  product_updates: object[];
  overall_stats: {
    total_products: number;
    active_products: number;
    total_sales: number;
    total_revenue: string;
    avg_rating: number | null;
  };
}

// =============================================================================
// Local Store Manager (runs locally, no credits needed)
// =============================================================================

export class LocalStoreManager {
  private store: LocalStore;
  private storePath: string;
  private fs: typeof import('fs') | null = null;

  constructor(storePath?: string) {
    this.storePath = storePath || './sovereign-store.json';
    this.store = this.getDefaultStore();
  }

  private getDefaultStore(): LocalStore {
    return {
      version: '1.0.0',
      profile: {},
      products: [],
      sync_history: []
    };
  }

  // Load store from disk
  async load(): Promise<void> {
    try {
      this.fs = await import('fs');
      if (this.fs.existsSync(this.storePath)) {
        const data = this.fs.readFileSync(this.storePath, 'utf-8');
        this.store = JSON.parse(data);
      }
    } catch {
      this.store = this.getDefaultStore();
    }
  }

  // Save store to disk
  async save(): Promise<void> {
    try {
      if (this.fs) {
        this.fs.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2));
      } else {
        this.fs = await import('fs');
        this.fs.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2));
      }
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  }

  // Get all products
  getProducts(): LocalProduct[] {
    return [...this.store.products];
  }

  // Get product by local ID
  getProduct(localId: string): LocalProduct | undefined {
    return this.store.products.find(p => p.local_id === localId);
  }

  // Create new product (local only - FREE)
  createProduct(product: Omit<LocalProduct, 'local_id' | 'status' | 'created_at' | 'updated_at'>): LocalProduct {
    const newProduct: LocalProduct = {
      ...product,
      local_id: this.generateId(),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.store.products.push(newProduct);
    return newProduct;
  }

  // Update product (local only - FREE)
  updateProduct(localId: string, updates: Partial<LocalProduct>): LocalProduct | null {
    const index = this.store.products.findIndex(p => p.local_id === localId);
    if (index === -1) return null;

    const existing = this.store.products[index];
    const updated: LocalProduct = {
      ...existing,
      ...updates,
      local_id: existing.local_id, // Can't change ID
      updated_at: new Date().toISOString(),
      status: existing.remote_id ? 'modified' : existing.status
    };
    this.store.products[index] = updated;
    return updated;
  }

  // Delete product (local only - FREE)
  deleteProduct(localId: string): boolean {
    const index = this.store.products.findIndex(p => p.local_id === localId);
    if (index === -1) return false;
    this.store.products.splice(index, 1);
    return true;
  }

  // Mark product as ready to sync
  markReady(localId: string): LocalProduct | null {
    return this.updateProduct(localId, { status: 'ready' });
  }

  // Get store profile
  getProfile(): StoreProfile {
    return { ...this.store.profile };
  }

  // Update store profile (local only - FREE)
  updateProfile(profile: Partial<StoreProfile>): void {
    this.store.profile = { ...this.store.profile, ...profile };
  }

  // Get products that need syncing
  getUnsyncedProducts(): LocalProduct[] {
    return this.store.products.filter(p =>
      p.status === 'ready' || p.status === 'modified'
    );
  }

  // Get sync statistics
  getSyncStats(): { total: number; synced: number; pending: number; drafts: number } {
    const products = this.store.products;
    return {
      total: products.length,
      synced: products.filter(p => p.status === 'synced').length,
      pending: products.filter(p => p.status === 'ready' || p.status === 'modified').length,
      drafts: products.filter(p => p.status === 'draft').length
    };
  }

  // Generate sync manifest
  generateSyncManifest(agentId: string): SyncManifest {
    const products = this.store.products
      .filter(p => p.status !== 'draft')
      .map(p => {
        let action: 'create' | 'update' | 'delete' | 'unchanged';
        if (!p.remote_id && p.status === 'ready') {
          action = 'create';
        } else if (p.remote_id && p.status === 'modified') {
          action = 'update';
        } else {
          action = 'unchanged';
        }

        return {
          local_id: p.local_id,
          remote_id: p.remote_id,
          action,
          data: action !== 'unchanged' ? {
            name: p.name,
            description: p.description,
            category_id: p.category_id,
            price: p.price,
            delivery_type: p.delivery_type,
            delivery_payload: p.delivery_payload,
            content_hash: p.content_hash,
            file_size_bytes: p.file_size_bytes
          } : undefined,
          local_updated_at: p.updated_at
        };
      });

    const manifest: SyncManifest = {
      version: '1.0.0',
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      products,
      store_profile: this.store.profile,
      checksum: this.generateChecksum(products)
    };

    return manifest;
  }

  // Apply sync results from server
  applySyncResults(results: SyncResult): void {
    // Update created products with remote IDs
    for (const created of results.results.created) {
      const product = this.store.products.find(p => p.local_id === created.local_id);
      if (product) {
        product.remote_id = created.remote_id;
        product.status = 'synced';
        product.synced_at = results.timestamp;
      }
    }

    // Mark updated products as synced
    for (const updated of results.results.updated) {
      const product = this.store.products.find(p => p.local_id === updated.local_id);
      if (product) {
        product.status = 'synced';
        product.synced_at = results.timestamp;
      }
    }

    // Record sync history
    this.store.sync_history.push({
      id: results.sync_id,
      direction: 'push',
      timestamp: results.timestamp,
      products_synced: results.results.created.length + results.results.updated.length
    });
    this.store.last_sync = results.timestamp;
  }

  private generateId(): string {
    return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private generateChecksum(data: unknown): string {
    // Simple checksum for manifest
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// =============================================================================
// Sovereign Client (talks to marketplace - costs credits)
// =============================================================================

export class SovereignClient {
  private baseUrl: string;
  private authToken: string | null;
  public localStore: LocalStoreManager;

  constructor(config: SovereignConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3100/api/v1';
    this.authToken = config.authToken || null;
    this.localStore = new LocalStoreManager(config.localStorePath);
  }

  // ---------------------------------------------------------------------------
  // HTTP Methods
  // ---------------------------------------------------------------------------

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await response.json() as ApiResponse<T>;

      // Extract billing info from headers
      const creditsCharged = response.headers.get('X-Credits-Charged');
      const creditsRemaining = response.headers.get('X-Credits-Remaining');

      return {
        ...json,
        headers: {
          creditsCharged: creditsCharged ? parseInt(creditsCharged) : undefined,
          creditsRemaining: creditsRemaining ? parseInt(creditsRemaining) : undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Authentication (FREE)
  // ---------------------------------------------------------------------------

  async authenticate(
    walletAddress: string,
    signMessage?: (message: string) => Promise<string>
  ): Promise<ApiResponse<{ token: string; agent: Agent; is_new_agent: boolean }>> {
    const challengeResp = await this.request<{ challenge: string; message: string }>(
      'POST',
      '/auth/challenge',
      { wallet_address: walletAddress }
    );

    if (!challengeResp.success || !challengeResp.data) {
      return { success: false, data: null, error: challengeResp.error };
    }

    let signature: string;
    if (signMessage) {
      signature = await signMessage(challengeResp.data.message);
    } else {
      signature = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    }

    const verifyResp = await this.request<{ token: string; agent: Agent; is_new_agent: boolean }>(
      'POST',
      '/auth/verify',
      {
        wallet_address: walletAddress,
        challenge: challengeResp.data.challenge,
        signature,
      }
    );

    if (verifyResp.success && verifyResp.data) {
      this.authToken = verifyResp.data.token;
    }

    return verifyResp;
  }

  async getAgentInfo(): Promise<ApiResponse<Agent>> {
    return this.request<Agent>('GET', '/auth/me');
  }

  setToken(token: string): void {
    this.authToken = token;
  }

  getToken(): string | null {
    return this.authToken;
  }

  // ---------------------------------------------------------------------------
  // Credits
  // ---------------------------------------------------------------------------

  async getBalance(): Promise<ApiResponse<{ balance: string; last_updated: string }>> {
    return this.request('GET', '/credits/balance');
  }

  async getPackages(): Promise<ApiResponse<CreditPackage[]>> {
    return this.request('GET', '/credits/packages');
  }

  async purchaseCredits(options: { packageId?: string; customAmount?: number }): Promise<ApiResponse<Invoice>> {
    return this.request('POST', '/credits/purchase', {
      package_id: options.packageId,
      custom_amount: options.customAmount,
    });
  }

  async getTransactionHistory(options: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}): Promise<ApiResponse<{ transactions: Transaction[]; pagination: Pagination }>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.type) params.set('type', options.type);

    return this.request('GET', `/credits/history?${params}`);
  }

  // ---------------------------------------------------------------------------
  // Land
  // ---------------------------------------------------------------------------

  async getPlotTypes(): Promise<ApiResponse<Record<string, PlotType>>> {
    return this.request('GET', '/plots/types');
  }

  async getDistricts(): Promise<ApiResponse<District[]>> {
    return this.request('GET', '/plots/districts');
  }

  async getRentDiscounts(): Promise<ApiResponse<Record<number, { months: number; discount: number; label: string }>>> {
    return this.request('GET', '/plots/rent-discounts');
  }

  async getAvailablePlots(options: {
    page?: number;
    limit?: number;
    district?: string;
    plotType?: string;
  } = {}): Promise<ApiResponse<{ plots: Plot[]; pagination: Pagination }>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.district) params.set('district', options.district);
    if (options.plotType) params.set('plotType', options.plotType);

    return this.request('GET', `/plots/available?${params}`);
  }

  async getMyPlots(): Promise<ApiResponse<Plot[]>> {
    return this.request('GET', '/plots/mine');
  }

  async getPlot(plotId: string): Promise<ApiResponse<Plot>> {
    return this.request('GET', `/plots/${plotId}`);
  }

  async purchasePlot(plotId: string): Promise<ApiResponse<{ plot: Plot }>> {
    return this.request('POST', '/plots/purchase', { plotId });
  }

  async payRent(
    plotId: string,
    months: number
  ): Promise<ApiResponse<{ rent_paid_until: string; total_cost: string; discount: number }>> {
    return this.request('POST', `/plots/${plotId}/rent`, { months });
  }

  // ---------------------------------------------------------------------------
  // Products (Remote Marketplace)
  // ---------------------------------------------------------------------------

  async getCategories(): Promise<ApiResponse<ProductCategory[]>> {
    return this.request('GET', '/products/categories');
  }

  async browseProducts(options: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating';
  } = {}): Promise<ApiResponse<{ products: Product[]; total: number; page: number; limit: number }>> {
    const params = new URLSearchParams();
    if (options.category) params.set('category', options.category);
    if (options.search) params.set('search', options.search);
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.sort) params.set('sort', options.sort);

    return this.request('GET', `/products?${params}`);
  }

  async getProductDetails(productId: string): Promise<ApiResponse<Product & { reviews: object[] }>> {
    return this.request('GET', `/products/${productId}`);
  }

  async purchaseProduct(productId: string): Promise<ApiResponse<{
    purchaseId: string;
    downloadToken: string;
    downloadUrl: string;
    expiresAt: string;
    maxDownloads: number;
  }>> {
    return this.request('POST', `/products/${productId}/purchase`);
  }

  async downloadProduct(token: string): Promise<ApiResponse<{
    productName: string;
    deliveryType: string;
    payload: object;
    downloadsRemaining: number;
  }>> {
    return this.request('GET', `/products/download/${token}`);
  }

  async getMyPurchases(): Promise<ApiResponse<ProductPurchase[]>> {
    return this.request('GET', '/products/my/purchases');
  }

  async getMySales(): Promise<ApiResponse<ProductPurchase[]>> {
    return this.request('GET', '/products/my/sales');
  }

  async getMyProducts(): Promise<ApiResponse<{ products: Product[]; total: number }>> {
    return this.request('GET', '/products/my/products');
  }

  async getSellerStats(): Promise<ApiResponse<{
    totalProducts: number;
    activeProducts: number;
    totalSales: number;
    totalRevenue: string;
    averageRating: number | null;
  }>> {
    return this.request('GET', '/products/my/stats');
  }

  // ---------------------------------------------------------------------------
  // Sync (Push/Pull Store to Marketplace)
  // ---------------------------------------------------------------------------

  /**
   * Push local store to marketplace (COSTS CREDITS)
   * This is where you pay to publish/update your products
   */
  async push(agentId?: string): Promise<ApiResponse<SyncResult>> {
    const id = agentId || (await this.getAgentInfo()).data?.id;
    if (!id) {
      return { success: false, data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Must be authenticated to push' } };
    }

    const manifest = this.localStore.generateSyncManifest(id);
    const response = await this.request<SyncResult>('POST', '/sync/push', { manifest });

    if (response.success && response.data) {
      this.localStore.applySyncResults(response.data);
      await this.localStore.save();
    }

    return response;
  }

  /**
   * Pull marketplace data (COSTS CREDITS)
   * Get new purchases, reviews, stats
   */
  async pull(since?: string): Promise<ApiResponse<PullResult>> {
    return this.request<PullResult>('POST', '/sync/pull', { since });
  }

  /**
   * Get sync status (COSTS CREDITS)
   */
  async getSyncStatus(): Promise<ApiResponse<{
    last_sync: object | null;
    pending_remote: { purchases: number; reviews: number };
    last_pull: string;
  }>> {
    return this.request('GET', '/sync/status');
  }

  // ---------------------------------------------------------------------------
  // Pricing (FREE)
  // ---------------------------------------------------------------------------

  async getPricing(): Promise<ApiResponse<{
    pricing: Record<string, Array<{ method: string; path: string; credits: number; description: string }>>;
    summary: { free_endpoints: number; paid_endpoints: number; average_cost: number; most_expensive: number };
    notes: string[];
  }>> {
    return this.request('GET', '/pricing');
  }

  // ---------------------------------------------------------------------------
  // Health (FREE)
  // ---------------------------------------------------------------------------

  async health(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('GET', '/../health');
  }

  // ---------------------------------------------------------------------------
  // Onboarding (Interactive Wizard)
  // ---------------------------------------------------------------------------

  /**
   * Run the interactive onboarding wizard
   * Guides new agents through setup with gamification
   */
  async onboard(options: {
    outputHandler?: (message: string) => void;
    inputHandler?: (prompt: string, options?: string[]) => Promise<string>;
  } = {}): Promise<{
    agentType: string | undefined;
    nation: string | undefined;
    storeCreated: boolean;
    firstProductCreated: boolean;
    xp: number;
    level: number;
    badgesEarned: string[];
  }> {
    const { OnboardingWizard } = await import('./onboarding/wizard.js');
    const wizard = new OnboardingWizard(
      options.outputHandler || console.log,
      options.inputHandler
    );
    const progress = await wizard.run();
    return {
      agentType: progress.agentType,
      nation: progress.nation,
      storeCreated: progress.storeCreated,
      firstProductCreated: progress.firstProductCreated,
      xp: progress.xp,
      level: progress.level,
      badgesEarned: progress.badgesEarned
    };
  }

  /**
   * Show available agent types
   */
  async showAgentTypes(): Promise<void> {
    const { OnboardingWizard } = await import('./onboarding/wizard.js');
    const wizard = new OnboardingWizard();
    wizard.showAgentTypes();
  }

  /**
   * Show available nations
   */
  async showNations(): Promise<void> {
    const { OnboardingWizard } = await import('./onboarding/wizard.js');
    const wizard = new OnboardingWizard();
    wizard.showNations();
  }

  /**
   * Show level progression
   */
  async showLevels(): Promise<void> {
    const { OnboardingWizard } = await import('./onboarding/wizard.js');
    const wizard = new OnboardingWizard();
    wizard.showLevels();
  }

  /**
   * Show available badges
   */
  async showBadges(): Promise<void> {
    const { OnboardingWizard } = await import('./onboarding/wizard.js');
    const wizard = new OnboardingWizard();
    wizard.showBadges();
  }
}

// Default export
export default SovereignClient;
