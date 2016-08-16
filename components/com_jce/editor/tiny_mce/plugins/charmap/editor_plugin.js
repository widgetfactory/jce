/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function() {
	var each = tinymce.each;

	tinymce.create('tinymce.plugins.CharacterMap', {
		init: function(ed, url) {
			this.editor = ed;

			// Register commands
			ed.addCommand('mceCharacterMap', function(v) {
				ed.windowManager.open({
					url: ed.getParam('site_url') + 'index.php?option=com_jce&view=editor&layout=plugin&plugin=charmap',
					width   : 640 + parseInt(ed.getLang('advanced.charmap_delta_width', 0)),
					height  : 300 + parseInt(ed.getLang('advanced.charmap_delta_height', 0)),
					close_previous: false,
					inline: true,
					size: 'mce-modal-landscape-large'
				});
			});
		},
		createControl: function(name, cm) {
			var self = this,
				btn, editor = self.editor;

			function insertChar(chr) {
				editor.execCommand('mceInsertContent', false, '&' + chr + ';');
				editor.focus();
			}

			if (name === 'charmap') {
        if (editor.getParam('charmap_custom')) {
					btn = cm.createSplitButton(name, {
						title: 'advanced.charmap_desc',
						cmd: 'mceCharacterMap'
					});

					btn.onRenderMenu.add(function(btn, menu) {
						each(editor.getParam('charmap_custom', '', 'hash'), function(v, k) {
							var id = editor.dom.uniqueId();

							v = v.replace(/[^a-z0-9]/gi, '');

							menu.add({
								id: id,
								title: k + ' &' + v + ';',
								onclick: function() {
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
		}
	});
	// Register plugin
	tinymce.PluginManager.add('charmap', tinymce.plugins.CharacterMap);
})();
