# 🎭 Управління базою жартів

## 📁 Структура файлів

```
bot/
├── data/
│   └── jokes.json          # 🎯 ОСНОВНИЙ ФАЙЛ З ЖАРТАМИ
├── src/
│   └── rag/
│       └── vectorStore.ts  # Код для завантаження жартів
```

## 🎯 Як редагувати жарти

### 📝 Редагування файлу `data/jokes.json`

Просто відкрийте файл `data/jokes.json` у будь-якому текстовому редакторі та змініть жарти:

```json
[
    {
        "content": "Ваш новий жарт тут! 😄",
        "metadata": {
            "category": "general",
            "difficulty": "easy",
            "tags": ["funny", "new"],
            "language": "ukrainian"
        }
    }
]
```

### 🏷️ Структура жарту

Кожен жарт має наступну структуру:

```json
{
    "content": "Текст жарту з емодзі 😄",
    "metadata": {
        "category": "категорія",           // programming, design, testing, general
        "difficulty": "складність",        // easy, medium, hard
        "tags": ["тег1", "тег2"],         // ключові слова для пошуку
        "language": "мова"                // ukrainian, english
    }
}
```

### 📊 Доступні категорії

- `programming` - жарти про програмування
- `web-development` - веб-розробка
- `design` - дизайн
- `testing` - тестування
- `general` - загальні жарти

### 🎚️ Рівні складності

- `easy` - прості жарти, зрозумілі всім
- `medium` - потребують базових знань
- `hard` - для експертів у галузі

## 🔄 Як застосувати зміни

### Варіант 1: Перезапуск бота (рекомендовано)

```bash
# Зупиніть бота (Ctrl+C)
# Перезапустіть
npm run build
npm run studio
```

### Варіант 2: Гарячий перезапуск (в розробці)

```bash
# Поки що не реалізовано, але можна додати
npm run reload-jokes
```

## 🧪 Тестування нових жартів

### Перевірка JSON синтаксису

```bash
# Перевірити чи валідний JSON
node -e "console.log('✅ JSON валідний:', JSON.parse(require('fs').readFileSync('data/jokes.json', 'utf8')).length, 'жартів')"
```

### Тестування в боті

1. Запустіть бота: `npm run studio`
2. Відкрийте http://localhost:2024
3. Протестуйте нові жарти

## 📋 Приклади жартів

### Програмування
```json
{
    "content": "Чому програмісти не люблять природу? Тому що там забагато багів! 🐛",
    "metadata": {
        "category": "programming",
        "difficulty": "easy",
        "tags": ["bugs", "nature"],
        "language": "ukrainian"
    }
}
```

### Дизайн
```json
{
    "content": "Чому дизайнери завжди холодні? Тому що вони залишають вікна відкритими! 🪟",
    "metadata": {
        "category": "design",
        "difficulty": "easy",
        "tags": ["design", "windows"],
        "language": "ukrainian"
    }
}
```

### Загальні
```json
{
    "content": "Що спільного між програмістом та магом? Обидва створюють щось з нічого! ✨",
    "metadata": {
        "category": "general",
        "difficulty": "easy",
        "tags": ["magic", "creation"],
        "language": "ukrainian"
    }
}
```

## 🚨 Важливі поради

1. **Завжди перевіряйте JSON синтаксис** - одна помилка зламає весь файл
2. **Використовуйте емодзі** - вони роблять жарти веселішими
3. **Додавайте релевантні теги** - це покращує пошук
4. **Вказуйте правильну складність** - це допомагає RAG системі
5. **Зберігайте резервні копії** - на випадок помилок

## 🔧 Розширені можливості

### Додавання нових категорій

Просто використовуйте нову категорію в `metadata.category` - система автоматично її підтримає.

### Мультимовність

Додайте жарти іншими мовами, змінивши `metadata.language`:

```json
{
    "content": "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
    "metadata": {
        "language": "english",
        "category": "programming",
        "difficulty": "easy",
        "tags": ["bugs", "dark-mode"]
    }
}
```

### Сезонні жарти

Додайте теги для сезонних жартів:

```json
{
    "content": "Чому програмісти плутають Різдво з Хеловіном? Тому що Oct 31 = Dec 25! 🎃🎄",
    "metadata": {
        "category": "programming",
        "difficulty": "hard",
        "tags": ["christmas", "halloween", "octal", "seasonal"],
        "language": "ukrainian"
    }
}
``` 