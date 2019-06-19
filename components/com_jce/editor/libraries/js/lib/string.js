(function($, Wf) {
    /**
     * String functions
     */
    Wf.String = {
        /**
         * From php.js
         * More info at: http://phpjs.org
         * php.js is copyright 2011 Kevin van Zonneveld.
         */
        basename: function(s) {
            return s.replace(/^.*[\/\\]/g, '');
        },
        /**
         * From php.js
         * More info at: http://phpjs.org
         * php.js is copyright 2011 Kevin van Zonneveld.
         */
        dirname: function(s) {
            if (/[\\\/]+/.test(s)) {
                return s.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
            }

            return '';
        },
        filename: function(s) {
            return this.stripExt(this.basename(s));
        },
        getExt: function(s) {
            return s.substring(s.length, s.lastIndexOf('.') + 1);
        },
        stripExt: function(s) {
            return s.replace(/\.[^.]+$/i, '');
        },
        pathinfo: function(s) {
            var info = {
                'basename': this.basename(s),
                'dirname': this.dirname(s),
                'extension': this.getExt(s),
                'filename': this.filename(s)
            };
            return info;
        },
        path: function(a, b) {
            if ($.type(a) === "array") {
                return this.clean(a.join('/'));
            }

            return this.clean(a + '/' + b);
        },
        clean: function(s) {
            if (s.indexOf('://') !== -1) {
              var parts = s.split('://');

              parts[1] = parts[1].replace(/\/+/g, '/');
              return parts.join('://');
            }

            return s.replace(/\/+/g, '/');
        },

        toASCII: function(string) {
            return punycode.encode(string, true).replace(/\x2D$/, '');
        },

        _toUnicode: function(s) {
            var c = s.toString(16).toUpperCase();

            while (c.length < 4) {
                c = '0' + c;
            }

            return '\\u' + c;
        },

        safe: function(s, mode, spaces, textcase) {
            mode = mode || 'utf-8';

            spaces = spaces || '_';

            // replace spaces with specified character
            s = s.replace(/[\s ]+/g, spaces);

            // remove some common characters
            s = s.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$]/g, '');
            var r = '';

            for (var i = 0, ln = s.length; i < ln; i++) {
                var ch = s[i];
                // only process on possible restricted characters or utf-8 letters/numbers
                if (/[^\w\.\-~\s ]/.test(ch)) {
                    // skip any character less than 127, eg: &?@* etc.
                    if (this._toUnicode(ch.charCodeAt(0)) < '\\u007F') {
                        continue;
                    }
                }

                r += ch;
            }

            s = r;

            if (mode === 'ascii') {
                s = this.toASCII(s);
            }

            // remove multiple period characters
            s = s.replace(/(\.){2,}/g, '');

            // remove leading period
            s = s.replace(/^\./, '');

            // remove trailing period
            s = s.replace(/\.$/, '');

            // cleanup path
            s = this.basename(s);

            // change case
            if (textcase) {
                switch (textcase) {
                    case 'lowercase':
                        s = s.toLowerCase();
                        break;
                    case 'uppercase':
                        s = s.toUpperCase();
                        break;
                }
            }

            return s;
        },
        query: function(s) {
            var p = {};

            s = this.decode(s);

            // nothing to create query from
            if (s.indexOf('=') === -1) {
                return p;
            }

            if (/\?/.test(s)) {
                s = s.substring(s.indexOf('?') + 1);
            }

            if (/#/.test(s)) {
                s = s.substr(0, s.indexOf('#'));
            }

            var pairs = s.replace(/&amp;/g, '&').split('&');

            $.each(pairs, function() {
                var pair = this.split('=');
                p[pair[0]] = pair[1];
            });

            return p;
        },
        /**
         * Encode basic entities
         *
         * Copyright 2010, Moxiecode Systems AB
         */
        encode: function(s) {
            var baseEntities = {
                '"': '&quot;',
                "'": '&#39;',
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            };
            return ('' + s).replace(/[<>&\"\']/g, function(chr) {
                return baseEntities[chr] || chr;
            });

        },
        /**
         * Decode basic entities
         *
         * Copyright 2010, Moxiecode Systems AB
         */
        decode: function(s) {
            var reverseEntities = {
                '&lt;': '<',
                '&gt;': '>',
                '&amp;': '&',
                '&quot;': '"',
                '&apos;': "'"
            };
            return s.replace(/&(#)?([\w]+);/g, function(all, numeric, value) {
                if (numeric)
                    return String.fromCharCode(value);

                return reverseEntities[all];
            });

        },
        escape: function(s) {
            return encodeURI(s);
        },
        unescape: function(s) {
            return decodeURI(s);
        },
        encodeURI: function(s, preserve_urls) {
            // don't encode local file links
            if (s && s.indexOf('file://') === 0) {
                return s;
            }

            s = encodeURIComponent(decodeURIComponent(s)).replace(/%2F/g, '/');

            if (preserve_urls) {
                s = s.replace(/%(21|2A|27|28|29|3B|3A|40|26|3D|2B|24|2C|3F|25|23|5B|5D)/g, function(a, b) {
                    return String.fromCharCode(parseInt(b, 16));
                });
            }

            return s;
        },
        buildURI: function(s) {
            // add http if necessary
            if (/^\s*www\./.test(s)) {
                s = 'http://' + s;
            }

            // the url contains "shortcode" characters, skip encoding
            if (s.indexOf('{') !== -1) {
                return s;
            }

            return s.replace(/ /g, '%20');
        },
        /**
         * From TinyMCE form_utils.js function, slightly modified.
         * @author Moxiecode
         * @copyright Copyright 2004-2008, Moxiecode Systems AB, All rights reserved.
         */
        toHex: function(color) {
            var re = new RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)", "gi");

            var rgb = color.replace(re, "$1,$2,$3").split(',');
            if (rgb.length == 3) {
                r = parseInt(rgb[0]).toString(16);
                g = parseInt(rgb[1]).toString(16);
                b = parseInt(rgb[2]).toString(16);

                r = r.length == 1 ? 0 + r : r;
                g = g.length == 1 ? 0 + g : g;
                b = b.length == 1 ? 0 + b : b;

                return "#" + r + g + b;
            }
            return color;
        },
        /**
         * From TinyMCE form_utils.js function, slightly modified.
         * @author Moxiecode
         * @copyright Copyright  2004-2008, Moxiecode Systems AB, All rights reserved.
         */
        toRGB: function(color) {
            if (color.indexOf('#') != -1) {
                color = color.replace(new RegExp('[^0-9A-F]', 'gi'), '');

                r = parseInt(color.substring(0, 2), 16);
                g = parseInt(color.substring(2, 4), 16);
                b = parseInt(color.substring(4, 6), 16);

                return "rgb(" + r + "," + g + "," + b + ")";
            }
            return color;
        },
        ucfirst: function(s) {
            return s.charAt(0).toUpperCase() + s.substring(1);
        },
        formatSize: function(s, int) {
            if (!s) {
                return "";
            }

            // MB
            if (s > 1048576) {
                var n = Math.round((s / 1048576) * 100) / 100;

                if (int) {
                    return n;
                }

                return n + " " + Wf.translate('size_mb', 'MB');
            }

            // KB
            if (s > 1024) {
                var n = Math.round((s / 1024) * 100) / 100;

                if (int) {
                    return n;
                }

                return n + " " + Wf.translate('size_kb', 'KB');
            }

            if (int) {
                return s;
            }

            return s + " " + Wf.translate('size_bytes', 'Bytes');
        },
        /**
         * Format a UNIX date string
         * @param time UNIX Time in seconds
         * @param fmt Date / Time Format eg: '%d/%m/%Y, %H:%M'
         * @return Formatted Date / Time
         * @copyright Copyright 2009, Moxiecode Systems AB
         */
        formatDate: function(time, fmt) {
            var date = new Date(time * 1000);

            fmt = fmt || '%d/%m/%Y, %H:%M';

            function addZeros(value, len) {
                var i;

                value = "" + value;

                if (value.length < len) {
                    for (i = 0; i < (len - value.length); i++)
                        value = "0" + value;
                }

                return value;
            }

            fmt = fmt.replace("%D", "%m/%d/%y");
            fmt = fmt.replace("%r", "%I:%M:%S %p");
            fmt = fmt.replace("%Y", "" + date.getFullYear());
            fmt = fmt.replace("%y", "" + date.getYear());
            fmt = fmt.replace("%m", addZeros(date.getMonth() + 1, 2));
            fmt = fmt.replace("%d", addZeros(date.getDate(), 2));
            fmt = fmt.replace("%H", "" + addZeros(date.getHours(), 2));
            fmt = fmt.replace("%M", "" + addZeros(date.getMinutes(), 2));
            fmt = fmt.replace("%S", "" + addZeros(date.getSeconds(), 2));
            fmt = fmt.replace("%I", "" + ((date.getHours() + 11) % 12 + 1));
            fmt = fmt.replace("%p", "" + (date.getHours() < 12 ? "AM" : "PM"));
            fmt = fmt.replace("%%", "%");

            return fmt;
        }
    };
})(jQuery, Wf);
