import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadSection } from './components/UploadSection';
import { SummaryView } from './components/SummaryView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { TutorChatView } from './components/TutorChatView';
import { StudyPlanView } from './components/StudyPlanView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AuthModal } from './components/AuthModal';
import { StudySession, Flashcard, ChatMessage } from './types';
import { SAMPLE_STUDY_SESSIONS } from './data/sampleSessions';
import { 
  onAuthChange, 
  logoutUser, 
  subscribeToUserStudies, 
  saveStudySessionToFirestore, 
  deleteStudySessionFromFirestore 
} from './lib/firebase';
import { User } from 'firebase/auth';
import { Sparkles, ArrowRight, BookOpen, GraduationCap, PlayCircle, Clock, Database } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem('super_aluno_sessions');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
    }
    return SAMPLE_STUDY_SESSIONS;
  });

  const [activeSession, setActiveSession] = useState<StudySession | null>(() => {
    return sessions.length > 0 ? sessions[0] : null;
  });

  const [activeTab, setActiveTab] = useState<
    'upload' | 'summary' | 'flashcards' | 'quiz' | 'tutor' | 'plan'
  >(() => (sessions.length > 0 ? 'summary' : 'upload'));

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Listen for Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserStudies(user.uid, (remoteSessions) => {
      if (remoteSessions) {
        setSessions(remoteSessions);
        setActiveSession((prev) => {
          if (!prev) return remoteSessions[0] || null;
          const matched = remoteSessions.find((s) => s.id === prev.id);
          return matched || remoteSessions[0] || null;
        });
        if (remoteSessions.length === 0) {
          setActiveTab('upload');
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sync to localStorage for local state
  useEffect(() => {
    try {
      localStorage.setItem('super_aluno_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  const handleSessionCreated = async (newSession: StudySession) => {
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSession(newSession);
    setActiveTab('summary');

    if (user) {
      try {
        await saveStudySessionToFirestore(user.uid, newSession);
      } catch (err) {
        console.error('Failed to sync new session to Firestore:', err);
      }
    }
  };

  const handleSelectSample = async (sample: StudySession) => {
    const exists = sessions.find((s) => s.id === sample.id);
    if (!exists) {
      setSessions([sample, ...sessions]);
    }
    setActiveSession(sample);
    setActiveTab('summary');

    if (user) {
      try {
        await saveStudySessionToFirestore(user.uid, sample);
      } catch (err) {
        console.error('Failed to sync sample session to Firestore:', err);
      }
    }
  };

  const handleSelectSessionFromHistory = (session: StudySession) => {
    setActiveSession(session);
    setActiveTab('summary');
  };

  const handleDeleteSession = async (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);

    if (user) {
      try {
        await deleteStudySessionFromFirestore(user.uid, sessionId);
      } catch (err) {
        console.error('Failed to delete session from Firestore:', err);
      }
    }

    if (activeSession?.id === sessionId) {
      setActiveSession(updated.length > 0 ? updated[0] : null);
      if (updated.length === 0) {
        setActiveTab('upload');
      }
    }
  };

  const handleUpdateFlashcards = async (updatedCards: Flashcard[]) => {
    if (!activeSession) return;
    const updatedSession = { ...activeSession, flashcards: updatedCards };
    setActiveSession(updatedSession);
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );

    if (user) {
      try {
        await saveStudySessionToFirestore(user.uid, updatedSession);
      } catch (err) {
        console.error('Failed to update flashcards in Firestore:', err);
      }
    }
  };

  const handleUpdateSessionChat = async (updatedChat: ChatMessage[]) => {
    if (!activeSession) return;
    const updatedSession = { ...activeSession, chatHistory: updatedChat };
    setActiveSession(updatedSession);
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );

    if (user) {
      try {
        await saveStudySessionToFirestore(user.uid, updatedSession);
      } catch (err) {
        console.error('Failed to update chat history in Firestore:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSession={activeSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewMaterial={() => setActiveTab('upload')}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={logoutUser}
        studyStreak={7}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {/* Banner to Resume Last Session on Dashboard view */}
        {activeTab === 'upload' && activeSession && (
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 shrink-0">
                  <PlayCircle className="w-6 h-6 animate-pulse text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Última Matéria Estudada
                    </span>
                    {user && (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Salvo no Firestore
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                    {activeSession.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {activeSession.summary?.subject || 'Matéria de estudo'} • {activeSession.flashcards?.length || 0} Flashcards • {activeSession.quiz?.length || 0} Questões
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('summary')}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/50 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <span>Voltar de onde parei</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <UploadSection
            onSessionCreated={handleSessionCreated}
            onSelectSample={handleSelectSample}
          />
        )}

        {activeTab === 'summary' && activeSession && (
          <SummaryView summary={activeSession.summary} title={activeSession.title} />
        )}

        {activeTab === 'flashcards' && activeSession && (
          <FlashcardsView
            flashcards={activeSession.flashcards}
            onUpdateFlashcards={handleUpdateFlashcards}
          />
        )}

        {activeTab === 'quiz' && activeSession && (
          <QuizView quiz={activeSession.quiz} title={activeSession.title} />
        )}

        {activeTab === 'tutor' && activeSession && (
          <TutorChatView
            session={activeSession}
            onUpdateSessionChat={handleUpdateSessionChat}
          />
        )}

        {activeTab === 'plan' && activeSession && (
          <StudyPlanView
            studyPlan={activeSession.studyPlan}
            title={activeSession.title}
          />
        )}

        {/* Fallback if no session and on a detail tab */}
        {!activeSession && activeTab !== 'upload' && (
          <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">
              Nenhum material de estudo selecionado
            </h2>
            <p className="text-xs text-slate-600">
              Escolha uma matéria no seu histórico ou envie um novo arquivo para começar a estudar.
            </p>
            <button
              onClick={() => setActiveTab('upload')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
            >
              Enviar Novo Material
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">Super Aluno</span>
            <span className="text-slate-400">• Banco de Dados Firestore & IA Gemini</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {user ? `Conectado como ${user.email}` : 'Faça login para sincronizar seus dados'}
          </p>
        </div>
      </footer>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSession?.id}
        onSelectSession={handleSelectSessionFromHistory}
        onDeleteSession={handleDeleteSession}
        user={user}
      />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

