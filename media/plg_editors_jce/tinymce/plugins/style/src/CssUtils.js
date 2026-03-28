/* eslint-disable dot-notation */
/**
 * @package     JCE
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

/**
 * Parse an element's computed style object into a flat form-data object
 * suitable for populating the dialog controls via tabs.update(data).
 *
 * @param {Object} styles  Parsed CSS properties (from ed.dom.parseStyle)
 * @param {Object} ed      The TinyMCE editor instance
 * @returns {Object}
 */
export function stylesToData(styles, ed) {
    var data = {};

    // ── Text ────────────────────────────────────────────────────────────────
    data.font_family = styles['font-family'] || '';
    data.font_size = styles['font-size'] || '';
    data.font_style = styles['font-style'] || '';
    data.font_weight = styles['font-weight'] || '';
    data.font_variant = styles['font-variant'] || '';
    data.text_transform = styles['text-transform'] || '';
    data.line_height = styles['line-height'] || '';
    data.color = styles['color'] ? ed.dom.toHex(styles['color']) : '';

    var dec = styles['text-decoration'] || '';
    data.text_dec_underline = /underline/i.test(dec);
    data.text_dec_overline = /overline/i.test(dec);
    data.text_dec_linethrough = /line-through/i.test(dec);
    data.text_dec_blink = /blink/i.test(dec);
    data.text_dec_none = /\bnone\b/i.test(dec);

    // ── Background ──────────────────────────────────────────────────────────
    data.background_color = styles['background-color'] ? ed.dom.toHex(styles['background-color']) : '';
    var bgImg = styles['background-image'] || '';
    data.background_image = bgImg.replace(/url\(["']?([^"')]+)["']?\)/i, '$1');
    data.background_repeat = styles['background-repeat'] || '';
    data.background_attachment = styles['background-attachment'] || '';
    var bgPosParts = (styles['background-position'] || '').split(/\s+/);
    data.background_position_h = bgPosParts[0] || '';
    data.background_position_v = bgPosParts[1] || '';

    // ── Block ────────────────────────────────────────────────────────────────
    data.word_spacing = styles['word-spacing'] || '';
    data.letter_spacing = styles['letter-spacing'] || '';
    data.vertical_align = styles['vertical-align'] || '';
    data.text_align = styles['text-align'] || '';
    data.text_indent = styles['text-indent'] || '';
    data.white_space = styles['white-space'] || '';
    data.display = styles['display'] || '';

    // ── Box ──────────────────────────────────────────────────────────────────
    data.width = styles['width'] || '';
    data.height = styles['height'] || '';
    data.float = styles['float'] || styles['css-float'] || '';
    data.clear = styles['clear'] || '';

    // padding / margin: shorthand → four sides
    function fourSideData(prefix, prop) {
        var shorthand = styles[prop] || '';
        var t = styles[prop + '-top'] || shorthand;
        var r = styles[prop + '-right'] || shorthand;
        var b = styles[prop + '-bottom'] || shorthand;
        var l = styles[prop + '-left'] || shorthand;
        data[prefix + '_same'] = t !== '' && t === r && r === b && b === l;
        data[prefix + '_top'] = t;
        data[prefix + '_right'] = r;
        data[prefix + '_bottom'] = b;
        data[prefix + '_left'] = l;
    }

    fourSideData('padding', 'padding');
    fourSideData('margin', 'margin');

    // ── Border ───────────────────────────────────────────────────────────────
    function borderSideData(prefix, prop) {
        var shorthand = styles['border-' + prop] || '';
        var t = styles['border-top-' + prop] || shorthand;
        var r = styles['border-right-' + prop] || shorthand;
        var b = styles['border-bottom-' + prop] || shorthand;
        var l = styles['border-left-' + prop] || shorthand;
        if (prop === 'color') {
            t = t ? ed.dom.toHex(t) : '';
            r = r ? ed.dom.toHex(r) : '';
            b = b ? ed.dom.toHex(b) : '';
            l = l ? ed.dom.toHex(l) : '';
        }
        data[prefix + '_same'] = t !== '' && t === r && r === b && b === l;
        data[prefix + '_top'] = t;
        data[prefix + '_right'] = r;
        data[prefix + '_bottom'] = b;
        data[prefix + '_left'] = l;
    }

    borderSideData('border_style', 'style');
    borderSideData('border_width', 'width');
    borderSideData('border_color', 'color');

    // ── List ─────────────────────────────────────────────────────────────────
    data.list_style_type = styles['list-style-type'] || '';
    data.list_style_position = styles['list-style-position'] || '';
    var lstImg = styles['list-style-image'] || '';
    data.list_style_image = lstImg.replace(/url\(["']?([^"')]+)["']?\)/i, '$1');

    // ── Positioning ──────────────────────────────────────────────────────────
    data.position = styles['position'] || '';
    data.visibility = styles['visibility'] || '';
    data.z_index = styles['z-index'] || '';
    data.overflow = styles['overflow'] || '';

    var pt = styles['top'] || '', pr = styles['right'] || '',
        pb = styles['bottom'] || '', pl = styles['left'] || '';
    data.placement_same = pt !== '' && pt === pr && pr === pb && pb === pl;
    data.placement_top = pt; data.placement_right = pr;
    data.placement_bottom = pb; data.placement_left = pl;

    // clip: rect(top right bottom left)
    var clip = styles['clip'] || '';
    var cm = clip.match(/rect\(([^)]+)\)/);
    var cv = ['', '', '', ''];
    if (cm) {
        cv = cm[1].replace(/,/g, ' ').trim().split(/\s+/);

        while (cv.length < 4) {
            cv.push('');
        }

        cv = cv.map(function (v) {
            return v === 'auto' ? '' : v;
        });
    }
    data.clip_same = cv[0] !== '' && cv[0] === cv[1] && cv[1] === cv[2] && cv[2] === cv[3];
    data.clip_top = cv[0]; data.clip_right = cv[1];
    data.clip_bottom = cv[2]; data.clip_left = cv[3];

    return data;
}

/**
 * Build a CSS properties object from a flat form-data object returned by
 * tabs.submit().
 *
 * @param {Object} data  Form field values
 * @returns {Object}     CSS key→value pairs
 */
export function dataToStyles(data) {
    var styles = {};

    function set(prop, val) {
        if (val) {
            styles[prop] = val;
        }
    }

    function setColor(prop, val) {
        if (val && val !== '#') {
            styles[prop] = val;
        }
    }

    // ── Text ────────────────────────────────────────────────────────────────
    set('font-family', data.font_family);
    set('font-size', data.font_size);
    set('font-style', data.font_style);
    set('font-weight', data.font_weight);
    set('font-variant', data.font_variant);
    set('text-transform', data.text_transform);
    set('line-height', data.line_height);
    setColor('color', data.color);

    if (data.text_dec_none) {
        styles['text-decoration'] = 'none';
    } else {
        var dec = [];

        if (data.text_dec_underline) {
            dec.push('underline');
        }

        if (data.text_dec_overline) {
            dec.push('overline');
        }

        if (data.text_dec_linethrough) {
            dec.push('line-through');
        }

        if (data.text_dec_blink) {
            dec.push('blink');
        }

        if (dec.length) {
            styles['text-decoration'] = dec.join(' ');
        }
    }

    // ── Background ──────────────────────────────────────────────────────────
    setColor('background-color', data.background_color);

    if (data.background_image) {
        styles['background-image'] = 'url(' + data.background_image + ')';
    }

    set('background-repeat', data.background_repeat);
    set('background-attachment', data.background_attachment);

    if (data.background_position_h || data.background_position_v) {
        styles['background-position'] = (data.background_position_h || '0%') + ' ' + (data.background_position_v || '0%');
    }

    // ── Block ────────────────────────────────────────────────────────────────
    set('word-spacing', data.word_spacing);
    set('letter-spacing', data.letter_spacing);
    set('vertical-align', data.vertical_align);
    set('text-align', data.text_align);
    set('text-indent', data.text_indent);
    set('white-space', data.white_space);
    set('display', data.display);

    // ── Box ──────────────────────────────────────────────────────────────────
    set('width', data.width);
    set('height', data.height);
    set('float', data.float);
    set('clear', data.clear);

    function fourSide(prop, sameKey, tKey, rKey, bKey, lKey, isColor) {
        var fn = isColor ? setColor : set;
        var t = data[tKey], r = data[rKey], b = data[bKey], l = data[lKey];
        if (t || r || b || l) {
            if (data[sameKey]) {
                fn(prop, t);
            } else {
                fn(prop + '-top', t);
                fn(prop + '-right', r);
                fn(prop + '-bottom', b);
                fn(prop + '-left', l);
            }
        }
    }

    fourSide('padding', 'padding_same', 'padding_top', 'padding_right', 'padding_bottom', 'padding_left');
    fourSide('margin', 'margin_same', 'margin_top', 'margin_right', 'margin_bottom', 'margin_left');

    // ── Border ───────────────────────────────────────────────────────────────
    function borderFour(prop, sameKey, tKey, rKey, bKey, lKey, isColor) {
        var fn = isColor ? setColor : set;
        var t = data[tKey], r = data[rKey], b = data[bKey], l = data[lKey];
        if (t || r || b || l) {
            if (data[sameKey]) {
                fn('border-' + prop, t);
            } else {
                fn('border-top-' + prop, t);
                fn('border-right-' + prop, r);
                fn('border-bottom-' + prop, b);
                fn('border-left-' + prop, l);
            }
        }
    }

    borderFour('style', 'border_style_same', 'border_style_top', 'border_style_right', 'border_style_bottom', 'border_style_left');
    borderFour('width', 'border_width_same', 'border_width_top', 'border_width_right', 'border_width_bottom', 'border_width_left');
    borderFour('color', 'border_color_same', 'border_color_top', 'border_color_right', 'border_color_bottom', 'border_color_left', true);

    // ── List ─────────────────────────────────────────────────────────────────
    set('list-style-type', data.list_style_type);
    set('list-style-position', data.list_style_position);

    if (data.list_style_image) {
        styles['list-style-image'] = 'url(' + data.list_style_image + ')';
    }

    // ── Positioning ──────────────────────────────────────────────────────────
    set('position', data.position);
    set('visibility', data.visibility);
    set('z-index', data.z_index);
    set('overflow', data.overflow);

    var pt = data.placement_top, pr = data.placement_right,
        pb = data.placement_bottom, pl = data.placement_left;

    if (pt || pr || pb || pl) {
        if (data.placement_same) {
            set('top', pt); set('right', pt); set('bottom', pt); set('left', pt);
        } else {
            set('top', pt); set('right', pr); set('bottom', pb); set('left', pl);
        }
    }

    var ct = data.clip_top, cr = data.clip_right,
        cb = data.clip_bottom, cl = data.clip_left;

    if (ct || cr || cb || cl) {
        if (data.clip_same) {
            cr = ct; cb = ct; cl = ct;
        }
        ct = ct || 'auto'; cr = cr || 'auto'; cb = cb || 'auto'; cl = cl || 'auto';

        if (ct !== 'auto' || cr !== 'auto' || cb !== 'auto' || cl !== 'auto') {
            styles['clip'] = 'rect(' + ct + ' ' + cr + ' ' + cb + ' ' + cl + ')';
        }
    }

    return styles;
}
