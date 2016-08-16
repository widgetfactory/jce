/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
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

	$.fn.tooltip = function(options) {
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
				if (options.trigger == 'click' && $(this).is(options.disabled)) {
					return;
				}

				// don't pin tip if a link or parent of a link
				if (this.nodeName == 'A' || $('a', this).length || $(this).hasClass('wf-tooltip-cancel-ondrag')) {
					return;
				}

				if (options.trigger == 'click') {
					if ($('.ui-tooltip').is(':visible')) {
						return end();
					}

					start(e, element);
				}

				if ($('.ui-tooltip').hasClass('ui-tooltip-sticky')) {
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
						if ($('.ui-tooltip').hasClass('ui-tooltip-sticky') || $(this).hasClass('ui-tooltip-nohover')) {
							return;
						}
						return start(e, element);
					},
					function(e) {
						if ($('.ui-tooltip').hasClass('ui-tooltip-sticky') || $(this).hasClass('ui-tooltip-nohover')) {
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
			var $tips = $('.ui-tooltip');

			if (!$tips.get(0)) {
				$tips = $('<div class="tooltip ui-tooltip" role="tooltip" aria-hidden="true">' +
					'<span class="close ui-icon ui-icon-close" title="Close">&times;</span>' +
					'<div class="tooltip-arrow"></div>' +
					'<div class="tooltip-inner ui-tooltip-inner"></div>' +
					'</div>').appendTo(options.parent);

				$('.ui-icon-close', $tips).click(function() {
					end();
				}).hide();
			}

			$tips.addClass('tooltip').addClass(options.className);
		}

		/**
		 * Show the tooltip and build the tooltip text
		 * @param {Object} e  Event
		 * @param {Object} el Target Element
		 */
		function start(e, element) {
			// Create tooltip if it doesn't exist
			createTips();

			var $tips = $('.ui-tooltip');
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
				// Store original title and remove
				$(element).data('title', $(element).attr('title')).attr('title', '');
				// add aria description
				$(element).attr('aria-describedby', 'ui-tooltip');

				var h = '';
				// Set tooltip title html
				if (title) {
					h += '<h4>' + title + '</h4>';
				}
				// Set tooltip text html
				if (text) {
					h += '<p>' + text + '</p>';
				}
			}

			// Set tooltip html
			$('.ui-tooltip-inner', $tips).html(h);

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
			var $tips = $('.ui-tooltip'),
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
			$('.ui-tooltip').attr('class', 'ui-tooltip').removeClass('in');
			// empty tooltip
			$('.ui-tooltip-inner').empty();

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
			$('.ui-tooltip').addClass('ui-tooltip-sticky');
			$('.ui-icon-close', '.ui-tooltip').show();

			// add blur handler
			$(window).on('click.tooltip-blur', function(e) {
				var el = $(element).get(0),
					n = e.target;

				if (n == el || (el.nodeName == 'LABEL' && $(el).attr('for') && n == $('#' + $(el).attr('for')).get(0)) || n == $('.ui-tooltip').get(0)) {
					return;
				}

				if ($(n).parents('.ui-tooltip').length === 0) {
					end();
				}
			});
		}

		function unpin() {
			$('.ui-tooltip').removeClass('ui-tooltip-sticky');
			$('.ui-icon-close', '.ui-tooltip').hide();

			$(window).off('click.tooltip-blur');
		}

		/**
		 * Position the tooltip
		 * @param {Object} e Event trigger
		 */
		function locate(e, element) {
			createTips();

			var $tips = $('.ui-tooltip');
			var o = options.offsets;

			var pos = $(e.target).offset();

			if ($tips.parent().get(0) !== document.body) {
					pos = $(e.target).position();
			}

			var tip = {"width" : $tips.outerWidth(), "height" : $tips.outerHeight()};
			pos = $.extend(pos, {"width" : $(e.target).outerWidth(), "height" : $(e.target).outerHeight()});

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
				"top center" : {
					"top" : pos.top - tip.height - o.y,
					"left": Math.max(pos.left + pos.width / 2 - tip.width / 2, 5)
				},
				"bottom center"	: {
					"top" : pos.top + pos.height + o.y,
					"left": Math.max(pos.left + pos.width / 2 - tip.width / 2, 5)
				},
				"center right"	: {
					"top" : Math.max(pos.top - tip.height / 2 + pos.height / 2, 5),
					"left": pos.left + pos.width
				},
				"center left"	: {
					"top" : Math.max(pos.top - tip.height / 2 + pos.height / 2, 5),
					"left": pos.left - tip.width
				},
				"bottom right"	: {
					"top" : Math.max(pos.top - tip.height + o.y, 5),
					"left": pos.left + pos.width
				},
				"bottom left"	: {
					"top" : Math.max(pos.top - tip.height + pos.height + o.y, 5),
					"left": pos.left - tip.width
				},
				"top right"	: {
					"top" : pos.top - tip.height - o.y,
					"left": pos.left + pos.width
				},
				"top left"	: {
					"top" : pos.top - tip.height - o.y,
					"left": pos.left - tip.width
				}
			};

			$.each(position.split(' '), function(i, s) {
					$tips.addClass(s).addClass('ui-tooltip-' + s);
			});

			$tips.css(style[position]);
		}

		return this.each(function() {
			init(this);
		});
	};

	$.fn.tips = $.fn.tooltip;

})(jQuery);
