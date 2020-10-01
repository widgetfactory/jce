(function ($) {

    var counter = 0;

    var Joomla = window.Joomla || {};

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
        var data = {}, url = url.substring(url.indexOf('?') + 1);

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

                    file = formData = null; // Free memory
                }
            };

            // get name
            var name = file.target_name || file.name;

            // remove some common characters
            name = name.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]/g, '');

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
            'images': 'jpg,jpeg,png,gif,webp',
            'media': 'avi,wmv,wm,asf,asx,wmx,wvx,mov,qt,mpg,mpeg,m4a,m4v,swf,dcr,rm,ra,ram,divx,mp4,ogv,ogg,webm,flv,f4v,mp3,ogg,wav,xap',
            'html': 'html,htm,txt',
            'files': 'doc,docx,dot,dotx,ppt,pps,pptx,ppsx,xls,xlsx,gif,jpeg,jpg,png,webp,apng,pdf,zip,tar,gz,swf,rar,mov,mp4,m4a,flv,mkv,webm,ogg,ogv,qt,wmv,asx,asf,avi,wav,mp3,aiff,oga,odt,odg,odp,ods,odf,rtf,txt,csv,htm,html',
        };

        var mimes = map[filter] || filter;
        var name = file.name.toLowerCase();

        return new RegExp('\.(' + mimes.split(',').join('|') + ')$', 'i').test(file.name);
    }

    $.fn.WfMediaUpload = function () {
        return this.each(function () {
            var elm = this;//document.getElementById(this.id) || this;

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

            function getModalURL() {
                // Joomla 3.5.x / 4.x Media Field
                var url = '', $wrapper = $(elm).parents('.field-media-wrapper'), inst = $wrapper.data('fieldMedia') || $wrapper.get(0);

                if (inst) {
                    if (inst.options) {
                        url = inst.options.url || '';
                    } else {
                        url = inst.url || $(inst).data('url') || '';
                    }
                }

                return url || $(elm).siblings('a.modal').attr('href') || '';
            }

            function uploadAndInsert(url, file) {
                // not a valid upload
                if (!file.name) {
                    return false;
                }

                var params = parseUrl(url), url = 'index.php?option=com_jce', validParams = ['task', 'context', 'plugin', 'filter', 'mediatype'];

                var filter = params.filter || params.mediatype || 'images'

                if (!checkMimeType(file, filter)) {
                    alert('The selected file is not supported.');
                    return false;
                }

                // delete some unused stuff
                $.each(params, function (key, value) {
                    if (key === 'task') {
                        value = 'plugin.rpc';
                    }

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

            var $uploadBtn = $('<a title="Upload" class="btn wf-media-upload-button" role="button" aria-label="Upload"><i role="presentation" class="icon-upload"></i><input type="file" aria-hidden="true" /></a>');

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
                $(this).addClass('wf-media-upload-hover')
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
            });
        });
    };

    $(document).ready(function ($) {
        $('.wf-media-input').removeAttr('readonly');

        $(document).on('subform-row-add', function (event, row) {
            $(row).find('.wf-media-input').removeAttr('readonly');
        });

        $('.wf-media-input-upload').WfMediaUpload();

        // remove modal heading
        $('.field-media-wrapper .modal-header h3').html('&nbsp;');
    });
})(jQuery);