/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
// must match the icon class rendered by FiletypeField
const FILE_CLASS_PREFIX = 'wfe-i-file-';

const removeFileClass = function (file) {
    if (!file) {
        return;
    }

    Array.from(file.classList).forEach((className) => {
        if (className.startsWith(FILE_CLASS_PREFIX)) {
            file.classList.remove(className);
        }
    });
};

const setup = function () {

    document.querySelectorAll('.filetype').forEach(function (filetype) {
        const input = filetype.querySelector('input[type="hidden"]');

        // there is one list per filetype group
        const filetypeLists = filetype.querySelectorAll('.filetype-list');

        const serialize = function () {
            const list = [];

            filetypeLists.forEach(function (filetypeList) {
                const checkboxes = filetypeList.querySelectorAll('.filetype-item input[type="checkbox"]');

                // map values as either enabled or disabled
                const v1 = Array.from(checkboxes).map(function (checkbox) {
                    if (!checkbox.checked) {
                        return `-${checkbox.value}`;
                    }
                    return checkbox.value;
                });

                const customInputs = filetypeList.querySelectorAll('.filetype-custom input[type="text"]');

                // map only non-empty values
                const v2 = Array.from(customInputs).filter(function (input) {
                    return input.value !== '';
                }).map(function (input) {
                    return input.value;
                });

                const items = [...v1, ...v2].join(',');

                const groupElement = filetypeList.querySelector('.filetype-group');

                // no group, store the items only
                if (!groupElement) {
                    list.push(items);
                    return;
                }

                let group = groupElement.dataset.filetypeGroup;

                const groupCheckbox = groupElement.querySelector('input[type="checkbox"]');

                // mark group as removed by prepending a dash to the group name
                if (groupCheckbox && !groupCheckbox.checked) {
                    group = `-${group}`;
                }

                list.push(`${group}=${items}`);
            });

            input.value = list.join(';');
            input.classList.add('isdirty');

            // must bubble to reach the delegated form listener
            input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        // global click handler
        filetype.addEventListener('click', function (e) {
            var btn = e.target.closest('.filetype-edit');
            
            if (btn) {
                e.preventDefault();

                const open = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', String(!open));

                filetypeLists.forEach(function (filetypeList) {
                    filetypeList.hidden = open;
                });

                return;
            }

            let item = e.target.closest('.filetype-item');

            if (!item) {
                return;
            }

            if (e.target.closest('.filetype-custom .filetype-clear')) {
                e.preventDefault();

                item.querySelectorAll('input[type="text"]').forEach(function (input) {
                    input.value = '';
                });

                return;
            }

            if (e.target.closest('.filetype-add')) {
                e.preventDefault();

                const clone = item.cloneNode(true);

                // clear clone input value
                clone.querySelector('input[type="text"]').value = '';

                // insert after the current item
                item.after(clone);
                return;
            }

            if (e.target.closest('.filetype-remove')) {
                const parent = item.parentNode;

                // clear the last remaining custom item instead of removing it
                if (item.matches('.filetype-custom') && parent.querySelectorAll('.filetype-custom').length == 1) {
                    const inp = item.querySelector('input[type="text"]');
                    const file = inp.previousElementSibling;
                    // clear values
                    inp.value = '';
                    // remove existing classes
                    removeFileClass(file);
                    // remove item
                } else {
                    item.remove();
                }

                e.preventDefault();
                serialize();

                return;
            }
        });

        filetype.addEventListener('change', (e) => {
            const item = e.target.closest('.filetype-item');

            if (item) {
                // custom values
                if (item.matches('.filetype-custom')) {
                    e.preventDefault();

                    const inp = item.querySelector('input[type="text"]');
                    const file = inp.previousElementSibling;

                    // remove existing classes
                    removeFileClass(file);

                    if (inp.value) {
                        file.classList.add(`${FILE_CLASS_PREFIX}${inp.value}`);
                    }
                }

                serialize();
            }


        });
    });
};

export default {
    setup
};
