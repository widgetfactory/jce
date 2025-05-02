/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
/* global $, WFAggregator, Wf */


WFAggregator.add('vimeo', {
    /**
     * Parameter Object
     */
    params: {
        width: 480,
        height: 480,
        embed: true
    },

    props: {
        color: '',
        autoplay: 0,
        loop: 0,
        fullscreen: 1,
        dnt: 0
    },

    setup: function () {
        $('#vimeo_embed').toggle(this.params.embed);

        $.each(this.params, function (k, v) {
            if (k == 'attributes') {
                var x = 0;

                $.each(v, function (key, value) {
                    var $repeatable = $('.media_option.vimeo .uk-repeatable');

                    if (x > 0) {
                        $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                        // Refresh the $repeatable selection after appending a clone
                        $repeatable = $('.media_option.vimeo .uk-repeatable');
                    }

                    var $elements = $repeatable.eq(x).find('input, select');

                    $elements.eq(0).val(key);
                    $elements.eq(1).val(value);

                    x++;
                });

                return true;
            }

            $('#vimeo_' + k).val(v).filter(':checkbox, :radio').prop('checked', !!v);
        });
    },
    getTitle: function () {
        return this.title || this.name;
    },
    /**
     * Get the Media type
     */
    getType: function () {
        return 'iframe';
    },
    /**
     * Check whether a media type is supported
     */
    isSupported: function (v) {
        if (!v) {
            return false;
        }

        if (/vimeo(.+)?\/(.+)/.test(v)) {
            if (/\/external\//.test(v)) {
                return false;
            }

            return 'vimeo';
        }

        return false;
    },
    getValues: function (data) {
        var self = this,
            data = {},
            args = {},
            id = '';

        var src = data.src;

        // get variables from query string
        if (src.indexOf('=') !== -1) {
            $.extend(args, Wf.String.query(src));
        }

        $('input, select', '#vimeo_options').not('#vimeo_embed').each(function () {
            var k = $(this).attr('id'),
                v = $(this).val();
            // remove vimeo_ prefix
            k = k.substr(k.indexOf('_') + 1);

            if ($(this).is(':checkbox')) {
                v = $(this).is(':checked') ? 1 : 0;
            }

            if (self.props[k] == v || v === '') {
                return;
            }

            if (k === 'color' && v.charAt(0) === '#') {
                // remove # from color
                v = v.substr(1);
            }

            args[k] = v;
        });

        if (args.clip_id) {
            id = args.clip_id;
        } else {
            // process default values
            var id = '', hash = '', matches = /vimeo\.com\/([0-9]+)\/?([a-z0-9]+)?/.exec(src);

            if (matches && tinymce.is(matches, 'array')) {
                var id = matches[1];

                if (matches.length > 2) {
                    hash = matches[2];
                }
            }

            id = id + (hash ? '?h=' + hash : '');
        }

        src = 'https://player.vimeo.com/video/' + id;

        // convert args to URL query string
        var query = $.param(args);

        // add to src if not empty
        if (query) {
            src = src + (/\?/.test(src) ? '&' : '?') + query;
        }

        data.src = src;

        $.extend(data, {
            frameborder: 0
        });

        if (args.fullscreen !== 0) {
            $.extend(data, {
                allowfullscreen: true
            });
        }

        // get custom mediatype values
        $('.uk-repeatable', '#vimeo_attributes').each(function () {
            var elements = $('input, select', this);

            var key = $(elements).eq(0).val(),
                value = $(elements).eq(1).val();

            if (key) {
                data['vimeo_' + key] = value;
            }
        });

        return data;
    },
    setValues: function (data) {
        var self = this, src = data.src || data.data || '',
            id = '';

        if (!src) {
            return data;
        }

        var query = Wf.String.query(src);

        // replace &amp; with &
        src = src.replace(/&amp;/g, '&');

        // legacy embed method
        if (/moogaloop.swf/.test(src)) {
            data.vimeo_embed = true;

            // get id from clip_id
            id = query.clip_id;

            // delete clip_id
            delete query.clip_id;
            delete data.clip_id;

            $.each(['portrait', 'title', 'byline'], function (i, s) {
                delete data['show_' + s];
            });
        } else {
            // process default values
            var id = '', hash = '', matches = /vimeo\.com\/(?:\w+\/){0,3}((?:[0-9]+\b)(?:\/[a-z0-9]+)?)/.exec(src);

            if (matches && $.type(matches) == 'array') {
                var params = matches[1].split('/');

                var id = params[0];

                if (params.length == 2) {
                    hash = params[1];
                }

                id = id + (hash ? '/' + hash : '');
            }
        }

        $.each(query, function (key, val) {
            // skip default
            if (self.props[key] === val) {
                return true;
            }

            if (key == 'color' && val.charAt(0) !== '#') {
                val = '#' + val;
            }

            if (key == 'autoplay') {
                val = parseInt(val, 10);
            }

            data['vimeo_' + key] = val;
        });

        // simplify url
        src = 'https://vimeo.com/' + id;

        // remove iframe attributes
        $.each(data, function (key, val) {
            if (/^iframe_(allow|frameborder|allowfullscreen)/.test(key)) {
                delete data[key];
            }
        });

        data.src = src;

        return data;
    },
    getAttributes: function (src) {
        var args = {},
            data = this.setValues({
                src: src
            }) || {};

        $.each(data, function (k, v) {
            if (k == 'src') {
                return;
            }

            args['vimeo_' + k] = v;
        });
        $.extend(args, {
            'src': data.src || src,
            'width': this.params.width,
            'height': this.params.height
        });

        return args;
    },
    setAttributes: function () {

    },
    onSelectFile: function () { },
    onInsert: function () { }
});