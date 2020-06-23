(function () {
    function ready(fn) {
        if (document.readyState != 'loading') {
            fn();
        } else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            document.attachEvent('onreadystatechange', function () {
                if (document.readyState != 'loading') {
                    fn();
                }
            });
        }
    }

    function addEventListener(el, eventName, handler) {
        if (el.addEventListener) {
            el.addEventListener(eventName, handler);
        } else {
            el.attachEvent('on' + eventName, function () {
                handler.call(el);
            });
        }
    }

    ready(function () {
        var elms = document.querySelectorAll('img[data-mouseover]');

        for (var i = 0; i < elms.length; i++) {
            var elm = elms[i];

            var src = elm.getAttribute('src'), mouseover = elm.getAttribute('data-mouseover'), mouseout = elm.getAttribute('data-mouseout') || src;

            if (!src || !mouseover) {
                continue;
            }

            // add events
            addEventListener(elm, 'mouseover', function () {
                elm.setAttribute('src', mouseover);
            });

            addEventListener(elm, 'mouseout', function () {
                elm.setAttribute('src', mouseout);
            });
        }
    });
})();