
/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2023 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* eslint-disable no-control-regex */
(function () {
	tinymce.create('tinymce.plugins.TextCase', {
		init: function (ed, url) {
			var self = this;

			this.url = url;
			this.editor = ed;

			ed.addCommand('mceUpperCase', function () {
				self._upperCase();
			});

			ed.addCommand('mceLowerCase', function () {
				self._lowerCase();
			});

			ed.addCommand('mceTitleCase', function () {
				self._titleCase();
			});

			ed.addCommand('mceSentenceCase', function () {
				self._sentenceCase();
			});

			ed.onNodeChange.add(function (ed, cm, n, co) {
				cm.setDisabled('textcase', co);
			});
		},

		createControl: function (n, cm) {
			var self = this,
				ed = self.editor;

			if (n === "textcase") {
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
			}

			return null;
		},

		_sentenceCase: function () {
			var ed = this.editor,
				s = ed.selection;

			var text = s.getContent();

			text = text.toLowerCase().replace(/([\u0000-\u1FFF])/, function (a, b) {
				return b.toUpperCase();
			}).replace(/(\.\s?)([\u0000-\u1FFF])/gi, function (a, b, c) {
				return b + c.toUpperCase();
			});

			s.setContent(text);
		},

		_titleCase: function () {
			var ed = this.editor,
				s = ed.selection;

			var text = s.getContent();

			// convert to lowercase
			text = text.toLowerCase();

			text = text.replace(/(?:^|\s)[\u0000-\u1FFF]/g, function (match) {
				return match.toUpperCase();
			});

			s.setContent(text);
		},

		_lowerCase: function () {
			var ed = this.editor,
				s = ed.selection;

			var text = s.getContent();
			s.setContent(text.toLowerCase());
		},

		_upperCase: function () {
			var ed = this.editor,
				s = ed.selection;

			var text = s.getContent();
			s.setContent(text.toUpperCase());
		}
	});

	// Register plugin
	tinymce.PluginManager.add('textcase', tinymce.plugins.TextCase);
})();