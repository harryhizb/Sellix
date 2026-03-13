"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const Product_1 = require("../models/Product");
const node_cache_1 = __importDefault(require("node-cache"));
const Service_1 = require("../models/Service");
// Cache TTL: 5 minutes (300 seconds)
const productCache = new node_cache_1.default({ stdTTL: 60, checkperiod: 80 }); // 60s TTL — keeps discounts fresh after edits
class ProductService {
    constructor() { }
    static getInstance() {
        if (!ProductService.instance) {
            ProductService.instance = new ProductService();
        }
        return ProductService.instance;
    }
    /**
     * Search for products by name regex or text match.
     * Uses caching to reduce DB load.
     */
    searchProducts(businessId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `search:${businessId}:${query.toLowerCase().trim()}`;
            const cached = productCache.get(cacheKey);
            if (cached) {
                console.log(`[ProductService] Cache HIT for query: "${query}"`);
                return cached;
            }
            console.log(`[ProductService] Cache MISS for query: "${query}". Querying DB...`);
            try {
                // Flexible regex search
                const regex = new RegExp(query, 'i');
                const products = yield Product_1.Product.find({
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
                }
                else {
                    console.log(`[Analytics] Search FAILED: "${query}" -> 0 results`);
                }
                productCache.set(cacheKey, products);
                return products;
            }
            catch (error) {
                console.error(`[ProductService] DB Error during search:`, error);
                return []; // Fail safe
            }
        });
    }
    /**
     * Get a list of products (generic or filtered).
     */
    getProducts(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, options = {}) {
            const { limit = 10, category, type } = options;
            const cacheKey = `products:${businessId}:${category || 'all'}:${type || 'all'}:${limit}`;
            const cached = productCache.get(cacheKey);
            if (cached)
                return cached;
            const query = { businessId, isActive: true };
            if (category)
                query.category = category;
            if (type)
                query.type = type;
            try {
                const products = yield Product_1.Product.find(query).limit(limit).lean().exec();
                productCache.set(cacheKey, products);
                return products;
            }
            catch (error) {
                console.error(`[ProductService] Error fetching products:`, error);
                return [];
            }
        });
    }
    getServices(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, options = {}) {
            const { limit = 10 } = options;
            try {
                return yield Service_1.Service.find({ businessId, isActive: true }).limit(limit).exec();
            }
            catch (error) {
                console.error(`[ProductService] Error fetching services:`, error);
                return [];
            }
        });
    }
    /**
     * Get specific product details by ID (mostly for internal use or exact match).
     */
    getProductById(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `product:${productId}`;
            const cached = productCache.get(cacheKey);
            if (cached)
                return cached;
            try {
                const product = yield Product_1.Product.findById(productId).lean().exec();
                if (product) {
                    productCache.set(cacheKey, product);
                }
                return product;
            }
            catch (error) {
                console.error(`[ProductService] Error fetching product ${productId}:`, error);
                return null;
            }
        });
    }
    /**
     * Invalidate all cache entries for a business (call after create/update).
     */
    invalidateBusinessCache(businessId) {
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
    getLatestPrice(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield this.getProductById(productId);
            return product ? product.price : null;
        });
    }
    /**
     * Check stock availability.
     * Bypasses cache if 'forceFresh' is true (e.g., during checkout).
     */
    checkAvailability(productId_1, qty_1) {
        return __awaiter(this, arguments, void 0, function* (productId, qty, forceFresh = false) {
            let product = null;
            if (forceFresh) {
                try {
                    product = yield Product_1.Product.findById(productId).exec();
                }
                catch (e) {
                    console.error(`[ProductService] Error checking stock for ${productId}:`, e);
                    return false;
                }
            }
            else {
                product = yield this.getProductById(productId);
            }
            if (!product)
                return false;
            // Logic: Checks 'inStock' flag.
            // If variants exist, we'd need variant logic, but for now we assume basic product.
            if (!product.inStock)
                return false;
            // FUTURE: strict quantity check if schema supports it
            // if (product.stockQuantity < qty) return false;
            return true;
        });
    }
    /**
     * Validate stock for a list of items (e.g. cart checkout).
     * Returns error message if failed, or null if success.
     */
    validateCartStock(items) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const item of items) {
                const available = yield this.checkAvailability(item.productId, item.qty, true); // Force fresh
                if (!available) {
                    return `Sorry, ${item.name} is currently out of stock or requested quantity is unavailable.`;
                }
            }
            return null;
        });
    }
}
exports.ProductService = ProductService;
exports.productService = ProductService.getInstance();
