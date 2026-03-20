window.WfSelectUsers = () => {
    const [userElm, userIdElm, userSelectElm] = document.querySelectorAll('#jform_users, #jform_users_id, #jform_users_select');

    const name = userElm.getAttribute('value');
    const id = userIdElm.value;

    const opt = new Option(name, id);

    // clear id and value
    userElm.value = '';
    userIdElm.value = '';

    // get existing select value
    let value = userSelectElm.value;

    // cast as array
    if (!Array.isArray(value)) {
        value = [value];
    }

    // add new id
    value.push(id);

    // add new option to select list if it does not exist
    if (!userSelectElm.querySelector(`option[value="${id}"]`)) {
        userSelectElm.appendChild(opt);
    }

    // update value and "chosen"
    userSelectElm.value = value;
    userSelectElm.dispatchEvent(new Event('change'));

    // update fancy-select "choices"
    const fancySelect = userSelectElm.closest('joomla-field-fancy-select');

    if (fancySelect && fancySelect.choicesInstance) {
        fancySelect.choicesInstance.setValue([{ value: id, label: name }]);
    }
};

export default {};