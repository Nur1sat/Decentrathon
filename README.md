# PathFinder AI — Intelligent Candidate Selection System for inVision U

PathFinder AI — это не просто скоринговый движок, а система выявления лидерского потенциала и аутентичности кандидатов. Мы помогаем приёмной комиссии находить «агентов изменений», анализируя их путь развития, а не только формальные достижения.

---

## Ключевые возможности

- **Анализ траектории роста** — оценка достижений кандидата относительно его стартовых условий: кандидат из сельской школы с крутым социальным проектом получает заслуженный бонус
- **4-осевая модель оценки** — Hard Skills, Growth Trajectory, Leadership Potential, Authenticity Index вместо одного усреднённого балла
- **Детекция аутентичности** — вероятность AI-контента в эссе и подсветка «стерильных» фраз прямо в интерфейсе для сохранения «подлинного голоса» кандидата
- **Explainable AI (XAI)** — каждое решение сопровождается детальным объяснением: сильные стороны, риски, цитаты из эссе
- **Human-in-the-Loop** — система выступает как ассистент, оставляя финальное решение за экспертом. Комиссия соглашается или не соглашается с оценкой ИИ — система учится
- **Паутинка компетенций** — radar chart по 4 осям для визуального сравнения кандидатов

---

## Стек технологий

| Слой | Технологии |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| AI | Anthropic Claude claude-sonnet-4-6 |
| Frontend Web | React 18, Vite, Tailwind CSS, Recharts |
| Frontend Mobile | *(в разработке)* |

---

## Быстрый старт

### Требования

- Python 3.11+
- Node.js 18+
- PostgreSQL (локально или Docker)
- Anthropic API Key

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Nur1sat/Decentrathon.git
cd Decentrathon
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Заполнить `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/invision
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Сервер запустится на `http://localhost:8000`.

### 3. Заполнить базу тестовыми данными

```bash
python seed_data.py
```

Создаст 12 синтетических кандидатов — типичный отличник, скрытый талант, AI-генератор и др. — и автоматически запустит скоринг если задан `ANTHROPIC_API_KEY`.

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Откроется на `http://localhost:5173`.

---

## API эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/candidates` | Список всех кандидатов с оценками |
| `GET` | `/candidates/{id}` | Полная карточка кандидата |
| `POST` | `/candidates` | Создать кандидата |
| `POST` | `/candidates/{id}/score` | Запустить AI-оценку |
| `POST` | `/candidates/{id}/feedback` | Feedback от комиссии (agree/disagree) |
| `GET` | `/health` | Health check |

---

## Структура проекта

```
Decentrathon/
├── backend/
│   ├── main.py          # FastAPI приложение, роуты
│   ├── models.py        # ORM модели + Pydantic схемы
│   ├── database.py      # Подключение к PostgreSQL
│   ├── scoring.py       # Интеграция с Claude API
│   ├── prompts.py       # Системные промпты (ценности inDrive)
│   ├── seed_data.py     # Синтетический датасет (12 кандидатов)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx       # Главная с таблицей кандидатов
│       │   └── CandidateDetail.jsx # Карточка кандидата
│       └── components/
│           ├── RadarChart.jsx              # Паутинка компетенций
│           ├── AuthenticityHighlight.jsx   # Подсветка AI-фраз в эссе
│           ├── FeedbackButton.jsx          # Human-in-the-loop
│           └── CandidateTable.jsx          # Сортируемая таблица
├── frontend_mobile/     # Мобильное приложение (в разработке)
└── docs/                # Документация
```

---

## Модель оценки

| Ось | Вес | Что измеряет |
|---|---|---|
| Hard Skills | 25% | Олимпиады, проекты, формальные достижения |
| Growth Trajectory | 30% | Соотношение стартовых условий и текущих результатов |
| Leadership Potential | 25% | Инициатива, активные глаголы, влияние на других |
| Authenticity Index | 20% | «Живость» текста, отсутствие шаблонности |

**Overall Score** = Hard Skills×0.25 + Growth×0.30 + Leadership×0.25 + Authenticity×0.20

---

## Хакатон

Проект создан для **Decentrathon** в рамках трека inDrive University.
