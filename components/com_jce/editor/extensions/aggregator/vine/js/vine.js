/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
WFAggregator.add('vine', {
    /**
	 * Parameter Object
	 */
    params : {
        type    : 'simple',
        size    : 600
    },

    setup : function() {
        $('#vine_size').change(function() {
            $('#width, #height').val(this.value).change();
        });
    },
    
    getTitle : function() {
        return this.title || this.name;
    },
    /**
	 * Get the Media type
	 */
    getType : function() {
        return 'iframe';
    },
    /**
	 * Check whether a media type is supported
	 */
    isSupported : function(v) {
        if (typeof v == 'object') {
            v = v.src || v.data || '';
        }

        if (/vine\.co\/(.+)/.test(v)) {                        
            return 'vine';
        }

        return false;
    },
    getValues : function(src) {
        var self = this, data = {}, args = {}, type = this.getType(), id = '';

        $.extend(args, $.String.query(src));

        $('input, select', '#vine_options').each( function() {
            var k = $(this).attr('id'), v = $(this).val();
            // remove vimeo_ prefix
            k = k.substr(k.indexOf('_') + 1);

            if ($(this).is(':checkbox')) {
                v = $(this).is(':checked') ? 1 : 0;
            }

            args[k] = v;
        });
        
        var s = /vine\.co\/v\/([a-z0-9A-Z]+)\/?/.exec(src);

        if (s && s.length > 1) {
            id = s[1];
        }
        // protocol / scheme relative url
        src = '//vine.co/v/' + id + '/embed/' + (args.type || this.params.type || '');

        // convert args to URL query string
        /*var query = $.param(args);

        // add to src if not empty
        if (query) {
            src = src + (/\?/.test(src) ? '&' : '?') + query;
        }*/

        data.src = src;

        $.extend(data, {
            'frameborder' : 0,
            'class' : 'vine-embed',
            'width' : args.size || this.params.size,
            'height': args.size || this.params.size
        });

        return data;
    },
    setValues : function(data) {
        var self = this, src = data.src || data.data || '', id = '';

        if (!src) {
            return data;
        }

        var s = /vine\.co\/v\/([a-z0-9A-Z]+)\/?(embed)?\/?(simple|postcard)?/.exec(src);

        if (s && s.length > 1) {
            id = s[1];
            
            data.type = s.length == 4 ? s[3] : '';
        }
        
        // simplify url
        data.src    = '//vine.co/v/' + id + '/embed/';
        data.size   = data.width || data.height || this.params.size; 

        return data;
    },
    getAttributes : function(src) {
        var args = {}, data = this.setValues({
            src : src
        }) || {};

        $.each(data, function(k, v) {
            if (k == 'src') {
                return;
            }

            args['vine_' + k] = v;
        });
        
        $.extend(args, {
            'src'   : data.src || src,
            'width' : this.params.size,
            'height': this.params.size
        });

        return args;
    },
    setAttributes : function() {

    },
    onSelectFile 	: function() {
    },
    onInsert : function() {
    }
});
