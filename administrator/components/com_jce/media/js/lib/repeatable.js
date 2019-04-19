(function($) {
    $(document).ready(function() {        
        // repeatable
        $('.form-field-repeatable-add').on('click', function(e) {
            e.preventDefault();
            // get repeatable container, clone item
            var $repeatable = $(this).parent('.form-field-repeatable-item'), $parent = $repeatable.parent(), $item = $repeatable.clone(true);
            // append
            $parent.append($item);
        });

        $('.form-field-repeatable-remove').on('click', function(e) {
            e.preventDefault();
            var $repeatable = $(this).parent('.form-field-repeatable-item'), $parent = $repeatable.parent();
            // remove
            $repeatable.remove();
        });
    });
})(jQuery);