(function ($) {

    window.WfSelectUsers = function () {
        var name = $("#jform_users").val() || $("#jform_users").attr('value'),
            id = $('#jform_users_id').val();

        var opt = new Option(name, id);

        // clear id and value
        $('#jform_users, #jform_users_id').val('').attr('value', '');

        // get existing select value
        var value = $('#jform_users_select').val();

        // cast as array
        if (!Array.isArray(value)) {
            value = [value];
        }

        // add new id
        value.push(id);

        // add new option to select list if it does not exist
        if ($('#jform_users_select').find('option[value="' + id + '"]').length === 0) {
            $('#jform_users_select').append(opt);
        }

        // update value and "chosen"
        $('#jform_users_select').val(value).trigger('chosen:updated').trigger('liszt:updated.chosen');
        
        // udpdate fancy-select "choices"
        $('#jform_users_select').parents('joomla-field-fancy-select').each(function () {
            if (!this.choicesInstance) {
                return;
            }

            this.choicesInstance.setValue([{ value: id, label: name }]);
        });
    };

})(jQuery);