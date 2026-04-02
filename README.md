# inVision Lens — Essay Authenticity Checker

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
