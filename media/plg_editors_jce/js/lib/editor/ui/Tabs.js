/* global ibis */

import Header from './Header';
import Editor from '../Editor';
import Content from '../Content';

var DOM = ibis.DOM;

/**
 * Switch between editor tabs (wysiwyg / source / preview)
 * @param {ibis.Editor} ed
 * @param {string} tab Target tab: 'wf-editor-wysiwyg', 'wf-editor-source', 'wf-editor-preview'
 * @param {object} settings Editor settings
 */
function toggle(ed, tab, settings) {
    var el = ed.getElement();

    DOM.addClass(el.parentNode, 'mce-loading');

    // store sizes before hiding editor
    if (!Editor.isHidden(ed.id + '_parent') && !DOM.hasClass(el.parentNode, 'mce-fullscreen')) {
        ed.settings.container_height = ed.getContainer().offsetHeight;

        if (settings && settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-container-height', ed.settings.container_height);
        }

        ed.settings.container_width = ed.getContainer().offsetWidth;

        if (settings && settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-container-width', ed.settings.container_width);
        }

        function getInterfaceHeight() {
            var h = 0,
                ca = ed.getContentAreaContainer(),
                p = ca.parentNode;

            ibis.each(p.childNodes, function (n) {
                if (n !== ca) {
                    h += n.offsetHeight;
                }
            });

            return h;
        }

        ed.settings.interface_height = getInterfaceHeight();

        if (settings && settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-interface-height', ed.settings.interface_height);
        }
    }

    // source code tab
    if (tab === "wf-editor-source") {
        ed.hide();
        DOM.hide(el);

        if (ed.plugins.preview) {
            ed.plugins.preview.hide();
        }

        return ed.plugins.source.toggle();
    }

    // preview tab
    if (tab === "wf-editor-preview") {
        Content.load(ed);
        ed.hide();
        DOM.hide(el);

        if (ed.plugins.source) {
            ed.plugins.source.hide();
        }

        ed.onToggleTab.dispatch(ed, tab);

        return ed.plugins.preview.toggle();
    }

    // wysiwyg tab
    Content.load(ed);

    if (ed.plugins.source) {
        var pos = ed.plugins.source.getCursorPos();

        if (pos) {
            ed.activeLine = pos;
        }

        ed.plugins.source.hide();
    }

    if (ed.plugins.preview) {
        ed.plugins.preview.hide();
    }

    DOM.setStyle(ed.id + '_ifr', 'max-width', DOM.getStyle(el.parentNode, 'max-width'));

    ed.show();

    if (ed.activeLine) {
        window.setTimeout(function () {
            Content.setActiveLine(ed, ed.activeLine, true);
        }, 100);
    }

    DOM.removeClass(el.parentNode, 'mce-loading');
}

/**
 * Create the tab navigation UI in the editor header
 * @param {ibis.Editor} ed
 * @param {object} settings Editor settings
 */
function create(ed, settings) {
    var el = ed.getElement(),
        header = DOM.getPrev(el, '.wf-editor-header') || Header.create(el);

    // need at least one of these to show tabs
    if (!ed.plugins.source && !ed.plugins.preview) {
        return false;
    }

    // tabs already exist
    if (DOM.select('.wf-editor-tabs', header).length) {
        return;
    }

    ed.onToggleTab = new ibis.util.Dispatcher(ed);

    var tablist = DOM.add(header, 'div', { 'role': 'tablist', 'class': 'wf-editor-tabs nav nav-tabs' });

    var activeTab;

    if (settings && settings.use_state_cookies !== false) {
        activeTab = sessionStorage.getItem('wf-editor-tabs-' + ed.id);
    }

    if (!activeTab) {
        activeTab = ed.settings.active_tab || 'wf-editor-wysiwyg';
    }

    ed.settings.active_tab = activeTab;

    function makeTabActive(tab) {
        DOM.removeClass(DOM.select('button', tablist), 'active');
        DOM.setAttrib(DOM.select('button', tablist), 'aria-expanded', 'false');
        DOM.addClass(tab, 'active');
        DOM.setAttrib(tab, 'aria-expanded', 'true');
    }

    var editorTab = DOM.add(tablist, 'button', { 'type': 'button', 'class': 'nav-item', 'aria-controls': 'wf-editor-wysiwyg' }, ed.getLang('tab.wysiwyg', 'Editor'));

    makeTabActive(editorTab);

    if (ed.plugins.source) {
        var sourceTab = DOM.add(tablist, 'button', { 'type': 'button', 'class': 'nav-item', 'aria-controls': 'wf-editor-source' }, ed.getLang('tab.code', 'Code'));

        if (activeTab === "wf-editor-source") {
            makeTabActive(sourceTab);
        }
    }

    if (ed.plugins.preview) {
        var previewTab = DOM.add(tablist, 'button', { 'type': 'button', 'class': 'nav-item', 'aria-controls': 'wf-editor-preview' }, ed.getLang('tab.preview', 'Preview'));

        if (activeTab === "wf-editor-preview") {
            makeTabActive(previewTab);
        }
    }

    DOM.bind(tablist, 'click', function (e) {
        e.preventDefault();

        var item = DOM.getParent(e.target, 'button');

        if (!item || DOM.hasClass(item, 'active')) {
            return;
        }

        makeTabActive(item);

        var action = DOM.getAttrib(item, 'aria-controls');

        if (settings && settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-tabs-' + ed.id, action);
        }

        toggle(ed, action, settings);
    });

    var state = Editor.getEditorState(el, settings),
        hasToggle = Editor.canToggle(settings);

    if (!state && hasToggle) {
        DOM.hide(DOM.select('.wf-editor-tabs', el.parentNode));
    }
}

export default {
    toggle,
    create
};
