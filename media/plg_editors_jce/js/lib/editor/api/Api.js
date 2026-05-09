/* global ibis */

// create global tinymce instance mapped to ibis
window.tinymce = window.tinyMCE = ibis;

import Init from '../Init';
import Content from '../Content';
import Toggle from '../ui/Toggle';

/**
 * Convert URLs to relative or absolute based on editor settings
 * @param {string} url URL to convert
 * @param {string|node} elm Tag name or element
 * @param {boolean} save Always true
 * @param {string} name The attribute name being set
 * @returns {string} The converted URL
 */
function convertURL(url, elm) {
    if (!url) {
        return url;
    }

    var ed = ibis.EditorManager.activeEditor;

    if (!ed) {
        return url;
    }

    var settings = ed.settings,
        base = settings.document_base_url;

    if (!settings.convert_urls || (elm && elm.nodeName === 'LINK') || url.indexOf('file:') === 0) {
        return url;
    }

    if (url === base || url === base.substring(0, base.length - 1) || url.charAt(0) === '/') {
        return url;
    }

    if (!settings.mixed_urls) {
        if (settings.relative_urls) {
            if (url.indexOf(base) === 0) {
                return ed.documentBaseURI.toRelative(url);
            }

            return url;
        }

        url = ed.documentBaseURI.toAbsolute(url, settings.remove_script_host);
    }

    if (settings.protocol_relative) {
        url = url.replace(/(http|https|ftp|ftps):\/\//, '//');
    }

    return url;
}

function indent(h) {
    h = h.replace(/\n+/g, '\n');
    return ibis.trim(h);
}

var WfEditor = {
    convertURL: convertURL,
    indent: indent,

    // content
    getContent: Content.get,
    setContent: Content.set,
    insert: Content.insert,
    getSelection: Content.getSelection,

    // init
    init: Init.init,
    create: Init.create,
    createInstance: Init.createInstance,

    // toggle (needs settings at call time)
    toggleEditor: function (el) {
        Toggle.toggle(el, Init.getSettings());
    },
    textareaResize: Toggle.textareaResize,
    wrapText: Toggle.wrapText
};

window.WfEditor = window.WFEditor = WfEditor;

// eslint-disable-next-line no-unused-vars
window.IeCursorFix = function IeCursorFix() {
    return true;
};

// eslint-disable-next-line no-unused-vars
window.jInsertEditorText = function jInsertEditorText(text, editor) {
    try {
        WfEditor.insert(editor, text);
    } catch (e) {
        // error
    }
};

export default {};
