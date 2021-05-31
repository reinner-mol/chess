var loginSignup = (function (exports) {
    'use strict';

    const defined = (v) => typeof v !== 'undefined';

    const jsonHeader = {
        Accept: 'application/vnd.lichess.v5+json',
    };
    const defaultInit = {
        cache: 'no-cache',
        credentials: 'same-origin', // required for safari < 12
    };
    const xhrHeader = {
        'X-Requested-With': 'XMLHttpRequest', // so lila knows it's XHR
    };
    /* fetch a JSON value */
    const json = (url, init = {}) => fetch(url, Object.assign(Object.assign(Object.assign({}, defaultInit), { headers: Object.assign(Object.assign({}, jsonHeader), xhrHeader) }), init)).then(res => {
        if (res.ok)
            return res.json();
        throw res.statusText;
    });
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
    };

    function debounce(f, wait, immediate = false) {
        let timeout;
        let lastBounce = 0;
        return function (...args) {
            const self = this;
            if (timeout)
                clearTimeout(timeout);
            timeout = undefined;
            const elapsed = performance.now() - lastBounce;
            lastBounce = performance.now();
            if (immediate && elapsed > wait)
                f.apply(self, args);
            else
                timeout = setTimeout(() => {
                    timeout = undefined;
                    f.apply(self, args);
                }, wait);
        };
    }

    const spinner = '<div class="spinner"><svg viewBox="0 0 40 40"><circle cx=20 cy=20 r=18 fill="none"></circle></svg></div>';

    function loginStart() {
        const selector = '.auth-login form';
        (function load() {
            const form = document.querySelector(selector), $f = $(form);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                $f.find('.submit').prop('disabled', true);
                fetch(form.action, Object.assign(Object.assign({}, defaultInit), { headers: xhrHeader, method: 'post', body: new FormData(form) }))
                    .then(res => res.text().then(text => [res, text]))
                    .then(([res, text]) => {
                    if (text === 'MissingTotpToken' || text === 'InvalidTotpToken') {
                        $f.find('.one-factor').hide();
                        $f.find('.two-factor').removeClass('none');
                        requestAnimationFrame(() => $f.find('.two-factor input').val('')[0].focus());
                        $f.find('.submit').prop('disabled', false);
                        if (text === 'InvalidTotpToken')
                            $f.find('.two-factor .error').removeClass('none');
                    }
                    else if (res.ok)
                        location.href = text.startsWith('ok:') ? text.substr(3) : '/';
                    else {
                        try {
                            const el = $(text).find(selector);
                            if (el.length) {
                                $f.replaceWith(el);
                                load();
                            }
                            else {
                                alert(text || res.statusText + '. Please wait some time before trying again.');
                                $f.find('.submit').prop('disabled', false);
                            }
                        }
                        catch (e) {
                            console.warn(e);
                            $f.html(text);
                        }
                    }
                });
            });
        })();
    }
    function signupStart() {
        const $form = $('#signup-form'), $exists = $form.find('.username-exists'), $username = $form.find('input[name="username"]').on('change keyup paste', () => {
            $exists.hide();
            usernameCheck();
        });
        const usernameCheck = debounce(() => {
            const name = $username.val();
            if (name.length >= 3)
                json(url('/player/autocomplete', { term: name, exists: 1 })).then(res => $exists.toggle(res));
        }, 300);
        $form.on('submit', () => {
            if ($form.find('[name="h-captcha-response"]').val() || !$form.hasClass('h-captcha-enabled'))
                $form
                    .find('button.submit')
                    .prop('disabled', true)
                    .removeAttr('data-icon')
                    .addClass('frameless')
                    .html(spinner);
            else
                return false;
        });
        window.signupSubmit = () => {
            const form = document.getElementById('signup-form');
            if (form.reportValidity())
                form.submit();
        };
        lichess
            .loadModule('passwordComplexity')
            .then(() => window['passwordComplexity'].addPasswordChangeListener('form3-password'));
    }

    exports.loginStart = loginStart;
    exports.signupStart = signupStart;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
