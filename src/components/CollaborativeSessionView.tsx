import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Share2, 
  Calendar, 
  Building2, 
  BookOpen, 
  Check, 
  ChevronLeft, 
  Lock, 
  Unlock, 
  Trash2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Loader2,
  Copy
} from 'lucide-react';
import { SharedSession, EvaluationSubmission, EvaluationAnswers, RatingValue } from '../types';
import { FORM_SECTIONS } from '../initialData';
import { submitEvaluation, finalizeSession, deleteSession, subscribeToEvaluations } from '../firebase';

interface CollaborativeSessionViewProps {
  session: SharedSession;
  isAdmin: boolean;
  onBack: () => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function CollaborativeSessionView({
  session,
  isAdmin,
  onBack,
  onToast,
}: CollaborativeSessionViewProps) {
  const [evaluations, setEvaluations] = useState<EvaluationSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form');
  const [copied, setCopied] = useState(false);

  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [copiedAi, setCopiedAi] = useState<boolean>(false);

  // Clear AI Summary on mount or when evaluations change in size
  useEffect(() => {
    setAiSummary('');
    setAiError('');
    setCopiedAi(false);
  }, [session.id, evaluations.length]);

  const handleGenerateAiSummary = async () => {
    if (evaluations.length === 0) return;
    setAiLoading(true);
    setAiError('');
    setAiSummary('');

    // Compile rating summaries to give context to Gemini
    const questionKeys: { key: keyof EvaluationAnswers; label: string }[] = [
      { key: 'facilEntender', label: '¿Fácil de entender para recién interesados/estudiantes?' },
      { key: 'adaptadoTestigos', label: '¿Adaptado para animar y enseñar a Testigos?' },
      { key: 'mensajePositivo', label: '¿Centrado en el mensaje positivo y alentador?' },
      { key: 'beneficiosPrincipios', label: '¿Destacó los beneficios de aplicar principios?' },
      { key: 'evitoDespectivos', label: '¿Evitó comentarios despectivos sobre no Testigos?' },
      { key: 'cantidadAdecuada', label: '¿Cantidad adecuada de textos bíblicos?' },
      { key: 'desarrolloTextos', label: '¿Textos bien desarrollados (explicación/ilustración/aplicación)?' },
      { key: 'naturalidad', label: '¿Habló con naturalidad sin leer/depender de bosquejo?' },
      { key: 'entusiasmoCalidez', label: '¿Mostró entusiasmo, calidez e interés?' },
      { key: 'ayudasReforzaron', label: '¿Ayudas visuales reforzaron ideas principales?' },
      { key: 'ayudasApropiadas', label: '¿Ayudas visuales ayudaron a enseñar/fueron apropiadas?' },
      { key: 'practicoMotivador', label: '¿Fue práctico y motivó a aplicar lo aprendido?' },
    ];

    const respuestasResumen = questionKeys
      .map(({ key, label }) => {
        const val = getMajorityRating(key);
        const ratingStr = val === 'si' ? 'Mayoría Sí' : val === 'parte' ? 'Mayoría En parte' : 'Mayoría Por mejorar';
        return `- ${label}: ${ratingStr}`;
      })
      .join('\n');

    const puntosFuertes = evaluations
      .map((ev) => ev.puntoFuerte.trim())
      .filter(Boolean);

    const sugerencias = evaluations
      .map((ev) => ev.sugerencia.trim())
      .filter(Boolean);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orador: session.orador,
          tema: session.tema,
          congregacion: session.congregacion,
          puntosFuertes,
          sugerencias,
          respuestasResumen,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      setAiSummary(data.summary);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error al generar la apreciación con la IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiSummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary).then(() => {
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2000);
      onToast('¡Mensaje de IA copiado al portapapeles!', 'success');
    }).catch(() => {
      onToast('No se pudo copiar el mensaje de la IA.', 'error');
    });
  };

  // User's own submission draft state
  const [answers, setAnswers] = useState<EvaluationAnswers>({
    facilEntender: 'si',
    adaptadoTestigos: 'si',
    mensajePositivo: 'si',
    beneficiosPrincipios: 'si',
    evitoDespectivos: 'si',
    cantidadAdecuada: 'si',
    desarrolloTextos: 'si',
    naturalidad: 'si',
    entusiasmoCalidez: 'si',
    ayudasReforzaron: 'si',
    ayudasApropiadas: 'si',
    practicoMotivador: 'si',
  });
  const [puntoFuerte, setPuntoFuerte] = useState('');
  const [sugerencia, setSugerencia] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch / Generate a unique user token for this browser to track their submission in localStorage
  const [userToken] = useState<string>(() => {
    let token = localStorage.getItem('user_evaluation_token');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('user_evaluation_token', token);
    }
    return token;
  });

  // Track if this user has already submitted for this specific session
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(() => {
    const stored = localStorage.getItem(`submitted_${session.id}`);
    return stored === 'true';
  });

  // Real-time subscribe to evaluations in this session
  useEffect(() => {
    const unsubscribe = subscribeToEvaluations(session.id, (list) => {
      setEvaluations(list);
      // Also check if our userToken is among the submissions
      const userSub = list.find(item => item.userToken === userToken);
      if (userSub) {
        setHasSubmitted(true);
        localStorage.setItem(`submitted_${session.id}`, 'true');
        // If they already submitted and they haven't chosen a tab, show results
        setActiveTab('results');
      } else {
        // If they haven't submitted, show form by default (if session is active)
        if (session.status === 'active') {
          setActiveTab('form');
        } else {
          setActiveTab('results');
        }
      }
    });
    return () => unsubscribe();
  }, [session.id, userToken]);

  // Handle setting active tab based on submission status / session state
  useEffect(() => {
    if (session.status === 'finalized' || hasSubmitted) {
      setActiveTab('results');
    } else {
      setActiveTab('form');
    }
  }, [session.status, hasSubmitted]);

  const handleRatingChange = (questionId: keyof EvaluationAnswers, val: RatingValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: val
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (session.status === 'finalized') {
      onToast('Esta sesión ya ha sido finalizada y no acepta más respuestas.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await submitEvaluation(session.id, userToken, answers, puntoFuerte, sugerencia);
      setHasSubmitted(true);
      localStorage.setItem(`submitted_${session.id}`, 'true');
      onToast('¡Tu apreciación ha sido enviada con éxito!', 'success');
      setActiveTab('results');
    } catch (err) {
      console.error(err);
      onToast('Error al enviar la apreciación.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${session.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      onToast('¡Enlace de colaboración copiado al portapapeles!', 'success');
    }).catch(() => {
      onToast('No se pudo copiar el enlace.', 'error');
    });
  };

  const handleFinalize = async () => {
    if (window.confirm('¿Estás seguro de que deseas finalizar esta apreciación? Se bloquearán nuevos envíos.')) {
      try {
        await finalizeSession(session.id);
        onToast('Sesión de apreciación finalizada.', 'info');
      } catch (err) {
        onToast('Error al finalizar la sesión.', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta apreciación compartida?')) {
      try {
        await deleteSession(session.id);
        onToast('Apreciación eliminada con éxito.', 'info');
        onBack();
      } catch (err) {
        onToast('Error al eliminar la apreciación.', 'error');
      }
    }
  };

  // Aggregate stats helper
  const getAggregates = () => {
    const totalCount = evaluations.length;
    const stats: Record<keyof EvaluationAnswers, { si: number; parte: number; mejorar: number }> = {} as any;

    const questionKeys: (keyof EvaluationAnswers)[] = [
      'facilEntender', 'adaptadoTestigos', 'mensajePositivo', 'beneficiosPrincipios',
      'evitoDespectivos', 'cantidadAdecuada', 'desarrolloTextos', 'naturalidad',
      'entusiasmoCalidez', 'ayudasReforzaron', 'ayudasApropiadas', 'practicoMotivador'
    ];

    questionKeys.forEach(k => {
      stats[k] = { si: 0, parte: 0, mejorar: 0 };
    });

    evaluations.forEach(ev => {
      questionKeys.forEach(k => {
        const val = ev.respuestas[k];
        if (val) {
          stats[k][val] = (stats[k][val] || 0) + 1;
        }
      });
    });

    return { totalCount, stats };
  };

  const { totalCount, stats } = getAggregates();

  // Calculate majority rating for summary text
  const getMajorityRating = (key: keyof EvaluationAnswers) => {
    if (evaluations.length === 0) return 'si';
    const qStats = stats[key];
    if (!qStats) return 'si';
    
    if (qStats.si >= qStats.parte && qStats.si >= qStats.mejorar) return 'si';
    if (qStats.parte >= qStats.si && qStats.parte >= qStats.mejorar) return 'parte';
    return 'mejorar';
  };

  const handleCopySummary = () => {
    const questionKeys: { key: keyof EvaluationAnswers; label: string }[] = [
      { key: 'facilEntender', label: '¿Fácil de entender para recién interesados/estudiantes?' },
      { key: 'adaptadoTestigos', label: '¿Adaptado para animar y enseñar a Testigos?' },
      { key: 'mensajePositivo', label: '¿Centrado en el mensaje positivo y alentador?' },
      { key: 'beneficiosPrincipios', label: '¿Destacó los beneficios de aplicar principios?' },
      { key: 'evitoDespectivos', label: '¿Evitó comentarios despectivos sobre no Testigos?' },
      { key: 'cantidadAdecuada', label: '¿Cantidad adecuada de textos bíblicos?' },
      { key: 'desarrolloTextos', label: '¿Textos bien desarrollados (explicación/ilustración/aplicación)?' },
      { key: 'naturalidad', label: '¿Habló con naturalidad sin leer/depender de bosquejo?' },
      { key: 'entusiasmoCalidez', label: '¿Mostró entusiasmo, calidez e interés?' },
      { key: 'ayudasReforzaron', label: '¿Ayudas visuales reforzaron ideas principales?' },
      { key: 'ayudasApropiadas', label: '¿Ayudas visuales ayudaron a enseñar/fueron apropiadas?' },
      { key: 'practicoMotivador', label: '¿Fue práctico y motivó a aplicar lo aprendido?' },
    ];

    const ratingSummary = questionKeys
      .map(({ key, label }) => {
        const val = getMajorityRating(key);
        const ratingStr = val === 'si' ? '✅ Sí' : val === 'parte' ? '🟡 En parte' : '🔵 Mejorar';
        return `- ${label}: ${ratingStr}`;
      })
      .join('\n');

    // Compile comments
    const puntosFuertesText = evaluations
      .map(ev => ev.puntoFuerte.trim())
      .filter(Boolean)
      .map(t => `- ${t}`)
      .join('\n') || '- No se especificaron puntos fuertes todavía.';

    const sugerenciasText = evaluations
      .map(ev => ev.sugerencia.trim())
      .filter(Boolean)
      .map(t => `- ${t}`)
      .join('\n') || '- No se especificaron sugerencias todavía.';

    const shareText = `*Apreciación del Discurso* 
*Orador:* ${session.orador}
*Tema:* ${session.tema}
*Congregación:* ${session.congregacion}
*Fecha:* ${session.fechaCompleta}

*Detalles:*
${ratingSummary}

*Punto Fuerte:*
${puntosFuertesText}

*Principal Sugerencia:*
${sugerenciasText}

"Así como el hierro afila el hierro, un hombre hace mejor a su amigo." (Prov.27:17)
(Apreciacion basada en S-141 Recordatorio para los oradores publicos)`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      onToast('¡Resumen de apreciación copiado al portapapeles!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      onToast('No se pudo copiar el resumen.', 'error');
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary font-semibold hover:underline cursor-pointer py-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver al panel principal
        </button>
      </div>

      {/* Main session meta card */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {session.status === 'active' ? (
                <span className="bg-success-muted text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  🟢 Sesión Activa
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-slate-200">
                  <Lock className="w-3.5 h-3.5" />
                  🔴 Finalizada (Bloqueada)
                </span>
              )}
              <span className="bg-secondary-container text-primary text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-indigo-100">
                <Users className="w-3.5 h-3.5" />
                {totalCount} {totalCount === 1 ? 'Hermano evaluando' : 'Hermanos evaluando'}
              </span>
            </div>

            <h2 className="text-display-md font-bold text-on-surface tracking-tight mb-2 leading-tight">
              {session.orador}
            </h2>

            <p className="text-body-large text-primary font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              {session.tema}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md pt-2 border-t border-slate-100">
              <div className="text-body-medium text-text-secondary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-outline" />
                <span className="truncate">{session.congregacion}</span>
              </div>
              <div className="text-body-medium text-text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-outline" />
                <span>{session.fechaCompleta}</span>
              </div>
            </div>
          </div>

          {/* Quick Share / Admin Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0 w-full md:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-surface-container-high hover:bg-slate-200 text-on-surface font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 border border-outline-variant transition-colors cursor-pointer text-body-medium"
            >
              <Share2 className="w-4 h-4" />
              Compartir enlace
            </button>

            {evaluations.length > 0 && (
              <button
                onClick={handleCopySummary}
                className={`flex-1 font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-body-medium shadow-sm ${
                  copied
                    ? 'bg-success-muted text-emerald-800 border border-emerald-200'
                    : 'bg-primary text-on-primary hover:bg-primary/95'
                }`}
              >
                <Check className="w-4 h-4" />
                {copied ? '¡Copiado!' : 'Copiar apreciación'}
              </button>
            )}

            {(isAdmin || localStorage.getItem(`admin_token_${session.id}`) === session.adminToken) && (
              <>
                {session.status === 'active' && (
                  <button
                    onClick={handleFinalize}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-body-medium"
                  >
                    <Lock className="w-4 h-4" />
                    Finalizar apreciación
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-body-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      {session.status === 'active' && !hasSubmitted && (
        <div className="flex border-b border-outline-variant">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 text-center text-body-large font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'form'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-on-surface hover:bg-slate-50'
            }`}
          >
            ✍️ Mi apreciación
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-3 text-center text-body-large font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'results'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-on-surface hover:bg-slate-50'
            }`}
          >
            📊 Resultados en vivo ({totalCount})
          </button>
        </div>
      )}

      {/* Content views */}
      {activeTab === 'form' && session.status === 'active' && !hasSubmitted && (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 animate-fade-in">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30">
            <h3 className="text-title-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <Sparkles className="text-primary w-5 h-5" />
              Completa los puntos del orador
            </h3>
            <p className="text-body-medium text-on-surface-variant mb-6">
              Selecciona para cada punto si el orador lo cumplió <b>Sí</b>, <b>En parte</b>, o si tiene aspectos <b>Por mejorar</b>. Sus respuestas se combinarán con las de los demás en tiempo real de forma anónima y segura.
            </p>

            <div className="flex flex-col gap-8">
              {FORM_SECTIONS.map((section, sIdx) => (
                <div key={section.title} className="flex flex-col gap-4">
                  <h4 className="text-body-large font-bold text-primary border-b border-surface-variant/30 pb-2 flex items-center gap-2">
                    <span className="text-lg">{sIdx + 1}.</span> {section.title}
                  </h4>
                  <div className="flex flex-col gap-5">
                    {section.questions.map((q) => {
                      const currentVal = answers[q.id];
                      return (
                        <div key={q.id} className="flex flex-col gap-2">
                          <p className="text-body-large text-on-surface font-medium leading-normal">
                            {q.text}
                          </p>
                          <div className="flex flex-row w-full rounded-lg shadow-sm border border-outline-variant overflow-hidden" role="group">
                            <button
                              type="button"
                              onClick={() => handleRatingChange(q.id, 'si')}
                              className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-1 border-r border-outline-variant last:border-r-0 ${
                                currentVal === 'si'
                                  ? 'bg-success-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                                    : 'bg-white hover:bg-slate-50 text-text-secondary'
                              }`}
                            >
                              ✅ Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRatingChange(q.id, 'parte')}
                              className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-1 border-r border-outline-variant last:border-r-0 ${
                                currentVal === 'parte'
                                  ? 'bg-warning-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                                    : 'bg-white hover:bg-slate-50 text-text-secondary'
                              }`}
                            >
                              🟡 En parte
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRatingChange(q.id, 'mejorar')}
                              className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-1 border-r border-outline-variant last:border-r-0 ${
                                currentVal === 'mejorar'
                                  ? 'bg-info-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                                    : 'bg-white hover:bg-slate-50 text-text-secondary'
                              }`}
                            >
                              🔵 Mejorar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Overall feedback */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                <h4 className="text-body-large font-bold text-primary flex items-center gap-2">
                  <span className="text-lg">6.</span> Evaluación general
                </h4>

                <div className="flex flex-col gap-4">
                  <div className="pb-2">
                    <p className="text-body-large text-on-surface mb-2 font-medium">¿El discurso fue práctico y motivó a aplicar lo aprendido?</p>
                    <div className="flex flex-row w-full rounded-lg shadow-sm border border-outline-variant overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleRatingChange('practicoMotivador', 'si')}
                        className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-1 border-r border-outline-variant last:border-r-0 ${
                          answers.practicoMotivador === 'si'
                            ? 'bg-success-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                            : 'bg-white hover:bg-slate-50 text-text-secondary'
                        }`}
                      >
                        ✅ Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRatingChange('practicoMotivador', 'parte')}
                        className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-1 border-r border-outline-variant last:border-r-0 ${
                          answers.practicoMotivador === 'parte'
                            ? 'bg-warning-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                            : 'bg-white hover:bg-slate-50 text-text-secondary'
                        }`}
                      >
                        🟡 En parte
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRatingChange('practicoMotivador', 'mejorar')}
                        className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-1 border-r border-outline-variant last:border-r-0 ${
                          answers.practicoMotivador === 'mejorar'
                            ? 'bg-info-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                            : 'bg-white hover:bg-slate-50 text-text-secondary'
                        }`}
                      >
                        🔵 Mejorar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-label-large text-on-surface-variant mb-2 block font-medium">
                      ¿Cuál fue el punto más fuerte del orador? (Opcional)
                    </label>
                    <textarea
                      value={puntoFuerte}
                      onChange={(e) => setPuntoFuerte(e.target.value)}
                      className="w-full bg-surface text-on-surface border border-outline-variant rounded-lg p-3 text-body-large focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow min-h-[100px] resize-y placeholder:text-outline/50"
                      placeholder="Ej. El contacto visual y las ilustraciones..."
                    />
                  </div>

                  <div>
                    <label className="text-label-large text-on-surface-variant mb-2 block font-medium">
                      ¿Cuál sería la principal sugerencia para mejorar? (Opcional)
                    </label>
                    <textarea
                      value={sugerencia}
                      onChange={(e) => setSugerencia(e.target.value)}
                      className="w-full bg-surface text-on-surface border border-outline-variant rounded-lg p-3 text-body-large focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow min-h-[100px] resize-y placeholder:text-outline/50"
                      placeholder="Ej. Tratar de profundizar un poco más en la aplicación de los textos..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary hover:bg-primary/95 disabled:bg-primary/50 active:scale-[0.99] font-semibold rounded-full py-4 px-6 text-center shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? 'Enviando...' : 'Guardar mi apreciación'}
          </button>
        </form>
      )}

      {/* Aggregate results View */}
      {(activeTab === 'results' || session.status === 'finalized' || hasSubmitted) && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {evaluations.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-outline-variant/30 text-center flex flex-col items-center gap-3">
              <Users className="w-12 h-12 text-outline-variant animate-pulse" />
              <h3 className="text-title-medium font-bold text-on-surface">Esperando respuestas...</h3>
              <p className="text-body-medium text-on-surface-variant max-w-sm">
                Comparte el enlace con otros evaluadores para comenzar a recibir y combinar las apreciaciones en tiempo real.
              </p>
              <button
                onClick={handleCopyLink}
                className="mt-2 bg-primary text-on-primary font-semibold py-2 px-5 rounded-full flex items-center gap-2 hover:bg-primary/95 transition-all text-body-medium cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Copiar enlace para compartir
              </button>
            </div>
          ) : (
            <>
              {/* Stat Cards summary */}
              <div className="grid grid-cols-3 gap-3">
                {/* Calculate general counters across all questions */}
                {(() => {
                  let totalSi = 0;
                  let totalParte = 0;
                  let totalMejorar = 0;
                  const keys = Object.keys(stats) as (keyof EvaluationAnswers)[];
                  keys.forEach(k => {
                    totalSi += stats[k].si;
                    totalParte += stats[k].parte;
                    totalMejorar += stats[k].mejorar;
                  });
                  const sum = totalSi + totalParte + totalMejorar || 1;
                  return (
                    <>
                      <div className="bg-success-muted/50 rounded-xl p-4 text-center border border-success-muted/20 shadow-sm flex flex-col items-center">
                        <span className="block text-display-md font-bold text-emerald-700 leading-tight">
                          {Math.round((totalSi / sum) * 100)}%
                        </span>
                        <span className="text-label-medium text-emerald-800 font-semibold mt-1">✅ Sí</span>
                      </div>
                      <div className="bg-warning-muted/50 rounded-xl p-4 text-center border border-warning-muted/20 shadow-sm flex flex-col items-center">
                        <span className="block text-display-md font-bold text-amber-700 leading-tight">
                          {Math.round((totalParte / sum) * 100)}%
                        </span>
                        <span className="text-label-medium text-amber-800 font-semibold mt-1">🟡 Parte</span>
                      </div>
                      <div className="bg-error-container/30 rounded-xl p-4 text-center border border-error-container/20 shadow-sm flex flex-col items-center">
                        <span className="block text-display-md font-bold text-red-600 leading-tight">
                          {Math.round((totalMejorar / sum) * 100)}%
                        </span>
                        <span className="text-label-medium text-red-700 font-semibold mt-1">🔵 Mejorar</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Questions List with progress bars */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-6">
                <h3 className="text-title-lg font-bold text-on-surface border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>📊</span> Resumen General Consolidado
                </h3>

                {FORM_SECTIONS.map((section, sIdx) => (
                  <div key={section.title} className="flex flex-col gap-4">
                    <h4 className="text-body-large font-bold text-primary flex items-center gap-2 border-b border-slate-50 pb-1">
                      <span className="text-indigo-400">{sIdx + 1}.</span> {section.title}
                    </h4>

                    <div className="flex flex-col gap-5 pl-2">
                      {section.questions.map((q) => {
                        const qStats = stats[q.id] || { si: 0, parte: 0, mejorar: 0 };
                        const qTotal = qStats.si + qStats.parte + qStats.mejorar || 1;
                        const siPct = Math.round((qStats.si / qTotal) * 100);
                        const partePct = Math.round((qStats.parte / qTotal) * 100);
                        const mejorarPct = Math.round((qStats.mejorar / qTotal) * 100);

                        return (
                          <div key={q.id} className="flex flex-col gap-1.5">
                            <p className="text-body-medium text-on-surface font-semibold leading-relaxed">
                              {q.text}
                            </p>
                            
                            {/* Multicolored bar representing collective split */}
                            <div className="w-full h-3.5 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200/50">
                              {qStats.si > 0 && (
                                <div 
                                  className="bg-emerald-500 h-full transition-all duration-500" 
                                  style={{ width: `${siPct}%` }}
                                  title={`Sí: ${qStats.si} votos`}
                                />
                              )}
                              {qStats.parte > 0 && (
                                <div 
                                  className="bg-amber-500 h-full transition-all duration-500" 
                                  style={{ width: `${partePct}%` }}
                                  title={`En parte: ${qStats.parte} votos`}
                                />
                              )}
                              {qStats.mejorar > 0 && (
                                <div 
                                  className="bg-sky-500 h-full transition-all duration-500" 
                                  style={{ width: `${mejorarPct}%` }}
                                  title={`Por mejorar: ${qStats.mejorar} votos`}
                                />
                              )}
                            </div>

                            {/* Votes legends */}
                            <div className="flex flex-row gap-4 text-xs font-medium text-text-secondary pl-0.5">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                                Sí: {qStats.si} ({siPct}%)
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                                En parte: {qStats.parte} ({partePct}%)
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 block"></span>
                                Por mejorar: {qStats.mejorar} ({mejorarPct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Practical and Motivating Question */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5">
                  <h4 className="text-body-large font-bold text-primary flex items-center gap-2">
                    <span>6.</span> Evaluación general
                  </h4>
                  {(() => {
                    const qStats = stats.practicoMotivador || { si: 0, parte: 0, mejorar: 0 };
                    const qTotal = qStats.si + qStats.parte + qStats.mejorar || 1;
                    const siPct = Math.round((qStats.si / qTotal) * 100);
                    const partePct = Math.round((qStats.parte / qTotal) * 100);
                    const mejorarPct = Math.round((qStats.mejorar / qTotal) * 100);

                    return (
                      <div className="flex flex-col gap-1.5 pl-2">
                        <p className="text-body-medium text-on-surface font-semibold leading-relaxed">
                          ¿El discurso fue práctico y motivó a aplicar lo aprendido?
                        </p>
                        
                        <div className="w-full h-3.5 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200/50">
                          {qStats.si > 0 && (
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-500" 
                              style={{ width: `${siPct}%` }}
                            />
                          )}
                          {qStats.parte > 0 && (
                            <div 
                              className="bg-amber-500 h-full transition-all duration-500" 
                              style={{ width: `${partePct}%` }}
                            />
                          )}
                          {qStats.mejorar > 0 && (
                            <div 
                              className="bg-sky-500 h-full transition-all duration-500" 
                              style={{ width: `${mejorarPct}%` }}
                            />
                          )}
                        </div>

                        <div className="flex flex-row gap-4 text-xs font-medium text-text-secondary pl-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                            Sí: {qStats.si} ({siPct}%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                            En parte: {qStats.parte} ({partePct}%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 block"></span>
                            Por mejorar: {qStats.mejorar} ({mejorarPct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Consolidation of comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strong points card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                  <h4 className="text-body-large font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    Puntos Fuertes Consolidados
                  </h4>
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                    {evaluations.map(ev => ev.puntoFuerte.trim()).filter(Boolean).length === 0 ? (
                      <p className="text-body-medium text-on-surface-variant italic px-1">No hay comentarios de puntos fuertes aún.</p>
                    ) : (
                      evaluations.map((ev, idx) => {
                        if (!ev.puntoFuerte.trim()) return null;
                        return (
                          <div key={ev.id || idx} className="bg-slate-50 border-l-4 border-emerald-500 p-3 rounded-r-lg text-body-medium text-on-surface leading-normal">
                            "{ev.puntoFuerte.trim()}"
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Suggestions card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                  <h4 className="text-body-large font-bold text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Sugerencias para Mejorar
                  </h4>
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                    {evaluations.map(ev => ev.sugerencia.trim()).filter(Boolean).length === 0 ? (
                      <p className="text-body-medium text-on-surface-variant italic px-1">No hay sugerencias para mejorar aún.</p>
                    ) : (
                      evaluations.map((ev, idx) => {
                        if (!ev.sugerencia.trim()) return null;
                        return (
                          <div key={ev.id || idx} className="bg-slate-50 border-l-4 border-indigo-400 p-3 rounded-r-lg text-body-medium text-on-surface leading-normal">
                            "{ev.sugerencia.trim()}"
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary Recommendation Box for Collaborative Session */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-primary/5 rounded-xl p-6 border border-primary/25 shadow-sm flex flex-col gap-4 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-title-medium font-bold text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    Generar Mensaje Consolidado con IA
                  </h4>
                </div>
                <p className="text-body-medium text-on-surface-variant leading-relaxed">
                  Consolida todas las respuestas de los hermanos participantes para redactar un párrafo equilibrado y cálido. Felicitará al orador sinceramente y ofrecerá valiosas sugerencias constructivas con total claridad y amabilidad, ideales para enviárselas directamente.
                </p>

                {aiSummary ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white border border-outline-variant/35 rounded-xl p-4 text-body-medium text-on-surface leading-relaxed italic relative">
                      {aiSummary}
                    </div>
                    <button
                      onClick={handleCopyAiSummary}
                      className={`self-end flex items-center gap-1.5 text-xs font-bold py-2.5 px-5 rounded-full transition-all cursor-pointer ${
                        copiedAi 
                          ? 'bg-success-muted text-emerald-800 border border-emerald-200' 
                          : 'bg-primary text-on-primary hover:bg-primary/95 shadow-sm'
                      }`}
                    >
                      {copiedAi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span>¡Copiado con éxito!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar párrafo con IA</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateAiSummary}
                    disabled={aiLoading}
                    className="w-full bg-white hover:bg-primary/5 text-primary font-bold border border-primary/30 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Consolidando y redactando con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Generar Párrafo con IA</span>
                      </>
                    )}
                  </button>
                )}

                {aiError && (
                  <p className="text-xs text-error font-medium mt-1">
                    ⚠️ {aiError}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
