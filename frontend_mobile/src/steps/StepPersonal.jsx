import React, { useState } from "react";
import { User, MapPin, ArrowRight } from "lucide-react";

export default function StepPersonal({ form, update, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.full_name.trim().length < 3) e.full_name = "Введите полное ФИО";
    if (form.city.trim().length < 2) e.city = "Введите название города";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };

  const field = (key) => ({
    value: form[key],
    onChange: (ev) => { update({ [key]: ev.target.value }); setErrors((p) => ({ ...p, [key]: undefined })); },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Личные данные</h2>
        <p className="text-sm text-gray-500">
          Ваши данные надёжно защищены. Перед анализом ИИ имя автоматически обезличивается.
        </p>
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          <User size={13} className="inline mr-1.5 text-primary-400" />
          Полное имя (ФИО)
        </label>
        <input
          className={`input-field ${errors.full_name ? "border-red-500" : ""}`}
          placeholder="Иванов Иван Иванович"
          autoComplete="name"
          {...field("full_name")}
        />
        {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name}</p>}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          <MapPin size={13} className="inline mr-1.5 text-primary-400" />
          Город / населённый пункт
        </label>
        <input
          className={`input-field ${errors.city ? "border-red-500" : ""}`}
          placeholder="Алматы"
          autoComplete="address-level2"
          {...field("city")}
        />
        {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
      </div>

      <button className="btn-primary mt-2" onClick={handleNext}>
        Продолжить <ArrowRight size={16} />
      </button>

      <p className="text-xs text-center text-gray-600">
        🔒 Данные передаются по защищённому соединению
      </p>
    </div>
  );
}
