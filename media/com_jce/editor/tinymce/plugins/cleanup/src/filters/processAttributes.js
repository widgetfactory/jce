import { isInvalidAttribute, compileInvalidAttrRules } from '../rules/invalidAttributes';
import { isInvalidAttributeValue, compileInvalidAttrValueRules } from '../rules/invalidAttributeValues';

export function processAttributes(editor, content) {
    var invalidAttribRules = editor.getParam('invalid_attributes', '');
    var invalidAttribValueRules = editor.getParam('invalid_attribute_values', '');

    if (!invalidAttribRules && !invalidAttribValueRules) {
        return content;
    }

    var doc = document.createElement('div');
    doc.innerHTML = content;
    var nodes = doc.querySelectorAll('*');
    var i = nodes.length;
    var node;

    var attrRules = compileInvalidAttrRules(invalidAttribRules);
    var valueRules = compileInvalidAttrValueRules(invalidAttribValueRules);

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

            if (isInvalidAttribute(attrName, attrRules) ||
                isInvalidAttributeValue(nodeName, attrName, attrValue, valueRules)) {
                node.removeAttribute(attrName);
                node.removeAttribute('data-mce-' + attrName);
            }
        }
    }

    return doc.innerHTML;
}