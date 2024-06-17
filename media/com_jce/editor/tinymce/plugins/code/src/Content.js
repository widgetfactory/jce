/**
* Create a code pre. This pre is not contenteditable by the editor, and plaintext-only
* @param {String} data
* @param {String} type
* @param {String} tag
*/
function createHtml(editor, data, type, tag) {
    return editor.dom.createHTML(tag || 'pre', {
        'data-mce-code': type || 'script',
        'data-mce-type': 'code'
    }, editor.dom.encode(data));
}

export default {
    createHtml
};