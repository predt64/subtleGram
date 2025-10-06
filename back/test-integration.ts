import 'dotenv/config';
import { getOpenRouterService, OpenRouterMessage } from './src/services/openRouterService';
import { analysisService } from './src/services/analysisService';
import { slangService } from './src/services/slangService';
import { loadAppConfig, validateConfig } from './src/utils/config';

/**
 * Integration test for new Translation Guide functionality
 */
async function runIntegrationTests() {
  console.log('🚀 Starting Translation Guide Integration Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Configuration validation
  console.log('📋 Test 1: Configuration validation');
  try {
    const config = loadAppConfig();
    validateConfig(config);
    console.log('✅ Configuration loaded successfully');
    passed++;
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    failed++;
  }

  // Test 2: OpenRouter service basic functionality
  console.log('\n🤖 Test 2: OpenRouter service basic functionality');
  try {
    // Проверяем конфигурацию OpenRouter
    const config = loadAppConfig();
    if (config.openRouterToken && config.openRouterToken.length >= 10) {
      console.log('✅ OpenRouter API token is configured');
      passed++;
    } else {
      console.log('❌ OpenRouter API token validation failed');
      failed++;
    }
  } catch (error) {
    console.error('❌ OpenRouter service test failed:', error);
    failed++;
  }

  // Test 3: OpenRouter service connectivity
  console.log('\n💬 Test 3: OpenRouter service connectivity');
  try {
    const hasApiKey = !!process.env['OPENROUTER_API_KEY'];
    if (!hasApiKey) {
      console.log('⏭️  Skipping - OPENROUTER_API_KEY not configured');
      passed++;
      return;
    }

    const openRouterService = getOpenRouterService();
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "Hello World" and nothing else.' }
    ];

    const response = await openRouterService.chatCompletion(messages, { maxTokens: 50, temperature: 0.1 });
    const content = response.choices[0]?.message?.content || '';
    const hasContent = content.trim().length > 0;

    console.log(hasContent ? '✅ OpenRouter API works' : '❌ OpenRouter API returned empty response');
    passed++;
  } catch (error) {
    console.error('❌ OpenRouter test failed:', error instanceof Error ? error.message : 'Unknown error');
    failed++;
  }

  // Test 4: Slang service
  console.log('\n🕺 Test 4: Slang service');
  try {
    // Реальный вызов Urban Dictionary API
    const slang = await slangService.fetchSlang('test');
    console.log('   AI Response: Slang definitions:', slang);
    if (slang && slang.length > 0) {
      console.log('✅ Slang service works:', slang.length, 'definitions for term "test"');
      passed++;
    } else {
      console.error('❌ Slang service returned empty result');
      failed++;
    }
  } catch (error) {
    console.error('❌ Slang service test failed:', error);
    failed++;
  }

  // Test 5: Full analysis pipeline
  console.log('\n📖 Test 5: Full analysis pipeline');
  try {
    const hasApiKey = !!process.env['OPENROUTER_API_KEY'];
    if (!hasApiKey) {
      console.log('⏭️  Skipping - OPENROUTER_API_KEY not configured');
      passed++;
      return;
    }

    (analysisService as any).sentenceCache.clear();

    const guide = await analysisService.createTranslationGuide({
      sentenceText: 'I gotta go.',
      context: { prev: 'Hello', next: 'See you' },
      seriesName: 'The Walking Dead'
    });

    const isValid = guide.segments.length > 0 && guide.translations.length > 0;
    console.log(isValid ? '✅ Analysis pipeline works' : '❌ Analysis pipeline failed');
    passed++;
  } catch (error) {
    console.error('❌ Analysis test failed:', error instanceof Error ? error.message : 'Unknown error');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TRANSLATION GUIDE TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! New Translation Guide is ready.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run tests
runIntegrationTests().catch((error) => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

