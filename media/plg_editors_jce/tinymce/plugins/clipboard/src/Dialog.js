var DOM = tinymce.DOM, each = tinymce.each;

function openWin(ed, cmd) {
    var title = '', ctrl;

    var msg = ed.getLang('clipboard.paste_dlg_title', 'Use %s+V on your keyboard to paste text into the window.');
    msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

    if (cmd === "mcePaste") {
        title = ed.getLang('clipboard.paste_desc');
        ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="14"></textarea>';

    } else {
        title = ed.getLang('clipboard.paste_text_desc');
        ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="14"></textarea>';
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
            forced_root_block: false,
            verify_html: false,
            invalid_elements: ed.settings.invalid_elements,
            base_url: ed.settings.base_url,
            document_base_url: ed.settings.document_base_url,
            directionality: ed.settings.directionality,
            content_css: ed.settings.content_css,
            allow_event_attributes: ed.settings.allow_event_attributes,
            object_resizing: false,
            paste_upload_data_images: true,
            paste_data_images: false,
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
            var dom = pasteEd.dom;
            
            // remove fragment attribute (from InsertContent)
            this.serializer.addAttributeFilter('data-mce-fragment', function (nodes, name) {
                var i = nodes.length;

                while (i--) {
                    nodes[i].attr('data-mce-fragment', null);
                }
            });

            pasteEd.onPastePostProcess.add(function (ed, o) {
                each(dom.select('img[data-mce-upload-marker]', o.node), function (img) {
                    dom.setAttrib(img, 'src', tinymce.util.Env.transparentSrc);
                    dom.addClass(img, 'mce-object mce-object-img');
                    dom.setStyles(img, {
                        width: img.width || '',
                        height: img.height || ''
                    });
                });
            });

            pasteEd.onGetContent.add(function (ed, o) {                
                var node = dom.create('div', {}, o.content);
                
                each(dom.select('img[data-mce-upload-marker]', node), function (img) {
                    dom.setAttrib(img, 'src', tinymce.util.Env.transparentSrc);
                    dom.removeClass(img, 'mce-object mce-object-img');

                    dom.setStyles(img, {
                        width: '',
                        height: ''
                    });
                });

                o.content = node.innerHTML;
            });
        });

        pasteEd.onInit.add(function () {
            window.setTimeout(function () {
                pasteEd.focus();

                var tmp = pasteEd.dom.add('br', { 'data-mce-bogus' : '1' });

                pasteEd.selection.select(tmp);
                pasteEd.selection.collapse();
                pasteEd.dom.remove(tmp);
            }, 100);
        });

        pasteEd.render();
    }

    ed.windowManager.open({
        title: title,
        content: html,
        size: 'mce-modal-portrait-xlarge',
        open: function () {
            var inp = DOM.get(ed.id + '_paste_content');

            // create simple editor if pasteHTML
            if (cmd == "mcePaste") {
                createEditor(inp);
            }

            window.setTimeout(function () {
                inp.focus();
            }, 0);
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
                classes: 'primary'
            }
        ]
    });
}

export {
    openWin
};