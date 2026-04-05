# HI PO — Essay Authenticity Checker

Инструмент для приёмной комиссии: загружаешь эссе кандидата — система показывает насколько оно настоящее и кто его написал.

---

## Что делает

**Проверяет эссе по трём осям:**

| Ось | Что проверяет |
|---|---|
| Связь с реальностью | Есть ли конкретные даты, места, имена, числа — или всё абстрактно |
| Личный опыт | Есть ли реальные истории, эмоции, неудачи — или просто декларации |
| Оригинальность | Уникальный голос или набор клише и корпоративных фраз |

**Подсвечивает фрагменты прямо в тексте:**
- 🔴 AI-сигнал — фраза похожа на сгенерированную
- 🟠 Клише — шаблонный оборот
- 🟢 Живой голос — конкретная деталь, личный опыт

**Плюс 4-осевой скоринг кандидата:**

| Ось | Вес |
|---|---|
| Hard Skills | 25% |
| Growth Trajectory | 30% |
| Leadership Potential | 25% |
| Authenticity Index | 20% |

Кандидат из сельской школы с теми же достижениями получает выше по Growth Trajectory, чем кандидат из элитной — это заложено в промпт.

---

## Стек

| | |
|---|---|
| Backend | FastAPI + SQLAlchemy + PostgreSQL/SQLite |
| AI | Groq API, Llama 3.3 70B |
| Frontend | React 18 + Vite + Tailwind CSS |

---

## Запуск

### Backend

```bash
cd backend
cp .env.example .env
# Заполнить GROQ_API_KEY в .env
pip install -r requirements.txt
uvicorn main:app --reload
```

Без `DATABASE_URL` — поднимается на SQLite автоматически.

### Тестовые данные

```bash
cd backend
python seed_data.py
```

12 синтетических кандидатов: отличник, скрытый талант, AI-писатель и др.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173`

---

## API

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/candidates` | Список кандидатов |
| `GET` | `/candidates/{id}` | Карточка кандидата |
| `POST` | `/candidates` | Добавить кандидата |
| `POST` | `/candidates/{id}/score` | Запустить анализ |
| `POST` | `/candidates/{id}/feedback` | Оценка комиссии (agree/disagree) |
| `GET` | `/health` | Health check |

## 🚀 Deployment (Railway)

The platform is configured for deployment on [Railway](https://railway.app) as a monorepo.

### 1. Project Setup
- Connect your GitHub repository to a new Railway project.
- Railway will detect the root `requirements.txt` and `railpack.json` for the backend service.

### 2. Environment Variables
Add the following variables to your Railway service:
- `DATABASE_URL`: (Railway will provide this after you add a PostgreSQL plugin).
- `GROQ_API_KEY`: Your Groq Cloud API key.
- `TELEGRAM_BOT_TOKEN`: From BotFather.
- `BACKEND_URL`: The public backend URL used by the Telegram bot (e.g., `https://your-app-production.up.railway.app`).
- `FRONTEND_WEBAPP_URL`: The public HTTPS URL of the application form used by the Telegram bot (e.g., `https://your-frontend.example.com/apply`).
- `VITE_BACKEND_URL`: The backend URL used by the frontend build.
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: For email notifications.

### 3. Services
In the Railway dashboard:
- **Web Service**: Runs the FastAPI backend.
- **Worker Service**: Create a second service pointing to the same repo, but set the start command to `cd telegram_bot && python bot.py`.
- Run only one bot worker replica for a given `TELEGRAM_BOT_TOKEN`, otherwise Telegram will return `409 Conflict` for duplicate `getUpdates` polling.

### 4. Database Migration
After the first deploy, run the migration script via Railway's terminal or as a one-time command:
```bash
cd backend && python migrate.py
```
