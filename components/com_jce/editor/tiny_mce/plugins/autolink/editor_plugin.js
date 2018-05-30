/**
 * editor_plugin_src.js
 *
 * Copyright 2011, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
	var AutoUrlDetectState;
	var AutoLinkPattern = /^(https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|(?:mailto:)?[A-Z0-9._%+\-]+@)(.+)$/i;

	tinymce.create('tinymce.plugins.AutolinkPlugin', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */

		init: function (ed, url) {
			var t = this;

			if (!ed.getParam('autolink_url', true) && !ed.getParam('autolink_email', true)) {
				return;
			}

			if (ed.settings.autolink_pattern) {
				AutoLinkPattern = ed.settings.autolink_pattern;
			}

			ed.onAutoLink = new tinymce.util.Dispatcher(this);

			// Add a key down handler
			ed.onKeyDown.addToTop(function (ed, e) {
				if (e.keyCode == 13)
					return t.handleEnter(ed);
			});

			// Internet Explorer has built-in automatic linking for most cases
			if (tinyMCE.isIE)
				return;

			ed.onKeyPress.add(function (ed, e) {
				if (e.which == 41)
					return t.handleEclipse(ed);
			});

			// Add a key up handler
			ed.onKeyUp.add(function (ed, e) {
				if (e.keyCode == 32)
					return t.handleSpacebar(ed);
			});
		},

		handleEclipse: function (ed) {
			this.parseCurrentLine(ed, -1, '(', true);
		},

		handleSpacebar: function (ed) {
			this.parseCurrentLine(ed, 0, '', true);
		},

		handleEnter: function (ed) {
			this.parseCurrentLine(ed, -1, '', false);
		},

		parseCurrentLine: function (editor, endOffset, delimiter) {
			var rng, end, start, endContainer, bookmark, text, matches, prev, len, rngText;

			function scopeIndex(container, index) {
				if (index < 0) {
					index = 0;
				}

				if (container.nodeType == 3) {
					var len = container.data.length;

					if (index > len) {
						index = len;
					}
				}

				return index;
			}

			function setStart(container, offset) {
				if (container.nodeType != 1 || container.hasChildNodes()) {
					rng.setStart(container, scopeIndex(container, offset));
				} else {
					rng.setStartBefore(container);
				}
			}

			function setEnd(container, offset) {
				if (container.nodeType != 1 || container.hasChildNodes()) {
					rng.setEnd(container, scopeIndex(container, offset));
				} else {
					rng.setEndAfter(container);
				}
			}

			// Never create a link when we are inside a link
			if (editor.selection.getNode().tagName == 'A') {
				return;
			}

			// We need at least five characters to form a URL,
			// hence, at minimum, five characters from the beginning of the line.
			rng = editor.selection.getRng(true).cloneRange();
			if (rng.startOffset < 5) {
				// During testing, the caret is placed between two text nodes.
				// The previous text node contains the URL.
				prev = rng.endContainer.previousSibling;
				if (!prev) {
					if (!rng.endContainer.firstChild || !rng.endContainer.firstChild.nextSibling) {
						return;
					}

					prev = rng.endContainer.firstChild.nextSibling;
				}

				len = prev.length;
				setStart(prev, len);
				setEnd(prev, len);

				if (rng.endOffset < 5) {
					return;
				}

				end = rng.endOffset;
				endContainer = prev;
			} else {
				endContainer = rng.endContainer;

				// Get a text node
				if (endContainer.nodeType != 3 && endContainer.firstChild) {
					while (endContainer.nodeType != 3 && endContainer.firstChild) {
						endContainer = endContainer.firstChild;
					}

					// Move range to text node
					if (endContainer.nodeType == 3) {
						setStart(endContainer, 0);
						setEnd(endContainer, endContainer.nodeValue.length);
					}
				}

				if (rng.endOffset == 1) {
					end = 2;
				} else {
					end = rng.endOffset - 1 - endOffset;
				}
			}

			start = end;

			do {
				// Move the selection one character backwards.
				setStart(endContainer, end >= 2 ? end - 2 : 0);
				setEnd(endContainer, end >= 1 ? end - 1 : 0);
				end -= 1;
				rngText = rng.toString();

				// Loop until one of the following is found: a blank space, &nbsp;, delimiter, (end-2) >= 0
			} while (rngText != ' ' && rngText !== '' && rngText.charCodeAt(0) != 160 && (end - 2) >= 0 && rngText != delimiter);

			if (rng.toString() == delimiter || rng.toString().charCodeAt(0) == 160) {
				setStart(endContainer, end);
				setEnd(endContainer, start);
				end += 1;
			} else if (rng.startOffset === 0) {
				setStart(endContainer, 0);
				setEnd(endContainer, start);
			} else {
				setStart(endContainer, end);
				setEnd(endContainer, start);
			}

			// Exclude last . from word like "www.site.com."
			text = rng.toString();
			if (text.charAt(text.length - 1) == '.') {
				setEnd(endContainer, start - 1);
			}

			text = rng.toString();
			matches = text.match(AutoLinkPattern);

			if (matches) {
				if (matches[1] == 'www.') {
					matches[1] = 'http://www.';
				} else if (/@$/.test(matches[1]) && !/^mailto:/.test(matches[1])) {
					matches[1] = 'mailto:' + matches[1];
				}

				bookmark = editor.selection.getBookmark();

				editor.selection.setRng(rng);
				editor.execCommand('createlink', false, matches[1] + matches[2]);

				var node = editor.selection.getNode();

				if (editor.settings.default_link_target) {
					editor.dom.setAttrib(node, 'target', editor.settings.default_link_target);
				}

				editor.onAutoLink.dispatch(editor, {node: node});

				editor.selection.moveToBookmark(bookmark);
				editor.nodeChanged();
			}
		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo: function () {
			return {
				longname: 'Autolink',
				author: 'Moxiecode Systems AB',
				authorurl: 'http://tinymce.moxiecode.com',
				infourl: 'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/autolink',
				version: tinymce.majorVersion + "." + tinymce.minorVersion
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('autolink', tinymce.plugins.AutolinkPlugin);
})();