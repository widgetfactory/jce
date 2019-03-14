/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function ($, window) {

    Joomla.submitbutton = function (task) {
        var form = document.getElementById('adminForm');

        if (task == 'profile.cancel') {
            try {
                Joomla.submitform(task, form);
            } catch (e) {}

            return;
        }

        // validate form	
        if (document.formvalidator.isValid(form)) {

            // trigger onSubmit callback
            onSubmit();

            try {
                Joomla.submitform(task, form);
            } catch (e) {}
        }
    };

    $.fn.dragHelper = function (options) {
        var downButton, overlay, start, stop, drag, startX, startY;

        options = options || {};

        var element = this;

        start = function (e) {
            var dw = $(document).width(),
                dh = $(document).height(),
                cursor;

            e.preventDefault();
            downButton = e.button;
            startX = e.screenX;
            startY = e.screenY;

            overlay = $('<div />').css({
                position: "absolute",
                top: 0,
                left: 0,
                width: dw,
                height: dh,
                zIndex: 0x7FFFFFFF,
                opacity: 0.0001
            }).appendTo('body');

            // Bind mouse events
            $(document).on('mousemove.drag', function (e) {
                drag(e);
            });
            $(document).on('mouseup.drag', function (e) {
                stop(e);
            });

            // Begin drag
            $(element).trigger('drag:start', e);
        };

        drag = function (e) {
            if (e.button !== downButton) {
                return stop(e);
            }

            e.deltaX = e.screenX - startX;
            e.deltaY = e.screenY - startY;

            e.preventDefault();

            $(element).trigger('drag:drag', e);
        };

        stop = function (e) {
            $(document).off('mousemove.drag mouseup.drag');

            $(overlay).remove();

            $(element).trigger('drag:stop', e);
        };

        /**
         * Destroys the drag/drop helper instance.
         *
         * @method destroy
         */
        this.destroy = function () {
            $(element).off();
        };

        $(element).on('mousedown.drag', function (e) {
            start(e);
        });

        return this;
    };

    $(document).ready(function () {
        /*$('#jform_users').change(function () {
            var name = $(this).data('user-name'),
                id = $(this).data('user-value');

            var opt = new Option(name, id);

            if ($(this).find('option[value="' + id + '"]').length === 0) {
                $(this).append(opt).val(id).trigger('liszt:updated').trigger('chosen:updated');
            }
        });*/

        $('select[data-toggle]').on('change', function() {
            var key = $(this).attr('data-toggle'), value = $(this).val();

            $parent = $(this).parents('.control-group').siblings('.filesystem-options');

            $('[data-toggle-target^="' + key + '"]', $parent).hide().find(':input').prop('disabled', true);

            $item = $('[data-toggle-target="' + key + '-' + value + '"]', $parent);

            $item.show().find(':input').prop('disabled', false);

            // update chosen
            if ($.fn.chosen) {
                $item.find('select').chosen('destroy').chosen();
            }
            
        });

        $('select[data-toggle]').trigger('change');
    });

    function init() {
        var self = this,
            skip = true;
        var base_url = '';

        $('script[src*="components/com_jce/media/js/profile.min.js"]').each(function () {
            var url = this.src;
            base_url = url.substring(0, url.indexOf('administrator'));
        });

        // set up change event for extensions options
        $('#jform_components_select input').change(function () {
            if (!this.checked) {
                return;
            }

            $('#jform_components').prop('disabled', $(this).val() == 0).trigger('liszt:updated').trigger('chosen:updated');
        }).change();

        // add "isdirty" class to each input on change
        $('#profile-features :input[name], #profile-editor :input[name], #profile-plugins :input[name]').change(function () {
            // skip on init
            if (skip) {
                return;
            }

            // get name as escaped string
            var name = this.name.replace('!"#$%&()*+,./:;<=>?@[\]^`{|}~', '\\$1', 'g');

            // add class to this element and any that share it's name, eg: param[]
            $(this).add('[name="' + name + '"]').addClass('isdirty');
        });

        var dir = $('body').css('direction') == 'rtl' ? 'right' : 'left';

        // Layout
        createLayout();

        // drag
        var startSize;

        $('.mce-resizehandle').dragHelper().on('drag:start', function (e) {
            startSize = {
                width: $('.editor-layout .mce-tinymce').width(),
                height: $('.mce-edit-area').height()
            };
        }).on('drag:drag', function (o, e) {
            var width = startSize.width + e.deltaX;
            var height = startSize.height + e.deltaY;

            if (width !== null) {
                width = Math.max(100, width);
                width = Math.min(0xFFFF, width);

                $('.editor-layout .mce-tinymce, .widthMarker').width(width);
                $('#jform_config_editor_width').val(width);

                $('.widthMarker span').html(width + 'px');
            }

            if (height !== null) {
                height = Math.max(100, height);
                height = Math.min(0xFFFF, height);

                $('.editor-layout .mce-edit-area').height(height);
                $('#jform_config_editor_height').val(height);
            }
        });

        $('#jform_config_editor_width').change(function () {
            var v = $(this).val() || '100%',
                s = v + 'px';

            if (/%/.test(v)) {
                s = v, v = 100;
            } else {
                v = parseInt(v), s = v + 'px';
            }

            $('.widthMarker span').html(s);
            $('.widthMarker, .mce-tinymce').width(s);
        });

        $('#jform_config_editor_width').change(function () {
            var v = $(this).val() || 'auto';

            if (/%/.test(v)) {
                v = 'auto';
            } else {
                if ($.type(v) === 'number') {
                    v = parseInt(v);
                }
            }
        });

        // Toolbar Theme
        $('#jform_config_editor_toolbar_theme').change(function () {
            var value = this.value;

            if (value.indexOf('.') !== -1) {
                value = value.replace(/([^\.]+)\.([\w]+)/, function (match, skin, variant) {
                    return skin + 'Skin ' + skin + 'Skin' + (variant.charAt(0).toUpperCase() + variant.substring(1));
                });
            } else {
                value += 'Skin';
            }

            $('.editor-layout .mceEditor').attr('class', function (i, value) {
                return $.trim(value.replace(/([a-z0-9]+)Skin([a-z0-9]*)/gi, ''));
            }).addClass('defaultSkin ' + value);

            $('#mce-theme').remove();

            // skip the default theme as this is always loaded
            if (this.value === "default") {
                return;
            }

            var stylesheet = this.value.replace(/\.\w+/, '');

            $('<link href="' + base_url + 'components/com_jce/editor/tiny_mce/themes/advanced/skins/' + stylesheet + '/ui.admin.css" rel="stylesheet" id="mce-theme" />').appendTo('head');
        }).change();

        // Editor Path
        $('#jform_config_editor_path :input[name]:checked').change(function () {
            $('.editor-layout .mce-tinymce .mce-statusbar .mce-path').toggle($(this).val() == 1);
        }).change();

        // Additional Features
        $('.editor-features input:checkbox').click(function () {
            setPlugins();
        });

        // resizing
        $('#paramseditorresizing').change(function () {
            var v = $(this).val();
            // show statusbar by default
            $('.editor-layout .mce-tinymce .mce-statusbar .mce-resizehandle').toggle(v == 1);
        }).change();

        // toggle on/off
        $('#jform_config_editor_toggle').change(function () {
            var v = $(this).val();
            // show statusbar by default
            $('#editor_toggle').toggle(v === 1);
        }).change();

        // editor toggle label
        $('#jform_config_editor_toggle_label').on('change keyup', function () {
            if (this.value) {
                // show statusbar by default
                $('#editor_toggle').text(this.value);
            }
        });

        // reset input[type="number"] if < 1
        $('input[type="number"]').change(function () {
            if (this.value < 1) {
                this.value = "";
            }
        });

        skip = false;

        // secondary tabs within profile content
        $('.nav-tabs li', '.tab-content').on('click', function(e) {
            e.preventDefault();

            var idx = $(this).index(), $container = $(this).parent().parent('.tabbable');

            $(this).parent().children('.active').removeClass('active show');
            $(this).addClass('active show');

            $('.tab-content .tab-pane', $container).removeClass('active show').eq(idx).addClass('active show');
        });

        $('.ui-jce').removeClass('loading');
    }

    function onSubmit() {
        // disable inputs not changed
        $('#profile-features :input[name], #profile-editor :input[name], #profile-plugins :input[name]').not('.isdirty').prop('disabled', true);
    }

    function fixLayout() {
        $('.mce-btn').removeClass('mce-first mce-last');

        $('.mce-btn:first-child').addClass('mce-first');
        $('.mce-btn:last-child').addClass('mce-last');

        // remove all empty groups and add new empty group
        $('.editor-layout .mce-btn-group').filter(function () {
            return $(this).children('div').length === 0;
        }).remove().addBack(':last-child').after('<div class="mce-container mce-flow-layout-item mce-btn-group" />');

        // get options
        var options = $('.mce-btn-group').sortable('option');

        // destroy sortables
        $('.editor-layout .mce-btn-group.ui-sortable').sortable('destroy');

        // re-make sortables
        $('.editor-layout .mce-btn-group').sortable(options);
    }

    function createLayout() {
        var self = this;

        // List items
        $(".sortableList").sortable({
            connectWith: '.sortableList',
            axis: 'y',
            update: function (event, ui) {
                setRows();
                setPlugins();
            },
            start: function (event, ui) {
                $(ui.placeholder).width($(ui.item).width()).height($(ui.item).height());
            },
            placeholder: 'sortable-row-highlight',
            opacity: 0.8
        });

        // create empty groups
        $('.mce-btn-group:last-child').after('<div class="mce-container mce-flow-layout-item mce-btn-group" />');

        $('.sortableListItem').sortable({
            items: '.mce-btn',
            connectWith: '.sortableListItem',
            placeholder: 'sortable-btn-highlight mce-widget mce-btn',
            cancel: '',
            update: function (event, ui) {
                setRows();
                setPlugins();

                fixLayout();
            },
            start: function (event, ui) {
                $(ui.item).parents('.mce-toolbar-grp').addClass('ui-sortable-sorting');
                $(ui.placeholder).width($(ui.item).width()).height($(ui.item).height());

                $('.mce-btn-group:empty').addClass('visible');
            },
            stop: function (event, ui) {
                $(ui.item).parents('.mce-toolbar-grp').removeClass('ui-sortable-sorting');
            },
            opacity: 0.8
        });
    }

    function setRows() {
        var rows = $.map($('.editor-layout .mce-toolbar').has('.mce-btn'), function (toolbar) {
            return $.map($('.mce-btn', toolbar), function (button) {
                return $(button).data('name');
            }).join(',');
        });

        var v = rows.join(';');

        // set rows and trigger change
        $('input[name="jform\\[rows\\]"]').val(v).change();
    }

    /**
     * show / hide parameters for each plugin
     * @param {Object} id
     * @param {Object} state
     */
    function setPlugins() {
        var self = this,
            plugins = [];

        $('.ui-sortable > .mce-btn', '.editor-layout').each(function () {
            plugins.push($(this).data('name'));
        });

        $('.editor-features input:checkbox:checked').each(function () {
            plugins.push($(this).val());
        });

        // set plugins and trigger change
        $('input[name="jform\\[plugins\\]"]').val(plugins.join(',')).change();

        setParams(plugins);
    }

    function setParams(plugins) {
        var $tabs = $('#profile-plugins-tabs > .nav-item');

        $tabs.removeClass('hide active').each(function (i) {
            var name = $(this).children('[href]').attr('href').replace('#profile-plugins-', '');

            var s = $.inArray(name, plugins) != -1;

            // disable forms in tab panel
            $('input[name], select[name]', '#profile-plugins-' + name).prop('disabled', !s);

            if (!s) {
                $(this).addClass('hide');
            }
        });

        $tabs.not('.hide').first().addClass('active');
    }

    $(document).ready(function () {
        window.setTimeout(function () {
            init();
        }, 100);
    });

    // End Profiles
})(jQuery, window);