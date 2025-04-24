/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global Wf, WFAggregator, $ */

WFAggregator.add('dailymotion', {
    /**
     * Parameter Object
     */
    params: {
        width: 480,
        height: 270,
        autoPlay: false
    },
    props: {
        autoPlay: 0,
        start: 0
    },
    setup: function () {
        $('#dailymotion_autoPlay').prop('checked', this.params.autoPlay);

        $('#dailymotion_player_size').on('change', function () {
            var v = parseInt(this.value, 10);
            $('#dailymotion_player_size_custom').toggleClass('uk-hidden', !!this.value);

            if (v) {
                $('#width').val(v);
                $('#height').val(Math.round(v * 9 / 16));
            }

        });

        $('#dailymotion_player_size_custom').on('change', function () {
            var v = parseInt(this.value, 10);

            if (v) {
                $('#width').val(v);
                $('#height').val(Math.round(v * 16 / 9));
            }
        });

        var attributes = this.params.attributes || {};

        var x = 0;

        $.each(attributes, function (key, value) {
            var $repeatable = $('.media_option.dailymotion .uk-repeatable');

            if (x > 0) {
                $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                // Refresh the $repeatable selection after appending a clone
                $repeatable = $('.media_option.dailymotion .uk-repeatable');
            }

            var $elements = $repeatable.eq(x).find('input, select');

            $elements.eq(0).val(key);
            $elements.eq(1).val(value);

            x++;
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

        if (/dai\.?ly(motion)?(\.com)?/.test(v)) {
            return 'dailymotion';
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

        $('input[id], select[id]', '#dailymotion_options').each(function () {
            var k = $(this).attr('id'),
                v = $(this).val();

            // remove dailymotion_ prefix
            k = k.substr(k.indexOf('_') + 1);

            if ($(this).is(':checkbox')) {
                v = $(this).is(':checked') ? 1 : 0;
            }

            if (k.indexOf('player_size') !== -1) {
                return;
            }

            if (self.props[k] === v || v === '') {
                return;
            }

            args[k] = v;
        });

        var m = src.match(/dai\.?ly(motion\.com)?\/(embed)?\/?(swf|video)?\/?([a-z0-9]+)_?/);

        if (m) {
            id = m.pop();
        }

        // protocol / scheme relative url
        src = 'https://www.dailymotion.com/embed/video/' + id;

        // convert args to URL query string
        var query = $.param(args);

        // add to src if not empty
        if (query) {
            src = src + (/\?/.test(src) ? '&' : '?') + query;
        }

        data.src = src;

        $.extend(data, {
            frameborder: 0,
            allowfullscreen: "allowfullscreen"
        });

        // get custom mediatype values
        $('.uk-repeatable', '#dailymotion_attributes').each(function () {
            var elements = $('input, select', this);

            var key = $(elements).eq(0).val(),
                value = $(elements).eq(1).val();

            if (key) {
                data['dailymotion_' + key] = value;
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

        // add extracted values to data
        $.each(query, function (key, val) {
            if (self.props[key] == val) {
                return true;
            }

            data['dailymotion_' + key] = val;
        });

        // replace &amp; with &
        src = src.replace(/&amp;/g, '&');

        var m = src.match(/dai\.?ly(motion\.com)?\/(embed)?\/?(swf|video)?\/?([a-z0-9]+)_?/);

        if (m) {
            id = m.pop();
        }

        // simplify url
        data.src = 'https://www.dailymotion.com/embed/video/' + id;

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

            args['dailymotion_' + k] = v;
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