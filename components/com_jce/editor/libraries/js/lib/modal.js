(function ($, Wf) {
    function calculateWidth(n, cw, ch) {
        var ww = $(n).width() - 60,
            wh = $(n).height(),
            wh = wh - 101;

        var scale = Math.min(ww / cw, wh / ch);

        cw = Math.min(cw, Math.floor(cw * scale));

        $('.uk-modal-dialog', n).css('max-width', cw + 'px');
    }

    /**
     * Dialog Functions
     */
    Wf.Modal = {
        counter: 0,
        _uid: function (p) {
            return (!p ? 'wf_' : p) + (this.counter++);
        },
        dialog: function (title, data, options) {
            return this.open(title, options, data);
        },
        /**
         * Basic Dialog
         */
        open: function (title, options, data) {
            var div = document.createElement('div'),
                footer;

            options = $.extend({
                container: $('form').first().get(0) || 'body',
                classes: '',
                id: 'dialog_' + this._uid(),
                open: $.noop,
                close: $.noop,
                beforeclose: $.noop,
                buttons: false,
                header: true,
                label: { 'confirm': Wf.translate('yes', 'Yes'), 'cancel': Wf.translate('no', 'No') }
            }, options);

            if (options.onOpen) {
                options.open = options.onOpen;
            }

            if (options.onBeforeClose) {
                options.beforeclose = options.onBeforeClose;
            }

            if (options.onClose) {
                options.close = options.onClose;
            }

            // add classes to div
            $(div).addClass('uk-modal');

            if ($('.uk-modal-overlay').length === 0) {
                $(div).append('<div class="uk-modal-overlay uk-position-cover uk-overlay-background" />');
            }

            // create modal
            var modal = $('<div class="uk-modal-dialog" role="dialog" aria-modal="true" aria-label="' + title + '" />').appendTo(div);

            // add classes to modal
            $(modal).addClass(options.classes);

            if (options.width) {
                $(modal).width(options.width);
            }

            if (options.height) {
                $(modal).height(options.height);
            }

            // add close
            $(modal).append('<button type="button" class="uk-modal-close uk-close" aria-label="' + Wf.translate('close', 'Close') + '"></button>');

            if (options.header) {
                // add header
                $(modal).append('<div class="uk-modal-header"><h3>' + title + '</h3></div>');
            }

            // add body and data
            $('<div class="uk-modal-body uk-overflow-container" id="' + options.id + '" />').appendTo(modal).append(data);

            var tabindex = 1000;

            $(':input').each(function () {
                $(this).attr('tabindex', tabindex);

                tabindex++;
            });

            // add buttons
            if (options.buttons) {
                footer = $('<div class="uk-modal-footer uk-text-right" />');

                $.each(options.buttons, function (i, o) {
                    var btn = $('<button class="uk-button uk-margin-small-left" id="' + options.id + '_button_' + i + '" />').on('click', function (e) {
                        e.preventDefault();

                        if ($.isFunction(o.click)) {
                            o.click.call(this, e);
                        }
                        // cancel submit
                    }).on('submit', function(e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    });

                    $.each(o.attributes, function (k, v) {
                        if (k === "class") {
                            $(btn).addClass(v);
                        } else {
                            $(btn).attr(k, v);
                        }
                    });

                    $(btn).attr('tabindex', tabindex);

                    // add text
                    if (o.text) {
                        $(btn).append('<label class="uk-text" for="' + options.id + '_button_' + i + '">' + o.text + '</label>');
                    }

                    // add icon
                    if (o.icon) {
                        $(btn).prepend('<i class="uk-icon ' + o.icon + '" aria-hidden="true" />&nbsp;');
                    }

                    $(footer).append(btn);

                    tabindex++;
                });
            }

            // add footer
            $(modal).append(footer);

            // bind option events
            $(div).on('modal.open', function (ev) {
                // focus input
                $('button[autofocus], input[autofocus]', div).focus();

                options.open.call(this, ev);
            }).on('modal.close', function (e, ev) {
                options.beforeclose.call(this, ev);

                $(this).off('modal.open modal.close keyup.modal').removeClass('uk-open');

                $('body').off('keyup.modal');

                window.setTimeout(function () {
                    $(div).hide().detach();
                }, 500);

                options.close.call(this, ev);
            });

            // create click handler
            $('.uk-modal-close', div).on('click', function (e) {
                // cancel event
                e.preventDefault();
                // hide
                $(div).trigger('modal.close', e);
            });

            // close on ESC
            $('body').on('keyup.modal', function (e) {
                if (e.keyCode === 27) {
                    // cancel event
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    // close
                    $(div).trigger('modal.close');
                }
            });

            var $navItems = $(':input:enabled', div).filter(function () {
                return this.getAttribute('tabindex') >= 0;
            });

            $(div).on('keydown.modal', function (e) {
                if (e.keyCode === 9 && $navItems.length) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var endIndex = Math.max(0, $navItems.length - 1), idx = $navItems.index(e.target) + 1;

                    if (idx > endIndex) {
                        idx = 0;
                    }

                    $navItems.eq(idx).focus();
                }
            });

            // submit on enter
            $(div).on('keyup.modal', function (e) {
                if (e.keyCode === 13) {
                    // cancel event
                    e.preventDefault();

                    // trigger focused button
                    if ($('button:focus', this).length) {
                        $(this).find('.uk-modal-dialog button:focus').triggerHandler("click");
                    } else {
                        // "click" submit button
                        $(this).find('.uk-modal-dialog button[type="submit"]').triggerHandler("click");
                    }

                    // close
                    if (options.close_on_submit !== false) {
                        $(this).trigger('modal.close');
                    }
                }
            });

            // create modal
            $(div).appendTo(options.container);

            // show modal
            $(div).show().scrollTop(0);

            $(div).addClass('uk-open').trigger('modal.open').attr('aria-hidden', false);

            $(div).on('modal.assetloaded', function () {
                $(modal).css('top', ($(div).height() - $(modal).outerHeight()) / 2);
            }).delay(10).trigger('modal.assetloaded');

            // return modal div element
            return div;
        },

        /**
         * Confirm Dialog
         */
        confirm: function (s, cb, options) {
            var html = '<p>' + s + '</p>';

            options = $.extend(true, {
                'label': {
                    'confirm': Wf.translate('yes', 'Yes'),
                    'cancel': Wf.translate('no', 'No')
                }
            }, options);

            options = $.extend(true, {
                'classes': 'uk-modal-confirm',
                buttons: [
                    {
                        text: options.label.confirm,
                        icon: 'uk-icon-check',
                        click: function (e) {
                            // execute callback
                            cb.call(this, true);
                        },
                        attributes: {
                            "type": "submit",
                            "class": "uk-button-primary uk-modal-close",
                            "autofocus": true
                        }
                    }, {
                        text: options.label.cancel,
                        icon: 'uk-icon-close',
                        click: function (e) {
                            // execute callback
                            cb.call(this, false);
                        },
                        attributes: {
                            "class": "uk-modal-close"
                        }
                    }
                ]
            }, options || {});

            return this.open(Wf.translate('confirm', 'Confirm'), options, html);
        },
        /**
         * Alert Dialog
         */
        alert: function (s, options) {
            var html = '<p>' + s + '</p>';

            options = $.extend({ 'label': { 'confirm': Wf.translate('ok', 'Ok') } }, options);

            options = $.extend({
                'classes': 'uk-modal-alert',
                buttons: [{
                    text: options.label.confirm,
                    attributes: {
                        "type": "submit",
                        "class": "uk-modal-close",
                        "autofocus": true
                    }
                }]
            }, options || {});

            return this.open(Wf.translate('alert', 'Alert'), options, html);
        },
        /**
         * Prompt Dialog
         */
        prompt: function (title, cb, options) {
            var html = '<div class="uk-form-row">';

            options = $.extend(true, {
                'id': 'dialog-prompt',
                'value': '',
                'text': '',
                'multiline': false,
                'elements': '',
                'label': {
                    'confirm': Wf.translate('ok', 'OK'),
                    'cancel': Wf.translate('cancel', 'Cancel')
                }
            }, options);

            if (options.text) {
                html += '<label class="uk-form-label uk-width-3-10" for="' + options.id + '">' + options.text + '</label><div class="uk-form-controls uk-width-7-10 uk-margin-remove">';
            } else {
                html += '<div class="uk-form-controls uk-width-1-1 uk-margin-remove">';
            }

            if (options.multiline) {
                html += '<textarea id="' + options.id + '-input" required>' + options.value + '</textarea>';
            } else {
                html += '<input id="' + options.id + '-input" type="text" value="' + options.value + '" />';
            }

            html += '</div>';
            html += '</div>';

            if (options.elements) {
                html += options.elements;
            }

            options = $.extend(true, {
                'classes': 'uk-modal-prompt',
                buttons: [{
                    attributes: {
                        "type": "submit",
                        "class": "uk-button-primary",
                        "autofocus": true
                    },
                    text: options.label.confirm,
                    icon: 'uk-icon-check',
                    click: function () {
                        var args = [],
                            $inp = $('#' + options.id + '-input'),
                            v = $inp.val();

                        if (v === "") {
                            $inp.focus();

                            return false;
                        }

                        if (options.elements) {
                            $(':input', '#' + options.id).not($inp).each(function () {
                                args.push($(this).val());
                            });
                        }

                        cb.call(this, v, args);

                        if (options.close_on_submit !== false) {
                            $inp.parents('.uk-modal').trigger('modal.close');
                        }
                    }
                }],
                open: function () {
                    var n = document.getElementById(options.id + '-input');

                    if (n) {
                        // set timeout to trigger after transition
                        setTimeout(function () {
                            // focus element
                            n.focus();

                            // fix cursor position in Firefox
                            if (n.nodeName === "INPUT" && n.setSelectionRange && n.value) {
                                n.setSelectionRange(n.value.length, n.value.length);
                            }
                        }, 350);
                    }
                }

            }, options);

            return this.open(title, options, html);
        },
        /**
         * Upload Dialog
         */
        upload: function (options) {
            var div = $('<div />').attr('id', 'upload-body').append(
                '<div id="upload-queue-block" class="uk-placeholder">' +
                '   <div id="upload-queue"></div>' +
                '   <input type="file" size="40" tabindex="-1" />' +
                '</div>' +
                '<div id="upload-options" class="uk-placeholder">' + (options.elements || '') + '</div>'
            );

            // create backup function
            options.upload = options.upload || $.noop;

            options = $.extend({
                'classes': 'uk-modal-dialog-large uk-modal-upload',
                resizable: false,
                buttons: [{
                    text: Wf.translate('browse', 'Add Files'),
                    icon: 'uk-icon-search',
                    attributes: {
                        "id": "upload-browse",
                        "class": "uk-button-success",
                        "autofocus": true
                    }
                }, {
                    text: Wf.translate('upload', 'Upload'),
                    click: function (e) {
                        // cancel event
                        e.preventDefault();
                        // execute callback
                        return options.upload.call();
                    },
                    attributes: {
                        "id": "upload-start",
                        "class": "uk-button-primary"
                    },
                    icon: 'uk-icon-cloud-upload'
                }, {
                    text: Wf.translate('close', 'Close'),
                    icon: 'uk-icon-close',
                    attributes: {
                        "class": "uk-modal-close uk-hidden-small"
                    },
                }]
            }, options);

            return this.open(Wf.translate('upload', 'Upload'), options, div);
        },
        /**
         * IFrame Dialog
         */
        iframe: function (name, url, options) {
            var div = document.createElement('div');

            function calculateWidth(n) {
                var ph = $('.uk-modal-dialog', n).outerHeight(),
                    wh = $(n).height();

                // content width
                var cw = $('.uk-modal-body', n).width();

                // content height
                var ch = $('.uk-modal-body', n).height();

                // calculate height of popup container without content
                var mh = ph - $('.uk-modal-body', n).height();

                // get popup height with content included
                ph = mh + ch;

                cw = Math.min(cw, Math.floor(cw * Math.min(wh / ph, 1)));

                $('.uk-modal-dialog', n).css('max-width', cw - 20 + 'px');
            }

            var w = options.width,
                h = options.height;

            options = $.extend({
                'classes': 'uk-modal-dialog-large uk-modal-preview',
                open: function (e) {
                    var iframe = document.createElement('iframe');

                    $(div).addClass('loading');

                    $(iframe).attr({
                        'src': url,
                        'scrolling': 'auto',
                        'frameborder': 0
                    }).on('load', function () {
                        if ($.isFunction(options.onFrameLoad)) {
                            options.onFrameLoad.call(this);
                        }

                        $(div).removeClass('loading');
                    });

                    $(div).addClass('iframe-preview').append(iframe);

                    calculateWidth(e.target, w, h);
                }

            }, options);

            var name = name || Wf.translate('preview', 'Preview');

            return this.open(name, options, div);
        },
        /**
         * Media Dialog
         */
        media: function (name, url, options) {
            var self = this;
            options = options || {};

            var w, h;
            var div = document.createElement('div');

            $.extend(options, {
                'classes': 'uk-modal-dialog-large uk-modal-preview',
                open: function (e) {
                    // image
                    if (/\.(jpg|jpeg|gif|png|webp)/i.test(url)) {
                        $(div).addClass('image-preview loading');

                        var img = new Image(),
                            loaded = false;

                        img.onload = function () {
                            if (loaded) {
                                return false;
                            }

                            w = img.width, h = img.height;

                            $('.image-preview').removeClass('loading').append('<img src="' + url + '" alt="' + Wf.String.basename(url) + '" />').parent().css('max-width', w + 'px');

                            loaded = true;

                            calculateWidth(e.target, w, h);

                            $('.image-preview').click(function (e) {
                                $(e.target).trigger('modal.close', e);
                            });

                            window.setTimeout(function () {
                                $('.uk-modal').trigger('modal.assetloaded');
                            }, 0);
                        };

                        // add timestamp to bypass cache 
                        if (!/\?/.test(url)) {
                            url += '?' + new Date().getTime();
                        }

                        img.src = url;

                    } else if (/\.pdf$/i.test(url)) {
                        $(div).addClass('media-preview loading');

                        if ($.support.pdf) {
                            $(div).html('<object data="' + url + '" type="application/pdf"></object>').removeClass('big-loader');
                        } else {
                            $(div).html('<iframe src="' + url + '" frameborder="0"></iframe>').removeClass('big-loader');
                        }

                        $('iframe, object', div).on('load', function () {
                            calculateWidth(e.target, w, h);

                            $('.uk-modal').trigger('modal.assetloaded');
                        });
                    } else {
                        $(div).addClass('media-preview loading');

                        var mediaTypes = {
                            // Type, clsid, mime types,
                            // codebase
                            "flash": {
                                classid: "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",
                                type: "application/x-shockwave-flash",
                                codebase: "http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0"
                            },
                            "shockwave": {
                                classid: "clsid:166b1bca-3f9c-11cf-8075-444553540000",
                                type: "application/x-director",
                                codebase: "http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab#version=8,5,1,0"
                            },
                            "windowsmedia": {
                                classid: "clsid:6bf52a52-394a-11d3-b153-00c04f79faa6",
                                type: "application/x-mplayer2",
                                codebase: "http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=5,1,52,701"
                            },
                            "quicktime": {
                                classid: "clsid:02bf25d5-8c17-4b23-bc80-d3488abddc6b",
                                type: "video/quicktime",
                                codebase: "http://www.apple.com/qtactivex/qtplugin.cab#version=6,0,2,0"
                            },
                            "divx": {
                                classid: "clsid:67dabfbf-d0ab-41fa-9c46-cc0f21721616",
                                type: "video/divx",
                                codebase: "http://go.divx.com/plugin/DivXBrowserPlugin.cab"
                            },
                            "realmedia": {
                                classid: "clsid:cfcdaa03-8be4-11cf-b84b-0020afbbccfa",
                                type: "audio/x-pn-realaudio-plugin"
                            },
                            "java": {
                                classid: "clsid:8ad9c840-044e-11d1-b3e9-00805f499d93",
                                type: "application/x-java-applet",
                                codebase: "http://java.sun.com/products/plugin/autodl/jinstall-1_5_0-windows-i586.cab#Version=1,5,0,0"
                            },
                            "silverlight": {
                                classid: "clsid:dfeaf541-f3e1-4c24-acac-99c30715084a",
                                type: "application/x-silverlight-2"
                            },
                            "video": {
                                type: 'video/mp4'
                            },
                            "audio": {
                                type: 'audio/mp3'
                            }
                        };

                        var mimes = {};

                        // Parses the default mime types
                        // string into a mimes lookup
                        // map
                        (function (data) {
                            var items = data.split(/,/),
                                i, y, ext;

                            for (i = 0; i < items.length; i += 2) {
                                ext = items[i + 1].split(/ /);

                                for (y = 0; y < ext.length; y++)
                                    mimes[ext[y]] = items[i];
                            }
                        })("application/x-director,dcr," + "application/x-mplayer2,wmv wma avi," + "video/divx,divx," + "application/x-shockwave-flash,swf swfl," + "audio/mpeg,mpga mpega mp2 mp3," + "audio/ogg,ogg spx oga," + "audio/x-wav,wav," + "video/mpeg,mpeg mpg mpe," + "video/mp4,mp4 m4v," + "video/ogg,ogg ogv," + "video/webm,webm," + "video/quicktime,qt mov," + "video/x-flv,flv," + "video/vnd.rn-realvideo,rv," + "video/3gpp,3gp," + "video/x-matroska,mkv");

                        var ext = Wf.String.getExt(url);
                        ext = ext.toLowerCase();
                        var mt = mimes[ext];
                        var type, props;

                        $.each(
                            mediaTypes,
                            function (k, v) {
                                if (v.type && v.type == mt) {
                                    type = k;
                                    props = v;
                                }
                            });

                        // video types
                        if (/^(mp4|m4v|og(g|v)|webm)$/i.test(ext)) {
                            type = 'video';
                            props = {
                                type: mt
                            };
                        }

                        // audio types
                        if (/^(mp3|oga)$/i.test(ext)) {
                            type = 'audio';
                            props = {
                                type: mt
                            };
                        }

                        // flv
                        if (/^(flv|f4v)$/i.test(ext)) {
                            type = 'flv';
                            props = {};
                        }

                        var swf = Wf.getURI(true) + 'components/com_jce/editor/libraries/mediaplayer/mediaplayer.swf';

                        if (type && props) {
                            switch (type) {
                                case 'audio':
                                case 'video':
                                    var fb, ns = '<p style="margin-left:auto;">' + Wf.translate('media_not_supported', 'Media type not supported by this browser') + '</p>';

                                    var support = {
                                        video: {
                                            'h264': ['mp4', 'm4v'],
                                            'webm': ['webm'],
                                            'ogg': ['ogv', 'ogg']
                                        },
                                        audio: {
                                            'mp3': ['mp3'],
                                            'ogg': ['oga', 'ogg']
                                        }
                                    }
                                    var hasSupport = false;

                                    $.each(support[type], function (k, v) {
                                        if ($.inArray(ext, v) !== -1) {
                                            hasSupport = $.support[type] && $.support[type][k] !== false;
                                        }
                                    });

                                    // HTML5 video
                                    if (hasSupport) {
                                        if (type == 'video') {
                                            $(div).append('<video autoplay="autoplay" controls="controls" preload="none" type="' + props.type + '" src="' + url + '"></video>');
                                        } else {
                                            $(div).addClass('media-preview-audio').append('<audio autoplay="autoplay" controls="controls" preload="none" type="' + props.type + '" src="' + url + '"></audio>');
                                        }
                                    } else if (/^m(p3|p4|4v)$/i.test(ext)) {
                                        url = Wf.URL.toAbsolute(url);

                                        $(div).html('<object type="application/x-shockwave-flash" data="' + swf + '"><param name="movie" value="' + swf + '" /><param name="flashvars" value="controls=true&autoplay=true&src=' + url + '" /></object>');

                                        if (ext == 'mp3') {
                                            $('object', div).addClass('audio');
                                        }
                                    } else {
                                        $(div).html(ns).removeClass('loading');
                                    }

                                    break;
                                case 'flv':
                                    url = Wf.URL.toAbsolute(url);

                                    $(div).append('<object type="application/x-shockwave-flash" data="' + swf + '"><param name="movie" value="' + swf + '" /><param name="flashvars" value="controls=true&autoplay=true&src=' + url + '" /></object>');
                                    break;
                                case 'flash':
                                    $(div).append('<object type="' + props.type + '" data="' + url + '"><param name="movie" value="' + url + '" /></object>');
                                    break;
                                default:
                                    $(div).append('<object classid="' + props.classid + '"><param name="src" value="' + url + '" /><embed src="' + url + '" type="' + props.type + '"></embed></object>');
                                    break;
                            }

                            $('iframe, object, embed, video, audio', div).on('load loadedmetadata', function () {
                                $(div).removeClass('loading');

                                calculateWidth(e.target, w, h);

                                $('.uk-modal').trigger('modal.assetloaded');
                            });
                        }
                    }

                    calculateWidth(e.target, w, h);
                }
            });

            return this.open(Wf.translate('preview', 'Preview') + ' - ' + name, options, div);
        }
    };
})(jQuery, Wf);