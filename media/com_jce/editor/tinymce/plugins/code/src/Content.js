const Node = tinymce.html.Node;

/**
 * Create a TinyMCE text node
 * @param {String} value
 * @param {Boolean} raw
 */
function createTextNode(value, raw) {
    var text = new Node('#text', 3);
    text.raw = raw !== false ? true : false;
    text.value = value;
    return text;
}

/**
 * Create a shortcode pre/span. This differs from the code pre as it is still contenteditable.
 * @param {String} data
 * @param {String} tag
 */
function createShortcodeHtml(editor, data, tag) {
    // decode data before re-encoding
    data = editor.dom.decode(data);

    // replace newlines with linebreaks
    data = data.replace(/[\n\r]/gi, '<br />');

    return editor.dom.createHTML(tag || 'pre', {
        'data-mce-code': 'shortcode'
    }, editor.dom.encode(data));
}

/**
 * Create a code pre. This pre is not contenteditable by the editor, and plaintext-only.
 * @param {String} data
 * @param {String} type
 * @param {String} tag
 */
function createHtml(editor, data, type, tag) {
    type = type || 'script';
    tag = tag || 'pre';

    var code_blocks = editor.settings.code_use_blocks !== false;

    // "protect" code if we are not using code blocks
    if (!code_blocks) {
        // convert linebreaks to newlines
        data = data.replace(/<br[^>]*?>/gi, '\n');

        // create placeholder span
        return editor.dom.createHTML('img', {
            src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'data-mce-resize': 'false',
            'data-mce-code': type,
            'data-mce-type': 'placeholder',
            'data-mce-value': escape(data)
        });
    }

    return editor.dom.createHTML(tag, {
        'data-mce-code': type
    }, editor.dom.encode(data));
}

export default { createTextNode, createShortcodeHtml, createHtml };
