import * as InternalHtml from './InternalHtml.js';

var noop = function () { };

var hasWorkingClipboardApi = function (clipboardData) {
    // iOS supports the clipboardData API but it doesn't do anything for cut operations
    return tinymce.isIOS === false && clipboardData !== undefined && typeof clipboardData.setData === 'function';
};

var setHtml5Clipboard = function (clipboardData, html, text) {
    if (hasWorkingClipboardApi(clipboardData)) {
        try {
            clipboardData.clearData();
            clipboardData.setData('text/html', html);
            clipboardData.setData('text/plain', text);
            clipboardData.setData(InternalHtml.internalHtmlMime(), html);
            return true;
        } catch (e) {
            return false;
        }
    } else {
        return false;
    }
};

var setClipboardData = function (evt, data, fallback, done) {
    if (setHtml5Clipboard(evt.clipboardData, data.html, data.text)) {
        evt.preventDefault();
        done();
    } else {
        fallback(data.html, done);
    }
};

var fallback = function (editor) {
    return function (html, done) {
        var markedHtml = InternalHtml.mark(html);
        var outer = editor.dom.create('div', {
            contenteditable: "false",
            "data-mce-bogus": "all"
        });

        var inner = editor.dom.create('div', {
            contenteditable: "true",
            "data-mce-bogus": "all"
        }, markedHtml);

        editor.dom.setStyles(outer, {
            position: 'fixed',
            left: '-3000px',
            width: '1000px',
            overflow: 'hidden'
        });

        outer.appendChild(inner);
        editor.dom.add(editor.getBody(), outer);

        var range = editor.selection.getRng();
        inner.focus();

        var offscreenRange = editor.dom.createRng();
        offscreenRange.selectNodeContents(inner);
        editor.selection.setRng(offscreenRange);

        setTimeout(function () {
            outer.parentNode.removeChild(outer);
            editor.selection.setRng(range);
            done();
        }, 0);
    };
};

var getData = function (editor) {
    return {
        html: editor.selection.getContent({
            contextual: true
        }),
        text: editor.selection.getContent({
            format: 'text'
        })
    };
};

var cut = function (editor, evt) {
    if (editor.selection.isCollapsed() === false) {
        setClipboardData(evt, getData(editor), fallback(editor), function () {
            // Chrome fails to execCommand from another execCommand with this message:
            // "We don't execute document.execCommand() this time, because it is called recursively.""
            setTimeout(function () { // detach
                editor.execCommand('Delete');
            }, 0);
        });
    }
};

var copy = function (editor, evt) {
    if (editor.selection.isCollapsed() === false) {
        setClipboardData(evt, getData(editor), fallback(editor), noop);
    }
};

var register = function (editor) {
    editor.onCut.add(cut);
    editor.onCopy.add(copy);
};

export {
    register
};