/* eslint-disable */
/**
 * Client behaviour for the repeatable "filesystems" profile field.
 *
 * Each row reuses the single Filesystem field markup (adapter selector + per-adapter
 * config, toggled by the delegated dataToggle handler in profile.js). This script only
 * adds, removes and reorders rows and assigns a stable id to each new row.
 *
 * Row order is preserved by the server through POST order (which follows DOM order), so
 * indices only need to be unique per row - reordering never has to renumber anything.
 */
(function () {
    'use strict';

    function genId() {
        return 'fs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function addRow(container) {
        var tpl = container.querySelector('[data-filesystems-template]');
        var rowsWrap = container.querySelector('[data-filesystems-rows]');

        if (!tpl || !rowsWrap) {
            return;
        }

        var idx = parseInt(container.getAttribute('data-next-index'), 10) || 0;
        container.setAttribute('data-next-index', String(idx + 1));

        // replace the placeholder index across names, ids and label "for" attributes
        var html = tpl.innerHTML.replace(/__index__/g, String(idx)).trim();

        var tmp = document.createElement('div');
        tmp.innerHTML = html;

        var row = tmp.firstElementChild;

        if (!row) {
            return;
        }

        // assign a fresh, stable id for the new filesystem
        var idInput = row.querySelector('[data-filesystems-id]');

        if (idInput && !idInput.value) {
            idInput.value = genId();
        }

        rowsWrap.appendChild(row);

        // let the delegated dataToggle handler set the initial adapter visibility
        var select = row.querySelector('select[data-toggle]');

        if (select) {
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function onClick(event) {
        var container = event.currentTarget;

        if (event.target.closest('[data-filesystems-add]')) {
            addRow(container);
            return;
        }

        var row = event.target.closest('[data-filesystems-row]');

        if (!row) {
            return;
        }

        if (event.target.closest('[data-filesystems-remove]')) {
            row.remove();
            return;
        }

        if (event.target.closest('[data-filesystems-up]')) {
            var prev = row.previousElementSibling;

            if (prev) {
                row.parentNode.insertBefore(row, prev);
            }

            return;
        }

        if (event.target.closest('[data-filesystems-down]')) {
            var next = row.nextElementSibling;

            if (next) {
                row.parentNode.insertBefore(next, row);
            }
        }
    }

    function init() {
        document.querySelectorAll('[data-filesystems]').forEach(function (container) {
            if (container.wfFilesystemsInit) {
                return;
            }

            container.wfFilesystemsInit = true;
            container.addEventListener('click', onClick);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
