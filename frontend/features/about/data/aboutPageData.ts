export type AboutCard = {
  title: string
  description: string
  icon?: string
}

export type AboutHeroContent = {
  title: string
  subtitle: string
  primaryActionLabel: string
  primaryActionHref: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
}

export const aboutPageData = {
  visitor: {
    hero: {
      title: 'Aprenda no seu ritmo com apoio de inteligencia artificial.',
      subtitle:
        'A AtenaAI e uma plataforma educacional conversacional que combina tutoria inteligente, trilhas adaptativas e contexto de sala de aula para apoiar alunos e professores no processo de aprendizagem.',
      primaryActionLabel: 'Comecar agora',
      primaryActionHref: '/cadastro',
      secondaryActionLabel: 'Explorar a plataforma',
      secondaryActionHref: '/',
    } as AboutHeroContent,
    problem: [
      {
        icon: '📉',
        title: 'Baixa personalizacao',
        description: 'Estudantes com niveis diferentes recebem o mesmo conteudo e ritmo.',
      },
      {
        icon: '⏱',
        title: 'Ritmo rigido',
        description: 'Quem tem dificuldade fica para tras e alunos avancados perdem engajamento.',
      },
      {
        icon: '😴',
        title: 'Baixo envolvimento',
        description: 'Modelos passivos dificultam curiosidade, autonomia e continuidade do estudo.',
      },
    ] as AboutCard[],
    solution:
      'A AtenaAI funciona como um tutor de inteligencia artificial integrado ao contexto educacional, ajudando estudantes a compreender conceitos, revisar conteudos e evoluir progressivamente.',
    features: [
      {
        icon: '🧠',
        title: 'Tutor de IA',
        description: 'Explicacoes claras e revisao de exercicios.',
      },
      {
        icon: '📊',
        title: 'Aprendizagem adaptativa',
        description: 'Respostas ajustadas ao nivel e historico do estudante.',
      },
      {
        icon: '🏫',
        title: 'Salas e turmas',
        description: 'Organizacao de estudantes e acompanhamento pedagogico.',
      },
      {
        icon: '💬',
        title: 'Aprender por dialogo',
        description: 'Estudantes exploram ideias fazendo perguntas e testando hipoteses.',
      },
    ] as AboutCard[],
    differentialItems: [
      'contexto educacional',
      'historico de aprendizado',
      'organizacao por turmas',
      'acompanhamento pedagogico',
    ],
    audience: [
      {
        icon: '👨‍🎓',
        title: 'Estudantes',
        description: 'Aprenda no seu ritmo e tire duvidas de forma continua.',
      },
      {
        icon: '👩‍🏫',
        title: 'Professores',
        description: 'Organize turmas e utilize IA como apoio pedagogico.',
      },
    ] as AboutCard[],
    mission: 'Democratizar o acesso ao aprendizado assistido por inteligencia artificial.',
    vision:
      'Construir uma experiencia de aprendizado contextualizada, humana e eficaz para toda a comunidade educacional.',
    ctaTitle: 'Descubra uma nova forma de aprender com inteligencia artificial.',
    ctaDescription: 'Comece hoje e veja como o aprendizado conversacional acelera sua evolucao.',
    ctaPrimaryLabel: 'Criar conta',
    ctaPrimaryHref: '/cadastro',
  },
  user: {
    title: 'Sobre a AtenaAI',
    intro:
      'A AtenaAI e uma plataforma educacional baseada em inteligencia artificial projetada para apoiar estudantes e professores atraves de aprendizado conversacional.',
    systemCombines: ['tutoria inteligente', 'contexto de sala de aula', 'trilhas adaptativas'],
    canDo: [
      '🧠 Tirar duvidas com o tutor de IA',
      '📚 Explorar trilhas de aprendizado',
      '🏫 Participar de salas e turmas',
      '📈 Evoluir com acompanhamento continuo',
    ],
    philosophy:
      'Acreditamos que a tecnologia deve ampliar o processo educacional, nao substitui-lo. A IA atua como ferramenta de apoio para estimular autonomia, curiosidade e pensamento critico.',
    ctas: [
      { label: 'Ir para o chat', href: '/' },
      { label: 'Explorar trilhas', href: '/scholar' },
    ],
  },
  student: {
    title: 'Bem-vindo a AtenaAI',
    intro:
      'A AtenaAI foi criada para ajudar voce a aprender de forma mais eficiente atraves de inteligencia artificial.',
    uses: ['tirar duvidas', 'revisar conteudos', 'praticar exercicios', 'explorar novos temas'],
    tips: [
      {
        icon: '💬',
        title: 'Faca perguntas',
        description: 'Explique suas duvidas e peca exemplos.',
      },
      {
        icon: '📚',
        title: 'Revise conteudos',
        description: 'Peca explicacoes mais simples ou mais profundas.',
      },
      {
        icon: '🧠',
        title: 'Teste hipoteses',
        description: 'Tente resolver problemas e peca feedback.',
      },
      {
        icon: '📈',
        title: 'Aprenda progressivamente',
        description: 'Avance passo a passo nas trilhas de aprendizado.',
      },
    ] as AboutCard[],
    importantTip:
      'A IA funciona melhor quando voce explica sua duvida, mostra seu raciocinio e pede exemplos ou exercicios.',
    ctaLabel: 'Comecar conversa',
    ctaHref: '/',
  },
}
