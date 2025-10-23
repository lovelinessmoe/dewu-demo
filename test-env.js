// Test environment variables loading
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Test');
console.log('========================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('RESPONSE_DELAY:', process.env.RESPONSE_DELAY);
console.log('ERROR_RATE:', process.env.ERROR_RATE);

if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://your-project.supabase.co') {
  console.log('✅ Supabase configuration looks valid');
} else {
  console.log('⚠️  Supabase not configured, will use fallback data');
}

console.log('========================');
console.log('Test completed!');