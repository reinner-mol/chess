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
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
    };

    lichess.load.then(() => {
        $('#form3-teams').each(function () {
            const textarea = this;
            const textcomplete = new window.Textcomplete(new window.Textcomplete.editors.Textarea(textarea), {
                dropdown: {
                    maxCount: 10,
                    placement: 'bottom',
                },
            });
            textcomplete.register([
                {
                    id: 'team',
                    match: /(^|\s)(.+)$/,
                    index: 2,
                    search(term, callback) {
                        json(url('/team/autocomplete', { term }), { cache: 'default' }).then(res => {
                            const current = textarea.value
                                .split('\n')
                                .map(t => t.split(' ')[0])
                                .slice(0, -1);
                            callback(res.filter(t => !current.includes(t.id)));
                        }, _ => callback([]));
                    },
                    template: (team) => team.name + ', by ' + team.owner + ', with ' + team.members + ' members',
                    replace: (team) => '$1' + team.id + ' "' + team.name + '" by ' + team.owner + '\n',
                },
            ]);
            textcomplete.on('rendered', function () {
                if (textcomplete.dropdown.items.length) {
                    // Activate the first item by default.
                    textcomplete.dropdown.items[0].activate();
                }
            });
        });
    });

}());
