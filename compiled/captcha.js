(function () {
    'use strict';

    const defined = (v) => typeof v !== 'undefined';

    const defaultInit = {
        cache: 'no-cache',
        credentials: 'same-origin', // required for safari < 12
    };
    const xhrHeader = {
        'X-Requested-With': 'XMLHttpRequest', // so lila knows it's XHR
    };
    /* fetch a string */
    const text = (url, init = {}) => textRaw(url, init).then(res => {
        if (res.ok)
            return res.text();
        throw res.statusText;
    });
    const textRaw = (url, init = {}) => fetch(url, Object.assign(Object.assign(Object.assign({}, defaultInit), { headers: Object.assign({}, xhrHeader) }), init));
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
    };

    /* kind like $.data, except simpler */
    const makeKey = (key) => `lichess-${key}`;
    const get = (owner, key) => owner[makeKey(key)];

    lichess.load.then(() => {
        setTimeout(() => {
            $('div.captcha').each(function () {
                const $captcha = $(this), $board = $captcha.find('.mini-board'), $input = $captcha.find('input').val(''), cg = get($board[0], 'chessground'), fen = cg.getFen(), destsObj = $board.data('moves'), dests = new Map();
                for (const k in destsObj)
                    dests.set(k, destsObj[k].match(/.{2}/g));
                cg.set({
                    turnColor: cg.state.orientation,
                    movable: {
                        free: false,
                        dests,
                        color: cg.state.orientation,
                        events: {
                            after(orig, dest) {
                                $captcha.removeClass('success failure');
                                submit(orig + ' ' + dest);
                            },
                        },
                    },
                });
                const submit = function (solution) {
                    $input.val(solution);
                    text(url($captcha.data('check-url'), { solution })).then(data => {
                        $captcha.toggleClass('success', data == '1').toggleClass('failure', data != '1');
                        if (data == '1')
                            get($board[0], 'chessground').stop();
                        else
                            setTimeout(() => cg.set({
                                fen: fen,
                                turnColor: cg.state.orientation,
                                movable: { dests },
                            }), 300);
                    });
                };
            });
        }, 1000);
    });

}());
