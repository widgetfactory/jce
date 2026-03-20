const each = tinymce.each, explode = tinymce.explode;

export function compileInvalidAttrValueRules(list) {
    var rules = [];
    var items = explode(list);

    each(items, function (item) {
        var m;

        item = (item || '').trim();
        
        if (!item) {
            return;
        }

        m = /([a-z0-9\*]+)\[([a-z0-9\-]+)([\^\$\!~\*]?=)?["']?([^"']+)?["']?\]/i.exec(item);

        if (m && m.length === 5) {
            rules.push({
                type: 'bracket',
                tag: m[1].toLowerCase(),
                attrib: m[2].toLowerCase(),
                expr: typeof m[3] === 'undefined' ? null : (m[3] || ''),
                check: (m[4] || '')
            });

            return;
        }

        rules.push({
            type: 'pattern',
            tag: '*',
            pattern: item
        });
    });

    return rules;
}

function attrFilter(value, expr, check) {
    return !expr ? !!check :
        expr === "=" ? value === check :
            expr === "*=" ? value.indexOf(check) >= 0 :
                expr === "~=" ? (" " + value + " ").indexOf(" " + check + " ") >= 0 :
                    expr === "!=" ? value != check :
                        expr === "^=" ? value.indexOf(check) === 0 :
                            expr === "$=" ? value.substr(value.length - check.length) === check :
                                false;
}

export function isInvalidAttributeValue(tag, name, value, rules) {
    var r, rx, k;

    for (k = 0; k < rules.length; k++) {
        r = rules[k];

        if (r.type === 'pattern') {
            try {
                rx = new RegExp('^' + r.pattern + '$', 'i');
            } catch (e) {
                rx = null;
            }

            if ((rx && rx.test(name)) || r.pattern.toLowerCase() === name) {
                return true;
            }
        } else if (r.type === 'bracket') {            
            if (r.tag !== '*' && tag !== r.tag) {                
                continue;
            }

            if (name !== r.attrib) {
                continue;
            }

            if (!r.expr || attrFilter(value, r.expr, r.check)) {
                return true;
            }
        }
    }

    return false;
}