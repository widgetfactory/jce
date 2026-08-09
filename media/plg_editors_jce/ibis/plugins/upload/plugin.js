/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global ibis:true */

(function () {
  var each = ibis.each,
    JSON = ibis.util.JSON,
    RangeUtils = ibis.dom.RangeUtils,
    Uuid = ibis.util.Uuid,
    Env = ibis.util.Env;

  // Register plugin
  ibis.PluginManager.add('upload', function (ed) {
    var plugins = [], files = [];

    function hasFiles(e) {
      var dataTransfer = e.dataTransfer;

      return !!(dataTransfer && dataTransfer.files && dataTransfer.files.length);
    }

    // block the browser default handling of dropped files
    function cancel() {
      ed.dom.bind(ed.getBody(), 'dragover drop', function (e) {
        if (hasFiles(e)) {
          e.preventDefault();
        }
      });
    }

    ed.onPreInit.add(function () {
      // get list of supported plugins
      each(ed.plugins, function (plg) {
        if (ibis.is(plg.getUploadConfig, 'function')) {
          var data = plg.getUploadConfig();

          if (data.inline && data.filetypes) {
            plugins.push(plg);
          }
        }
      });

      // Cleanup callback
      ed.onBeforeSetContent.add(function (ed, o) {
        o.content = o.content.replace(/<\/media>/g, '&nbsp;</media>');
      });

      // Cleanup callback
      ed.onPostProcess.add(function (ed, o) {
        o.content = o.content.replace(/(&nbsp;|\u00a0)<\/media>/g, '</media>');
      });

      ed.schema.addValidElements('+media[type|width|height|class|style|title|*]');

      // Remove bogus elements
      ed.serializer.addAttributeFilter('data-mce-marker', function (nodes) {
        var i = nodes.length;

        while (i--) {
          nodes[i].remove();
        }
      });

      function isMediaPlaceholder(node) {
        if (node.name === 'media') {
          return true;
        }

        if (node.name === 'img') {
          if (node.attr('data-mce-upload-marker')) {
            return true;
          }

          var cls = node.attr('class');

          if (cls && cls.indexOf('upload-placeholder') != -1) {
            return true;
          }
        }

        return false;
      }

      // find and convert upload markers
      ed.parser.addNodeFilter('img,media', function (nodes) {
        var i = nodes.length,
          node;

        while (i--) {
          node = nodes[i];

          if (isMediaPlaceholder(node)) {

            // no plugins to upload, remove node
            if (plugins.length == 0) {
              node.remove();
            } else {
              createUploadMarker(node);
            }
          }
        }
      });

      // remove upload markers
      ed.serializer.addNodeFilter('img', function (nodes) {
        var i = nodes.length,
          node, cls;

        while (i--) {
          node = nodes[i];
          cls = node.attr('class');

          if (cls && /mce-item-upload-marker/.test(cls)) {
            // remove marker classes
            cls = cls.replace(/(?:^|\s)(mce-item-)(?!)(upload|upload-marker|upload-placeholder)(?!\S)/g, '');
            // set class and src
            node.attr({
              'data-mce-src': '',
              'src': '',
              'class': ibis.trim(cls)
            });

            // rename
            node.name = 'media';
            node.shortEnded = false;
            // remove alt if set
            node.attr('alt', null);
            // remove maarker attribute
            node.attr('data-mce-upload-marker', null);
          }
        }
      });

      function bindUploadEvents(ed) {
        each(ed.dom.select('.mce-item-upload-marker', ed.getBody()), function (n) {
          if (plugins.length == 0) {
            ed.dom.remove(n);
          } else {
            bindUploadMarkerEvents(n);
          }
        });
      }

      // update events when content is set
      ed.onSetContent.add(function () {
        bindUploadEvents(ed);
      });

      // update events when fullscreen is activated
      if (ed.onFullScreen) {
        ed.onFullScreen.add(function (editor) {
          bindUploadEvents(editor);
        });
      }
    });

    ed.onInit.add(function () {
      // no supported plugins
      if (plugins.length == 0) {
        cancel();
        return;
      }

      // Display "a#name" instead of "img" in element path
      if (ed.theme && ed.theme.onResolveName) {
        ed.theme.onResolveName.add(function (theme, o) {
          var n = o.node;

          if (n && n.nodeName === 'IMG' && /mce-item-upload/.test(n.className)) {
            o.name = 'placeholder';
          }
        });
      }

      function cancelEvent(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      ed.dom.bind(ed.getBody(), 'dragover', function (e) {
        e.dataTransfer.dropEffect = ibis.VK.metaKeyPressed(e) ? "copy" : "move";
      });

      // Attach drop handler and grab files
      ed.dom.bind(ed.getBody(), 'drop', function (e) {
        // Add dropped files
        if (hasFiles(e)) {
          var rng = RangeUtils.getCaretRangeFromPoint(e.clientX, e.clientY, ed.getDoc());

          if (rng) {
            ed.selection.setRng(rng);
          }

          // store the content before any placeholders are created, so that an undo restores it
          ed.undoManager.add();

          each(e.dataTransfer.files, function (file) {
            addFile(file);
          });

          cancelEvent(e);
        }

        // upload queued files, working on a copy as the queue is modified as each upload completes
        each(files.slice(0), function (file) {
          uploadFile(file);
        });

        // stop Firefox opening the image in a new window if the drop target is itself (drag cancelled)
        if (ibis.isGecko && e.target.nodeName == 'IMG') {
          cancelEvent(e);
        }
      });
    });

    var noop = function () { };

    function uploadHandler(file, success, failure, progress) {
      var xhr, formData;

      success = success || noop;
      failure = failure || noop;
      progress = progress || noop;

      var args = {
        method: 'upload',
        id: Uuid.uuid('wf_'),
        inline: 1,
        name: file.filename
      };

      var url = file.upload_url;

      // add query
      url += '&' + ed.settings.query;

      xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.upload.onprogress = function (e) {
        progress(e.loaded / e.total * 100);
      };

      xhr.onerror = function () {
        failure("Image upload failed due to a XHR Transport error. Code: " + xhr.status);
      };

      xhr.onload = function () {
        var json;

        if (xhr.status < 200 || xhr.status >= 300) {
          failure("HTTP Error: " + xhr.status);
          return;
        }

        try {
          json = JSON.parse(xhr.responseText);
        } catch (e) {
          json = null;
        }

        if (!json || json.error || !json.result) {
          failure(json && json.error && json.error.message ? json.error.message : 'Invalid JSON response!');
          return;
        }

        success(json.result);
      };

      formData = new FormData();

      // Add params
      each(args, function (value, name) {
        formData.append(name, value);
      });

      formData.append('file', file, file.name);

      xhr.send(formData);
    }

    function showUploadError(text) {
      ed.windowManager.alert({
        text: text,
        title: ed.getLang('upload.error', 'Upload Error')
      });
    }

    function showFileTypeError() {
      showUploadError(ed.getLang('upload.file_extension_error', 'File type not supported'));
    }

    // find the first plugin that will accept the file and store its upload url
    function assignUploader(file) {
      each(plugins, function (plg) {
        var url = plg.getUploadURL(file);

        if (url) {
          file.upload_url = url;
          file.uploader = plg;

          return false;
        }
      });

      return !!file.upload_url;
    }

    // validate the file type and size against the uploader configuration
    function isValidFile(file) {
      if (!ibis.is(file.uploader.getUploadConfig, 'function')) {
        return true;
      }

      var config = file.uploader.getUploadConfig();

      if (!new RegExp('\\.(' + config.filetypes.join('|') + ')$', 'i').test(file.name)) {
        showFileTypeError();
        return false;
      }

      if (file.size) {
        var max = parseInt(config.max_size, 10) || 1024;

        if (file.size > max * 1024) {
          showUploadError(ed.getLang('upload.file_size_error', 'File size exceeds maximum allowed size'));
          return false;
        }
      }

      return true;
    }

    // insert a placeholder element at the caret to show upload progress
    function createPlaceholder(file) {
      var uid = Uuid.uuid('wf-tmp-'), size;

      ed.execCommand('mceInsertContent', false, '<span data-mce-marker="1" id="' + uid + '">\uFEFF</span>', {
        skip_undo: 1
      });

      var n = ed.dom.get(uid);

      // get approximate size of image from file size, with a minimum value of 300
      if (/image\/(gif|png|jpeg|jpg)/.test(file.type) && file.size) {
        size = Math.max(300, Math.round(Math.sqrt(file.size)));

        ed.dom.setStyles(n, {
          width: size,
          height: size
        });

        ed.dom.addClass(n, 'mce-item-upload');
      } else {
        ed.setProgressState(true);
      }

      return n;
    }

    function addFile(file) {
      // check for extension in file name, eg. image.php.jpg
      if (/\.(php([0-9]*)|phtml|pl|py|jsp|asp|htm|html|shtml|sh|cgi)\./i.test(file.name)) {
        showFileTypeError();
        return false;
      }

      if (!assignUploader(file)) {
        showFileTypeError();
        return false;
      }

      if (!isValidFile(file)) {
        return false;
      }

      // remove some common characters
      file.filename = (file.target_name || file.name).replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g, '');

      if (!file.marker && ed.settings.upload_use_placeholder !== false) {
        file.marker = createPlaceholder(file);
      }

      // add files to queue
      files.push(file);

      return true;
    }

    /**
     * Create an upload marker on selected nodes
     * @param {*} node 
     */
    function createUploadMarker(node) {
      var src = node.attr('src') || '',
        style = {},
        cls = [];

      // get alt from the file name in the src, if not base64 encoded
      if (!node.attr('alt') && !/data:image/.test(src)) {
        node.attr('alt', src.slice(src.lastIndexOf('/') + 1));
      }

      if (node.attr('style')) {
        style = ed.dom.styles.parse(node.attr('style'));
      }

      // convert hspace
      if (node.attr('hspace')) {
        style['margin-left'] = style['margin-right'] = node.attr('hspace');
      }

      // convert vspace
      if (node.attr('vspace')) {
        style['margin-top'] = style['margin-bottom'] = node.attr('vspace');
      }

      // convert align
      if (node.attr('align')) {
        style["float"] = node.attr('align');
      }

      if (node.attr('class')) {
        cls = node.attr('class').replace(/\s*upload-placeholder\s*/, '').split(' ');
      }

      // add marker classes
      cls.push('mce-item-upload');
      cls.push('mce-item-upload-marker');

      if (node.name === 'media') {
        node.name = 'img';
        node.shortEnded = true;
      }

      // set attribs
      node.attr({
        'src': Env.transparentSrc,
        'class': ibis.trim(cls.join(' '))
      });

      var tmp = ed.dom.create('span', {
        'style': style
      });

      // add styles if any
      var styles = ed.dom.getAttrib(tmp, 'style');

      if (styles) {
        node.attr({
          'style': styles,
          'data-mce-style': styles
        });
      }
    }

    /**
     * Find and replace the marker with the uploaded file, using attributes from the uploader
     * @param {*} file 
     * @param {*} data 
     * @returns 
     */
    // transfer the styles, width and height of the marker to the uploaded element
    function transferMarkerStyles(marker, elm) {
      var styles = ed.dom.getAttrib(marker, 'data-mce-style');
      var w = marker.width || 0;
      var h = marker.height || 0;

      if (styles) {
        styles = ed.dom.styles.parse(styles);

        if (styles.width) {
          w = styles.width;
          delete styles.width;
        }

        if (styles.height) {
          h = styles.height;
          delete styles.height;
        }

        ed.dom.setStyles(elm, styles);
      }

      if (w) {
        ed.dom.setAttrib(elm, 'width', w);
      }

      if (h) {
        // width alone will scale the image, so height is not required
        ed.dom.setAttrib(elm, 'height', w ? '' : h);
      }
    }

    function selectAndInsert(file, data) {
      var marker = file.marker;

      // select marker
      ed.selection.select(marker);

      var elm = file.uploader.insertUploadedFile(data);

      if (!elm) {
        return;
      }

      // is an element node
      if (typeof elm === 'object' && elm.nodeType) {
        if (ed.dom.hasClass(marker, 'mce-item-upload-marker')) {
          transferMarkerStyles(marker, elm);
        }

        // the marker is selected, so it is replaced by the inserted content. An undo level must not
        // be added here as it would store the marker and restore it on undo
        ed.execCommand('mceInsertContent', false, ed.dom.getOuterHTML(elm));
      }

      ed.nodeChanged();

      return true;
    }

    /*
     * Bind events to upload marker and create upload input
     * @param marker Marker / Placeholder element
     */
    function bindUploadMarkerEvents(marker) {
      var dom = ibis.DOM;

      function removeUpload() {
        dom.setStyles('wf_upload_button', {
          'top': '',
          'left': '',
          'display': 'none',
          'zIndex': ''
        });
      }

      // remove upload on nodechange
      ed.onNodeChange.add(removeUpload);

      // remove on window scroll
      ed.dom.bind(ed.getWin(), 'scroll', removeUpload);

      var input = dom.get('wf_upload_input'), btn = dom.get('wf_upload_button');

      // create input
      if (!btn) {
        btn = dom.add(dom.doc.body, 'div', {
          'id': 'wf_upload_button',
          'class': 'btn',
          'role': 'button',
          'title': ed.getLang('upload.button_description', 'Click to upload a file')
        }, '<label for="wf_upload_input"><span class="icon-upload"></span>&nbsp;' + ed.getLang('upload.label', 'Upload') + '</label>');

        // create upload input
        input = dom.add(btn, 'input', {
          'type': 'file',
          'id': 'wf_upload_input'
        });
      }

      // add upload on mouseover
      ed.dom.bind(marker, 'mouseover', function (e) {

        if (ed.dom.getAttrib(marker, 'data-mce-selected')) {
          return;
        }

        var vp = ed.dom.getViewPort(ed.getWin());
        var p1 = dom.getRect(ed.getContentAreaContainer());
        var p2 = ed.dom.getRect(marker);

        if (vp.y > p2.y + p2.h / 2 - 25) {
          return;
        }

        if (vp.y < (p2.y + p2.h / 2 + 25) - p1.h) {
          return;
        }

        var x = Math.max(p2.x - vp.x, 0) + p1.x;
        var y = Math.max(p2.y - vp.y, 0) + p1.y - Math.max(vp.y - p2.y, 0);

        var zIndex = ed.id == 'mce_fullscreen' ? dom.get('mce_fullscreen_container').style.zIndex : 0;

        each(['wf_upload_button', 'wf_select_button'], function (id) {
          dom.setStyles(id, {
            'top': y + p2.h / 2 - 16,
            'left': x + p2.w / 2 - 50,
            'display': 'block',
            'zIndex': zIndex + 1
          });
        });

        // bind onchange event to input to trigger upload
        input.onchange = function () {
          var file = input.files ? input.files[0] : null;

          if (!file) {
            return;
          }

          file.marker = marker;

          // store the content while the marker is still a placeholder, so that an undo restores it
          ed.undoManager.add();

          if (addFile(file)) {
            // add width and height as styles if set
            each(['width', 'height'], function (key) {
              ed.dom.setStyle(marker, key, ed.dom.getAttrib(marker, key));
            });

            // rename to "span" to support css:after
            file.marker = ed.dom.rename(marker, 'span');

            uploadFile(file);
            removeUpload();
          }
        };
      });

      // remove upload on mouseout
      ed.dom.bind(marker, 'mouseout', function (e) {
        // don't remove if over upload input
        if (!e.relatedTarget && e.clientY > 0) {
          return;
        }

        removeUpload();
      });
    }

    // remove the file from the upload queue
    function removeFile(file) {
      var i = ibis.inArray(files, file);

      if (i !== -1) {
        files.splice(i, 1);
      }
    }

    function uploadFile(file) {
      // remove the file from the queue and clean up its placeholder
      function cleanup() {
        removeFile(file);

        if (file.marker) {
          ed.dom.remove(file.marker);
        }

        ed.setProgressState(false);
      }

      uploadHandler(file, function (response) {
        var uploaded = response.files || [], item = uploaded.length ? uploaded[0] : {};

        if (file.uploader) {
          selectAndInsert(file, ibis.extend({
            type: file.type,
            name: file.name
          }, item));
        }

        cleanup();

      }, function (message) {
        showUploadError(message);

        cleanup();

      }, function (value) {
        if (file.marker) {
          ed.dom.setAttrib(file.marker, 'data-progress', value);
        }
      });
    }

    this.plugins = plugins;
    this.upload = uploadHandler;
  });
})();