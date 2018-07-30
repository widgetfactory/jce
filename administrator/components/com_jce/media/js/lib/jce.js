/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2018 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function ($) {
 
    function init() {
        // repeatable
        $('.ui-repeatable').repeatable().on('repeatable:change', function () {
            $(this).parent().find(':input[name]').addClass('isdirty');
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

        $('.sortable.checkboxes').sortable({
            "axis": "y"
        });

        // dependant parameters
        $(document).ready(setDependants);

        // remove loader
        $(document).ready(function () {
            $('.ui-jce').removeClass('loading');
        });
    }

    function setDependants() {
        $('[data-parent]', '.ui-jce').each(function () {
            var el = this,
                data = $(this).data('parent') || '';

            var p = $(this).parents('.control-group');

            // hide the element by default
            $(p).hide();

            $.each(data.split(';'), function (i, s) {
                // get the parent selector and value
                s = /([\w\.]+)\[([\w,]+)\]/.exec(s);

                if (s && s.length > 2) {
                    var k = s[1],
                        v = s[2].split(',');

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
                            $(el).parents('.control-group').show();
                        } else {
                            $(el).parents('.control-group').hide();
                        }
                    }).trigger(event);
                }
            });
        });
    }
    // run init when the doc is ready
    $(document).ready(init);
})(jQuery);