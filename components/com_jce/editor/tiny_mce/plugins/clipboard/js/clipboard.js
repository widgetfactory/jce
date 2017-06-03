//tinyMCEPopup.requireLangPack();

var ClipboardDialog = {

	settings: {},

	init: function () {
		var self = this,
			ed = tinyMCEPopup.editor,
			el = document.getElementById('container'),
			title = document.getElementById('title'),
			ifr, doc, css, cssHTML = '';

		Wf.init();

		$('#insert').click(function (e) {
			self.insert();
			e.preventDefault;
		});

		$('#cancel').click(function (e) {
			tinyMCEPopup.close();
			e.preventDefault;
		});

		var cmd = tinyMCEPopup.getWindowArg('cmd');
		var msg = ed.getLang('clipboard.paste_dlg_title', 'Use %s+V on your keyboard to paste text into the window.');

		title.innerHTML = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

		if (cmd == 'mcePaste') {
			// Set title
			document.title = ed.getLang('clipboard.paste_desc');

			// Create iframe
			el.innerHTML = '<iframe id="content" src="javascript:\'\';" frameBorder="0"></iframe>';
			ifr = document.getElementById('content');
			doc = ifr.contentWindow.document;

			// Force absolute CSS urls
			css = tinymce.explode(ed.settings.content_css) || [];
			css.push(ed.baseURI.toAbsolute("themes/" + ed.settings.theme + "/skins/" + ed.settings.skin + "/content.css"));
			css.push(ed.baseURI.toAbsolute("plugins/clipboard/css/blank.css"));

			tinymce.each(css, function (u) {
				cssHTML += '<link href="' + ed.documentBaseURI.toAbsolute('' + u) + '" rel="stylesheet" type="text/css" />';
			});

			// Write content into iframe
			doc.open();
			doc.write('<html><head><base href="' + ed.settings.base_url + '" />' + cssHTML + '</head><body class="mceContentBody" spellcheck="false"></body></html>');
			doc.close();

			doc.designMode = 'on';

			window.setTimeout(function () {
				ifr.contentWindow.focus();
			}, 100);

		} else {
			document.title = ed.getLang('clipboard.paste_text_desc');
			el.innerHTML = '<textarea id="content" name="content" dir="ltr" wrap="soft" class="mceFocus"></textarea>';
		}
	},

	insert: function () {
		var html = "", node = document.getElementById('content');

		tinyMCEPopup.restoreSelection();

		var data = {};

		if (node.nodeName == 'TEXTAREA') {
			data.text = node.value;
		} else {
			data.content = node.contentWindow.document.body.innerHTML;
		}

		tinyMCEPopup.editor.execCommand('mceInsertClipboardContent', false, data);
		tinyMCEPopup.close();
	},

	resize: function () {
		var vp = tinyMCEPopup.dom.getViewPort(window),
			el;

		el = document.getElementById('content');

		if (el) {
			el.style.height = (vp.h - 110) + 'px';
		}
	}
};
tinyMCEPopup.onInit.add(ClipboardDialog.init, ClipboardDialog);