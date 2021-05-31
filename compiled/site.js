(function () {
    'use strict';

    /* kind like $.data, except simpler */
    const makeKey = (key) => `lichess-${key}`;
    const get = (owner, key) => owner[makeKey(key)];
    const set = (owner, key, value) => (owner[makeKey(key)] = value);

    const init$1 = (node) => {
        const [fen, orientation, lm] = node.getAttribute('data-state').split(',');
        initWith(node, fen, orientation, lm);
    };
    const initWith = (node, fen, orientation, lm) => {
        if (!window.Chessground)
            setTimeout(() => init$1(node), 500);
        else {
            set(node, 'chessground', window.Chessground(node, {
                orientation,
                coordinates: false,
                viewOnly: !node.getAttribute('data-playable'),
                resizable: false,
                fen,
                lastMove: lm && (lm[1] === '@' ? [lm.slice(2)] : [lm[0] + lm[1], lm[2] + lm[3]]),
                drawable: {
                    enabled: false,
                    visible: false,
                },
            }));
        }
    };
    const initAll$1 = (parent) => Array.from((parent || document).getElementsByClassName('mini-board--init')).forEach(init$1);

    var miniBoard = /*#__PURE__*/Object.freeze({
        __proto__: null,
        init: init$1,
        initWith: initWith,
        initAll: initAll$1
    });

    const fenColor = (fen) => (fen.indexOf(' b') > 0 ? 'black' : 'white');
    const init = (node) => {
        if (!window.Chessground)
            setTimeout(() => init(node), 200);
        else {
            const [fen, orientation, lm] = node.getAttribute('data-state').split(','), config = {
                coordinates: false,
                viewOnly: true,
                resizable: false,
                fen,
                orientation,
                lastMove: lm && (lm[1] === '@' ? [lm.slice(2)] : [lm[0] + lm[1], lm[2] + lm[3]]),
                drawable: {
                    enabled: false,
                    visible: false,
                },
            }, $el = $(node).removeClass('mini-game--init'), $cg = $el.find('.cg-wrap'), turnColor = fenColor(fen);
            set($cg[0], 'chessground', window.Chessground($cg[0], config));
            ['white', 'black'].forEach(color => $el.find('.mini-game__clock--' + color).each(function () {
                $(this).clock({
                    time: parseInt(this.getAttribute('data-time')),
                    pause: color != turnColor,
                });
            }));
        }
        return node.getAttribute('data-live');
    };
    const initAll = (parent) => {
        const nodes = Array.from((parent || document).getElementsByClassName('mini-game--init')), ids = nodes.map(init).filter(id => id);
        if (ids.length)
            lichess.StrongSocket.firstConnect.then(send => send('startWatching', ids.join(' ')));
    };
    const update = (node, data) => {
        const $el = $(node), lm = data.lm, lastMove = lm && (lm[1] === '@' ? [lm.slice(2)] : [lm[0] + lm[1], lm[2] + lm[3]]), cg = get(node.querySelector('.cg-wrap'), 'chessground');
        if (cg)
            cg.set({
                fen: data.fen,
                lastMove,
            });
        const turnColor = fenColor(data.fen);
        const renderClock = (time, color) => {
            if (!isNaN(time))
                $el.find('.mini-game__clock--' + color).clock('set', {
                    time,
                    pause: color != turnColor,
                });
        };
        renderClock(data.wc, 'white');
        renderClock(data.bc, 'black');
    };
    const finish = (node, win) => ['white', 'black'].forEach(color => {
        const $clock = $(node)
            .find('.mini-game__clock--' + color)
            .each(function () {
            $(this).clock('destroy');
        });
        if (!$clock.data('managed'))
            // snabbdom
            $clock.replaceWith(`<span class="mini-game__result">${win ? (win == color[0] ? 1 : 0) : '½'}</span>`);
    });

    var miniGame = /*#__PURE__*/Object.freeze({
        __proto__: null,
        init: init,
        initAll: initAll,
        update: update,
        finish: finish
    });

    // divisors for minutes, hours, days, weeks, months, years
    const DIVS = [
        60,
        60 * 60,
        60 * 60 * 24,
        60 * 60 * 24 * 7,
        60 * 60 * 2 * 365,
        60 * 60 * 24 * 365,
    ];
    const LIMITS = [...DIVS];
    LIMITS[2] *= 2; // Show hours up to 2 days.
    // format Date / string / timestamp to Date instance.
    const toDate = (input) => input instanceof Date ? input : new Date(isNaN(input) ? input : parseInt(input));
    // format the diff second to *** time ago
    const formatDiff = (diff) => {
        let agoin = 0;
        if (diff < 0) {
            agoin = 1;
            diff = -diff;
        }
        const totalSec = diff;
        let i = 0;
        for (; i < 6 && diff >= LIMITS[i]; i++)
            ;
        if (i > 0)
            diff /= DIVS[i - 1];
        diff = Math.floor(diff);
        i *= 2;
        if (diff > (i === 0 ? 9 : 1))
            i += 1;
        return lichess.timeagoLocale(diff, i, totalSec)[agoin].replace('%s', diff);
    };
    let formatterInst;
    const formatter = () => (formatterInst =
        formatterInst ||
            (window.Intl && Intl.DateTimeFormat
                ? new Intl.DateTimeFormat(document.documentElement.lang, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                }).format
                : d => d.toLocaleString()));
    const format$1 = (date) => formatDiff((Date.now() - toDate(date).getTime()) / 1000);
    const findAndRender = (parent) => requestAnimationFrame(() => {
        const now = Date.now();
        [].slice.call((parent || document).getElementsByClassName('timeago'), 0, 99).forEach((node) => {
            const cl = node.classList, abs = cl.contains('abs'), set = cl.contains('set');
            node.lichessDate = node.lichessDate || toDate(node.getAttribute('datetime'));
            if (!set) {
                const str = formatter()(node.lichessDate);
                if (abs)
                    node.textContent = str;
                else
                    node.setAttribute('title', str);
                cl.add('set');
                if (abs || cl.contains('once'))
                    cl.remove('timeago');
            }
            if (!abs) {
                const diff = (now - node.lichessDate.getTime()) / 1000;
                node.textContent = formatDiff(diff);
                if (Math.abs(diff) > 9999)
                    cl.remove('timeago'); // ~3h
            }
        });
    });
    const updateRegularly = (interval) => {
        findAndRender();
        setTimeout(() => updateRegularly(interval * 1.1), interval);
    };

    const defined = (v) => typeof v !== 'undefined';
    const notNull = (value) => value !== null && value !== undefined;

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
    /* produce HTTP form data from a JS object */
    const form = (data) => {
        const formData = new FormData();
        for (const k of Object.keys(data))
            formData.append(k, data[k]);
        return formData;
    };
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
    };

    const requestIdleCallback = (f, timeout) => {
        if (window.requestIdleCallback)
            window.requestIdleCallback(f, timeout && { timeout });
        else
            requestAnimationFrame(f);
    };
    const escapeHtml = (str) => /[&<>"']/.test(str)
        ? str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;')
        : str;

    let timeout;
    const kill = () => {
        if (timeout)
            clearTimeout(timeout);
        timeout = undefined;
        $('#announce').remove();
    };
    const announce = (d) => {
        kill();
        if (d.msg) {
            $('body')
                .append('<div id="announce" class="announce">' +
                escapeHtml(d.msg) +
                (d.date ? '<time class="timeago" datetime="' + d.date + '"></time>' : '') +
                '<div class="actions"><a class="close">×</a></div>' +
                '</div>')
                .find('#announce .close')
                .on('click', kill);
            timeout = setTimeout(kill, d.date ? new Date(d.date).getTime() - Date.now() : 5000);
            if (d.date)
                lichess.contentLoaded();
        }
    };

    function idleTimer(delay, onIdle, onWakeUp) {
        const events = ['mousemove', 'touchstart'];
        let listening = false, active = true, lastSeenActive = performance.now();
        const onActivity = () => {
            if (!active) {
                // console.log('Wake up');
                onWakeUp();
            }
            active = true;
            lastSeenActive = performance.now();
            stopListening();
        };
        const startListening = () => {
            if (!listening) {
                events.forEach(e => document.addEventListener(e, onActivity));
                listening = true;
            }
        };
        const stopListening = () => {
            if (listening) {
                events.forEach(e => document.removeEventListener(e, onActivity));
                listening = false;
            }
        };
        setInterval(() => {
            if (active && performance.now() - lastSeenActive > delay) {
                // console.log('Idle mode');
                onIdle();
                active = false;
            }
            startListening();
        }, 10000);
    }

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

    let redirectInProgress = false;
    const redirect = obj => {
        let url;
        if (typeof obj == 'string')
            url = obj;
        else {
            url = obj.url;
            if (obj.cookie) {
                const domain = document.domain.replace(/^.+(\.[^.]+\.[^.]+)$/, '$1');
                const cookie = [
                    encodeURIComponent(obj.cookie.name) + '=' + obj.cookie.value,
                    '; max-age=' + obj.cookie.maxAge,
                    '; path=/',
                    '; domain=' + domain,
                ].join('');
                document.cookie = cookie;
            }
        }
        const href = '//' + location.host + '/' + url.replace(/^\//, '');
        redirectInProgress = href;
        location.href = href;
    };
    const unload = {
        expected: false,
    };
    const reload = () => {
        if (redirectInProgress)
            return;
        unload.expected = true;
        lichess.socket.disconnect();
        if (location.hash)
            location.reload();
        else
            location.assign(location.href);
    };

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
    const tempStorage = builder(window.sessionStorage);

    // versioned events, acks, retries, resync
    class StrongSocket {
        constructor(url$1, version, settings = {}) {
            this.url = url$1;
            this.pubsub = lichess.pubsub;
            this.ackable = new Ackable((t, d, o) => this.send(t, d, o));
            this.lastPingTime = performance.now();
            this.pongCount = 0;
            this.averageLag = 0;
            this.tryOtherUrl = false;
            this.autoReconnect = true;
            this.nbConnects = 0;
            this.storage = storage.make('surl15');
            this.sign = (s) => {
                this._sign = s;
                this.ackable.sign(s);
            };
            this.connect = () => {
                this.destroy();
                this.autoReconnect = true;
                const fullUrl = url(this.options.protocol + '//' + this.baseUrl() + this.url, Object.assign(Object.assign({}, this.settings.params), { v: this.version === false ? undefined : this.version }));
                this.debug('connection attempt to ' + fullUrl);
                try {
                    const ws = (this.ws = new WebSocket(fullUrl));
                    ws.onerror = e => this.onError(e);
                    ws.onclose = () => {
                        this.pubsub.emit('socket.close');
                        if (this.autoReconnect) {
                            this.debug('Will autoreconnect in ' + this.options.autoReconnectDelay);
                            this.scheduleConnect(this.options.autoReconnectDelay);
                        }
                    };
                    ws.onopen = () => {
                        this.debug('connected to ' + fullUrl);
                        this.onSuccess();
                        const cl = document.body.classList;
                        cl.remove('offline');
                        cl.add('online');
                        cl.toggle('reconnected', this.nbConnects > 1);
                        this.pingNow();
                        this.pubsub.emit('socket.open');
                        this.ackable.resend();
                    };
                    ws.onmessage = e => {
                        if (e.data == 0)
                            return this.pong();
                        const m = JSON.parse(e.data);
                        if (m.t === 'n')
                            this.pong();
                        this.handle(m);
                    };
                }
                catch (e) {
                    this.onError(e);
                }
                this.scheduleConnect(this.options.pingMaxLag);
            };
            this.send = (t, d, o = {}, noRetry = false) => {
                const msg = { t };
                if (d !== undefined) {
                    if (o.withLag)
                        d.l = Math.round(this.averageLag);
                    if (o.millis >= 0)
                        d.s = Math.round(o.millis * 0.1).toString(36);
                    msg.d = d;
                }
                if (o.ackable) {
                    msg.d = msg.d || {}; // can't ack message without data
                    this.ackable.register(t, msg.d); // adds d.a, the ack ID we expect to get back
                }
                const message = JSON.stringify(msg);
                if (t == 'racerScore' && o.sign != this._sign)
                    return;
                if (t == 'move' && o.sign != this._sign) {
                    let stack;
                    try {
                        stack = new Error().stack.split('\n').join(' / ').replace(/\s+/g, ' ');
                    }
                    catch (e) {
                        stack = `${e.message} ${navigator.userAgent}`;
                    }
                    if (!stack.includes('round.nvui'))
                        setTimeout(() => this.send('rep', { n: `soc: ${message} ${stack}` }), 10000);
                }
                this.debug('send ' + message);
                try {
                    this.ws.send(message);
                }
                catch (e) {
                    // maybe sent before socket opens,
                    // try again a second later.
                    if (!noRetry)
                        setTimeout(() => this.send(t, msg.d, o, true), 1000);
                }
            };
            this.scheduleConnect = (delay) => {
                if (this.options.idle)
                    delay = 10 * 1000 + Math.random() * 10 * 1000;
                // debug('schedule connect ' + delay);
                clearTimeout(this.pingSchedule);
                clearTimeout(this.connectSchedule);
                this.connectSchedule = setTimeout(() => {
                    document.body.classList.add('offline');
                    document.body.classList.remove('online');
                    this.tryOtherUrl = true;
                    this.connect();
                }, delay);
            };
            this.schedulePing = (delay) => {
                clearTimeout(this.pingSchedule);
                this.pingSchedule = setTimeout(this.pingNow, delay);
            };
            this.pingNow = () => {
                clearTimeout(this.pingSchedule);
                clearTimeout(this.connectSchedule);
                const pingData = this.options.isAuth && this.pongCount % 8 == 2
                    ? JSON.stringify({
                        t: 'p',
                        l: Math.round(0.1 * this.averageLag),
                    })
                    : 'null';
                try {
                    this.ws.send(pingData);
                    this.lastPingTime = performance.now();
                }
                catch (e) {
                    this.debug(e, true);
                }
                this.scheduleConnect(this.options.pingMaxLag);
            };
            this.computePingDelay = () => this.options.pingDelay + (this.options.idle ? 1000 : 0);
            this.pong = () => {
                clearTimeout(this.connectSchedule);
                this.schedulePing(this.computePingDelay());
                const currentLag = Math.min(performance.now() - this.lastPingTime, 10000);
                this.pongCount++;
                // Average first 4 pings, then switch to decaying average.
                const mix = this.pongCount > 4 ? 0.1 : 1 / this.pongCount;
                this.averageLag += mix * (currentLag - this.averageLag);
                this.pubsub.emit('socket.lag', this.averageLag);
            };
            this.handle = (m) => {
                if (m.v && this.version !== false) {
                    if (m.v <= this.version) {
                        this.debug('already has event ' + m.v);
                        return;
                    }
                    // it's impossible but according to previous logging, it happens nonetheless
                    if (m.v > this.version + 1)
                        return reload();
                    this.version = m.v;
                }
                switch (m.t || false) {
                    case false:
                        break;
                    case 'resync':
                        reload();
                        break;
                    case 'ack':
                        this.ackable.onServerAck(m.d);
                        break;
                    default:
                        // return true in a receive handler to prevent pubsub and events
                        if (!(this.settings.receive && this.settings.receive(m.t, m.d))) {
                            this.pubsub.emit('socket.in.' + m.t, m.d, m);
                            if (this.settings.events[m.t])
                                this.settings.events[m.t](m.d || null, m);
                        }
                }
            };
            this.debug = (msg, always = false) => {
                if (always || this.options.debug)
                    console.debug(msg);
            };
            this.destroy = () => {
                clearTimeout(this.pingSchedule);
                clearTimeout(this.connectSchedule);
                this.disconnect();
                this.ws = undefined;
            };
            this.disconnect = () => {
                const ws = this.ws;
                if (ws) {
                    this.debug('Disconnect');
                    this.autoReconnect = false;
                    ws.onerror = ws.onclose = ws.onopen = ws.onmessage = () => { };
                    ws.close();
                }
            };
            this.onError = (e) => {
                this.options.debug = true;
                this.debug('error: ' + JSON.stringify(e));
                this.tryOtherUrl = true;
                clearTimeout(this.pingSchedule);
            };
            this.onSuccess = () => {
                this.nbConnects++;
                if (this.nbConnects == 1) {
                    StrongSocket.resolveFirstConnect(this.send);
                    let disconnectTimeout;
                    idleTimer(10 * 60 * 1000, () => {
                        this.options.idle = true;
                        disconnectTimeout = setTimeout(this.destroy, 2 * 60 * 60 * 1000);
                    }, () => {
                        this.options.idle = false;
                        if (this.ws)
                            clearTimeout(disconnectTimeout);
                        else
                            location.reload();
                    });
                }
            };
            this.baseUrl = () => {
                const baseUrls = document.body.getAttribute('data-socket-domains').split(',');
                let url = this.storage.get();
                if (!url || this.tryOtherUrl) {
                    url = baseUrls[Math.floor(Math.random() * baseUrls.length)];
                    this.storage.set(url);
                }
                return url;
            };
            this.pingInterval = () => this.computePingDelay() + this.averageLag;
            this.getVersion = () => this.version;
            this.settings = {
                receive: settings.receive,
                events: settings.events || {},
                params: Object.assign(Object.assign({}, StrongSocket.defaultParams), (settings.params || {})),
            };
            this.options = Object.assign(Object.assign({}, StrongSocket.defaultOptions), (settings.options || {}));
            this.version = version;
            this.pubsub.on('socket.send', this.send);
            window.addEventListener('unload', this.destroy);
            this.connect();
        }
    }
    StrongSocket.defaultOptions = {
        idle: false,
        pingMaxLag: 9000,
        pingDelay: 2500,
        autoReconnectDelay: 3500,
        protocol: location.protocol === 'https:' ? 'wss:' : 'ws:',
        isAuth: document.body.hasAttribute('user'),
    };
    StrongSocket.defaultParams = {
        sri: sri,
    };
    StrongSocket.firstConnect = new Promise(r => {
        StrongSocket.resolveFirstConnect = r;
    });
    class Ackable {
        constructor(send) {
            this.send = send;
            this.currentId = 1; // increment with each ackable message sent
            this.messages = [];
            this.sign = (s) => (this._sign = s);
            this.resend = () => {
                const resendCutoff = performance.now() - 2500;
                this.messages.forEach(m => {
                    if (m.at < resendCutoff)
                        this.send(m.t, m.d, { sign: this._sign });
                });
            };
            this.register = (t, d) => {
                d.a = this.currentId++;
                this.messages.push({
                    t: t,
                    d: d,
                    at: performance.now(),
                });
            };
            this.onServerAck = (id) => {
                this.messages = this.messages.filter(m => m.d.a !== id);
            };
            setInterval(this.resend, 1200);
        }
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
    const loadCssPath = (key) => loadCss(`css/${key}.${$('body').data('theme')}.${$('body').data('dev') ? 'dev' : 'min'}.css`);
    const jsModule = (name) => `compiled/${name}${$('body').data('dev') ? '' : '.min'}.js`;
    const loadedScript = new Map();
    const loadScript = (url, opts = {}) => {
        if (!loadedScript.has(url))
            loadedScript.set(url, script(assetUrl(url, opts)));
        return loadedScript.get(url);
    };
    const loadModule = (name) => loadScript(jsModule(name));
    const userComplete = () => {
        loadCssPath('complete');
        return loadModule('userComplete').then(_ => window.UserComplete);
    };
    const hopscotch = () => {
        loadCss('vendor/hopscotch/dist/css/hopscotch.min.css');
        return loadScript('vendor/hopscotch/dist/js/hopscotch.min.js', {
            noVersion: true,
        });
    };

    const chat = data => new Promise(resolve => requestAnimationFrame(() => {
        data.loadCss = loadCssPath;
        resolve(window.LichessChat(document.querySelector('.mchat'), data));
    }));

    function once(key, mod) {
        if (mod === 'always')
            return true;
        if (!storage.get(key)) {
            storage.set(key, '1');
            return true;
        }
        return false;
    }

    const spinner = '<div class="spinner"><svg viewBox="0 0 40 40"><circle cx=20 cy=20 r=18 fill="none"></circle></svg></div>';

    const inCrosstable = (el) => { var _a; return (_a = document.querySelector('.crosstable')) === null || _a === void 0 ? void 0 : _a.contains(el); };
    function onPowertipPreRender(id, preload) {
        return function (el) {
            const url = ($(el).data('href') || el.href).replace(/\?.+$/, '');
            if (preload)
                preload(url);
            text(url + '/mini').then(html => {
                const el = document.getElementById(id);
                el.innerHTML = html;
                lichess.contentLoaded(el);
            });
        };
    }
    const uptA = (url, icon) => `<a class="btn-rack__btn" href="${url}" data-icon="${icon}"></a>`;
    const userPowertip = (el, pos) => {
        pos = pos || el.getAttribute('data-pt-pos') || (inCrosstable(el) ? 'n' : 's');
        $(el)
            .removeClass('ulpt')
            .powerTip({
            preRender: onPowertipPreRender('powerTip', (url) => {
                const u = url.substr(3);
                const name = $(el).data('name') || $(el).html();
                $('#powerTip').html('<div class="upt__info"><div class="upt__info__top"><span class="user-link offline">' +
                    name +
                    '</span></div></div><div class="upt__actions btn-rack">' +
                    uptA('/@/' + u + '/tv', '1') +
                    uptA('/inbox/new?user=' + u, 'c') +
                    uptA('/?user=' + u + '#friend', 'U') +
                    '<a class="btn-rack__btn relation-button" disabled></a></div>');
            }),
            placement: pos,
        });
    };
    function gamePowertip(el) {
        $(el)
            .removeClass('glpt')
            .powerTip({
            preRender: onPowertipPreRender('miniGame', () => spinner),
            placement: inCrosstable(el) ? 'n' : 'w',
            popupId: 'miniGame',
        });
    }
    function powerTipWith(el, ev, f) {
        if (!('ontouchstart' in window)) {
            f(el);
            $.powerTip.show(el, ev);
        }
    }
    function onIdleForAll(par, sel, f) {
        requestIdleCallback(() => Array.prototype.forEach.call(par.querySelectorAll(sel), (el) => f(el)), // do not codegolf to `f`
        800);
    }
    const powertip = {
        watchMouse() {
            document.body.addEventListener('mouseover', e => {
                const t = e.target, cl = t.classList;
                if (cl.contains('ulpt'))
                    powerTipWith(t, e, userPowertip);
                else if (cl.contains('glpt'))
                    powerTipWith(t, e, gamePowertip);
            });
        },
        manualGameIn(parent) {
            onIdleForAll(parent, '.glpt', gamePowertip);
        },
        manualGame: gamePowertip,
        manualUser: userPowertip,
        manualUserIn(parent) {
            onIdleForAll(parent, '.ulpt', userPowertip);
        },
    };

    const widget = (name, prototype) => {
        const constructor = ($[name] = function (options, element) {
            const self = this;
            self.element = $(element);
            element[name] = this;
            self.options = options;
            self._create();
        });
        constructor.prototype = prototype;
        $.fn[name] = function (method) {
            const args = Array.prototype.slice.call(arguments, 1);
            if (typeof method === 'string')
                this.each(function () {
                    const instance = get(this, name);
                    if (instance && $.isFunction(instance[method]))
                        instance[method].apply(instance, args);
                });
            else
                this.each(function () {
                    if (!get(this, name))
                        set(this, name, new constructor(method, this));
                });
            return this;
        };
    };

    const subs = [];
    const pubsub = {
        on(name, cb) {
            subs[name] = subs[name] || [];
            subs[name].push(cb);
        },
        off(name, cb) {
            if (subs[name])
                for (const i in subs[name]) {
                    if (subs[name][i] === cb) {
                        subs[name].splice(i);
                        break;
                    }
                }
        },
        emit(name, ...args) {
            if (subs[name])
                for (const i in subs[name])
                    subs[name][i].apply(null, args);
        },
    };

    function format(str, args) {
        if (args.length) {
            if (str.includes('%s'))
                str = str.replace('%s', args[0]);
            else
                for (let i = 0; i < args.length; i++)
                    str = str.replace('%' + (i + 1) + '$s', args[i]);
        }
        return str;
    }
    function list(str, args) {
        const segments = str.split(/(%(?:\d\$)?s)/g);
        if (args.length) {
            const singlePlaceholder = segments.indexOf('%s');
            if (singlePlaceholder !== -1)
                segments[singlePlaceholder] = args[0];
            else
                for (let i = 0; 1 < args.length; i++) {
                    const placeholder = segments.indexOf('%' + (i + 1) + '$s');
                    if (placeholder !== -1)
                        segments[placeholder] = args[i];
                }
        }
        return segments;
    }
    function trans (i18n) {
        const trans = (key, ...args) => {
            const str = i18n[key];
            return str ? format(str, args) : key;
        };
        trans.plural = function (key, count) {
            const pluralKey = `${key}:${lichess.quantity(count)}`;
            const str = i18n[pluralKey] || i18n[key];
            return str ? format(str, Array.prototype.slice.call(arguments, 1)) : key;
        };
        // optimisation for translations without arguments
        trans.noarg = (key) => i18n[key] || key;
        trans.vdom = (key, ...args) => {
            const str = i18n[key];
            return str ? list(str, args) : [key];
        };
        trans.vdomPlural = (key, count, ...args) => {
            const pluralKey = `${key}:${lichess.quantity(count)}`;
            const str = i18n[pluralKey] || i18n[key];
            return str ? list(str, args) : [key];
        };
        return trans;
    }

    const sound = new (class {
        constructor() {
            this.sounds = new Map(); // The loaded sounds and their instances
            this.soundSet = $('body').data('sound-set');
            this.speechStorage = storage.makeBoolean('speech.enabled');
            this.volumeStorage = storage.make('sound-volume');
            this.baseUrl = assetUrl('sound', {
                version: '_____1', // 6 random letters to update
            });
            this.loadOggOrMp3 = (name, path) => this.sounds.set(name, new window.Howl({
                src: ['ogg', 'mp3'].map(ext => `${path}.${ext}`),
            }));
            this.loadStandard = (name, soundSet) => {
                if (!this.enabled())
                    return;
                const path = name[0].toUpperCase() + name.slice(1);
                this.loadOggOrMp3(name, `${this.baseUrl}/${soundSet || this.soundSet}/${path}`);
            };
            this.setVolume = this.volumeStorage.set;
            this.getVolume = () => {
                // garbage has been stored here by accident (e972d5612d)
                const v = parseFloat(this.volumeStorage.get() || '');
                return v >= 0 ? v : 0.7;
            };
            this.enabled = () => this.soundSet !== 'silent';
            this.speech = (v) => {
                if (typeof v != 'undefined')
                    this.speechStorage.set(v);
                return this.speechStorage.get();
            };
            this.say = (text, cut = false, force = false, translated = false) => {
                if (cut)
                    speechSynthesis.cancel();
                if (!this.speechStorage.get() && !force)
                    return false;
                const msg = new SpeechSynthesisUtterance(text);
                msg.volume = this.getVolume();
                msg.lang = translated ? document.documentElement.lang : 'en-US';
                speechSynthesis.speak(msg);
                return true;
            };
            this.sayOrPlay = (name, text) => this.say(text) || this.play(name);
            this.publish = () => pubsub.emit('sound_set', this.soundSet);
            this.changeSet = (s) => {
                this.soundSet = s;
                this.sounds.clear();
                this.publish();
            };
            this.set = () => this.soundSet;
            if (this.soundSet == 'music')
                setTimeout(this.publish, 500);
        }
        preloadBoardSounds() {
            if (this.soundSet !== 'music')
                ['move', 'capture', 'check', 'genericNotify'].forEach(s => this.loadStandard(s));
        }
        play(name, volume) {
            var _a;
            if (!this.enabled())
                return;
            let set = this.soundSet;
            if (set === 'music' || this.speechStorage.get()) {
                if (['move', 'capture', 'check'].includes(name))
                    return;
                set = 'standard';
            }
            let s = this.sounds.get(name);
            if (!s) {
                this.loadStandard(name, set);
                s = this.sounds.get(name);
            }
            const doPlay = () => s.volume(this.getVolume() * (volume || 1)).play();
            if (((_a = window.Howler.ctx) === null || _a === void 0 ? void 0 : _a.state) === 'suspended')
                window.Howler.ctx.resume().then(doPlay);
            else
                doPlay();
        }
    })();

    let watchersData;
    function watchers(element) {
        const $element = $(element);
        if ($element.data('watched'))
            return;
        $element.data('watched', 1);
        const $innerElement = $('<div class="chat__members__inner">').appendTo($element);
        const $numberEl = $('<div class="chat__members__number" data-icon="r" title="Spectators"></div>').appendTo($innerElement);
        const $listEl = $('<div>').appendTo($innerElement);
        lichess.pubsub.on('socket.in.crowd', data => set(data.watchers || data));
        const set = (data) => {
            watchersData = data;
            if (!data || !data.nb)
                return $element.addClass('none');
            $numberEl.text('' + data.nb);
            if (data.users) {
                const tags = data.users.map(u => u ? `<a class="user-link ulpt" href="/@/${u.includes(' ') ? u.split(' ')[1] : u}">${u}</a>` : 'Anonymous');
                if (data.anons === 1)
                    tags.push('Anonymous');
                else if (data.anons)
                    tags.push(`Anonymous (${data.anons})`);
                $listEl.html(tags.join(', '));
            }
            else
                $listEl.html('');
            $element.removeClass('none');
        };
        if (watchersData)
            set(watchersData);
    }

    function exportLichessGlobals () {
        const l = window.lichess;
        l.StrongSocket = StrongSocket;
        l.requestIdleCallback = requestIdleCallback;
        l.sri = sri;
        l.storage = storage;
        l.tempStorage = tempStorage;
        l.once = once;
        l.powertip = powertip;
        l.widget = widget;
        l.spinnerHtml = spinner;
        l.assetUrl = assetUrl;
        l.loadCss = loadCss;
        l.loadCssPath = loadCssPath;
        l.jsModule = jsModule;
        l.loadScript = loadScript;
        l.loadModule = loadModule;
        l.hopscotch = hopscotch;
        l.userComplete = userComplete;
        l.makeChat = chat;
        l.idleTimer = idleTimer;
        l.pubsub = pubsub;
        l.unload = unload;
        l.redirect = redirect;
        l.reload = reload;
        l.watchers = watchers;
        l.escapeHtml = escapeHtml;
        l.announce = announce;
        l.trans = trans;
        l.sound = sound;
        l.miniBoard = miniBoard;
        l.miniGame = miniGame;
        l.timeago = format$1;
        l.contentLoaded = (parent) => pubsub.emit('content-loaded', parent);
    }

    /// <reference types="../../types/info" />
    console.info('Lichess is open source! https://lichess.org/source');
    const info = {"date":"2021-05-28T13:13:57+00:00"};

    function loadClockWidget() {
        widget('clock', {
            _create: function () {
                this.target = this.options.time * 1000 + Date.now();
                if (!this.options.pause)
                    this.interval = setInterval(this.render.bind(this), 1000);
                this.render();
            },
            set: function (opts) {
                this.options = opts;
                this.target = this.options.time * 1000 + Date.now();
                this.render();
                clearInterval(this.interval);
                if (!opts.pause)
                    this.interval = setInterval(this.render.bind(this), 1000);
            },
            render: function () {
                if (document.body.contains(this.element[0])) {
                    this.element.text(this.formatMs(this.target - Date.now()));
                    this.element.toggleClass('clock--run', !this.options.pause);
                }
                else
                    clearInterval(this.interval);
            },
            pad(x) {
                return (x < 10 ? '0' : '') + x;
            },
            formatMs: function (msTime) {
                const date = new Date(Math.max(0, msTime + 500)), hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds();
                return hours > 0 ? hours + ':' + this.pad(minutes) + ':' + this.pad(seconds) : minutes + ':' + this.pad(seconds);
            },
        });
    }

    const li = lichess;
    function moduleLaunchers() {
        if (li.userAnalysis)
            startUserAnalysis(li.userAnalysis);
        else if (li.study || li.practice || li.relay)
            startAnalyse(li.study || li.practice || li.relay);
    }
    function startUserAnalysis(cfg) {
        cfg.$side = $('.analyse__side').clone();
        startAnalyse(cfg);
    }
    function startAnalyse(cfg) {
        lichess.socket = new StrongSocket(cfg.socketUrl || '/analysis/socket/v5', cfg.socketVersion, {
            receive: (t, d) => analyse.socketReceive(t, d),
        });
        cfg.socketSend = li.socket.send;
        const analyse = window.LichessAnalyse.start(cfg);
    }

    class OnlineFriends {
        constructor(el) {
            this.el = el;
            this.loaded = false;
            this.receive = (friends, msg) => {
                this.users.clear();
                friends.forEach(this.insert);
                msg.playing
                    .map(p => this.users.get(p))
                    .filter(notNull)
                    .forEach(u => (u.playing = true));
                msg.patrons
                    .map(p => this.users.get(p))
                    .filter(notNull)
                    .forEach(u => (u.patron = true));
                this.repaint();
            };
            this.repaint = () => {
                if (this.loaded)
                    requestAnimationFrame(() => {
                        var _a;
                        const ids = Array.from(this.users.keys()).sort();
                        this.titleEl.innerHTML = this.trans.plural('nbFriendsOnline', ids.length, this.loaded ? `<strong>${ids.length}</strong>` : '-');
                        (_a = this.el.querySelector('.nobody')) === null || _a === void 0 ? void 0 : _a.classList.toggle('none', !!ids[0]);
                        this.el.querySelector('.list').innerHTML = ids.map(id => this.renderFriend(this.users.get(id))).join('');
                    });
            };
            this.renderFriend = (friend) => {
                const icon = `<i class="line${friend.patron ? ' patron' : ''}"></i>`, titleTag = friend.title
                    ? `<span class="utitle"${friend.title === 'BOT' ? ' data-bot' : ''}>${friend.title}</span>&nbsp;`
                    : '', url = '/@/' + friend.name, tvButton = friend.playing
                    ? `<a data-icon="1" class="tv ulpt" data-pt-pos="nw" href="${url}/tv" data-href="${url}"></a>`
                    : '';
                return `<div><a class="user-link ulpt" data-pt-pos="nw" href="${url}">${icon}${titleTag}${friend.name}</a>${tvButton}</div>`;
            };
            this.enters = (titleName, msg) => {
                const friend = this.insert(titleName);
                friend.playing = msg.playing;
                friend.patron = msg.patron;
                this.repaint();
            };
            this.leaves = (titleName) => {
                this.users.delete(this.getId(titleName));
                this.repaint();
            };
            this.playing = (titleName) => {
                this.insert(titleName).playing = true;
                this.repaint();
            };
            this.stopped_playing = (titleName) => {
                this.insert(titleName).playing = false;
                this.repaint();
            };
            this.insert = (titleName) => {
                const id = this.getId(titleName);
                if (!this.users.has(id))
                    this.users.set(id, this.toFriend(titleName));
                return this.users.get(id);
            };
            this.getId = (titleName) => titleName.toLowerCase().replace(/^\w+\s/, '');
            this.toFriend = (titleName) => {
                const split = titleName.split(' ');
                return {
                    id: split[split.length - 1].toLowerCase(),
                    name: split[split.length - 1],
                    title: split.length > 1 ? split[0] : undefined,
                    playing: false,
                    patron: false,
                };
            };
            this.titleEl = this.el.querySelector('.friend_box_title');
            this.titleEl.addEventListener('click', () => {
                var _a;
                (_a = this.el.querySelector('.content_wrap')) === null || _a === void 0 ? void 0 : _a.classList.toggle('none');
                if (!this.loaded) {
                    this.loaded = true;
                    pubsub.emit('socket.send', 'following_onlines');
                }
            });
            this.trans = trans(JSON.parse(this.el.getAttribute('data-i18n')));
            this.users = new Map();
            pubsub.on('socket.in.following_onlines', this.receive);
            ['enters', 'leaves', 'playing', 'stopped_playing'].forEach(k => pubsub.on('socket.in.following_' + k, this[k]));
        }
    }

    function serviceWorker () {
        if ('serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window) {
            const workerUrl = new URL(assetUrl(jsModule('serviceWorker'), {
                sameDomain: true,
            }), self.location.href);
            workerUrl.searchParams.set('asset-url', document.body.getAttribute('data-asset-url'));
            if (document.body.getAttribute('data-dev'))
                workerUrl.searchParams.set('dev', '1');
            const updateViaCache = document.body.getAttribute('data-dev') ? 'none' : 'all';
            navigator.serviceWorker
                .register(workerUrl.href, {
                scope: '/',
                updateViaCache,
            })
                .then(reg => {
                const store = storage.make('push-subscribed');
                const vapid = document.body.getAttribute('data-vapid');
                if (vapid && Notification.permission == 'granted')
                    return reg.pushManager.getSubscription().then(sub => {
                        const resub = parseInt(store.get() || '0', 10) + 43200000 < Date.now(); // 12 hours
                        const applicationServerKey = Uint8Array.from(atob(vapid), c => c.charCodeAt(0));
                        if (!sub || resub) {
                            return reg.pushManager
                                .subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: applicationServerKey,
                            })
                                .then(sub => fetch('/push/subscribe', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(sub),
                            }).then(res => {
                                if (res.ok)
                                    store.set('' + Date.now());
                                else
                                    console.log('submitting push subscription failed', res.statusText);
                            }), err => {
                                console.log('push subscribe failed', err.message);
                                if (sub)
                                    sub.unsubscribe();
                            });
                        }
                    });
                else
                    store.remove();
            });
        }
    }

    function topBar () {
        const initiatingHtml = `<div class="initiating">${spinner}</div>`, isVisible = (selector) => {
            const el = document.querySelector(selector), display = el && window.getComputedStyle(el).display;
            return display && display != 'none';
        };
        // On touchscreens, clicking the top menu element expands it. There's no top link.
        // Only for $mq-topnav-hidden in ui/common/css/abstract/_media-queries.scss
        if ('ontouchstart' in window && !window.matchMedia('(max-width: 979px)').matches)
            $('#topnav > section > a').removeAttr('href');
        $('#topnav-toggle').on('change', e => document.body.classList.toggle('masked', e.target.checked));
        $('#top').on('click', 'a.toggle', function () {
            const $p = $(this).parent().toggleClass('shown');
            $p.siblings('.shown').removeClass('shown');
            pubsub.emit('top.toggle.' + this.id);
            setTimeout(() => {
                const handler = (e) => {
                    var _a;
                    if ((_a = $p[0]) === null || _a === void 0 ? void 0 : _a.contains(e.target))
                        return;
                    $p.removeClass('shown');
                    $('html').off('click', handler);
                };
                $('html').on('click', handler);
            }, 10);
            return false;
        });
        {
            // challengeApp
            let instance, booted;
            const $toggle = $('#challenge-toggle');
            $toggle.one('mouseover click', () => load());
            const load = function (data) {
                if (booted)
                    return;
                booted = true;
                const $el = $('#challenge-app').html(initiatingHtml);
                loadCssPath('challenge');
                loadModule('challenge').then(() => (instance = window.LichessChallenge($el[0], {
                    data,
                    show() {
                        if (!isVisible('#challenge-app'))
                            $toggle.trigger('click');
                    },
                    setCount(nb) {
                        $toggle.find('span').data('count', nb);
                    },
                    pulse() {
                        $toggle.addClass('pulse');
                    },
                })));
            };
            pubsub.on('socket.in.challenges', data => {
                if (!instance)
                    load(data);
                else
                    instance.update(data);
            });
            pubsub.on('challenge-app.open', () => $toggle.trigger('click'));
        }
        {
            // notifyApp
            let instance, booted;
            const $toggle = $('#notify-toggle'), selector = '#notify-app';
            const load = (data, incoming = false) => {
                if (booted)
                    return;
                booted = true;
                const $el = $('#notify-app').html(initiatingHtml);
                loadCssPath('notify');
                loadModule('notify').then(() => (instance = window.LichessNotify($el.empty()[0], {
                    data,
                    incoming,
                    isVisible: () => isVisible(selector),
                    setCount(nb) {
                        $toggle.find('span').data('count', nb);
                    },
                    show() {
                        if (!isVisible(selector))
                            $toggle.trigger('click');
                    },
                    setNotified() {
                        lichess.socket.send('notified');
                    },
                    pulse() {
                        $toggle.addClass('pulse');
                    },
                })));
            };
            $toggle
                .one('mouseover click', () => load())
                .on('click', () => {
                if ('Notification' in window)
                    Notification.requestPermission();
                setTimeout(() => {
                    if (instance && isVisible(selector))
                        instance.setVisible();
                }, 200);
            });
            pubsub.on('socket.in.notifications', data => {
                if (!instance)
                    load(data, true);
                else
                    instance.update(data, true);
            });
            pubsub.on('notify-app.set-read', user => {
                if (!instance)
                    load();
                else
                    instance.setMsgRead(user);
            });
        }
        {
            // dasher
            let booted;
            $('#top .dasher .toggle').one('mouseover click', function () {
                if (booted)
                    return;
                booted = true;
                $(this).removeAttr('href');
                const $el = $('#dasher_app').html(initiatingHtml), playing = $('body').hasClass('playing');
                loadCssPath('dasher');
                loadModule('dasher').then(() => window.LichessDasher($el.empty()[0], { playing }));
            });
        }
        {
            // cli
            const $wrap = $('#clinput');
            if (!$wrap.length)
                return;
            const $input = $wrap.find('input');
            let booted = false;
            const boot = () => {
                if (booted)
                    return;
                booted = true;
                loadModule('cli').then(() => window.LichessCli.app($input[0]), () => (booted = false));
            };
            $input.on({
                blur() {
                    $input.val('');
                    $('body').removeClass('clinput');
                },
                focus() {
                    boot();
                    $('body').addClass('clinput');
                },
            });
            $wrap.find('a').on({
                mouseover: boot,
                click() {
                    $('body').hasClass('clinput') ? $input[0].blur() : $input[0].focus();
                },
            });
            window.Mousetrap.bind('/', () => {
                $input.val('/');
                $input[0].focus();
            }).bind('s', () => $input[0].focus());
        }
    }

    exportLichessGlobals();
    lichess.info = info;
    loadClockWidget();
    lichess.load.then(() => {
        moduleLaunchers();
        requestAnimationFrame(() => {
            initAll$1();
            initAll();
            pubsub.on('content-loaded', initAll$1);
            pubsub.on('content-loaded', initAll);
            updateRegularly(1000);
            pubsub.on('content-loaded', findAndRender);
        });
        requestIdleCallback(() => {
            const friendsEl = document.getElementById('friend_box');
            if (friendsEl)
                new OnlineFriends(friendsEl);
            const chatMembers = document.querySelector('.chat__members');
            if (chatMembers)
                watchers(chatMembers);
            $('#main-wrap')
                .on('click', '.autoselect', function () {
                this.select();
            })
                .on('click', 'button.copy', function () {
                $('#' + $(this).data('rel')).each(function () {
                    this.select();
                });
                document.execCommand('copy');
                $(this).attr('data-icon', 'E');
            });
            $('body').on('click', 'a.relation-button', function () {
                const $a = $(this).addClass('processing').css('opacity', 0.3);
                text(this.href, { method: 'post' }).then(html => {
                    if (html.includes('relation-actions'))
                        $a.parent().replaceWith(html);
                    else
                        $a.replaceWith(html);
                });
                return false;
            });
            $('.mselect .button').on('click', function () {
                const $p = $(this).parent();
                $p.toggleClass('shown');
                requestIdleCallback(() => {
                    const handler = (e) => {
                        if ($p[0].contains(e.target))
                            return;
                        $p.removeClass('shown');
                        $('html').off('click', handler);
                    };
                    $('html').on('click', handler);
                }, 200);
            });
            powertip.watchMouse();
            setTimeout(() => {
                if (!lichess.socket)
                    lichess.socket = new StrongSocket('/socket/v5', false);
            }, 300);
            topBar();
            window.addEventListener('resize', () => document.body.dispatchEvent(new Event('chessground.resize')));
            $('.user-autocomplete').each(function () {
                const focus = !!this.autofocus;
                const start = () => userComplete().then(uac => uac({
                    input: this,
                    friend: $(this).data('friend'),
                    tag: $(this).data('tag'),
                    focus,
                }));
                if (focus)
                    start();
                else
                    $(this).one('focus', start);
            });
            if (window.InfiniteScroll)
                window.InfiniteScroll('.infinite-scroll');
            $('input.confirm, button.confirm').on('click', function () {
                return confirm(this.title || 'Confirm this action?');
            });
            $('#main-wrap').on('click', 'a.bookmark', function () {
                const t = $(this).toggleClass('bookmarked');
                text(this.href, { method: 'post' });
                const count = (parseInt(t.text(), 10) || 0) + (t.hasClass('bookmarked') ? 1 : -1);
                t.find('span').html('' + (count > 0 ? count : ''));
                return false;
            });
            window.Mousetrap.bind('esc', () => {
                const $oc = $('#modal-wrap .close');
                if ($oc.length)
                    $oc.trigger('click');
                else {
                    const $input = $(':focus');
                    if ($input.length)
                        $input.trigger('blur');
                }
            });
            /* A disgusting hack for a disgusting browser
             * Edge randomly fails to rasterize SVG on page load
             * A different SVG must be loaded so a new image can be rasterized */
            if (navigator.userAgent.includes('Edge/'))
                setTimeout(() => {
                    const sprite = document.getElementById('piece-sprite');
                    sprite.href = sprite.href.replace('.css', '.external.css');
                }, 1000);
            // prevent zoom when keyboard shows on iOS
            if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                const el = document.querySelector('meta[name=viewport]');
                el.setAttribute('content', el.getAttribute('content') + ',maximum-scale=1.0');
            }
            if (location.hash === '#blind' && !$('body').hasClass('blind-mode'))
                text('/toggle-blind-mode', {
                    method: 'post',
                    body: form({
                        enable: 1,
                        redirect: '/',
                    }),
                })
                    .then(reload);
            const pageAnnounce = document.body.getAttribute('data-announce');
            if (pageAnnounce)
                announce(JSON.parse(pageAnnounce));
            serviceWorker();
            // socket default receive handlers
            pubsub.on('socket.in.redirect', (d) => {
                lichess.unload.expected = true;
                lichess.redirect(d);
            });
            pubsub.on('socket.in.fen', e => document.querySelectorAll('.mini-game-' + e.id).forEach((el) => update(el, e)));
            pubsub.on('socket.in.finish', e => document.querySelectorAll('.mini-game-' + e.id).forEach((el) => finish(el, e.win)));
            pubsub.on('socket.in.announce', announce);
            pubsub.on('socket.in.tournamentReminder', (data) => {
                if ($('#announce').length || $('body').data('tournament-id') == data.id)
                    return;
                const url = '/tournament/' + data.id;
                $('body')
                    .append('<div id="announce">' +
                    `<a data-icon="g" class="text" href="${url}">${data.name}</a>` +
                    '<div class="actions">' +
                    `<a class="withdraw text" href="${url}/withdraw" data-icon="Z">Pause</a>` +
                    `<a class="text" href="${url}" data-icon="G">Resume</a>` +
                    '</div></div>')
                    .find('#announce .withdraw')
                    .on('click', function () {
                    text(this.href, { method: 'post' });
                    $('#announce').remove();
                    return false;
                });
            });
        }, 800);
    });

}());
