
/**
 * Debounce - aguarda X ms sem chamadas antes de executar
 * Ideal para: input changes, window resize, autocomplete
 * 
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    
    return function debounced(...args) {
        // Limpa timeout anterior se existir
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Define novo timeout
        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * Debounce com execução imediata (leading edge)
 * Executa imediatamente na primeira chamada, depois aguarda delay
 * 
 * @example
 * const debouncedClick = debounceImmediate(onClick, 500);
 * button.addEventListener('click', debouncedClick);
 */
export function debounceImmediate(func, delay = 300) {
    let timeoutId;
    let lastCallTime = 0;
    
    return function debounced(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        
        // Executa imediatamente se primeira chamada ou após delay
        if (timeSinceLastCall >= delay) {
            func.apply(this, args);
            lastCallTime = now;
        }
        
        // Limpa timeout anterior
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Garante que executará em breve
        timeoutId = setTimeout(() => {
            if (Date.now() - lastCallTime >= delay) {
                func.apply(this, args);
                lastCallTime = Date.now();
            }
        }, delay);
    };
}

/**
 * Throttle - executa no máximo 1x a cada X ms
 * Ideal para: scroll events, mouse move, frequent updates
 * 
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit = 300) {
    let lastCall = 0;
    let timeoutId;
    
    return function throttled(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;
        
        if (timeSinceLastCall >= limit) {
            // Executa imediatamente
            func.apply(this, args);
            lastCall = now;
            
            // Limpa pending timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        } else {
            // Agenda execução final
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            const remaining = limit - timeSinceLastCall;
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastCall = Date.now();
            }, remaining);
        }
    };
}

/**
 * RequestAnimationFrame throttle - para animações e scroll
 * Melhor performance que throttle normal para animations
 * 
 * @example
 * const rafThrottledHandler = rafThrottle(onScroll);
 * window.addEventListener('scroll', rafThrottledHandler);
 */
export function rafThrottle(func) {
    let rafId;
    let isScheduled = false;
    
    return function rafThrottled(...args) {
        if (isScheduled) return;
        
        isScheduled = true;
        
        rafId = requestAnimationFrame(() => {
            func.apply(this, args);
            isScheduled = false;
        });
    };
}

/**
 * Cancel uma função debounced/throttled
 * 
 * @example
 * const debouncedFunc = debounce(search, 300);
 * input.addEventListener('input', debouncedFunc);
 * // Depois, cancelar:
 * cancelDebounce(debouncedFunc);
 */
export function cancelDebounce(func) {
    if (func._timeoutId) {
        clearTimeout(func._timeoutId);
        func._timeoutId = null;
    }
}

// Export types para TypeScript (se usado)
export const debounceUtils = {
    debounce,
    debounceImmediate,
    throttle,
    rafThrottle,
    cancelDebounce
};

export default debounceUtils;
