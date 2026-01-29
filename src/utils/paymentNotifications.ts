/**
 * PAYMENT CONFIRMATION NOTIFICATIONS
 * 
 * This utility handles payment confirmation notifications.
 * When integrated with Firebase Cloud Functions, players will receive
 * real-time notifications when the host confirms their payment.
 */

export async function sendPaymentConfirmation(
  userId: string,
  gameId: string,
  amount: number,
  gameName: string
): Promise<void> {
  try {
    // Log for development/debugging
    console.log(`📬 Payment confirmation:`, {
      userId,
      gameId,
      amount,
      gameName,
      message: `Your payment of $${amount} for "${gameName}" has been confirmed! ✅`,
    });

    // POST to notification endpoint (requires backend Cloud Function)
    const response = await fetch('/api/notifications/payment-confirmed', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ 
        userId, 
        gameId, 
        amount, 
        gameName,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Silently fail - this is a nice-to-have feature
      console.log('📬 Note: Notification endpoint not yet configured');
      return null;
    });

    if (response && response.ok) {
      console.log('✅ Notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    // Don't throw - payment is already confirmed in database
  }
}

/**
 * Get auth token for API calls (if using authenticated endpoints)
 */
async function getAuthToken(): Promise<string> {
  try {
    // This would typically be called from your Firebase client instance
    // For now, return empty string and let server-side handle auth
    return '';
  } catch {
    return '';
  }
}

/**
 * CLOUD FUNCTIONS SETUP GUIDE
 * 
 * Add this to your Firebase Cloud Functions (functions/index.js):
 * 
 * ```
 * const functions = require('firebase-functions');
 * const admin = require('firebase-admin');
 * const express = require('express');
 * const cors = require('cors');
 * 
 * const app = express();
 * app.use(cors({ origin: true }));
 * 
 * // Middleware to verify Firebase Auth token
 * const authenticate = async (req, res, next) => {
 *   const token = req.headers.authorization?.split('Bearer ')[1];
 *   if (!token) return res.status(401).json({ error: 'Unauthorized' });
 *   
 *   try {
 *     req.user = await admin.auth().verifyIdToken(token);
 *     next();
 *   } catch (err) {
 *     res.status(401).json({ error: 'Invalid token' });
 *   }
 * };
 * 
 * // Payment confirmation notification endpoint
 * app.post('/notifications/payment-confirmed', authenticate, async (req, res) => {
 *   const { userId, gameId, amount, gameName } = req.body;
 *   
 *   try {
 *     // Get user's FCM tokens from database
 *     const userDoc = await admin.firestore().collection('users').doc(userId).get();
 *     const fcmTokens = userDoc.data()?.fcmTokens || [];
 *     
 *     if (fcmTokens.length === 0) {
 *       return res.status(404).json({ message: 'No FCM tokens found' });
 *     }
 *     
 *     // Send push notification
 *     const message = {
 *       notification: {
 *         title: '💰 Payment Confirmed',
 *         body: `Your $${amount} payment for "${gameName}" is verified!`,
 *       },
 *       data: {
 *         gameId: gameId,
 *         type: 'payment_confirmed',
 *         amount: String(amount)
 *       },
 *       webpush: {
 *         fcmOptions: {
 *           link: `/game/${gameId}`
 *         }
 *       }
 *     };
 *     
 *     const responses = await Promise.all(
 *       fcmTokens.map(token => 
 *         admin.messaging().send({ ...message, token })
 *           .catch(err => console.error(`Failed to send to token ${token}:`, err))
 *       )
 *     );
 *     
 *     res.status(200).json({ 
 *       success: true, 
 *       messagesSent: responses.filter(r => r).length 
 *     });
 *   } catch (error) {
 *     console.error('Error sending notification:', error);
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * exports.api = functions.https.onRequest(app);
 * ```
 * 
 * SETUP STEPS:
 * 1. Ensure Firebase project has Cloud Functions enabled
 * 2. Install required dependencies: npm install express cors
 * 3. Deploy: firebase deploy --only functions
 * 4. Update /api/notifications/payment-confirmed endpoint to point to your Cloud Function URL
 */
