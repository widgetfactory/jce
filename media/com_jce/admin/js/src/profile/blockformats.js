import Sortable from './sortable';

const setup = () => {

    const items = document.querySelectorAll('.blockformats');

    items.forEach((el) => {

        el.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.addEventListener('click', () => {
                el.dispatchEvent(new Event('update'));
            });
        });

        el.addEventListener('update', () => {
            // all checkboxes share the same name, so one bubbling change marks them all as dirty
            const input = el.querySelector('input[name]');

            if (input) {
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        Sortable(el, {
            direction: 'vertical',
            ignore: 'input[type="checkbox"]',
            placeholder: 'sortable-placeholder',
            stop: () => {
                el.dispatchEvent(new Event('update'));
            }
        });
    });

};


export default {
    setup
};