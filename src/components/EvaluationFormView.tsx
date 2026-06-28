import React, { useState, useEffect } from 'react';
import { Users, Target, BookOpen, Mic, Tv, ClipboardList, Save } from 'lucide-react';
import { RatingValue, EvaluationAnswers } from '../types';
import { FORM_SECTIONS } from '../initialData';

// Mapping icons from string to Lucide component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Users':
      return <Users className="w-5 h-5 text-primary" />;
    case 'Target':
      return <Target className="w-5 h-5 text-primary" />;
    case 'BookOpen':
      return <BookOpen className="w-5 h-5 text-primary" />;
    case 'Mic':
      return <Mic className="w-5 h-5 text-primary" />;
    case 'Tv':
      return <Tv className="w-5 h-5 text-primary" />;
    default:
      return <ClipboardList className="w-5 h-5 text-primary" />;
  }
};

interface EvaluationFormViewProps {
  initialOrador?: string;
  initialCongregacion?: string;
  initialTema?: string;
  onSave: (data: {
    orador: string;
    tema: string;
    congregacion: string;
    respuestas: EvaluationAnswers;
    puntoFuerte: string;
    sugerencia: string;
  }) => void;
}

export default function EvaluationFormView({
  initialOrador = '',
  initialCongregacion = '',
  initialTema = '',
  onSave,
}: EvaluationFormViewProps) {
  const [orador, setOrador] = useState(initialOrador);
  const [tema, setTema] = useState(initialTema);
  const [congregacion, setCongregacion] = useState(initialCongregacion);

  // Initialize all questions to 'si' by default
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
  const [error, setError] = useState('');

  // Keep state in sync with props changes
  useEffect(() => {
    setOrador(initialOrador);
    setTema(initialTema);
    setCongregacion(initialCongregacion);
  }, [initialOrador, initialCongregacion, initialTema]);

  const handleRatingChange = (questionId: keyof EvaluationAnswers, val: RatingValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleSave = () => {
    if (!orador.trim()) {
      setError('Por favor, ingresa el nombre del orador');
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    onSave({
      orador,
      tema,
      congregacion: congregacion || 'Local',
      respuestas: answers,
      puntoFuerte: puntoFuerte || 'Excelente participación y dedicación.',
      sugerencia: sugerencia || 'Continuar practicando con el mismo entusiasmo.',
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header Info Card */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-outline-variant/30">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-label-medium text-on-surface-variant mb-1 block font-medium">Orador</label>
            <input
              type="text"
              value={orador}
              onChange={(e) => {
                setOrador(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              className="w-full bg-surface-container border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 rounded-t-lg font-body-large text-body-large text-on-surface transition-colors placeholder:text-outline"
              placeholder="Nombre del orador"
              autoComplete="off"
            />
            {error && <span className="text-error text-xs mt-1 block">{error}</span>}
          </div>
          <div>
            <label className="text-label-medium text-on-surface-variant mb-1 block font-medium">Tema</label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-full bg-surface-container border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 rounded-t-lg font-body-large text-body-large text-on-surface transition-colors placeholder:text-outline"
              placeholder="Título del discurso"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      {/* Form Sections */}
      {FORM_SECTIONS.map((section) => (
        <section key={section.title} className="bg-white rounded-xl p-4 shadow-sm border border-outline-variant/30">
          <h2 className="text-title-lg text-primary mb-4 pb-2 border-b border-surface-variant flex items-center gap-2 font-semibold">
            {getIconComponent(section.icon)}
            {section.title}
          </h2>

          <div className="flex flex-col gap-6">
            {section.questions.map((q, idx) => {
              const currentVal = answers[q.id];
              return (
                <div key={q.id}>
                  {idx > 0 && <div className="h-px bg-surface-variant w-full mb-5"></div>}
                  <p className="text-body-large text-on-surface mb-3 font-medium">{q.text}</p>
                  
                  {/* Segmented Button Group */}
                  <div className="flex flex-row w-full rounded-lg shadow-sm border border-outline-variant overflow-hidden" role="group">
                    {/* SI BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleRatingChange(q.id, 'si')}
                      className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-2 border-r border-outline-variant last:border-r-0 ${
                        currentVal === 'si'
                          ? 'bg-success-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                          : 'bg-white hover:bg-slate-50 text-text-secondary'
                      }`}
                    >
                      ✅ Sí
                    </button>

                    {/* EN PARTE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleRatingChange(q.id, 'parte')}
                      className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-2 border-r border-outline-variant last:border-r-0 ${
                        currentVal === 'parte'
                          ? 'bg-warning-muted text-on-surface font-semibold ring-1 ring-primary border-primary z-10'
                          : 'bg-white hover:bg-slate-50 text-text-secondary'
                      }`}
                    >
                      🟡 En parte
                    </button>

                    {/* MEJORAR BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleRatingChange(q.id, 'mejorar')}
                      className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-2 border-r border-outline-variant last:border-r-0 ${
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
        </section>
      ))}

      {/* Evaluación General (Textareas) */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-outline-variant/30">
        <h2 className="text-title-lg text-primary mb-4 pb-2 border-b border-surface-variant flex items-center gap-2 font-semibold">
          <ClipboardList className="w-5 h-5 text-primary" />
          Evaluación general
        </h2>

        <div className="flex flex-col gap-5">
          <div className="pb-3 border-b border-surface-variant/30">
            <p className="text-body-large text-on-surface mb-3 font-medium">¿El discurso fue práctico y motivó a aplicar lo aprendido?</p>
            
            {/* Segmented Button Group */}
            <div className="flex flex-row w-full rounded-lg shadow-sm border border-outline-variant overflow-hidden" role="group">
              <button
                type="button"
                onClick={() => handleRatingChange('practicoMotivador', 'si')}
                className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-2 border-r border-outline-variant last:border-r-0 ${
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
                className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-2 border-r border-outline-variant last:border-r-0 ${
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
                className={`flex-1 py-2 px-3 text-center cursor-pointer transition-all text-body-medium font-medium flex items-center justify-center gap-2 border-r border-outline-variant last:border-r-0 ${
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
            <label className="text-label-large text-on-surface-variant mb-2 block font-medium">¿Cuál fue el punto más fuerte del orador?</label>
            <textarea
              value={puntoFuerte}
              onChange={(e) => setPuntoFuerte(e.target.value)}
              className="w-full bg-surface-bright border-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 rounded-lg font-body-large text-body-large text-on-surface transition-colors placeholder:text-[#8E9199] resize-none focus:outline-none"
              placeholder="Describe lo que más destacó..."
              rows={3}
            />
          </div>
          <div>
            <label className="text-label-large text-on-surface-variant mb-2 block font-medium">¿Cuál sería la principal sugerencia para mejorar?</label>
            <textarea
              value={sugerencia}
              onChange={(e) => setSugerencia(e.target.value)}
              className="w-full bg-surface-bright border-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 rounded-lg font-body-large text-body-large text-on-surface transition-colors placeholder:text-[#8E9199] resize-none focus:outline-none"
              placeholder="Una recomendación constructiva..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Guardar Button (FAB desktop and relative block) */}
      <div className="w-full flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-primary text-on-primary font-label-large text-[14px] font-semibold px-6 py-4 rounded-xl shadow-md hover:shadow-lg hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center"
          id="form-save-btn"
        >
          <Save className="w-5 h-5 fill-current" />
          Guardar apreciación
        </button>
      </div>
    </div>
  );
}
