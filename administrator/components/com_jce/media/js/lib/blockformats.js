(function($) {

    $(document).ready(function() {

        $('div.blockformats').on('update', function() {
            var v = $('li input[type="checkbox"]:checked', this).map(function() {
                return this.value;
            }).get().join();

            // serialize and return
            $('input[type="hidden"]', this).val(v).change();
        });

        // trigger input change
        $('input[type="checkbox"]', 'div.blockformats').on('click', function() {
            $('div.blockformats').trigger('update');
        });

        // make sortable
        $('div.blockformats ul').sortable({
            axis: 'y',
            update: function(event, ui) {
                $('div.blockformats').trigger('update');
            },
            placeholder: "blockformat-highlight",
            start: function(event, ui) {
                $(ui.placeholder).height($(ui.item).height()).width($(ui.item).width());
            }
        });
    });
})(jQuery);