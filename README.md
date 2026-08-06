# FIB Instructor — Трекер

Локальный трекер для инструктора:
- **Заявки** на повышение (норма 15)
- **Группы** / регруппы (норма 3)
- **Пруфы** — ссылки на доказательства
- **Заметки**

Всё сохраняется в браузере (`localStorage`).

## Открыть локально

Открой `index.html` в браузере  
или на рабочем столе папка: `fib-instructor-tracker`.

## Выложить на GitHub Pages

1. Создай новый репозиторий на GitHub (например `fib-instructor-tracker`)
2. Залей туда файлы из этой папки (`index.html`, `styles.css`, `app.js`, `README.md`)
3. Settings → Pages → Source: **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)` → Save
5. Через минуту сайт будет по адресу:
   `https://ТВОЙ_НИК.github.io/fib-instructor-tracker/`

### Через Git (если установлен)

```bash
cd Desktop/fib-instructor-tracker
git init
git add .
git commit -m "FIB instructor tracker"
git branch -M main
git remote add origin https://github.com/ТВОЙ_НИК/fib-instructor-tracker.git
git push -u origin main
```

Потом включи GitHub Pages как выше.
