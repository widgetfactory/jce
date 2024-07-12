import Header from './Header';
import Content from '../Content';
import Editor from '../Editor';

const DOM = tinymce.DOM;

function toggle(editor, tab) {
    // get textarea element
    var element = editor.getElement(),
        parent = element.parentNode,
        settings = editor.settings;

    // set loader
    DOM.addClass(parent, 'mce-loading');

    if (!editor.isHidden() && !DOM.hasClass(parent, 'mce-fullscreen')) {

        // store interface height
        function getInterfaceHeight() {
            var h = 0,
                ca = editor.getContentAreaContainer(),
                p = ca.parentNode;

            tinymce.each(p.childNodes, function (n) {
                if (n === ca) {
                    return;
                }

                h += n.offsetHeight;
            });

            return h;
        }

        settings.interface_height = getInterfaceHeight();

        // store in session
        if (settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-interface-height', settings.interface_height);
        }

        settings.container_height = editor.getContainer().offsetHeight;

        // store in session
        if (settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-container-height', settings.container_height);
        }

        settings.container_width = editor.getContainer().offsetWidth;

        // store in session
        if (settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-container-width', settings.container_width);
        }
    }

    // source code
    if (tab == "wf-editor-source") {
        editor.hide();
        // hide textarea
        //$(element).hide();
        DOM.hide(element);
        // hide preview
        editor.plugins.preview.hide();
        // toggle source code
        return editor.plugins.source.toggle();
    }

    // preview
    if (tab == "wf-editor-preview") {
        // pass content to textarea and load
        Content.load(editor);

        editor.hide();
        // hide textarea
        DOM.hide(element);
        // hode source
        editor.plugins.source.hide();
        // toggle preview
        return editor.plugins.preview.toggle();
    }

    // pass content to textarea and load
    Content.load(editor);

    editor.plugins.source.hide();
    editor.plugins.preview.hide();

    // resize iframe
    DOM.setStyle(editor.id + '_ifr', 'max-width', DOM.getStyle(parent, 'max-width'));

    editor.show();

    DOM.removeClass(parent, 'mce-loading');
}

function create(editor) {
    var element = editor.getElement(), settings = editor.settings, plugins = editor.plugins;

    // we need at least one of these to show tabs
    if (!plugins.source && !plugins.preview) {
        return false;
    }

    // get header
    var header = Header.create(element);

    // tabs exist, exit...
    if (DOM.select('div.wf-editor-tabs', header).length) {
        return;
    }

    var tablist = DOM.add(header, 'div', {
        'role': 'tablist',
        'class': 'wf-editor-tabs nav nav-tabs'
    });

    var activeTab;

    if (settings.use_state_cookies !== false) {
        activeTab = sessionStorage.getItem('wf-editor-tabs-' + editor.id);
    }

    if (!activeTab) {
        activeTab = settings.active_tab || 'wf-editor-wysiwyg';
    }

    function makeTabActive(tab) {
        // deactivate all
        DOM.removeClass(DOM.select('button', tablist), 'active');
        DOM.setAttrib(DOM.select('button', tablist), 'aria-expanded', 'false');
        DOM.addClass(tab, 'active');
        DOM.setAttrib(tab, 'aria-expanded', 'true');
    }

    // Editor tab
    var editorTab = DOM.add(tablist, 'button', { 'type' : 'button', 'class': 'nav-item', 'role': 'tab', 'aria-controls' : 'wf-editor-wysiwyg' }, editor.getLang('tab.wysiwyg', 'Editor'));

    // Source tab
    if (plugins.source) {
        var sourceTab = DOM.add(tablist, 'button', { 'type' : 'button', 'class': 'nav-item', 'role': 'tab', 'aria-controls' : 'wf-editor-source' }, editor.getLang('tab.code', 'Code'));

        if (activeTab === "wf-editor-source") {
            makeTabActive(sourceTab);
        }
    }

    // Preview tab
    if (plugins.preview) {
        var previewTab = DOM.add(tablist, 'button', { 'type' : 'button', 'class': 'nav-item', 'role': 'tab', 'aria-controls' : 'wf-editor-preview' }, editor.getLang('tab.preview', 'Preview'));

        if (activeTab === "wf-editor-preview") {
            makeTabActive(previewTab);
        }
    }

    if (activeTab === 'wf-editor-wysiwyg') {
        makeTabActive(editorTab);
    }

    // Add tab click events
    DOM.bind(tablist, 'click', function (e) {
        e.preventDefault();

        var item = DOM.getParent(e.target, 'button');

        if (!item || DOM.hasClass(item, 'active')) {
            return;
        }

        makeTabActive(item);

        // get the action from tab button
        var action = DOM.getAttrib(item, 'aria-controls');

        // store current tab in a cookie
        if (settings.use_state_cookies !== false) {
            sessionStorage.setItem('wf-editor-tabs-' + editor.id, action);
        }

        toggle(editor, action);
    });

    var state = Editor.state(element, settings),
        hasToggle = tinymce.is(settings.toggle) ? parseInt(settings.toggle, 10) : 0;

    if (!state && hasToggle) {
        DOM.hide(DOM.select('.nav-tabs', element.parentNode));
    }
}

export default {
    create,
    toggle
};