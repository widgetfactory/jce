var DOM = tinymce.DOM,
    each = tinymce.each;

var mapLayout = function (str) {
    var cls;

    switch (str) {
        case '1-2':
        case '2-1':
            cls = '8';
            break;
        case '1-3':
        case '3-1':
            cls = '9';
            break;
        case '2-1-1':
        case '1-1-2':
        case '1-2-1':
            cls = '6';
            break;
        case '4-1':
        case '1-4':
            cls = '10';
            break;
        case '2-1-1-1':
        case '1-1-1-2':
            cls = '5';
            break;
        case '3-2':
        case '1-1-3':
        case '3-1-1':
            cls = '7';
            break;
        case 'col-sm-8':
        case 'col-md-8':
        case 'col-lg-8':
        case 'col-xl-8':
            cls = ['2-1', '1-2'];
            break;
        case 'col-sm-9':
        case 'col-md-9':
        case 'col-lg-9':
        case 'col-xl-9':
            cls = ['3-1', '1-3'];
            break;
        case 'col-sm-6':
        case 'col-md-6':
        case 'col-lg-6':
        case 'col-xl-6':
            cls = ['2-1-1', '1-2-1', '1-1-2'];
            break;
        case 'col-sm-10':
        case 'col-md-10':
        case 'col-lg-10':
        case 'col-xl-10':
            cls = ['4-1', '1-4'];
            break;
        case 'col-sm-5':
        case 'col-md-5':
        case 'col-lg-5':
        case 'col-xl-5':
            cls = ['2-1-1-1', '1-1-1-2'];
            break;
        case 'col-sm-7':
        case 'col-md-7':
        case 'col-lg-7':
        case 'col-xl-7':
            cls = ['3-2', '1-1-3', '3-1-1', '2-3'];
            break;
    }

    return cls;
};

function apply(elm) {
    var classes = elm.getAttribute('class'),
        suffix = '',
        layout = '';

    //DOM.addClass(elm, 'd-flex');
    DOM.addClass(elm, 'row');

    var suffixMap = function (val) {
        var map = {
            'small': '-sm',
            'medium': '-md',
            'large': '-lg',
            'xlarge': '-xl'
        };
        return map[val] || '';
    };

    // stack width
    if (classes.indexOf('wf-columns-stack-') !== -1) {
        var stack = /wf-columns-stack-(small|medium|large|xlarge)/.exec(classes)[1];

        suffix = suffixMap(stack);

        DOM.addClass(DOM.select('.wf-column', elm), 'col' + suffix);
    }

    // layout
    if (classes.indexOf('wf-columns-layout-') !== -1) {
        layout = /wf-columns-layout-([0-9-]+|auto)/.exec(classes)[1];

        if (layout === 'auto') {
            DOM.addClass(DOM.select('.wf-column', elm), 'col' + suffix);
        } else {
            var pos = layout.split('-').shift(),
                cls = 'col' + suffix + '-' + mapLayout(layout);
            // first-child
            if (parseInt(pos, 10) > 1) {
                DOM.addClass(DOM.select('.wf-column:first-child', elm), cls);
                // nth-child
            } else if (layout === '1-2-1') {
                DOM.addClass(DOM.select('.wf-column:nth(2)', elm), cls);
                // last child
            } else if (parseInt(pos, 10) === 1) {
                DOM.addClass(DOM.select('.wf-column:last-child', elm), cls);
            }
        }
    }

    // gap
    if (classes.indexOf('wf-columns-gap-') !== -1) {
        var gap = /wf-columns-gap-(small|medium|large|none)/.exec(classes)[1];

        suffix = suffixMap(gap) || '-none';

        DOM.addClass(elm, 'flex-gap' + suffix);
    }
}

function remove(elm) {
    // check for identifying class
    if (!DOM.hasClass(elm, 'row')) {
        return;
    }

    // array of classes used for the layout
    var layoutClasses = [
        'col-sm', 'col-md', 'col-lg', 'col-xl',
        'col-sm-8', 'col-md-8', 'col-lg-8', 'col-xl-8',
        'col-sm-9', 'col-md-9', 'col-lg-9', 'col-xl-9',
        'col-sm-10', 'col-md-10', 'col-lg-10', 'col-xl-10',
        'col-sm-5', 'col-md-5', 'col-lg-5', 'col-xl-5',
        'col-sm-7', 'col-md-7', 'col-lg-7', 'col-xl-7'
    ];

    var classes = elm.getAttribute('class'),
        stack = '',
        layout = 'wf-columns-layout-auto';
    var nodes = DOM.select('div[class*="col"]', elm);

    var suffixMap = function (val) {
        var map = {
            'sm': 'small',
            'md': 'medium',
            'lg': 'large',
            'xl': 'xlarge'
        };
        return map[val] || '';
    };

    each(nodes, function (node, i) {
        var cls = node.getAttribute('class');

        // has a width class
        if (cls && cls.indexOf('col-') !== -1) {
            var match, values = [];

            // remove existing classes
            each(cls.split(' '), function (val) {
                if (val && val.indexOf('col-') == 0) {
                    match = /col-(sm|md|lg|xl)(-[0-9]+)?/.exec(val);

                    if (match && tinymce.inArray(layoutClasses, match[0]) != -1) {
                        DOM.removeClass(node, match[0]);
                    }
                }
            });

            if (match) {
                values = mapLayout(match[0]);

                var suffix = suffixMap(match[1]);

                if (suffix) {
                    stack = 'wf-columns-stack-' + suffix;
                }

                if (values) {
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
            }
        }

        DOM.removeClass(node, 'col');
    });

    // get gap width
    if (classes.indexOf('flex-gap-') !== -1) {
        var gap = /flex-gap-(none|sm|md|lg)?/.exec(classes)[1];

        if (gap && gap !== 'md') {
            var suffix = suffixMap(gap) || 'none';

            DOM.addClass(elm, 'wf-columns-gap-' + suffix);

            // remove existing
            DOM.removeClass(elm, 'uk-flex-gap-' + gap);
        }
    }


    // add stack and layout classes
    DOM.addClass(elm, layout);
    DOM.addClass(elm, stack);

    // remove all classes
    each(['row', 'col', 'col-sm', 'col-md', 'col-lg', 'col-xl', 'flex-gap-sm', 'flex-gap-md', 'flex-gap-lg', 'flex-gap-none'], function (cls) {
        DOM.removeClass(elm, cls);
    });
}

export default {
    apply : apply,
    remove : remove
};