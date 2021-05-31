var InfiniteScroll = (function () {
    'use strict';

    const spinner = '<div class="spinner"><svg viewBox="0 0 40 40"><circle cx=20 cy=20 r=18 fill="none"></circle></svg></div>';

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

    function InfiniteScroll(selector) {
        $(selector).each(function () {
            register(this, selector);
        });
    }
    function register(el, selector, backoff = 500) {
        const nav = el.querySelector('.pager'), next = nav === null || nav === void 0 ? void 0 : nav.querySelector('.pager a'), nextUrl = next === null || next === void 0 ? void 0 : next.href;
        if (nav && nextUrl)
            new Promise(res => {
                if (isVisible(nav))
                    res();
                else
                    window.addEventListener('scroll', function scrollListener() {
                        if (isVisible(nav)) {
                            window.removeEventListener('scroll', scrollListener);
                            res();
                        }
                    }, { passive: true });
            })
                .then(() => {
                nav.innerHTML = spinner;
                return text(nextUrl);
            })
                .then(html => {
                nav.remove();
                $(el).append($(html).find(selector).html());
                dedupEntries(el);
                lichess.contentLoaded(el);
                setTimeout(() => register(el, selector, backoff * 1.05), backoff); // recursion with backoff
            }, e => {
                console.log(e);
                nav.remove();
            });
    }
    function isVisible(el) {
        const { top, bottom } = el.getBoundingClientRect();
        return (top > 0 || bottom > 0) && top < window.innerHeight;
    }
    function dedupEntries(el) {
        const ids = new Set();
        $(el)
            .find('[data-dedup]')
            .each(function () {
            const id = $(this).data('dedup');
            if (id) {
                if (ids.has(id))
                    $(this).remove();
                else
                    ids.add(id);
            }
        });
    }

    return InfiniteScroll;

}());
