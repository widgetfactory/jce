/* global Joomla */

const isImage = (value) => value && /\.(jpg|jpeg|png|gif|svg|apng|webp)$/.test(value);

const createElementMedia = (wrapper) => {
    const modalElement = wrapper.querySelector('.joomla-modal');

    if (modalElement && window.bootstrap && window.bootstrap.Modal) {
        Joomla.initialiseModal(modalElement, { isJoomla: true });

        const buttonSelect = wrapper.querySelector('.button-select');
        if (buttonSelect) {
            buttonSelect.addEventListener('click', (e) => {
                e.preventDefault();
                modalElement.open();
            });
        }
    }

    const buttonClear = wrapper.querySelector('.button-clear');

    if (buttonClear) {
        buttonClear.addEventListener('click', (e) => {
            e.preventDefault();
            const input = wrapper.querySelector('.wf-media-input');

            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('change'));
            }
        });
    }

    const mediaInput = wrapper.querySelector('.wf-media-input');

    if (mediaInput) {
        mediaInput.addEventListener('change', () => {
            const path = Joomla.getOptions('system.paths', {}).root || '';
            const img = wrapper.querySelector('.field-media-preview img');
            if (img) {
                img.src = isImage(mediaInput.value) ? path + '/' + mediaInput.value : '';
            }
        });
        mediaInput.dispatchEvent(new Event('change'));
    }
};

const fixMediaField = (item) => {
    item.querySelectorAll('.field-media-wrapper').forEach((wrapper) => {
        if (wrapper.inputElement) {
            wrapper.updatePreview();
        } else {
            const mediaInput = wrapper.querySelector('.wf-media-input');
            const value = mediaInput ? mediaInput.value : '';

            // reset innerHTML to clear cloned event listeners
            const html = wrapper.innerHTML;
            wrapper.innerHTML = html;

            if (mediaInput && value) {
                wrapper.querySelector('.wf-media-input').value = value;
            }

            if (wrapper.fieldMedia) {
                wrapper.fieldMedia();
            }

            createElementMedia(wrapper);
        }

        document.dispatchEvent(new CustomEvent('subform-row-add', { detail: wrapper }));
    });
};

const cancelEvent = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
};

const handleClickEvent = (e) => {
    // add repeatable
    if (e.target.closest('.form-field-repeatable-add')) {
        cancelEvent(e);
        addRepeatable(e);
    }

    // remove repeatable
    if (e.target.closest('.form-field-repeatable-remove')) {
        cancelEvent(e);

        removeRepeatable(e);
    }
};

const removeRepeatable = (e) => {
    const repeatable = e.target.closest('.form-field-repeatable-item'), parent = repeatable.parentNode;

    // if only one repeatable item remains, clear it instead of removing it
    const repeatables = parent.querySelectorAll('.form-field-repeatable-item');

    if (repeatables.length === 1) {
        repeatables[0].querySelectorAll('input, select, textarea').forEach((input) => {
            input.value = '';
            input.setAttribute('value', '');
            input.removeAttribute('disabled');
        });
    } else {
        repeatable.remove();
    }

    parent.querySelectorAll('input, select, textarea').forEach((input) => {
        input.dispatchEvent(new Event('change'));

        input.classList.add('isdirty');
    });

    parent.dispatchEvent(new Event('repeatable:delete'));
};

const replaceIndexInName = (name, idx) => {
    // Split the string by '[' and ']', keeping the delimiters.
    let parts = name.split(/(\[|\])/);

    // Iterate over the parts to find the index to replace.
    for (let i = 0; i < parts.length; i++) {
        // Check if this part is a number and is not empty
        if (/^\d+$/.test(parts[i])) {
            // Replace the index with the new value
            parts[i] = idx;
            break; // Stop after the first replacement
        }
    }

    // Rebuild the string from parts
    return parts.join('');
};

const replaceIndexInId = (id, idx, i) => {
    // Split the string by underscore '_'
    let parts = id.split('_');

    // Check if the last part is a number
    if (/^\d+$/.test(parts[parts.length - 1])) {
        // Replace the last part with the new index and additional suffix
        parts[parts.length - 1] = `${idx}_${i}`;
    } else {
        // If the last part is not a number, append the new index and suffix
        parts.push(`${idx}_${i}`);
    }

    // Rebuild the string from parts
    return parts.join('_');
};

const addRepeatable = (e) => {
    const repeatable = e.target.closest('.form-field-repeatable-item'), parent = repeatable.parentNode;

    // destroy choices select lists
    repeatable.querySelectorAll('joomla-field-fancy-select').forEach((choices) => {
        if (choices.choicesInstance) {
            choices.choicesInstance.destroy();
        }
    });

    const item = repeatable.cloneNode(true);

    // remove disabled states from cloned item
    item.querySelectorAll('input, select, textarea').forEach((input) => {
        input.removeAttribute('disabled');
    });

    let idx = 0;

    Array.from(parent.querySelectorAll('.form-field-repeatable-item')).concat(item).forEach((elm) => {
        if (elm.parentNode) {
            idx = Array.from(elm.parentNode.children).indexOf(elm);
        } else {
            idx++;
        }

        elm.querySelectorAll('input[name], select[name], textarea[name]').forEach((input, i) => {
            const id = input.id;
            const name = input.getAttribute('name');

            if (name) {
                input.name = replaceIndexInName(name, idx);
            }

            if (id) {
                input.id = replaceIndexInId(id, idx, i);
            }

            const label = elm.querySelector('label[for="' + id + '"]');

            if (label) {
                label.setAttribute('for', input.id);
            }

            // remove validation classes
            input.classList.remove('form-control-success', 'form-control-error', 'valid', 'invalid');
        });
    });

    // fix radio list state
    parent.querySelectorAll('input[type="radio"][checked]').forEach((input, i) => {
        input.checked = !!input.getAttribute('checked');
    });

    // re-initialise destroyed choices lists
    repeatable.querySelectorAll('joomla-field-fancy-select').forEach((choices) => {
        if (choices.choicesInstance) {
            choices.choicesInstance.init();
        }
    });

    // clear values on new form items
    item.querySelectorAll('input[name], select[name], textarea[name]').forEach((input) => {
        if (input.tagName === 'SELECT') {
            input.querySelectorAll('option[selected]').forEach((opt) => {
                opt.removeAttribute('selected');
            });
            if (input.options.length > 0) {
                input.options[0].selected = true;
            }
        } else {
            input.value = '';
        }

        input.classList.remove('isdirty');
    });

    // add new repeatable
    parent.appendChild(item);

    // dispath for update
    parent.dispatchEvent(new CustomEvent('repeatable:create', { detail: item }));

    fixMediaField(item);

    if (window.SqueezeBox && window.SqueezeBox.assign) {
        const modals = Array.from(item.querySelectorAll('a.modal'));
        window.SqueezeBox.assign(modals, { parse: 'rel' });
    }
};

const setup = () => {
    // add initial click event handler to the repeatable
    document.querySelectorAll('.form-field-repeatable').forEach((ctrl) => {
        ctrl.addEventListener('click', handleClickEvent);

        // update choices select lists
        ctrl.querySelectorAll('joomla-field-fancy-select').forEach((choices) => {
            if (choices.choicesInstance) {
                choices.choicesInstance.init();
            }
        });
    });
};

export default {
    setup
};