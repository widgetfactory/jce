/* eslint-disable consistent-this */
/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global tinyMCEPopup, jQuery, Wf */

(function ($, Wf, undef) {
    var mimeTypes = {};

    // Parses the default mime types string into a mimes lookup map
    (function (data) {
        var items = data.split(","),
            i, y, ext;

        for (i = 0; i < items.length; i += 2) {
            ext = items[i + 1].split("|");
            for (y = 0; y < ext.length; y++) {
                mimeTypes[ext[y]] = items[i];
            }
        }
    })(
        "video,flv|mp4|m4v|webm|ogg|ogv|mov|wmv|avi," +
        "audio,mp3|ogg|oga|webm|m4a," +
        "image,jpg|jpeg|apng|png|gif|png|svg|bmp|tiff|webp," +
        "text,txt|htm|html," +
        "word,doc|docx|dot|dotx," +
        "excel,xls|xlsx," +
        "powerpoint,ppt|pptx," +
        "zip,rar|zip|tar|gz," +
        "code,html|htm|xml," +
        "text,txt|rtf|csv"
    );

    // get mimetype from lookup map
    function getMimeType(ext) {
        ext = ext.toLowerCase();

        ext = $.trim(ext);

        return mimeTypes[ext] || ext;
    }

    // list of events to stop scoll animation on
    var scrollEvents = 'click.scroll mousedown.scroll wheel.scroll mousewheel.scroll keyup.scroll touchmove.scroll';

    var FileBrowser = function (element, options) {
        this.element = element;

        // set some variables

        $.extend(this, {
            _actions: {},
            _buttons: {
                'folder': {},
                'file': {}
            },
            _modal: [],
            // Returned items array
            _returnedItems: [],
            // 'Clipboard'
            _pasteitems: '',
            _pasteaction: '',
            // List limits
            _limitcount: 0,
            _limitend: 0
        });

        // set options to global
        this.options = FileBrowser.options;

        this.setOptions(options);

        // initialise
        this._init();

        // target element that triggered the current action
        this.actionTarget = null;
    };

    // Global options object - can be set externally
    FileBrowser.options = {
        // base url (used by external filesystems)
        base: '',
        // base dir
        dir: 'images',
        // source folder
        source: '',
        actions: null,
        buttons: null,
        folder_tree: true,
        details: true,
        search: true,
        upload: {
            max_size: 1024,
            filetypes: "*",
            overwrite: true,
            limit: 0,
            dialog: {},
            elements: null,
            buttons: {}
        },
        folder_new: {
            dialog: null
        },
        rename: {
            dialog: null
        },
        viewable: 'jpeg,jpg,gif,png,webp,avi,wmv,wm,asf,asx,wmx,wvx,mov,qt,mpg,mp3,mp4,m4v,mpeg,ogg,ogv,webm,swf,flv,f4v,xml,dcr,rm,ra,ram,divx,html,htm,txt,rtf,pdf,doc,docx,xls,xlsx,ppt,pptx',
        list_limit: 0,
        view_mode: 'list',
        expandable: true,
        websafe_mode: 'utf-8',
        websafe_spaces: false,
        websafe_textcase: '',
        date_format: '%d/%m/%Y, %H:%M',
        allow_download: false,
        use_state_cookies: true
    };

    FileBrowser.prototype = {

        /**
         * Shortcut function for event triggering
         * @param {string} ev Event name
         * @param {Mixed} args Arguments
         * @returns {void}
         */
        _trigger: function (ev, args) {
            $(this.element).trigger('filebrowser:' + ev.toLowerCase(), args);
        },

        setOptions: function (options) {
            this.options = $.extend(this.options, options);
        },

        getOptions: function () {
            return this.options;
        },

        /**
         * Initialize the filebrowser
         * @returns {void}
         */
        _init: function (options) {
            var self = this;

            // extend options with passed in values
            this.options = $.extend(this.options, options);

            // bind events - legacy
            $.each(this.options, function (k, v) {
                // bind event from options
                if (typeof v === "function") {
                    $(self.element).on('filebrowser:' + k.toLowerCase(), v);
                    // remove from options list
                    delete self.options[k];
                }
            });

            // Create Actions and Button
            this._addActions(this.options.actions);
            this._addButtons(this.options.buttons);

            // Build file and folder lists
            var list = document.createElement('ul');

            $(list).addClass('item-list').attr({
                'id': 'item-list',
                'role': 'listbox'
            }).on('click.item-list', function (e) {
                var n = e.target,
                    p = n.parentNode;

                if ($(n).hasClass('ui-sortable-handle')) {
                    return;
                }

                // move to parent if target is span or i (size, date, thumbnail)
                if ($(n).is('.uk-icon, span, a, img')) {
                    n = $(n).parents('li').get(0);
                }

                // set target element
                self.actionTarget = n;

                if (n.nodeName === "LI") {
                    if ($(n).hasClass('folder')) {
                        var u = $(n).data('url') || self._getPreviousDir();

                        e.preventDefault();

                        return self._changeDir(u);
                    }

                    // bail before preventDefault
                    if (e.altKey && $(n).find('a[download]').length) {
                        return true;
                    }

                    // set target to node
                    e.target = n;

                    self._setSelectedItems(e, true);

                    // get serialized object
                    self.serializeItemData(n).then(function (data) {
                        // trigger event
                        self._trigger('onFileClick', [n, data]);
                    });

                    e.preventDefault();

                    return true;
                }

                if (n.nodeName === "INPUT") {
                    if ($(n).is(':checked')) {
                        // set target to node
                        e.target = n;
                        // set selection
                        self._setSelectedItems(e, true);
                    } else {
                        self._removeSelectedItems([p.parentNode], true);
                    }

                    p = $(n).parents('li');

                    // get serialized object
                    self.serializeItemData(p).then(function (data) {
                        data.state = $(n).is(':checked');

                        // trigger event
                        self._trigger('onFileToggle', [p, data]);
                    });

                    return true;
                }
            }).on('dblclick.item-list', function (e) {
                var n = e.target;

                // move to parent if target is span or i (size, date, thumbnail)
                n = $(n).parents('li').get(0);

                if ($(n).hasClass('folder')) {
                    e.preventDefault();
                    return false;
                }

                // get serialized object
                self.serializeItemData(n).then(function (data) {
                    // trigger event
                    self._trigger('onFileInsert', [n, data]);
                });

                e.preventDefault();
                return false;
            }).on('keydown.item-list', function (e) {
                switch (e.which) {
                    case 13:
                        // get currently selected item
                        var n = $('li.selected:last', '#item-list').get(0);

                        if (!n) {
                            return;
                        }

                        // set target element
                        self.actionTarget = n;

                        var p = $(n).parents('li');

                        if ($(n).hasClass('folder')) {
                            var u = $(p).data('url') || self._getPreviousDir();
                            return self._changeDir(u);
                        } else {
                            self._setSelectedItems(e, true);

                            self.serializeItemData(n).then(function (data) {
                                self._trigger('onFileClick', [n, data]);
                            });
                        }

                        break;
                    case 38:
                    case 40:
                        self._setSelectedItems(e);
                        break;
                }

                e.preventDefault();
            });

            $('.folder-up', '#browser').on('click', function (e) {
                e.preventDefault();

                // reset target element
                self.actionTarget = null;

                var u = self._getPreviousDir();
                return self._changeDir(u);
            });

            // update browser list on scroll
            $('#browser-list').append(list).on('scroll.browser-list', function (e) {
                self._updateList();
            });

            // Item details navigation
            $('.details-nav-left, .details-nav-right', '#browser-details-nav').on('click', function (e) {
                var $item = $('li.selected.active', '#item-list').removeClass('active');

                if ($(this).hasClass('details-nav-left')) {
                    $item.prevAll('li.selected:first').addClass('active');
                }

                if ($(this).hasClass('details-nav-right')) {
                    $item.nextAll('li.selected:first').addClass('active');
                }

                e.preventDefault();

                self._showItemDetails();
            });

            var list_limit = self._getState('limit', this.options.list_limit, function (val) {
                return !/([0125]+)/.test(val) === false;
            });

            // Set list limit selection
            $('#browser-list-limit-select').val(list_limit);

            $('#browser-list-limit-select').on('change', function () {
                self._limitcount = 0;

                self._setState('limit', $(this).val());

                self.refresh();
            });

            // Browser list navigation
            $('ul li', '#browser-list-limit').on('click', function (e) {
                e.preventDefault();

                var x = 0,
                    count = self._limitcount,
                    limit = parseInt(self._limit, 10);

                if ($(this).hasClass('limit-left')) {
                    x = count - limit;
                }

                if ($(this).hasClass('limit-right')) {
                    x = count + limit;
                }

                if ($(this).hasClass('limit-right-end')) {
                    x = count = self._limitend;
                }

                self._limitcount = x;

                self.refresh();
            });

            // Check All checkbox
            $('input[type="checkbox"]', '#check-all').on('click', function (e) {
                var el = e.target;

                var s = $(el).is(':checked');

                $('input[type="checkbox"]', '#browser-list').prop('checked', !!s);

                if (s) {
                    self._selectItems($('li', '#browser-list').not('.folder-up'), true);
                } else {
                    // remove all selections
                    self._deselectItems();
                }
            });

            // setup list sorting
            this._setupListSort();

            // Show / hide search icon
            $('#block-search-icon').toggle(this.options.search);

            // show details button only if folder tree enabled and details enabled
            $('#show-details').toggle(this._treeLoaded());

            $('#show-search').on('click', function () {
                $('#searchbox').toggleClass('uk-hidden').attr('aria-hidden', function () {
                    return $(this).hasClass('uk-hidden');
                });

                $(this).toggleClass('uk-active');

                if ($(this).hasClass('uk-active')) {
                    $('#search').trigger('focus');
                }
            });

            $('#search + .uk-icon').on('click', function () {
                $('#search').trigger('focus');
            });

            $('body').on('click', function (e) {
                if ($('#searchbox').hasClass('uk-hidden')) {
                    return;
                }

                if ($(e.target).is('#searchbox, #search, #show-search, #show-search .uk-icon-search, #search + .uk-icon')) {
                    return;
                }

                $('#show-search').removeClass('uk-active');

                $('#searchbox').addClass('uk-hidden').attr('aria-hidden', true);
            });

            // Searchables
            $('#search').listfilter({
                list: '#item-list',
                selector: 'li',
                clear: '#search + .uk-icon'
            }).on('listfilter:find', function (ev, s) {
                var el = this;

                /*var limit = $('#browser-list-limit-select').val();

                // store the limit
                if (limit) {
                    self._setState('limit', limit);
                }*/

                /*
                // if we are not showing all items, get filtered list from server
                var limit = $('#browser-list-limit-select').val();
                var count = self._foldercount + self._filecount;

                // if we are not showing all items, get filtered list from server
                if (limit == 0 || parseInt(limit) > count) {
                    return $(this).trigger('listfilter:filter', s);
                }*/

                if (s) {
                    var prefix = "";

                    // check if we are searching by extension
                    if (s.charAt(0) === ".") {
                        s = s.substr(1);
                        prefix = ".";
                    }

                    // show loading message
                    self._setLoader();

                    $('#browser-list').one('load.filter', function () {
                        $(el).trigger('listfilter:found', [null, $('li.file', '#item-list').get()]);
                    });

                    // reset limit
                    //$('#browser-list-limit-select').prop('disabled', true).val(0);

                    self._reset();

                    // store query
                    self._searchQuery = prefix + s;

                    self._getList('', self._searchQuery);

                } else {
                    self._searchQuery = '';
                    self.refresh();
                }

                return true;
            }).on('listfilter:clear', function (ev) {
                /*var limit = self._getState('limit', self.options.list_limit, function (val) {
                    return !/([0125]+)/.test(val) === false;
                })
    
                // Set list limit selection
                $('#browser-list-limit-select').prop('disabled', false).val(limit);*/

                // clear search query
                self._searchQuery = '';
                self.refresh();
            });

            // Setup refresh button
            $('#refresh').on('click', function (e) {
                self.refresh(e);
            }).on('button:refresh', function (e, state) {
                if (state) {
                    $('.uk-icon', this).addClass('uk-icon-spinner');
                    $(this).prop('disabled', true);
                } else {
                    $('.uk-icon', this).removeClass('uk-icon-spinner');
                    $(this).prop('disabled', false);
                }
            });

            var showDetails = this._getState('details', 0, function (val) {
                val = parseInt(val, 10);
                return val === 0 || val === 1;
            });

            // show details view (hide tree)
            if (parseInt(showDetails, 10) || !this._treeLoaded()) {
                $('#show-details').removeClass('uk-active');
                $('main').addClass('uk-tree-hidden');
            } else {
                $('#show-details').addClass('uk-active');
                $('main').removeClass('uk-tree-hidden');
            }

            // Details button
            $('#show-details:visible').on('click', function (e) {
                $(this).toggleClass('uk-active');
                $('main').toggleClass('uk-tree-hidden');

                self._setState('details', $('main').hasClass('uk-tree-hidden') ? 1 : 0);
            });

            if (this.options.expandable) {
                $('#browser').addClass('expandable');

                $('#layout-full-toggle').on('click', function () {
                    $('#browser').toggleClass('full-height');
                    self._trigger($('#browser').hasClass('full-height') ? 'onMaximise' : 'onMinimise');
                });
            }

            // set scrollEvents cancel
            $('#browser-list').on(scrollEvents, function () {
                $(this).stop();
            });

            // setup directory
            this._setupDir();

            // trigger init
            this._trigger('onInit', this);
        },

        _updateList: function () {
            var self = this;
            // get visible area
            var top = $('#browser-list').scrollTop(), area = $('#browser-list').height() + top;

            $('.file.jpg, .file.jpeg, .file.png, .file.gif, .file.bmp', '#item-list').not('[data-width]').each(function () {
                // get item position
                var pos = $(this).position();

                if (pos.top < area) {
                    self._getDimensions(this);
                }
            });
        },

        /**
         * Get the height of the dilaog interface.
         */
        _getInterfaceHeight: function () {
            // get the base interface height, ie: everything - the file browser
            var ih = Math.max(0, Math.round($('#browser').offset().top) - 5);

            // get parent form element
            var p = $('#browser').parent('form');

            if ($(p).next(':not(div.actionPanel)').length) {
                ih = (Math.round($('div.actionPanel').offset().top) - 10) - $('#browser').innerHeight();
            }

            return ih;
        },

        /**
         * Resize the browser window
         * @param {String} Interface height.
         */
        resize: function (ih, init) {
            /*var fh = $('#browser').hasClass('full-height'), ih = ih || this._getInterfaceHeight();

            var ap = Math.round($('div.actionPanel').offset().top) - 10;

            $('#browser').css({
                width: $('body').width()
            });*/

            //var bh = (fh ? ap : ap - ih) - $('#browser').innerHeight();

            /*$('#browser-tree, #tree-body, #browser-list, #browser-details, #browser-details~div.spacer, #browser-buttons').height(function (i, v) {
                return v + bh;
            });*/

        },

        /**
         * Translate a string. Wrapper for $.Plugin translate function
         * @param {String} Language key
         * @param {String} Default value
         */
        _translate: function (s, ds) {
            return Wf.translate(s, ds);
        },

        /**
         * Setup list sorting for item list
         */
        _setupListSort: function () {
            var self = this;
            // Sortables

            // get the sort value from a cookie
            this._sortValue = this._getState('sort', '', function (val) {
                return /[a-z-]+/.test(val);
            });

            /*$('#item-list').listsort({
                fields: {
                    '#sort-ext': {
                        attribute: 'title',
                        selector: 'li.file'
                    },
                    '#sort-name': {
                        attribute: 'title',
                        selector: ['li.folder:not(.folder-up)', 'li.file']
                    },
                    '#sort-date': {
                        attribute: 'data-modified',
                        selector: ['li.folder:not(.folder-up)', 'li.file']
                    },
                    '#sort-size': {
                        attribute: 'data-size',
                        selector: 'li.file'
                    }
                }
            }).on('listsort:sort', function (e, args) {
                self._trigger('onListSort');

                var direction = '';

                if (args.direction == 'asc') {
                    direction = '-';
                } else {
                    direction = '';
                }

                var type = 'name';

                if (args.type == 'string') {
                    type = 'name'
                }

                if (args.type == 'number') {
                    type = 'size'
                }

                self._sortValue = direction + type;

                // store in a cookie
                self._setState('sort', self._sortValue);

                if (self._limit > 0) {
                    return self.refresh();
                }
            });*/

            $('#sort-ext, #sort-name, #sort-date, #sort-size').on('click', function () {
                // reset all
                $(this).siblings('.asc, .desc').removeClass('desc').addClass('asc');

                var direction = '';

                if ($(this).hasClass('asc')) {
                    $(this).removeClass('asc').addClass('desc');
                    direction = '-';
                } else {
                    $(this).removeClass('desc').addClass('asc');
                    direction = '';
                }

                // get value
                var type = $(this).data('sort');

                self._sortValue = direction + type;

                // store in a cookie
                self._setState('sort', self._sortValue);

                self.refresh();

            }).addClass(function () {
                if (this.id.indexOf(self._sortValue) === -1) {
                    return 'asc';
                }

                if (self._sortValue && self._sortValue.charAt(0) === '-') {
                    return 'desc';
                }

                return 'asc';
            });
        },

        /**
         *Check if the path is local and /or a valid local file url
         */
        _validatePath: function (s) {
            function _toUnicode(c) {
                c = c.toString(16).toUpperCase();

                while (c.length < 4) {
                    c = '0' + c;
                }

                return '\\u' + c;
            }

            // contains .. or is not local
            if (/\.{2,}/.test(s) || (/:\/\//.test(s) && s.indexOf(Wf.getURI(true)) == -1)) {
                return false;
            }

            // make relative if an absolute local file
            if (/:\/\//.test(s)) {
                s = Wf.URL.toRelative(s);
            }

            // contains non-standard characters
            if (/[^\w\.\-\s \/]/i.test(s)) {
                for (var i = 0, ln = s.length; i < ln; i++) {
                    var ch = s[i];
                    // only process on possible restricted characters or utf-8 letters/numbers
                    if (/[^\w\.\-\s \/]/i.test(ch)) {
                        // return false on character less than 127, eg: &?@* etc.
                        if (_toUnicode(ch.charCodeAt(0)) < '\\u007F') {
                            return false;
                        }
                    }
                }
            }

            return true;
        },

        _trimPath: function (path) {
            // convert to string
            path = '' + path;
            return path.replace(/^\//, '').replace(/\/$/, '');
        },

        _cleanPath: function (path) {
            if (path) {
                // make relative
                if (new RegExp(':\/\/').test(path)) {
                    path = Wf.URL.toRelative(path);
                }

                // remove slashes
                path = this._trimPath(path);

                // get dir if file (relative to site url)
                if (/\.([a-z0-9]{2,}$)/i.test(path)) {
                    path = Wf.String.dirname(path);
                    path = path.replace(new RegExp(this.options.dir), '').replace(/^[\/\\]+/, '');
                }
            }
            return path;
        },

        /**
         * Set up the base directory
         * @param {String} src The base url
         */
        _setupDir: function () {
            var self = this, dir = '';

            // get the file src from the widget element
            var src = this.options.source || $(this.element).val();

            var base = this.options.base;

            // check for and remove base (external filesystems)
            if (src && base) {
                if (src.indexOf(base) === 0) {
                    // remove base
                    src = src.substr(base.length + 1);
                }
            }

            // convert &amp; and ? to &
            src = src.replace(/(&amp;|\?)/g, '&');

            // remove query etc.
            if (src.indexOf('&') !== -1) {
                src = src.substr(0, src.indexOf('&'));
            }

            // remove slashes
            src = this._trimPath(src);

            // invalid src or not a local file resource
            if (!this._validatePath(src)) {
                src = '';
            }

            // get directory from cookie
            if (!src) {
                dir = this._getState('dir', '', function (val) {
                    return val && self._validatePath(val);
                });
            }

            if (!this._validatePath(dir)) {
                dir = '';
            }

            // store directory
            this._setDir(Wf.String.encodeURI(dir));

            // make sure its relative
            if (src && /:\/\//.test(src)) {
                src = Wf.URL.toRelative(src);
            }

            // set loading status
            this.setStatus({
                message: this._translate('loading', 'Loading...'),
                state: 'load'
            });

            if (this._treeLoaded()) {
                // Initialize tree view
                this._createTree(src);
            } else {
                // Load folder / file list
                this._getList(src);
            }
        },

        _toggleTree: function (s) {
            // add full-width class to browser
            $('#browser').toggleClass('full-width', !s);

            $('div.layout-left', '#browser').attr('aria-hidden', !s);

            $('#sort-size, #sort-date').attr('aria-hidden', s);

            $('span.size, span.date', '#item-list').attr('aria-hidden', s);
        },

        /**
         * Check if a name is websafe
         */
        _isWebSafe: function (name) {
            // get websafe name
            var safe = Wf.String.safe(name, this.options.websafe_mode, this.options.websafe_spaces, this.options.websafe_textcase);
            // only check lowercase as both upper and lower are websafe
            return name.toLowerCase() === safe.toLowerCase();
        },

        _isViewable: function (name) {
            var button = this._getButton('file', 'view');
            var viewable = this.options.viewable;

            if (button && button.restrict) {
                viewable = button.restrict;
            }

            return new RegExp('\\.(' + viewable.replace(/,/g, '|') + ')$', 'i').test(name);
        },

        _buildList: function (o) {
            var self = this,
                h = '';

            // empty list
            $('#item-list').empty();

            $('#browser').toggleClass('root', this._isRoot());

            if (!this._isRoot()) {
                //h += '<li class="folder folder-up" title="Up"><span class="uk-width-0-10"></span><i class="uk-width-1-10 uk-icon uk-icon-undo uk-icon-folder-up"></i><a class="uk-flex-item-auto" href="#">...</a></li>';
            }

            if (o.folders.length) {

                $.each(o.folders, function (i, e) {
                    var data = [],
                        classes = [];

                    if (!e.id) {
                        return true;
                    }

                    $.each(e.properties, function (k, v) {
                        if (v !== '') {
                            data.push('data-' + k + '="' + v + '"');
                        }
                    });

                    // add url data
                    data.push('data-url="' + (e.url || e.id) + '"');

                    // add websafe class
                    classes.push(self._isWebSafe(e.name) ? 'safe' : 'notsafe');
                    // add writable class
                    classes.push(e.writable ? 'writable' : 'notwritable');
                    // add custom classes
                    if (e.classes) {
                        classes.push(e.classes);
                    }

                    h += '<li class="uk-grid uk-grid-collapse uk-flex folder ' + classes.join(' ') + '" title="' + e.name + '"' + data.join(' ') + '>';
                    h += '  <label class="uk-width-0-10 uk-item-checkbox" aria-label="' + self._translate('select', 'Select') + '"><input type="checkbox" /></label>';
                    h += '  <i class="uk-width-1-10 uk-icon uk-icon-folder folder"></i>';
                    h += '  <a class="uk-width-1-5 uk-padding-remove uk-flex-item-auto uk-text-truncate" href="#">' + e.name + '</a>';
                    h += '  <span class="uk-width-6-10 uk-item-date uk-hidden-mini">' + Wf.String.formatDate(e.properties.modified, self.options.date_format) + '</span>';
                    h += '</li>';
                });

            }

            if (o.files.length) {
                $.each(o.files, function (i, e) {
                    var data = [],
                        classes = [];

                    if (!e.id) {
                        return true;
                    }

                    $.each(e.properties, function (k, v) {
                        if (v !== '') {
                            data.push('data-' + k + '="' + v + '"');
                        }
                    });

                    // add url data
                    if (e.url) {
                        data.push('data-url="' + e.url + '"');
                    }

                    // add id (legacy support)
                    data.push('id="' + e.id + '"');

                    // add websafe class
                    classes.push(self._isWebSafe(e.name) ? 'safe' : 'notsafe');
                    // add writable class
                    classes.push(e.writable ? 'writable' : 'notwritable');
                    // add selected item to returned items
                    if (e.selected) {
                        self._addReturnedItem({
                            'name': e.id
                        });
                    }
                    // add custom classes
                    if (e.classes) {
                        classes.push(e.classes);
                    }

                    var ext = Wf.String.getExt(e.name);
                    var name = Wf.String.stripExt(e.name);
                    var filename = name + '.' + ext;
                    var icon = ext.toLowerCase();

                    var download = '';

                    if (self.options.allow_download && e.properties.preview) {
                        download = ' download="' + filename + '"';
                    }

                    h += '<li class="uk-grid uk-grid-collapse uk-flex file ' + ext.toLowerCase() + ' ' + classes.join(' ') + '" title="' + e.name + '"' + data.join(' ') + '>';
                    h += '  <label class="uk-width-0-10 uk-item-checkbox" aria-label="' + self._translate('select', 'Select') + '"><input type="checkbox" /></label>';
                    h += '  <i class="uk-width-1-10 uk-icon uk-icon-file uk-icon-file-' + getMimeType(icon) + ' file ' + icon + '"></i>';
                    h += '  <a class="uk-width-1-5 uk-padding-remove uk-flex-item-auto" href="' + (e.properties.preview || '#') + '"' + download + '>';
                    h += '      <span class="uk-item-text uk-text-truncate uk-display-inline-block">' + name + '</span>';
                    h += '      <span class="uk-item-extension uk-display-inline-block">.' + ext + '</span>';
                    h += '  </a>';
                    h += '  <span class="uk-width-2-10 uk-item-date uk-hidden-mini">' + Wf.String.formatDate(e.properties.modified, self.options.date_format) + '</span>';
                    h += '  <span class="uk-width-4-10 uk-item-size uk-hidden-mini">' + Wf.String.formatSize(e.properties.size) + '</span>';
                    h += '</li>';
                });

            }

            $('#item-list').html(h);

            this._showListDetails();
        },

        _showListDetails: function () {
            var s = !$('.layout-icon', '#show-details').hasClass('tree') && this._treeLoaded();

            this._toggleTree(s);
        },

        /**
         * Check if the Tree option is set and the Tree Class is loaded
         * return Boolean.
         */
        _treeLoaded: function () {
            return this.options.folder_tree && typeof $.fn.tree === "function";
        },

        /**
         * Initialize the Tree
         * @param {String} src Optional src url eg: images/stories/fruit.jpg
         */
        _createTree: function (src) {
            var self = this;
            // use src or stored directory
            var path = src || this._dir;

            path = this._cleanPath(path);

            $('#tree-body').on('tree:init', function (e, callback) {
                Wf.JSON.request('getTree', path, function (o) {
                    // Set default tree
                    $('#tree-body').html(o);

                    typeof callback === "function" && callback();

                    if (path && path !== self._trimPath(self.options.dir)) {
                        $('#tree-body').trigger('tree:scroll', path);
                    }

                    // Load folder / file list
                    self._getList(src);
                });

            }).on('tree:nodeclick', function (e, evt, node) {
                self.actionTarget = node;

                self._changeDir($(node).attr('data-id'));
            }).on('tree:nodeload', function (e, node) {
                self._refreshTree(node);
            }).tree();
        },

        _refreshTree: function (node) {
            node = node || $('.uk-tree-root', '#tree-body');

            $('#tree-body').trigger('tree:toggleloader', node);

            Wf.JSON.request('getTreeItem', $(node).attr('data-id'), function (o) {
                if (o && !o.error) {
                    $('ul:first', node).remove();

                    $('#tree-body').trigger('tree:createnode', [o.folders, node]);
                    $('#tree-body').trigger('tree:togglenodestate', [node, true]);
                }
                $('#tree-body').trigger('tree:toggleloader', node);
            }, this);
        },

        /**
         * Reset the Manager
         */
        _reset: function () {
            // Clear selects
            this._deselectItems();
            // Clear returns
            this._returnedItems = [];

            //$('.uk-modal').trigger('modal.close');

            // uncheck all checkboxes
            $('input[type="checkbox"]', '#check-all').prop('checked', false);

            $('li', '#browser-details-nav').addClass('uk-invisible').attr('aria-hidden', true).filter('.details-nav-text').empty();

            // clear list limit
            this._limit = 0;
        },

        /**
         * Clear the Paste action
         */
        _clearPaste: function () {
            // Clear paste
            this._pasteaction = '';
            this._pasteitems = '';

            this._hideButtons($('.paste', '#buttons'));
        },

        /**
         * Set a status message
         * @param {String} message
         * @param {String} loading
         */
        setStatus: function (o) {
            $('#browser-message').removeClass('load error');

            // set state
            $('#browser-message').toggleClass(o.state);

            $('#refresh').trigger('button:refresh', [o.state]);

            // set message
            $('.message', '#browser-message').html(o.message);
        },

        /**
         * Set a message
         * @param {String} message
         * @param {String} classname
         */
        _setMessage: function (message, classname) {
            return true;
        },

        /**
         * Sets a loading message
         */
        _setLoader: function () {
            this.setStatus({
                message: this._translate('message_load', 'Loading...'),
                state: 'load'
            });
        },

        /**
         * Reset the message display
         */
        _resetMessage: function () {
            return true;
        },

        /**
         * Reset the status display
         */
        _resetStatus: function () {
            var self = this,
                dir = decodeURIComponent(this._dir),
                $status = $('#browser-message');

            // reset state
            this.setStatus({
                message: '',
                state: ''
            });

            var $pathway = $('.uk-breadcrumb.pathway', $status);
            // remove all but "home"
            $('li', $pathway).not(':first').remove();

            // get width
            var sw = $status.width();

            // add "home" click
            $('li:first', $pathway).on('click', function () {
                self._changeDir('/');
            });

            // trim path
            dir = $.trim(this._trimPath(dir));

            // add folder count
            var $count = $('<li class="count">( ' + this._foldercount + ' ' + this._translate('folders', 'folders') + ', ' + this._filecount + ' ' + this._translate('files', 'files') + ')</li>').appendTo($pathway);

            // get base list width
            var w = $pathway.outerWidth(true);

            if (dir) {
                var x = 1,
                    parts = dir.split('/');

                $.each(parts, function (i, s) {
                    var path = s;

                    if (i > 0) {
                        path = parts.slice(0, i + 1).join('/');
                    }

                    var $item = $('<li title="' + s + '"></li>').on('click', function (e) {
                        self._changeDir(path);
                    }).append('<a>' + s + '</a>').insertBefore($count);

                    // add item width
                    w += $item.outerWidth(true);

                    if (w > sw) {
                        $('li', $pathway).eq(x++).addClass('uk-breadcrumb-truncate');
                    }
                });
            }
        },

        /**
         * Get the parent directory
         * @return {String} s The parent/previous directory.
         */
        _getPreviousDir: function () {
            if (this._dir.length < 2) {
                return this._dir;
            }

            var dirs = this._dir.split('/');
            var s = '';

            for (var i = 0; i < dirs.length - 1; i++) {
                s = Wf.String.path(s, dirs[i]);
            }

            return s;
        },

        /**
         * Add an item to the returnedItems array
         * @return {Object} file The item.
         */
        _addReturnedItem: function (items) {
            if ($.type(items) == 'array') {
                $.merge(this._returnedItems, items);
            } else {
                this._returnedItems.push(items);
            }
        },

        /**
         * Setup the returned file after upload
         * @param {String} file The returning file name.
         */
        _returnFile: function (file) {
            this._addReturnedItem({
                name: Wf.String.basename(file)
            });

            this._changeDir(Wf.String.dirname(file));
        },

        /**
         * Set the current directory
         * @param {String} dir
         */
        _setDir: function (dir) {
            this._dir = '' + dir;
        },

        /**
         * Get the base directory
         */
        getBaseDir: function () {
            return this.options.dir;
        },

        /**
         * Get the current directory
         */
        getCurrentDir: function () {
            return this._dir;
        },

        /**
         Determine whether current directory is root
         */
        _isRoot: function () {
            var s = this._dir;

            // remove slashes
            s = this._trimPath(s);

            return s === '';
        },

        /**
         * Change Directory
         * @param {String} dir
         */
        _changeDir: function (dir) {
            this._reset();
            this._limitcount = 0;
            this._setDir(dir);

            // show loading message
            this._setLoader();

            this._getList(dir);
        },

        _setState: function (name, state) {
            if (this.options.use_state_cookies) {
                Wf.Storage.set("wf_" + Wf.getName() + '_' + name, state);
            }
        },

        _getState: function (name, def, callback) {
            if (!this.options.use_state_cookies) {
                return def;
            }

            callback = callback || function (val) {
                return val;
            };

            return Wf.Storage.get('wf_' + Wf.getName() + '_' + name, def, callback);
        },

        /**
         * Retrieve a list of files and folders
         * @param {String} src optional src url eg: images/stories/fruit.jpg
         */
        _getList: function (src, filter) {
            // get path from src or stored directory
            var path = src || this._dir;

            // store directory in cookie
            if ((src || this._dir === '')) {
                this._setState('dir', this._cleanPath(path));
            }

            // hide all buttons
            this._hideButtons($('.button', '#buttons'));

            // get list limit
            this._limit = parseInt($('#browser-list-limit-select').val(), 10);

            // get sort value
            var sort = this._sortValue || '';

            var method = 'getItems';

            if (filter) {
                method = 'searchItems';
            }

            // send request
            Wf.JSON.request(method, [path, this._limit, this._limitcount, filter || '', sort], this._loadList, this);
        },

        /**
         * Refresh the file list
         */
        refresh: function (e) {
            this._reset();

            this.targetElement = null;

            // show loading message
            this._setLoader();

            // event triggered refresh
            if (typeof e !== 'undefined') {
                // clear search input
                $('#search').val('');

                // clear stored search query
                this._searchQuery = '';

                $('form').append('<input type="hidden" name="refresh" value="1" />');
                this._refreshTree();
            }

            // get list from server with query if set
            this._getList('', this._searchQuery);
        },

        /**
         * Load the browser list
         */
        load: function (items) {
            var self = this, src = "";

            // add returned items
            if (items) {
                if ($.type(items) == 'string') {
                    items = [items];
                }

                $.each(items, function (i, item) {
                    if ($.type(item) == 'string') {
                        item = { name: item };
                    }

                    self._addReturnedItem(item);

                    // pass value of first item to src
                    if (i == 0) {
                        src = item.name;
                    }
                });
            }

            // show loading message
            this._setLoader();

            this._getList(src);
        },

        /**
         * Show an error message
         */
        error: function (error) {
            this._raiseError(error);
        },

        startUpload: function () {
            $('#upload-queue').uploader('start');
        },

        stopUpload: function () {
            $('#upload-queue').uploader('stop');
        },

        setUploadStatus: function (o) {
            $('#upload-queue').uploader('setStatus', o);
        },

        /**
         * Load the file/folder list into the container div
         * @param {Object} The folder/file JSON object
         */
        _loadList: function (o) {
            var dir = '';

            $('input[name="refresh"]', 'form').remove();

            // data error...
            if (!o) {
                // reset state
                this.setStatus({
                    message: '',
                    state: ''
                });

                return false;
            }

            this._foldercount = o.total.folders;
            this._filecount = o.total.files;

            $('.limit-right li, .limit-left li', '#browser-list-limit').addClass('uk-invisible').attr('aria-hidden', true);

            if (this._limit) {
                this._limitend = (o.total.folders + o.total.files) - this._limit;
                var count = this._limitcount + o.folders.length + o.files.length;

                if (count < (o.total.folders + o.total.files)) {
                    $('.limit-right li', '#browser-list-limit').removeClass('uk-invisible').attr('aria-hidden', false);
                } else {
                    $('.limit-right li', '#browser-list-limit').addClass('uk-invisible').attr('aria-hidden', true);
                }

                if ((count - this._limit) > 0) {
                    $('.limit-left li', '#browser-list-limit').removeClass('uk-invisible').attr('aria-hidden', false);
                } else {
                    $('.limit-left li', '#browser-list-limit').addClass('uk-invisible').attr('aria-hidden', true);
                }
            }

            if (!this._searchQuery) {
                $.each([].concat(o.folders, o.files), function (i, item) {
                    if (item.id) {
                        dir = Wf.String.encodeURI(Wf.String.dirname(item.id) || '/', true);
                        return false;
                    }
                });

                if (dir) {
                    this._setDir(dir);
                }
            }

            // Add folder-up button
            if (!this._isRoot()) {
                $('#folder-list').append('<li class="folder-up" title="Up"><a href="#">...</a></li>');

                if (this._treeLoaded()) {
                    $('#tree-body').trigger('tree:createnode', [o.folders, this._dir]);

                    /// don't scroll on tree click
                    if ($(this.actionTarget).is('[role="treeitem"]') === false) {
                        $('#tree-body').trigger('tree:scroll', this._dir);
                    }
                }
            }

            // Alternate loadList function
            this._trigger('onBeforeBuildList', null, o);

            // Build the file / folder list
            this._buildList(o);

            this._resetStatus();
            this._resetMessage();

            // Alternate loadList function
            this._trigger('onAfterBuildList', null, o);

            // select returned items
            if (this._returnedItems.length) {
                this._findItem(this._returnedItems);
                this._returnedItems = [];
            }

            // show paste button if files in 'clipboard'
            if (this._pasteitems) {
                this._showPasteButton();
            }

            // trigger "load" event on browser list
            $('#browser-list').trigger('load');

            this._trigger('onListComplete');
        },

        /**
         * Execute a command
         * @param {String} The command name
         * @param {String} The command type
         * @param {String} The event that triggered the action
         */
        _execute: function (name, type, evt, options) {
            var self = this;
            var dir = this._dir;

            // remove slashes
            dir = this._trimPath(dir);

            var list = this._serializeSelectedItems();

            var site = Wf.getURI(true);

            var elements = '';

            if (this.options[name]) {
                elements = this.options[name].elements || '';
            }

            switch (name) {
                case 'help':
                    Wf.help();
                    break;
                case 'insert':
                    this._trigger('onFileInsert', null, $('li.selected', '#item-list').get(0));
                    break;
                case 'view':
                    var $item = $('li.selected.active:first', '#item-list');
                    var url = $item.data('url');
                    url = /http(s)?:\/\//.test(url) ? url : Wf.String.path(site, url);

                    // use preview url if available
                    if ($item.data('preview')) {
                        url = $item.data('preview');
                    }

                    var name = Wf.String.basename($item.attr('title'));

                    if (this._isViewable(name)) {
                        if (/\.(jpeg|jpg|gif|png|webp|svg|apng|avi|wmv|wm|asf|asx|wmx|wvx|mov|qt|mpg|mp3|mp4|m4v|mpeg|ogg|ogv|webm|swf|flv|f4v|xml|dcr|rm|ra|ram|divx|pdf)/i.test(name)) {

                            var args = { width: $item.data('width') || 0, height: $item.data('height') || 0 };

                            Wf.Modal.media(name, url, args);
                        } else {
                            Wf.Modal.iframe(name, url, {
                                onFrameLoad: function (e) {
                                    var iframe = $('div.iframe-preview iframe').get(0);
                                    var h = iframe.contentWindow.document.body.innerHTML;
                                    var tmpDiv = document.createElement('div');

                                    $(tmpDiv).html(h);

                                    function toRelative(s) {
                                        s = Wf.URL.toRelative(s);
                                        return s.replace(/^administrator\//, '');
                                    }

                                    $('img, embed', $(tmpDiv)).each(function () {
                                        var s = toRelative($(this).attr('src'));

                                        if (!/http(s)?:\/\//.test(s)) {
                                            s = Wf.String.path(site, s);
                                        }
                                        $(this).attr('src', s);
                                    });

                                    $('a, area', $(tmpDiv)).each(function () {
                                        var s = toRelative($(this).attr('href'));

                                        if (!/http(s)?:\/\//.test(s)) {
                                            s = Wf.String.path(site, s);
                                        }
                                        $(this).attr('href', s);
                                    });

                                    $('object', $(tmpDiv)).each(function () {
                                        $('param[name=movie], param[name=src]', this).each(function () {
                                            var s = toRelative($(this).attr('value'));
                                            if (!/http(s)?:\/\//.test(s)) {
                                                s = Wf.String.path(site, s);
                                            }
                                            $(this).attr('value', s);
                                        });

                                    });

                                    iframe.contentWindow.document.body.innerHTML = tmpDiv.innerHTML;
                                }
                            });
                        }
                    }
                    break;
                case 'upload':
                    var uploadModal = Wf.Modal.upload($.extend({
                        elements: elements,
                        open: function () {
                            /**
                             * Private internal function
                             * Check file name against list
                             * @param {Object} name File name
                             */
                            function _checkName(file) {
                                var found = false,
                                    msg = self._translate('file_exists_alert', 'A file with the same name exists in the target folder.');
                                var name = Wf.String.safe(file.name, self.options.websafe_mode, self.options.websafe_spaces, self.options.websafe_textcase);

                                $('li', 'file-list').each(function () {
                                    if (name == $(this).attr('title')) {
                                        found = true;
                                    }
                                });

                                var el = file.element,
                                    span = $('span.queue-name:first', el);

                                if (found) {
                                    if (!$(el).hasClass('exists')) {
                                        $(el).addClass('exists');
                                        $(span).attr('title', name + '::' + msg);

                                        $(span).tips();
                                    }
                                } else {
                                    if ($(el).hasClass('exists')) {
                                        $(el).removeClass('exists');

                                        $(span).attr('title', name);
                                    }
                                }

                                return true;
                            }

                            // Initialize uploader
                            $('#upload-queue').uploader($.extend({
                                url: document.location.href,
                                field: $('input[type="file"]:first'),
                                websafe_mode: self.options.websafe_mode,
                                websafe_spaces: self.options.websafe_spaces,
                                websafe_textcase: self.options.websafe_textcase
                            }, self.options.upload)).on('uploadwidget:filerename', function (e, file) {
                                return _checkName(file);
                            }).on('uploadwidget:filecomplete', function (e, file, item) {
                                self._addReturnedItem(item);
                                self._trigger('onUploadFile', null, file);

                            }).on('uploadwidget:uploadstart', function (e, file) {
                                // add file specific upload data
                                file.data = $(':input[name]:enabled', file.element).map(function () {
                                    return { name: this.name, value: this.value };
                                });

                                // disable fields
                                $(':input[name]:enabled', file.element).prop('disabled', true);

                            }).on('uploadwidget:uploadcomplete', function (e, errors) {
                                $('#upload-submit').disabled = false;

                                if (!errors) {
                                    // Refresh file list
                                    self._getList();

                                    window.setTimeout(function () {
                                        $(uploadModal).trigger('modal.close');
                                    }, 1000);

                                    self._trigger('onUploadComplete');
                                }
                            });

                            self._trigger('onUploadOpen');
                        },
                        upload: function () {
                            // get form data
                            var serialized = $(':input[name]:enabled', '#upload-body').map(function () {
                                return { name: this.name, value: this.value };
                            });

                            var fields = $.merge($('form > :input:enabled').serializeArray(), serialized);

                            // set current directory
                            fields.push({
                                "name": "upload-dir",
                                "value": dir
                            });

                            self._trigger('onUpload', null, [fields]);

                            // trigger the upload, with data
                            $('#upload-queue').trigger('uploadwidget:upload', [fields]);

                            return false;
                        },
                        close: function () {
                            $('#upload-queue').trigger('uploadwidget:close');
                        }
                    }, self.options.upload.dialog));
                    break;
                case 'folder_new':
                    Wf.Modal.prompt(self._translate('folder_new', 'New Folder'), function (v, args) {
                        if (v) {
                            self._setLoader();

                            v = Wf.String.safe(v, self.options.websafe_mode, self.options.websafe_spaces, self.options.websafe_textcase);
                            args = [dir, v].concat(args || []);

                            Wf.JSON.request('folderNew', args, function (o) {
                                if (o) {

                                    // only create in root
                                    if (self._isRoot()) {
                                        $('#tree-body').trigger('tree:createnode', [o.folders, self._dir]);
                                    }

                                    self._trigger('onFolderNew');
                                }

                                self.refresh();
                            });
                        }
                    }, {
                        elements: elements,
                        label: {
                            'confirm': self._translate('create', 'Create')
                        },
                        validate: function (value) {
                            if (!value) {
                                return false;
                            }

                            return Wf.String.safe(value, self.options.websafe_mode, self.options.websafe_spaces, self.options.websafe_textcase);
                        }
                    });
                    break;

                // Cut / Copy operation
                case 'copy':
                case 'cut':
                    if (name === 'copy' && (evt.metaKey || evt.ctrlKey)) {
                        var items = this.getSelectedItems(), clip = [];

                        $.each(items, function () {
                            if (!$(this).hasClass('file')) {
                                return true;
                            }

                            var url = $(this).data('url');

                            if (url.indexOf('://') === -1) {
                                url = Wf.String.path(site, url);
                                url = Wf.URL.toAbsolute(url);
                            }

                            if (url) {
                                clip.push(url);
                            }
                        });

                        if (clip.length) {
                            var inp = document.createElement('input'), val = clip.join(',');

                            $(inp).css({ 'position': 'absolute', 'left': -9999 }).attr('readonly', true).appendTo('body').val(val).focus();

                            if (inp.select) {
                                inp.select();

                                try {
                                    // copy text
                                    document.execCommand('copy');
                                } catch (err) {
                                    // error
                                }
                            }

                            $(inp).remove();
                        }

                        evt.preventDefault();

                        return;
                    }

                    this._pasteaction = name;
                    this._pasteitems = list;

                    this._showPasteButton();

                    break;

                // Paste the file
                case 'paste':
                    var fn = (this._pasteaction == 'copy') ? 'copyItem' : 'moveItem';
                    this._setLoader();

                    var items = this._pasteitems.split(',');

                    // eslint-disable-next-line no-case-declarations
                    function callback(o, dir) {
                        if (o.folders.length) {
                            // remove from tree
                            if (self._treeLoaded()) {
                                // remove existing items
                                $.each(items, function (i, item) {
                                    if (fn == 'moveItem') {
                                        $('#tree-body').trigger('tree:removenode', [item]);
                                    }
                                });

                                var folders = $.map(o.folders, function (item, i) {
                                    var name = item.name;

                                    return {
                                        "id": name,
                                        "name": Wf.String.basename(name)
                                    };
                                });

                                // create new items
                                $('#tree-body').trigger('tree:createnode', [folders, dir]);
                            }
                        }
                    }

                    $.each(items, function (i, item) {
                        var complete = i === items.length - 1;

                        Wf.JSON.request(fn, [item, dir], function (o) {
                            if (o) {
                                if (o.confirm) {
                                    var confirmCallback = function (state) {
                                        Wf.JSON.request(fn, [item, dir, state], function (o) {
                                            if (o && !o.error) {
                                                callback(o, dir);
                                            }
                                        });
                                    };

                                    Wf.Modal.confirm(
                                        self._translate('paste_item_confirm', 'An item with the same name already exists in this folder. Do you want to replace it with the one you’re pasting?'),
                                        confirmCallback,
                                        {
                                            header: false,
                                            close: function () {
                                                if (complete) {
                                                    self._clearPaste();
                                                    self.refresh();
                                                }
                                            },
                                            buttons: [
                                                {
                                                    text: self._translate('cancel', 'Cancel'),
                                                    icon: 'uk-icon-close',
                                                    attributes: {
                                                        "class": "uk-modal-close"
                                                    }
                                                },
                                                {
                                                    text: self._translate('paste_keep_both', 'Keep Both'),
                                                    icon: 'uk-icon-copy',
                                                    click: function (e) {
                                                        // execute callback
                                                        confirmCallback.call(this, 'copy');
                                                    },
                                                    attributes: {
                                                        "type": "submit",
                                                        "class": "uk-button-success uk-modal-close"
                                                    }
                                                },
                                                {
                                                    text: self._translate('paste_replace', 'Replace'),
                                                    icon: 'uk-icon-check',
                                                    click: function (e) {
                                                        // execute callback
                                                        confirmCallback.call(this, 'replace');
                                                    },
                                                    attributes: {
                                                        "type": "submit",
                                                        "class": "uk-button-primary uk-modal-close",
                                                        "autofocus": true
                                                    }
                                                }
                                            ]
                                        }
                                    );
                                } else {
                                    callback(o, dir);

                                    if (complete) {
                                        self._clearPaste();
                                        self.refresh();
                                    }

                                    var result = o.folders.length ? o.folders[0].name : o.files[0].name;

                                    self._trigger('onPaste', [fn, item, result]);
                                }
                            } else {
                                if (complete) {
                                    self._clearPaste();
                                    self.refresh();
                                }
                            }
                        }, self, true);
                    });

                    break;

                // Delete a file or folder
                case 'delete':
                    var msg = self._translate('delete_item_alert', 'Delete Selected Item(s)');

                    Wf.Modal.confirm(msg, function (state) {
                        if (state) {
                            self._setLoader();
                            Wf.JSON.request('deleteItem', list, function (o) {
                                if (o) {
                                    if (o.folders.length) {
                                        // remove from tree
                                        if (self._treeLoaded()) {
                                            $.each(o.folders, function (i, item) {
                                                $('#tree-body').trigger('tree:removenode', [item]);
                                            });
                                        }
                                        self._trigger('onFolderDelete', null, o.folders);
                                    }

                                    if (o.files.length) {
                                        self._trigger('onFileDelete', null, o.files);
                                    }
                                }
                                self.refresh();
                            });
                        }
                    }, {
                        label: {
                            'confirm': self._translate('delete', 'Delete'),
                            'cancel': self._translate('cancel', 'Cancel')
                        },
                        header: false
                    });
                    break;

                // Rename a file or folder
                case 'rename':
                    var s = this.getSelectedItems(0);
                    var v = Wf.String.basename(list);
                    var ext;

                    if ($(s).hasClass('file')) {
                        // get and store extension
                        ext = Wf.String.getExt(v);
                        // get the filename
                        v = Wf.String.filename(v);
                    }

                    var renameModal = Wf.Modal.prompt('Rename', function (name, args) {
                        name = Wf.String.safe(name, self.options.websafe_mode, self.options.websafe_spaces, self.options.websafe_textcase);

                        if (v === name) {
                            Wf.Modal.alert(self._translate('rename_item_name_new', 'Please specify a new name for the item'));
                            return false;
                        }

                        Wf.Modal.confirm(self._translate('rename_item_alert', 'Renaming files/folders will break existing links. Continue?'), function (state) {
                            if (state) {
                                self._setLoader();

                                args = [list, name].concat(args || []);

                                Wf.JSON.request('renameItem', args, function (o) {
                                    if (o) {
                                        self._reset();

                                        var item = Wf.String.path(self._dir, name);

                                        // folder rename successful
                                        if (o.folders.length) {
                                            // rename in tree
                                            if (self._treeLoaded()) {
                                                $('#tree-body').trigger('tree:renamenode', [list, item]);
                                            }

                                            self._trigger('onFolderRename', [list, item]);
                                        }

                                        // add extension to file name
                                        if (ext) {
                                            item = item + '.' + ext;
                                        }

                                        // file rename successful
                                        if (o.files.length) {
                                            self._trigger('onFileRename', [list, item]);
                                        }

                                        if (item) {
                                            self._addReturnedItem({
                                                name: item
                                            });
                                        }
                                    }
                                    self.refresh();
                                });

                                // close modal
                                $(renameModal).trigger('modal.close');
                            } else {
                                $(renameModal).trigger('modal.close');
                            }
                        });
                    }, {
                        value: v,
                        header: false,
                        label: {
                            'confirm': self._translate('rename', 'Rename')
                        },
                        elements: elements,
                        close_on_submit: false,
                        validate: function (value) {
                            if (!value) {
                                return false;
                            }

                            return Wf.String.safe(value, self.options.websafe_mode, self.options.websafe_spaces, self.options.websafe_textcase);
                        }
                    });
                    break;
                case 'custom':
                    var dialog = options.dialog, action = options.action || null;

                    Wf.Modal.custom(dialog.title, function (args) {
                        args = [list].concat(args || []);
                        
                        Wf.JSON.request(action, args, function (o) {
                            self.refresh();
                        });
                    }, {
                        elements: dialog.elements
                    });

                    break;
            }
        },

        /**
         * Show an error dialog
         * @param {String} error
         */
        _raiseError: function (error) {
            var self = this,
                err = '';

            switch ($.type(error)) {
                case 'array':
                    err += '<ul class="error-list">';
                    $.each(error, function (k, v) {
                        err += '<li>' + v + '</li>';
                    });

                    err += '</ul>';
                    break;
                case 'string':
                default:
                    err = error;
                    break;
            }

            this._dialog.alert = Wf.Modal.alert(err, {
                close: function () {
                    self.refresh();
                }

            });
        },

        /**
         * Add an array of actions
         * @param {Object} actions
         */
        _addActions: function (actions) {
            var self = this;

            $.each(actions, function (i, action) {
                self._addAction(action);
            });

        },

        /**
         * Add an action to the Manager
         * @param {Object} options
         */
        _addAction: function (o) {
            var self = this,
                name = o.name || '',
                fn = this._execute;

            if (o.action) {
                fn = o.action;
            }

            var map = {
                'folder_new': 'folder-plus',
                'upload': 'cloud-upload',
                'help': 'question-circle'
            };

            // normalise class name
            var cls = name.replace(/_/g, '-');

            // create anchor element
            var action = document.createElement('button');

            $(action).addClass('action uk-button');

            if (name) {
                $(action).attr({
                    'id': name,
                    'title': o.title,
                    'aria-label': o.title
                }).addClass(cls).append('<label id="' + name + '_label" class="uk-text uk-hidden-mini">&nbsp;' + o.title + '</label>');

                var icon = (map[name] || name);

                $.each(icon.split(' '), function (i, k) {
                    $(action).prepend('<i class="uk-icon uk-icon-small uk-icon-' + cls + ' uk-icon-' + k + '"></i>');
                });

                // stack icons
                if (icon.indexOf(' ') >= 0) {
                    $('.uk-icon', action).first().addClass('uk-icon-stack uk-text-contrast').removeClass('uk-icon-medium');
                    $('<span class="uk-stack uk-stack-medium"></span>').prependTo(action).append($('.uk-icon', action));
                }

                if (o.name) {
                    $(action).on('mousedown.action', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        if ($.type(fn) == 'function') {
                            return fn.call(self, name);
                        }

                        return self._trigger(fn, name);
                    });
                }

                this._actions[name] = action;
            }

            $('#browser-actions').append(action);
        },

        /**
         * Get an action by name
         * @param {String} name
         */
        _getAction: function (name) {
            return this._actions[name];
        },

        /**
         * Add an array of buttons to the Manager
         * @param {Object} buttons
         */
        _addButtons: function (buttons) {
            var self = this;

            if (buttons) {
                if (buttons.folder) {
                    $.each(buttons.folder, function (i, button) {
                        if (button) {
                            self._addButton(button, 'folder');
                        }
                    });
                }

                if (buttons.file) {
                    $.each(buttons.file, function (i, button) {
                        if (button) {
                            self._addButton(button, 'file');
                        }
                    });
                }
            }
        },

        /**
         * Add a button to the Manager
         * @param {Object} o Button Object
         * @param {String} type
         */
        _addButton: function (o, type) {
            var self = this,
                fn = this._execute;

            if (o.action) {
                fn = o.action;
            }

            var map = {
                'delete': 'trash',
                'cut': 'cut',
                'copy': 'copy',
                'paste': 'paste',
                'rename': 'edit',
                'preview': 'preview',
                'view': 'preview',
                'image-editor': 'crop',
                'text-editor': 'file-xml'
            };

            // only create button type once
            var button = $('button.' + o.name, $('#browser-buttons'));

            if (!button.length) {
                button = document.createElement('button');

                $(button).attr({
                    'title': o.title,
                    'aria-label': o.title
                });

                var name = o.name.replace(/_/g, '-');

                if (o.icon) {
                    var icons = o.icon.split(' ');

                    $.each(icons, function (i, icon) {
                        $(button).append('<i class="uk-icon uk-icon-' + (map[icon] || icon) + '"></i>');
                    });

                    if (icons.length > 1) {
                        $('<span class="uk-stack"></span>').append($('.uk-icon', button)).appendTo(button);
                    }
                } else {
                    $(button).prepend('<i class="uk-icon uk-icon-' + (map[name] || name) + '"></i>');
                }

                if (name) {
                    $(button).on('mousedown.button', function (evt) {
                        evt.preventDefault();
                        evt.stopPropagation();

                        if ($('li.selected', '#item-list').length || self._pasteitems) {
                            if (o.sticky) {
                                $(button).toggleClass('uk-active');
                            }

                            if (o.dialog) {
                                return self._execute('custom', type, evt, o);
                            }

                            if ($.type(fn) == 'function') {
                                return fn.call(self, name, type, evt);
                            }

                            return self._trigger(fn, type);
                        }
                    });

                }

                $('#browser-buttons').append(button);
                $(button).addClass('uk-button uk-button-link button ' + o.name + ' uk-hidden');
            }

            this._buttons[type][o.name] = {
                'name': o.name,
                'element': button,
                'trigger': o.trigger,
                'multiple': o.multiple,
                'single': $.type(o.single) === 'undefined' ? true : o.single,
                'restrict': o.restrict || '',
                'sticky': o.sticky
            };
        },

        /**
         * Hide all buttons
         */
        _hideAllButtons: function () {
            var self = this;

            $('.button', '#browser-buttons').each(function () {
                self._hideButton(this);
            });

        },

        /**
         * Hide buttons by type
         * @param {String} type The button type
         */
        _hideButtons: function (buttons) {
            var self = this;

            $.each(buttons, function (i, button) {
                self._hideButton(button);
            });

        },

        /**
         * Hide a button
         * @param {String} button The button to hide
         */
        _hideButton: function (button) {
            $(button).addClass('uk-hidden').attr('aria-hidden', true);
        },

        /**
         * Show all buttons
         * @param {String} type The button type to show
         */
        _showButtons: function () {
            var self = this;

            this._hideAllButtons();

            var folder = $('li.folder.selected', '#item-list');
            var file = $('li.file.selected', '#item-list');

            // multiple type selection
            if (file.length && folder.length) {
                var buttons = {};

                var filebtns = this._buttons.file;
                var folderbtns = this._buttons.folder;

                $.each(filebtns, function (k, o) {
                    if (!o.trigger && o.multiple) {
                        if (folderbtns[k]) {
                            buttons[k] = o;
                        }
                    }
                });

                $.each(folderbtns, function (k, o) {
                    if (!o.trigger && o.multiple) {
                        if (filebtns[k]) {
                            buttons[k] = o;
                        }
                    }
                });

                $.each(buttons, function (k, o) {
                    self._showButton(o.element, o.single, true);
                });

            } else {
                // set folder as default type
                var type = file.length ? 'file' : 'folder';

                $.each(this._buttons[type], function (k, o) {
                    if (!o.trigger && !o.restrict) {
                        self._showButton(o.element, o.single, o.multiple);
                    }

                    if (o.restrict) {
                        var re = o.restrict.split(',').join('|');
                        var item = self.getSelectedItems(0);

                        if (new RegExp('\\.(' + re + ')$', 'i').test($(item).attr('title'))) {
                            self._showButton(o.element, o.single, o.multiple);
                        }
                    }
                });
            }

            if (this._pasteitems) {
                this._showPasteButton();
            }
        },

        /**
         * Show a button
         * @param {String} button The button to show
         * @param {Boolean} multiple Whether a button is a multiple selection action
         */
        _showButton: function (button, single, multiple) {
            if (button) {
                var show = false,
                    n = $('li.selected', '#item-list').length;

                if (n > 1) {
                    if (multiple) {
                        show = true;
                    }
                } else {
                    if (single) {
                        show = true;
                    }
                }

                if (show) {
                    $(button).removeClass('uk-hidden').removeAttr('aria-hidden');
                } else {
                    $(button).addClass('uk-hidden').attr('aria-hidden', false);
                }
            }
        },

        /**
         * Get a button
         * @param {String} type The button type
         * @param {String} name The button name
         */
        _getButton: function (type, name) {
            return this._buttons[type][name] || null;
        },

        /**
         * Show the paste button
         */
        _showPasteButton: function () {
            this._showButton($('.button.paste', '#browser-buttons'), true, true);
        },

        /**
         * Determine whether an item is selected
         * @param {Object} el The list item
         */
        _isSelectedItem: function (el) {
            return $(el).is('li.selected');
        },

        /**
         * Deselect all list items
         */
        _deselectItems: function () {
            // deselect item and uncheck checkboxes
            $('li.selected', '#item-list').removeClass('selected active').find('input[type="checkbox"]').prop('checked', false);

            // empty text and comment
            $('#browser-details-text, #browser-details-comment').empty();

            $.each(['#browser-details-nav-left', '#browser-details-nav-right', '#browser-details-nav-text'], function (i, el) {
                $(el).addClass('uk-invisible').attr('aria-hidden', true);
            });

            this._hideAllButtons();

            $('input[type="checkbox"]', '#check-all').prop('checked', false);
        },

        /**
         * Select an array of items
         * @param {Array} items The array of items to select
         * @param {Boolean} show Show item properties
         */
        _selectItems: function (items, show) {
            $(items).addClass('selected').find('input[type="checkbox"]').prop('checked', true);

            if (show) {
                this._showSelectedItems();
            }

            var $list = $('#item-list');

            if ($('input:checked', $list).length === $('li', $list).length) {
                $('input[type="checkbox"]', '#check-all').prop('checked', true);
            }

            this._trigger('onSelectItems', null, items);
        },

        /**
         * Remove items from a selection
         * @param {Array} el Array of elements to remove
         * @param {Boolean} show Show remaining item properties
         */
        _removeSelectedItems: function (items, show) {
            $(items).removeClass('selected active').find('input[type="checkbox"]').prop('checked', false);

            if (show) {
                this._showSelectedItems();
            }

            this._trigger('onRemoveItems', null, items);
        },

        /**
         * Return selected items by key or all selected items
         * @param {String} key Item key
         */
        getSelectedItems: function (key) {
            var $items = $('li.selected', '#item-list');

            if (typeof key === 'number') {
                return $items[key] || $items;
            }

            return $items;
        },

        /**
         * Return selected items by key or all selected items
         * @param {Array} items Array of items to select
         */
        setSelectedItems: function (items) {
            this._findItem(items);
        },

        /**
         * Process a selection click
         * @param {String} e The click event.
         * @param {Boolean} multiple Allow multiple selections.
         */
        _setSelectedItems: function (e, multiple) {
            var checkbox = false;

            // the selected element
            var el = e.target;
            // cache list
            var $list = $('#item-list');

            if (e.type === 'keydown') {
                // element is probably parent ul, so get last selected item
                el = $('li.selected:last', $list).get(0);

                $list = $('#browser-list');

                // change target for keydown
                if (e.which == 38) {
                    el = el.previousSibling;
                }

                if (e.which == 40) {
                    el = el.nextSibling;
                }

                if (!el) {
                    return;
                }

                if (el.offsetTop > $list.innerHeight() || el.offsetTop < $list.scrollTop()) {
                    $list.scrollTop((el.offsetTop + $(el).innerHeight()) - $list.height());
                }
            }

            if ($(el).is('input[type="checkbox"]')) {
                multiple = true;
                checkbox = true;

                el = $(el).parents('li').get(0);
            }

            // If not li element, must be a so get parent li
            if (el.nodeName != 'LI') {
                el = el.parentNode;
            }

            var selected = $('li.selected', $list);

            // Prevent double clicking
            if (this._isSelectedItem(el) && selected.length === 1) {
                e.preventDefault();
                return false;
            }

            // Get items
            var items = $('li.folder, li.file', $list);
            // get key
            var ctrl = (e.ctrlKey || e.metaKey),
                shift = e.shiftKey;

            // Single click
            if (!ctrl && !shift && !checkbox || !multiple) {
                // uncheck all boxes
                $(el).find('input[type="checkbox"]').prop('checked', false);

                // deselect all
                this._deselectItems();

                // select item
                this._selectItems([el], true);

                // ctrl & shift
            } else if (multiple && (ctrl || shift || checkbox)) {
                // ctrl
                if (ctrl || checkbox) {
                    if (this._isSelectedItem(el)) {
                        this._removeSelectedItems([el], true);
                    } else {
                        this._selectItems([el], true);
                    }
                }

                // shift
                if (shift) {
                    if (selected.length) {
                        // selected item index
                        var si = $(selected).index();
                        // click item index
                        var ci = $(el, items).index();
                        var selection = [];

                        // Clear selection
                        this._deselectItems();

                        // Clicked item further up list than selected item
                        if (ci > si) {
                            for (var i = ci; i >= si; i--) {
                                selection.push(items[i]);
                            }
                        } else {
                            // Clicked item further down list than selected item
                            for (var i = si; i >= ci; i--) {
                                selection.push(items[i]);
                            }
                        }
                        this._selectItems(selection, true);
                    } else {
                        this._selectItems([el], true);
                    }
                }
            }
        },

        /**
         * Show the selected items' details
         */
        _showSelectedItems: function () {
            var $items = $('li.selected', '#item-list'),
                n = $items.length;

            // reset if no selection
            if (!n) {
                this._reset();
            } else {
                // make the first item active
                $items.first().addClass('active');

                this._showItemDetails();
            }
        },

        /**
         * Find a select an item (file) by name, id or url
         * @param {String} name The file name.
         */
        _findItem: function (files, type) {
            var self = this,
                items = [];
            type = type || 'file';

            if ($.type(files) == 'string') {
                files = [files];
            }

            var insert = false;
            var $list = $('#item-list');

            var base = self.getBaseDir();

            $.each(files, function (i, file) {
                if (file && file.name) {
                    var name = decodeURIComponent(file.name);

                    if ($list.length) {
                        var item = [];

                        // find item from name, id or data-url
                        item = $('li.' + type + '[title="' + Wf.String.basename(name) + '"], li.' + type + '[data-url="' + Wf.String.path(base, name) + '"]', $list);

                        if (item.length) {
                            if (file.insert) {
                                insert = true;
                                items = item;

                                self.serializeItemData(item).then(function (data) {
                                    self._trigger('onFileClick', [item, data]);
                                });
                            }

                            if (!insert) {
                                $.merge(items, item);
                            }
                        }
                    }
                }
            });

            if (items.length) {

                var h = $(items).first().outerHeight() + $('.folder-up').outerHeight();
                var top = $(items).get(0).offsetTop - h;

                $('#browser-list').animate({
                    scrollTop: Math.round(top)
                }, 1500, function () {
                    $(this).off(scrollEvents);
                });
            }

            // Select items and display properties
            this._selectItems(items, true);
        },

        serializeItemData: function (item) {
            var self = this;

            return new Promise(function (resolve, reject) {
                var props = {};

                $.each(['url', 'preview', 'width', 'height', 'description', 'modified', 'size'], function (i, key) {
                    props[key] = $(item).attr('data-' + key) || '';
                });

                // get title from element attribute
                props.title = $(item).attr('title');

                // get item basename
                props.title = Wf.String.basename(props.title);

                if (props.url) {
                    resolve(props);
                } else {
                    var path = Wf.String.path(self._dir, props.title);

                    Wf.JSON.request('getFileDetails', [path], function (o) {
                        if (o && !o.error) {
                            props = $.extend(props, o);
                        }

                        resolve(props);
                    });
                }
            });
        },

        /**
         * Serialize the current item selection, add current dir to path
         */
        _serializeSelectedItems: function () {
            var self = this;

            return $('li.selected', '#item-list').map(function () {
                return Wf.String.path(self._dir, $(this).attr('title'));
            }).get().join(',');

        },

        /**
         * Show a file /folder properties / details
         */
        _showItemDetails: function () {
            var self = this,
                $items = $('li.selected', '#item-list'),
                n = $items.length;
            var $nav = $('#browser-details-nav');

            // show navigation buttons
            if (n > 1) {

                // get active item index
                var index = $items.index($items.filter('.active'));

                if (index) {
                    $('.details-nav-left', $nav).removeClass('uk-invisible').attr('aria-hidden', false);
                } else {
                    $('.details-nav-left', $nav).addClass('uk-invisible').attr('aria-hidden', true);
                }

                if (index + 1 < n) {
                    $('.details-nav-right', $nav).removeClass('uk-invisible').attr('aria-hidden', false);
                } else {
                    $('.details-nav-right', $nav).addClass('uk-invisible').attr('aria-hidden', true);
                }

                $('.details-nav-text', $nav).removeClass('uk-invisible').html(function () {
                    return self._translate('one_of_many', '%o of %m').replace('%o', index + 1).replace('%m', n);
                });

                // hide navigation buttons
            } else {
                $('li', $nav).addClass('uk-invisible').attr('aria-hidden', true);
            }

            // show relevant buttons
            this._showButtons();

            // get item details
            this._getItemDetails();
        },

        _getDimensions: function (file) {
            var img = new Image();

            if (!$(file).data('preview')) {
                return;
            }

            var src = $(file).data('preview');

            $(file).addClass('loading disabled').children('span.checkbox').addClass('disabled');

            img.onload = function () {
                $(file).attr({
                    'data-preview': src,
                    'data-width': img.width,
                    'data-height': img.height
                });

                $(file).removeClass('loading disabled').children('span.checkbox').removeClass('disabled');
            };

            img.onerror = function () {
                $(file).removeClass('loading disabled').children('span.checkbox').removeClass('disabled');
            };

            img.src = src;
        },

        _getMediaProps: function (file) {
            return new Promise(function (resolve, reject) {
                if (!file.type) {
                    return reject();
                }

                if (file.type === "video" && /\.(mp4|m4v|ogg|ogv|webm)$/i.test(file.preview) && $.support.video) {
                    var props = {}, video = document.createElement('video');

                    video.onloadedmetadata = function () {
                        props = {
                            "duration": parseInt(video.duration / 60, 10) + ':' + parseInt(video.duration % 60, 10),
                            "width": video.videoWidth,
                            "height": video.videoHeight
                        };

                        video = null;
                        resolve(props);
                    };

                    video.src = file.preview;

                } else if (file.type === "audio" && /\.(mp3|oga|ogg)$/i.test(file.preview) && $.support.audio) {
                    var props = {}, audio = document.createElement('audio');

                    audio.onloadedmetadata = function () {
                        props.duration = parseInt(audio.duration / 60, 10) + ':' + parseInt(audio.duration % 60, 10);

                        audio = null;
                        resolve(props);
                    };

                    audio.src = file.preview;

                } else if (file.type === "video" && /\.(wmv|avi|mov)$/i.test(file.preview) && $.support.video) {
                    var props = {}, video = document.createElement('video');

                    document.body.appendChild(video);

                    video.style.position = 'absolute';
                    video.style.left = '-10000px';

                    var timer = setTimeout(function () {

                        if (video && video.clientWidth) {
                            props.duration = '';
                            props.width = video.clientWidth;
                            props.height = video.clientHeight;

                            clearTimeout(timer);
                            document.body.removeChild(video);
                            video = null;
                            resolve(props);
                        }
                    }, 100);

                    video.src = file.preview;
                } else if (file.type === "image") {
                    var props = {}, image = new Image();

                    image.onload = function () {
                        props.width = image.width;
                        props.height = image.height;

                        resolve(props);
                    };

                    var src = Wf.String.encodeURI(file.preview) + '?' + new Date().getTime();

                    if (/:\/\//.test(file.preview) || file.preview.indexOf('?') !== -1) {
                        src = file.preview;
                    }

                    image.src = src;

                } else {
                    reject();
                }
            });
        },

        /**
         * Get a file or folder's properties
         */
        _getItemDetails: function () {
            var self = this,
                mime;

            var item = $('li.selected.active', '#item-list');
            var title = Wf.String.basename($(item).attr('title'));
            var type = $(item).hasClass('folder') ? 'folder' : 'file';

            $('#browser-details-text').empty().addClass('loading');

            var path = Wf.String.path(this._dir, Wf.String.encodeURI(title));

            var name = title,
                ext = '';

            $(self.element).next('span.loader').remove();

            if (type == 'file') {
                name = Wf.String.stripExt(title);
                ext = Wf.String.getExt(title);
            }

            // create properties list
            var info = document.createElement('div');
            $(info).addClass('uk-comment uk-height-1-1').append('<div class="uk-comment-header"><h5 class="uk-width-1-1 uk-margin-remove uk-text-bold uk-text-truncate" title="' + name + '">' + name + '</h5><div class="uk-comment-meta">' + ext + ' ' + self._translate(type, Wf.String.ucfirst(type)) + '</div><div class="uk-comment-meta" id="info-properties"><div></div>');

            // additional data for file items
            $(info).append('<div class="uk-comment-body uk-width-1-1 uk-text-center" id="info-preview"></div>');

            // remove the loader and append info
            $('#browser-details-text').removeClass('loading').empty().append(info);

            var comments = '';

            // check if item writable - show warning
            if ($(item).hasClass('notwritable')) {
                comments +=
                    '<li class="comments ' + type + ' notwritable">' +
                    '<span class="hastip" title="' + self._translate('notwritable_desc', 'Unwritable') + '">' + self._translate('notwritable', 'Unwritable') + '</span>' +
                    '</li>';
            }

            // check if item websafe - show warning
            /*if ($(item).hasClass('notsafe')) {
                comments +=
                    '<li class="comments ' + type + ' notsafe">' +
                    '<span class="hastip" title="' + self._translate('bad_name_desc', 'Bad file or folder name') + '">' + self._translate('bad_name', 'Bad file or folder name') + '</span>' +
                    '</li>';
            }*/

            // process triggered buttons
            if ($(item).data('trigger')) {
                $.each($(item).data('trigger').split(','), function (i, v) {
                    if (v !== '') {
                        var button = self._getButton(type, v);

                        if (button) {
                            self._showButton(button.element, button.single, button.multiple);
                        }
                    }
                });
            }

            // Size
            if ($(item).data('size')) {
                $('.uk-comment-header', info).append('<div class="uk-comment-meta" id="info-size">' + tinyMCEPopup.getLang('dlg.size', 'Size') + ': ' + Wf.String.formatSize($(item).data('size')) + '</div>');
            }

            // Modified
            if ($(item).data('modified')) {
                $('.uk-comment-header', info).append('<div class="uk-comment-meta" id="info-modified">' + tinyMCEPopup.getLang('dlg.modified', 'Modified') + ': ' + Wf.String.formatDate($(item).data('modified'), self.options.date_format) + '</div>');
            }

            // Permissions
            if ($(item).data('permissions')) {
                $('.uk-comment-header', info).append('<div class="uk-comment-meta" id="info-permissions">' + tinyMCEPopup.getLang('dlg.permissions', 'Permissions') + ': ' + $(item).data('permissions') + '</div>');
            }

            if (comments) {
                $('#browser-details-comment').empty().append('<ul>' + comments + '</ul>');
            }

            $('span.hastip', $('#browser-details-comment')).tips();

            if (type === "folder") {
                self._trigger('onFolderDetails', null, item);
            } else {
                // Process properties callback
                self.serializeItemData(item).then(function (data) {

                    function callback(data) {
                        // Dimensions (will only apply to file items)
                        if (data.width && data.height) {
                            $('.uk-comment-header', info).append('<div class="uk-comment-meta" id="info-dimensions">' + self._translate('dimensions', 'Dimensions') + ': ' + data.width + ' x ' + data.height + '</div>');

                            // create thumbnail preview
                            if (mime && mime === "image") {
                                $('#info-preview').empty().append('<img src="' + data.preview + '" alt="" />').removeClass('loading');
                            }
                        }

                        // Duration (will only apply to file items)
                        if (data.duration) {
                            $('.uk-comment-header', info).append('<div class="uk-comment-meta" id="info-duration">' + tinyMCEPopup.getLang('dlg.duration', 'Duration') + ': ' + data.duration + '</div>');
                        }

                        self._trigger('onFileDetails', [item, data]);
                    }

                    $.each(data, function (key, value) {
                        $(item).data(key, value);
                    });

                    // get mime type
                    mime = getMimeType(ext);

                    // only process mime-types that can have dimensions or duration
                    if (mime && /^(image|video|audio)$/.test(mime)) {
                        // check if image has dimensions
                        if (mime === "image") {
                            if (data.width && data.height) {
                                return callback(data);
                            }
                        }
                        // check if video has dimensions and duration
                        if (mime === "video") {
                            if (data.width && data.height && data.duration) {
                                return callback(data);
                            }
                        }
                        // check that audio has duration
                        if (mime === "audio") {
                            if (data.duration) {
                                return callback(data);
                            }
                        }

                        self._getMediaProps({
                            "preview": data.preview,
                            "type": mime
                        }).then(function (o) {
                            $.each(o, function (key, value) {
                                data[key] = value;
                                $(item).data(data);
                            });

                            callback(data);
                        }, function () {
                            Wf.JSON.request('getDimensions', [path], function (o) {
                                if (o && !o.error) {
                                    $.each(o, function (key, value) {
                                        data[key] = value;
                                        $(item).data(data);
                                    });
                                }
                                callback(data);
                            });
                        });
                    }
                });
            }
        }
    };

    // jQuery hook
    $.fn.filebrowser = function (options) {
        $(this).addClass('filebrowser');

        var instance = new FileBrowser(this, options);

        $(this).on('filebrowser:insert', function (e, cb) {
            var selected = instance.getSelectedItems();

            var promises = [];

            $(selected).each(function () {
                promises.push(instance.serializeItemData(this));
            });

            Promise.all(promises).then(function (props) {
                if (typeof cb === "function") {
                    return cb(selected, props);
                }

                return props;
            });
        });

        $(this).on('filebrowser:status', function (e, status) {
            instance.setStatus(status);
        });

        $(this).on('filebrowser:load', function (e, url) {
            return instance.load(url);
        });

        $(this).on('filebrowser:refresh', function () {
            return instance.refresh();
        });

        $(this).on('filebrowser:sort', function () {
            return instance._showItemDetails();
        });

        // expose FileBrowser functions
        $.fn.filebrowser.getbasedir = function () {
            return instance.getBaseDir();
        };

        $.fn.filebrowser.getcurrentdir = function () {
            return instance.getCurrentDir();
        };

        $.fn.filebrowser.getselected = function () {
            return instance.getSelectedItems();
        };

        $.fn.filebrowser.status = function (status) {
            return instance.setStatus(status);
        };

        $.fn.filebrowser.load = function (url) {
            return instance.load(url);
        };

        return this;
    };

    // expose FileBrowser object to global scope
    window.FileBrowser = FileBrowser;
})(jQuery, Wf);