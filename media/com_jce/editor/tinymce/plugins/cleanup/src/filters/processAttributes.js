import { isInvalidAttribute, compileInvalidAttrRules } from '../rules/invalidAttributes';
import { isInvalidAttributeValue, compileInvalidAttrValueRules } from '../rules/invalidAttributeValues';

/**
 * @param {tinymce/Editor} editor
 * @param {String} content
 * @param {Boolean} stripInternal Remove data-mce-* attributes, for content loaded off the element
 *                                only. Internal attributes are legitimate everywhere else, eg: an
 *                                undo level restoring media placeholders.
 */
export function processAttributes(editor, content, stripInternal) {
    var invalidAttribRules = editor.getParam('invalid_attributes', '');
    var invalidAttribValueRules = editor.getParam('invalid_attribute_values', '');

    if (!stripInternal && !invalidAttribRules && !invalidAttribValueRules) {
        return content;
    }

    var inert = document.implementation.createHTMLDocument('');
    var doc = inert.createElement('div');
    doc.innerHTML = content;
    var nodes = doc.querySelectorAll('*');
    var i = nodes.length;
    var node;

    var attrRules = [];
    var valueRules = [];

    if (invalidAttribRules) {
        attrRules = compileInvalidAttrRules(invalidAttribRules);
    }

    if (invalidAttribValueRules) {
        valueRules = compileInvalidAttrValueRules(invalidAttribValueRules);
    }

    while (i--) {
        node = nodes[i];

        var nodeName = node.tagName.toLowerCase();
        var attributes = node.attributes || [];
        var x, attrName, attrValue;

        for (x = attributes.length - 1; x >= 0; x--) {
            var attr = attributes[x];

            if (!attr || !attr.name) {
                continue;
            }

            attrName = attr.name.toLowerCase();
            attrValue = node.getAttribute(attrName);

            // remove all internal attributes
            if (stripInternal && attrName.indexOf('data-mce-') === 0) {
                node.removeAttribute(attrName);
                continue;
            }

            if (isInvalidAttribute(attrName, attrRules) ||
                isInvalidAttributeValue(nodeName, attrName, attrValue, valueRules)) {
                node.removeAttribute(attrName);
                node.removeAttribute('data-mce-' + attrName);
            }
        }
    }

    return doc.innerHTML;
}