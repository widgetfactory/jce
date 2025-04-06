/* eslint-disable consistent-this */
/* global jQuery */
(function ($) {
    var specialKeyCodeMap = {
        9: 'tab',
        17: 'ctrl',
        18: 'alt',
        27: 'esc',
        32: 'space',
        37: 'left',
        39: 'right',
        13: 'enter',
        91: 'cmd',
        38: 'up',
        40: 'down'
    };

    // http://stackoverflow.com/a/6969486
    function escapeRegExChars(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    }

    $.fn.datalist = function (settings) {
        settings = $.extend({
            "seperator": " ",
            "loading": "Loading..."
        }, settings);

        return this.each(function () {
            var select = this, options = [], multiple = $(this).prop('multiple'), id = $(this).attr('id');

            // an input node requires an associated datalist
            if (this.nodeName === 'INPUT' && !this.list) {
                return false;
            }

            // wrap in control div
            $(this).wrap('<div class="uk-datalist-control" role="combobox" aria-autocomplete="list" aria-haspopup="true" aria-expanded="false" aria-owns="' + id + '_datalist_menu" data-label-loading="' + settings.loading + '"></div>');

            // set the parent container
            var container = $(this).parent();

            // update attributes
            $(container).attr('aria-multiselectable', multiple);

            // hide select
            $(this).hide().attr('aria-hidden', 'true').attr('tabindex', '-1');

            // create input element
            var input = $('<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="..." />');

            // create list button - non-focusable
            var btn = $('<button type="button" class="uk-button uk-datalist-button" tabindex="-1"></button');

            // wrap combobox elements
            var combobox = $('<div class="uk-datalist-combobox"></div>').appendTo(container).append([input, btn]);

            // not a datalist
            if (this.nodeName === 'SELECT') {
                $(combobox).addClass('uk-datalist-placeholder');
                $(input).prop('readonly', true).attr('placeholder', '');
            }

            // create menu with select options
            var menu = $('<div id="' + id + '_datalist_menu" class="uk-dropdown uk-dropdown-scrollable uk-datalist-dropdown" role="listbox" aria-multiselectable="' + (!!multiple) + '"><ul class="uk-nav uk-nav-dropdown"></ul></div>').appendTo(select.parentNode);

            // add new menu items if options are updated
            $(select).on('update:option', function (e, option) {
                var $item;

                if (option.type === "optgroup") {
                    $item = $('<li class="uk-nav-header" tabindex="-1">' + option.text + '</li>');
                } else {
                    $item = $('<li title="' + option.text + '" data-value="' + option.value + '" role="option"><a href="#" role="presentation">' + option.text + '</a></li>');
                }

                $.each(['style', 'class'], function (i, attr) {
                    if (option[attr]) {
                        $item.attr(attr, option[attr]);
                    }
                });

                $('ul', menu).append($item);

                if (option.selected) {
                    updateComboBox(option);
                }
            }).on('change.datalist', function (e, o) {
                if (o && o.internal) {
                    return;
                }

                $(this).trigger('datalist:update', { change: true });
            });

            function removeTag(tag) {
                var values = $(select).val();

                if (typeof values === 'string') {
                    values = values.split(settings.seperator);
                }

                values = values.filter(function (value) {
                    if (value !== $(tag).val()) {
                        return true;
                    }
                });

                // remove from select values
                $(select).val(function () {
                    if (this.nodeName === 'INPUT') {
                        return values.join(settings.seperator);
                    }

                    return values;
                });

                // udpate select
                $(select).trigger('change', { internal: true });

                // remove tag
                $(tag).remove();
            }

            function updateComboBox(data) {
                if (!settings.input && !data.text) {
                    $('option', select).each(function () {
                        if (this.value === data.value) {
                            data.text = $(this).attr('label') || $(this).text();
                        }
                    });
                }

                $(input).val($.trim(data.text || data.value)).trigger('datalist-input:clear');

                if (multiple) {
                    // clear input and focus
                    $(input).val('');

                    var found = false;

                    // tag already exists
                    $('button', container).each(function () {
                        if (this.value === data.value) {
                            found = true;
                        }
                    });

                    if (found) {
                        return;
                    }

                    $('<button class="uk-button uk-datalist-tag" role="presentation" aria-label="" value="' + data.value + '"><label>' + data.value + '</label></button>').on('click', function (e) {
                        e.preventDefault();

                        if (e.target.nodeName === "LABEL") {
                            return;
                        }

                        removeTag(this);
                    }).insertBefore(combobox);
                }
            }

            function selectItem(data) {
                var values = $(select).val();

                if (typeof values === 'string') {
                    values = values.split(settings.seperator);
                }

                if (!Array.isArray(values)) {
                    values = [values];
                }

                var value = data.value || '';

                // already selected and tagged, clear and focus
                if (multiple && $.inArray(value, values) > -1) {
                    $(input).val('').trigger('focus');
                    return;
                }

                updateComboBox(data);

                // update with single value
                if (!multiple) {
                    values = [value];

                } else {
                    // add new value to select array
                    values.push(value);
                }

                $(select).val(function () {
                    if (this.nodeName === 'INPUT') {
                        return values.join(settings.seperator);
                    }

                    return values;
                });

                // filter out original options from set values
                var i = values.length;

                while (i--) {
                    var val = values[i];

                    // eslint-disable-next-line no-loop-func
                    $.each(options, function (x, opt) {
                        if (opt.value === val) {
                            values.splice(i, 1);
                        }
                    });
                }

                // get datalist or select
                var list = select.list || select;

                // create new options from remaining values and set selected
                $.each(values, function (i, val) {
                    $(list).append(new Option(val, val, false, true));
                });

                // trigger change
                $(select).trigger('change', { internal: true });
            }

            function selectMenuItem(e) {
                e.preventDefault();

                var el = e.target;

                if (el.nodeName === "A") {
                    el = el.parentNode;
                }

                // must be a list item
                if (el.nodeName !== "LI") {
                    return;
                }

                var data = { text: el.title, value: el.getAttribute('data-value') };

                selectItem(data);

                hideMenu();
            }

            // select item on click
            $(menu).on('mousedown click touchstart', function (e) {
                selectMenuItem(e);
            });

            var $items, focusIdx = -1;

            function hideMenu(e) {
                if (!isMenuOpen()) {
                    return;
                }

                $(menu).attr('aria-hidden', 'true').parent().removeClass('uk-open');
                // reset focus index
                focusIdx = -1;
                // update aria
                $([container, menu]).attr('aria-expanded', 'false');

                if (e) {
                    // focus input
                    $(input).trigger('focus');
                }
            }

            function positionMenu() {
                var ch = $(container).outerHeight(), pos = $(container).offset(), top = pos.top + ch + 2;

                menu.css({
                    top: top,
                    left: pos.left,
                    width: $(container).outerWidth(),
                    maxHeight: settings.maxHeight || 160
                });

                // re-position menu above input
                if ($(menu).height() + top > $(window).height()) {
                    $(menu).css('top', pos.top - $(menu).outerHeight() - 2);
                }
            }

            function showMenu() {
                menu.attr('aria-hidden', 'false').parent().addClass('uk-open');

                positionMenu();

                $([container, menu]).attr('aria-expanded', 'true');

                // update items list
                $items = $('li', menu);

                var values = $(select).val();

                if (!Array.isArray(values)) {
                    values = [values];
                }

                $items.each(function () {
                    var val = this.getAttribute('data-value');
                    $(this).toggleClass('uk-active', $.inArray(val, values) !== -1);
                });
            }

            function isMenuOpen() {
                return $(menu).parent().hasClass('uk-open');
            }

            function moveFocus(dir) {
                focusIdx += dir;

                // get filtered list
                var $filtered = $items.filter(':visible').filter(function () {
                    return this.getAttribute('tabindex') > -1;
                });

                // return focus to input
                if (focusIdx < 0) {
                    $(input).trigger('focus');
                    return;
                    // end
                } else if (focusIdx >= $filtered.length) {
                    return;
                }

                // blur all items
                $items.trigger('blur');

                // focus item
                $filtered.eq(focusIdx).attr('tabindex', 0).trigger('focus');
            }

            $(input).on('keydown', function (e) {
                switch (e.keyCode) {
                    // enter
                    case 13:
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        if (this.value === "") {
                            showMenu();
                            moveFocus(1);
                        } else {
                            selectItem({ value: this.value, text: '' });
                            hideMenu(e);
                        }
                        break;
                    // down arrow
                    case 40:
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        showMenu();
                        moveFocus(1);
                        break;
                    // backspace
                    case 8:
                        // keep normal behaviour while input has a value
                        if (this.value) {
                            return;
                        }

                        var $tags = $('.uk-datalist-tag', container);

                        if ($tags.length) {
                            var val = $tags.last().val();

                            // remove tag
                            removeTag($tags.last());

                            e.preventDefault();

                            // update value with tag value and focus
                            $(this).val(val).trigger('focus');
                        }
                        break;
                }
            });

            $(input).on('keyup paste', function (e) {
                // create tag on space / seperator input
                if (multiple && e.originalEvent.key === settings.seperator) {
                    selectItem({ value: $.trim(this.value), text: '' });
                    hideMenu(e);
                }

                if (specialKeyCodeMap[e.keyCode]) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                if (!this.value.length) {
                    hideMenu(e);
                } else {
                    showMenu();
                }

                var matcher = new RegExp('^' + escapeRegExChars(this.value), "i");

                $('li', menu).each(function () {
                    $(this).toggle(matcher.test($(this).data('value')));
                });
            }).on('change', function (e) {
                // clear select
                if (this.value === "") {
                    $(select).val('');
                    // update select with custom value
                } else {
                    if (!multiple) {
                        selectItem({ text: this.value, value: this.value, selected: true });
                    }

                    e.stopPropagation();
                }
            }).on('focus', function () {
                $(container).addClass('uk-focus');
            }).on('blur', function (e) {
                $(container).removeClass('uk-focus');
            }).on('datalist-input:clear', function () {
                $('li', menu).show();
            });

            $(menu).on('keydown', function (e) {
                if (isMenuOpen()) {
                    if (e.keyCode === 13) {
                        selectMenuItem(e);

                        hideMenu(e);

                        e.preventDefault();
                        e.stopPropagation();
                    }

                    // esc
                    if (e.keyCode === 27) {
                        hideMenu(e);
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }

                    // home
                    if (e.keyCode === 36) {
                        $(input).trigger('focus');
                        e.preventDefault();
                        return;
                    }

                    // arrow-up or arrow-down
                    if (e.keyCode === 38 || e.keyCode === 40) {
                        var dir = e.keyCode - 39;
                        moveFocus(dir);
                        e.preventDefault();
                        return;
                    }
                }
            });

            $(btn).on('click', function (e) {
                e.preventDefault();
                showMenu();
                moveFocus(1);
            });

            // hide menu if no focus
            $('body').on('mousedown touchstart keyup', function (e) {
                // only process on TAB
                if (e.keyCode && e.keyCode !== 9) {
                    return;
                }

                var elm = e.target;

                // dropdown button
                if (elm == btn.get(0)) {
                    return;
                }

                // menu box, including scrollbar
                if (elm == menu.get(0)) {
                    return;
                }

                // action is inside the menu
                if (menu.find(elm).length || $(elm).parents(menu).length) {                
                    return;
                }

                hideMenu();

                // not a datalist
                if (!select.list) {
                    return;
                }

                // action is inside the container
                if (container.find(elm).length) {
                    return;
                }

                var val = input.val();

                if (val !== '') {
                    selectItem({ text: val, value: val, select: true });
                }
            });

            $(select).on('datalist:update', function (e, o) {
                var list = select.list || select;

                o = o || {};

                // do not update on change event
                if (!o.change) {
                    // add initial list of menu items
                    $('option, optgroup', list).each(function () {
                        var text = $(this).attr('label') || $(this).text();

                        if (this.parentNode.nodeName === "OPTGROUP") {
                            $(this).addClass('uk-nav-indent');
                        }

                        var option = {
                            value: this.value,
                            text: text,
                            style: $(this).attr('style') || '',
                            selected: this.selected,
                            title: this.title || '',
                            class: $(this).attr('class') || '',
                            type: this.nodeName.toLowerCase()
                        };

                        $(select).trigger('update:option', option);
                    });
                }

                // datalist
                var values = $(this).val();

                if (values) {
                    if (typeof values === 'string') {
                        values = values.split(settings.seperator);
                    }

                    $.each(values, function (i, value) {
                        updateComboBox({ value: value });
                    });
                }

                $(this).trigger('datalist:disabled', this.disabled);

            }).on('datalist:disabled', function (e, state) {
                // update disabled state
                $([input, btn]).each(function () {
                    if (!state) {
                        $(this).prop('disabled', false).removeAttr('disabled');
                    } else {
                        $(this).prop('disabled', true);
                    }
                });
            }).on('datalist:position', function () {
                positionMenu();
            }).on('datalist:loading', function () {
                if ($(container).hasClass('uk-datalist-loading')) {
                    $(container).removeClass('uk-datalist-loading');

                    $(this).trigger('datalist:disabled', false);

                } else {
                    $(container).addClass('uk-datalist-loading');

                    $(this).trigger('datalist:disabled', true);
                }
            }).on('datalist:clear', function () {
                // clear input
                $(input).val();
                // clear menu
                $('ul', menu).empty();
            }).trigger('datalist:disabled', select.disabled);
        });
    };
})(jQuery);