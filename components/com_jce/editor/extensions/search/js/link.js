/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
var WFLinkSearch = WFExtensions.add('LinkSearch', {
	
    options : {
        element		    : '#search-input',
        button          : '#search-button',
        clear           : '#search-clear',
        empty           : 'No Results',
        onClick 	    : $.noop
    },
	
    init : function(options) {
        $.extend(this.options, options);
        
        var self = this, el = this.options.element, btn = this.options.button;
        
        $(btn).click(function(e) {
            self.search();
            e.preventDefault();
        }).button({
            icons: {
                primary: 'ui-icon-search'
            }
        });

        $('#search-clear').click(function(e) {
            if($(this).hasClass('ui-active')) {
                $(this).removeClass('ui-active');

                $(el).val('');
                $('#search-result').empty().hide();
            }
        });
        
        $('#search-options-button').click(function(e) {
            e.preventDefault();

            $(this).addClass('ui-active');
            
            var $p = $('#search-options').parent();
            
            $('#search-options').height($p.parent().height() - $p.outerHeight() - 15).toggle();

        }).on('close', function() {
            $(this).removeClass('ui-active');
            $('#search-options').hide();
        });

        $(el).on('change keyup', function() {
            if (this.value === "") {
                $('#search-result').empty().hide();
                $('#search-clear').removeClass('ui-active');
            }
        });
    },

    search : function() {
        var self = this, s = this.options, el = s.element, btn = s.button, $p = $('#search-result').parent();
   
        var query = $(el).val();
        
        if (!query || $(el).hasClass('placeholder')) {
            return;
        }
        $('#search-clear').removeClass('ui-active');
        $('#search-browser').addClass('loading');
        
        // clean query
        query = $.trim(query.replace(/[\///<>#]/g, ''));

        $.JSON.request('doSearch', {
            'json' : [query]
        }, function(o) {
            if (o) {
                if (!o.error) {
                    
                    $('#search-result').empty();
                    
                    if (o.length) {                        
                        $.each(o, function(i, n) {                        
                            var $dl = $('<dl class="ui-margin-small" />').appendTo('#search-result');
                            
                            $('<dt class="link ui-margin-small" />').text(n.title).click(function() {
                                if ($.isFunction(self.options.onClick)) {
                                    self.options.onClick.call(this, $.String.decode(n.link));
                                }
                            }).prepend('<i class="ui-icon ui-icon-file-text-o ui-margin-small-right" />').appendTo($dl);
                            
                            $('<dd class="text">' + n.text + '</dd>').appendTo($dl);

                            if (n.anchors) {
                                $.each(n.anchors, function(i, a) {
                                    $('<dd class="anchor" />').text(a).click(function() {
                                        self.options.onClick.call(this, $.String.decode(n.link + '#' + a));
                                    }).appendTo($dl);
                                });
                            }
                        }); 
                        
                        $('dl:odd', '#search-result').addClass('odd');
                        
                    } else {
                        $('#search-result').append('<p>' + s.empty + '</p>');
                    }
                    $('#search-options-button').trigger('close');
                    $('#search-result').height($p.parent().height() - $p.outerHeight() - 5).show();
                } else {
                    $.Dialog.alert(o.error);
                }
            }
            $('#search-browser').removeClass('loading');
            $('#search-clear').addClass('ui-active');
        }, self);
    }
});