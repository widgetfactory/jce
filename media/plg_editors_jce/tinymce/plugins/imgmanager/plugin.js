/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event, extend = tinymce.extend;

    function isMediaObject(node) {
        return node.getAttribute('data-mce-object') || node.getAttribute('data-mce-type');
    }

    function isImage(node) {
        return node && node.nodeName === "IMG" && !isMediaObject(node);
    }

    function getUploadConfig(ed) {
        var data = ed.getParam('imgmanager', {});

        return data.upload || {};
    }

    function getUploadURL(ed, file) {
        var data = getUploadConfig(ed);

        if (data && data.filetypes) {
            if (new RegExp('\.(' + data.filetypes.join('|') + ')$', 'i').test(file.name)) {
                return ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=image';
            }
        }

        return false;
    }

    tinymce.PluginManager.add('imgmanager', function (ed, url) {
        var self = this;

        function openDialog() {
            var node = ed.selection.getNode();

            if (node.nodeName == 'IMG' && isMediaObject(node)) {
                return;
            }

            ed.windowManager.open({
                file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=image',
                size: 'mce-modal-portrait-full'
            }, {
                plugin_url: url
            });
        }

        function getImageProps(value) {
            return new Promise(function (resolve, reject) {

                if (!value) {
                    return resolve();
                }

                var img = new Image();

                img.onload = function () {
                    resolve({ width: img.width, height: img.height });
                };

                img.onerror = function () {
                    reject();
                };

                img.src = ed.documentBaseURI.toAbsolute(value);
            });
        }

        function insertImage(args) {
            var node = ed.selection.getNode();

            if (isImage(node)) {
                // only update src and alt and class
                ed.dom.setAttribs(node, {
                    'src': args.src,
                    'alt': args.alt || '',
                    'class': args['class'] || ''
                });
            } else {
                ed.execCommand('mceInsertContent', false, '<img id="__mce_tmp" src="" />', {
                    skip_undo: 1
                });

                node = ed.dom.get('__mce_tmp');

                ed.dom.setAttribs(node, args);
                ed.dom.setAttrib(node, 'id', '');
            }

            ed.selection.select(node);

            ed.undoManager.add();
            ed.nodeChanged();
        }

        function getDataAndInsert(args) {
            var params = ed.getParam('imgmanager', {});

            return new Promise(function (resolve, reject) {

                if (params.always_include_dimensions !== false) {
                    ed.setProgressState(true);

                    getImageProps(args.src).then(function (data) {
                        ed.setProgressState(false);

                        // insert with passed in data
                        insertImage(extend(args, data));

                        resolve();
                    }, function () {
                        ed.setProgressState(false);
                        reject();
                    });
                } else {
                    insertImage(args);
                    resolve();
                }
            });
        }

        ed.addCommand('mceImageManager', function () {
            openDialog();
        });

        // Register commands
        ed.addCommand('mceImage', function () {
            openDialog();
        });

        // Register buttons
        ed.addButton('imgmanager', {
            title: 'imgmanager.desc',
            cmd: 'mceImage'
        });

        ed.onNodeChange.add(function (ed, cm, n, collapsed) {
            var state = isImage(n);
            cm.setDisabled('imgmanager', !state && !collapsed);
            cm.setActive('imgmanager', state);
        });

        ed.onPreInit.add(function () {
            var params = ed.getParam('imgmanager', {});

            var isMobile = window.matchMedia("(max-width: 600px)").matches;

            function hasFileBrowser() {
                if (params.basic_dialog_filebrowser === false) {
                    return false;
                }

                return params.basic_dialog_filebrowser || isMobile;
            }

            // use basic dialog if set in param or device screen size < 768px
            var isBasicDialog = params.basic_dialog === true || isMobile;

            if (isBasicDialog !== true) {
                return;
            }

            var cm = ed.controlManager, form = cm.createForm('image_form'), urlCtrl, descriptionCtrl, stylesListCtrl;

            var args = {
                label: ed.getLang('dlg.url', 'URL'),
                name: 'url',
                clear: true
            };

            if (hasFileBrowser()) {
                extend(args, {
                    picker: true,
                    picker_label: 'browse',
                    picker_icon: 'image',
                    onpick: function () {
                        ed.execCommand('mceFileBrowser', true, {
                            caller: 'imgmanager',
                            callback: function (selected, data) {
                                if (data.length) {
                                    var src = data[0].url, title = data[0].title;
                                    urlCtrl.value(src);

                                    // clean up title by removing extension
                                    title = title.replace(/\.[^.]+$/i, '');

                                    descriptionCtrl.value(title);

                                    window.setTimeout(function () {
                                        urlCtrl.focus();
                                    }, 10);
                                }
                            },
                            filter: params.filetypes || 'images',
                            value: urlCtrl.value()
                        });
                    }
                });
            }

            var uploader = ed.plugins.upload || false;

            if (params.upload && uploader) {

                extend(args, {
                    upload_label: 'upload.label',
                    upload_accept: params.upload.filetypes,
                    upload: function (e, file) {
                        if (file && file.name) {
                            var url = getUploadURL(ed, file);

                            if (!url) {

                                ed.windowManager.alert({
                                    text: ed.getLang('upload.file_extension_error', 'File type not supported'),
                                    title: ed.getLang('upload.error', 'Upload Error')
                                });

                                return false;
                            }

                            // set disabled
                            urlCtrl.setLoading(true);

                            extend(file, {
                                filename: file.name.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g, ''),
                                upload_url: url
                            });


                            uploader.upload(file, function (response) {
                                urlCtrl.setLoading(false);

                                // select the first file in the response
                                var files = response.files || [], item = files.length ? files[0] : {};

                                if (item.file) {
                                    urlCtrl.value(item.file);

                                    var description = item.alt || item.name || '';

                                    // clean up description by removing extension
                                    description = description.replace(/\.[^.]+$/i, '');

                                    descriptionCtrl.value(description);

                                    return true;
                                }

                                ed.windowManager.alert({
                                    text: 'File upload failed!',
                                    title: ed.getLang('upload.error', 'Upload Error')
                                });

                            }, function (message) {

                                ed.windowManager.alert({
                                    text: message,
                                    title: ed.getLang('upload.error', 'Upload Error')
                                });

                                urlCtrl.setLoading(false);
                            });
                        }
                    }
                });
            }

            urlCtrl = cm.createUrlBox('image_url', args);

            form.add(urlCtrl);

            descriptionCtrl = cm.createTextBox('image_description', {
                label: ed.getLang('dlg.description', 'Description'),
                name: 'alt',
                clear: true
            });

            form.add(descriptionCtrl);

            if (params.basic_dialog_classes !== false) {
                stylesListCtrl = cm.createStylesBox('image_class', {
                    label: ed.getLang('image.class', 'Classes'),
                    onselect: function () { },
                    name: 'classes',
                    styles: params.custom_classes || []
                });

                form.add(stylesListCtrl);
            }

            // Register commands
            ed.addCommand('mceImage', function () {
                var node = ed.selection.getNode();

                if (node.nodeName == 'IMG' && isMediaObject(node)) {
                    return;
                }

                ed.windowManager.open({
                    title: ed.getLang('imgmanager.desc', 'Image'),
                    items: [form],
                    size: 'mce-modal-landscape-small',
                    open: function () {
                        var label = ed.getLang('insert', 'Insert'), node = ed.selection.getNode(), src = '', alt = '';

                        var classes = params.attributes.classes || '';

                        if (isImage(node)) {
                            var src = ed.dom.getAttrib(node, 'src');

                            if (src) {
                                label = ed.getLang('update', 'Update');
                            }

                            var alt = ed.dom.getAttrib(node, 'alt');

                            classes = ed.dom.getAttrib(node, 'class');
                        }

                        urlCtrl.value(src);
                        descriptionCtrl.value(alt);

                        if (stylesListCtrl) {
                            // clean
                            classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                                return cls.trim() !== '';
                            });

                            stylesListCtrl.value(classes);
                        }

                        window.setTimeout(function () {
                            urlCtrl.focus();
                        }, 10);

                        DOM.setHTML(this.id + '_insert', label);

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
                                var data = form.submit(), node = ed.selection.getNode();

                                Event.cancel(e);

                                if (!data.url) {
                                    if (isImage(node)) {
                                        ed.dom.remove(node);
                                    }

                                    return false;
                                }

                                var args = {
                                    src: data.url,
                                    alt: data.alt
                                };

                                args = extend(args, self.getAttributes(params));
                                
                                // reset params class value if set in field
                                args['class'] = data.classes || args['class'] || '';

                                getDataAndInsert(args).then();
                            },
                            classes: 'primary',
                            scope: self
                        }
                    ]
                });
            });
        });

        ed.onInit.add(function () {
            if (ed && ed.plugins.contextmenu) {
                ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                    m.add({
                        title: 'imgmanager.desc',
                        icon: 'imgmanager',
                        cmd: 'mceImage'
                    });
                });
            }
        });

        this.getAttributes = function (data) {
            var attr = { 'style': {} };

            // supported attributes
            var supported = ['alt', 'title', 'id', 'dir', 'class', 'usemap', 'style', 'longdesc', 'loading'];

            var attribs = data.attributes || {};

            // get style attribute string and parse to object
            if (attribs.style && tinymce.is(attribs.style, 'string')) {
                // parse to object
                attribs.style = ed.dom.parseStyle(attribs.style);
            }

            // get styles object
            if (attribs.styles && tinymce.is(attribs.styles, 'object')) {
                // extend style object
                attribs.style = extend(attribs.styles, attribs.style || {});

                delete attribs.styles;
            }

            if (attribs.style) {
                attribs.style = ed.dom.serializeStyle(attribs.style);
            }

            tinymce.each(supported, function (key) {
                if (tinymce.is(attribs[key])) {
                    attr[key] = attribs[key];
                }
            });

            if (data.width) {
                attr.width = data.width;
            }

            if (data.height) {
                attr.height = data.height;
            }

            return attr;
        };

        this.insertUploadedFile = function (o) {
            var data = this.getUploadConfig();

            if (data && data.filetypes) {
                if (new RegExp('\.(' + data.filetypes.join('|') + ')$', 'i').test(o.name)) {
                    var args = {
                        'src': o.file,
                        'alt': o.alt || o.name,
                        'style': {}
                    };

                    args = extend(args, this.getAttributes(o));

                    return ed.dom.create('img', args);
                }
            }

            return false;
        };

        this.getUploadURL = function (file) {
            // default to using Image Manager Extended if it is available
            if (ed.plugins.imgmanager_ext) {
                return false;
            }

            return getUploadURL(ed, file);
        };

        this.getUploadConfig = function () {
            return getUploadConfig(ed);
        };
    });
})();