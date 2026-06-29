import React, { useState } from 'react';
import { User, Building2, BookOpen, ArrowRight, History, Calendar, ChevronRight, Share2, Shield, Users } from 'lucide-react';
import { Evaluation, SharedSession } from '../types';

interface HomeViewProps {
  recentEvaluations: Evaluation[];
  sharedSessions: SharedSession[];
  onStartEvaluation: (orador: string, congregacion: string, tema: string, mode: 'colaborativa' | 'individual') => void;
  onSelectEvaluation: (evalId: string) => void;
  onSelectSharedSession: (sessionId: string) => void;
}

export default function HomeView({
  recentEvaluations,
  sharedSessions,
  onStartEvaluation,
  onSelectEvaluation,
  onSelectSharedSession,
}: HomeViewProps) {
  const [orador, setOrador] = useState('');
  const [congregacion, setCongregacion] = useState('');
  const [tema, setTema] = useState('');
  const [mode, setMode] = useState<'colaborativa' | 'individual'>('colaborativa');
  const [error, setError] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'colaborativo' | 'individual'>('colaborativo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orador.trim()) {
      setError('Por favor, ingresa el nombre del orador');
      return;
    }
    setError('');
    onStartEvaluation(orador, congregacion, tema, mode);
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Predefined avatar color arrays to match screenshots
  const getAvatarBg = (name: string) => {
    if (name === 'Miguel Ángel') return 'bg-secondary-container text-on-secondary-container';
    return 'bg-surface-container-highest text-on-surface-variant';
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Nuevo Orador Card */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden">
        {/* Decorative ambient background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-6">
          <h2 className="text-title-large md:text-headline-small font-semibold text-on-surface mb-1 leading-normal">
            Reconozca los puntos fuertes y comparta sugerencias constructivas para ayudar al orador a seguir mejorando.
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Input Orador */}
          <div className="relative">
            <label className="block text-label-medium text-on-surface-variant mb-1 font-medium" htmlFor="speaker-name">
              Nombre del orador
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 text-outline w-5 h-5 pointer-events-none" />
              <input
                id="speaker-name"
                type="text"
                value={orador}
                onChange={(e) => {
                  setOrador(e.target.value);
                  if (e.target.value.trim()) setError('');
                }}
                className="w-full bg-surface text-on-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-large focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/50"
                placeholder="Ej. Juan Pérez"
                autoComplete="off"
              />
            </div>
            {error && <span className="text-error text-xs mt-1 block">{error}</span>}
          </div>

          {/* Input Congregación */}
          <div className="relative">
            <label className="block text-label-medium text-on-surface-variant mb-1 font-medium" htmlFor="congregation">
              Congregación
            </label>
            <div className="relative flex items-center">
              <Building2 className="absolute left-3 text-outline w-5 h-5 pointer-events-none" />
              <input
                id="congregation"
                type="text"
                value={congregacion}
                onChange={(e) => setCongregacion(e.target.value)}
                className="w-full bg-surface text-on-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-large focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/50"
                placeholder="Ej. Centro"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Input Tema */}
          <div className="relative">
            <label className="block text-label-medium text-on-surface-variant mb-1 font-medium" htmlFor="speech-theme">
              Tema del discurso
            </label>
            <div className="relative flex items-center">
              <BookOpen className="absolute left-3 text-outline w-5 h-5 pointer-events-none" />
              <input
                id="speech-theme"
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full bg-surface text-on-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-large focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/50"
                placeholder="Número o título del bosquejo"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-2 w-full bg-primary text-on-primary hover:bg-primary/95 active:scale-[0.98] transition-all duration-200 rounded-full py-4 px-6 flex items-center justify-center gap-2 shadow-sm relative overflow-hidden group cursor-pointer"
            id="home-submit-btn"
          >
            <span className="font-label-large text-[14px] font-semibold">Comenzar apreciación</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </form>
      </section>

      {/* Historial reciente section */}
      <section className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1 border-b border-outline-variant/30 pb-2">
          <h3 className="text-title-lg text-on-surface px-1 flex items-center gap-2 font-semibold">
            <History className="text-primary w-5 h-5" />
            Apreciaciones Recientes
          </h3>

          <div className="flex gap-2 mt-2 sm:mt-0 bg-surface-container p-1 rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setActiveHistoryTab('colaborativo')}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                activeHistoryTab === 'colaborativo'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-secondary hover:text-on-surface'
              }`}
            >
              En línea ({sharedSessions.length})
            </button>
            <button
              onClick={() => setActiveHistoryTab('individual')}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                activeHistoryTab === 'individual'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-secondary hover:text-on-surface'
              }`}
            >
              Individuales ({recentEvaluations.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {activeHistoryTab === 'colaborativo' ? (
            sharedSessions.length === 0 ? (
              <p className="text-body-medium text-on-surface-variant px-2 py-4 italic text-center bg-white rounded-lg border border-outline-variant/25">
                No hay sesiones colaborativas en línea todavía.
              </p>
            ) : (
              sharedSessions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectSharedSession(item.id)}
                  className="bg-white border border-outline-variant/30 rounded-lg p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.99]"
                  role="button"
                  title={`Ver sesión de ${item.orador}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${getAvatarBg(item.orador)}`}>
                      <span className="text-[14px]">{getInitials(item.orador)}</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-body-large font-semibold text-on-surface leading-none">
                          {item.orador}
                        </span>
                        {item.status === 'active' ? (
                          <span className="bg-success-muted text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Activa
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200">
                            Finalizada
                          </span>
                        )}
                      </div>
                      <span className="text-body-medium text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-outline" />
                        {item.fecha} {item.congregacion ? `· ${item.congregacion}` : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-outline-variant" />
                </div>
              ))
            )
          ) : (
            recentEvaluations.length === 0 ? (
              <p className="text-body-medium text-on-surface-variant px-2 py-4 italic text-center bg-white rounded-lg border border-outline-variant/25">
                No hay evaluaciones individuales guardadas todavía.
              </p>
            ) : (
              recentEvaluations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEvaluation(item.id)}
                  className="bg-white border border-outline-variant/30 rounded-lg p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.99]"
                  role="button"
                  title={`Ver apreciación de ${item.orador}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${getAvatarBg(item.orador)}`}>
                      <span className="text-[14px]">{getInitials(item.orador)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body-large font-semibold text-on-surface leading-tight">
                        {item.orador}
                      </span>
                      <span className="text-body-medium text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-outline" />
                        {item.fecha} {item.congregacion ? `· ${item.congregacion}` : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-outline-variant" />
                </div>
              ))
            )
          )}
        </div>
      </section>
    </div>
  );
}

