// Acessibilidade Features
const btnA11y = document.getElementById('btn-a11y');
const btnCloseA11y = document.getElementById('btn-close-a11y');
const modalBackdrop = document.getElementById('a11y-modal-backdrop');
const htmlEl = document.documentElement;
const a11yWindow = document.getElementById('a11y-modal-window');
const glassOverlay = document.getElementById('global-glass-overlay');

// Toggles
const tglDark = document.getElementById('toggle-dark');
const tglContrast = document.getElementById('toggle-contrast');
const tglMotion = document.getElementById('toggle-motion');
const tglFocus = document.getElementById('toggle-focus');
const tglDyslexia = document.getElementById('toggle-dyslexia');

// BotÃµes de Grupo
const btnFontNormal = document.getElementById('font-normal');
const btnFontLarge = document.getElementById('font-large');

// --- 1. CONFIGURAÃ‡ÃƒO DO FOCUS TRAP (O SEGREDO DO TAB) ---
const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
let previouslyFocusedElement;

function trapTabKey(e) {
    if (e.key === 'Tab') {
        const focusableElements = a11yWindow.querySelectorAll(focusableElementsString);
        const focusableArray = Array.from(focusableElements);
        
        if (focusableArray.length === 0) return;
        e.preventDefault(); 

        let currentIndex = focusableArray.indexOf(document.activeElement);

        if (e.shiftKey) {
            currentIndex--;
            if (currentIndex < 0) currentIndex = focusableArray.length - 1;
        } else {
            currentIndex++;
            if (currentIndex >= focusableArray.length) currentIndex = 0;
        }

        focusableArray[currentIndex].focus();
    }
    
    if (e.key === 'Escape') closeA11yModal();
}

// --- 2. ABRIR E FECHAR MODAL ---
function openModal(modalId, btnId) {
    previouslyFocusedElement = document.activeElement;
    document.body.classList.add('modal-open'); 
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.classList.add('active-modal-btn');
        if (btn.parentElement && btn.parentElement.classList.contains('action-dropdown-wrapper')) {
            btn.parentElement.classList.add('active-modal-wrapper');
        }
    }
    document.getElementById(modalId).classList.remove('hidden');
    glassOverlay.classList.add('show');
    
    setTimeout(() => {
        const focusableElements = document.getElementById(modalId).querySelectorAll(focusableElementsString);
        if (focusableElements.length > 0) focusableElements[0].focus();
    }, 50);
}

function closeModal(modalId, btnId) {
    document.getElementById(modalId).classList.add('hidden');
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.classList.remove('active-modal-btn');
        if (btn.parentElement && btn.parentElement.classList.contains('action-dropdown-wrapper')) {
            btn.parentElement.classList.remove('active-modal-wrapper');
        }
    }
    
    const openModals = document.querySelectorAll('.a11y-container:not(.hidden)');
    if (openModals.length === 0) {
        document.body.classList.remove('modal-open');
        glassOverlay.classList.remove('show');
    }
    
    if (previouslyFocusedElement) previouslyFocusedElement.focus();
}

btnA11y.addEventListener('click', () => openModal('a11y-modal-window', 'btn-a11y'));
if (btnCloseA11y) btnCloseA11y.addEventListener('click', () => closeModal('a11y-modal-window', 'btn-a11y'));

const btnLang = document.getElementById('btn-lang');
const btnCloseLang = document.getElementById('btn-close-lang');
if (btnLang) btnLang.addEventListener('click', (e) => { e.preventDefault(); openModal('lang-modal-window', 'btn-lang'); });
if (btnCloseLang) btnCloseLang.addEventListener('click', () => closeModal('lang-modal-window', 'btn-lang'));

glassOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal('a11y-modal-window', 'btn-a11y');
    closeModal('lang-modal-window', 'btn-lang');
});

const mainPageHeader = document.getElementById('main-header');
if (mainPageHeader) {
    mainPageHeader.addEventListener('click', (e) => {
        if (document.body.classList.contains('modal-open')) {
            e.stopPropagation();
            closeModal('a11y-modal-window', 'btn-a11y');
            closeModal('lang-modal-window', 'btn-lang');
        }
    });
}

document.querySelectorAll('.popup-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal('a11y-modal-window', 'btn-a11y');
        closeModal('lang-modal-window', 'btn-lang');
    });
});

// --- 3. LÃ“GICA DOS SWITCHES PADRÃƒO ---
function setupToggle(inputEl, cssClass, storageKey, isSystemFallback = false) {
    let storedVal = localStorage.getItem(storageKey);
    let isEnabled = storedVal !== null ? storedVal === 'true' : isSystemFallback;

    inputEl.checked = isEnabled;
    if (isEnabled) htmlEl.classList.add(cssClass);

    inputEl.addEventListener('change', (e) => {
        if (e.target.checked) {
            htmlEl.classList.add(cssClass);
            localStorage.setItem(storageKey, 'true');
        } else {
            htmlEl.classList.remove(cssClass);
            localStorage.setItem(storageKey, 'false');
        }
    });

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); inputEl.click(); }
    });
}

const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

function applyDarkMode(isDark) {
    tglDark.checked = isDark;
    if (isDark) {
        htmlEl.classList.add('a11y-dark-mode');
    } else {
        htmlEl.classList.remove('a11y-dark-mode');
    }
}

let userDarkPref = localStorage.getItem('pref-dark');
if (userDarkPref !== null) {
    applyDarkMode(userDarkPref === 'true');
} else {
    applyDarkMode(systemDarkMode.matches);
}

systemDarkMode.addEventListener('change', (e) => {
    applyDarkMode(e.matches);
    localStorage.setItem('pref-dark', e.matches);
    if (e.matches && tglContrast.checked) {
        tglContrast.click(); 
    }
});

tglDark.addEventListener('change', (e) => {
    const isPlayer = document.body.getAttribute('data-active-view') === 'player';
    if (isPlayer && !e.target.checked && !tglContrast.checked) {
        e.target.checked = true; // Block unchecking if other is empty
        return;
    }
    applyDarkMode(e.target.checked);
    localStorage.setItem('pref-dark', e.target.checked);
    if (e.target.checked && tglContrast.checked) {
        tglContrast.checked = false;
        htmlEl.classList.remove('a11y-high-contrast');
        localStorage.setItem('pref-contrast', 'false');
    }
});

tglDark.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tglDark.click(); }
});

let storedContrast = localStorage.getItem('pref-contrast');
tglContrast.checked = storedContrast === 'true';
if (tglContrast.checked) htmlEl.classList.add('a11y-high-contrast');

tglContrast.addEventListener('change', (e) => {
    const isPlayer = document.body.getAttribute('data-active-view') === 'player';
    if (isPlayer && !e.target.checked && !tglDark.checked) {
        e.target.checked = true; // Block unchecking if other is empty
        return;
    }
    if (e.target.checked) {
        htmlEl.classList.add('a11y-high-contrast');
        localStorage.setItem('pref-contrast', 'true');
        if (tglDark.checked) {
            tglDark.checked = false;
            applyDarkMode(false);
            localStorage.setItem('pref-dark', 'false');
        }
    } else {
        htmlEl.classList.remove('a11y-high-contrast');
        localStorage.setItem('pref-contrast', 'false');
    }
});

tglContrast.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tglContrast.click(); }
});

setupToggle(tglMotion, 'a11y-reduce-motion', 'pref-motion');
setupToggle(tglFocus, 'a11y-focus-mode', 'pref-focus');
setupToggle(tglDyslexia, 'a11y-dyslexia', 'pref-dyslexia');

const savedFont = localStorage.getItem('pref-font') || 'normal';
if(savedFont === 'large') {
    htmlEl.classList.add('a11y-large-text');
    btnFontLarge.classList.add('active');
    btnFontNormal.classList.remove('active');
}

// Centralized, standalone function
function setA11yFontSize(size) {
    if (size === 'large') {
        htmlEl.classList.add('a11y-large-text');
        btnFontLarge.classList.add('active');
        btnFontNormal.classList.remove('active');
        localStorage.setItem('pref-font', 'large');
    } else {
        htmlEl.classList.remove('a11y-large-text');
        btnFontNormal.classList.add('active');
        btnFontLarge.classList.remove('active');
        localStorage.setItem('pref-font', 'normal');
    }
}

const fontSizeRow = document.getElementById('font-size-toggle-row');
if (fontSizeRow) {
    const toggleFontSize = (e) => {
        e.preventDefault();
        // Simply toggle between large and normal based on the current root html status
        if (htmlEl.classList.contains('a11y-large-text')) {
            setA11yFontSize('normal');
        } else {
            setA11yFontSize('large');
        }
    };

    fontSizeRow.addEventListener('click', toggleFontSize);
    
    // Keyboard accessibility
    fontSizeRow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleFontSize(e);
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const isMod = e.altKey;

    if (isMod && e.code === 'KeyT') { 
        e.preventDefault(); 
        if (btnFontNormal.classList.contains('active')) setA11yFontSize('large');
        else setA11yFontSize('normal');
    }
    if (isMod && e.code === 'KeyD') { e.preventDefault(); tglDark.click(); }
    if (isMod && e.code === 'KeyC') { e.preventDefault(); tglContrast.click(); }
    if (isMod && e.code === 'KeyM') { e.preventDefault(); tglMotion.click(); }
    if (isMod && e.code === 'KeyF') { e.preventDefault(); tglFocus.click(); }
    if (isMod && e.code === 'KeyY') { e.preventDefault(); tglDyslexia.click(); }
});