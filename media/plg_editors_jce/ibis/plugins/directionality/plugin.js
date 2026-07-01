/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
	ibis.PluginManager.add('directionality', function (ed, url) {
		function setDir(dir) {
			var dom = ed.dom, curDir, blocks = ed.selection.getSelectedBlocks();

			if (blocks.length) {
				curDir = dom.getAttrib(blocks[0], "dir");

				ibis.each(blocks, function (block) {
					// Add dir to block if the parent block doesn't already have that dir
					if (!dom.getParent(block.parentNode, "*[dir='" + dir + "']", dom.getRoot())) {
						if (curDir != dir) {
							dom.setAttrib(block, "dir", dir);
						} else {
							dom.setAttrib(block, "dir", null);
						}
					}
				});

				ed.nodeChanged();
			}
		}

		ed.addCommand('mceDirectionLTR', function () {
			setDir("ltr");
		});

		ed.addCommand('mceDirectionRTL', function () {
			setDir("rtl");
		});

		ed.addButton('ltr', { title: 'directionality.ltr_desc', cmd: 'mceDirectionLTR' });
		ed.addButton('rtl', { title: 'directionality.rtl_desc', cmd: 'mceDirectionRTL' });

		ed.onNodeChange.add(function (ed, cm, n) {
			var dom = ed.dom, dir;

			n = dom.getParent(n, dom.isBlock);
			if (!n) {
				cm.setDisabled('ltr', 1);
				cm.setDisabled('rtl', 1);
				return;
			}

			dir = dom.getAttrib(n, 'dir');
			cm.setActive('ltr', dir == "ltr");
			cm.setDisabled('ltr', 0);
			cm.setActive('rtl', dir == "rtl");
			cm.setDisabled('rtl', 0);
		});
	});
})();