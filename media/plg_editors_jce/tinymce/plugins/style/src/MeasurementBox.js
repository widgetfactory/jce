/**
 * @package     JCE
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

var DOM = tinymce.DOM,
    Event = tinymce.dom.Event,
    Dispatcher = tinymce.util.Dispatcher,
    each = tinymce.each,
    extend = tinymce.extend;

/**
 * A compound control combining a text input with a unit <select>.
 * Returns/accepts a full CSS measurement string: "10px", "2em", "auto", etc.
 *
 * @class tinymce.ui.MeasurementBox
 * @extends tinymce.ui.Control
 */
tinymce.create('tinymce.ui.MeasurementBox:tinymce.ui.Control', {

    MeasurementBox: function (id, s, ed) {
        s = extend({
            'class': '',
            units: ['px', 'em', 'rem', '%', 'pt', 'cm', 'mm', 'in', 'ex', 'vh', 'vw'],
            default_unit: 'px'
        }, s);

        this._super(id, s, ed);

        this.onChange = new Dispatcher(this);
        this.onPostRender = new Dispatcher(this);
        this.classPrefix = 'mceMeasurementBox';
    },

    // Parse "10px" → {num:"10", unit:"px"};  keyword → {num:"auto", unit:""}
    _parse: function (val) {
        if (!val) {
            return { num: '', unit: this.settings.default_unit };
        }
        var m = /^(-?[0-9.]+)(.*)$/.exec(val);

        if (m) {
            return { num: m[1], unit: m[2] || this.settings.default_unit };
        }

        return { num: val, unit: '' };
    },

    value: function (val) {
        if (!arguments.length) {
            var num = DOM.getValue(this.id) || '';
            var unit = DOM.getValue(this.id + '_unit') || '';

            if (!num) {
                return '';
            }

            return /^-?[0-9.]/.test(num) ? num + unit : num;
        }

        var p = this._parse(val);
        DOM.setValue(this.id, p.num);
        DOM.setValue(this.id + '_unit', p.unit);
    },

    renderHTML: function () {
        var s = this.settings, prefix = this.classPrefix;

        var inputAttribs = {
            type: 'text',
            id: this.id,
            'class': 'mceTextBox ' + prefix + 'Input ' + (s['class'] || ''),
            tabindex: 0
        };

        if (s.attributes) {
            inputAttribs = extend(inputAttribs, s.attributes);
        }

        var html = DOM.createHTML('input', inputAttribs);

        var sel = '<select id="' + this.id + '_unit" class="' + prefix + 'Unit" tabindex="0">';
        sel += '<option value=""></option>';
        each(s.units, function (unit) {
            sel += '<option value="' + unit + '">' + unit + '</option>';
        });
        sel += '</select>';

        return DOM.createHTML('span', { 'class': prefix }, html + sel);
    },

    postRender: function () {
        var self = this, s = this.settings;

        if (typeof s.value !== 'undefined') {
            this.value(s.value);
        }

        if (s.onchange && typeof s.onchange === 'function') {
            this.onChange.add(s.onchange);
        }

        Event.add(this.id, 'change', function () {
            self.onChange.dispatch(self, DOM.get(self.id));
        });

        Event.add(this.id + '_unit', 'change', function () {
            self.onChange.dispatch(self, DOM.get(self.id));
        });

        this.onPostRender.dispatch(this, DOM.get(this.id));
    },

    setDisabled: function (state) {
        this._super(state);
        var el = DOM.get(this.id), sel = DOM.get(this.id + '_unit');

        if (el) {
            el.disabled = state;
        }

        if (sel) {
            sel.disabled = state;
        }
    },

    destroy: function () {
        this._super();
        Event.clear(this.id);
        Event.clear(this.id + '_unit');
    }
});

/**
 * Factory method on ControlManager — creates a MeasurementBox and registers
 * it with the editor's control registry.
 */
tinymce.ControlManager.prototype.createMeasurementBox = function (id, s) {
    var self = this, ed = self.editor, c;

    id = self.prefix + id;
    c = self.get(id);

    if (c) {
        return c;
    }

    s.label = ed.translate(s.label);
    s.scope = s.scope || ed;
    s = extend({ 'class': 'mce_' + id, scope: s.scope, control_manager: self }, s);

    c = new tinymce.ui.MeasurementBox(id, s, ed);
    return self.add(c);
};
