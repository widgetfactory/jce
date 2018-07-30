(function($) {

    $(document).ready(function() {

        $('.blockformats').each(function() {
            var el = this;
            
            // trigger input change
            $('input[type="checkbox"]', this).on('click', function() {
                $(el).trigger('update');
            });

        }).on('update', function() {
            // trigger change on all inputs
            $('input[type="hidden"]', this).change();
        }).sortable({
            axis: 'y',
            update: function(event, ui) {
                $('.blockformats').trigger('update');
            },
            placeholder: "blockformat-highlight",
            start: function(event, ui) {
                $(ui.placeholder).height($(ui.item).height()).width($(ui.item).width());
            }
        });
    });
})(jQuery);