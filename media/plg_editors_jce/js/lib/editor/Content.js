/* global ibis */

import Editor from './Editor';

function getRefocusBookmarkId(ed) {
    var prefix = 'wf-bookmark-{path}{query}-{id}-';
    prefix = prefix.replace(/\{path\}/g, document.location.pathname);
    prefix = prefix.replace(/\{query\}/g, document.location.search);
    prefix = prefix.replace(/\{id\}/g, ed.id);
    return prefix.replace(/\W/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function getRefocusBookmark(ed) {
    var bookmarkStore = sessionStorage.getItem('wf_refocus_bookmark'),
        bookmarkData = {},
        bookmark = 0;

    if (bookmarkStore) {
        try {
            bookmarkData = JSON.parse(bookmarkStore);
        } catch (e) {
            // error
        }
    }

    bookmark = bookmarkData[getRefocusBookmarkId(ed)] || 0;

    if (bookmark) {
        sessionStorage.removeItem('wf_refocus_bookmark');
        bookmark = parseInt(bookmark);
    }

    return bookmark;
}

function setRefocusBookmark(ed, bookmark) {
    if (!bookmark) {
        return;
    }

    var bookmarkData = {};
    bookmarkData[getRefocusBookmarkId(ed)] = bookmark;
    sessionStorage.setItem('wf_refocus_bookmark', JSON.stringify(bookmarkData));
}

/**
 * Load content from source editor into ibis
 */
function load(editor) {
    var el = editor.getElement(),
        source = editor.plugins.source;

    if (Editor.isHidden(editor.id + '_parent')) {
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
}

/**
 * Get the editor content
 * @param {String} id The editor id
 * @returns {String} The editor content
 */
function get(id) {
    var ed = Editor.get(id);

    if (!ed) {
        return '';
    }

    var elm = document.getElementById(id),
        state = elm && Editor.isActive(elm);

    if (ed && state) {
        return ed.save();
    }

    if (elm) {
        return elm.value;
    }

    return '';
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
        var elm = document.getElementById(id);

        if (elm) {
            elm.value = html;
        }
    }
}

/**
 * Get the current editor selection
 * @param {string} id Editor id
 * @param {object} args Additional arguments
 * @returns {string} Selection content
 */
function getSelection(id, args) {
    var ed = Editor.get(id);

    if (ed && ed.getSelection) {
        return ed.getSelection(args || {});
    }

    return document.getSelection().toString();
}

/**
 * Insert content into the editor
 * @param {String} el The editor id or element
 * @param {String} v The text to insert
 * @returns {Boolean} True if successful
 */
function insert(el, v) {
    var ed = Editor.get(el);

    if (!ed) {
        if (typeof el === "string") {
            el = document.getElementById(el);
        }

        if (el && !Editor.isHidden(el)) {
            insertIntoTextarea(el, v);
        }

        return true;
    }

    if (ed) {
        if (ed.execCommand) {
            if (!Editor.isHidden(ed.getElement())) {
                insertIntoTextarea(ed.getElement(), v);
                return true;
            }

            if (ed.lastSelectionBookmark) {
                ed.selection.moveToBookmark(ed.lastSelectionBookmark);
            }

            ed.execCommand('mceInsertContent', false, v);
            return true;
        }

        ed.insertContent(v);
        return true;
    }

    return false;
}

/**
 * Insert content into a textarea
 * @param {node} el The textarea element
 * @param {string} v The text to insert
 */
function insertIntoTextarea(el, v) {
    el.focus();

    if (document.selection) {
        var rng = document.selection.createRange();
        rng.text = v;
    } else {
        el.setRangeText(v, el.selectionStart, el.selectionEnd, "end");
    }
}

/**
 * Get the current block element index (line number)
 * @param {ibis.Editor} ed
 * @returns {number}
 */
function getActiveLine(ed) {
    var blocks = [], line = 0;

    ibis.each(ed.schema.getBlockElements(), function (_value, name) {
        if (/\W/.test(name)) {
            return true;
        }

        blocks.push(name.toLowerCase());
    });

    var node = ed.selection.getNode(),
        nodes = ed.dom.select(blocks.join(','));

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

/**
 * Move cursor to a block element by index or character position
 * @param {ibis.Editor} ed
 * @param {number} pos Block index or character position
 * @param {boolean} fromCharacterIndex Use character position instead of block index
 */
function setActiveLine(ed, pos, fromCharacterIndex) {
    var blocks = [], node,
        doc = ed.getDoc(),
        body = ed.getBody();

    pos = parseInt(pos);

    if (!pos || pos < 0) {
        return;
    }

    function getElementNodeAtCharacterIndexPosition(position) {
        var walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false),
            currentPos = 0;

        while (walker.nextNode()) {
            var textNode = walker.currentNode,
                nodeLength = textNode.length;

            if (currentPos + nodeLength >= position) {
                return textNode.parentNode;
            }

            currentPos += nodeLength;
        }

        return null;
    }

    if (fromCharacterIndex) {
        node = getElementNodeAtCharacterIndexPosition(pos);
    } else {
        ibis.each(ed.schema.getBlockElements(), function (_value, name) {
            if (/\W/.test(name)) {
                return true;
            }

            blocks.push(name.toLowerCase());
        });

        node = ed.dom.select(blocks.join(','))[pos] || null;
    }

    if (node) {
        ed.focus();
        ed.selection.setCursorLocation(node, node.childNodes.length);
        ed.selection.scrollIntoView(node);
    }
}

export default {
    load,
    get,
    set,
    insert,
    getSelection,
    getActiveLine,
    setActiveLine,
    insertIntoTextarea,
    getRefocusBookmark,
    setRefocusBookmark
};
