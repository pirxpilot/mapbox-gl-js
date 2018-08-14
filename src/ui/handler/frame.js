'use strict';

module.exports = frame;

function frame(map, fn) {
    let id;
    let args;

    function callback() {
        id = undefined;
        fn(...args);
    }

    function request(..._args) {
        args = _args;
        if (id) return;
        id = map._requestRenderFrame(callback);
    }

    function cancel() {
        if (!id) return;
        map._cancelRenderFrame(id);
        id = undefined;
    }

    return {
        request,
        cancel
    };
}
