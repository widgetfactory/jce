(function ($) {
    $(document).ready(function ($) {
        $('.wf-media-input').not('.wf-media-input-readonly').removeAttr('readonly');

        $(document).on('subform-row-add', function (event, row) {
            $(row).find('.wf-media-input').not('.wf-media-input-readonly').removeAttr('readonly');
        });
    });
})(jQuery);