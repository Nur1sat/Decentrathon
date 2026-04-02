import React from "react";

export default function ProgressBar({ steps, current }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= current ? "bg-primary-500" : "bg-surface-400"
              }`}
            />
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">
          Шаг {current + 1} из {steps.length}
        </span>
        <span className="text-xs text-primary-400 font-medium">
          {steps[current]?.label}
        </span>
      </div>
    </div>
  );
}
