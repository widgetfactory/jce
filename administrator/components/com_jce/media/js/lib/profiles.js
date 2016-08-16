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

    Joomla.submitbutton = submitbutton = function(button) {
        // Cancel button
        if (button == "cancelEdit") {
            try {
                Joomla.submitform(button);
            } catch (e) {
                submitform(button);
            }

            return;
        }
        // shortcut
        var $profiles = $jce.Profiles;

        // validate form
        if ($profiles.validate()) {

            // trigger onSubmit callback
            $profiles.onSubmit();

            try {
                Joomla.submitform(button);
            } catch (e) {
                submitform(button);
            }
        }
    };

    // Create Profiles object
    $.jce.Profiles = {
        options: {},
        init: function() {
            var self = this, init = true;

            var dir = $('body').css('direction') == 'rtl' ? 'right' : 'left';

            // handle basic tabs
            $('#tabs, #tabs-editor').tabs().on('tabs:activate', function(e, tab) {
              $(tab).addClass('active').siblings().removeClass('active');
            });

            $("#tabs-plugins").tabs().on('tabs:activate', function(e, tab) {
              $(tab).addClass('active').siblings().removeClass('active');
            }).find('ul.ui-tabs-nav > li.ui-state-default').not('.tab-disabled').first().addClass('active').children('a.ui-tabs-anchor').click();

            $('input.checkbox-list-toggle-all').click(function() {
                $('input[type="checkbox"]', '#user-groups').prop('checked', this.checked).trigger('check');
            });

            // Components select
            $('input[name="components-select"]').click(function() {
                $('input[type="checkbox"]', '#components').prop('disabled', (this.value == 'all')).trigger('disable').filter(':checked').prop('checked', false).trigger('check');
            });

            // Editable Selects

            $("select.editable, select.combobox").datalist();

            // Color Picker
            $('input.color').colorpicker($.extend(this.options.colorpicker, {parent: '.ui-jce'}));

            // Extension Mapper
            $('.extensions > input[type="text"][name]').extensionmapper();

            // Layout
            this.createLayout();

            // Check list
            $('select.checklist, input.checklist').checkList({
                onCheck: function() {
                    self.setRows();
                }
            });

            $('#paramseditorwidth').change(function() {
                var v = $(this).val() || 800, s = v + 'px';

                if (/%/.test(v)) {
                    s = v, v = 800;
                } else {
                    v = parseInt(v), s = v + 'px';
                }

                $('.widthMarker span', '#profileLayoutTable').html(s);
                $('.widthMarker, .mceEditor', '.profileLayoutContainerCurrent').width(v);
            });

            $('#paramseditorheight').change(function() {
                var v = $(this).val() || 'auto';

                if (/%/.test(v)) {
                    v = 'auto';
                } else {
                    if ($.type(v) == 'number') {
                        v = parseInt(v);
                    }
                }
            });

            // Toolbar Theme
            $('#paramseditortoolbar_theme').change(function() {
                var v = $(this).val();

                if (v.indexOf('.') != -1) {
                    v = v.split('.');
                    var s = v[0] + 'Skin';
                    var c = v[1];

                    v = s + ' ' + s + c.charAt(0).toUpperCase() + c.substring(1);
                } else {
                    v += 'Skin';
                }

                $('.profileLayoutContainer .mceEditor').attr('class', function(i, value) {
                    return $.trim(value.replace(/([a-z0-9]+)Skin([a-z0-9]*)/gi, ''));
                }).addClass('defaultSkin ' + v);
            });

            // Toolbar Alignment
            $('#paramseditortoolbar_align').change(function() {

                var v = $(this).val();
                $('ul.sortableList', '#toolbar_container').removeClass('mceLeft mceCenter mceRight').addClass('mce' + v.charAt(0).toUpperCase() + v.substring(1));

                self._fixLayout();
            }).change();

            // Editor Path
            $('#paramseditorpath').change(function() {
                $('span.mceStatusbar span.mcePathLabel').toggle($(this).val() == 1);
            }).change();

            // Additional Features
            $('ul#profileAdditionalFeatures input:checkbox').click(function() {
                self.setPlugins();
            });

            // toolbar position
            $('#paramseditortoolbar_location').change(function() {
                var $after = $('#editor_container');

                if ($(this).val() == 'top') {
                    $after = $('span.widthMarker');
                }

                $('#toolbar_container').insertAfter($after);
            }).change();

            // toolbar location
            $('#paramseditorstatusbar_location').change(function() {
                var v = $(this).val();
                // show statusbar by default
                $('#statusbar_container').show();

                // hide statusbar
                if (v == 'none') {
                    $('#statusbar_container').hide();
                }

                var $after = $('#editor_container');

                if (v == 'top') {
                    $after = $('span.widthMarker');

                    if ($('#paramseditortoolbar_location').val() == 'top') {
                        $after = $('#toolbar_container');
                    }
                }

                $('#statusbar_container').insertAfter($after);
            }).change();

            // resizing
            $('#paramseditorresizing').change(function() {
                var v = $(this).val();
                // show statusbar by default
                $('a.mceResize', '#statusbar_container').toggle(v == 1);
            }).change();

            // toggle on/off
            $('#paramseditortoggle').change(function() {
                var v = $(this).val();
                // show statusbar by default
                $('#editor_toggle').toggle(v == 1);
            }).change();

            // editor toggle label
            $('#paramseditortoggle_label').on('change keyup', function() {
                if (this.value) {
                    // show statusbar by default
                    $('#editor_toggle').text(this.value);
                }
            });

            // add onclick for user list item delete
            $('#users').click(function(e) {
                var n = e.target;

                if ($(n).is('span.users-list-delete')) {
                    $(n).parent().parent().remove();
                }
            });

            // add "edited" class to each input on change
            $('#tabs-features :input[name], #tabs-editor :input[name], #tabs-plugins :input[name]').change(function() {
                // skip on init
                if (init) {
                    return;
                }
                // get name as escaped string
                var name = this.name.replace('!"#$%&()*+,./:;<=>?@[\]^`{|}~', '\\$1', 'g');
                // add class to this element and any that share it's name, eg: param[]
                $(this).add('[name="' + name + '"]').addClass('isdirty');
            });

            // create proxy input[type="hidden"] for styled plugin enable checkbox
            $('input.plugins-enable-checkbox').on('click', function() {
                var s = this.checked, name = $(this).data('name'), proxy = $(this).next('input[type="hidden"]');

                // check for proxy...
                if ($(proxy).length == 0) {
                    // create proxy
                    proxy = $('<input type="hidden" name="' + $(this).attr('name') + '" />').insertAfter(this);
                }

                // trigger change event, set value, remove name
                $(this).change().val(s ? 1 : 0).removeAttr('name');

                // set value for proxy and trigger change, add isdirty class (edited)
                $(proxy).val(s ? 1 : 0).change();

                // disable default select and reset value
                $('select.plugins-default-select', $(this).parents('fieldset:first')).children('option[value="' + name + '"]').prop('disabled', !s).parent().val(function(i, v) {
                    if (v === name) {
                        return "";
                    }

                    return v;
                });
                // remove the edited class added when the input was changed
            }).change(function() {
                $(this).removeClass('isdirty');
            });

            init = false;
        },
        validate: function() {
            var required = [];

            $(':input.required').each(function() {
                if ($(this).val() === '') {
                    var parent = $(this).parents('div.tab-pane').get(0);

                    required.push("\n" + $('#tabs ul li a[href=#' + parent.id + ']').html() + ' - ' + $.trim($('label[for="' + this.id + '"]').html()));
                }
            });

            if (required.length) {
                var msg = $.jce.options.labels.required;
                msg += required.join(',');

                alert(msg);

                return false;
            }

            return true;
        },
        onSubmit: function() {
            // disable placeholder inputs
            $('div#tabs-editor, div#tabs-plugins').find(':input[name].placeholder').prop('disabled', true);

            // disable inputs not changed
            $('#tabs-features :input[name], #tabs-editor :input[name], #tabs-plugins :input[name]').not('.isdirty').prop('disabled', true).parents('.ui-radio, .ui-checkbox').addClass('disabled');
        },
        _fixLayout: function() {
            $('.mceToolBarItem').removeClass('mceToolBarItemEnd mceToolBarItemStart');

            $('.mceButton, .mceSplitButton').parent().addClass('mceToolBarItemButton');
            $('.mceListBox').parent().addClass('mceToolBarItemListBox');

            // fix for buttons before or after lists
            $('.mceListBox').parent().prev('.mceToolBarItemButton').addClass('mceToolBarItemEnd');
            $('.mceListBox').parent().next('.mceToolBarItemButton').addClass('mceToolBarItemStart');
        },
        createLayout: function() {
            var self = this;

            // List items
            $(".sortableList").sortable({
                connectWith: '.sortableList',
                axis: 'y',
                update: function(event, ui) {
                    self.setRows();
                    self.setPlugins();
                },
                placeholder: 'mceToolbarRow sortableListItem ui-sortable-highlight',
                opacity: 0.8
            });

            $('.sortableOption').click(function(e) {
                var $parent = $(this).parents('.sortableListItem').first();
                var $target = $('.sortableList', '#profileLayoutTable').not($parent.parent());

                $parent.appendTo($target);

                self.setRows();
                self.setPlugins();
            });

            $('.sortableRow').sortable({
                connectWith: '.sortableRow',
                tolerance: 'pointer',
                update: function(event, ui) {
                    self.setRows();
                    self.setPlugins();

                    self._fixLayout();
                },
                start: function(event, ui) {
                    $(ui.placeholder).width($(ui.item).width());
                },
                opacity: 0.8,
                placeholder: 'mceToolBarItem sortableRowItem ui-sortable-highlight'
            });

            this._fixLayout();
        },
        setRows: function() {
            var rows = [];

            $('.sortableRow', '.profileLayoutContainerCurrent').has('.sortableRowItem').each(function() {
                rows.push($.map($('.sortableRowItem', this), function(el) {
                    return $(el).data('name');
                }).join(','));
            });

            var v = rows.join(';');

            // set rows and trigger change
            $('input[name="rows"]').val(v).change();
        },
        setLayout: function() {
            var $spans = $('.profileLayoutContainerCurrent > span').not('.widthMarker');

            $.each(['toolbar', 'editor', 'statusbar'], function() {
                $('#paramseditor' + this + '_location').val($spans.index($('#' + this + '_container')));
            });
        },
        /**
         * show / hide parameters for each plugin
         * @param {Object} id
         * @param {Object} state
         */
        setPlugins: function() {
            var self = this, plugins = [];

            $('.sortableRow .plugin', '.profileLayoutContainerCurrent').each(function() {
                plugins.push($(this).data('name'));
            });

            $('ul#profileAdditionalFeatures input:checkbox:checked').each(function() {
                plugins.push($(this).val());
            });

            // set plugins and trigger change
            $('input[name="plugins"]').val(plugins.join(',')).change();

            this.setParams(plugins);
        },
        setParams: function(plugins) {
            var $tabs = $('div#tabs-plugins > ul.nav.nav-tabs > li');

            $tabs.removeClass('tab-disabled ui-state-disabled active ui-tabs-active ui-state-active').each(function(i) {
                var name = $(this).data('name');

                var s = $.inArray(name, plugins) != -1;
                // disable forms in tab panel
                $('input[name], select[name]', this).prop('disabled', !s);

                if (!s) {
                    $(this).addClass('tab-disabled');
                }
            });

            $tabs.not('.tab-disabled').first().addClass('active ui-tabs-active ui-state-active').children('a.ui-tabs-anchor').click();
        }
    };

    // run init when the doc is ready
    $(document).ready(function() {
        $.jce.Profiles.init();
    });
// End Profiles
})(jQuery);
