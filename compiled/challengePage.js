var challengePageStart = (function () {
    'use strict';

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
    /* submit a form with XHR */
    const formToXhr = (el) => {
        const action = el.getAttribute('action');
        return action
            ? text(action, {
                method: el.method,
                body: new FormData(el),
            })
            : Promise.reject(`Form has no action: ${el}`);
    };

    function challengePage (opts) {
        const selector = '.challenge-page';
        let accepting;
        lichess.socket = new lichess.StrongSocket(opts.socketUrl, opts.data.socketVersion, {
            events: {
                reload() {
                    text(opts.xhrUrl).then(html => {
                        $(selector).replaceWith($(html).find(selector));
                        init();
                        lichess.contentLoaded($(selector)[0]);
                    });
                },
            },
        });
        function init() {
            if (!accepting)
                $('#challenge-redirect').each(function () {
                    location.href = this.href;
                });
            $(selector)
                .find('form.accept')
                .on('submit', function () {
                accepting = true;
                $(this).html('<span class="ddloader"></span>');
            });
            $(selector)
                .find('form.xhr')
                .on('submit', function (e) {
                e.preventDefault();
                formToXhr(this);
                $(this).html('<span class="ddloader"></span>');
            });
            $(selector)
                .find('input.friend-autocomplete')
                .each(function () {
                const input = this;
                lichess.userComplete().then(uac => uac({
                    input: input,
                    friend: true,
                    tag: 'span',
                    focus: true,
                    onSelect: () => setTimeout(() => input.parentNode.submit(), 100),
                }));
            });
        }
        init();
        function pingNow() {
            if (document.getElementById('ping-challenge')) {
                lichess.socket.send('ping');
                setTimeout(pingNow, 9000);
            }
        }
        pingNow();
    }

    return challengePage;

}());
