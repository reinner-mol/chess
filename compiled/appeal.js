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

    lichess.load.then(() => {
        if ($('.nav-tree').length)
            location.hash = location.hash || '#help-root';
        $('select.appeal-presets').on('change', (e) => $('#form3-text').val(e.target.value));
        $('form.appeal__actions__slack').on('submit', (e) => {
            const form = e.target;
            formToXhr(form);
            $(form).find('button').text('Sent!').attr('disabled', 'true');
            return false;
        });
    });

}());
