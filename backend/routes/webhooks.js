const express = require('express');
const { Webhook } = require('svix');
const prisma = require('../services/prisma');
const logger = require('../services/logger');

const router = express.Router();

// POST /api/webhooks/clerk
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET is not set!');
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
    logger.error({ err }, 'Webhook verification failed');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { type, data } = event;
  logger.info({ type }, 'Clerk webhook received');

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
      logger.info({ name, email }, 'User saved to DB from webhook');
    } catch (err) {
      logger.error({ err }, 'Failed to save user from webhook');
    }
  }

  // ─── user.deleted → Remove from PostgreSQL ───────────────────────
  if (type === 'user.deleted') {
    const { id } = data;
    try {
      await prisma.user.delete({ where: { id } });
      logger.info({ userId: id }, 'User deleted from DB via webhook');
    } catch (err) {
      logger.error({ err }, 'Failed to delete user from DB');
    }
  }

  return res.status(200).json({ received: true });
});

module.exports = router;
