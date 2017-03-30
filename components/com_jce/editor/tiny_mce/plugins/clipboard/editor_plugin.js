/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each,
        VK = tinymce.VK,
        Event = tinymce.dom.Event,
        Schema = tinymce.html.Schema,
        DomParser = tinymce.html.DomParser,
        Serializer = tinymce.html.Serializer,
        Node = tinymce.html.Node;

    var styleProps = [
        'background', 'background-attachment', 'background-color', 'background-image', 'background-position', 'background-repeat',
        'border', 'border-bottom', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-color', 'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right', 'border-right-color', 'border-right-style', 'border-right-width', 'border-style', 'border-top', 'border-top-color', 'border-top-style', 'border-top-width', 'border-width', 'outline', 'outline-color', 'outline-style', 'outline-width',
        'height', 'max-height', 'max-width', 'min-height', 'min-width', 'width',
        'font', 'font-family', 'font-size', 'font-style', 'font-variant', 'font-weight',
        'content', 'counter-increment', 'counter-reset', 'quotes',
        'list-style', 'list-style-image', 'list-style-position', 'list-style-type',
        'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top',
        'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
        'bottom', 'clear', 'clip', 'cursor', 'display', 'float', 'left', 'overflow', 'position', 'right', 'top', 'visibility', 'z-index',
        'orphans', 'page-break-after', 'page-break-before', 'page-break-inside', 'widows',
        'border-collapse', 'border-spacing', 'caption-side', 'empty-cells', 'table-layout',
        'color', 'direction', 'letter-spacing', 'line-height', 'text-align', 'text-decoration', 'text-indent', 'text-shadow', 'text-transform', 'unicode-bidi', 'vertical-align', 'white-space', 'word-spacing'
    ];

    var pixelStyles = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'top', 'right', 'bottom', 'left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'];

    // Open Office
    var ooRe = /(Version:[\d\.]+)\s*?((Start|End)(HTML|Fragment):[\d]+\s*?){4}/;

    function filter(content, items) {
        each(items, function (v) {
            if (v.constructor == RegExp) {
                content = content.replace(v, '');
            } else {
                content = content.replace(v[0], v[1]);
            }
        });

        return content;
    }

    function isWordContent(content) {
        // Open Office
        if (/(content=\"OpenOffice.org[^\"]+\")/i.test(content) || ooRe.test(content)) {
            return true; // Mark the pasted contents as word specific content
        }

        // Word
        /*if (/(class=\"?Mso|style=\"[^\"]*\bmso\-|w:WordDocument)/.test(content)) {
           return true;
        }*/

        // Word
        return (
            (/<font face="Times New Roman"|class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i).test(content) ||
            (/class="OutlineElement/).test(content) ||
            (/id="?docs\-internal\-guid\-/.test(content))
        );
    }

    /**
     * Trims the specified HTML by removing all WebKit fragments, all elements wrapping the body trailing BR elements etc.
     *
     * @param {String} html Html string to trim contents on.
     * @return {String} Html contents that got trimmed.
     */
    function trimHtml(html) {
        function trimSpaces(all, s1, s2) {
            // WebKit &nbsp; meant to preserve multiple spaces but instead inserted around all inline tags,
            // including the spans with inline styles created on paste
            if (!s1 && !s2) {
                return ' ';
            }

            return '\u00a0';
        }

        html = filter(html, [
            /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/g, // Remove anything but the contents within the BODY element
            /<!--StartFragment-->|<!--EndFragment-->/g, // Inner fragments (tables from excel on mac)
            [/( ?)<span class="Apple-converted-space">\u00a0<\/span>( ?)/g, trimSpaces],
            /<br class="Apple-interchange-newline">/g,
            /<br>$/i // Trailing BR elements
        ]);

        return html;
    }

    /**
     * Removes BR elements after block elements. IE9 has a nasty bug where it puts a BR element after each
     * block element when pasting from word. This removes those elements.
     *
     * This:
     *  <p>a</p><br><p>b</p>
     *
     * Becomes:
     *  <p>a</p><p>b</p>
     */
    function removeExplorerBrElementsAfterBlocks(editor, html) {
        // Produce block regexp based on the block elements in schema
        var blockElements = [];

        each(editor.schema.getBlockElements(), function (block, blockName) {
            blockElements.push(blockName);
        });

        var explorerBlocksRegExp = new RegExp(
            '(?:<br>&nbsp;[\\s\\r\\n]+|<br>)*(<\\/?(' + blockElements.join('|') + ')[^>]*>)(?:<br>&nbsp;[\\s\\r\\n]+|<br>)*',
            'g'
        );

        // Remove BR:s from: <BLOCK>X</BLOCK><BR>
        html = filter(html, [
            [explorerBlocksRegExp, '$1']
        ]);

        // IE9 also adds an extra BR element for each soft-linefeed and it also adds a BR for each word wrap break
        html = filter(html, [
            [/<br><br>/g, '<BR><BR>'], // Replace multiple BR elements with uppercase BR to keep them intact
            [/<br>/g, ' '], // Replace single br elements with space since they are word wrap BR:s
            [/<BR><BR>/g, '<br>'] // Replace back the double brs but into a single BR
        ]);

        return html;
    }

    /**
     * WebKit has a nasty bug where the all computed styles gets added to style attributes when copy/pasting contents.
     * This fix solves that by simply removing the whole style attribute.
     *
     * The paste_webkit_styles option can be set to specify what to keep:
     *  paste_webkit_styles: "none" // Keep no styles
     *  paste_webkit_styles: "all", // Keep all of them
     *  paste_webkit_styles: "font-weight color" // Keep specific ones
     *
     * @param {String} content Content that needs to be processed.
     * @return {String} Processed contents.
     */
    function removeWebKitStyles(editor, content) {
        // Filter away styles that isn't matching the target node
        var webKitStyles = editor.settings.paste_webkit_styles;

        if (editor.settings.paste_remove_styles_if_webkit === false || webKitStyles == "all") {
            return content;
        }

        if (webKitStyles) {
            webKitStyles = webKitStyles.split(/[, ]/);
        }

        // Keep specific styles that doesn't match the current node computed style
        if (webKitStyles) {
            var dom = editor.dom,
                node = editor.selection.getNode();

            content = content.replace(/(<[^>]+) style="([^"]*)"([^>]*>)/gi, function (all, before, value, after) {
                var inputStyles = dom.parseStyle(value, 'span'),
                    outputStyles = {};

                if (webKitStyles === "none") {
                    return before + after;
                }

                for (var i = 0; i < webKitStyles.length; i++) {
                    var inputValue = inputStyles[webKitStyles[i]],
                        currentValue = dom.getStyle(node, webKitStyles[i], true);

                    if (/color/.test(webKitStyles[i])) {
                        inputValue = dom.toHex(inputValue);
                        currentValue = dom.toHex(currentValue);
                    }

                    if (currentValue != inputValue) {
                        outputStyles[webKitStyles[i]] = inputValue;
                    }
                }

                outputStyles = dom.serializeStyle(outputStyles, 'span');
                if (outputStyles) {
                    return before + ' style="' + outputStyles + '"' + after;
                }

                return before + after;
            });
        } else {
            // Remove all external styles
            content = content.replace(/(<[^>]+) style="([^"]*)"([^>]*>)/gi, '$1$3');
        }

        // Keep internal styles
        content = content.replace(/(<[^>]+) data-mce-style="([^"]+)"([^>]*>)/gi, function (all, before, value, after) {
            return before + ' style="' + value + '"' + after;
        });

        return content;
    }

    /**
     * Process style attributes
     * @param node Node to process
     */
    function processStyles(editor, node) {
        var dom = editor.dom;

        // Process style information
        var s = editor.getParam('clipboard_paste_retain_style_properties');

        // split to array if string
        if (s && tinymce.is(s, 'string')) {
            styleProps = tinymce.explode(s);
        }

        // Retains some style properties
        each(dom.select('*[style]', node), function (n) {
            var ns = {},
                x = 0;

            // get styles on element
            var styles = dom.parseStyle(n.style.cssText);

            // check style against styleProps array
            each(styles, function (v, k) {
                if (tinymce.inArray(styleProps, k) != -1) {
                    ns[k] = v;
                    x++;
                }
            });

            // Remove all of the existing styles
            dom.setAttrib(n, 'style', '');

            if (x > 0) {
                dom.setStyles(n, ns); // Add back the stored subset of styles
            } else {
                // Remove empty span tags that do not have class attributes
                if (n.nodeName == 'SPAN' && !n.className) {
                    dom.remove(n, true);
                }
            }
            // We need to compress the styles on WebKit since if you paste <img border="0" /> it will become <img border="0" style="... lots of junk ..." />
            // Removing the mce_style that contains the real value will force the Serializer engine to compress the styles
            if (tinymce.isWebKit) {
                n.removeAttribute('data-mce-style');
            }
        });

        // convert some attributes
        each(dom.select('*[align]', node), function (el) {
            var v = dom.getAttrib(el, 'align');

            if (v === "left" || v === "right" || v === "center") {
                if (/(IFRAME|IMG|OBJECT|VIDEO|AUDIO|EMBED)/i.test(el.nodeName)) {
                    if (v === "center") {
                        dom.setStyles(el, {
                            'margin': 'auto',
                            'display': 'block'
                        });
                    } else {
                        dom.setStyle(el, 'float', v);
                    }
                } else {
                    dom.setStyle(el, 'text-align', v);
                }
            }

            el.removeAttribute('align');
        });
    }

    function convertToPixels(v) {
        // retun integer 0 for 0 values, eg: 0cm, 0pt etc. 
        if (parseInt(v, 10) === 0) {
            return 0;
        }

        // convert pt to px
        if (v.indexOf('pt') !== -1) {
            // convert to integer
            v = parseInt(v, 10);
            // convert to pixel value
            v = Math.round(v / 1.33333);
        }

        return v;
    }

    /**
     * Checks if the specified text starts with "1. " or "a. " etc.
     */
    function isNumericList(text) {
        var found, patterns;

        patterns = [
            /^[IVXLMCD]{1,2}\.[ \u00a0]/, // Roman upper case
            /^[ivxlmcd]{1,2}\.[ \u00a0]/, // Roman lower case
            /^[a-z]{1,2}[\.\)][ \u00a0]/, // Alphabetical a-z
            /^[A-Z]{1,2}[\.\)][ \u00a0]/, // Alphabetical A-Z
            /^[0-9]+\.[ \u00a0]/, // Numeric lists
            /^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/, // Japanese
            /^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/ // Chinese
        ];

        text = text.replace(/^[\u00a0 ]+/, '');

        each(patterns, function (pattern) {
            if (pattern.test(text)) {
                found = true;
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

        var retainStyleProperties, validStyles;

        // convert footnotes
        //content = convertFootNotes(editor, content);

        // Chrome...
        content = content.replace(/<meta([^>]+)>/, '');

        // Word comments like conditional comments etc
        content = content.replace(/<!--([\s\S]*?)-->/gi, '');

        // remove styles
        content = content.replace(/<style([^>]*)>([\w\W]*?)<\/style>/gi, '');

        // Remove comments, scripts (e.g., msoShowComment), XML tag, VML content, MS Office namespaced tags, and a few other tags
        content = content.replace(/<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|meta|link|\w:\w+)(?=[\s\/>]))[^>]*>/gi, '');

        // Copy paste from Java like Open Office will produce this junk on FF
        content = content.replace(/Version:[\d.]+\nStartHTML:\d+\nEndHTML:\d+\nStartFragment:\d+\nEndFragment:\d+/gi, '');

        // Open Office
        content = filter(content, [
            [/[\s\S]+?<meta[^>]*>/, ''], // Remove everything before meta element
            [/<!--[\s\S]+?-->/gi, ''], // Comments
            [/<style[^>]*>[\s\S]+?<\/style>/gi, ''] // Remove styles
        ]);

        content = content.replace(ooRe, '', 'g');

        // Remove google docs internal guid markers
        content = content.replace(/<b[^>]+id="?docs-internal-[^>]*>/gi, '');
        content = content.replace(/<br class="?Apple-interchange-newline"?>/gi, '');

        retainStyleProperties = settings.paste_retain_style_properties;

        if (retainStyleProperties) {
            validStyles = tinymce.makeMap(retainStyleProperties.split(/[, ]/));
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

            function convertParagraphToLi(paragraphNode, listName, start) {
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
                trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
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
                    var nodeText = getText(node);

                    // Detect unordered lists look for bullets
                    if (isBulletList(nodeText)) {
                        convertParagraphToLi(node, 'ul');
                        continue;
                    }

                    // Detect ordered lists 1., a. or ixv.
                    if (isNumericList(nodeText)) {
                        // Parse OL start number
                        var matches = /([0-9]+)\./.exec(nodeText);
                        var start = 1;
                        if (matches) {
                            start = parseInt(matches[1], 10);
                        }

                        convertParagraphToLi(node, 'ol', start);
                        continue;
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
                        name = "color";
                        break;

                    case "mso-background":
                    case "mso-highlight":
                        name = "background";
                        break;

                    case "font-weight":
                    case "font-style":
                        if (value != "normal") {
                            outputStyles[name] = value;
                        }
                        return;

                    case "mso-element":
                        // Remove track changes code
                        if (/^(comment|comment-list)$/i.test(value)) {
                            node.remove();
                            return;
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
                if (tinymce.inArray(pixelStyles, name) !== -1) {
                    value = convertToPixels(value);
                }

                // Output only valid styles
                if (validStyles && validStyles[name]) {
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
            return;
        }

        // Remove basic Word junk
        content = filter(content, [
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
                '-p/div,-a[href|name|data-mce-footnote],img[src|alt|width|height],sub,sup,strike,br,del,table[width],tr,' +
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
                node;

            while (i--) {
                node = nodes[i];
                node.attr('style', filterStyles(node, node.attr('style')));

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
                }

                node.attr('class', null);
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

                if (href && href.indexOf('file://') === 0) {
                    href = href.split('#')[1];
                    if (href) {
                        href = '#' + href;
                    }
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

    /**
     * Convert URL strings to elements
     * @param content HTML to process
     */
    function convertURLs(ed, content) {

        var ex = '([-!#$%&\'\*\+\\./0-9=?A-Z^_`a-z{|}~]+@[-!#$%&\'\*\+\\/0-9=?A-Z^_`a-z{|}~]+\.[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+)';
        var ux = '((news|telnet|nttp|file|http|ftp|https)://[-!#$%&\'\*\+\\/0-9=?A-Z^_`a-z{|}~;]+\.[-!#$%&\'\*\+\\./0-9=?A-Z^_`a-z{|}~;]+)';

        if (ed.getParam('autolink_url', true)) {
            // find and link url if not already linked
            content = content.replace(new RegExp('(=["\']|>)?' + ux, 'g'), function (a, b, c) {
                // only if not already a link, ie: b != =" or >
                if (!b) {
                    return '<a href="' + c + '">' + c + '</a>';
                }

                return a;
            });
        }

        if (ed.getParam('autolink_email', true)) {
            content = content.replace(new RegExp('(=["\']mailto:|>)?' + ex, 'g'), function (a, b, c) {
                // only if not already a mailto: link
                if (!b) {
                    return '<a href="mailto:' + c + '">' + c + '</a>';
                }

                return a;
            });
        }

        return content;
    }

    tinymce.create('tinymce.plugins.ClipboardPlugin', {
        init: function (ed, url) {
            var self = this,
                cb;

            self.editor = ed;
            self.url = url;

            // set default paste state for dialog trigger
            this.canPaste = false;

            // Setup plugin events
            self.onPreProcess = new tinymce.util.Dispatcher(this);
            self.onPostProcess = new tinymce.util.Dispatcher(this);
            self.onAfterPaste = new tinymce.util.Dispatcher(this);

            // Register default handlers
            self.onPreProcess.add(self._preProcess);
            self.onPostProcess.add(self._postProcess);

            // Register optional preprocess handler
            self.onPreProcess.add(function (pl, o) {
                ed.execCallback('paste_preprocess', pl, o);
            });

            // Register optional postprocess
            self.onPostProcess.add(function (pl, o) {
                ed.execCallback('paste_postprocess', pl, o);
            });

            ed.onKeyDown.addToTop(function (ed, e) {
                // Block ctrl+v from adding an undo level since the default logic in tinymce.Editor will add that
                if ((VK.metaKeyPressed && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45)) {
                    return false; // Stop other listeners
                }

                // block events
                if (!ed.getParam('clipboard_allow_cut', 1) && (VK.metaKeyPressed && e.keyCode == 88)) {
                    e.preventDefault();
                    return false;
                }

                if (!ed.getParam('clipboard_allow_copy', 1) && (VK.metaKeyPressed && e.keyCode == 67)) {
                    e.preventDefault();
                    return false;
                }
            });

            self.pasteText = ed.getParam('clipboard_paste_text', 1);
            self.pasteHtml = ed.getParam('clipboard_paste_html', 1);

            // This function executes the process handlers and inserts the contents
            function process(o) {
                var dom = ed.dom,
                    rng;

                ed.setProgressState(1);

                // trim content
                o.content = trimHtml(o.content);

                // override states
                switch (self.command) {
                    case 'mcePaste':
                        if (!self.pasteHtml) {
                            self.command = 'mcePasteText';
                        }
                        break;
                    case 'mcePasteText':
                        if (!self.pasteText) {
                            self.command = 'mcePaste';
                        }
                        break;
                    case 'mcePasteWord':
                        if (!self.pasteWord || !self.pasteHtml) {
                            self.command = 'mcePasteText';
                        }
                        break;
                    default:
                        self.command = 'mcePaste';
                        if (!self.pasteHtml && self.pasteText) {
                            self.command = 'mcePasteText';
                        }

                        break;
                }

                // set plainText flag
                self.plainText = self.command == 'mcePasteText';

                // set word content flag
                if (ed.getParam('clipboard_paste_force_cleanup')) {
                    o.wordContent = true;
                }

                // Execute pre process handlers
                self.onPreProcess.dispatch(self, o);

                // Create DOM structure
                o.node = dom.create('div', 0, o.content);

                // If pasting inside the same element and the contents is only one block
                // remove the block and keep the text since Firefox will copy parts of pre and h1-h6 as a pre element
                if (tinymce.isGecko) {
                    rng = ed.selection.getRng(true);
                    if (rng.startContainer == rng.endContainer && rng.startContainer.nodeType == 3) {
                        // Is only one block node and it doesn't contain word stuff
                        if (o.node.childNodes.length === 1 && /^(p|h[1-6]|pre)$/i.test(o.node.firstChild.nodeName) && o.content.indexOf('__MCE_ITEM__') === -1)
                            dom.remove(o.node.firstChild, true);
                    }
                }

                // Execute post process handlers
                self.onPostProcess.dispatch(self, o);

                // Serialize content
                o.content = ed.serializer.serialize(o.node, {
                    getInner: 1,
                    forced_root_block: ''
                });

                if (self.plainText) {
                    self._insertPlainText(o.content);
                } else {
                    self._insert(o.content);
                }

                // Trigger onAfterPaste event
                self.onAfterPaste.dispatch(self);

                ed.setProgressState(0);

                // reset to default
                self.command = 'mcePaste';
            }

            // Add command for external usage
            ed.addCommand('mceInsertClipboardContent', function (u, o) {
                process(o);
            });

            ed.onInit.add(function () {
                if (ed.plugins.contextmenu) {
                    ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                        var c = ed.selection.isCollapsed();

                        if (ed.getParam('clipboard_cut', 1)) {
                            m.add({
                                title: 'advanced.cut_desc',
                                /* TODO - Change to clipboard.cut_desc */
                                icon: 'cut',
                                cmd: 'Cut'
                            }).setDisabled(c);
                        }

                        if (ed.getParam('clipboard_copy', 1)) {
                            m.add({
                                title: 'advanced.copy_desc',
                                /* TODO - Change to clipboard.copy_desc */
                                icon: 'copy',
                                cmd: 'Copy'
                            }).setDisabled(c);
                        }

                        if (self.pasteHtml) {
                            m.add({
                                title: 'clipboard.paste_desc',
                                /* TODO - Change to clipboard.paste_desc */
                                icon: 'paste',
                                cmd: 'mcePaste'
                            });
                        }
                        if (self.pasteText) {
                            m.add({
                                title: 'clipboard.paste_text_desc',
                                /* TODO - Change to clipboard.paste_text_desc */
                                icon: 'pastetext',
                                cmd: 'mcePasteText'
                            });
                        }
                    });

                }
            });

            // This function grabs the contents from the clipboard by adding a
            // hidden div and placing the caret inside it and after the browser paste
            // is done it grabs that contents and processes that
            function grabContent(e) {
                var n, or, rng, oldRng, sel = ed.selection,
                    dom = ed.dom,
                    doc = ed.getDoc(),
                    body = ed.getBody(),
                    posY, textContent;

                // Check if browser supports direct plaintext access
                if (e.clipboardData || doc.dataTransfer) {
                    textContent = (e.clipboardData || doc.dataTransfer).getData('Text');

                    if (ed.pasteAsPlainText) {
                        e.preventDefault();
                        process({
                            content: textContent.replace(/\r?\n/g, '<br />')
                        });
                        return;
                    }
                }
                // don't repeat paste
                if (dom.get('_mcePaste')) {
                    return;
                }

                // Create container to paste into
                n = dom.add(body, 'div', {
                    id: '_mcePaste',
                    'class': 'mcePaste',
                    'data-mce-bogus': '1'
                }, '\uFEFF\uFEFF');

                // If contentEditable mode we need to find out the position of the closest element
                if (body != ed.getDoc().body)
                    posY = dom.getPos(ed.selection.getStart(), body).y;
                else
                    posY = body.scrollTop + dom.getViewPort(ed.getWin()).y;

                // Styles needs to be applied after the element is added to the document since WebKit will otherwise remove all styles
                // If also needs to be in view on IE or the paste would fail
                dom.setStyles(n, {
                    position: 'absolute',
                    left: (tinymce.isIE || tinymce.isGecko) ? -40 : 0, // Need to move it out of site on Gecko since it will othewise display a ghost resize rect for the div
                    top: posY - 25,
                    width: 10,
                    height: 10,
                    overflow: 'hidden',
                    opacity: 0
                });
                // Old IE...
                if (tinymce.isIE && !tinymce.isIE11) {
                    // Store away the old range
                    oldRng = sel.getRng();

                    // Select the container
                    rng = dom.doc.body.createTextRange();
                    rng.moveToElementText(n);
                    rng.execCommand('Paste');

                    // Remove container
                    dom.remove(n);

                    // Check if the contents was changed, if it wasn't then clipboard extraction failed probably due
                    // to IE security settings so we pass the junk though better than nothing right
                    if (n.innerHTML === '\uFEFF\uFEFF') {
                        e.preventDefault();
                        return;
                    }

                    // Restore the old range and clear the contents before pasting
                    sel.setRng(oldRng);
                    sel.setContent('');

                    // set paste state as true...we got this far right?
                    self.canPaste = true;

                    // For some odd reason we need to detach the the mceInsertContent call from the paste event
                    // It's like IE has a reference to the parent element that you paste in and the selection gets messed up
                    // when it tries to restore the selection
                    setTimeout(function () {
                        // Process contents
                        process({
                            content: ed.pasteAsPlainText ? n.textContent.replace(/\r?\n/g, '<br />') : n.innerHTML
                        });
                    }, 0);

                    // Block the real paste event
                    tinymce.dom.Event.cancel(e);
                } else {
                    function block(e) {
                        e.preventDefault();
                    }

                    // set paste state as true...we got this far right?
                    self.canPaste = true;

                    //n.innerHTML = '\uFEFF<br data-mce-bogus="1" />';

                    // Block mousedown and click to prevent selection change
                    dom.bind(doc, 'mousedown', block);
                    dom.bind(doc, 'keydown', block);

                    or = ed.selection.getRng();

                    // Move caret into hidden div
                    n = n.firstChild;
                    rng = doc.createRange();
                    rng.setStart(n, 0);
                    rng.setEnd(n, 2);
                    sel.setRng(rng);

                    // Wait a while and grab the pasted contents
                    window.setTimeout(function () {
                        var h = '',
                            nl;

                        // Paste divs duplicated in paste divs seems to happen when you paste plain text so lets first look for that broken behavior in WebKit
                        if (!dom.select('div.mcePaste > div.mcePaste').length) {
                            nl = dom.select('div.mcePaste');

                            // WebKit will split the div into multiple ones so this will loop through then all and join them to get the whole HTML string
                            each(nl, function (n) {
                                var child = n.firstChild;

                                // WebKit inserts a DIV container with lots of odd styles
                                if (child && child.nodeName == 'DIV' && child.style.marginTop && child.style.backgroundColor) {
                                    dom.remove(child, 1);
                                }

                                // Remove apply style spans
                                each(dom.select('span.Apple-style-span', n), function (n) {
                                    dom.remove(n, 1);
                                });

                                // Remove bogus br elements
                                each(dom.select('br[data-mce-bogus]', n), function (n) {
                                    dom.remove(n);
                                });

                                // WebKit will make a copy of the DIV for each line of plain text pasted and insert them into the DIV
                                if (n.parentNode.className != 'mcePaste') {
                                    h += n.innerHTML;
                                }
                            });

                        } else {
                            // Found WebKit weirdness so force the content into paragraphs this seems to happen when you paste plain text from Nodepad etc
                            // So this logic will replace double enter with paragraphs and single enter with br so it kind of looks the same
                            h = '<p>' + dom.encode(textContent).replace(/\r?\n\r?\n/g, '</p><p>').replace(/\r?\n/g, '<br />') + '</p>';
                        }

                        // Remove the nodes
                        each(dom.select('div.mcePaste'), function (n) {
                            dom.remove(n);
                        });

                        // Restore the old selection
                        if (or) {
                            sel.setRng(or);
                        }

                        process({
                            content: h
                        });

                        // Unblock events ones we got the contents
                        dom.unbind(ed.getDoc(), 'mousedown', block);
                        dom.unbind(ed.getDoc(), 'keydown', block);
                    }, 0);

                }
            }

            // Is it's Opera or older FF use key handler
            if (tinymce.isOpera) {
                ed.onKeyDown.addToTop(function (ed, e) {
                    if (((tinymce.isMac ? e.metaKey : e.ctrlKey) && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45))
                        grabContent(e);
                });

            } else {
                // Grab contents on paste event on Gecko and WebKit
                ed.onPaste.addToTop(function (ed, e) {
                    return grabContent(e);
                });
            }

            // Block all drag/drop events
            if (ed.getParam('clipboard_paste_block_drop')) {
                ed.onInit.add(function () {
                    ed.dom.bind(ed.getBody(), ['dragend', 'dragover', 'draggesture', 'dragdrop', 'drop', 'drag'], function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        return false;
                    });
                });
            }

            each(['Cut', 'Copy'], function (command) {
                ed.addCommand(command, function () {
                    var doc = ed.getDoc(),
                        failed;

                    // Try executing the native command
                    try {
                        doc.execCommand(command, false, null);
                    } catch (ex) {
                        // Command failed
                        failed = true;
                    }

                    var msg = ed.getLang('clipboard_msg', '');
                    msg = msg.replace(/\%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

                    // Present alert message about clipboard access not being available
                    if (failed || !doc.queryCommandSupported(command)) {
                        if (tinymce.isGecko) {
                            ed.windowManager.confirm(msg, function (state) {
                                if (state)
                                    open('http://www.mozilla.org/editor/midasdemo/securityprefs.html', '_blank');
                            });
                        } else
                            ed.windowManager.alert(ed.getLang('clipboard_no_support'));
                    }
                });
            });

            // Add commands
            each(['mcePasteText', 'mcePaste'], function (cmd) {
                ed.addCommand(cmd, function () {
                    var doc = ed.getDoc();
                    // set command
                    self.command = cmd;

                    // just open the window
                    if (ed.getParam('clipboard_paste_use_dialog') || (tinymce.isIE && !doc.queryCommandSupported('Paste'))) {
                        return self._openWin(cmd);
                    } else {
                        try {
                            doc.execCommand('Paste', false, null);
                        } catch (e) {
                            self.canPaste = false;
                        }

                        // if paste command not supported open window
                        if (self.canPaste === false) {
                            return self._openWin(cmd);
                        }
                    }
                });

            });

            // Add buttons
            if (self.pasteHtml) {
                ed.addButton('paste', {
                    title: 'clipboard.paste_desc',
                    cmd: 'mcePaste',
                    ui: true
                });
            }

            if (self.pasteText) {
                ed.addButton('pastetext', {
                    title: 'clipboard.paste_text_desc',
                    cmd: 'mcePasteText',
                    ui: true
                });
            }

            if (ed.getParam('clipboard_cut', 1)) {
                ed.addButton('cut', {
                    title: 'advanced.cut_desc',
                    cmd: 'Cut',
                    icon: 'cut'
                });
            }

            if (ed.getParam('clipboard_copy', 1)) {
                ed.addButton('copy', {
                    title: 'advanced.copy_desc',
                    cmd: 'Copy',
                    icon: 'copy'
                });
            }
        },
        getInfo: function () {
            return {
                longname: 'Paste text/word',
                author: 'Moxiecode Systems AB / Ryan demmer',
                authorurl: 'http://tinymce.moxiecode.com',
                infourl: 'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/paste',
                version: '@@version@@'
            };
        },
        _openWin: function (cmd) {
            var ed = this.editor;

            ed.windowManager.open({
                file: ed.getParam('site_url') + 'index.php?option=com_jce&view=editor&plugin=clipboard&cmd=' + cmd,
                width: parseInt(ed.getParam("clipboard_paste_dialog_width", "450")),
                height: parseInt(ed.getParam("clipboard_paste_dialog_height", "400")),
                inline: 1,
                popup_css: false
            }, {
                cmd: cmd
            });
        },
        _preProcess: function (pl, o) {
            var ed = pl.editor,
                h = o.content,
                rb;

            if (ed.settings.paste_enable_default_filters == false) {
                return;
            }

            if (tinymce.isIE) {
                h = removeExplorerBrElementsAfterBlocks(ed, h);
            }

            // Process away some basic content
            h = h.replace(/^\s*(&nbsp;)+/g, ''); // nbsp entities at the start of contents
            h = h.replace(/(&nbsp;|<br[^>]*>)+\s*$/g, ''); // nbsp entities at the end of contents

            // skip plain text
            if (this.plainText) {
                return h;
            }

            o.wordContent = isWordContent(h);

            if (o.wordContent) {
                h = WordFilter(ed, h);
            }

            if (tinymce.isWebKit) {
                h = removeWebKitStyles(ed, h);
            }

            // remove attributes
            if (ed.getParam('clipboard_paste_remove_attributes')) {
                var attribs = ed.getParam('clipboard_paste_remove_attributes').split(',');

                h = h.replace(new RegExp(' (' + attribs.join('|') + ')="([^"]+)"', 'gi'), '');
            }

            // replace double linebreaks with paragraphs
            if (rb = ed.getParam('forced_root_block')) {
                var blocks = '';
                // only split if a double break exists
                if (h.indexOf('<br><br>') != -1) {
                    // convert marker to paragraphs
                    tinymce.each(h.split('<br><br>'), function (block) {
                        blocks += '<' + rb + '>' + block + '</' + rb + '>';
                    });

                    h = blocks;
                }
            }

            // Remove all spans (and font, u, strike if inline_styles = true as these would get converted to spans later)
            if (ed.getParam('clipboard_paste_remove_spans')) {
                h = h.replace(/<\/?(u|strike)[^>]*>/gi, '');

                if (ed.settings.convert_fonts_to_spans) {
                    h = h.replace(/<\/?(font)[^>]*>/gi, '');
                }

                h = h.replace(/<\/?(span)[^>]*>/gi, '');
            }

            // replace paragraphs with linebreaks
            if (!ed.getParam('forced_root_block')) {
                // remove empty paragraphs first
                if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                    h = h.replace(/<p([^>]*)>(\s|&nbsp;|\u00a0)*<\/p>/gi, '');
                }

                h = h.replace(/<\/(p|div)>/gi, '<br /><br />').replace(/<(p|div)([^>]*)>/g, '').replace(/(<br \/>){2}$/g, '');
            }

            // convert urls in content
            if (ed.getParam('clipboard_paste_convert_urls', true)) {
                h = convertURLs(ed, h);
            }

            // convert some tags if cleanup is off
            if (ed.settings.verify_html === false) {
                h = h.replace(/<b\b([^>]*)>/gi, '<strong$1>');
                h = h.replace(/<\/b>/gi, '</strong>');
            }

            o.content = h;
        },

        /**
         * Paste as Plain Text
         * Remove all html form pasted contents. Newlines will be converted to paragraphs or linebreaks
         */
        _insertPlainText: function (h) {
            var ed = this.editor,
                dom = ed.dom,
                rb, entities = null;

            if ((typeof (h) === "string") && (h.length > 0)) {

                // clean any Word specific tags
                h = this._cleanWordContent(h);

                // If HTML content with line-breaking tags, then remove all cr/lf chars because only tags will break a line
                if (/<(?:p|br|h[1-6]|ul|ol|dl|table|t[rdh]|div|blockquote|fieldset|pre|address|center)[^>]*>/i.test(h)) {
                    h = h.replace(/[\n\r]+/g, '');
                } else {
                    // Otherwise just get rid of carriage returns (only need linefeeds)
                    h = h.replace(/\r+/g, '');
                }

                h = h.replace(/<\/(?:p|h[1-6]|ul|ol|dl|table|div|blockquote|fieldset|pre|address|center)>/gi, "\n\n"); // Block tags get a blank line after them

                h = h.replace(/<br[^>]*>|<\/tr>/gi, "\n"); // Single linebreak for <br /> tags and table rows
                h = h.replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, "\t"); // Table cells get tabs betweem them

                h = h.replace(/<[a-z!\/?][^>]*>/gi, ''); // Delete all remaining tags
                h = h.replace(/&nbsp;/gi, " "); // Convert non-break spaces to regular spaces (remember, *plain text*)

                // replace HTML entity with actual character
                h = dom.decode(tinymce.html.Entities.encodeRaw(h));

                h = h.replace(/(?:(?!\n)\s)*(\n+)(?:(?!\n)\s)*/gi, "$1"); // Cool little RegExp deletes whitespace around linebreak chars.
                h = h.replace(/\n{3,}/g, "\n\n"); // Max. 2 consecutive linebreaks
                h = h.replace(/^\s+|\s+$/g, ''); // Trim the front & back

                // Perform replacements
                h = h.replace(/\u2026/g, "...");
                h = h.replace(/[\x93\x94]/g, '"');
                h = h.replace(/[\x60\x91\x92]/g, "'");

                if (rb = ed.getParam("forced_root_block")) {
                    // strip whitespace
                    h = h.replace(/^\s+|\s+$/g, '');
                    // replace double linebreaks with paragraphs
                    h = h.replace(/\n\n/g, '</' + rb + '><' + rb + '>');
                }
                // replace single linebreak with br element
                h = h.replace(/\n+?/g, '<br />');

                // remove empty paragraphs
                if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                    h = h.replace(/<p>(\s|&nbsp;|\u00a0)?<\/p>/gi, '');
                }
            }

            this._insert(h);
        },

        /**
         * Various post process items.
         */
        _postProcess: function (pl, o) {
            var self = this,
                ed = this.editor,
                dom = ed.dom,
                h;

            if (ed.settings.paste_enable_default_filters == false) {
                return;
            }

            // skip if plain text
            if (this.plainText) {
                return;
            }

            // Remove Apple style spans
            each(dom.select('span.Apple-style-span', o.node), function (n) {
                dom.remove(n, 1);
            });

            // Remove all styles
            if (ed.getParam('clipboard_paste_remove_styles')) {
                // Remove style attribute
                each(dom.select('*[style]', o.node), function (el) {
                    el.removeAttribute('style');
                    el.removeAttribute('data-mce-style');
                });
            } else {
                // process style attributes
                processStyles(ed, o.node);
            }

            // image file/data regular expression
            var imgRe = /(file:|data:image)\//i,
                uploader = ed.plugins.upload;
            var canUpload = uploader && uploader.plugins.length;

            // Process images - remove local
            each(dom.select('img', o.node), function (el) {
                var s = dom.getAttrib(el, 'src');

                // remove img element if blank, local file url or base64 encoded
                if (!s || imgRe.test(s)) {
                    if (ed.getParam('clipboard_paste_upload_images', true) && canUpload) {
                        // add marker
                        ed.dom.setAttrib(el, 'data-mce-upload-marker', '1');
                    } else {
                        dom.remove(el);
                    }
                } else {
                    dom.setAttrib(el, 'src', ed.convertURL(s));
                }
            });

            // remove font and underline tags in IE
            if (tinymce.isIE) {
                each(dom.select('a', o.node), function (el) {
                    each(dom.select('font,u'), function (n) {
                        dom.remove(n, 1);
                    });
                });
            }

            // remove tags
            if (ed.getParam('clipboard_paste_remove_tags')) {
                dom.remove(dom.select(ed.getParam('clipboard_paste_remove_tags'), o.node), 1);
            }

            // keep tags
            if (ed.getParam('clipboard_paste_keep_tags')) {
                var tags = ed.getParam('clipboard_paste_keep_tags');

                dom.remove(dom.select('*:not(' + tags + ')', o.node), 1);
            }

            // remove all spans
            if (ed.getParam('clipboard_paste_remove_spans')) {
                dom.remove(dom.select('span', o.node), 1);
                // remove empty spans
            } else {
                ed.dom.remove(dom.select('span:empty', o.node));

                each(dom.select('span', o.node), function (n) {
                    // remove span without children eg: <span></span>
                    if (!n.childNodes || n.childNodes.length === 0) {
                        dom.remove(n);
                    }

                    // remove span without attributes
                    if (dom.getAttribs(n).length === 0) {
                        dom.remove(n, 1);
                    }
                });
            }

            if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                dom.remove(dom.select('p:empty', o.node));

                each(dom.select('p', o.node), function (n) {
                    var h = n.innerHTML;

                    // remove paragraph without children eg: <p></p>
                    if (!n.childNodes || n.childNodes.length === 0 || /^(\s|&nbsp;|\u00a0)?$/.test(h)) {
                        dom.remove(n);
                    }
                });
            }
        },

        /**
         * Inserts the specified contents at the caret position.
         */
        _insert: function (h, skip_undo) {
            var ed = this.editor;

            // remove empty paragraphs
            if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                h = h.replace(/<p([^>]+)>(&nbsp;|\u00a0)?<\/p>/g, '');
            }

            // process regular expression
            if (ed.getParam('clipboard_paste_filter')) {
                var re, rules = ed.getParam('clipboard_paste_filter').split(';');

                each(rules, function (s) {
                    // if it is already in Regular Expression format...
                    if (/^\/.*\/(g|i|m)*$/.test(s)) {
                        re = (new Function('return ' + s))();
                        // ...else create expression
                    } else {
                        re = new RegExp(s);
                    }

                    h = h.replace(re, "");
                });
            }

            ed.execCommand('mceInsertContent', false, h, {
                skip_undo: skip_undo
            });
        }
    });
    // Register plugin
    tinymce.PluginManager.add('clipboard', tinymce.plugins.ClipboardPlugin);
})();