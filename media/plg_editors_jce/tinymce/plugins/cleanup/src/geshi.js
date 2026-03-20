export function convertFromGeshi(h) {
    return (h || '').replace(/<pre xml:lang="([^"]+)"([^>]*)>(.*?)<\/pre>/g, function (a, b, c, d) {
        var attr = '';

        if (c && /\w/.test(c)) {
            attr = c.split(' ').join(' data-geshi-');
        }

        return '<pre data-geshi-lang="' + b + '"' + attr + '>' + d + '</pre>';
    });
}

export function convertToGeshi(h) {
    return (h || '').replace(/<pre([^>]+)data-geshi-lang="([^"]+)"([^>]*)>(.*?)<\/pre>/g, function (a, b, c, d, e) {
        var s = b + d;
        s = s.replace(/data-geshi-/gi, '').replace(/\s+/g, ' ').replace(/\s$/, '');

        return '<pre xml:lang="' + c + '"' + s + '>' + e + '</pre>';
    });
}