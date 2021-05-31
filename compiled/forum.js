(function () {
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
        $('.forum')
            .on('click', 'a.delete', function () {
            const link = this;
            const $wrap = modal($('.forum-delete-modal'));
            $wrap
                .find('form')
                .attr('action', link.href)
                .on('submit', function (e) {
                e.preventDefault();
                formToXhr(this);
                modal.close();
                $(link).closest('.forum-post').hide();
            });
            return false;
        })
            .on('click', 'form.unsub button', function () {
            const form = $(this).parent().toggleClass('on off')[0];
            text(`${form.action}?unsub=${$(this).data('unsub')}`, { method: 'post' });
            return false;
        });
        $('.edit.button')
            .add('.edit-post-cancel')
            .on('click', function (e) {
            e.preventDefault();
            const post = $(this).closest('.forum-post'), message = post.find('.message').toggle(), form = post.find('form.edit-post-form').toggle();
            form[0].reset();
            form.find('textarea').height(message.height());
        });
        $('.post-text-area').one('focus', function () {
            const textarea = this, topicId = $(this).attr('data-topic');
            if (topicId)
                lichess.loadScript('vendor/textcomplete.min.js').then(function () {
                    const searchCandidates = function (term, candidateUsers) {
                        return candidateUsers.filter((user) => user.toLowerCase().startsWith(term.toLowerCase()));
                    };
                    // We only ask the server for the thread participants once the user has clicked the text box as most hits to the
                    // forums will be only to read the thread. So the 'thread participants' starts out empty until the post text area
                    // is focused.
                    const threadParticipants = json('/forum/participants/' + topicId);
                    const textcomplete = new window.Textcomplete(new window.Textcomplete.editors.Textarea(textarea));
                    textcomplete.register([
                        {
                            match: /(^|\s)@(|[a-zA-Z_-][\w-]{0,19})$/,
                            search: function (term, callback) {
                                // Initially we only autocomplete by participants in the thread. As the user types more,
                                // we can autocomplete against all users on the site.
                                threadParticipants.then(function (participants) {
                                    const forumParticipantCandidates = searchCandidates(term, participants);
                                    if (forumParticipantCandidates.length != 0) {
                                        // We always prefer a match on the forum thread partcipants' usernames
                                        callback(forumParticipantCandidates);
                                    }
                                    else if (term.length >= 3) {
                                        // We fall back to every site user after 3 letters of the username have been entered
                                        // and there are no matches in the forum thread participants
                                        json(url('/player/autocomplete', { term }), { cache: 'default' })
                                            .then(candidateUsers => callback(searchCandidates(term, candidateUsers)));
                                    }
                                    else {
                                        callback([]);
                                    }
                                });
                            },
                            replace: mention => '$1@' + mention + ' ',
                        },
                    ], {
                        placement: 'top',
                        appendTo: '#lichess_forum',
                    });
                });
        });
        $('.forum').on('click', '.reactions-auth button', e => {
            const href = e.target.getAttribute('data-href');
            if (href) {
                const $rels = $(e.target).parent();
                if ($rels.hasClass('loading'))
                    return;
                $rels.addClass('loading');
                text(href, { method: 'post' }).then(html => {
                    $rels.replaceWith(html);
                    $rels.removeClass('loading');
                }, _ => {
                    lichess.announce({ msg: 'Failed to send forum post reaction' });
                });
            }
        });
    });

}());
