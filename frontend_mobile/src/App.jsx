import React, { useState } from "react";
import ProgressBar from "./components/ProgressBar.jsx";
import StepPersonal from "./steps/StepPersonal.jsx";
import StepSchool from "./steps/StepSchool.jsx";
import StepEssay from "./steps/StepEssay.jsx";
import StepReview from "./steps/StepReview.jsx";
import StepSuccess from "./steps/StepSuccess.jsx";
import { Eye } from "lucide-react";

const STEPS = [
  { label: "Данные" },
  { label: "Школа" },
  { label: "Эссе" },
  { label: "Отправка" },
];

const INITIAL_FORM = {
  full_name: "",
  city: "",
  school_type: "",
  essay_text: "",
};

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [applicationRef, setApplicationRef] = useState(null);

  const update = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSuccess = (ref) => {
    setApplicationRef(ref);
    setStep(4); // success screen
  };

  if (step === 4) {
    return <StepSuccess ref_={applicationRef} onRestart={() => { setForm(INITIAL_FORM); setStep(0); setApplicationRef(null); }} />;
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center flex-shrink-0">
          <Eye size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">HI PO</h1>
          <p className="text-xs text-gray-500">HI PO Program · Подача заявки</p>
        </div>
      </header>

      {/* Progress */}
      <div className="px-5 mb-6">
        <ProgressBar steps={STEPS} current={step} />
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 pb-8">
        {step === 0 && <StepPersonal form={form} update={update} onNext={next} />}
        {step === 1 && <StepSchool form={form} update={update} onNext={next} onBack={back} />}
        {step === 2 && <StepEssay form={form} update={update} onNext={next} onBack={back} />}
        {step === 3 && <StepReview form={form} onBack={back} onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}
