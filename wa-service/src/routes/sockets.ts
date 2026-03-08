import express from 'express';
import { whatsappSessionManager } from '../lib/WhatsAppSessionManager';

const router = express.Router();

// Internal route called by Next.js API to broadcast a socket event to a specific business room
router.post('/refresh', async (req, res) => {
    try {
        const { businessId, event, data } = req.body;

        if (!businessId || !event) {
            return res.status(400).json({ error: 'Missing businessId or event' });
        }

        // Use the existing WhatsAppSessionManager socket emit logic
        whatsappSessionManager.notifyDashboard(businessId, event, data || {});

        res.json({ success: true });
    } catch (error: any) {
        console.error('Socket refresh relay error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
