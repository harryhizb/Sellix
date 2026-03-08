// wa-service/src/routes/faqs.ts
import express from 'express';
import { FAQ } from '../models/FAQ';

const router = express.Router();

// GET /api/faqs - Get all FAQs for a business
router.get('/', async (req, res) => {
  try {
    const { businessId, type, category } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const query: any = { businessId };
    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;

    const faqs = await FAQ.find(query)
      .sort({ usageCount: -1, updatedAt: -1 })
      .lean();

    res.json({ faqs });
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/faqs - Create new FAQ
router.post('/', async (req, res) => {
  try {
    const { question, answer, type, category, tags, businessId, createdBy } = req.body;

    if (!question || !answer || !businessId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const faq = await FAQ.create({
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
  } catch (error: any) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/faqs/:id - Delete FAQ
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await FAQ.findByIdAndDelete(id);
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error: any) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /api/faqs/:id/status - Toggle FAQ status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    res.json({ success: true, faq });
  } catch (error: any) {
    console.error('Update FAQ status error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /api/faqs/:id/usage - Increment usage count
router.put('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      { 
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      },
      { new: true }
    );

    res.json({ success: true, faq });
  } catch (error: any) {
    console.error('Update FAQ usage error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;