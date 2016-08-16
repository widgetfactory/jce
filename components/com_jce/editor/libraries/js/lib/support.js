(function($) {
    var $tmp = document.createElement('div');

    // check for canvas
    $.support.canvas = !!document.createElement('canvas').getContext;
    // check for background size
    $.support.backgroundSize = (function () {
        var s = false;
        $.each(['backgroundSize', 'MozBackgroundSize', 'WebkitBackgroundSize', 'OBackgroundSize'], function () {
            if (typeof $tmp.style[this] !== 'undefined') {
                s = true;
            }
        });

        return s;
    })();

    /* http://downloads.beninzambia.com/blog/acrobat_detection.js.txt
     * Modified for our purposes
     */
    $.support.pdf = (function () {
        try {
            // IE
            if (!$.support.cssFloat) {
                var control = null;

                //
                // load the activeX control
                //
                try {
                    // AcroPDF.PDF is used by version 7 and later
                    control = new ActiveXObject('AcroPDF.PDF');
                }
                catch (e) {
                }

                if (!control) {
                    try {
                        // PDF.PdfCtrl is used by version 6 and earlier
                        control = new ActiveXObject('PDF.PdfCtrl');
                    }
                    catch (e) {
                    }
                }

                return control ? true : false;

            } else if (navigator.plugins) {
                for (var n in navigator.plugins) {
                    if (n == 'Adobe Acrobat') {
                        return true;
                    }

                    if (navigator.plugins[n].name && (navigator.plugins[n].name == 'Adobe Acrobat' || navigator.plugins[n].name == 'Chrome PDF Viewer')) {
                        return true;
                    }
                }
            } else if (navigator.mimeTypes) {
                // from PDFObject - https://github.com/pipwerks/PDFObject
                var mime = navigator.mimeTypes["application/pdf"];

                if (mime && mime.enabledPlugin) {
                    return true;
                }
            }
        }
        catch (e) {
        }

        return false;
    })();

    /*
     * From Modernizr v2.0.6
     * http://www.modernizr.com
     * Copyright (c) 2009-2011 Faruk Ates, Paul Irish, Alex Sexton
     */
    $.support.video = (function() {
        var el = document.createElement('video'), o = {};
        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {

            if (!!el.canPlayType) {
                o.ogg = el.canPlayType('video/ogg; codecs="theora"');

                // Workaround required for IE9, which doesn't report video support without audio codec specified.
                //   bug 599718 @ msft connect
                var h264 = 'video/mp4; codecs="avc1.42E01E';
                o.mp4 = el.canPlayType(h264 + '"') || el.canPlayType(h264 + ', mp4a.40.2"');

                o.webm = el.canPlayType('video/webm; codecs="vp8, vorbis"');

                return o;
            }

        } catch (e) {
        }

        return false;
    })();

    /*
     * From Modernizr v2.0.6
     * http://www.modernizr.com
     * Copyright (c) 2009-2011 Faruk Ates, Paul Irish, Alex Sexton
     */
    $.support.audio = (function() {
        var el = document.createElement('audio'), o = {};
        try {
            if (!!el.canPlayType) {
                o.ogg = el.canPlayType('audio/ogg; codecs="vorbis"');
                o.mp3 = el.canPlayType('audio/mpeg;');

                // Mimetypes accepted:
                //   https://developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   http://bit.ly/iphoneoscodecs
                o.wav = el.canPlayType('audio/wav; codecs="1"');
                o.m4a = el.canPlayType('audio/x-m4a;') || el.canPlayType('audio/aac;');
                o.webm = el.canPlayType('audio/webm; codecs="vp8, vorbis"');

                return o;
            }
        } catch (e) {
        }

        return false;
    })();

    $.support.cssCalc = (function() {
        var el = document.createElement('a');

        el.style.cssText = 'width:calc(10px);';

        return !!el.style.length;
    })();

})(jQuery);
