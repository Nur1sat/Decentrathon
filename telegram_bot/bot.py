import logging
import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.error import BadRequest, Conflict
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_WEBAPP_URL = os.getenv("FRONTEND_WEBAPP_URL", "").strip()


def _build_webapp_url(chat_id: int) -> str | None:
    """Return a Telegram-compatible web app URL or None if misconfigured."""
    if not FRONTEND_WEBAPP_URL:
        logger.warning("FRONTEND_WEBAPP_URL is not set. /start will be sent without a web app button.")
        return None

    parsed = urlsplit(FRONTEND_WEBAPP_URL)
    if parsed.scheme != "https" or not parsed.netloc:
        logger.warning(
            "FRONTEND_WEBAPP_URL must be an https URL for Telegram Web Apps. Got: %s",
            FRONTEND_WEBAPP_URL,
        )
        return None

    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["chat_id"] = str(chat_id)
    return urlunsplit(parsed._replace(query=urlencode(query)))


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log Telegram errors clearly and stop on polling conflicts."""
    if isinstance(context.error, Conflict):
        logger.error(
            "Telegram polling conflict detected. Make sure only one bot instance is running for this token."
        )
        context.application.stop_running()
        return

    if isinstance(context.error, BadRequest):
        logger.error("Telegram API rejected a request: %s", context.error)
        return

    logger.error("Unhandled Telegram bot error", exc_info=context.error)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id

    webapp_url = _build_webapp_url(chat_id)
    reply_text = (
        "Добро пожаловать в HI PO.\n\n"
        "Интеллектуальная система отбора кандидатов HI PO Program.\n\n"
        "Нажми кнопку ниже, чтобы открыть форму прямо в Telegram. "
        "После отправки формы не закрывай бот — мы пришлем тебе проверочный вопрос."
    )

    if webapp_url:
        keyboard = InlineKeyboardMarkup(
            [[InlineKeyboardButton(text="Open application form", web_app=WebAppInfo(url=webapp_url))]]
        )
        await update.message.reply_text(reply_text, reply_markup=keyboard)
        return

    await update.message.reply_text(
        reply_text
        + "\n\n"
        + "Форма сейчас недоступна. Укажите FRONTEND_WEBAPP_URL в настройках окружения бота."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text
    chat_id = update.effective_chat.id
    
    # Send processing action
    await update.message.reply_chat_action("typing")
    
    # We assume any incoming text that is not a command is the user's answer to the validation question
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{BACKEND_URL}/telegram/verify_answer",
                json={"tg_chat_id": str(chat_id), "answer_text": text}
            )
            
        if resp.status_code == 200:
            data = resp.json()
            score = data.get("score")
            auth = data.get("authenticity_index")
            await update.message.reply_text(
                f"Верификация пройдена.\n\n"
                f"ИИ проанализировал твой ответ и биометрию клавиатуры:\n"
                f"Общий балл: {score} / 100\n"
                f"Аутентичность: {auth} / 100\n\n"
                f"Твоя полная аналитика уже отправлена приемной комиссии inVision U. Жди результатов!"
            )
        elif resp.status_code == 404:
            await update.message.reply_text(
                "Я не нашел твою заявку. Пожалуйста, заполни форму по кнопке /start."
            )
        else:
            await update.message.reply_text(
                "Произошла ошибка при анализе ответа. Пожалуйста, подожди немного."
            )
    except Exception as e:
        logger.error(f"Error calling verify_answer: {e}")
        await update.message.reply_text("Не удалось связаться с сервером 😔")


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(error_handler)

    logger.info("Starting WebApp-enabled bot")
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()
