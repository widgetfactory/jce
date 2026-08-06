function encodeValue(value) {
    const textarea = document.createElement('textarea');
    textarea.textContent = value;

    return textarea.innerHTML;
}

function addChangeEvent(elm) {
    elm.addEventListener('change', (evt) => {
        evt.preventDefault();

        elm = evt.target.closest('.wf-keyvalue');

        // the element may have been removed from the DOM, eg: repeatable:delete
        if (!elm || !elm.parentNode) {
            return;
        }

        const items = [], controls = elm.parentNode.querySelectorAll('.wf-keyvalue');

        controls.forEach((control) => {
            const data = {};

            control.querySelectorAll('input[name]').forEach((input) => {
                const name = input.getAttribute('name');
                const val = input.value;

                // must have "key"
                if (name != '') {
                    // encode and set value
                    data[name] = encodeValue(val);
                }
            });

            items.push(data);
        });

        // update hidden input
        const hiddenInput = elm.parentNode.querySelector('input[name][type="hidden"]');

        if (!hiddenInput) {
            return;
        }

        hiddenInput.value = JSON.stringify(items);

        // trigger for isdirty state change, must bubble to reach the delegated form listener
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

const setup = () => {
    document.querySelectorAll('.wf-keyvalue').forEach((ctrl) => {
        addChangeEvent(ctrl);
        
        ctrl.parentNode.addEventListener('repeatable:create', (evt) => {
            const elm = evt.detail;
            
            addChangeEvent(elm);

            elm.addEventListener('repeatable:delete', (evt) => {
                elm.dispatchEvent(new Event('change'));
            });

            elm.dispatchEvent(new Event('change'));
        });

        ctrl.parentNode.addEventListener('repeatable:delete', (evt) => {
            ctrl.dispatchEvent(new Event('change'));
        });
    });
};

export default {
    setup
};