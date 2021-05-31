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
    /* produce HTTP form data from a JS object */
    const form = (data) => {
        const formData = new FormData();
        for (const k of Object.keys(data))
            formData.append(k, data[k]);
        return formData;
    };

    function modal(content, cls, onClose) {
        modal.close();
        const $wrap = $('<div id="modal-wrap"><span class="close" data-icon="L"></span></div>');
        const $overlay = $(`<div id="modal-overlay" class="${cls}">`).on('click', modal.close);
        $wrap.appendTo($overlay);
        content.clone().removeClass('none').appendTo($wrap);
        modal.onClose = onClose;
        $wrap.find('.close').on('click', modal.close);
        $wrap.on('click', (e) => e.stopPropagation());
        $('body').addClass('overlayed').prepend($overlay);
        return $wrap;
    }
    modal.close = () => {
        $('body').removeClass('overlayed');
        $('#modal-overlay').each(function () {
            if (modal.onClose)
                modal.onClose();
            $(this).remove();
        });
        delete modal.onClose;
    };
    modal.onClose = undefined;

    lichess.load.then(() => {
        let autoRefreshEnabled = true;
        let autoRefreshOnHold = false;
        const renderButton = () => $('.auto-refresh').toggleClass('active', autoRefreshEnabled).toggleClass('hold', autoRefreshOnHold);
        const reloadNow = () => text('/mod/public-chat').then(html => {
            // Reload only the chat grid portions of the page
            $(html).find('#communication').appendTo($('#comm-wrap').empty());
            onPageReload();
        });
        const onPageReload = () => {
            $('#communication').append($('<a class="auto-refresh button">Auto refresh</a>').on('click', () => {
                autoRefreshEnabled = !autoRefreshEnabled;
                renderButton();
            }));
            renderButton();
            $('#communication .chat').each(function () {
                this.scrollTop = 99999;
            });
            $('#communication')
                .on('mouseenter', '.chat', () => {
                autoRefreshOnHold = true;
                $('.auto-refresh').addClass('hold');
            })
                .on('mouseleave', '.chat', () => {
                autoRefreshOnHold = false;
                $('.auto-refresh').removeClass('hold');
            });
            $('#communication').on('click', '.line:not(.lichess)', function () {
                const $l = $(this);
                const roomId = $l.parents('.game').data('room');
                const chan = $l.parents('.game').data('chan');
                const $wrap = modal($('.timeout-modal'));
                $wrap.find('.username').text($l.find('.user-link').text());
                $wrap.find('.text').text($l.text().split(' ').slice(1).join(' '));
                $wrap.on('click', '.button', function () {
                    modal.close();
                    text('/mod/public-chat/timeout', {
                        method: 'post',
                        body: form({
                            roomId,
                            chan,
                            userId: $wrap.find('.username').text().toLowerCase(),
                            reason: this.value,
                            text: $wrap.find('.text').text(),
                        }),
                    }).then(_ => setTimeout(reloadNow, 1000));
                });
            });
        };
        onPageReload();
        setInterval(function () {
            if (!autoRefreshEnabled || document.visibilityState === 'hidden' || autoRefreshOnHold)
                return;
            reloadNow();
        }, 5000);
    });

}());
