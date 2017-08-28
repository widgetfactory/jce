/**
 * editor_plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 * Adapted for JCE 2.6 / TinyMCE 3.3.x
 */

/*global tinymce:true */
(function() {
    var each = tinymce.each,
        extend = tinymce.extend;

    function toHtml(s) {
        s = tinymce.trim(s);

        if (typeof marked !== "undefined") {
            return marked(s);
        }

        return s;
    }

    function htmlTo(s) {
        s = tinymce.trim(s);

        return s;
    }

    function cleanURL(src, mode) {

        function toUnicode(s) {
            var c = s.toString(16).toUpperCase();

            while (c.length < 4) {
                c = '0' + c;
            }

            return '\\u' + c;
        }

        function clean(s, spaces) {
            // replace spaces with underscore
            if (!spaces) {
                s = s.replace(/[\s ]/g, '_');
            }

            // replace slashes
            s = s.replace(/[\/\\\\]+/g, '/');

            function cleanChars(s) {
                // remove some common characters
                s = s.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]/g, '');
                var r = '';

                for (var i = 0, ln = s.length; i < ln; i++) {
                    var ch = s[i];
                    // only process on possible restricted characters or utf-8 letters/numbers
                    if (/[^\w\.\-~\s ]/.test(ch)) {
                        // skip any character less than 127, eg: &?@* etc.
                        if (toUnicode(ch.charCodeAt(0)) < '\\u007F') {
                            continue;
                        }
                    }

                    r += ch;
                }

                s = r;

                return s;
            }

            s = s.split('/').map(function(string) {
                return cleanChars(string, mode);
            }).join('/');

            // remove multiple period characters
            s = s.replace(/(\.){2,}/g, '');

            // remove leading period
            s = s.replace(/^\./, '');

            // remove trailing period
            s = s.replace(/\.$/, '');

            // remove leading / trailing slash
            s = s.replace(/^\//, '').replace(/\/$/, '');

            return s;
        }

        src = clean(src, true);

        return src;
    }

    tinymce.create('tinymce.plugins.TextPatternPlugin', {
        init: function(editor, url) {
            var isPatternsDirty = true,
                patterns;

            // load "marked"
            if (editor.settings.textpattern_use_markdown) {
                var scriptLoader = new tinymce.dom.ScriptLoader();
                scriptLoader.add(url + '/js/marked.min.js');
                scriptLoader.loadQueue(function() {
                    if (typeof marked !== "undefined") {
                        marked.setOptions({
                            renderer: new marked.Renderer(),
                            gfm: true
                        });
                    }
                });
            }

            editor.onPreInit.add(function(ed) {
                ed.formatter.register('markdownlink', {
                    inline: 'a',
                    selector: 'a',
                    remove: 'all',
                    split: true,
                    deep: true,
                    onmatch: function() {
                        return true;
                    },

                    onformat: function(elm, fmt, vars) {
                        console.log(elm, fmt, vars);

                        tinymce.each(vars, function(value, key) {
                            ed.dom.setAttrib(elm, key, value);
                        });
                    }
                });
            });

            editor.onBeforeSetContent.add(function(ed, o) {
                if (editor.settings.textpattern_use_markdown) {
                    o.content = toHtml(o.content);
                }
            });

            editor.onPostProcess.add(function(ed, o) {
                if (editor.settings.textpattern_use_markdown) {
                    o.content = toHtml(o.content);
                }
            });

            editor.addCommand('InsertMarkdownImage', function(ui, node) {
                var data = node.split(']('),
                    dom = editor.dom;

                if (data.length < 2) {
                    return false;
                }

                var alt = data[0],
                    src = data[1];

                // clean src
                src = src.substring(0, src.length);

                // clean alt
                alt = alt.substring(1, 1);

                // clean up url
                src = cleanURL(src);

                src = editor.convertURL(src);

                // create args object
                var args = { 'alt': alt, 'src': src };

                // empty src, create placeholder
                if (!src) {
                    args['data-mce-upload-marker'] = 1;
                    args['width'] = 320;
                    args['height'] = 240;
                    args['src'] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    args['class'] = 'mceItemUploadMarker';
                }

                var html = dom.createHTML('img', args);

                editor.execCommand('mceInsertContent', false, html);

                return false;
            });

            var custom_patterns = editor.getParam('textpattern_custom_patterns', '', 'hash');

            editor.addCommand('InsertCustomTextPattern', function(ui, node) {
                node = node.replace(/^\$\$|\$\$$/g, '');

                var html;

                if (tinymce.is(custom_patterns, "function")) {
                    html = custom_patterns(node);
                }

                if (tinymce.is(custom_patterns, "object")) {
                    html = custom_patterns[node];
                }

                if (tinymce.is(html)) {
                    editor.execCommand('mceReplaceContent', false, html);
                }
            });

            patterns = editor.settings.textpattern_patterns || [
                { start: '*', end: '*', format: 'italic' },
                { start: '**', end: '**', format: 'bold' },
                { start: '~~', end: '~~', format: 'strikethrough' },
                { start: '`', end: '`', format: 'code' },
                //{start: '++', end: '++', format: 'iframe', attribute: 'src'},
                { start: '![', end: ')', cmd: 'InsertMarkdownImage', remove: true },
                //{ start: '[', end: ')', format: 'markdownlink' },
                { start: '#', format: 'h1' },
                { start: '##', format: 'h2' },
                { start: '###', format: 'h3' },
                { start: '####', format: 'h4' },
                { start: '#####', format: 'h5' },
                { start: '######', format: 'h6' },
                { start: '>', format: 'blockquote' },
                { start: '1. ', cmd: 'InsertOrderedList' },
                { start: '* ', cmd: 'InsertUnorderedList' },
                { start: '- ', cmd: 'InsertUnorderedList' },
                { start: '$$', end: '$$', cmd: 'InsertCustomTextPattern' }
            ];

            // Returns a sorted patterns list, ordered descending by start length
            function getPatterns() {
                if (isPatternsDirty) {
                    patterns.sort(function(a, b) {
                        if (a.start.length > b.start.length) {
                            return -1;
                        }

                        if (a.start.length < b.start.length) {
                            return 1;
                        }

                        return 0;
                    });

                    isPatternsDirty = false;
                }

                return patterns;
            }

            // Finds a matching pattern to the specified text
            function findPattern(text) {
                var patterns = getPatterns();

                for (var i = 0; i < patterns.length; i++) {
                    if (text.indexOf(patterns[i].start) !== 0) {
                        continue;
                    }

                    if (patterns[i].end && text.lastIndexOf(patterns[i].end) != text.length - patterns[i].end.length) {
                        continue;
                    }

                    return patterns[i];
                }
            }

            // Finds the best matching end pattern
            function findEndPattern(text, offset, delta) {
                var patterns, pattern, i;

                // Find best matching end
                patterns = getPatterns();
                for (i = 0; i < patterns.length; i++) {
                    pattern = patterns[i];
                    if (pattern.end && text.substr(offset - pattern.end.length - delta, pattern.end.length) == pattern.end) {
                        return pattern;
                    }
                }
            }

            // Handles inline formats like *abc* and **abc**
            function applyInlineFormat(space) {
                var selection, dom, rng, container, offset, startOffset, text, patternRng, pattern, delta, format;

                function splitContainer() {
                    // Split text node and remove start/end from text node
                    container = container.splitText(startOffset);
                    container.splitText(offset - startOffset - delta);
                    container.deleteData(0, pattern.start.length);
                    container.deleteData(container.data.length - pattern.end.length, pattern.end.length);
                }

                selection = editor.selection;
                dom = editor.dom;

                if (!selection.isCollapsed()) {
                    return;
                }

                rng = selection.getRng(true);
                container = rng.startContainer;
                offset = rng.startOffset;
                text = container.data;
                delta = space ? 1 : 0;

                if (container.nodeType != 3) {
                    return;
                }

                // Find best matching end
                pattern = findEndPattern(text, offset, delta);
                if (!pattern) {
                    return;
                }

                // Find start of matched pattern
                // TODO: Might need to improve this if there is nested formats
                startOffset = Math.max(0, offset - delta);
                startOffset = text.lastIndexOf(pattern.start, startOffset - pattern.end.length - 1);

                if (startOffset === -1) {
                    return;
                }

                // Setup a range for the matching word
                patternRng = dom.createRng();
                patternRng.setStart(container, startOffset);
                patternRng.setEnd(container, offset - delta);
                pattern = findPattern(patternRng.toString());

                if (!pattern || !pattern.end) {
                    return;
                }

                // If container match doesn't have anything between start/end then do nothing
                if (container.data.length <= pattern.start.length + pattern.end.length) {
                    return;
                }

                if (pattern.format) {
                    format = editor.formatter.get(pattern.format);

                    if (format && format[0].inline) {
                        splitContainer();

                        /*var args = {};

                        if (pattern.attribute) {
                            var values  = container.data.split(pattern.delim || ',');

                            tinymce.each(tinymce.explode(pattern.attribute), function(attr, i) {
                                args[attr] = values[i];
                            });
                        }*/

                        editor.formatter.apply(pattern.format, {}, container);
                        return container;
                    }
                }

                /*if (pattern.cmd) {
                    splitContainer();

                    editor.execCommand(pattern.cmd, false, container);
                    return container;
                }*/
            }

            // Handles block formats like ##abc or 1. abc
            function applyBlockFormat() {
                var selection, dom, container, firstTextNode, node, format, textBlockElm, pattern, walker, rng, offset;

                selection = editor.selection;
                dom = editor.dom;

                if (!selection.isCollapsed()) {
                    return;
                }

                textBlockElm = dom.getParent(selection.getStart(), 'p');

                if (textBlockElm) {
                    walker = new tinymce.dom.TreeWalker(textBlockElm, textBlockElm);
                    while ((node = walker.next())) {
                        if (node.nodeType == 3) {
                            firstTextNode = node;
                            break;
                        }
                    }

                    if (firstTextNode) {
                        pattern = findPattern(firstTextNode.data);
                        if (!pattern) {
                            return;
                        }

                        rng = selection.getRng(true);
                        container = rng.startContainer;
                        offset = rng.startOffset;

                        if (firstTextNode == container) {
                            offset = Math.max(0, offset - pattern.start.length);
                        }

                        if (tinymce.trim(firstTextNode.data).length == pattern.start.length) {
                            return;
                        }

                        if (pattern.format) {
                            format = editor.formatter.get(pattern.format);
                            if (format && format[0].block) {
                                firstTextNode.deleteData(0, pattern.start.length);
                                editor.formatter.apply(pattern.format, {}, firstTextNode);

                                rng.setStart(container, offset);
                                rng.collapse(true);
                                selection.setRng(rng);
                            }
                        }

                        if (pattern.cmd) {
                            editor.undoManager.add();

                            var length = pattern.start.length,
                                data = firstTextNode.data;

                            // remove pattern entirely
                            if (pattern.remove) {
                                length = firstTextNode.data.length;
                            }

                            firstTextNode.deleteData(0, length);

                            // pass to command
                            editor.execCommand(pattern.cmd, false, data);
                        }
                    }
                }
            }

            function handleEnter() {
                var rng, wrappedTextNode;

                wrappedTextNode = applyInlineFormat();

                if (wrappedTextNode) {
                    rng = editor.dom.createRng();
                    rng.setStart(wrappedTextNode, wrappedTextNode.data.length);
                    rng.setEnd(wrappedTextNode, wrappedTextNode.data.length);
                    editor.selection.setRng(rng);
                }

                applyBlockFormat();
            }

            function handleSpace() {
                var wrappedTextNode, lastChar, lastCharNode, rng, dom;

                wrappedTextNode = applyInlineFormat(true);

                if (wrappedTextNode) {
                    dom = editor.dom;
                    lastChar = wrappedTextNode.data.slice(-1);

                    // Move space after the newly formatted node
                    if (/[\u00a0 ]/.test(lastChar)) {
                        wrappedTextNode.deleteData(wrappedTextNode.data.length - 1, 1);
                        lastCharNode = dom.doc.createTextNode(lastChar);

                        if (wrappedTextNode.nextSibling) {
                            dom.insertAfter(lastCharNode, wrappedTextNode.nextSibling);
                        } else {
                            wrappedTextNode.parentNode.appendChild(lastCharNode);
                        }

                        rng = dom.createRng();
                        rng.setStart(lastCharNode, 1);
                        rng.setEnd(lastCharNode, 1);
                        editor.selection.setRng(rng);
                    }
                }
            }

            editor.onKeyDown.add(function(ed, e) {
                if (e.keyCode == 13 && !tinymce.VK.modifierPressed(e)) {
                    handleEnter();
                }
            });

            editor.onKeyUp.add(function(ed, e) {
                if (e.keyCode == 32 && !tinymce.VK.modifierPressed(e)) {
                    handleSpace();
                }
            });

            this.getPatterns = getPatterns;

            this.setPatterns = function(newPatterns) {
                patterns = newPatterns;
                isPatternsDirty = true;
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('textpattern', tinymce.plugins.TextPatternPlugin);
})();