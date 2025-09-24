/**
 * Простой тест для проверки работы API Urban Dictionary
 * Запускается: node test-ud-api.ts
 */
async function testUDApi() {
  console.log('🔍 Тестируем API Urban Dictionary...\n');

  const term = 'sloppy seconds'; // Тестовое слово
  const url = `https://unofficialurbandictionaryapi.com/api/search?term=${encodeURIComponent(term)}`;

  try {
    console.log(`Отправляем запрос к: ${url}`);

    const response = await fetch(url);
    console.log(`Статус ответа: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP ошибка: ${response.status}`);
    }

    const data = await response.json();
    console.log('Полный ответ от API:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      const firstDef = data.data[0];
      console.log('\n✅ API работает! Первое определение:');
      console.log(`  Слово: ${firstDef.word || term}`);
      console.log(`  Определение: ${firstDef.meaning || 'Нет'}`);
      console.log(`  Пример: ${firstDef.example || 'Нет'}`);
      console.log(`  Автор: ${firstDef.contributor || 'Нет'}`);
      console.log(`  Дата: ${firstDef.date || 'Нет'}`);
      console.log(`  Ссылка: https://urbandictionary.com/define.php?term=${encodeURIComponent(term)}`);
    } else {
      console.log('\n⚠️ API работает, но нет определений для слова "sloppy seconds".');
    }

  } catch (error) {
    console.error('\n❌ Ошибка при запросе к UD API:', error);
    console.log('Возможные причины:');
    console.log('- Нет интернета');
    console.log('- API временно недоступен');
    console.log('- Rate limit превышен');
  }
}

// Запускаем тест
testUDApi();
