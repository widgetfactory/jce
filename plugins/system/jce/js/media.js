/* global jQuery, Joomla */
(function ($) {

    var counter = 0;

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

    function parseUrl(url) {
        var data = {};

        if (!url) {
            return data;
        }

        url = url.substring(url.indexOf('?') + 1);

        $.each(url.replace(/\+/g, ' ').split('&'), function (i, value) {
            var param = value.split('='), key = decodeURIComponent(param[0]), val;

            if (param.length === 2) {
                val = decodeURIComponent(param[1]);

                if (typeof val === 'string' && val.length) {
                    data[key] = val;
                }
            }
        });

        return data;
    }

    function upload(url, file) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest,
                formData = new FormData();

            // progress
            if (xhr.upload) {
                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) {
                        file.loaded = Math.min(file.size, e.loaded);
                    }
                };
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject();
                    }

                    file = formData = null;
                }
            };

            // get name
            var name = file.target_name || file.name;

            // remove some common characters
            name = name.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g, '');

            var args = {
                'method': 'upload',
                'id': uid(),
                'inline': 1,
                'name': name
            };

            var Joomla = window.Joomla || {};

            if (Joomla.getOptions) {
                var token = Joomla.getOptions('csrf.token') || '';

                if (token) {
                    args[token] = 1;
                }
            }

            xhr.open("post", url, true);

            // set xhr request header
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            // Add multipart params
            $.each(args, function (key, value) {
                formData.append(key, value);
            });

            // Add file and send it
            formData.append('file', file);

            xhr.send(formData);
        });
    }

    function checkMimeType(file, filter) {
        filter = filter.replace(/[^\w_,]/gi, '').toLowerCase();

        var map = {
            'images': 'jpg,jpeg,png,apng,gif,webp',
            'media': 'avi,wmv,wm,asf,asx,wmx,wvx,mov,qt,mpg,mpeg,m4a,m4v,swf,dcr,rm,ra,ram,divx,mp4,ogv,ogg,webm,flv,f4v,mp3,ogg,wav,xap',
            'html': 'html,htm,txt',
            'files': 'doc,docx,dot,dotx,ppt,pps,pptx,ppsx,xls,xlsx,gif,jpeg,jpg,png,webp,apng,pdf,zip,tar,gz,swf,rar,mov,mp4,m4a,flv,mkv,webm,ogg,ogv,qt,wmv,asx,asf,avi,wav,mp3,aiff,oga,odt,odg,odp,ods,odf,rtf,txt,csv,htm,html'
        };

        var mimes = map[filter] || filter;

        return new RegExp('\.(' + mimes.split(',').join('|') + ')$', 'i').test(file.name);
    }

    function getModalURL(elm) {
        // Joomla 3.5.x / 4.x Media Field
        var url = '', $wrapper = $(elm).parents('.field-media-wrapper'), inst = $wrapper.data('fieldMedia') || $wrapper.get(0);

        if (inst) {
            if (inst.options) {
                url = inst.options.url || '';
            } else {
                url = inst.getAttribute('data-url') || inst.getAttribute('url') || '';
            }
        }

        return url || $(elm).siblings('a.modal').attr('href') || '';
    }

    function isAdmin(value) {
        return value && value.indexOf('/administrator/') != -1;
    }

    function getBasePath(elm) {
        // Joomla 3.5.x / 4.x Media Field
        var path = '', $wrapper = $(elm).parents('.field-media-wrapper'), inst = $wrapper.data('fieldMedia') || $wrapper.get(0);

        if (inst) {
            // Joomla 3
            if (inst.options) {
                path = inst.options.basepath || '';
                // Joomla 4
            } else {
                path = inst.basePath || '';
            }
        }

        // get from input for some layout overrides
        path = path || $(elm).data('basepath') || '';

        // resolve path for admin
        if (path && !isAdmin(path) && isAdmin(document.location.href)) {
            path += 'administrator/';
        }

        return path;
    }

    $.fn.WfMediaUpload = function () {
        return this.each(function () {
            // eslint-disable-next-line consistent-this
            var elm = this;

            function insertFile(value) {
                // Joomla 3.5.x / 4.x Media Field
                var $wrapper = $(elm).parents('.field-media-wrapper'), inst = $wrapper.data('fieldMedia') || $wrapper.get(0);

                if (inst && inst.setValue) {
                    inst.setValue(value);
                } else {
                    $(elm).val(value).trigger('change');
                }

                return true;
            }

            function uploadAndInsert(url, file) {
                // not a valid upload
                if (!file.name) {
                    return false;
                }

                var params = parseUrl(url), url = getBasePath(elm) + 'index.php?option=com_jce', validParams = ['task', 'context', 'plugin', 'filter', 'mediatype'];

                var filter = params.filter || params.mediatype || 'images';

                if (!checkMimeType(file, filter)) {
                    alert('The selected file is not supported.');
                    return false;
                }

                // rewrite task
                params.task = 'plugin.rpc';

                // delete some unused stuff
                $.each(params, function (key, value) {
                    if ($.inArray(key, validParams) === -1) {
                        delete params[key];
                    }
                });

                url += '&' + $.param(params);

                // set disabled
                $(elm).prop('disabled', true).addClass('wf-media-upload-busy');

                upload(url, file).then(function (response) {
                    $(elm).prop('disabled', false).removeAttr('disabled').removeClass('wf-media-upload-busy');

                    try {
                        var o = JSON.parse(response), error = 'Unable to upload file';

                        // valid json
                        if ($.isPlainObject(o)) {
                            if (o.error) {
                                error = o.error.message || error;
                            }

                            var r = o.result;

                            if (r) {
                                var files = r.files || [], item = files.length ? files[0] : {};

                                if (item.file) {
                                    return insertFile(item.file);
                                }
                            }
                        }

                        alert(error);

                    } catch (e) {
                        alert('The server returned an invalid JSON response');
                    }
                }, function () {
                    $(elm).prop('disabled', false).removeAttr('disabled').removeClass('wf-media-upload-busy');

                    return false;
                });
            }

            var url = getModalURL(elm);

            if (!url) {
                return false;
            }

            var $uploadBtn = $('<a title="Upload" role="button" class="btn btn-outline-secondary wf-media-upload-button" aria-label="Upload"><i role="presentation" class="icon-upload"></i><input type="file" aria-hidden="true" /></a>');

            $('input[type="file"]', $uploadBtn).on('change', function (e) {
                e.preventDefault();

                if (this.files) {
                    var file = this.files[0];

                    if (file) {
                        uploadAndInsert(url, file);
                    }
                }
            });

            var $selectBtn = $(elm).parent().find('.button-select, .modal.btn');

            $uploadBtn.insertAfter($selectBtn);

            $(elm).on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
            }).on('dragover dragenter', function (e) {
                $(this).addClass('wf-media-upload-hover');
            }).on('dragleave', function (e) {
                $(this).removeClass('wf-media-upload-hover');
            }).on('drop', function (e) {
                var dataTransfer = e.originalEvent.dataTransfer;

                // Add dropped files
                if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                    var file = dataTransfer.files[0];

                    if (file) {
                        uploadAndInsert(url, file);
                    }
                }

                $(this).removeClass('wf-media-upload-hover');
            });
        });
    };

    function createElementMedia(elm, options) {
        // custom media element only  
        if (false == $(elm).is('joomla-field-media, .wf-media-wrapper-custom')) {
            return;
        }

        // only for custom layouts, eg: templatemanager parameters
        if (false == $(elm).hasClass('wf-media-wrapper-custom')) {
            return;
        }

        var modalElement = $('.joomla-modal', elm).get(0);

        if (modalElement && window.bootstrap && window.bootstrap.Modal) {
            Joomla.initialiseModal(modalElement, {
                isJoomla: true
            });

            $('.button-select', elm).on('click', function (e) {
                e.preventDefault();
                modalElement.open();
            });
        }

        $('.button-clear', elm).on('click', function (e) {
            e.preventDefault();
            $('.wf-media-input', elm).val('').trigger('change');
        });

        $('.wf-media-input', elm).on('change', function () {
            var path = Joomla.getOptions('system.paths', {}).root || '';

            var src = '';

            if (isImage(this.value)) {
                src = path + '/' + this.value;
            }

            $('.field-media-preview img', elm).attr('src', src);
        }).trigger('change');
    }

    function updateMediaUrl(row, options, repeatable) {
        $(row).find('.field-media-wrapper').add(row).each(function () {
            // only subform and custom elements
            if ($(this).find('.wf-media-input-upload').length && !repeatable) {
                return true;
            }

            var $inp = $(this).find('.field-media-input'), id = $inp.attr('id');

            if (!id) {
                return true;
            }

            // update field id with index
            id = id.replace('rowX', 'row' + $(row).index());

            createElementMedia(this, options);

            $(this).addClass('wf-media-wrapper');

            // get url from data attribute or custom element attribute
            var dataUrl = $(this).data('url') || $(this).attr('url') || '';

            // legacy modal link btn
            var $linkBtn = $(this).find('a[href*="index.php?option=com_media"].modal.btn');

            if ($linkBtn.length && !dataUrl) {
                dataUrl = $linkBtn.attr('href') || '';
            }

            // parse url parameters
            var params = parseUrl(dataUrl);

            // set mediatype default to "images"
            var mediatype = 'images';

            // set plugin (may contain caller), defaults to browser
            var plugin = params.plugin ? params.plugin : '';

            // process a parameter
            if (params.mediatype) {
                mediatype = params.mediatype;
                // or layout override of url set to files
            } else if (params.view == 'files') {
                mediatype = 'files';
            }

            // create url
            var url = getBasePath($inp) + 'index.php?option=com_jce&task=mediafield.display&plugin=' + plugin + '&fieldid=' + id + '&mediatype=' + mediatype;

            if (options.context) {
                url += '&context=' + options.context;
            }

            // update data url attribute
            if ($(this).data('url')) {
                $(this).data('url', url);
            }

            // update custom element
            if ($(this).is('joomla-field-media, .wf-media-wrapper-custom')) {
                $(this).attr('url', url);

                // create new iframe
                var ifrHtml = Joomla.sanitizeHtml('<iframe src="' + url + '" class="iframe" title="" width="100%" height="100%"></iframe>', { iframe: ['src', 'class', 'title', 'width', 'height'] });

                // update attributes
                $(this).find('.joomla-modal').attr('data-url', url).attr('data-iframe', ifrHtml);
            }

            // update link button
            if ($linkBtn.length) {
                $linkBtn.attr('href', url);
            }
        });
    }

    function cleanInputValue(elm) {
        var val = $(elm).val() || '';

        // clean value first
        if (val.indexOf('#joomlaImage') != -1) {
            val = val.substring(0, val.indexOf('#'));
            $(elm).val(val).attr('value', val);
        }
    }

    function isImage(value) {
        return value && /\.(jpg|jpeg|png|gif|svg|apng|webp)$/.test(value);
    }

    $(document).ready(function ($) {
        var options = Joomla.getOptions('plg_system_jce', {});

        function canProcessField(elm) {
            return options.replace_media || $(elm).find('.wf-media-input').length;
        }

        if (options.replace_media) {
            // process joomla and flexi-content media fields
            $('.field-media-wrapper, .fc-field-value-properties-box').find('.field-media-input').addClass('wf-media-input');
        }

        // remove readonly
        $('.wf-media-input').removeAttr('readonly').parents('.field-media-wrapper').addClass('wf-media-wrapper');

        // update existing repeatable
        $('.wf-media-input').parents('.subform-repeatable-group').each(function (i, row) {
            updateMediaUrl(row, options, true);
        });

        // joomla custom attribute and media field override
        $('joomla-field-media.wf-media-wrapper').each(function () {
            // eslint-disable-next-line consistent-this
            var field = this;

            if (field.inputElement) {
                // clean value before processing
                cleanInputValue(field.inputElement);

                // copy markValid function or noop
                var markValidFunction = field.markValid || function () { };

                // override markValid and treat as a callback to clean the input value
                field.markValid = function () {
                    cleanInputValue(this.inputElement);

                    // markValid (check for label)
                    if (field.querySelector('label[for="' + this.inputElement.id + '"]')) {
                        markValidFunction.apply(this);
                    }
                };

                // prevent validation and update of field value
                field.inputElement.addEventListener('change', function (e) {
                    e.stopImmediatePropagation();

                    // markValid (check for label) and...
                    if (field.querySelector('label[for="' + this.id + '"]')) {
                        markValidFunction.apply(this);
                    }

                    // updatePreview
                    field.updatePreview();

                    // trigger update for t4 builder
                    $(document).trigger('t4:media-selected', { selectedUrl: field.basePath + this.value });

                }, true);
            }

            updateMediaUrl(this, options);
        });

        $('.wf-media-wrapper-custom').each(function () {
            updateMediaUrl(this, options, true);
        });

        // repeatable when created
        $(document).on('subform-row-add', function (evt, row) {
            // get original event from jQuery
            var originalEvent = evt.originalEvent;

            // check for detail object, should contain the row
            if (originalEvent && originalEvent.detail) {
                row = originalEvent.detail.row || row;
            }

            if (canProcessField(row)) {
                $(row).find('.wf-media-input, .field-media-input').removeAttr('readonly').addClass('wf-media-input wf-media-input-active');
                updateMediaUrl(row, options, true);
            }
        });

        // process uploadable inputs
        $('.wf-media-input-upload').not('[name*="media-repeat"]').WfMediaUpload();

        // remove modal heading
        $('.wf-media-wrapper .modal-header h3').html('&nbsp;');
    });
})(jQuery);