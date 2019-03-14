(function($) {
    $(document).ready(function() {        
        // repeatable
        $('.form-field-repeatable-add').on('click', function(e) {
            e.preventDefault();
            // get repeatable container, clone item
            var $repeatable = $(this).parent('.form-field-repeatable-item'), $item = $repeatable.clone(true);
            // append
            $item.insertBefore($repeatable.siblings().last());
        });

        $('.form-field-repeatable-remove').on('click', function(e) {
            e.preventDefault();
            var $repeatable = $(this).parent('.form-field-repeatable-item'), $parent = $repeatable.parent();
            // remove
            $repeatable.remove();
            // trigger update
            $('.form-field-repeatable', $parent).trigger('repeatable:update');
        });

        $('.form-field-repeatable-item').find(':input, select').on('change', function() {
            var $repeatable = $(this).parent('.form-field-repeatable-item'), $parent = $repeatable.parent();

            $('.form-field-repeatable', $parent).trigger('repeatable:update');
        });

        $('.form-field-repeatable').on('repeatable:update', function() {
            $parent = $(this).parent();

            var values = [];

            $('.form-field-repeatable-item', this.parentNode).find(':input, select').each(function() {
                var value = $(this).val();

                if (value !== "") {
                    values.push(value);
                }
            });

            $(this).val(values.join(',')).change();
        });
    });
})(jQuery);