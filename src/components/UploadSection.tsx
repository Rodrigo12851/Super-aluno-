import React, { useState, useRef } from 'react';
import {
  Upload,
  FileVideo,
  FileAudio,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Target,
  BarChart,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Type,
  Paperclip,
  Check,
} from 'lucide-react';
import { FileType, StudyTarget, StudyDifficulty, StudySession, ProcessStudyRequest } from '../types';
import { SAMPLE_STUDY_SESSIONS } from '../data/sampleSessions';

interface UploadSectionProps {
  onSessionCreated: (session: StudySession) => void;
  onSelectSample: (sample: StudySession) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onSessionCreated,
  onSelectSample,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<StudyTarget>('geral');
  const [difficulty, setDifficulty] = useState<StudyDifficulty>('medio');
  const [customInstructions, setCustomInstructions] = useState('');

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    'Enviando arquivo e extraindo conteúdo multimodal...',
    'Iniciando processamento em janela de contexto estendida (Gemini IA)...',
    'Sintetizando visão geral, pontos-chave e alertas de prova...',
    'Gerando baralho de flashcards interativos com repetição espaçada...',
    'Construindo simulado de fixação e plano de revisão diário...',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Strip extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  const inferFileType = (file: File): FileType => {
    const type = file.type;
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf')) return 'pdf';
    if (type.startsWith('image/')) return 'image';
    return 'text';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === 'file' && !selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo de áudio, vídeo, PDF ou imagem.');
      return;
    }

    if (activeTab === 'text' && !rawText.trim()) {
      setErrorMessage('Por favor, cole ou digite as anotações ou transcrição da aula.');
      return;
    }

    setIsLoading(true);
    setProgressStage(0);

    // Simulate progress stage increments
    const stageInterval = setInterval(() => {
      setProgressStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      let fileBase64: string | undefined = undefined;
      let mimeType: string | undefined = undefined;
      let fileType: FileType = 'text';

      if (activeTab === 'file' && selectedFile) {
        fileType = inferFileType(selectedFile);
        mimeType = selectedFile.type;

        // Convert file to base64
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URI scheme prefix (e.g., "data:video/mp4;base64,")
            const base64Clean = result.split(',')[1] || result;
            resolve(base64Clean);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });
      }

      const payload: ProcessStudyRequest = {
        title: title.trim() || selectedFile?.name || 'Anotações de Estudo',
        fileType,
        fileName: selectedFile?.name,
        fileBase64,
        mimeType,
        rawText: activeTab === 'text' ? rawText : undefined,
        target,
        difficulty,
        customInstructions,
      };

      const res = await fetch('/api/process-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      clearInterval(stageInterval);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar material de estudos.');
      }

      onSessionCreated(data.session);
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsLoading(false);
      setErrorMessage(err.message || 'Erro inesperado. Verifique sua conexão e chave de API Gemini.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Sleek Dashboard Metrics Grid (from Sleek Interface theme) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Horas Economizadas</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">142h</p>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              +12h esta semana
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Materiais Processados</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">84</p>
            <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              PDFs, Vídeos & Áudios
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Média nos Simulados</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">8.4</p>
            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Top 5% dos Alunos
            </span>
          </div>
        </div>
      </section>

      {/* Hero Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
          <span>Multimodal Upload & Processamento Inteligente Gemini</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Envie seus materiais de estudo
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-xs sm:text-sm">
          Arraste vídeos de aulas, áudios de palestras, PDFs pesados ou fotos da lousa.
          O Gemini IA analisa tudo em segundos.
        </p>
      </div>

      {/* Preset Sample Selector for Instant Demo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-800">
              Demonstração Pronta para Testar
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Escolha uma matéria pré-processada:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_STUDY_SESSIONS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
            >
              <div className="p-2 rounded-xl bg-indigo-100/80 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                {sample.fileType === 'pdf' ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <FileAudio className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {sample.title}
                  </h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                    {sample.summary.subject}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                  {sample.summary.overview}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-600 font-bold">
                  <span>Carregar Sessão</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Input Method Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('file');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'file'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Upload de Arquivo (Vídeo, Áudio, PDF, Foto)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Digitar ou Colar Anotações / Transcrição</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* File Tab */}
          {activeTab === 'file' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-indigo-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="video/*,audio/*,application/pdf,image/*,.txt,.md"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Clique ou arraste outro arquivo para substituir
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">
                      Arraste e solte o arquivo da aula aqui
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Suporta Vídeos (MP4/WebM), Áudios (MP3/M4A/WAV), Livros/Aulas em PDF, Imagens de Caderno/Lousa
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <FileVideo className="w-3.5 h-3.5 text-blue-500" /> MP4 / Vídeo
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <FileAudio className="w-3.5 h-3.5 text-purple-500" /> MP3 / Áudio
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <FileText className="w-3.5 h-3.5 text-red-500" /> PDF / Apostila
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Fotos de Lousa
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Cole a transcrição da gravação ou suas anotações brutas:
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Ex: 'Nesta aula de Direito Constitucional abordamos o artigo 5º da CF/88, com foco nos remédios constitucionais...'"
                className="w-full p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800 placeholder-slate-400 resize-y font-mono"
              />
            </div>
          )}

          {/* Material Options (Title, Target, Difficulty) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Título da Matéria / Aula
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Biologia - Respiração Celular"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Foco do Estudo
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as StudyTarget)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800 bg-white"
              >
                <option value="geral">Geral / Compreensão Ampla</option>
                <option value="vestibular">Vestibular & ENEM (Foco em pegadinhas)</option>
                <option value="concurso">Concursos Públicos (Foco na letra da lei)</option>
                <option value="faculdade">Faculdade / Prova Teórica</option>
                <option value="revisao">Revisão Rápida de Véspera</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <BarChart className="w-3.5 h-3.5 text-indigo-600" />
                Nível de Profundidade
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as StudyDifficulty)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800 bg-white"
              >
                <option value="iniciante">Iniciante (Explicar do zero)</option>
                <option value="medio">Médio (Equilibrado e Prático)</option>
                <option value="avancado">Avançado (Aprofundado e Detalhado)</option>
              </select>
            </div>
          </div>

          {/* Custom Prompt Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Instruções Especiais para a IA (Opcional):
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ex: 'Dar ênfase nas fórmulas matemáticas', 'Focar em jurisdição STF', 'Criar mnemonicos'"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-xs text-slate-800"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando com Gemini IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Processar Material & Gerar Conteúdos IA</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Processing Progress Overlay */}
        {isLoading && (
          <div className="p-8 bg-slate-900 text-white border-t border-slate-800">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-amber-400 shadow-xl">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Processando com Contexto Massivo</h3>
                <p className="text-xs text-slate-400 mt-1">
                  A IA Gemini está sintetizando hours de conteúdo multimodal...
                </p>
              </div>

              {/* Progress Stage Tracker */}
              <div className="space-y-2 text-left bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                {stages.map((stg, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs">
                    {idx < progressStage ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : idx === progressStage ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span
                      className={
                        idx === progressStage
                          ? 'text-amber-300 font-semibold'
                          : idx < progressStage
                          ? 'text-slate-400 line-through'
                          : 'text-slate-500'
                      }
                    >
                      {stg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
