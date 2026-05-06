import { FONT_ICON_RE } from '../constants';

export default function createPadding(Node) {
    function paddEmptyTags(content) {
        content = content.replace(FONT_ICON_RE, '<$1$2class="$3$4$5-$6$7"$8 data-mce-empty="1">&nbsp;</$1>');
        content = content.replace(/<(a|i|span)\b([^>]+)><\/\1>/gi, '<$1$2 data-mce-empty="1">&nbsp;</$1>');
        content = content.replace(/<li><\/li>/, '<li data-mce-empty="1">&nbsp;</li>');

        return content;
    }

    function ensureEmptyInlineNodes(nodes, name) {
        var i = nodes.length;
        var node, cls;

        while (i--) {
            node = nodes[i];
            cls = (node.attr('class') || name === "li");

            if (cls && !node.firstChild) {
                node.attr('data-mce-empty', '1');
                node.append(new Node('#text', '3')).value = '\u00a0';
            }
        }
    }

    function cleanupEmptyInlineNodes(nodes) {
        var i = nodes.length;
        var node, fc;

        while (i--) {
            node = nodes[i];
            fc = node.firstChild;

            node.attr('data-mce-empty', null);

            if (fc && (fc.value === '\u00a0' || fc.value === '&nbsp;')) {
                fc.remove();
            }
        }
    }

    return {
        paddEmptyTags: paddEmptyTags,
        ensureEmptyInlineNodes: ensureEmptyInlineNodes,
        cleanupEmptyInlineNodes: cleanupEmptyInlineNodes
    };
}