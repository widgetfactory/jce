/* global Joomla, ibis, ibis */

import Editor from './Editor';
import Content from './Content';
import Toggle from './ui/Toggle';
import Tabs from './ui/Tabs';
import Platform from './Platform';

var DOM = ibis.DOM,
    Event = ibis.dom.Event,
    each = ibis.each,
    extend = ibis.extend;

var corePlugins = ['core', 'help', 'autolink', 'cleanup', 'code', 'format', 'importcss', 'colorpicker', 'upload', 'blobupload', 'figure', 'ui', 'noneditable', 'branding'];

// module-level settings, set by init()
var settings = null;

/**
 * Build a query string from an object
 * @param {object} params
 * @param {string} prefix
 * @returns {string}
 */
function http_build_query(params, prefix) {
    const queryStringParts = [];

    for (const key in params) {
        // eslint-disable-next-line no-prototype-builtins
        if (params.hasOwnProperty(key)) {
            const value = params[key];
            const fullKey = prefix ? `${prefix}[${key}]` : key;

            if (typeof value === 'object' && value !== null) {
                queryStringParts.push(http_build_query(value, fullKey));
            } else {
                queryStringParts.push(encodeURIComponent(fullKey) + '=' + encodeURIComponent(value));
            }
        }
    }

    return queryStringParts.join('&');
}

/**
 * Mark JavaScript plugin files as loaded in the script loader
 */
function markLoaded() {
    var s = settings,
        suffix = s.suffix || '';

    function load(u) {
        ibis.ScriptLoader.markDone(ibis.baseURL + '/' + u);
    }

    if (s.compress.javascript == 1) {
        each(s.external_plugins, function (url) {
            load(url);
        });

        each(s.plugins.split(','), function (n) {
            if (n) {
                load('plugins/' + n + '/plugin' + suffix + '.js');
            }
        });
    }

    each(corePlugins, function (n) {
        load('plugins/' + n + '/plugin' + suffix + '.js');
    });
}

/**
 * Set up selection bookmark on mousedown outside the editor
 * @param {ibis.Editor} ed
 */
function setBookmark(ed) {
    function isEditorHidden(ed) {
        return ed.isHidden() || DOM.getStyle(ed.id + '_ifr', 'visibility') == 'hidden';
    }

    function isEditor(el) {
        return DOM.getParent(el, 'div.mceEditor, div.mceSplitButtonMenu, div.mceListBoxMenu, div.mceDropDown');
    }

    DOM.bind(document.body, 'mousedown', function (e) {
        var el = e.target;

        if (isEditor(el)) {
            return;
        }

        if (!isEditorHidden(ed) && ed.selection) {
            var n = ed.selection.getNode();

            if (DOM.getParent(n, 'body#ibis')) {
                ed.lastSelectionBookmark = ed.selection.getBookmark(1);
            }
        }
    });
}

/**
 * Set up ibis onAddEditor events and window load handlers
 */
function load() {
    var loaded;

    // pass settings to ibis
    ibis.settings = settings;

    ibis.onAddEditor.add(function (_mgr, ed) {
        var el = ed.getElement();

        if (ed.settings.theme !== "core") {
            return;
        }

        if (window.Joomla) {
            if (Joomla.getOptions) {
                var xtdOptions = Platform.getScriptOptions('joomla_xtd_buttons') || {},
                    btns = ed.settings.joomla_xtd_buttons || {};

                if (xtdOptions && ibis.is(xtdOptions, 'object')) {
                    each(xtdOptions, function (value, key) {
                        if (value && value.length) {
                            btns[key] = value;
                        }
                    });

                    ed.settings.joomla_xtd_buttons = btns;
                }
            }

            Platform.PlatformEditor.register(ed);
        }

        if (settings.compress.css) {
            ed.onPreInit.add(function () {
                ed.dom.loadCSS(settings.site_url + 'index.php?option=com_jce&task=editor.pack&type=css&slot=content');
            });
        }

        Toggle.create(el, settings);

        setBookmark(ed);

        ed.onPreInit.add(function () {
            Tabs.create(ed, settings);
        });

        ed.onInit.add(function () {
            ed.onSubmit.addToTop(function () {
                if (ed.initialized && ed.getElement()) {
                    ed.isNotDirty = 1;
                    Content.get(ed.id);
                }
            });

            if (ed.settings.refocus) {
                window.setTimeout(function () {
                    var bookmark = Content.getRefocusBookmark(ed);

                    if (bookmark) {
                        Content.setActiveLine(ed, bookmark);
                    }
                }, 100);
            }
        });

        ed.onBeforeRenderUI.add(function () {
            var n = ed.getElement().form;

            if (!n || n._mceOldSubmit) {
                return;
            }

            if (!n.submit.nodeType && !n.submit.length) {
                ed.formElement = n;
                n._mceOldSubmit = n.submit;
                n.submit = function () {
                    ibis.each(ibis.editors, function (e) {
                        if (e.initialized && e.getElement()) {
                            e.isNotDirty = 1;
                            Content.get(e.id);
                        }
                    });

                    return ed.formElement._mceOldSubmit(ed.formElement);
                };

                n = null;
            }
        });

        ed.onPostRender.add(function () {
            var el = ed.getElement(),
                state = Editor.getEditorState(el, settings),
                toggle = ibis.is(ed.settings.toggle) ? parseInt(ed.settings.toggle, 10) : 0;

            if (!state && toggle) {
                ed.hide();

                if (ed.plugins.source) {
                    ed.plugins.source.hide();
                }

                if (ed.plugins.preview) {
                    ed.plugins.preview.hide();
                }
            }
        });

        ed.onWfEditorChange = new ibis.util.Dispatcher();

        ed.onWfEditorChange.add(function (ed, o) {
            if (ibis.is(o.content)) {
                ed.setContent(o.content, o);
                ed.onChange.dispatch();
            }
        });

        ed.onSaveContent.add(function () {
            if (ed !== ibis.activeEditor) {
                return;
            }

            var bookmark = Content.getActiveLine(ed);
            Content.setRefocusBookmark(ed, bookmark);
        });

        ed.onRemove.add(function () {
            var container = DOM.getParent(ed.getElement(), 'div.wf-editor-container');

            if (container) {
                var nodes = ibis.grep(DOM.select('div', container), function (node) {
                    return node !== ed.getElement() && node !== ed.getContainer();
                });

                DOM.remove(nodes);
                DOM.remove(container, 1);
            }
        });
    });

    function _load() {
        if (!loaded) {
            loaded = true;
            return preinit();
        }
    }

    Event.bind(window, 'load', function () {
        _load();
        Platform.initSubformEvents();
    });

    Event.bind(window, 'ready', function () {
        window.setTimeout(function () {
            _load();
        }, 1000);
    });
}

/**
 * Set up a single textarea editor instance (toggle button, state)
 * @param {node} el The textarea element
 * @returns {boolean|undefined} False if editor is toggled off
 */
function createInstance(el) {
    if (typeof el === "string") {
        el = DOM.get(el);
    }

    if (!el) {
        return;
    }

    if (settings.width) {
        DOM.setStyle(el, 'width', settings.width);
    }

    if (settings.height) {
        DOM.setStyle(el, 'height', settings.height);
    }

    var state = Editor.getEditorState(el, settings);

    if (Editor.canToggle(settings)) {
        Toggle.create(el, settings);

        var header = DOM.getPrev(el, '.wf-editor-header');

        if (!state) {
            DOM.addClass(el, 'wf-no-editor');
            DOM.hide(DOM.select('.wf-editor-tabs', header));
            DOM.addClass(el.parentNode, 'wf-editor-toggle-off');

            return false;
        }
    }

    return true;
}

/**
 * Create editors from an element or element list (backwards compatibility)
 * @param {string|Array} elements
 */
function create(elements) {
    if (typeof elements === "string") {
        var ed = ibis.get(elements);

        if (ed) {
            ibis.remove(ed);
        }

        elements = [elements];
    }

    return preinit(elements);
}

/**
 * Pre-initialize editors — assign IDs and render each editor instance
 * @param {Array} elements Optional array of textarea elements or ids
 */
function preinit(elements) {
    function createId(elm) {
        var id = elm.id;

        if (!id) {
            id = elm.name;

            if (id && !DOM.get(id)) {
                id = elm.name;
            } else {
                id = DOM.uniqueId();
            }

            elm.setAttribute('id', id);
        }

        return id;
    }

    try {
        elements = elements || DOM.select('.wf-editor');

        each(elements, function (elm) {
            elm = DOM.get(elm);

            if (!elm) {
                return true;
            }

            var editorId = createId(elm);

            if (ibis.get(editorId)) {
                return true;
            }

            DOM.show(elm);

            if (settings.theme == "core") {
                createInstance(elm);
            }

            var editor = new ibis.Editor(editorId, settings, ibis.EditorManager);
            editor.render();
        });
    } catch (e) {
        console.debug(e);
    }
}

/**
 * Main initialization — merges options with defaults, then calls load()
 * @param {object} options Editor options (from Joomla or direct call)
 */
function init(options) {
    options = options || Platform.getScriptOptions('editor');

    if (!options) {
        throw new Error('Unable to initialize editor. No settings found');
    }

    var base = options.base_url,
        site = Platform.getSite(base);

    if (/https:\/\//.test(document.location.href)) {
        base = base.replace(/http:/, 'https:');
    }

    window.ibisPreInit = {};

    options.query = http_build_query(options.query);

    extend(ibis, {
        baseURL: base + 'media/plg_editors_jce/ibis',
        suffix: '',
        query: options.query
    });

    var indent = 'p,h1,h2,h3,h4,h5,h6,blockquote,div,title,pre,td,ul,li,area,table,thead,tfoot,tbody,tr,section,article,hgroup,aside,figure,object,video,audio';

    settings = settings || extend({
        document_base_url: base,
        site_url: site,
        schema: 'mixed',
        convert_urls: true,
        relative_urls: true,
        mode: 'textareas',
        entity_encoding: 'raw',
        editor_selector: 'wf-editor',
        editor_deselector: 'wf-no-editor',
        urlconverter_callback: 'WFEditor.convertURL',
        popup_css: false,
        add_form_submit_trigger: false,
        submit_patch: false,
        theme: 'none',
        skin_directionality: 'ltr',
        invalid_elements: 'applet,iframe,object,embed,script,style,body,bgsound,base,basefont,frame,frameset,head,html,id,ilayer,layer,link,meta,name,title,xml',
        plugins: '',
        external_plugins: {},
        whitespace_elements: 'pre,script,style,textarea,code',
        allow_conditional_comments: true,
        allow_event_attributes: false,
        fix_list_elements: true,
        indent_before: indent,
        indent_after: indent,
        update_styles: true,
        constrain_menus: false,
        compress: {
            css: false,
            javascript: false
        },
        language_load: false
    }, options);

    if (settings) {
        try {
            if (settings.compress.css) {
                extend(settings, {
                    content_css: false,
                    editor_css: false
                });
            }

            markLoaded();
            load();
        } catch (e) {
            console.debug(e);
        }
    }
}

/**
 * Get the current settings object
 * @returns {object|null}
 */
function getSettings() {
    return settings;
}

export default {
    init,
    create,
    createInstance,
    getSettings
};
