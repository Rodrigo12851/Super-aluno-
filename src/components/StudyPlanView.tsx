import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  Trophy,
  Check,
} from 'lucide-react';
import { StudyPlanDay } from '../types';

interface StudyPlanViewProps {
  studyPlan: StudyPlanDay[];
  title: string;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({ studyPlan, title }) => {
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

  const toggleTask = (dayNum: number, taskIdx: number) => {
    const key = `${dayNum}-${taskIdx}`;
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate total tasks & progress
  let totalTasks = 0;
  let doneTasks = 0;

  studyPlan.forEach((day) => {
    day.tasks.forEach((_, tIdx) => {
      totalTasks++;
      if (completedTasks[`${day.day}-${tIdx}`]) {
        doneTasks++;
      }
    });
  });

  const completionPercent = Math.round((doneTasks / (totalTasks || 1)) * 100);

  if (!studyPlan || studyPlan.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <CalendarCheck className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Nenhum plano de estudos gerado</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Cronograma Inteligente de Revisão
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Plano de Estudos em Espiral: {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribuído para otimizar a retenção de longo prazo e evitar a curva de esquecimento.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-2xl font-black text-indigo-600">{completionPercent}%</span>
            <p className="text-xs text-slate-500 font-medium">Meta Concluída</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-amber-500 h-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Completion Trophy Message */}
      {completionPercent === 100 && (
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 rounded-2xl shadow-lg flex items-center gap-4 animate-bounce">
          <Trophy className="w-10 h-10 shrink-0" />
          <div>
            <h3 className="text-lg font-black">Incrível! Você concluiu 100% do Plano de Estudos!</h3>
            <p className="text-xs font-semibold text-slate-900/80">
              Sua retenção de memória para este tema foi maximizada. Parabéns pela dedicação!
            </p>
          </div>
        </div>
      )}

      {/* Timeline Days */}
      <div className="space-y-4">
        {studyPlan.map((planDay) => {
          const dayTasksDone = planDay.tasks.filter(
            (_, idx) => completedTasks[`${planDay.day}-${idx}`]
          ).length;
          const isDayComplete = dayTasksDone === planDay.tasks.length && planDay.tasks.length > 0;

          return (
            <div
              key={planDay.day}
              className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                isDayComplete
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
                      isDayComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    Dia {planDay.day}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{planDay.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {planDay.estimatedMinutes} minutos previstos
                      </span>
                      <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                        <Target className="w-3.5 h-3.5" />
                        {planDay.focusArea}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                    isDayComplete
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {dayTasksDone}/{planDay.tasks.length} Tarefas
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {planDay.tasks.map((taskText, tIdx) => {
                  const key = `${planDay.day}-${tIdx}`;
                  const isChecked = !!completedTasks[key];

                  return (
                    <label
                      key={tIdx}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-500 line-through'
                          : 'bg-slate-50/50 hover:bg-indigo-50/30 border-slate-200 text-slate-800 font-medium'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTask(planDay.day, tIdx)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm leading-relaxed">{taskText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
