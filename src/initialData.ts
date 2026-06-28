import { Evaluation, SectionDefinition } from './types';

export const INITIAL_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-1',
    orador: 'Miguel Ángel',
    tema: 'Siga buscando primero el Reino de Dios',
    congregacion: 'Congregación Norte',
    fecha: '12 Nov',
    fechaCompleta: '12 Noviembre 2025',
    respuestas: {
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
      practicoMotivador: 'parte'
    },
    puntoFuerte: 'Excelente contacto visual y una introducción muy cálida que capturó la atención de todo el auditorio desde el primer minuto.',
    sugerencia: 'Tratar de dedicar un par de minutos más a la conclusión para resumir los puntos principales con mayor fuerza.'
  },
  {
    id: 'eval-2',
    orador: 'Carlos Ruiz',
    tema: 'Cómo nos beneficia la sabiduría piadosa',
    congregacion: 'Congregación Sur',
    fecha: '05 Nov',
    fechaCompleta: '05 Noviembre 2025',
    respuestas: {
      facilEntender: 'si',
      adaptadoTestigos: 'si',
      mensajePositivo: 'si',
      beneficiosPrincipios: 'parte',
      evitoDespectivos: 'si',
      cantidadAdecuada: 'si',
      desarrolloTextos: 'si',
      naturalidad: 'si',
      entusiasmoCalidez: 'si',
      ayudasReforzaron: 'mejorar',
      ayudasApropiadas: 'mejorar',
      practicoMotivador: 'si'
    },
    puntoFuerte: 'Muy buenas ilustraciones de la vida cotidiana para explicar conceptos profundos de manera sencilla y accesible.',
    sugerencia: 'Considerar el uso de imágenes o diapositivas para apoyar el punto sobre la aplicación de principios bíblicos en el trabajo.'
  },
  {
    id: 'eval-3',
    orador: 'Carlos Mendoza',
    tema: 'El papel de la paciencia en nuestra fe',
    congregacion: 'Congregación Central',
    fecha: '15 Oct',
    fechaCompleta: '15 Octubre 2023',
    respuestas: {
      facilEntender: 'si',
      adaptadoTestigos: 'si',
      mensajePositivo: 'si',
      beneficiosPrincipios: 'si',
      evitoDespectivos: 'si',
      cantidadAdecuada: 'si',
      desarrolloTextos: 'si',
      naturalidad: 'si',
      entusiasmoCalidez: 'si',
      ayudasReforzaron: 'parte',
      ayudasApropiadas: 'mejorar',
      practicoMotivador: 'si'
    },
    puntoFuerte: 'Excelente uso de ilustraciones bíblicas. La comparación sobre la paciencia del agricultor resonó muy bien con la audiencia principal.',
    sugerencia: 'El volumen fluctuó en la segunda mitad del discurso. Sería útil mantener una proyección de voz más constante para las filas traseras.'
  },
  {
    id: 'eval-4',
    orador: 'Ana Rivera',
    tema: 'Fortaleciendo los lazos familiares',
    congregacion: 'Congregación Este',
    fecha: '08 Oct',
    fechaCompleta: '08 Octubre 2023',
    respuestas: {
      facilEntender: 'si',
      adaptadoTestigos: 'si',
      mensajePositivo: 'si',
      beneficiosPrincipios: 'si',
      evitoDespectivos: 'si',
      cantidadAdecuada: 'parte',
      desarrolloTextos: 'si',
      naturalidad: 'si',
      entusiasmoCalidez: 'si',
      ayudasReforzaron: 'si',
      ayudasApropiadas: 'si',
      practicoMotivador: 'si'
    },
    puntoFuerte: 'Muy buena empatía al inicio del discurso, logrando conectar inmediatamente con los padres de familia.',
    sugerencia: 'Explicar con un poco más de detalle la aplicación práctica de los textos de Colosenses para los jóvenes.'
  },
  {
    id: 'eval-5',
    orador: 'David Lopez',
    tema: 'Lecciones del Sermón del Monte',
    congregacion: 'Congregación Oeste',
    fecha: '01 Oct',
    fechaCompleta: '01 Octubre 2023',
    respuestas: {
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
      practicoMotivador: 'si'
    },
    puntoFuerte: 'Excelente entonación y claridad en la lectura de las Escrituras. El bosquejo se siguió con mucha facilidad.',
    sugerencia: 'Considerar el uso de alguna ayuda visual digital sencilla para apoyar el tercer punto principal.'
  }
];

export const FORM_SECTIONS: SectionDefinition[] = [
  {
    title: 'Auditorio',
    icon: 'Users',
    questions: [
      {
        id: 'facilEntender',
        text: '¿El discurso fue fácil de entender para personas recién interesadas o estudiantes de la Biblia?'
      },
      {
        id: 'adaptadoTestigos',
        text: 'Si la mayoría del auditorio eran Testigos, ¿se adaptó bien para animar y enseñar alguna perla espiritual?'
      }
    ]
  },
  {
    title: 'Enfoque del mensaje',
    icon: 'Target',
    questions: [
      {
        id: 'mensajePositivo',
        text: '¿Se centró en el mensaje positivo y alentador de la Biblia?'
      },
      {
        id: 'beneficiosPrincipios',
        text: '¿Destacó los beneficios de aplicar los principios bíblicos?'
      },
      {
        id: 'evitoDespectivos',
        text: '¿Evitó comentarios despectivos sobre quienes no son Testigos, sus creencias o su estilo de vida?'
      }
    ]
  },
  {
    title: 'Uso de la Biblia',
    icon: 'BookOpen',
    questions: [
      {
        id: 'cantidadAdecuada',
        text: '¿Se usó una cantidad adecuada de textos bíblicos?'
      },
      {
        id: 'desarrolloTextos',
        text: '¿Los textos se desarrollaron bien (explicación, ilustración y aplicación)?'
      }
    ]
  },
  {
    title: 'Presentación',
    icon: 'Mic',
    questions: [
      {
        id: 'naturalidad',
        text: '¿Habló con naturalidad, sin depender del bosquejo o leer el discurso?'
      },
      {
        id: 'entusiasmoCalidez',
        text: '¿Mostró entusiasmo, calidez y genuino interés por el auditorio?'
      }
    ]
  },
  {
    title: 'Ayudas visuales',
    icon: 'Tv',
    questions: [
      {
        id: 'ayudasReforzaron',
        text: '¿Las ayudas visuales reforzaron las ideas principales?'
      },
      {
        id: 'ayudasApropiadas',
        text: '¿Las ayudas visuales ayudaron a enseñar y fueron apropiadas?'
      }
    ]
  }
];
