/* global jQuery, Wf */

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

                // merge any remaining properties into the request object
                $.extend(json, data);
            }

            var url = document.location.href;

            // replace task
            url = url.replace(/task=plugin.display/, 'task=plugin.xhr');

            // Keep the CSRF token in the query string (checkToken reads GET) so the
            // request body can be sent as pure JSON. Posting the JSON-RPC payload as
            // an application/json body — instead of a "json="-encoded form field —
            // stops WAF rulesets (e.g. OWASP CRS 942xxx) false-flagging the JSON
            // punctuation as SQL injection.
            var token = $(':input', 'form').serialize().match(/(?:^|&)([0-9a-f]{32})=1(?:&|$)/);

            if (token && url.indexOf(token[1]) === -1) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + token[1] + '=1';
            }

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
                "contentType": "application/json",
                "data": JSON.stringify(json)
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
                    showError('The server returned invalid or missing data.');
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
    };
})(jQuery, Wf);