(function () {
	'use strict';

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
	/* constructs a url with escaped parameters */
	const url = (path, params) => {
	    const searchParams = new URLSearchParams();
	    for (const k of Object.keys(params))
	        if (defined(params[k]))
	            searchParams.append(k, params[k]);
	    const query = searchParams.toString();
	    return query ? `${path}?${query}` : path;
	};

	const assetUrl = (path, opts = {}) => {
	    opts = opts || {};
	    const baseUrl = opts.sameDomain ? '' : document.body.getAttribute('data-asset-url'), version = opts.version || document.body.getAttribute('data-asset-version');
	    return baseUrl + '/assets' + (opts.noVersion ? '' : '/_' + version) + '/' + path;
	};
	const loadedScript = new Map();
	const loadScript = (url, opts = {}) => {
	    if (!loadedScript.has(url))
	        loadedScript.set(url, script(assetUrl(url, opts)));
	    return loadedScript.get(url);
	};

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

	lichess.load.then(() => {
	    $('table.sortable').each(function () {
	        tablesort(this, {
	            descending: true,
	        });
	    });
	    $('.name-regen').on('click', function () {
	        text(this.href).then(name => $('#form3-create-username').val(name));
	        return false;
	    });
	    $('#form3-teachers').each(function () {
	        const textarea = this;
	        function currentUserIds() {
	            return textarea.value.split('\n').slice(0, -1);
	        }
	        loadScript('vendor/textcomplete.min.js').then(() => {
	            const textcomplete = new window.Textcomplete(new window.Textcomplete.editors.Textarea(textarea), {
	                dropdown: {
	                    maxCount: 10,
	                    placement: 'bottom',
	                },
	            });
	            textcomplete.register([
	                {
	                    id: 'teacher',
	                    match: /(^|\s)(.+)$/,
	                    index: 2,
	                    search(term, callback) {
	                        if (term.length < 2)
	                            callback([]);
	                        else
	                            json(url('/player/autocomplete', {
	                                object: 1,
	                                teacher: 1,
	                                term,
	                            }))
	                                .then(res => {
	                                const current = currentUserIds();
	                                callback(res.result.filter(t => !current.includes(t.id)));
	                            }, _ => callback([]));
	                    },
	                    template: o => '<span class="ulpt user-link' +
	                        (o.online ? ' online' : '') +
	                        '" href="/@/' +
	                        o.name +
	                        '">' +
	                        '<i class="line' +
	                        (o.patron ? ' patron' : '') +
	                        '"></i>' +
	                        (o.title ? '<span class="utitle">' + o.title + '</span>&nbsp;' : '') +
	                        o.name +
	                        '</span>',
	                    replace: o => '$1' + o.name + '\n',
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
	    extendTablesortNumber();
	});

}());
