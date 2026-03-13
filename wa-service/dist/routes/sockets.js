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
const express_1 = __importDefault(require("express"));
const WhatsAppSessionManager_1 = require("../lib/WhatsAppSessionManager");
const router = express_1.default.Router();
// Internal route called by Next.js API to broadcast a socket event to a specific business room
router.post('/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, event, data } = req.body;
        if (!businessId || !event) {
            return res.status(400).json({ error: 'Missing businessId or event' });
        }
        // Use the existing WhatsAppSessionManager socket emit logic
        WhatsAppSessionManager_1.whatsappSessionManager.notifyDashboard(businessId, event, data || {});
        res.json({ success: true });
    }
    catch (error) {
        console.error('Socket refresh relay error:', error);
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
