import Sortable from './sortable';

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

function handleEvent(e) {
    const parent = e.target.closest('.fontlist');

    // add font
    if (e.target.closest('.font-item-plus')) {
        const el = e.target.closest('.font-item-plus');

        let clone = el.previousElementSibling.cloneNode(true);

        // remove all input values and add event listeners
        clone.querySelectorAll('input[type="text"]').forEach((input) => {
            input.value = '';
            input.addEventListener('change', handleEvent);
        });

        // insert the clone before the plus
        el.parentNode.insertBefore(clone, el);

        e.preventDefault();

        return true;
    }

    // remove font
    if (e.target.closest('.font-item-trash')) {
        const el = e.target.closest('.font-item');

        if (el) {
            // find all items with input[type="text"] children
            let siblings = parent.querySelectorAll('.font-item');
            const editables = [...siblings].filter(item => item.querySelector('input[type="text"]'));

            // if there is more than one font item, remove the current one
            if (editables.length > 1) {
                el.remove();
            // otherwise, clear the input values
            } else {
                el.querySelectorAll('input[type="text"]').forEach((input) => {
                    input.value = '';
                });
            }

            parent.dispatchEvent(new Event('fontlist:update'));
        }

        e.preventDefault();

        return true;
    }

    if (e.target.closest('input[type="checkbox"],input[type="text"]')) {
        parent.dispatchEvent(new Event('fontlist:update'));
    }
}

const setup = () => {
    document.querySelectorAll('.fontlist').forEach((el) => {
        el.addEventListener('click', handleEvent);

        el.querySelectorAll('input[type="text"]').forEach((input) => {
            input.addEventListener('change', handleEvent);
        });

        el.addEventListener('fontlist:update', () => {
            const data = [];
            let value = '';

            el.querySelectorAll('.font-item').forEach((fontItem) => {
                const obj = {};
                let key, font;

                // custom values
                const [keyInput, valInput] = fontItem.querySelectorAll('input[type="text"]');

                if (keyInput && valInput) {
                    key = keyInput.value;
                    font = valInput.value;

                    if (key && font) {
                        obj[key] = font;
                    }
                }

                // default values
                let values = '';

                const input = fontItem.querySelector('input[type="checkbox"]:checked');

                if (input) {
                    values = input.value;
                }

                if (values) {
                    [key, font] = values.split('=');

                    if (key && font) {
                        obj[key] = font;
                    }
                }

                if (!isEmptyObject(obj)) {
                    data.push(obj);
                }
            });

            if (data.length) {
                value = JSON.stringify(data);
            }

            const hiddenInput = el.querySelector('input[type="hidden"]');

            if (!hiddenInput) {
                return;
            }

            hiddenInput.value = value;
            // trigger for isdirty state change, must bubble to reach the delegated form listener
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        });

        Sortable(el, {
            direction: 'vertical',
            filter: '.font-item',
            ignore: 'input,.btn',
            placeholder: 'sortable-placeholder',
            stop: (e) => {
                el.dispatchEvent(new Event('fontlist:update'));
            }
        });
    });
};

export default {
    setup
};  