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
// wa-service/src/routes/audit.ts
const express_1 = __importDefault(require("express"));
const AuditLog_1 = require("../models/AuditLog");
const router = express_1.default.Router();
// POST /api/audit/log - Log an audit event
router.post('/log', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { action, userId, businessId, customerId, conversationId, metadata } = req.body;
        if (!action || !userId || !businessId) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }
        const auditLog = new AuditLog_1.AuditLog({
            action,
            userId,
            businessId,
            customerId,
            conversationId,
            metadata,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        yield auditLog.save();
        res.json({
            success: true,
            logId: auditLog._id
        });
    }
    catch (error) {
        console.error('Audit log error:', error);
        res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
}));
// GET /api/audit/takeovers - Get takeover audit logs
router.get('/takeovers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, startDate, endDate, limit = 100 } = req.query;
        if (!businessId) {
            return res.status(400).json({
                error: 'businessId is required'
            });
        }
        const query = {
            businessId,
            action: { $in: ['TAKEOVER_START', 'TAKEOVER_END', 'TAKEOVER_FORCE_END'] }
        };
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        const logs = yield AuditLog_1.AuditLog.find(query)
            .populate('userId', 'name email')
            .populate('customerId', 'name phone')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();
        res.json({
            logs,
            count: logs.length
        });
    }
    catch (error) {
        console.error('Get takeover logs error:', error);
        res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
}));
exports.default = router;
