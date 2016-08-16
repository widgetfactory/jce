(function($) {
    $.fn.borderWidget = function() {
      $(this).on('click change', function() {
        var state = this.checked;

        $('input[id*="border_"], select[id*="border_"], label[for*="border_"]').prop('disabled', !state).toggleClass('ui-text-muted', !state);

        $(this).trigger('border:change');
      }).change();

      return this;
    };

    $.extend($.Plugin, {
        /**
         * Get common attribute types
         * @param e Element
         * @param at Attribute name
         * @returns {String|Integer}
         */
        getAttrib: function(e, at) {
            var ed = tinyMCEPopup.editor, v, v2;

            switch (at) {
                case 'width':
                case 'height':
                    return ed.dom.getAttrib(e, at) || ed.dom.getStyle(e, at) || '';
                    break;
                case 'align':
                    if (v = ed.dom.getAttrib(e, 'align')) {
                        return v;
                    }
                    if (v = ed.dom.getStyle(e, 'float')) {
                        return v;
                    }

                    if (v = ed.dom.getStyle(e, 'vertical-align')) {
                        return v;
                    }

                    if (e.style.display === "block" && ed.dom.getStyle(e, 'margin-left') === "auto" && ed.dom.getStyle(e, 'margin-right') === "auto") {
                        return 'center';
                    }
                    break;
                case 'margin-top':
                case 'margin-bottom':
                    if (v = ed.dom.getStyle(e, at)) {
                        if (/auto|inherit/.test(v)) {
                            return v;
                        }
                        return parseInt(v.replace(/[^-0-9]/g, ''));
                    }
                    if (v = ed.dom.getAttrib(e, 'vspace')) {
                        return parseInt(v.replace(/[^-0-9]/g, ''));
                    }
                    break;
                case 'margin-left':
                case 'margin-right':
                    if (v = ed.dom.getStyle(e, at)) {
                        if (/auto|inherit/.test(v)) {
                            return v;
                        }
                        return parseInt(v.replace(/[^-0-9]/g, ''));
                    }
                    if (v = ed.dom.getAttrib(e, 'hspace')) {
                        return parseInt(v.replace(/[^-0-9]/g, ''));
                    }
                    break;
                case 'border-width':
                case 'border-style':
                case 'border-color':
                    v = '';
                    tinymce.each(['top', 'right', 'bottom', 'left'], function(n) {
                        s = at.replace(/-/, '-' + n + '-');
                        sv = ed.dom.getStyle(e, s);
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
                        v = $.String.toHex(v);
                    }

                    if (at == 'border-width') {
                        if (/[0-9][a-z]/.test(v)) {
                            v = parseFloat(v);
                        }
                    }

                    return v;
                    break;
            }
        },

        /**
         * Set Margin values for various plugins
         * @param e Init state
         */
        setMargins: function() {},
        /**
         * Set border input options for various plugins
         */
        setBorder: function() {},

        /**
         * Generic function to set dimensions
         */
        setDimensions: function() {},
        /**
         * Set / update styles on a sample image, eg: <img src="image.jpg" id="sample" />
         */
        setStyles: function() {
            var self = this, ed = tinyMCEPopup.editor, $img = $('#sample');

            // apply styles to image
            $img.attr('style', $('#style').val());

            // Margin
            $.each(['top', 'right', 'bottom', 'left'], function(i, k) {
                // need to use tinymce DOMUilts for this because jQuery returns 0px for blank values
                var v = ed.dom.getStyle($img.get(0), 'margin-' + k);

                if (v && v.indexOf('px') != -1) {
                    v = parseInt(v);
                }

                $('#margin_' + k).val(v);
            });

            this.setMargins(true);

            var border = false;

            // Handle border
            $.each(['width', 'color', 'style'], function(i, k) {
                // need to use tinymce DOMUilts for this because jQuery returns odd results for blank values
                var v = ed.dom.getStyle($img.get(0), 'border-' + k);

                if (v == '') {
                    $.each(['top', 'right', 'bottom', 'left'], function(i, n) {
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
                    v = /[0-9][a-z]/.test(v) ? parseInt(v) : v;
                }

                if (k == 'color' && v) {
                    v = $.String.toHex(v);

                    if (v.charAt(0) === "#") {
                        v = v.substr(1);
                    }
                }

                if (border) {
                    $('#border').attr('checked', 'checked');
                    $('#border_' + k).val(v);

                    $('#border~:input, #border~span, #border~label').attr('disabled', false).toggleClass('ui-text-muted', false);

                    // update pick
                    if (k == 'color') {
                        $('#border_' + k).trigger('pick');
                    }
                }
            });

            // Align
            $('#align').val(function() {
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
        updateStyles: function() {
            var ed = tinyMCEPopup.editor, st, v, br, img = $('#sample'), k;

            // no sample image...
            if (!img.length) {
                return;
            }

            $(img).attr('style', $('#style').val());
            $(img).attr('dir', $('#dir').val());

            // Handle align
            $(img).css('float', '');

            v = $('#align').val();

            if (v == 'center') {
                $(img).css({'display': 'block', 'margin-left': 'auto', 'margin-right': 'auto'});

                $('#clear').attr('disabled', true);

                $('#margin_left, #margin_right').val('auto');
            } else {
                if (/(top|middle|bottom)/.test(v)) {
                    $(img).css("vertical-align", v);
                }

                // remove float etc.
                $(img).css('float', v).css('display', function() {
                    if (this.style.display === "block" && this.style.marginLeft === "auto" && this.style.marginRight === "auto") {
                        return "";
                    }

                    return this.style.display;
                });

                $('#margin_left, #margin_right').val(function() {
                    if (this.value === "auto") {
                        return "";
                    }

                    return this.value;
                });

                // equal values
                if ($('#margin_check').is(':checked')) {
                    $('#margin_top').siblings('input[type="text"]').val($('#margin_top').val());
                }

                $('#clear').attr('disabled', !v);
            }

            // Handle clear
            v = $('#clear:enabled').val();

            if (v) {
                if (!$('#sample-br').get(0)) {
                    $(img).after('<br id="sample-br" />');
                }
                $('#sample-br').css('clear', v);
            } else {
                $('#sample-br').remove();
            }

            // Handle border
            $.each(['width', 'color', 'style'], function(i, k) {
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

                $(img).css('border-' + k, v);
            });

            // Margin
            $.each(['top', 'right', 'bottom', 'left'], function(i, k) {
                v = $('#margin_' + k).val();
                $(img).css('margin-' + k, /[^a-z]/i.test(v) ? v + 'px' : v);
            });

            var styles = ed.dom.parseStyle($(img).attr('style'));

            function compressBorder(n) {
                var s = [];

                $.each(n, function(i, k) {
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

            for (n in s) {
                v = s[n];

                if (v == 'default') {
                    v = '';
                }

                if ($('#' + n).is(':checkbox')) {
                    $('#' + n).prop('checked', parseFloat(v)).change();
                } else {
                    $('#' + n).val(v).change();
                }
            }
        }
    });
})(jQuery);
