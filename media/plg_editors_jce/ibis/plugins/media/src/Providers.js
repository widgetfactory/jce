import { each, isNonEditable, isLocalUrl, stripQuery, normalizeUrl, escapeRegex } from './Utils.js';

var sandbox_iframes_exclusions = [
    'youtube.com',
    'youtube-nocookie.com',
    'youtu.be',
    'vimeo.com',
    'player.vimeo.com',
    'dailymotion.com',
    'embed.music.apple.com',
    'open.spotify.com',
    'giphy.com',
    'dai.ly',
    'codepen.io',
    'maps.google.com',
    'google.com/maps',
    'docs.google.com',
    'google.com/docs',
    'sheets.google.com',
    'google.com/sheets',
    'slides.google.com',
    'google.com/slides',
    'forms.google.com',
    'google.com/forms',
    'canva.com',
    'slideshare.net',
    'slides.com',
    'facebook.com',
    'instagram.com',
    'bandcamp.com',
    'calendly.com'
];

function extendSandboxExclusions(items) {
    if (items && items.length) {
        Array.prototype.push.apply(sandbox_iframes_exclusions, items);
    }
}

var mediaProviders = {
    'youtube': /youtu(\.)?be(.+)?\/(.+)/,
    'vimeo': /vimeo(.+)?\/(.+)/,
    'dailymotion': /dai\.?ly(motion)?(\.com)?/,
    'scribd': /scribd\.com\/(.+)/,
    'slideshare': /slideshare\.net\/(.+)\/(.+)/,
    'soundcloud': /soundcloud\.com\/(.+)/,
    'spotify': /spotify\.com\/(.+)/,
    'ted': /ted\.com\/talks\/(.+)/,
    'twitch': /twitch\.tv\/(.+)/,
    'facebook': /facebook\.com\/(.+)/,
    'instagram': /instagram\.com\/(.+)/,
    'bandcamp': /bandcamp\.com\/(.+)/,
    'calendly': /calendly\.com\/(.+)/
};

// Media types supported by this plugin
var mediaTypes = {
    "video": {
        type: 'video/mpeg'
    },
    "audio": {
        type: 'audio/mpeg'
    },
    "iframe": {},
    "pdf": {
        type: "application/pdf"
    }
};

var lookup = {};
var mimes = {};

// Parses the default mime types string into a mimes lookup map
(function (data) {
    var items = data.split(/,/),
        i, y, ext;

    for (i = 0; i < items.length; i += 2) {
        ext = items[i + 1].split(/ /);

        for (y = 0; y < ext.length; y++) {
            mimes[ext[y]] = items[i];
        }
    }
})(
    "application/pdf,pdf," +
    "audio/mpeg,mpga mpega mp2 mp3," +
    "audio/ogg,ogg spx oga," +
    "audio/x-wav,wav," +
    "video/mpeg,mpeg mpg mpe," +
    "video/mp4,mp4 m4v," +
    "video/ogg,ogg ogv," +
    "video/webm,webm," +
    "video/x-flv,flv," +
    "video/3gpp,3gp," +
    "video/x-matroska,mkv"
);

each(mediaTypes, function (value, key) {
    value.name = key;

    if (value.classid) {
        lookup[value.classid] = value;
    }

    if (value.type) {
        lookup[value.type] = value;
    }

    lookup[key.toLowerCase()] = value;
});

function objectRequiresEmbed(type) {
    return type !== 'application/pdf';
}

function getMediaProps(ed, data, provider) {
    var value = data.src || '';

    var defaultValues = {
        'youtube': {
            'src': value,
            'width': 560,
            'height': 315,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'allow': "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
            'sandbox': false,
            'oembed': true
        },
        'vimeo': {
            'src': value,
            'width': 560,
            'height': 315,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'allow': "autoplay; fullscreen",
            'sandbox': false,
            'oembed': true
        },
        'dailymotion': {
            'src': value,
            'width': 640,
            'height': 360,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'allow': "autoplay; fullscreen",
            'sandbox': false,
            'oembed': true
        },
        'video': {
            'src': value,
            'controls': true,
            'type': 'video/mpeg'
        },
        'slideshare': {
            'src': '',
            'width': 427,
            'height': 356,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'allow': "fullscreen",
            'sandbox': false,
            'oembed': true
        },
        'soundcloud': {
            'src': '',
            'width': '100%',
            'height': 400,
            'frameborder': 0,
            'scrolling': 'no',
            'allow': "autoplay; fullscreen",
            'sandbox': false,
            'oembed': true
        },
        'spotify': {
            'src': value,
            'width': 300,
            'height': 380,
            'frameborder': 0,
            'allowtransparency': true,
            'allow': "encrypted-media",
            'sandbox': false,
            'oembed': true
        },
        'ted': {
            'src': '',
            'width': 560,
            'height': 316,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'allow': "fullscreen",
            'sandbox': false,
            'oembed': true
        },
        'twitch': {
            'src': '',
            'width': 500,
            'height': 281,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'allow': "autoplay; fullscreen",
            'sandbox': false,
            'oembed': true
        },
        'instagram': {
            'src': '',
            'width': 400,
            'height': 480,
            'frameborder': 0,
            'allowfullscreen': "allowfullscreen",
            'sandbox': false,
            'oembed': false
        },
        'facebook': {
            'src': '',
            'frameborder': 0,
            'width': 500,
            'height': 280,
            'allowtransparency': 'allowtransparency',
            'allowfullscreen': "allowfullscreen",
            'scrolling': 'no',
            'allow': 'encrypted-media;fullscreen',
            'sandbox': false,
            'oembed': false
        },
        'calendly': {
            'src': '',
            'width': '100%',
            'height': 700,
            'frameborder': 0,
            'style': 'min-width:320px',
            'allowtransparency': true,
            'sandbox': false,
            'oembed': false
        }
    };

    value = value.replace(/[^a-z0-9-_:&;=%\?\[\]\/\.]/gi, '');

    if (!defaultValues[provider]) {
        defaultValues[provider] = {};
    }

    defaultValues[provider].src = value;

    if (provider === 'youtube') {
        var src = value.replace(/youtu(\.)?be([^\/]+)?\/(.+)/, function (a, b, c, d) {
            d = d.replace(/(watch\?v=|v\/|embed\/)/, '');

            if (b && !c) {
                c = '.com';
            }

            id = d.replace(/([^\?&#]+)/, function ($0, $1) {
                return $1;
            });

            return 'youtube' + c + '/embed/' + id;
        });

        defaultValues[provider].src = src;
    }

    if (provider === 'vimeo') {
        if (value.indexOf('player.vimeo.com/video/') == -1) {
            var id = '', hash = '', matches = /vimeo\.com\/(?:\w+\/){0,3}((?:[0-9]+\b)(?:\/[a-z0-9]+)?)/.exec(value);

            if (matches && ibis.is(matches, 'array')) {
                var params = matches[1].split('/');

                var id = params[0];

                if (params.length == 2) {
                    hash = params[1];
                }

                value = 'https://player.vimeo.com/video/' + id + (hash ? '?h=' + hash : '');
            }
        }

        defaultValues[provider].src = value;
    }

    if (provider === 'dailymotion') {
        var id = '', s = /dai\.?ly(motion)?(.+)?\/(swf|video)?\/?([a-z0-9]+)_?/.exec(value);

        if (s && ibis.is(s, 'array')) {
            id = s.pop();
        }

        defaultValues[provider].src = 'https://dailymotion.com/embed/video/' + id;

        if (s.indexOf('player.html?video=') !== -1) {
            defaultValues[provider].src = s;
        }
    }

    if (provider === 'spotify') {
        defaultValues[provider].src = value.replace(/open\.spotify\.com\/track\//, 'open.spotify.com/embed/track/');
    }

    if (provider === 'ted') {
        defaultValues[provider].src = value.replace(/www\.ted.com\/talks\//, 'embed.ted.com/talks/');
    }

    if (provider === 'twitch') {
        defaultValues[provider].src = value.replace(/twitch\.tv\//, 'player.twitch.tv/?channel=');
    }

    if (provider === 'instagram') {
        value = value.replace(/\/\?.+$/gi, '');
        value = value.replace(/\/$/, '');

        defaultValues[provider].src = value + '/embed/captioned';
    }

    if (provider === 'facebook') {
        var url = 'https://www.facebook.com/plugins/';

        if (value.indexOf('/videos/') !== -1) {
            url += 'video.php?href=';
        }

        if (value.indexOf('/posts/') !== -1) {
            url += 'post.php?href=';

            defaultValues[provider].height = 247;

            value = value.replace(/\?.+$/, '');
        }

        defaultValues[provider].src = url + encodeURIComponent(value);
    }

    if (provider === 'calendly') {
        value = value.replace(/\?.+$/, '');
        value = value.replace(/\/$/, '');

        defaultValues[provider].src = value;
    }

    return defaultValues[provider];
}

function updateSandbox(editor, node) {
    var src = node.attr('src');

    if (node.attr('sandbox')) {
        return;
    }

    var provider = isSupportedMedia(editor, src), defaultAttributes = getMediaProps(editor, { src: src }, provider);

    if (defaultAttributes.sandbox === false) {
        node.attr('sandbox', null);
    } else {
        node.attr('sandbox', defaultAttributes.sandbox || '');
    }

    if (isLocalUrl(editor, src)) {
        node.attr('sandbox', null);

        return;
    }

    if (editor.getParam('media_iframes_sandbox', true) === false) {
        node.attr('sandbox', null);

        return;
    }

    try {
        var url = new URL(src);

        var host = url.host.toLowerCase();
        var path = url.pathname.toLowerCase();
        var cleanHost = host.indexOf('www.') === 0 ? host.substring(4) : host;

        var site = cleanHost + path;

        var shouldExclude = sandbox_iframes_exclusions.some(function (value) {
            if (!value) {
                return false;
            }

            var exclusion = String(value).toLowerCase();

            exclusion = exclusion.replace(/^[a-z0-9.+-]+:\/\//, '');

            if (exclusion.indexOf('www.') === 0) {
                exclusion = exclusion.substring(4);
            }

            exclusion = exclusion.replace(/\/+$/, '');

            if (site.indexOf(exclusion) === 0) {
                return true;
            }

            if (cleanHost.indexOf(exclusion) === 0) {
                return true;
            }

            return false;
        });

        if (shouldExclude) {
            node.attr('sandbox', null);
        }
    } catch (e) {
        // ignore
    }
}

function isSupportedProvider(editor, url) {
    var providers = editor.settings.media_iframes_supported_media || Object.keys(mediaProviders);
    var supported = false;

    if (typeof providers === 'string') {
        providers = providers.split(',').map(function (s) {
            return s.trim();
        });
    }

    var testUrl = normalizeUrl(url);

    for (var i = 0; i < providers.length; i++) {
        var key = providers[i];

        if (!key) {
            continue;
        }

        var trimmed = key.replace(/\/+$/, '');

        var rx;

        if (mediaProviders[key]) {
            rx = mediaProviders[key];
        } else {
            var base = escapeRegex(normalizeUrl(trimmed));

            rx = new RegExp('^' + base);
        }

        if (rx.test(testUrl)) {
            supported = mediaProviders[key] ? key : 'iframe';
            break;
        }
    }

    return supported;
}

function isValidElement(editor, value) {
    var elements = editor.getParam('media_valid_elements', '', 'hash');
    return elements[value] || false;
}

function isSupportedUrl(editor, tag, url) {
    if (editor.settings['media_' + tag + '_allow_local']) {
        return isLocalUrl(editor, url);
    }

    return true;
}

function isSupportedIframe(editor, url) {
    if (!isValidElement(editor, 'iframe')) {
        return false;
    }

    if (!url) {
        return false;
    }

    if (editor.settings.media_iframes_allow_local) {
        return isLocalUrl(editor, url);
    }

    var value = isSupportedProvider(editor, url);

    if (editor.settings.media_iframes_allow_supported) {
        if (isLocalUrl(editor, url)) {
            return true;
        }

        return value;
    }

    if (value) {
        return value;
    }

    return true;
}

function isSupportedMedia(editor, url, type) {
    url = url || '';

    url = stripQuery(url);
    var ext = url.split('.').pop().toLowerCase();
    type = (type || '').toLowerCase();

    var audioExts = ['mp3', 'ogg', 'webm', 'wav', 'm4a', 'aiff'];
    var videoExts = ['mp4', 'ogv', 'ogg', 'webm', 'mpg', 'mpeg'];
    var objectExts = ['pdf'];
    var objectTypes = ['application/pdf'];

    if (type.startsWith('audio/')) {
        if (!audioExts.includes(ext)) {
            return false;
        }
        if (isValidElement(editor, 'audio') && isSupportedUrl(editor, 'audio', url)) {
            return 'audio';
        }
    }

    if (type.startsWith('video/')) {
        if (!videoExts.includes(ext)) {
            return false;
        }
        if (isValidElement(editor, 'video') && isSupportedUrl(editor, 'video', url)) {
            return 'video';
        }
    }

    // object types are matched on mime alone, as the url may have no file extension
    if (objectTypes.includes(type) && isValidElement(editor, 'object') && isSupportedUrl(editor, 'object', url)) {
        return 'object';
    }

    if (videoExts.includes(ext) && isValidElement(editor, 'video') && isSupportedUrl(editor, 'video', url)) {
        return 'video';
    }

    if (audioExts.includes(ext) && isValidElement(editor, 'audio') && isSupportedUrl(editor, 'audio', url)) {
        return 'audio';
    }

    if (objectExts.includes(ext) && isValidElement(editor, 'object') && isSupportedUrl(editor, 'object', url)) {
        return 'object';
    }

    var value = isSupportedIframe(editor, url);

    if (value) {
        return 'iframe';
    }

    return false;
}

var validateIframe = function (editor, node) {
    var src = node.attr('src');

    if (isNonEditable(editor, node)) {
        return true;
    }

    if (node.attributes.length === 0) {
        return false;
    }

    return isSupportedIframe(editor, src);
};

export {
    extendSandboxExclusions,
    mediaProviders, mediaTypes, lookup, mimes,
    objectRequiresEmbed,
    getMediaProps, updateSandbox,
    isSupportedProvider, isValidElement, isSupportedUrl, isSupportedIframe,
    isSupportedMedia, validateIframe
};
