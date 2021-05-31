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

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
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

    var sparkline_commonjs2 = createCommonjsModule(function (module) {
    module.exports=function(t){var e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n});},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)r.d(n,o,function(e){return t[e]}.bind(null,o));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=1)}([function(t,e,r){var n=r(2),o=r(3),i=r(4);t.exports=function(t){return n(t)||o(t)||i()};},function(t,e,r){r.r(e),r.d(e,"sparkline",function(){return c});var n=r(0),o=r.n(n);function i(t,e,r,n){return parseFloat((e-n*e/t+r).toFixed(2))}function a(t){return t.value}function u(t,e){var r=document.createElementNS("http://www.w3.org/2000/svg",t);for(var n in e)r.setAttribute(n,e[n]);return r}function c(t,e,r){var n;if(n=t,o()(n.querySelectorAll("*")).forEach(function(t){return n.removeChild(t)}),!(e.length<=1)){r=r||{},"number"==typeof e[0]&&(e=e.map(function(t){return {value:t}}));var c=r.onmousemove,l=r.onmouseout,s="interactive"in r?r.interactive:!!c,f=r.spotRadius||2,p=2*f,d=r.cursorWidth||2,v=parseFloat(t.attributes["stroke-width"].value),b=r.fetch||a,h=e.map(function(t){return b(t)}),y=parseFloat(t.attributes.width.value)-2*p,x=parseFloat(t.attributes.height.value),m=x-2*v-p,g=Math.max.apply(Math,o()(h)),A=-1e3,w=h.length-1,j=y/w,O=[],k=i(g,m,v+f,h[0]),S="M".concat(p," ").concat(k);h.forEach(function(t,r){var n=r*j+p,o=i(g,m,v+f,t);O.push(Object.assign({},e[r],{index:r,x:n,y:o})),S+=" L ".concat(n," ").concat(o);});var M=u("path",{class:"sparkline--line",d:S,fill:"none"}),C=u("path",{class:"sparkline--fill",d:"".concat(S," V ").concat(x," L ").concat(p," ").concat(x," Z"),stroke:"none"});if(t.appendChild(C),t.appendChild(M),s){var E=u("line",{class:"sparkline--cursor",x1:A,x2:A,y1:0,y2:x,"stroke-width":d}),_=u("circle",{class:"sparkline--spot",cx:A,cy:A,r:f});t.appendChild(E),t.appendChild(_);var F=u("rect",{width:t.attributes.width.value,height:t.attributes.height.value,style:"fill: transparent; stroke: transparent",class:"sparkline--interaction-layer"});t.appendChild(F),F.addEventListener("mouseout",function(t){E.setAttribute("x1",A),E.setAttribute("x2",A),_.setAttribute("cx",A),l&&l(t);}),F.addEventListener("mousemove",function(t){var e=t.offsetX,r=O.find(function(t){return t.x>=e});r||(r=O[w]);var n,o=O[O.indexOf(r)-1],i=(n=o?o.x+(r.x-o.x)/2<=e?r:o:r).x,a=n.y;_.setAttribute("cx",i),_.setAttribute("cy",a),E.setAttribute("x1",i),E.setAttribute("x2",i),c&&c(t,n);});}}}e.default=c;},function(t,e){t.exports=function(t){if(Array.isArray(t)){for(var e=0,r=new Array(t.length);e<t.length;e++)r[e]=t[e];return r}};},function(t,e){t.exports=function(t){if(Symbol.iterator in Object(t)||"[object Arguments]"===Object.prototype.toString.call(t))return Array.from(t)};},function(t,e){t.exports=function(){throw new TypeError("Invalid attempt to spread non-iterable instance")};}]);
    //# sourceMappingURL=sparkline.commonjs2.js.map
    });

    var sparkline = /*@__PURE__*/getDefaultExportFromCjs(sparkline_commonjs2);

    // Ensures calls to the wrapped function are spaced by the given delay.
    // Any extra calls are dropped, except the last one.
    function throttle(delay, callback) {
        let timeout;
        let lastExec = 0;
        return function (...args) {
            const self = this;
            const elapsed = performance.now() - lastExec;
            function exec() {
                timeout = undefined;
                lastExec = performance.now();
                callback.apply(self, args);
            }
            if (timeout)
                clearTimeout(timeout);
            if (elapsed > delay)
                exec();
            else
                timeout = setTimeout(exec, delay - elapsed);
        };
    }

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

    function resizeHandle(els, pref, ply, visible) {
        if (pref === 0 /* Never */)
            return;
        const el = document.createElement('cg-resize');
        els.container.appendChild(el);
        const startResize = (start) => {
            start.preventDefault();
            const mousemoveEvent = start.type === 'touchstart' ? 'touchmove' : 'mousemove', mouseupEvent = start.type === 'touchstart' ? 'touchend' : 'mouseup', startPos = eventPosition(start), initialZoom = parseInt(getComputedStyle(document.body).getPropertyValue('--zoom'));
            let zoom = initialZoom;
            const saveZoom = debounce(() => text(`/pref/zoom?v=${100 + zoom}`, { method: 'post' }), 700);
            const resize = (move) => {
                const pos = eventPosition(move), delta = pos[0] - startPos[0] + pos[1] - startPos[1];
                zoom = Math.round(Math.min(100, Math.max(0, initialZoom + delta / 10)));
                document.body.setAttribute('style', '--zoom:' + zoom);
                window.dispatchEvent(new Event('resize'));
                saveZoom();
            };
            document.body.classList.add('resizing');
            document.addEventListener(mousemoveEvent, resize);
            document.addEventListener(mouseupEvent, () => {
                document.removeEventListener(mousemoveEvent, resize);
                document.body.classList.remove('resizing');
            }, { once: true });
        };
        el.addEventListener('touchstart', startResize, { passive: false });
        el.addEventListener('mousedown', startResize, { passive: false });
        if (pref === 1 /* OnlyAtStart */) {
            const toggle = (ply) => el.classList.toggle('none', visible ? !visible(ply) : ply >= 2);
            toggle(ply);
            lichess.pubsub.on('ply', toggle);
        }
    }
    function eventPosition(e) {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return;
    }

    lichess.load.then(() => {
        $('#trainer').each(function () {
            const $trainer = $(this);
            const $board = $('.coord-trainer__board .cg-wrap');
            let ground;
            const $side = $('.coord-trainer__side');
            const $right = $('.coord-trainer__table');
            const $bar = $trainer.find('.progress_bar');
            const $coords = [$('#next_coord0'), $('#next_coord1')];
            const $start = $right.find('.start');
            const $explanation = $right.find('.explanation');
            const $score = $('.coord-trainer__score');
            const $timer = $('.coord-trainer__timer');
            const scoreUrl = $trainer.data('score-url');
            const duration = 30 * 1000;
            const tickDelay = 50;
            const resizePref = $trainer.data('resize-pref');
            let colorPref = $trainer.data('color-pref');
            let color;
            let startAt, score;
            let wrongTimeout;
            let ply = 0;
            const showColor = function () {
                color = colorPref == 'random' ? ['white', 'black'][Math.round(Math.random())] : colorPref;
                if (!ground)
                    ground = window.Chessground($board[0], {
                        coordinates: false,
                        drawable: { enabled: false },
                        movable: {
                            free: false,
                            color: null,
                        },
                        orientation: color,
                        addPieceZIndex: $('#main-wrap').hasClass('is3d'),
                        events: {
                            insert(elements) {
                                resizeHandle(elements, resizePref, ply);
                            },
                        },
                    });
                else if (color !== ground.state.orientation)
                    ground.toggleOrientation();
                $trainer.removeClass('white black').addClass(color);
            };
            showColor();
            $trainer.find('form.color').each(function () {
                const form = this, $form = $(this);
                $form.find('input').on('change', function () {
                    const selected = $form.find('input:checked').val();
                    const c = {
                        1: 'white',
                        2: 'random',
                        3: 'black',
                    }[selected];
                    if (c !== colorPref)
                        formToXhr(form);
                    colorPref = c;
                    showColor();
                    return false;
                });
            });
            const setZen = throttle(1000, zen => text('/pref/zen', {
                method: 'post',
                body: form({ zen: zen ? 1 : 0 }),
            }));
            lichess.pubsub.on('zen', () => {
                const zen = !$('body').hasClass('zen');
                $('body').toggleClass('zen', zen);
                window.dispatchEvent(new Event('resize'));
                setZen(zen);
                requestAnimationFrame(showCharts);
            });
            window.Mousetrap.bind('z', () => lichess.pubsub.emit('zen'));
            $('#zentog').on('click', () => lichess.pubsub.emit('zen'));
            function showCharts() {
                $side.find('.user_chart').each(function () {
                    const $svg = $('<svg class="sparkline" height="80px" stroke-width="3">')
                        .attr('width', $(this).width() + 'px')
                        .prependTo($(this).empty());
                    sparkline($svg[0], $(this).data('points'), {
                        interactive: true,
                        /* onmousemove(event, datapoint) { */
                        /*   var svg = findClosest(event.target, "svg"); */
                        /*   var tooltip = svg.nextElementSibling; */
                        /*   var date = new Date(datapoint.date).toUTCString().replace(/^.*?, (.*?) \d{2}:\d{2}:\d{2}.*?$/, "$1"); */
                        /*   tooltip.hidden = false; */
                        /*   tooltip.textContent = `${date}: $${datapoint.value.toFixed(2)} USD`; */
                        /*   tooltip.style.top = `${event.offsetY}px`; */
                        /*   tooltip.style.left = `${event.offsetX + 20}px`; */
                        /* }, */
                        /* onmouseout() { */
                        /*   var svg = findClosest(event.target, "svg"); */
                        /*   var tooltip = svg.nextElementSibling; */
                        /*   tooltip.hidden = true; */
                        /* } */
                        /* }; */
                    });
                });
            }
            requestAnimationFrame(showCharts);
            const centerRight = function () {
                $right.css('top', 256 - $right.height() / 2 + 'px');
            };
            centerRight();
            const clearCoords = function () {
                $.each($coords, function (_, e) {
                    e.text('');
                });
            };
            const newCoord = function (prevCoord) {
                // disallow the previous coordinate's row or file from being selected
                let files = 'abcdefgh';
                const fileIndex = files.indexOf(prevCoord[0]);
                files = files.slice(0, fileIndex) + files.slice(fileIndex + 1, 8);
                let rows = '12345678';
                const rowIndex = rows.indexOf(prevCoord[1]);
                rows = rows.slice(0, rowIndex) + rows.slice(rowIndex + 1, 8);
                return (files[Math.round(Math.random() * (files.length - 1))] + rows[Math.round(Math.random() * (rows.length - 1))]);
            };
            const advanceCoords = function () {
                $('#next_coord0').removeClass('nope');
                const lastElement = $coords.shift();
                $.each($coords, function (i, e) {
                    e.attr('id', 'next_coord' + i);
                });
                lastElement.attr('id', 'next_coord' + $coords.length);
                lastElement.text(newCoord($coords[$coords.length - 1].text()));
                $coords.push(lastElement);
            };
            const stop = function () {
                clearCoords();
                $trainer.removeClass('play');
                centerRight();
                $trainer.removeClass('wrong');
                ground.set({
                    events: {
                        select: false,
                    },
                });
                if (scoreUrl)
                    text(scoreUrl, {
                        method: 'post',
                        body: form({ color, score }),
                    })
                        .then(charts => {
                        $side.find('.scores').html(charts);
                        showCharts();
                    });
            };
            const tick = function () {
                const spent = Math.min(duration, new Date().getTime() - startAt);
                const left = ((duration - spent) / 1000).toFixed(1);
                if (+left < 10) {
                    $timer.addClass('hurry');
                }
                $timer.text(left);
                $bar.css('width', (100 * spent) / duration + '%');
                if (spent < duration)
                    setTimeout(tick, tickDelay);
                else
                    stop();
            };
            $start.on('click', () => {
                $explanation.remove();
                $trainer.addClass('play').removeClass('init');
                $timer.removeClass('hurry');
                ply = 2;
                ground.redrawAll();
                showColor();
                clearCoords();
                centerRight();
                score = 0;
                $score.text(score);
                $bar.css('width', 0);
                setTimeout(function () {
                    startAt = new Date();
                    ground.set({
                        events: {
                            select(key) {
                                const hit = key == $coords[0].text();
                                if (hit) {
                                    score++;
                                    $score.text(score);
                                    advanceCoords();
                                }
                                else {
                                    clearTimeout(wrongTimeout);
                                    $trainer.addClass('wrong');
                                    wrongTimeout = setTimeout(function () {
                                        $trainer.removeClass('wrong');
                                    }, 500);
                                }
                            },
                        },
                    });
                    $coords[0].text(newCoord('a1'));
                    let i;
                    for (i = 1; i < $coords.length; i++)
                        $coords[i].text(newCoord($coords[i - 1].text()));
                    tick();
                }, 1000);
            });
        });
    });

}());
