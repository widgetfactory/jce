/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {
    var each = tinymce.each, BlobCache = tinymce.file.BlobCache, Conversions = tinymce.file.Conversions, Uuid = tinymce.util.Uuid, DOM = tinymce.DOM;

    var count = 0;

    var uniqueId = function (prefix) {
        return (prefix || 'blobid') + (count++);
    };

    function isSupportedImage(value) {
        return /\.(jpg|jpeg|png|gif|webp|avif)$/.test(value);
    }

    function getImageExtension(value) {
        if (isSupportedImage(value)) {
            return value.substring(value.length, value.lastIndexOf('.') + 1);
        }

        return '';
    }

    function uploadHandler(settings, blobInfo, success, failure, progress) {
        var xhr, formData;

        xhr = new XMLHttpRequest();
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

            json = JSON.parse(xhr.responseText);

            if (!json || json.error) {
                failure(json.error.message || 'Invalid JSON response!');
                return;
            }

            if (!json.result || !json.result.files) {
                failure(json.error.message || 'Invalid JSON response!');
                return;
            }

            success(json.result.files[0]);
        };

        formData = new FormData();
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

    function imageToBlobInfo(blobCache, img, resolve, reject) {
        var base64, blobInfo;

        if (img.src.indexOf('blob:') === 0) {
            blobInfo = blobCache.getByUri(img.src);

            if (blobInfo) {
                resolve({
                    image: img,
                    blobInfo: blobInfo
                });
            } else {
                Conversions.uriToBlob(img.src).then(function (blob) {
                    Conversions.blobToDataUri(blob).then(function (dataUri) {
                        base64 = Conversions.parseDataUri(dataUri).data;
                        blobInfo = blobCache.create(uniqueId(), blob, base64);
                        blobCache.add(blobInfo);

                        resolve({
                            image: img,
                            blobInfo: blobInfo
                        });
                    });
                }, function (err) {
                    reject(err);
                });
            }

            return;
        }

        base64 = Conversions.parseDataUri(img.src).data;
        blobInfo = blobCache.findFirst(function (cachedBlobInfo) {
            return cachedBlobInfo.base64() === base64;
        });

        if (blobInfo) {
            resolve({
                image: img,
                blobInfo: blobInfo
            });
        } else {
            Conversions.uriToBlob(img.src).then(function (blob) {
                blobInfo = blobCache.create(uniqueId(), blob, base64);
                blobCache.add(blobInfo);

                resolve({
                    image: img,
                    blobInfo: blobInfo
                });
            }, function (err) {
                reject(err);
            });
        }
    }

    tinymce.PluginManager.add('blobupload', function (ed, url) {
        var uploaders = [];

        ed.onPreInit.add(function () {
            // get list of supported plugins
            each(ed.plugins, function (plg, name) {
                if (tinymce.is(plg.getUploadConfig, 'function')) {

                    var data = plg.getUploadConfig();

                    if (data.inline && data.filetypes) {
                        uploaders.push(plg);
                    }
                }
            });
        });

        function findMarker(marker) {
            var found;

            each(ed.dom.select('img[src]'), function (image) {
                if (image.src == marker.src) {
                    found = image;

                    return false;
                }
            });

            return found;
        }

        function removeMarker(marker) {
            each(ed.dom.select('img[src]'), function (image) {
                if (image.src == marker.src) {
                    ed.dom.remove(image);
                }
            });
        }

        function processImages(images) {
            var cachedPromises = {};

            var promises = tinymce.map(images, function (img) {
                var newPromise;

                if (cachedPromises[img.src]) {
                    // Since the cached promise will return the cached image
                    // We need to wrap it and resolve with the actual image
                    return new Promise(function (resolve) {
                        cachedPromises[img.src].then(function (imageInfo) {
                            if (typeof imageInfo === 'string') { // error apparently
                                return imageInfo;
                            }
                            resolve({
                                image: img,
                                blobInfo: imageInfo.blobInfo
                            });
                        });
                    });
                }

                newPromise = new Promise(function (resolve, reject) {
                    imageToBlobInfo(BlobCache, img, resolve, reject);
                }).then(function (result) {
                    delete cachedPromises[result.image.src];
                    return result;
                })['catch'](function (error) {
                    delete cachedPromises[img.src];
                    return error;
                });

                cachedPromises[img.src] = newPromise;

                return newPromise;
            });

            return Promise.all(promises);
        }

        ed.onInit.add(function () {

            if (!ed.plugins.clipboard) {
                return;
            }

            ed.onPasteBeforeInsert.add(function (ed, o) {
                var node = ed.dom.create('div', 0, o.content), images = tinymce.grep(ed.dom.select('img[src]', node), function (img) {
                    var src = img.getAttribute('src');

                    if (img.hasAttribute('data-mce-bogus')) {
                        return false;
                    }

                    if (img.hasAttribute('data-mce-placeholder')) {
                        return false;
                    }

                    if (img.hasAttribute('data-mce-upload-marker')) {
                        return false;
                    }

                    if (!src || src == 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') {
                        return false;
                    }

                    if (src.indexOf('blob:') === 0) {
                        return true;
                    }

                    if (src.indexOf('data:') === 0) {
                        return true;
                    }

                    return false;
                });

                if (images.length) {
                    var promises = [];

                    processImages(images).then(function (result) {
                        each(result, function (item) {
                            if (typeof item == 'string') {
                                return;
                            }

                            ed.selection.select(findMarker(item.image));
                            ed.selection.scrollIntoView();

                            promises.push(uploadPastedImage(item.image, item.blobInfo));
                        });
                    });

                    Promise.all(promises).then();
                }
            });
        });

        function uploadPastedImage(marker, blobInfo) {
            return new Promise(function (resolve, reject) {
                // no suitable uploaders, remove blob
                if (!uploaders.length) {
                    removeMarker(marker);

                    return resolve();
                }

                var html = '' +
                    '<div class="mceModalRow">' +
                    '   <label for="' + ed.id + '_blob_input">' + ed.getLang('dlg.name', 'Name') + '</label>' +
                    '   <div class="mceModalControl mceModalControlAppend">' +
                    '       <input type="text" id="' + ed.id + '_blob_input" autofocus />' +
                    '       <span role="presentation"></span>' +
                    '   </div>' +
                    '</div>';

                var win = ed.windowManager.open({
                    title: ed.getLang('dlg.name', 'Image Name'),
                    content: html,
                    size: 'mce-modal-landscape-small',
                    buttons: [
                        {
                            title: ed.getLang('cancel', 'Cancel'),
                            id: 'cancel'
                        },
                        {
                            title: ed.getLang('submit', 'Submit'),
                            id: 'submit',
                            onclick: function (e) {
                                var filename = DOM.getValue(ed.id + '_blob_input');

                                if (!filename) {
                                    removeMarker(marker);
                                    return resolve();
                                }

                                // remove some common characters
                                filename = filename.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g, '');

                                var url, uploader;

                                each(uploaders, function (instance) {
                                    if (!url) {
                                        url = instance.getUploadURL({ name: blobInfo.filename() });

                                        if (url) {
                                            uploader = instance;
                                            return false;
                                        }
                                    }
                                });

                                if (!url) {
                                    removeMarker(marker);
                                    return resolve();
                                }

                                var props = {
                                    method: 'upload',
                                    id: Uuid.uuid('wf_'),
                                    inline: 1,
                                    name: filename,
                                    url: url + '&' + ed.settings.query
                                };

                                var images = tinymce.grep(ed.dom.select('img[src^="blob:"]'), function (image) {
                                    return image.src == marker.src;
                                });

                                ed.setProgressState(true);

                                uploadHandler(props, blobInfo, function (data) {

                                    data.marker = images[0];

                                    var elm = uploader.insertUploadedFile(data);

                                    if (elm) {
                                        ed.undoManager.add();
                                        // replace marker with new element
                                        ed.dom.replace(elm, images[0]);
                                    }

                                    ed.setProgressState(false);

                                    win.close();

                                    return resolve();

                                }, function (error) {
                                    ed.windowManager.alert(error);
                                    ed.setProgressState(false);

                                    return resolve();
                                }, function () { });
                            },
                            classes: 'primary'
                        }
                    ],
                    open: function () {
                        DOM.select('input + span', this.elm)[0].innerText = '.' + getImageExtension(blobInfo.filename());

                        window.setTimeout(function () {
                            DOM.get(ed.id + '_blob_input').focus();
                        }, 10);
                    },
                    close: function () {
                        var filename = DOM.getValue(ed.id + '_blob_input');

                        if (!filename) {
                            removeMarker(marker);
                            return resolve();
                        }
                    }
                });
            });
        }
    });
})();