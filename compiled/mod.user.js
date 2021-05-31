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

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var tablesort = createCommonjsModule(function (module) {
    (function() {
      function Tablesort(el, options) {
        if (!(this instanceof Tablesort)) return new Tablesort(el, options);

        if (!el || el.tagName !== 'TABLE') {
          throw new Error('Element must be a table');
        }
        this.init(el, options || {});
      }

      var sortOptions = [];

      var createEvent = function(name) {
        var evt;

        if (!window.CustomEvent || typeof window.CustomEvent !== 'function') {
          evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(name, false, false, undefined);
        } else {
          evt = new CustomEvent(name);
        }

        return evt;
      };

      var getInnerText = function(el) {
        return el.getAttribute('data-sort') || el.textContent || el.innerText || '';
      };

      // Default sort method if no better sort method is found
      var caseInsensitiveSort = function(a, b) {
        a = a.trim().toLowerCase();
        b = b.trim().toLowerCase();

        if (a === b) return 0;
        if (a < b) return 1;

        return -1;
      };

      var getCellByKey = function(cells, key) {
        return [].slice.call(cells).find(function(cell) {
          return cell.getAttribute('data-sort-column-key') === key;
        });
      };

      // Stable sort function
      // If two elements are equal under the original sort function,
      // then there relative order is reversed
      var stabilize = function(sort, antiStabilize) {
        return function(a, b) {
          var unstableResult = sort(a.td, b.td);

          if (unstableResult === 0) {
            if (antiStabilize) return b.index - a.index;
            return a.index - b.index;
          }

          return unstableResult;
        };
      };

      Tablesort.extend = function(name, pattern, sort) {
        if (typeof pattern !== 'function' || typeof sort !== 'function') {
          throw new Error('Pattern and sort must be a function');
        }

        sortOptions.push({
          name: name,
          pattern: pattern,
          sort: sort
        });
      };

      Tablesort.prototype = {

        init: function(el, options) {
          var that = this,
              firstRow,
              defaultSort,
              i,
              cell;

          that.table = el;
          that.thead = false;
          that.options = options;

          if (el.rows && el.rows.length > 0) {
            if (el.tHead && el.tHead.rows.length > 0) {
              for (i = 0; i < el.tHead.rows.length; i++) {
                if (el.tHead.rows[i].getAttribute('data-sort-method') === 'thead') {
                  firstRow = el.tHead.rows[i];
                  break;
                }
              }
              if (!firstRow) {
                firstRow = el.tHead.rows[el.tHead.rows.length - 1];
              }
              that.thead = true;
            } else {
              firstRow = el.rows[0];
            }
          }

          if (!firstRow) return;

          var onClick = function() {
            if (that.current && that.current !== this) {
              that.current.removeAttribute('aria-sort');
            }

            that.current = this;
            that.sortTable(this);
          };

          // Assume first row is the header and attach a click handler to each.
          for (i = 0; i < firstRow.cells.length; i++) {
            cell = firstRow.cells[i];
            cell.setAttribute('role','columnheader');
            if (cell.getAttribute('data-sort-method') !== 'none') {
              cell.tabindex = 0;
              cell.addEventListener('click', onClick, false);

              if (cell.getAttribute('data-sort-default') !== null) {
                defaultSort = cell;
              }
            }
          }

          if (defaultSort) {
            that.current = defaultSort;
            that.sortTable(defaultSort);
          }
        },

        sortTable: function(header, update) {
          var that = this,
              columnKey = header.getAttribute('data-sort-column-key'),
              column = header.cellIndex,
              sortFunction = caseInsensitiveSort,
              item = '',
              items = [],
              i = that.thead ? 0 : 1,
              sortMethod = header.getAttribute('data-sort-method'),
              sortOrder = header.getAttribute('aria-sort');

          that.table.dispatchEvent(createEvent('beforeSort'));

          // If updating an existing sort, direction should remain unchanged.
          if (!update) {
            if (sortOrder === 'ascending') {
              sortOrder = 'descending';
            } else if (sortOrder === 'descending') {
              sortOrder = 'ascending';
            } else {
              sortOrder = that.options.descending ? 'descending' : 'ascending';
            }

            header.setAttribute('aria-sort', sortOrder);
          }

          if (that.table.rows.length < 2) return;

          // If we force a sort method, it is not necessary to check rows
          if (!sortMethod) {
            var cell;
            while (items.length < 3 && i < that.table.tBodies[0].rows.length) {
              if(columnKey) {
                cell = getCellByKey(that.table.tBodies[0].rows[i].cells, columnKey);
              } else {
                cell = that.table.tBodies[0].rows[i].cells[column];
              }

              // Treat missing cells as empty cells
              item = cell ? getInnerText(cell) : "";

              item = item.trim();

              if (item.length > 0) {
                items.push(item);
              }

              i++;
            }

            if (!items) return;
          }

          for (i = 0; i < sortOptions.length; i++) {
            item = sortOptions[i];

            if (sortMethod) {
              if (item.name === sortMethod) {
                sortFunction = item.sort;
                break;
              }
            } else if (items.every(item.pattern)) {
              sortFunction = item.sort;
              break;
            }
          }

          that.col = column;

          for (i = 0; i < that.table.tBodies.length; i++) {
            var newRows = [],
                noSorts = {},
                j,
                totalRows = 0,
                noSortsSoFar = 0;

            if (that.table.tBodies[i].rows.length < 2) continue;

            for (j = 0; j < that.table.tBodies[i].rows.length; j++) {
              var cell;

              item = that.table.tBodies[i].rows[j];
              if (item.getAttribute('data-sort-method') === 'none') {
                // keep no-sorts in separate list to be able to insert
                // them back at their original position later
                noSorts[totalRows] = item;
              } else {
                if (columnKey) {
                  cell = getCellByKey(item.cells, columnKey);
                } else {
                  cell = item.cells[that.col];
                }
                // Save the index for stable sorting
                newRows.push({
                  tr: item,
                  td: cell ? getInnerText(cell) : '',
                  index: totalRows
                });
              }
              totalRows++;
            }
            // Before we append should we reverse the new array or not?
            // If we reverse, the sort needs to be `anti-stable` so that
            // the double negatives cancel out
            if (sortOrder === 'descending') {
              newRows.sort(stabilize(sortFunction, true));
            } else {
              newRows.sort(stabilize(sortFunction, false));
              newRows.reverse();
            }

            // append rows that already exist rather than creating new ones
            for (j = 0; j < totalRows; j++) {
              if (noSorts[j]) {
                // We have a no-sort row for this position, insert it here.
                item = noSorts[j];
                noSortsSoFar++;
              } else {
                item = newRows[j - noSortsSoFar].tr;
              }

              // appendChild(x) moves x if already present somewhere else in the DOM
              that.table.tBodies[i].appendChild(item);
            }
          }

          that.table.dispatchEvent(createEvent('afterSort'));
        },

        refresh: function() {
          if (this.current !== undefined) {
            this.sortTable(this.current, true);
          }
        }
      };

      if (module.exports) {
        module.exports = Tablesort;
      } else {
        window.Tablesort = Tablesort;
      }
    })();
    });

    function extendTablesortNumber() {
        tablesort.extend('number', (item) => item.match(/^[-+]?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/), (a, b) => compareNumber(cleanNumber(b), cleanNumber(a)));
    }
    const cleanNumber = (i) => i.replace(/[^\-?0-9.]/g, '');
    const compareNumber = (a, b) => {
        a = parseFloat(a);
        b = parseFloat(b);
        a = isNaN(a) ? 0 : a;
        b = isNaN(b) ? 0 : b;
        return a - b;
    };

    const spinner = '<div class="spinner"><svg viewBox="0 0 40 40"><circle cx=20 cy=20 r=18 fill="none"></circle></svg></div>';

    lichess.load.then(() => {
        const $toggle = $('.mod-zone-toggle'), $zone = $('.mod-zone-full');
        let nbOthers = 100;
        function streamLoad() {
            const source = new EventSource($toggle.attr('href') + '?nbOthers=' + nbOthers), callback = debounce(() => userMod($zone), 300);
            source.addEventListener('message', e => {
                if (!e.data)
                    return;
                const html = $('<output>').append($.parseHTML(e.data));
                html.find('.mz-section').each(function () {
                    const prev = $zone.find(`.mz-section--${$(this).data('rel')}`);
                    if (prev.length)
                        prev.replaceWith($(this));
                    else
                        $zone.append($(this).clone());
                });
                callback();
            });
            source.onerror = () => source.close();
        }
        function loadZone() {
            $zone.html(spinner).removeClass('none');
            $('#main-wrap').addClass('full-screen-force');
            $zone.html('');
            streamLoad();
            window.addEventListener('scroll', onScroll);
            scrollTo('.mod-zone-full');
        }
        function unloadZone() {
            $zone.addClass('none');
            $('#main-wrap').removeClass('full-screen-force');
            window.removeEventListener('scroll', onScroll);
            scrollTo('#top');
        }
        function reloadZone() {
            streamLoad();
        }
        function scrollTo(selector) {
            const target = document.querySelector(selector);
            if (target) {
                const offset = $('#inquiry').length ? -50 : 50;
                window.scrollTo(0, target.offsetTop + offset);
            }
        }
        $toggle.on('click', () => {
            if ($zone.hasClass('none'))
                loadZone();
            else
                unloadZone();
            return false;
        });
        const getLocationHash = (a) => a.href.replace(/.+(#\w+)$/, '$1');
        function userMod($inZone) {
            lichess.contentLoaded($inZone[0]);
            const makeReady = (selector, f, cls = 'ready') => {
                $inZone.find(selector + `:not(.${cls})`).each(function (i) {
                    f($(this).addClass(cls)[0], i);
                });
            };
            $('.mz-section--menu > a:not(.available)').each(function () {
                $(this).toggleClass('available', !!$(getLocationHash(this)).length);
            });
            makeReady('.mz-section--menu', el => {
                $(el)
                    .find('a')
                    .each(function (i) {
                    const id = getLocationHash(this), n = '' + (i + 1);
                    $(this).prepend(`<i>${n}</i>`);
                    window.Mousetrap.bind(n, () => scrollTo(id));
                });
            });
            makeReady('form.xhr', (el) => {
                $(el)
                    .find('input.confirm, button.confirm')
                    .on('click', function () {
                    return confirm(this.title || 'Confirm this action?');
                });
                $(el).on('submit', () => {
                    $(el).addClass('ready').find('input').prop('disabled', true);
                    formToXhr(el).then(html => {
                        $zone.find('.mz-section--actions').replaceWith(html);
                        userMod($inZone);
                    });
                    return false;
                });
            });
            makeReady('form.fide-title select', el => $(el).on('change', () => $(el).parent('form')[0].submit()));
            makeReady('form.pm-preset select', (el) => $(el).on('change', () => {
                const form = $(el).parent('form')[0];
                text(form.getAttribute('action') + encodeURIComponent(el.value), { method: 'post' });
                $(form).html('Sent!');
            }));
            makeReady('.mz-section--others', el => {
                $(el).height($(el).height());
                $(el)
                    .find('.mark-alt')
                    .on('click', function () {
                    if (confirm('Close alt account?')) {
                        text(this.getAttribute('href'), { method: 'post' });
                        $(this).remove();
                    }
                });
            });
            makeReady('.mz-section--others table', el => {
                tablesort(el, { descending: true });
            });
            makeReady('.mz-section--identification .spy_filter', el => {
                $(el)
                    .find('.button')
                    .on('click', function () {
                    text($(this).attr('href'), { method: 'post' });
                    $(this).parent().parent().toggleClass('blocked');
                    return false;
                });
                let selected;
                const valueOf = (el) => $(el).find('td:first-child').text();
                const applyFilter = (v) => v
                    ? $inZone.find('.mz-section--others tbody tr').each(function () {
                        $(this).toggleClass('none', !($(this).data('tags') || '').includes(v));
                    })
                    : $inZone.find('.mz-section--others tbody tr.none').removeClass('none');
                $(el)
                    .find('tr')
                    .on('click', function () {
                    const v = valueOf(this);
                    selected = selected == v ? undefined : v;
                    applyFilter(selected);
                    $('.spy_filter tr.selected').removeClass('selected');
                    $(this).toggleClass('selected', !!selected);
                })
                    .on('mouseenter', function () {
                    !selected && applyFilter(valueOf(this));
                });
                $(el).on('mouseleave', () => !selected && applyFilter());
            });
            makeReady('.mz-section--identification .slist--sort', el => {
                tablesort(el, { descending: true });
            }, 'ready-sort');
            makeReady('.mz-section--others .more-others', el => {
                $(el)
                    .addClass('ready')
                    .on('click', () => {
                    nbOthers = 1000;
                    reloadZone();
                });
            });
        }
        const onScroll = () => requestAnimationFrame(() => {
            if ($zone.hasClass('none'))
                return;
            $zone.toggleClass('stick-menu', window.scrollY > 200);
        });
        extendTablesortNumber();
        if (new URL(location.href).searchParams.has('mod'))
            $toggle.trigger('click');
        window.Mousetrap.bind('m', () => $toggle.trigger('click')).bind('i', () => $zone.find('button.inquiry').trigger('click'));
        const $other = $('#communication,main.appeal');
        if ($other.length)
            userMod($other);
    });

}());
