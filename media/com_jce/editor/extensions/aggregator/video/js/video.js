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
        muted: 0
    },

    setup: function () {
        var x = 0;

        $.each(this.params, function (k, v) {
            if (k == 'attributes') {

                $.each(v, function (key, value) {
                    var $repeatable = $('.media_option.video .uk-repeatable');

                    if (x > 0) {
                        $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                        // Refresh the $repeatable selection after appending a clone
                        $repeatable = $('.media_option.video .uk-repeatable');
                    }

                    var $elements = $repeatable.eq(x).find('input, select');

                    $elements.eq(0).val(key);
                    $elements.eq(1).val(value);

                    x++;
                });


            } else {
                $('#video_' + k).val(v).filter(':checkbox, :radio').prop('checked', !!v);
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

    getValues: function (data) {
        var sources = [];

        $('input[name="video_source[]"]').each(function () {
            var val = $(this).val();

            // pass in unique source value only
            if (val !== data.src) {
                sources.push(val);
            }
        });

        if (sources.length) {
            // eslint-disable-next-line dot-notation
            data['video_source'] = sources;
        }

        // get custom mediatype values
        $('.uk-repeatable', '#video_attributes').each(function () {
            var elements = $('input, select', this);

            var key = $(elements).eq(0).val(),
                value = $(elements).eq(1).val();

            if (key) {
                data['video_' + key] = value;
            }
        });

        return data;
    },

    setValues: function (data) {
        var x = 0, self = this;
        
        $.each(data, function (key, val) {
            if (key.indexOf('video_') === -1) {
                return true;
            }

            // remove from data object
            delete data[key];

            // remove video_ prefix
            key = key.substr(key.indexOf('_') + 1);

            // skip default props
            if (key in self.props) {
                return true;
            }

            if (val == '' || val == true) {
                val = key;
            }
            
            var $repeatable = $('.uk-repeatable', '#video_attributes');

            if (x > 0) {
                $repeatable.eq(0).clone(true).appendTo($repeatable.parent());

                // Refresh the $repeatable selection after appending a clone
                $repeatable = $('.uk-repeatable', '#video_attributes');
            }

            var $elements = $repeatable.eq(x).find('input, select');

            $elements.eq(0).val(key);
            $elements.eq(1).val(val);

            x++;
        });
        
        return data;
    },

    getAttributes: function (src) {
        return {
            'width': this.params.width,
            'height': this.params.height
        };
    }
});