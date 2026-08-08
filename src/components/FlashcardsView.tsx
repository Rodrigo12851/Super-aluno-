import React, { useState } from 'react';
import {
  CreditCard,
  RotateCw,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onUpdateFlashcards?: (updated: Flashcard[]) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcards: initialCards,
  onUpdateFlashcards,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter cards by category
  const categories = Array.from(new Set(cards.map((c) => c.category || 'Geral')));
  const filteredCards =
    selectedCategory === 'all'
      ? cards
      : cards.filter((c) => (c.category || 'Geral') === selectedCategory);

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
  };

  const handleRating = (status: 'mastered' | 'learning' | 'review') => {
    if (!currentCard) return;

    const updated = cards.map((c) =>
      c.id === currentCard.id ? { ...c, status } : c
    );
    setCards(updated);
    if (onUpdateFlashcards) {
      onUpdateFlashcards(updated);
    }

    // Auto advance after rating
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  // Stats calculation
  const masteredCount = cards.filter((c) => c.status === 'mastered').length;
  const learningCount = cards.filter((c) => c.status === 'learning').length;
  const reviewCount = cards.filter((c) => c.status === 'review').length;
  const masteryPercentage = Math.round((masteredCount / (cards.length || 1)) * 100);

  if (!filteredCards.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Nenhum flashcard disponível nesta categoria</h3>
        <button
          onClick={() => setSelectedCategory('all')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Ver Todos os Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Mastery Progress Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Baralho de Flashcards ({cards.length})
            </h2>
            <p className="text-xs text-slate-500">
              Pratique a recuperação ativa de memória. Clique no card para virar.
            </p>
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Dominei: {masteredCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              Aprendendo: {learningCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Revisar: {reviewCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Progresso de Domínio</span>
            <span className="text-indigo-600">{masteryPercentage}% Dominado</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(masteredCount / cards.length) * 100}%` }}
            />
            <div
              className="bg-blue-400 h-full transition-all duration-300"
              style={{ width: `${(learningCount / cards.length) * 100}%` }}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(reviewCount / cards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter & Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({cards.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-500 shrink-0">
          Card {currentIndex + 1} de {filteredCards.length}
        </span>
      </div>

      {/* 3D Flashcard Flip Container */}
      <div className="perspective-1000 min-h-[320px] sm:min-h-[360px] flex flex-col">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full flex-1 rounded-2xl p-8 sm:p-10 cursor-pointer shadow-lg border transition-all duration-500 transform-gpu flex flex-col justify-between relative select-none ${
            isFlipped
              ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-700'
              : 'bg-white hover:border-indigo-300 border-slate-200 text-slate-900'
          }`}
        >
          {/* Card Header Badge */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                isFlipped
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              {currentCard?.category || 'Conceito Principal'}
            </span>

            <div className="flex items-center gap-2">
              {currentCard?.hint && !isFlipped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showHint ? 'Ocultar Dica' : 'Ver Dica'}</span>
                </button>
              )}

              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Verso (Resposta)' : 'Frente (Pergunta)'}</span>
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="my-auto py-6 text-center space-y-4">
            {!isFlipped ? (
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
                {currentCard?.front}
              </h3>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Resposta Explicativa
                </h4>
                <p className="text-base sm:text-xl font-medium text-slate-100 leading-relaxed">
                  {currentCard?.back}
                </p>
              </div>
            )}

            {/* Hint Display */}
            {showHint && !isFlipped && currentCard?.hint && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-w-md mx-auto animate-fadeIn">
                <strong>Dica:</strong> {currentCard.hint}
              </div>
            )}
          </div>

          {/* Card Footer prompt */}
          <div className="text-center">
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                isFlipped
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              Clique no card para {isFlipped ? 'ver a pergunta' : 'revelar a resposta'} 🔄
            </span>
          </div>
        </div>
      </div>

      {/* Navigation & Self-Assessment Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Previous Card */}
        <button
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors w-full sm:w-auto justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        {/* Self Assessment Rating Buttons */}
        <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleRating('review')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              currentCard?.status === 'review'
                ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Difícil (Revisar)</span>
          </button>

          <button
            onClick={() => handleRating('learning')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              currentCard?.status === 'learning'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Médio</span>
          </button>

          <button
            onClick={() => handleRating('mastered')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              currentCard?.status === 'mastered'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Fácil (Dominei)</span>
          </button>
        </div>

        {/* Next Card */}
        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all w-full sm:w-auto justify-center"
        >
          <span>Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
