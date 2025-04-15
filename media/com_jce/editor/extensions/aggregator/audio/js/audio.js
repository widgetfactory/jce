/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global $, WFAggregator */

WFAggregator.add('audio', {
    /**
     * Parameter Object
     */
    params: {},

    props: {
        autoplay: 0,
        loop: 0,
        controls: 1,
        mute: 0
    },

    setup: function () {
       var x = 0;

        $.each(this.params, function (k, v) {
            if (k == 'custom') {
                
                $.each(v, function (key, value) {
                    var $repeatable = $('.media_option.audio .uk-repeatable');

                    if (x > 0) {
                        $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                        // Refresh the $repeatable selection after appending a clone
                        $repeatable = $('.media_option.audio .uk-repeatable');
                    }

                    var $elements = $repeatable.eq(x).find('input, select');

                    $elements.eq(0).val(key);
                    $elements.eq(1).val(value);

                    x++;
                });
                
                
            } else {
                $('#audio_' + k).val(v).filter(':checkbox, :radio').prop('checked', !!v);
            }
        });
    },

    getTitle: function () {
        return this.title || this.name;
    },

    /**
     * Get the Media type
     */
    getType: function () {
        return 'audio';
    },

    /**
     * Check whether a media type is supported
     */
    isSupported: function (v) {
        if (!v) {
            return false;
        }

        // remove any query string
        v = v.split('?')[0];
        
        if (/\.(mp3|oga|webm|wav|m4a|aiff)$/.test(v)) {
            return 'audio';
        }

        return false;
    },

    setValues: function (attr, type) {
        return attr;
    },

    getAttributes: function (src) {
        return {
            width: '',
            height: ''
        };
    }
});