// wa-service/src/routes/audit.ts
import express from 'express';
import { AuditLog } from '../models/AuditLog';

const router = express.Router();

// POST /api/audit/log - Log an audit event
router.post('/log', async (req, res) => {
  try {
    const {
      action,
      userId,
      businessId,
      customerId,
      conversationId,
      metadata
    } = req.body;

    if (!action || !userId || !businessId) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const auditLog = new AuditLog({
      action,
      userId,
      businessId,
      customerId,
      conversationId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await auditLog.save();

    res.json({ 
      success: true, 
      logId: auditLog._id 
    });

  } catch (error: any) {
    console.error('Audit log error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// GET /api/audit/takeovers - Get takeover audit logs
router.get('/takeovers', async (req, res) => {
  try {
    const { businessId, startDate, endDate, limit = 100 } = req.query;

    if (!businessId) {
      return res.status(400).json({ 
        error: 'businessId is required' 
      });
    }

    const query: any = {
      businessId,
      action: { $in: ['TAKEOVER_START', 'TAKEOVER_END', 'TAKEOVER_FORCE_END'] }
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .populate('customerId', 'name phone')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({
      logs,
      count: logs.length
    });

  } catch (error: any) {
    console.error('Get takeover logs error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;