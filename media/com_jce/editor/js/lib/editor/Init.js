/* global tinymce */

import Editor from './Editor';
import Content from './Content';
import Toggle from './ui/Toggle';
import Tabs from './ui/Tabs';
import './Platform';

const each = tinymce.each,
    extend = tinymce.extend,
    DOM = tinymce.DOM,
    scriptLoader = tinymce.ScriptLoader,
    Dispatcher = tinymce.util.Dispatcher;

const indent = 'p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,ul,li,area,table,thead,tfoot,tbody,tr,section,article,hgroup,aside,figure,object,video,audio';
const invalid_elements = 'applet,iframe,object,embed,script,style,body,bgsound,base,basefont,frame,frameset,head,html,id,ilayer,layer,link,meta,name,title,xml';

// default settings
let settings = {
    schema: 'mixed',
    relative_urls: true,
    selector: 'textarea.wf-editor',
    entity_encoding: 'raw',
    urlconverter_callback: 'WFEditor.convertURL',
    popup_css: false,
    add_form_submit_trigger: false,
    submit_patch: false,
    theme: 'none',
    skin_directionality: 'ltr',
    invalid_elements: invalid_elements,
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
        css: true,
        javascript: true
    },
    language_load: false
};

function http_build_query(params, prefix) {
    const queryStringParts = [];

    for (const key in params) {
        // eslint-disable-next-line no-prototype-builtins
        if (params.hasOwnProperty(key)) {
            const value = params[key];
            const fullKey = prefix ? `${prefix}[${key}]` : key;

            if (typeof value === 'object' && value !== null) {
                // Recursive call for nested objects
                queryStringParts.push(http_build_query(value, fullKey));
            } else {
                queryStringParts.push(encodeURIComponent(fullKey) + '=' + encodeURIComponent(value));
            }
        }
    }

    return queryStringParts.join('&');
}

function markLoaded() {
    if (settings.compress.javascript) {
        // mark plugins as loaded
        each(settings.plugins.split(","), function (name) {
            scriptLoader.markDone(tinymce.baseURL + '/plugins/' + name + '/plugin.js');
        });

         // mark external plugins as loaded
        if (settings.external_plugins) {
            each(settings.external_plugins, function (url) {
                scriptLoader.markDone(url);
            });
        }
    }

    // mark core plugins loaded
    each(['core', 'help', 'autolink', 'cleanup', 'code', 'format', 'importcss', 'colorpicker', 'upload', 'blobupload', 'figure', 'ui', 'noneditable', 'branding'], function (name) {
        scriptLoader.markDone(tinymce.baseURL + '/plugins/' + name + '/plugin.js');
    });
}

function setBookmark(editor) {
    function isHidden(editor) {
        return editor.isHidden() || DOM.getStyle(editor.id + '_ifr', 'visibility') == 'hidden';
    }

    function isEditor(el) {
        return DOM.getParent(el, 'div.mceEditor, div.mceSplitButtonMenu, div.mceListBoxMenu, div.mceDropDown');
    }

    DOM.bind(document.body, 'mousedown', function (e) {
        var el = e.target;

        if (isEditor(el)) {
            return;
        }

        if (!isHidden(editor) && editor.selection) {
            var n = editor.selection.getNode();

            if (DOM.getParents(n, 'body#tinymce')) {
                editor.lastSelectionBookmark = editor.selection.getBookmark(1);
            }
        }
    });

    /*$(document.body).on('mousedown', function (e) {
        var el = e.target;

        if (isEditor(el)) {
            return;
        }

        if (!isHidden(editor) && editor.selection) {
            var n = editor.selection.getNode();

            if ($(n).parents('body#tinymce')) {
                editor.lastSelectionBookmark = editor.selection.getBookmark(1);
            }
        }
    });*/
}

function load() {
    let loaded = false;

    // setup editor before init
    tinyMCE.onAddEditor.add(function (mgr, ed) {
        const el = ed.getElement();

        if (!el.classList.contains('wf-editor')) {
            return;
        }

        // load packer css
        if (settings.compress.css) {
            ed.onPreInit.add(function () {
                ed.dom.loadCSS(settings.site_url + 'index.php?option=com_jce&task=editor.pack&type=css&slot=content');
            });
        }

        // create tabs and toggle
        Toggle.create(el, settings);

        setBookmark(ed);

        ed.onPreInit.add(function () {
            // create tabs before render
            Tabs.create(ed, settings);
        });

        // form submit trigger
        ed.onInit.add(function () {
            ed.onSubmit.addToTop(function () {
                if (ed.initialized && ed.getElement()) {
                    ed.isNotDirty = 1;
                    Content.get(ed.id);
                }
            });

            if (ed.settings.refocus) {
                var bookmark = sessionStorage.getItem(ed.id + '_bookmark');

                if (bookmark && ed === tinymce.activeEditor) {
                    window.setTimeout(function () {
                        Content.setActiveLine(ed, bookmark);
                    }, 10);
                }
            }
        });

        // Form submit patch
        ed.onBeforeRenderUI.add(function () {
            var n = ed.getElement().form;

            if (!n || n._mceOldSubmit) {
                return;
            }

            if (!n.submit.nodeType && !n.submit.length) {
                ed.formElement = n;
                n._mceOldSubmit = n.submit;
                n.submit = function () {
                    // Save all instances
                    tinymce.each(tinymce.editors, function (e) {
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
            // get stored state
            var el = ed.getElement(), state = Editor.state(el, settings);

            // get toggle option
            var toggle = tinymce.is(ed.settings.toggle) ? parseInt(ed.settings.toggle, 10) : 0;

            // only disable editor if you can switch it back on
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

        ed.onWfEditorChange = new Dispatcher();

        ed.onWfEditorChange.add(function (ed, o) {
            if (tinymce.is(o.content)) {
                ed.setContent(o.content, o);
                ed.onChange.dispatch();
            }
        });

        ed.onSaveContent.add(function () {
            var bookmark = Content.getActiveLine(ed);
            sessionStorage.setItem(ed.id + '_bookmark', bookmark);
        });

        // remove tabs etc. when editor is removed
        ed.onRemove.add(function () {
            var container = DOM.getParent(ed.getElement(), 'div.wf-editor-container');

            if (container) {
                var nodes = tinymce.grep(DOM.select('div', container), function (node) {
                    if (node === ed.getElement() || node === ed.getContainer()) {
                        return false;
                    }

                    return true;
                });

                // remove found nodes
                DOM.remove(nodes);

                // remove parent container, leaving remaining nodes for tinymce to deal with
                DOM.remove(container, 1);
            }
        });
    });

    function _load() {
        if (!loaded) {
            // set loaded flag
            loaded = true;

            // create editor
            return preinit();
        }
    }

    // load editor when page fully loaded
    DOM.bind(window, 'load', function () {
        _load();
    });

    DOM.bind(window, 'ready', function () {
        window.setTimeout(function () {
            _load();
        }, 1000);
    });
}

/**
 * Initialise JContentEditor
 * @param {Object} settings TinyMCE Settings
 */
function init(options) {
    var base = options.base_url;

    // fix https in base url
    if (/https:\/\//.test(document.location.href)) {
        base = base.replace(/http:/, 'https:');
    }

    // set preinit object to prevent tinymce from generating baseURL
    window.tinyMCEPreInit = {};

    // set baseURL, suffix and query string
    extend(tinymce, {
        baseURL: base + 'media/com_jce/editor/tinymce',
        suffix: '',
        query: http_build_query(options.query)
    });

    // remove submit triggers
    settings = extend({
        document_base_url: base + '/'
    }, options);

    settings.file_browser_callback = function (args) {
        tinymce.activeEditor.execCommand('mceFileBrowser', true, args);
    };

    try {
        // mark language loaded
        scriptLoader.markDone(settings.base_url + '/langs/' + settings.language + '.js');
        load();
    } catch (e) {
        console.debug(e);
    }
}

/**
 * Create each textarea instance
 */
function createInstance(el) {
    // get element from id
    if (typeof el === "string") {
        el = DOM.get(el);
    }

    // element not found...?
    if (!el) {
        return;
    }

    // set textarea dimensions if required
    if (settings.width) {
        DOM.setStyle(el, 'width', settings.width);
    }

    if (settings.height) {
        DOM.setStyle(el, 'height', settings.height);
    }

    // get stored state
    var state = Editor.state(el, settings);

    Toggle.create(el, settings);

    // get toggle option
    var toggle = tinymce.is(settings.toggle) ? parseInt(settings.toggle, 10) : 0;

    // only disable editor if you can switch it back on
    if (!state && toggle) {
        DOM.addClass(el, 'wf-no-editor');
        DOM.addClass(el.parentNode, 'wf-editor-toggle-off');

        return false;
    }

    return true;
}

/**
 * Backwards compatability
 */
function create(elements) {
    // must be an array
    if (typeof elements === "string") {
        // find existing editors and remove
        var ed = tinymce.get(elements);

        if (ed) {
            tinymce.remove(ed);
        }

        elements = [elements];
    }

    return preinit(elements);
}

/**
 * Preinit before initialising tinymce
 */
function preinit(elements) {
    function createId(elm) {
        var id = elm.id;

        // Use element id, or unique name or generate a unique id
        if (!id) {
            id = elm.name;

            if (id && !DOM.get(id)) {
                id = elm.name;
            } else {
                // Generate unique name
                id = DOM.uniqueId();
            }

            elm.setAttribute('id', id);
        }

        return id;
    }

    try {
        // mark plugins as loaded
        if (settings.compress.javascript) {
            markLoaded(settings);
        }

        // create the toggle button
        if (!settings.readonly && (tinymce.is(settings.toggle) ? settings.toggle : 1)) {
            elements = elements || DOM.select('.wf-editor');

            each(elements, function (elm) {
                elm = DOM.get(elm);

                if (!elm) {
                    return;
                }

                var editorId = createId(elm);

                if (tinymce.get(editorId)) {
                    return;
                }

                // show the textarea
                DOM.show(elm);

                // create toggle etc. and return state (on/off)
                createInstance(elm);

                // if editor is on, create and render
                const editor = new tinymce.Editor(editorId, settings, tinymce.EditorManager);
                editor.render();
            });
        }
    } catch (e) {
        window.console && console.debug(e);
    }
}

export default {
    init,
    create,
    createInstance
};