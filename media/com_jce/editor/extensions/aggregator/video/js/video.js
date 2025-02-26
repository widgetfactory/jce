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

WFAggregator.add('video', {
    /**
     * Parameter Object
     */
    params: {
        width: '',
        height: ''
    },

    props: {
        autoplay: 0,
        loop: 0,
        controls: 1,
        mute: 0
    },

    setup: function () {
        $.each(this.params, function (k, v) {
            $('#video_' + k).val(v).filter(':checkbox, :radio').prop('checked', !!v);
        });
    },

    getTitle: function () {
        return this.title || this.name;
    },

    /**
     * Get the Media type
     */
    getType: function () {
        return 'video';
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
        
        if (/\.(mp4|m4v|ogv|ogg|webm)$/.test(v)) {
            return 'video';
        }

        return false;
    },

    setValues: function (attr, type) {
        return attr;
    },

    getAttributes: function (src) {
        return {
            'width': this.params.width,
            'height': this.params.height
        };
    }
});