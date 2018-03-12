/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2018 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function ($) {

	var XHTMLXtrasDialog = {
		settings: {},

		init: function () {
			var ed = tinyMCEPopup.editor,
				se = ed.selection,
				n = se.getNode(),
				element = tinyMCEPopup.getWindowArg('element');

			// get an element selection
			if (element) {
				n = ed.dom.getParent(n, element);
			}

			Wf.init();

			if (n) {
				// remove all data-mediabox- attributes
				var i, attrs = n.attributes, attribs = {};

				// map all attributes
				for (i = attrs.length - 1; i >= 0; i--) {
					var name = attrs[i].name, value = ed.dom.getAttrib(n, name);

					// skip internal
					if (value !== "" && name.indexOf('mce-') === -1) {
						attribs[name] = value;
					}
				}

				var text = n.textContent || n.innerText || '';

				if (!se.isCollapsed() || text == se.getContent({format: 'text'})) {
					$(':input').each(function () {
						var k = $(this).attr('id');

						if (/on(click|dblclick)/.test(k)) {
							k = 'data-mce-' + k;
						}

						if (k === "classes" || k === "classlist") {
							k = "class";
						}

						var v = attribs[k];

						if (typeof v !== "undefined") {
							// clean up class
							if (k === "class") {
								v = v.replace(/mce-item-[a-z0-9]+/gi, '').replace(/\s+/, ' ');
								v = $.trim(v);
							}

							$(this).val(v);

							delete attribs[k];
						}
					});

					var x = 0;

					// process remaining attributes
					$.each(attribs, function (k, v) {
						if (v !== '') {

							try {
								v = decodeURIComponent(v);
							} catch (e) {}

							var n = $('.uk-repeatable').eq(0);

							if (x > 0) {
								$(n).clone(true).appendTo($(n).parent());
							}

							var elements = $('.uk-repeatable').eq(x).find('input, select');

							$(elements).eq(0).val(k);
							$(elements).eq(1).val(v);
						}
						x++;
					});

					$('#insert').button('option', 'label', ed.getLang('update', 'Insert'));
				}
			}

			$('#remove').button({
				icons: {
					primary: 'uk-icon-minus-circle'
				}
			}).toggle(!!element);

			// hide HTML5 fields
			if (ed.settings.schema === 'html4' && ed.settings.validate === true) {
				$('input.html5').parents('.uk-form-row').hide();
			}

			// hide for non-form nodes
			if (!tinymce.is(n, ':input, form')) {
				$('input.form').parents('.uk-form-row').hide();
			}

			// hide for non-media nodes
			if (n.nodeName !== "IMG") {
				$('input.media').parents('.uk-form-row').hide();
			}
		},

		insert: function () {
			var ed = tinyMCEPopup.editor,
				se = ed.selection,
				n = se.getNode(),
				elm;

			tinyMCEPopup.restoreSelection();

			// get the element type (opener)
			var element = tinyMCEPopup.getWindowArg('element');

			var args = {};

			$(':input').not('#classlist-select, #classes, input[name]').each(function () {
				var k = $(this).attr('id'),
					v = $(this).val();

				if (/on(click|dblclick)/.test(k)) {
					k = 'data-mce-' + k;
				}

				args[k] = v;
			});

			// get custom attributes
			$('.uk-repeatable').each(function() {
				var elements = $('input, select', this);
				var key = $(elements).eq(0).val(),
					value = $(elements).eq(1).val();
	
				args[key] = value;
			});

			// get classes value
			var cls = $('#classes').val();

			// opened by an element button
			if (element) {
				if (n.nodeName.toLowerCase() == element) {
					elm = n;
				} else {
					elm = ed.dom.getParent(n, element);
				}

				ed.formatter.apply(element.toLowerCase(), args, elm);

				// apply classes
				ed.dom.addClass(elm, cls);

				// probably Attributes
			} else {
				var isTextSelection = se.getContent() == se.getContent({
					format: 'text'
				});

				// is a body or text selection
				if (n == ed.getBody() || isTextSelection) {
					args['class'] = cls;
					ed.formatter.apply('attributes', args);
					// attribute selection
				} else {
					ed.dom.setAttribs(n, args);
					// apply classes
					ed.dom.addClass(n, cls);
				}
			}

			ed.undoManager.add();

			tinyMCEPopup.close();
		},

		remove: function () {
			var ed = tinyMCEPopup.editor;

			var element = tinyMCEPopup.getWindowArg('element');

			if (element) {
				ed.formatter.remove(element);
				ed.undoManager.add();
			}

			tinyMCEPopup.close();
		},

		insertDateTime: function (id) {
			document.getElementById(id).value = this.getDateTime(new Date(), "%Y-%m-%dT%H:%M:%S");
		},

		getDateTime: function (d, fmt) {
			fmt = fmt.replace("%D", "%m/%d/%y");
			fmt = fmt.replace("%r", "%I:%M:%S %p");
			fmt = fmt.replace("%Y", "" + d.getFullYear());
			fmt = fmt.replace("%y", "" + d.getYear());
			fmt = fmt.replace("%m", this.addZeros(d.getMonth() + 1, 2));
			fmt = fmt.replace("%d", this.addZeros(d.getDate(), 2));
			fmt = fmt.replace("%H", "" + this.addZeros(d.getHours(), 2));
			fmt = fmt.replace("%M", "" + this.addZeros(d.getMinutes(), 2));
			fmt = fmt.replace("%S", "" + this.addZeros(d.getSeconds(), 2));
			fmt = fmt.replace("%I", "" + ((d.getHours() + 11) % 12 + 1));
			fmt = fmt.replace("%p", "" + (d.getHours() < 12 ? "AM" : "PM"));
			fmt = fmt.replace("%%", "%");

			return fmt;
		},

		addZeros: function (value, len) {
			var i;
			value = "" + value;

			if (value.length < len) {
				for (i = 0; i < (len - value.length); i++)
					value = "0" + value;
			}

			return value;
		}

	};

	window.XHTMLXtrasDialog = XHTMLXtrasDialog;

	tinyMCEPopup.onInit.add(XHTMLXtrasDialog.init, XHTMLXtrasDialog);
})(jQuery);