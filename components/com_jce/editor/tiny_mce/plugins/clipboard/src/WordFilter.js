import * as Utils from './Utils';

var each = tinymce.each,
    Schema = tinymce.html.Schema,
    DomParser = tinymce.html.DomParser,
    Serializer = tinymce.html.Serializer,
    Node = tinymce.html.Node;

// Open Office
var ooRe = /(Version:[\d\.]+)\s*?((Start|End)(HTML|Fragment):[\d]+\s*?){4}/;

var parseCssToRules = function (content) {
    var doc = document.implementation.createHTMLDocument(""),
        styleElement = document.createElement("style");

    styleElement.textContent = content;

    doc.body.appendChild(styleElement);

    return styleElement.sheet.cssRules;
};

function cleanCssContent(content) {
    var classes = [],
        rules = parseCssToRules(content);

    each(rules, function (r) {
        if (r.selectorText) {
            each(r.selectorText.split(','), function (v) {
                v = v.replace(/^\s*|\s*$|^\s\./g, "");

                // Is internal or it doesn't contain a class
                if (/\.mso/i.test(v) || !/\.[\w\-]+$/.test(v)) {
                    return;
                }

                var text = r.cssText || "";

                if (!text) {
                    return;
                }

                if (tinymce.inArray(classes, text) === -1) {
                    classes.push(text);
                }
            });
        }
    });

    return classes.join("");
}

function isWordContent(editor, content) {
    // force word cleanup
    if (editor.settings.clipboard_paste_force_cleanup) {
        return true;
    }

    // Open / Libre Office
    if (/(content=\"OpenOffice.org[^\"]+\")/i.test(content) || ooRe.test(content) || /@page {/.test(content)) {
        return true; // Mark the pasted contents as word specific content
    }

    // Word
    return (
        (/<font face="Times New Roman"|class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i).test(content) ||
        (/class="OutlineElement/).test(content) ||
        (/id="?docs\-internal\-guid\-/.test(content))
    );
}

/**
 * Checks if the specified text starts with "1. " or "a. " etc.
 */
function isNumericList(text) {
    var found = "",
        patterns;

    patterns = {
        'uppper-roman': /^[IVXLMCD]{1,2}\.[ \u00a0]/,
        'lower-roman': /^[ivxlmcd]{1,2}\.[ \u00a0]/,
        'upper-alpha': /^[A-Z]{1,2}[\.\)][ \u00a0]/,
        'lower-alpha': /^[a-z]{1,2}[\.\)][ \u00a0]/,
        'numeric': /^[0-9]+\.[ \u00a0]/,
        'japanese': /^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/,
        'chinese': /^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/
    };

    /*patterns = [
        /^[IVXLMCD]{1,2}\.[ \u00a0]/, // Roman upper case
        /^[ivxlmcd]{1,2}\.[ \u00a0]/, // Roman lower case
        /^[a-z]{1,2}[\.\)][ \u00a0]/, // Alphabetical a-z
        /^[A-Z]{1,2}[\.\)][ \u00a0]/, // Alphabetical A-Z
        /^[0-9]+\.[ \u00a0]/, // Numeric lists
        /^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/, // Japanese
        /^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/ // Chinese
    ];*/

    text = text.replace(/^[\u00a0 ]+/, '');

    each(patterns, function (pattern, type) {
        if (pattern.test(text)) {
            found = type;
            return false;
        }
    });

    return found;
}

function isBulletList(text) {
    return /^[\s\u00a0]*[\u2022\u00b7\u00a7\u25CF]\s*/.test(text);
}

function WordFilter(editor, content) {
    var settings = editor.settings;

    var keepStyles, removeStyles, validStyles = {};

    // Chrome...
    content = content.replace(/<meta([^>]+)>/, '');

    // remove styles
    content = content.replace(/<style([^>]*)>([\w\W]*?)<\/style>/gi, function (match, attr, value) {
        // remove style tag
        if (settings.clipboard_paste_keep_word_styles !== true) {
            return "";
        }

        // process to remove mso junk
        value = cleanCssContent(value);

        return '<style' + attr + '>' + value + '</style>';
    });
    // Copy paste from Java like Open Office will produce this junk on FF
    content = content.replace(/Version:[\d.]+\nStartHTML:\d+\nEndHTML:\d+\nStartFragment:\d+\nEndFragment:\d+/gi, '');

    // Open Office
    //content = content.replace(ooRe, '', 'g');

    // Remove google docs internal guid markers
    content = content.replace(/<b[^>]+id="?docs-internal-[^>]*>/gi, '');
    content = content.replace(/<br class="?Apple-interchange-newline"?>/gi, '');

    // styles to keep
    keepStyles = settings.clipboard_paste_retain_style_properties;
    // styles to remove
    removeStyles = settings.clipboard_paste_remove_style_properties;

    // split to array if string
    if (keepStyles && tinymce.is(keepStyles, 'string')) {
        var styleProps = tinymce.explode(keepStyles);

        each(styleProps, function (style, i) {
            if (style === "border") {
                // add expanded border styles
                styleProps = styleProps.concat(Utils.borderStyles);
                return true;
            }
        });
    }

    // split to array if string
    if (removeStyles && tinymce.is(removeStyles, 'string')) {
        var removeProps = tinymce.explode(removeStyles);

        each(removeProps, function (style, i) {
            if (style === "border") {
                // add expanded border styles
                removeProps = removeProps.concat(Utils.borderStyles);
                return true;
            }
        });

        // remove from core styleProps array
        styleProps = tinymce.grep(styleProps, function (prop) {
            return tinymce.inArray(removeProps, prop) === -1;
        });
    }

    each(styleProps, function (style) {
        // add all border styles if "border" is set
        if (style === "border") {
            each(Utils.borderStyles, function (name) {
                validStyles[name] = {};
            });

            return true;
        }

        validStyles[style] = {};
    });

    // remove valid styles if we are removing all styles
    if (editor.getParam('clipboard_paste_remove_styles', 1)) {
        validStyles = {};
    }

    /**
     * Converts fake bullet and numbered lists to real semantic OL/UL.
     *
     * @param {tinymce.html.Node} node Root node to convert children of.
     */
    function convertFakeListsToProperLists(node) {
        var currentListNode, prevListNode, lastLevel = 1;

        function getText(node) {
            var txt = '';

            if (node.type === 3) {
                return node.value;
            }

            if ((node = node.firstChild)) {
                do {
                    txt += getText(node);
                } while ((node = node.next));
            }

            return txt;
        }

        function trimListStart(node, regExp) {
            if (node.type === 3) {
                if (regExp.test(node.value)) {
                    node.value = node.value.replace(regExp, '');
                    return false;
                }
            }

            if ((node = node.firstChild)) {
                do {
                    if (!trimListStart(node, regExp)) {
                        return false;
                    }
                } while ((node = node.next));
            }

            return true;
        }

        function removeIgnoredNodes(node) {
            if (node._listIgnore) {
                node.remove();
                return;
            }

            if ((node = node.firstChild)) {
                do {
                    removeIgnoredNodes(node);
                } while ((node = node.next));
            }
        }

        function convertParagraphToLi(paragraphNode, listName, start, type) {
            var level = paragraphNode._listLevel || lastLevel;

            // Handle list nesting
            if (level != lastLevel) {
                if (level < lastLevel) {
                    // Move to parent list
                    if (currentListNode) {
                        currentListNode = currentListNode.parent.parent;
                    }
                } else {
                    // Create new list
                    prevListNode = currentListNode;
                    currentListNode = null;
                }
            }

            if (!currentListNode || currentListNode.name != listName) {
                prevListNode = prevListNode || currentListNode;
                currentListNode = new Node(listName, 1);

                // add list style if any
                if (type && /roman|alpha/.test(type)) {
                    var style = 'list-style-type:' + type;
                    currentListNode.attr({
                        'style': style,
                        'data-mce-style': style
                    });
                }

                if (start > 1) {
                    currentListNode.attr('start', '' + start);
                }

                paragraphNode.wrap(currentListNode);
            } else {
                currentListNode.append(paragraphNode);
            }

            paragraphNode.name = 'li';

            // Append list to previous list if it exists
            if (level > lastLevel && prevListNode) {
                prevListNode.lastChild.append(currentListNode);
            }

            lastLevel = level;

            // Remove start of list item "1. " or "&middot; " etc
            removeIgnoredNodes(paragraphNode);
            trimListStart(paragraphNode, /^\u00a0+/);

            if (currentListNode.name === "ol") {
                trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
            }

            if (currentListNode.name === "ul") {
                trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
            }

            trimListStart(paragraphNode, /^\u00a0+/);
        }

        // Build a list of all root level elements before we start
        // altering them in the loop below.
        var elements = [],
            child = node.firstChild;

        while (typeof child !== 'undefined' && child !== null) {
            elements.push(child);

            child = child.walk();

            if (child !== null) {
                while (typeof child !== 'undefined' && child.parent !== node) {
                    child = child.walk();
                }
            }
        }

        for (var i = 0; i < elements.length; i++) {
            node = elements[i];

            if (node.name == 'p' && node.firstChild) {
                // Find first text node in paragraph
                var nodeText = getText(node),
                    type;

                // Detect unordered lists look for bullets
                if (isBulletList(nodeText)) {
                    convertParagraphToLi(node, 'ul');
                    continue;
                }

                // Detect ordered lists 1., a. or ixv.
                if (node.attr('data-mce-word-list')) {

                    // remove marker
                    node.attr('data-mce-word-list', null);

                    if ((type = isNumericList(nodeText))) {
                        // Parse OL start number
                        var matches = /([0-9]+)\./.exec(nodeText);
                        var start = 1;
                        if (matches) {
                            start = parseInt(matches[1], 10);
                        }

                        convertParagraphToLi(node, 'ol', start, type);
                        continue;
                    }
                }

                // Convert paragraphs marked as lists but doesn't look like anything
                if (node._listLevel) {
                    convertParagraphToLi(node, 'ul', 1);
                    continue;
                }

                currentListNode = null;
            } else {
                // If the root level element isn't a p tag which can be
                // processed by convertParagraphToLi, it interrupts the
                // lists, causing a new list to start instead of having
                // elements from the next list inserted above this tag.
                prevListNode = currentListNode;
                currentListNode = null;
            }
        }
    }

    function filterStyles(node, styleValue) {
        var outputStyles = {},
            matches, styles = editor.dom.parseStyle(styleValue);

        each(styles, function (value, name) {
            // Convert various MS styles to W3C styles
            switch (name) {
                case 'mso-list':
                    // Parse out list indent level for lists
                    matches = /\w+ \w+([0-9]+)/i.exec(styleValue);
                    if (matches) {
                        node._listLevel = parseInt(matches[1], 10);
                    }

                    // Remove these nodes <span style="mso-list:Ignore">o</span>
                    // Since the span gets removed we mark the text node and the span
                    if (/Ignore/i.test(value) && node.firstChild) {
                        node._listIgnore = true;
                        node.firstChild._listIgnore = true;
                    }

                    break;

                case "horiz-align":
                    name = "text-align";
                    break;

                case "vert-align":
                    name = "vertical-align";
                    break;

                case "font-color":
                case "mso-foreground":
                case "color":
                    name = "color";

                    // remove "windowtext"
                    if (value == "windowtext") {
                        value = "";
                    }

                    break;

                case "mso-background":
                case "mso-highlight":
                    name = "background";
                    break;

                case "font-weight":
                case "font-style":
                    if (value == "normal") {
                        value = "";
                    }

                    break;

                case "mso-element":
                    // Remove track changes code
                    if (/^(comment|comment-list)$/i.test(value)) {
                        node.remove();
                        return;
                    }

                    break;

                case "margin-left":
                    if (node.name === "p" && settings.paste_convert_indents !== false) {
                        var indentValue = parseInt(editor.settings.indentation, 10);
                        value = parseInt(value, 10);

                        // convert to an indent value, must be greater than 0
                        value = Math.round(value / indentValue) * indentValue;

                        // store value and remove
                        if (value) {
                            node.attr('data-mce-indent', "" + value);
                            value = "";
                        }
                    }
                    break;
            }

            if (name.indexOf('mso-comment') === 0) {
                node.remove();
                return;
            }

            // Never allow mso- prefixed names
            if (name.indexOf('mso-') === 0) {
                return;
            }

            // convert to pixel values
            if (value && tinymce.inArray(Utils.pixelStyles, name) !== -1) {
                value = Utils.convertToPixels(value);
            }

            // Output only valid styles
            if (validStyles[name]) {
                outputStyles[name] = value;
            }
        });

        // Convert bold style to "b" element
        if (/(bold)/i.test(outputStyles["font-weight"])) {
            delete outputStyles["font-weight"];
            node.wrap(new Node("b", 1));
        }

        // Convert italic style to "i" element
        if (/(italic)/i.test(outputStyles["font-style"])) {
            delete outputStyles["font-style"];
            node.wrap(new Node("i", 1));
        }

        // Serialize the styles and see if there is something left to keep
        outputStyles = editor.dom.serializeStyle(outputStyles, node.name);

        if (outputStyles) {
            return outputStyles;
        }

        return null;
    }

    if (settings.paste_enable_default_filters === false) {
        return content;
    }

    // Remove basic Word junk
    content = Utils.filter(content, [
        // Word comments like conditional comments etc
        /<!--[\s\S]+?-->/gi,

        // Remove comments, scripts (e.g., msoShowComment), XML tag, VML content,
        // MS Office namespaced tags, and a few other tags
        /<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|meta|link|style|\w:\w+)(?=[\s\/>]))[^>]*>/gi,

        // Convert <s> into <strike> for line-though
        [/<(\/?)s>/gi, "<$1strike>"],

        // Replace nsbp entites to char since it's easier to handle
        [/&nbsp;/gi, "\u00a0"],

        // Convert <span style="mso-spacerun:yes">___</span> to string of alternating
        // breaking/non-breaking spaces of same length
        [/<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi,
            function (str, spaces) {
                return (spaces.length > 0) ?
                    spaces.replace(/./, " ").slice(Math.floor(spaces.length / 2)).split("").join("\u00a0") : "";
            }
        ]
    ]);

    // replace <u> and <strike> with styles
    if (settings.inline_styles) {
        content = content.replace(/<(u|strike)>/gi, function (match, node) {
            var value = (node === "u") ? "underline" : "line-through";
            return '<span style="text-decoration:' + value + ';">';
        });

        content = content.replace(/<\/(u|strike)>/g, '</span>');
    }

    // cleanup table border
    content = content.replace(/<table([^>]+)>/, function ($1, $2) {

        if (settings.schema !== "html4") {
            $2 = $2.replace(/(border|cell(padding|spacing))="([^"]+)"/gi, '');
        }

        return '<table' + $2 + '>';
    });

    // remove double linebreaks (IE issue?)
    if (settings.forced_root_block) {
        content = content.replace(/<br><br>/gi, '');
    }

    var validElements = settings.paste_word_valid_elements;

    if (!validElements) {
        validElements = (
            '-strong/b,-em/i,-u,-span,-p,-ol,-ul,-li,-h1,-h2,-h3,-h4,-h5,-h6,' +
            '-p/div,-a[href|name],img[src|alt|width|height],sub,sup,strike,br,del,table[width],tr,' +
            'td[colspan|rowspan|width],th[colspan|rowspan|width],thead,tfoot,tbody'
        );
    }

    // Setup strict schema
    var schema = new Schema({
        valid_elements: validElements,
        valid_children: '-li[p]'
    });

    // Add style/class attribute to all element rules since the user might have removed them from
    // paste_word_valid_elements config option and we need to check them for properties
    each(schema.elements, function (rule) {
        /*eslint dot-notation:0*/
        if (!rule.attributes["class"]) {
            rule.attributes["class"] = {};
            rule.attributesOrder.push("class");
        }

        if (!rule.attributes.style) {
            rule.attributes.style = {};
            rule.attributesOrder.push("style");
        }
    });

    // Parse HTML into DOM structure
    var domParser = new DomParser({}, schema);

    // Filter styles to remove "mso" specific styles and convert some of them
    domParser.addAttributeFilter('style', function (nodes) {
        var i = nodes.length,
            node, style;

        while (i--) {
            node = nodes[i];

            style = node.attr('style');

            // check for fake list (unordered)
            if (style && style.indexOf('mso-list') !== -1 && node.name !== 'li') {
                node.attr('data-mce-word-list', 1);
            }

            node.attr('style', filterStyles(node, style));

            // Remove pointess spans
            if (node.name == 'span' && node.parent && !node.attributes.length) {
                node.unwrap();
            }
        }
    });

    // Check the class attribute for comments or del items and remove those
    domParser.addAttributeFilter('class', function (nodes) {
        var i = nodes.length,
            node, className;

        while (i--) {
            node = nodes[i];

            className = node.attr('class');

            if (/^(MsoCommentReference|MsoCommentText|msoDel)$/i.test(className)) {
                node.remove();
                continue;
            }

            if (/^Mso[\w]+/i.test(className) || editor.getParam('clipboard_paste_strip_class_attributes', 2)) {
                node.attr('class', null);

                if (className && className.indexOf('MsoList') !== -1 && node.name !== 'li') {
                    node.attr('data-mce-word-list', 1);
                }

                if (className && /\s*Mso(Foot|End)note\s*/.test(className)) {
                    var parent = node.parent;

                    // replace footnote span with <sup>
                    if (parent && parent.name === 'a') {
                        node.name = 'sup';
                    }

                    // remove additional span tags
                    if (node.name === 'span' && !node.attributes.length) {
                        node.unwrap();
                    }
                }

                // blockquote
                if (className && /\s*MsoQuote\s*/.test(className)) {
                    node.name = 'blockquote';
                }
            }
        }
    });

    // Remove all del elements since we don't want the track changes code in the editor
    domParser.addNodeFilter('del', function (nodes) {
        var i = nodes.length;

        while (i--) {
            nodes[i].remove();
        }
    });

    var footnotes = editor.getParam('clipboard_paste_process_footnotes', 'convert');

    // Keep some of the links and anchors
    domParser.addNodeFilter('a', function (nodes) {
        var i = nodes.length,
            node, href, name;

        while (i--) {
            node = nodes[i];
            href = node.attr('href');
            name = node.attr('name');

            if (href && href.indexOf('#_msocom_') != -1) {
                node.remove();
                continue;
            }

            // convert URL
            if (href && !name) {
                href = editor.convertURL(href);
            }

            if (href && href.indexOf('#') !== -1) {
                href = href.substr(href.indexOf('#'));
            }

            if (!href && !name) {
                node.unwrap();
            } else {
                // Remove all named anchors that aren't specific to TOC, Footnotes or Endnotes
                if (name && !/^_?(?:toc|edn|ftn)/i.test(name)) {
                    node.unwrap();
                    continue;
                }

                // remove footnote
                if (name && footnotes === "remove") {
                    node.remove();
                    continue;
                }

                // unlink footnote
                if (name && footnotes === "unlink") {
                    node.unwrap();
                    continue;
                }

                // set href, remove name
                node.attr({
                    href: href,
                    name: null
                });

                // set appropriate anchor
                if (settings.schema === "html4") {
                    node.attr('name', name);
                } else {
                    node.attr('id', name);
                }
            }
        }
    });

    // Remove empty span tags without attributes or content
    domParser.addNodeFilter('span', function (nodes) {
        var i = nodes.length,
            node;

        while (i--) {
            node = nodes[i];

            if (node.parent && !node.attributes.length) {
                node.unwrap();
            }
        }
    });

    // Remove single paragraphs in table cells
    if (editor.getParam('clipboard_paste_remove_paragraph_in_table_cell')) {
        domParser.addNodeFilter('td', function (nodes) {
            var i = nodes.length,
                node, firstChild, lastChild;

            while (i--) {
                node = nodes[i], firstChild = node.firstChild, lastChild = node.lastChild;

                if (firstChild.name === "p" && firstChild === lastChild) {
                    firstChild.unwrap();
                }
            }
        });
    }

    // Parse into DOM structure
    var rootNode = domParser.parse(content);

    // Process DOM
    if (settings.paste_convert_word_fake_lists !== false) {
        convertFakeListsToProperLists(rootNode);
    }

    // Serialize DOM back to HTML
    content = new Serializer({
        validate: settings.validate
    }, schema).serialize(rootNode);

    return content;
}

export {
    isWordContent,
    WordFilter
};