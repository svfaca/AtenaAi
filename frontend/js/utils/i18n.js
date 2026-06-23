// 🌐 Sistema de Internacionalização (i18n)

// Cache para o caminho já detectado
let cachedI18nPath = null;

// Detectar caminho correto para os arquivos i18n (funciona em file:// e http://)
function getI18nBasePath() {
    // Se já foi calculado, retorna do cache
    if (cachedI18nPath) return cachedI18nPath;
    
    // Se estamos em um servidor web (http/https), usa caminho absoluto
    if (window.location.protocol !== 'file:') {
        cachedI18nPath = '/i18n/';
        return cachedI18nPath;
    }
    
    // Em file://, tenta detectar usando diferentes métodos
    // Método 1: Usar window.location.pathname
    try {
        const pathname = window.location.pathname;
        // O pathname em file:// é o caminho completo do arquivo
        // Exemplos:
        // /C:/Users/Nosta/OneDrive/Projetos/AtenaAI/frontend/index.html
        // /C:/Users/Nosta/OneDrive/Projetos/AtenaAI/frontend/quem-somos/index.html
        
        // Encontrar onde começa 'frontend'
        const frontendIndex = pathname.indexOf('/frontend/');
        if (frontendIndex !== -1) {
            const beforeFrontend = pathname.substring(0, frontendIndex);
            const i18nPath = beforeFrontend + '/frontend/i18n/';
            console.log('✅ Caminho i18n (via pathname):', i18nPath);
            cachedI18nPath = i18nPath;
            return cachedI18nPath;
        }
    } catch (e) {
    }
    
    // Método 2: Se temos document.currentScript disponível
    try {
        if (document.currentScript && document.currentScript.src) {
            const scriptPath = document.currentScript.src;
            // file:///C:/Users/.../frontend/js/i18n.js
            const jsDirEnd = scriptPath.lastIndexOf('/js/');
            if (jsDirEnd !== -1) {
                const frontendPath = scriptPath.substring(0, jsDirEnd);
                const i18nPath = frontendPath + '/i18n/';
                console.log('✅ Caminho i18n (via currentScript):', i18nPath);
                cachedI18nPath = i18nPath;
                return cachedI18nPath;
            }
        }
    } catch (e) {
    }
    
    // Fallback final: tentar descobrir contando níveis
    try {
        const loc = window.location.pathname.toLowerCase();
        let relPath = '../i18n/';
        
        if (loc.includes('/quem-somos/') || loc.includes('/cadastro/') || 
            loc.includes('/login/') || loc.includes('/estudante/') || 
            loc.includes('/professor/')) {
            relPath = '../i18n/';
        } else {
            relPath = 'i18n/';
        }
        cachedI18nPath = relPath;
        return cachedI18nPath;
    } catch (e) {
    }
    cachedI18nPath = '../i18n/';
    return cachedI18nPath;
}

// Detectar linguagem do navegador
function detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage; // ex: 'pt-BR', 'en-US'
    // Verificar se o idioma é suportado
    if (browserLang.startsWith('pt')) {
        return 'pt-BR';
    } else if (browserLang.startsWith('en')) {
        return 'en-US';
    }
    
    // Fallback para português
    return 'pt-BR';
}

// Obter a base path para i18n
const i18nBasePath = getI18nBasePath();

// Sempre detectar do navegador ao carregar a página
// O idioma do navegador tem prioridade
const browserLanguage = detectBrowserLanguage();
let currentLanguage = browserLanguage;

// Atualizar localStorage para refletir idioma atual do navegador
localStorage.setItem('language', currentLanguage);
let translations = {};
let isLanguageLoaded = false;

// Carregar arquivo de tradução
async function loadLanguage(lang) {
    try {
        // Lista de caminhos a tentar, em ordem de preferência
        const pathsToTry = [];
        
        // Se está em servidor web (não é file://)
        if (window.location.protocol !== 'file:') {
            // Prioridade 1: Caminhos absolutos a partir da raiz (mais confiável)
            pathsToTry.push(`/frontend/i18n/${lang}.json`);
            
            // Prioridade 2: Caminhos relativos
            pathsToTry.push(`./i18n/${lang}.json`);      // Se estiver no root (/frontend/)
            pathsToTry.push(`../i18n/${lang}.json`);     // De /frontend/cadastro/, /frontend/login/, etc.
            pathsToTry.push(`../../i18n/${lang}.json`);  // Se estiver mais profundo
        } else {
            // Se é file://, usa os caminhos relativos detectados
            pathsToTry.push(i18nBasePath + lang + '.json');
        }
        
        let response = null;
        let lastError = null;
        
        // Tentar cada caminho até encontrar um que funcione
        for (let path of pathsToTry) {
            try {
                response = await fetch(path, { 
                    method: 'GET',
                    cache: 'no-cache' 
                });
                
                if (response.ok) {
                    break;
                }
            } catch (e) {
                lastError = e;
            }
        }
        
        if (!response || !response.ok) {
            throw lastError || new Error(`Failed to load language: ${lang}`);
        }
        
        translations = await response.json();
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        isLanguageLoaded = true;
        updatePageLanguage();
        return true;
    } catch (error) {
        // Fallback para português se falhar
        if (lang !== 'pt-BR') {
            try {
                const pathsToTry = [];
                
                if (window.location.protocol !== 'file:') {
                    pathsToTry.push(`/i18n/pt-BR.json`);
                    pathsToTry.push(`/frontend/i18n/pt-BR.json`);
                    pathsToTry.push(`./i18n/pt-BR.json`);
                    pathsToTry.push(`../i18n/pt-BR.json`);
                    pathsToTry.push(`../../i18n/pt-BR.json`);
                } else {
                    pathsToTry.push(i18nBasePath + 'pt-BR.json');
                }
                
                let response = null;
                for (let path of pathsToTry) {
                    try {
                        response = await fetch(path, { cache: 'no-cache' });
                        if (response.ok) break;
                    } catch (e) {}
                }
                
                if (response && response.ok) {
                    translations = await response.json();
                    currentLanguage = 'pt-BR';
                    localStorage.setItem('language', 'pt-BR');
                    document.documentElement.lang = 'pt-BR';
                    isLanguageLoaded = true;
                    updatePageLanguage();
                    return true;
                }
            } catch (e) {
            }
        }
        return false;
    }
}

// Obter texto traduzido
function t(key) {
    const keys = key.split('.');
    let value = translations;
    
    for (let k of keys) {
        if (value[k]) {
            value = value[k];
        } else {
            return key;
        }
    }
    
    return value;
}

// Atualizar elementos da página com data-i18n
// ... (mantenha as funções detectBrowserLanguage e loadLanguage como estão)

// Atualizar elementos da página com data-i18n
function updatePageLanguage() {
    if (!isLanguageLoaded) {
        return;
    }
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translatedText = t(key);
        
        // ✅ CORREÇÃO: Verifica se o texto contém tags HTML (como <strong> ou <p>)
        // Se contiver, usa innerHTML. Se não, usa textContent por segurança.
        if (/<[a-z][\s\S]*>/i.test(translatedText)) {
            element.innerHTML = translatedText;
        } else {
            element.textContent = translatedText;
        }
    });
    
    // Elementos de atributo (placeholder, title, etc) permanecem como texto simples
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        element.placeholder = t(element.getAttribute('data-i18n-placeholder'));
    });
    
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        element.title = t(element.getAttribute('data-i18n-title'));
    });

    document.querySelectorAll('[data-i18n-value]').forEach(element => {
        element.value = t(element.getAttribute('data-i18n-value'));
    });
    try { document.dispatchEvent(new CustomEvent('i18n:loaded')); } catch (e) {}
}

// ... (restante do arquivo igual)

// Mudar idioma (mudança temporária durante a sessão)
function setLanguage(lang) {
    loadLanguage(lang);
}

// Obter idioma atual
function getLanguage() {
    return currentLanguage;
}

// Inicializar i18n na carga da página
document.addEventListener('DOMContentLoaded', async () => {
    await loadLanguage(currentLanguage);
    
    // Aguardar um pouco para garantir que todos os elementos estão prontos
    setTimeout(() => {
        updatePageLanguage();
    }, 100);
});

// Também tentar se o DOMContentLoaded já tiver passado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await loadLanguage(currentLanguage);
    });
} else {
    // O DOMContentLoaded já passou, carregar agora
    loadLanguage(currentLanguage).then(() => {
    });
}

// Monitorar mudanças no DOM para traduzir novos elementos
// Isso resolve o problema do menu mobile que é criado dinamicamente
if (typeof window.i18nObserver === 'undefined') {
    window.i18nObserver = new MutationObserver((mutations) => {
        let hasI18nElements = false;
        
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.hasAttribute && (
                            node.hasAttribute('data-i18n') ||
                            node.hasAttribute('data-i18n-placeholder') ||
                            node.hasAttribute('data-i18n-title') ||
                            node.hasAttribute('data-i18n-value') ||
                            node.querySelector('[data-i18n]')
                        )) {
                            hasI18nElements = true;
                        }
                    }
                });
            }
        });
        
        // Se encontrou elementos com i18n, atualizar
        if (hasI18nElements && isLanguageLoaded) {
            updatePageLanguage();
        }
    });

    // Observar mudanças no body
    if (document.body) {
        window.i18nObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }
}
// Exportar funções globalmente
window.t = t;
window.updatePageLanguage = updatePageLanguage;
window.setLanguage = setLanguage;
window.getLanguage = getLanguage;