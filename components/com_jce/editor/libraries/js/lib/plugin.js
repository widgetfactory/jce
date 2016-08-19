/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

// String functions
(function ($) {
    var standalone = (typeof tinyMCEPopup === "undefined");

    // uid counter
    var counter = 0;

    /**
     Generates an unique ID.
     @method uid
     @return {String} Virtually unique id.
     */
    function uid() {
        var guid = new Date().getTime().toString(32), i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    $.Plugin = {
        i18n: {},
        language: '',
        options: {
            selectChange: $.noop,
            site: '',
            root: '',
            help: $.noop,
            alerts: ''
        },
        getURI: function (absolute) {
            if (!standalone) {
              return tinyMCEPopup.editor.documentBaseURI.getURI(absolute);
            }

            return (absolute) ? this.options.root : this.options.site;
        },
        init: function (options) {
            var self = this;

            $.extend(this.options, options);

            // add footer class
            $('.mceActionPanel, .actionPanel').addClass('ui-modal-footer');

            // ie flag
            if (/MSIE/.test(navigator.userAgent) || navigator.userAgent.indexOf('Edge/') !== -1) {
              $('#jce').addClass('ie');
            }

            // ie8 flag
            if (!$.support.cssFloat && document.querySelector) {
                $('#jce').addClass('ie8');

                $('input[type="number"]').addClass("type-number");
            }

            // create buttons
            $('button#insert, input#insert, button#update, input#update').button({
                icons: {
                    primary: 'ui-icon-check'
                }
            }).addClass('ui-button-primary');

            $('button#refresh, input#refresh').button({
                icons: {
                    primary: 'ui-icon-refresh'
                }
            });

            // add button actions
            $('#cancel').button({
                icons: {
                    primary: 'ui-icon-close'
                }
            });

            // go no further if standalone
            if (standalone) {
                return;
            }

            TinyMCE_Utils.fillClassList('classlist');

            $('#apply').button({
                icons: {
                    primary: 'ui-icon-plus'
                }
            });

            $('#help').button({
                icons: {
                    primary: 'ui-icon-question'
                }
            }).click(function(e) {
              e.preventDefault();
              self.help();
            });

            // add button actions
            $('#cancel').click(function (e) {
                tinyMCEPopup.close();
                e.preventDefault();
            });

            // show body
            $('#jce').addClass('');

            // activate tabs
            $('#tabs').tabs();

            // create colour picker widgets
            this.createColourPickers();
            // create browser widgets
            this.createBrowsers();

            // set up datalist
            $('.ui-datalist select').datalist();

            // activate tooltips
            $('.hastip, .tip, .tooltip').tips();

            // set styles events
            $('#align, #clear, #dir').change(function() {
                self.updateStyles();
            });

            // set margin events
            $('input[id^="margin_"]').change(function() {
              self.updateStyles();
            });

            // setup border widget
            $('#border').borderWidget().on('border:change', function() {
                self.updateStyles();
            });

            // update styles on border change
            $('#border_width, #border_style, #border_color').change(function() {
                self.updateStyles();
            });

            $('#style').change(function() {
                self.setStyles();
            });

            // create constrainables around constrain checkbox
            $('.ui-constrain-checkbox').constrain();

            // equalize input values
            $('.ui-equalize-checkbox').equalize();

            // hide HTML4 only attributes
            if (tinyMCEPopup.editor.settings.schema === 'html5-strict' && tinyMCEPopup.editor.settings.validate) {
                $('.html4').hide().find(':input').prop('disabled', true);
            }

            // flexbox
            /*$('.ui-flex-item-auto').width(function() {
                var p = $(this).parent('.ui-flex');
                var w = 0;

                $(this).siblings().each(function() {
                    w += $(this).width();
                });

                return $(p).width() - w;
            });*/

            // initialise repeatable elements
            $('.ui-repeatable').repeatable();
        },
        /**
         * Get the name of the plugin
         * @returns {String} Plugin name
         */
        getName: function () {
            return $('body').data('plugin');
        },
        getPath: function (plugin) {
            if (!standalone) {
                return tinyMCEPopup.editor.plugins[this.getName()].url;
            }

            return this.options.site + 'components/com_jce/editor/tiny_mce/plugins/' + this.getName();
        },
        loadLanguage: function () {
            if (!standalone) {
                var ed = tinyMCEPopup.editor, u = ed.getParam('document_base_url') + 'components/com_jce/editor/tiny_mce';

                if (u && ed.settings.language && ed.settings.language_load !== false) {
                    u += '/langs/' + ed.settings.language + '_dlg.js';

                    if (!tinymce.ScriptLoader.isDone(u)) {
                        document.write('<script type="text/javascript" src="' + tinymce._addVer(u) + '"></script>');
                        tinymce.ScriptLoader.markDone(u);
                    }
                }
            }
        },
        help: function () {
          var ed = tinyMCEPopup.editor;

          ed.windowManager.open({
              url   : tinyMCEPopup.getParam('site_url') + 'index.php?option=com_jce&view=help&tmpl=component&lang=' + ed.settings.language + '&section=editor&category=' + this.getName(),
              title : tinyMCEPopup.getLang('dlg.help', 'Help'),
              width: 896,
              height: 768,
              size: 'mce-modal-square-xlarge',
              inline: true,
              close_previous: 0
          });
        },

        createColourPickers: function () {
            var self = this, ed = tinyMCEPopup.editor, doc = ed.getDoc();

            $('input.color, input.colour').each(function () {
                var id  = $(this).attr('id');
                var v   = this.value;

                // remove # from value
                if (v.charAt(0) === "#") {
                  this.value = v.substr(1);
                  v = this.value;
                }

                if ($(this).siblings(':input').length) {
                  $(this).wrap('<span />');
                }

                $(this).parent('.ui-form-controls, td, span').addClass('ui-form-icon ui-form-icon-both').prepend('<i class="ui-icon-hashtag" />');

                var $picker = $('<button class="ui-button-link ui-icon-none ui-icon-colorpicker" title="' + self.translate('colorpicker') + '" id="' + id + '_pick"></button>').insertAfter(this).prop('disabled', $(this).is(':disabled'));

                $(this).on('colorpicker:pick', function () {
                    var v = this.value;

                    if (v.charAt(0) !== "#") {
                      v = '#' + v;
                    }

                    $(this).next('.ui-icon-colorpicker').css('background-color', v);
                });

                $(this).change(function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var v = this.value;

                    if (v.charAt(0) === "#") {
                      $(this).val(v.substr(1));
                    }

                    $(this).trigger('colorpicker:pick', '#' + v);
                }).change();

                // get stylesheets form editor
                var stylesheets = [];

                if (doc.styleSheets.length) {
                    $.each(doc.styleSheets, function (i, s) {
                        // only load template stylesheets, not from tinymce plugins
                        if (s.href && s.href.indexOf('tiny_mce') == -1) {
                            stylesheets.push(s);
                        }
                    });
                }

                var settings = $.extend(ColorPicker.settings, {
                    widget: $picker,
                    labels: {
                        picker_tab: 'Picker',
                        title: 'Color Picker',
                        palette_tab: 'Palette',
                        palette: 'Web Colors',
                        named_tab: 'Named',
                        named: 'Named Colors',
                        template_tab: 'Template',
                        template: 'Template Colors',
                        color: 'Color',
                        apply: 'Apply',
                        name: 'Name'
                    },
                    stylesheets: stylesheets,
                    custom_colors: ed.getParam('colorpicker_custom_colors', '')
                });

                $(this).colorpicker(settings);
            });
        },
        createBrowsers: function (el, callback, filter) {
            var self = this;

            if (el) {
              $(el).addClass('browser');
            }

            $('input.browser').add(el).each(function () {
                var input = this;

                filter = filter || (function(el) {
                  if ($(el).hasClass('image') || $(el).hasClass('images')) {
                    return 'images';
                  }
                  if ($(el).hasClass('html')) {
                    return 'html';
                  }
                  if ($(el).hasClass('media')) {
                    return 'media';
                  }
                  return 'files';
                })(this);

                $(this).parent('td, .ui-form-controls').addClass('ui-form-icon ui-form-icon-flip');

                var map = {
                  'images'  : 'picture-o',
                  'html'    : 'file-text-o',
                  'files'   : 'file-text-o',
                  'media'   : 'film'
                };

                $('<span role="button" class="ui-icon ui-icon-' + map[filter] + '" title="' + self.translate('browse', 'Browse for Files') + '"></span>').click(function (e) {
                    return tinyMCEPopup.execCommand('mceFileBrowser', true, {
                      "callback"  : callback || $(input).attr('id'),
                      "value"     : input.value,
                      "filter"    : filter,
                      "caller"    : self.getName(),
                      "window"    : window
                    }, window);

                }).insertAfter(this);
            });
        },
        getLanguage: function () {
            if (!this.language) {
                var s = $('body').attr('lang') || 'en';

                if (s.length > 2) {
                    s = s.substr(0, 2);
                }

                this.language = s;
            }

            return this.language;
        },
        /**
         * Resize o to fit into container c
         * @param {Object} o Width / Height Object pair
         * @param {Object} c Width / Height Object pair
         */
        sizeToFit: function (o, c) {
            var x = c.width;
            var y = c.height;
            var w = o.width;
            var h = o.height;

            var ratio = x / w;

            if (w / h > ratio) {
                h = h * (x / w);
                w = x;
                if (h > y) {
                    w = w * (y / h);
                    h = y;
                }
            } else {
                w = w * (y / h);
                h = y;
                if (w > x) {
                    h = h * (x / w);
                    w = x;
                }
            }

            return {
                width: Math.round(w),
                height: Math.round(h)
            };
        },
        /**
         * Adds a language pack, this gets called by the loaded language files like en.js.
         *
         * @method addI18n
         * @param {String} p Prefix for the language items. For example en.myplugin
         * @param {Object} o Name/Value collection with items to add to the language group.
         * @source TinyMCE EditorManager.js
         * @copyright Copyright 2009, Moxiecode Systems AB
         * @licence GNU / LGPL 2 - http://www.gnu.org/copyleft/lesser.html
         *
         * Modified for JQuery
         */
        addI18n: function (p, o) {
            var i18n = this.i18n;

            if ($.type(p) == 'string') {
                $.each(o, function (k, o) {
                    i18n[p + '.' + k] = o;
                });
            } else {
                $.each(p, function (lc, o) {
                    $.each(o, function (g, o) {
                        $.each(o, function (k, o) {
                            if (g === 'common')
                                i18n[lc + '.' + k] = o;
                            else
                                i18n[lc + '.' + g + '.' + k] = o;
                        });

                    });

                });
            }
        },
        translate: function (s, ds) {
            return tinyMCEPopup.getLang('dlg.' + s, ds);
        }
    };

    /**
     * Cookie Functions
     */
    $.Cookie = {
        /**
         * Gets the raw data of a cookie by name.
         *
         * @method get
         * @param {String} n Name of cookie to retrive.
         * @return {String} Cookie data string.
         * @copyright Copyright 2009, Moxiecode Systems AB
         * @licence GNU / LGPL - http://www.gnu.org/copyleft/lesser.html
         */
        get: function (n, s) {
            var c = document.cookie, e, p = n + "=", b, v;

            // Strict mode
            if (!c) {
                return s;
            }

            b = c.indexOf("; " + p);

            if (b == -1) {
                b = c.indexOf(p);

                if (b != 0) {
                    return s;
                }
            } else {
                b += 2;
            }
            e = c.indexOf(";", b);

            if (e == -1) {
                e = c.length;
            }

            v = unescape(c.substring(b + p.length, e));

            if (typeof v == 'undefined') {
                return s;
            }

            return v;
        },
        /**
         * Sets a raw cookie string.
         *
         * @method set
         * @param {String} n Name of the cookie.
         * @param {String} v Raw cookie data.
         * @param {Date} e Optional date object for the expiration of the cookie.
         * @param {String} p Optional path to restrict the cookie to.
         * @param {String} d Optional domain to restrict the cookie to.
         * @param {String} s Is the cookie secure or not.
         * @copyright Copyright 2009, Moxiecode Systems AB
         * @licence GNU / LGPL - http://www.gnu.org/copyleft/lesser.html
         */
        set: function (n, v, e, p, d, s) {
            document.cookie = n + "=" + escape(v) +
                    ((e) ? "; expires=" + e.toGMTString() : "") +
                    ((p) ? "; path=" + escape(p) : "") +
                    ((d) ? "; domain=" + d : "") +
                    ((s) ? "; secure" : "");
        }

    };

    /**
     * JSON XHR
     */
    $.JSON = {
        queue: function (o) {
            var _old = o.complete;

            o.complete = function () {
                if (_old)
                    _old.apply(this, arguments);
            };

            $([$.JSON.queue]).queue("ajax", function () {
                window.setTimeout(function () {
                    $.ajax(o);
                }, 500);

            });

            $.dequeue($.JSON.queue, "ajax");
        },
        /**
         * Send JSON request
         *
         * @param func
         *            Function name to execute by the server
         * @param args
         *            String, Array or Object containing arguments to
         *            send
         * @param callback
         *            Callback function to execute
         * @param scope
         *            Scope to execute callback in
         */
        request: function (func, data, callback, scope) {
            var json = {
                'method': func,
                'id'    : uid()
            };

            callback = callback || $.noop;

            // additional POST data to add (will not be parsed by PHP json parser)
            var args = {
                'format': 'raw'
            };

            // get form input data (including token)
            var fields = $(':input', 'form').serializeArray();

            $.each(fields, function (i, field) {
                args[field.name] = field.value;
            });

            // if data is a string or array
            if ($.type(data) === 'string' || $.type(data) === 'array') {
                $.extend(json, {
                    'params': $.type(data) === 'string' ? $.String.encodeURI(data) : $.map(data, function (s) {
                        if (s && $.type(s) === 'string') {
                            return $.String.encodeURI(s);
                        }

                        return s;
                    })

                });
            } else {
                // if data is an object
                if ($.type(data) === 'object' && data.json) {
                    $.extend(json, {
                        'params': data.json
                    });

                    delete data.json;
                }

                $.extend(args, data);
            }

            var url = document.location.href;

            // strip token
            url = url.replace(/&wf([a-z0-9]+)=1/, '');

            function showError(e) {
                var txt = "";

                if ($.isPlainObject(e)) {
                    txt = e.text || "";
                } else {
                    txt = $.type(e) === 'array' ? e.join('\n') : e;
                }

                if (txt) {
                    // remove linebreaks
                    txt = txt.replace(/<br([^>]+?)>/, '');
                }

                // show error
                $.Dialog.alert(txt);
            }
            /**
             * Test if valid JSON string
             * https://github.com/douglascrockford/JSON-js/blob/master/json2.js
             * @param {string} s
             * @return {boolean}
             */
            function isJSON(s) {
                return /^[\],:{}\s]*$/
                        .test(s.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                                .replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
            }

            $.JSON.queue({
                context: scope || this,
                type: 'POST',
                url: url,
                data: 'json=' + $.JSON.serialize(json) + '&' + $.param(args),
                dataType: 'text',
                success: function (o) {
                    var r;

                    if (o) {
                        // check result - should be object, parse as JSON if string
                        if ($.type(o) === 'string' && isJSON(o)) {
                            // parse string as JSON object
                            var s = $.parseJSON(o);
                            // pass if successful
                            if (s) {
                                o = s;
                            }
                        }

                        // process object result
                        if ($.isPlainObject(o)) {
                            if (o.error) {
                                showError(o.text || o.error.message || '');
                            }

                            r = o.result || null;

                            if (r && r.error && r.error.length) {
                                showError(r.error || '');
                            }
                            // show error
                        } else {
                            // check for malformed JSON
                            if (/[{}]/.test(o)) {
                                showError('The server returned an invalid JSON response.');
                            } else {
                                showError(o);
                            }
                        }
                    } else {
                        o = {'error': ''};
                    }

                    if ($.isFunction(callback)) {
                        callback.call(scope || this, r);
                    } else {
                        return r;
                    }
                },
                error: function (e, txt, status) {
                    $.Dialog.alert(status || ('SERVER ERROR - ' + txt.toUpperCase()));
                }

            });
        },
        serialize: function (o) {
            return JSON.stringify(o);
        }

    },
    $.URL = {
        toAbsolute: function (url) {
            if (!standalone) {
                return tinyMCEPopup.editor.documentBaseURI.toAbsolute(url);
            }

            if (/http(s)?:\/\//.test(url)) {
                return url;
            }
            return $.Plugin.getURI(true) + url.substr(0, url.indexOf('/'));
        },
        toRelative: function (url) {
            if (!standalone) {
                return tinyMCEPopup.editor.documentBaseURI.toRelative(url);
            }

            if (/http(s)?:\/\//.test(url)) {
                return url.substr(url.indexOf('/'));
            }

            return url;
        }

    },

    /**
     * String functions
     */
    $.String = {
        /**
         * From php.js
         * More info at: http://phpjs.org
         * php.js is copyright 2011 Kevin van Zonneveld.
         */
        basename: function (s) {
            return s.replace(/^.*[\/\\]/g, '');
        },
        /**
         * From php.js
         * More info at: http://phpjs.org
         * php.js is copyright 2011 Kevin van Zonneveld.
         */
        dirname: function (s) {
            if (/[\\\/]+/.test(s)) {
                return s.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
            }

            return '';
        },
        filename: function (s) {
            return this.stripExt(this.basename(s));
        },
        getExt: function (s) {
            return s.substring(s.length, s.lastIndexOf('.') + 1);
        },
        stripExt: function (s) {
            return s.replace(/\.[^.]+$/i, '');
        },
        pathinfo: function (s) {
            var info = {
                'basename': this.basename(s),
                'dirname': this.dirname(s),
                'extension': this.getExt(s),
                'filename': this.filename(s)
            };
            return info;
        },
        path: function (a, b) {
            a = this.clean(a);
            b = this.clean(b);

            if (a.substring(a.length - 1) != '/')
                a += '/';

            if (b.charAt(0) == '/')
                b = b.substring(1);

            return a + b;
        },
        clean: function (s) {
            if (!/:\/\//.test(s)) {
                return s.replace(/\/+/g, '/');
            }
            return s;
        },

        _toUnicode: function (s) {
            var c = s.toString(16).toUpperCase();

            while (c.length < 4) {
                c = '0' + c;
            }

            return'\\u' + c;
        },
        safe: function (s, mode, spaces, textcase) {
            mode = mode || 'utf-8';

            // replace spaces with underscore
            if (!spaces) {
                s = s.replace(/[\s ]/g, '_');
            }

            // remove some common characters
            s = s.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]/g, '');
            var r = '';

            for (var i = 0, ln = s.length; i < ln; i++) {
                var ch = s[i];
                // only process on possible restricted characters or utf-8 letters/numbers
                if (/[^\w\.\-~\s ]/.test(ch)) {
                    // skip any character less than 127, eg: &?@* etc.
                    if (this._toUnicode(ch.charCodeAt(0)) < '\\u007F') {
                        continue;
                    }
                }

                r += ch;
            }

            s = r;

            // remove multiple period characters
            s = s.replace(/(\.){2,}/g, '');

            // remove leading period
            s = s.replace(/^\./, '');

            // remove trailing period
            s = s.replace(/\.$/, '');

            // cleanup path
            s = this.basename(s);

            // change case
            if (textcase) {
                switch (textcase) {
                    case 'lowercase':
                        s = s.toLowerCase();
                        break;
                    case 'uppercase':
                        s = s.toUpperCase();
                        break;
                }
            }

            return s;
        },
        query: function (s) {
            var p = {};

            s = this.decode(s);

            // nothing to create query from
            if (s.indexOf('=') === -1) {
                return p;
            }

            if (/\?/.test(s)) {
                s = s.substring(s.indexOf('?') + 1);
            }

            if (/#/.test(s)) {
                s = s.substr(0, s.indexOf('#'));
            }

            var pairs = s.replace(/&amp;/g, '&').split('&');

            $.each(pairs, function () {
                var pair = this.split('=');
                p[pair[0]] = pair[1];
            });

            return p;
        },
        /**
         * Encode basic entities
         *
         * Copyright 2010, Moxiecode Systems AB
         */
        encode: function (s) {
            var baseEntities = {
                '"': '&quot;',
                "'": '&#39;',
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            };
            return ('' + s).replace(/[<>&\"\']/g, function (chr) {
                return baseEntities[chr] || chr;
            });

        },
        /**
         * Decode basic entities
         *
         * Copyright 2010, Moxiecode Systems AB
         */
        decode: function (s) {
            var reverseEntities = {
                '&lt;': '<',
                '&gt;': '>',
                '&amp;': '&',
                '&quot;': '"',
                '&apos;': "'"
            };
            return s.replace(/&(#)?([\w]+);/g, function (all, numeric, value) {
                if (numeric)
                    return String.fromCharCode(value);

                return reverseEntities[all];
            });

        },
        escape: function (s) {
            return encodeURI(s);
        },
        unescape: function (s) {
            return decodeURI(s);
        },
        encodeURI: function (s, preserve_urls) {
            // don't encode local file links
            if (s && s.indexOf('file://') === 0) {
                return s;
            }

            s = encodeURIComponent(decodeURIComponent(s)).replace(/%2F/g, '/');

            if (preserve_urls) {
                s = s.replace(/%(21|2A|27|28|29|3B|3A|40|26|3D|2B|24|2C|3F|25|23|5B|5D)/g, function (a, b) {
                    return String.fromCharCode(parseInt(b, 16));
                });
            }

            return s;
        },
        buildURI: function (s) {
            // add http if necessary
            if (/^\s*www\./.test(s)) {
                s = 'http://' + s;
            }
            return s.replace(/ /g, '%20');
            //return  $.String.encodeURI(s, true);
        },
        /**
         * From TinyMCE form_utils.js function, slightly modified.
         * @author Moxiecode
         * @copyright Copyright 2004-2008, Moxiecode Systems AB, All rights reserved.
         */
        toHex: function (color) {
            var re = new RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)", "gi");

            var rgb = color.replace(re, "$1,$2,$3").split(',');
            if (rgb.length == 3) {
                r = parseInt(rgb[0]).toString(16);
                g = parseInt(rgb[1]).toString(16);
                b = parseInt(rgb[2]).toString(16);

                r = r.length == 1 ? 0 + r : r;
                g = g.length == 1 ? 0 + g : g;
                b = b.length == 1 ? 0 + b : b;

                return "#" + r + g + b;
            }
            return color;
        },
        /**
         * From TinyMCE form_utils.js function, slightly modified.
         * @author Moxiecode
         * @copyright Copyright  2004-2008, Moxiecode Systems AB, All rights reserved.
         */
        toRGB: function (color) {
            if (color.indexOf('#') != -1) {
                color = color.replace(new RegExp('[^0-9A-F]', 'gi'), '');

                r = parseInt(color.substring(0, 2), 16);
                g = parseInt(color.substring(2, 4), 16);
                b = parseInt(color.substring(4, 6), 16);

                return "rgb(" + r + "," + g + "," + b + ")";
            }
            return color;
        },
        ucfirst: function (s) {
            return s.charAt(0).toUpperCase() + s.substring(1);
        },
        formatSize: function (s, int) {
            // MB
            if (s > 1048576) {
                var n = Math.round((s / 1048576) * 100) / 100;

                if (int) {
                    return n;
                }

                return n + " " + $.Plugin.translate('size_mb', 'MB');
            }

            // KB
            if (s > 1024) {
                var n = Math.round((s / 1024) * 100) / 100;

                if (int) {
                    return n;
                }

                return n + " " + $.Plugin.translate('size_kb', 'KB');
            }

            if (int) {
                return s;
            }

            return s + " " + $.Plugin.translate('size_bytes', 'Bytes');
        },
        /**
         * Format a UNIX date string
         * @param time UNIX Time in seconds
         * @param fmt Date / Time Format eg: '%d/%m/%Y, %H:%M'
         * @return Formatted Date / Time
         * @copyright Copyright 2009, Moxiecode Systems AB
         */
        formatDate: function (time, fmt) {
            var date = new Date(time * 1000);

            fmt = fmt || '%d/%m/%Y, %H:%M';

            function addZeros(value, len) {
                var i;

                value = "" + value;

                if (value.length < len) {
                    for (i = 0; i < (len - value.length); i++)
                        value = "0" + value;
                }

                return value;
            }

            fmt = fmt.replace("%D", "%m/%d/%y");
            fmt = fmt.replace("%r", "%I:%M:%S %p");
            fmt = fmt.replace("%Y", "" + date.getFullYear());
            fmt = fmt.replace("%y", "" + date.getYear());
            fmt = fmt.replace("%m", addZeros(date.getMonth() + 1, 2));
            fmt = fmt.replace("%d", addZeros(date.getDate(), 2));
            fmt = fmt.replace("%H", "" + addZeros(date.getHours(), 2));
            fmt = fmt.replace("%M", "" + addZeros(date.getMinutes(), 2));
            fmt = fmt.replace("%S", "" + addZeros(date.getSeconds(), 2));
            fmt = fmt.replace("%I", "" + ((date.getHours() + 11) % 12 + 1));
            fmt = fmt.replace("%p", "" + (date.getHours() < 12 ? "AM" : "PM"));
            fmt = fmt.replace("%%", "%");

            return fmt;
        }

    };
    // load Language
    $.Plugin.loadLanguage();
})(jQuery);

if (typeof ColorPicker === 'undefined') {
    var ColorPicker = {
        settings: {}
    };
}
/* Compat */
AutoValidator = {validate: function() {return true;}};
