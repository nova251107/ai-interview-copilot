const express = require('express');
const { Webhook } = require('svix');
const prisma = require('../services/prisma');

const router = express.Router();

// POST /api/webhooks/clerk
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set!');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing Svix headers' });
  }

  let event;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(req.body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { type, data } = event;
  console.log(`📥 Clerk Webhook: ${type}`);

  // ─── user.created → Save to PostgreSQL ──────────────────────────
  if (type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = data;
    const email = email_addresses?.[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';

    try {
      await prisma.user.upsert({
        where: { id },
        update: { name, image: image_url },
        create: { id, name, email, image: image_url },
      });
      console.log(`✅ User saved to DB: ${name} (${email})`);
    } catch (err) {
      console.error('Failed to save user to DB:', err.message);
    }
  }

  // ─── user.deleted → Remove from PostgreSQL ───────────────────────
  if (type === 'user.deleted') {
    const { id } = data;
    try {
      await prisma.user.delete({ where: { id } });
      console.log(`🗑️  User deleted from DB: ${id}`);
    } catch (err) {
      console.error('Failed to delete user from DB:', err.message);
    }
  }

  return res.status(200).json({ received: true });
});

module.exports = router;
