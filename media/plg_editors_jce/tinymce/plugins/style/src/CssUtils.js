/* eslint-disable dot-notation */
/**
 * @package     JCE
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

const BORDER_STYLE_RE = /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/i;
const BORDER_WIDTH_RE = /^(thin|medium|thick|\d+(\.\d+)?(px|em|rem|%|pt|cm|mm|ex|ch|vw|vh|vmin|vmax))$/i;
const URL_RE = /url\(["']?([^"')]+)["']?\)/i;
const SIDES = ['top', 'right', 'bottom', 'left'];

// Parse "border" shorthand (e.g. "2px solid #b61616") into { width, style, color }
function parseBorderShorthand(val) {
    const result = { width: '', style: '', color: '' };
    if (!val) {
        return result;
    }
    for (const part of val.trim().split(/\s+/)) {
        if (BORDER_STYLE_RE.test(part)) {
            result.style = part;
        } else if (BORDER_WIDTH_RE.test(part)) {
            result.width = part;
        } else {
            result.color = part;
        }
    }
    return result;
}

function allEqual(a, b, c, d) {
    return a !== '' && a === b && b === c && c === d;
}

/**
 * Parse an element's computed style object into a flat form-data object
 * suitable for populating the dialog controls via tabs.update(data).
 *
 * @param {Object} styles  Parsed CSS properties (from ed.dom.parseStyle)
 * @param {Object} ed      The TinyMCE editor instance
 * @returns {Object}
 */
export function stylesToData(styles, ed) {
    const get = (prop) => styles[prop] || '';
    const toHex = (val) => val ? ed.dom.toHex(val) : '';

    // ── Background ──────────────────────────────────────────────────────────
    const [bgPosH = '', bgPosV = ''] = get('background-position').split(/\s+/);

    // ── Padding / Margin ─────────────────────────────────────────────────────
    const fourSide = (prop) => {
        const sh = get(prop);
        const [t, r, b, l] = SIDES.map(s => get(`${prop}-${s}`) || sh);
        return { same: allEqual(t, r, b, l), top: t, right: r, bottom: b, left: l };
    };

    const pad = fourSide('padding');
    const mar = fourSide('margin');

    // ── Border ───────────────────────────────────────────────────────────────
    const borderParsed = parseBorderShorthand(get('border'));

    const borderSide = (prop) => {
        const sh = get(`border-${prop}`) || borderParsed[prop];
        let [t, r, b, l] = SIDES.map(s => get(`border-${s}-${prop}`) || sh);
        if (prop === 'color') {
            [t, r, b, l] = [t, r, b, l].map(toHex);
        }
        return { same: allEqual(t, r, b, l), top: t, right: r, bottom: b, left: l };
    };

    const bStyle = borderSide('style');
    const bWidth = borderSide('width');
    const bColor = borderSide('color');

    // ── Positioning ──────────────────────────────────────────────────────────
    const [pt, pr, pb, pl] = SIDES.map(s => get(s));

    // ── Clip ─────────────────────────────────────────────────────────────────
    const clipMatch = get('clip').match(/rect\(([^)]+)\)/);
    let cv = ['', '', '', ''];
    if (clipMatch) {
        cv = clipMatch[1].replace(/,/g, ' ').trim().split(/\s+/).map(v => v === 'auto' ? '' : v);
        while (cv.length < 4) {
            cv.push('');
        }
    }

    // ── Text decoration ──────────────────────────────────────────────────────
    const dec = get('text-decoration');

    return {
        // Text
        font_family: get('font-family'),
        font_size: get('font-size'),
        font_style: get('font-style'),
        font_weight: get('font-weight'),
        font_variant: get('font-variant'),
        text_transform: get('text-transform'),
        line_height: get('line-height'),
        color: toHex(get('color')),
        text_dec_underline: /underline/i.test(dec),
        text_dec_overline: /overline/i.test(dec),
        text_dec_linethrough: /line-through/i.test(dec),
        text_dec_blink: /blink/i.test(dec),
        text_dec_none: /\bnone\b/i.test(dec),

        // Background
        background_color: toHex(get('background-color')),
        background_image: get('background-image').replace(URL_RE, '$1'),
        background_repeat: get('background-repeat'),
        background_attachment: get('background-attachment'),
        background_position_h: bgPosH,
        background_position_v: bgPosV,

        // Block
        word_spacing: get('word-spacing'),
        letter_spacing: get('letter-spacing'),
        vertical_align: get('vertical-align'),
        text_align: get('text-align'),
        text_indent: get('text-indent'),
        white_space: get('white-space'),
        display: get('display'),

        // Box
        width: get('width'),
        height: get('height'),
        float: get('float') || get('css-float'),
        clear: get('clear'),

        // Padding
        padding_same: pad.same,
        padding_top: pad.top,
        padding_right: pad.right,
        padding_bottom: pad.bottom,
        padding_left: pad.left,

        // Margin
        margin_same: mar.same,
        margin_top: mar.top,
        margin_right: mar.right,
        margin_bottom: mar.bottom,
        margin_left: mar.left,

        // Border style
        border_style_same: bStyle.same,
        border_style_top: bStyle.top,
        border_style_right: bStyle.right,
        border_style_bottom: bStyle.bottom,
        border_style_left: bStyle.left,

        // Border width
        border_width_same: bWidth.same,
        border_width_top: bWidth.top,
        border_width_right: bWidth.right,
        border_width_bottom: bWidth.bottom,
        border_width_left: bWidth.left,

        // Border color
        border_color_same: bColor.same,
        border_color_top: bColor.top,
        border_color_right: bColor.right,
        border_color_bottom: bColor.bottom,
        border_color_left: bColor.left,

        // List
        list_style_type: get('list-style-type'),
        list_style_position: get('list-style-position'),
        list_style_image: get('list-style-image').replace(URL_RE, '$1'),

        // Positioning
        position: get('position'),
        visibility: get('visibility'),
        z_index: get('z-index'),
        overflow: get('overflow'),

        placement_same: allEqual(pt, pr, pb, pl),
        placement_top: pt,
        placement_right: pr,
        placement_bottom: pb,
        placement_left: pl,

        // Clip
        clip_same: allEqual(cv[0], cv[1], cv[2], cv[3]),
        clip_top: cv[0],
        clip_right: cv[1],
        clip_bottom: cv[2],
        clip_left: cv[3]
    };
}

/**
 * Build a CSS properties object from a flat form-data object returned by
 * tabs.submit().
 *
 * @param {Object} data  Form field values
 * @returns {Object}     CSS key→value pairs
 */
export function dataToStyles(data) {
    const styles = {};

    const set = (prop, val) => {
        if (val) {
            styles[prop] = val;
        }
    };
    const setColor = (prop, val) => {
        if (val && val !== '#') {
            styles[prop] = val;
        }
    };

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
        const dec = [
            data.text_dec_underline && 'underline',
            data.text_dec_overline && 'overline',
            data.text_dec_linethrough && 'line-through',
            data.text_dec_blink && 'blink'
        ].filter(Boolean);
        if (dec.length) {
            styles['text-decoration'] = dec.join(' ');
        }
    }

    // ── Background ──────────────────────────────────────────────────────────
    setColor('background-color', data.background_color);
    if (data.background_image) {
        styles['background-image'] = `url(${data.background_image})`;
    }
    set('background-repeat', data.background_repeat);
    set('background-attachment', data.background_attachment);
    if (data.background_position_h || data.background_position_v) {
        styles['background-position'] = `${data.background_position_h || '0%'} ${data.background_position_v || '0%'}`;
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

    // ── Padding / Margin ─────────────────────────────────────────────────────
    const fourSide = (prop, prefix) => {
        const [t, r, b, l] = SIDES.map(s => data[`${prefix}_${s}`]);
        if (!(t || r || b || l)) {
            return;
        }
        if (data[`${prefix}_same`]) {
            set(prop, t);
        } else {
            SIDES.forEach((s, i) => set(`${prop}-${s}`, [t, r, b, l][i]));
        }
    };

    fourSide('padding', 'padding');
    fourSide('margin', 'margin');

    // ── Border ───────────────────────────────────────────────────────────────
    const borderFour = (prop, isColor) => {
        const fn = isColor ? setColor : set;
        const [t, r, b, l] = SIDES.map(s => data[`border_${prop}_${s}`]);
        if (!(t || r || b || l)) {
            return;
        }
        if (data[`border_${prop}_same`]) {
            fn(`border-${prop}`, t);
        } else {
            SIDES.forEach((s, i) => fn(`border-${s}-${prop}`, [t, r, b, l][i]));
        }
    };

    borderFour('style');
    borderFour('width');
    borderFour('color', true);

    // ── List ─────────────────────────────────────────────────────────────────
    set('list-style-type', data.list_style_type);
    set('list-style-position', data.list_style_position);
    if (data.list_style_image) {
        styles['list-style-image'] = `url(${data.list_style_image})`;
    }

    // ── Positioning ──────────────────────────────────────────────────────────
    set('position', data.position);
    set('visibility', data.visibility);
    set('z-index', data.z_index);
    set('overflow', data.overflow);

    const { placement_same, placement_top: pTop, placement_right: pRight,
        placement_bottom: pBot, placement_left: pLeft } = data;

    if (pTop || pRight || pBot || pLeft) {
        if (placement_same) {
            SIDES.forEach(s => set(s, pTop));
        } else {
            set('top', pTop);
            set('right', pRight);
            set('bottom', pBot);
            set('left', pLeft);
        }
    }

    // ── Clip ─────────────────────────────────────────────────────────────────
    let { clip_top: ct, clip_right: cr, clip_bottom: cb, clip_left: cl } = data;

    if (ct || cr || cb || cl) {
        if (data.clip_same) {
            cr = ct;
            cb = ct;
            cl = ct;
        }
        ct = ct || 'auto';
        cr = cr || 'auto';
        cb = cb || 'auto';
        cl = cl || 'auto';
        if (ct !== 'auto' || cr !== 'auto' || cb !== 'auto' || cl !== 'auto') {
            styles['clip'] = `rect(${ct} ${cr} ${cb} ${cl})`;
        }
    }

    return styles;
}
