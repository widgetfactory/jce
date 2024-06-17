import Content from './Content';

const each = tinymce.each, SaxParser = tinymce.html.SaxParser;
let htmlSchema, xmlSchema, blockElements = [];

function init(editor) {
    htmlSchema = new tinymce.html.Schema({
        schema: 'mixed',
        invalid_elements: editor.settings.invalid_elements
    });

    xmlSchema = new tinymce.html.Schema({
        verify_html: false
    });

    // store block elements from schema map
    each(editor.schema.getBlockElements(), function (block, blockName) {
        blockElements.push(blockName);
    });
}

/**
       * Detect and process shortcode in an html string
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
        html = processSourcerer(html);
    }

    // default to inline span if the tagName is not set. This will be converted to pre by the DomParser if required
    tagName = tagName || 'span';

    // shortcode blocks eg: {article}\nhtml{/article} or inline or single line shortcode, eg: {youtube}https://www.youtube.com/watch?v=xxDv_RTdLQo{/youtube}
    return html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>)?)(?:\{)([\w-]+)(.*?)(?:\/?\})(?:([\s\S]+?)\{\/\4\})?/g, function (match) {
        // already wrapped in a tag
        if (match.charAt(0) === '<') {
            return match;
        }

        return Content.createShortcodeHtml(editor, match, tagName);
    });
}

function processOnInsert(editor, value, node) {
    if (/\{.+\}/gi.test(value) && editor.settings.code_protect_shortcode) {
        var tagName;

        // an empty block container, so insert as <pre>
        /*if (node && ed.dom.isEmpty(node)) {
          tagName = 'pre';
        }*/

        value = processShortcode(value, tagName);
    }

    if (editor.settings.code_allow_custom_xml) {
        value = processXML(editor, value);
    }

    // script / style
    if (/<(\?|script|style)/.test(value)) {
        // process script and style tags
        value = value.replace(/<(script|style)([^>]*?)>([\s\S]*?)<\/\1>/gi, function (match, type) {
            if (!editor.getParam('code_allow_' + type)) {
                return '';
            }

            match = match.replace(/<br[^>]*?>/gi, '\n');

            return Content.createHtml(match, type);
        });

        value = processPhp(editor, value);
    }

    return value;
}

function processSourcerer(editor, html) {
    // quick check to see if we should proceed
    if (html.indexOf('{/source}') === -1) {
        return html;
    }

    // shortcode blocks eg: {source}html{/source}
    return html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>|")?)\{source(.*?)\}([\s\S]+?)\{\/source\}/g, function (match) {
        // already wrapped in a tag
        if (match.charAt(0) === '<' || match.charAt(0) === '"') {
            return match;
        }

        match = editor.dom.decode(match);

        return '<pre data-mce-code="shortcode" data-mce-label="sourcerer">' + editor.dom.encode(match) + '</pre>';
    });
}

function processPhp(editor, content) {
    // Remove PHP if not enabled
    if (!editor.settings.code_allow_php) {
        return content.replace(/<\?(php)?([\s\S]*?)\?>/gi, '');
    }

    // PHP code within an attribute
    content = content.replace(/\="([^"]+?)"/g, function (a, b) {
        b = b.replace(/<\?(php)?(.+?)\?>/gi, function (x, y, z) {
            return '[php:start]' + editor.dom.encode(z) + '[php:end]';
        });

        return '="' + b + '"';
    });

    // PHP code within a textarea
    if (/<textarea/.test(content)) {
        content = content.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/gi, function (a, b, c) {
            c = c.replace(/<\?(php)?(.+?)\?>/gi, function (x, y, z) {
                return '[php:start]' + editor.dom.encode(z) + '[php:end]';
            });
            return '<textarea' + b + '>' + c + '</textarea>';
        });
    }

    // PHP code within an element
    content = content.replace(/<([^>]+)<\?(php)?(.+?)\?>([^>]*?)>/gi, function (a, b, c, d, e) {
        if (b.charAt(b.length) !== ' ') {
            b += ' ';
        }
        return '<' + b + 'data-mce-php="' + d + '" ' + e + '>';
    });

    // PHP code other
    content = content.replace(/<\?(php)?([\s\S]+?)\?>/gi, function (match) {
        // replace newlines with <br /> so they are preserved inside the span
        match = match.replace(/\n/g, '<br />');

        // create code span
        return Content.createHtml(editor, match, 'php', 'span');
    });

    return content;
}

/**
 * Check whether a tag is a defined invalid element
 * @param {String} name
 */
function isInvalidElement(editor, name) {
    var invalid_elements = editor.settings.invalid_elements.split(',');
    return tinymce.inArray(invalid_elements, name) !== -1;
}

/**
 * Check if a tag is an XML element - not part of the HMTL Schema, but is also not a defined invalid element
 * @param {String} name
 */
function isXmlElement(name) {
    return !htmlSchema.isValid(name) && !isInvalidElement(name);
}

/**
 * Validate xml code using a custom SaxParser. This will remove event attributes ir required, and validate nested html using the editor schema.
 * @param {String} xml
 */
function validateXml(editor, xml) {
    var html = [];

    // check that the element or attribute is not invalid
    function isValid(tag, attr) {
        // is an xml tag and is not an invalid_element
        if (isXmlElement(tag)) {
            return true;
        }

        return editor.schema.isValid(tag, attr);
    }

    new SaxParser({
        start: function (name, attrs, empty) {
            if (!isValid(name)) {
                return;
            }

            html.push('<', name);

            var attr;

            if (attrs) {
                for (var i = 0, len = attrs.length; i < len; i++) {
                    attr = attrs[i];

                    if (!isValid(name, attr.name)) {
                        continue;
                    }

                    // skip event attributes
                    if (editor.settings.allow_event_attributes !== true) {
                        if (attr.name.indexOf('on') === 0) {
                            continue;
                        }
                    }

                    html.push(' ', attr.name, '="', editor.dom.encode('' + attr.value, true), '"');
                }
            }

            if (!empty) {
                html[html.length] = '>';
            } else {
                html[html.length] = ' />';
            }
        },

        text: function (value) {
            if (value.length > 0) {
                html[html.length] = value;
            }
        },

        end: function (name) {
            if (!isValid(name)) {
                return;
            }

            html.push('</', name, '>');
        },

        cdata: function (text) {
            html.push('<![CDATA[', text, ']]>');
        },

        comment: function (text) {
            html.push('<!--', text, '-->');
        }
    }, xmlSchema).parse(xml);

    return html.join('');
}

/**
 * Detect and process xml tags
 * @param {String} content
 */
function processXML(editor, content) {
    return content.replace(/<([a-z0-9\-_\:\.]+)(?:[^>]*?)\/?>((?:[\s\S]*?)<\/\1>)?/gi, function (match, tag) {
        // check if svg is allowed
        if (tag === 'svg' && editor.settings.code_allow_svg_in_xml === false) {
            return match;
        }

        // check if mathml is allowed
        if (tag === 'math' && editor.settings.code_allow_mathml_in_xml === false) {
            return match;
        }

        // check if the tags is part of the generic HTML schema, return if true
        if (!isXmlElement(tag)) {
            return match;
        }

        // validate xml by default to remove event attributes and invalid nested html
        if (editor.settings.code_validate_xml !== false) {
            match = validateXml(editor, match);
        }

        return Content.createHtml(editor, match, 'xml');
    });
}

export default {
    init,
    processOnInsert
};