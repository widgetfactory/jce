import Sortable from './sortable';

const previewStyles = ['fontFamily', 'fontSize', 'fontWeight', 'textDecoration', 'textTransform', 'color', 'backgroundColor'];

// camelcase style - from JQuery 1.10.2 - http://code.jquery.com/jquery-1.10.2.js
const camelCase = (str) => {
    return str.replace(/^-ms-/, "ms-").replace(/-([\da-z])/gi, function (all, letter) {
        return letter.toUpperCase();
    });
};

/**
 * Update title styles
 * @param {type} n
 * @param {type} string
 * @returns {undefined}
 */
const updateStyles = (n, string) => {
    // validate style
    if (!/\s*([^:]+):\s*([^;]+);?/.test(string)) {
        return;
    }

    string.split(';').forEach((str) => {
        const [key, value] = str.trim().split(':');

        if (key && value) {
            const trimmedKey = key.trim();
            const trimmedValue = value.trim();

            if (previewStyles.includes(camelCase(trimmedKey))) {
                n.style[trimmedKey] = trimmedValue;
            }
        }
    });
};

const manageClickEvent = (e) => {
    e.preventDefault();

    const parent = e.target.closest('.styleformat-list');

    const trashElm = e.target.closest('.styleformat-item-trash');
    const addElm = e.target.closest('.styleformat-item-plus');

    if (trashElm) {
        // if there is only one item, clear and hide
        const styleformatList = parent.querySelectorAll('.styleformat');

        const elm = trashElm.closest('.styleformat');

        if (styleformatList.length === 1) {
            // clear inputs and remove styles
            elm.querySelectorAll('input, select').forEach((input) => {
                input.value = '';
                input.removeAttribute('style');
            });
        } else {
            elm.remove();
        }

        parent.dispatchEvent(new Event('update'));
    }

    if (addElm) {
        const item = addElm.previousElementSibling;

        if (!item) {
            return;
        }

        const clone = item.cloneNode(true);
        addElm.before(clone);

        // trigger collapse
        clone.classList.add('styleformat-collapse');

        // clear inputs and remove styles
        clone.querySelectorAll('input, select').forEach((input) => {
            input.value = '';
            input.removeAttribute('style');

            // remove classes
            Array.from(input.classList).forEach((className) => {
                if (className.startsWith('stc_')) {
                    input.classList.remove(className);
                }
            });
        });

        // focus first input (title)
        const firstInput = clone.querySelector('input');

        if (firstInput) {
            firstInput.focus();
        }
    }

    // create collapsible action
    const collapse = e.target.closest('.collapse');

    if (collapse) {
        e.preventDefault();
        collapse.closest('.styleformat').classList.toggle('styleformat-collapse');
    }
};

const setup = () => {
    let init = true;

    const styleformatList = document.querySelector('.styleformat-list');

    if (!styleformatList) {
        return;
    }

    Sortable(styleformatList, {
        direction: 'vertical',
        handle: '.styleformat-item-handle',
        placeholder: 'sortable-placeholder',
        init: (e) => {
            if (styleformatList.querySelectorAll('.styleformat').length < 2) {
                e.state = false;
            }
        },
        stop: () => {
            styleformatList.dispatchEvent(new Event('update'));
        }
    });

    styleformatList.addEventListener('click', manageClickEvent);

    styleformatList.addEventListener('update', () => {
        const list = [];
        let value = '';

        if (init) {
            return;
        }

        // get each styleformat item
        styleformatList.querySelectorAll('.styleformat').forEach((item) => {
            const data = {};
            let x = 0;

            // only proceed if title set and at least one other value of element, class or style
            const titleInput = item.querySelector('.styleformat-item-title input');

            if (titleInput && titleInput.value) {
                // get all values in sequence and encode
                item.querySelectorAll('input[type="text"], select').forEach((input) => {
                    const keyElement = input.closest('[data-key]');

                    if (!keyElement) {
                        return;
                    }

                    const key = keyElement.dataset.key;
                    const val = input.value;

                    if (val !== '') {
                        // count keys to make sure we have at least one
                        if (key == 'element' || key == 'classes' || key == 'styles' || key == 'attributes') {
                            x++;
                        }

                        data[key] = val;
                    }
                });
            }

            // check if empty, convert to string
            if (x > 0 && Object.keys(data).length) {
                list.push(data);
            }
        });

        if (list.length) {
            value = JSON.stringify(list);
        }

        // serialize and return
        const hiddenInput = styleformatList.querySelector('input[type="hidden"]');

        if (hiddenInput) {
            hiddenInput.value = value;
            // must bubble to reach the delegated form listener
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    styleformatList.addEventListener('change', (e) => {
        // the update below writes to the hidden input and re-dispatches "change", so ignore it here
        if (e.target.matches('input[type="hidden"]')) {
            return;
        }

        styleformatList.dispatchEvent(new Event('update'));

        if (e.target.matches('input[type="text"], select')) {
            const input = e.target;
            const styleformat = input.closest('.styleformat');
            const keyElement = input.closest('[data-key]');

            if (!styleformat || !keyElement) {
                return;
            }

            const title = styleformat.querySelector('.styleformat-item-title input');

            if (!title) {
                return;
            }

            const key = keyElement.dataset.key;
            const val = input.value;

            if (key === 'element') {
                // remove classes
                Array.from(title.classList).forEach((className) => {
                    if (className.startsWith('stc_')) {
                        title.classList.remove(className);
                    }
                });

                if (/^(h[1-6]|em|strong|code|sub|sup)$/.test(val)) {
                    title.classList.add('stc_' + val);
                }
            }

            if (key === 'styles') {
                title.setAttribute('style', '');
                updateStyles(title, val); // assuming updateStyles is defined elsewhere
            }
        }
    });

    styleformatList.dispatchEvent(new Event('change'));

    // hide all
    const styleformats = styleformatList.querySelectorAll('.styleformat');

    if (styleformats.length > 1) {
        styleformats.forEach((styleformat) => {
            styleformat.classList.add('styleformat-collapse');
        });
    }

    // set init flag false
    init = false;

    // update if there is more than 1 input, ie: conversion of legacy theme_advanced_styles
    const hiddenInputs = styleformatList.querySelectorAll('input[type="hidden"]');

    if (hiddenInputs.length > 1) {
        styleformatList.dispatchEvent(new Event('update'));
    }
};

export default {
    setup
};