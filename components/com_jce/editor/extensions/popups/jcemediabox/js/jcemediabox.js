/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/**
 * JCEMediaBox Popup functions
 */
JCEMediaBox = {
    Popup: {
        /**
         * Addons object
         */
        addons: {},
        /**
         * Set Addons
         * @param {String} n Addon name
         * @param {Object} o Addon Object
         */
        setAddons: function(n, o) {
            if (typeof this.addons[n] == 'undefined') {
                this.addons[n] = {};
            }
            $.extend(this.addons[n], o);
        },
        /**
         * Get all addons
         * @param {String} n Optional addon name
         */
        getAddons: function(n) {
            if (n) {
                return this.addons[n];
            }

            return this.addons;
        },
        /**
         * Get / Test an addon object
         * @param {Object} v
         * @param {Object} n
         */
        getAddon: function(v, n) {
            var t = this,
                cp = false,
                r;

            var addons = this.getAddons(n);

            $.each(addons, function(addon, o) {
                var fn = o[addon] ||
                    function() {};

                r = fn.call(this, v);
                if (typeof r != 'undefined') {
                    cp = r;
                }

            });

            return cp;
        }

    },
    /**
     * Utility function to trim whitespace from a string
     * @param {String} s
     */
    trim: function(s) {
        return $.trim(s);
    }

};
WFPopups.addPopup('jcemediabox', {
    params: {
        'popup_group': '',
        'popup_icon': 1,
        'popup_icon_position': '',
        'popup_autopopup': '',
        'popup_hide': 0,
        'popup_mediatype': ''
    },
    setup: function() {
        var self = this;
        $('#jcemediabox_popup_icon').on('change', function() {
            self.setIcon();
        });

        $.each(this.params, function(k, v) {

            if (k === 'popup_icon_position') {
                v = v.replace('icon-', 'zoom-');
            }

            $('#jcemediabox_' + k).val(v);
        });
    },
    /**
     * Check if node is a JCE MediaBox popup
     * @param {Object} n Element
     */
    check: function(n) {
        return /(jce(popup|_popup|lightbox)|wfpopup)/.test(n.className) || n.getAttribute('data-mediabox');
    },
    /**
     * Get the MIME Type from a media type value
     * @param {Object} mt Media type value
     */
    getMediaType: function(n) {
        var mt;

        switch (n.type) {
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
            case 'image/*':
            case 'image':
                mt = 'image';
                break;
            case 'iframe':
                mt = 'iframe';
                break;
            case 'director':
            case 'application/x-director':
                mt = 'application/x-director';
                break;
            case 'windowsmedia':
            case 'mplayer':
            case 'application/x-mplayer2':
                mt = 'application/x-mplayer2';
                break;
            case 'quicktime':
            case 'video/quicktime':
                mt = 'video/quicktime';
                break;
            case 'real':
            case 'realaudio':
            case 'audio/x-pn-realaudio-plugin':
                mt = 'audio/x-pn-realaudio-plugin';
                break;
            case 'divx':
            case 'video/divx':
                mt = 'video/divx';
                break;
            case 'flash':
            case 'application/x-shockwave-flash':
                mt = 'application/x-shockwave-flash';
                break;
            case 'ajax':
            case 'text/xml':
            case 'text/html':
                mt = 'text/html';
                break;
        }

        if (!mt && n.href) {
            JCEMediaBox.options = {
                popup: {
                    google_viewer: 0,
                    pdfjs: 0
                }
            };

            var o = JCEMediaBox.Popup.getAddon(n.href);

            if (o && o.type) {
                mt = o.type;
            }
        }

        return mt || n.type || '';
    },
    getImageType: function(s) {
        // get extension
        var e = /\.(jp(eg|g)|png|bmp|gif|tiff)$/.exec(s);

        if (e) {
            if (e[1] === "jpg") {
                e[1] = "jpeg";
            }

            return "image/" + e[1];
        }

        // use jpeg as default
        return "image/jpeg";
    },
    /**
     * Clean a link of popup attributes (does not clean rel attribute)
     * @param {Object} n
     */
    remove: function(n) {
        var ed = tinyMCEPopup.editor;

        // Cleanup
        $.each(['jcepopup', 'jcelightbox', 'jcebox', 'icon-left', 'icon-right', 'icon-top-left', 'icon-top-right', 'icon-bottom-left', 'icon-bottom-right', 'zoom-left', 'zoom-right', 'zoom-top-left', 'zoom-top-right', 'zoom-bottom-left', 'zoom-bottom-right', 'noicon', 'noshow', 'autopopup-single', 'autopopup-multiple'], function(i, v) {
            ed.dom.removeClass(n, v);
        });

        // remove data attributes
        ed.dom.setAttrib(n, 'data-mediabox', null);
        ed.dom.setAttrib(n, 'data-mediabox-title', null);
        ed.dom.setAttrib(n, 'data-mediabox-caption', null);
        ed.dom.setAttrib(n, 'data-mediabox-group', null);
    },
    /**
     * Convert parameter string to JSON object
     */
    convertData: function(s) {
        var a = [];

        function trim(s) {
            // trim
            return s.replace(/:"([^"]+)"/, function(a, b) {
                return ':"' + b.replace(/^\s+|\s+$/, '').replace(/\s*::\s*/, '::') + '"';
            });
        }

        // if json string return object
        if (/^{[\w\W]+}$/.test(s)) {
            return $.parseJSON(trim(s));
        }

        // parameter format eg: title[title]
        if (/\w+\[[^\]]+\]/.test(s)) {
            var data = {};

            tinymce.each(tinymce.explode(s, ';'), function(p) {
                var args = p.match(/([\w-]+)\[(.*)\]$/);

                if (args && args.length === 3) {
                    data[args[1]] = args[2];
                }
            });

            return data;

            /*s = s.replace(/([\w-]+)\[([^\]]+)\](;)?/g, function (a, b, c, d) {
                return '"' + b + '":"' + tinymce.DOM.encode(c) + '"' + (d ? ',' : '');
            });

            return $.parseJSON('{' + trim(s) + '}');*/
        }

        return {};
    },
    /**
     * Get popup parameters
     * @param {Object} n Popup node
     */
    getAttributes: function(n, index, callback) {
        var ed = tinyMCEPopup.editor,
            data = {},
            rv, v;

        var rel = ed.dom.getAttrib(n, 'rel');

        // No icon
        var icon = /noicon/g.test(n.className);
        var hide = /noshow/g.test(n.className);

        // Auto popup
        if (/(autopopup(.?|-single|-multiple))/.test(n.className)) {
            v = /autopopup-multiple/.test(n.className) ? 'autopopup-multiple' : 'autopopup-single';

            $('#jcemediabox_popup_autopopup').val(v);
        }

        $('#jcemediabox_popup_icon').val(icon ? 0 : 1);
        $('#jcemediabox_popup_icon_position').prop('disabled', icon);

        $('#jcemediabox_popup_hide').val(hide ? 1 : 0);

        // Get position
        if (s = /(zoom|icon)-(top-right|top-left|bottom-right|bottom-left|left|right)/.exec(n.className)) {
            var v = s[0];

            if (v) {
                v = v.replace('icon-', 'zoom-');
                $('#jcemediabox_popup_icon_position').val(v);
            }
        }

        var relRX = /(^|\\s+)alternate|stylesheet|start|next|prev|contents|index|glossary|copyright|chapter|section|subsection|appendix|help|bookmark|nofollow|noopener|noreferrer|licence|tag|friend(\\s+|$)/gi;
        var json = ed.dom.getAttrib(n, 'data-json') || ed.dom.getAttrib(n, 'data-mediabox');

        if (json) {
            data = this.convertData(json);
        }

        if (rel && /\w+\[.*\]/.test(rel)) {
            var ra = '';
            if (rv = relRX.exec(rel)) {
                // pass on rel value
                ra = rv[1];
                // remove rel values
                rel = rel.replace(relRX, '');
            }

            if (/^\w+\[/.test((rel))) {
                // convert to object
                data = this.convertData($.trim(rel)) || {};
                // add to object
                data.rel = ra;
            }
        } else {
            // remove standard rel values
            var group = $.trim(rel.replace(relRX, ''));

            $('#jcemediabox_popup_group').val(group);
        }

        if ($.isEmptyObject(data)) {
            $.each(ed.dom.getAttribs(n), function(i, at) {
                var name = at.name || at.nodeName;

                if (name && name.indexOf('data-mediabox-') !== -1) {
                    var k = name.substr(14);
                    data[k] = ed.dom.getAttrib(n, name);
                }
            });
        }

        if (data.title && /::/.test(data.title)) {
            var parts = data.title.split('::');
            if (parts.length > 1) {
                data.caption = parts[1];
            }
            data.title = parts[0];
        }

        $.each(data, function(k, v) {
            if ($('#jcemediabox_popup_' + k).get(0) && v !== "") {

                if (k == 'title' || k == 'caption' || k == 'group') {
                    try {
                        v = decodeURIComponent(v);
                    } catch (e) {}
                }

                v = tinymce.DOM.decode(v);

                $('#jcemediabox_popup_' + k).val(v).trigger('change');

                if (k == 'title' || k == 'caption') {
                    $('input[name^="jcemediabox_popup_' + k + '"]').eq(index).val(v);
                }

                // remove from object
                delete data[k];
            }
        });

        // add standard values
        $.each(['href', 'type', 'data-mediabox-width', 'data-mediabox-height'], function(i, name) {
            var val = ed.dom.getAttrib(n, name);

            if (val) {
                // remap href
                if (name === 'href') {
                    name = 'src';
                }

                if (name.indexOf('data-mediabox-') === 0) {
                    name = name.substr(14);
                }
                
                data[name] = val;
            }
        });

        // process data through passed in callback
        data = callback(data);

        var x = 0;

        // process remaining data values as params
        $.each(data, function(k, v) {
            if (v !== '') {

                try {
                    v = decodeURIComponent(v);
                } catch (e) {}

                var n = $('.uk-repeatable', '#jcemediabox_popup_params').eq(0);

                if (x > 0) {
                    $(n).clone(true).appendTo($(n).parent());
                }

                var elements = $('.uk-repeatable', '#jcemediabox_popup_params').eq(x).find('input, select');

                $(elements).eq(0).val(k);
                $(elements).eq(1).val(v);
            }
            x++;
        });

        // Set type
        $('#jcemediabox_popup_mediatype').val(this.getMediaType(n));

        return data;
    },
    /**
     * Set Popup Attributes
     * @param {Object} n Link Element
     */
    setAttributes: function(n, args, index) {
        var self = this,
            ed = tinyMCEPopup.editor;

        // set default index
        index = index || 0;

        this.remove(n);

        // set default index
        index = index || 0;

        // Add jcepopup class
        ed.dom.addClass(n, 'jcepopup');

        // add data attribite
        ed.dom.setAttrib(n, 'data-mediabox', 1);

        // Autopopup
        var auto = $('#jcemediabox_popup_autopopup').val();

        if (auto) {
            ed.dom.addClass(n, auto);
        }

        var data = {};

        // pass title to link
        if (args.title) {
            ed.dom.setAttrib(n, 'title', args.title);
            delete args.title;
        }

        $.each(['group', 'width', 'height', 'title', 'caption'], function(i, k) {
            var v = $('#jcemediabox_popup_' + k).val() || args[k] || "";

            if (k == 'title' || k == 'caption') {
                var mv = $('input[name^="jcemediabox_popup_' + k + '"]').eq(index).val();

                if (typeof mv !== "undefined") {
                	v = mv;
                }
            }

            data[k] = v;
        });

        $('.uk-repeatable', '#jcemediabox_popup_params').each(function() {
            var k = $('input[name^="jcemediabox_popup_params_name"]', this).val();
            var v = $('input[name^="jcemediabox_popup_params_value"]', this).val();

            if (k !== '' && v !== '') {
                data[k] = v;
            }
        });

        // combine args
        data = $.extend(data, args.data || {});

        // set type
        var mt = $('#jcemediabox_popup_mediatype').val() || n.type || args.type || '';

        // get image type
        if (mt == "image") {
            mt = this.getImageType(n.href);
        }

        // Set media type
        ed.dom.setAttrib(n, 'type', mt);

        // remove type so it is not added to rel attribute
        if (data.type) {
            delete data.type;
        }
        // get rel attribute value
        var rel = ed.dom.getAttrib(n, 'rel', '');

        // remove any existing properties
        if (rel) {
            rel = rel.replace(/([a-z0-9]+)(\[([^\]]+)\]);?/gi, '');
        }

        $('.uk-repeatable', '#jcemediabox_popup_params').each(function() {
            var elements = $('input, select', this);
            var key = $(elements).eq(0).val(),
                value = $(elements).eq(1).val();

            data[key] = value;
        });

        // remove all data-mediabox- attributes
        var i, attrs = n.attributes;

        for (i = attrs.length - 1; i >= 0; i--) {
            var attrName = attrs[i].name;

            if (attrName && attrName.indexOf('data-mediabox-') !== -1) {
                n.removeAttribute(attrName);
            }
        }

        // set data to data-mediabox attributes
        $.each(data, function(k, v) {
            ed.dom.setAttrib(n, 'data-mediabox-' + k, v);
        });

        // set data to rel attribute
        ed.dom.setAttrib(n, 'rel', $.trim(rel));

        // Add noicon class
        if ($('#jcemediabox_popup_icon').val() == 0) {
            ed.dom.addClass(n, 'noicon');
        } else {
            ed.dom.addClass(n, $('#jcemediabox_popup_icon_position').val());
        }

        if ($('#jcemediabox_popup_hide').val() == 1) {
            ed.dom.addClass(n, 'noshow');
        }
    },
    /**
     * Set the poup icon option
     */
    setIcon: function() {
        var v = $('#jcemediabox_popup_icon').val();

        if (parseInt(v)) {
            $('#jcemediabox_popup_icon_position').prop('disabled', false).removeAttr('disabled');
        } else {
            $('#jcemediabox_popup_icon_position').attr('disabled', 'disabled');
        }
    },
    /**
     * Function to call when popup extension selected
     */
    onSelect: function() {},
    /**
     * Call function when a file is selected / clicked
     * @param {Object} args Function arguments
     */
    onSelectFile: function(args) {
        // Set popup attributes
        $.each(args, function(k, v) {
            $('#jcemediabox_popup_' + k).val(v);
        });

    }
});
