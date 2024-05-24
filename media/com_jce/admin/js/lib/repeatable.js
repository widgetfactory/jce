/* global jQuery, Joomla */
/* eslint-disable consistent-this */
(function ($) {
    $(document).ready(function () {
        function isImage(value) {
            return value && /\.(jpg|jpeg|png|gif|svg|apng|webp)$/.test(value);
        }
        
        function createElementMedia(elm) {
            var modalElement = $('.joomla-modal', elm).get(0);
    
            if (modalElement && window.bootstrap && window.bootstrap.Modal) {
                Joomla.initialiseModal(modalElement, {
                    isJoomla: true
                });
    
                $('.button-select', elm).on('click', function (e) {
                    e.preventDefault();
                    modalElement.open();
                });
            }
    
            $('.button-clear', elm).on('click', function (e) {
                e.preventDefault();
                $('.wf-media-input', elm).val('').trigger('change');
            });
    
            $('.wf-media-input', elm).on('change', function () {
                var path = Joomla.getOptions('system.paths', {}).root || '';
    
                var src = '';
    
                if (isImage(this.value)) {
                    src = path + '/' + this.value;
                }
    
                $('.field-media-preview img', elm).attr('src', src);
            }).trigger('change');
        }
        
        // repeatable
        $('.controls').on('click', '.form-field-repeatable-add', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // get repeatable container, clone item
            var $repeatable = $(this).parents('.form-field-repeatable-item'), $parent = $repeatable.parent(), $item = $repeatable.clone(true);

            // append
            $parent.append($item);

            // reset id values of cloned form items and trigger change
            $item.find(':input[name]').not('input[type="hidden"]').each(function () {
                var elm = this, $p = $(this).parents('.form-field-repeatable-item'), idx = $p.index(), x = 0;

                $p.find(':input[name]').each(function (i) {
                    if (elm === this) {
                        x = i;
                        return true;
                    }
                });

                this.name = this.name.replace(/(\[\d+\])$/, '[' + idx + ']');

                // clean id of trailing digit, eg: _1
                var id = this.id.replace(/(_\d+)$/, '');

                id = id + '_' + idx + '_' + x;

                // find and update the associated label if any
                $p.find('label[for]').each(function () {
                    if ($(this).attr('for') == elm.id) {
                        $(this).attr('for', id);
                    }
                });

                // create new id
                $(this).attr('id', id);
            }).trigger('change');

            $item.find(':input[name]').val('').trigger('change').removeClass('isdirty');
            $item.find('select[name]').find('option:first').prop('selected', true).parent().trigger('change').removeClass('isdirty');

            // fix media fields
            $item.find('.field-media-wrapper').each(function () {
                if (this.inputElement) {
                    this.updatePreview();
                } else {
                    // store input value
                    var value = $(this).find('.wf-media-input').val();

                    // clear events
                    var html = $(this).html();
                    $(this).html(html);

                    // restore input value
                    $(this).find('.wf-media-input').val(value);

                    // re-initlialize
                    if ($(this).data('fieldMedia')) {
                        $(this).data('fieldMedia', null).fieldMedia();
                    }

                    createElementMedia(this);
                }

                $(document).trigger('subform-row-add', [this]);
            });

            // reset radio items
            $parent.find('input[type="radio"][checked]').each(function () {
                this.checked = !!this.getAttribute('checked');
            });

            // other modals
            if (window.SqueezeBox && window.SqueezeBox.assign) {
                window.SqueezeBox.assign($item.find('a.modal').get(), { parse: 'rel' });
            }
        });

        $('.controls').on('click', '.form-field-repeatable-remove', function (e) {
            e.preventDefault();
            var $repeatable = $(this).parents('.form-field-repeatable-item'), $parent = $repeatable.parent();

            // clear or remove
            if ($parent.children('.form-field-repeatable-item').length === 1) {
                $repeatable.find(':input').val('');
            } else {
                $repeatable.remove();
            }

            // update
            $parent.find(':input').trigger('change');
        });
    });
})(jQuery);