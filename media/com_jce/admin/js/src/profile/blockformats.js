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
            el.querySelectorAll('input[name]').forEach((input) => {
                input.dispatchEvent(new Event('change'));
            });
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