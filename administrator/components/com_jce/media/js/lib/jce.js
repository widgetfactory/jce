/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function ($) {
    if (typeof Joomla === 'undefined') {
        Joomla = {};
    }

    Joomla.modal = function (el, url, width, height) {
        var o = {
            'handler': 'iframe',
            'size': {
                x: width,
                y: height
            },
            'url': url,
            onOpen: function () {
                $('#sbox-window').css({'width': 'auto', 'height': 'auto'});
            }
        };

        return SqueezeBox.fromElement(el, o);
    };

    $.jce = {
        options: {},
        init: function () {
            var self = this;

            // IE
            if (!$.support.cssFloat) {
                $('.ui-jce').addClass('ie');

                // IE8 / 9
                if (document.querySelector) {
                    // IE8
                    if (!$.support.leadingWhitespace) {
                        $('.ui-jce').addClass('ie8');
                        // IE9
                    } else {
                        $('.ui-jce').addClass('ie9');
                    }
                }
            }

            $('input[size="100"]').addClass('input-xlarge');
            $('input[size="50"]').addClass('input-large');
            $('input[size="5"]').addClass('input-mini');

            // dialogs
            $('a.dialog').click(function (e) {
                self.createDialog(e, {
                    src: $(this).attr('href'),
                    options: $(this).data('options')
                });

                e.preventDefault();
            });

            // Tips
            $('.wf-tooltip, .hasTip').tips({
                parent: '.ui-jce'
            });

            // repeatable
            $('.ui-repeatable').repeatable();

            // profiles list checkboxes
            $('th input[type="checkbox"]', $('#profiles-list, #users-list')).click(function () {
                var n = $('td input[type="checkbox"]', $('#profiles-list, #users-list')).prop('checked', this.checked);

                $('input[name="boxchecked"]').val($(n).filter(':checked').length);
            });

            $('td input[type="checkbox"]', $('#profiles-list, #users-list')).click(function () {
                var bc = $('input[name="boxchecked"]').val();
                var n = $('td input[type="checkbox"]', $('#profiles-list, #users-list')).length;

                $('th input[type="checkbox"]', $('#profiles-list, #users-list')).prop('checked', bc == n);
            });

            //$('label.radio').addClass('inline');

            // Sortable Profiles list
            $('#profiles-list tbody').sortable({
                handle: 'span.sortable-handle',
                helper: function (e, tr) {
                    var $cells = tr.children();
                    var $helper = tr.clone();
                    $helper.children().each(function (i) {
                        $(this).width($cells.eq(i).width());
                    });
                    return $helper;
                },
                placeholder: "sortable-highlight",
                //forcePlaceholderSize : true,
                stop: function (e, ui) {
                    var n = this;

                    // set the task
                    $('input[name="task"]').val('saveorder');

                    // check all cid[] inputs and serialize
                    var cid = $('input[name^="cid"]', n).prop('checked', true).serialize();

                    // uncheck cid[] inputs
                    $('input[name^="cid"]', n).prop('checked', false);

                    // disable sortables
                    $('#profiles-list tbody').sortable('disable');

                    $(ui.item).addClass('busy');

                    function end() {
                        // enable sortables
                        $('#profiles-list tbody').sortable('enable');

                        $(ui.item).removeClass('busy');
                    }

                    // get order
                    var order = [];

                    $('tr', n).each(function (i) {
                        order.push('order[]=' + i);
                    });

                    // send to server
                    $.ajax({
                        type: 'POST',
                        url: 'index.php',
                        data: $('input[name]', '#adminForm').not('input[name^="order"]').serialize() + '&' + cid + '&' + order.join('&') + '&tmpl=component',
                        success: function () {
                            end();

                            // update order
                            $('tr', n).each(function (i) {
                                $('input[name^="order"]', this).val(i + 1);

                                $('input[id^="cb"]', this).attr('id', 'cb' + i);
                            });
                        },
                        error: function () {
                            end();
                        }
                    });
                }
            });

            // Profiles list order buttons
            $('span.order-up a', '#profiles-list').click(function (e) {
                $('input[name^=cid]', $(this).parents('tr')).prop('checked', true);
                $('input[name="task"]').val('orderup');

                $('#adminForm').submit();

                e.preventDefault();
            });

            $('span.order-down a', '#profiles-list').click(function (e) {
                $('input[name^=cid]', $(this).parents('tr')).prop('checked', true);
                $('input[name="task"]').val('orderdown');

                $('#adminForm').submit();

                e.preventDefault();
            });

            // nested parameter sets
            $('[data-parameter-nested-item]').on('hide', function () {
                $(this).hide().find(':input').prop('disabled', true);
            }).on('show', function () {
                $(this).show().find(':input').prop('disabled', false);
            }).trigger('hide');

            // show relevant item on change, hide others
            $(':input.parameter-nested-parent').change(function () {
                // hide all others first
                $(this).siblings('[data-parameter-nested-item]').trigger('hide').filter('[data-parameter-nested-item="' + this.value + '"]').trigger('show');
            }).change();

            // dependant parameters
            $(document).ready(function () {
                // set dependant parameters
                self._setDependants();
            });

            // remove loader
            $(document).ready(function () {
                $('.ui-jce').removeClass('loading');
            });
        },
        createDialog: function (el, o) {
            var self = this, data = {};

            // add optional settings from link
            if ($.type(o.options) == 'string') {
                data = $.parseJSON(o.options.replace(/'/g, '"'));
            } else {
                data = o.options;
            }

            data = data || {
                width: 640,
                height: 480
            };

            return Joomla.modal(el, o.src, data.width, data.height);
        },
        closeDialog: function (el) {
            //$(el).dialog("close").remove();

            var win = window.parent;

            // try squeezebox
            if (typeof win.SqueezeBox !== 'undefined') {
                return win.SqueezeBox.close();
            }
        },
        /**
         * Password input
         */
        _passwordWidget: function (el) {
            var span = document.createElement('span');

            $(span).addClass('widget-password locked').insertAfter(el).click(function () {
                el = $(this).siblings('input[type="password"]');

                if ($(this).hasClass('locked')) {
                    var input = document.createElement('input');

                    $(el).hide();

                    $(input).attr({
                        type: 'text',
                        size: $(el).attr('size'),
                        value: $(el).val(),
                        'class': $(el).attr('class')
                    }).insertAfter(el).change(function () {
                        $(el).val(this.value).change();
                    });

                } else {
                    var n = $(this).siblings('input[type="text"]');
                    var v = $(n).val();
                    $(n).remove();
                    $(el).val(v).show();
                }
                $(this).toggleClass('locked');
            });

        },

        _setDependants: function () {
            $('[data-parent]').each(function () {
                var el = this, data = $(this).data('parent') || '';

                var p = $(this).parents('li:first');

                // hide the element by default
                $(p).hide();

                $.each(data.split(';'), function (i, s) {
                    // get the parent selector and value
                    s = /([\w\.]+)\[([\w,]+)\]/.exec(s);

                    if (s && s.length > 2) {
                        var k = s[1], v = s[2].split(',');

                        // clean id
                        k = k.replace(/[^\w]+/g, '');

                        // create namespaced event name
                        var event = 'change.' + k;

                        // set parent onchange
                        $('#params' + k).on(event, function () {
                            var ev = $(this).val();

                            // convert value to array
                            if ($.type(ev) !== "array") {
                                ev = $.makeArray(ev);
                            }

                            var state = $(ev).filter(v).length > 0;

                            if (state) {
                                // remove marker
                                $(el).removeClass('child-of-' + k);

                                // if not still hidden by another "parent"
                                if (el.className.indexOf('child-of-') === -1) {
                                    $(p).show();
                                }

                            } else {
                                $(p).hide();

                                // set marker
                                $(el).addClass('child-of-' + k);
                            }

                            $(el).trigger('visibility:toggle', state);
                            // set function when element is toggled itself
                        }).on('visibility:toggle', function (e, state) {
                            if (state) {
                                $(el).parent().show();
                            } else {
                                $(el).parent().hide();
                            }
                        }).trigger(event);
                    }
                });
            });
        }
    };
    // run init when the doc is ready
    $(document).ready(function () {
        $.jce.init();
    });

})(jQuery);
// global shortcut
var $jce = jQuery.jce;
