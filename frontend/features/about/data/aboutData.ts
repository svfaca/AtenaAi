export type AboutContact = {
  label: string
  value: string
  href: string
}

export const aboutData = {
  hero: {
    title: 'Aprenda mais rapido com inteligencia artificial',
    subtitle:
      'AtenaAI e uma plataforma educacional para potencializar o aprendizado de estudantes e professores com apoio etico de IA.',
  },
  problem: {
    title: 'O problema atual da educacao',
    paragraphs: [
      'O ensino tradicional ainda possui baixa personalizacao para ritmos e estilos diferentes de aprendizagem.',
      'Muitas ferramentas de IA entregam respostas prontas e enfraquecem o desenvolvimento do pensamento critico.',
    ],
  },
  solution: {
    title: 'A solucao da AtenaAI',
    text: 'Uma IA que explica, orienta e adapta a jornada sem substituir o papel do professor e sem retirar autonomia do estudante.',
  },
  mission: 'Democratizar o acesso a uma educacao assistida por IA, responsavel e centrada no aprendizado real.',
  vision: 'Ser referencia em apoio educacional inteligente para escolas, universidades e projetos de formacao continua.',
  values: [
    'Etica e transparencia no uso da IA',
    'Aprendizado ativo com pensamento critico',
    'Professor como protagonista pedagogico',
    'Tecnologia acessivel e inclusiva',
  ],
  creator: {
    name: 'Savio Emmanuel',
    bio: 'Criado por Savio Emmanuel, estudante de Ciencias Computacionais, com o objetivo de democratizar o acesso a educacao assistida por IA.',
    imageSrc: '/assets/images/pic.png',
  },
  cta: {
    title: 'Junte-se a esta ideia',
    description: 'Crie sua conta e descubra uma nova forma de aprender com responsabilidade e autonomia.',
    signupButton: 'Comecar agora',
    loginButton: 'Entrar',
    backButton: 'Voltar ao dashboard',
  },
  footer: '© 2026 AtenaAI - Projeto educacional e experimental.',
  contacts: [
    {
      label: 'Email',
      value: 'savioemmanuelsc@gmail.com',
      href: 'mailto:savioemmanuelsc@gmail.com',
    },
    {
      label: 'GitHub',
      value: '@svfaca',
      href: 'https://github.com/svfaca',
    },
    {
      label: 'LinkedIn',
      value: 'Savio Emmanuel',
      href: 'https://www.linkedin.com/in/savio-emmanuel/',
    },
  ] as AboutContact[],
}
