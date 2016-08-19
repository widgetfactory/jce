/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function($) {
    var docElement = document.documentElement;
    var smile   = ':)';
    var $input  = document.createElement('input');
    var $div    = document.createElement('div');
    
    $.support.input = {};

    /**
     * Test for placeholder, min, max, pattern attribute support
     * From Modernizer 1.7
     * http://www.modernizr.com
     * Copyright (c) 2009-2011
     * http://www.modernizr.com/license/
     */
    $.support.input.attr = (function(at) {
        var o = {}, i;
        for (i = 0, n = at.length; i<n; i++) {
            o[at[i]] = !!(at[i] in $input);
        }
        return o;
    })('placeholder max min pattern number'.split(' '));
    
    /**
     * Test for input types
     * From Modernizer 1.7
     * http://www.modernizr.com
     * Copyright (c) 2009-2011
     * http://www.modernizr.com/license/
     */
    $.support.input.type = (function(props) {
        var o = {};
        
        for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

            $input.setAttribute('type', inputElemType = props[i]);
            bool = $input.type !== 'text';

            // We first check to see if the type we give it sticks..
            // If the type does, we feed it a textual value, which shouldn't be valid.
            // If the value doesn't stick, we know there's input sanitization which infers a custom UI
            if ( bool ) {

                $input.value         = smile;
                $input.style.cssText = 'position:absolute;visibility:hidden;';

                if ( /^range$/.test(inputElemType) && $input.style.WebkitAppearance !== undefined ) {

                    docElement.appendChild($input);
                    defaultView = document.defaultView;

                    // Safari 2-4 allows the smiley as a value, despite making a slider
                    bool =  defaultView.getComputedStyle &&
                    defaultView.getComputedStyle($input, null).WebkitAppearance !== 'textfield' &&
                    // Mobile android web browser has false positive, so must
                    // check the height to see if the widget is actually there.
                    ($input.offsetHeight !== 0);

                    docElement.removeChild($input);

                } else if ( /^(search|tel)$/.test(inputElemType) ){
                // Spec doesnt define any special parsing or detectable UI
                //   behaviors so we pass these through as true

                // Interestingly, opera fails the earlier test, so it doesn't
                //  even make it here.

                } else if ( /^(url|email)$/.test(inputElemType) ) {
                    // Real url and email support comes with prebaked validation.
                    bool = $input.checkValidity && $input.checkValidity() === false;

                } else if ( /^color$/.test(inputElemType) ) {
                    // chuck into DOM and force reflow for Opera bug in 11.00
                    // github.com/Modernizr/Modernizr/issues#issue/159
                    docElement.appendChild($input);
                    docElement.offsetWidth;
                    bool = $input.value != smile;
                    docElement.removeChild($input);

                } else {
                    // If the upgraded input compontent rejects the :) text, we got a winner
                    bool = $input.value != smile;
                }
            }

            o[ props[i] ] = !!bool;
        }
        return o;
    })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
    
    /**
     * Test for draggable, drag and drop
     * From Modernizer 1.7
     * http://www.modernizr.com
     * Copyright (c) 2009-2011
     * http://www.modernizr.com/license/
     */
    $.support.draggable = (function() {
        return 'draggable' in $div; 
    });
    
    $.fn.drag = function() {
        if (!$.support.draggable) {            
            $(this).draggable({
                axis : $(this).data('axis')
            });
        } else {
            $(this).bind('dragstart', function(e) {
                // store the ID of the element, and collect it on the drop later on
                e.dataTransfer.setData('Text', this.id);
            });
        }

        return this;
    };
    
    $.fn.range = function() {
        if (!$.support.input.type.range) {                        
            var self = this;
            
            var step    = $(this).attr('step') || 1;
            var min     = $(this).attr('min');
            var max     = $(this).attr('max');
            
            if (typeof min == 'undefined') {
                min = 0;
            }
            
            if (typeof max == 'undefined') {
                max = 100;
            }

            var slider = $('<div />').attr({
                id      : $(this).attr('id'),
                'class' : $(this).attr('class'),
                name    : $(this).attr('name')
            }).slider({
                min     : parseInt(min),
                max     : parseInt(max),
                step    : parseInt(step),
                value   : $(this).val(),
                slide   : function(e, ui) {
                    $(self).val(ui.value).change();
                },
                start   : function() {
                    $(self).mousedown();
                },
                stop    : function() {
                    $(self).mouseup();
                }
            }).insertBefore(this);
            
            $(this).hide();
            
            return slider;
        }

        return this;
    };
    
    $.fn.number = function() {
        if (!$.support.input.type.number) {
            return this.change( function() {
                var v = parseFloat($(this).val()), pv = $(this).attr('placeholder');

                if (typeof pv == 'undefined') {
                    pv = '';
                }

                if ($.isNumeric(v) === false) {
                    $(this).val(pv);
                }
            });
        }

        return this;
    };

    $.fn.placeholder = function() {
        // check for placeholder and create
        if (!$.support.input.attr.placeholder) {
            // create javascript placeholder
            return this.each( function() {
                var v = $(this).attr('placeholder'), iv = $(this).val();

                if (iv === '' || iv == v) {
                    $(this).addClass('placeholder').val(v).click( function() {
                        if ($(this).hasClass('placeholder')) {
                            $(this).val('').removeClass('placeholder');
                        }
                    }).blur( function() {
                        iv = $(this).val();
                        if (iv === '' || iv == v) {
                            $(this).addClass('placeholder').val(v);
                        }
                    });
                }
                $(this).change( function() {
                    iv = $(this).val();
                    if (iv === '') {
                        $(this).addClass('placeholder').val(v);
                    } else {
                        $(this).removeClass('placeholder');
                    }
                });

            });

        }

        return this;
    };

    $.fn.min = function() {
        if (!$.support.input.attr.min) {
            return this.change( function() {
                var m = parseFloat($(this).attr('min')), v = parseFloat($(this).val()), pv = $(this).attr('placeholder');

                if (pv != 'undefined' && pv == v) {
                    return this;
                }

                if (v < m) {
                    $(this).val(m);
                }
            });

        }

        return this;
    };

    $.fn.max = function() {
        if (!$.support.input.attr.max) {
            return this.change( function() {
                var m = parseFloat($(this).attr('max')), v = parseFloat($(this).val()), pv = $(this).attr('placeholder');

                if (pv != 'undefined' && pv == v) {
                    return this;
                }

                if (v > m) {
                    $(this).val(m);
                }
            });

        }

        return this;
    };

    $.fn.pattern = function() {
        //if (!$.support.input.attr.pattern) {
            this.change( function() {
                var pattern = $(this).attr('pattern'), v = $(this).val(), pv = $(this).attr('placeholder');

                if (pv != 'undefined' && pv == v) {
                    return this;
                }

                if (!new RegExp('^(?:' + pattern + ')$').test(v)) {
                    var n = new RegExp('(' + pattern + ')').exec(v);                   
                    if (n) {
                        $(this).val(n[0]);
                    }
                }
            });

        //}

        return this;
    };

})(jQuery);