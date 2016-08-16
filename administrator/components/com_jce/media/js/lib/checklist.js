/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function($) {
    $.fn.checkList = function(options) {
        this.each(function() {
            return $.CheckList.init(this, options);
        });
    };

    $.CheckList = {
        options: {
            valueAsClassName: false,
            onCheck: $.noop
        },
        /**
         * Initilaise plugin
         * @param {Object} elements Select elements to process
         * @param {Object} options Options object
         */
        init: function(el, options) {
            var self = this;
            $.extend(this.options, options);

            var ul = document.createElement('ul');
            var elms = [];

            if (el.nodeName == 'SELECT') {
                $('option', el).each(function() {
                    elms.push({
                        name    : $(this).html(),
                        value   : $(this).val(),
                        selected: $(this).prop('selected'),
                        disabled: $(this).prop('disabled')
                    });
                });
            } else {
                $.each(el.value.split(','), function() {
                    elms.push({
                        name: this,
                        value: this
                    });
                });
            }

            // hide element
            $(el).hide();

            $(ul).addClass('widget-checklist').insertBefore(el);

            if ($(el).hasClass('buttonlist')) {
                $(ul).wrap('<div class="defaultSkin buttonlist" />');
            }

            $.each(elms, function() {
                self.createElement(el, ul, this);
            });

            if ($(el).hasClass('sortable')) {
                $(ul).addClass('sortable').sortable({
                    axis: 'y',
                    tolerance: 'intersect',
                    update: function(event, ui) {
                        self.setValue(el, $(ui.item).parent());
                    },
                    placeholder: "ui-state-highlight"

                });
            }
        },
        createElement: function(el, ul, n) {
            // Create elements
            var self = this, d = document, li = d.createElement('li'), plugin, button, toolbar;

            $(li).attr({
                title: n.value
            }).addClass('ui-widget-content ui-corner-all').appendTo(ul);

            if ($(el).hasClass('buttonlist')) {
                // get the plugin name
                var name = el.name, s = name.split(/[^\w]+/);

                if (s && s.length > 1) {
                    plugin = s[1];
                }
            }

            if (plugin) {
                toolbar = $('span.profileLayoutContainerToolbar ul', '#profileLayoutTable');
                button = $('span[data-button="' + n.value + '"]', toolbar);
            }

            // Add checkboxes
            $('<input type="checkbox" />').addClass('checkbox inline').prop('checked', n.selected).prop('disabled', n.disabled).click(function() {
                // add check and trigger
                $(this).trigger('checklist:check', this.checked);
            }).appendTo(li).on('checklist:check', function(e, state) {
                // Trigger serialization
                self.setValue(el, ul);

                // if button list and plugin name set
                if (button) {
                    $(button).toggle(state);
                }

                // trigger callback
                self.options.onCheck.call(self, [this, n]);
            }).val(n.value);

            // Add label
            $(li).append('<span class="mceToolBarItem"><span class="mceIcon mce_' + n.value + '"></span></span><label class="checkbox inline widget-checklist-' + n.value + '" title="' + n.name + '">' + n.name + '</label>');


            if (button && $(el).hasClass('buttonlist')) {
                $('label', li).before($(button).clone());
            }
        },
        setValue: function(el, ul, init) {
            var x = $.map($('input[type="checkbox"]:checked', $('li', ul)), function(n) {
                return $(n).val();
            });

            if (el.nodeName == 'SELECT') {
                var options = [];

                $('option', el).each(function(i) {
                    var n = $.inArray(this.value, x);

                    if (n >= 0) {
                        //options[n] = this;
                        $(this).attr('selected', 'selected').prop('selected', true);
                    } else {
                        //options.push(this);
                        $(this).removeAttr('selected').prop('selected', false);
                    }
                });

                // remove "Array"
                el.name = el.name.replace("[]", "");

                if (x.length === 0) {
                    $(el).change().removeClass('isdirty').after('<input type="hidden" name="' + el.name + '" value="" class="isdirty" />');
                } else {
                    //$(el).empty().append(options).change().next('input[type="hidden"]').remove();
                    $(el).change().next('input[type="hidden"]').remove();
                    // add "Array"
                    el.name += "[]";
                }
            } else {
                $(el).val(x.join(',')).change();
            }
        }
    };
})(jQuery);
