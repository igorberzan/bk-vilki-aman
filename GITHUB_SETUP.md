# Подключение к GitHub

## 1. Создать репозиторий на GitHub

1. Зайдите на [github.com](https://github.com) и войдите в аккаунт (или зарегистрируйтесь).
2. Нажмите **«+»** в правом верхнем углу → **«New repository»**.
3. Заполните:
   - **Repository name:** например `bk-vilki-aman` (или любое имя).
   - **Description:** по желанию, например «БК Вилки с Аманом».
   - **Public**.
   - **НЕ** ставьте галочки «Add a README», «Add .gitignore», «Choose a license» — репозиторий должен быть пустым.
4. Нажмите **«Create repository»**.

## 2. Подключить локальный проект к репозиторию

В терминале в папке проекта выполните (подставьте вместо `ВАШ_ЛОГИН` и `bk-vilki-aman` свои значения):

```bash
cd /Users/igorberzan/Desktop/bk-vilki-aman

git remote add origin https://github.com/ВАШ_ЛОГИН/bk-vilki-aman.git
git branch -M main
git push -u origin main
```

При первом `git push` GitHub может запросить вход: логин и пароль (или **Personal Access Token** вместо пароля, если включена 2FA).  
Рекомендуется использовать [Personal Access Token](https://github.com/settings/tokens): создать токен с правом `repo`, ввести его вместо пароля при запросе.

## 3. Дальнейшая работа

- После правок в проекте:
  ```bash
  git add .
  git commit -m "Описание изменений"
  git push
  ```
- Чтобы включить **GitHub Pages** (публикация сайта): в репозитории **Settings → Pages → Source**: выберите ветку **main** и папку **/ (root)** → Save. Сайт будет по адресу `https://ВАШ_ЛОГИН.github.io/bk-vilki-aman/`.
