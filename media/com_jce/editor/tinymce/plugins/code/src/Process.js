import Content from './Content';

const each = tinymce.each;

/**
 * Get the state for an editor instance, so editors on the same page do not share a schema
 * @param {Object} editor
 */
function getState(editor) {
    return editor._codeState || { shortEndedElements: {}, booleanAttributes: {} };
}

function init(editor) {
    var state = {
        htmlSchema: new tinymce.html.Schema({
            schema: 'mixed',
            invalid_elements: editor.settings.invalid_elements || ''
        }),
        shortEndedElements: {},
        booleanAttributes: {}
    };

    each(editor.schema.getShortEndedElements(), function (_shortEnded, name) {
        state.shortEndedElements[name.toLowerCase()] = true;
    });

    each(editor.schema.getBoolAttrs(), function (_boolAttr, name) {
        state.booleanAttributes[name.toLowerCase()] = true;
    });

    editor._codeState = state;
}

function canKeepCode(editor, type) {
    if (editor.settings.validate === false) {
        return true;
    }

    return !!editor.getParam('code_allow_' + type);
}

/**
 * Check whether a tag is a defined invalid element
 * @param {Object} editor
 * @param {String} name
 */
function isInvalidElement(editor, name) {
    var invalid_elements = (editor.settings.invalid_elements || '').split(',');
    return tinymce.inArray(invalid_elements, name) !== -1;
}

/**
 * Check if a tag is an XML element - not part of the HTML Schema, but is also not a defined invalid element
 * @param {Object} editor
 * @param {String} name
 */
function isXmlElement(editor, name) {
    var htmlSchema = getState(editor).htmlSchema;

    if (!htmlSchema) {
        return false;
    }

    return !htmlSchema.isValid(name) && !isInvalidElement(editor, name);
}

/**
 * Check that the element or attribute is valid
 * @param {Object} editor
 * @param {String} tag
 * @param {String} attr
 */
function isValid(editor, tag, attr) {
    if (isXmlElement(editor, tag)) {
        return true;
    }

    if (editor.settings.validate === false) {
        return true;
    }

    return editor.schema.isValid(tag, attr);
}

/**
 * Recursively sanitize a DOM node to a string, filtering invalid tags/attributes and event handlers.
 * @param {Object} editor
 * @param {Node} node
 * @param {Boolean} raw
 */
function sanitizeNode(editor, node, raw) {
    const html = [];

    switch (node.nodeType) {
        case 1: {
            const tagName = node.nodeName.toLowerCase();

            // code nested in xml must not bypass the code_allow_* settings
            if (tagName === 'script' || tagName === 'style' || tagName === 'link') {
                if (!canKeepCode(editor, tagName === 'link' ? 'style' : tagName)) {
                    return '';
                }
            }

            if (!isValid(editor, tagName)) {
                return '';
            }

            html.push('<', tagName);

            for (let { name, value } of Array.from(node.attributes)) {
                if (!isValid(editor, tagName, name)) {
                    continue;
                }

                if (!editor.settings.allow_event_attributes && name.startsWith('on')) {
                    continue;
                }

                if (getState(editor).booleanAttributes[name]) {
                    if (value === '' || value === 'true' || value === name) {
                        html.push(' ', name);
                        continue;
                    }
                }

                html.push(' ', name, '="', editor.dom.encode(value, true), '"');
            }

            if (getState(editor).shortEndedElements[tagName]) {
                if (editor.settings.schema === 'html5-strict') {
                    html.push('>');
                } else {
                    html.push(' />');
                }
            } else {
                html.push('>');

                for (let child of Array.from(node.childNodes)) {
                    html.push(sanitizeNode(editor, child, raw));
                }

                html.push('</', tagName, '>');
            }

            break;
        }

        case 3: {
            var text = node.nodeValue;
            text = raw ? text : editor.dom.encode(text, true);
            html.push(text);
            break;
        }

        case 5: {
            html.push('<![CDATA[', editor.dom.encode(node.nodeValue, true), ']]>');
            break;
        }

        case 8: {
            html.push('<!--', editor.dom.encode(node.nodeValue, true), '-->');
            break;
        }
    }

    return html.join('');
}

/**
 * Validate xml code using DOMParser. Removes event attributes if required, and validates nested html using the editor schema.
 * @param {Object} editor
 * @param {String} xml
 */
function validateXml(editor, xml) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'text/xml');

    // malformed xml produces a parsererror document, which must not be treated as content
    if (!doc.documentElement || doc.getElementsByTagName('parsererror').length) {
        return null;
    }

    return sanitizeNode(editor, doc.documentElement, true);
}

/**
 * Detect and process xml tags
 * @param {Object} editor
 * @param {String} content
 */
function processXML(editor, content) {
    return content.replace(/<([a-z0-9\-_\:\.]+)(?:[^>]*?)\/?>((?:[\s\S]*?)<\/\1>)?/gi, function (match, tag) {
        tag = tag.toLowerCase();

        if (tag === 'svg' && editor.settings.code_allow_svg_in_xml === false) {
            return match;
        }

        if (tag === 'math' && editor.settings.code_allow_mathml_in_xml === false) {
            return match;
        }

        if (!isXmlElement(editor, tag)) {
            return match;
        }

        if (editor.settings.code_validate_xml !== false) {
            var validated = validateXml(editor, match);

            // leave malformed xml for the html sanitizer
            if (validated === null) {
                return match;
            }

            match = validated;
        }

        return Content.createHtml(editor, match, 'xml');
    });
}

/**
 * Detect and process sourcerer shortcode
 * @param {Object} editor
 * @param {String} html
 */
function processSourcerer(editor, html) {
    if (html.indexOf('{/source}') === -1) {
        return html;
    }

    return html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>|")?)\{source(.*?)\}([\s\S]+?)\{\/source\}/g, function (match) {
        if (match.charAt(0) === '<' || match.charAt(0) === '"') {
            return match;
        }

        match = editor.dom.decode(match);

        return '<pre data-mce-code="shortcode" data-mce-label="sourcerer">' + editor.dom.encode(match) + '</pre>';
    });
}

/**
 * Detect and process shortcode in an html string
 * @param {Object} editor
 * @param {String} html
 * @param {String} tagName
 */
function processShortcode(editor, html, tagName) {
    // quick check to see if we should proceed
    if (html.indexOf('{') === -1) {
        return html;
    }

    // skip stuff like {1} etc.
    if (html.charAt(0) == '{' && html.length < 3) {
        return html;
    }

    // process as sourcerer
    if (html.indexOf('{/source}') != -1) {
        html = processSourcerer(editor, html);
    }

    // default to inline span if the tagName is not set. This will be converted to pre by the DomParser if required
    tagName = tagName || 'span';

    // Temporarily protect shortcodes inside attribute values so they are not processed.
    // The token is randomised so it cannot be forged by the content itself.
    var attrPlaceholders = [];
    var token = '__shortcode_attr_' + Math.random().toString(36).slice(2) + '_';

    html = html.replace(/=("[^"]*\{[^"]*"|'[^']*\{[^']*')/g, function (match) {
        attrPlaceholders.push(match);
        return '="' + token + (attrPlaceholders.length - 1) + '__"';
    });

    // shortcode blocks eg: {article}\nhtml{/article} or inline or single line shortcode, eg: {youtube}https://www.youtube.com/watch?v=xxDv_RTdLQo{/youtube}
    html = html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>)?)(?:\{)([\w-]+)(.*?)(?:\/?\})(?:([\s\S]+?)\{\/\4\})?/g, function (match) {
        // already wrapped in a tag
        if (match.charAt(0) === '<') {
            return match;
        }

        return Content.createShortcodeHtml(editor, match, tagName);
    });

    // Restore protected attribute values
    if (attrPlaceholders.length) {
        html = html.replace(new RegExp('="' + token + '(\\d+)__"', 'g'), function (match, index) {
            index = parseInt(index, 10);

            // only restore a value we stored
            return index < attrPlaceholders.length ? attrPlaceholders[index] : match;
        });
    }

    return html;
}

/**
 * Detect and process PHP code in an html string
 * @param {Object} editor
 * @param {String} content
 */
function processPhp(editor, content) {
    if (!canKeepCode(editor, 'php')) {
        return content.replace(/<\?(php)?([\s\S]*?)\?>/gi, '');
    }

    // PHP code within an attribute
    content = content.replace(/\="([^"]+?)"/g, function (_a, b) {
        b = b.replace(/<\?(php)?(.+?)\?>/gi, function (_x, _y, z) {
            return '__php_start__' + editor.dom.encode(z) + '__php_end__';
        });

        return '="' + b + '"';
    });

    // PHP code within a textarea
    if (/<textarea/.test(content)) {
        content = content.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/gi, function (_a, b, c) {
            c = c.replace(/<\?(php)?(.+?)\?>/gi, function (_x, _y, z) {
                return '__php_start__' + editor.dom.encode(z) + '__php_end__';
            });
            return '<textarea' + b + '>' + c + '</textarea>';
        });
    }

    // PHP code within an element
    content = content.replace(/<([^>]+)<\?(php)?(.+?)\?>([^>]*?)>/gi, function (_a, b, _c, d, e) {
        if (b.charAt(b.length) !== ' ') {
            b += ' ';
        }
        return '<' + b + 'data-mce-php="' + d + '" ' + e + '>';
    });

    // PHP code other
    content = content.replace(/<\?(php)?([\s\S]+?)\?>/gi, function (match) {
        match = match.replace(/\n/g, '<br />');
        return Content.createHtml(editor, match, 'php');
    });

    return content;
}

/**
 * Process content on insert (paste or programmatic insert)
 * @param {Object} editor
 * @param {String} value
 * @param {Node} node
 */
function processOnInsert(editor, value, _node) {
    if (/\{.+\}/gi.test(value) && editor.settings.code_protect_shortcode) {
        var tagName;
        value = processShortcode(editor, value, tagName);
    }

    // process custom xml if enabled, otherwise it will be removed by the parser
    if (canKeepCode(editor, 'custom_xml')) {
        value = processXML(editor, value);
    }

    // script / style
    if (/<(\?|script|style)/.test(value)) {
        // process script and style tags, remove if not allowed
        value = value.replace(/<(script|style)([^>]*?)>([\s\S]*?)<\/\1>/gi, function (match, type) {
            if (!canKeepCode(editor, type)) {
                return '';
            }

            match = match.replace(/<br[^>]*?>/gi, '\n');

            return Content.createHtml(editor, match, type);
        });

        value = processPhp(editor, value);
    }

    // link[rel="stylesheet"]
    if (/<link[^>]*?rel="stylesheet"[^>]*?>/gi.test(value)) {
        value = value.replace(/<link[^>]*?rel="stylesheet"[^>]*?>/gi, function (match) {
            if (!canKeepCode(editor, 'style')) {
                return '';
            }

            return Content.createHtml(editor, match, 'link');
        });
    }

    return value;
}

export default {
    init,
    processOnInsert,
    processShortcode,
    processPhp,
    processXML
};
