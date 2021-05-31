(function () {
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
    /* load a remote script */
    const script = (src) => new Promise((resolve, reject) => {
        const nonce = document.body.getAttribute('data-nonce'), el = document.createElement('script');
        if (nonce)
            el.setAttribute('nonce', nonce);
        el.onload = resolve;
        el.onerror = reject;
        el.src = src;
        document.head.append(el);
    });

    // Unique id for the current document/navigation. Should be different after
    // each page load and for each tab. Should be unpredictable and secret while
    // in use.
    let _sri;
    try {
        const data = window.crypto.getRandomValues(new Uint8Array(9));
        _sri = btoa(String.fromCharCode(...data)).replace(/[/+]/g, '_');
    }
    catch (_) {
        _sri = Math.random().toString(36).slice(2, 12);
    }
    const sri = _sri;

    const builder = (storage) => {
        const api = {
            get: (k) => storage.getItem(k),
            set: (k, v) => storage.setItem(k, v),
            fire: (k, v) => storage.setItem(k, JSON.stringify({
                sri,
                nonce: Math.random(),
                value: v,
            })),
            remove: (k) => storage.removeItem(k),
            make: (k) => ({
                get: () => api.get(k),
                set: (v) => api.set(k, v),
                fire: (v) => api.fire(k, v),
                remove: () => api.remove(k),
                listen: (f) => window.addEventListener('storage', e => {
                    if (e.key !== k || e.storageArea !== storage || e.newValue === null)
                        return;
                    let parsed;
                    try {
                        parsed = JSON.parse(e.newValue);
                    }
                    catch (_) {
                        return;
                    }
                    // check sri, because Safari fires events also in the original
                    // document when there are multiple tabs
                    if ((parsed === null || parsed === void 0 ? void 0 : parsed.sri) && parsed.sri !== sri)
                        f(parsed);
                }),
            }),
            makeBoolean: (k) => ({
                get: () => api.get(k) == '1',
                set: (v) => api.set(k, v ? '1' : '0'),
                toggle: () => api.set(k, api.get(k) == '1' ? '0' : '1'),
            }),
        };
        return api;
    };
    const storage = builder(window.localStorage);

    function once(key, mod) {
        if (mod === 'always')
            return true;
        if (!storage.get(key)) {
            storage.set(key, '1');
            return true;
        }
        return false;
    }

    const assetUrl = (path, opts = {}) => {
        opts = opts || {};
        const baseUrl = opts.sameDomain ? '' : document.body.getAttribute('data-asset-url'), version = opts.version || document.body.getAttribute('data-asset-version');
        return baseUrl + '/assets' + (opts.noVersion ? '' : '/_' + version) + '/' + path;
    };
    const loadedCss = new Map();
    const loadCss = (url) => {
        if (!loadedCss.has(url)) {
            loadedCss.set(url, true);
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = assetUrl(url);
            document.head.append(el);
        }
    };
    const loadedScript = new Map();
    const loadScript = (url, opts = {}) => {
        if (!loadedScript.has(url))
            loadedScript.set(url, script(assetUrl(url, opts)));
        return loadedScript.get(url);
    };
    const hopscotch = () => {
        loadCss('vendor/hopscotch/dist/css/hopscotch.min.css');
        return loadScript('vendor/hopscotch/dist/js/hopscotch.min.js', {
            noVersion: true,
        });
    };

    lichess.load.then(() => {
        $('.user-show .note-zone-toggle').each(function () {
            $(this).on('click', () => { var _a; return (_a = $('.user-show .note-zone').toggle().find('textarea')[0]) === null || _a === void 0 ? void 0 : _a.focus(); });
            if (location.search.includes('note'))
                $(this).trigger('click');
        });
        $('.user-show .claim_title_zone').each(function () {
            const $zone = $(this);
            $zone.find('.actions a').on('click', function () {
                text(this.href, { method: 'post' });
                $zone.remove();
                return false;
            });
        });
        if ($('#perfStat.correspondence .view_games').length && once('user-correspondence-view-games'))
            hopscotch().then(() => {
                window.hopscotch
                    .configure({
                    i18n: {
                        nextBtn: 'OK, got it',
                    },
                })
                    .startTour({
                    id: 'correspondence-games',
                    showPrevButton: true,
                    isTourBubble: false,
                    steps: [
                        {
                            title: 'Recently finished games',
                            content: 'Would you like to display the list of your correspondence games, sorted by completion date?',
                            target: $('#perfStat.correspondence .view_games')[0],
                            placement: 'bottom',
                        },
                    ],
                });
            });
        $('.user-show .angles').each(function () {
            const $angles = $(this), $content = $('.angle-content'), browseTo = (path) => text(path).then(html => {
                $content.html(html);
                lichess.contentLoaded($content[0]);
                history.replaceState({}, '', path);
                window.InfiniteScroll('.infinite-scroll');
            });
            $angles.on('click', 'a', function () {
                $angles.find('.active').removeClass('active');
                $(this).addClass('active');
                browseTo(this.href);
                return false;
            });
            $('.user-show').on('click', '#games a', function () {
                if ($('#games .to-search').hasClass('active') || $(this).hasClass('to-search'))
                    return true;
                $(this).addClass('active');
                browseTo(this.href);
                return false;
            });
        });
    });

}());
