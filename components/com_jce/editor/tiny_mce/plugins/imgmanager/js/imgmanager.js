/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global Wf, jQuery, tinyMCEPopup */

(function ($) {
    var ImageManagerDialog = {
        settings: {},
        init: function () {
            tinyMCEPopup.restoreSelection();

            var ed = tinyMCEPopup.editor,
                n = ed.selection.getNode(),
                self = this,
                br;

            // add insert button action
            $('#insert').on('click', function (e) {
                self.insert();
                e.preventDefault();
            });

            // Get src and decode
            var src = decodeURIComponent(ed.dom.getAttrib(n, 'src'));

            // convert to relative
            src = ed.convertURL(src);

            // Show / hide attributes
            $.each(this.settings.attributes, function (k, v) {
                if (!parseFloat(v)) {
                    $('#attributes-' + k).hide();
                }
            });

            // add persistent-focus
            $('#onmouseover, #onmouseout').addClass('uk-persistent-focus').on('click focus', function () {
                $('#onmouseover, #onmouseout').removeClass('uk-active');

                $(this).addClass('uk-active');
            });

            // set up body click to retain input focus
            $('body').on('click.persistent-focus', function (e) {
                if ($(e.target).is('.uk-persistent-focus, li.file') || $(e.target).parents('li.file').length) {
                    return;
                }

                $('.uk-persistent-focus').removeClass('uk-active');
            });

            Wf.init();

            // add change event to record editing
            $('#alt').on('change', function () {
                if (this.value === '') {
                    $(this).removeClass('uk-edited');
                } else {
                    $(this).addClass('uk-edited');
                }
            });

            if (n && n.nodeName == 'IMG') {
                // set button
                $('.uk-button-text', '#insert').text(tinyMCEPopup.getLang('update', 'Update', true));

                $('#src').val(src);

                // set preview
                $('#sample').attr({
                    'src': n.src
                }).attr(Wf.sizeToFit(n, {
                    width: 80,
                    height: 60
                }));

                // Width & Height
                var w = Wf.getAttrib(n, 'width'),
                    h = Wf.getAttrib(n, 'height');

                $('#width').val(function () {
                    if (w) {
                        $(this).addClass('uk-isdirty');
                        return w;
                    }
                    // if height is not set, return actual width
                    if (!h) {
                        return n.width;
                    }
                });

                $('#height').val(function () {
                    if (h) {
                        $(this).addClass('uk-isdirty');
                        return h;
                    }
                    // if width is not set, return actual height
                    if (!w) {
                        return n.height;
                    }
                });

                $('#alt').val(function () {
                    var val = ed.dom.getAttrib(n, 'alt');

                    if (val) {
                        $(this).addClass('uk-edited');
                        return val;
                    }
                });

                $('#title').val(ed.dom.getAttrib(n, 'title'));

                // Margin
                $.each(['top', 'right', 'bottom', 'left'], function () {
                    $('#margin_' + this).val(Wf.getAttrib(n, 'margin-' + this));
                });

                // Border
                $('#border_width').val(function () {
                    var v = Wf.getAttrib(n, 'border-width');

                    if ($('option[value="' + v + '"]', this).length == 0) {
                        $(this).append(new Option(v, v, false, true));
                    }

                    return v;
                });

                $('#border_style').val(Wf.getAttrib(n, 'border-style'));
                $('#border_color').val(Wf.getAttrib(n, 'border-color')).trigger('change');

                $('#border').trigger('change');

                // if no border values set, set defaults
                if (!$('#border').is(':checked')) {
                    $.each(['border_width', 'border_style', 'border_color'], function (i, k) {
                        $('#' + k).val(self.settings.defaults[k]).trigger('change');
                    });
                }

                $('#align').val(Wf.getAttrib(n, 'align'));

                // Class
                $('#classes').val(function () {
                    var values = ed.dom.getAttrib(n, 'class');
                    return $.trim(values);
                }).trigger('change');

                $('#style').val(ed.dom.getAttrib(n, 'style'));
                $('#id').val(ed.dom.getAttrib(n, 'id'));
                $('#dir').val(ed.dom.getAttrib(n, 'dir'));
                $('#lang').val(ed.dom.getAttrib(n, 'lang'));
                $('#usemap').val(ed.dom.getAttrib(n, 'usemap'));
                $('#loading').val(ed.dom.getAttrib(n, 'loading'));

                $('#insert').button('option', 'label', ed.getLang('update', 'Update'));

                // Longdesc may contain absolute url too
                $('#longdesc').val(ed.convertURL(ed.dom.getAttrib(n, 'longdesc')));

                $.each(['mouseover', 'mouseout'], function (i, key) {
                    // get value from data-* attributes
                    var val = ed.dom.getAttrib(n, 'data-' + key);
                    // trim whitespace
                    val = $.trim(val);
                    // clean url
                    val = val.replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1').replace(/^\s*|\s*$/g, '');
                    // convert to relative
                    val = ed.convertURL(val);

                    // set src as default
                    if (key == 'mouseout' && !val) {
                        val = src;
                    }

                    // update value with on prefix
                    $('#on' + key).val(val);
                });

                br = n.nextSibling;

                if (br && br.nodeName == 'BR' && br.style.clear) {
                    $('#clear').val(br.style.clear);
                }
            } else {
                Wf.setDefaults(this.settings.defaults);
            }

            if (ed.settings.filebrowser_position === "external") {
                Wf.createBrowsers($('#src'), function (files) {
                    var file = files.shift();
                    self.selectFile(file);
                }, 'images');
            } else {
                $('#src').filebrowser().on('filebrowser:onfileclick', function (e, file, data) {
                    self.selectFile(file, data);
                }).on('filebrowser:onfileinsert', function (e, file, data) {
                    self.selectFile(file, data);
                });
            }

            // Setup Styles
            Wf.updateStyles();

            // trigger border widget
            $('#border').change();

            // update constrain after applying values
            $('.uk-constrain-checkbox').on('constrain:change', function (e, elms) {
                $(elms).addClass('uk-isdirty');
            }).trigger('constrain:update');

            // update equalize
            $('.uk-equalize-checkbox').trigger('equalize:update');

            $('.uk-form-controls select').datalist().trigger('datalist:update');

            // trigger datalist init/update
            $('.uk-datalist').trigger('datalist:update');
        },
        insert: function () {
            var ed = tinyMCEPopup.editor,
                self = this;

            var n = ed.selection.getNode();

            if ($('#src').val() === '') {
                Wf.Modal.alert(tinyMCEPopup.getLang('imgmanager_dlg.no_src', 'Please enter a url for the image'));
                return false;
            }

            // skip alt check on update if the original alt attribute is blank
            if (n && n.nodeName === "IMG" && ed.dom.getAttrib(n, 'alt') === "") {
                this.insertAndClose();
            }

            if ($('#alt').val() === '') {
                Wf.Modal.confirm(tinyMCEPopup.getLang('imgmanager_dlg.missing_alt'), function (state) {
                    if (state) {
                        self.insertAndClose();
                    }
                }, {
                    width: 360,
                    height: 240
                });
            } else {
                this.insertAndClose();
            }
        },
        insertAndClose: function () {
            var ed = tinyMCEPopup.editor,
                self = this,
                v, args = {},
                el, br = '';

            Wf.updateStyles();

            tinyMCEPopup.restoreSelection();

            // Fixes crash in Safari
            if (tinymce.isWebKit) {
                ed.getWin().focus();
            }

            // Remove deprecated values
            args = {
                vspace: '',
                hspace: '',
                border: '',
                align: ''
            };

            // set attributes
            $.each(['src', 'width', 'height', 'alt', 'title', 'classes', 'style', 'id', 'dir', 'lang', 'usemap', 'longdesc', 'loading'], function (i, k) {
                v = $('#' + k + ':enabled').val();

                if (k == 'src') {
                    // prepare URL
                    v = Wf.String.buildURI(v);
                }

                if (k == 'width' || k == 'height') {
                    if (self.settings.always_include_dimensions !== false) {
                        v = $('#' + k).val();
                    } else {
                        v = $('#' + k + '.uk-isdirty').val() || '';
                    }
                }

                if (k == 'classes') {
                    k = 'class';
                }

                args[k] = v;
            });

            args.onmouseover = args.onmouseout = '';

            // mouseover / mouseout on single files only
            var over = $('#onmouseover').val(),
                out = $('#onmouseout').val();

            // must have both values, otherwise remove
            if (!over) {
                out = '';
            }
            
            args = $.extend(args, {
                'data-mouseover': over ? ed.convertURL(over) : '',
                'data-mouseout': out ? ed.convertURL(out) : ''
            });

            el = ed.selection.getNode();
            br = el.nextSibling;

            if (el && el.nodeName == 'IMG') {

                ed.dom.setAttribs(el, args);
                // BR clear
                if (br && br.nodeName == 'BR') {
                    if ($('#clear').is(':disabled') || $('#clear').val() === '') {
                        ed.dom.remove(br);
                    }
                    if (!$('#clear').is(':disabled') && $('#clear').val() !== '') {
                        ed.dom.setStyle(br, 'clear', $('#clear').val());
                    }
                } else {
                    if (!$('#clear').is(':disabled') && $('#clear').val() !== '') {
                        br = ed.dom.create('br');
                        ed.dom.setStyle(br, 'clear', $('#clear').val());
                        ed.dom.insertAfter(br, el);
                    }
                }

                ed.onUpdateMedia.dispatch(ed, { node: el });
            } else {
                ed.execCommand('mceInsertContent', false, ed.dom.createHTML('img', $.extend({}, args, { id: '__mce_tmp' })), {
                    skip_undo: 1
                });

                var el = ed.dom.get('__mce_tmp');

                if (!$('#clear').is(':disabled') && $('#clear').val() !== '') {
                    br = ed.dom.create('br');
                    ed.dom.setStyle(br, 'clear', $('#clear').val());
                    ed.dom.insertAfter(br, el);
                }

                // update id value
                ed.dom.setAttrib(el, 'id', args.id);
            }

            ed.undoManager.add();

            ed.nodeChanged();

            tinyMCEPopup.close();
        },

        selectFile: function (file, data) {
            var name = data.title,
                src = data.url;

            // get active tab
            var tab = $('.uk-tabs-panel > .uk-active').attr('id');

            if (tab == "rollover_tab") {
                $('input.uk-active', '#rollover_tab').or('#onmouseout').val(src);
            } else {
                // add an alt value only if it has not been manually edited
                if (!$('#alt').hasClass('uk-edited')) {
                    name = Wf.String.stripExt(name);
                    // replace underscore and dash with space
                    name = name.replace(/[-_]+/g, ' ');

                    $('#alt').val(name);
                }

                $('#onmouseout').val(src);
                $('#src').val(src);

                if (!data.width || !data.height) {
                    var img = new Image();

                    img.onload = function () {
                        $.each(['width', 'height'], function (i, k) {
                            $('#' + k).val(img[k]).data('tmp', img[k]).removeClass('uk-edited').addClass('uk-text-muted');
                        });

                    };

                    img.src = src;
                } else {
                    $.each(['width', 'height'], function (i, k) {
                        var v = data[k] || "";
                        $('#' + k).val(v).data('tmp', v).removeClass('uk-edited').addClass('uk-text-muted');
                    });
                }

                var dim = Wf.sizeToFit({
                    width: data.width,
                    height: data.height
                }, {
                    width: 80,
                    height: 60
                });

                // set preview
                $('#sample').attr({
                    'src': data.preview
                }).attr(dim);
            }
        }

    };
    window.ImageManagerDialog = ImageManagerDialog;

    //tinyMCEPopup.onInit.add(ImageManagerDialog.init, ImageManagerDialog);
    $(document).ready(function () {
        ImageManagerDialog.init();
    });
})(jQuery);