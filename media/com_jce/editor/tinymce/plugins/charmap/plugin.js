/**
 * @package     JCE
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
	var each = tinymce.each, Entities = tinymce.html.Entities, DOM = tinymce.DOM;

	function getDefaultCharMap() {
		return [
			['160', 'no-break space'],
			['173', 'soft hyphen'],
			['34', 'quotation mark'],
			// finance
			['162', 'cent sign'],
			['8364', 'euro sign'],
			['163', 'pound sign'],
			['165', 'yen sign'],
			// signs
			['169', 'copyright sign'],
			['174', 'registered sign'],
			['8482', 'trade mark sign'],
			['8240', 'per mille sign'],
			['181', 'micro sign'],
			['183', 'middle dot'],
			['8226', 'bullet'],
			['8230', 'three dot leader'],
			['8242', 'minutes / feet'],
			['8243', 'seconds / inches'],
			['167', 'section sign'],
			['182', 'paragraph sign'],
			['223', 'sharp s / ess-zed'],
			// quotations
			['8249', 'single left-pointing angle quotation mark'],
			['8250', 'single right-pointing angle quotation mark'],
			['171', 'left pointing guillemet'],
			['187', 'right pointing guillemet'],
			['8216', 'left single quotation mark'],
			['8217', 'right single quotation mark'],
			['8220', 'left double quotation mark'],
			['8221', 'right double quotation mark'],
			['8218', 'single low-9 quotation mark'],
			['8222', 'double low-9 quotation mark'],
			['60', 'less-than sign'],
			['62', 'greater-than sign'],
			['8804', 'less-than or equal to'],
			['8805', 'greater-than or equal to'],
			['8211', 'en dash'],
			['8212', 'em dash'],
			['175', 'macron'],
			['8254', 'overline'],
			['164', 'currency sign'],
			['166', 'broken bar'],
			['168', 'diaeresis'],
			['161', 'inverted exclamation mark'],
			['191', 'turned question mark'],
			['710', 'circumflex accent'],
			['732', 'small tilde'],
			['176', 'degree sign'],
			['8722', 'minus sign'],
			['177', 'plus-minus sign'],
			['247', 'division sign'],
			['8260', 'fraction slash'],
			['215', 'multiplication sign'],
			['185', 'superscript one'],
			['178', 'superscript two'],
			['179', 'superscript three'],
			['188', 'fraction one quarter'],
			['189', 'fraction one half'],
			['190', 'fraction three quarters'],
			// math / logical
			['402', 'function / florin'],
			['8747', 'integral'],
			['8721', 'n-ary sumation'],
			['8734', 'infinity'],
			['8730', 'square root'],
			['8764', 'similar to'],
			['8773', 'approximately equal to'],
			['8776', 'almost equal to'],
			['8800', 'not equal to'],
			['8801', 'identical to'],
			['8712', 'element of'],
			['8713', 'not an element of'],
			['8715', 'contains as member'],
			['8719', 'n-ary product'],
			['8743', 'logical and'],
			['8744', 'logical or'],
			['172', 'not sign'],
			['8745', 'intersection'],
			['8746', 'union'],
			['8706', 'partial differential'],
			['8704', 'for all'],
			['8707', 'there exists'],
			['8709', 'diameter'],
			['8711', 'backward difference'],
			['8727', 'asterisk operator'],
			['8733', 'proportional to'],
			['8736', 'angle'],
			// undefined
			['180', 'acute accent'],
			['184', 'cedilla'],
			['170', 'feminine ordinal indicator'],
			['186', 'masculine ordinal indicator'],
			['8224', 'dagger'],
			['8225', 'double dagger'],
			// alphabetical special chars
			['192', 'A - grave'],
			['193', 'A - acute'],
			['194', 'A - circumflex'],
			['195', 'A - tilde'],
			['196', 'A - diaeresis'],
			['197', 'A - ring above'],
			['256', 'A - macron'],
			['198', 'ligature AE'],
			['199', 'C - cedilla'],
			['200', 'E - grave'],
			['201', 'E - acute'],
			['202', 'E - circumflex'],
			['203', 'E - diaeresis'],
			['274', 'E - macron'],
			['204', 'I - grave'],
			['205', 'I - acute'],
			['206', 'I - circumflex'],
			['207', 'I - diaeresis'],
			['298', 'I - macron'],
			['208', 'ETH'],
			['209', 'N - tilde'],
			['210', 'O - grave'],
			['211', 'O - acute'],
			['212', 'O - circumflex'],
			['213', 'O - tilde'],
			['214', 'O - diaeresis'],
			['216', 'O - slash'],
			['332', 'O - macron'],
			['338', 'ligature OE'],
			['352', 'S - caron'],
			['217', 'U - grave'],
			['218', 'U - acute'],
			['219', 'U - circumflex'],
			['220', 'U - diaeresis'],
			['362', 'U - macron'],
			['221', 'Y - acute'],
			['376', 'Y - diaeresis'],
			['562', 'Y - macron'],
			['222', 'THORN'],
			['224', 'a - grave'],
			['225', 'a - acute'],
			['226', 'a - circumflex'],
			['227', 'a - tilde'],
			['228', 'a - diaeresis'],
			['229', 'a - ring above'],
			['257', 'a - macron'],
			['230', 'ligature ae'],
			['231', 'c - cedilla'],
			['232', 'e - grave'],
			['233', 'e - acute'],
			['234', 'e - circumflex'],
			['235', 'e - diaeresis'],
			['275', 'e - macron'],
			['236', 'i - grave'],
			['237', 'i - acute'],
			['238', 'i - circumflex'],
			['239', 'i - diaeresis'],
			['299', 'i - macron'],
			['240', 'eth'],
			['241', 'n - tilde'],
			['242', 'o - grave'],
			['243', 'o - acute'],
			['244', 'o - circumflex'],
			['245', 'o - tilde'],
			['246', 'o - diaeresis'],
			['248', 'o slash'],
			['333', 'o macron'],
			['339', 'ligature oe'],
			['353', 's - caron'],
			['249', 'u - grave'],
			['250', 'u - acute'],
			['251', 'u - circumflex'],
			['252', 'u - diaeresis'],
			['363', 'u - macron'],
			['253', 'y - acute'],
			['254', 'thorn'],
			['255', 'y - diaeresis'],
			['563', 'y - macron'],
			['913', 'Alpha'],
			['914', 'Beta'],
			['915', 'Gamma'],
			['916', 'Delta'],
			['917', 'Epsilon'],
			['918', 'Zeta'],
			['919', 'Eta'],
			['920', 'Theta'],
			['921', 'Iota'],
			['922', 'Kappa'],
			['923', 'Lambda'],
			['924', 'Mu'],
			['925', 'Nu'],
			['926', 'Xi'],
			['927', 'Omicron'],
			['928', 'Pi'],
			['929', 'Rho'],
			['931', 'Sigma'],
			['932', 'Tau'],
			['933', 'Upsilon'],
			['934', 'Phi'],
			['935', 'Chi'],
			['936', 'Psi'],
			['937', 'Omega'],
			['945', 'alpha'],
			['946', 'beta'],
			['947', 'gamma'],
			['948', 'delta'],
			['949', 'epsilon'],
			['950', 'zeta'],
			['951', 'eta'],
			['952', 'theta'],
			['953', 'iota'],
			['954', 'kappa'],
			['955', 'lambda'],
			['956', 'mu'],
			['957', 'nu'],
			['958', 'xi'],
			['959', 'omicron'],
			['960', 'pi'],
			['961', 'rho'],
			['962', 'final sigma'],
			['963', 'sigma'],
			['964', 'tau'],
			['965', 'upsilon'],
			['966', 'phi'],
			['967', 'chi'],
			['968', 'psi'],
			['969', 'omega'],
			// symbols
			['8501', 'alef symbol'],
			['982', 'pi symbol'],
			['8476', 'real part symbol'],
			['978', 'upsilon - hook symbol'],
			['8472', 'Weierstrass p'],
			['8465', 'imaginary part'],
			// arrows
			['8592', 'leftwards arrow'],
			['8593', 'upwards arrow'],
			['8594', 'rightwards arrow'],
			['8595', 'downwards arrow'],
			['8596', 'left right arrow'],
			['8629', 'carriage return'],
			['8656', 'leftwards double arrow'],
			['8657', 'upwards double arrow'],
			['8658', 'rightwards double arrow'],
			['8659', 'downwards double arrow'],
			['8660', 'left right double arrow'],
			['8756', 'therefore'],
			['8834', 'subset of'],
			['8835', 'superset of'],
			['8836', 'not a subset of'],
			['8838', 'subset of or equal to'],
			['8839', 'superset of or equal to'],
			['8853', 'circled plus'],
			['8855', 'circled times'],
			['8869', 'perpendicular'],
			['8901', 'dot operator'],
			['8968', 'left ceiling'],
			['8969', 'right ceiling'],
			['8970', 'left floor'],
			['8971', 'right floor'],
			['9001', 'left-pointing angle bracket'],
			['9002', 'right-pointing angle bracket'],
			['9674', 'lozenge'],
			['9824', 'black spade suit'],
			['9827', 'black club suit'],
			['9829', 'black heart suit'],
			['9830', 'black diamond suit'],
			['8194', 'en space'],
			['8195', 'em space'],
			['8201', 'thin space'],
			['8204', 'zero width non-joiner'],
			['8205', 'zero width joiner'],
			['8206', 'left-to-right mark'],
			['8207', 'right-to-left mark']
		];
	}

	function isArray(arr) {
		return Array.isArray(arr);
	}

	function charmapFilter(charmap) {
		return charmap.filter(function (item) {
			return isArray(item) && item.length == 2;
		});
	}

	function getCharsFromSetting(settingValue) {
		if (isArray(settingValue)) {
			return [].concat(charmapFilter(settingValue));
		}

		if (tinymce.is(settingValue, 'object')) {
			var values = [];

			tinymce.each(settingValue, function (value, key) {
				// encode to numeric
				key = Entities.encodeNumeric(Entities.decode(key));
				// clean the key
				key = key.replace(/\D+/g, '');
				values.push([key, value]);
			});

			return values;
		}

		if (typeof settingValue == "function") {
			return settingValue();
		}

		return [];
	}

	tinymce.PluginManager.add('charmap', function (ed, url) {

		function extendCharMap(charmap) {
			var settings = ed.settings;

			if (settings.charmap) {
				charmap = getCharsFromSetting(settings.charmap);
			}

			if (settings.charmap_append) {
				return [].concat(charmap).concat(getCharsFromSetting(settings.charmap_append));
			}

			return charmap;
		}

		function getCharMap() {
			return extendCharMap(getDefaultCharMap());
		}

		function renderCharMapHTML() {
			var i;

			var html = '';

			var charmap = getCharMap();

			for (i = 0; i < charmap.length; i++) {
				if (i < charmap.length) {
					var chr = charmap[i], chrText = chr ? String.fromCharCode(parseInt(chr[0], 10)) : '&nbsp;';
					var named = Entities.encodeNamed(chrText), named = named.substring(1);

					html += (
						'<button title="' + chr[1] + '" data-numeric="' + chr[0] + '" data-named="' + named + '">' +
						chrText +
						'</button>'
					);
				} else {
					html += '';
				}
			}

			html += '';

			return html;
		}

		function previewChar(codeA, codeB, codeN) {
			var elmA = DOM.get(ed.id + '_charmapCodeA');
			var elmB = DOM.get(ed.id + '_charmapCodeB');
			var elmV = DOM.get(ed.id + '_charmapCodeV');
			var elmN = DOM.get(ed.id + '_charmapCodeN');

			if (codeA == '#160;') {
				elmV.innerHTML = '__';
			} else {
				elmV.innerHTML = '&' + codeA;
			}

			elmB.innerHTML = '&amp;' + codeA;
			elmA.innerHTML = '&amp;' + codeB;
			elmN.innerHTML = codeN;
		}

		var html = '' +
			'<div role="presentation" class="mceCharacterMap mceModalRow">' +
			'	<div id="' + ed.id + '_charmapView" role="group"></div>' +
			'	<div class="mceCharacterMapDescription">' +
			'		<h1 id="' + ed.id + '_charmapCodeV"></h1>' +
			'		<h4 id="' + ed.id + '_charmapCodeN"></h4>' +
			'		<h3 id="' + ed.id + '_charmapCodeA"></h3>' +
			'		<h3 id="' + ed.id + '_charmapCodeB"></h3>' +
			'	</div>' +
			'</div>';

		ed.addCommand('mceCharacterMap', function (v) {
			ed.windowManager.open({
				title: ed.getLang('advanced.charmap_desc'),
				content: html,
				size: 'mce-modal-landscape-xlarge',
				open: function () {
					// eslint-disable-next-line consistent-this
					var win = this, elm = DOM.get(ed.id + '_charmapView');

					DOM.setHTML(elm, renderCharMapHTML());

					DOM.bind(elm, 'mouseover', function (e) {
						var node = e.target;

						if (node.nodeName !== "BUTTON") {
							return;
						}

						var chr = node.getAttribute('data-numeric'), chrA = '#' + chr + ';', chrB = node.getAttribute('data-named'), chrN = node.getAttribute('title');

						previewChar(chrA, chrB, chrN);
					});

					DOM.bind(elm, 'click', function (e) {
						var node = e.target;

						e.preventDefault();

						if (node.nodeName !== "BUTTON") {
							return;
						}

						var chr = node.getAttribute('data-numeric');
						ed.execCommand('mceInsertContent', false, '&#' + chr + ';');

						win.close();
					});

					// eslint-disable-next-line no-unused-vars
					var VK = new tinymce.ui.KeyboardNavigation({
						root: elm,
						items: DOM.select('button', elm),
						excludeFromTabOrder: false,
						onCancel: function () {
							ed.focus();
						}
					}, DOM);
				}
			});
		});

		this.createControl = function (name, cm) {
			var btn;
			
			function insertChar(chr) {
				ed.execCommand('mceInsertContent', false, '&' + chr + ';');
				ed.focus();
			}

			if (name === 'charmap') {
				if (ed.getParam('charmap_custom')) {
					btn = cm.createSplitButton(name, {
						title: 'advanced.charmap_desc',
						cmd: 'mceCharacterMap'
					});

					btn.onRenderMenu.add(function (btn, menu) {
						each(ed.getParam('charmap_custom', '', 'hash'), function (v, k) {
							var id = ed.dom.uniqueId();

							v = v.replace(/[^a-z0-9]/gi, '');

							menu.add({
								id: id,
								title: k + ' &' + v + ';',
								onclick: function () {
									insertChar(v);
								}
							});
						});
					});
				} else {
					btn = cm.createButton(name, {
						title: 'advanced.charmap_desc',
						cmd: 'mceCharacterMap'
					});
				}

				return btn;
			}
		};
	});
})();
