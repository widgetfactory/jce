/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
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
        autohide: 2,
        autoplay: 0,
        controls: 1,
        enablejsapi: 0,
        loop: 0,
        playlist: '',
        start: '',
        privacy: 0
    },
    setup: function() {
    },
    getTitle: function() {
        return this.title || this.name;
    },
    /**
     * Get the Media type
     */
    getType: function() {
        return $('#youtube_embed:visible').is(':checked') ? 'flash' : 'iframe';
    },
    /**
     * Check whether a media type is supported
     */
    isSupported: function(v) {
        if (typeof v == 'object') {
            v = v.src || v.data || '';
        }

        if (/youtu(\.)?be(.+)?\/(.+)/.test(v)) {
            return 'youtube';
        }

        return false;
    },
    getValues: function(src) {
        var self = this, data = {}, args = {}, type = this.getType(), id, query = {};

        // parse URI
        var u = this.parseURL(src);

        if (u.query) {
            // split query
            query = $.String.query(u.query);
        }

        // extend args with query data
        $.extend(args, query);

        // protocol / scheme relative url
        src = src.replace(/^http(s)?:\/\//, '//');

        $(':input', '#youtube_options').not('#youtube_embed, #youtube_https, #youtube_privacy').each(function() {
            var k = $(this).attr('id'), v = $(this).val();
            // remove youtube_ prefix
            k = k.substr(k.indexOf('_') + 1);
            if ($(this).is(':checkbox')) {
                v = $(this).is(':checked') ? 1 : 0;
            }

            if (k == 'autohide') {
                v = parseInt(v);
            }

            if (self.props[k] === v || v === '') {
                return;
            }

            args[k] = v;
        });

        // process src
        src = src.replace(/youtu(\.)?be([^\/]+)?\/(.+)/, function(a, b, c, d) {
            d = d.replace(/(watch\?v=|v\/|embed\/)/, '');

            if (b && !c) {
                c = '.com';
            }

            id = d.replace(/([^\?&#]+)/, function($0, $1) {
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
                allowfullscreen: true,
                frameborder: 0
            });
        } else {
            $.extend(true, data, {
                param: {
                    allowfullscreen: true,
                    wmode: 'opaque'
                }
            });
        }

        // convert args to URL query string
        var q = $.param(args);

        // add to src if not empty
        if (q) {
            src = src + (/\?/.test(src) ? '&' : '?') + q;
        }

        data.src = src;

        return data;
    },
    /**
     * Parse the Youtube URI into component parts
     * https://github.com/tinymce/tinymce/blob/master/js/tinymce/classes/util/URI.js
     */
    parseURL: function(url) {
        var o = {};

        url = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(url);
        $.each(["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"], function(i, v) {
            var s = url[i];
            if (s) {
                o[v] = s;
            }
        });

        return o;
    },
    setValues: function(data) {
        var self = this, id = '', src = data.src || data.data || '', query = {};

        if (!src) {
            return data;
        }

        //$.JSON.request('oEmbedWrapper', ['youtube', encodeURIComponent(src)], function(o) {});

        // parse URI
        var u = this.parseURL(src);

        if (u.query) {
            // split query
            query = $.String.query(u.query);
        }

        $.extend(data, query);

        // protocol / scheme relative url
        src = src.replace(/^http(s)?:\/\//, '//');

        if (src.indexOf('youtube-nocookie') !== -1) {
            data['privacy'] = true;
        }

        // if there is a param object set old embed method
        if (data.param) {
            data['embed'] = true;
        }

        if (query.v) {
            id = query.v;
            delete query.v;
        } else {
            var s = /\/?(embed|v)?\/([\w-]+)\b/.exec(u.path);

            if (s && $.type(s) === "array") {
                id = s.pop();
            }
        }

        // decode playlist
        if (data.playlist) {
            data.playlist = decodeURIComponent(data.playlist);
        }

        // reset playlist if it is the same as the id
        if (data.playlist === id) {
            data.playlist = null;
        }

        // remove wmode
        if (query.wmode) {
            delete query.wmode;
        }

        // add additional parameter fields
        $.each(query, function(k, v) {
            if (typeof self.props[k] == 'undefined') {
                $('#youtube_options table').append('<tr><td><label for="youtube_' + k + '">' + k + '</label><input type="text" id="youtube_' + k + '" value="' + v + '" /></td></tr>');
            }
        });

        // process url
        src = src.replace(/youtu(\.)?be([^\/]+)?\/(.+)/, function(a, b, c, d) {
            var args = 'youtube';

            if (b) {
                args += '.com';
            }

            if (c) {
                args += c;
            }

            if ($('#youtube_embed').is(':checked')) {
                args += '/v';
            } else {
                args += '/embed';
            }

            args += '/' + id;

            // add time
            if (u.anchor) {
                var s = u.anchor;

                s = s.replace(/(\?|&)(.+)/, '');

                args += '#' + s;
            }

            return args;
            // add www (required by iOS ??)
        }).replace(/\/\/youtube/i, '//www.youtube');

        data.src = src;

        return data;
    },
    getAttributes: function(src) {
        var args = {}, data = this.setValues({
            src: src
        }) || {};
        $.each(data, function(k, v) {
            if (k == 'src') {
                return;
            }

            args['youtube_' + k] = v;
        });
        $.extend(args, {
            'src': data.src || src,
            'width': this.params.width,
            'height': this.params.height
        });
        return args;
    },
    setAttributes: function() {

    },
    onSelectFile: function() {
    },
    onInsert: function() {
    }
});
