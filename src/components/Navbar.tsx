import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  FileText,
  CreditCard,
  HelpCircle,
  MessageSquareText,
  CalendarCheck,
  FolderOpen,
  PlusCircle,
  Flame,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Database,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StudySession } from '../types';

interface NavbarProps {
  activeTab: 'upload' | 'summary' | 'flashcards' | 'quiz' | 'tutor' | 'plan';
  setActiveTab: (tab: 'upload' | 'summary' | 'flashcards' | 'quiz' | 'tutor' | 'plan') => void;
  activeSession: StudySession | null;
  onOpenHistory: () => void;
  onNewMaterial: () => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  studyStreak?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeSession,
  onOpenHistory,
  onNewMaterial,
  user,
  onOpenAuthModal,
  onLogout,
  studyStreak = 5,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewMaterial}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-indigo-950 group-hover:text-indigo-600 transition-colors">
                    Super Aluno
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-600" />
                    Firestore
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Assistente Multimodal & Banco de Dados
                </p>
              </div>
            </button>

            {/* Active Session Badge */}
            {activeSession && (
              <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-600 font-semibold truncate max-w-[200px]">
                  {activeSession.title}
                </span>
              </div>
            )}
          </div>

          {/* Action Tools, Streak & User Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 text-amber-800 text-xs font-bold" title="Ofensiva de Estudos">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
              <span>{studyStreak} dias</span>
            </div>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shadow-xs"
            >
              <FolderOpen className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Meus Materiais</span>
            </button>

            {/* New Study Material Button */}
            <button
              onClick={onNewMaterial}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Material</span>
            </button>

            {/* Firebase Auth User Widget */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User Avatar"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                      {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[110px] truncate hidden md:inline">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 space-y-2 animate-fadeIn">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.displayName || 'Aluno(a)'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {user.email}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Sincronizado no Firestore</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenHistory();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                      <span>Meu Histórico de Estudos</span>
                    </button>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <UserIcon className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Dashboard / Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            disabled={!activeSession}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                : activeSession
                ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resumo Estruturado</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            disabled={!activeSession}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                : activeSession
                ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Flashcards ({activeSession?.flashcards?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            disabled={!activeSession}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                : activeSession
                ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Simulado / Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab('tutor')}
            disabled={!activeSession}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'tutor'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                : activeSession
                ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <MessageSquareText className="w-4 h-4 text-indigo-600" />
            <span>Tutor IA (Chat)</span>
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            disabled={!activeSession}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'plan'
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                : activeSession
                ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <span>Plano de Estudos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
