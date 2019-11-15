(function($) {
    $(document).ready(function() {
        
        $('.controls').on('change', '.wf-keyvalue :input', function(e) {
            var $parent = $(this).parents('.wf-keyvalue'), $ctrl = $parent.parent();

            var items = [];

            $('.wf-keyvalue', $ctrl).each(function() {
                var data = {};

                $(':input[name]', this).each(function() {
                    var name = $(this).attr('name'), val = $(this).val();
                    // encode and set value
                    data[name] = $('<textarea/>').text(val).html();
                });

                items.push(data);
            });

            // update hidden input
            $ctrl.find('input[name*="jform"][type="hidden"]').val(JSON.stringify(items)).trigger('change');
        });
    });
})(jQuery);