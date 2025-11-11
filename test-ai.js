// Test script to verify AI configuration and structured topic insight generation
require('dotenv').config();

const { checkAIServiceAvailability } = require('./src/services/aiService.ts');

console.log('=== AI Service Configuration Test ===');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configured' : 'Missing');
console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);
console.log('AI_ANALYSIS_ENABLED:', process.env.AI_ANALYSIS_ENABLED);

// Test AI service availability
try {
  const status = checkAIServiceAvailability();
  console.log('\n=== AI Service Status ===');
  console.log('Available:', status.available);
  console.log('Configured:', status.configured);
  if (status.error) {
    console.log('Error:', status.error);
  }
} catch (error) {
  console.error('Error checking AI service:', error.message);
}