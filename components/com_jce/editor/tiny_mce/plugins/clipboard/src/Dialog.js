import * as Utils from './Utils.js';

var DOM = tinymce.DOM;

function openWin(ed, cmd) {
    var title = '', ctrl;

    var msg = ed.getLang('clipboard.paste_dlg_title', 'Use %s+V on your keyboard to paste text into the window.');
    msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

    if (cmd === "mcePaste") {
        title = ed.getLang('clipboard.paste_desc');
        ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="7" autofocus></textarea>';

    } else {
        title = ed.getLang('clipboard.paste_text_desc');
        ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="7" autofocus></textarea>';
    }

    var html = '' +
        '<div class="mceModalRow mceModalStack">' +
        '   <label for="' + ed.id + '_paste_content">' + msg + '</label>' +
        '</div>' +
        '<div class="mceModalRow">' +
        '   <div class="mceModalControl">' + ctrl + '</div>' +
        '</div>';

    var isInternalContent = false;
    var pasteEd;

    function createEditor(elm) {
        var pasteEd = new tinymce.Editor(elm.id, {
            plugins: '',
            language_load: false,
            forced_root_block: ed.settings.forced_root_block,
            verify_html: false,
            invalid_elements: ed.settings.invalid_elements,
            base_url: ed.settings.base_url,
            document_base_url: ed.settings.document_base_url,
            directionality: ed.settings.directionality,
            content_css: ed.settings.content_css,
            allow_event_attributes: ed.settings.allow_event_attributes,
            object_resizing: false,
            schema: 'mixed',
            theme: function () {
                var parent = DOM.create('div', {
                    role: 'application',
                    id: elm.id + '_parent',
                    style: 'width:100%'
                });

                var container = DOM.add(parent, 'div', { style: 'width:100%' });
                DOM.insertAfter(parent, elm);

                return {
                    iframeContainer: container,
                    editorContainer: parent
                };
            }
        });

        pasteEd.contentCSS = ed.contentCSS;

        pasteEd.onPreInit.add(function () {
            var doc = this.getDoc();

            this.onPaste.add(function (el, e) {
                var clipboardContent = Utils.getDataTransferItems(e.clipboardData || e.dataTransfer || doc.dataTransfer);

                if (clipboardContent) {
                    isInternalContent = Utils.hasContentType(clipboardContent, 'x-tinymce/html');
                    var content = clipboardContent['x-tinymce/html'] || clipboardContent['text/html'] || clipboardContent['text/plain'] || '';

                    if (ed.settings.clipboard_process_stylesheets !== false) {
                        content = Utils.processStylesheets(content);
                    }

                    content = Utils.trimHtml(content);

                    var sel = doc.getSelection();

                    if (sel != null) {
                        var rng = sel.getRangeAt(0);

                        if (rng != null) {
                            // Make caret marker since insertNode places the caret in the beginning of text after insert
                            content += '<span id="__mce_caret">_</span>';

                            // Delete and insert new node
                            if (rng.startContainer == doc && rng.endContainer == doc) {
                                // WebKit will fail if the body is empty since the range is then invalid and it can't insert contents
                                doc.body.innerHTML = content;
                            } else {
                                rng.deleteContents();

                                if (doc.body.childNodes.length === 0) {
                                    doc.body.innerHTML = content;
                                } else {
                                    rng.insertNode(rng.createContextualFragment(content));
                                }
                            }

                            // Move to caret marker
                            var caretNode = doc.getElementById('__mce_caret');

                            rng = doc.createRange();
                            rng.setStartBefore(caretNode);
                            rng.setEndBefore(caretNode);
                            sel.removeAllRanges();
                            sel.addRange(rng);

                            // Remove the caret position
                            if (caretNode.parentNode) {
                                caretNode.parentNode.removeChild(caretNode);
                            }
                        }
                    }

                    e.preventDefault();
                }
            });

            // remove fragment attribute (from InsertContent)
            this.serializer.addAttributeFilter('data-mce-fragment', function (nodes, name) {
                var i = nodes.length;

                while (i--) {
                    nodes[i].attr('data-mce-fragment', null);
                }
            });
        });

        pasteEd.render();
    }

    ed.windowManager.open({
        title: title,
        content: html,
        size: 'mce-modal-landscape-medium',
        open: function () {
            var inp = DOM.get(ed.id + '_paste_content');

            // create simple editor if pasteHTML
            if (cmd == "mcePaste") {
                createEditor(inp);
            }
        },
        close: function () {
            if (pasteEd) {
                pasteEd.destroy();
            }
        },
        buttons: [
            {
                title: ed.getLang('cancel', 'Cancel'),
                id: 'cancel'
            },
            {
                title: ed.getLang('insert', 'Insert'),
                id: 'insert',
                onsubmit: function (e) {
                    var inp = DOM.get(ed.id + '_paste_content'), data = {};

                    // cleanup for pasteHTML
                    if (cmd == "mcePaste") {
                        var content = tinymce.get(inp.id).getContent();
                        // Remove styles
                        if (ed.settings.code_allow_style !== true) {
                            content = content.replace(/<style[^>]*>[\s\S]+?<\/style>/gi, '');
                        }
                        // Remove meta (Chrome)
                        content = content.replace(/<meta([^>]+)>/, '');
                        // trim and assign
                        data.content = tinymce.trim(content);
                        // set internal flag
                        data.internal = isInternalContent;
                    } else {
                        data.text = inp.value;
                    }

                    ed.execCommand('mceInsertClipboardContent', false, data);
                },
                classes: 'primary',
                autofocus: true
            }
        ]
    });
}

export {
    openWin
};