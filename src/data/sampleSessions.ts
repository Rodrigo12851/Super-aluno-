import { StudySession } from '../types';

export const SAMPLE_STUDY_SESSIONS: StudySession[] = [
  {
    id: 'sample-biologia-1',
    title: 'Biologia Celular: Respiração Celular e Mitocôndrias',
    createdAt: new Date().toISOString(),
    fileType: 'pdf',
    fileName: 'Aula_Respiração_Celular_Glicolise_Krebs.pdf',
    target: 'vestibular',
    difficulty: 'medio',
    contentExcerpt: 'A respiração celular é o processo de conversão de energia química presente na glicose em ATP...',
    summary: {
      title: 'Respiração Celular Aeróbica e Rendimento Energético',
      subject: 'Biologia Celular',
      overview: 'A respiração celular é o processo metabólico fundamental em que a célula degrada moléculas orgânicas (principalmente glicose) na presença de O2 para sintetizar ATP. É dividida em três etapas principais: Glicólise (hialoplasma), Ciclo de Krebs (matriz mitocondrial) e Cadeia Respiratória / Fosforilação Oxidativa (cristas mitocondriais).',
      keyConcepts: [
        {
          id: 'kc-1',
          title: 'Glicólise',
          description: 'Etapa anaeróbica no hialoplasma/citosol. A glicose (6C) é quebrada em 2 piruvatos (3C), gerando saldo líquido de 2 ATP e 2 NADH.',
          importance: 'alta',
          timestampOrRef: 'Pág. 2 / Min 08:30'
        },
        {
          id: 'kc-2',
          title: 'Ciclo de Krebs (Ciclo do Ácido Cítrico)',
          description: 'Ocorre na matriz mitocondrial. O piruvato entra como Acetil-CoA e se une ao oxaloacetato para formar citrato. Libera CO2 e produz NADH, FADH2 e GTP/ATP.',
          importance: 'alta',
          timestampOrRef: 'Pág. 5 / Min 22:15'
        },
        {
          id: 'kc-3',
          title: 'Cadeia Respiratória (Fosforilação Oxidativa)',
          description: 'Ocorre nas cristas mitocondriais. Maior produtora de ATP pela enzima ATP sintase movida por gradiente de prótons H+. O Oxigênio é o aceptor final de elétrons, formando água.',
          importance: 'alta',
          timestampOrRef: 'Pág. 8 / Min 41:00'
        },
        {
          id: 'kc-4',
          title: 'Fermentação vs Respiração',
          description: 'Na ausência de O2, ocorre fermentação (lática ou alcoólica) com rendimento energético muito menor (apenas 2 ATPs da glicólise).',
          importance: 'media',
          timestampOrRef: 'Pág. 11 / Min 55:20'
        }
      ],
      outline: [
        {
          title: '1. Introdução à Bioenergética Celular',
          keyPoints: [
            'O ATP é a moeda energética universal das células.',
            'Células eucarióticas utilizam as mitocôndrias para maximizar a extração de energia.',
            'Equação geral: C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + ATP.'
          ],
          timestampOrRef: 'Seção 1.1'
        },
        {
          title: '2. Etapas Detalhadas',
          keyPoints: [
            'Glicólise: Fases de investimento e de rendimento de ATP.',
            'Descarboxilação do Piruvato pela Piruvato Desidrogenase.',
            'Ciclo de Krebs: Oxidação de intermediários e regeneração do oxaloacetato.',
            'Cadeia transportadora: Complexos I a IV e quimiosmose de Peter Mitchell.'
          ],
          timestampOrRef: 'Seção 1.2'
        },
        {
          title: '3. Rendimento e Saldo Energético',
          keyPoints: [
            'Glicólise: 2 ATP + 2 NADH.',
            'Ciclo de Krebs (2 voltas): 2 ATP + 6 NADH + 2 FADH2 + 4 CO2.',
            'Cadeia Respiratória: ~26-28 ATPs.',
            'Total aproximado: 30 a 32 ATPs por molécula de glicose.'
          ],
          timestampOrRef: 'Seção 1.3'
        }
      ],
      keyQuotes: [
        '"O oxigênio não entra no Ciclo de Krebs diretamente, mas atua como o aceptor final de elétrons na crista mitocondrial, evitando o colapso da cadeia."',
        '"Sem o gradiente de prótons (H+) no espaço intermembranas, a ATP sintase não consegue girar para fosforilar o ADP em ATP."'
      ],
      examWarnings: [
        'Cai muito no ENEM: Confundir local das etapas! Glicólise = citosol; Ciclo de Krebs = matriz; Cadeia = cristas.',
        'Atenção: O oxigênio NÃO produz o CO2! O CO2 vem da descarboxilação da glicose no Ciclo de Krebs. O oxigênio forma ÁGUA.',
        'Vetos e Inibidores: Cianeto e Monóxido de Carbono travam o Complexo IV da cadeia respiratória.'
      ],
      studyTips: [
        'Desenhe o esquema da mitocôndria indicando o caminho dos elétrons e o acúmulo de H+.',
        'Memorize a sequência dos receptores de elétrons (NADH -> Complexo I -> Coenzima Q -> Citocromo c -> Oxigênio).'
      ]
    },
    flashcards: [
      {
        id: 'fc-1',
        front: 'Onde ocorre a Glicólise na célula e qual seu saldo líquido de ATP?',
        back: 'Ocorre no citosol (hialoplasma). O saldo líquido é de 2 ATPs e 2 NADHs por molécula de glicose.',
        category: 'Glicólise',
        difficulty: 'fácil',
        status: 'learning',
        hint: 'Pensar na etapa fora da mitocôndria.'
      },
      {
        id: 'fc-2',
        front: 'Qual é a função do Oxigênio (O2) na respiração celular aeróbica?',
        back: 'O oxigênio atua como o ACEPTOR FINAL de elétrons e prótons (H+) na cadeia respiratória, ligando-se a eles para formar água (H2O).',
        category: 'Cadeia Respiratória',
        difficulty: 'médio',
        status: 'learning',
        hint: 'O que acontece no final da cadeia transportadora de elétrons?'
      },
      {
        id: 'fc-3',
        front: 'Em qual compartimento da mitocôndria ocorre o Ciclo de Krebs?',
        back: 'Na MATRIZ MITOCONDRIAL (fluido interno contendo enzimas solúveis, DNA e ribossomos mitocondriais).',
        category: 'Ciclo de Krebs',
        difficulty: 'fácil',
        status: 'mastered',
        hint: 'Não é na crista.'
      },
      {
        id: 'fc-4',
        front: 'Como a ATP Sintase produz ATP na fosforilação oxidativa?',
        back: 'Através da força proton-motora (quimiosmose): o fluxo de H+ acumulados no espaço intermembranas retornando à matriz mitocondrial faz a ATP sintase rotacionar, fosforilando ADP + Pi em ATP.',
        category: 'Bioenergética',
        difficulty: 'difícil',
        status: 'review',
        hint: 'Lembre do gradiente elétrico de H+.'
      },
      {
        id: 'fc-5',
        front: 'Por que a fermentação lática gera dor muscular e menos energia?',
        back: 'Porque ocorre na ausência de O2, interrompendo Krebs e a Cadeia. Produz apenas 2 ATPs da glicólise e o acúmulo de ácido lático (lactato) reduz o pH do tecido muscular.',
        category: 'Fermentação',
        difficulty: 'médio',
        status: 'learning',
        hint: 'Rendimento anaeróbico.'
      }
    ],
    quiz: [
      {
        id: 'qz-1',
        question: 'Assinale a alternativa correta sobre o local onde ocorrem as etapas da respiração celular em células eucarióticas:',
        options: [
          'Glicólise nas cristas mitocondriais, Ciclo de Krebs na matriz e Cadeia no citosol.',
          'Glicólise no citosol, Ciclo de Krebs na matriz mitocondrial e Cadeia nas cristas mitocondriais.',
          'Glicólise na matriz mitocondrial, Ciclo de Krebs no citosol e Cadeia nos ribossomos.',
          'Todas as etapas ocorrem integralmente no interior do núcleo celular.'
        ],
        correctAnswerIndex: 1,
        explanation: 'A glicólise é anaeróbica e ocorre no citosol/hialoplasma. O Ciclo de Krebs ocorre no fluido da matriz mitocondrial e a Cadeia Respiratória nas dobras das cristas mitocondriais.',
        topic: 'Localização Celular'
      },
      {
        id: 'qz-2',
        question: 'Qual a origem do dióxido de carbono (CO2) liberado na respiração celular?',
        options: [
          'Da reação do oxigênio inalado com o hidrogênio dos alimentos.',
          'Da quebra das cadeias de carbono do piruvato e intermediários do Ciclo de Krebs.',
          'Da fotólise da água na membrana interna mitocondrial.',
          'Do consumo de ATP durante a fosforilação oxidativa.'
        ],
        correctAnswerIndex: 1,
        explanation: 'O CO2 é fruto do processo de descarboxilação metabólica do piruvato/Acetil-CoA durante a transição e o Ciclo de Krebs.',
        topic: 'Origem do CO2'
      },
      {
        id: 'qz-3',
        question: 'O cianeto é uma substância altamente tóxica porque bloqueia o transporte de elétrons na cadeia respiratória. Qual o efeito primário desse bloqueio?',
        options: [
          'Aumento imediato da produção de oxigênio pela célula.',
          'Interrupção da síntese de ATP por fosforilação oxidativa e colapso energético.',
          'Aceleração do Ciclo de Krebs em 100%.',
          'Conversão instantânea de mitocôndrias em cloroplastos.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Sem o fluxo de elétrons na cadeia respiratória, cessa o bombeamento de H+, a ATP Sintase para de funcionar e a célula fica sem ATP.',
        topic: 'Inibidores Metabólicos'
      }
    ],
    studyPlan: [
      {
        day: 1,
        title: 'Revisão da Glicólise e Citosol',
        tasks: ['Ler a seção 1 do resumo', 'Praticar os flashcards de Glicólise (cards 1 e 5)', 'Resolver questão 1 do quiz'],
        estimatedMinutes: 25,
        focusArea: 'Glicólise'
      },
      {
        day: 2,
        title: 'Ciclo de Krebs e Matriz',
        tasks: ['Mapear os compostos de 6C, 5C e 4C', 'Revisar flashcard 3', 'Explicar o ciclo em voz alta sem olhar a nota'],
        estimatedMinutes: 30,
        focusArea: 'Ciclo de Krebs'
      },
      {
        day: 3,
        title: 'Cadeia Respiratória e ATP Sintase',
        tasks: ['Desenhar a membrana da crista', 'Revisar flashcards 2 e 4', 'Resolver questão 3 do quiz'],
        estimatedMinutes: 35,
        focusArea: 'Fosforilação'
      },
      {
        day: 5,
        title: 'Simulado de Questões e Pegadinhas',
        tasks: ['Refazer o quiz completo', 'Revisar a seção de Pegadinhas ("Cai no ENEM")', 'Tirar dúvidas no Tutor IA'],
        estimatedMinutes: 20,
        focusArea: 'Fixação'
      },
      {
        day: 7,
        title: 'Revisão Espaçada Final',
        tasks: ['Repassar os flashcards categorizados como "Difícil"', 'Consolidar mapa mental'],
        estimatedMinutes: 15,
        focusArea: 'Memória de Longo Prazo'
      }
    ],
    chatHistory: [
      {
        id: 'c-1',
        sender: 'ai',
        text: 'Olá! Já processei sua aula sobre Respiração Celular. Você pode me perguntar qualquer dúvida sobre a Glicólise, Ciclo de Krebs, Cadeia Respiratória ou pedir questões inéditas!',
        timestamp: '10:00'
      }
    ]
  },
  {
    id: 'sample-direito-1',
    title: 'Direito Constitucional: Direitos e Garantias Fundamentais (Art. 5º)',
    createdAt: new Date().toISOString(),
    fileType: 'audio',
    fileName: 'Gravação_Aula_Direito_Constitucional_Art5.mp3',
    target: 'concurso',
    difficulty: 'avancado',
    contentExcerpt: 'Análise aprofundada dos remédios constitucionais e cláusulas pétreas do artigo 5º da CF/88...',
    summary: {
      title: 'Direitos Individuais e Coletivos & Remédios Constitucionais',
      subject: 'Direito Constitucional',
      overview: 'Estudo essencial para concursos públicos do artigo 5º da Constituição Federal de 1988. Abrange a aplicabilidade imediata das normas definidoras de direitos fundamentais, o rol exemplificativo, o princípio da igualdade e as especificidades dos Remédios Constitucionais (Habeas Corpus, Habeas Data, Mandado de Segurança, Mandado de Injunção e Ação Popular).',
      keyConcepts: [
        {
          id: 'dc-1',
          title: 'Aplicabilidade das Normas (Art. 5º, § 1º)',
          description: 'As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata.',
          importance: 'alta',
          timestampOrRef: 'Min 12:40'
        },
        {
          id: 'dc-2',
          title: 'Inviolabilidade do Domicílio (Art. 5º, XI)',
          description: 'A casa é asilo inviolável. Exceções: consentimento, flagrante delito, desastre, prestar socorro (qualquer horário) ou determinação judicial (APENAS DURANTE O DIA).',
          importance: 'alta',
          timestampOrRef: 'Min 28:10'
        },
        {
          id: 'dc-3',
          title: 'Habeas Data vs Habeas Corpus',
          description: 'Habeas Corpus protege a liberdade de locomoção. Habeas Data garante o acesso/retificação de informações pessoais em bancos de dados de caráter público.',
          importance: 'alta',
          timestampOrRef: 'Min 48:00'
        }
      ],
      outline: [
        {
          title: '1. Princípios Fundamentais e Direito à Vida',
          keyPoints: [
            'Princípio da Isonomia/Igualdade: tratar igualmente os iguais e desigualmente os desiguais.',
            'Direito à vida abrange vida digna e proibição de pena de morte (salvo em caso de guerra declarada).'
          ]
        },
        {
          title: '2. Remédios Constitucionais em Espécie',
          keyPoints: [
            'Mandado de Segurança (MS): protege direito líquido e certo não amparado por HC ou HD.',
            'Mandado de Injunção (MI): supre falta de norma regulamentadora que inviabilize o exercício de direito.',
            'Ação Popular: qualquer cidadão é parte legítima para anular ato lesivo ao patrimônio público ou meio ambiente.'
          ]
        }
      ],
      keyQuotes: [
        '"Não confunda: o Habeas Data exige a comprovação prévia da recusa administrativa na via extrajudicial para ser conhecido no Judiciário (Súmula 2 do STJ)."'
      ],
      examWarnings: [
        'PECADINHA TÍPICA BANCA CESPE/FGV: Mandado de Segurança exige prova pré-constituída (não admite dilação probatória).',
        'Cuidado: Habeas Corpus e Habeas Data SÃO GRATUITOS. Já o Mandado de Segurança exige custas processuais.',
        'A Inviolabilidade de Domicílio por determinação judicial só pode ocorrer DURANTE O DIA (conceito físico/astronômico ou horário de 6h às 18h segundo jurisprudência).'
      ],
      studyTips: [
        'Crie uma tabela comparativa com Gratuidade, Legitimação e Objeto de cada remédio constitucional.'
      ]
    },
    flashcards: [
      {
        id: 'fdc-1',
        front: 'Quais remédios constitucionais são estritamente GRATUITOS segundo a CF/88?',
        back: 'Habeas Corpus (HC) e Habeas Data (HD), além das ações necessárias ao exercício da cidadania na forma da lei.',
        category: 'Remédios Constitucionais',
        difficulty: 'fácil',
        status: 'mastered',
        hint: 'Lembre da regra HC e HD.'
      },
      {
        id: 'fdc-2',
        front: 'Quando a casa pode ser adentrada por DETERMINAÇÃO JUDICIAL sem o consentimento do morador?',
        back: 'Somente DURANTE O DIA. (Para flagrante, desastre ou socorro, pode ser de dia ou de noite).',
        category: 'Inviolabilidade de Domicílio',
        difficulty: 'médio',
        status: 'learning',
        hint: 'Cuidado com a regra de horário.'
      },
      {
        id: 'fdc-3',
        front: 'Qual o remédio constitucional cabível diante do descumprimento do dever de legislar que impede o exercício de direito constitucional?',
        back: 'Mandado de Injunção (MI).',
        category: 'Remédios Constitucionais',
        difficulty: 'médio',
        status: 'learning',
        hint: 'Omissão legislativa.'
      }
    ],
    quiz: [
      {
        id: 'qdc-1',
        question: 'Pedro teve negado pelo órgão público municipal o acesso às informações de seus dados fiscais. Ele ingressou com requerimento extrajudicial e teve recusa formal. Qual o remédio constitucional adequado?',
        options: [
          'Habeas Corpus',
          'Mandado de Segurança',
          'Habeas Data',
          'Ação Popular'
        ],
        correctAnswerIndex: 2,
        explanation: 'O Habeas Data destina-se a assegurar o conhecimento de informações relativas à pessoa do impetrante constantes de registros ou bancos de dados de entidades governamentais.',
        topic: 'Habeas Data'
      }
    ],
    studyPlan: [
      {
        day: 1,
        title: 'Estudo do Art. 5º da CF/88 (I ao XXX)',
        tasks: ['Ler resumo de Direitos Fundamentais', 'Fazer os 3 flashcards'],
        estimatedMinutes: 30,
        focusArea: 'Artigo 5º'
      }
    ],
    chatHistory: []
  }
];
