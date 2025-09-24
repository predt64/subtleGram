var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/**
 * Простой тест для проверки работы API Urban Dictionary
 * Запускается: node test-ud-api.ts
 */
function testUDApi() {
    return __awaiter(this, void 0, void 0, function () {
        var term, url, response, data, firstDef, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Тестируем API Urban Dictionary...\n');
                    term = 'test';
                    url = "https://unofficialurbandictionaryapi.com/api/search?term=".concat(encodeURIComponent(term));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    console.log("\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C \u0437\u0430\u043F\u0440\u043E\u0441 \u043A: ".concat(url));
                    return [4 /*yield*/, fetch(url)];
                case 2:
                    response = _a.sent();
                    console.log("\u0421\u0442\u0430\u0442\u0443\u0441 \u043E\u0442\u0432\u0435\u0442\u0430: ".concat(response.status, " ").concat(response.statusText));
                    if (!response.ok) {
                        throw new Error("HTTP \u043E\u0448\u0438\u0431\u043A\u0430: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log('Полный ответ от API:');
                    console.log(JSON.stringify(data, null, 2));
                    if (data.list && data.list.length > 0) {
                        firstDef = data.list[0];
                        console.log('\n✅ API работает! Первое определение:');
                        console.log("  \u0421\u043B\u043E\u0432\u043E: ".concat(term));
                        console.log("  \u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435: ".concat(firstDef.definition || 'Нет'));
                        console.log("  \u041F\u0440\u0438\u043C\u0435\u0440: ".concat(firstDef.example || 'Нет'));
                        console.log("  \u041B\u0430\u0439\u043A\u0438: ".concat(firstDef.thumbs_up || 0));
                        console.log("  \u0414\u0438\u0437\u043B\u0430\u0439\u043A\u0438: ".concat(firstDef.thumbs_down || 0));
                        console.log("  \u0421\u0441\u044B\u043B\u043A\u0430: ".concat(firstDef.permalink || 'Нет'));
                    }
                    else {
                        console.log('\n⚠️ API работает, но нет определений для слова "test".');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('\n❌ Ошибка при запросе к UD API:', error_1);
                    console.log('Возможные причины:');
                    console.log('- Нет интернета');
                    console.log('- API временно недоступен');
                    console.log('- Rate limit превышен');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Запускаем тест
testUDApi();
