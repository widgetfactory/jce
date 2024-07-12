var DOM = tinymce.DOM;

function create(element) {
    // get header
    var header = DOM.getPrev(element, '.wf-editor-header');

    // create it if it doesn't exist (K2, WidgetKit etc.)
    if (!header) {
        var container = DOM.create('div', {
            'class': 'editor wf-editor-ui wf-editor-container'
        }, '<div class="wf-editor-header"></div>');

        // add container before textarea
        element.parentNode.insertBefore(container, element);

        // add element to container
        DOM.add(container, element);

        // set header
        var header = container.firstChild;
    }

    return header;
}

export default {
    create
};