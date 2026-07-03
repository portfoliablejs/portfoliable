/* ==========================================================================
   PORTFOLIO ENGINE & DOM CONSTRUCTION
   ========================================================================== */
function openCaseView(caseData, clickedThumbEl, index) {
    activeCaseData = caseData;
    syncToggleForCurrentCase();
    prepareMorph(clickedThumbEl, `media-${caseData.id}`);
    document.documentElement.classList.add('slide-up-transition');
    document.documentElement.classList.remove('slide-down-transition');

    // Only keep the TOC peek animation here
    if (!sessionStorage.getItem('hasSeenTocPeek')) {
        setTimeout(() => {
            const activeToc = document.querySelector(`.case-slide-wrapper[data-case-id="${caseData.id}"] .case-toc`);
            if (activeToc) {
                activeToc.classList.add('is-peeking');
                setTimeout(() => {
                    activeToc.classList.remove('is-peeking');
                    sessionStorage.setItem('hasSeenTocPeek', 'true');
                }, 1600); 
            }
        }, 800); 
    }

    const updateDOMAndScroll = () => {
        switchView('case');
        caseSliderContainer.style.scrollBehavior = 'auto'; 
        const targetSlide = caseSliderContainer.querySelectorAll('.case-slide-wrapper')[index];
        
        if (targetSlide) {
            targetSlide.scrollIntoView({ inline: 'center', block: 'nearest' });
            
            const scrollEl = document.getElementById(`scroll-${caseData.id}`);
            if (scrollEl && savedScrollPositions[caseData.id]) {
                setTimeout(() => {
                    scrollEl.scrollTo({ top: savedScrollPositions[caseData.id], behavior: 'instant' });
                }, 10);
            }
            const activePlayBtn = targetSlide.querySelector('.btn-play-case');
            if (activePlayBtn) activePlayBtn.focus();
        }

        setTimeout(() => { caseSliderContainer.style.scrollBehavior = 'smooth'; }, 50);
    };

    if (document.startViewTransition && !document.documentElement.classList.contains('a11y-reduce-motion')) {
        document.startViewTransition(updateDOMAndScroll);
    } else { 
        updateDOMAndScroll(); 
    }
}

window.triggerAiTyping = function(container) {
    const summaryTextEl = container.querySelector('.ai-summary-text');
    const metricsGrid = container.querySelector('.summary-metrics-grid');
    
    if (summaryTextEl && !summaryTextEl.dataset.typed) {
        summaryTextEl.dataset.typed = 'true';

        const fullText = summaryTextEl.dataset.text;
        summaryTextEl.textContent = fullText;
        const precalculatedHeight = summaryTextEl.getBoundingClientRect().height;
        summaryTextEl.style.setProperty('--dynamic-ai-height', `${precalculatedHeight}px`);
        summaryTextEl.textContent = '';
        
        const dots = document.createElement('span');
        dots.className = 'ai-thinking-dots';
        dots.setAttribute('aria-live', 'polite');
        dots.setAttribute('aria-label', typeof t === 'function' ? t('thinking') : 'Thinking');
        summaryTextEl.appendChild(dots);
        
        let dotCount = 0;
        const thinkInt = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            dots.textContent = '.'.repeat(dotCount);
        }, 300);

        setTimeout(() => {
            clearInterval(thinkInt);
            if (dots.parentNode) dots.remove();
            summaryTextEl.classList.add('typing');
            
            let charIdx = 0;
            
            function typeChar() {
                if (charIdx < fullText.length) {
                    summaryTextEl.textContent += fullText.charAt(charIdx);
                    charIdx++;
                    setTimeout(typeChar, 15); 
                } else {
                    summaryTextEl.classList.remove('typing');
                    summaryTextEl.style.removeProperty('--dynamic-ai-height');
                    
                    if (metricsGrid) {
                        metricsGrid.classList.add('show-grid');
                        metricsGrid.querySelectorAll('.summary-metric-card').forEach((c, i) => setTimeout(() => c.classList.add('show'), 50 + (i * 150)));
                    }
                }
            }
            typeChar();
        }, 1200); 
    }
};

const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const actionElements = entry.target.querySelectorAll('.btn-play-case, .btn-secondary-pill, .share-icon-btn');
        
        if (entry.isIntersecting) {
            const visibleCaseId = entry.target.dataset.caseId;
            const foundCase = typeof portfolioCases !== 'undefined' ? portfolioCases.find(c => c.id === visibleCaseId) : null;
            if (foundCase) {
                activeCaseData = foundCase;
                const currentCrumb = document.getElementById('crumb-current');
                if (currentCrumb) currentCrumb.textContent = getSafeCaseTitle(foundCase);
            }
            syncToggleForCurrentCase(); 

            if (activeTTSCaseId && activeTTSCaseId !== foundCase.id && ttsState !== 'stopped') {
                if (typeof currentAudioFile !== 'undefined' && currentAudioFile) {
                    currentAudioFile.pause();
                }
                resetTTSStopped();
            }
            
            const slideIndex = Array.from(caseSliderContainer.children).indexOf(entry.target);
            document.querySelectorAll('.slider-dot').forEach((dot, idx) => {
                dot.classList.toggle('active', idx === slideIndex);
            });
            
            actionElements.forEach(el => el.setAttribute('tabindex', '0'));
            
            if (window.triggerAiTyping) window.triggerAiTyping(entry.target);
            
        } else {
            actionElements.forEach(el => el.setAttribute('tabindex', '-1'));
        }
    });
}, { root: caseSliderContainer, threshold: 0.6 });

function setupCaseScrollEffect(id) {
    const scrollContainer = document.getElementById(`scroll-${id}`);
    if (!scrollContainer) return;
    
    const layout = scrollContainer.closest('.case-layout');
    const slideWrapper = scrollContainer.closest('.case-slide-wrapper'); 
    if (!layout) return;

    let scrollTimeout; 

    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop;

        // Force-close any open paragraph contextual menus on scroll
        const activeHoverMenu = document.querySelector('.paragraph-hover-menu.show');
        const activeTrigger = document.querySelector('.paragraph-hover-trigger.show');
        if (activeHoverMenu) activeHoverMenu.classList.remove('show');
        if (activeTrigger) activeTrigger.classList.remove('show');

        layout.classList.add('is-scrolling');
        document.body.classList.add('is-scrolling-case'); 

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            layout.classList.remove('is-scrolling');
            document.body.classList.remove('is-scrolling-case'); 
        }, 800); 

        // --- NEW: MINI PLAYER SCROLL SYNC TRIGGER ---
        const player = scrollContainer.querySelector('.case-audio-player');
        if (player) {
            // Only evaluate shrink metrics if the user has unlocked stickiness by pressing play
            if (player.classList.contains('is-sticky')) {
                const descBody = scrollContainer.querySelector('.case-description-body');
                const descTop = descBody.getBoundingClientRect().top;
                
                // Dynamic Universal Threshold
                const rootVar = getComputedStyle(document.documentElement).getPropertyValue('--player-sticky-anchor').trim();
                const dynamicThreshold = (parseInt(rootVar, 10) || 30) + 2; 

                // Measure based on the parent container to allow global fixed positioning
                // HYSTERESIS added: A 12px dead-zone buffer prevents flickering during high-speed autoscroll jumps
                if (descTop <= dynamicThreshold) { 
                    player.classList.add('is-shrunk');
                } else if (descTop > dynamicThreshold + 12) {
                    player.classList.remove('is-shrunk');
                }
            } else {
                player.classList.remove('is-shrunk');
            }
        }

        if (scrollTop > 50) {
            layout.classList.add('is-scrolled');
            document.body.classList.add('case-is-scrolled');

            // Check if they haven't seen it yet
            if (!sessionStorage.getItem('hasSeenCaseDragTutorial')) {
                
                // 1. Immediately mark it as seen so continuous scrolling doesn't fire multiple timers
                sessionStorage.setItem('hasSeenCaseDragTutorial', 'true');
                
                // 2. Wait 3 seconds (3000ms) before showing the tutorial
                setTimeout(() => {
                    const dragTut = document.getElementById('drag-tutorial');
                    if (dragTut) {
                        dragTut.classList.add('show');
                        // Hide it again 4 seconds after it appears
                        setTimeout(() => dragTut.classList.remove('show'), 4000);
                    }
                }, 3000); // <-- Adjust this number (in milliseconds) for your desired delay
            }

            localStorage.setItem('resumeCaseId', id);
            localStorage.setItem('resumeScrollTop', scrollTop);
            
            if (!trackedScrolls.has(id) && typeof gtag === 'function') {
                trackedScrolls.add(id); 
                const caseObj = portfolioCases.find(c => c.id === id);
                gtag('event', 'read_case_started', {
                    case_id: id,
                    case_title: caseObj ? caseObj.title : id,
                    content_type: 'portfolio_case'
                });
            }
        } else {
            layout.classList.remove('is-scrolled');
            document.body.classList.remove('case-is-scrolled');
        }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    if (slideWrapper) {
        slideWrapper.addEventListener('scroll', handleScroll);
    }
}

const updateShareTooltips = (container) => {
    const prefixKey = typeof isRecruiterMode !== 'undefined' && isRecruiterMode ? 'share_tech_prefix' : 'share_exec_prefix';
    const linkPrefixKey = typeof isRecruiterMode !== 'undefined' && isRecruiterMode ? 'share_link_tech_prefix' : 'share_link_exec_prefix';
    const prefix = typeof t === 'function' ? t(prefixKey) : 'Share on';
    const linkPrefix = typeof t === 'function' ? t(linkPrefixKey) : 'Share link';

    container.querySelectorAll('.share-icon-btn').forEach(btn => {
        const network = btn.dataset.network;
        const tooltip = btn.querySelector('.action-tooltip');
        let labelText = '';

        if (network === 'native') labelText = linkPrefix;
        else if (network === 'linkedin') labelText = `${prefix} LinkedIn`;
        else if (network === 'x') labelText = `${prefix} X`;
        else if (network === 'fb') labelText = `${prefix} Facebook`;

        if (tooltip) tooltip.textContent = labelText;
        btn.setAttribute('aria-label', labelText);
    });
};

const attachNewShareBtns = (container, item) => {
    const shareActionsContainer = container.querySelector(`#share-actions-${item.id}`);
    if (!shareActionsContainer) return;
    
    updateShareTooltips(shareActionsContainer);

    const shareBtns = shareActionsContainer.querySelectorAll('.share-icon-btn');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const network = btn.dataset.network;
            const urlParams = new URLSearchParams(window.location.search);
            const currentLang = urlParams.get('lang') || (typeof window.currentLang !== 'undefined' ? window.currentLang : 'en');
            const viewParam = typeof isRecruiterMode !== 'undefined' && isRecruiterMode ? 'tech' : 'exec';

            const url = `${window.location.origin}${window.location.pathname}?case=${item.slug || item.id}&lang=${currentLang}&view=${viewParam}`;
            const shareText = (typeof isRecruiterMode !== 'undefined' && isRecruiterMode) ? (item.descRecruiter ? item.descRecruiter.substring(0, 100) + '...' : item.title) : item.aiSummary;
            const encodedUrl = encodeURIComponent(url);
            const encodedText = encodeURIComponent(shareText);

            if (network === 'native') {
                if (navigator.share) {
                    try { await navigator.share({ title: item.title, text: shareText, url: url }); } catch(err) {}
                } else {
                    navigator.clipboard.writeText(url);
                    const tt = btn.querySelector('.action-tooltip');
                    if(tt) {
                        const oldText = tt.textContent;
                        tt.textContent = typeof t === 'function' ? t('copied') : 'Copied';
                        setTimeout(() => tt.textContent = oldText, 2000);
                    }
                }
            } else if (network === 'linkedin') {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
            } else if (network === 'x') {
                window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank');
            } else if (network === 'fb') {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
            }
        });
        
        // Ensure buttons can be triggered via keyboard
        btn.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });
};

function initPortfolio() {
    if (typeof portfolioCases === 'undefined') return;

    gallery.innerHTML = '';
    caseSliderContainer.innerHTML = '';
    const dotsContainer = document.getElementById('slider-dots-container');
    if (dotsContainer) dotsContainer.innerHTML = '';

    portfolioCases.forEach((item, index) => {
       const isUnlocked = sessionStorage.getItem(`unlocked_${item.id}`) === 'true';
        const isLocked = item.isProtected && !isUnlocked;
        
        const displayTitle = isLocked ? (item.employer ? t('protected_employer_case').replace('{employer}', item.employer) : t('protected_case')) : item.title;

        // --- 1. HOME GALLERY ---
        const galleryItem = document.createElement('div');
        galleryItem.className = `gallery-item ${item.deviceClass || ''}`;
        if (item.customGap) galleryItem.style.marginRight = item.customGap;

        const thumb = document.createElement('div');
        thumb.className = `case-thumb-wrapper`;
        thumb.dataset.caseId = item.id; 
        thumb.tabIndex = 0; 
        
        const priorityAttr = index === 0 ? 'fetchpriority="high"' : '';
        
        const thumbImageHTML = isLocked 
            ? `<img src="${item.thumbSrc}" class="case-thumb-img locked-thumb-img" alt="Protected">`
            : `<img src="${item.thumbSrc}" class="case-thumb-img" alt="Thumbnail ${item.title}" ${priorityAttr}>`;
            
        const thumbLogoHTML = (item.logoUrl && item.logoUrl.trim() !== "" && !isLocked) 
            ? `<img src="${item.logoUrl}" class="gallery-item-logo" alt="${item.title} Logo" onerror="this.remove();">`
            : "";
        
        thumb.innerHTML = `${thumbImageHTML}${thumbLogoHTML}`;

        let functionalPillsHTML = '';
        if (item.videoSrc && item.videoSrc.trim() !== "") functionalPillsHTML += `<span class="gallery-pill">${t('btn_pitch')}</span>`;
        if (item.repositoryUrl && item.repositoryUrl.trim() !== "") functionalPillsHTML += `<span class="gallery-pill">${t('btn_repo')}</span>`;
        if (item.liveUrl && item.liveUrl.trim() !== "") functionalPillsHTML += `<span class="gallery-pill">${t('btn_demo')}</span>`;

        let readTimeHTML = item.readTime ? `
            <span class="gallery-read-time">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${item.readTime}
            </span>` : '';

        const shortDescHTML = isLocked 
            ? `<p class="gallery-item-shortdesc locked-shortdesc">Protected content placeholder.</p>` 
            : (item.shortDesc ? `<p class="gallery-item-shortdesc">${item.shortDesc}</p>` : '');
        
        const lockClosedIcon = `<svg class="lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        const lockOpenIcon = `<svg class="lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
        
        const lockIconHTML = item.isProtected ? (isUnlocked ? lockOpenIcon : lockClosedIcon) : '';

        const metaContainer = document.createElement('div');
        metaContainer.className = 'gallery-item-meta';
        metaContainer.innerHTML = `
            <div class="gallery-item-header no-logo">
                <div class="gallery-item-text">
                    <div class="gallery-item-title-wrapper">
                        <h4 class="gallery-item-title">${lockIconHTML}${displayTitle}</h4>
                        ${isLocked ? '' : readTimeHTML}
                    </div>
                    ${shortDescHTML}
                </div>
            </div>
            <div class="gallery-item-pills">${isLocked ? '' : functionalPillsHTML}</div>
        `;

        galleryItem.appendChild(thumb);
        galleryItem.appendChild(metaContainer);

        galleryItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isPreventingClicks) return;
            if (typeof gtag === 'function') gtag('event', 'select_content', { content_type: 'portfolio_case', item_id: item.id, item_name: item.title });
            openCaseView(item, thumb, index); 
        });
        
        galleryItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openCaseView(item, thumb, index); }
        });
        
        gallery.appendChild(galleryItem);
        
        // --- 2. DETAIL SLIDER ---
        const slide = document.createElement('div');
        slide.className = `case-slide-wrapper ${item.deviceClass || ''}`;
        slide.dataset.caseId = item.id;
        
        let actionsHTML = '';
        const hasVideo = item.videoSrc && item.videoSrc.trim() !== "";
        const hasRepo = item.repositoryUrl && item.repositoryUrl.trim() !== "";
        const hasLive = item.liveUrl && item.liveUrl.trim() !== "";

        if (hasVideo || hasRepo || hasLive) {
            actionsHTML += `<div class="case-actions-group">`;
            if (hasVideo) actionsHTML += `<button class="btn-play-pill btn-play-case" data-id="${item.id}" tabindex="-1" aria-label="${t('play_video')}"><span class="play-icon-circle"><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="black"/></svg></span><span>${t('btn_pitch')}</span><span class="action-tooltip">${t('play_video_presentation')}<kbd>Enter</kbd></span></button>`;
            if (hasRepo) actionsHTML += `<a href="${item.repositoryUrl}" target="_blank" class="btn-secondary-pill" tabindex="-1" aria-label="${t('repository_code')}"><span>${t('repository')}</span><span class="action-tooltip">${t('github_directory')}</span></a>`;
            if (hasLive) actionsHTML += `<a href="${item.liveUrl}" target="_blank" class="btn-secondary-pill" tabindex="-1" aria-label="${t('live_demo')}"><span>${t('btn_demo')}</span><span class="action-tooltip">${t('live_demonstration')}</span></a>`;
            actionsHTML += `</div>`;
        }
        
        const caseLogoHTML = (item.logoUrl && item.logoUrl.trim() !== "") 
            ? `<img src="${item.logoUrl}" class="case-detail-logo" alt="${item.title} Logo" onerror="this.style.display='none'">`
            : "";
            
        const caseMediaHTML = isLocked
            ? `<img src="${item.thumbSrc}" class="case-thumb-img locked-main-img" id="locked-img-${item.id}" alt="Protected">`
            : `<img src="${item.thumbSrc}" class="case-thumb-img" alt="Thumbnail ${item.title}"> ${caseLogoHTML}`;

        const caseTitleHTML = isLocked
            ? ``
            : `<h3 class="case-year-label">${item.year}</h3>
               <div class="case-title-row">
                   <h2>${item.title}</h2>
                   <div class="case-share-actions" id="share-actions-${item.id}">
                       <button class="share-icon-btn" aria-label="Share" data-network="native" tabindex="-1">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                           <span class="action-tooltip">Share</span>
                       </button>
                       <button class="share-icon-btn" aria-label="Share on LinkedIn" data-network="linkedin" tabindex="-1">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                           <span class="action-tooltip">LinkedIn</span>
                       </button>
                       <button class="share-icon-btn" aria-label="Share on X" data-network="x" tabindex="-1">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.73 16h5L9 4H4z"></path><path d="M4 20l6.76-6.76"></path><path d="M20 4l-6.76 6.76"></path></svg>
                           <span class="action-tooltip">X</span>
                       </button>
                       <button class="share-icon-btn" aria-label="Share on Facebook" data-network="fb" tabindex="-1">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                           <span class="action-tooltip">Facebook</span>
                       </button>
                   </div>
               </div>
               ${actionsHTML}`;
        
        let initialContent = item.desc || "";
        if (isRecruiterMode && item.descRecruiter) initialContent = item.descRecruiter;
        else if (!item.desc && item.descRecruiter) initialContent = item.descRecruiter;
        else if (!item.descRecruiter && item.desc) initialContent = item.desc;
        
        const metricsHTML = (item.keyIndicators && item.keyIndicators.length > 0) ? `<div class="summary-metrics-grid hidden-default">${item.keyIndicators.map(ind => `<div class="summary-metric-card"><span class="metric-value">${ind.value}</span><span class="metric-label">${ind.label}</span></div>`).join('')}</div>` : '';
        const followUpsHTML = (item.aiFollowUps || []).map(q => `<button class="suggestion-chip" onclick="submitInlineAi('${item.id}', \`${q}\`)">${q}</button>`).join('');

        const aiSummaryHTML = item.aiSummary ? `
            <div class="ai-summary-block" data-case-id="${item.id}">
                <div class="ai-summary-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></svg>
                    <span>${t('ai_summary')}</span>
                </div>
                <p class="ai-summary-text" data-text="${item.aiSummary.replace(/"/g, '&quot;')}"></p>
                ${metricsHTML}
            </div>
        ` : '';

        let contentToRender = "";

        if (item.isProtected && !isUnlocked) {
            contentToRender = `
                <div class="protected-case-ui">
                    <div class="protected-case-card">
                        <svg class="protected-case-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <h3 class="protected-case-title">${displayTitle}</h3>
                        <p class="protected-case-desc">${t('enter_passcode')}</p>
                        <div class="protected-case-form">
                            <input type="text" id="pass-input-${item.id}" class="protected-case-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" placeholder="${t('passcode')}">
                            <button id="btn-unlock-${item.id}" class="protected-case-btn">${t('unlock')}</button>
                        </div>
                        <p id="pass-error-${item.id}" class="protected-case-error"></p>
                    </div>
                </div>
            `;
        } else {
            contentToRender = aiSummaryHTML + `<div class="case-description-body">${initialContent}</div>`;
        }

        slide.innerHTML = `
            <div class="case-layout">
                <div class="case-media" id="media-${item.id}">
                    ${caseMediaHTML}
                </div>
                <div class="case-info-container">
                    <div class="case-info-scroll" id="scroll-${item.id}">
                        <div class="case-info-content">
                            <div class="case-header-row">
                                <div class="case-title-block" id="title-block-${item.id}">
                                    ${caseTitleHTML}
                                </div>
                            </div>
                            <div id="dynamic-content-${item.id}">
                                ${contentToRender}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        caseSliderContainer.appendChild(slide);
        setupCaseScrollEffect(item.id);

        if (item.isProtected) {
            const unlockBtn = slide.querySelector(`#btn-unlock-${item.id}`);
            const passInput = slide.querySelector(`#pass-input-${item.id}`);
            const errorMsg = slide.querySelector(`#pass-error-${item.id}`);
            
            if (unlockBtn && passInput) {
                const handleUnlock = () => {
                    if (passInput.value === item.password) {
                        sessionStorage.setItem(`unlocked_${item.id}`, 'true');
                        syncToggleForCurrentCase();
                        
                        const galleryThumb = document.querySelector(`.case-thumb-wrapper[data-case-id="${item.id}"]`);
                        if (galleryThumb) {
                            galleryThumb.innerHTML = `<img src="${item.thumbSrc}" class="case-thumb-img" alt="Thumbnail ${item.title}">${item.logoUrl ? `<img src="${item.logoUrl}" class="gallery-item-logo" alt="${item.title} Logo">` : ''}`;
                            const gTitleWrapper = galleryThumb.nextElementSibling.querySelector('.gallery-item-title-wrapper');
                            
                            if (gTitleWrapper) gTitleWrapper.innerHTML = `<h4 class="gallery-item-title">${lockOpenIcon}${item.title}</h4>${readTimeHTML}`;
                            
                            const pWrapper = galleryThumb.nextElementSibling.querySelector('.gallery-item-pills');
                            if (pWrapper) pWrapper.innerHTML = functionalPillsHTML;
                            const tWrapper = galleryThumb.nextElementSibling.querySelector('.gallery-item-text');
                            const placeholderDesc = tWrapper.querySelector('.gallery-item-shortdesc');
                            if (placeholderDesc) {
                                placeholderDesc.innerHTML = item.shortDesc;
                                placeholderDesc.classList.remove('locked-shortdesc');
                            }
                        }

                        const lockedImg = slide.querySelector(`#locked-img-${item.id}`);
                        if (lockedImg) {
                            lockedImg.classList.remove('locked-main-img');
                            setTimeout(() => lockedImg.insertAdjacentHTML('afterend', caseLogoHTML), 600);
                        }

                        const uiBox = slide.querySelector('.protected-case-ui');
                        if (uiBox) {
                            uiBox.style.opacity = '0';
                            uiBox.style.transform = 'translateY(15px) scale(0.98)';
                        }
                        
                        const dynContainer = slide.querySelector(`#dynamic-content-${item.id}`);
                        const titleBlock = slide.querySelector(`#title-block-${item.id}`);
                        
                        setTimeout(() => {
                            if (titleBlock) {
                                titleBlock.innerHTML = `<div class="reveal-anim reveal-anim-title"><h3 class="case-year-label">${item.year}</h3><h2>${item.title}</h2>${actionsHTML}</div>`;
                                const newPlayBtn = titleBlock.querySelector('.btn-play-case');
                                if (newPlayBtn) {
                                    newPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); playSpecificCase(item.id); });
                                    newPlayBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playSpecificCase(item.id); }});
                                }
                            }

                            dynContainer.innerHTML = `<div class="reveal-anim reveal-anim-summary">${aiSummaryHTML}</div><div class="reveal-anim reveal-anim-desc case-description-body">${initialContent}</div>`;
                            
                            const newDescBody = dynContainer.querySelector('.case-description-body');
                            if (typeof initComboAssets === 'function') initComboAssets(newDescBody);
                            if (typeof attachAudioPlayer === 'function') attachAudioPlayer(newDescBody, item.id);
                            if (typeof rebuildTOC === 'function') rebuildTOC(slide);
                            attachNewShareBtns(slide, item);
                            if (window.triggerAiTyping) window.triggerAiTyping(dynContainer);

                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    const reveals = slide.querySelectorAll('.reveal-anim');
                                    reveals.forEach(el => {
                                        el.style.opacity = '1';
                                        el.style.transform = 'translateY(0)';
                                    });
                                });
                            });
                        }, 350); 
                    } else {
                        errorMsg.innerText = t('incorrect_passcode');
                        errorMsg.style.opacity = '1';
                        passInput.value = "";
                        setTimeout(() => errorMsg.style.opacity = '0', 3000);
                    }
                };

                unlockBtn.addEventListener('click', handleUnlock);
                passInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUnlock(); });
            }
        } else if (isUnlocked || !item.isProtected) {
            const finalDescBody = slide.querySelector('.case-description-body');
            if (finalDescBody) {
                attachAudioPlayer(finalDescBody, item.id);
                initComboAssets(finalDescBody); 
            }
            attachNewShareBtns(slide, item);
        }

        if (window.Prism) { window.Prism.highlightAllUnder(slide); }
        slideObserver.observe(slide); 
        
        // --- 3. SLIDER DOTS & SEARCH UI ---
        if (dotsContainer && index === 0) {
            dotsContainer.innerHTML = `
                <div class="search-autocomplete-results" id="search-autocomplete"></div>
                <div class="drag-tutorial" id="drag-tutorial">${t('swipe_explore')}</div>
                <div class="slider-search-wrapper">
                    <button class="btn-case-search" id="btn-case-search" aria-label="Search cases">
                        <svg class="icon-search" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <svg class="icon-close" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <span class="action-tooltip">Search <kbd><span class="os-mod"></span>K</kbd></span>
                    </button>
                    <input type="text" id="case-search-input" class="case-search-input" placeholder="${t('search_cases')}" autocomplete="off">
                </div>
                <div class="slider-dots-wrapper" id="slider-dots-wrapper"></div>
            `;
        }

        if (dotsContainer) {
            const dotsWrapper = document.getElementById('slider-dots-wrapper');
            const dot = document.createElement('div');
            dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
            dot.tabIndex = 0; 
            dot.setAttribute('role', 'button');

            const scrollToThisSlide = () => {
                const targetSlide = caseSliderContainer.querySelectorAll('.case-slide-wrapper')[index];
                if (targetSlide) {
                    const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');
                    targetSlide.scrollIntoView({ inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
                }
            };

            dot.addEventListener('click', (e) => { e.stopPropagation(); scrollToThisSlide(); });
            dotsWrapper.appendChild(dot);
        }

        // --- 4. TABLE OF CONTENTS ---
        rebuildTOC(slide);
    });

    const finalDotsContainer = document.getElementById('slider-dots-container');
    if (finalDotsContainer) setupDotsDrag(finalDotsContainer, caseSliderContainer);

    initCaseSearch();

    document.querySelectorAll('.btn-play-case').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); playSpecificCase(btn.dataset.id);
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); playSpecificCase(btn.dataset.id);
            }
        });
    });
}

function rebuildTOC(slide) {
    const descBody = slide.querySelector('.case-description-body');
    const scrollContainer = slide.querySelector('.case-info-scroll');
    const layout = slide.querySelector('.case-layout');
    if (!descBody || !scrollContainer || !layout) return;

    const oldToc = layout.querySelector('.case-toc');
    if (oldToc) oldToc.remove();

    const headings = descBody.querySelectorAll('h3');
    if (headings.length === 0) return;

    const tocContainer = document.createElement('div');
    const isActivelyViewed = activeCaseData && slide.dataset.caseId === activeCaseData.id;
    tocContainer.className = isActivelyViewed ? 'case-toc is-transitioning' : 'case-toc';
    
    const btnTopo = document.createElement('div');
    btnTopo.className = 'toc-item active'; 
    btnTopo.classList.add('toc-item-top');
    btnTopo.innerHTML = `
        <div class="toc-text-wrapper"><div class="toc-text">${t('back_to_top')}</div></div>
        <span class="toc-dash toc-dash-dot"></span>
    `;
    btnTopo.addEventListener('click', (e) => {
        e.stopPropagation();
        scrollContainer._isAnimating = false;
        if (scrollContainer._animationFrameId) cancelAnimationFrame(scrollContainer._animationFrameId);
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    });
    tocContainer.appendChild(btnTopo);

    headings.forEach((h3) => {
        const tocItem = document.createElement('div');
        tocItem.className = 'toc-item'; 
        tocItem.innerHTML = `
            <div class="toc-text-wrapper"><div class="toc-text">${h3.innerText}</div></div>
            <span class="toc-dash"></span>
        `;
        tocItem.addEventListener('click', (e) => {
            e.stopPropagation(); 
            scrollContainer._isAnimating = false;
            if (scrollContainer._animationFrameId) cancelAnimationFrame(scrollContainer._animationFrameId);
            
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const h3Top = h3.getBoundingClientRect().top;
            const currentScroll = scrollContainer.scrollTop;
            
            // We set the target to 180px from the top to safely clear the top header UI and max padding
            const targetPos = currentScroll + (h3Top - containerTop) - 180; 
            
            scrollContainer.scrollTo({ top: targetPos, behavior: 'smooth' });
        });
        tocContainer.appendChild(tocItem);
    });
    
    layout.appendChild(tocContainer);
    
    if (!scrollContainer._hasTocListener) {
        scrollContainer.addEventListener('scroll', () => {
            let currentActive = 0; 
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const currentHeadings = slide.querySelectorAll('.case-description-body h3');
            const currentToc = slide.querySelector('.case-toc');
            if (!currentToc) return;

            currentHeadings.forEach((h3, i) => {
                const h3Top = h3.getBoundingClientRect().top;
                // We check against 195px (180px scroll offset + 15px buffer) so it highlights perfectly on arrival
                if ((h3Top - containerTop) <= 195) { currentActive = i + 1; }
            });
            
            const scrollDifference = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
            const isAtBottom = scrollDifference <= 25;
            
            if (isAtBottom && currentHeadings.length > 0) {
                currentActive = currentHeadings.length;
            }
            
            const tocItems = currentToc.querySelectorAll('.toc-item');
            tocItems.forEach(item => item.classList.remove('active'));
            if (tocItems[currentActive]) tocItems[currentActive].classList.add('active');
        });
        scrollContainer._hasTocListener = true;
    }
}

function initDeepLinkingAndResume() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetCaseId = window.location.hash.replace('#', '') || urlParams.get('case');
    const targetPIndex = urlParams.get('p'); 

    if (targetCaseId) {
        const targetIndex = portfolioCases.findIndex(c => c.slug === targetCaseId || c.id === targetCaseId);
        if (targetIndex !== -1) {
            document.documentElement.classList.add('bypassed-entrance');
            setTimeout(() => {
                const thumb = document.querySelector(`.case-thumb-wrapper[data-case-id="${portfolioCases[targetIndex].id}"]`);
                if (thumb) {
                    openCaseView(portfolioCases[targetIndex], thumb, targetIndex);
                    
                    if (targetPIndex !== null) {
                        setTimeout(() => {
                            const descBody = document.querySelector(`.case-slide-wrapper[data-case-id="${portfolioCases[targetIndex].id}"] .case-description-body`);
                            if (descBody) {
                                const paragraphs = Array.from(descBody.querySelectorAll('p'));
                                const targetParagraph = paragraphs[parseInt(targetPIndex, 10)];
                                
                                if (targetParagraph) {
                                    const scrollContainer = document.getElementById(`scroll-${portfolioCases[targetIndex].id}`);
                                    if (scrollContainer) {
                                        const containerTop = scrollContainer.getBoundingClientRect().top;
                                        const pTop = targetParagraph.getBoundingClientRect().top;
                                        const currentScroll = scrollContainer.scrollTop;
                                        
                                        scrollContainer.scrollTo({ top: currentScroll + (pTop - containerTop) - 100, behavior: 'smooth' });
                                        
                                        targetParagraph.classList.add('paragraph-highlight');
                                        targetParagraph.setAttribute('aria-current', 'true');
                                        
                                        setTimeout(() => {
                                            targetParagraph.classList.remove('paragraph-highlight');
                                            targetParagraph.removeAttribute('aria-current');
                                        }, 2500);
                                    }
                                }
                            }
                        }, 1200); 
                    }
                }
            }, 100);
            return;
        }
    }

    switchView('home');

    const resumeCaseId = localStorage.getItem('resumeCaseId');
    const resumeScrollTop = localStorage.getItem('resumeScrollTop');
    
    if (resumeCaseId && resumeScrollTop) {
        const caseData = portfolioCases.find(c => c.id === resumeCaseId);
        if (caseData) {
            const toast = document.createElement('div');
            toast.className = 'resume-reading-toast';
            
            // A11Y: Establish proper button roles and keyboard focus
            toast.setAttribute('role', 'button');
            toast.setAttribute('tabindex', '0');
            toast.setAttribute('aria-label', `${t('resume_reading')} ${caseData.title}`);
            
            // i18n variables successfully retained and ARIA hidden applied to raw text to avoid screen reader duplication
            toast.innerHTML = `
                <span aria-hidden="true">${t('resume_reading')} <strong>${caseData.title}</strong></span> 
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 1500);

            // Extracted logic so it can be called by both pointer and keyboard
            const triggerResume = () => {
                toast.classList.remove('show');
                document.documentElement.classList.add('bypassed-entrance');
                const targetIndex = portfolioCases.findIndex(c => c.id === caseData.id);
                const thumb = document.querySelector(`.case-thumb-wrapper[data-case-id="${caseData.id}"]`);
                
                openCaseView(caseData, thumb, targetIndex);
                
                setTimeout(() => {
                    const scrollEl = document.getElementById(`scroll-${caseData.id}`);
                    if (scrollEl) scrollEl.scrollTo({ top: parseInt(resumeScrollTop), behavior: 'smooth' });
                }, 800);
            };

            toast.addEventListener('click', triggerResume);
            
            // A11Y: Bind keyboard execution logic
            toast.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    triggerResume();
                }
            });

            setTimeout(() => {
                if (toast.classList.contains('show')) toast.classList.remove('show');
            }, 8000);
        }
    }
}

/* ==========================================================================
   GLOBAL NAVIGATION & EVENT LISTENERS
   ========================================================================== */
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());

const currentCrumbEl = document.getElementById('crumb-current');
if (currentCrumbEl) {
    currentCrumbEl.addEventListener('click', () => {
        if (document.body.getAttribute('data-active-view') === 'player') {
            const stopBtn = document.getElementById('btn-stop');
            if (stopBtn) stopBtn.click();
        }
    });
}

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modSymbol = isMac ? '⌥ ' : 'Alt ';
document.querySelectorAll('.os-mod').forEach(el => el.textContent = modSymbol);

const homeBtnEl = document.getElementById('home-button');
if (homeBtnEl) {
    homeBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentView = document.body.getAttribute('data-active-view');
        
        if (currentView === 'player') {
            const stopBtn = document.getElementById('btn-stop');
            if (stopBtn) stopBtn.click();
            return;
        }

        let targetView = 'home';
        if (currentView === 'about') {
            const priorView = viewHistory.slice().reverse().find(v => v !== 'about');
            targetView = priorView || 'home';
        } else if (currentView === 'case') {
            targetView = 'home';
        }
        
        document.documentElement.classList.remove('slide-up-transition');
        document.documentElement.classList.add('slide-down-transition');
        if (views.player.style.display === 'flex') unloadVideo(false); 
        
        const activeId = activeCaseData ? activeCaseData.id : null;
        const activeThumb = activeId ? document.querySelector(`.case-thumb-wrapper[data-case-id="${activeId}"]`) : null;
        
        if (activeThumb && activeId) {
            prepareMorph(activeThumb, `media-${activeId}`, true);
        }
        
        transitionTo(targetView, () => {
            if (targetView === 'home' && activeThumb) {
                const galleryEl = document.getElementById('gallery');
                if (galleryEl) {
                    galleryEl.style.scrollBehavior = 'auto'; 
                    const thumbRect = activeThumb.getBoundingClientRect();
                    const galleryRect = galleryEl.getBoundingClientRect();
                    galleryEl.scrollLeft += (thumbRect.left + thumbRect.width / 2) - (galleryRect.left + galleryRect.width / 2);
                    setTimeout(() => { galleryEl.style.scrollBehavior = ''; }, 50);
                }
            }
        }); 
    });
}

document.getElementById('crumb-home').addEventListener('click', () => {
    const btn = document.getElementById('home-button');
    if(btn) btn.click();
});

const aboutBtnEl = document.getElementById('about-button');
if (aboutBtnEl) {
    aboutBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        prepareMorph(null, false);
        transitionTo('about');
    });
    aboutBtnEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); aboutBtnEl.click(); }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const isMod = e.altKey;
    const checkKey = (code, letter) => e.code === code || e.key.toLowerCase() === letter;

    if (isMod && checkKey('KeyI', 'i')) {
        e.preventDefault();
        const btn = document.getElementById('about-button');
        if (btn && !btn.classList.contains('hidden')) btn.click();
    }
    
    if (e.key === 'Backspace') {
        const returnBtn = document.getElementById('home-button');
        if (returnBtn && !returnBtn.classList.contains('hidden')) {
            e.preventDefault();
            returnBtn.click();
        }
    }

    if (views.player.classList.contains('active')) {
        if (e.code === 'Space') { 
            e.preventDefault(); 
            const btn = document.getElementById('btn-pause');
            if (btn) btn.click(); 
        }
        if (checkKey('KeyM', 'm')) { 
            e.preventDefault(); 
            const btn = document.getElementById('btn-mute');
            if (btn) btn.click(); 
        }
        if (checkKey('KeyC', 'c')) { 
            e.preventDefault(); 
            const btn = document.getElementById('btn-cc');
            if (btn) btn.click(); 
        }
        if (checkKey('KeyS', 's')) { 
            e.preventDefault(); 
            const btn = document.getElementById('btn-speed');
            if (btn) btn.click(); 
        }
        if (checkKey('KeyX', 'x')) { 
            e.preventDefault(); 
            const btn = document.getElementById('btn-stop');
            if (btn) btn.click(); 
        }
    }
    if (isMod && checkKey('KeyK', 'k')) {
        e.preventDefault();
        const btn = document.getElementById('btn-case-search');
        const searchInput = document.getElementById('case-search-input');
        if (btn && searchInput) {
            if (!document.getElementById('slider-dots-container').classList.contains('search-active')) {
                btn.click();
            } else {
                searchInput.focus();
            }
        }
    }
    

    if (isMod && checkKey('KeyV', 'v')) {
        e.preventDefault();
        const btn = document.getElementById('btn-mode-toggle');
        if (btn && !btn.classList.contains('hidden') && !btn.classList.contains('no-tech-view') && !btn.classList.contains('no-overview')) {
            btn.click();
        }
    }

    if (isMod && checkKey('KeyL', 'l')) {
        e.preventDefault();
        const btn = document.getElementById('btn-lang');
        if (btn) btn.click();
    }

    if (isMod && checkKey('KeyA', 'a')) {
        e.preventDefault();
        const btn = document.getElementById('btn-a11y');
        if (btn && !views.case.classList.contains('active')) btn.click(); // Prevent conflict if they are in the case view looking for the Audio shortcut
    }

    // --- AI AUDIO PLAYER SHORTCUTS ---
    if (views.case.classList.contains('active') && activeCaseData) {
        const wrapper = document.querySelector(`.case-audio-player[data-case-id="${activeCaseData.id}"]`);
        if (wrapper) {
            if (e.shiftKey && checkKey('KeyP', 'p')) {
                e.preventDefault();
                wrapper.querySelector('.btn-tts-play').click();
            }
            if (e.shiftKey && checkKey('KeyS', 's')) {
                e.preventDefault();
                wrapper.querySelector('.btn-tts-speed').click();
            }
            if (e.shiftKey && checkKey('KeyH', 'h')) {
                e.preventDefault();
                wrapper.querySelector('.btn-tts-hide').click();
            }
            if (e.shiftKey && checkKey('KeyA', 'a')) {
                e.preventDefault();
                wrapper.querySelector('.btn-tts-autoscroll').click();
            }
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Escape') {
        const activeLightbox = document.querySelector('.lightbox-overlay.active');
        if (activeLightbox) {
            activeLightbox.classList.remove('active');
            return; 
        }
        if (!views.home.classList.contains('active')) {
            document.getElementById('home-button').click(); 
        }
    }

    if (views.case.classList.contains('active')) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault(); 
            
            const slideWidth = window.innerWidth;
            const slides = caseSliderContainer.querySelectorAll('.case-slide-wrapper');
            if (slides.length === 0) return;

            let currentIndex = Math.round(caseSliderContainer.scrollLeft / slideWidth);
            let nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
            nextIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));

            const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');
            slides[nextIndex].scrollIntoView({
                inline: 'center',
                block: 'nearest',
                behavior: reduceMotion ? 'auto' : 'smooth'
            });

            const nextPlayBtn = slides[nextIndex].querySelector('.btn-play-case');
            if (nextPlayBtn) nextPlayBtn.focus({ preventScroll: true }); 
        } 
        else if (e.key === 'Enter') {
            const activeEl = document.activeElement;
            const isInteractiveFocused = activeEl.tagName === 'BUTTON' || 
                                         activeEl.id === 'home-button' || 
                                         activeEl.classList.contains('slider-dot');
            
            if (!isInteractiveFocused && activeCaseData && activeCaseData.videoSrc) {
                e.preventDefault();
                playSpecificCase(activeCaseData.id);
            }
        }
    }
});

const backBtnEl = document.getElementById('home-button'); 
if (backBtnEl) {
    backBtnEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); backBtnEl.click(); }
    });
}

let globalPointerDown = false;
let globalStartX = 0;
let globalStartY = 0;

window.addEventListener('pointerdown', (e) => {
    globalPointerDown = true;
    globalStartX = e.clientX;
    globalStartY = e.clientY;
}, { passive: true });

window.addEventListener('pointermove', (e) => {
    if (!globalPointerDown) return;
    if (Math.abs(e.clientX - globalStartX) > 5 || Math.abs(e.clientY - globalStartY) > 5) {
        isPreventingClicks = true; 
    }
}, { passive: true });

window.addEventListener('pointerup', () => {
    globalPointerDown = false;
    setTimeout(() => { isPreventingClicks = false; }, 50); 
});

document.body.addEventListener('click', (e) => {
    if (isPreventingClicks) return; 
    
    if (typeof gtag === 'function') {
        const link = e.target.closest('a');
        if (link) {
            if (link.href.includes('mailto:')) gtag('event', 'generate_lead', { method: 'email' });
            else if (link.href.includes('linkedin.com')) gtag('event', 'contact_click', { method: 'linkedin' });
            else if (link.href.includes('github.com')) gtag('event', 'contact_click', { method: 'github' });
        }
    }
}); 

document.getElementById('nav-about').addEventListener('click', (e) => {
    e.stopPropagation(); prepareMorph(null, false); transitionTo('about');
});
document.getElementById('nav-about').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); prepareMorph(null, false); transitionTo('about'); }
});

/* ==========================================================================
   INITIALIZATION PIPELINE
   ========================================================================== */
initPortfolio();
initDeepLinkingAndResume();

if (gallery) {
    setTimeout(() => {
        document.documentElement.classList.add('bypassed-entrance');
        console.log("🚀 Entrance sequence fully settled. Permanent bypass active.");
    }, 2000);

    const triggerImmediateBypass = () => document.documentElement.classList.add('bypassed-entrance');
    gallery.addEventListener('mousedown', triggerImmediateBypass, { passive: true });
    gallery.addEventListener('touchstart', triggerImmediateBypass, { passive: true });
}

const adminParams = new URLSearchParams(window.location.search);
if (adminParams.get('admin') === 'true') {
    localStorage.setItem('exclude_traffic', 'true');
    alert('Developer Mode Enabled! Your visits will no longer be tracked in this browser.');
    window.location.href = window.location.pathname; 
}