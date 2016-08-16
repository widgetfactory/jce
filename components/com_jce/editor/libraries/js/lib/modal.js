(function($) {
  function calculateWidth (n, cw, ch) {
      var ww = $(n).width() - 60, wh = $(n).height(), wh = wh - 101;

      var scale = Math.min(ww / cw, wh / ch);

      cw =  Math.min(cw, Math.floor(cw * scale));

      $('.ui-modal-dialog', n).css('max-width', cw + 'px');
  }

  /**
   * Dialog Functions
   */
  $.Modal = {
      counter: 0,
      _uid: function (p) {
          return (!p ? 'wf_' : p) + (this.counter++);
      },
      dialog: function(title, data, options) {
        return this.open(title, options, data);
      },
      /**
       * Basic Dialog
       */
      open: function (title, options, data) {
          var div = document.createElement('div'), footer;

          options = $.extend({
              container: $('form').first().get(0) || 'body',
              classes: '',
              id: 'dialog' + this._uid(),
              open: $.noop,
              close: $.noop,
              beforeclose: $.noop,
              buttons: false,
              header: true,
              label : {'confirm' : $.Plugin.translate('yes', 'Yes'), 'cancel' : $.Plugin.translate('no', 'No')}
          }, options);

          if (options.onOpen) {
              options.open = options.onOpen;
          }

          if (options.onBeforeClose) {
              options.beforeclose = options.onBeforeClose;
          }

          if (options.onClose) {
              options.close = options.onClose;
          }

          // add classes to div
          $(div).addClass('ui-modal');

          // create modal
          var modal = $('<div class="ui-modal-dialog" />').appendTo(div);

          // add classes to modal
          $(modal).addClass(options.classes);

          if (options.width) {
              $(modal).width(options.width);
          }

          if (options.height) {
              $(modal).height(options.height);
          }

          // add close
          $(modal).append('<button type="button" class="ui-modal-close ui-close"></button>');

          if (options.header) {
              // add header
              $(modal).append('<div class="ui-modal-header"><h3>' + title + '</h3></div>');
          }

          // add body and data
          $('<div class="ui-modal-body ui-overflow-container" id="' + options.id + '" />').appendTo(modal).append(data);

          // add buttons
          if (options.buttons) {
              footer = $('<div class="ui-modal-footer ui-text-right" />');

              $.each(options.buttons, function (i, o) {
                  var btn = $('<button class="ui-button" />').click(function (e) {
                      e.preventDefault();

                      if ($.isFunction(o.click)) {
                          o.click.call(this, e);
                      }
                  });

                  if (o.type) {
                      $(btn).attr('type', o.type);
                  }

                  if (i > 0) {
                      $(btn).addClass('ui-margin-small-left');
                  }

                  // add text
                  if (o.text) {
                      $(btn).append('<span class="ui-text">' + o.text + '</span>');
                  }
                  // add icon
                  if (o.icon) {
                      $(btn).prepend('<i class="ui-button-' + o.icon + ' ' + o.icon + '" />&nbsp;');
                  }
                  // add classes
                  if (o.classes) {
                      $(btn).addClass(o.classes);
                  }
                  // add id
                  if (o.id) {
                      $(btn).attr('id', o.id);
                  }

                  $(footer).append(btn);
              });
          }

          // add footer
          $(modal).append(footer);

          // bind option events
          $(div).on('modal.open', function (ev) {
              options.open.call(this, ev);
          }).on('modal.close', function (e, ev) {
              options.beforeclose.call(this, ev);

              $(div).off('modal.open modal.close keyup.modal').removeClass('ui-open');

              $(window).off('keyup.modal');

              window.setTimeout(function () {
                  $(div).hide().detach();
              }, 500);

              options.close.call(this, ev);
          });

          // create click handler
          $('.ui-modal-close', div).click(function (e) {
              // hide
              $(div).trigger('modal.close', e);
              // cancel default behaviour
              e.preventDefault();
          });

          // close on ESC
          $(window).on('keyup.modal', function (e) {
              if (e.which === 27) {
                  // hide
                  $(div).trigger('modal.close');
                  // cancel default behaviour
                  e.preventDefault();
              }
          });

          // submit on enter
          $(window).on('keyup.modal', function (e) {
              if (e.which === 13) {
                  $('button[type="submit"]', div).click();
                  // hide
                  $(div).trigger('modal.close');
                  // cancel default behaviour
                  e.preventDefault();
              }
          });

          // create modal
          $(div).appendTo(options.container);

          // show modal
          $(div).show().scrollTop(0);

          $(div).addClass('ui-open').trigger('modal.open').attr('aria-hidden', false);

          $(div).on('modal.asset-loaded', function() {
            $(modal).css('top', ($(div).height() - $(modal).outerHeight()) / 2);
          }).delay(10).trigger('modal.asset-loaded');

          // return modal div element
          return div;
      },

      /**
       * Confirm Dialog
       */
      confirm: function (s, cb, options) {
          var state = false, html = '<p>' + s + '</p>';

          options = $.extend(true, {
            'label' : {
              'confirm': $.Plugin.translate('yes', 'Yes'),
              'cancel' : $.Plugin.translate('cancel', 'Cancel')
          }}, options);

          options = $.extend(true, {
              'classes': 'ui-modal-confirm',
              buttons: [{
                  type: 'submit',
                  text: options.label.confirm,
                  icon: 'ui-icon-check',
                  classes: 'ui-button-primary ui-modal-close',
                  click: function (e) {
                      cb.call(this, true);
                  }
              }, {
                  text: options.label.cancel,
                  icon: 'ui-icon-close',
                  classes: 'ui-modal-close',
                  click: function () {
                      cb.call(this, false);
                  }
              }]
          }, options || {});

          return $.Modal.open($.Plugin.translate('confirm', 'Confirm'), options, html);
      },
      /**
       * Alert Dialog
       */
      alert: function (s, options) {
          var html = '<p>' + s + '</p>';

          options = $.extend({'label' : {'confirm' : $.Plugin.translate('ok', 'Ok')}}, options);

          options = $.extend({
              'classes': 'ui-modal-alert',
              buttons: [{
                  type: 'submit',
                  text: options.label.confirm ,
                  classes: 'ui-modal-close'
              }]
          }, options || {});

          return $.Modal.open($.Plugin.translate('alert', 'Alert'), options, html);
      },
      /**
       * Prompt Dialog
       */
      prompt: function (title, options) {
          var html = '<div class="ui-form-row">';

          options = $.extend(true, {
            'id' : 'dialog-prompt',
            'value' : '',
            'text' : '',
            'multiline' : false,
            'elements' : '',
            'label' : {
              'confirm': $.Plugin.translate('ok', 'OK'),
              'cancel' : $.Plugin.translate('cancel', 'Cancel')
          }}, options);

          if (options.text) {
              html += '<label class="ui-form-label ui-width-3-10" for="' + options.id + '">' + options.text + '</label><div class="ui-form-controls ui-width-7-10 ui-margin-remove">';
          } else {
              html += '<div class="ui-form-controls ui-width-1-1 ui-margin-remove">';
          }

          if (options.multiline) {
              html += '<textarea id="' + options.id + '-input" required>' + options.value + '</textarea>';
          } else {
              html += '<input id="' + options.id + '-input" type="text" value="' + options.value + '" />';
          }

          html += '</div>';
          html += '</div>';

          if (options.elements) {
              html += options.elements;
          }

          options = $.extend(true, {
              'classes': 'ui-modal-prompt',
              buttons: [{
                  type: 'submit',
                  text: options.label.confirm,
                  icon: 'ui-icon-check',
                  classes: 'ui-button-primary',
                  click: function (e) {
                      if ($.isFunction(options.confirm)) {
                          var args = [], $inp = $('#' + options.id + '-input'), v = $inp.val();

                          if (options.elements) {
                              $(':input', '#' + options.id).not($inp).each(function () {
                                  args.push($(this).val());
                              });
                          }

                          options.confirm.call(this, v, args);
                      }

                      if (options.close_on_confirm !== false) {
                        $(e.target).parents('.ui-modal').trigger('modal.close');
                      }
                  }
              }],
              open: function () {
                  var n = document.getElementById(options.id + '-input');

                  if (n) {
                    // set timeout to trigger after transition
                    setTimeout(function() {
                      // focus element
                      n.focus();

                      // fix cursor position in Firefox
                      if (n.nodeName === "INPUT" && n.setSelectionRange && n.value) {
                        n.setSelectionRange(n.value.length, n.value.length);
                      }
                    }, 350);
                  }
              }

          }, options);

          return $.Modal.open(title, options, html);
      },
      /**
       * Upload Dialog
       */
      upload: function (options) {
          var div = $('<div />').attr('id', 'upload-body').append(
              '<div id="upload-queue-block" class="ui-placeholder">' +
              '   <div id="upload-queue"></div>' +
              '   <input type="file" size="40" />' +
              '</div>' +
              '<div id="upload-options" class="ui-placeholder"></div>'
          );

          // add optional fields
          $('#upload-options').append(options.elements);

          // create backup function
          options.upload = options.upload || $.noop;

          options = $.extend({
              'classes': 'ui-modal-dialog-large ui-modal-upload',
              resizable: false,
              buttons: [{
                  text: $.Plugin.translate('browse', 'Add Files'),
                  id: 'upload-browse',
                  icon: 'ui-icon-search',
                  classes: 'ui-button-success'
              }, {
                  text: $.Plugin.translate('upload', 'Upload'),
                  click: function() {
                      return options.upload.call();
                  },
                  id: 'upload-start',
                  icon: 'ui-icon-cloud-upload',
                  classes: 'ui-button-primary'
              }, {
                  text: $.Plugin.translate('close', 'Close'),
                  icon: 'ui-icon-close',
                  classes: 'ui-modal-close ui-hidden-small',
              }]
          }, options);

          return $.Modal.open($.Plugin.translate('upload', 'Upload'), options, div);
      },
      /**
       * IFrame Dialog
       */
      iframe: function (name, url, options) {
          var div = document.createElement('div');

          function calculateWidth (n) {
              var ph = $('.ui-modal-dialog', n).outerHeight(), wh = $(n).height();

              // content width
              var cw = $('.ui-modal-body', n).width();

              // content height
              var ch = $('.ui-modal-body', n).height();

              // calculate height of popup container without content
              var mh = ph - $('.ui-modal-body', n).height();

              // get popup height with content included
              ph = mh + ch;

              cw = Math.min(cw, Math.floor(cw * Math.min(wh / ph, 1)));

              $('.ui-modal-dialog', n).css('max-width', cw - 20 + 'px');
          }

          var w = options.width, h = options.height;

          options = $.extend({
              'classes': 'ui-modal-dialog-large ui-modal-preview',
              open: function (e) {
                  var iframe = document.createElement('iframe');

                  $(div).addClass('loading');

                  $(iframe).attr({
                      'src': url,
                      'scrolling': 'auto',
                      'frameborder': 0
                  }).load(function () {
                      if ($.isFunction(options.onFrameLoad)) {
                          options.onFrameLoad.call(this);
                      }

                      $(div).removeClass('loading');
                  });

                  $(div).addClass('iframe-preview').append(iframe);

                  calculateWidth(e.target, w, h);
              }

          }, options);

          var name = name || $.Plugin.translate('preview', 'Preview');

          return $.Modal.open(name, options, div);
      },
      /**
       * Media Dialog
       */
      media: function (name, url, options) {
          var self = this;
          options = options || {};

          var w, h;
          var div = document.createElement('div');

          $.extend(options, {
              'classes': 'ui-modal-dialog-large ui-modal-preview',
              open: function (e) {
                  // image
                  if (/\.(jpg|jpeg|gif|png)/i.test(url)) {
                      $(div).addClass('image-preview loading');

                      var img = new Image(), loaded = false;

                      img.onload = function () {
                          if (loaded) {
                              return false;
                          }

                          w = img.width, h = img.height;

                          $('.image-preview').removeClass('loading').append('<img src="' + url + '" alt="' + $.String.basename(url) + '" />').parent().css('max-width', w + 'px');

                          loaded = true;

                          calculateWidth(e.target, w, h);

                          $('.image-preview').click(function(e) {
                              $(e.target).trigger('modal.close', e);
                          });

                          $('.ui-modal').trigger('modal.asset-loaded');
                      };

                      img.src = url + (/\?/.test(url) ? '&' : '?') + new Date().getTime();

                      // pdf (only for Firefox really)
                  } else if (/\.pdf$/i.test(url)) {
                      $(div).addClass('media-preview loading');

                      if ($.support.pdf) {
                          $(div).html('<object data="' + url + '" type="application/pdf"></object>').removeClass('big-loader');
                      } else {
                          $(div).html('<iframe src="' + url + '" frameborder="0"></iframe>').removeClass('big-loader');
                      }

                      $('iframe, object', div).on('load', function () {
                          calculateWidth(e.target, w, h);

                          $('.ui-modal').trigger('modal.asset-loaded');
                      });
                  } else {
                      $(div).addClass('media-preview loading');

                      var mediaTypes = {
                          // Type, clsid, mime types,
                          // codebase
                          "flash": {
                              classid: "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",
                              type: "application/x-shockwave-flash",
                              codebase: "http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0"
                          },
                          "shockwave": {
                              classid: "clsid:166b1bca-3f9c-11cf-8075-444553540000",
                              type: "application/x-director",
                              codebase: "http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab#version=8,5,1,0"
                          },
                          "windowsmedia": {
                              classid: "clsid:6bf52a52-394a-11d3-b153-00c04f79faa6",
                              type: "application/x-mplayer2",
                              codebase: "http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=5,1,52,701"
                          },
                          "quicktime": {
                              classid: "clsid:02bf25d5-8c17-4b23-bc80-d3488abddc6b",
                              type: "video/quicktime",
                              codebase: "http://www.apple.com/qtactivex/qtplugin.cab#version=6,0,2,0"
                          },
                          "divx": {
                              classid: "clsid:67dabfbf-d0ab-41fa-9c46-cc0f21721616",
                              type: "video/divx",
                              codebase: "http://go.divx.com/plugin/DivXBrowserPlugin.cab"
                          },
                          "realmedia": {
                              classid: "clsid:cfcdaa03-8be4-11cf-b84b-0020afbbccfa",
                              type: "audio/x-pn-realaudio-plugin"
                          },
                          "java": {
                              classid: "clsid:8ad9c840-044e-11d1-b3e9-00805f499d93",
                              type: "application/x-java-applet",
                              codebase: "http://java.sun.com/products/plugin/autodl/jinstall-1_5_0-windows-i586.cab#Version=1,5,0,0"
                          },
                          "silverlight": {
                              classid: "clsid:dfeaf541-f3e1-4c24-acac-99c30715084a",
                              type: "application/x-silverlight-2"
                          },
                          "video": {
                              type: 'video/mp4'
                          },
                          "audio": {
                              type: 'audio/mp3'
                          }
                      };

                      var mimes = {};

                      // Parses the default mime types
                      // string into a mimes lookup
                      // map
                      (function (data) {
                          var items = data.split(/,/),
                                  i, y, ext;

                          for (i = 0; i < items.length; i += 2) {
                              ext = items[i + 1].split(/ /);

                              for (y = 0; y < ext.length; y++)
                                  mimes[ext[y]] = items[i];
                          }
                      })("application/x-director,dcr," + "application/x-mplayer2,wmv wma avi," + "video/divx,divx," + "application/x-shockwave-flash,swf swfl," + "audio/mpeg,mpga mpega mp2 mp3," + "audio/ogg,ogg spx oga," + "audio/x-wav,wav," + "video/mpeg,mpeg mpg mpe," + "video/mp4,mp4 m4v," + "video/ogg,ogg ogv," + "video/webm,webm," + "video/quicktime,qt mov," + "video/x-flv,flv," + "video/vnd.rn-realvideo,rv," + "video/3gpp,3gp," + "video/x-matroska,mkv");

                      var ext = $.String.getExt(url);
                      var mt = mimes[ext];
                      var type, props;

                      $.each(
                              mediaTypes, function (k, v) {
                                  if (v.type && v.type == mt) {
                                      type = k;
                                      props = v;
                                  }
                              });

                      // video types
                      if (/^(mp4|m4v|og(g|v)|webm)$/i.test(ext)) {
                          type = 'video';
                          props = {
                              type: mt
                          };
                      }

                      // audio types
                      if (/^(mp3|oga)$/i.test(ext)) {
                          type = 'audio';
                          props = {
                              type: mt
                          };
                      }

                      // flv
                      if (/^(flv|f4v)$/i.test(ext)) {
                          type = 'flv';
                          props = {};
                      }

                      var swf = $.Plugin.getURI(true) + 'components/com_jce/editor/libraries/mediaplayer/mediaplayer.swf';

                      if (type && props) {
                          switch (type) {
                              case 'audio':
                              case 'video':
                                  var fb, ns = '<p style="margin-left:auto;">' + $.Plugin.translate('media_not_supported', 'Media type not supported by this browser') + '</p>';

                                  var support = {
                                      video: {
                                          'h264': ['mp4', 'm4v'],
                                          'webm': ['webm'],
                                          'ogg': ['ogv', 'ogg']
                                      },
                                      audio: {
                                          'mp3': ['mp3'],
                                          'ogg': ['oga', 'ogg']
                                      }
                                  }
                                  var hasSupport = false;

                                  for (var n in support[type]) {
                                      if (support[type][n].indexOf(ext) !== -1) {
                                          hasSupport = $.support[type] && $.support[type][n] !== false;
                                      }
                                  }

                                  // HTML5 video
                                  if (hasSupport) {
                                      if (type == 'video') {
                                          $(div).append('<video autoplay="autoplay" controls="controls" preload="none" type="' + props.type + '" src="' + url + '"></video>');
                                      } else {
                                          $(div).append('<audio autoplay="autoplay" controls="controls" preload="none" type="' + props.type + '" src="' + url + '"></audio>');
                                      }
                                  } else if (/^m(p3|p4|4v)$/i.test(ext)) {
                                      url = $.URL.toAbsolute(url);

                                      $(div).html('<object type="application/x-shockwave-flash" data="' + swf + '"><param name="movie" value="' + swf + '" /><param name="flashvars" value="controls=true&autoplay=true&src=' + url + '" /></object>');

                                      if (ext == 'mp3') {
                                          $('object', div).addClass('audio');
                                      }
                                  } else {
                                      $(div).html(ns).removeClass('loading');
                                  }

                                  break;
                              case 'flv':
                                  url = $.URL.toAbsolute(url);

                                  $(div).append('<object type="application/x-shockwave-flash" data="' + swf + '"><param name="movie" value="' + swf + '" /><param name="flashvars" value="controls=true&autoplay=true&src=' + url + '" /></object>');
                                  break;
                              case 'flash':
                                  $(div).append('<object type="' + props.type + '" data="' + url + '"><param name="movie" value="' + url + '" /></object>');
                                  break;
                              default:
                                  $(div).append('<object classid="' + props.classid + '"><param name="src" value="' + url + '" /><embed src="' + url + '" type="' + props.type + '"></embed></object>');
                                  break;
                          }

                          $('iframe, object, embed, video, audio', div).on('load loadedmetadata', function () {
                              $(div).removeClass('loading');

                              calculateWidth(e.target, w, h);

                              $('.ui-modal').trigger('modal.asset-loaded');
                          });
                      }
                  }

                  calculateWidth(e.target, w, h);
              }
          });

          return $.Modal.open($.Plugin.translate('preview', 'Preview') + ' - ' + name, options, div);
      }
  };

  $.Dialog = $.Modal;
})(jQuery);
