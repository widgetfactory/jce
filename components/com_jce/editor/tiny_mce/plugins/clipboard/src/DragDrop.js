import * as InternalHtml from './InternalHtml';
import * as Utils from './Utils';

var RangeUtils = tinymce.dom.RangeUtils, Delay = tinymce.util.Delay;

var getCaretRangeFromEvent = function (editor, e) {
    return RangeUtils.getCaretRangeFromPoint(e.clientX, e.clientY, editor.getDoc());
};

var isPlainTextFileUrl = function (content) {
    var plainTextContent = content['text/plain'];
    return plainTextContent ? plainTextContent.indexOf('file://') === 0 : false;
};

var setFocusedRange = function (editor, rng) {
    editor.focus();
    editor.selection.setRng(rng);
};

var draggingInternallyState = false;

var setup = function (editor, clipboard) {
    // Block all drag/drop events
    if (editor.settings.clipboard_paste_block_drop) {
        editor.dom.bind(editor.getBody(), ['dragend', 'dragover', 'draggesture', 'dragdrop', 'drop', 'drag'], function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // Prevent users from dropping data images on Gecko
    if (editor.settings.clipboard_paste_data_images === false) {
        editor.dom.bind(editor.getBody(), 'drop', function (e) {
            var dataTransfer = e.dataTransfer;

            if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
                e.preventDefault();
            }
        });
    }

    editor.dom.bind(editor.getBody(), 'drop', function (e) {
        var dropContent, rng;

        rng = getCaretRangeFromEvent(editor, e);

        if (e.isDefaultPrevented()) {
            return;
        }

        dropContent = Utils.getDataTransferItems(e.dataTransfer);
        var internal = Utils.hasContentType(dropContent, InternalHtml.internalHtmlMime()) || draggingInternallyState;

        if ((!Utils.hasHtmlOrText(dropContent) || isPlainTextFileUrl(dropContent)) && clipboard.pasteImageData(e, rng)) {
            return;
        }

        if (rng && editor.settings.clipboard_paste_filter_drop !== false) {
            var content = dropContent[InternalHtml.internalHtmlMime()] || dropContent['text/html'] || dropContent['text/plain'];

            if (content) {
                e.preventDefault();

                // FF 45 doesn't paint a caret when dragging in text in due to focus call by execCommand
                Delay.setEditorTimeout(editor, function () {
                    editor.undoManager.add();

                    if (internal) {
                        editor.execCommand('Delete', false, null, { skip_undo: true });
                        editor.selection.getRng().deleteContents();
                    }

                    setFocusedRange(editor, rng);

                    content = Utils.trimHtml(content);

                    var data = {};

                    if (!dropContent['text/html']) {
                        data.text = content;
                    } else {
                        // reset styles, replacing style attribute with data-mce-style value or remove
                        content = Utils.resetStyleAttribute(content);

                        data.content = content;
                        data.internal = internal || draggingInternallyState;
                    }

                    editor.execCommand('mceInsertClipboardContent', false, data, { skip_undo: true });
                });
            }
        }
    });

    editor.dom.bind(editor.getBody(), 'dragstart', function (e) {
        draggingInternallyState = true;

        if (e.altKey) {
            e.dataTransfer.effectAllowed = "copy";
            e.dataTransfer.dropEffect = "copy";
        }
    });

    editor.dom.bind(editor.getBody(), ['dragover', 'dragend'], function (e) {
        if (editor.settings.clipboard_paste_data_images && draggingInternallyState == false) {
            e.preventDefault();
            setFocusedRange(editor, getCaretRangeFromEvent(editor, e));
        }

        if (e.type == 'dragend') {
            draggingInternallyState = false;
        }
    });
};

export {
    setup
};