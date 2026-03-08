import { Product, IProduct } from "../models/Product";
import NodeCache from "node-cache";
import { Service, IService } from "../models/Service";

// Cache TTL: 5 minutes (300 seconds)
const productCache = new NodeCache({ stdTTL: 60, checkperiod: 80 }); // 60s TTL — keeps discounts fresh after edits

export interface ProductSearchResult {
    product: IProduct;
    score: number;
}

export class ProductService {
    private static instance: ProductService;

    private constructor() { }

    public static getInstance(): ProductService {
        if (!ProductService.instance) {
            ProductService.instance = new ProductService();
        }
        return ProductService.instance;
    }

    /**
     * Search for products by name regex or text match.
     * Uses caching to reduce DB load.
     */
    async searchProducts(businessId: string, query: string): Promise<IProduct[]> {
        const cacheKey = `search:${businessId}:${query.toLowerCase().trim()}`;
        const cached = productCache.get<IProduct[]>(cacheKey);

        if (cached) {
            console.log(`[ProductService] Cache HIT for query: "${query}"`);
            return cached;
        }

        console.log(`[ProductService] Cache MISS for query: "${query}". Querying DB...`);

        try {
            // Flexible regex search
            const regex = new RegExp(query, 'i');

            const products = await Product.find({
                businessId,
                isActive: true, // Only show active products
                $or: [
                    { name: regex },
                    { description: regex },
                    { synonyms: regex },
                    { tags: regex }
                ]
            }).limit(5).lean().exec(); // .lean() returns plain objects — discount sub-doc survives session serialization

            // Log analytics (simplified)
            if (products.length > 0) {
                console.log(`[ProductService] Products fetched: "${query}" -> ${products.length} results`);
                console.log(`[Analytics] Search SUCCESS: "${query}" -> ${products.length} results`);
            } else {
                console.log(`[Analytics] Search FAILED: "${query}" -> 0 results`);
            }

            productCache.set(cacheKey, products);
            return products as any[];
        } catch (error) {
            console.error(`[ProductService] DB Error during search:`, error);
            return []; // Fail safe
        }
    }

    /**
     * Get a list of products (generic or filtered).
     */
    async getProducts(businessId: string, options: { limit?: number; category?: string; type?: string } = {}): Promise<IProduct[]> {
        const { limit = 10, category, type } = options;
        const cacheKey = `products:${businessId}:${category || 'all'}:${type || 'all'}:${limit}`;
        const cached = productCache.get<IProduct[]>(cacheKey);
        if (cached) return cached;

        const query: any = { businessId, isActive: true };
        if (category) query.category = category;
        if (type) query.type = type;

        try {
            const products = await Product.find(query).limit(limit).lean().exec() as any[];
            productCache.set(cacheKey, products);
            return products;
        } catch (error) {
            console.error(`[ProductService] Error fetching products:`, error);
            return [];
        }
    }
    async getServices(businessId: string, options: { limit?: number } = {}): Promise<IService[]> {
        const { limit = 10 } = options;
        try {
            return await Service.find({ businessId, isActive: true }).limit(limit).exec();
        } catch (error) {
            console.error(`[ProductService] Error fetching services:`, error);
            return [];
        }
    }

    /**
     * Get specific product details by ID (mostly for internal use or exact match).
     */
    async getProductById(productId: string): Promise<IProduct | null> {
        const cacheKey = `product:${productId}`;
        const cached = productCache.get<IProduct>(cacheKey);

        if (cached) return cached;

        try {
            const product = await Product.findById(productId).lean().exec() as any;
            if (product) {
                productCache.set(cacheKey, product);
            }
            return product;
        } catch (error) {
            console.error(`[ProductService] Error fetching product ${productId}:`, error);
            return null;
        }
    }

    /**
     * Invalidate all cache entries for a business (call after create/update).
     */
    invalidateBusinessCache(businessId: string): void {
        const keys = productCache.keys();
        keys.forEach(key => {
            if (key.startsWith(`products:${businessId}`) || key.startsWith(`search:${businessId}`)) {
                productCache.del(key);
            }
        });
        console.log(`[ProductService] Cache invalidated for business ${businessId}`);
    }

    /**
     * Get latest price for a product.
     */
    async getLatestPrice(productId: string): Promise<number | null> {
        const product = await this.getProductById(productId);
        return product ? product.price : null;
    }

    /**
     * Check stock availability.
     * Bypasses cache if 'forceFresh' is true (e.g., during checkout).
     */
    async checkAvailability(productId: string, qty: number, forceFresh: boolean = false): Promise<boolean> {
        let product: IProduct | null = null;

        if (forceFresh) {
            try {
                product = await Product.findById(productId).exec();
            } catch (e) {
                console.error(`[ProductService] Error checking stock for ${productId}:`, e);
                return false;
            }
        } else {
            product = await this.getProductById(productId);
        }

        if (!product) return false;

        // Logic: Checks 'inStock' flag.
        // If variants exist, we'd need variant logic, but for now we assume basic product.
        if (!product.inStock) return false;

        // FUTURE: strict quantity check if schema supports it
        // if (product.stockQuantity < qty) return false;

        return true;
    }

    /**
     * Validate stock for a list of items (e.g. cart checkout).
     * Returns error message if failed, or null if success.
     */
    async validateCartStock(items: { productId: string, qty: number, name: string }[]): Promise<string | null> {
        for (const item of items) {
            const available = await this.checkAvailability(item.productId, item.qty, true); // Force fresh
            if (!available) {
                return `Sorry, ${item.name} is currently out of stock or requested quantity is unavailable.`;
            }
        }
        return null;
    }
}

export const productService = ProductService.getInstance();
