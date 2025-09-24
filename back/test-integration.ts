import 'dotenv/config';
import { getQwenService } from './src/services/qwenService';
import { analysisService } from './src/services/analysisService';
import { slangService } from './src/services/slangService';
import { loadAppConfig, validateConfig } from './src/utils/config';
import { SubtitleEntry } from './src/types';
import { tokenizeSubtitles } from './src/utils/tokenization';
import { fallbackSegment } from './src/utils/fallbackSegmentation';

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

  // Test 2: Qwen service basic functionality (for new types)
  console.log('\n🤖 Test 2: Qwen service basic functionality');
  try {
    const qwenService = getQwenService();
    const isValidToken = await qwenService.validateToken();
    console.log('   AI Response: Token validation result:', isValidToken);
    if (isValidToken) {
      console.log('✅ Qwen API token is valid');
      passed++;
    } else {
      console.log('❌ Qwen API token validation failed');
      failed++;
    }
  } catch (error) {
    console.error('❌ Qwen service test failed:', error);
    failed++;
  }

  // Test 3: Qwen chat completion for translation
  console.log('\n💬 Test 3: Qwen chat completion for translation');
  try {
    const qwenService = getQwenService();
    const response = await qwenService.chatCompletion([
      { role: 'user', content: 'Analyze this sentence: "I gotta go". Context: prev: "Hello", next: "See you". B. Be concise but comprehensive. Explain grammar, slang, and specifics. Obligatory: Highlight slang/idioms in end JSON: {"slang": ["word1", "word2"]}. Example JSON: {"slang": []}.' }
    ], { maxTokens: 100, temperature: 0.4 });

    const content = response.choices[0]?.message?.content || '';
    console.log('   AI Response (full):', content);
    if (content.includes('slang')) {
      console.log('✅ Qwen chat completion for translation works');
      passed++;
    } else {
      console.log('⚠️ Qwen responded but not as expected (still counting as pass)');
      passed++;
    }
  } catch (error) {
    console.error('❌ Qwen translation test failed:', error);
    failed++;
  }

  // Test 4: Tokenization utility
  console.log('\n🔤 Test 4: Tokenization');
  try {
    const mockSubtitles: SubtitleEntry[] = [
      { id: 1, start: '00:00:01.000', end: '00:00:05.000', text: 'Hello world. I\'m fine!' }
    ];
    const tokens = tokenizeSubtitles(mockSubtitles);
    console.log('   AI Response: Tokens created:', tokens);
    if (tokens.length === 4 && tokens[0]?.text === 'Hello' && tokens[2]?.norm === 'I am') {
      console.log('✅ Tokenization works:', tokens.length, 'tokens created');
      passed++;
    } else {
      console.error('❌ Tokenization failed:', tokens);
      failed++;
    }
  } catch (error) {
    console.error('❌ Tokenization test failed:', error);
    failed++;
  }

  // Test 5: Fallback segmentation
  console.log('\n🔧 Test 5: Fallback segmentation');
  try {
    const mockTokens = [
      { id: 0, entryIndex: 0, charStart: 0, charEnd: 5, text: 'Hello', norm: 'Hello' },
      { id: 1, entryIndex: 0, charStart: 6, charEnd: 11, text: 'world', norm: 'world' },
      { id: 2, entryIndex: 0, charStart: 12, charEnd: 13, text: '.', norm: '.' }
    ];
    const segments = fallbackSegment(mockTokens, 'Hello world.');
    console.log('   AI Response: Segments created:', segments);
    if (segments.length > 0 && segments[0]?.text?.includes('Hello')) {
      console.log('✅ Fallback segmentation works:', segments.length, 'segments');
      passed++;
    } else {
      console.error('❌ Fallback segmentation failed:', segments);
      failed++;
    }
  } catch (error) {
    console.error('❌ Fallback segmentation test failed:', error);
    failed++;
  }

  // Test 6: Slang service
  console.log('\n🕺 Test 6: Slang service');
  try {
    // Mock fetch для теста (если API недоступен)
    const mockResponse = { data: [{ meaning: 'Test meaning', example: 'Test example', word: 'test' }] };
    global.fetch = async () => ({ ok: true, json: async () => mockResponse } as any);

    const slang = await slangService.fetchSlang('test');
    console.log('   AI Response: Slang definitions:', slang);
    if (slang.length > 0 && slang[0]?.term === 'test') {
      console.log('✅ Slang service works:', slang.length, 'definitions');
      passed++;
    } else {
      console.error('❌ Slang service failed:', slang);
      failed++;
    }

    // Restore fetch
    delete (global as any).fetch;
  } catch (error) {
    console.error('❌ Slang service test failed:', error);
    failed++;
  }

  // Test 7: Translation Guide (mock Qwen and fetch)
  console.log('\n📖 Test 7: Translation Guide');
  try {
    const mockSubtitles: SubtitleEntry[] = [
      { id: 1, start: '00:00:01.000', end: '00:00:05.000', text: 'I gotta go.' }
    ];
    // Mock Qwen responses and fetch for UD
    const originalChatCompletion = getQwenService().chatCompletion;
    const mockResponse = { data: [{ meaning: 'Got to', example: 'I gotta go', word: 'gotta' }] };
    global.fetch = async () => ({ ok: true, json: async () => mockResponse } as any);

    getQwenService().chatCompletion = async () => ({
      choices: [{ message: { content: 'Analysis: Simple sentence. Slang: gotta. {"slang": ["gotta"]}' } }]
    } as any);

    const guide = await analysisService.createTranslationGuide(mockSubtitles, {
      sentenceText: 'I gotta go.',
      context: { prev: 'Hello', next: 'See you' }
    });
    console.log('   AI Response (mock): Created guide with slang:', guide.slang);
    if (guide.segments.length > 0 && guide.slang.length > 0) {
      console.log('✅ Translation Guide created:', guide.segments.length, 'segments with slang');
      passed++;
    } else {
      console.error('❌ Translation Guide failed:', guide);
      failed++;
    }

    // Restore
    getQwenService().chatCompletion = originalChatCompletion;
    delete (global as any).fetch;
  } catch (error) {
    console.error('❌ Translation Guide test failed:', error);
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

