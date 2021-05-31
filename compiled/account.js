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
        const arrowSnapStore = lichess.storage.make('arrow.snap');
        const courtesyStore = lichess.storage.make('courtesy');
        $('.security table form').on('submit', function () {
            text(this.action, { method: 'post' });
            $(this).parent().parent().remove();
            return false;
        });
        $('form.autosubmit').each(function () {
            const form = this, $form = $(form), showSaved = () => $form.find('.saved').show();
            $form.find('input').on('change', function () {
                if (this.name == 'behavior.arrowSnap') {
                    arrowSnapStore.set(this.value);
                    showSaved();
                }
                else if (this.name == 'behavior.courtesy') {
                    courtesyStore.set(this.value);
                    showSaved();
                }
                formToXhr(form).then(() => {
                    showSaved();
                    lichess.storage.fire('reload-round-tabs');
                });
            });
        });
        $(`#irbehavior_arrowSnap_${arrowSnapStore.get() || 1}`).prop('checked', true);
        $(`#irbehavior_courtesy_${courtesyStore.get() || 0}`).prop('checked', true);
    });

}());
