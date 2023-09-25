var DOM = tinymce.DOM,
    each = tinymce.each;

var mapLayout = function (str) {
    var cls;

    switch (str) {
        case '1-2':
        case '2-1':
            cls = 'uk-width-2-3';
            break;
        case '1-3':
        case '3-1':
            cls = 'uk-width-3-4';
            break;
        case '2-1-1':
        case '1-1-2':
        case '1-2-1':
            cls = 'uk-width-1-2';
            break;
        case '4-1':
        case '1-4':
            cls = 'uk-width-1-5';
            break;
        case '2-1-1-1':
        case '1-1-1-2':
            cls = 'uk-width-2-5';
            break;
        case '1-1-3':
        case '2-3':
            cls = 'uk-width-3-5';
            break;
        case '3-1-1':
        case '3-2':
            cls = 'uk-width-3-5';
            break;
        case 'uk-width-2-3':
            cls = ['2-1', '1-2'];
            break;
        case 'uk-width-3-4':
            cls = ['3-1', '1-3'];
            break;
        case 'uk-width-1-2':
            cls = ['2-1-1', '1-2-1', '1-1-2'];
            break;
        case 'uk-width-1-5':
            cls = ['4-1', '1-4'];
            break;
        case 'uk-width-2-5':
            cls = ['2-1-1-1', '1-1-1-2'];
            break;
        case 'uk-width-3-5':
            cls = ['3-2', '1-1-3', '3-1-1', '2-3'];
            break;
    }

    return cls;
};

function apply(elm) {
    var classes = elm.getAttribute('class'),
        suffix = [],
        layout = '';

    DOM.addClass(elm, 'uk-flex');

    var suffixMap = function (val) {
        var map = {
            'small': '@s',
            'medium': '@m',
            'large': '@l',
            'xlarge': '@xl'
        };
        return map[val] || '';
    };

    // get stack width
    if (classes.indexOf('wf-columns-stack-') !== -1) {
        var stack = /wf-columns-stack-(small|medium|large|xlarge)/.exec(classes)[1];
        suffix = ['-' + stack, suffixMap(stack)]; // @s, @m, @l, @xl

        DOM.addClass(elm, 'uk-flex-wrap');
    }

    // get layout
    if (classes.indexOf('wf-columns-layout-') !== -1) {
        layout = /wf-columns-layout-([0-9-]+|auto)/.exec(classes)[1];

        if (layout === 'auto') {
            DOM.addClass(DOM.select('.wf-column', elm), 'uk-flex-auto uk-flex-item-auto');
        } else {
            var weights = layout.split('-'), first = parseInt(weights[0], 10), last = parseInt(weights[weights.length - 1], 10);
            var cls = '';

            each(suffix, function (sfx) {
                cls += ' ' + mapLayout(layout) + sfx;
            });

            cls = tinymce.trim(cls);

            // first-child
            if (first > last) {
                DOM.addClass(DOM.select('.wf-column:first-child', elm), cls);
                // nth-child
            } else if (layout === '1-2-1') {
                DOM.addClass(DOM.select('.wf-column:nth(2)', elm), cls);
                // last child
            } else {
                DOM.addClass(DOM.select('.wf-column:last-child', elm), cls);
            }
        }
    }

    // uikit default
    var gap = 'medium';

    // gap
    if (classes.indexOf('wf-columns-gap-') !== -1) {
        gap = /wf-columns-gap-(small|medium|large|none)/.exec(classes)[1];
    }

    DOM.addClass(elm, 'uk-flex-gap-' + gap);

    each(suffix, function (sfx) {
        DOM.addClass(elm, 'uk-child-width-expand' + sfx);
    });
}

function remove(elm) {
    // check for identifying class
    if (!DOM.hasClass(elm, 'uk-flex')) {
        return;
    }

    var suffixMap = function (val) {
        var map = {
            '@s': 'small',
            '@m': 'medium',
            '@l': 'large',
            '@xl': 'xlarge'
        };
        return map[val] || '';
    };

    var classes = elm.getAttribute('class');

    // get stack width
    if (classes.indexOf('uk-child-width-expand@') !== -1) {
        var stack = /uk-child-width-expand(@s|@m|@l|@xl)/.exec(classes);

        if (stack) {
            var suffix = suffixMap(stack[1]);

            if (suffix) {
                DOM.addClass(elm, 'wf-columns-stack-' + suffix);
            }

            DOM.removeClass(elm, stack[0]);
        }

        // remove wrap class
        DOM.removeClass(elm, 'uk-flex-wrap');
    }

    // get gap width
    if (classes.indexOf('uk-flex-gap-') !== -1) {
        var gap = /uk-flex-gap-(none|small|medium|large)/.exec(classes)[1];

        if (gap) {
            DOM.addClass(elm, 'wf-columns-gap-' + gap);

            // remove existing
            DOM.removeClass(elm, 'uk-flex-gap-' + gap);
        }
    }

    // get child columns
    var nodes = tinymce.grep(elm.childNodes, function (node) {
        if (node.nodeName === "DIV") {
            return node;
        }
    });

    var layout = 'wf-columns-layout-auto';

    each(nodes, function (node, i) {
        var cls = node.getAttribute('class');

        // has a width class
        if (cls && cls.indexOf('uk-width-') !== -1) {
            var rx = /uk-width-([0-9-]+)(?:@s|@m|@l|@xl|-small|-medium|-large|-xlarge)/g,
                match = rx.exec(cls),
                values = [];

            // extract layout
            if (match) {
                values = mapLayout('uk-width-' + match[1]);
            }

            // remove all matching classes
            each(cls.match(rx), function (str) {
                DOM.removeClass(node, str);
            });

            if (!values.length) {
                return true;
            }

            // first child
            if (i === 0) {
                layout = 'wf-columns-layout-' + values[0];
                // last child
            } else if (i === nodes.length - 1) {
                layout = 'wf-columns-layout-' + values[values.length - 1];
                // middle...?
            } else {
                layout = 'wf-columns-layout-' + values[1];
            }
        }

        DOM.removeClass(node, 'uk-flex-auto');
        DOM.removeClass(node, 'uk-flex-item-auto');
    });

    DOM.removeClass(elm, 'uk-flex');

    DOM.addClass(elm, layout);

    // remove all classes
    each(['uk-flex', 'uk-child-width-expand', 'uk-flex-wrap', 'uk-child-width-expand@s', 'uk-child-width-expand@m', 'uk-child-width-expand@l', 'uk-child-width-expand@xl', 'uk-child-width-expand-small', 'uk-child-width-expand-medium', 'uk-child-width-expand-large', 'uk-child-width-expand-xlarge', 'uk-flex-auto', 'uk-flex-item-auto', 'uk-width-2-3', 'uk-width-3-4', 'uk-width-1-2'], function (cls) {
        DOM.removeClass(elm, cls);
    });
}

export default {
    apply : apply,
    remove : remove
};