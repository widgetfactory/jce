/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {
    var each = tinymce.each, BlobCache = tinymce.file.BlobCache, Conversions = tinymce.file.Conversions, Uuid = tinymce.util.Uuid, DOM = tinymce.DOM;

    var transparentSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // characters that are not allowed in a file name
    var invalidCharacters = /[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g;

    // executable extensions, including those hidden in the name, eg. image.php.jpg
    var invalidExtensions = /\.(php([0-9]*)|phtml|pl|py|jsp|asp|htm|html|shtml|sh|cgi)\b/i;

    var count = 0;

    function uniqueId(prefix) {
        return (prefix || 'blobid') + (count++);
    }

    function isSupportedImage(value) {
        return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(value);
    }

    function getImageExtension(value) {
        if (isSupportedImage(value)) {
            return value.slice(value.lastIndexOf('.') + 1);
        }

        return '';
    }

    function getResponseError(json) {
        if (json && json.error && json.error.message) {
            return json.error.message;
        }

        return 'Invalid JSON response!';
    }

    function uploadHandler(settings, blobInfo, success, failure, progress) {
        var xhr = new XMLHttpRequest(), formData = new FormData();

        xhr.open('POST', settings.url);

        xhr.upload.onprogress = function (e) {
            progress(e.loaded / e.total * 100);
        };

        xhr.onerror = function () {
            failure("Image upload failed due to a XHR Transport error. Code: " + xhr.status);
        };

        xhr.onload = function () {
            var json;

            if (xhr.status < 200 || xhr.status >= 300) {
                failure("HTTP Error: " + xhr.status);
                return;
            }

            try {
                json = JSON.parse(xhr.responseText);
            } catch (e) {
                json = null;
            }

            if (!json || json.error || !json.result || !json.result.files || !json.result.files.length) {
                failure(getResponseError(json));
                return;
            }

            success(json.result.files[0]);
        };

        formData.append('file', blobInfo.blob(), blobInfo.filename());

        // Add multipart params
        each(settings, function (value, name) {
            if (name == 'url' || name == 'multipart') {
                return true;
            }

            formData.append(name, value);
        });

        xhr.send(formData);
    }

    function createBlobInfo(blob, base64) {
        var blobInfo = BlobCache.create(uniqueId(), blob, base64);
        BlobCache.add(blobInfo);

        return blobInfo;
    }

    function imageToBlobInfo(img) {
        return new Promise(function (resolve, reject) {
            var base64, blobInfo;

            if (img.src.indexOf('blob:') === 0) {
                blobInfo = BlobCache.getByUri(img.src);

                if (blobInfo) {
                    resolve({ image: img, blobInfo: blobInfo });
                    return;
                }

                Conversions.uriToBlob(img.src).then(function (blob) {
                    return Conversions.blobToDataUri(blob).then(function (dataUri) {
                        var data = Conversions.parseDataUri(dataUri).data;

                        resolve({ image: img, blobInfo: createBlobInfo(blob, data) });
                    });
                }, reject);

                return;
            }

            base64 = Conversions.parseDataUri(img.src).data;

            blobInfo = BlobCache.findFirst(function (cachedBlobInfo) {
                return cachedBlobInfo.base64() === base64;
            });

            if (blobInfo) {
                resolve({ image: img, blobInfo: blobInfo });
                return;
            }

            Conversions.uriToBlob(img.src).then(function (blob) {
                resolve({ image: img, blobInfo: createBlobInfo(blob, base64) });
            }, reject);
        });
    }

    /**
     * Convert each image to a blob, re-using the result for images that share a source. Images that
     * cannot be converted resolve as null.
     * @param {Array} images
     * @returns {Promise}
     */
    function processImages(images) {
        var cache = {};

        var promises = tinymce.map(images, function (img) {
            if (!cache[img.src]) {
                cache[img.src] = imageToBlobInfo(img)['catch'](function () {
                    return null;
                });
            }

            // a cached result refers to the first image processed, so resolve with the actual image
            return cache[img.src].then(function (result) {
                if (!result) {
                    return null;
                }

                return { image: img, blobInfo: result.blobInfo };
            });
        });

        return Promise.all(promises);
    }

    function isUploadableImage(img) {
        var src = img.getAttribute('src');

        if (img.hasAttribute('data-mce-bogus') || img.hasAttribute('data-mce-placeholder') || img.hasAttribute('data-mce-upload-marker')) {
            return false;
        }

        if (!src || src == transparentSrc) {
            return false;
        }

        return src.indexOf('blob:') === 0 || src.indexOf('data:') === 0;
    }

    tinymce.PluginManager.add('blobupload', function (ed) {
        var uploaders = [];

        // the source of each pasted image that is waiting to be uploaded
        var pending = {};

        function hasPendingImages() {
            for (var src in pending) {
                return true;
            }

            return false;
        }

        /**
         * Remove images that are waiting to be uploaded from an undo level. The blob or data uri they
         * use is only valid while the editor is open, so an undo must not be able to restore one.
         * @param {String} content
         * @returns {String}
         */
        function removePendingImages(content) {
            if (!hasPendingImages()) {
                return content;
            }

            // match the whole tag, allowing for a ">" inside an attribute value
            return content.replace(/<img(?:[^>"']|"[^"]*"|'[^']*')*>/gi, function (image) {
                var match = /\ssrc="([^"]*)"/i.exec(image);

                return match && pending[match[1]] ? '' : image;
            });
        }

        ed.onPreInit.add(function () {
            // get list of supported plugins
            each(ed.plugins, function (plg) {
                if (tinymce.is(plg.getUploadConfig, 'function')) {
                    var data = plg.getUploadConfig();

                    if (data.inline && data.filetypes) {
                        uploaders.push(plg);
                    }
                }
            });
        });

        // find the images in the editor content that the marker refers to
        function getMarkerImages(marker) {
            return tinymce.grep(ed.dom.select('img[src]'), function (image) {
                return image.src == marker.src;
            });
        }

        function findMarker(marker) {
            return getMarkerImages(marker)[0];
        }

        function removeMarker(marker) {
            each(getMarkerImages(marker), function (image) {
                ed.selection.select(image);
                ed.execCommand('mceRemoveNode');

                var node = ed.selection.getNode();

                // restore bogus break
                if (node.nodeName == 'P' && ed.dom.isEmpty(node)) {
                    ed.dom.add(node, 'br', { 'data-mce-bogus': 1 });
                }
            });
        }

        function getUploader(blobInfo) {
            var found;

            each(uploaders, function (instance) {
                var url = instance.getUploadURL({ name: blobInfo.filename() });

                if (url) {
                    found = { instance: instance, url: url };
                    return false;
                }
            });

            return found;
        }

        function createDialogContent() {
            var html = '' +
                '<div class="mceForm">' +
                '<p>' + ed.getLang('upload.name_description', 'Please supply a name for this file') + '</p>' +
                '<div class="mceModalRow">' +
                '   <label for="' + ed.id + '_blob_input">' + ed.getLang('dlg.name', 'Name') + '</label>' +
                '   <div class="mceModalControl mceModalControlAppend">' +
                '       <input type="text" id="' + ed.id + '_blob_input" autofocus />' +
                '       <select id="' + ed.id + '_blob_mimetype">' +
                '           <option value="jpeg">jpeg</option>' +
                '           <option value="png">png</option>' +
                '       </select>' +
                '   </div>' +
                '</div>' +
                '<div class="mceModalRow">' +
                '   <label for="' + ed.id + '_blob_quality">' + ed.getLang('dlg.quality', 'Quality') + '</label>' +
                '   <div class="mceModalControl">' +
                '       <select id="' + ed.id + '_blob_quality" class="mce-flex-25">';

            each([100, 90, 80, 70, 60, 50, 40, 30, 20, 10], function (value) {
                html += '<option value="' + value + '">' + value + '</option>';
            });

            html += '' +
                '       </select>' +
                '       <span role="presentation">%</span>' +
                '   </div>' +
                '</div>' +
                '</div>';

            return html;
        }

        function showUploadError(message) {
            ed.windowManager.alert({
                text: message,
                title: ed.getLang('upload.error', 'Upload Error')
            });
        }

        // replace the marker with the element created by the uploader
        function replaceMarker(uploader, data) {
            var elm = uploader.insertUploadedFile(data);

            if (!elm || elm.nodeName !== 'IMG') {
                return;
            }

            // the marker is selected so that it is replaced by the inserted content. An undo level
            // must not be added here as it would store the marker and restore it on undo
            ed.selection.select(data.marker);

            elm.setAttribute('data-mce-tmp', '1');

            ed.execCommand('mceInsertContent', false, ed.dom.getOuterHTML(elm));

            each(ed.dom.select('[data-mce-tmp]'), function (node) {
                ed.selection.select(node);
                node.removeAttribute('data-mce-tmp');
            });
        }

        function uploadPastedImage(marker, blobInfo) {
            return new Promise(function (resolve) {
                // no suitable uploaders, remove blob
                if (!uploaders.length) {
                    removeMarker(marker);
                    return resolve();
                }

                function cancel() {
                    removeMarker(marker);
                    resolve();
                }

                function submit() {
                    var filename = DOM.getValue(ed.id + '_blob_input');

                    if (!filename) {
                        return cancel();
                    }

                    // remove some common characters
                    filename = filename.replace(invalidCharacters, '');

                    if (invalidExtensions.test(filename)) {
                        showUploadError(ed.getLang('upload.file_extension_error', 'File type not supported'));
                        return cancel();
                    }

                    var uploader = getUploader(blobInfo);

                    if (!uploader) {
                        return cancel();
                    }

                    var mimetype = DOM.getValue(ed.id + '_blob_mimetype') || getImageExtension(blobInfo.filename()) || 'jpeg';
                    var quality = DOM.getValue(ed.id + '_blob_quality') || 100;

                    var props = {
                        method: 'upload',
                        id: Uuid.uuid('wf_'),
                        inline: 1,
                        name: filename + '.' + mimetype,
                        url: uploader.url + '&' + ed.settings.query,
                        mimetype: 'image/' + mimetype,
                        quality: quality
                    };

                    var image = findMarker(marker);

                    ed.setProgressState(true);

                    uploadHandler(props, blobInfo, function (data) {
                        if (image) {
                            data.marker = image;

                            replaceMarker(uploader.instance, data);

                            ed.dom.remove(image);
                        }

                        ed.setProgressState(false);

                        win.close();

                        return resolve();
                    }, function (error) {
                        showUploadError(error);

                        ed.setProgressState(false);

                        return resolve();
                    }, function () { });
                }

                var win = ed.windowManager.open({
                    title: ed.getLang('dlg.name', 'Name'),
                    content: createDialogContent(),
                    size: 'mce-modal-landscape-small',
                    buttons: [
                        {
                            title: ed.getLang('cancel', 'Cancel'),
                            id: 'cancel'
                        },
                        {
                            title: ed.getLang('submit', 'Submit'),
                            id: 'submit',
                            onclick: submit,
                            classes: 'primary'
                        }
                    ],
                    open: function () {
                        window.setTimeout(function () {
                            DOM.get(ed.id + '_blob_input').focus();
                        }, 10);
                    },
                    close: cancel
                });
            });
        }

        ed.onInit.add(function () {
            // the paste that inserts the image stores it in an undo level, so it is stripped out here
            ed.undoManager.onBeforeAdd.add(function (um, level) {
                level.content = removePendingImages(level.content);
            });

            ed.onPasteBeforeInsert.add(function (ed, o) {
                var node = ed.dom.create('div', 0, o.content);
                var images = tinymce.grep(ed.dom.select('img[src]', node), isUploadableImage);

                if (!images.length) {
                    return;
                }

                // flag the images before they are pasted, so that they are kept out of the undo level
                each(images, function (img) {
                    pending[img.getAttribute('src')] = true;
                });

                processImages(images).then(function (result) {
                    // upload in sequence so that only one dialog is open at a time
                    return result.reduce(function (promise, item, index) {
                        // the image has been uploaded, removed or could not be converted
                        function done() {
                            delete pending[images[index].getAttribute('src')];
                        }

                        return promise.then(function () {
                            if (!item) {
                                return;
                            }

                            var image = findMarker(item.image);

                            if (!image) {
                                return;
                            }

                            ed.selection.select(image);
                            ed.selection.scrollIntoView();

                            return uploadPastedImage(item.image, item.blobInfo);
                        }).then(done, done);
                    }, Promise.resolve());
                });
            });
        });
    });
})();
