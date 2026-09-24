/*
 * Entity card helpers.
 * Cards themselves are rendered at build time (themes/onlinuum/templates/blocks/cards/);
 * this script only fits overflowing chip rows and localises card dates.
 */
(function() {
    var cmsT = (typeof window !== 'undefined' && window.cmsT) ? window.cmsT : function (k, fb) { return fb; };
    var docLang = document.documentElement.lang || 'en';
    var locale = docLang === 'en' ? 'en-US' : docLang;

    function fitExactChipRows(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var rows = scope.querySelectorAll('.entity-card-exact-row');

        if (!rows.length) return;

        rows.forEach(function(row) {
            var more = row.querySelector('.entity-chip-more');
            var availableWidth;
            var chipWidths;
            var hiddenCount = 0;
            var visibleWidth;
            var moreChip;
            var rowStyle;
            var gap;
            if (more) more.remove();

            var chips = Array.from(row.children).filter(function(node) {
                return !node.classList.contains('entity-chip-more');
            });
            chips.forEach(function(chip) { chip.hidden = false; });

            if (chips.length <= 1) return;

            availableWidth = row.clientWidth;
            if (!availableWidth) return;

            rowStyle = window.getComputedStyle(row);
            gap = parseFloat(rowStyle.columnGap || rowStyle.gap || '0') || 0;
            chipWidths = chips.map(function(chip) {
                return chip.getBoundingClientRect().width;
            });
            visibleWidth = chipWidths.reduce(function(sum, width) {
                return sum + width;
            }, 0) + (Math.max(0, chips.length - 1) * gap);

            if (visibleWidth <= availableWidth + 1) return;

            moreChip = document.createElement('span');
            moreChip.className = 'entity-chip entity-chip-more';
            row.appendChild(moreChip);

            for (var i = chips.length - 1; i > 0; i--) {
                hiddenCount += 1;
                visibleWidth -= chipWidths[i];
                visibleWidth -= gap;
                moreChip.textContent = '+' + hiddenCount + ' ' + cmsT('card_chip_more', 'more');
                if (visibleWidth + gap + moreChip.getBoundingClientRect().width <= availableWidth + 1) break;
            }

            if (hiddenCount === 0) {
                moreChip.remove();
                return;
            }

            for (var j = chips.length - hiddenCount; j < chips.length; j++) {
                chips[j].hidden = true;
            }
        });
    }

    // Blog cards carry the ISO date in <time datetime>; show it the way the
    // reader's locale writes dates ("Jul 16, 2026", "16 июл. 2026 г.").
    function localizeCardDates(root) {
        var scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('.entity-card time[datetime]').forEach(function(node) {
            if (node.dataset.localized) return;
            var date = new Date(node.getAttribute('datetime'));
            if (isNaN(date.getTime())) return;
            node.textContent = date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
            node.dataset.localized = 'true';
        });
    }

    window.CMSCards = window.CMSCards || {};
    window.CMSCards.fitExactChipRows = fitExactChipRows;
    window.CMSCards.localizeCardDates = localizeCardDates;

    function runExactChipFit() {
        localizeCardDates(document);
        fitExactChipRows(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runExactChipFit, { once: true });
    } else {
        runExactChipFit();
    }

    var resizeTimer = null;
    window.addEventListener('resize', function() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function() { fitExactChipRows(document); }, 120);
    });
})();
