import { isInvalidAttribute, compileInvalidAttrRules } from '../rules/invalidAttributes';
import { isInvalidAttributeValue, compileInvalidAttrValueRules } from '../rules/invalidAttributeValues';

function removeInternalAttributes(root) {
    var nodes = root.querySelectorAll('*');
    var i = nodes.length;

    while (i--) {
        var attributes = nodes[i].attributes;
        var x = attributes.length;

        while (x--) {
            if (attributes[x].name.toLowerCase().indexOf('data-mce-') === 0) {
                nodes[i].removeAttribute(attributes[x].name);
            }
        }

        // template content is a separate fragment that querySelectorAll does not reach
        if (nodes[i].content && nodes[i].nodeName === 'TEMPLATE') {
            removeInternalAttributes(nodes[i].content);
        }
    }
}

/**
 * Remove data-mce-* attributes from content loaded off the element, before any plugin adds its own
 * @param {String} content
 */
export function stripInternalAttributes(content) {
    if (!/data-mce-/i.test(content)) {
        return content;
    }

    // protect php from the dom round trip, where it would become a comment
    var php = [];
    var token = '__ibis_php_' + Math.random().toString(36).slice(2) + '_';

    content = content.replace(/<\?(php)?[\s\S]*?\?>/gi, function (match) {
        // the browser ends a <? comment at the first >, so php must not shield markup from the strip
        if (/data-mce-/i.test(match)) {
            return match;
        }

        php.push(match);
        return token + (php.length - 1) + '__';
    });

    var inert = document.implementation.createHTMLDocument('');
    var doc = inert.createElement('div');
    doc.innerHTML = content;

    removeInternalAttributes(doc);

    content = doc.innerHTML;

    if (php.length) {
        // a token used as an attribute name is serialized with an empty value
        content = content.replace(new RegExp(token + '(\\d+)__(="")?', 'g'), function (match, index) {
            index = parseInt(index, 10);
            return index < php.length ? php[index] : match;
        });
    }

    return content;
}

/**
 * @param {ibis/Editor} editor
 * @param {String} content
 */
export function processAttributes(editor, content) {
    var invalidAttribRules = editor.getParam('invalid_attributes', '');
    var invalidAttribValueRules = editor.getParam('invalid_attribute_values', '');

    if (!invalidAttribRules && !invalidAttribValueRules) {
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

            if (isInvalidAttribute(attrName, attrRules) ||
                isInvalidAttributeValue(nodeName, attrName, attrValue, valueRules)) {
                node.removeAttribute(attrName);
                node.removeAttribute('data-mce-' + attrName);
            }
        }
    }

    return doc.innerHTML;
}