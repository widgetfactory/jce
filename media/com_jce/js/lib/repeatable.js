/* global jQuery */
/* eslint-disable consistent-this */
(function ($) {
    $(document).ready(function () {
        // repeatable
        $('.controls').on('click', '.form-field-repeatable-add', function (e) {
            e.preventDefault();
            // get repeatable container, clone item
            var $repeatable = $(this).parents('.form-field-repeatable-item'), $parent = $repeatable.parent(), $item = $repeatable.clone();

            // append
            $parent.append($item);

            // reset id values of all form items and trigger change
            $parent.find(':input[name]').not('input[type="hidden"]').each(function () {
                var elm = this, $p = $(this).parents('.form-field-repeatable-item'), idx = $p.index(), x = 0;

                $p.find(':input[name]').each(function (i) {
                    if (elm === this) {
                        x = i;
                        return true;
                    }
                });

                // clean id of trailing digit, eg: _1
                var id = this.id.replace(/(_\d+)$/, '');

                // create new id
                $(this).attr('id', id + '_' + idx + '_' + x);
            }).trigger('change');

            $item.find(':input[name]').val('').trigger('change');

            // fix media field
            $item.find('.field-media-wrapper').each(function () {
                // re-initlialize
                if ($.fn.fieldMedia) {
                    $(this).fieldMedia();
                }

                $(document).trigger('subform-row-add', [this]);
            });

            // other modals
            if (window.SqueezeBox && window.SqueezeBox.assign) {
                window.SqueezeBox.assign($item.find('a.modal').get(), { parse: 'rel' });
            }
        });

        $('.controls').on('click', '.form-field-repeatable-remove', function (e) {
            e.preventDefault();
            var $repeatable = $(this).parents('.form-field-repeatable-item'), $parent = $repeatable.parent();
            // remove
            $repeatable.remove();
            // update
            $parent.find(':input').trigger('change');
        });
    });
})(jQuery);