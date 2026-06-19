const { PayOS } = require('@payos/node');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

/**
 * Create a PayOS payment link for an order.
 * @param {Object} params
 * @param {number} params.orderCode - Unique numeric order code (PayOS requires a number, max 9007199254740991)
 * @param {number} params.amount - Payment amount in VND
 * @param {string} params.description - Short description (max 25 chars)
 * @param {Array}  params.items - Array of { name, quantity, price }
 * @param {string} [params.cancelUrl] - URL to redirect on cancel
 * @param {string} [params.returnUrl] - URL to redirect on success
 * @returns {Promise<Object>} PayOS payment link data including checkoutUrl
 */
const createPayOSPaymentLink = async ({ orderCode, amount, description, items, cancelUrl, returnUrl }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const paymentData = {
    orderCode,
    amount: Math.round(amount),
    description: description.substring(0, 25), // PayOS limits description to 25 chars
    items: items || [],
    cancelUrl: cancelUrl || `${clientUrl}/payment-result?success=false`,
    returnUrl: returnUrl || `${clientUrl}/payment-result?success=true`,
  };

  const paymentLink = await payos.paymentRequests.create(paymentData);
  return paymentLink;
};

/**
 * Verify PayOS webhook data.
 * @param {Object} webhookBody - The raw webhook body from PayOS
 * @returns {Object} Verified webhook data
 */
const verifyPayOSWebhook = (webhookBody) => {
  return payos.webhooks.verify(webhookBody);
};

/**
 * Get payment information from PayOS by order code.
 * @param {number|string} orderCode
 * @returns {Promise<Object>}
 */
const getPayOSPaymentInfo = async (orderCode) => {
  return payos.paymentRequests.get(orderCode);
};

/**
 * Cancel a PayOS payment link.
 * @param {number|string} orderCode
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
const cancelPayOSPaymentLink = async (orderCode, reason) => {
  return payos.paymentRequests.cancel(orderCode, reason);
};

module.exports = {
  payos,
  createPayOSPaymentLink,
  verifyPayOSWebhook,
  getPayOSPaymentInfo,
  cancelPayOSPaymentLink,
};
