/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event, extend = tinymce.extend;

    tinymce.create('tinymce.plugins.ImageManager', {
        init: function (ed, url) {
            this.editor = ed;

            var self = this;

            function isMceItem(n) {
                var cls = ed.dom.getAttrib(n, 'class', '');
                return /mce-item-/.test(cls);
            }

            function openDialog() {
                // Internal image object like a flash placeholder
                var n = ed.selection.getNode();

                if (n.nodeName == 'IMG' && isMceItem(n)) {
                    return;
                }

                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=image',
                    width: 780 + ed.getLang('imgmanager.delta_width', 0),
                    height: 680 + ed.getLang('imgmanager.delta_height', 0),
                    inline: 1,
                    popup_css: false,
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
                        resolve({width : img.width, height : img.height});
                    };

                    img.onerror = function () {
                        reject();
                    };

                    img.src = ed.documentBaseURI.toAbsolute(value);
                });
            }

            function insertImage(args) {
                var node = ed.selection.getNode();

                if (node && node.nodeName === 'IMG') {
                    ed.dom.setAttribs(node, args);
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

                    if (params.always_include_dimensions) {
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

            ed.onNodeChange.add(function (ed, cm, n) {
                cm.setActive('imgmanager', n.nodeName == 'IMG' && !isMceItem(n));
            });

            ed.onPreInit.add(function () {
                var params = ed.getParam('imgmanager', {});

                if (params.basic_dialog !== true) {
                    return;
                }

                var cm = ed.controlManager, form = cm.createForm('image_form'), urlCtrl, captionCtrl;

                var args = {
                    label: ed.getLang('url', 'URL'),
                    name: 'url',
                    clear: true
                };

                if (params.basic_dialog_filebrowser) {
                    tinymce.extend(args, {
                        picker: true,
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
                                filter: params.filetypes || 'images'
                            });
                        }
                    });
                }

                urlCtrl = cm.createUrlBox('image_url', args);

                form.add(urlCtrl);

                descriptionCtrl = cm.createTextBox('image_description', {
                    label: ed.getLang('image.description', 'Description'),
                    name: 'alt',
                    clear: true
                });

                form.add(descriptionCtrl);

                /*captionCtrl = cm.createCheckBox('image_caption', {
                    label: ed.getLang('image.caption', 'Caption'),
                    name: 'caption'
                });

                form.add(captionCtrl);*/

                // Register commands
                ed.addCommand('mceImage', function () {
                    ed.windowManager.open({
                        title: ed.getLang('image.desc', 'Image'),
                        items: [form],
                        size: 'mce-modal-landscape-small',
                        open: function () {
                            var label = ed.getLang('insert', 'Insert'), node = ed.selection.getNode(), src = '', alt = '', caption = false;

                            if (node && node.nodeName === 'IMG') {
                                var src = ed.dom.getAttrib(node, 'src');

                                if (src) {
                                    label = ed.getLang('update', 'Update');
                                }

                                var alt = ed.dom.getAttrib(node, 'alt');

                                var figcaption = ed.dom.getNext(node, 'figcaption');

                                if (figcaption) {
                                    caption = true;
                                }
                            }

                            urlCtrl.value(src);
                            descriptionCtrl.value(alt);

                            if (captionCtrl) {
                                captionCtrl.checked(caption);
                            }

                            window.setTimeout(function () {
                                urlCtrl.focus();
                            }, 10);

                            DOM.setHTML(this.id + '_insert', label);

                        },
                        buttons: [
                            {
                                title: ed.getLang('common.cancel', 'Cancel'),
                                id: 'cancel'
                            },
                            {
                                title: ed.getLang('insert', 'Insert'),
                                id: 'insert',
                                onsubmit: function (e) {
                                    var data = form.submit(), node = ed.selection.getNode();

                                    Event.cancel(e);

                                    if (!data.url) {
                                        if (node && node.nodeName === 'IMG') {
                                            ed.dom.remove(node);
                                        }

                                        return false;
                                    }

                                    var args = {
                                        src: data.url,
                                        alt: data.alt
                                    };

                                    args = extend(args, self.getAttributes(params.attributes || {}));

                                    getDataAndInsert(args).then(function () {
                                        node = ed.selection.getNode()

                                        if (captionCtrl) {
                                            var figcaption = ed.dom.getNext(node, 'figcaption');

                                            if (data.caption && data.alt) {
                                                if (!figcaption) {
                                                    ed.selection.select(node);

                                                    ed.formatter.apply('figure', {
                                                        'caption': data.alt
                                                    });
                                                } else {
                                                    figcaption.textContent = data.alt;
                                                }
                                            } else {
                                                if (figcaption) {
                                                    ed.dom.remove(figcaption.parentNode, 1);
                                                    ed.dom.remove(figcaption);
                                                }
                                            }
                                        }
                                    });
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
        },

        getAttributes: function (data) {
            var ed = this.editor;

            var attr = { 'style': {} };

            // supported attributes
            var supported = ['alt', 'title', 'id', 'dir', 'class', 'usemap', 'style', 'longdesc', 'loading'];

            // get styles object
            if (data.styles) {
                // serialize to string and parse to object
                var s = ed.dom.parseStyle(ed.dom.serializeStyle(data.styles));

                // extend args.style object
                tinymce.extend(attr.style, s);

                delete data.styles;
            }

            // get style attribute
            if (data.style) {
                // parse to object
                var style = ed.dom.parseStyle(data.style);

                // extend args.style object
                tinymce.extend(attr.style, style);

                delete data.style;
            }

            tinymce.each(supported, function (key) {
                if (tinymce.is(data[key])) {
                    attr[key] = data[key];
                }
            });

            return attr;
        },

        insertUploadedFile: function (o) {
            var ed = this.editor,
                data = this.getUploadConfig();

            if (data && data.filetypes) {
                if (new RegExp('\.(' + data.filetypes.join('|') + ')$', 'i').test(o.name)) {
                    var args = {
                        'src': o.file,
                        'alt': o.alt || o.name,
                        'style': {}
                    };

                    args = extend(args, this.getAttributes(data));

                    return ed.dom.create('img', args);
                }
            }

            return false;
        },

        getUploadURL: function (file) {
            var ed = this.editor,
                data = this.getUploadConfig();

            if (data && data.filetypes) {
                if (new RegExp('\.(' + data.filetypes.join('|') + ')$', 'i').test(file.name)) {
                    return ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=image';
                }
            }

            return false;
        },

        getUploadConfig: function () {
            var ed = this.editor,
                data = ed.getParam('imgmanager', {});

            return data.upload || {};
        }
    });
    // Register plugin
    tinymce.PluginManager.add('imgmanager', tinymce.plugins.ImageManager);
})();