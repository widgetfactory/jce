const explode = tinymce.explode;

export function compileInvalidAttrRules(list) {
    var items = explode(list);
    var matchers = [];
    var i, s, rx;

    for (i = 0; i < items.length; i++) {
        s = (items[i] || '').trim();

        if (!s) {
            continue;
        }

        try {
            rx = new RegExp('^(?:' + s + ')$', 'i');
            matchers.push(rx);
        } catch (e) {
            s = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            matchers.push(new RegExp('^' + s + '$', 'i'));
        }
    }

    return matchers;
}

export function isInvalidAttribute(name, rules) {
    var i;

    if (!name) {
        return false;
    }

    for (i = 0; i < rules.length; i++) {
        if (rules[i].test(name)) {
            return true;
        }
    }

    return false;
}