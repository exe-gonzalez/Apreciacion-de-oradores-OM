export type RatingValue = 'si' | 'parte' | 'mejorar';

export interface EvaluationAnswers {
  facilEntender: RatingValue;
  adaptadoTestigos: RatingValue;
  mensajePositivo: RatingValue;
  beneficiosPrincipios: RatingValue;
  evitoDespectivos: RatingValue;
  cantidadAdecuada: RatingValue;
  desarrolloTextos: RatingValue;
  naturalidad: RatingValue;
  entusiasmoCalidez: RatingValue;
  ayudasReforzaron: RatingValue;
  ayudasApropiadas: RatingValue;
  practicoMotivador: RatingValue;
}

export interface Evaluation {
  id: string;
  orador: string;
  tema: string;
  congregacion: string;
  fecha: string;          // e.g., "15 Oct"
  fechaCompleta: string;  // e.g., "15 Octubre 2023"
  respuestas: EvaluationAnswers;
  puntoFuerte: string;
  sugerencia: string;
}

export interface SharedSession {
  id: string;
  orador: string;
  tema: string;
  congregacion: string;
  fecha: string;
  fechaCompleta: string;
  status: 'active' | 'finalized';
  adminToken: string; // token of the creator
  createdAt: string; // ISO string
}

export interface EvaluationSubmission {
  id: string;
  respuestas: EvaluationAnswers;
  puntoFuerte: string;
  sugerencia: string;
  userToken: string; // token of the submitter
  createdAt: string; // ISO string
}

export interface QuestionDefinition {
  id: keyof EvaluationAnswers;
  text: string;
}

export interface SectionDefinition {
  title: string;
  icon: string; // lucide icon identifier
  questions: QuestionDefinition[];
}

