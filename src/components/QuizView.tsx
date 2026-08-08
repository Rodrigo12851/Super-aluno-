import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Check,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizViewProps {
  quiz: QuizQuestion[];
  title: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ quiz, title }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return; // Locked once answered
    setSelectedOption(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: selectedOption,
    }));
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      const prevAnswer = userAnswers[currentQuestionIndex + 1];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
      setIsSubmitted(prevAnswer !== undefined);
    } else {
      setShowResults(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setUserAnswers({});
    setIsSubmitted(false);
    setShowResults(false);
  };

  // Score Calculation
  const totalQuestions = quiz.length;
  let correctCount = 0;
  quiz.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctAnswerIndex) {
      correctCount++;
    }
  });

  const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Nenhum simulado disponível para este material</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Quiz Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-200">
              Simulado de Fixação
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {title}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Questionário de Teste IA
          </h2>
        </div>

        {/* Question Counter */}
        {!showResults && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Questão {currentQuestionIndex + 1} de {totalQuestions}
            </span>
          </div>
        )}
      </div>

      {/* RESULTS SCREEN */}
      {showResults ? (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center space-y-6 animate-fadeIn">
          {/* Trophy Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-900 flex items-center justify-center mx-auto shadow-xl">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900">
              Simulado Concluído!
            </h3>
            <p className="text-sm text-slate-600">
              Você acertou <strong className="text-indigo-600">{correctCount}</strong> de{' '}
              <strong>{totalQuestions}</strong> questões ({percentage}% de rendimento).
            </p>
          </div>

          {/* Performance Badge */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs sm:text-sm font-semibold space-y-1">
            <p className="text-indigo-700 font-bold uppercase tracking-wider text-[11px]">
              {percentage >= 80
                ? 'Nível de Aprovação 🚀'
                : percentage >= 50
                ? 'Bom Rendimento - Revisar Erros 📖'
                : 'Necessita Revisão Ativa ⚠️'}
            </p>
            <p className="text-slate-700 font-normal">
              {percentage >= 80
                ? 'Parabéns! Seu domínio conceitual sobre esta matéria está muito alto. Mantenha os flashcards em dia para fixação!'
                : percentage >= 50
                ? 'Você compreendeu a estrutura principal. Recomendamos repassar as questões erradas abaixo e os alertas de prova no resumo.'
                : 'Sugerimos ler novamente o resumo estruturado e praticar o baralho de flashcards antes de refazer o teste.'}
            </p>
          </div>

          {/* Question Breakdown List */}
          <div className="text-left space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Gabarito Detalhado & Explicações
            </h4>

            <div className="space-y-3">
              {quiz.map((q, idx) => {
                const userAns = userAnswers[idx];
                const isCorrect = userAns === q.correctAnswerIndex;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        Questão {idx + 1}: {q.question}
                      </span>
                      {isCorrect ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                          Correto ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px] shrink-0">
                          Incorreto ✗
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600">
                      <strong>Sua resposta:</strong>{' '}
                      {userAns !== undefined ? q.options[userAns] : 'Não respondida'}
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-700 font-medium">
                        <strong>Gabarito correto:</strong> {q.options[q.correctAnswerIndex]}
                      </p>
                    )}
                    <p className="text-slate-700 italic bg-white/80 p-2.5 rounded-lg border border-slate-200">
                      <strong>Explicação IA:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Restart Action */}
          <button
            onClick={handleRestartQuiz}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refazer Simulado</span>
          </button>
        </div>
      ) : (
        /* ACTIVE QUESTION CARD */
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/80 space-y-6">
          {/* Question Topic & Text */}
          <div className="space-y-3">
            {currentQuestion?.topic && (
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] uppercase tracking-wider">
                {currentQuestion.topic}
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion?.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options.map((optionText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQuestion.correctAnswerIndex;

              let optionStyle = 'border-slate-200 hover:border-indigo-300 bg-white text-slate-800';

              if (isSubmitted) {
                if (isCorrectAnswer) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = 'border-red-500 bg-red-50 text-red-900';
                } else {
                  optionStyle = 'border-slate-200 opacity-60 text-slate-500 bg-slate-50';
                }
              } else if (isSelected) {
                optionStyle = 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-2 ring-indigo-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isSubmitted}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${optionStyle}`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                      isSubmitted && isCorrectAnswer
                        ? 'bg-emerald-600 text-white'
                        : isSubmitted && isSelected && !isCorrectAnswer
                        ? 'bg-red-600 text-white'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{optionText}</span>

                  {isSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner (when answered) */}
          {isSubmitted && (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Explicação & Justificativa do Gabarito:
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Question Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              {isSubmitted ? 'Análise concluída' : 'Selecione uma opção e confirme'}
            </span>

            {!isSubmitted ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={selectedOption === null}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <span>Responder</span>
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <span>
                  {currentQuestionIndex < quiz.length - 1 ? 'Próxima Questão' : 'Ver Resultado Final'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
