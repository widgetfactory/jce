/* global ibis */

var DOM = ibis.DOM;

/**
 * Get or create the wf-editor-header container for a textarea element
 * @param {node} element The textarea element
 * @returns {node} The header element
 */
function create(element) {
    var header = DOM.getPrev(element, '.wf-editor-header');

    if (!header) {
        var container = DOM.create('div', {
            'class': 'editor wf-editor-container'
        }, '<div class="wf-editor-header"></div>');

        element.parentNode.insertBefore(container, element);
        DOM.add(container, element);

        header = container.firstChild;
    }

    return header;
}

export default {
    create
};
