/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
const setup = function () {

    document.querySelectorAll('.filetype').forEach(function (filetype) {
        const input = filetype.querySelector('input[type="hidden"]');

        const filetypeList = filetype.querySelector('.filetype-list');

        const serialize = function () {
            const list = [];

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

            let group = '';
            const groupCheckboxes = filetypeList.querySelectorAll('.filetype-group input[type="checkbox"]');

            Array.from(groupCheckboxes).map(function (checkbox) {
                group = checkbox.closest('.filetype-group').dataset.filetypeGroup;

                // mark group as removed by appending a dash to the group name
                if (!checkbox.checked) {
                    group = `-${group}`;
                }
            });

            const items = [...v1, ...v2].join(',');

            if (group) {
                list.push(`${group}=${items}`);
            } else {
                list.push(items);
            }

            const value = list.join(';');

            input.value = value;
            input.classList.add('isdirty');
            filetype.value = value;
        };

        // global click handler
        filetype.addEventListener('click', function (e) {
            var btn = e.target.closest('.filetype-edit');
            
            if (btn) {
                e.preventDefault();

                const open = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', String(!open));
                filetypeList.hidden = open;

                return;
            }

            let item = e.target.closest('.filetype-item');

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

                // clear values
                if (parent.querySelectorAll('.filetype-custom').length == 1) {
                    const inp = item.querySelector('input[type="text"]');
                    const file = inp.previousElementSibling;
                    // clear values
                    inp.value = '';
                    // remove existing classes
                    Array.from(file.classList).forEach((className) => {
                        if (className.startsWith('mce-i-file-')) {
                            file.classList.remove(className);
                        }
                    });
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
                    Array.from(file.classList).forEach((className) => {
                        if (className.startsWith('mce-i-file-')) {
                            file.classList.remove(className);
                        }
                    });

                    if (inp.value) {
                        file.classList.add(`mce-i-file-${inp.value}`);
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
