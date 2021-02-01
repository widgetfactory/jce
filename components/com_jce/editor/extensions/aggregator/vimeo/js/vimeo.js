/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
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
        if (typeof v == 'object') {
            v = v.src || v.data || '';
        }

        if (/vimeo(.+)?\/(.+)/.test(v)) {
            if (/\/external\//.test(v)) {
                return false;
            }

            return 'vimeo';
        }

        return false;
    },
    getValues: function (src) {
        var self = this,
            data = {},
            args = {},
            id = '';

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
            var s = /vimeo\.com\/(\w+\/)?(\w+\/)?([0-9]+)/.exec(src);

            if (s && $.type(s) === "array") {
                id = s.pop();
            }
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

        return data;
    },
    setValues: function (data) {
        var self = this,
            src = data.src || data.data || '',
            id = '';

        if (!src) {
            return data;
        }

        var query = Wf.String.query(src);

        // add extracted values to data
        $.extend(data, query);

        // replace &amp; with &
        src = src.replace(/&amp;/g, '&');

        // legacy embed method
        if (/moogaloop.swf/.test(src)) {
            data['embed'] = true;

            // get id from clip_id
            id = query['clip_id'];

            // delete clip_id
            delete query['clip_id'];
            delete data['clip_id'];

            $.each(['portrait', 'title', 'byline'], function (i, s) {
                delete data['show_' + s];
            });
        } else {
            var s = /vimeo\.com\/(\w+\/)?(\w+\/)?([0-9]+)/.exec(src);

            if (s && $.type(s) === "array") {
                id = s.pop();
            }
        }

        $.each(['portrait', 'title', 'byline', 'autoplay', 'loop', 'dnt'], function (i, s) {
            var v = query[s] || 0;

            // transfer value
            data[s] = v;
        });

        // add additional parameter fields
        $.each(query, function (k, v) {
            if (typeof self.props[k] == 'undefined') {
                $('#vimeo_options table').append('<tr><td><label for="vimeo_' + k + '">' + k + '</label><input type="text" id="vimeo_' + k + '" value="' + v + '" /></td></tr>');
            }
        });

        // simplify url
        src = 'https://vimeo.com/' + id;

        // add # to color
        if (data['color'] && data['color'].charAt(0) != '#') {
            data['color'] = '#' + data['color'];
        }

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