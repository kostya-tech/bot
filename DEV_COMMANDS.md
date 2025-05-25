# 🚀 Команди для розробки

## Основні команди

```bash
# Запуск в режимі розробки (головна команда)
npm run dev
# або
npm start

# Відкрити LangGraph Studio в браузері
npm run studio
```

## Тестування

```bash
# Швидкий тест жарт-бота (рекомендований)
npm run test:quick

# Повна демонстрація сценарію
npm run demo:joke

# Швидкий тест графа
npm run test:graph

# Інтерактивний тест з кількома повідомленнями
npm run test:interactive

# Юніт тести
npm test

# Інтеграційні тести
npm run test:int
```

## Збірка

```bash
# Одноразова збірка
npm run build

# Автоматична збірка при змінах
npm run build:watch

# Очистка
npm run clean
```

## Якість коду

```bash
# Форматування коду
npm run format

# Перевірка лінтером
npm run lint

# Перевірка всього
npm run lint:all
```

## 🎯 Швидкий старт

1. **Запустити сервер:** `npm run dev`
2. **Відкрити Studio:** `npm run studio` 
3. **Тестувати зміни:** `npm run test:graph`

Сервер автоматично перезавантажується при змінах в `src/`! 