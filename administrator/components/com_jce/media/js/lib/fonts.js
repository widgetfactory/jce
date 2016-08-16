(function($) {

    $(document).ready(function() {

        $('div.fontlist').on('update', function() {
            var data = {}, v = "";

            $('li input[type="checkbox"]:checked', this).each(function() {
                var s = this.value.split('=');

                if (s.length === 2) {
                    data[s[0]] = s[1];
                }
            });

            $('li.font-item', this).not('.hide').each(function() {
                var k = $('input', this).first().val(), v = $('input', this).last().val();
                
                if (k && v) {
                    data[k] = v;
                }
            });

            if (!$.isEmptyObject(data)) {
                v = JSON.stringify(data);
            }

            // serialize and return
            $('input[type="hidden"]', this).val(v).change();
        });

        // trigger input change
        $('input[type="checkbox"]', 'div.fontlist').on('click', function() {
            $('div.fontlist').trigger('update');
        });
        
        $('input[type="text"]', 'div.fontlist').on('change', function() {
            $('div.fontlist').trigger('update');
        });

        // create close action
        $('a.close', 'div.fontlist').not('.plus').click(function(e) {
            $(this).parent().remove();
            $('div.fontlist').trigger('update');

            e.preventDefault();
        });

        // create new action
        $('a.close.plus', 'div.fontlist').click(function(e) {
            var $item = $('div.fontlist ul li.font-item').last().clone(true).appendTo('div.fontlist ul').removeClass('hide');

            // clear inputs
            $('input', $item).val("").first().focus();

            e.preventDefault();
        });
        
        // add events to new item
        $('div.fontlist ul li.font-item.hide input').change(function() {
            $('div.fontlist').trigger('update');
        });

        // make sortable
        $('div.fontlist ul').sortable({
            axis: 'y',
            update: function(event, ui) {
                $('div.fontlist').trigger('update');
            },
            placeholder: "fontlist-highlight",
            start: function(event, ui) {
                $(ui.placeholder).height($(ui.item).height()).width($(ui.item).width());
            },
        });
    });
})(jQuery);