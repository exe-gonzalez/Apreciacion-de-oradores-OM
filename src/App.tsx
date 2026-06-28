import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, History, Sparkles, Key, Shield, Lock, X } from 'lucide-react';
import { Evaluation, EvaluationAnswers, SharedSession } from './types';
import { INITIAL_EVALUATIONS } from './initialData';
import Header from './components/Header';
import HomeView from './components/HomeView';
import EvaluationFormView from './components/EvaluationFormView';
import HistoryView from './components/HistoryView';
import CollaborativeSessionView from './components/CollaborativeSessionView';
import { 
  subscribeToAllSessions, 
  createSharedSession, 
  subscribeToSession, 
  generateToken 
} from './firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'inicio' | 'nueva' | 'historial'>('inicio');

  // Collaborative real-time states
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSharedSession, setActiveSharedSession] = useState<SharedSession | null>(null);

  // Admin access control state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_user') === 'true';
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasscodeField, setAdminPasscodeField] = useState('');
  const [adminError, setAdminError] = useState('');

  // Load evaluations from localStorage or use initial mock data
  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    const stored = localStorage.getItem('speech_evaluations');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored evaluations:', e);
      }
    }
    // Set default initial data
    localStorage.setItem('speech_evaluations', JSON.stringify(INITIAL_EVALUATIONS));
    return INITIAL_EVALUATIONS;
  });

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);

  // States to pass draft info from Home to the evaluation Form
  const [draftOrador, setDraftOrador] = useState('');
  const [draftCongregacion, setDraftCongregacion] = useState('');
  const [draftTema, setDraftTema] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Real-time subscribe to all collaborative sessions on mount
  useEffect(() => {
    const unsubscribe = subscribeToAllSessions((sessions) => {
      setSharedSessions(sessions);
    });
    return () => unsubscribe();
  }, []);

  // Intercept ?session=ID query parameter on mount and popstate
  useEffect(() => {
    const handleUrlQuery = () => {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      if (sessionParam) {
        setActiveSessionId(sessionParam);
      } else {
        setActiveSessionId(null);
        setActiveSharedSession(null);
      }
    };

    handleUrlQuery();
    window.addEventListener('popstate', handleUrlQuery);
    return () => window.removeEventListener('popstate', handleUrlQuery);
  }, []);

  // Subscribe to the active session document in real-time
  useEffect(() => {
    if (!activeSessionId) return;

    const unsubscribe = subscribeToSession(activeSessionId, (sessionDoc) => {
      if (sessionDoc) {
        setActiveSharedSession(sessionDoc);
      } else {
        setActiveSharedSession(null);
        setActiveSessionId(null);
        // Clear query parameter if session doc doesn't exist anymore
        const url = new URL(window.location.href);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url.toString());
        setToast({ message: 'La sesión solicitada no existe o fue eliminada.', type: 'error' });
      }
    });

    return () => unsubscribe();
  }, [activeSessionId]);

  // Helper to trigger toast messages
  const triggerToast = (message: string, type: 'success' | 'info' | 'error') => {
    setToast({ message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Persist evaluations on changes
  const saveEvaluationsToStorage = (updatedList: Evaluation[]) => {
    setEvaluations(updatedList);
    localStorage.setItem('speech_evaluations', JSON.stringify(updatedList));
  };

  // Trigger evaluation start from Home Card
  const handleStartEvaluation = async (
    orador: string,
    congregacion: string,
    tema: string,
    mode: 'colaborativa' | 'individual'
  ) => {
    if (mode === 'colaborativa') {
      try {
        const adminToken = 'admin_' + generateToken();
        const newSessionId = await createSharedSession(orador, tema, congregacion, adminToken);
        
        // Save creator admin token in localStorage so this browser is the owner
        localStorage.setItem(`admin_token_${newSessionId}`, adminToken);

        // Update activeSessionId and rewrite URL
        setActiveSessionId(newSessionId);
        const url = new URL(window.location.href);
        url.searchParams.set('session', newSessionId);
        window.history.pushState({}, '', url.toString());
        
        triggerToast('¡Sesión colaborativa en línea creada!', 'success');
      } catch (err) {
        console.error(err);
        triggerToast('Error al crear la sesión en la nube.', 'error');
      }
    } else {
      setDraftOrador(orador);
      setDraftCongregacion(congregacion);
      setDraftTema(tema);
      setCurrentTab('nueva');
    }
  };

  // Handle saving the evaluation from Form

  const handleSaveEvaluation = (data: {
    orador: string;
    tema: string;
    congregacion: string;
    respuestas: EvaluationAnswers;
    puntoFuerte: string;
    sugerencia: string;
  }) => {
    // Generate dates
    const dateObj = new Date();
    const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fullMonths = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    const currentShortDate = `${dateObj.getDate()} ${shortMonths[dateObj.getMonth()]}`;
    const currentFullDate = `${dateObj.getDate()} de ${fullMonths[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

    const newEval: Evaluation = {
      id: `eval-${Date.now()}`,
      orador: data.orador,
      tema: data.tema || 'Discurso Público',
      congregacion: data.congregacion || 'Local',
      fecha: currentShortDate,
      fechaCompleta: currentFullDate,
      respuestas: data.respuestas,
      puntoFuerte: data.puntoFuerte,
      sugerencia: data.sugerencia,
    };

    const newList = [newEval, ...evaluations];
    saveEvaluationsToStorage(newList);
    setSelectedEvaluationId(newEval.id);

    // Reset drafts
    setDraftOrador('');
    setDraftCongregacion('');
    setDraftTema('');

    setToast({
      message: `¡Apreciación guardada con éxito para ${data.orador}!`,
      type: 'success',
    });

    // Move to history to view the summary
    setCurrentTab('historial');
  };

  // Delete evaluation helper
  const handleDeleteEvaluation = (id: string) => {
    const filtered = evaluations.filter((item) => item.id !== id);
    saveEvaluationsToStorage(filtered);
    setSelectedEvaluationId(filtered.length > 0 ? filtered[0].id : null);
    setToast({
      message: 'Apreciación eliminada.',
      type: 'info',
    });
  };

  // Direct selection from Home to History list
  const handleSelectEvaluation = (id: string) => {
    setSelectedEvaluationId(id);
    setCurrentTab('historial');
  };

  // Back from collaborative session
  const handleBackFromCollaborative = () => {
    setActiveSessionId(null);
    setActiveSharedSession(null);
    
    // Clear URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.pushState({}, '', url.toString());
    
    setCurrentTab('inicio');
  };

  // Handle Admin Passcode Submit
  const handleAdminPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscodeField.trim() === 'admin@123') {
      setIsAdmin(true);
      localStorage.setItem('is_admin_user', 'true');
      setShowAdminModal(false);
      setAdminPasscodeField('');
      setAdminError('');
      triggerToast('¡Sesión de Administrador Global iniciada!', 'success');
    } else {
      setAdminError('Clave incorrecta. Por favor intente de nuevo.');
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('is_admin_user');
    setShowAdminModal(false);
    triggerToast('Sesión de Administrador cerrada.', 'info');
  };

  return (
    <div className="bg-surface-variant min-h-screen font-sans text-on-surface flex flex-col pb-24 md:pb-6 relative selection:bg-primary/20">
      
      {/* Header component */}
      <Header 
        onMenuClick={() => triggerToast("S-141 Applet de Apreciación del Discurso", "info")}
        onProfileClick={() => setShowAdminModal(true)}
      />

      {/* Web Navigation (Desktop Header Anchor - matches screen layouts) */}
      <div className="hidden md:flex fixed top-0 right-0 h-16 items-center px-8 gap-4 z-50">
        <button
          onClick={() => {
            if (activeSessionId) handleBackFromCollaborative();
            setCurrentTab('inicio');
          }}
          className={`font-label-large text-[14px] px-4 py-2 rounded-full transition-colors font-semibold cursor-pointer ${
            currentTab === 'inicio' && !activeSessionId
              ? 'text-primary bg-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          id="desktop-nav-inicio"
        >
          Inicio
        </button>
        <button
          onClick={() => {
            if (activeSessionId) handleBackFromCollaborative();
            setCurrentTab('nueva');
          }}
          className={`font-label-large text-[14px] px-4 py-2 rounded-full transition-colors font-semibold cursor-pointer ${
            currentTab === 'nueva' && !activeSessionId
              ? 'text-primary bg-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          id="desktop-nav-nueva"
        >
          Nueva
        </button>
        <button
          onClick={() => {
            if (activeSessionId) handleBackFromCollaborative();
            setCurrentTab('historial');
          }}
          className={`font-label-large text-[14px] px-4 py-2 rounded-full transition-colors font-semibold cursor-pointer ${
            currentTab === 'historial' && !activeSessionId
              ? 'text-primary bg-secondary-container font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          id="desktop-nav-historial"
        >
          Historial
        </button>
      </div>

      {/* Main Content Container */}
      <main className="flex-grow w-full max-w-[720px] md:max-w-4xl mx-auto pt-24 px-4 md:px-8 flex flex-col gap-6">
        
        {/* Render active view */}
        {activeSharedSession ? (
          <CollaborativeSessionView
            session={activeSharedSession}
            isAdmin={isAdmin}
            onBack={handleBackFromCollaborative}
            onToast={triggerToast}
          />
        ) : (
          <>
            {currentTab === 'inicio' && (
              <HomeView
                recentEvaluations={evaluations}
                sharedSessions={sharedSessions}
                onStartEvaluation={handleStartEvaluation}
                onSelectEvaluation={handleSelectEvaluation}
                onSelectSharedSession={(id) => {
                  setActiveSessionId(id);
                  const url = new URL(window.location.href);
                  url.searchParams.set('session', id);
                  window.history.pushState({}, '', url.toString());
                }}
              />
            )}

            {currentTab === 'nueva' && (
              <EvaluationFormView
                initialOrador={draftOrador}
                initialCongregacion={draftCongregacion}
                initialTema={draftTema}
                onSave={handleSaveEvaluation}
              />
            )}

            {currentTab === 'historial' && (
              <HistoryView
                evaluations={evaluations}
                selectedId={selectedEvaluationId}
                onSelectEvaluation={(id) => setSelectedEvaluationId(id)}
                onDeleteEvaluation={handleDeleteEvaluation}
              />
            )}
          </>
        )}

        {/* Footer S-141 Legend */}
        <footer className="w-full py-6 flex flex-col items-center text-center px-4 mt-auto opacity-85">
          <p className="font-helper-text text-[12px] text-on-surface-variant hover:underline cursor-pointer">
            Basado en S-141 Recordatorios para los oradores públicos
          </p>
        </footer>
      </main>

      {/* Admin Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-outline-variant/30 animate-scale-up">
            <div className="bg-gradient-to-r from-primary/90 to-primary text-on-primary p-6 relative">
              <button 
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPasscodeField('');
                  setAdminError('');
                }}
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <Shield className="w-12 h-12 mb-2 text-primary-fixed-dim" />
              <h3 className="text-title-lg font-bold">Administrador de la Congregación</h3>
              <p className="text-body-small opacity-90 mt-1">
                Accede a privilegios para finalizar y eliminar cualquier apreciación en la nube.
              </p>
            </div>

            <div className="p-6">
              {isAdmin ? (
                <div className="flex flex-col gap-4 text-center">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex flex-col items-center gap-2">
                    <Lock className="w-8 h-8 text-emerald-600" />
                    <span className="font-semibold text-body-large">Sesión de Administrador Activa</span>
                    <span className="text-body-medium">Tienes control total para gestionar todas las apreciaciones compartidas.</span>
                  </div>
                  <button
                    onClick={handleAdminLogout}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-3 rounded-full cursor-pointer transition-colors text-body-medium"
                  >
                    Cerrar sesión de administrador
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdminPasscodeSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-label-large text-on-surface-variant mb-2 font-semibold">
                      Clave de acceso de administrador
                    </label>
                    <div className="relative flex items-center">
                      <Key className="absolute left-3 text-outline w-5 h-5" />
                      <input
                        type="password"
                        value={adminPasscodeField}
                        onChange={(e) => {
                          setAdminPasscodeField(e.target.value);
                          if (e.target.value) setAdminError('');
                        }}
                        className="w-full bg-surface text-on-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-large focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                        placeholder="Ingrese la clave"
                        autoFocus
                      />
                    </div>
                    {adminError && <span className="text-error text-xs mt-1 block font-medium">{adminError}</span>}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary hover:bg-primary/95 font-semibold py-3.5 rounded-full cursor-pointer transition-all text-body-medium shadow-sm mt-2"
                  >
                    Iniciar sesión admin
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Success/Info toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in text-body-medium max-w-[90%] font-medium">
          <Sparkles className="w-4 h-4 text-primary-fixed-dim" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe bg-white border-t border-surface-variant/20 shadow-lg z-50">
        {/* Tab: Inicio */}
        <button
          onClick={() => {
            if (activeSessionId) handleBackFromCollaborative();
            setCurrentTab('inicio');
          }}
          className="flex flex-col items-center justify-center px-2 min-w-[64px] active:scale-95 transition-transform duration-150 cursor-pointer"
          title="Ir a inicio"
          id="mobile-nav-inicio"
        >
          <div
            className={`flex flex-col items-center justify-center rounded-full px-5 py-1 mb-1 ${
              currentTab === 'inicio' && !activeSessionId
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            }`}
          >
            <Home className={`w-6 h-6 ${currentTab === 'inicio' && !activeSessionId ? 'fill-current' : ''}`} />
          </div>
          <span className={`font-label-medium text-[12px] ${currentTab === 'inicio' && !activeSessionId ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
            Inicio
          </span>
        </button>

        {/* Tab: Nueva */}
        <button
          onClick={() => {
            if (activeSessionId) handleBackFromCollaborative();
            setCurrentTab('nueva');
          }}
          className="flex flex-col items-center justify-center px-2 min-w-[64px] active:scale-95 transition-transform duration-150 cursor-pointer"
          title="Nueva apreciación"
          id="mobile-nav-nueva"
        >
          <div
            className={`flex flex-col items-center justify-center rounded-full px-5 py-1 mb-1 ${
              currentTab === 'nueva' && !activeSessionId
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            }`}
          >
            <PlusCircle className={`w-6 h-6 ${currentTab === 'nueva' && !activeSessionId ? 'fill-current' : ''}`} />
          </div>
          <span className={`font-label-medium text-[12px] ${currentTab === 'nueva' && !activeSessionId ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
            Nueva
          </span>
        </button>

        {/* Tab: Historial */}
        <button
          onClick={() => {
            if (activeSessionId) handleBackFromCollaborative();
            setCurrentTab('historial');
          }}
          className="flex flex-col items-center justify-center px-2 min-w-[64px] active:scale-95 transition-transform duration-150 cursor-pointer"
          title="Ver historial"
          id="mobile-nav-historial"
        >
          <div
            className={`flex flex-col items-center justify-center rounded-full px-5 py-1 mb-1 ${
              currentTab === 'historial' && !activeSessionId
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            }`}
          >
            <History className={`w-6 h-6 ${currentTab === 'historial' && !activeSessionId ? 'stroke-[2.5px]' : ''}`} />
          </div>
          <span className={`font-label-medium text-[12px] ${currentTab === 'historial' && !activeSessionId ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
            Historial
          </span>
        </button>
      </nav>
    </div>
  );
}
