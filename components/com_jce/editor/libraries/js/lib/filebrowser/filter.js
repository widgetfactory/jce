/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*jshint smarttabs:true, undef:true, latedef:true, curly:true, bitwise:true, camelcase:true */
/*globals $code */
(function ($) {

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

	// http://stackoverflow.com/a/6969486
	function escapeRegExChars(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
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

		return function () {
			var context = this,
				args = arguments,
				later, callNow;

			later = function () {
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

	$.fn.listfilter = function (options) {

		options = $.extend({
			list: null,
			items: null,
			clear: null,
			sort: null,
			hide: false,
			filter: null
		}, options);

		var el = this;

		$(options.clear).on('click.listfilter', function (e) {
			reset();

			$(el).val('');

			$(el).trigger('listfilter:clear', [e]);
		});

		// create filter event
		$(el).on('listfilter:filter', function (e, s) {
			filter(s);
		});

		// Debounce keyup function
		var keyup = debounce(function (e) {
			if (e.keyCode && specialKeyCodeMap[e.keyCode]) {
				return;
			}

			var v = $(el).val();

			// wait for input to update
			defer(function () {
				if (v === "") {
					$(options.clear).trigger('click.listfilter');
					return;
				}

				// cancel events
				e.stopImmediatePropagation();
				
				// at least 3 characters required
				if (v.length < 3) {
					return;
				}

				$(el).trigger('listfilter:find', [v]);
			});
		}, 500);

		// add keyup and change events to trigger filter
		$(el).on('keyup.listfilter paste.listfilter cut.listfilter', keyup);

		function toUnicode(s) {
			function _toUnicode(c) {
                c = c.toString(16).toUpperCase();

                while (c.length < 4) {
                    c = '0' + c;
                }

                return '\\u' + c;
            }
			
			var str = '';

			for (var i = 0, ln = s.length; i < ln; i++) {
				var ch = s[i];
				// only process on possible restricted characters or utf-8 letters/numbers
				if (/[^\w\.\-\s \/]/i.test(ch)) {
					ch = '\\u' + ch.charCodeAt(0);
				}
				str += ch;
			}

			return str;
		}

		function filter(s) {
			var x = [],
				f, v;

			// filter by extension
			if (s.charAt(0) === '.') {
				v = s.substr(1);
				matcher = new RegExp('\.(' + escapeRegExChars(v) + '[a-z0-9]*)$', "i");
			} else {
				s = toUnicode(s);
				matcher = new RegExp(escapeRegExChars(s), "ui");
			}

			if (/[\u0000-\u1FFF\.\-\s ]/i.test(s)) {
				$(options.selector, options.list).each(function () {
					var match = false;

					var title = $(this).attr('title');

					// convert to unicode
					title = toUnicode(title);

					// check for match
					match = matcher.test(title);

					if (match) {
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

			var pos = $(el).position() || {top: 0};
			var top = $(options.list).scrollTop();

			$(options.list).css('overflow', 'hidden').animate({
				scrollTop: pos.top + top
			}, 1000, function () {
				$(options.list).css('overflow', 'auto');
			});
		}

		function sort(x) {
			var a = [];

			$(options.selector, options.list).each(function () {
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