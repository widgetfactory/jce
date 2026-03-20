
/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* eslint-disable no-control-regex */
(function () {
	tinymce.PluginManager.add('textcase', function (ed, url) {
		ed.addCommand('mceUpperCase', function () {
			upperCase();
		});

		ed.addCommand('mceLowerCase', function () {
			lowerCase();
		});

		ed.addCommand('mceTitleCase', function () {
			titleCase();
		});

		ed.addCommand('mceSentenceCase', function () {
			sentenceCase();
		});

		ed.onNodeChange.add(function (ed, cm, n, co) {
			cm.setDisabled('textcase', co);
		});

		this.createControl = function (n, cm) {			
			if (n !== "textcase") {
				return null;
			}

			var c = cm.createSplitButton('textcase', {
				title: 'textcase.uppercase',
				icon: 'uppercase',
				onclick: function () {
					ed.execCommand('mceUpperCase');
				}
			});

			c.onRenderMenu.add(function (c, m) {
				m.add({
					title: 'textcase.uppercase',
					icon: 'uppercase',
					onclick: function () {
						ed.execCommand('mceUpperCase');
					}
				});

				m.add({
					title: 'textcase.lowercase',
					icon: 'lowercase',
					onclick: function () {
						ed.execCommand('mceLowerCase');
					}
				});

				m.add({
					title: 'textcase.sentencecase',
					icon: 'sentencecase',
					onclick: function () {
						ed.execCommand('mceSentenceCase');
					}
				});

				m.add({
					title: 'textcase.titlecase',
					icon: 'titlecase',
					onclick: function () {
						ed.execCommand('mceTitleCase');
					}
				});
			});

			// Return the new splitbutton instance
			return c;
		};

		function sentenceCase() {
			var s = ed.selection;

			var text = s.getContent();

			text = text.toLowerCase().replace(/([\u0000-\u1FFF])/, function (a, b) {
				return b.toUpperCase();
			}).replace(/(\.\s?)([\u0000-\u1FFF])/gi, function (a, b, c) {
				return b + c.toUpperCase();
			});

			s.setContent(text);
		}

		function titleCase() {
			var s = ed.selection;

			var text = s.getContent();

			// convert to lowercase
			text = text.toLowerCase();

			text = text.replace(/(?:^|\s)[\u0000-\u1FFF]/g, function (match) {
				return match.toUpperCase();
			});

			s.setContent(text);
		}

		function lowerCase() {
			var s = ed.selection;

			var text = s.getContent();
			s.setContent(text.toLowerCase());
		}

		function upperCase() {
			var s = ed.selection;

			var text = s.getContent();
			s.setContent(text.toUpperCase());
		}
	});
})();