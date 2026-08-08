import React from 'react';
import {
  FolderOpen,
  X,
  FileText,
  FileAudio,
  Trash2,
  Calendar,
  Sparkles,
  BookOpen,
  Database,
  User as UserIcon,
  PlayCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StudySession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudySession[];
  activeSessionId?: string;
  onSelectSession: (session: StudySession) => void;
  onDeleteSession: (sessionId: string) => void;
  user?: User | null;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-slate-900 text-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-800 animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Histórico de Estudos</h3>
                <p className="text-xs text-slate-400">{sessions.length} matérias salvas</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User & Database Sync Indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 truncate">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-300 font-medium truncate">
                {user ? user.email : 'Modo Convidado (Local)'}
              </span>
            </div>
            {user ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md shrink-0">
                <Database className="w-3 h-3" />
                Firestore Cloud
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-semibold shrink-0">
                Local Storage
              </span>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Nenhum material salvo no histórico</p>
              <p className="text-xs text-slate-500">
                Envie um vídeo, áudio ou PDF para que seus estudos fiquem salvos e sincronizados.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                    isActive
                      ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                  }`}
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-700 text-indigo-400 shrink-0">
                        {session.fileType === 'pdf' ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : session.fileType === 'audio' || session.fileType === 'video' ? (
                          <FileAudio className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {session.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {session.summary?.overview || 'Resumo processado por IA'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1 text-indigo-400 font-bold group-hover:underline">
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Continuar de Onde Parou</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Excluir "${session.title}" do histórico?`)) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors opacity-60 group-hover:opacity-100 shrink-0"
                    title="Excluir do Histórico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 text-center">
          <p className="text-[11px] text-slate-400">
            {user
              ? 'Sua conta de aluno está sincronizada via Firebase Firestore.'
              : 'Faça login no topo para salvar seus estudos na nuvem.'}
          </p>
        </div>
      </div>
    </div>
  );
};

