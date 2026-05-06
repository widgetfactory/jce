/* global ibis */

import Header from './Header';
import Editor from '../Editor';
import Content from '../Content';

var DOM = ibis.DOM,
    Event = ibis.dom.Event;

var svgToggleIcon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 448"><title></title><g id="wf-toggle-icon" stroke="none" stroke-width="1"></g><path d="M280 64.132v59.482c15.84 6.914 30.406 16.803 42.995 29.391 26.443 26.442 41.005 61.6 41.005 98.995s-14.563 72.552-41.005 98.995c-26.442 26.442-61.599 41.005-98.995 41.005s-72.552-14.563-98.995-41.005c-26.442-26.442-41.005-61.6-41.005-98.995s14.563-72.552 41.005-98.995c12.589-12.589 27.155-22.478 42.995-29.392v-59.481c-80.959 24.097-140 99.082-140 187.868 0 108.248 87.753 196 196 196s196-87.752 196-196c0-88.786-59.041-163.77-140-187.868zM196 0h56v224h-56z"></path></svg>';

/**
 * Toggle the editor on or off
 * @param {node} el The textarea element
 * @param {object} settings Editor settings
 */
function toggle(el, settings) {
    var ed = ibis.get(el.id);

    // editor not yet created — turn it on
    if (!ed) {
        DOM.addClass(el.parentNode, 'mce-loading');
        DOM.removeClass(el, 'wf-no-editor');
        DOM.removeClass(el.parentNode, 'wf-editor-toggle-off');

        if (settings && settings.use_state_cookies !== false) {
            ibis.util.Storage.set('wf_editor_state_' + el.id, 1);
        }

        ibis.execCommand('mceToggleEditor', false, el.id);

        setTimeout(function () {
            DOM.removeClass(el.parentNode, 'mce-loading');
        }, 1000);
    } else {
        if (DOM.hasClass(el, 'wf-no-editor')) {
            // turn on
            DOM.removeClass(el, 'wf-no-editor');
            DOM.setStyle(DOM.select('.wf-editor-tabs', el.parentNode), 'display', '');
            DOM.removeClass(el.parentNode, 'wf-editor-toggle-off');

            if (settings && settings.use_state_cookies !== false) {
                ibis.util.Storage.set('wf_editor_state_' + el.id, 1);
            }

            var activeTab;

            if (settings && settings.use_state_cookies !== false) {
                activeTab = sessionStorage.getItem('wf-editor-tabs-' + ed.id);
            }

            if (!activeTab) {
                activeTab = ed.settings.active_tab || 'wf-editor-wysiwyg';
            }

            DOM.hide(ed.getElement());

            switch (activeTab) {
                default:
                case 'wf-editor-wysiwyg':
                    ed.show();
                    break;
                case 'wf-editor-source':
                    ed.plugins.source.toggle();
                    break;
                case 'wf-editor-preview':
                    ed.plugins.preview.toggle();
                    break;
            }
        } else {
            // turn off
            DOM.addClass(el, 'wf-no-editor');
            DOM.hide(DOM.select('.wf-editor-tabs', el.parentNode));
            DOM.addClass(el.parentNode, 'wf-editor-toggle-off');

            var height;

            if (settings && settings.use_state_cookies !== false) {
                height = sessionStorage.getItem('wf-editor-container-height');
            }

            if (height && !ed.getParam('fullscreen_enabled')) {
                DOM.setStyle(ed.getElement(), 'height', height);
            }

            if (settings && settings.use_state_cookies !== false) {
                ibis.util.Storage.set('wf_editor_state_' + el.id, 0);
            }

            ed.hide();
            Content.get(ed.id);

            if (ed.plugins.source) {
                ed.plugins.source.hide();
            }

            if (ed.plugins.preview) {
                ed.plugins.preview.hide();
            }

            DOM.setStyle(ed.getElement(), 'display', '');
        }
    }
}

/**
 * Create the toggle button in the editor header
 * @param {node} el The textarea element
 * @param {object} settings Editor settings
 */
function create(el, settings) {
    if (!Editor.canToggle(settings)) {
        return;
    }

    var header = DOM.getPrev(el, '.wf-editor-header') || Header.create(el);

    if (DOM.select('button.wf-editor-toggle', header).length === 0) {
        var btn = DOM.add(header, 'button', {
            'class': 'wf-editor-toggle btn btn-link',
            'tabindex': '-1'
        }, '' + svgToggleIcon + (settings.toggle_label || ""));

        DOM.bind(btn, 'click', function (e) {
            e.preventDefault();
            toggle(el, settings);
        });
    }
}

/**
 * Set up resize tracking for a textarea element
 * @param {node} el The textarea element
 */
function textareaResize(el) {
    var header = DOM.getPrev(el, '.wf-editor-header'),
        container = header.parentNode;

    DOM.bind(el, 'mousedown', function () {
        var mm = DOM.bind(el, 'mousemove', function () {
            container.style.maxWidth = el.offsetWidth + 'px';
        });

        var mu = DOM.bind(el, 'mouseup', function () {
            Event.remove(el, 'mousemove', mm);
            Event.remove(el, 'mouseup', mu);
            container.style.maxWidth = el.offsetWidth + 'px';
        });
    });
}

/**
 * Set or remove the wrap attribute on a textarea
 * @param {node} el The textarea element
 * @param {boolean} s True to enable soft wrap
 */
function wrapText(el, s) {
    if (s) {
        el.setAttribute("wrap", "soft");
    } else {
        el.removeAttribute("wrap");
    }
}

export default {
    toggle,
    create,
    textareaResize,
    wrapText
};
