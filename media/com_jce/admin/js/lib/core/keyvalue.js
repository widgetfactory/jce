/* global jQuery */
(function ($) {
    $(document).ready(function () {
        var init = true;

        $('.controls').on('change', '.wf-keyvalue :input', function (e) {
            var $parent = $(this).parents('.wf-keyvalue'), $ctrl = $parent.parent();

            var items = [];

            if ($(e.target).is(':checkbox')) {
                if (e.target.checked) {
                    var key = $parent.find(':input[name="name"]').val();

                    if (key) {
                        $parent.find(':input[name="value"]').val(key).attr('disabled', 'disabled');
                    } else {
                        this.checked = false;
                    }

                } else {
                    $parent.find(':input[name="value"]').removeAttr('disabled');
                }
            }

            $('.wf-keyvalue', $ctrl).each(function () {
                var data = {};
                var isEmpty = true; // track if all inputs are empty

                $(':input[name]', this).each(function () {
                    var name = $(this).attr('name');
                    var val = $(this).val();

                    // Skip unnamed inputs
                    if (!name) {
                        return true;
                    }

                    // HTML encode and store
                    data[name] = $('<textarea/>').text(val).html();

                    // Track if any value is non-empty
                    if ($.trim(val) !== '') {
                        isEmpty = false;
                    }
                });

                // Only push if at least one non-empty value
                if (!isEmpty) {
                    items.push(data);
                }
            });

            // don't update on init
            if (init) {
                init = false;
                return;
            }

            var value = items.length ? JSON.stringify(items) : '';

            // update hidden input
            $ctrl.find('input[name*="jform"][type="hidden"]').val(value).trigger('change');

        });

        // update checkboxes if values are the same
        $('.controls .wf-keyvalue').each(function () {
            var $inp = $(this).find(':input:text');

            if ($inp.eq(0).val() === $inp.eq(1).val()) {
                $(this).find(':input:checkbox').prop('checked', true);
            }
        });

        $('.controls .wf-keyvalue :input:checkbox').trigger('change');
    });
})(jQuery);