/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 *
 * * Based on plupload - http://www.plupload.com
 */

/*global tinymce:true */

(function () {
  var each = tinymce.each,
    JSON = tinymce.util.JSON,
    RangeUtils = tinymce.dom.RangeUtils,
    Uuid = tinymce.util.Uuid;

  // Register plugin
  tinymce.PluginManager.add('upload', function (ed, url) {
    var plugins = [], files = [];

    function cancel() {
      // Block browser default drag over
      ed.dom.bind(ed.getBody(), 'dragover', function (e) {
        var dataTransfer = e.dataTransfer;

        // cancel dropped files
        if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
          e.preventDefault();
        }
      });

      ed.dom.bind(ed.getBody(), 'drop', function (e) {
        var dataTransfer = e.dataTransfer;

        // cancel dropped files
        if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
          e.preventDefault();
        }
      });
    }

    ed.onPreInit.add(function () {
      // get list of supported plugins
      each(ed.plugins, function (plg, name) {
        if (tinymce.is(plg.getUploadConfig, 'function')) {

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

      ed.schema.addCustomElements('~media[type|width|height|class|style|title|*]');

      if (!ed.settings.compress.css) {
        ed.dom.loadCSS(url + "/css/content.css");
      }

      // Remove bogus elements
      ed.serializer.addAttributeFilter('data-mce-marker', function (nodes, name, args) {
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
            if (self.plugins.length == 0) {
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
          node = nodes[i], cls = node.attr('class');

          if (cls && /mce-item-upload-marker/.test(cls)) {
            // remove marker classes
            cls = cls.replace(/(?:^|\s)(mce-item-)(?!)(upload|upload-marker|upload-placeholder)(?!\S)/g, '');
            // set class and src
            node.attr({
              'data-mce-src': '',
              'src': '',
              'class': tinymce.trim(cls)
            });

            // rename
            node.name = 'media';
            node.shortEnded = false;
            // remove alt if set
            node.attr('alt', null);
          }
        }
      });

      function bindUploadEvents(ed) {
        each(ed.dom.select('.mce-item-upload-marker', ed.getBody()), function (n) {
          if (self.plugins.length == 0) {
            ed.dom.remove(n);
          } else {
            bindUploadMarkerEvents(ed, n);
          }
        });
      }

      // update events when content is inserted
      ed.selection.onSetContent.add(function () {
        bindUploadEvents(ed);
      });

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
        e.dataTransfer.dropEffect = tinymce.VK.metaKeyPressed(e) ? "copy" : "move";
      });

      // Attach drop handler and grab files
      ed.dom.bind(ed.getBody(), 'drop', function (e) {
        var dataTransfer = e.dataTransfer;

        // Add dropped files
        if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
          each(dataTransfer.files, function (file) {
            var rng = RangeUtils.getCaretRangeFromPoint(e.clientX, e.clientY, ed.getDoc());
            if (rng) {
              ed.selection.setRng(rng);
              rng = null;
            }

            addFile(file);
          });

          cancelEvent(e);
        }

        // upload...
        if (files.length) {
          each(files, function (file) {
            uploadFile(file);
          });
        }
        // stop Firefox opening the image in a new window if the drop target is itself (drag cancelled)
        if (tinymce.isGecko && e.target.nodeName == 'IMG') {
          cancelEvent(e);
        }
      });
    });

    function uploadHandler(file, success, failure, progress) {
      var xhr, formData;

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

        json = JSON.parse(xhr.responseText);

        if (!json || json.error) {
          failure(json.error.message || 'Invalid JSON response!');
          return;
        }

        if (!json.result || !json.result.files) {
          failure(json.error.message || 'Invalid JSON response!');
          return;
        }

        success(json.result.files[0]);
      };

      formData = new FormData();
      formData.append('file', file, file.name);

      // Add multipart params
      each(args, function (value, name) {
        formData.append(name, value);
      });

      xhr.send(formData);
    }

    function addFile(file) {
      // check for extension in file name, eg. image.php.jpg
      if (/\.(php|php(3|4|5)|phtml|pl|py|jsp|asp|htm|html|shtml|sh|cgi)\./i.test(file.name)) {
        ed.windowManager.alert(ed.getLang('upload.file_extension_error', 'File type not supported'));
        return false;
      }

      // get first url for the file type
      each(plugins, function (plg) {
        if (!file.upload_url) {
          var url = plg.getUploadURL(file);

          if (url) {
            file.upload_url = url;
            file.uploader = plg;

            return false;
          }
        }
      });

      if (file.upload_url) {
        if (tinymce.is(file.uploader.getUploadConfig, 'function')) {
          // check file type and size
          var config = file.uploader.getUploadConfig();

          var name = file.target_name || file.name;

          // remove some common characters
          file.filename = name.replace(/[\+\\\/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]/g, '');

          if (!new RegExp('\.(' + config.filetypes.join('|') + ')$', 'i').test(file.name)) {
            ed.windowManager.alert(ed.getLang('upload.file_extension_error', 'File type not supported'));
            return false;
          }

          if (file.size) {
            var max = parseInt(config.max_size, 10) || 1024;

            if (file.size > max * 1024) {
              ed.windowManager.alert(ed.getLang('upload.file_size_error', 'File size exceeds maximum allowed size'));
              return false;
            }
          }
        }

        if (!file.marker && ed.settings.upload_use_placeholder !== false) {

          ed.execCommand('mceInsertContent', false, '<span data-mce-marker="1" id="__mce_tmp">\uFEFF</span>', {
            skip_undo: 1
          });

          var n = ed.dom.get('__mce_tmp'), w, h;

          // get approximate size of image from file size
          if (/image\/(gif|png|jpeg|jpg)/.test(file.type) && file.size) {
            w = h = Math.round(Math.sqrt(file.size));

            // set minimum value of 100
            w = Math.max(300, w);
            h = Math.max(300, h);

            ed.dom.setStyles(n, {
              width: w,
              height: h
            });

            ed.dom.addClass(n, 'mce-item-upload');
          } else {
            ed.setProgressState(true);
          }

          file.marker = n;
        }

        ed.undoManager.add();

        // add files to queue
        files.push(file);

        return true;
      } else {
        ed.windowManager.alert(ed.getLang('upload.file_extension_error', 'File type not supported'));
        return false;
      }
    }

    /**
     * Create an upload marker on selected nodes
     * @param {*} node 
     */
    function createUploadMarker(node) {
      var src = node.attr('src') || '',
        style = {},
        styles, cls = [];

      // get alt from src if not base64 encoded
      if (!node.attr('alt') && !/data:image/.test(src)) {
        var alt = src.substring(src.length, src.lastIndexOf('/') + 1);
        // set alt
        node.attr('alt', alt);
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
        'src': 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'class': tinymce.trim(cls.join(' '))
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
    function selectAndInsert(file, data) {
      var marker = file.marker, uploader = file.uploader;

      // select marker
      ed.selection.select(marker);
      var elm = uploader.insertUploadedFile(data);

      if (elm) {
        // is an element node
        if (typeof elm === 'object' && elm.nodeType) {
          // transfer width and height from marker
          if (ed.dom.hasClass(marker, 'mce-item-upload-marker')) {
            var styles = ed.dom.getAttrib(marker, 'data-mce-style');

            var w = marker.width || 0;
            var h = marker.height || 0;

            // transfer styles
            if (styles) {
              // parse to object
              styles = ed.dom.styles.parse(styles);

              if (styles.width) {
                w = styles.width;

                delete styles.width;
              }

              if (styles.height) {
                h = styles.height;

                delete styles.height;
              }

              // set styles
              ed.dom.setStyles(elm, styles);
            }

            // pass through width and height
            if (w) {
              ed.dom.setAttrib(elm, 'width', w);
            }

            if (h) {
              if (w) {
                h = '';
              }

              ed.dom.setAttrib(elm, 'height', h);
            }
          }

          ed.undoManager.add();

          // replace marker with new element
          ed.dom.replace(elm, marker);
        }

        ed.nodeChanged();

        return true;
      }
    }

    /*
     * Bind events to upload marker and create upload input
     * @param marker Marker / Placeholder element
     */
    function bindUploadMarkerEvents(marker) {
      var dom = tinymce.DOM;

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

        dom.setStyles('wf_upload_button', {
          'top': y + p2.h / 2 - 16,
          'left': x + p2.w / 2 - 50,
          'display': 'block',
          'zIndex': zIndex + 1
        });

        dom.setStyles('wf_select_button', {
          'top': y + p2.h / 2 - 16,
          'left': x + p2.w / 2 - 50,
          'display': 'block',
          'zIndex': zIndex + 1
        });

        // bind onchange event to input to trigger upload
        input.onchange = function () {
          if (input.files) {
            var file = input.files[0];

            if (file) {
              file.marker = marker;

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
            }
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

    function uploadFile(file) {
      uploadHandler(file, function (item) {
        if (file.uploader) {

          var obj = tinymce.extend({
            type: file.type,
            name: file.name
          }, item);

          selectAndInsert(file, obj);
        }

        // remove from list
        files.splice(tinymce.inArray(files, file), 1);

        if (file.marker) {
          ed.dom.remove(file.marker);
        }

      }, function (message) {
        ed.windowManager.alert(message);

        if (file.marker) {
          ed.dom.remove(file.marker);
        }
      }, function (value) {
        if (file.marker) {
          ed.dom.setAttrib(file.marker, 'data-progress', value);
        }
      });
    }

    return {
      plugins: plugins,
      upload: uploadHandler
    };
  });
})();