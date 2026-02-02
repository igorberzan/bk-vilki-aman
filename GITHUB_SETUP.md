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

В терминале в папке проекта выполните:

```bash
cd /Users/igorberzan/Desktop/bk-vilki-aman

git remote add origin https://github.com/igorberzan/bk-vilki-aman.git
git branch -M main
git push -u origin main
```

При первом `git push` GitHub запросит **Personal Access Token** (пароль аккаунта не подходит).  
Создайте токен: [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic) → поставьте галочку **repo** → скопируйте токен.

**Если в терминале не получается вставить токен в поле пароля** (защищённый ввод): используйте один раз команду с токеном в адресе (подставьте свой токен вместо `ВАШ_ТОКЕН`):
```bash
git remote set-url origin https://igorberzan:ВАШ_ТОКЕН@github.com/igorberzan/bk-vilki-aman.git
git push -u origin main
```
Токен вставляется в обычную строку терминала (Cmd+V сработает), затем Enter. После успешного пуша лучше убрать токен из URL: `git remote set-url origin https://github.com/igorberzan/bk-vilki-aman.git` и настроить [credential helper](https://docs.github.com/en/get-started/getting-started-with-git/caching-your-github-credentials-in-git) или в следующий раз снова подставить токен в URL.

## 3. Дальнейшая работа

- После правок в проекте:
  ```bash
  git add .
  git commit -m "Описание изменений"
  git push
  ```
- Чтобы включить **GitHub Pages** (публикация сайта): в репозитории **Settings → Pages → Source**: выберите ветку **main** и папку **/ (root)** → Save. Сайт будет по адресу `https://ВАШ_ЛОГИН.github.io/bk-vilki-aman/`.
