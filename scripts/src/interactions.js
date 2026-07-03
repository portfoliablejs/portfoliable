/* ==========================================================================
   BREADCRUMB HOVER & SYNC LOGIC
   ========================================================================== */
function populateBreadcrumbMenu(menuType = 'cases') {
    const menuId = menuType === 'presentations' ? 'breadcrumb-menu-player' : 'breadcrumb-menu';
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.innerHTML = '';
    
    portfolioCases.forEach((caseData, idx) => {
        if (activeCaseData && caseData.id === activeCaseData.id) return;
        if (menuType === 'presentations' && (!caseData.videoSrc || caseData.videoSrc.trim() === '')) return;

        const btn = document.createElement('button');
        const safeTitle = getSafeCaseTitle(caseData);
        
        const presentationPrefix = t('play_video_presentation') || 'Presentation';
        const title = menuType === 'presentations' ? `${presentationPrefix} - ${safeTitle}` : safeTitle;
        
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg> ${title}`;
        
        btn.addEventListener('click', () => {
            if (menuType === 'presentations') {
                playSpecificCase(caseData.id);
            } else {
                if (document.body.getAttribute('data-active-view') === 'player') {
                    const stopBtn = document.getElementById('btn-stop');
                    if (stopBtn) stopBtn.click();
                    
                    setTimeout(() => {
                        const slideWidth = window.innerWidth;
                        caseSliderContainer.scrollTo({ left: idx * slideWidth, behavior: 'instant' });
                    }, 550); 
                } else {
                    const slideWidth = window.innerWidth;
                    const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');
                    caseSliderContainer.scrollTo({
                        left: idx * slideWidth,
                        behavior: reduceMotion ? 'auto' : 'smooth'
                    });
                }
            }
            menu.classList.remove('show');
        });
        
        menu.appendChild(btn);
    });
}

const cCurrent = document.getElementById('crumb-current');
const cPlayer = document.getElementById('crumb-player');
const bMenu = document.getElementById('breadcrumb-menu');
const crumbHome = document.getElementById('crumb-home');

if (cCurrent && bMenu) {
    cCurrent.addEventListener('mouseenter', () => {
        if (document.body.getAttribute('data-active-view') === 'player' || document.body.getAttribute('data-active-view') === 'case') {
            populateBreadcrumbMenu('cases');
            bMenu.style.transform = 'translateX(0)'; 
        }
    });
}

const cPlayerWrapper = document.getElementById('crumb-current-player-wrapper');
const bMenuPlayer = document.getElementById('breadcrumb-menu-player');

if (cPlayerWrapper && bMenuPlayer) {
    cPlayerWrapper.addEventListener('mouseenter', () => {
        if (document.body.getAttribute('data-active-view') === 'player') {
            populateBreadcrumbMenu('presentations');
            bMenuPlayer.classList.add('show');
        }
    });
    cPlayerWrapper.addEventListener('mouseleave', () => {
        bMenuPlayer.classList.remove('show');
    });
}

if (crumbHome) {
    crumbHome.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        document.documentElement.classList.remove('slide-up-transition');
        document.documentElement.classList.add('slide-down-transition');
        
        if (document.body.getAttribute('data-active-view') === 'player') {
            unloadVideo(false);
            restorePlayerA11yPrefs();
        }
        
        const activeId = activeCaseData ? activeCaseData.id : null;
        const activeThumb = activeId ? document.querySelector(`.case-thumb-wrapper[data-case-id="${activeId}"]`) : null;
        
        if (activeThumb && activeId) {
            prepareMorph(activeThumb, `media-${activeId}`, true);
        }
        
        transitionTo('home', () => {
            if (activeThumb) {
                const galleryEl = document.getElementById('gallery');
                galleryEl.style.scrollBehavior = 'auto'; 
                const thumbRect = activeThumb.getBoundingClientRect();
                const galleryRect = galleryEl.getBoundingClientRect();
                galleryEl.scrollLeft += (thumbRect.left + thumbRect.width / 2) - (galleryRect.left + galleryRect.width / 2);
                setTimeout(() => { galleryEl.style.scrollBehavior = ''; }, 50);
            }
        });
    });
}

const crumbWrapper = document.getElementById('crumb-current-wrapper');
const crumbMenu = document.getElementById('breadcrumb-menu');
if (crumbWrapper && crumbMenu) {
    crumbWrapper.addEventListener('mouseenter', () => {
        if (viewHistory[viewHistory.length - 1] !== 'about') crumbMenu.classList.add('show');
    });
    crumbWrapper.addEventListener('mouseleave', () => {
        crumbMenu.classList.remove('show');
    });
}

/* ==========================================================================
   RECRUITER MODE TOGGLE ENGINE
   ========================================================================== */
const modeToggleBtn = document.getElementById('btn-mode-toggle');
let isRecruiterMode = localStorage.getItem('pref-recruiter-mode') === 'true';

function updateToggleSliderPosition() {
    if (!modeToggleBtn) return;
    const isCurrentlyRecruiter = modeToggleBtn.classList.contains('is-recruiter');
    const targetClass = isCurrentlyRecruiter ? '.mode-label.recruiter' : '.mode-label.executive';
    const activeSpan = modeToggleBtn.querySelector(targetClass);
    const slider = modeToggleBtn.querySelector('.mode-toggle-slider');
    
    if (activeSpan && slider) {
        slider.style.width = `${activeSpan.offsetWidth}px`;
        slider.style.transform = `translateX(${activeSpan.offsetLeft}px)`;
    }
}

function syncToggleForCurrentCase() {
    if (!modeToggleBtn) return;
    
    const isUnlocked = activeCaseData ? sessionStorage.getItem(`unlocked_${activeCaseData.id}`) === 'true' : true;
    const isLocked = activeCaseData && activeCaseData.isProtected && !isUnlocked;

    const divider = document.getElementById('mode-toggle-divider');
    if (isLocked) {
        modeToggleBtn.classList.add('is-hidden-locked');
        if (divider) divider.classList.add('is-hidden-locked');
        return;
    } else {
        modeToggleBtn.classList.remove('is-hidden-locked');
        if (divider) divider.classList.remove('is-hidden-locked');
    }

    const hasTech = !!(activeCaseData && activeCaseData.descRecruiter);
    const hasOverview = !!(activeCaseData && activeCaseData.desc);
    
    modeToggleBtn.classList.remove('no-tech-view', 'no-overview');

    if (hasOverview && !hasTech) {
        modeToggleBtn.classList.add('no-tech-view');
        modeToggleBtn.classList.remove('is-recruiter');
    } else if (!hasOverview && hasTech) {
        modeToggleBtn.classList.add('no-overview');
        modeToggleBtn.classList.add('is-recruiter');
    } else {
        modeToggleBtn.classList.toggle('is-recruiter', isRecruiterMode);
    }
}

if (modeToggleBtn) {
    if (isRecruiterMode) modeToggleBtn.classList.add('is-recruiter');
    
    const toggleObserver = new ResizeObserver(() => updateToggleSliderPosition());
    toggleObserver.observe(modeToggleBtn);
    modeToggleBtn.querySelectorAll('.mode-label').forEach(label => toggleObserver.observe(label));
    
    if (document.fonts) document.fonts.ready.then(updateToggleSliderPosition);

    modeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modeToggleBtn.classList.contains('no-tech-view') || modeToggleBtn.classList.contains('no-overview')) return; 

        isRecruiterMode = !isRecruiterMode;
        localStorage.setItem('pref-recruiter-mode', isRecruiterMode);
        
        modeToggleBtn.classList.toggle('is-recruiter', isRecruiterMode);
        updateToggleSliderPosition();
        updateAllCasesText(); 

        if (activeCaseData) {
            const scrollEl = document.getElementById(`scroll-${activeCaseData.id}`);
            if (scrollEl) {
                scrollEl._isAnimating = false;
                if (scrollEl._animationFrameId) cancelAnimationFrame(scrollEl._animationFrameId);
                scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        setTimeout(() => {
            if (typeof currentAudioFile !== 'undefined' && currentAudioFile) {
                currentAudioFile.pause();
            }
            resetTTSStopped();
        }, 50);
    });
}

function updateAllCasesText() {
    portfolioCases.forEach(caseData => {
        const slide = document.querySelector(`.case-slide-wrapper[data-case-id="${caseData.id}"]`);
        if (!slide) return;
        
        const descBody = slide.querySelector('.case-description-body');
        const currentToc = slide.querySelector('.case-toc'); 
        if (!descBody) return;

        let newContent = caseData.desc || ""; 
        if (isRecruiterMode && caseData.descRecruiter) {
            newContent = caseData.descRecruiter; 
        } else if (!caseData.desc && caseData.descRecruiter) {
            newContent = caseData.descRecruiter; 
        } else if (!caseData.descRecruiter && caseData.desc) {
            newContent = caseData.desc; 
        }

        if (activeCaseData && caseData.id === activeCaseData.id) {
            descBody.classList.add('is-transitioning');
            if (currentToc) currentToc.classList.add('is-transitioning');
            const shareActions = slide.querySelector('.case-share-actions');
            if (shareActions) shareActions.classList.add('is-transitioning');
            
            setTimeout(() => {
                descBody.innerHTML = newContent;
                attachAudioPlayer(descBody, caseData.id);
                
                rebuildTOC(slide); 
                initComboAssets(descBody); 
                if (shareActions && typeof updateShareTooltips === 'function') updateShareTooltips(shareActions);
                
                if (window.Prism) { window.Prism.highlightAllUnder(descBody); }
                
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        descBody.classList.remove('is-transitioning');
                        const newToc = slide.querySelector('.case-toc');
                        if (newToc) newToc.classList.remove('is-transitioning');
                        if (shareActions) shareActions.classList.remove('is-transitioning');
                    });
                });
            }, 400); 
        } else {
            descBody.innerHTML = newContent;
            attachAudioPlayer(descBody, caseData.id);
            rebuildTOC(slide); 
            initComboAssets(descBody); 
            const shareActions = slide.querySelector('.case-share-actions');
            if (shareActions && typeof updateShareTooltips === 'function') updateShareTooltips(shareActions);
            if (window.Prism) { window.Prism.highlightAllUnder(descBody); }
        }
    });
}

/* ==========================================================================
   COMBO ASSET INTERACTIVITY ENGINE
   ========================================================================== */
function initComboAssets(container) {
    if (!container) return;

    const renderMermaidSafely = () => {
        if (!window.mermaid) {
            setTimeout(renderMermaidSafely, 100);
            return;
        }

        container.querySelectorAll('.live-mermaid-container').forEach((diagramContainer, elementIndex) => {
            if (diagramContainer.getAttribute('data-processed') === 'true') return;
            
            const rawDiagramMarkup = diagramContainer.textContent.trim();
            if (!rawDiagramMarkup) return;
            
            const a11yTitle = diagramContainer.getAttribute('data-a11y-title') || "System Architecture Diagram";
            const uniqueGraphId = `mermaid-render-vector-${Date.now()}-${elementIndex}`;
            diagramContainer.innerHTML = `<div id="${uniqueGraphId}" class="mermaid-svg-payload" aria-hidden="true"></div>`;
            
            window.mermaid.render(uniqueGraphId, rawDiagramMarkup).then(({ svg }) => {
                diagramContainer.setAttribute('role', 'img');
                diagramContainer.setAttribute('aria-label', a11yTitle);
                diagramContainer.innerHTML = svg;
                diagramContainer.setAttribute('data-processed', 'true');
            }).catch((renderFault) => {
                diagramContainer.innerHTML = `<p class="chart-fault-label">${t('mermaid_error')}</p>`;
            });
        });
    };
    renderMermaidSafely();

    container.querySelectorAll('.before-after-slider').forEach(slider => {
        if (slider._isSetup) return; 
        slider._isSetup = true;
        let isDragging = false;

        const move = (e) => {
            if (!isDragging) return;
            const rect = slider.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            let pct = (x / rect.width) * 100;
            pct = Math.max(0, Math.min(pct, 100)); 
            slider.style.setProperty('--expose', `${pct}%`);
        };

        const start = () => { isDragging = true; };
        const end = () => { isDragging = false; };

        slider.addEventListener('mousedown', start);
        slider.addEventListener('touchstart', start, { passive: true });
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: true });
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);
    });

const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');
    const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    container.querySelectorAll('.combo-asset-card').forEach(card => {
        if (card.classList.contains('is-visible')) return;

        if (reduceMotion) {
            card.classList.add('is-visible');
            return;
        }

        cardObserver.observe(card);
    });

    container.querySelectorAll('.telemetry-overlay').forEach(overlay => {
        if (overlay._isSetup) return;
        overlay._isSetup = true;

        const loadPill = overlay.querySelector('[data-metric="load"]');
        const memoryPill = overlay.querySelector('[data-metric="memory"]');

        if (overlay._telemetryInterval) clearInterval(overlay._telemetryInterval);

        overlay._telemetryInterval = setInterval(() => {
            if (loadPill) {
                const randomLoad = Math.floor(Math.random() * 25) + 110;
                loadPill.innerHTML = `<span class="pulse-dot"></span> Load: ${randomLoad}ms`;
            }
            if (memoryPill) {
                const randomMem = (Math.random() * 1.4 + 42.1).toFixed(1);
                memoryPill.innerHTML = `<span class="pulse-dot bg-blue"></span> RAM: ${randomMem}MB`;
            }
        }, 1800); 
    });

    container.querySelectorAll('.combo-asset-card').forEach(card => {
        if (card._tabsSetup) return;
        card._tabsSetup = true;

        const tabs = card.querySelectorAll('.combo-tab');
        const contents = card.querySelectorAll('.combo-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetContent = card.querySelector(`[data-id="${targetId}"]`);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    });
}

/* ==========================================================================
   SCROLL MECHANICS & PHYSICS (Drag & Wheel)
   ========================================================================== */
function setupDotsDrag(dotsContainer, sliderContainer) {
    let isDraggingDots = false;
    let startX;

    const handleStart = (e) => {
        isDraggingDots = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        sliderContainer.style.scrollBehavior = 'auto'; 
        sliderContainer.style.scrollSnapType = 'none';
        dotsContainer.classList.add('is-scrubbing');
    };

    const handleMove = (e) => {
        if (!isDraggingDots) return;
        e.preventDefault(); 
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const walk = (startX - x) * 2.5; 
        sliderContainer.scrollLeft += walk;
        startX = x;
    };

    const handleEnd = () => {
        if (!isDraggingDots) return;
        isDraggingDots = false;
        dotsContainer.classList.remove('is-scrubbing');
        sliderContainer.style.scrollBehavior = 'smooth';
        sliderContainer.style.scrollSnapType = 'x mandatory';
        
        const slideWidth = window.innerWidth;
        const nearestIndex = Math.round(sliderContainer.scrollLeft / slideWidth);
        const maxIndex = sliderContainer.children.length - 1;
        const targetIndex = Math.max(0, Math.min(nearestIndex, maxIndex));
        
        sliderContainer.scrollTo({
            left: targetIndex * slideWidth,
            behavior: 'smooth'
        });
    };

    dotsContainer.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    dotsContainer.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
}

function setupGalleryDrag(container) {
    let isDown = false;
    let startX, startY, startScrollLeft, lastX;
    let velocity = 0, lastTime, animationFrameId;
    let hasTriggeredVertical = false;

    const handleStart = (e) => {
        if (e.target.closest('button, a, .floating-back-btn, .nav-link, .before-after-slider, .case-audio-player')) return;
        isDown = true;
        hasTriggeredVertical = false;
        isPreventingClicks = false;
        
        if (container._animationFrameId) cancelAnimationFrame(container._animationFrameId);
        container._isAnimating = false;
        container._wheelTarget = container.scrollLeft; 
        
        cancelAnimationFrame(animationFrameId); 
        container.classList.add('dragging');
        container.style.scrollBehavior = 'auto';
        startX = e.pageX;
        startY = e.pageY;
        startScrollLeft = container.scrollLeft;
        lastX = e.pageX;
        lastTime = performance.now();
        velocity = 0;
    };

    const handleMove = (e) => {
        if (!isDown || hasTriggeredVertical) return;
        const pageX = e.pageX;
        const walkX = pageX - startX;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');

        e.preventDefault();
        if (Math.abs(walkX) > 5) isPreventingClicks = true;

        if (reduceMotion) {
            const now = performance.now();
            const dt = now - lastTime;
            if (dt > 0) velocity = (pageX - lastX) / dt;
            lastX = pageX; lastTime = now;
            return; 
        }

        const targetScroll = startScrollLeft - walkX; 
        if (targetScroll < 0) {
            const overscroll = Math.pow(Math.abs(targetScroll), 0.7);
            container.style.transform = `translateX(${overscroll}px)`;
            container.scrollLeft = 0;
        } else if (targetScroll > maxScroll) {
            const overscroll = Math.pow(targetScroll - maxScroll, 0.7);
            container.style.transform = `translateX(${-overscroll}px)`;
            container.scrollLeft = maxScroll;
        } else {
            container.style.transform = `translateX(0px)`;
            container.scrollLeft = targetScroll;
        }

        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0) velocity = (pageX - lastX) / dt;
        lastX = pageX; lastTime = now;
    };

    const handleEnd = () => {
        if (!isDown || hasTriggeredVertical) return;
        isDown = false;
        container.classList.remove('dragging');
        container.style.transform = `translateX(0px)`;
        const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');

        if (reduceMotion) {
            const finalMovement = (lastX - startX) * 1.2; 
            container.scrollLeft = startScrollLeft - finalMovement;
            setTimeout(() => { isPreventingClicks = false; }, 50);
            return;
        }

        if (Math.abs(velocity) > 0.1) {
            const amplitude = velocity * 300; 
            let targetScroll = container.scrollLeft - amplitude;
            targetScroll = Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth));

            const startAnimScroll = container.scrollLeft;
            const distance = targetScroll - startAnimScroll;
            let startTime = null;
            const animateScroll = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / 800, 1);
                const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
                container.scrollLeft = startAnimScroll + (distance * easeOutQuint(progress));
                if (progress < 1) animationFrameId = requestAnimationFrame(animateScroll);
                else setTimeout(() => { isPreventingClicks = false; }, 50);
            };
            animationFrameId = requestAnimationFrame(animateScroll);
        } else { setTimeout(() => { isPreventingClicks = false; }, 50); }
    };

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('mouseleave', handleEnd);
    container.addEventListener('mouseup', handleEnd);
    container.addEventListener('mousemove', handleMove);
}

function setupSliderDrag(container) {
    let isDown = false;
    let startX, startY, startScrollLeft, draggedDistance = 0;
    let animationFrameId, hasTriggeredVertical = false;

    const handleStart = (e) => {
        if (e.target.closest('button, a, .floating-back-btn, .nav-link, .before-after-slider, .case-audio-player')) return;
        isDown = true; hasTriggeredVertical = false; isPreventingClicks = false;
        
        if (container._animationFrameId) cancelAnimationFrame(container._animationFrameId);
        container._isAnimating = false;
        
        cancelAnimationFrame(animationFrameId);
        container.style.scrollSnapType = 'none';
        container.style.scrollBehavior = 'auto';
        container.classList.add('dragging'); 
        startX = e.pageX; startY = e.pageY;
        startScrollLeft = container.scrollLeft;
        draggedDistance = 0;
    };

    const handleMove = (e) => {
        if (!isDown || hasTriggeredVertical) return;
        const walkX = e.pageX - startX;
        const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');

        e.preventDefault();
        draggedDistance = walkX;
        if (Math.abs(draggedDistance) > 5) isPreventingClicks = true;

        if (reduceMotion) return; 

        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft <= 0 && draggedDistance > 0) {
            container.style.transform = `translateX(${Math.pow(draggedDistance, 0.75)}px)`;
        } else if (container.scrollLeft >= maxScroll && draggedDistance < 0) {
            container.style.transform = `translateX(${-Math.pow(Math.abs(draggedDistance), 0.75)}px)`;
        } else {
            container.style.transform = `translateX(0px)`;
            container.scrollLeft = startScrollLeft - draggedDistance;
        }
    };

    const handleEnd = () => {
        if (!isDown || hasTriggeredVertical) return;
        isDown = false;
        container.classList.remove('dragging');
        container.style.transform = `translateX(0px)`;
        
        const slideWidth = window.innerWidth;
        const reduceMotion = document.documentElement.classList.contains('a11y-reduce-motion');
        
        const startIndex = Math.round(startScrollLeft / slideWidth);
        let targetIndex;
        const swipeThreshold = slideWidth * 0.15; 

        if (draggedDistance < -swipeThreshold) targetIndex = startIndex + 1;
        else if (draggedDistance > swipeThreshold) targetIndex = startIndex - 1;
        else targetIndex = startIndex;

        const maxIndex = container.children.length - 1;
        targetIndex = Math.max(0, Math.min(targetIndex, maxIndex));
        const targetScrollLeft = targetIndex * slideWidth;

        if (reduceMotion) {
            container.scrollLeft = targetScrollLeft;
            container.style.scrollSnapType = '';
            container.style.scrollBehavior = '';
            setTimeout(() => { isPreventingClicks = false; }, 50);
        } else {
            const startAnimScroll = container.scrollLeft;
            const distance = targetScrollLeft - startAnimScroll;
            let startTime = null;
            const animateScroll = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / 800, 1);
                const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
                container.scrollLeft = startAnimScroll + (distance * easeOutQuint(progress));
                if (progress < 1) animationFrameId = requestAnimationFrame(animateScroll);
                else {
                    container.style.scrollSnapType = '';
                    container.style.scrollBehavior = '';
                    setTimeout(() => { isPreventingClicks = false; }, 50);
                }
            };
            animationFrameId = requestAnimationFrame(animateScroll);
        }
    };

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('mouseleave', handleEnd);
    container.addEventListener('mouseup', handleEnd);
    container.addEventListener('mousemove', handleMove);
}

function setupWheelScroll(container, isCaseView = false) {
    container.addEventListener('wheel', (e) => {
        if (isCaseView && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            const slideWidth = window.innerWidth;
            let currentIndex = Math.round(container.scrollLeft / slideWidth);
            const slides = container.querySelectorAll('.case-slide-wrapper');
            currentIndex = Math.max(0, Math.min(currentIndex, slides.length - 1));
            
            const currentSlide = slides[currentIndex];
            const currentCaseId = currentSlide ? currentSlide.dataset.caseId : null;

            if (currentCaseId) {
                const scrollEl = document.getElementById(`scroll-${currentCaseId}`);
                if (scrollEl) {
                    e.preventDefault(); 
                    
                    if (!scrollEl._isAnimating) {
                        scrollEl._wheelTarget = scrollEl.scrollTop;
                    }
                    scrollEl._wheelTarget += e.deltaY; 
                    
                    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
                    scrollEl._wheelTarget = Math.max(0, Math.min(scrollEl._wheelTarget, maxScroll));

                    if (!scrollEl._isAnimating) {
                        scrollEl._isAnimating = true;
                        const smoothStep = () => {
                            if (!scrollEl._isAnimating) return;
                            scrollEl.scrollTop += (scrollEl._wheelTarget - scrollEl.scrollTop) * 0.12;
                            if (Math.abs(scrollEl._wheelTarget - scrollEl.scrollTop) > 1.5) {
                                scrollEl._animationFrameId = requestAnimationFrame(smoothStep);
                            } else {
                                scrollEl.scrollTop = scrollEl._wheelTarget;
                                scrollEl._isAnimating = false;
                            }
                        };
                        scrollEl._animationFrameId = requestAnimationFrame(smoothStep);
                    }
                    return; 
                }
            }
        }

        if (!isCaseView) {
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

            if (delta !== 0) {
                e.preventDefault(); 

                if (!container._isAnimating) {
                    container._wheelTarget = container.scrollLeft;
                }
                container._wheelTarget += delta;
            
                const maxScroll = container.scrollWidth - container.clientWidth;
                container._wheelTarget = Math.max(0, Math.min(container._wheelTarget, maxScroll));

                if (!container._isAnimating) {
                    container._isAnimating = true;
                    const smoothStep = () => {
                        container.scrollLeft += (container._wheelTarget - container.scrollLeft) * 0.12;

                        if (Math.abs(container._wheelTarget - container.scrollLeft) > 1.5) {
                            container._animationFrameId = requestAnimationFrame(smoothStep);
                        } else {
                            container.scrollLeft = container._wheelTarget;
                            container._isAnimating = false;
                        }
                    };
                    container._animationFrameId = requestAnimationFrame(smoothStep);
                }
            }
        }
    }, { passive: false }); 
}

setupGalleryDrag(gallery); 
setupSliderDrag(caseSliderContainer);
setupWheelScroll(gallery, false); 
setupWheelScroll(caseSliderContainer, true); 

/* ==========================================================================
   SEARCH & HIGHLIGHT ENGINE
   ========================================================================== */
function initCaseSearch() {
    const searchBtn = document.getElementById('btn-case-search');
    const searchInput = document.getElementById('case-search-input');
    const dotsContainer = document.getElementById('slider-dots-container');
    const autocompleteBox = document.getElementById('search-autocomplete');
    
    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dotsContainer.classList.toggle('search-active');
        if (dotsContainer.classList.contains('search-active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            autocompleteBox.classList.remove('show');
            clearHighlights();
        }
    });

    document.addEventListener('click', (e) => {
        if (!dotsContainer.contains(e.target)) {
            dotsContainer.classList.remove('search-active');
            autocompleteBox.classList.remove('show');
        }
    }, true); 

    searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
    searchInput.addEventListener('touchstart', (e) => e.stopPropagation(), {passive: true});

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        autocompleteBox.innerHTML = '';
        
        if (query.length < 2) {
            autocompleteBox.classList.remove('show');
            return;
        }

        let matches = [];
        
        portfolioCases.forEach((caseData, index) => {
            if (caseData.isProtected && sessionStorage.getItem(`unlocked_${caseData.id}`) !== 'true') return;
            const overviewText = `${caseData.title} ${caseData.desc}`.toLowerCase();
            const techText = caseData.descRecruiter ? caseData.descRecruiter.toLowerCase() : "";
            
            const matchOverview = overviewText.indexOf(query);
            const matchTech = techText.indexOf(query);
            
            if (matchOverview !== -1 || matchTech !== -1) {
                const isTechMatch = matchOverview === -1 && matchTech !== -1;
                const sourceText = isTechMatch ? techText : overviewText;
                const matchIndex = isTechMatch ? matchTech : matchOverview;

                const start = Math.max(0, matchIndex - 30);
                const end = Math.min(sourceText.length, matchIndex + 50);
                let snippet = sourceText.substring(start, end).replace(/<[^>]*>?/gm, ''); 
                
                const regex = new RegExp(query, 'gi');
                snippet = snippet.replace(regex, match => `<b>${match}</b>`);

                matches.push({ 
                    data: caseData, 
                    index, 
                    snippet: `...${snippet}...`,
                    isTechMatch
                });
            }
        });

        if (matches.length > 0) {
            matches.slice(0, 3).forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `
                    <span class="auto-title">${match.data.title}</span>
                    <span class="auto-snippet">${match.snippet}</span>
                `;
                
                item.addEventListener('click', () => {
                    executeSearchNavigation(match.index, match.data.id, query, match.isTechMatch);
                });
                
                autocompleteBox.appendChild(item);
            });
            autocompleteBox.classList.add('show');
        } else {
            autocompleteBox.classList.remove('show');
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize(); 
    });
}

function executeSearchNavigation(slideIndex, caseId, term, isTechMatch) {
    document.getElementById('slider-dots-container').classList.remove('search-active');
    document.getElementById('search-autocomplete').classList.remove('show');
    
    let needsModeSwitch = false;
    if (isTechMatch && !isRecruiterMode) needsModeSwitch = true;
    if (!isTechMatch && isRecruiterMode) {
        const targetCase = portfolioCases.find(c => c.id === caseId);
        if (targetCase && targetCase.descRecruiter) needsModeSwitch = true;
    }

    if (needsModeSwitch) {
        const toggleBtn = document.getElementById('btn-mode-toggle');
        if (toggleBtn && !toggleBtn.classList.contains('no-tech-view') && !toggleBtn.classList.contains('no-overview')) {
            toggleBtn.click();
        }
    }

    const slideWidth = window.innerWidth;
    caseSliderContainer.style.scrollSnapType = 'none';
    caseSliderContainer.scrollTo({ left: slideIndex * slideWidth, behavior: 'smooth' });
    
    setTimeout(() => {
        caseSliderContainer.style.scrollSnapType = 'x mandatory';
        highlightAndScrollToTerm(caseId, term);
    }, 850); 
}

function highlightAndScrollToTerm(caseId, term) {
    clearHighlights();
    const slide = document.querySelector(`.case-slide-wrapper[data-case-id="${caseId}"]`);
    if (!slide) return;
    
    const descBody = slide.querySelector('.case-description-body');
    const scrollContainer = slide.querySelector('.case-info-scroll');
    if (!descBody || !scrollContainer || !term) return;

    const walker = document.createTreeWalker(descBody, NodeFilter.SHOW_TEXT, null, false);
    const nodesToModify = [];
    let node;
    const regex = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');

    while (node = walker.nextNode()) {
        if (regex.test(node.nodeValue) && !node.parentNode.closest('pre, code, .case-caption')) {
            nodesToModify.push(node);
        }
    }

    let firstHighlight = null;
    nodesToModify.forEach(txtNode => {
        const fragment = document.createDocumentFragment();
        const parts = txtNode.nodeValue.split(regex);
        
        parts.forEach(part => {
            if (part.toLowerCase() === term.toLowerCase()) {
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = part;
                fragment.appendChild(mark);
                if (!firstHighlight) firstHighlight = mark;
            } else {
                fragment.appendChild(document.createTextNode(part));
            }
        });
        txtNode.parentNode.replaceChild(fragment, txtNode);
    });

    if (firstHighlight) {
        setTimeout(() => {
            scrollContainer._isAnimating = false;
            if (scrollContainer._animationFrameId) cancelAnimationFrame(scrollContainer._animationFrameId);
            firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    }
}

/* ==========================================================================
   STANDALONE MODULES (Lightbox, AI Chat, Viewport Sync)
   ========================================================================== */
const lightbox = document.createElement('div');
lightbox.className = 'lightbox-overlay';
lightbox.innerHTML = `<img class="lightbox-img" src="" alt="Zoomed Image">`;
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector('.lightbox-img');

document.addEventListener('click', (e) => {
    const clickedImage = e.target.closest('.case-asset-box.is-image img');
    if (clickedImage) {
        e.stopPropagation(); 
        lightboxImg.src = clickedImage.src; 
        lightbox.classList.add('active'); 
    }
});

lightbox.addEventListener('click', (e) => {
    e.stopPropagation();
    lightbox.classList.remove('active');
    setTimeout(() => { lightboxImg.src = ''; }, 300);
});

let forceViewportRecalc = null; 
if (window.visualViewport) {
    const layoutViewportAdaptation = () => {
        if (window.innerWidth <= 768) {
            if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);

            const visibleHeight = window.visualViewport.height;
            const visibleWidth = window.visualViewport.width;
            const visibleTop = window.visualViewport.offsetTop;
            const visibleLeft = window.visualViewport.offsetLeft;

            document.documentElement.style.setProperty('--sv-height', `${visibleHeight}px`);
            document.documentElement.style.setProperty('--sv-width', `${visibleWidth}px`);
            document.documentElement.style.setProperty('--sv-top', `${visibleTop}px`);
            document.documentElement.style.setProperty('--sv-left', `${visibleLeft}px`);
        } else {
            document.documentElement.style.removeProperty('--sv-height');
            document.documentElement.style.removeProperty('--sv-width');
            document.documentElement.style.removeProperty('--sv-top');
            document.documentElement.style.removeProperty('--sv-left');
        }
    };

    window.visualViewport.addEventListener('resize', layoutViewportAdaptation);
    window.visualViewport.addEventListener('scroll', layoutViewportAdaptation);
    forceViewportRecalc = layoutViewportAdaptation;
}

function initParagraphHover() {
    const hoverTrigger = document.createElement('div');
    hoverTrigger.className = 'paragraph-hover-trigger';
    hoverTrigger.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>`;
    document.body.appendChild(hoverTrigger);

    const hoverMenu = document.createElement('div');
    hoverMenu.className = 'paragraph-hover-menu';
    hoverMenu.innerHTML = `
        <div class="popup-header">
            <span class="popup-title" data-i18n="popup_ph_title">Actions</span>
            <button class="popup-close-btn" id="ph-close-btn" aria-label="Close" tabindex="0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <span class="action-tooltip" data-i18n="popup_close">Close</span>
            </button>
        </div>
        <button id="ph-ask-ai"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></svg> ${t('ph_ask_ai')}</button>
        <div class="ph-divider"></div>
        <button id="ph-autoscroll"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg> ${t('ph_autoscroll')}</button>
        <div class="ph-divider"></div>
        <button id="ph-link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> ${t('ph_copy_link')}</button>
        <button id="ph-email"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> ${t('ph_email_lio')}</button>
        <button id="ph-share"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> ${t('ph_share')}</button>
    `;
    document.body.appendChild(hoverMenu);

    let activeHoverParagraph = null;
    let hoverHideTimeout;
    let isActivelyScrolling = false;
    let scrollLockTimeout;

    const handleGlobalScroll = () => {
        isActivelyScrolling = true;
        hoverTrigger.classList.remove('show');
        hoverMenu.classList.remove('show');
        clearTimeout(scrollLockTimeout);
        scrollLockTimeout = setTimeout(() => { isActivelyScrolling = false; }, 150);
    };

    document.querySelectorAll('.case-info-scroll').forEach(el => el.addEventListener('scroll', handleGlobalScroll, { passive: true }));
    window.addEventListener('scroll', handleGlobalScroll, { passive: true });

    document.addEventListener('mouseover', (e) => {
        if (window.innerWidth <= 768 || isActivelyScrolling) return; 
        if (hoverMenu.classList.contains('show')) return;
        
        const p = e.target.closest('.case-description-body .p1, .case-description-body .p2');
        
        if (p && !p.classList.contains('combo-observation')) {
            clearTimeout(hoverHideTimeout);
            activeHoverParagraph = p;
            
            const rect = p.getBoundingClientRect();
            const layoutContainer = p.closest('.case-info-container');
            const containerLeft = layoutContainer ? layoutContainer.getBoundingClientRect().left : rect.left;
            
            hoverTrigger.style.top = `${rect.top - 4}px`;
            hoverTrigger.style.left = `${containerLeft - 38}px`; 
            
            if (!hoverMenu.classList.contains('show')) hoverTrigger.classList.add('show');
            
        } else if (!e.target.closest('.paragraph-hover-trigger') && !e.target.closest('.paragraph-hover-menu')) {
            hoverHideTimeout = setTimeout(() => {
                hoverTrigger.classList.remove('show');
                hoverMenu.classList.remove('show');
            }, 150);
        }
    });

    hoverTrigger.addEventListener('mouseenter', () => clearTimeout(hoverHideTimeout));
    hoverMenu.addEventListener('mouseenter', () => clearTimeout(hoverHideTimeout));

    const phCloseBtn = hoverMenu.querySelector('#ph-close-btn');
    if (phCloseBtn) {
        phCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hoverMenu.classList.remove('show');
            hoverTrigger.classList.remove('show');
        });
    }

    hoverTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const btnLink = document.getElementById('ph-link');
        if (btnLink && btnLink._defaultHTML) btnLink.innerHTML = btnLink._defaultHTML;

        hoverMenu.style.visibility = 'hidden';
        hoverMenu.classList.add('show');
        
        const triggerRect = hoverTrigger.getBoundingClientRect();
        const menuWidth = hoverMenu.offsetWidth;
        
        hoverMenu.style.top = `${triggerRect.top}px`;
        hoverMenu.style.left = `${triggerRect.left - menuWidth - 8}px`;
        hoverMenu.style.visibility = 'visible';
    });

    const closeHoverMenus = () => {
        document.querySelectorAll('.paragraph-hover-menu.show').forEach(menu => menu.classList.remove('show'));
        document.querySelectorAll('.paragraph-hover-trigger.show').forEach(trigger => trigger.classList.remove('show'));
    };

    const isTargetInsideClass = (target, className) => {
        return target && typeof target.closest === 'function' && target.closest(className);
    };

    document.addEventListener('click', (e) => {
        if (!isTargetInsideClass(e.target, '.paragraph-hover-menu') && !isTargetInsideClass(e.target, '.paragraph-hover-trigger')) {
            closeHoverMenus();
        }
    }, true); 

    document.addEventListener('keydown', (e) => {
        const structuralKeys = ['Enter', 'Escape', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'];
        if (!isTargetInsideClass(e.target, '.paragraph-hover-menu') && structuralKeys.includes(e.key)) {
            closeHoverMenus();
        }
    }, true); 

    const btnAskAi = document.getElementById('ph-ask-ai');
    if (btnAskAi) {
        btnAskAi.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeHoverParagraph && activeCaseData) {
                const textSnippet = activeHoverParagraph.innerText.substring(0, 80) + '...';
                hoverMenu.classList.remove('show');
                
                window.openInlineChat(activeCaseData.id);
                setTimeout(() => {
                    const chatInput = document.getElementById(`inline-chat-input-${activeCaseData.id}`);
                    if (chatInput) {
                        chatInput.value = `${t('explain_part')} "${textSnippet}"`;
                        chatInput.focus();
                    }
                }, 50);
            }
        });
    }

    const btnReadAloud = document.getElementById('ph-read-aloud');
    if (btnReadAloud) {
        btnReadAloud.addEventListener('click', () => {
            if (activeHoverParagraph && window.speechSynthesis) {
                // Pause our new AI audio track if it's playing
                if (typeof currentAudioFile !== 'undefined' && currentAudioFile) {
                    currentAudioFile.pause();
                }
                if (typeof resetTTSButtons === 'function') resetTTSButtons();
                
                window.speechSynthesis.cancel(); 
                const text = activeHoverParagraph.innerText;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = typeof currentTTSRate !== 'undefined' ? currentTTSRate : 1.0;
                window.speechSynthesis.speak(utterance);
                hoverMenu.classList.remove('show');
            }
        });
    }

    let autoScrollId;
    const btnAutoScroll = document.getElementById('ph-autoscroll');
    if (btnAutoScroll) {
        btnAutoScroll.addEventListener('click', () => {
            if (!activeHoverParagraph) return;
            hoverMenu.classList.remove('show');
            
            const scrollContainer = activeHoverParagraph.closest('.case-info-scroll');
            if (!scrollContainer) return;

            activeHoverParagraph.scrollIntoView({ behavior: 'smooth', block: 'start' });

            setTimeout(() => {
                let isAutoScrolling = true;
                
                const scrollStep = () => {
                    if (!isAutoScrolling) return;
                    scrollContainer.scrollTop += 0.8; 
                    autoScrollId = requestAnimationFrame(scrollStep);
                };
                scrollStep();

                const killScroll = () => {
                    isAutoScrolling = false;
                    cancelAnimationFrame(autoScrollId);
                    scrollContainer.removeEventListener('wheel', killScroll);
                    scrollContainer.removeEventListener('touchstart', killScroll);
                    scrollContainer.removeEventListener('mousedown', killScroll);
                };

                scrollContainer.addEventListener('wheel', killScroll, { passive: true });
                scrollContainer.addEventListener('touchstart', killScroll, { passive: true });
                scrollContainer.addEventListener('mousedown', killScroll, { passive: true });
            }, 600); 
        });
    }

    let copyTimeout;
    const btnLink = document.getElementById('ph-link');
    
    if (btnLink) {
        btnLink._defaultHTML = btnLink.innerHTML; 
        
        btnLink.addEventListener('click', () => {
            if (activeCaseData && activeHoverParagraph) {
                const urlParams = new URLSearchParams(window.location.search);
                const currentLang = urlParams.get('lang');
                const langQuery = currentLang ? `&lang=${currentLang}` : '';
                
                const descBody = activeHoverParagraph.closest('.case-description-body');
                const pIndex = descBody ? Array.from(descBody.querySelectorAll('p')).indexOf(activeHoverParagraph) : 0;
                
                const url = `${window.location.origin}${window.location.pathname}?case=${activeCaseData.slug || activeCaseData.id}${langQuery}&p=${pIndex}`;
                navigator.clipboard.writeText(url);
                
                btnLink.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${typeof t === 'function' ? t('copied') : 'Copied'}`;
                
                clearTimeout(copyTimeout);
                copyTimeout = setTimeout(() => { 
                    btnLink.innerHTML = btnLink._defaultHTML; 
                    hoverMenu.classList.remove('show'); 
                }, 1500);
            }
        });
    }

    const btnEmail = document.getElementById('ph-email');
    if (btnEmail) {
        btnEmail.addEventListener('click', () => {
            if (activeHoverParagraph && activeCaseData) {
                let text = activeHoverParagraph.innerText.substring(0, 150);
                if (activeHoverParagraph.innerText.length > 150) text += '...';
                window.location.href = `mailto:hello@schimanko.dev?subject=${typeof t === 'function' ? t('email_subject') : 'Regarding'} ${activeCaseData.title}&body=${typeof t === 'function' ? t('email_body') : ''}%0D%0A%0D%0A"${encodeURIComponent(text)}"%0D%0A%0D%0A`;
                hoverMenu.classList.remove('show');
            }
        });
    }

    const btnShare = document.getElementById('ph-share');
    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            if (activeCaseData && activeHoverParagraph) {
                const urlParams = new URLSearchParams(window.location.search);
                const currentLang = urlParams.get('lang');
                const langQuery = currentLang ? `&lang=${currentLang}` : '';
                
                const descBody = activeHoverParagraph.closest('.case-description-body');
                const pIndex = descBody ? Array.from(descBody.querySelectorAll('p')).indexOf(activeHoverParagraph) : 0;
                
                const url = `${window.location.origin}${window.location.pathname}?case=${activeCaseData.slug || activeCaseData.id}${langQuery}&p=${pIndex}`;

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: activeCaseData.title,
                            text: typeof t === 'function' ? t('share_text') : 'Check this out',
                            url: url
                        });
                    } catch(err) {}
                    hoverMenu.classList.remove('show');
                } else {
                    if (btnLink) btnLink.click();
                }
            }
        });
    }
}

initParagraphHover();