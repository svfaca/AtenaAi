'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

interface UserData {
  id?: number;
  role?: 'scholar' | 'teacher' | 'admin';
  full_name?: string;
}

const DEFAULT_I18N = {
  about: {
    title: 'Quem Somos',
    description: 'AtenaAI é uma plataforma educacional inteligente',
    greeting: 'Olá!',
    introName: 'Meu nome é <strong>Sávio Emmanuel</strong>, estudante de Ciência da Computação, com interesse em desenvolvimento de software, inteligência artificial e educação.',
    introBelief: 'Acredito que a IA deve ser uma ferramenta de apoio ao aprendizado — nunca um atalho para evitá-lo. Este projeto nasce dessa visão: unir tecnologia, ética e educação de forma responsável e transparente.',
    whyTitle: '🎓 Por que este projeto existe?',
    whyPara1: 'A Inteligência Artificial generativa é uma tecnologia recente e ainda em processo de adaptação, especialmente em ambientes tradicionais como o acadêmico.',
    whyPara2: 'No contexto universitário, seu uso pode ser ignorado, proibido ou penalizado, dependendo da instituição, da disciplina ou da abordagem do professor.',
    whyPara3: 'Muitos chatbots ultrapassam o limite entre apoiar o aprendizado e realizar o trabalho por completo, o que gera desconfiança e resistência por parte de educadores.',
    whyPara4: 'Este projeto surge como uma alternativa equilibrada: uma IA educativa, ética e transparente, que respeita o papel do professor, incentiva o pensamento crítico do aluno e promove aprendizado real.',
    whatIntro: 'Um assistente acadêmico com IA, desenvolvido para apoiar — e não substituir — o processo de aprendizagem. A proposta é oferecer auxílio responsável, adaptado a diferentes contextos educacionais.',
    freeStudents: 'Estudantes livres',
    freeStudentsDesc: 'Acesso controlado à IA para estudos independentes e revisão de conteúdos.',
    classStudents: 'Alunos de turma',
    classStudentsDesc: 'Uso da IA como explicadora, com limites definidos pelo professor.',
    teachers: 'Professores',
    teachersDesc: 'Visão de controle e acompanhamento do uso da IA no processo educacional.',
    motto: 'Aprender com autonomia, mas nunca sozinho.',
    contactTitle: '📬 Entre em contato',
    contactSubtitle: 'Dúvidas, sugestões ou interesse em colaborar? Escolha o melhor canal para conversarmos!',
    emailLabel: 'Email',
    emailAddress: 'savioemmanuelsc@gmail.com',
    githubLabel: 'GitHub',
    githubUrl: 'https://github.com/svfaca',
    linkedinLabel: 'LinkedIn',
    linkedinUrl: 'https://www.linkedin.com/in/savio-emmanuel/',
    websiteLabel: 'Website Pessoal',
    websiteUrl: 'https://www.savioemmanuel.com.br/',
  },
  auth: {
    student: 'Estudante',
    teacher: 'Professor',
  },
  cta: {
    joinTitle: 'Junte-se a esta ideia',
    joinText: 'Crie sua conta para começar a usar a AtenaAI agora mesmo e descubra uma nova forma de aprender.',
    startNow: 'Comece Agora',
  },
  navigation: {
    login: 'Entrar',
  },
  footer: {
    copyright: '© 2026 AtenaAI — Projeto educacional e experimental.',
  },
};

export default function AboutPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [language, setLanguage] = useState('pt-BR');
  const [i18n, setI18n] = useState<any>(DEFAULT_I18N);
  const { openLogin, openSignup } = useAuth();

  useEffect(() => {
    // Detectar idioma
    const savedLang = localStorage.getItem('language') || 'pt-BR';
    setLanguage(savedLang);

    // Carregar i18n
    loadI18n(savedLang);

    // Carregar dados do usuário
    fetchUser();
  }, []);

  const loadI18n = async (lang: string) => {
    try {
      const response = await fetch(`/i18n/${lang}.json`);
      if (!response.ok) throw new Error('Failed to load i18n');
      const data = await response.json();
      setI18n(data);
    } catch (error) {
      console.warn(`Falha ao carregar i18n para ${lang}, usando padrão`);
      setI18n(DEFAULT_I18N);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { 
        credentials: 'include',
      });
      
      // 401 é esperado para usuários não autenticados - não é um erro
      if (response.status === 401) {
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      // Silencioso - erro de rede ou outro problema, usuário simplesmente não está autenticado
    }
  };

  const getRoleLabel = (): string => {
    if (!user?.role) return '';
    const roleMap: Record<string, string> = {
      scholar: i18n.auth?.student || 'Estudante',
      teacher: i18n.auth?.teacher || 'Professor',
      admin: 'Admin',
    };
    return roleMap[user.role];
  };

  const getGreeting = (): string => {
    if (!user) return i18n.about?.greeting || 'Olá!';
    return `${i18n.about?.greeting || 'Olá'}, ${user.full_name || 'Usuário'}!`;
  };

  return (
    <div>
      <main className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {i18n.about?.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {i18n.about?.description}
            </p>
          </div>

          {/* User Status Badge */}
          {user && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{getGreeting()}</strong>
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Você está acessando como: <strong>{getRoleLabel()}</strong>
              </p>
            </div>
          )}

          {/* Introduction */}
          <div className="prose dark:prose-invert max-w-none mb-12">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-4 border-blue-200 dark:border-blue-800 flex-shrink-0">
                    <img 
                      src="/assets/images/pic.png" 
                      alt="Sávio Emmanuel" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>{i18n.about?.greeting}</strong>
                  </p>
                  <p
                    className="text-gray-700 dark:text-gray-300 mb-4"
                    dangerouslySetInnerHTML={{
                      __html: i18n.about?.introName,
                    }}
                  />
                  <p
                    className="text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: i18n.about?.introBelief,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Why This Project */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {i18n.about?.whyTitle}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>{i18n.about?.whyPara1}</p>
              <p>{i18n.about?.whyPara2}</p>
              <p>{i18n.about?.whyPara3}</p>
              <p>{i18n.about?.whyPara4}</p>
            </div>
          </section>

          {/* What is AtenaAI Section */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              🧠 O que é a AtenaAI?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {i18n.about?.whatIntro}
            </p>
          </section>

          {/* User Types Section */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              📚 {language === 'pt-BR' ? 'Tipos de Usuários' : 'User Types'}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Students */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700">
                <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-2">
                  {i18n.about?.freeStudents}
                </h3>
                <p className="text-purple-800 dark:text-purple-200">
                  {i18n.about?.freeStudentsDesc}
                </p>
              </div>

              {/* Class Students */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-2">
                  {i18n.about?.classStudents}
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  {i18n.about?.classStudentsDesc}
                </p>
              </div>

              {/* Teachers */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-2">
                  {i18n.about?.teachers}
                </h3>
                <p className="text-green-800 dark:text-green-200">
                  {i18n.about?.teachersDesc}
                </p>
              </div>
            </div>
          </section>

          {/* Motto */}
          <section className="mb-12 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 sm:p-12 rounded-lg shadow-lg">
              <p className="text-2xl sm:text-3xl font-bold">
                💡 {i18n.about?.motto}
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {i18n.about?.contactTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {i18n.about?.contactSubtitle}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Email */}
              <a
                href={`mailto:${i18n.about?.emailAddress}`}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {i18n.about?.emailLabel}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{i18n.about?.emailAddress}</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://api.whatsapp.com/send/?phone=5521997843300&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    WhatsApp
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">(21) 99784-3300</p>
                </div>
              </a>

              {/* GitHub */}
              <a
                href={i18n.about?.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-900 dark:hover:border-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {i18n.about?.githubLabel}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@svfaca</p>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href={i18n.about?.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {i18n.about?.linkedinLabel}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sávio Emmanuel</p>
                </div>
              </a>

              {/* Website */}
              <a
                href={i18n.about?.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all sm:col-span-2"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {i18n.about?.websiteLabel}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">savioemmanuel.com.br</p>
                </div>
              </a>
            </div>
          </section>

          {/* CTA Section */}
          {!user && (
            <section className="mb-12 text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {i18n.cta?.joinTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {i18n.cta?.joinText}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={openSignup}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {i18n.cta?.startNow}
                </button>
                <button
                  onClick={openLogin}
                  className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {i18n.navigation?.login}
                </button>
              </div>
            </section>
          )}

          {/* User-specific CTA */}
          {user && (
            <section className="mb-12 text-center">
              <Link
                href={
                  user.role === 'teacher'
                    ? '/teacher'
                    : user.role === 'admin'
                      ? '/admin'
                      : '/scholar'
                }
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {language === 'pt-BR' ? '← Voltar ao Dashboard' : '← Back to Dashboard'}
              </Link>
            </section>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {i18n.footer?.copyright}
        </div>
      </footer>
    </div>
  );
}
