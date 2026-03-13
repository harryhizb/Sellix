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
// wa-service/src/routes/faqs.ts
const express_1 = __importDefault(require("express"));
const FAQ_1 = require("../models/FAQ");
const router = express_1.default.Router();
// GET /api/faqs - Get all FAQs for a business
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, type, category } = req.query;
        if (!businessId) {
            return res.status(400).json({ error: 'businessId is required' });
        }
        const query = { businessId };
        if (type && type !== 'all')
            query.type = type;
        if (category && category !== 'all')
            query.category = category;
        const faqs = yield FAQ_1.FAQ.find(query)
            .sort({ usageCount: -1, updatedAt: -1 })
            .lean();
        res.json({ faqs });
    }
    catch (error) {
        console.error('Get FAQs error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
// POST /api/faqs - Create new FAQ
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { question, answer, type, category, tags, businessId, createdBy } = req.body;
        if (!question || !answer || !businessId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const faq = yield FAQ_1.FAQ.create({
            question,
            answer,
            type: type || 'ai',
            category: category || 'general',
            tags: tags || [],
            businessId,
            createdBy,
            isActive: true,
            usageCount: 0
        });
        res.json({ success: true, faq });
    }
    catch (error) {
        console.error('Create FAQ error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
// DELETE /api/faqs/:id - Delete FAQ
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield FAQ_1.FAQ.findByIdAndDelete(id);
        res.json({ success: true, message: 'FAQ deleted successfully' });
    }
    catch (error) {
        console.error('Delete FAQ error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
// PUT /api/faqs/:id/status - Toggle FAQ status
router.put('/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const faq = yield FAQ_1.FAQ.findByIdAndUpdate(id, { isActive }, { new: true });
        res.json({ success: true, faq });
    }
    catch (error) {
        console.error('Update FAQ status error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
// PUT /api/faqs/:id/usage - Increment usage count
router.put('/:id/usage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const faq = yield FAQ_1.FAQ.findByIdAndUpdate(id, {
            $inc: { usageCount: 1 },
            lastUsed: new Date()
        }, { new: true });
        res.json({ success: true, faq });
    }
    catch (error) {
        console.error('Update FAQ usage error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
exports.default = router;
