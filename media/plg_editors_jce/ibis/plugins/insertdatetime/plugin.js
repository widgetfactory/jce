/* eslint-disable */
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
    ibis.PluginManager.add('insertdatetime', function (ed, url) {
        var daysShort = ed.getLang('insertdatetime.day_short', 'Sun,Mon,Tue,Wed,Thu,Fri,Sat').split(',');
        var daysLong = ed.getLang('insertdatetime.day_long', 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday').split(',');
        var monthsShort = ed.getLang('insertdatetime.months_short', 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec').split(',');
        var monthsLong = ed.getLang('insertdatetime.months_long', 'January,February,March,April,May,June,July,August,September,October,November,December').split(',');

        var defaultFormat = null;

        var params = ed.getParam('insertdatetime', {});

        // Pads a numeric value with leading zeros to a minimum length
        function addZeros(value, len) {
            value = '' + value;
            while (value.length < len) {
                value = '0' + value;
            }
            return value;
        }

        // Formats a date using strftime-style tokens
        function getDateTime(fmt, date) {
            date = date || new Date();
            fmt = fmt.replace(/%D/g, '%m/%d/%Y');
            fmt = fmt.replace(/%r/g, '%I:%M:%S %p');
            fmt = fmt.replace(/%Y/g, '' + date.getFullYear());
            fmt = fmt.replace(/%y/g, '' + date.getYear());
            fmt = fmt.replace(/%m/g, addZeros(date.getMonth() + 1, 2));
            fmt = fmt.replace(/%d/g, addZeros(date.getDate(), 2));
            fmt = fmt.replace(/%H/g, '' + addZeros(date.getHours(), 2));
            fmt = fmt.replace(/%M/g, '' + addZeros(date.getMinutes(), 2));
            fmt = fmt.replace(/%S/g, '' + addZeros(date.getSeconds(), 2));
            fmt = fmt.replace(/%I/g, '' + ((date.getHours() + 11) % 12 + 1));
            fmt = fmt.replace(/%p/g, '' + (date.getHours() < 12 ? 'AM' : 'PM'));
            fmt = fmt.replace(/%B/g, '' + monthsLong[date.getMonth()]);
            fmt = fmt.replace(/%b/g, '' + monthsShort[date.getMonth()]);
            fmt = fmt.replace(/%A/g, '' + daysLong[date.getDay()]);
            fmt = fmt.replace(/%a/g, '' + daysShort[date.getDay()]);
            fmt = fmt.replace(/%%/g, '%');
            return fmt;
        }

        // Returns the configured date format, with fallback to the legacy param and then the default
        function getDateFormat() {
            return ed.getParam('insertdatetime.dateformat', ed.getParam('plugin_insertdate_dateFormat', '%Y-%m-%d'));
        }

        // Returns the configured time format, with fallback to the legacy param and then the default
        function getTimeFormat() {
            return ed.getParam('insertdatetime.timeformat', ed.getParam('plugin_insertdate_timeFormat', '%H:%M:%S'));
        }

        // Returns the list of format strings shown in the split button dropdown
        function getFormats() {
            return ed.getParam('insertdatetime.formats', ['%H:%M:%S', '%Y-%m-%d', '%I:%M:%S %p', '%D']);
        }

        // Returns the format used by the split button main action; defaults to the first in the formats list
        function getDefaultFormat() {
            if (!defaultFormat) {
                var formats = getFormats();
                defaultFormat = formats.length > 0 ? formats[0] : getTimeFormat();
            }
            return defaultFormat;
        }

        // Replaces an existing <time> element with updated datetime attribute and display text
        function updateTimeElement(timeElm, computerTime, userTime) {
            var newTimeElm = ed.dom.create('time', { datetime: computerTime }, userTime);
            ed.dom.replace(newTimeElm, timeElm);
            ed.selection.select(newTimeElm, true);
            ed.selection.collapse(false);
        }

        // Inserts the formatted date/time string, optionally wrapped in a <time> element when insertdatetime_element is enabled
        function insertDateTime(format) {
            if (ed.getParam('insertdatetime.element', false)) {
                var userTime = getDateTime(format);
                var computerTime = /%[HMSIp]/.test(format) ? getDateTime('%Y-%m-%dT%H:%M') : getDateTime('%Y-%m-%d');
                var timeElm = ed.dom.getParent(ed.selection.getStart(), 'time');

                if (timeElm) {
                    updateTimeElement(timeElm, computerTime, userTime);
                } else {
                    ed.execCommand('mceInsertContent', false, '<time datetime="' + computerTime + '">' + userTime + '</time>');
                }
            } else {
                ed.execCommand('mceInsertContent', false, getDateTime(format));
            }
        }

        ed.addCommand('mceInsertDate', function (ui, value) {
            insertDateTime(value || getDateFormat());
        });

        ed.addCommand('mceInsertTime', function (ui, value) {
            insertDateTime(value || getTimeFormat());
        });

        // Simple buttons kept for backwards compatibility
        ed.addButton('insertdate', { title: 'insertdatetime.insertdate_desc', cmd: 'mceInsertDate' });
        ed.addButton('inserttime', { title: 'insertdatetime.inserttime_desc', cmd: 'mceInsertTime' });

        // Combined split button with format picker menu
        this.createControl = function (n, cm) {            
            if (n !== 'insertdatetime') {
                return null;
            }

            var c = cm.createSplitButton('insertdatetime', {
                title: 'insertdatetime.insertdatetime_desc',
                icon: 'insertdatetime',
                onclick: function () {
                    insertDateTime(getDefaultFormat());
                }
            });

            c.onRenderMenu.add(function (c, m) {
                m.settings.fetchItems = function () {
                    var items = [];
                    ibis.each(getFormats(), function (format) {
                        items.push({
                            title: getDateTime(format),
                            onclick: function () {
                                defaultFormat = format;
                                insertDateTime(format);
                            }
                        });
                    });
                    return items;
                };
            });

            return c;
        };
    });
}());