/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2018 Ryan Demmer. All rights reserved.
 * @copyright   Copyright (c) 1999-2017 Ephox Corp. All rights reserved
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
        Node = tinymce.html.Node,
        Entities = tinymce.html.Entities;

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

    var pixelStyles = [
        'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
        'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
    ];

    var borderStyles = [
        'border', 'border-width', 'border-style', 'border-color',
        'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'
    ];

    var backgroundStyles = {
        'background-image': 'none',
        'background-position': '0% 0%',
        'background-size': 'auto auto',
        'background-repeat': 'repeat',
        'background-origin': 'padding-box',
        'background-clip': 'border-box',
        'background-attachment': 'scroll',
        'background-color': 'transparent'
    };

    // Open Office
    var ooRe = /(Version:[\d\.]+)\s*?((Start|End)(HTML|Fragment):[\d]+\s*?){4}/;

    var isMsEdge = function () {
        return navigator.userAgent.indexOf(' Edge/') !== -1;
    };

    var InternalHtml = function () {
        var internalMimeType = 'x-tinymce/html';
        var internalMark = '<!-- ' + internalMimeType + ' -->';

        var mark = function (html) {
            return internalMark + html;
        };

        var unmark = function (html) {
            return html.replace(internalMark, '');
        };

        var isMarked = function (html) {
            return html.indexOf(internalMark) !== -1;
        };

        return {
            mark: mark,
            unmark: unmark,
            isMarked: isMarked,
            internalHtmlMime: function () {
                return internalMimeType;
            }
        };
    };

    var InternalHtml = new InternalHtml();

    var CutCopy = function (editor) {
        var noop = function () {};

        var hasWorkingClipboardApi = function (clipboardData) {
            // iOS supports the clipboardData API but it doesn't do anything for cut operations
            // Edge 15 has a broken HTML Clipboard API see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11780845/
            return tinymce.isIOS === false && clipboardData !== undefined && typeof clipboardData.setData === 'function' && isMsEdge() !== true;
        };

        var setHtml5Clipboard = function (clipboardData, html, text) {
            if (hasWorkingClipboardApi(clipboardData)) {
                try {
                    clipboardData.clearData();
                    clipboardData.setData('text/html', html);
                    clipboardData.setData('text/plain', text);
                    clipboardData.setData(InternalHtml.internalHtmlMime(), html);
                    return true;
                } catch (e) {
                    return false;
                }
            } else {
                return false;
            }
        };

        var setClipboardData = function (evt, data, fallback, done) {
            if (setHtml5Clipboard(evt.clipboardData, data.html, data.text)) {
                evt.preventDefault();
                done();
            } else {
                fallback(data.html, done);
            }
        };

        var fallback = function (editor) {
            return function (html, done) {
                var markedHtml = InternalHtml.mark(html);
                var outer = editor.dom.create('div', {
                    contenteditable: "false",
                    "data-mce-bogus": "all"
                });
                var inner = editor.dom.create('div', {
                    contenteditable: "true"
                }, markedHtml);
                editor.dom.setStyles(outer, {
                    position: 'fixed',
                    left: '-3000px',
                    width: '1000px',
                    overflow: 'hidden'
                });
                outer.appendChild(inner);
                editor.dom.add(editor.getBody(), outer);

                var range = editor.selection.getRng();
                inner.focus();

                var offscreenRange = editor.dom.createRng();
                offscreenRange.selectNodeContents(inner);
                editor.selection.setRng(offscreenRange);

                setTimeout(function () {
                    outer.parentNode.removeChild(outer);
                    editor.selection.setRng(range);
                    done();
                }, 0);
            };
        };

        var getData = function (editor) {
            return {
                html: editor.selection.getContent({
                    contextual: true
                }),
                text: editor.selection.getContent({
                    format: 'text'
                })
            };
        };

        var cut = function (editor, evt) {
            if (editor.selection.isCollapsed() === false) {
                setClipboardData(evt, getData(editor), fallback(editor), function () {
                    // Chrome fails to execCommand from another execCommand with this message:
                    // "We don't execute document.execCommand() this time, because it is called recursively.""
                    setTimeout(function () { // detach
                        editor.execCommand('Delete');
                    }, 0);
                });
            }
        };

        var copy = function (editor, evt) {
            if (editor.selection.isCollapsed() === false) {
                setClipboardData(evt, getData(editor), fallback(editor), noop);
            }
        };

        var register = function (editor) {
            editor.onCut.add(cut);
            editor.onCopy.add(copy);
        };

        return {
            register: register
        };
    };

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

    var parseCssToRules = function (content) {
        var doc = document.implementation.createHTMLDocument(""),
            styleElement = document.createElement("style");

        styleElement.textContent = content;

        doc.body.appendChild(styleElement);

        return styleElement.sheet.cssRules;
    }

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
                        return
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

        function getInnerFragment(html) {
            var startFragment = '<!--StartFragment-->';
            var endFragment = '<!--EndFragment-->';
            var startPos = html.indexOf(startFragment);
            if (startPos !== -1) {
                var fragmentHtml = html.substr(startPos + startFragment.length);
                var endPos = fragmentHtml.indexOf(endFragment);
                if (endPos !== -1 && /^<\/(p|h[1-6]|li)>/i.test(fragmentHtml.substr(endPos + endFragment.length, 5))) {
                    return fragmentHtml.substr(0, endPos);
                }
            }

            return html;
        }

        html = filter(getInnerFragment(html), [
            /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/g, // Remove anything but the contents within the BODY element
            /<!--StartFragment-->|<!--EndFragment-->/g, // Inner fragments (tables from excel on mac)
            [/( ?)<span class="Apple-converted-space">(\u00a0|&nbsp;)<\/span>( ?)/g, trimSpaces],
            /<br class="Apple-interchange-newline">/g,
            /^<meta[^>]+>/g, // Chrome weirdness
            /<br>$/i // Trailing BR elements
        ]);

        return html;
    }

    /**
     * Gets the innerText of the specified element. It will handle edge cases
     * and works better than textContent on Gecko.
     *
     * @param {String} html HTML string to get text from.
     * @return {String} String of text with line feeds.
     */
    function innerText(html) {
        var schema = new Schema(),
            domParser = new DomParser({}, schema),
            text = '';
        var shortEndedElements = schema.getShortEndedElements();
        var ignoreElements = tinymce.makeMap('script noscript style textarea video audio iframe object', ' ');
        var blockElements = schema.getBlockElements();

        function walk(node) {
            var name = node.name,
                currentNode = node;

            if (name === 'br') {
                text += '\n';
                return;
            }

            // img/input/hr
            if (shortEndedElements[name]) {
                text += ' ';
            }

            // Ingore script, video contents
            if (ignoreElements[name]) {
                text += ' ';
                return;
            }

            if (node.type == 3) {
                text += node.value;
            }

            // Walk all children
            if (!node.shortEnded) {
                if ((node = node.firstChild)) {
                    do {
                        walk(node);
                    } while ((node = node.next));
                }
            }

            // Add \n or \n\n for blocks or P
            if (blockElements[name] && currentNode.next) {
                text += '\n';

                if (name == 'p') {
                    text += '\n';
                }
            }
        }

        html = filter(html, [
            /<!\[[^\]]+\]>/g // Conditional comments
        ]);

        walk(domParser.parse(html));

        return text;
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
    function removeExplorerBrElementsAfterBlocks(self, o) {
        // Only filter word specific content
        if (!o.wordContent) {
            return;
        }

        var editor = self.editor,
            html = o.content;

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

        o.content = html;
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
     * @param {Object} self A reference to the plugin.
     * @param {String} content Content that needs to be processed.
     * @return {String} Processed contents.
     */
    function removeWebKitStyles(self, o) {
        var editor = self.editor,
            content = o.content;

        // skip internal content
        if (o.internal) {
            return;
        }

        if (isWordContent(editor, o.content)) {
            return;
        }

        // Filter away styles that isn't matching the target node
        var webKitStyles = editor.settings.paste_webkit_styles;

        if (editor.settings.clipboard_paste_remove_styles_if_webkit !== true || webKitStyles == "all") {
            return;
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

        o.content = content;
    }

    function preProcess(self, o) {
        var ed = self.editor,
            h = o.content,
            rb;

        // Process away some basic content
        h = h.replace(/^\s*(&nbsp;)+/g, ''); // nbsp entities at the start of contents
        h = h.replace(/(&nbsp;|<br[^>]*>)+\s*$/g, ''); // nbsp entities at the end of contents

        // skip plain text
        if (self.pasteAsPlainText) {
            return;
        }

        o.wordContent = isWordContent(ed, h) && !o.internal;

        if (o.wordContent) {
            h = WordFilter(ed, h);
        }

        // remove attributes
        if (ed.getParam('clipboard_paste_remove_attributes')) {
            var attribs = ed.getParam('clipboard_paste_remove_attributes').split(',');
            h = h.replace(new RegExp(' (' + attribs.join('|') + ')="([^"]+)"', 'gi'), '');
        }

        // replace double linebreaks with paragraphs, empty paragraphs may be removed later
        /*if (rb = ed.getParam('forced_root_block')) {
            var blocks = '';
            // only split if a double break exists
            if (h.indexOf('<br><br>') != -1) {
                // convert marker to paragraphs
                tinymce.each(h.split('<br><br>'), function (block) {
                    blocks += '<' + rb + '>' + block + '</' + rb + '>';
                });

                h = blocks;
            }
        }*/

        // Remove all spans
        if (ed.getParam('clipboard_paste_remove_spans')) {
            h = h.replace(/<\/?(span)[^>]*>/gi, '');
        }

        // convert some tags if cleanup is off
        if (ed.settings.verify_html === false) {
            h = h.replace(/<b\b([^>]*)>/gi, '<strong$1>');
            h = h.replace(/<\/b>/gi, '</strong>');
        }

        o.content = h;
    }

    function postProcess(self, o) {
        var ed = self.editor,
            dom = ed.dom;

        // skip plain text
        if (self.pasteAsPlainText) {
            return;
        }

        // Remove Apple style spans
        each(dom.select('span.Apple-style-span', o.node), function (n) {
            dom.remove(n, 1);
        });

        // Remove all classes
        if (ed.getParam('clipboard_paste_strip_class_attributes', 2) == 1) {
            // Remove class attribute
            each(dom.select('*[class]', o.node), function (el) {
                el.removeAttribute('class');
            });
        }

        // Convert width and height attributes to styles
        each(dom.select('table, td, th', o.node), function (n) {
            if ((value = dom.getAttrib(n, 'width'))) {
                dom.setStyle(n, 'width', value);
                dom.setAttrib(n, 'width', '');
            }

            if ((value = dom.getAttrib(n, 'height'))) {
                dom.setStyle(n, 'height', value);
                dom.setAttrib(n, 'height', '');
            }
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

        // fix table borders
        if (o.wordContent) {
            each(dom.select('table[style], td[style], th[style]', o.node), function (n) {
                var styles = {};

                each(borderStyles, function (name) {
                    // process each side, eg: border-left-width
                    if (/-(top|right|bottom|left)-/.test(name)) {
                        // get style
                        var value = dom.getStyle(n, name);

                        // remove default values
                        if (value === "currentcolor") {
                            value = "";
                        }

                        // convert to pixels
                        if (value && /^\d[a-z]?/.test(value)) {
                            value = convertToPixels(value);

                            if (value) {
                                value += "px";
                            }
                        }

                        styles[name] = value;
                    }
                });

                // remove styles with no width value
                each(styles, function (v, k) {
                    if (k.indexOf('-width') !== -1 && v === "") {
                        var s = k.replace(/-width/, '');
                        delete styles[s + '-style'];
                        delete styles[s + '-color'];
                        delete styles[k];
                    }
                });

                each(backgroundStyles, function (def, name) {
                    var value = dom.getStyle(n, name);

                    if (value === def) {
                        value = "";
                    }

                    styles[name] = value;
                });

                // remove borders
                dom.setStyle(n, 'border', '');

                // remove background
                dom.setStyle(n, 'background', '');

                // set styles
                dom.setStyles(n, styles);
            });
        }

        // image file/data regular expression
        var imgRe = /(file:|data:image)\//i,
            uploader = ed.plugins.upload;
        var canUpload = uploader && uploader.plugins.length;

        // Process images - remove local
        each(dom.select('img', o.node), function (el) {
            var s = dom.getAttrib(el, 'src');

            // remove or processs for upload img element if blank, local file url or base64 encoded
            if (!s || imgRe.test(s)) {
                if (ed.getParam('clipboard_paste_upload_images') && canUpload) {
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
        if (isIE) {
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

        // replace paragraphs with linebreaks
        /*if (!ed.getParam('forced_root_block')) {
            var frag = dom.createFragment('<br /><br />');

            each(dom.select('p,div', o.node), function (n) {
                // if the linebreaks are 
                if (n.parentNode.lastChild !== n) {
                    dom.insertAfter(frag, n);
                }

                dom.remove(n, 1);
            });
        }*/
    }

    /**
     * Process style attributes
     * @param node Node to process
     */
    function processStyles(editor, node) {
        var dom = editor.dom;

        // Style to keep
        var keepStyles = editor.getParam('clipboard_paste_retain_style_properties');

        // Style to remove
        var removeStyles = editor.getParam('clipboard_paste_remove_style_properties');

        // split to array if string
        if (keepStyles && tinymce.is(keepStyles, 'string')) {
            styleProps = tinymce.explode(keepStyles);

            each(styleProps, function (style, i) {
                if (style === "border") {
                    // add expanded border styles
                    styleProps = styleProps.concat(borderStyles);
                    return true;
                }
            });
        }

        // split to array if string
        if (removeStyles && tinymce.is(removeStyles, 'string')) {
            removeProps = tinymce.explode(removeStyles);

            each(removeProps, function (style, i) {
                if (style === "border") {
                    // add expanded border styles
                    removeProps = removeProps.concat(borderStyles);
                    return true;
                }
            });

            // remove from core styleProps array
            styleProps = tinymce.grep(styleProps, function (prop) {
                return tinymce.inArray(removeProps, prop) === -1;
            });
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

            // compress
            ns = dom.parseStyle(dom.serializeStyle(ns, n.nodeName));

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
            // convert to pixel value (round up to 1)
            v = Math.ceil(v / 1.33333);
            // convert to absolute integer
            v = Math.abs(v);
        }

        return v;
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

        var keepStyles, validStyles = {};

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

        // get retain styles or a subset to allow for text color and table borders
        keepStyles = settings.clipboard_paste_retain_style_properties;

        if (keepStyles) {
            each(keepStyles.split(/[, ]/), function (style) {
                // add all border styles if "border" is set
                if (style === "border") {
                    each(borderStyles, function (name) {
                        validStyles[name] = {};
                    });

                    return true;
                }

                validStyles[style] = {};
            });
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

                if (currentListNode.nodeName === "OL") {
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
                    if (type = isNumericList(nodeText)) {
                        // Parse OL start number
                        var matches = /([0-9]+)\./.exec(nodeText);
                        var start = 1;
                        if (matches) {
                            start = parseInt(matches[1], 10);
                        }

                        convertParagraphToLi(node, 'ol', start, type);
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
            return content;
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
                    continue;
                }

                if (/^Mso[\w]+/i.test(className) || editor.getParam('clipboard_paste_strip_class_attributes', 2)) {
                    node.attr('class', null);
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

    var Newlines = function () {
        var Entities = tinymce.html.Entities;

        var isPlainText = function (text) {
            // so basically any tag that is not one of the "p, div, br", or is one of them, but is followed
            // by some additional characters qualifies the text as not a plain text (having some HTML tags)
            return !/<(?:(?!\/?(?:div|p|br))[^>]*|(?:div|p|br)\s+\w[^>]+)>/.test(text);
        };

        var toBRs = function (text) {
            return text.replace(/\r?\n/g, '<br>');
        };

        var openContainer = function (rootTag, rootAttrs) {
            var key, attrs = [];
            var tag = '<' + rootTag;

            if (typeof rootAttrs === 'object') {
                for (key in rootAttrs) {
                    if (rootAttrs.hasOwnProperty(key)) {
                        attrs.push(key + '="' + Entities.encodeAllRaw(rootAttrs[key]) + '"');
                    }
                }

                if (attrs.length) {
                    tag += ' ' + attrs.join(' ');
                }
            }
            return tag + '>';
        };

        var toBlockElements = function (text, rootTag, rootAttrs) {
            var pieces = text.split(/\r?\n/);
            var i = 0,
                len = pieces.length;
            var stack = [];
            var blocks = [];
            var tagOpen = openContainer(rootTag, rootAttrs);
            var tagClose = '</' + rootTag + '>';
            var isLast, newlineFollows, isSingleNewline;

            // if single-line text then nothing to do
            if (pieces.length === 1) {
                return text;
            }

            for (; i < len; i++) {
                isLast = i === len - 1;
                newlineFollows = !isLast && !pieces[i + 1];
                isSingleNewline = !pieces[i] && !stack.length;

                stack.push(pieces[i] ? pieces[i] : '&nbsp;');

                if (isLast || newlineFollows || isSingleNewline) {
                    blocks.push(stack.join('<br>'));
                    stack = [];
                }

                if (newlineFollows) {
                    i++; // extra progress for extra newline
                }
            }

            return blocks.length === 1 ? blocks[0] : tagOpen + blocks.join(tagClose + tagOpen) + tagClose;
        };

        var convert = function (text, rootTag, rootAttrs) {
            return rootTag ? toBlockElements(text, rootTag, rootAttrs) : toBRs(text);
        };

        return {
            isPlainText: isPlainText,
            convert: convert,
            toBRs: toBRs,
            toBlockElements: toBlockElements
        };
    };

    /**
     * Gets various content types out of a datatransfer object.
     *
     * @param {DataTransfer} dataTransfer Event fired on paste.
     * @return {Object} Object with mime types and data for those mime types.
     */
    function getDataTransferItems(dataTransfer) {
        var items = {};

        if (dataTransfer) {
            // Use old WebKit/IE API
            if (dataTransfer.getData) {
                var legacyText = dataTransfer.getData('Text');
                if (legacyText && legacyText.length > 0) {
                    items['text/plain'] = legacyText;
                }
            }

            if (dataTransfer.types) {
                for (var i = 0; i < dataTransfer.types.length; i++) {
                    var contentType = dataTransfer.types[i];
                    items[contentType] = dataTransfer.getData(contentType);
                }
            }
        }

        return items;
    }

    /**
     * Gets various content types out of the Clipboard API. It will also get the
     * plain text using older IE and WebKit API:s.
     *
     * @param {ClipboardEvent} clipboardEvent Event fired on paste.
     * @return {Object} Object with mime types and data for those mime types.
     */
    function getClipboardContent(editor, clipboardEvent) {
        var content = getDataTransferItems(clipboardEvent.clipboardData || editor.getDoc().dataTransfer);

        // Edge 15 has a broken HTML Clipboard API see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11877517/
        if (navigator.userAgent.indexOf(' Edge/') !== -1) {
            content = tinymce.extend(content, {
                'text/html': ''
            });
        }

        return content;
    }

    function isKeyboardPasteEvent(e) {
        return (VK.metaKeyPressed(e) && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45);
    }

    /**
     * Chrome on Android doesn't support proper clipboard access so we have no choice but to allow the browser default behavior.
     *
     * @param {Event} e Paste event object to check if it contains any data.
     * @return {Boolean} true/false if the clipboard is empty or not.
     */
    function isBrokenAndroidClipboardEvent(e) {
        var clipboardData = e.clipboardData;
        return navigator.userAgent.indexOf('Android') != -1 && clipboardData && clipboardData.items && clipboardData.items.length === 0;
    }

    function hasContentType(clipboardContent, mimeType) {
        return mimeType in clipboardContent && clipboardContent[mimeType].length > 0;
    }

    function hasHtmlOrText(content) {
        return hasContentType(content, 'text/html') || hasContentType(content, 'text/plain');
    }

    // IE flag to include Edge
    var isIE = tinymce.isIE || tinymce.isIE12;

    tinymce.create('tinymce.plugins.ClipboardPlugin', {
        init: function (ed, url) {
            var self = this;

            self.editor = ed;
            self.url = url;

            new CutCopy().register(ed);

            var pasteBinElm, lastRng, keyboardPasteTimeStamp = 0;
            var pasteBinDefaultContent = '%MCEPASTEBIN%',
                keyboardPastePlainTextState;

            // set default paste state for dialog trigger
            this.canPaste = false;

            // set pasteAsPlainText flag
            this.pasteAsPlainText = false;

            // Setup plugin events
            self.onPreProcess = new tinymce.util.Dispatcher(this);
            self.onPostProcess = new tinymce.util.Dispatcher(this);

            ed.onGetClipboardContent = new tinymce.util.Dispatcher(this);
            ed.onPastePreProcess = new tinymce.util.Dispatcher(this);
            ed.onPastePostProcess = new tinymce.util.Dispatcher(this);

            // process quirks
            if (tinymce.isWebKit) {
                self.onPreProcess.add(function (self, o) {
                    removeWebKitStyles(self, o);
                });
            }

            if (isIE) {
                self.onPreProcess.add(function (self, o) {
                    removeExplorerBrElementsAfterBlocks(self, o);
                });
            }

            // Register default handlers
            self.onPreProcess.add(function (self, o) {
                preProcess(self, o);
            });

            self.onPostProcess.add(function (self, o) {
                postProcess(self, o);
            });

            // Register optional preprocess handler
            self.onPreProcess.add(function (pl, o) {
                ed.onPastePreProcess.dispatch(ed, o);
                ed.execCallback('paste_preprocess', pl, o);
            });

            // Register optional postprocess
            self.onPostProcess.add(function (pl, o) {
                ed.onPastePostProcess.dispatch(ed, o);
                ed.execCallback('paste_postprocess', pl, o);
            });

            self.pasteText = ed.getParam('clipboard_paste_text', 1);
            self.pasteHtml = ed.getParam('clipboard_paste_html', 1);

            // Add command for external usage
            ed.addCommand('mceInsertClipboardContent', function (u, data) {
                self.pasteAsPlainText = false;

                if (data.text) {
                    self.pasteAsPlainText = true;
                    pasteText(data.text);
                }

                if (data.content) {
                    pasteHtml(data.content);
                }
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

            function pasteText(text) {
                text = text.replace(/\r\n/g, '\n');
                text = new Newlines().convert(text, ed.settings.forced_root_block, ed.settings.forced_root_block_attrs);

                pasteHtml(text);
            }

            function pasteHtml(content, internal) {
                // create object to process
                var o = {
                    content : content,
                    internal: internal
                };

                // only process externally sourced content
                if (!internal) {
                    // Execute pre process handlers
                    self.onPreProcess.dispatch(self, o);

                    // convert urls in content
                    if (ed.getParam('clipboard_paste_convert_urls', true)) {
                        o.content = convertURLs(ed, o.content);
                    }

                    // Create DOM structure
                    o.node = ed.dom.create('div', 0, o.content);

                    // Execute post process handlers
                    self.onPostProcess.dispatch(self, o);

                    // Serialize content
                    o.content = ed.serializer.serialize(o.node, {
                        getInner: 1,
                        forced_root_block: ''
                    });

                    // remove empty paragraphs
                    if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                        o.content = o.content.replace(/<p([^>]+)>(&nbsp;|\u00a0)?<\/p>/g, '');
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

                            o.content = o.content.replace(re, "");
                        });
                    }
                }

                self._insert(o.content);

                // reset pasteAsPlainText state
                self.pasteAsPlainText = false;
            }

            // This function executes the process handlers and inserts the contents
            function insertClipboardContent(clipboardContent, internal) {
                var content, isPlainTextHtml;

                // get html content
                content = clipboardContent['x-tinymce/html'] || clipboardContent['text/html'];

                // trim
                content = trimHtml(content);

                // no content....?
                if (content === pasteBinDefaultContent) {
                    return;
                }

                // paste text
                if (self.pasteAsPlainText) {
                    isPlainTextHtml = (internal === false && new Newlines().isPlainText(content));

                    // Use plain text contents from Clipboard API unless the HTML contains paragraphs then
                    // we should convert the HTML to plain text since works better when pasting HTML/Word contents as plain text
                    if (hasContentType(clipboardContent, 'text/plain') && isPlainTextHtml) {
                        content = clipboardContent['text/plain'];
                    } else {
                        content = innerText(content);
                    }

                    pasteText(content);

                    return true;
                }

                // paste HTML
                pasteHtml(content, internal);
            }

            /**
             * Creates a paste bin element as close as possible to the current caret location and places the focus inside that element
             * so that when the real paste event occurs the contents gets inserted into this element
             * instead of the current editor selection element.
             */
            function createPasteBin() {
                var dom = ed.dom,
                    body = ed.getBody();
                var viewport = ed.dom.getViewPort(ed.getWin()),
                    scrollTop = viewport.y,
                    top = 20;
                var scrollContainer;

                lastRng = ed.selection.getRng();

                /**
                 * Returns the rect of the current caret if the caret is in an empty block before a
                 * BR we insert a temporary invisible character that we get the rect this way we always get a proper rect.
                 *
                 * TODO: This might be useful in core.
                 */
                function getCaretRect(rng) {
                    var rects, textNode, node, container = rng.startContainer;

                    rects = rng.getClientRects();
                    if (rects.length) {
                        return rects[0];
                    }

                    if (!rng.collapsed || container.nodeType != 1) {
                        return;
                    }

                    node = container.childNodes[lastRng.startOffset];

                    // Skip empty whitespace nodes
                    while (node && node.nodeType == 3 && !node.data.length) {
                        node = node.nextSibling;
                    }

                    if (!node) {
                        return;
                    }

                    // Check if the location is |<br>
                    // TODO: Might need to expand this to say |<table>
                    if (node.tagName == 'BR') {
                        textNode = dom.doc.createTextNode('\uFEFF');
                        node.parentNode.insertBefore(textNode, node);

                        rng = dom.createRng();
                        rng.setStartBefore(textNode);
                        rng.setEndAfter(textNode);

                        rects = rng.getClientRects();
                        dom.remove(textNode);
                    }

                    if (rects.length) {
                        return rects[0];
                    }
                }

                // Calculate top cordinate this is needed to avoid scrolling to top of document
                // We want the paste bin to be as close to the caret as possible to avoid scrolling
                if (lastRng.getClientRects) {
                    var rect = getCaretRect(lastRng);

                    if (rect) {
                        // Client rects gets us closes to the actual
                        // caret location in for example a wrapped paragraph block
                        top = scrollTop + (rect.top - dom.getPos(body).y);
                    } else {
                        top = scrollTop;

                        // Check if we can find a closer location by checking the range element
                        var container = lastRng.startContainer;
                        if (container) {
                            if (container.nodeType == 3 && container.parentNode != body) {
                                container = container.parentNode;
                            }

                            if (container.nodeType == 1) {
                                top = dom.getPos(container, scrollContainer || body).y;
                            }
                        }
                    }
                }

                // Create a pastebin
                pasteBinElm = dom.add(ed.getBody(), 'div', {
                    id: "mcepastebin",
                    contentEditable: true,
                    "data-mce-bogus": "all",
                    style: 'position: absolute; top: ' + top + 'px;' +
                        'width: 10px; height: 10px; overflow: hidden; opacity: 0'
                }, pasteBinDefaultContent);

                // Move paste bin out of sight since the controlSelection rect gets displayed otherwise on IE and Gecko
                if (isIE || tinymce.isGecko) {
                    dom.setStyle(pasteBinElm, 'left', dom.getStyle(body, 'direction', true) == 'rtl' ? 0xFFFF : -0xFFFF);
                }

                pasteBinElm.focus();
                ed.selection.select(pasteBinElm, true);
            }

            /**
             * Removes the paste bin if it exists.
             */
            function removePasteBin() {
                if (pasteBinElm) {
                    var pasteBinClone;

                    // WebKit/Blink might clone the div so
                    // lets make sure we remove all clones
                    // TODO: Man o man is this ugly. WebKit is the new IE! Remove this if they ever fix it!
                    while ((pasteBinClone = ed.dom.get('mcepastebin'))) {
                        ed.dom.remove(pasteBinClone);
                        ed.dom.unbind(pasteBinClone);
                    }

                    if (lastRng) {
                        ed.selection.setRng(lastRng);
                    }
                }

                pasteBinElm = lastRng = null;
            }

            /**
             * Returns the contents of the paste bin as a HTML string.
             *
             * @return {String} Get the contents of the paste bin.
             */
            function getPasteBinHtml() {
                var html = '',
                    pasteBinClones, i, clone, cloneHtml;

                // Since WebKit/Chrome might clone the paste bin when pasting
                // for example: <img style="float: right"> we need to check if any of them contains some useful html.
                // TODO: Man o man is this ugly. WebKit is the new IE! Remove this if they ever fix it!
                pasteBinClones = ed.dom.select('div[id=mcepastebin]');

                for (i = 0; i < pasteBinClones.length; i++) {
                    clone = pasteBinClones[i];

                    // Pasting plain text produces pastebins in pastebinds makes sence right!?
                    if (clone.firstChild && clone.firstChild.id == 'mcepastebin') {
                        clone = clone.firstChild;
                    }

                    cloneHtml = clone.innerHTML;

                    if (html != pasteBinDefaultContent) {
                        html += cloneHtml;
                    }
                }

                return html;
            }

            // This function grabs the contents from the clipboard by adding a
            // hidden div and placing the caret inside it and after the browser paste
            // is done it grabs that contents and processes that
            function getContentFromPasteBin(e) {
                var dom = ed.dom;

                // don't repeat paste
                if (dom.get('mcepastebin')) {
                    return;
                }

                createPasteBin();

                // old annoying IE....   
                if (isIE && isIE < 11) {
                    var rng;

                    // Select the container
                    rng = dom.doc.body.createTextRange();
                    rng.moveToElementText(pasteBinElm);
                    rng.execCommand('Paste');

                    var html = pasteBinElm.innerHTML;

                    // Check if the contents was changed, if it wasn't then clipboard extraction failed probably due
                    // to IE security settings so we pass the junk though better than nothing right
                    if (html === pasteBinDefaultContent) {
                        e.preventDefault();
                        return;
                    }

                    // Remove container
                    removePasteBin();

                    // For some odd reason we need to detach the the mceInsertContent call from the paste event
                    // It's like IE has a reference to the parent element that you paste in and the selection gets messed up
                    // when it tries to restore the selection
                    setTimeout(function () {
                        insertClipboardContent({
                            "text/html": html
                        });
                    }, 0);

                    // Block the real paste event
                    Event.cancel(e);

                    return;
                }

                function block(e) {
                    e.preventDefault();
                }

                // Block mousedown and click to prevent selection change
                dom.bind(ed.getDoc(), 'mousedown', block);
                dom.bind(ed.getDoc(), 'keydown', block);

                // Wait a while and grab the pasted contents
                window.setTimeout(function () {
                    var html = getPasteBinHtml();

                    removePasteBin();

                    insertClipboardContent({
                        "text/html": html
                    });

                    // Unblock events ones we got the contents
                    dom.unbind(ed.getDoc(), 'mousedown', block);
                    dom.unbind(ed.getDoc(), 'keydown', block);
                }, 0);
            }

            ed.onKeyDown.add(function (ed, e) {
                // block events
                if (!ed.getParam('clipboard_allow_cut', 1) && (VK.metaKeyPressed && e.keyCode == 88)) {
                    e.preventDefault();
                    return false;
                }

                if (!ed.getParam('clipboard_allow_copy', 1) && (VK.metaKeyPressed && e.keyCode == 67)) {
                    e.preventDefault();
                    return false;
                }

                // Ctrl+V or Shift+Insert
                if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                    // Prevent undoManager keydown handler from making an undo level with the pastebin in it
                    e.stopImmediatePropagation();

                    keyboardPastePlainTextState = e.shiftKey && e.keyCode == 86;

                    // mark as plain text paste
                    if (keyboardPastePlainTextState) {
                        self.pasteAsPlainText = true;

                        getContentFromPasteBin(e);
                    }
                }
            });

            function isHtmlPaste(content) {
                if (!hasContentType(content, "text/html")) {
                    return false;
                }

                return true;
            }

            function isSafari() {
                var ua = navigator.userAgent;
                return ua.indexOf('AppleWebKit') !== -1 && ua.indexOf('Safari') !== -1;
            }

            function isPlainTextPaste(content) {
                // CTRL + SHIFT + V or Paste Text dialog
                if (self.pasteAsPlainText) {
                    return true;
                }

                // IE does not support text/plain
                if (isIE) {
                    return false;
                }

                // prefer text/html
                if (hasContentType(content, "text/html")) {
                    return false;
                }

                if (hasContentType(content, "text/plain")) {
                    // Safari weirdness...
                    if (isSafari() && "text/rtf" in content) {
                        return false;
                    }

                    return true;
                }

                return false;
            }

            // Grab contents on paste event
            ed.onPaste.add(function (ed, e) {
                var clipboardContent = getClipboardContent(ed, e);

                var internal = hasContentType(clipboardContent, InternalHtml.internalHtmlMime());

                ed.onGetClipboardContent.dispatch(ed, clipboardContent);

                // use plain text
                if (!internal && isPlainTextPaste(clipboardContent)) {
                    e.preventDefault();
                    var text = clipboardContent["text/plain"];

                    // set pasteAsPlainText state
                    self.pasteAsPlainText = true;

                    pasteText(text);

                    return;
                }

                // use html from clipboard API
                if (isHtmlPaste(clipboardContent)) {
                    // if clipboard lacks internal mime type, inspect html for internal markings
                    if (!internal) {
                        internal = InternalHtml.isMarked(clipboardContent['text/html']);
                    }

                    e.preventDefault();
                    insertClipboardContent(clipboardContent, internal);

                    return;
                }

                // use paste bin
                getContentFromPasteBin(e);
            });

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
                                if (state) {
                                    open('http://www.mozilla.org/editor/midasdemo/securityprefs.html', '_blank');
                                }
                            });
                        } else {
                            ed.windowManager.alert(ed.getLang('clipboard_no_support'));
                        }
                    }
                });
            });

            // Add commands
            each(['mcePasteText', 'mcePaste'], function (cmd) {
                ed.addCommand(cmd, function () {
                    var doc = ed.getDoc(),
                        failed;

                    // just open the window
                    if (ed.getParam('clipboard_paste_use_dialog') || (isIE && !doc.queryCommandEnabled('Paste'))) {
                        return self._openWin(cmd);
                    } else {
                        try {
                            // set plain text mode
                            self.pasteAsPlainText = (cmd === "mcePasteText");

                            doc.execCommand('Paste', false, null);
                        } catch (e) {
                            failed = true;
                        }

                        // Chrome reports the paste command as supported however older IE:s will return false for cut/paste
                        if (!doc.queryCommandEnabled('Paste')) {
                            failed = true;
                        }

                        if (failed) {
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

        /**
         * Inserts the specified contents at the caret position.
         */
        _insert: function (content, skip_undo) {
            var ed = this.editor;

            // get validate setting
            var validate = ed.settings.validate;

            // reset validate setting
            ed.settings.validate = true;

            // insert content
            ed.execCommand('mceInsertContent', false, content);

            // reset validate
            ed.settings.validate = validate;
        }
    });
    // Register plugin
    tinymce.PluginManager.add('clipboard', tinymce.plugins.ClipboardPlugin);
})();