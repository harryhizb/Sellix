"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProductVariants = void 0;
/**
 * Normalizes product variants.
 * If variants array is empty but attributes exist (colors/sizes),
 * it generates a Cartesian product of variants.
 */
const normalizeProductVariants = (product) => {
    var _a;
    // Safety check
    if (!product)
        return product;
    // existing variants? return as is
    if (product.variants && product.variants.length > 0) {
        return product;
    }
    // Handle Mongoose Document structure if applicable
    // CRITICAL FIX: Ensure we have a plain object with all properties including 'name'
    const rawProduct = typeof product.toObject === 'function' ? product.toObject() :
        (typeof product.toJSON === 'function' ? product.toJSON() : product);
    // Fallback if conversion failed or wasn't needed
    const baseProduct = rawProduct || product;
    const attributes = baseProduct.attributes || {};
    const colors = attributes.colors || [];
    const sizes = attributes.sizes || [];
    // Debug log (can be removed later)
    if (colors.length > 0 || sizes.length > 0) {
        console.log(`[productUtils] Found attributes for ${baseProduct.name}: Colors=${colors.length}, Sizes=${sizes.length}`);
    }
    // If no attributes, return as is
    if (colors.length === 0 && sizes.length === 0) {
        return baseProduct;
    }
    const variants = [];
    // Helper to generate SKU/ID
    const generateId = (pId, attr) => `${pId}-${attr.replace(/\s+/g, '').toUpperCase()}`;
    const pId = ((_a = baseProduct._id) === null || _a === void 0 ? void 0 : _a.toString()) || 'PROD';
    // 1. Colors AND Sizes
    if (colors.length > 0 && sizes.length > 0) {
        colors.forEach((color) => {
            sizes.forEach((size) => {
                variants.push({
                    id: generateId(pId, `${color}-${size}`),
                    sku: generateId(pId, `${color}-${size}`),
                    price: baseProduct.price, // Inherit base price
                    stock: 99, // default
                    attributes: { color, size }
                });
            });
        });
    }
    // 2. Only Colors
    else if (colors.length > 0) {
        colors.forEach((color) => {
            variants.push({
                id: generateId(pId, color),
                sku: generateId(pId, color),
                price: baseProduct.price,
                stock: 99,
                attributes: { color }
            });
        });
    }
    // 3. Only Sizes
    else if (sizes.length > 0) {
        sizes.forEach((size) => {
            variants.push({
                id: generateId(pId, size),
                sku: generateId(pId, size),
                price: baseProduct.price,
                stock: 99,
                attributes: { size }
            });
        });
    }
    // Return new product object with synthesized variants
    return Object.assign(Object.assign({}, baseProduct), { variants });
};
exports.normalizeProductVariants = normalizeProductVariants;
