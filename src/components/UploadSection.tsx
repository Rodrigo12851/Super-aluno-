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
  Video,
  Search,
  HelpCircle,
  ExternalLink,
  Youtube
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
  const [activeTab, setActiveTab] = useState<'youtube' | 'text' | 'file'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<StudyTarget>('geral');
  const [difficulty, setDifficulty] = useState<StudyDifficulty>('medio');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showYtGuide, setShowYtGuide] = useState(false);

  // YouTube Info State
  const [fetchingYtInfo, setFetchingYtInfo] = useState(false);
  const [ytInfo, setYtInfo] = useState<{
    videoTitle?: string;
    hasCaption?: boolean;
    transcriptText?: string;
  } | null>(null);

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    'Carregando transcrição e dados da aula...',
    'Iniciando processamento com IA Gemini (Contexto Estendido)...',
    'Sintetizando resumo conceitual, alertas de prova e conceitos-chave...',
    'Criando baralho de flashcards interativos para fixação...',
    'Construindo simulado de questões e plano de estudos personalizado...',
  ];

  const handleFetchYtInfo = async (urlToFetch: string) => {
    if (!urlToFetch || urlToFetch.trim().length < 5) return;
    try {
      setFetchingYtInfo(true);
      setErrorMessage(null);
      const res = await fetch('/api/youtube-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });
      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }
      if (res.ok && data.info) {
        setYtInfo({
          videoTitle: data.info.videoTitle,
          hasCaption: data.info.hasCaption,
          transcriptText: data.info.transcriptText,
        });
        if (data.info.videoTitle && !title) {
          setTitle(data.info.videoTitle);
        }
      } else {
        setYtInfo(null);
      }
    } catch (e) {
      console.error('Error fetching YT info:', e);
    } finally {
      setFetchingYtInfo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
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

    if (activeTab === 'youtube' && !youtubeUrl.trim()) {
      setErrorMessage('Por favor, insira o link de uma videoaula do YouTube.');
      return;
    }

    if (activeTab === 'file' && !selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo de aula (áudio, vídeo, PDF ou imagem).');
      return;
    }

    if (activeTab === 'text' && !rawText.trim()) {
      setErrorMessage('Por favor, cole a transcrição da aula, anotações do curso ou texto dos seus estudos.');
      return;
    }

    setIsLoading(true);
    setProgressStage(0);

    const stageInterval = setInterval(() => {
      setProgressStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      let fileBase64: string | undefined = undefined;
      let mimeType: string | undefined = undefined;
      let fileType: FileType = 'text';

      if (activeTab === 'youtube') {
        fileType = 'youtube';
      } else if (activeTab === 'file' && selectedFile) {
        fileType = inferFileType(selectedFile);
        mimeType = selectedFile.type;

        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Clean = result.split(',')[1] || result;
            resolve(base64Clean);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });
      }

      const payload: ProcessStudyRequest = {
        title: title.trim() || ytInfo?.videoTitle || selectedFile?.name || 'Aula de Estudos',
        fileType,
        fileName: selectedFile?.name,
        fileBase64,
        mimeType,
        youtubeUrl: activeTab === 'youtube' ? youtubeUrl : undefined,
        rawText: activeTab === 'text' ? rawText : (activeTab === 'youtube' && ytInfo?.transcriptText ? ytInfo.transcriptText : undefined),
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

      const responseText = await res.text();
      clearInterval(stageInterval);

      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        if (!res.ok) {
          throw new Error('Servidor indisponível no momento. Por favor, aguarde alguns instantes e tente novamente.');
        } else {
          throw new Error('A resposta do servidor veio em formato inesperado. Tente novamente.');
        }
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar material de estudos.');
      }

      onSessionCreated(data.session);
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsLoading(false);
      setErrorMessage(err.message || 'Erro inesperado ao processar aula. Tente novamente.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Sleek Dashboard Metrics Grid */}
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
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aulas & Materiais Salvos</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">84</p>
            <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              YouTube, Transcrições & PDFs
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
          <span>Suporte a Aulas do YouTube, Cursos & Transcrições Completas</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Envie sua aula ou transcrição de estudos
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-xs sm:text-sm">
          Cole links do YouTube, transcrições do seu curso ou envie arquivos de vídeo, áudio e PDF.
          O Gemini IA transforma sua aula em resumos, flashcards e simulados.
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
          <span className="text-[11px] text-slate-500">Escolha uma aula pré-processada:</span>
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
                  <span>Carregar Aula de Exemplo</span>
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
              setActiveTab('youtube');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Youtube className="w-4 h-4 text-white" />
            <span>Link do YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Transcrição de Aula / Anotações</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('file');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'file'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Arquivo (Vídeo, Áudio, PDF)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* TAB 1: YOUTUBE LINK */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-600 fill-red-600" />
                  <span>Link da Videoaula no YouTube:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      handleFetchYtInfo(e.target.value);
                    }}
                    placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ ou https://youtu.be/..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm text-slate-800 outline-none bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchYtInfo(youtubeUrl)}
                    disabled={fetchingYtInfo || !youtubeUrl}
                    className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {fetchingYtInfo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Buscar Dados</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Insira o link de qualquer vídeo ou aula do YouTube para que nossa IA extraia a transcrição e crie seu kit de estudos.
                </p>
              </div>

              {/* YouTube Status Badge */}
              {ytInfo && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {ytInfo.videoTitle}
                    </span>
                    {ytInfo.hasCaption ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Transcrição Pronta
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        Sem legendas públicas
                      </span>
                    )}
                  </div>
                  {!ytInfo.hasCaption && (
                    <div className="text-[11px] text-slate-600 pt-1 space-y-1">
                      <p className="text-amber-800 font-medium">
                        💡 O autor desativou as legendas públicas neste vídeo. O Super Aluno gerará o kit de estudos completo com base no tema e conteúdo da aula (<strong>{ytInfo.videoTitle}</strong>).
                      </p>
                      <p className="text-slate-500">
                        Se preferir colar a transcrição exata,{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('text');
                            setShowYtGuide(true);
                          }}
                          className="text-indigo-600 font-bold underline"
                        >
                          clique aqui para ver o passo a passo
                        </button>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEXT & TRANSCRIPTION */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cole a transcrição da aula, anotações do curso ou texto de estudos:
                </label>

                <button
                  type="button"
                  onClick={() => setShowYtGuide(!showYtGuide)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Como pegar a transcrição no YouTube?</span>
                </button>
              </div>

              {/* Step by Step YouTube Transcript Guide */}
              {showYtGuide && (
                <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2 text-xs animate-fadeIn">
                  <h4 className="font-bold flex items-center gap-2 text-indigo-900">
                    <Youtube className="w-4 h-4 text-red-600 fill-red-600" />
                    Como copiar a transcrição do YouTube em 3 passos simples:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
                    <li>Abra o vídeo da aula no site do YouTube (no computador ou celular).</li>
                    <li>Clique no botão <strong>"... Mais"</strong> ou nos <strong>três pontinhos (...)</strong> logo abaixo do título do vídeo.</li>
                    <li>Clique na opção <strong>"Mostrar transcrição"</strong> (Show transcript).</li>
                    <li>Selecione e copie todo o texto da lista e cole no campo de texto abaixo!</li>
                  </ol>
                </div>
              )}

              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Cole aqui a transcrição da aula (com ou sem marcações de tempo 00:00), anotações do seu curso online (Hotmart, Kiwify, Coursera) ou anotações digitadas..."
                className="w-full p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 resize-y font-mono leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: FILE UPLOAD */}
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
                      Suporta Vídeos (MP4/WebM), Áudios de gravações (MP3/M4A), Apostilas em PDF, Fotos de Caderno/Lousa
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <FileVideo className="w-3.5 h-3.5 text-blue-500" /> Vídeo da Aula (MP4)
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <FileAudio className="w-3.5 h-3.5 text-purple-500" /> Áudio Gravado (MP3)
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <FileText className="w-3.5 h-3.5 text-red-500" /> Livro / PDF
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Fotos da Lousa
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Material Options (Title, Target, Difficulty) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Nome da Matéria / Título da Aula
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Direito Constitucional - Artigo 5º"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Foco dos Estudos
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as StudyTarget)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm text-slate-800 bg-white"
              >
                <option value="geral">Geral / Compreensão Ampla</option>
                <option value="concurso">Concursos Públicos (Foco na letra da lei)</option>
                <option value="vestibular">Vestibular & ENEM (Foco em pegadinhas)</option>
                <option value="faculdade">Faculdade / Prova Teórica</option>
                <option value="revisao">Revisão Rápida de Véspera</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <BarChart className="w-3.5 h-3.5 text-indigo-600" />
                Nível do Material
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
              placeholder="Ex: 'Focar nos artigos mais cobrados', 'Criar mnemônicos', 'Explicar de forma bem didática'"
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
                <span>Processando Aula com Gemini IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Gerar Kit Completo de Estudos da Aula</span>
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
                <h3 className="text-lg font-bold text-white">Processando Aula do Aluno</h3>
                <p className="text-xs text-slate-400 mt-1">
                  A IA Gemini está analisando o conteúdo e criando resumo, flashcards e simulado...
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
