/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2013 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*jshint smarttabs:true, undef:true, latedef:true, curly:true, bitwise:true, camelcase:true */
/*globals $code */
(function($) {

	var specialKeyCodeMap = {
		9: 'tab',
		17: 'ctrl',
		18: 'alt',
		27: 'esc',
		37: 'left',
		39: 'right',
		13: 'enter',
		38: 'up',
		40: 'down',
		91: 'cmd'
	};

	function defer(fn) {
		setTimeout(fn, 0);
	}

	/**
	 * Debounce a function.
	 * https://github.com/twitter/typeahead.js
	 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
	 * @param {function} func
	 * @param {integer} wait
	 * @param {boolean} immediate
	 * @return {void}
	 */
	function debounce(func, wait, immediate) {

		var timeout, result;

		return function() {
			var context = this,
				args = arguments,
				later, callNow;

			later = function() {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
				}
			};

			callNow = immediate && !timeout;

			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if (callNow) {
				result = func.apply(context, args);
			}

			return result;
		};
	}

	$.fn.listfilter = function(options) {

		options = $.extend({
			list: null,
			items: null,
			clear: null,
			sort: null,
			hide: false,
			filter: null
		}, options);

		var el = this,
			x = [];

		$(options.clear).on('click.listfilter', function(e) {
			reset();

			$(el).val('');
			x = [];

			$(el).trigger('listfilter:found', [e, x]);
		});

		// create filter event
		$(el).on('listfilter:filter', function(e, s) {
      filter(s);
		});

		// Debounce keyup function
		var keyup = debounce(function(e) {
			if (e.keyCode && specialKeyCodeMap[e.keyCode]) {
				return;
			}

			var v = $(el).val();

			// wait for input to update
			defer(function() {
				if (v === "") {
					$(options.clear).trigger('click.listfilter');
					return;
				}

				// cancel events
				e.stopImmediatePropagation();

				if (v !== ".") {
					$(el).trigger('listfilter:find', [v]);
				}
			});
		}, 300);

		// add keyup and change events to trigger filter
		$(el).on('keyup.listfilter paste.listfilter cut.listfilter', keyup);

		function filter(s) {
			var x = [],
				f, v;

			if (/[a-z0-9_\.-]/i.test(s)) {
				$(options.selector, options.list).each(function() {
					var title = $(this).attr('title');
					// get "basename" from title
					var name = title.replace(/^.*[\/\\]/g, '');

					// filter by extension
					if (s.charAt(0) === '.') {
						v = s.substr(1);
						f = name.substr(name.lastIndexOf('.') + 1);
					} else {
						f = name.substring(0, s.length);
						v = s;
					}

					if (f.toLowerCase() === v.toLowerCase()) {
						if ($.inArray(this, x) === -1) {
							x.push(this);
						}
					} else {
						var i = $.inArray(this, x);
						if (i !== -1) {
							x.splice(i, 1);
						}
					}
				});
			} else {
				x = [];
			}

			if (x && x.length) {
        $(options.selector, options.list).show().not(x).hide();

				scroll(x[0]);

			} else {
				reset();
			}

			$(el).trigger('listfilter:found', [null, x]);
		}

		function scroll(el) {

			var pos = $(el).position();
			var top = $(options.list).scrollTop();

			$(options.list).css('overflow', 'hidden').animate({
				scrollTop: pos.top + top
			}, 1000, function() {
				$(options.list).css('overflow', 'auto');
			});
		}

		function sort(x) {
			var a = [];

			$(options.selector, options.list).each(function() {
				if ($.inArray(this, x) != -1) {
					a.push(this);
				}
			});
			return a;
		}

		function reset() {
			$(options.selector, options.list).show();
			scroll($(options.selector, options.list).first());
		}

		return this;
	};

})(jQuery);
