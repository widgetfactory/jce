/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
/* global jQuery */
(function ($) {

    $(document).ready(function () {
        $('.filetype').each(function () {
            var self = this;

            // create hidden input
            var $input = $('input[type="hidden"]', this);

            function serialize() {
                var list = [];

                $(self).parent().find('.filetype-list').each(function () {
                    // checkboxes
                    var v1 = $(this).find('.filetype-item input[type="checkbox"]').map(function () {
                        if (!this.checked) {
                            return "-" + this.value;
                        }
                        return this.value;
                    }).get();

                    // custom values
                    var v2 = $(this).find('.filetype-custom input').map(function () {
                        if (this.value !== "") {
                            return this.value;
                        }
                    }).get();

                    var group = "";

                    $(this).find('.filetype-group input[type="checkbox"]').map(function () {
                        group = $(this).parents('.filetype-group').data('filetype-group');

                        if (!this.checked) {
                            group = "-" + group;
                        }
                    });

                    var items = $.merge(v1, v2).join(",");

                    if (group) {
                        list.push(group + "=" + items);
                    } else {
                        list.push(items);
                    }
                });

                var v = list.join(";");

                // set value to hidden input
                $input.val(v).addClass('isdirty');
                // set value to original input
                $(self).val(v);
            }

            // get all checkboxes
            $('input[type="checkbox"]', this).on('click', function () {
                serialize();
            });

            $('.filetype-edit', this).on('click', function (e) {
                e.preventDefault();
                $('.filetype-list', self).slideToggle();
            });

            $(this).on('change', '.filetype-custom input', function (e) {
                e.preventDefault();
                $(this).siblings('.file').attr("class", "").addClass("file").addClass(this.value);
                serialize();
            });

            $(this).on('click', '.filetype-custom .filetype-clear', function (e) {
                e.preventDefault();
                $(this).siblings('input').val("");
            });

            $('.filetype-add', this).on('click', function (e) {
                e.preventDefault();

                var $p = $(this).parents('.filetype-item');

                var clone = $p.clone();

                $(clone).find('input').val("");

                $(clone).insertAfter($p);
            });

            $(this).on('click', '.filetype-remove', function (e) {
                e.preventDefault();

                $(this).parents('.filetype-item').remove();
                serialize();
            });

            if ($('.filetype-group', this).length) {
                $('.filetype-list', this).sortable({
                    "axis": "y",
                    "items": "> .filetype-item",
                    "connectWith": ".filetype .filetype-list",
                    "update": function (event, ui) {
                        serialize();
                    }
                });
            }
        });
    });
})(jQuery);