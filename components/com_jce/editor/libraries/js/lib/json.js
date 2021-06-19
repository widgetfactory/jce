(function ($, Wf) {
    /**
     * Test if valid JSON string
     * https://github.com/douglascrockford/JSON-js/blob/master/json2.js
     * @param {string} s
     * @return {boolean}
     */
    function isJSON(s) {
        return /^[\],:{}\s]*$/
            .test(s.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
    }

    // uid counter
    var counter = 0;

    /**
     Generates an unique ID.
     @method uid
     @return {String} Virtually unique id.
     */
    function uid() {
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    var instance = {};

    Wf.JSON = {
        /**
         * Send JSON request
         *
         * @param func
         *            Function name to execute by the server
         * @param args
         *            String, Array or Object containing arguments to
         *            send
         * @param callback
         *            Callback function to execute
         * @param scope
         *            Scope to execute the callback in
         * @param multi
         *            Allow multiple requests on the same function
         */
        request: function (func, data, callback, scope, multi) {
            var json = {
                'method': func,
                'id': uid()
            };

            // already registered so abort in favout of new request
            if (instance[func] && !multi) {
                instance[func].abort();
            }

            callback = callback || $.noop;

            // additional POST data to add (will not be parsed by PHP json parser)
            var args = {};

            // get form input data (including token) as serialized string
            var fields = $(':input', 'form').serialize();

            // if data is a string or array
            if ($.type(data) === 'string' || $.type(data) === 'array') {
                $.extend(json, {
                    'params': $.type(data) === 'string' ? Wf.String.encodeURI(data) : $.map(data, function (s) {
                        if (s && $.type(s) === 'string') {
                            return Wf.String.encodeURI(s);
                        }

                        return s;
                    })

                });
            } else {
                // if data is an object
                if ($.type(data) === 'object' && data.json) {
                    $.extend(json, {
                        'params': data.json
                    });

                    delete data.json;
                }

                $.extend(args, data);
            }

            // add passed in data to form fields
            if (!$.isEmptyObject(args)) {
                fields += '&' + args;
            }

            var url = document.location.href;

            // replace task
            url = url.replace(/task=plugin.display/, 'task=plugin.rpc');

            function showError(e) {
                var txt = "";

                if ($.isPlainObject(e)) {
                    txt = e.text || "";
                } else {
                    txt = $.type(e) === 'array' ? e.join('\n') : e;
                }

                if (txt) {
                    // remove linebreaks
                    txt = txt.replace(/<br([^>]+?)>/, '');
                }

                // show error
                Wf.Modal.alert(txt);
            }

            instance[func] = $.ajax({
                "context": scope || this,
                "url": url,
                "dataType": "text",
                "method": "post",
                "data": "json=" + JSON.stringify(json) + '&' + fields
            }).done(function (o) {
                var r;

                if (o) {
                    // check result - should be object, parse as JSON if string
                    if ($.type(o) === 'string' && isJSON(o)) {
                        // parse string as JSON object
                        var s = JSON.parse(o);
                        // pass if successful
                        if (s) {
                            o = s;
                        }
                    }

                    // process object result
                    if ($.isPlainObject(o)) {
                        if (o.error) {
                            showError(o.text || o.error.message || '');
                        }

                        r = o.result || null;

                        if (r && r.error && r.error.length) {
                            showError(r.error || '');
                        }
                        // show error
                    } else {
                        // check for malformed JSON
                        if (/[{}]/.test(o)) {
                            showError('The server returned an invalid JSON response.');
                        } else {
                            showError(o);
                        }
                    }
                } else {
                    showError('The server returned an invalid JSON response.');
                }

                // clear instance
                instance[func] = null;

                if ($.isFunction(callback)) {
                    callback.call(scope || this, r);
                } else {
                    return r;
                }
            }).fail(function (e, status, txt) {
                // don't show alert for jQuery abort
                if (status !== "abort") {
                    Wf.Modal.alert(status || ('Server Error - ' + txt));
                }

                // clear instance
                instance[func] = null;
            });
        }
    }
})(jQuery, Wf);