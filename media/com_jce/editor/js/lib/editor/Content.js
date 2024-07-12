import Editor from './Editor';

function isHidden(el) {
    if (typeof el === "string") {
        el = document.getElementById(el);
    }

    return el && el.style.display === "none";
}

function load(editor) {
    var el = editor.getElement(),
        source = editor.plugins.source;

    // get source code
    if (source && !source.isHidden()) {
        var code = source.getContent();

        if (code !== null) {
            if (!/TEXTAREA|INPUT/i.test(el.nodeName)) {
                el.innerHTML = code;
            } else {
                el.value = code;
            }

            editor.load();
        }
    }
}

/**
 * Set the editor content
 * @param {String} id The editor id
 * @param {String} html The html content to set
 */
function set(id, html) {
    var ed = Editor.get(id);

    if (ed) {
        ed.setContent(html);
    } else {
        document.getElementById(id).value = html;
    }
}

/**
 * Get the editor content
 * @param {String} id The editor id
 */
function get(id) {
    var ed = Editor.get(id);

    // return textarea content
    var elm = document.getElementById(id),
        state = Editor.state(elm);

    // pass content from editor
    if (ed && state) {
        return ed.save();
    }

    if (elm) {
        return elm.value;
    }

    return '';
}

function getSelection(id, args) {
    var ed = Editor.get(id);

    // pass content to textarea and return
    if (ed) {
        return ed.getSelection(args || {});
    }

    // return textarea content
    return document.getElementById(id).value;
}

/**
 * Insert content into the editor. This function is provided for editor-xtd buttons and includes methods for inserting into textareas
 * @param {String} el The editor id
 * @param {String} value The text to insert
 */
function insert(el, value) {
    // get an editor object
    var ed = Editor.get(el);

    // insert into textarea if editor not loaded or is hidden
    if (!ed) {
        if (typeof el === "string") {
            el = document.getElementById(el);
        }

        if (el && !isHidden(el)) {
            insertIntoTextarea(el, value);
        }

        return true;
    }

    // editor found, insert
    if (ed) {
        // tinymce
        if (ed.execCommand) {
            // should always be inserting into the activeEditor
            if (ed !== tinymce.activeEditor) {
                ed = tinymce.activeEditor;
            }

            // textarea visible
            if (!isHidden(ed.getElement())) {
                insertIntoTextarea(ed.getElement(), value);

                return true;
            }

            if (ed.lastSelectionBookmark) {
                ed.selection.moveToBookmark(ed.lastSelectionBookmark);
            }

            ed.execCommand('mceInsertContent', false, value);
            return true;
        }

        // code editor
        ed.insertContent(value);

        return true;
    }

    return false;
}

function getActiveLine(ed) {
    var blocks = [], line = 0;

    tinymce.each(ed.schema.getBlockElements(), function (value, name) {
        if (/\W/.test(name)) {
            return true;
        }

        blocks.push(name.toLowerCase());
    });

    // get number of lines
    var node = ed.selection.getNode(), nodes = ed.dom.select(blocks.join(','));

    if (!node) {
        return line;
    }

    if (node.nodeType !== 1 || node.getAttribute('data-mce-type') === "bookmark") {
        node = node.parentNode;
    }

    for (var i = 0, len = nodes.length; i < len; i++) {
        if (nodes[i] === node) {
            line = i;
            break;
        }
    }

    return line;
}

function setActiveLine(ed, pos) {
    var blocks = [];

    if (!pos || pos < 1) {
        return;
    }

    tinymce.each(ed.schema.getBlockElements(), function (value, name) {
        if (/\W/.test(name)) {
            return true;
        }

        blocks.push(name.toLowerCase());
    });

    // get number of lines
    var nodes = ed.dom.select(blocks.join(',')), node = nodes[pos - 1] || null;

    if (node) {
        ed.focus();

        var len = node.childNodes.length;

        ed.selection.setCursorLocation(node, len);
        ed.selection.scrollIntoView(node);
    }
}

function insertIntoTextarea(el, v) {
    el.focus();
    // IE
    if (document.selection) {
        var rng = document.selection.createRange();
        rng.text = v;
        // Mozilla / WebKit
    } else {
        el.setRangeText(v, el.selectionStart, el.selectionEnd, "end");
    }
}

export default {
    load,
    get,
    set,
    insert,
    getSelection,
    getActiveLine,
    setActiveLine
};