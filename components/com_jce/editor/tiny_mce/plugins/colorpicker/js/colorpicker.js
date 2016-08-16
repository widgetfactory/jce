//tinyMCEPopup.requireLangPack();

var ColorPicker = {
	settings: {},
	init: function() {
		var self = this,
			ed = tinyMCEPopup.editor,
			color = tinyMCEPopup.getWindowArg('input_color') || '#FFFFFF',
			doc = ed.getDoc();

		// get stylesheets from editor
		var stylesheets = [];

		if (doc.styleSheets.length) {
			$.each(doc.styleSheets, function(i, s) {
				if (s.href && s.href.indexOf('tiny_mce') == -1) {
					stylesheets.push(s);
				}
			});
		}

		$('#tmp_color').val(color).colorpicker($.extend(this.settings, {
			dialog: true,
			stylesheets: stylesheets,
			custom_colors: ed.getParam('colorpicker_custom_colors')
		})).on('colorpicker:insert', function() {
			return ColorPicker.insert();
		}).on('colorpicker:close', function() {
			return tinyMCEPopup.close();
		});

		$('button#insert').button({
			icons: {
				primary: 'ui-icon-check'
			}
		});

		// show body
		$('#jce').css('display', 'block');

	},
	/**
	 * Insert selected colorpicker value
	 */
	insert: function() {
		var color = $("#colorpicker_color").val(),
			f = tinyMCEPopup.getWindowArg('func');


		if (color) {
			color = '#' + color;
		}

		tinyMCEPopup.restoreSelection();

		if (f) {
			f(color);
		}

		tinyMCEPopup.close();
	}
};
tinyMCEPopup.onInit.add(ColorPicker.init, ColorPicker);
