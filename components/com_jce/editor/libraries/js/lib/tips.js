/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2018 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function($) {

    $.support.canvas = false; //!!document.createElement('canvas').getContext;

    // http://www.abeautifulsite.net/blog/2011/11/detecting-mobile-devices-with-javascript/
    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };

    $.fn.tips = function(options) {
        options = $.extend({
            speed: 150,
            position: 'top center',
            className: '',
            offsets: {
                'x': 16,
                'y': 16
            },
            width: 200,
            fixed: true,
            parent: 'body',
            trigger: 'hover',
            disabled: ':disabled, .disabled'
        }, options);
        
        /**
         * Initialise the tooltip
         * @param {Object} elements
         * @param {Object} options
         */
        function init(element) {

            // cancel on drag/drop/sortable
            if ($(element).hasClass('wf-tooltip-cancel-ondrag')) {
                cancelOnDrag(element);
            }

            $(element).click(function(e) {
                e.preventDefault();

                if (options.trigger == 'click' && $(this).is(options.disabled)) {
                    return;
                }

                // don't pin tip if a link or parent of a link
                if (this.nodeName == 'A' || $('a', this).length || $(this).hasClass('wf-tooltip-cancel-ondrag')) {
                    return;
                }

                if (options.trigger == 'click') {
                    if ($('.uk-tooltip').is(':visible')) {
                        return end();
                    }

                    start(e, element);
                }

                if ($('.uk-tooltip').hasClass('uk-tooltip-sticky')) {
                    unpin();
                } else {
                    pin(element);
                }
            });

            $(element).on('tooltip:close', function() {
                return end(element);
            });

            if (options.trigger == 'hover') {
                $(element).hover(
                    function(e) {
                        
                        if ($('.uk-tooltip').hasClass('uk-tooltip-sticky') || $(this).hasClass('uk-tooltip-nohover')) {
                            return;
                        }

                        return start(e, element);
                    },
                    function(e) {
                        if ($('.uk-tooltip').hasClass('uk-tooltip-sticky') || $(this).hasClass('uk-tooltip-nohover')) {
                            return;
                        }
                        return end(element);
                    }
                );
            }
        }

        /**
         * Create the tooltip div
         */
        function createTips() {
            var $tips = $('.uk-tooltip');

            if (!$tips.get(0)) {
                $tips = $('<div class="uk-tooltip" role="tooltip" aria-hidden="true">' +
                    '<span class="close uk-icon uk-icon-close" title="Close">&times;</span>' +
                    '<div class="uk-tooltip-inner"></div>' +
                    '<div class="arrow"></div>' +
                    '</div>').appendTo(options.parent);

                $('.uk-icon-close', $tips).click(function() {
                    end();
                }).hide();
            }

            $tips.addClass(options.className);
        }

        /**
         * Show the tooltip and build the tooltip text
         * @param {Object} e  Event
         * @param {Object} el Target Element
         */
        function start(e, element) {
            // Create tooltip if it doesn't exist
            createTips();

            var $tips = $('.uk-tooltip');

            if ($(element).hasClass('hasPopover')) {
                $tips.addClass('popover');
            }

            // store element
            $tips.data('source', element);

            if (options.content) {
                var h = options.content;
            } else {
                // Get tooltip text from title
                var text = $(element).attr('title') || '',
                    title = '';

                // Split tooltip text ie: title::text
                if (/::/.test(text)) {
                    var parts = text.split('::');
                    title = $.trim(parts[0]);
                    text = $.trim(parts[1]);
                }

                title = title || $(element).attr('title');

                text = $(element).data('content') || text;

                // Store original title and remove
                $(element).data('title', $(element).attr('title')).attr('title', '');

                // add aria description
                $(element).attr('aria-describedby', 'uk-tooltip');

                var h = '';
                
                // Set tooltip title html
                if (title) {
                    h += '<h4>' + title + '</h4>';
                }

                // Set tooltip text html
                if (text) {
                    h += '<div>' + text + '</div>';
                }
            }

            // Set tooltip html
            $('.uk-tooltip-inner', $tips).html(h);

            if ($(element).hasClass('hasPopover')) {
                $('.uk-tooltip-inner > h4', $tips).addClass('popover-title popover-header');
                $('.uk-tooltip-inner > div', $tips).addClass('popover-content popover-body');
            }

            // Set visible
            $tips.show().addClass('in').attr('aria-hidden', 'false');

            locate(e, element);

            $(element).trigger('tooltip:show');

            window.setTimeout(function() {
                $tips.css('visibility', 'visible');
            }, 1);
        }

        function close() {
            return end();
        }

        /**
         * Fade Out and hide the tooltip
         * Restore the original element title
         * @param {Object} el Element
         */
        function end(element) {
            var $tips = $('.uk-tooltip'),
                element = $tips.data('source') || element;

            if ($(element).data('title')) {
                // Restore title
                $(element).attr('title', $(element).data('title'));
            }

            // remove aria
            $(element).removeAttr('aria-describedby');
            // Fade out tooltip and hide
            $tips.css('visibility', 'hidden').attr('aria-hidden', 'true').hide();

            // reset classes
            $('.uk-tooltip').attr('class', 'uk-tooltip').removeClass('in');
            // empty tooltip
            $('.uk-tooltip-inner').empty();

            $(element).trigger('tooltip:hide');

            unpin();
        }

        function cancelOnDrag(element) {
            $(element).bind('mousedown', function() {
                $(this).addClass('nohover');
                // hide tooltip
                end();

                // Store original title and remove
                $(this).data('title', $(this).attr('title')).attr('title', '');

            }).bind('mouseup', function() {
                $(this).removeClass('nohover');

                // Restore title
                $(this).attr('title', $(this).data('title'));
            });
        }

        function pin(element) {
            $('.uk-tooltip').addClass('uk-tooltip-sticky');
            $('.uk-icon-close', '.uk-tooltip').show();

            // add blur handler
            $(window).on('click.tooltip-blur', function(e) {
                var el = $(element).get(0),
                    n = e.target;

                if (n == el || (el.nodeName == 'LABEL' && $(el).attr('for') && n == $('#' + $(el).attr('for')).get(0)) || n == $('.uk-tooltip').get(0)) {
                    return;
                }

                if ($(n).parents('.uk-tooltip').length === 0) {
                    end();
                }
            });
        }

        function unpin() {
            $('.uk-tooltip').removeClass('uk-tooltip-sticky');
            $('.uk-icon-close', '.uk-tooltip').hide();

            $(window).off('click.tooltip-blur');
        }

        /**
         * Position the tooltip
         * @param {Object} e Event trigger
         */
        function locate(e, element) {
            createTips();

            var $tips = $('.uk-tooltip');
            var o = options.offsets;

            var pos = $(e.target).offset(),
                parent = $tips.parent().position();

            pos.left = pos.left - parent.left;
            pos.top = pos.top - parent.top;

            var tip = { "width": $tips.outerWidth(), "height": $tips.outerHeight() };
            pos = $.extend(pos, { "width": $(e.target).outerWidth(), "height": $(e.target).outerHeight() });

            var position = options.position;
            var scrollTop = $(document).scrollTop();

            // Switch from bottom to top
            if ((pos.top - tip.height) < 0 || pos.top < (scrollTop + tip.height + o.y)) {
                position = position.replace(/(top|center)\s+/, 'bottom ');
            } else {
                position = position.replace(/(bottom|center)\s+/, 'top ');
            }

            if ((pos.left + tip.width) > $(window).width()) {
                position = position.replace('right', 'left');
            } else {
                position = position.replace('left', 'right');
            }

            var style = {
                "top center": {
                    "top": Math.max(pos.top - tip.height - o.y, 10),
                    "left": Math.max(pos.left + pos.width / 2 - tip.width / 2, 5)
                },
                "bottom center": {
                    "top": Math.max(pos.top + pos.height + o.y, 10),
                    "left": Math.max(pos.left + pos.width / 2 - tip.width / 2, 5)
                },
                "center right": {
                    "top": Math.max(pos.top - tip.height / 2 + pos.height / 2, 5),
                    "left": Math.max(pos.left + pos.width, 10)
                },
                "center left": {
                    "top": Math.max(pos.top - tip.height / 2 + pos.height / 2, 5),
                    "left": Math.max(pos.left - tip.width, 10)
                },
                "bottom right": {
                    "top": Math.max(pos.top - tip.height + o.y, 5),
                    "left": Math.max(pos.left + pos.width, 10)
                },
                "bottom left": {
                    "top": Math.max(pos.top - tip.height + pos.height + o.y, 5),
                    "left": Math.max(pos.left - tip.width, 10)
                },
                "top right": {
                    "top": Math.max(pos.top - tip.height - o.y, 10),
                    "left": Math.max(pos.left + pos.width, 10)
                },
                "top left": {
                    "top": Math.max(pos.top - tip.height - o.y, 10),
                    "left": Math.max(pos.left - tip.width, 10)
                }
            };

            $.each(position.split(' '), function(i, s) {
                $tips.addClass(s).addClass('uk-tooltip-' + s);
            });

            $tips.css(style[position]);
        }

        return this.each(function() {
            init(this);
        });
    };

})(jQuery);