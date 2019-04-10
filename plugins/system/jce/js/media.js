(function ($) {
    $(document).ready(function ($) {
        $('.wf-media-input').removeAttr('readonly');

        $(document).on('subform-row-add', function (event, row) {
            $(row).find('.wf-media-input').removeAttr('readonly');
        });
    });
})(jQuery);