import React from "react";
import { 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  Bell, 
  Globe,
  Cpu,
  Mail,
  Lock
} from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";

function SettingItem({ icon: Icon, label, desc, children }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-surface-400/50 last:border-0">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-surface-300 rounded-xl text-gray-400">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">{label}</h3>
          <p className="text-xs text-gray-500 max-w-sm">{desc}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="min-h-screen bg-surface-100 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <SettingsIcon className="text-gray-400" />
            Настройки Системы
          </h1>
          <p className="text-gray-500 mt-2">Конфигурация ядра анализа HI PO Intelligence</p>
        </header>

        <div className="space-y-8 max-w-4xl">
          {/* Main Settings Section */}
          <div className="card p-0">
            <div className="p-6 border-b border-surface-400 bg-surface-100/50">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 text-primary-400">
                <Cpu size={16} />
                Конфигурация AI
              </h2>
            </div>
            <div className="divide-y divide-surface-400/50">
              <SettingItem 
                icon={Shield} 
                label="Порог AI Риска" 
                desc="Уровень вероятности AI, при котором кандидат помечается критическим флагом."
              >
                <div className="bg-surface-300 border border-surface-400 px-4 py-2 rounded-xl text-sm font-bold text-white">60%</div>
              </SettingItem>
              <SettingItem 
                icon={Brain} 
                label="Модель анализа" 
                desc="Использование Llama-3.3-70b для генерации проверочных вопросов."
              >
                <div className="bg-surface-300 border border-surface-400 px-4 py-2 rounded-xl text-sm font-bold text-[#C1F11D]">LLAMA 3.3</div>
              </SettingItem>
            </div>
          </div>

          <div className="card p-0">
            <div className="p-6 border-b border-surface-400 bg-surface-100/50">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 text-violet-400">
                <Globe size={16} />
                Интеграции
              </h2>
            </div>
            <div className="divide-y divide-surface-400/50">
              <SettingItem 
                icon={Bell} 
                label="Telegram Bot" 
                desc="Статус соединения с ботом HI PO Recruitment."
              >
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#C1F11D] animate-pulse" />
                   <span className="text-xs font-bold text-[#C1F11D]">CONNECTED</span>
                </div>
              </SettingItem>
              <SettingItem 
                icon={Mail} 
                label="Автоматические зачисления" 
                desc="Отправка писем в Telegram сразу после нажатия кнопки Accept."
              >
                <div className="relative inline-flex items-center cursor-pointer">
                  <div className="w-11 h-6 bg-[#C1F11D] rounded-full" />
                  <div className="absolute left-6 top-1 w-4 h-4 bg-black rounded-full" />
                </div>
              </SettingItem>
            </div>
          </div>

          <div className="card p-0">
            <div className="p-6 border-b border-surface-400 bg-surface-100/50">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 text-blue-400">
                <Database size={16} />
                Безопасность данных
              </h2>
            </div>
            <div className="divide-y divide-surface-400/50">
              <SettingItem 
                icon={Lock} 
                label="Биометрическое хранилище" 
                desc="Локальное зашифрованное хранилище данных о ритме печати (SQLite)."
              >
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Encrypted</span>
              </SettingItem>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest pb-10">
             HI PO Intelligence System · Version 1.0.4-beta
          </p>
        </div>
      </div>
    </div>
  );
}
