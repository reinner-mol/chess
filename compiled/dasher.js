var LichessDasher = (function () {
    'use strict';

    function createElement(tagName, options) {
        return document.createElement(tagName, options);
    }
    function createElementNS(namespaceURI, qualifiedName, options) {
        return document.createElementNS(namespaceURI, qualifiedName, options);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    const htmlDomApi = {
        createElement,
        createElementNS,
        createTextNode,
        createComment,
        insertBefore,
        removeChild,
        appendChild,
        parentNode,
        nextSibling,
        tagName,
        setTextContent,
        getTextContent,
        isElement,
        isText,
        isComment,
    };

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return typeof s === "string" || typeof s === "number";
    }

    function isUndef(s) {
        return s === undefined;
    }
    function isDef(s) {
        return s !== undefined;
    }
    const emptyNode = vnode("", {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        var _a, _b;
        const isSameKey = vnode1.key === vnode2.key;
        const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
        const isSameSel = vnode1.sel === vnode2.sel;
        return isSameSel && isSameKey && isSameIs;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var _a;
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
            if (key !== undefined) {
                map[key] = i;
            }
        }
        return map;
    }
    const hooks = [
        "create",
        "update",
        "remove",
        "destroy",
        "pre",
        "post",
    ];
    function init(modules, domApi) {
        let i;
        let j;
        const cbs = {
            create: [],
            update: [],
            remove: [],
            destroy: [],
            pre: [],
            post: [],
        };
        const api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                const hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            const id = elm.id ? "#" + elm.id : "";
            const c = elm.className ? "." + elm.className.split(" ").join(".") : "";
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    const parent = api.parentNode(childElm);
                    api.removeChild(parent, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var _a, _b;
            let i;
            let data = vnode.data;
            if (data !== undefined) {
                const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
                if (isDef(init)) {
                    init(vnode);
                    data = vnode.data;
                }
            }
            const children = vnode.children;
            const sel = vnode.sel;
            if (sel === "!") {
                if (isUndef(vnode.text)) {
                    vnode.text = "";
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                const hashIdx = sel.indexOf("#");
                const dotIdx = sel.indexOf(".", hashIdx);
                const hash = hashIdx > 0 ? hashIdx : sel.length;
                const dot = dotIdx > 0 ? dotIdx : sel.length;
                const tag = hashIdx !== -1 || dotIdx !== -1
                    ? sel.slice(0, Math.min(hash, dot))
                    : sel;
                const elm = (vnode.elm =
                    isDef(data) && isDef((i = data.ns))
                        ? api.createElementNS(i, tag, data)
                        : api.createElement(tag, data));
                if (hash < dot)
                    elm.setAttribute("id", sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        const ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                const hook = vnode.data.hook;
                if (isDef(hook)) {
                    (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                    if (hook.insert) {
                        insertedVnodeQueue.push(vnode);
                    }
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                const ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var _a, _b;
            const data = vnode.data;
            if (data !== undefined) {
                (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
                for (let i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (let j = 0; j < vnode.children.length; ++j) {
                        const child = vnode.children[j];
                        if (child != null && typeof child !== "string") {
                            invokeDestroyHook(child);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            var _a, _b;
            for (; startIdx <= endIdx; ++startIdx) {
                let listeners;
                let rm;
                const ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (let i = 0; i < cbs.remove.length; ++i)
                            cbs.remove[i](ch, rm);
                        const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                        if (isDef(removeHook)) {
                            removeHook(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        // Text node
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            let oldStartIdx = 0;
            let newStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newEndIdx = newCh.length - 1;
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            let oldKeyToIdx;
            let idxInOld;
            let elmToMove;
            let before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    // Vnode moved right
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    // Vnode moved left
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        // New element
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d, _e;
            const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
            (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
            const elm = (vnode.elm = oldVnode.elm);
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (let i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, "");
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
        }
        return function patch(oldVnode, vnode) {
            let i, elm, parent;
            const insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    function addNS(data, children, sel) {
        data.ns = "http://www.w3.org/2000/svg";
        if (sel !== "foreignObject" && children !== undefined) {
            for (let i = 0; i < children.length; ++i) {
                const childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        let data = {};
        let children;
        let text;
        let i;
        if (c !== undefined) {
            if (b !== null) {
                data = b;
            }
            if (array(c)) {
                children = c;
            }
            else if (primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined && b !== null) {
            if (array(b)) {
                children = b;
            }
            else if (primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === "s" &&
            sel[1] === "v" &&
            sel[2] === "g" &&
            (sel.length === 3 || sel[3] === "." || sel[3] === "#")) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    const xlinkNS = "http://www.w3.org/1999/xlink";
    const xmlNS = "http://www.w3.org/XML/1998/namespace";
    const colonChar = 58;
    const xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        let key;
        const elm = vnode.elm;
        let oldAttrs = oldVnode.data.attrs;
        let attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    const attributesModule = {
        create: updateAttrs,
        update: updateAttrs,
    };

    function updateClass(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldClass = oldVnode.data.class;
        let klass = vnode.data.class;
        if (!oldClass && !klass)
            return;
        if (oldClass === klass)
            return;
        oldClass = oldClass || {};
        klass = klass || {};
        for (name in oldClass) {
            if (oldClass[name] && !Object.prototype.hasOwnProperty.call(klass, name)) {
                // was `true` and now not provided
                elm.classList.remove(name);
            }
        }
        for (name in klass) {
            cur = klass[name];
            if (cur !== oldClass[name]) {
                elm.classList[cur ? "add" : "remove"](name);
            }
        }
    }
    const classModule = { create: updateClass, update: updateClass };

    function defined(v) {
        return typeof v !== 'undefined';
    }
    // like mithril prop but with type safety
    function prop(initialValue) {
        let value = initialValue;
        const fun = function (v) {
            if (typeof v !== 'undefined')
                value = v;
            return value;
        };
        return fun;
    }
    function bind(eventName, f, redraw = undefined) {
        return {
            insert: (vnode) => {
                vnode.elm.addEventListener(eventName, e => {
                    e.stopPropagation();
                    f(e);
                    if (redraw)
                        redraw();
                    return false;
                });
            },
        };
    }
    function header(name, close) {
        return h('a.head.text', {
            attrs: { 'data-icon': 'I' },
            hook: bind('click', close),
        }, name);
    }
    function spinner() {
        return h('div.spinner', [
            h('svg', { attrs: { viewBox: '0 0 40 40' } }, [
                h('circle', {
                    attrs: { cx: 20, cy: 20, r: 18, fill: 'none' },
                }),
            ]),
        ]);
    }

    function ctrl$6(trans, redraw) {
        const data = {
            ping: undefined,
            server: undefined,
        };
        const hub = lichess.pubsub;
        hub.emit('socket.send', 'moveLat', true);
        hub.on('socket.lag', lag => {
            data.ping = Math.round(lag);
            redraw();
        });
        hub.on('socket.in.mlat', lat => {
            data.server = lat;
            redraw();
        });
        return { data, trans };
    }
    function signalBars(d) {
        const lagRating = !d.ping ? 0 : d.ping < 150 ? 4 : d.ping < 300 ? 3 : d.ping < 500 ? 2 : 1;
        const bars = [];
        for (let i = 1; i <= 4; i++)
            bars.push(h(i <= lagRating ? 'i' : 'i.off'));
        return h('signal.q' + lagRating, bars);
    }
    function showMillis(m) {
        return ['' + Math.floor(m), h('small', '.' + Math.round((m - Math.floor(m)) * 10))];
    }
    function view$6(ctrl) {
        const d = ctrl.data;
        return h('a.status', { attrs: { href: '/lag' } }, [
            signalBars(d),
            h('span.ping', {
                attrs: { title: 'PING: ' + ctrl.trans.noarg('networkLagBetweenYouAndLichess') },
            }, [h('em', 'PING'), h('strong', defined(d.ping) ? '' + d.ping : '?'), h('em', 'ms')]),
            h('span.server', {
                attrs: { title: 'SERVER: ' + ctrl.trans.noarg('timeToProcessAMoveOnLichessServer') },
            }, [h('em', 'SERVER'), h('strong', defined(d.server) ? showMillis(d.server) : ['?']), h('em', 'ms')]),
        ]);
    }

    function ctrl$5(data, trans, close) {
        const accepted = new Set(data.accepted);
        return {
            list() {
                return [...data.list.filter(lang => accepted.has(lang[0])), ...data.list];
            },
            current: data.current,
            accepted,
            trans,
            close,
        };
    }
    function view$5(ctrl) {
        return h('div.sub.langs', [
            header(ctrl.trans.noarg('language'), ctrl.close),
            h('form', {
                attrs: { method: 'post', action: '/translation/select' },
            }, ctrl.list().map(langView(ctrl.current, ctrl.accepted))),
            h('a.help.text', {
                attrs: {
                    href: 'https://crowdin.com/project/lichess',
                    'data-icon': '',
                },
            }, 'Help translate Lichess'),
        ]);
    }
    function langView(current, accepted) {
        return (l) => h('button' + (current === l[0] ? '.current' : '') + (accepted.has(l[0]) ? '.accepted' : ''), {
            attrs: {
                type: 'submit',
                name: 'lang',
                value: l[0],
                title: l[0],
            },
        }, l[1]);
    }

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
    /* produce HTTP form data from a JS object */
    const form = (data) => {
        const formData = new FormData();
        for (const k of Object.keys(data))
            formData.append(k, data[k]);
        return formData;
    };

    function ctrl$4(raw, trans, redraw, close) {
        const list = raw.map(s => s.split(' '));
        const api = lichess.sound;
        const postSet = (set) => text('/pref/soundSet', {
            body: form({ set }),
            method: 'post',
        })
            .catch(() => lichess.announce({ msg: 'Failed to save sound preference' }));
        return {
            makeList() {
                var _a;
                const canSpeech = (_a = window.speechSynthesis) === null || _a === void 0 ? void 0 : _a.getVoices().length;
                return list.filter(s => s[0] != 'speech' || canSpeech);
            },
            api,
            set(k) {
                api.speech(k == 'speech');
                lichess.pubsub.emit('speech.enabled', api.speech());
                if (api.speech()) {
                    api.changeSet('standard');
                    postSet('standard');
                    api.say('Speech synthesis ready');
                }
                else {
                    api.changeSet(k);
                    api.play('genericNotify');
                    postSet(k);
                }
                redraw();
            },
            volume(v) {
                api.setVolume(v);
                // plays a move sound if speech is off
                api.sayOrPlay('move', 'knight F 7');
            },
            redraw,
            trans,
            close,
        };
    }
    function view$4(ctrl) {
        const current = ctrl.api.speech() ? 'speech' : ctrl.api.soundSet;
        return h('div.sub.sound.' + current, {
            hook: {
                insert() {
                    if (window.speechSynthesis)
                        window.speechSynthesis.onvoiceschanged = ctrl.redraw;
                },
            },
        }, [
            header(ctrl.trans('sound'), ctrl.close),
            h('div.content', [
                h('input', {
                    attrs: {
                        type: 'range',
                        min: 0,
                        max: 1,
                        step: 0.01,
                        value: ctrl.api.getVolume(),
                        orient: 'vertical',
                    },
                    hook: {
                        insert(vnode) {
                            const input = vnode.elm, setVolume = throttle(150, ctrl.volume);
                            $(input).on('input', () => setVolume(parseFloat(input.value)));
                        },
                    },
                }),
                h('div.selector', ctrl.makeList().map(soundView(ctrl, current))),
            ]),
        ]);
    }
    function soundView(ctrl, current) {
        return (s) => h('a.text', {
            hook: bind('click', () => ctrl.set(s[0])),
            class: { active: current === s[0] },
            attrs: { 'data-icon': 'E' },
        }, s[1]);
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

    function ctrl$3(data, trans, redraw, close) {
        const list = [
            { key: 'light', name: trans.noarg('light') },
            { key: 'dark', name: trans.noarg('dark') },
            { key: 'darkBoard', name: 'Dark Board', title: 'Like Dark, but chess boards are also darker' },
            { key: 'transp', name: trans.noarg('transparent') },
        ];
        const announceFail = () => lichess.announce({ msg: 'Failed to save background preference' });
        const reloadAllTheThings = () => {
            if (window.Highcharts)
                lichess.reload();
        };
        return {
            list,
            trans,
            get: () => data.current,
            set: throttle(700, (c) => {
                data.current = c;
                text('/pref/bg', {
                    body: form({ bg: c }),
                    method: 'post',
                })
                    .then(reloadAllTheThings, announceFail);
                applyBackground(data, list);
                redraw();
            }),
            getImage: () => data.image,
            setImage(i) {
                data.image = i;
                text('/pref/bgImg', {
                    body: form({ bgImg: i }),
                    method: 'post',
                })
                    .then(reloadAllTheThings, announceFail);
                applyBackground(data, list);
                redraw();
            },
            close,
        };
    }
    function view$3(ctrl) {
        const cur = ctrl.get();
        return h('div.sub.background', [
            header(ctrl.trans.noarg('background'), ctrl.close),
            h('div.selector.large', ctrl.list.map(bg => {
                return h('a.text', {
                    class: { active: cur === bg.key },
                    attrs: { 'data-icon': 'E', title: bg.title || '' },
                    hook: bind('click', () => ctrl.set(bg.key)),
                }, bg.name);
            })),
            cur === 'transp' ? imageInput(ctrl) : null,
        ]);
    }
    function imageInput(ctrl) {
        return h('div.image', [
            h('p', ctrl.trans.noarg('backgroundImageUrl')),
            h('input', {
                attrs: {
                    type: 'text',
                    placeholder: 'https://',
                    value: ctrl.getImage(),
                },
                hook: {
                    insert: vnode => {
                        $(vnode.elm).on('change keyup paste', debounce(function () {
                            const url = this.value.trim();
                            // modules/pref/src/main/PrefForm.scala
                            if ((url.startsWith('https://') || url.startsWith('//')) && url.length >= 10 && url.length <= 400)
                                ctrl.setImage(url);
                        }, 300));
                    },
                },
            }),
        ]);
    }
    function applyBackground(data, list) {
        const key = data.current;
        const cls = key == 'transp' ? 'dark transp' : key == 'darkBoard' ? 'dark dark-board' : key;
        $('body')
            .removeClass([...list.map(b => b.key), 'dark-board'].join(' '))
            .addClass(cls);
        const prev = $('body').data('theme'), sheet = key == 'darkBoard' ? 'dark' : key;
        $('body').data('theme', sheet);
        $('link[href*=".' + prev + '."]').each(function () {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.href.replace('.' + prev + '.', '.' + sheet + '.');
            link.onload = () => setTimeout(() => this.remove(), 100);
            document.head.appendChild(link);
        });
        if (key === 'transp') {
            const bgData = document.getElementById('bg-data');
            bgData
                ? (bgData.innerHTML = 'body.transp::before{background-image:url(' + data.image + ');}')
                : $('head').append('<style id="bg-data">body.transp::before{background-image:url(' + data.image + ');}</style>');
        }
    }

    function ctrl$2(data, trans, redraw, close) {
        const readZoom = () => parseInt(getComputedStyle(document.body).getPropertyValue('--zoom')) + 100;
        const saveZoom = debounce(() => text('/pref/zoom?v=' + readZoom(), { method: 'post' })
            .catch(() => lichess.announce({ msg: 'Failed to save zoom' })), 1000);
        return {
            data,
            trans,
            setIs3d(v) {
                data.is3d = v;
                text('/pref/is3d', {
                    body: form({ is3d: v }),
                    method: 'post',
                })
                    .then(lichess.reload, _ => lichess.announce({ msg: 'Failed to save geometry  preference' }));
                redraw();
            },
            readZoom,
            setZoom(v) {
                document.body.setAttribute('style', '--zoom:' + (v - 100));
                window.dispatchEvent(new Event('resize'));
                redraw();
                saveZoom();
            },
            close,
        };
    }
    function view$2(ctrl) {
        const domZoom = ctrl.readZoom();
        return h('div.sub.board', [
            header(ctrl.trans.noarg('boardGeometry'), ctrl.close),
            h('div.selector.large', [
                h('a.text', {
                    class: { active: !ctrl.data.is3d },
                    attrs: { 'data-icon': 'E' },
                    hook: bind('click', () => ctrl.setIs3d(false)),
                }, '2D'),
                h('a.text', {
                    class: { active: ctrl.data.is3d },
                    attrs: { 'data-icon': 'E' },
                    hook: bind('click', () => ctrl.setIs3d(true)),
                }, '3D'),
            ]),
            h('div.zoom', isNaN(domZoom)
                ? [h('p', 'No board to zoom here!')]
                : [
                    h('p', [ctrl.trans.noarg('boardSize'), ': ', domZoom - 100, '%']),
                    h('input.range', {
                        attrs: {
                            type: 'range',
                            min: 100,
                            max: 200,
                            step: 1,
                            value: ctrl.readZoom(),
                        },
                        hook: {
                            insert(vnode) {
                                const input = vnode.elm;
                                $(input).on('input', () => ctrl.setZoom(parseInt(input.value)));
                            },
                        },
                    }),
                ]),
        ]);
    }

    const changeColorHandle = () => {
        const dict = {
            blue: '#DEE3E6 #788a94',
            blue2: '#97b2c7 #546f82',
            blue3: '#d9e0e6 #315991',
            canvas: '#d7daeb #547388',
            wood: '#d8a45b #9b4d0f',
            wood2: '#a38b5d #6c5017',
            wood3: '#d0ceca #755839',
            wood4: '#caaf7d #7b5330',
            maple: '#e8ceab #bc7944',
            maple2: '#E2C89F #996633',
            leather: '#d1d1c9 #c28e16',
            green: '#FFFFDD #6d8753',
            brown: '#F0D9B5 #946f51',
            pink: '#E8E9B7 #ED7272',
            marble: '#93ab91 #4f644e',
            'blue-marble': '#EAE6DD #7C7F87',
            'green-plastic': '#f2f9bb #59935d',
            grey: '#b8b8b8 #7d7d7d',
            metal: '#c9c9c9 #727272',
            olive: '#b8b19f #6d6655',
            newspaper: '#fff #8d8d8d',
            purple: '#9f90b0 #7d4a8d',
            'purple-diag': '#E5DAF0 #957AB0',
            ic: '#ececec #c1c18e',
            horsey: '#F0D9B5 #946f51',
        };
        for (const theme of document.body.className.split(' ')) {
            if (theme in dict) {
                const style = document.documentElement.style, colors = dict[theme].split(' ');
                style.setProperty('--cg-coord-color-white', colors[0]);
                style.setProperty('--cg-coord-color-black', colors[1]);
                style.setProperty('--cg-coord-shadow', 'none');
            }
        }
    };

    function ctrl$1(data, trans, dimension, redraw, open) {
        function dimensionData() {
            return data[dimension()];
        }
        return {
            dimension,
            trans,
            data: dimensionData,
            set(t) {
                const d = dimensionData();
                d.current = t;
                applyTheme(t, d.list);
                text('/pref/theme' + (dimension() === 'd3' ? '3d' : ''), {
                    body: form({ theme: t }),
                    method: 'post',
                })
                    .catch(() => lichess.announce({ msg: 'Failed to save theme preference' }));
                redraw();
            },
            open,
        };
    }
    function view$1(ctrl) {
        const d = ctrl.data();
        return h('div.sub.theme.' + ctrl.dimension(), [
            header(ctrl.trans.noarg('boardTheme'), () => ctrl.open('links')),
            h('div.list', d.list.map(themeView(d.current, ctrl.set))),
        ]);
    }
    function themeView(current, set) {
        return (t) => h('a', {
            hook: bind('click', () => set(t)),
            attrs: { title: t },
            class: { active: current === t },
        }, [h('span.' + t)]);
    }
    function applyTheme(t, list) {
        $('body').removeClass(list.join(' ')).addClass(t);
        changeColorHandle();
    }

    function ctrl(data, trans, dimension, redraw, open) {
        function dimensionData() {
            return data[dimension()];
        }
        return {
            dimension,
            trans,
            data: dimensionData,
            set(t) {
                const d = dimensionData();
                d.current = t;
                applyPiece(t, d.list, dimension() === 'd3');
                text('/pref/pieceSet' + (dimension() === 'd3' ? '3d' : ''), {
                    body: form({ set: t }),
                    method: 'post',
                })
                    .catch(() => lichess.announce({ msg: 'Failed to save piece set  preference' }));
                redraw();
            },
            open,
        };
    }
    function view(ctrl) {
        const d = ctrl.data();
        return h('div.sub.piece.' + ctrl.dimension(), [
            header(ctrl.trans.noarg('pieceSet'), () => ctrl.open('links')),
            h('div.list', d.list.map(pieceView(d.current, ctrl.set, ctrl.dimension() == 'd3'))),
        ]);
    }
    function pieceImage(t, is3d) {
        if (is3d) {
            const preview = t == 'Staunton' ? '-Preview' : '';
            return `images/staunton/piece/${t}/White-Knight${preview}.png`;
        }
        return `piece/${t}/wN.svg`;
    }
    function pieceView(current, set, is3d) {
        return (t) => h('a.no-square', {
            attrs: { title: t },
            hook: bind('click', () => set(t)),
            class: { active: current === t },
        }, [
            h('piece', {
                attrs: { style: `background-image:url(${lichess.assetUrl(pieceImage(t, is3d))})` },
            }),
        ]);
    }
    function applyPiece(t, list, is3d) {
        if (is3d) {
            $('body').removeClass(list.join(' ')).addClass(t);
        }
        else {
            const sprite = document.getElementById('piece-sprite');
            sprite.href = sprite.href.replace(/\w+\.css/, t + '.css');
        }
    }

    const defaultMode = 'links';
    function makeCtrl(opts, data, redraw) {
        const trans = lichess.trans(data.i18n);
        const mode = prop(defaultMode);
        function setMode(m) {
            mode(m);
            redraw();
        }
        function close() {
            setMode(defaultMode);
        }
        const ping = ctrl$6(trans, redraw);
        const subs = {
            langs: ctrl$5(data.lang, trans, close),
            sound: ctrl$4(data.sound.list, trans, redraw, close),
            background: ctrl$3(data.background, trans, redraw, close),
            board: ctrl$2(data.board, trans, redraw, close),
            theme: ctrl$1(data.theme, trans, () => (data.board.is3d ? 'd3' : 'd2'), redraw, setMode),
            piece: ctrl(data.piece, trans, () => (data.board.is3d ? 'd3' : 'd2'), redraw, setMode),
        };
        lichess.pubsub.on('top.toggle.user_tag', () => setMode(defaultMode));
        return {
            mode,
            setMode,
            data,
            trans,
            ping,
            subs,
            opts,
        };
    }

    function links (ctrl) {
        const d = ctrl.data, trans = ctrl.trans, noarg = trans.noarg;
        function userLinks() {
            return d.user
                ? h('div.links', [
                    h('a.user-link.online.text.is-green', linkCfg(`/@/${d.user.name}`, d.user.patron ? '' : ''), noarg('profile')),
                    h('a.text', linkCfg('/inbox', 'e'), noarg('inbox')),
                    h('a.text', linkCfg('/account/preferences/game-display', '%', ctrl.opts.playing ? { target: '_blank', rel: 'noopener' } : undefined), noarg('preferences')),
                    !d.coach ? null : h('a.text', linkCfg('/coach/edit', ':'), 'Coach manager'),
                    !d.streamer ? null : h('a.text', linkCfg('/streamer/edit', ''), 'Streamer manager'),
                    h('form.logout', {
                        attrs: { method: 'post', action: '/logout' },
                    }, [
                        h('button.text', {
                            attrs: {
                                type: 'submit',
                                'data-icon': 'w',
                            },
                        }, noarg('logOut')),
                    ]),
                ])
                : null;
        }
        const langs = h('a.sub', modeCfg(ctrl, 'langs'), noarg('language'));
        const sound = h('a.sub', modeCfg(ctrl, 'sound'), noarg('sound'));
        const background = h('a.sub', modeCfg(ctrl, 'background'), noarg('background'));
        const board = h('a.sub', modeCfg(ctrl, 'board'), noarg('boardGeometry'));
        const theme = h('a.sub', modeCfg(ctrl, 'theme'), noarg('boardTheme'));
        const piece = h('a.sub', modeCfg(ctrl, 'piece'), noarg('pieceSet'));
        const zenToggle = ctrl.opts.playing
            ? h('div.zen.selector', [
                h('a.text', {
                    attrs: {
                        'data-icon': 'K',
                        title: 'Keyboard: z',
                    },
                    hook: bind('click', () => lichess.pubsub.emit('zen')),
                }, noarg('zenMode')),
            ])
            : null;
        return h('div', [
            userLinks(),
            h('div.subs', [langs, sound, background, board, theme, piece, zenToggle]),
            view$6(ctrl.ping),
        ]);
    }
    const linkCfg = (href, icon, more) => ({
        attrs: Object.assign({ href, 'data-icon': icon }, (more || {})),
    });
    function modeCfg(ctrl, m) {
        return {
            hook: bind('click', () => ctrl.setMode(m)),
            attrs: { 'data-icon': 'H' },
        };
    }

    function loading() {
        return h('div#dasher_app.dropdown', h('div.initiating', spinner()));
    }
    function loaded(ctrl) {
        let content;
        switch (ctrl.mode()) {
            case 'langs':
                content = view$5(ctrl.subs.langs);
                break;
            case 'sound':
                content = view$4(ctrl.subs.sound);
                break;
            case 'background':
                content = view$3(ctrl.subs.background);
                break;
            case 'board':
                content = view$2(ctrl.subs.board);
                break;
            case 'theme':
                content = view$1(ctrl.subs.theme);
                break;
            case 'piece':
                content = view(ctrl.subs.piece);
                break;
            default:
                content = links(ctrl);
        }
        return h('div#dasher_app.dropdown', content);
    }

    const patch = init([classModule, attributesModule]);
    function LichessDasher(element, opts) {
        let vnode, ctrl;
        const redraw = () => {
            vnode = patch(vnode || element, ctrl ? loaded(ctrl) : loading());
        };
        redraw();
        return json('/dasher').then(data => {
            ctrl = makeCtrl(opts, data, redraw);
            redraw();
            return ctrl;
        });
    }

    return LichessDasher;

}());
