import React, { useState, useEffect } from 'react';
import {
  FileText,
  Volume2,
  VolumeX,
  Copy,
  Download,
  Check,
  AlertTriangle,
  Lightbulb,
  Clock,
  BookMarked,
  Quote,
  Sparkles,
  Share2,
  Loader2,
  Play,
  Pause,
  Sliders,
  Radio,
  Sparkle,
} from 'lucide-react';
import { SummaryData } from '../types';

interface SummaryViewProps {
  summary: SummaryData;
  title: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary, title }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'concepts' | 'outline' | 'warnings'>('overview');
  const [copied, setCopied] = useState(false);
  
  // Human TTS State
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Aoede' | 'Fenrir'>('Kore');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1.0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioElement]);

  const handleGenerateAndPlayTTS = async (voiceName = selectedVoice) => {
    setAudioError(null);

    // Toggle pause if playing
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    // Resume if paused
    if (audioElement && audioUrl && !isPlayingAudio) {
      audioElement.play().then(() => setIsPlayingAudio(true)).catch(console.error);
      return;
    }

    setIsLoadingAudio(true);

    const textToRead = `Resumo de ${summary.subject || 'estudos'}: ${summary.title}. ${summary.overview}. Principais conceitos: ${summary.keyConcepts.map(c => `${c.title}: ${c.description}`).join('. ')}`;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToRead,
          voice: voiceName,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }

      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        const audio = new Audio(data.audioUrl);
        audio.playbackRate = audioPlaybackRate;

        audio.onended = () => {
          setIsPlayingAudio(false);
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlayingAudio(false);
          fallbackWebSpeech(textToRead);
        };

        setAudioElement(audio);
        await audio.play();
        setIsPlayingAudio(true);
      } else {
        console.warn('Gemini TTS failed, using enhanced browser speech:', data.error);
        fallbackWebSpeech(textToRead);
      }
    } catch (err: any) {
      console.warn('Network error on /api/tts, using enhanced browser speech:', err);
      fallbackWebSpeech(textToRead);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const fallbackWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setAudioError('Seu navegador não suporta a API de voz.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      v => v.lang.includes('pt') && (
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Luciana') ||
        v.name.includes('Maria') ||
        v.name.includes('Felipe')
      )
    ) || voices.find(v => v.lang.includes('pt'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleStopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleVoiceChange = (newVoice: 'Kore' | 'Puck' | 'Aoede' | 'Fenrir') => {
    setSelectedVoice(newVoice);
    handleStopAudio();
    setAudioUrl(null);
    setAudioElement(null);
  };

  const handleSpeedChange = (speed: number) => {
    setAudioPlaybackRate(speed);
    if (audioElement) {
      audioElement.playbackRate = speed;
    }
  };

  const handleCopyText = () => {
    const formatted = `=== RESUMO SUPER ALUNO ===\n\nTítulo: ${summary.title}\nDisciplina: ${summary.subject}\n\n--- VISÃO GERAL ---\n${summary.overview}\n\n--- CONCEITOS CHAVE ---\n${summary.keyConcepts.map(kc => `• ${kc.title}: ${kc.description}`).join('\n')}\n\n--- ALERTAS DE PROVA ---\n${summary.examWarnings.join('\n')}`;
    
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const markdownText = `# ${summary.title}\n\n**Disciplina:** ${summary.subject}\n\n## 📌 Visão Geral\n${summary.overview}\n\n## 💡 Conceitos-Chave\n${summary.keyConcepts.map(kc => `### ${kc.title}\n- **Importância:** ${kc.importance}\n- **Explicação:** ${kc.description}\n- **Ref:** ${kc.timestampOrRef || 'N/A'}\n`).join('\n')}\n\n## ⚠️ Alertas de Prova & Pegadinhas\n${summary.examWarnings.map(w => `- ${w}`).join('\n')}\n\n---\n*Gerado por Super Aluno IA*`;

    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resumo_${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                {summary.subject || 'Material de Estudo'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Leitura estimada: 4 min
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.title || title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {summary.overview}
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Audio Reader Toggle */}
            <button
              onClick={() => handleGenerateAndPlayTTS()}
              disabled={isLoadingAudio}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-xs ${
                isPlayingAudio
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-100'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Gerando Voz Humana...</span>
                </>
              ) : isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 text-white fill-white" />
                  <span>Pausar Voz</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>Ouvir Resumo (Voz Humana Gemini)</span>
                </>
              )}
            </button>

            {/* Voice Settings Button */}
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="Configurações de Voz e Locutor"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            {/* Download Markdown */}
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Baixar .MD</span>
            </button>
          </div>
        </div>

        {/* Human Neural Voice Control Panel */}
        {(showVoiceSettings || isPlayingAudio || isLoadingAudio) && (
          <div className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Vozes Humanas Neurais (Gemini IA):
                </span>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Velocidade:</span>
                {[1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      audioPlaybackRate === speed
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Kore', label: '♀️ Feminina Calma', desc: 'Suave & didática' },
                { id: 'Puck', label: '⚡ Jovem & Fluido', desc: 'Dinâmico & natural' },
                { id: 'Aoede', label: '🎓 Professora', desc: 'Excelente articulação' },
                { id: 'Fenrir', label: '🎙️ Masculino Firme', desc: 'Voz profunda & clara' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVoiceChange(v.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    selectedVoice === v.id
                      ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600/20'
                      : 'bg-white/60 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{v.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{v.desc}</div>
                </button>
              ))}
            </div>

            {isPlayingAudio && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-indigo-600 rounded-full animate-bounce"></span>
                    <span className="w-1 h-4 bg-indigo-600 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></span>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">Reproduzindo voz humana natural ({selectedVoice})</span>
                </div>
                <button
                  onClick={handleStopAudio}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Parar Reprodução
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Visão Geral & Destaques</span>
        </button>

        <button
          onClick={() => setActiveSubTab('concepts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'concepts'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Conceitos-Chave ({summary.keyConcepts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('outline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'outline'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tópicos & Detalhamento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('warnings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'warnings'
              ? 'bg-amber-500 text-slate-900 font-bold shadow-sm'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Alertas de Prova ({summary.examWarnings.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: Overview & Highlights */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Detailed Overview Box */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600" />
                Síntese Didática
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {summary.overview}
              </p>
            </div>

            {/* Key Quotes */}
            {summary.keyQuotes && summary.keyQuotes.length > 0 && (
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-md border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-amber-400" />
                  Citações e Regras de Ouro
                </h4>
                <div className="space-y-2">
                  {summary.keyQuotes.map((quote, idx) => (
                    <blockquote
                      key={idx}
                      className="pl-4 border-l-2 border-amber-500 italic text-xs sm:text-sm text-slate-300 bg-slate-800/50 p-3 rounded-r-xl"
                    >
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Study Tips & Exam Warnings */}
          <div className="space-y-6">
            {/* Exam Warnings Box */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                O que Costuma Cair / Pegadinhas
              </h4>
              <ul className="space-y-2.5">
                {summary.examWarnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-amber-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Study Tips Box */}
            {summary.studyTips && summary.studyTips.length > 0 && (
              <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  Dicas de Memorização
                </h4>
                <ul className="space-y-2">
                  {summary.studyTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-indigo-900">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Key Concepts */}
      {activeSubTab === 'concepts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.keyConcepts.map((concept) => (
            <div
              key={concept.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-indigo-300 transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{concept.title}</h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md shrink-0 ${
                      concept.importance === 'alta'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : concept.importance === 'media'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {concept.importance === 'alta' ? 'Alta Relevância' : 'Relevância Média'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {concept.description}
                </p>
              </div>

              {concept.timestampOrRef && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>Referência: {concept.timestampOrRef}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: Detailed Outline */}
      {activeSubTab === 'outline' && (
        <div className="space-y-4">
          {summary.outline.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">{section.title}</h4>
                {section.timestampOrRef && (
                  <span className="text-xs text-indigo-600 font-medium px-2.5 py-1 rounded-lg bg-indigo-50">
                    {section.timestampOrRef}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {section.keyPoints.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: Exam Warnings */}
      {activeSubTab === 'warnings' && (
        <div className="space-y-4">
          <div className="bg-amber-500 text-slate-900 p-6 rounded-2xl shadow-sm space-y-2">
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Guia Antipegadinhas de Prova
            </h3>
            <p className="text-xs sm:text-sm text-slate-900/90">
              Abaixo estão listadas as maiores armadilhas de enunciados, confusões clássicas de termos e tópicos onde candidatos costumam perder pontos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {summary.examWarnings.map((warning, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border-l-4 border-l-amber-500 border border-slate-200 shadow-sm flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Ponto de Atenção #{idx + 1}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{warning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
