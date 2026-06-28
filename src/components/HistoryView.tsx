import { useState, useEffect } from 'react';
import { ChevronRight, Share2, AlertCircle, Trash2, Check } from 'lucide-react';
import { Evaluation, EvaluationAnswers } from '../types';

interface HistoryViewProps {
  evaluations: Evaluation[];
  selectedId: string | null;
  onSelectEvaluation: (id: string) => void;
  onDeleteEvaluation?: (id: string) => void;
}

export default function HistoryView({
  evaluations,
  selectedId,
  onSelectEvaluation,
  onDeleteEvaluation,
}: HistoryViewProps) {
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const [copied, setCopied] = useState(false);

  // Sync state with parent's selected id
  useEffect(() => {
    if (selectedId) {
      setActiveId(selectedId);
    } else if (evaluations.length > 0 && !activeId) {
      setActiveId(evaluations[0].id);
    }
  }, [selectedId, evaluations]);

  const activeEval = evaluations.find((item) => item.id === activeId) || evaluations[0];

  const handleSelect = (id: string) => {
    setActiveId(id);
    onSelectEvaluation(id);
    // On mobile, scroll to the summary details when selected
    if (window.innerWidth < 768) {
      setTimeout(() => {
        const element = document.getElementById('evaluation-summary-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Calculate rating totals dynamically from responses
  const getRatingTotals = (evaluation: Evaluation) => {
    if (!evaluation) return { si: 0, parte: 0, mejorar: 0 };
    let si = 0;
    let parte = 0;
    let mejorar = 0;

    Object.values(evaluation.respuestas).forEach((val) => {
      if (val === 'si') si++;
      else if (val === 'parte') parte++;
      else if (val === 'mejorar') mejorar++;
    });

    return { si, parte, mejorar };
  };

  const totals = activeEval ? getRatingTotals(activeEval) : { si: 0, parte: 0, mejorar: 0 };

  const handleShare = () => {
    if (!activeEval) return;

    // Ordered list of questions to match user's requested format and S-141 structure
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
        const val = activeEval.respuestas[key];
        const ratingStr = val === 'si' ? '✅ Sí' : val === 'parte' ? '🟡 En parte' : '🔵 Mejorar';
        return `- ${label}: ${ratingStr}`;
      })
      .join('\n');

    const shareText = `*Apreciación del Discurso* 
*Orador:* ${activeEval.orador}
*Tema:* ${activeEval.tema}
*Congregación:* ${activeEval.congregacion}
*Fecha:* ${activeEval.fechaCompleta}

*Detalles:*
${ratingSummary}

*Punto Fuerte:*
${activeEval.puntoFuerte}

*Principal Sugerencia:*
${activeEval.sugerencia}

"Así como el hierro afila el hierro, un hombre hace mejor a su amigo." (Prov.27:17)
(Apreciacion basada en S-141 Recordatorio para los oradores publicos)`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Error copying text:', err);
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Intro Subtitle Header */}
      <div>
        <h2 className="text-display-sm font-semibold text-on-surface">Historial de Apreciaciones</h2>
        <p className="text-body-medium text-on-surface-variant mt-2">
          Revisa y analiza las observaciones de discursos anteriores para fomentar el crecimiento continuo.
        </p>
      </div>

      {/* Grid Layout: md:12 cols */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left column / Top mobile: evaluations list (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {evaluations.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-outline-variant/30 flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-outline-variant" />
              <p className="text-body-large text-on-surface-variant">No hay apreciaciones en el historial.</p>
            </div>
          ) : (
            evaluations.map((item) => {
              const isActive = activeEval && item.id === activeEval.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`rounded-xl p-4 cursor-pointer transition-all border-l-4 shadow-sm ${
                    isActive
                      ? 'bg-white border-primary border-r border-t border-b border-outline-variant/20 shadow-md ring-1 ring-primary/10'
                      : 'bg-white border-transparent border border-outline-variant/30 opacity-75 hover:opacity-100 hover:bg-surface-container-low'
                  }`}
                  role="button"
                  title={`Seleccionar apreciación de ${item.orador}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-title-lg font-semibold text-on-surface truncate pr-2 max-w-[70%]">
                      {item.orador}
                    </h3>
                    <span className="text-label-medium text-on-surface-variant bg-surface-container py-1 px-2 rounded-md font-medium shrink-0">
                      {item.fecha}
                    </span>
                  </div>
                  <p className="text-body-medium text-text-secondary line-clamp-2 mb-3">
                    {item.tema}
                  </p>
                  <div className={`flex items-center text-label-large font-semibold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                    <span>Ver Resumen</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column / Bottom mobile: Summary details (7 cols) */}
        <div className="md:col-span-7" id="evaluation-summary-section">
          {activeEval ? (
            <div className="bg-white rounded-xl p-6 shadow-md border border-outline-variant/30 relative">
              {/* Header card info */}
              <div className="border-b border-outline-variant/30 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-display-sm font-semibold text-on-surface mb-1">
                    Resumen de Evaluación
                  </h3>
                  <p className="text-body-medium text-text-secondary">
                    {activeEval.orador} - {activeEval.fechaCompleta}
                  </p>
                  {activeEval.congregacion && (
                    <span className="inline-block mt-1 text-xs bg-secondary-container text-on-secondary-container py-0.5 px-2 rounded font-medium">
                      {activeEval.congregacion}
                    </span>
                  )}
                </div>

                {/* Optional delete button to keep list clean */}
                {onDeleteEvaluation && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de que quieres eliminar la evaluación de ${activeEval.orador}?`)) {
                        onDeleteEvaluation(activeEval.id);
                      }
                    }}
                    className="p-2 text-outline-variant hover:text-error hover:bg-error-container/20 transition-colors rounded-full active:scale-95 duration-150"
                    title="Eliminar evaluación"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Breakdown metrics (3 dynamic columns) */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* SI */}
                <div className="bg-success-muted/50 rounded-lg p-4 text-center border border-success-muted/20 shadow-sm">
                  <span className="block text-display-sm font-semibold text-primary mb-1">
                    {totals.si}
                  </span>
                  <span className="text-label-medium text-text-secondary font-medium">✅ Sí</span>
                </div>

                {/* EN PARTE */}
                <div className="bg-warning-muted/50 rounded-lg p-4 text-center border border-warning-muted/20 shadow-sm">
                  <span className="block text-display-sm font-semibold text-tertiary-container mb-1">
                    {totals.parte}
                  </span>
                  <span className="text-label-medium text-text-secondary font-medium">🤔 En parte</span>
                </div>

                {/* POR MEJORAR */}
                <div className="bg-error-container/30 rounded-lg p-4 text-center border border-error-container/20 shadow-sm">
                  <span className="block text-display-sm font-semibold text-error mb-1">
                    {totals.mejorar}
                  </span>
                  <span className="text-label-medium text-text-secondary font-medium">🌱 Por mejorar</span>
                </div>
              </div>

              {/* Comments Sections */}
              <div className="space-y-4">
                <h4 className="text-title-lg font-semibold text-on-surface">Comentarios Destacados</h4>
                
                {/* Punto Fuerte Card */}
                <div className="bg-surface rounded-lg p-4 border border-outline-variant/20 shadow-sm">
                  <h5 className="text-label-large font-semibold text-primary mb-1">Punto Fuerte</h5>
                  <p className="text-body-medium text-text-secondary leading-relaxed">
                    {activeEval.puntoFuerte}
                  </p>
                </div>

                {/* Área de Mejora Card */}
                <div className="bg-surface rounded-lg p-4 border border-outline-variant/20 shadow-sm">
                  <h5 className="text-label-large font-semibold text-tertiary-container mb-1">Área de Mejora</h5>
                  <p className="text-body-medium text-text-secondary leading-relaxed">
                    {activeEval.sugerencia}
                  </p>
                </div>
              </div>

              {/* Share Summary CTA Button */}
              <div className="mt-8">
                <button
                  onClick={handleShare}
                  className={`w-full flex items-center justify-center gap-2 font-label-large text-[14px] font-semibold rounded-xl py-3 px-6 transition-all shadow-sm cursor-pointer ${
                    copied
                      ? 'bg-success-muted text-on-surface border border-primary/20'
                      : 'bg-primary text-on-primary hover:bg-primary/95 active:scale-[0.98]'
                  }`}
                  id="share-summary-btn"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Copiado al portapapeles</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      <span>Compartir Resumen</span>
                    </>
                  )}
                </button>
                {copied && (
                  <p className="text-xs text-green-600 text-center mt-2 animate-fade-in font-medium">
                    ¡Listo! El texto formateado se ha copiado. Puedes pegarlo en WhatsApp o Email.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-outline-variant/30 flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-outline-variant" />
              <p className="text-body-large text-on-surface-variant font-medium">
                Selecciona una apreciación de la lista para ver el resumen completo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
