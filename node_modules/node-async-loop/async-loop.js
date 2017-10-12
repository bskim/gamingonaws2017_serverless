'use strict';

var asyncLoop = function (array)
{
    var object;
    if (!Array.isArray(array))
    {
        object = array;
        array = Object.keys(array);
    }

    var callbackPos = 1;
    while (callbackPos < 3)
    {
        if (typeof arguments[callbackPos] === 'function')
            break;
        callbackPos++;
    }

    var from = (callbackPos >= 2) ? arguments[1] : 0;
    var to = (callbackPos >= 3) ? arguments[2] : ((from >= 0) ? array.length - 1 : 0);
    var callback = arguments[callbackPos];
    var endCallback = arguments[callbackPos + 1];

    if (from < 0)
        from = array.length + from;
    if (to < 0)
        to = array.length + to;
    var step = (from > to) ? -1 : 1;

    doAsyncLoop(array, object, callback, endCallback, from, to, step);
};

var doAsyncLoop = function (array, object, callback, endCallback, currentIndex, to, step)
{
    if (step > 0)
    {
        if (currentIndex > to)
        {
            if (endCallback)
                endCallback(null);
            return;
        }
    }
    else
    {
        if (currentIndex < to)
        {
            if (endCallback)
                endCallback(null);
            return;
        }
    }

    var item;
    if (object)
    {
        item = {
            key: array[currentIndex],
            value: object[array[currentIndex]]
        };
    }
    else
        item = array[currentIndex];

    callback(item, function (err)
    {
        if (err)
        {
            if (endCallback)
                endCallback(err);
            return;
        }

        doAsyncLoop(array, object, callback, endCallback, currentIndex + step, to, step);
    });
};

module.exports = asyncLoop;