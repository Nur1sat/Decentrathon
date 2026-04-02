"""
inVision Lens — Telegram Bot for Applicants
============================================
Conversational intake form for HI PO applicants.

Flow:
  /start
    → greeting + language note
    → full_name
    → age
    → city
    → school_type  (inline keyboard)
    → achievements (long text)
    → essay        (long text OR voice note → Whisper transcription)
    → confirm      (show summary, inline Yes/Edit)
    → submit to backend /apply
    → show application reference

Commands:
  /start  — begin or restart the application
  /cancel — abort the current application
  /status — show current progress in the form
"""

import io
import logging
import os
import tempfile

import httpx
from dotenv import load_dotenv
from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
)
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# ─── Conversation states ────────────────────────────────────────────────────────

(
    ASK_NAME,
    ASK_AGE,
    ASK_CITY,
    ASK_SCHOOL,
    ASK_ACHIEVEMENTS,
    ASK_ESSAY,
    CONFIRM,
) = range(7)

# ─── Keyboards ──────────────────────────────────────────────────────────────────

SCHOOL_KEYBOARD = InlineKeyboardMarkup([
    [InlineKeyboardButton("🏛 Элитная / специализированная", callback_data="elite")],
    [InlineKeyboardButton("🏫 Обычная городская", callback_data="regular")],
    [InlineKeyboardButton("🌾 Сельская школа", callback_data="rural")],
])

SCHOOL_LABELS = {
    "elite": "Элитная/специализированная",
    "regular": "Обычная городская",
    "rural": "Сельская",
}

CONFIRM_KEYBOARD = InlineKeyboardMarkup([
    [
        InlineKeyboardButton("✅ Отправить заявку", callback_data="confirm_yes"),
        InlineKeyboardButton("✏️ Изменить", callback_data="confirm_edit"),
    ],
])

EDIT_KEYBOARD = InlineKeyboardMarkup([
    [InlineKeyboardButton("📝 Имя", callback_data="edit_name"),
     InlineKeyboardButton("🎂 Возраст", callback_data="edit_age")],
    [InlineKeyboardButton("🏙 Город", callback_data="edit_city"),
     InlineKeyboardButton("🏫 Тип школы", callback_data="edit_school")],
    [InlineKeyboardButton("🏆 Достижения", callback_data="edit_achievements"),
     InlineKeyboardButton("📄 Эссе", callback_data="edit_essay")],
    [InlineKeyboardButton("↩️ Назад к подтверждению", callback_data="back_confirm")],
])

# ─── Helpers ────────────────────────────────────────────────────────────────────

def _data(context: ContextTypes.DEFAULT_TYPE) -> dict:
    if "form" not in context.user_data:
        context.user_data["form"] = {}
    return context.user_data["form"]


def _summary(form: dict) -> str:
    school = SCHOOL_LABELS.get(form.get("school_type", ""), "—")
    essay_preview = form.get("essay_text", "—")[:200]
    if len(form.get("essay_text", "")) > 200:
        essay_preview += "…"
    ach_preview = form.get("achievements_text", "—")[:200]
    if len(form.get("achievements_text", "")) > 200:
        ach_preview += "…"

    return (
        f"*Имя:* {form.get('full_name', '—')}\n"
        f"*Возраст:* {form.get('age', '—')} лет\n"
        f"*Город:* {form.get('city', '—')}\n"
        f"*Тип школы:* {school}\n\n"
        f"*Достижения:*\n{ach_preview}\n\n"
        f"*Эссе:*\n{essay_preview}"
    )


async def _transcribe_voice(file_bytes: bytes, mime: str = "audio/ogg") -> str | None:
    """Transcribe a voice note via Groq Whisper API."""
    if not GROQ_API_KEY:
        return None
    try:
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        async with httpx.AsyncClient(timeout=60) as client:
            with open(tmp_path, "rb") as f:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    files={"file": ("voice.ogg", f, "audio/ogg")},
                    data={"model": "whisper-large-v3", "language": "ru"},
                )
        os.unlink(tmp_path)
        if resp.status_code == 200:
            return resp.json().get("text", "").strip()
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
    return None


async def _submit_application(form: dict) -> dict | None:
    """POST the completed form to the backend /apply endpoint."""
    payload = {
        "full_name": form["full_name"],
        "age": form["age"],
        "school_type": form["school_type"],
        "city": form["city"],
        "achievements_text": form["achievements_text"],
        "essay_text": form["essay_text"],
        "source": "telegram",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{BACKEND_URL}/apply", json=payload)
        if resp.status_code == 201:
            return resp.json()
        logger.error(f"Backend /apply returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to submit application: {e}")
    return None


# ─── Handlers ───────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text(
        "👋 *Добро пожаловать в inVision Lens!*\n\n"
        "Это интеллектуальная система отбора кандидатов inDrive University.\n\n"
        "Я помогу вам заполнить заявку. Процесс займёт 5–7 минут.\n\n"
        "🔒 *Ваши данные защищены:* перед анализом все личные данные "
        "автоматически обезличиваются — наш ИИ никогда не видит ваше имя.\n\n"
        "Введите ваше *полное имя* (ФИО):",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=ReplyKeyboardRemove(),
    )
    return ASK_NAME


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text(
        "❌ Заявка отменена. Чтобы начать заново — /start",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    form = _data(context)
    if not form:
        await update.message.reply_text("Заявка не начата. Введите /start чтобы начать.")
        return
    filled = [k for k in ["full_name", "age", "city", "school_type", "achievements_text", "essay_text"] if form.get(k)]
    await update.message.reply_text(
        f"Прогресс: {len(filled)}/6 полей заполнено.\n"
        + _summary(form),
        parse_mode=ParseMode.MARKDOWN,
    )


async def got_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    name = update.message.text.strip()
    if len(name) < 2:
        await update.message.reply_text("Пожалуйста, введите корректное полное имя:")
        return ASK_NAME
    _data(context)["full_name"] = name
    await update.message.reply_text(
        f"Отлично, *{name.split()[0]}*! 👍\n\nСколько вам лет?",
        parse_mode=ParseMode.MARKDOWN,
    )
    return ASK_AGE


async def got_age(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip()
    try:
        age = int(text)
        if not (10 <= age <= 35):
            raise ValueError
    except ValueError:
        await update.message.reply_text("Пожалуйста, введите корректный возраст (число от 10 до 35):")
        return ASK_AGE
    _data(context)["age"] = age
    await update.message.reply_text("Из какого вы города или населённого пункта?")
    return ASK_CITY


async def got_city(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    city = update.message.text.strip()
    if len(city) < 2:
        await update.message.reply_text("Пожалуйста, введите название вашего города:")
        return ASK_CITY
    _data(context)["city"] = city
    await update.message.reply_text(
        "Выберите тип вашей школы:",
        reply_markup=SCHOOL_KEYBOARD,
    )
    return ASK_SCHOOL


async def got_school(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    school_type = query.data  # "elite" | "regular" | "rural"
    _data(context)["school_type"] = school_type
    label = SCHOOL_LABELS[school_type]
    await query.edit_message_text(
        f"✅ Тип школы: *{label}*\n\n"
        "Теперь расскажите о своих *достижениях*:\n"
        "олимпиады, проекты, награды, сертификаты, волонтёрство — всё, что считаете важным.\n\n"
        "_Пишите свободно, без шаблонов. Чем конкретнее — тем лучше._",
        parse_mode=ParseMode.MARKDOWN,
    )
    return ASK_ACHIEVEMENTS


async def got_achievements(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip()
    if len(text) < 30:
        await update.message.reply_text(
            "Пожалуйста, опишите достижения подробнее (не менее 30 символов):"
        )
        return ASK_ACHIEVEMENTS
    _data(context)["achievements_text"] = text
    await update.message.reply_text(
        "Отлично! Последний шаг — *мотивационное эссе* 📝\n\n"
        "Расскажите: *почему inDrive University?* Что вас привело сюда?\n"
        "Какую проблему вы хотите решить? Что делает вас именно тем человеком?\n\n"
        "_Пишите от себя. Нам важен ваш голос, а не идеальный текст._\n\n"
        "💡 Вы также можете отправить *голосовое сообщение* — мы транскрибируем его автоматически.",
        parse_mode=ParseMode.MARKDOWN,
    )
    return ASK_ESSAY


async def got_essay_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip()
    if len(text) < 50:
        await update.message.reply_text(
            "Пожалуйста, напишите эссе подробнее (не менее 50 символов):"
        )
        return ASK_ESSAY
    _data(context)["essay_text"] = text
    return await _show_confirmation(update, context)


async def got_essay_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_chat_action(ChatAction.TYPING)
    voice = update.message.voice
    tg_file = await context.bot.get_file(voice.file_id)
    buf = io.BytesIO()
    await tg_file.download_to_memory(buf)
    file_bytes = buf.getvalue()

    await update.message.reply_text("🎙 Транскрибирую голосовое сообщение…")
    transcript = await _transcribe_voice(file_bytes)

    if transcript and len(transcript) >= 50:
        _data(context)["essay_text"] = transcript
        await update.message.reply_text(
            f"✅ *Транскрипция:*\n\n_{transcript}_\n\n"
            "Если текст верный — идём дальше. Если хотите исправить — отправьте эссе текстом.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return await _show_confirmation(update, context)
    else:
        await update.message.reply_text(
            "Не удалось распознать голосовое сообщение. "
            "Пожалуйста, напишите эссе текстом:"
        )
        return ASK_ESSAY


async def _show_confirmation(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    form = _data(context)
    summary = _summary(form)
    msg = (
        "📋 *Проверьте вашу заявку:*\n\n"
        + summary
        + "\n\n"
        "Всё верно? Нажмите «Отправить заявку» или «Изменить»."
    )
    # update can be from a message or a callback
    if update.message:
        await update.message.reply_text(
            msg, parse_mode=ParseMode.MARKDOWN, reply_markup=CONFIRM_KEYBOARD
        )
    else:
        await update.callback_query.edit_message_text(
            msg, parse_mode=ParseMode.MARKDOWN, reply_markup=CONFIRM_KEYBOARD
        )
    return CONFIRM


async def confirm_yes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("⏳ Отправляю заявку…")

    form = _data(context)
    result = await _submit_application(form)

    if result:
        ref = result.get("application_ref", "—")
        await query.edit_message_text(
            f"🎉 *Заявка принята!*\n\n"
            f"Номер заявки: `{ref}`\n\n"
            f"Сохраните этот номер — он потребуется при коммуникации с приёмной комиссией.\n\n"
            f"Удачи! Мы свяжемся с вами после завершения отбора. 🚀",
            parse_mode=ParseMode.MARKDOWN,
        )
    else:
        await query.edit_message_text(
            "⚠️ Произошла ошибка при отправке заявки. "
            "Пожалуйста, попробуйте позже или свяжитесь с приёмной комиссией напрямую."
        )

    context.user_data.clear()
    return ConversationHandler.END


async def confirm_edit(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "Что вы хотите изменить?",
        reply_markup=EDIT_KEYBOARD,
    )
    return CONFIRM


# Edit callbacks — jump back to the relevant state
async def edit_field(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    field = query.data  # e.g. "edit_name"

    prompts = {
        "edit_name": ("Введите новое ФИО:", ASK_NAME),
        "edit_age": ("Введите новый возраст:", ASK_AGE),
        "edit_city": ("Введите новый город:", ASK_CITY),
        "edit_school": ("Выберите тип школы:", ASK_SCHOOL),
        "edit_achievements": ("Введите обновлённые достижения:", ASK_ACHIEVEMENTS),
        "edit_essay": ("Введите обновлённое эссе:", ASK_ESSAY),
    }

    if field == "back_confirm":
        return await _show_confirmation(update, context)

    prompt_text, next_state = prompts.get(field, ("Введите значение:", ASK_NAME))

    if field == "edit_school":
        await query.edit_message_text(prompt_text, reply_markup=SCHOOL_KEYBOARD)
        return ASK_SCHOOL

    await query.edit_message_text(prompt_text)
    return next_state


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error("Exception while handling an update:", exc_info=context.error)


# ─── Main ────────────────────────────────────────────────────────────────────────

def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", cmd_start)],
        states={
            ASK_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_name)],
            ASK_AGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_age)],
            ASK_CITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_city)],
            ASK_SCHOOL: [CallbackQueryHandler(got_school, pattern="^(elite|regular|rural)$")],
            ASK_ACHIEVEMENTS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_achievements)
            ],
            ASK_ESSAY: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_essay_text),
                MessageHandler(filters.VOICE, got_essay_voice),
            ],
            CONFIRM: [
                CallbackQueryHandler(confirm_yes, pattern="^confirm_yes$"),
                CallbackQueryHandler(confirm_edit, pattern="^confirm_edit$"),
                CallbackQueryHandler(edit_field, pattern="^(edit_|back_)"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cmd_cancel)],
        allow_reentry=True,
        name="application_flow",
    )

    app.add_handler(conv_handler)
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_error_handler(error_handler)

    logger.info("Bot starting…")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
