// https://stackoverflow.com/questions/15579702/split-an-array-into-n-arrays-php/53130329#53130329
function partition(array, maxrows) {
    var size = array.length;
    var columns = Math.ceil(size / maxrows);

    var fullrows = size - (columns - 1) * maxrows;
    var result = [];

    for (var i = 0; i < maxrows; ++i) {
        var n = array.splice(0, (i < fullrows ? columns : columns - 1));
        result.push(n);
    }

    return result;
}

function flattenObjectToArray(obj) {
    var values = [];

    for (var key in obj) {
        var value = obj[key];
        
        if (!value) {
            return true;
        }

        if (tinymce.is(value, 'function')) {
            return true;
        }

        if (tinymce.is(value, 'object')) {
            value = flattenObjectToArray(value);
        }

        if (typeof value === 'string') {
            value = value.split(' ');
        }

        values = values.concat(value);
    }

    return values;
}

export default {
    flattenObjectToArray : flattenObjectToArray,
    partition : partition
};