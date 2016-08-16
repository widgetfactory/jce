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

	$.fn.combobox = function(options) {
		options = $.extend({
			label: 'Add Value'
		}, options);

		return this.each(function() {
			var element = this,
				input = document.createElement('input');

			$(this).removeClass('mceEditableSelect').addClass('editable');

			$('<i role="button" class="editable-edit ui-button ui-icon ui-icon-pencil" title="' + options.label + '"></i>').insertAfter(this).click(function(e) {
				if ($(this).hasClass('disabled'))
					return;

				onChangeEditableSelect(e);
			});

			if ($(this).is(':disabled')) {
				$(this).next('span.editable-edit').addClass('disabled');
			}

			function onChangeEditableSelect(e) {
				$(input).attr('type', 'text').addClass('editable-input').val($(element).val()).insertBefore($(element));

				$(input).blur(function() {
					onBlurEditableSelectInput();
				}).keydown(function(e) {
					onKeyDown(e);
				});

				$(element).hide();

				input.focus();
			}

			function onBlurEditableSelectInput() {
				var o, found, v = $(input).val();

				if (v != '') {
					$('option:selected', element).prop('selected', false);

					// select if value exists
					if ($('option[value="' + v + '"]', element).is('option')) {
						$(element).val(v).change();
					} else {
						// new value
						if (!found) {
							// check pattern
							var pattern = $(element).data('pattern');

							if (pattern && !new RegExp('^(?:' + pattern + ')$').test(v)) {
								var n = new RegExp('(' + pattern + ')').exec(v);
								v = n ? n[0] : '';
							}

							// add new value if result
							if (v != '') {
								// value exists, select
								if ($('option[value="' + v + '"]', element).length == 0) {
									$(element).append(new Option(v, v));
								}
								$(element).val(v).change();
							}
						}
					}

					$(element).trigger('combobox:change');
				} else {
					$(element).val('') || $('option:first', element).attr('selected', 'selected');
				}

				$(element).show();
				$(input).remove();
			}

			function onKeyDown(e) {
				if (e.which == 13 || e.which == 27) {
					onBlurEditableSelectInput();
				}
			}
		});
	};
})(jQuery);
