import logging
import os

import httpx
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
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
FRONTEND_WEBAPP_URL = os.getenv("FRONTEND_WEBAPP_URL", "http://localhost:5173/apply")


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    
    # Construct the Web App URL passing the chat_id in query params
    webapp_url = f"{FRONTEND_WEBAPP_URL}?chat_id={chat_id}"
    
    await update.message.reply_text(
        "👋 *Добро пожаловать в HI PO!* \n\n"
        "Это интеллектуальная система отбора кандидатов HI PO Program.\n\n"
        "Перейди по ссылке ниже, чтобы открыть безопасную форму заявки. Наш ИИ (Llama 3.3) проанализирует твое эссе мгновенно.\n\n"
        f"🔗 [ОТКРЫТЬ ФОРМУ ЗАЯВКИ]({webapp_url})\n\n"
        "*(Если ссылка не нажимается, скопируй её:)*\n"
        f"`{webapp_url}`\n\n"
        "👉 _После отправки формы не закрывай бот — мы пришлем тебе секретный проверочный вопрос._",
        parse_mode="Markdown"
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
                f"✅ *Верификация пройдена!*\n\n"
                f"ИИ проанализировал твой ответ и биометрию клавиатуры:\n"
                f"🟢 *Общий балл:* {score} / 100\n"
                f"⚡ *Аутентичность:* {auth} / 100\n\n"
                f"Твоя полная аналитика уже отправлена приемной комиссии inVision U. Жди результатов!",
                parse_mode="Markdown"
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

    logger.info("Starting WebApp-enabled Bot…")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
