/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global plupload:true */

(function($, Wf) {

    function mapIcon(ext) {
        if (/^(flv|mp4|m4v|webm|ogg|ogv|mov|wmv|avi|mvk|webm)$/.test(ext)) {
            return 'video';
        }

        if (/^(mp3|ogg|oga)$/.test(ext)) {
            return 'audio';
        }

        if (/^(jpg|jpeg|png|gif|png|svg|bmp|tiff|webp)$/.test(ext)) {
            return 'image';
        }

        if (/^(txt|htm|html)$/.test(ext)) {
            return 'text';
        }

        if (/^(doc|docx|dot|dotx)$/.test(ext)) {
            return 'word';
        }

        if (/^(xls|xlsx)$/.test(ext)) {
            return 'excel';
        }

        if (/^(ppt|pptx)$/.test(ext)) {
            return 'powerpoint';
        }

        if (/^(rar|zip|tar|gz)$/.test(ext)) {
            return 'zip';
        }

        if (/^(html|htm)$/.test(ext)) {
            return 'code';
        }

        if (/^(txt|rtf|csv)$/.test(ext)) {
            return 'text';
        }

        return ext;
    }

    function UploadWidget(element, options) {
        this.element = element || $('<div />');

        // uplaoder object
        this.uploader = {};
        // error count
        this.errors = 0;
        // uploading flag
        this.uploading = false;

        this.options = $.extend({
            field: $('input[name=file]:first'),
            max_size: false,
            limit: 0,
            filetypes: "*",
            insert: true,
            buttons: {},
            websafe_mode: 'utf-8',
            browse_button: '#upload-browse',
            upload_button: '#upload-start',
            drop_target: '#upload-body',
        }, options);

        this.init();
    }

    UploadWidget.prototype = {

        FILE_SIZE_ERROR: 600,
        FILE_EXTENSION_ERROR: 601,
        FILE_EXISTS_ERROR: 700,
        FILE_INVALID_ERROR: 800,

        /**
         * Shortcut function for event triggering
         * @param {string} ev Event name
         * @param {Mixed} args Arguments
         * @returns {void}
         */
        _trigger: function(ev, args) {
            $(this.element).trigger('uploadwidget:' + ev.toLowerCase(), args);
        },
        init: function() {
            var self = this;

            // clear old uploader
            if (this.uploader instanceof Uploader) {
                this.uploader.destroy();
            }

            $(this.options.field).remove();

            this._createUploader();
        },
        _createUploader: function() {
            var self = this;

            if (!$.support.xhr2) {
                $(this.element).addClass('wf-uploader-html4');
            }

            this.uploader = new Uploader(this.options);

            // on Uploader init
            this.uploader.on('init', function() {
                self._createDragDrop();
                self._trigger('init');
            });

            // on add file
            this.uploader.on('fileadded', function(e, file) {
                self._createQueue(file);
                self._trigger('fileadded', file);
            });

            // on upload file
            this.uploader.on('uploadstart', function(e, file) {
                self._onStart(file);
            });

            this.uploader.on('allcomplete', function() {
                self._onAllComplete();
            });

            this.uploader.on('uploadcomplete', function(e, o) {
                self._onComplete(o);
            });

            this.uploader.on('dragover', function(e, o) {
                $(self.options.drop_target).addClass('wf-upload-dragover');
            });

            this.uploader.on('dragleave', function(e, o) {
                $(self.options.drop_target).removeClass('wf-upload-dragover');
            });

            this.uploader.on('drop', function(e, o) {
                $(self.options.drop_target).removeClass('wf-upload-dragover');
            });

            this.uploader.on('close', function(e, o) {
                self.close();
            });

            /**
             * Handle Error
             */
            this.uploader.on('error', function(up, error) {
                var file = error.file;

                if (typeof error === "string") {
                    error = { "message": error, "code": 500 };
                }

                if (file) {
                    if (error.code < 600) {
                        $(file.element).removeClass('queue-item-loading').addClass('queue-item-error');
                    } else {
                        $(file.element).remove();
                    }

                    self._showError(error, file);
                }

                self.errors++;
            });

            this.uploader.on('fileremoved', function(file) {});

            this.uploader.on("progress", function(o, file) {
                self._onProgress(file);
            });

            this.uploader.init();
        },

        _showError: function(error, file) {
            var self = this;

            error = $.extend({ "message": "", "code": 500 }, error);

            if ($.type(error.message) === "array") {
                error.message = error.message.join("\n");
            }

            // create language key from message
            var msg = error.message.replace(/[^a-z_ ]/gi, '').replace(/\s+/g, '_').toLowerCase();

            // get code as string
            var code = error.code.toString();

            // get details
            var details = ''//Wf.translate('error_' + code.replace(/[\D]/g, ''), "");
            var message = Wf.translate(msg, error.message);

            // clean up message a bit
            message = message.replace(/<br[\s\/]+?>/gi, '');

            // process variable
            message = message.replace('%s', file.name);

            if (error.details) {
                details = '<br />' + error.details;
            } else {
                switch (error.code) {
                    case self.FILE_EXTENSION_ERROR:
                    case self.FILE_INVALID_ERROR:
                    case self.FILE_EXISTS_ERROR:
                        details = details.replace('%s', file.name);
                        break;

                    case self.FILE_SIZE_ERROR:
                        details = details.replace(/%([fsm])/g, function($0, $1) {
                            switch ($1) {
                                case 'f':
                                    return file.name;
                                case 's':
                                    return Wf.String.formatSize(file.size);
                                case 'm':
                                    return Wf.String.formatSize(self.options.max_size * 1024);
                            }
                        });

                        break;
                }

                if (details) {
                    message += '<br />' + details;
                }
            }

            if (error.code < 600) {
                $('.uk-progress', file.element).hide();
                $('<div class="uk-alert uk-alert-danger uk-width-1-1 uk-text-center" />').html(message).appendTo(file.element);
            } else {
                Wf.Modal.alert(message);
                this.errors--;
            }
        },

        _onStart: function(file) {
            this._trigger('uploadstart', file);
            $(file.element).addClass('queue-item-loading').find('input[type="text"]').prop('disabled', true);
        },
        _isError: function(err) {
            if (err) {
                if ($.isArray(err)) {
                    return err.length;
                }

                return true;
            }

            return false;
        },
        _onComplete: function(o) {
            var self = this,
                file = o.file;

            // add success class
            $(file.element).removeClass('queue-item-loading').addClass('queue-item-complete');

            var item = {
                name: file.name
            };

            if (o.result.files && o.result.files.length) {
                var obj = o.result.files[0] || {};
                $.extend(item, obj.file || obj);
            }

            // trigger callback
            this._trigger('filecomplete', [file, item]);
        },
        _onAllComplete: function() {
            this.uploading = false;
            this._trigger('uploadcomplete', this.getErrorCount());
        },
        _setProgress: function(el, percent) {
            $('.uk-progress-bar', el).css('width', percent + '%').attr('aria-valuenow', percent + '%').text(percent + '%');
        },
        _onProgress: function(file) {
            if (!file.size) {
                return;
            }

            var percent = Math.floor(file.loaded / file.size * 100);

            if (file.size === file.loaded) {
                percent = 100;
            }

            this._setProgress(file.element, percent);
        },
        upload: function(args) {
            // Only if there are files to upload
            var files = this.uploader.files;

            if (files.length) {
                this.uploading = true;

                // set multipart params
                this.uploader.options.data = args || {};

                // start upload
                this.uploader.start();
            }
            return false;
        },
        refresh: function() {},
        close: function() {
            if (this.uploader instanceof Uploader) {
                if (this.uploading) {
                    this.uploader.stop();
                }

                this.uploader.destroy();
            }

            this.errors = 0;
            this.uploader = {};
            this.uploading = false;
        },
        getErrorCount: function() {
            return this.errors;
        },
        isUploading: function() {
            return this.uploading;
        },
        stop: function() {
            this.uploader.stop();
        },
        start: function() {
            this.uploader.start();
        },
        setStatus: function(s) {
            var file = this.currentFile;

            if (file) {
                $(file.element).removeClass('queue-item-loading queue-item-complete queue-item-error').addClass(s.state || '');

                if (s.state && s.state === 'error') {
                    this.errors++;

                    if (s.message) {
                        $('.uk-progress', file.element).hide();
                        $('<div class="uk-alert uk-alert-danger uk-width-1-1 uk-text-center" />').html(s.message).appendTo(file.element);
                    }
                }
            }
        },
        _createDragDrop: function() {
            var self = this;
            
            // remove existing drag placeholder
            $('#upload-queue-drag').remove();

            // empty queue
            $('#upload-queue').empty();

            var msg = Wf.translate('upload_drop_details', '%filetypes files up to %max_size in size');

            msg = msg.replace(/%([\w]+)/g, function(match, key) {
                var value = self.options[key] || '';

                if (key === 'filetypes') {
                    value = '<span class="uk-text-truncate uk-display-block">' + value + '</span>';
                }

                if (key === 'max_size') {
                    value = '<strong>' + Wf.String.formatSize(value * 1024) + '</strong>';
                }

                return value;
            });

            $('<div id="upload-queue-drag" class="uk-flex uk-flex-center uk-flex-column uk-flex-middle uk-text-large uk-height-1-1 uk-text-large uk-comment">' +
            '   <div class="uk-comment-header uk-flex">' +
            '       <i class="uk-icon-cloud-upload uk-icon-medium uk-margin-right uk-text-muted uk-comment-avatar"></i><h4 class="uk-comment-title">' + Wf.translate('upload_drop', 'Drop files here') + '</h4>' + 
            '   </div>' +
            '   <p class="uk-margin-small uk-comment-meta uk-width-1-2 uk-text-center">' + msg + '</p>' +
            '</div>').appendTo('#upload-queue-block').show()
        },
        /**
         * Rename a file in the uploader files list
         * @param {Object} file File object
         * @param {String} name New name
         */
        _renameFile: function(file, name) {
            this.uploader.renameFile(file, name);
            this._trigger('filerename', file);
        },
        /**
         * Remove all files
         * @private
         */
        _removeFiles: function() {
            this.uploader.splice();

            // reset errors
            this.errors = 0;

            // insert empty list element
            $(this.element).empty();
        },
        /**
         * Check if a file is in the queue already
         * @param file
         * @returns {Boolean}
         * @private
         */
        _fileExists: function(file) {
            return this.uploader.fileExists(file);
        },
        /**
         * Remove a file from the queue
         * @param {String} file File to remove
         */
        _removeFile: function(file) {
            this._trigger('filedelete', file);

            if ($(file.element).hasClass('queue-item-error')) {
                this.errors--;
            }

            $(file.element).remove();

            this.uploader.removeFile(file);
        },
        _createQueue: function(file) {
            var self = this;

            // get the file title from the file name (without any path)
            var name = Wf.String.basename(file.filename);

            // sanitize name
            name = Wf.String.safe(name, self.options.websafe_mode, self.options.websafe_spaces);

            // set updated file name
            file.filename = name;

            // remove extension
            var title = Wf.String.stripExt(name);

            // create file list element
            file.element = document.createElement('div');

            // status / delete
            var remove = $('<button class="uk-button uk-button-link" />').attr({
                'title': Wf.translate('delete', 'Delete')
            }).addClass('queue-item-action').click(function(e) {
                e.preventDefault();

                if (self.uploading) {
                    return self._stop(file);
                }

                return self._removeFile(file);
            }).append('<i class="uk-icon uk-icon-trash" />');

            // extension
            var ext = file.extension.toLowerCase();
            // input
            var input = $('<i class="uk-icon uk-icon-file-' + mapIcon(ext) + '" /><input type="text" value="' + title + '" class="uk-width-1-1" /><span class="queue-item-extension uk-text-muted uk-icon-none">.' + file.extension + '</span>');
            var name = $('<div class="queue-item-name uk-width-3-4 uk-width-small-4-5 uk-form-icon uk-form-icon-both" />').append(input);

            var buttons = [remove];

            // add optional buttons
            $.each(self.options.buttons, function(name, props) {
                var btn = $('<button class="uk-button uk-button-link" title="' + props.title || name + '" />').addClass(props['class']).click(function(e) {
                    if ($(this).hasClass('disabled')) {
                        e.preventDefault();
                        return;
                    }

                    var fn = props.click || $.noop;
                    fn.call(self, this);

                    e.preventDefault();
                });

                buttons.push(btn);
            });

            // size
            var size = $('<div class="queue-item-size uk-flex-item-auto uk-text-center uk-hidden-mini" title="' + Wf.String.formatSize(file.size) + '" role="presentation" />').html(Wf.String.formatSize(file.size));

            // create actions container
            var actions = $('<div class="queue-item-actions uk-flex uk-width-1-4 uk-width-small-1-5 uk-text-right" />').appendTo(file.element).append(size).append(buttons);
            var progress = $('<div class="uk-progress uk-width-1-1"><div class="uk-progress-bar"></div></div>');

            $(file.element).addClass('queue-item uk-width-1-1 uk-flex uk-flex-wrap').appendTo($(self.element)).append([name, actions, progress]);

            $('input[type="text"]', file.element).on('change keyup', function(e) {
                var v = this.value;
                // make web safe
                v = Wf.String.safe(this.value, self.options.websafe_mode, self.options.websafe_spaces);

                // toggle class if name is not safe
                $(this).toggleClass('uk-form-danger', v !== this.value);

                // update upload element
                if (e.type === "change") {
                    self._renameFile(file, v + '.' + file.extension);
                }
            }).change();

            self._trigger('fileSelect', file);
        },
        _stop: function(file) {
            this.uploader.stop();

            $(file.element).removeClass('queue-item-loading');
        }
    };

    // jQuery hook
    $.fn.uploader = function(options) {
        var self = this,
            inst = new UploadWidget(this, options);

        $(this).on('uploadwidget:upload', function(e, data) {
            if (inst.isUploading()) {
                cancel(e);

                return false;
            }

            inst.upload(data);
        });

        $(this).on('uploadwidget:close', function() {
            inst.close();
        });

        return this;
    };
})(jQuery, Wf);