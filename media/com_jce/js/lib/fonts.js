(function ($) {

    $(document).ready(function () {

        $('.fontlist').each(function () {
            var el = this;

            // trigger input change
            $('input[type="checkbox"]', this).on('click', function () {
                $('.fontlist').trigger('update');
            });

            $('input[type="text"]', this).on('change', function () {
                $('.fontlist').trigger('update');
            });

            // create close action
            $('.font-item-trash', this).on('click', function (e) {
                e.preventDefault();

                $(this).parents('.font-item').remove();
                $('.fontlist').trigger('update');
            });

            // create new action
            $('.font-item-plus', this).on('click', function (e) {
                e.preventDefault();

                $('.font-item[hidden]', el).clone(true).insertBefore(this).removeAttr('hidden').find('input').val("").first().focus();
            });

        }).on('update', function () {
            var data = [], v = "";

            $('.font-item', this).not('.hide').each(function () {
                var obj = {};

                var key = $('input:text', this).first().val(), val = $('input:text', this).last().val();

                if (key && val) {
                    obj[key] = val;
                }

                var values = $('input:checkbox:checked', this).val();

                if (values) {
                    var pair = values.split('=');

                    if (pair.length === 2) {
                        obj[pair[0]] = pair[1];
                    }
                }

                if (!$.isEmptyObject(obj)) {
                    data.push(obj);
                }
            });

            // pass through array of object
            if (data.length) {
                v = JSON.stringify(data);
            }

            // serialize and return
            $('input[type="hidden"]', this).val(v).trigger('change');
        }).sortable({
            axis: 'y',
            items: '.font-item',
            update: function (event, ui) {
                $('.fontlist').trigger('update');
            },
            placeholder: "font-item-highlight sortable-placeholder",
            start: function (event, ui) {
                $(ui.placeholder).height($(ui.item).height()).width($(ui.item).width());
            }
        });
    });
})(jQuery);