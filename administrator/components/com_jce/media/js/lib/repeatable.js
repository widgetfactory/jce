(function($) {
    $(document).ready(function() {        
        // repeatable
        $('.controls').on('click', '.form-field-repeatable-add', function(e) {
            e.preventDefault();
            // get repeatable container, clone item
            var $repeatable = $(this).parents('.form-field-repeatable-item'), $parent = $repeatable.parent(), $item = $repeatable.clone();

            // append
            $parent.append($item);

            // reset id values of all form items and trigger change
            $parent.find(':input[name]').not('input[type="hidden"]').each(function() {
                var elm = this, $p = $(this).parents('.form-field-repeatable-item'), idx = $p.index(), x = 0;

                $p.find(':input[name]').each(function(i) {
                    if (elm === this) {
                        x = i;
                        return true;
                    }
                });

                // clean id of trailing digit, eg: _1
                var id = this.id.replace(/(_\d+)$/, '');

                // create new id
                $(this).attr('id', id + '_' + idx + '_' + x);
            }).change();
		
            // fix media field
            $item.find('.field-media-wrapper').each(function(){
                // re-initlialize
                $(this).fieldMedia();
            });
        });

        $('.controls').on('click', '.form-field-repeatable-remove', function(e) {
            e.preventDefault();
            var $repeatable = $(this).parents('.form-field-repeatable-item'), $parent = $repeatable.parent();
            // remove
            $repeatable.remove();
            // update
            $parent.find(':input').change();
        });
    });
})(jQuery);