/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 *
 * * Based on plupload - http://www.plupload.com
 */

(function () {
    var each = tinymce.each, extend = tinymce.extend, JSON = tinymce.util.JSON;
    var isWin = navigator.platform.indexOf('Win') !== -1, isSafari = tinymce.isWebKit && navigator.vendor.indexOf('Apple') !== -1;
    var Node = tinymce.html.Node, RangeUtils = tinymce.dom.RangeUtils;

    var supportDragDrop = !!(window.ProgressEvent && window.FileReader && window.FormData) && !tinymce.isOpera;

    var mimes = {};

    function toArray(list) {
        return Array.prototype.slice.call(list || [], 0);
    }

    // Parses the default mime types string into a mimes lookup map (from plupload.js)
    (function (mime_data) {
        var items = mime_data.split(/,/), i, y, ext;

        for (i = 0; i < items.length; i += 2) {
            ext = items[i + 1].split(/ /);

            for (y = 0; y < ext.length; y++) {
                mimes[ext[y]] = items[i];
            }
        }
    })(
            "application/msword,doc dot," +
            "application/pdf,pdf," +
            "application/pgp-signature,pgp," +
            "application/postscript,ps ai eps," +
            "application/rtf,rtf," +
            "application/vnd.ms-excel,xls xlb," +
            "application/vnd.ms-powerpoint,ppt pps pot," +
            "application/zip,zip," +
            "application/x-shockwave-flash,swf swfl," +
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document,docx," +
            "application/vnd.openxmlformats-officedocument.wordprocessingml.template,dotx," +
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,xlsx," +
            "application/vnd.openxmlformats-officedocument.presentationml.presentation,pptx," +
            "application/vnd.openxmlformats-officedocument.presentationml.template,potx," +
            "application/vnd.openxmlformats-officedocument.presentationml.slideshow,ppsx," +
            "application/x-javascript,js," +
            "application/json,json," +
            "audio/mpeg,mpga mpega mp2 mp3," +
            "audio/x-wav,wav," +
            "audio/mp4,m4a," +
            "image/bmp,bmp," +
            "image/gif,gif," +
            "image/jpeg,jpeg jpg jpe," +
            "image/photoshop,psd," +
            "image/png,png," +
            "image/svg+xml,svg svgz," +
            "image/tiff,tiff tif," +
            "text/plain,asc txt text diff log," +
            "text/html,htm html xhtml," +
            "text/css,css," +
            "text/csv,csv," +
            "text/rtf,rtf," +
            "video/mpeg,mpeg mpg mpe," +
            "video/quicktime,qt mov," +
            "video/mp4,mp4," +
            "video/x-m4v,m4v," +
            "video/x-flv,flv," +
            "video/x-ms-wmv,wmv," +
            "video/avi,avi," +
            "video/webm,webm," +
            "video/vnd.rn-realvideo,rv," +
            "application/vnd.oasis.opendocument.formula-template,otf," +
            "application/octet-stream,exe"
            );

    var state = {
        /**
         * Inital state of the queue and also the state ones it's finished all it's uploads.
         *
         * @property STOPPED
         * @final
         */
        STOPPED: 1,
        /**
         * Upload process is running
         *
         * @property STARTED
         * @final
         */
        STARTED: 2,
        /**
         * File is queued for upload
         *
         * @property QUEUED
         * @final
         */
        QUEUED: 1,
        /**
         * File is being uploaded
         *
         * @property UPLOADING
         * @final
         */
        UPLOADING: 2,
        /**
         * File has failed to be uploaded
         *
         * @property FAILED
         * @final
         */
        FAILED: 4,
        /**
         * File has been uploaded successfully
         *
         * @property DONE
         * @final
         */
        DONE: 5,
        // Error constants used by the Error event

        /**
         * Generic error for example if an exception is thrown inside Silverlight.
         *
         * @property GENERIC_ERROR
         * @final
         */
        GENERIC_ERROR: -100,
        /**
         * HTTP transport error. For example if the server produces a HTTP status other than 200.
         *
         * @property HTTP_ERROR
         * @final
         */
        HTTP_ERROR: -200,
        /**
         * Generic I/O error. For exampe if it wasn't possible to open the file stream on local machine.
         *
         * @property IO_ERROR
         * @final
         */
        IO_ERROR: -300,
        /**
         * Generic I/O error. For exampe if it wasn't possible to open the file stream on local machine.
         *
         * @property SECURITY_ERROR
         * @final
         */
        SECURITY_ERROR: -400
    }

    tinymce.create('tinymce.plugins.Upload', {
        files: [],
        plugins: [],
        init: function (ed, url) {
            function cancel() {
                // Block browser default drag over
                ed.dom.bind(ed.getBody(), 'dragover', function (e) {
                    var dataTransfer = e.dataTransfer;

                    // cancel dropped files
                    if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                        e.preventDefault();
                    }
                });

                ed.dom.bind(ed.getBody(), 'drop', function (e) {
                    var dataTransfer = e.dataTransfer;

                    // cancel dropped files
                    if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                        e.preventDefault();
                    }
                });
            }

            var self = this;
            self.editor = ed;
            self.plugin_url = url;

            ed.onPreInit.add(function () {
                // get list of supported plugins
                each(ed.plugins, function (o, k) {
                    if (ed.getParam(k + '_upload') && tinymce.is(o.getUploadURL, 'function') && tinymce.is(o.insertUploadedFile, 'function')) {
                        self.plugins.push(o);
                    }
                });

                if (!ed.settings.compress.css) {
                    ed.dom.loadCSS(url + "/css/content.css");
                }
                // find and convert upload markers
                ed.parser.addNodeFilter('img', function (nodes) {
                    var i = nodes.length, node, cls, data;

                    while (i--) {
                        node = nodes[i], cls = node.attr('class'), data = node.attr('data-mce-upload-marker');

                        if ((cls && cls.indexOf('upload-placeholder') != -1) || data) {
                            // no plugins to upload, remove node
                            if (self.plugins.length == 0) {
                                node.remove();
                            } else {
                                self._createUploadMarker(node);
                            }
                        }
                    }
                });
                // remove upload markers
                ed.serializer.addNodeFilter('img', function (nodes) {
                    var i = nodes.length, node, cls;

                    while (i--) {
                        node = nodes[i], cls = node.attr('class');
                        if (cls && /mceItemUploadMarker/.test(cls)) {
                            // remove marker classes
                            cls = cls.replace(/(?:^|\s)mceItem(Upload|UploadMarker)(?!\S)/g, '');
                            // add placeholder class
                            cls += ' upload-placeholder';
                            // set class and src
                            node.attr({
                                'data-mce-src': 'media/jce/img/placeholder.png',
                                'class': tinymce.trim(cls)
                            });
                        }
                    }
                });
            });

            ed.onInit.add(function () {
                // check for support
                if (!supportDragDrop) {
                    cancel();
                    return;
                }

                // no supported plugins
                if (self.plugins.length == 0) {
                    cancel();
                    return;
                }

                function bindUploadEvents(ed) {
                    each(ed.dom.select('img.mceItemUploadMarker', ed.getBody()), function (n) {
                        if (self.plugins.length == 0) {
                            ed.dom.remove(n);
                        } else {
                            self._bindUploadMarkerEvents(ed, n);
                        }
                    });
                }

                // update events when content is inserted
                ed.selection.onSetContent.add(function () {
                    bindUploadEvents(ed);
                });
                // update events when content is set
                ed.onSetContent.add(function () {
                    bindUploadEvents(ed);
                });

                // update events when fullscreen is activated
                if (ed.onFullScreen) {
                    ed.onFullScreen.add(function (editor) {
                        bindUploadEvents(editor);
                    });
                }

                function cancelEvent(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                ed.dom.bind(ed.getBody(), 'dragover', function(e) {
                    e.dataTransfer.dropEffect = tinymce.VK.metaKeyPressed(e) ? "copy" : "move";
                    //cancelEvent(e);
                });

                // Attach drop handler and grab files
                ed.dom.bind(ed.getBody(), 'drop', function (e) {
                    var dataTransfer = e.dataTransfer;

                    // Add dropped files
                    if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                        each(dataTransfer.files, function (file) {
                            var rng = RangeUtils.getCaretRangeFromPoint(e.clientX, e.clientY, ed.getDoc());
                            if (rng) {
                                ed.selection.setRng(rng);
                                rng = null;
                            }

                            self.addFile(file);
                        });

                        cancelEvent(e);
                    }

                    // upload...
                    if (self.files.length) {
                        each(self.files, function (file) {
                            self.upload(file);
                        });
                    }
                    // stop Firefox opening the image in a new window if the drop target is itself (drag cancelled)
                    if (tinymce.isGecko && e.target.nodeName == 'IMG') {
                        cancelEvent(e);
                    }
                });
            });

            // Setup plugin events
            self.FilesAdded = new tinymce.util.Dispatcher(this);
            self.UploadProgress = new tinymce.util.Dispatcher(this);
            self.FileUploaded = new tinymce.util.Dispatcher(this);
            self.UploadError = new tinymce.util.Dispatcher(this);

            // default settings
            this.settings = {
                multipart: true,
                multi_selection: true,
                file_data_name: 'file',
                filters: []
            };

            self.FileUploaded.add(function (file, o) {
                var n = file.marker, s, w, h;

                function showError(error) {
                    ed.windowManager.alert(error || ed.getLang('upload.response_error', 'Invalid Upload Response'));
                    ed.dom.remove(n);

                    return false;
                }

                if (n) {
                    if (o && o.response) {
                        var r = JSON.parse(o.response);

                        if (!r) {
                            return showError();
                        }

                        if (r.error) {

                            var txt = r.text || r.error;

                            ed.windowManager.alert(txt);
                            ed.dom.remove(n);

                            return false;
                        }

                        if (file.status == state.DONE) {
                            r.type = file.type;

                            if (file.uploader) {
                                o = file.uploader;

                                if (s = o.insertUploadedFile(r)) {
                                    var styles = ed.dom.getAttrib(n, 'data-mce-style');
                                    // transfer styles
                                    if (styles) {
                                        // parse to object
                                        styles = ed.dom.styles.parse(styles);
                                        // set styles
                                        ed.dom.setStyles(s, styles);
                                    }

                                    // transfer width and height if marker
                                    if (ed.dom.hasClass(n, 'mceItemUploadMarker')) {
                                        ed.dom.setAttribs(s, {
                                            'width': n.width || s.width,
                                            'height': n.height || s.height
                                        });
                                    }
                                    // replace marker with new element
                                    if (ed.dom.replace(s, n)) {
                                        ed.nodeChanged();

                                        return true;
                                    }
                                }
                            }

                            // remove from list
                            self.files.splice(tinymce.inArray(self.files, file), 1);
                        }
                    } else {
                        return showError();
                    }
                    // remove marker
                    ed.dom.remove(n);
                }
            });

            self.UploadError.add(function (o) {
                ed.windowManager.alert(o.code + ' : ' + o.message);

                if (o.file && o.file.marker) {
                    ed.dom.remove(o.file.marker);
                }

            });
        },
        /*
         * Bind events to upload marker and create upload input
         * @param marker Marker / Placeholder element
         */
        _bindUploadMarkerEvents: function (ed, marker) {
            var self = this, dom = tinymce.DOM;

            function removeUpload() {
                dom.setStyles('wf_upload_button', {
                    'top': '',
                    'left': '',
                    'display': 'none',
                    'zIndex': ''
                });
            }

            // remove upload on nodechange
            ed.onNodeChange.add(removeUpload);
            // remove on window scroll
            ed.dom.bind(ed.getWin(), 'scroll', removeUpload);

            var input = dom.get('wf_upload_input');
            // create input
            if (!input) {
                var btn = dom.add(dom.doc.body, 'div', {
                    'id': 'wf_upload_button',
                    'title': ed.getLang('upload.button_description', 'Click to upload a file')
                }, '<label for="wf_upload_input">' + ed.getLang('upload.label', 'Upload') + '</label>');

                // create upload input
                input = dom.add(btn, 'input', {
                    'type': 'file',
                    'id': 'wf_upload_input'
                });
            }

            // add upload on mouseover
            ed.dom.bind(marker, 'mouseover', function (e) {

                if (ed.dom.getAttrib(marker, 'data-mce-selected')) {
                    return;
                }

                var vp = ed.dom.getViewPort(ed.getWin());
                var p1 = dom.getRect(ed.getContentAreaContainer());
                var p2 = ed.dom.getRect(marker);
                var st = ed.getBody().scrollTop;

                if (st > p2.y + p2.h / 2 - 25) {
                    return;
                }

                if (st < (p2.y + p2.h / 2 + 25) - p1.h) {
                    return;
                }

                var x = Math.max(p2.x - vp.x, 0) + p1.x;
                var y = Math.max(p2.y - vp.y, 0) + p1.y - Math.max(st - p2.y, 0);

                var zIndex = ed.id == 'mce_fullscreen' ? dom.get('mce_fullscreen_container').style.zIndex : 0;

                dom.setStyles('wf_upload_button', {
                    'top': y + p2.h / 2 - 27,
                    'left': x + p2.w / 2 - 54,
                    'display': 'block',
                    'zIndex': zIndex + 1
                });

                input.onchange = function () {
                    if (input.files) {
                        var file = input.files[0];

                        if (file) {
                            file.marker = marker;

                            if (self.addFile(file)) {
                                ed.dom.addClass(marker, 'loading');

                                self.upload(file);
                                removeUpload();
                            }
                        }
                    }
                };
            });

            // remove upload on mouseout
            ed.dom.bind(marker, 'mouseout', function (e) {
                // don't remove if over upload input
                if (!e.relatedTarget && e.clientY > 0) {
                    return;
                }

                removeUpload();
            });
        },
        _createUploadMarker: function (n) {
            var self = this, ed = this.editor, src = n.attr('src') || '', style = {}, styles, cls = [];

            // get alt from src if not base64 encoded
            if (!n.attr('alt') && !/data:image/.test(src)) {
                var alt = src.substring(src.length, src.lastIndexOf('/') + 1);
                // set alt
                n.attr('alt', alt);
            }

            if (n.attr('style')) {
                style = ed.dom.styles.parse(n.attr('style'));
            }

            // convert hspace
            if (n.attr('hspace')) {
                style['margin-left'] = style['margin-right'] = n.attr('hspace');
            }
            // convert vspace
            if (n.attr('vspace')) {
                style['margin-top'] = style['margin-bottom'] = n.attr('vspace');
            }
            // convert align
            if (n.attr('align')) {
                style.float = n.attr('align');
            }

            if (n.attr('class')) {
                cls = n.attr('class').replace(/\s*upload-placeholder\s*/, '').split(' ');
            }
            // add marker classes
            cls.push('mceItemUpload');
            cls.push('mceItemUploadMarker');
            // set attribs
            n.attr({
                'src': this.plugin_url + '/img/trans.gif',
                'class': tinymce.trim(cls.join(' '))
            });

            var tmp = ed.dom.create('span', {
                'style': style
            });

            // add styles if any
            if (styles = ed.dom.getAttrib(tmp, 'style')) {
                n.attr({
                    'style': styles,
                    'data-mce-style': styles
                });
            }
        },
        /**
         * Builds a full url out of a base URL and an object with items to append as query string items.
         *
         * @param {String} url Base URL to append query string items to.
         * @param {Object} items Name/value object to serialize as a querystring.
         * @return {String} String with url + serialized query string items.
         */
        buildUrl: function (url, items) {
            var query = '';

            each(items, function (value, name) {
                query += (query ? '&' : '') + encodeURIComponent(name) + '=' + encodeURIComponent(value);
            });

            if (query) {
                url += (url.indexOf('?') > 0 ? '&' : '?') + query;
            }

            return url;
        },
        addFile: function (file) {
            var ed = this.editor, self = this, fileNames = {}, url;

            // check for extension in file name, eg. image.php.jpg
            if (/\.(php|php(3|4|5)|phtml|pl|py|jsp|asp|htm|html|shtml|sh|cgi)\./i.test(file.name)) {
                ed.windowManager.alert(ed.getLang('upload.file_extension_error', 'File type not supported'));
                return false;
            }

            // get first url for the file type
            each(self.plugins, function (o, k) {
                if (!file.upload_url) {
                    if (url = o.getUploadURL(file)) {
                        file.upload_url = url;
                        file.uploader = o;
                    }
                }
            });

            if (file.upload_url) {
                if (tinymce.is(file.uploader.getUploadConfig, 'function')) {
                    // check file type and size
                    var config = file.uploader.getUploadConfig();
                    var type = file.type.replace(/[a-z0-9]+\/([a-z0-9]{2,4})/i, '$1');

                    // lowercase
                    type = type.toLowerCase();

                    if (tinymce.inArray(config.filetypes, type) == -1) {
                        ed.windowManager.alert(ed.getLang('upload.file_extension_error', 'File type not supported'));
                        return false;
                    }

                    if (file.size) {
                        var max = parseInt(config.max_size) || 1024;

                        if (file.size > max * 1024) {
                            ed.windowManager.alert(ed.getLang('upload.file_size_error', 'File size exceeds maximum allowed size'));
                            return false;
                        }
                    }
                }

                // dispatch event
                self.FilesAdded.dispatch(file);

                if (!file.marker) {
                    var w = 300, h = 300;

                    ed.execCommand('mceInsertContent', false, '<img id="__mce_tmp" class="mceItemUpload" />', {
                        skip_undo: 1
                    });
                    // get approximate size of image from file size
                    if (/image\/(gif|png|jpeg|jpg)/.test(file.type)) {
                        w = h = Math.round(Math.sqrt(file.size));
                        // set minimum value of 100
                        w = Math.max(100, w);
                        h = Math.max(100, h);
                    }

                    var n = ed.dom.get('__mce_tmp');

                    ed.dom.setAttrib(n, 'id', '');
                    n.style.width = w + "px";
                    n.style.height = h + "px";

                    file.marker = n;
                }

                ed.undoManager.add();

                // add files to queue
                self.files.push(file);

                return true;
            } else {
                ed.windowManager.alert(ed.getLang('upload.file_extension_error', 'File type not supported'));
                return false;
            }

            return false;
        },
        upload: function (file) {
            var self = this, ed = this.editor;

            var args = {
                'action': 'upload',
                'format': 'raw',
                'method': 'dragdrop',
                'component_id': ed.settings.component_id
            };

            args[ed.settings.token] = '1';

            var url = file.upload_url;

            function sendFile(bin) {
                var xhr = new XMLHttpRequest, formData = new FormData();

                // progress
                if (xhr.upload) {
                    xhr.upload.onprogress = function (e) {
                        if (e.lengthComputable) {
                            file.loaded = Math.min(file.size, e.loaded);
                            self.UploadProgress.dispatch(file);
                        }
                    };
                }

                xhr.onreadystatechange = function () {
                    var httpStatus;

                    if (xhr.readyState == 4 && self.state !== state.STOPPED) {
                        // Getting the HTTP status might fail on some Gecko versions
                        try {
                            httpStatus = xhr.status;
                        } catch (ex) {
                            httpStatus = 0;
                        }

                        // Is error status
                        if (httpStatus >= 400) {
                            self.UploadError.dispatch({
                                code: state.HTTP_ERROR,
                                message: ed.getLang('upload.http_error', 'HTTP Error'),
                                file: file,
                                status: httpStatus
                            });
                        } else {
                            file.loaded = file.size;

                            self.UploadProgress.dispatch(file);

                            bin = formData = null; // Free memory

                            file.status = state.DONE;

                            self.FileUploaded.dispatch(file, {
                                response: xhr.responseText,
                                status: httpStatus
                            });
                        }
                    }
                };
                // get name
                var name = file.target_name || file.name;

                // remove some common characters
                name = name.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]/g, '');

                extend(args, {
                    'name': name
                });

                xhr.open("post", url, true);

                // Set custom headers
                each(self.settings.headers, function (value, name) {
                    xhr.setRequestHeader(name, value);
                });

                // Add multipart params
                each(extend(args, self.settings.multipart_params), function (value, name) {
                    formData.append(name, value);
                });

                // Add file and send it
                formData.append(self.settings.file_data_name, bin);
                xhr.send(formData);

                return;


            } // sendFile


            // File upload finished
            if (file.status == state.DONE || file.status == state.FAILED || self.state == state.STOPPED) {
                return;
            }

            // Standard arguments
            extend(args, {
                name: file.target_name || file.name
            });

            // send the file object
            sendFile(file);
        },
        getInfo: function () {
            return {
                longname: 'Drag & Drop and Placeholder Upload',
                author: 'Ryan Demmer',
                authorurl: 'http://www.joomlacontenteditor.net',
                infourl: 'http://www.joomlacontenteditor.net',
                version: '@@version@@'
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('upload', tinymce.plugins.Upload);
})();
