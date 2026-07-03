// scripts/i18n.js

const urlParams = new URLSearchParams(window.location.search);
const urlLang = urlParams.get('lang');
window.currentLang = urlLang ? urlLang : (window.location.hostname.startsWith('pt.') ? 'pt' : 'en');

document.documentElement.lang = window.currentLang === 'pt' ? 'pt-BR' : 'en-US';

window._t = function(en, pt) {
    return window.currentLang === 'pt' ? pt : en;
};

const translations = {
    "en": {
        "h1_title": "Lio Schimanko's Portfolio",
        "nav_overview": "Overview",
        "nav_tech": "Tech View",
        "btn_return": "Return <kbd>Backspace</kbd>",
        "btn_switch": "Switch View <kbd><span class=\"os-mod\"></span>V</kbd>",
        "btn_about": "About <kbd><span class=\"os-mod\"></span>I</kbd>",
        "btn_lang": "Language <kbd><span class=\"os-mod\"></span>L</kbd>",
        "btn_a11y": "Accessibility <kbd><span class=\"os-mod\"></span>A</kbd>",
        "drag_seek": "Drag to seek video",
        "a11y_title": "Accessibility",
        "a11y_size": "Text Size <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>T</kbd>",
        "a11y_dark": "Dark Mode <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>D</kbd>",
        "a11y_contrast": "High Contrast <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>C</kbd>",
        "a11y_motion": "Reduce Motion <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>M</kbd>",
        "a11y_tab": "TAB Navigation <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>F</kbd>",
        "a11y_dyslexia": "Dyslexia Font <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>Y</kbd>",
        "footer_text": "©2026 All trademarks are property of their owners.",

        "nav_home": "Home",
        "nav_about": "About Lio",
        "lang_title": "Language",
        "lang_en": "English",
        "lang_pt": "Portuguese",
        "lang_pirate": "Pirate (Aargh!)",
        
        "about_p1": "Lio started his career as a Graphic Designer, and fell in love with the intersection of design and technology. He has since evolved into a Product Engineer with a passion for crafting intuitive user experiences and seamless interfaces.",
        "about_p2": "He holds a NN/g UX Certification, a postgrad degree in User Experience and is currently pursuing a Master's in Computer Science at BSU with a focus on HCI.",
        "about_linkedin": "LinkedIn",
        "about_github": "GitHub",

        "protected_case": "Protected Case",
        "protected_employer_case": "Protected {employer} Case",
        "btn_pitch": "Pitch",
        "btn_repo": "Repo",
        "btn_demo": "Demo",
        "play_video": "Play Video",
        "play_video_presentation": "Play Video Presentation",
        "repository": "Repository",
        "repository_code": "Repository code",
        "github_directory": "GitHub Directory",
        "live_demo": "Live demo",
        "live_demonstration": "Live Demonstration",
        "ai_summary": "AI Summary",
        "ask_ai": "Ask AI",
        "share": "Share link",
        "chat_with_ai": "Chat with AI",
        "ask_about_case": "Ask about this case...",
        "share_exec_prefix": "Share summary on",
        "share_tech_prefix": "Share tech view on",
        "share_link_exec_prefix": "Share summary link",
        "share_link_tech_prefix": "Share tech view link",
        "enter_passcode": "Enter the passcode to decrypt project details.",
        "popup_close": "Close",
        "popup_lang_title": "Language",
        "popup_a11y_title": "Accessibility",
        "popup_ph_title": "Actions",
        "passcode": "Passcode",
        "unlock": "Unlock",
        "incorrect_passcode": "Incorrect passcode.",
        "swipe_explore": "Swipe to explore cases",
        "search_cases": "Search cases...",
        "back_to_top": "Back to top",
        "resume_reading": "Pick up where you left off:",
        "ph_ask_ai": "Ask AI about it",
        "ph_read_aloud": "Read it like a robot",
        "ph_autoscroll": "Auto-scroll from here",
        "ph_copy_link": "Copy link",
        "ph_email_lio": "Email Lio",
        "ph_share": "Share",
        "copied": "Copied!",
        "email_subject": "Regarding your case:",
        "email_body": "I was reading your portfolio and this paragraph stood out:",
        "share_text": "Check out this case study by Lio Schimanko.",
        "thinking": "Thinking...",
        "connection_failed": "Connection failed. Please try again.",
        "explain_part": "Can you explain this part?",
        "tts_not_supported": "Your browser does not support text-to-speech.",
        "tts_ai_reader": "AI Reader",
        "tts_play": "Play audio",
        "tts_pause": "Pause audio",
        "tts_change_speed": "Change speed",
        "tts_hide_scroll": "Hide on play",
        "tts_autoscroll": "Auto-scroll on play",
        "mermaid_error": "Execution error parsing systems chart."
    },
    "pt": {
        "h1_title": "Portfólio de Lio Schimanko",
        "nav_overview": "Visão Geral",
        "nav_tech": "Visão Técnica",
        "btn_return": "Voltar <kbd>Backspace</kbd>",
        "btn_switch": "Mudar Visão <kbd><span class=\"os-mod\"></span>V</kbd>",
        "btn_about": "Sobre <kbd><span class=\"os-mod\"></span>I</kbd>",
        "btn_lang": "Idioma <kbd><span class=\"os-mod\"></span>L</kbd>",
        "btn_a11y": "Acessibilidade <kbd><span class=\"os-mod\"></span>A</kbd>",
        "drag_seek": "Arraste para avançar",
        "a11y_title": "Acessibilidade",
        "a11y_size": "Tamanho do Texto <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>T</kbd>",
        "a11y_dark": "Modo Escuro <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>D</kbd>",
        "a11y_contrast": "Alto Contraste <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>C</kbd>",
        "a11y_motion": "Reduzir Movimento <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>M</kbd>",
        "a11y_tab": "Navegação por TAB <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>F</kbd>",
        "a11y_dyslexia": "Fonte para Dislexia <kbd class=\"a11y-kbd\"><span class=\"os-mod\"></span>Y</kbd>",
        "footer_text": "©2026 Todas as marcas registradas são propriedade de seus respectivos donos.",

        "nav_home": "Início",
        "nav_about": "Sobre Lio",
        "lang_title": "Idioma",
        "lang_en": "English",
        "lang_pt": "Português",
        "lang_pirate": "Pirata (Aargh!)",
        
        "about_p1": "Lio começou sua carreira como Designer Gráfico e se apaixonou pela interseção entre design e tecnologia. Desde então, evoluiu para Engenheiro de Produto com paixão por criar experiências de usuário intuitivas e interfaces fluidas.",
        "about_p2": "Ele possui Certificação UX da NN/g, pós-graduação em User Experience pela PUC-RS e atualmente é Mestrando em Ciência da Computação na BSU (EUA) com foco em IHC.",
        "about_linkedin": "LinkedIn",
        "about_github": "GitHub",

        "protected_case": "Case Protegido",
        "protected_employer_case": "Case de {employer} Protegido",
        "btn_pitch": "Pitch",
        "btn_repo": "Repo",
        "btn_demo": "Demo",
        "play_video": "Reproduzir Vídeo",
        "play_video_presentation": "Reproduzir Apresentação",
        "repository": "Repositório",
        "repository_code": "Código do repositório",
        "github_directory": "Diretório GitHub",
        "live_demo": "Demo ao vivo",
        "live_demonstration": "Demonstração ao Vivo",
        "ai_summary": "Resumo da IA",
        "ask_ai": "Perguntar à IA",
        "share": "Compartilhar",
        "chat_with_ai": "Conversar com a IA",
        "ask_about_case": "Pergunte sobre este projeto...",
        "share_exec_prefix": "Compartilhar resumo no",
        "share_tech_prefix": "Compartilhar visão técnica no",
        "share_link_exec_prefix": "Compartilhar link do resumo",
        "share_link_tech_prefix": "Compartilhar link da visão técnica",
        "enter_passcode": "Insira a senha para descriptografar os detalhes do projeto.",
        "popup_close": "Fechar",
        "popup_lang_title": "Idioma",
        "popup_a11y_title": "Acessibilidade",
        "popup_ph_title": "Ações",
        "passcode": "Senha",
        "unlock": "Desbloquear",
        "incorrect_passcode": "Senha incorreta.",
        "swipe_explore": "Deslize para explorar projetos",
        "search_cases": "Buscar projetos...",
        "back_to_top": "Voltar ao topo",
        "resume_reading": "Continue de onde parou:",
        "ph_ask_ai": "Perguntar à IA sobre isso",
        "ph_read_aloud": "Ler como um robô",
        "ph_autoscroll": "Rolagem automática daqui",
        "ph_copy_link": "Copiar link",
        "ph_email_lio": "Enviar mensagem para Lio",
        "ph_share": "Compartilhar",
        "copied": "Copiado!",
        "email_subject": "Sobre o seu projeto:",
        "email_body": "Eu estava lendo seu Portfólio e este parágrafo se destacou:",
        "share_text": "Confira este estudo de caso por Lio Schimanko.",
        "thinking": "Pensando...",
        "connection_failed": "Falha na conexão. Tente novamente.",
        "explain_part": "Você pode explicar esta parte?",
        "tts_not_supported": "Seu navegador não suporta conversão de texto em fala.",
        "tts_ai_reader": "Leitor de IA",
        "tts_play": "Tocar áudio",
        "tts_pause": "Pausar áudio",
        "tts_change_speed": "Alterar velocidade",
        "tts_hide_scroll": "Ocultar reprodutor",
        "tts_autoscroll": "Rolar texto com o áudio",
        "mermaid_error": "Erro de execuxão ao analisar o gráfico de sistemas."
    }
};

window.t = function(key) {
    return translations[window.currentLang][key] || key;
};

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[window.currentLang] && translations[window.currentLang][key]) {
            el.innerHTML = translations[window.currentLang][key];
        }
    });

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modSymbol = isMac ? '⌥ ' : 'Alt ';
    document.querySelectorAll('.os-mod').forEach(el => el.textContent = modSymbol);

    const langBtn = document.getElementById('btn-lang');
    if (langBtn) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (window.currentLang === 'pt') {
            langBtn.href = isLocal ? "?lang=en" : "https://schimanko.dev/";
            langBtn.setAttribute('aria-label', "Switch to English");
        } else {
            langBtn.href = isLocal ? "?lang=pt" : "https://pt.schimanko.dev/";
            langBtn.setAttribute('aria-label', "Switch to Portuguese");
        }
    }

    // Assigning selected states correctly inside the translation pass
    document.querySelectorAll('.lang-row').forEach(row => {
        if (row.getAttribute('data-lang') === window.currentLang) {
            row.classList.add('selected');
            row.setAttribute('aria-selected', 'true');
        } else {
            row.classList.remove('selected');
            row.setAttribute('aria-selected', 'false');
        }
    });
}

document.addEventListener('DOMContentLoaded', applyTranslations);