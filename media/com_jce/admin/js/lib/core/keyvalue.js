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

                $(':input[name]', this).each(function () {
                    var name = $(this).attr('name'), val = $(this).val();

                    // must have "key"
                    if (name == '') {
                        return true;
                    }

                    // encode and set value
                    data[name] = $('<textarea/>').text(val).html();
                });

                items.push(data);
            });

            // don't update on init
            if (init) {
                init = false;
                return;
            }

            // update hidden input
            $ctrl.find('input[name*="jform"][type="hidden"]').val(JSON.stringify(items)).trigger('change');

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