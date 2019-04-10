/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
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
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    var Wf = {
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
            $('.mceActionPanel, .actionPanel').addClass('uk-modal-footer');

            // ie flag
            if (/MSIE/.test(navigator.userAgent) || navigator.userAgent.indexOf('Trident/') !== -1 || navigator.userAgent.indexOf('Edge/') !== -1) {
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
                    primary: 'uk-icon-check'
                }
            }).addClass('uk-button-primary');

            $('button#refresh, input#refresh').button({
                icons: {
                    primary: 'uk-icon-refresh'
                }
            });

            // add button actions
            $('#cancel').button({
                icons: {
                    primary: 'uk-icon-cancel'
                }
            });

            // go no further if standalone
            if (standalone) {
                return;
            }

            TinyMCE_Utils.fillClassList('classlist');

            $('#apply').button({
                icons: {
                    primary: 'uk-icon-plus'
                }
            });

            $('#help').button({
                icons: {
                    primary: 'uk-icon-help'
                }
            }).click(function (e) {
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
            $('.uk-datalist select').datalist();

            // activate tooltips
            $('.hastip, .tip, .tooltip').tips();

            // set styles events
            $('#align, #clear, #dir').change(function () {
                self.updateStyles();
            });

            // set margin events
            $('input[id^="margin_"]').change(function () {
                self.updateStyles();
            });

            // setup border widget
            $('#border').borderWidget().on('border:change', function () {
                self.updateStyles();
            });

            // update styles on border change
            $('#border_width, #border_style, #border_color').change(function () {
                self.updateStyles();
            }).on('datalist:change', function () {
                self.updateStyles();
            });

            $('#style').change(function () {
                self.setStyles();
            });

            // create constrainables around constrain checkbox
            $('.uk-constrain-checkbox').constrain();

            // equalize input values
            $('.uk-equalize-checkbox').equalize();

            // hide HTML4 only attributes
            if (tinyMCEPopup.editor.settings.schema === 'html5-strict' && tinyMCEPopup.editor.settings.validate) {
                $('.html4').hide().find(':input').prop('disabled', true);
            }

            // flexbox
            /*$('.uk-flex-item-auto').width(function() {
                var p = $(this).parent('.uk-flex');
                var w = 0;

                $(this).siblings().each(function() {
                    w += $(this).width();
                });

                return $(p).width() - w;
            });*/

            // initialise repeatable elements
            $('.uk-repeatable').repeatable();
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
                var ed = tinyMCEPopup.editor,
                    u = ed.getParam('document_base_url') + 'components/com_jce/editor/tiny_mce';

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
                url: tinyMCEPopup.getParam('site_url') + 'index.php?option=com_jce&view=help&tmpl=component&lang=' + ed.settings.language + '&section=editor&category=' + this.getName(),
                title: tinyMCEPopup.getLang('dlg.help', 'Help'),
                //width: 896,
                //height: 768,
                size: 'mce-modal-landscape-full',
                inline: true,
                close_previous: 0
            });
        },

        createColourPickers: function () {
            var self = this,
                ed = tinyMCEPopup.editor,
                doc = ed.getDoc();

            $('input.color, input.colour').each(function () {
                var id = $(this).attr('id');
                var v = this.value;

                var elm = this;

                // remove # from value
                if (v && v.charAt(0) === "#") {
                    this.value = v.substr(1);
                    v = this.value;
                }

                if ($(this).siblings(':input').length) {
                    $(this).wrap('<span />');
                }

                $(this).parent('.uk-form-controls, td, span').addClass('uk-form-icon uk-form-icon-both').prepend('<i class="uk-icon-hashtag" />');

                var $picker = $('<button class="uk-button-link uk-icon-none uk-icon-colorpicker" title="' + self.translate('colorpicker') + '" aria-label="' + self.translate('colorpicker') + '" id="' + id + '_pick"></button>').insertAfter(this).attr('disabled', function() {
                    return $(elm).is(':disabled') ? true : null;
                });

                $(this).on('colorpicker:pick', function () {
                    var v = this.value;

                    if (v.charAt(0) !== "#") {
                        v = '#' + v;
                    }

                    $(this).next('.uk-icon-colorpicker').css('background-color', v);
                });

                $(this).change(function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var v = this.value;

                    if (v && v.charAt(0) === "#") {
                        $(this).val(v.substr(1));
                    }

                    // default to black
                    if (v === "") {
                        v = "000000";
                    }

                    // toggle disabled
                    $(this).next('.uk-icon-colorpicker').attr('disabled', function() {
                        return elm.disabled ? true : null;
                    });

                    // fire event
                    $(this).trigger('colorpicker:pick', '#' + v);
                }).change();

                var colorpicker_custom_colors = ed.getParam('colorpicker_custom_colors', '');
                var colorpicker_type = ed.getParam('colorpicker_type', '');

                if (colorpicker_type === "simple" && colorpicker_custom_colors.length) {

                    if (typeof colorpicker_custom_colors === "string") {
                        colorpicker_custom_colors = colorpicker_custom_colors.split(',');
                    }

                    var html = '<div role="listbox" tabindex="0" class="wf-colorpicker-simple-colors">';

                    $.each(colorpicker_custom_colors, function (i, col) {
                        if (col.length == 4) {
                            col = col + col.substr(1);
                        }

                        html += '<div style="background-color:' + col + '" data-color="' + col + '" title="' + col + '"><span aria-hidden="true" aria-label="' + col + '"></span></div>';
                    });

                    html += '</div>';

                    $picker.tips({
                        trigger: 'click',
                        position: 'bottom center',
                        content: '<div id="colorpicker" aria-label="Colorpicker" title="Color Picker">' + html + '</div>',
                        className: 'wf-colorpicker wf-colorpicker-simple',
                        opacity: 1
                    }).on('tooltip:show', function () {
                        $('#colorpicker').on('click', '.wf-colorpicker-simple-colors > div', function (e) {
                            var col = $(e.target).data('color');

                            if (col) {
                                $(elm).val(col).change();
                                $picker.trigger('tooltip:close');
                            }
                        });
                    });
                } else {
                    // get stylesheets from editor
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
                        custom_colors: colorpicker_custom_colors
                    });

                    $(this).colorpicker(settings);
                }
            });
        },
        createBrowsers: function (el, callback, filter) {
            var self = this;

            if (el) {
                $(el).addClass('browser').addClass(filter || '');
            }

            $('input.browser').add(el).each(function () {
                var input = this;

                filter = (function (el) {
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

                $(this).parent('td, .uk-form-controls').addClass('uk-form-icon uk-form-icon-flip');

                var map = {
                    'images': 'picture',
                    'html': 'file-text',
                    'files': 'file-text',
                    'media': 'film'
                };

                $('<button class="uk-icon uk-icon-' + map[filter] + ' uk-button uk-button-link" title="' + self.translate('browse', 'Browse for Files') + '" aria-label="' + self.translate('browse', 'Browse for Files') + '"></button>').click(function (e) {
                    e.preventDefault();
                    
                    return tinyMCEPopup.execCommand('mceFileBrowser', true, {
                        "callback": callback || $(input).attr('id'),
                        "value": input.value,
                        "filter": $(this).attr('data-filter') || filter,
                        "caller": self.getName(),
                        "window": window
                    });

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
            return tinyMCEPopup.getLang('dlg.' + s, ds || s);
        }
    };

    /**
     * Cookie Functions
     */
    Wf.Cookie = {
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
            var c = document.cookie,
                e, p = n + "=",
                b, v;

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
    // load Language
    Wf.loadLanguage();

    window.Wf = Wf;
})(jQuery);

if (typeof ColorPicker === 'undefined') {
    var ColorPicker = {
        settings: {}
    };
}
/* Compat */
AutoValidator = {
    validate: function () {
        return true;
    }
};