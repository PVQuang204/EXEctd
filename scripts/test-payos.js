const { loadEnv } = require('../src/config/env');
loadEnv();
const { createPayOSPaymentLink, getPayOSPaymentInfo } = require('../src/config/payos');

async function main() {
  console.log('PAYO_CLIENT_ID:', process.env.PAYOS_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('PAYO_API_KEY:', process.env.PAYOS_API_KEY ? 'SET' : 'MISSING');
  console.log('PAYO_CHECKSUM_KEY:', process.env.PAYOS_CHECKSUM_KEY ? 'SET' : 'MISSING');

  // Test create payment link
  const orderCode = Number(`${Date.now()}`.slice(-10) + '001');
  console.log('\nTesting createPayOSPaymentLink...');
  console.log('orderCode:', orderCode);

  try {
    const result = await createPayOSPaymentLink({
      orderCode,
      amount: 50000,
      description: 'Test order',
      items: [{ name: 'Test Item', quantity: 1, price: 50000 }],
    });
    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR creating payment:', err.message);
    console.error('Status:', err.status);
    console.error('Response:', err.response?.data);
  }
}

main().catch(console.error);
