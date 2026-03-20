/* global jQuery, Wf */

(function ($, Wf) {

    var asciiMap = { "192": "A", "193": "A", "194": "A", "195": "A", "196": "A", "197": "A", "198": "AE", "199": "C", "200": "E", "201": "E", "202": "E", "203": "E", "204": "I", "205": "I", "206": "I", "207": "I", "208": "D", "209": "N", "210": "O", "211": "O", "212": "O", "213": "O", "214": "O", "216": "O", "217": "U", "218": "U", "219": "U", "220": "U", "221": "Y", "223": "s", "224": "a", "225": "a", "226": "a", "227": "a", "228": "a", "229": "a", "230": "ae", "231": "c", "232": "e", "233": "e", "234": "e", "235": "e", "236": "i", "237": "i", "238": "i", "239": "i", "241": "n", "242": "o", "243": "o", "244": "o", "245": "o", "246": "o", "248": "o", "249": "u", "250": "u", "251": "u", "252": "u", "253": "y", "255": "y", "256": "A", "257": "a", "258": "A", "259": "a", "260": "A", "261": "a", "262": "C", "263": "c", "264": "C", "265": "c", "266": "C", "267": "c", "268": "C", "269": "c", "270": "D", "271": "d", "272": "D", "273": "d", "274": "E", "275": "e", "276": "E", "277": "e", "278": "E", "279": "e", "280": "E", "281": "e", "282": "E", "283": "e", "284": "G", "285": "g", "286": "G", "287": "g", "288": "G", "289": "g", "290": "G", "291": "g", "292": "H", "293": "h", "294": "H", "295": "h", "296": "I", "297": "i", "298": "I", "299": "i", "300": "I", "301": "i", "302": "I", "303": "i", "304": "I", "305": "i", "306": "IJ", "307": "ij", "308": "J", "309": "j", "310": "K", "311": "k", "313": "L", "314": "l", "315": "L", "316": "l", "317": "L", "318": "l", "319": "L", "320": "l", "321": "l", "322": "l", "323": "N", "324": "n", "325": "N", "326": "n", "327": "N", "328": "n", "329": "n", "332": "O", "333": "o", "334": "O", "335": "o", "336": "O", "337": "o", "338": "OE", "339": "oe", "340": "R", "341": "r", "342": "R", "343": "r", "344": "R", "345": "r", "346": "S", "347": "s", "348": "S", "349": "s", "350": "S", "351": "s", "352": "S", "353": "s", "354": "T", "355": "t", "356": "T", "357": "t", "358": "T", "359": "t", "360": "U", "361": "u", "362": "U", "363": "u", "364": "U", "365": "u", "366": "U", "367": "u", "368": "U", "369": "u", "370": "U", "371": "u", "372": "W", "373": "w", "374": "Y", "375": "y", "376": "Y", "377": "Z", "378": "z", "379": "Z", "380": "z", "381": "Z", "382": "z", "383": "s", "402": "f", "416": "O", "417": "o", "431": "U", "432": "u", "461": "A", "462": "a", "463": "I", "464": "i", "465": "O", "466": "o", "467": "U", "468": "u", "469": "U", "470": "u", "471": "U", "472": "u", "473": "U", "474": "u", "475": "U", "476": "u", "506": "A", "507": "a", "508": "AE", "509": "ae", "510": "O", "511": "o" };

    /**
     * String functions
     */
    Wf.String = {
        /**
         * From php.js
         * More info at: http://phpjs.org
         * php.js is copyright 2011 Kevin van Zonneveld.
         */
        basename: function (s) {
            return s.replace(/^.*[\/\\]/g, '');
        },
        /**
         * From php.js
         * More info at: http://phpjs.org
         * php.js is copyright 2011 Kevin van Zonneveld.
         */
        dirname: function (s) {
            if (/[\\\/]+/.test(s)) {
                return s.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
            }

            return '';
        },
        filename: function (s) {
            return this.stripExt(this.basename(s));
        },
        getExt: function (s) {
            return s.substring(s.length, s.lastIndexOf('.') + 1);
        },
        stripExt: function (s) {
            return s.replace(/\.[^.]+$/i, '');
        },
        pathinfo: function (s) {
            var info = {
                'basename': this.basename(s),
                'dirname': this.dirname(s),
                'extension': this.getExt(s),
                'filename': this.filename(s)
            };
            return info;
        },
        path: function (a, b) {
            if ($.type(a) === "array") {
                return this.clean(a.join('/'));
            }

            return this.clean(a + '/' + b);
        },
        clean: function (s) {
            if (s.indexOf('://') !== -1) {
                var parts = s.split('://');

                parts[1] = parts[1].replace(/\/+/g, '/');
                return parts.join('://');
            }

            return s.replace(/\/+/g, '/');
        },

        toASCII: function (string) {
            return string.replace(/([^\w\.\-\s ])/gi, function (str) {
                return asciiMap[str.charCodeAt(0)] || '';
            });
        },

        _toUnicode: function (s) {
            var c = s.toString(16).toUpperCase();

            while (c.length < 4) {
                c = '0' + c;
            }

            return '\\u' + c;
        },

        safe: function (s, mode, spaces, textcase) {
            mode = mode || 'utf-8';

            spaces = spaces || '_';

            // replace spaces with specified character
            s = s.replace(/[\s ]+/g, spaces);

            // remove some common characters
            s = s.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g, '');

            var r = '';

            for (var i = 0, ln = s.length; i < ln; i++) {
                var ch = s[i];
                // only process on possible restricted characters or utf-8 letters/numbers
                if (/[^\w\.\-\s ]/.test(ch)) {
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
        query: function (s) {
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

            $.each(pairs, function (i, item) {            
                if (item) {
                    var pair = item.split('=');
                    p[pair[0]] = pair[1];
                }
            });

            return p;
        },
        /**
         * Encode basic entities
         *
         * Copyright 2010, Moxiecode Systems AB
         */
        encode: function (s) {
            var baseEntities = {
                '"': '&quot;',
                "'": '&#39;',
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            };
            return ('' + s).replace(/[<>&\"\']/g, function (chr) {
                return baseEntities[chr] || chr;
            });

        },
        /**
         * Decode basic entities
         *
         * Copyright 2010, Moxiecode Systems AB
         */
        decode: function (s) {
            var reverseEntities = {
                '&lt;': '<',
                '&gt;': '>',
                '&amp;': '&',
                '&quot;': '"',
                '&apos;': "'"
            };
            return s.replace(/&(#)?([\w]+);/g, function (all, numeric, value) {
                if (numeric) {
                    return String.fromCharCode(value);
                }

                return reverseEntities[all];
            });

        },
        escape: function (s) {
            return encodeURI(s);
        },
        unescape: function (s) {
            return decodeURI(s);
        },
        encodeURI: function (s, preserve_urls) {
            // don't encode local file links
            if (s && s.indexOf('file://') === 0) {
                return s;
            }

            s = encodeURIComponent(decodeURIComponent(s)).replace(/%2F/g, '/');

            if (preserve_urls) {
                s = s.replace(/%(21|2A|27|28|29|3B|3A|40|26|3D|2B|24|2C|3F|25|23|5B|5D)/g, function (a, b) {
                    return String.fromCharCode(parseInt(b, 16));
                });
            }

            return s;
        },
        buildURI: function (s) {
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
        toHex: function (color) {
            var re = new RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)", "gi");

            var rgb = color.replace(re, "$1,$2,$3").split(',');
            if (rgb.length == 3) {
                var r = parseInt(rgb[0], 10).toString(16);
                var g = parseInt(rgb[1], 10).toString(16);
                var b = parseInt(rgb[2], 10).toString(16);

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
        toRGB: function (color) {
            if (color.indexOf('#') != -1) {
                color = color.replace(new RegExp('[^0-9A-F]', 'gi'), '');

                var r = parseInt(color.substring(0, 2), 16);
                var g = parseInt(color.substring(2, 4), 16);
                var b = parseInt(color.substring(4, 6), 16);

                return "rgb(" + r + "," + g + "," + b + ")";
            }
            return color;
        },
        ucfirst: function (s) {
            return s.charAt(0).toUpperCase() + s.substring(1);
        },
        formatSize: function (s, int) {
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
        formatDate: function (time, fmt) {
            if (!time) {
                return "";
            }
            
            var date = new Date(time * 1000);

            fmt = fmt || '%d/%m/%Y, %H:%M';

            function addZeros(value, len) {
                var i;

                value = "" + value;

                if (value.length < len) {
                    for (i = 0; i < (len - value.length); i++) {
                        value = "0" + value;
                    }
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
