(function ($) {

    window.WfSelectUsers = function () {
        
        var name = $("#jform_users").val(),
            id = $('#jform_users_id').val();

        // clear value
        $("#jform_users").val("");

        // clear id
        $('#jform_users_id').val("");

        var opt = new Option(name, id);

        var value = $('#jform_users_select').val();

        if ($.type(value) !== "array") {
            value = [value];
        }

        value.push(id);

        // add new option if it does not exist
        if ($('#jform_users_select').find('option[value="' + id + '"]').length === 0) {
            $('#jform_users_select').append(opt);
        }

        // update value and "chosen"
        $('#jform_users_select').val(value).trigger('chosen:updated').trigger('liszt:updated.chosen');
    };

})(jQuery);