var Joomla = window.Joomla || {};

// values that are always submitted, as they are not params data
const alwaysSubmit = ['jform[rows]', 'jform[plugins]'];

Joomla.submitbutton = (task) => {
    const form = document.getElementById('application-form');
    form.task.value = task;

    // Fetch all relevant elements at once using a combined selector
    const selectors = ['#profile-features', '#profile-editor', '#profile-plugins']
        .map(id => `${id} input[name], ${id} select[name], ${id} textarea[name]`)
        .join(', ');

    const inputElements = Array.from(form.querySelectorAll(selectors));

    // Determine action based on the task
    const isCancel = task === 'profile.cancel';

    // Apply disable condition based on task or edited state
    inputElements.forEach(input => {
        if (alwaysSubmit.includes(input.name)) {
            input.disabled = isCancel;
            return;
        }

        input.disabled = isCancel || !input.classList.contains('isdirty');
    });

    try {
        Joomla.submitform(task, form);
    } catch (e) {
        // error
    }
};