var UserComplete = (function () {
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

    function complete (opts) {
        const minLength = opts.minLength || 3, empty = opts.empty || (() => '<div class="complete-list__empty">No results.</div>'), cache = new Map(), fetchResults = term => {
            if (cache.has(term))
                return new Promise(res => setTimeout(() => res(cache.get(term)), 50));
            else if (term.length > 3 &&
                Array.from({
                    length: term.length - 3,
                }, (_, i) => -i - 1)
                    .map(i => term.slice(0, i))
                    .some(sub => cache.has(sub) && !cache.get(sub).length))
                return Promise.resolve([]);
            return opts.fetch(term).then(results => {
                cache.set(term, results);
                return results;
            });
        }, selectedResult = () => {
            if (selectedIndex === null)
                return;
            return renderedResults[selectedIndex];
        }, moveSelection = (offset) => {
            const nb = renderedResults.length;
            selectedIndex = (selectedIndex === null ? (offset == 1 ? 0 : -1) : selectedIndex + offset) % nb;
            if (selectedIndex < 0)
                selectedIndex += nb;
            renderSelection();
            const result = selectedResult();
            if (result)
                opts.input.value = opts.populate(result);
        }, renderSelection = () => {
            $container.find('.complete-selected').removeClass('complete-selected');
            if (selectedIndex !== null)
                $container.find('.complete-result').eq(selectedIndex).addClass('complete-selected');
        };
        const $container = $('<div class="complete-list none"></div>').insertAfter(opts.input);
        let selectedIndex = null, renderedResults = [];
        opts.input.autocomplete = 'off';
        const update = () => {
            const term = opts.input.value.trim();
            if (term.length >= minLength && (!opts.regex || term.match(opts.regex)))
                fetchResults(term).then(renderResults, console.log);
            else
                $container.addClass('none');
        };
        $(opts.input).on({
            input: update,
            focus: update,
            // must be delayed, otherwise the result click event doesn't fire
            blur() {
                setTimeout(() => $container.addClass('none'), 100);
                return true;
            },
            keydown(e) {
                if ($container.hasClass('none'))
                    return;
                if (e.code == 'ArrowDown') {
                    moveSelection(1);
                    return false;
                }
                if (e.code == 'ArrowUp') {
                    moveSelection(-1);
                    return false;
                }
                if (e.code == 'Enter') {
                    $container.addClass('none');
                    const result = selectedResult() ||
                        (renderedResults[0] && opts.populate(renderedResults[0]) == opts.input.value
                            ? renderedResults[0]
                            : undefined);
                    if (result) {
                        if (opts.onSelect)
                            opts.onSelect(result);
                        return false;
                    }
                }
                return;
            },
        });
        const renderResults = (results) => {
            $container.empty();
            if (results[0])
                results.forEach(result => $(opts.render(result))
                    /* can't use click because blur fires first and removes the click target */
                    .on('mousedown touchdown', () => {
                    /* crazy shit here
                       just `opts.input.value = opts.select(result);`
                       does nothing. `opts.select` is not called.
                       */
                    const newValue = opts.populate(result);
                    opts.input.value = newValue;
                    if (opts.onSelect)
                        opts.onSelect(result);
                    return true;
                })
                    .appendTo($container));
            else
                $container.html(empty());
            renderedResults = results;
            selectedIndex = null;
            renderSelection();
            $container.removeClass('none');
        };
        /* opts.input.value = 'chess'; */
        /* $(opts.input).trigger('input'); */
    }

    /* global setTimeout, clearTimeout */

    var dist = function debounce(fn) {
      var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var lastCallAt = void 0;
      var deferred = void 0;
      var timer = void 0;
      var pendingArgs = [];
      return function debounced() {
        var currentWait = getWait(wait);
        var currentTime = new Date().getTime();

        var isCold = !lastCallAt || currentTime - lastCallAt > currentWait;

        lastCallAt = currentTime;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (isCold && options.leading) {
          return options.accumulate ? Promise.resolve(fn.call(this, [args])).then(function (result) {
            return result[0];
          }) : Promise.resolve(fn.call.apply(fn, [this].concat(args)));
        }

        if (deferred) {
          clearTimeout(timer);
        } else {
          deferred = defer();
        }

        pendingArgs.push(args);
        timer = setTimeout(flush.bind(this), currentWait);

        if (options.accumulate) {
          var argsIndex = pendingArgs.length - 1;
          return deferred.promise.then(function (results) {
            return results[argsIndex];
          });
        }

        return deferred.promise;
      };

      function flush() {
        var thisDeferred = deferred;
        clearTimeout(timer);

        Promise.resolve(options.accumulate ? fn.call(this, pendingArgs) : fn.apply(this, pendingArgs[pendingArgs.length - 1])).then(thisDeferred.resolve, thisDeferred.reject);

        pendingArgs = [];
        deferred = null;
      }
    };

    function getWait(wait) {
      return typeof wait === 'function' ? wait() : wait;
    }

    function defer() {
      var deferred = {};
      deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });
      return deferred;
    }

    function userComplete (opts) {
        const debounced = dist((term) => json(url('/player/autocomplete', {
            term,
            friend: opts.friend ? 1 : 0,
            tour: opts.tour,
            swiss: opts.swiss,
            object: 1,
        }))
            .then(r => (Object.assign({ term }, r))), 150);
        complete({
            input: opts.input,
            fetch: t => debounced(t).then(({ term, result }) => (t == term ? result : Promise.reject('Debounced ' + t))),
            render(o) {
                const tag = opts.tag || 'a';
                return ('<' +
                    tag +
                    ' class="complete-result ulpt user-link' +
                    (o.online ? ' online' : '') +
                    '" ' +
                    (tag === 'a' ? '' : 'data-') +
                    'href="/@/' +
                    o.name +
                    '">' +
                    '<i class="line' +
                    (o.patron ? ' patron' : '') +
                    '"></i>' +
                    (o.title
                        ? '<span class="utitle"' + (o.title == 'BOT' ? ' data-bot="data-bot" ' : '') + '>' + o.title + '</span>&nbsp;'
                        : '') +
                    o.name +
                    '</' +
                    tag +
                    '>');
            },
            populate: opts.populate || (r => r.name),
            onSelect: opts.onSelect,
            regex: /^[a-z0-9][\w-]{2,29}$/i,
        });
    }

    return userComplete;

}());
