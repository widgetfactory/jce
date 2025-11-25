/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global $, WFAggregator, */

WFAggregator.add('youtube', {
    /**
     * Parameter Object
     */
    params: {
        width: 560,
        height: 315,
        embed: true
    },

    props: {
        rel: 1,
        autoplay: 0,
        mute: 0,
        controls: 1,
        modestbranding: 0,
        enablejsapi: 0,
        loop: 0,
        playlist: '',
        start: '',
        end: '',
        privacy: 0
    },

    setup: function () {
        $.each(this.params, function (k, v) {
            if (k == 'attributes') {
                var x = 0;

                $.each(v, function (key, value) {
                    var $repeatable = $('.uk-repeatable', '#youtube_attributes');

                    if (x > 0) {
                        $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                        // Refresh the $repeatable selection after appending a clone
                        $repeatable = $('.uk-repeatable', '#youtube_attributes');
                    }

                    var $elements = $repeatable.eq(x).find('input, select');

                    $elements.eq(0).val(key);
                    $elements.eq(1).val(value);

                    x++;
                });

                return true;
            }

            $('#youtube_' + k).val(v).filter(':checkbox, :radio').prop('checked', !!v);
        });

        $('#youtube_autoplay').on('change', function () {
            if (this.checked) {
                $('#youtube_mute').prop('checked', true);
            }
        }).trigger('change');
    },
    getTitle: function () {
        return this.title || this.name;
    },
    /**
     * Get the Media type
     */
    getType: function () {
        return $('#youtube_embed:visible').is(':checked') ? 'flash' : 'iframe';
    },
    /**
     * Check whether a media type is supported
     */
    isSupported: function (v) {
        if (!v) {
            return false;
        }

        if (/youtu(\.)?be(.+)?\/(.+)/.test(v)) {
            return 'youtube';
        }

        return false;
    },

    getValues: function (data) {
        var self = this,
            args = {},
            type = this.getType(),
            id;

        var src = data.src;

        // parse URI
        var u = this.parseURL(src);

        // extend args with query data
        $.extend(args, u.query);

        // ssl url
        src = src.replace(/^(http:)?\/\//, 'https://');

        $(':input', '#youtube_options').not('#youtube_embed, #youtube_https, #youtube_privacy').each(function () {
            var k = $(this).attr('id'),
                v = $(this).val();

            // no id set, skip it as it is a custom parameter
            if (!k) {
                return true;
            }

            // remove youtube_ prefix
            k = k.substr(k.indexOf('_') + 1);

            if ($(this).is(':checkbox')) {
                v = $(this).is(':checked') ? 1 : 0;
            }

            if (self.props[k] == v || v === '') {
                return;
            }

            args[k] = v;
        });

        if (args.autoplay == 1) {
            args.mute = 1;
        }

        // process src
        src = src.replace(/youtu(\.)?be([^\/]+)?\/(.+)/, function (a, b, c, d) {
            d = d.replace(/(watch\?v=|v\/|embed\/|live\/)/, '');

            if (b && !c) {
                c = '.com';
            }

            id = d.replace(/([^\?&#]+)/, function ($0, $1) {
                return $1;
            });

            return 'youtube' + c + '/' + (type == 'iframe' ? 'embed' : 'v') + '/' + d;
        });

        // loop requires a playlist value to be the same as the video id
        if (id && args.loop && !args.playlist) {
            args.playlist = id;
        }

        // privacy mode
        if ($('#youtube_privacy').is(':checked')) {
            src = src.replace(/youtube\./, 'youtube-nocookie.');
        } else {
            src = src.replace(/youtube-nocookie\./, 'youtube.');
        }

        if (type == 'iframe') {
            $.extend(data, {
                allowfullscreen: 'allowfullscreen',
                frameborder: 0
            });
        } else {
            $.extend(true, data, {
                param: {
                    allowfullscreen: 'allowfullscreen',
                    wmode: 'opaque'
                }
            });
        }

        $('.uk-repeatable', '#youtube_params').each(function () {
            var key = $('input[name^="youtube_params_name"]', this).val();
            var value = $('input[name^="youtube_params_value"]', this).val();

            if (key) {
                args[key] = value;
            }
        });

        // convert args to URL query string
        var q = $.param(args);

        // add to src if not empty
        if (q) {
            src = src + (/\?/.test(src) ? '&' : '?') + q;
        }

        data.src = src;

        // get custom mediatype values
        $('.uk-repeatable', '#youtube_attributes').each(function () {
            var elements = $('input, select', this);

            var key = $(elements).eq(0).val(),
                value = $(elements).eq(1).val();

            if (key) {
                data['youtube_' + key] = value;
            }
        });

        return data;
    },
    /**
     * Parse the Youtube URI into component parts
     */
    parseURL: function (url) {
        var o = {};

        try {
            var urlObj = new URL(url);

            o.host = urlObj.hostname;
            o.path = urlObj.pathname;

            // Parse query into a key-value map
            o.query = {};

            urlObj.searchParams.forEach(function (value, key) {
                o.query[key] = value;
            });

            o.anchor = urlObj.hash ? urlObj.hash.substring(1) : null;

        } catch (e) {
            console.error("Invalid URL:", url);
        }

        return o;
    },
    setValues: function (data) {
        var self = this, id = '',
            src = data.src || data.data || '';

        if (!src) {
            return data;
        }

        var attribs = {}, params = {};

        // parse URI
        var u = this.parseURL(src);

        // rebuild src
        src = 'https://' + u.host + '' + u.path;

        $.each(data, function (key, val) {
            if (key.indexOf('youtube_') === 0) {
                key = key.substr(key.indexOf('_') + 1);

                // boolean
                if (val === '' || val === true) {
                    val = key;
                }

                attribs[key] = val;

                delete data[key];
            }
        });

        if (src.indexOf('youtube-nocookie') !== -1) {
            data.youtube_privacy = 1;
        } else {
            data.youtube_privacy = 0;
        }

        if (u.query.v) {
            id = u.query.v;
        } else {
            var s = /\/?(embed|live|shorts|v)?\/([\w-]+)\b/.exec(u.path);

            if (s && $.type(s) === "array") {
                id = s.pop();
            }
        }

        // process values
        $.each(u.query, function (key, val) {
            // skip "v" key
            if (key == 'v') {
                return true;
            }

            // convert "t" key to "start" if it exists
            if (key == 't') {
                key = 'start';
                // remove seconds unit from value, allow only digits
                val = val.replace(/(\D)/g, '');
            }

            try {
                val = decodeURIComponent(val);
            } catch (e) {
                // error
            }

            if (key == 'autoplay') {
                val = parseInt(val, 10);
            }

            if (key == 'mute') {
                val = parseInt(val, 10);
            }

            // skip playlist if it is the same as the id
            if (key == 'playlist' && val == id) {
                return true;
            }

            // skip wmode
            if (key == 'wmode') {
                return true;
            }

            // skip default
            if (self.props[key] === val) {
                return true;
            }

            // if the key is specified in the props, set it
            if (self.props[key] !== undefined) {
                data['youtube_' + key] = val;

                return true;
            }

            // otherwise set as a custom param
            params[key] = val;

            delete data[key];
        });

        // process url
        src = src.replace(/youtu(\.)?be([^\/]+)?\/(.+)/, function (a, b, c, d) {
            var args = 'youtube';

            if (b) {
                args += '.com';
            }

            if (c) {
                args += c;
            }

            args += '/embed/' + id;

            // add time
            if (u.anchor) {
                var s = u.anchor;

                s = s.replace(/(\?|&)(.+)/, '');

                args += '#' + s;
            }

            return args;
            // add www (required by iOS ??)
        }).replace(/\/\/youtube/i, '//www.youtube');

        // remove iframe attributes
        $.each(data, function (key, val) {
            if (/^iframe_(allow|frameborder|allowfullscreen)/.test(key)) {
                delete data[key];
            }
        });

        // update params
        var x = 0;

        $.each(params, function (key, val) {
            var $repeatable = $('.uk-repeatable', '#youtube_params');

            // skip oembed flag
            if (key == 'feature' && val == 'oembed') {
                return true;
            }

            if (x > 0) {
                $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                // Refresh the $repeatable selection after appending a clone
                $repeatable = $('.uk-repeatable', '#youtube_params');
            }

            var $elements = $repeatable.eq(x).find('input, select');

            $elements.eq(0).val(key);
            $elements.eq(1).val(val);

            x++;
        });

        x = 0;

        $.each(attribs, function (key, val) {
            var $repeatable = $('.uk-repeatable', '#youtube_attributes');

            if (x > 0) {
                $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                // Refresh the $repeatable selection after appending a clone
                $repeatable = $('.uk-repeatable', '#youtube_attributes');
            }

            var $elements = $repeatable.eq(x).find('input, select');

            $elements.eq(0).val(key);
            $elements.eq(1).val(val);

            x++;
        });

        data.src = src;

        return data;
    },
    getAttributes: function (src) {
        var args = {},
            data = this.setValues({ src: src }) || {};

        $.each(data, function (k, v) {
            if (k === "src") {
                return;
            }

            args[k] = v;
        });

        var width = this.params.width;
        var height = this.params.height;

        if (src.indexOf('/shorts/') !== -1) {
            // For YouTube Shorts, use a different aspect ratio
            width = this.params.height; // Shorter width for Shorts
            height = this.params.width; // Taller height for Shorts
        }

        args = $.extend(args, {
            'src': data.src || src,
            'width': width,
            'height': height
        });

        return args;
    },
    setAttributes: function () {

    },
    onSelectFile: function () { },
    onInsert: function () { }
});