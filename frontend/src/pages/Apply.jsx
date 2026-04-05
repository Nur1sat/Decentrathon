import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Check } from "lucide-react";

export default function Apply() {
  const [params] = useSearchParams();
  const tg_chat_id = params.get("chat_id") || "";
  
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    city: "",
    school_type: "regular",
    email: "",
    achievements_text: "",
    essay_text: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Biometrics tracking
  const biometricsRef = useRef({
    total_chars: 0,
    backspaces: 0,
    paste_count: 0,
    key_intervals: [],
    last_key_time: null,
  });

  useEffect(() => {
    // Notify Telegram WebApp that the app is ready
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const handleKeyDown = (e) => {
    const now = Date.now();
    const bio = biometricsRef.current;
    
    if (e.key === "Backspace") {
      bio.backspaces += 1;
    } else if (e.key.length === 1) { // Normal character
      bio.total_chars += 1;
    }

    if (bio.last_key_time) {
      const interval = now - bio.last_key_time;
      if (interval < 5000) { // ignore deep pauses over 5s
        bio.key_intervals.push(interval);
      }
    }
    bio.last_key_time = now;
  };

  const handlePaste = () => {
    biometricsRef.current.paste_count += 1;
  };

  const calculateRhythmVariance = () => {
    const intervals = biometricsRef.current.key_intervals;
    if (intervals.length < 2) return 0;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sqDiffs = intervals.map(val => Math.pow(val - mean, 2));
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(Math.sqrt(variance)); // Return standard deviation in ms
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const biometrics_data = {
      total_chars: biometricsRef.current.total_chars,
      backspaces: biometricsRef.current.backspaces,
      paste_count: biometricsRef.current.paste_count,
      rhythm_variance_ms: calculateRhythmVariance(),
    };

    const payload = {
      ...formData,
      age: parseInt(formData.age, 10),
      tg_chat_id: tg_chat_id,
      biometrics_data: biometrics_data,
      source: "telegram_webapp"
    };

    try {
      const BE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${BE_URL}/apply/web`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true" 
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("API error");
      setSubmitted(true);
      
      // Close WebApp after 2 seconds
      if (window.Telegram && window.Telegram.WebApp) {
        setTimeout(() => window.Telegram.WebApp.close(), 2500);
      }
    } catch (err) {
      alert("Ошибка отправки заявки.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-[#C1F11D] rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(193,241,29,0.2)]">
          <Check strokeWidth={3.5} size={44} className="text-black" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Заявка принята!</h1>
        <p className="text-gray-400">
          Возвращайтесь в Telegram-бот. ИИ формирует для вас проверочный вопрос...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 text-white p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#C1F11D] mb-6">Подача заявки HI PO</h1>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">ФИО</label>
          <input 
            type="text" required
            className="input-base"
            value={formData.full_name}
            onChange={e => setFormData({...formData, full_name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Возраст</label>
            <input 
              type="number" required min="10" max="40"
              className="input-base"
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Город</label>
            <input 
              type="text" required
              className="input-base"
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Email (для уведомления о зачислении)</label>
          <input 
            type="email" required
            placeholder="example@mail.com"
            className="input-base"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Тип школы</label>
          <select 
            className="select-base"
            value={formData.school_type}
            onChange={e => setFormData({...formData, school_type: e.target.value})}
          >
            <option value="elite">Элитная / Специализированная</option>
            <option value="regular">Обычная городская</option>
            <option value="rural">Сельская</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Достижения</label>
          <textarea 
            required rows="3"
            placeholder="Олимпиады, хакатоны, проекты..."
            className="input-base"
            value={formData.achievements_text}
            onChange={e => setFormData({...formData, achievements_text: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex justify-between items-center">
            <span>Эссе</span>
            <span className="text-[#C1F11D] text-[10px]">*Анализируется ИИ</span>
          </label>
          <textarea 
            required rows="6"
            placeholder="Почему HI PO Program? Напишите своими словами."
            className="input-base font-medium"
            value={formData.essay_text}
            onChange={e => setFormData({...formData, essay_text: e.target.value})}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full py-4 bg-[#C1F11D] text-black text-sm font-bold uppercase rounded-xl hover:bg-[#a8d619] transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "ОТПРАВИТЬ"}
        </button>
      </form>
    </div>
  );
}
