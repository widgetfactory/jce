import * as Utils from './Utils.js';
import * as WordFilter from './WordFilter';

var each = tinymce.each;

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
function removeExplorerBrElementsAfterBlocks(e, o) {
    // Only filter word specific content
    if (!o.wordContent) {
        return;
    }

    var html = o.content, editor = e.editor;

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
    html = Utils.filter(html, [
        [explorerBlocksRegExp, '$1']
    ]);

    // IE9 also adds an extra BR element for each soft-linefeed and it also adds a BR for each word wrap break
    html = Utils.filter(html, [
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
function removeWebKitStyles(e, o) {
    var content = o.content, editor = e.editor;

    // skip internal content
    if (o.internal) {
        return;
    }

    if (WordFilter.isWordContent(editor, o.content)) {
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

export {
    removeExplorerBrElementsAfterBlocks,
    removeWebKitStyles
};