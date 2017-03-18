(function() {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event;

    function ucfirst(s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    tinymce.create('tinymce.plugins.SourcePlugin', {
        init: function(ed, url) {
            var self = this;
            self.editor = ed;

            if (ed.plugins.fullscreen) {
                ed.onFullScreen.add(function(ed, state) {
                    var element = ed.getElement();
                    var container = element.parentNode;

                    var header = DOM.getPrev(element, '.wf-editor-header');
                    var iframe = DOM.get(ed.id + '_editor_source_iframe');

                    // store the containerHeight as we go into fullscreen mode
                    if (state) {
                        if (!ed.settings.container_height) {
                            ed.settings.container_height = iframe.clientHeight;
                        }

                        var vp = DOM.getViewPort();
                        // set height as viewport - header - footer
                        DOM.setStyle(iframe, 'height', vp.h - header.offsetHeight - 30);
                        // set max-width as 100%
                        DOM.setStyle(iframe, 'max-width', '100%');
                    } else {
                        // revert height to stored value
                        DOM.setStyle(iframe, 'height', ed.settings.container_height - 30);
                        // revert max-width to stored value
                        DOM.setStyle(iframe, 'max-width', ed.settings.container_width || '100%');
                    }

                    var editor = iframe.contentWindow.SourceEditor;
                    // get iframe width and height
                    var w = iframe.clientWidth;
                    var h = iframe.clientHeight;
                    // resize
                    editor.resize(w, h);
                });

                ed.onFullScreenResize.add(function(ed, vp) {
                    var element = ed.getElement();
                    var header = DOM.getPrev(element, '.wf-editor-header');
                    var iframe = DOM.get(ed.id + '_editor_source_iframe');

                    DOM.setStyle(iframe, 'height', vp.h - header.offsetHeight - 30);
                });
            }

            ed.onSetContent.add(function(ed, o) {
                self.setContent(o.content, true);
            });

            ed.onInit.add(function(ed) {
                // get the stored active tab
                var activeTab = sessionStorage.getItem('wf-editor-tabs-' + ed.id);

                if (activeTab === "wf-editor-source") {
                    // hide editor
                    ed.hide();
                    // hide textarea
                    DOM.hide(ed.getElement());
                    // toggle source
                    self.toggle();
                }
            });
        },

        setContent: function(v) {
            var ed = this.editor;

            var iframe = DOM.get(ed.id + '_editor_source_iframe');

            if (iframe) {
                var editor = iframe.contentWindow.SourceEditor;

                if (editor) {
                    return editor.setContent(v);
                }
            }

            return false;
        },

        insertContent: function(v) {
            var ed = this.editor;

            var iframe = DOM.get(ed.id + '_editor_source_iframe');

            if (iframe) {
                var editor = iframe.contentWindow.SourceEditor;

                if (editor) {
                    return editor.insertContent(v);
                }
            }

            return false;
        },

        getContent: function() {
            var ed = this.editor;

            var iframe = DOM.get(ed.id + '_editor_source_iframe');

            // iframe has been created and source editor is visible
            if (iframe && !DOM.isHidden(ed.id + '_editor_source')) {
                var editor = iframe.contentWindow.SourceEditor;

                if (editor) {
                    return editor.getContent();
                }
            }

            return null;
        },

        hide: function() {
            DOM.hide(this.editor.id + '_editor_source');
        },

        save: function() {
            var ed = this.editor;
            var content = this.getContent();

            ed.setContent(content);

            return ed.save();
        },

        toggle: function() {
            var ed = this.editor;
            var self = this,
                s = ed.settings;

            var element = ed.getElement();
            var container = element.parentNode;

            // get tabs header
            var header = DOM.getPrev(element, '.wf-editor-header');

            var div = DOM.get(ed.id + '_editor_source');
            var iframe = DOM.get(ed.id + '_editor_source_iframe');
            var statusbar = DOM.get(ed.id + '_editor_source_resize');

            // get editor iframe height
            var ifrHeight = parseInt(DOM.get(ed.id + '_ifr').style.height) || s.height;

            var o = tinymce.util.Cookie.getHash("TinyMCE_" + ed.id + "_size");

            if (o && o.height) {
                ifrHeight = o.height;
            }

            // get content from textarea / div
            var content = tinymce.is(element.value) ? element.value : element.innerHTML;

            if (!div) {
                // create the container
                var div = DOM.add(container, 'div', {
                    role: 'textbox',
                    id: ed.id + '_editor_source',
                    'class': 'wf-editor-source defaultSkin'
                });

                if (s.skin !== 'default') {
                    DOM.addClass(div, s.skin + 'Skin');

                    if (s.skin_variant) {
                        DOM.addClass(div, s.skin + 'Skin' + ucfirst(s.skin_variant));
                    }
                }

                var query = ed.getParam('site_url') + 'index.php?option=com_jce';

                var args = {
                    'view': 'editor',
                    'layout': 'plugin',
                    'plugin': 'source',
                    'context': ed.getParam('context')
                };

                // set token
                args[ed.settings.token] = 1;

                // create query
                for (k in args) {
                    query += '&' + k + '=' + encodeURIComponent(args[k]);
                }

                var iframe = DOM.create('iframe', {
                    'frameborder': 0,
                    'scrolling': 'no',
                    'id': ed.id + '_editor_source_iframe',
                    'src': query
                });

                Event.add(iframe, 'load', function() {
                    var editor = iframe.contentWindow.SourceEditor;

                    var w = iframe.clientWidth;
                    var h = iframe.clientHeight;

                    editor.init({
                        'wrap': ed.getParam('source_wrap', true),
                        'linenumbers': ed.getParam('source_numbers', true),
                        'highlight': ed.getParam('source_highlight', true),
                        'theme': ed.getParam('source_theme', 'textmate'),
                        'format': ed.getParam('source_format', true),
                        'tag_closing': ed.getParam('source_tag_closing', true),
                        'selection_match': ed.getParam('source_selection_match', true),
                        'font_size': ed.getParam('source_font_size', ''),
                        'fullscreen': DOM.hasClass(container, 'mce-fullscreen'),
                        'load': function() {
                            DOM.removeClass(container, 'mce-loading');
                            editor.resize(w, h);
                        }
                    }, content);
                });

                var iframeContainer = DOM.add(div, 'div', {
                    'class': 'mceIframeContainer'
                });

                DOM.add(iframeContainer, iframe);

                // create statusbar
                statusbar = DOM.add(div, 'div', {
                    'id': ed.id + '_editor_source_statusbar',
                    'class': 'mceStatusbar mceLast'
                }, '<a tabindex="-1" class="mceResize" onclick="return false;" href="javascript:;" id="' + ed.id + '_editor_source_resize"></a>');

                var resize = DOM.get(ed.id + '_editor_source_resize');
                
                // add window resize / orientationchange
                /*Event.add(window, 'resize orientationchange', function() {
            		var p = ed.getContainer();
            		var ifrDoc = iframe.contentWindow.document,
                        editor = iframe.contentWindow.SourceEditor;
                        
                        var w = p.offsetWidth || p.clientWidth;
                        
                        if (w) {
                        	div.style.width = w + 'px';
            				editor.resize(w);
                        }
                });*/

                // cancel default click
                Event.add(resize, 'click', function(e) {
                    e.preventDefault();
                });

                // Resize source editor
                Event.add(resize, 'mousedown', function(e) {
                    var mm, mu, sx, sy, sw, sh, w, h;

                    var ifrDoc = iframe.contentWindow.document,
                        editor = iframe.contentWindow.SourceEditor;

                    e.preventDefault();
                    
                    function resizeTo(w, h) {
                    	w = Math.max(w, 300);
                    	h = Math.max(h, 200);
                    	
                    	iframe.style.maxWidth = w + 'px';
                        iframe.style.height = h + 'px';
                        container.style.maxWidth = w + 'px';

                        editor.resize(w, h);
                        
                        // pass through values
                        ed.settings.container_width 	= w;
                        ed.settings.container_height 	= h + statusbar.offsetHeight;
						
						// remove interface height if set                        
                        h = h - (ed.settings.interface_height || 0);
                        // resize editor
                        ed.theme.resizeTo(w, h);
                    }

                    function resizeOnMove(e) {
                        e.preventDefault();

                        w = sw + (e.screenX - sx);
                        h = sh + (e.screenY - sy);

                        resizeTo(w, h);

                        DOM.addClass(resize, 'wf-editor-source-resizing');
                    }

                    function endResize(e) {
                        e.preventDefault();

                        // Stop listening
                        Event.remove(DOM.doc, 'mousemove', mm1);
                        Event.remove(DOM.doc, 'mouseup', mu1);

                        Event.remove(ifrDoc, 'mousemove', mm2);
                        Event.remove(ifrDoc, 'mouseup', mu2);

                        w = sw + (e.screenX - sx);
                        h = sh + (e.screenY - sy);

                        resizeTo(w, h);

                        DOM.removeClass(resize, 'wf-editor-source-resizing');
                    }

                    if (DOM.hasClass(resize, 'wf-editor-source-resizing')) {
                        endResize(e);
                        return false;
                    }

                    // Get the current rect size
                    sx = e.screenX;
                    sy = e.screenY;

                    sw = w = container.offsetWidth;
                    sh = h = iframe.clientHeight;

                    // Register envent handlers
                    mm1 = Event.add(DOM.doc, 'mousemove', resizeOnMove);
                    mu1 = Event.add(DOM.doc, 'mouseup', endResize);

                    mm2 = Event.add(ifrDoc, 'mousemove', resizeOnMove);
                    mu2 = Event.add(ifrDoc, 'mouseup', endResize);
                });

            } else {
                DOM.show(div);
                var editor = iframe.contentWindow.SourceEditor;
                // get iframe width and height
                var w = iframe.clientWidth;
                var h = iframe.clientHeight;       
                // resize
                editor.resize(w, h);
                // set fullscreen state
                editor.setButtonState('fullscreen', DOM.hasClass(container, 'mce-fullscreen'));
                // set content
                editor.setContent(content, true);
                DOM.removeClass(container, 'mce-loading');
            }

            // get height from setting or session data or editor textarea
            var height = ed.settings.container_height || sessionStorage.getItem('wf-editor-container-height') || (ifrHeight + statusbar.offsetHeight);

            // get width from setting or session data or editor textarea
			var width = ed.settings.container_width || sessionStorage.getItem('wf-editor-container-width');
            
            if (DOM.hasClass(container, 'mce-fullscreen')) {
                var vp = DOM.getViewPort();
                height = vp.h - header.offsetHeight;
            }

            DOM.setStyle(iframe, 'height', height - statusbar.offsetHeight);
            
            var editor = iframe.contentWindow.SourceEditor;
            
            if (editor) {
            	editor.resize(width, height - statusbar.offsetHeight);
            }

            /*var width = ed.settings.container_width || sessionStorage.getItem('wf-editor-container-width');

            if (width && !DOM.hasClass(container, 'mce-fullscreen')) {
                DOM.setStyle(div, 'width', width);
            }*/
        }
    });

    // Register plugin
    tinymce.PluginManager.add('source', tinymce.plugins.SourcePlugin);
})();