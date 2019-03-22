(function ($) {
    var previewStyles = ['fontFamily', 'fontSize', 'fontWeight', 'textDecoration', 'textTransform', 'color', 'backgroundColor'];

    // camelcase style - from JQuery 1.10.2 - http://code.jquery.com/jquery-1.10.2.js
    function camelCase(str) {
        return str.replace(/^-ms-/, "ms-").replace(/-([\da-z])/gi, function (all, letter) {
            return letter.toUpperCase();
        });
    }

    /**
     * Update title styles
     * @param {type} n
     * @param {type} string
     * @returns {undefined}
     */
    function updateStyles(n, string) {
        $.each(string.split(';'), function (i, s) {
            var kv = $.trim(s).split(':');

            if (kv.length > 1) {
                var k = $.trim(kv[0]),
                    v = $.trim(kv[1]);

                if ($.inArray(camelCase(k), previewStyles) !== -1) {
                    $(n).css(k, v);
                }
            }
        });
    }

    $(document).ready(function () {
        var init = true;

        // create close action
        $('.styleformat-item-trash', '.styleformat-list').click(function (e) {
            e.preventDefault();

            // if there  is only one item, clear and hide
            if ($('div.styleformat-list div.styleformat').length === 1) {

                // clear inputs and remove styles
                $('input, select', this.parentNode).val("").removeAttr('style').removeAttr('class');
                // hide
                $(this).parents('.styleformat').hide();
                // otherwise remove it
            } else {
                $(this).parents('.styleformat').remove();
            }

            $('.styleformat-list').trigger('update');

            e.preventDefault();
        });

        // create new action
        $('.styleformat-item-plus', '.styleformat-list').click(function (e) {
            e.preventDefault();
            
            var $item = $(this).prev();

            if ($.fn.chosen) {
                $('select', $item).chosen('destroy');
            }
            
            $item.clone(true).insertBefore(this).show();

            // show all
            $('div', $item).removeClass('hide');

            // trigger collapse
            $('a.close.collapse', $item).removeClass('icon-chevron-down').addClass('icon-chevron-up');

            // clear inputs and remove styles
            $('input, select', $item).val("").removeAttr('style').removeAttr('class').first().focus();

            e.preventDefault();
        });

        $('.styleformat-list').sortable({
            axis: 'y',
            update: function (event, ui) {
                $('div.styleformat-list').trigger('update');
            },
            handle: '.styleformat-item-handle',
            items: '.styleformat',
            placeholder: "styleformat-highlight",
            start: function (event, ui) {
                $(ui.placeholder).height($(ui.item).height());
            }
        }).on('update', function () {
            var list = [],
                v = "";

            // get each styleformat item
            $('.styleformat', this).each(function () {
                var data = {},
                    v, p = this,
                    x = 0;

                // only proceed if title set and at least one other value of element, class or style
                if ($('.styleformat-item-title input', p).val()) {
                    // get all values in sequence and encode
                    $('input[type="text"], select', p).each(function () {
                        var k = $(this).data('key'),
                            v = $(this).val();

                        if (v !== "") {
                            // count keys to make sure we have at least one
                            if (k === 'element' || k === 'classes' || k === 'styles' || k === 'attributes') {
                                x++;
                            }

                            data[k] = v;
                        }
                    });
                }

                // check if empty, convert to string
                if (x > 0 && !$.isEmptyObject(data)) {
                    list.push(data);
                }
            });

            if (list.length) {
                v = JSON.stringify(list);
            }

            if (!init) {
                // serialize and return
                $('input[type="hidden"]', this).first().val(v).change();
            }
        });

        $('.styleformat').each(function() {
            // trigger input change
            $('input[type="text"], select', this).change(function () {
                $('div.styleformat-list').trigger('update');

                var title = $('div.styleformat-item-title input', $(this).parents('div.styleformat')),
                    v = $(this).val();

                if ($(this).data('key') === "element") {
                    $(title).attr('class', "");

                    if (/^(h[1-6]|em|strong|code|sub|sup)$/.test(v)) {
                        $(title).addClass(v);
                    }
                }

                if ($(this).data('key') === "styles") {
                    $(title).attr('style', "");

                    updateStyles(title, v);
                }
            }).change();

            // create collapsible action
            $('.collapse', this).on('click.collapse', function (e) {
                e.preventDefault();
                $(this).parents('.styleformat').toggleClass('styleformat-collapse');
            });
        });

        // hide all
        if ($('.styleformat', '.styleformat-list').length > 1) {
            $('.styleformat', '.styleformat-list').addClass('styleformat-collapse');
        }

        if (init) {
            $(document).ready(function() {
                if ($.fn.chosen) {
                    $('.styleformat select').chosen('destroy');
                }
            });
        }

        // set init flag false
        init = false;

        // update if there is more than 1 input, ie: conversion of legacy theme_advanced_styles
        if ($('input[type="hidden"]', '.styleformat-list').length > 1) {
            $('.styleformat-list').trigger('update');
        }
    });
})(jQuery);