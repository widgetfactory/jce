var Joomla = window.Joomla || {};

Joomla.submitbutton = (task) => {
    const form = document.getElementById('application-form');
    form.task.value = task;

    // Fetch all relevant elements at once using a combined selector
    const selectors = ['#profile-feature', '#profile-editor', '#profile-plugins']
        .map(id => `${id} input[name], ${id} select[name], ${id} textarea[name]`)
        .join(', ');

    const inputElements = Array.from(form.querySelectorAll(selectors));

    // Determine action based on the task
    const isCancel = task === 'profile.cancel';

    // Apply disable condition based on task or edited state
    inputElements.forEach(input => {
        input.disabled = isCancel || !input.classList.contains('isdirty');
    });

    try {
        Joomla.submitform(task, form);
    } catch (e) {
        // error
    }
};