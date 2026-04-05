web: gunicorn --chdir backend main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
bot: cd telegram_bot && python bot.py
