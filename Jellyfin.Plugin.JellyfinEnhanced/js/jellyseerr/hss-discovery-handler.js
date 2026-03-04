/**
 * Home Screen Sections (HSS) Discovery Handler
 * Intercepts discover card clicks and opens the Jellyseerr more-info modal
 * instead of navigating to the Jellyseerr website
 */

(function (JE) {
    'use strict';

    const logPrefix = '🪼 Jellyfin Enhanced: HSS Discovery Handler:';

    function initDiscoveryHandler() {

        // Track touch state for mobile single-tap detection
        let touchStartX = 0;
        let touchStartY = 0;
        let touchHandled = false; // Flag to prevent click handler from double-firing
        const TOUCH_MOVE_THRESHOLD = 10; // px - ignore taps that moved too far (scrolling)

        // Standard click handler (desktop, also fires on mobile if touch didn't handle it)
        document.addEventListener('click', function (e) {
            // If touch already handled this interaction, skip the click
            if (touchHandled) {
                touchHandled = false;
                return;
            }

            // For request button clicks, intercept only TV shows to show season selection modal
            const requestButton = e.target.closest('.discover-requestbutton');
            if (requestButton) {
                const mediaType = requestButton.dataset.mediaType;
                const tmdbId = requestButton.dataset.id;

                if (mediaType === 'tv' && tmdbId && JE?.jellyseerrUI?.showSeasonSelectionModal) {
                    e.preventDefault();
                    e.stopPropagation();

                    const discoverCard = requestButton.closest('.discover-card');
                    const titleEl = discoverCard?.querySelector('.cardText-first .textActionButton');
                    const showTitle = titleEl?.title || titleEl?.textContent || '';

                    console.log(`${logPrefix} Opening season selection modal for TV show TMDB ID: ${tmdbId}`);
                    JE.jellyseerrUI.showSeasonSelectionModal(parseInt(tmdbId, 10), 'tv', showTitle, null);
                }
                return;
            }

            // Target any click on the discover card (except the request button)
            const discoverCard = e.target.closest('.discover-card');
            if (!discoverCard) return;

            const tmdbId = discoverCard.dataset.tmdbId;
            const mediaType = discoverCard.dataset.mediaType;
            if (!tmdbId || !mediaType || !JE?.jellyseerrMoreInfo?.open) return;

            console.log(`${logPrefix} Opening more-info modal for TMDB ID: ${tmdbId}, Type: ${mediaType}`);
            e.preventDefault();
            e.stopPropagation();
            JE.jellyseerrMoreInfo.open(tmdbId, mediaType);
        }, true);

        // Mobile touch handlers: open modal on single tap without double-tap hover issue.
        // IMPORTANT: We must NOT stopPropagation on touch events, because Jellyfin's
        // multiSelect system needs touchend to fire so it can clear its long-press timer.
        // We only preventDefault on touchend to suppress the subsequent click event.
        document.addEventListener('touchstart', function (e) {
            touchHandled = false;
            const discoverCard = e.target.closest('.discover-card');
            if (discoverCard) {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        }, { passive: true });

        document.addEventListener('touchend', function (e) {
            const target = e.target;

            // Check if the touch target is inside a discover card
            const discoverCard = target.closest('.discover-card');
            if (!discoverCard) return;

            // Check if the touch moved too far (user was scrolling, not tapping)
            const touch = e.changedTouches[0];
            const dx = Math.abs(touch.clientX - touchStartX);
            const dy = Math.abs(touch.clientY - touchStartY);
            if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) return;

            // Check for request button tap
            const requestButton = target.closest('.discover-requestbutton');
            if (requestButton) {
                const mediaType = requestButton.dataset.mediaType;
                const tmdbId = requestButton.dataset.id;

                if (mediaType === 'tv' && tmdbId && JE?.jellyseerrUI?.showSeasonSelectionModal) {
                    const titleEl = discoverCard.querySelector('.cardText-first .textActionButton');
                    const showTitle = titleEl?.title || titleEl?.textContent || '';

                    console.log(`${logPrefix} [Touch] Opening season selection modal for TV show TMDB ID: ${tmdbId}`);

                    // preventDefault to block the subsequent click, but do NOT stopPropagation
                    // so Jellyfin's multiSelect touchend handler can still clear its timer
                    e.preventDefault();
                    touchHandled = true;
                    JE.jellyseerrUI.showSeasonSelectionModal(parseInt(tmdbId, 10), 'tv', showTitle, null);
                }
                return;
            }

            // Card body tap — open more-info modal
            const tmdbId = discoverCard.dataset.tmdbId;
            const mediaType = discoverCard.dataset.mediaType;
            if (!tmdbId || !mediaType || !JE?.jellyseerrMoreInfo?.open) return;

            console.log(`${logPrefix} [Touch] Opening more-info modal for TMDB ID: ${tmdbId}, Type: ${mediaType}`);

            // preventDefault to block the subsequent click, but do NOT stopPropagation
            e.preventDefault();
            touchHandled = true;
            JE.jellyseerrMoreInfo.open(tmdbId, mediaType);
        }, true);
    }

    initDiscoveryHandler();

})(window.JellyfinEnhanced || {});
