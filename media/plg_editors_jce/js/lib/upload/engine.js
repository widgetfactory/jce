/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global jQuery */

(function ($, window, undef) {

    var counter = 0;

    var mime = {
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "tif": "image/tiff",
        "tiff": "image/tiff",
        "webp": "image/webp"
    };

    /**
     Generates an unique ID.
     @method uid
     @return {String} Virtually unique id.
     */
    function uid() {
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    // cancel Events
    function cancel(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }

    function Transport(options) {
        this.options = $.extend({
            callback: $.noop,
            headers: {},
            multipart: {},
            data_name: 'file'
        }, options);
    }

    Transport.prototype = {
        upload: function (file) {
            // store current file
            this.file = file;

            this.transport = new XMLHttpRequest;
            // upload using xhr2
            this.xhr();
        },
        error: function (status, text) {
            var callback = this.options.callback;

            var error = {
                message: text || 'The server returned an invalid JSON response.',
                file: this.file,
                code: status || 500
            };

            callback('error', error);
        },
        response: function (data) {
            var callback = this.options.callback;

            if (data) {
                var r;
                // parse JSON data if valid
                try {
                    r = $.parseJSON(data);
                } catch (e) {
                    // malformed JSON
                    if (data.indexOf('{') !== -1) {
                        data = 'The server returned an invalid JSON response.';
                    }

                    this.error(500, data);

                    return false;
                }

                if (r.error) {
                    // return error
                    this.error(r.error.code, r.error.message);

                    return false;
                }

                // pass file element to response
                r.file = this.file;

                callback('uploadcomplete', r);

                // clear file
                this.file = null;
            } else {
                this.error();
            }
        },
        xhr: function () {
            var self = this,
                xhr = this.transport,
                o = this.options,
                callback = o.callback,
                formData = new FormData();

            // get file object
            var file = this.file;

            // progress
            if (xhr.upload) {
                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) {
                        file.loaded = Math.min(file.size, e.loaded);
                        callback('progress', file);
                    }
                };
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // success
                    if (xhr.status === 200) {
                        file.loaded = file.size;
                        // fire progress event
                        callback('progress', file);

                        formData = null; // Free memory

                        // pass to repsonse function
                        self.response(xhr.responseText);
                        // send error with xhr status
                    } else {
                        self.error(xhr.status);
                    }
                    // reset
                    xhr.onreadystatechange = $.noop;
                    xhr = null;
                }
            };

            xhr.open("post", o.url, true);

            // Set custom headers
            $.each(o.headers, function (name, value) {
                xhr.setRequestHeader(name, value);
            });

            // set xhr request header
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            // Add multipart params
            $.each(o.multipart, function (name, value) {
                if ($.type(value) === "object") {
                    formData.append(value.name, value.value);
                } else {
                    formData.append(name, value);
                }
            });

            // add file specific data
            if (file.data) {
                $.each(file.data, function (name, value) {
                    if ($.type(value) === "object") {
                        formData.append(value.name, value.value);
                    } else {
                        formData.append(name, value);
                    }
                });
            }

            // add method
            formData.append('method', 'upload');

            // add json-rpc id
            formData.append('id', uid());

            // Add file and send it
            formData.append(o.data_name, file);
            xhr.send(formData);

            return;
        },
        cleanup: function () {
            var file = this.file;

            if (file && file.input) {
                // remove form
                $(file.input).parent('form[target="wf_upload_iframe"]').remove();
            }

            return false;
        },

        abort: function () {
            this.transport.abort();

            this.transport.onreadystatechange = $.noop;
            this.transport = null;
            this.cleanup();
        }
    };

    /**
     * Uploader
     * @param {object} options
     * @returns {Uploader}
     */
    function Uploader(options) {
        var self = this;
        self.events = [];

        this.options = $.extend({
            container: 'body',
            multiple: true,
            input_name: 'file',
            drop_target: null,
            upload_button: null,
            filetypes: "*",
            max_size: 1024,
            data: {}
        }, options);

        this.files = [];
        var accept = [];

        if (this.options.filetypes.length > 1) {
            accept = $.map(this.options.filetypes.split(','), function (val) {
                return '.' + val;
            });
        }

        // create element
        this.input = $('<input type="file" accept="' + accept.join(',') + '" />');

        // style and mark with a class
        $(this.input).addClass('wf-uploader-element');

        // add multiple option
        $(this.input).prop('multiple', this.options.multiple);

        return this;
    }

    /**
     * Upload prototype
     */
    Uploader.prototype = {
        _events: [],
        /**
         * Upload queue
         */
        files: [],
        /**
         * Add Upload Event
         * @param {string} ev Event name
         * @param {function} fct Event callback
         * @returns {void}
         */
        on: function (event, fn) {
            $(document).on('upload:' + event, fn);

            this._events.push(event);

            return this;
        },
        /**
         * Fire an Upload Event
         * @param {string} ev Event name
         * @returns {void}
         */
        fire: function (event) {
            $(document).trigger('upload:' + event, Array.prototype.slice.call(arguments, 1));

            return this;
        },
        /**
         * Initialize Uploader
         * @returns {void}
         */
        init: function () {
            // create empty files array
            var self = this,
                o = this.options;

            // if a drop target is specified, add drop events
            if (o.drop_target) {

                // Block browser default dragover dragenter, but fire event
                $(o.drop_target).on('dragover', function (e) {
                    var dataTransfer = e.originalEvent.dataTransfer;

                    self.fire('dragover');

                    dataTransfer.dropEffect = 'copy';

                    cancel(e);
                });

                // fire off other drag events
                $(o.drop_target).on('dragstart dragenter dragleave dragend', function (e) {
                    self.fire(e.type);

                    cancel(e);
                });

                // Attach drop handler and grab files
                $(o.drop_target).on('drop', function (e) {
                    var dataTransfer = e.originalEvent.dataTransfer;

                    self.fire('drop');

                    // Add dropped files
                    if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                        $.each(dataTransfer.files, function (i, file) {
                            self.addFile(file);
                        });
                        cancel(e);
                    }

                    // if no upload button is set, begin upload
                    if (!o.upload_button && self.files.length) {
                        self.start();
                    }

                    cancel(e);
                });
            }

            // if there browse button, create file input element
            if (o.browse_button) {
                var btn = o.browse_button;
                // add button class and wrap in a div
                $(btn).addClass('wf-uploader-button').wrap('<div class="wf-uploader-container"></div>');

                // add change event to input
                $(this.input).on('change', function () {
                    if (this.files) {
                        $.each(this.files, function (i, file) {
                            self.addFile(file);
                        });
                    } else {
                        var name = this.value.replace(/\\/g, '/').replace(/\/(.+)$/, '$1');
                        // add file with name and element
                        self.addFile({ name: name, input: this });

                        // clone input and append
                        $(this).hide().clone(true).insertAfter(this).show();
                    }

                    // if no upload button is set, begin upload
                    if (!o.upload_button && self.files.length) {
                        self.start();
                    }
                });

                // clone "master" element and append to button
                $(this.input).clone(true).insertAfter(btn);
            }

            self.fire('init');

            return this;
        },
        /**
         * Add a file to the Upload queue
         * @param {object} file
         * @returns {void}
         */
        addFile: function (file) {
            if (file && file.name) {                
                // shortcut for file.name
                var name = file.name;
                // get file extension from name
                var ext = name.substring(name.length, name.lastIndexOf('.') + 1);

                // check for extension in file name, eg. image.php.jpg
                if (/\.(php|php(3|4|5)|phtml|pl|py|jsp|asp|htm|html|shtml|sh|cgi)\./i.test(file.name)) {
                    this.fire('error', { "code": 800, "message": 'FILE_INVALID_ERROR', "file": file });
                    return false;
                }

                // Check file type. This is not a secutity check, but more for convenience
                if (this.options.filetypes !== "*") {
                    // regular expression to test file type
                    var rx = new RegExp('^(' + this.options.filetypes.split(',').join('|') + ')$', 'i');

                    // check against allowed types
                    if (rx.test(ext) === false) {
                        this.fire('error', { "code": 601, "message": 'FILE_EXTENSION_ERROR', "file": file });
                        return false;
                    }
                }

                // check file size
                if (file.size && parseInt(file.size, 10) > parseInt(this.options.max_size, 10) * 1024) {
                    this.fire('error', { "code": 600, "message": 'FILE_SIZE_ERROR', "file": file });
                    return false;
                }

                // set unique id
                file.id = uid();

                // set extension
                file.extension = ext;

                // set file type
                file.mimetype = file.type || (/(jpg|jpeg|bmp|tiff|tif|gif|png|webp)/.test(ext) ? mime[ext] : 'text/plain');

                // clean file path
                name = name.replace(/\\/g, '/').replace(/\/+/g, '/');

                // add filename
                file.filename = name.split('/').pop();

                // dispatch event (allow file to be renamed and updated)
                this.fire('fileadded', file);

                if (this.fileExists(file)) {
                    this.fire('error', { "code": 700, "message": 'FILE_EXISTS_ERROR', "file": file });
                    return false;
                }

                // add files to queue
                this.files.push(file);
            }
        },
        removeFile: function (file) {
            // dispatch event
            this.fire('fileremoved', file);

            var i = this.getFileIndex(file);

            if (i !== -1) {
                // remove from list
                this.files.splice(i, 1);
            }

            return this;
        },
        getFileIndex: function (file) {
            var i, files = this.files,
                len = files.length;

            for (i = 0; i < len; i++) {
                if (files[i] && files[i].id === file.id) {
                    return i;
                }
            }

            return -1;
        },
        fileExists: function (file) {
            var i, files = this.files,
                len = files.length;

            for (i = 0; i < len; i++) {
                if (files[i] && files[i].filename === file.filename) {
                    return true;
                }
            }

            return false;
        },
        updateFile: function (file, property) {
            var self = this,
                i = this.getFileIndex(file);

            if (i !== -1) {
                $.each(property, function (name, value) {
                    if (/^(size|type|element)$/.test(name) === false) {
                        self.files[i][name] = value;
                    }
                });
            }

            return this;
        },
        renameFile: function (file, name) {
            return this.updateFile(file, { 'filename': name });
        },

        upload: function (file, success, error) {
            var self = this,
                o = this.options,
                data;

            if ($.type(o.data) === "object") {
                data = $.extend({ "name": file.filename || "" }, o.data);
            }

            if ($.type(o.data) === "array") {
                data = $.merge([{ "name": "name", "value": file.filename || "" }], o.data);
            }

            // create upload arguments
            var args = {
                url: o.url,
                data_name: o.input_name,
                multipart: data,
                callback: function (ev, args) {
                    // fire event
                    self.fire(ev, args);

                    // adjust queue
                    if (ev === "uploadcomplete" || ev === "error") {
                        // destroy transport
                        self.transport = null;

                        // fire complete event
                        if (ev === "uploadcomplete") {
                            success(args);
                        } else {
                            error(args);
                        }
                    }
                }
            };

            this.transport = new Transport(args);
            this.transport.upload(file);

            return this;
        },

        uploadFilesInBlocks: function (files, blockSize) {
            var self = this;

            function uploadFile(file) {
                return new Promise((resolve, reject) => {
                    self.fire('uploadstart', file);

                    self.upload(file, function successCallback(response) {
                        resolve(response);

                        self.removeFile(file);
                    }, function errorCallback(error) {
                        reject(error);
                    });
                });
            }

            function uploadNextBlock() {
                // If there are no files left, return to stop the process
                if (files.length === 0) {
                    self.fire("allcomplete");
                    return;
                }

                // Calculate the current block size
                var currentBlockSize = Math.min(blockSize, files.length);

                // Get the current block of files
                var block = files.slice(0, currentBlockSize);// Always take from the start of the array
                var uploadPromises = block.map(uploadFile);

                Promise.all(uploadPromises).then(() => {
                    // Recursively call to upload the next block
                    setTimeout(uploadNextBlock, 500);
                    // eslint-disable-next-line dot-notation
                }).catch((error) => {
                    console.error('An error occurred while uploading:', error);
                });
            }

            // Start uploading the first block
            uploadNextBlock();
        },
 
        start: function () {
            // Upload files in blocks of 5
            this.uploadFilesInBlocks(this.files, 5);

            return this;
        },
        clear: function () {
            this.files = [];

            // clear input and remove all siblings
            $(this.element).val("").siblings('.wf-uploader-element').remove();

            return this;
        },
        stop: function () {
            if (this.transport) {
                this.transport.abort();

                this.fire('abort');
            }

            return this;
        },
        destroy: function () {
            if (this.transport) {
                this.transport.cleanup();

                this.transport = null;
            }

            this.clear();

            this.fire('destroy');

            // unbind all events
            $.each(this._events, function (i, ev) {
                $(document).off('upload:' + ev);
            });

            return this;
        }
    };

    window.Uploader = Uploader;
})(jQuery, window);