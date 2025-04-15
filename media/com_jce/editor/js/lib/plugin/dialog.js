/* global Wf, jQuery, tinyMCEPopup*/

(function ($) {


    $.extend(Wf, {
        /**
         * Get common attribute types
         * @param e Element
         * @param at Attribute name
         * @returns {String|Integer}
         */
        getAttrib: function (e, at) {
            var ed = tinyMCEPopup.editor,
                v;

            switch (at) {
                case 'width':
                case 'height':
                    v = ed.dom.getAttrib(e, at) || e.style[at] || '';

                    if (v.indexOf('px') !== -1) {
                        v = parseInt(v, 10);
                    }

                    break;
                case 'align':
                    if ((v = ed.dom.getAttrib(e, 'align'))) {
                        return v;
                    }

                    if ((v = ed.dom.getStyle(e, 'float'))) {
                        return v;
                    }

                    if ((v = ed.dom.getStyle(e, 'vertical-align'))) {
                        return v;
                    }

                    if (e.style.display === "block" && ed.dom.getStyle(e, 'margin-left') === "auto" && ed.dom.getStyle(e, 'margin-right') === "auto") {
                        return 'center';
                    }
                    break;
                case 'margin-top':
                case 'margin-bottom':
                    if ((v = ed.dom.getStyle(e, at))) {
                        if (/auto|inherit/.test(v)) {
                            return v;
                        }

                        if (!/[a-z%]/i.test(v) || v.indexOf('px') !== -1) {
                            return parseInt(v, 10);
                        }

                        return v;
                    }

                    if ((v = ed.dom.getAttrib(e, 'vspace'))) {
                        return parseInt(v.replace(/[^-0-9]/g, ''), 10);
                    }
                    break;
                case 'margin-left':
                case 'margin-right':
                    if ((v = ed.dom.getStyle(e, at))) {
                        if (/auto|inherit/.test(v)) {
                            return v;
                        }

                        if (!/[a-z%]/i.test(v) || v.indexOf('px') !== -1) {
                            return parseInt(v, 10);
                        }

                        return v;
                    }

                    if ((v = ed.dom.getAttrib(e, 'hspace'))) {
                        return parseInt(v.replace(/[^-0-9]/g, ''), 10);
                    }
                    break;
                case 'border-width':
                case 'border-style':
                case 'border-color':
                    v = '';
                    tinymce.each(['top', 'right', 'bottom', 'left'], function (n) {
                        var s = at.replace(/-/, '-' + n + '-');
                        var sv = ed.dom.getStyle(e, s);
                        // False or not the same as prev
                        if (sv !== '' || (sv != v && v !== '')) {
                            v = '';
                        }
                        if (sv) {
                            v = sv;
                        }
                    });

                    // check if we have a value
                    if (v !== '') {
                        $('#border').prop('checked', true);
                    }

                    // set blank value as inherit
                    if ((at == 'border-width' || at == 'border-style') && v === '') {
                        v = 'inherit';
                    }

                    if (at == 'border-color') {
                        v = Wf.String.toHex(v);
                    }

                    if (at == 'border-width') {
                        if (/[0-9][a-z]/.test(v)) {
                            v = parseFloat(v);
                        }
                    }

                    break;
            }

            return v;
        },

        /**
         * Set Margin values for various plugins
         * @param e Init state
         */
        setMargins: function () { },
        /**
         * Set border input options for various plugins
         */
        setBorder: function () { },

        /**
         * Generic function to set dimensions
         */
        setDimensions: function () { },
        /**
         * Set / update styles on a sample image, eg: <img src="image.jpg" id="sample" />
         */
        setStyles: function () {
            var ed = tinyMCEPopup.editor,
                $img = $('#sample');

            if (!$img.length) {
                return;
            }

            // apply styles to image
            $img.attr('style', $('#style').val());

            // Margin
            $.each(['top', 'right', 'bottom', 'left'], function (i, k) {
                // need to use tinymce DOMUilts for this because jQuery returns 0px for blank values
                var v = ed.dom.getStyle($img.get(0), 'margin-' + k);

                if (v && v.indexOf('px') != -1) {
                    v = parseInt(v, 10);
                }

                $('#margin_' + k).val(v);
            });

            this.setMargins(true);

            var border = false;

            // Handle border
            $.each(['width', 'color', 'style'], function (i, k) {
                // need to use tinymce DOMUilts for this because jQuery returns odd results for blank values
                var v = ed.dom.getStyle($img.get(0), 'border-' + k);

                if (v == '') {
                    $.each(['top', 'right', 'bottom', 'left'], function (i, n) {
                        // need to use tinymce DOMUilts for this because jQuery returns odd results for blank values
                        var sv = ed.dom.getStyle($img.get(0), 'border-' + n + '-' + k);

                        // False or not the same as prev
                        if (sv !== '' || (sv != v && v !== '')) {
                            v = '';
                        }
                        if (sv) {
                            v = sv;
                        }
                    });
                }

                if (v !== '') {
                    border = true;
                }

                if (k == 'width') {
                    v = /[0-9][a-z]/.test(v) ? parseInt(v, 10) : v;
                }

                if (k == 'color' && v) {
                    v = Wf.String.toHex(v);

                    if (v.charAt(0) === "#") {
                        v = v.substr(1);
                    }
                }

                if (border) {
                    $('#border_' + k).val(v);

                    $('#border~:input, #border~span, #border~label').attr('disabled', false).toggleClass('uk-text-muted', false);

                    // update pick
                    if (k == 'color') {
                        $('#border_' + k).trigger('pick');
                    }

                    $('#border').prop('checked', true).trigger('change');
                }
            });

            // Align
            $('#align').val(function () {
                var v = $img.css("float") || $img.css("vertical-align");

                if (v) {
                    return v;
                }

                if ($img.css('margin-left') === "auto" && $img.css('margin-right') === "auto" && $img.css('display') === "block") {
                    return "center";
                }

                return "";
            });
        },
        /**
         * Update styles field with style values from a sample image
         */
        updateStyles: function () {
            var ed = tinyMCEPopup.editor, v, img = new Image(), preview = $('#sample'), k;

            $(img).attr('style', $('#style').val());
            $(img).add(preview).attr('dir', $('#dir').val());

            // Handle align
            $(img).add(preview).css('float', '');

            v = $('#align').val();

            if (v == 'center') {
                $(img).add(preview).css({ 'display': 'block', 'margin-left': 'auto', 'margin-right': 'auto' });

                // remove float and vertical-align
                $(img).add(preview).css({ 'float': '', 'vertical-align': '' });

                $('#clear').attr('disabled', true).trigger('datalist:disabled', true);

                $('#margin_left, #margin_right').val('auto');
            } else {
                if (/(top|middle|bottom)/.test(v)) {
                    $(img).add(preview).css("vertical-align", v);
                }

                // remove float etc.
                $(img).add(preview).css('float', v).css('display', function () {
                    if (this.style.display === "block" && this.style.marginLeft === "auto" && this.style.marginRight === "auto") {
                        return "";
                    }

                    return this.style.display;
                });

                $('#margin_left, #margin_right').val(function () {
                    if (this.value === "auto") {
                        return "";
                    }

                    return this.value;
                });

                // equal values
                if ($('#margin_check').is(':checked')) {
                    $('#margin_top').siblings('input[type="text"]').val($('#margin_top').val());
                }

                $('#clear').attr('disabled', !v).trigger('datalist:disabled', !v);
            }

            // Handle clear
            v = $('#clear:enabled').val();

            if (v) {
                if (!$('#sample-br').get(0)) {
                    $(img).add(preview).after('<br id="sample-br" />');
                }
                $('#sample-br').css('clear', v);
            } else {
                $('#sample-br').remove();
            }

            // Handle border
            $.each(['width', 'color', 'style'], function (i, k) {
                if ($('#border').is(':checked')) {
                    v = $('#border_' + k).val();
                } else {
                    v = '';
                }

                if (v == 'inherit') {
                    v = '';
                }

                // add pixel to width
                if (k == 'width' && /[^a-z]/i.test(v)) {
                    v += 'px';
                }

                if (k == 'color' && v.charAt(0) !== "#") {
                    v = '#' + v;
                }

                $(img).add(preview).css('border-' + k, v);
            });

            // Margin
            $.each(['top', 'right', 'bottom', 'left'], function (i, k) {
                v = $('#margin_' + k).val();

                if (v && !/[a-z%]/i.test(v)) {
                    v = v + 'px';
                }

                $(img).add(preview).css('margin-' + k, v);
            });

            var styles = ed.dom.parseStyle($(img).attr('style'));

            function compressBorder(n) {
                var s = [];

                $.each(n, function (i, k) {
                    k = 'border-' + k, v = styles[k];

                    if (v == 'none') {
                        delete styles[k];
                        return;
                    }

                    if (v) {
                        s.push(styles[k]);
                        delete styles[k];
                    }
                });

                if (s.length) {
                    styles.border = s.join(' ');
                }
            }

            // compress border
            compressBorder(['width', 'style', 'color', 'image']);

            // remove -moz and -webkit styles
            for (k in styles) {
                if (k.indexOf('-moz-') >= 0 || k.indexOf('-webkit-') >= 0) {
                    delete styles[k];
                }
            }

            // Merge
            $('#style').val(ed.dom.serializeStyle(styles));
        },
        setDefaults: function (s) {
            var n, v;

            var x = 0;

            for (n in s) {
                if (!n) {
                    continue;
                }

                v = s[n];

                if (n === "direction") {
                    n = "dir";
                }

                if (v === "default") {
                    v = '';
                }

                var $elm = $('#' + n);

                if ($elm.length) {
                    if ($elm.is(':checkbox')) {
                        $('#' + n).prop('checked', parseFloat(v)); //.trigger('change');
                    } else {
                        $('#' + n).val(v); //.trigger('change');

                        // update colour
                        if (typeof v === "string" && v.charAt(0) === "#") {
                            $('#' + n).trigger('change');
                        }
                    }
                } else {
                    var $repeatable = $('.uk-repeatable', '#custom_attributes');

                    if (x > 0) {
                        $repeatable.eq(0).clone(true).appendTo($repeatable.parent());
                    }

                    var $elements = $repeatable.eq(x).find('input, select');

                    $elements.eq(0).val(n);
                    $elements.eq(1).val(v);

                    x++;
                }
            }
        }
    });
})(jQuery);