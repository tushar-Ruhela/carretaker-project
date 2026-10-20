const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { supabase } = require('../lib/supabase');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('Razorpay init warning:', err.message);
  }
}

// POST /api/payments/create-order - Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR', familyId, caregiverId } = req.body;
    if (!amount || !familyId) return res.status(400).json({ error: 'amount and familyId required' });

    let orderId = `order_mock_${Date.now()}`;
    let orderAmount = Math.round(amount * 100);

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: orderAmount, // paise
        currency,
        receipt: `booking_${bookingId || Date.now()}`,
        notes: { bookingId, familyId, caregiverId },
      });
      orderId = order.id;
      orderAmount = order.amount;
    }

    // Save pending payment to Supabase (best effort)
    try {
      await supabase.from('payments').insert([{
        booking_id: bookingId || null,
        family_id: familyId,
        caregiver_id: caregiverId || null,
        amount,
        currency,
        razorpay_order_id: orderId,
        status: 'pending',
      }]);

      if (bookingId) {
        await supabase.from('bookings')
          .update({ razorpay_order_id: orderId })
          .eq('id', bookingId);
      }
    } catch {
      // ignore db errors in mock mode
    }

    res.json({ orderId, amount: orderAmount, currency });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Payment order creation failed' });
  }
});

// POST /api/payments/verify - Verify Razorpay payment signature
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // If key secret is configured, verify HMAC signature
    if (process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret') {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed' });
      }
    }

    // Update payment record (best effort)
    try {
      await supabase.from('payments')
        .update({
          razorpay_payment_id,
          razorpay_signature: razorpay_signature || 'mock_sig',
          status: 'captured',
        })
        .eq('razorpay_order_id', razorpay_order_id);

      if (bookingId) {
        await supabase.from('bookings')
          .update({ payment_status: 'paid', razorpay_payment_id })
          .eq('id', bookingId);
      }
    } catch {
      // ignore db errors in mock mode
    }

    res.json({ success: true, paymentId: razorpay_payment_id || `pay_${Date.now()}` });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification error' });
  }
});

// GET /api/payments/:familyId - Get payment history
router.get('/:familyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('family_id', req.params.familyId)
      .order('created_at', { ascending: false });
    if (error) return res.json([]);
    res.json(data || []);
  } catch {
    res.json([]);
  }
});

module.exports = router;
