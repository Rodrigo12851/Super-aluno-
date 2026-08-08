import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  HelpCircle,
  Lightbulb,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { ChatMessage, StudySession } from '../types';

interface TutorChatViewProps {
  session: StudySession;
  onUpdateSessionChat?: (messages: ChatMessage[]) => void;
}

export const TutorChatView: React.FC<TutorChatViewProps> = ({
  session,
  onUpdateSessionChat,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    session.chatHistory || [
      {
        id: 'c-welcome',
        sender: 'ai',
        text: `Olá! Sou seu Tutor IA de estudos. Estou pronto para tirar qualquer dúvida sobre **"${session.title}"**. O que gostaria de perguntar ou revisar agora?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]
  );
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPills = [
    '💡 Explique esse conceito de forma bem simples com uma analogia',
    '🧠 Crie uma mnemônica para ajudar a memorizar esses conceitos',
    '🎯 Me faça uma pergunta surpresa sobre o tema para testar meu conhecimento',
    '⚡ Resuma os 3 pontos onde a maioria dos estudantes erram em provas',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const contextPrompt = `TÍTULO: ${session.title}\nMATÉRIA: ${session.summary?.subject}\nVISÃO GERAL: ${session.summary?.overview}\nCONCEITOS CHAVE: ${session.summary?.keyConcepts?.map(k => k.title + ': ' + k.description).join('; ')}`;

      const res = await fetch('/api/chat-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextPrompt,
          conversationHistory: newMessages.slice(-6), // last 6 turns
          userMessage: text,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        if (!res.ok) {
          throw new Error('Servidor indisponível no momento. Tente novamente em instantes.');
        } else {
          throw new Error('A resposta do tutor veio em formato inválido. Tente novamente.');
        }
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter resposta do tutor.');
      }

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      if (onUpdateSessionChat) {
        onUpdateSessionChat(finalMessages);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: `Desculpe, ocorreu um erro ao se comunicar com a IA: ${err.message}. Tente novamente.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Tutor IA de Estudos
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500">
              Conectado ao contexto da aula: <span className="font-semibold">{session.title}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 min-h-[420px] max-h-[550px] flex flex-col justify-between space-y-4">
        {/* Messages List */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-1 relative group ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-70 mb-1">
                    <span className="font-bold">{isUser ? 'Você' : 'Tutor IA Super Aluno'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-slate-700 text-slate-300 hover:text-white"
                      title="Copiar resposta"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl rounded-tl-none text-slate-300 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Analisando o material e formulando resposta didática...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Sugestões de Perguntas Rápidas:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium whitespace-nowrap transition-all shrink-0 text-left"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua dúvida sobre este tema..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <span>Enviar</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
