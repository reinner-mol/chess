var LichessSimul = (function (exports) {
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
    function init$1(modules, domApi) {
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

    function copyToThunk(vnode, thunk) {
        vnode.data.fn = thunk.data.fn;
        vnode.data.args = thunk.data.args;
        thunk.data = vnode.data;
        thunk.children = vnode.children;
        thunk.text = vnode.text;
        thunk.elm = vnode.elm;
    }
    function init(thunk) {
        const cur = thunk.data;
        const vnode = cur.fn(...cur.args);
        copyToThunk(vnode, thunk);
    }
    function prepatch(oldVnode, thunk) {
        let i;
        const old = oldVnode.data;
        const cur = thunk.data;
        const oldArgs = old.args;
        const args = cur.args;
        if (old.fn !== cur.fn || oldArgs.length !== args.length) {
            copyToThunk(cur.fn(...args), thunk);
            return;
        }
        for (i = 0; i < args.length; ++i) {
            if (oldArgs[i] !== args[i]) {
                copyToThunk(cur.fn(...args), thunk);
                return;
            }
        }
        copyToThunk(oldVnode, thunk);
    }
    const thunk = function thunk(sel, key, fn, args) {
        if (args === undefined) {
            args = fn;
            fn = key;
            key = undefined;
        }
        return h(sel, {
            key: key,
            hook: { init, prepatch },
            fn: fn,
            args: args,
        });
    };

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

    function makeSocket(send, ctrl) {
        const handlers = {
            reload(data) {
                ctrl.reload(data);
                ctrl.redraw();
            },
            aborted: lichess.reload,
            hostGame(gameId) {
                ctrl.data.host.gameId = gameId;
                ctrl.redraw();
            },
        };
        return {
            send,
            receive(tpe, data) {
                if (handlers[tpe])
                    return handlers[tpe](data);
                return false;
            },
        };
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

    const defined = (v) => typeof v !== 'undefined';
    // like mithril prop but with type safety
    const prop = (initialValue) => {
        let value = initialValue;
        const fun = function (v) {
            if (defined(v))
                value = v;
            return value;
        };
        return fun;
    };

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

    // when the simul no longer exists
    const onFail = () => lichess.reload();
    const post = (action) => (id) => json(`/simul/${id}/${action}`, { method: 'post' }).catch(onFail);
    var xhr = {
        ping: post('host-ping'),
        start: post('start'),
        abort: post('abort'),
        join: throttle(4000, (id, variant) => post(`join/${variant}`)(id)),
        withdraw: post('withdraw'),
        accept: (user) => post(`accept/${user}`),
        reject: (user) => post(`reject/${user}`),
    };

    class SimulCtrl {
        constructor(opts, redraw) {
            this.opts = opts;
            this.redraw = redraw;
            this.setupCreatedHost = () => {
                lichess.storage.set('lichess.move_on', '1'); // hideous hack :D
                let hostIsAround = true;
                lichess.idleTimer(15 * 60 * 1000, () => {
                    hostIsAround = false;
                }, () => {
                    hostIsAround = true;
                });
                setInterval(() => {
                    if (this.data.isCreated && hostIsAround)
                        xhr.ping(this.data.id);
                }, 10 * 1000);
            };
            this.reload = (data) => {
                this.data = Object.assign(Object.assign({}, data), { team: this.data.team });
            };
            this.teamBlock = () => !!this.data.team && !this.data.team.isIn;
            this.createdByMe = () => this.opts.userId === this.data.host.id;
            this.candidates = () => this.data.applicants.filter(a => !a.accepted);
            this.accepted = () => this.data.applicants.filter(a => a.accepted);
            this.acceptedContainsMe = () => this.accepted().some(a => a.player.id === this.opts.userId);
            this.applicantsContainsMe = () => this.candidates().some(a => a.player.id === this.opts.userId);
            this.containsMe = () => this.opts.userId && (this.applicantsContainsMe() || this.acceptedContainsMe() || this.pairingsContainMe());
            this.pairingsContainMe = () => this.data.pairings.some(a => a.player.id === this.opts.userId);
            this.data = opts.data;
            this.trans = lichess.trans(opts.i18n);
            this.socket = makeSocket(opts.socketSend, this);
            if (this.createdByMe() && this.data.isCreated)
                this.setupCreatedHost();
        }
    }

    function userLink(u, title) {
        const trunc = u.substring(0, 14);
        return h('a', {
            // can't be inlined because of thunks
            class: {
                'user-link': true,
                ulpt: true,
            },
            attrs: {
                href: '/@/' + u,
            },
        }, title && title != 'BOT' ? [h('span.utitle', title), trunc] : [trunc]);
    }
    function bind$1(eventName, f) {
        return {
            insert(vnode) {
                vnode.elm.addEventListener(eventName, f);
            },
        };
    }

    const groups = {
        start: ['hi/Hello', 'gl/Good luck', 'hf/Have fun!', 'u2/You too!'].map(splitIt),
        end: ['gg/Good game', 'wp/Well played', 'ty/Thank you', "gtg/I've got to go", 'bye/Bye!'].map(splitIt),
    };
    function presetCtrl(opts) {
        let group = opts.initialGroup;
        let said = [];
        return {
            group: () => group,
            said: () => said,
            setGroup(p) {
                if (p !== group) {
                    group = p;
                    if (!p)
                        said = [];
                    opts.redraw();
                }
            },
            post(preset) {
                if (!group)
                    return;
                const sets = groups[group];
                if (!sets)
                    return;
                if (said.includes(preset.key))
                    return;
                if (opts.post(preset.text))
                    said.push(preset.key);
            },
        };
    }
    function presetView(ctrl) {
        const group = ctrl.group();
        if (!group)
            return;
        const sets = groups[group];
        const said = ctrl.said();
        return sets && said.length < 2
            ? h('div.mchat__presets', sets.map((p) => {
                const disabled = said.includes(p.key);
                return h('span', {
                    class: {
                        disabled,
                    },
                    attrs: {
                        title: p.text,
                        disabled,
                    },
                    hook: bind$1('click', () => {
                        !disabled && ctrl.post(p);
                    }),
                }, p.key);
            }))
            : undefined;
    }
    function splitIt(s) {
        const parts = s.split('/');
        return {
            key: parts[0],
            text: parts[1],
        };
    }

    const userModInfo = (username) => json('/mod/chat-user/' + username);
    const flag = (resource, username, text) => json('/report/flag', {
        method: 'post',
        body: form({ username, resource, text }),
    });
    const getNote = (id) => text(noteUrl(id));
    const setNote = (id, text) => json(noteUrl(id), {
        method: 'post',
        body: form({ text }),
    });
    const noteUrl = (id) => `/${id}/note`;

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

    function noteCtrl(opts) {
        let text = opts.text;
        const doPost = debounce(() => {
            setNote(opts.id, text || '');
        }, 1000);
        return {
            id: opts.id,
            trans: opts.trans,
            text: () => text,
            fetch() {
                getNote(opts.id).then(t => {
                    text = t || '';
                    opts.redraw();
                });
            },
            post(t) {
                text = t;
                doPost();
            },
        };
    }
    function noteView(ctrl) {
        const text = ctrl.text();
        if (text == undefined)
            return h('div.loading', {
                hook: {
                    insert: ctrl.fetch,
                },
            });
        return h('textarea', {
            attrs: {
                placeholder: ctrl.trans('typePrivateNotesHere'),
            },
            hook: {
                insert(vnode) {
                    const $el = $(vnode.elm);
                    $el.val(text).on('change keyup paste', () => ctrl.post($el.val()));
                },
            },
        });
    }

    let numberFormatter = false;
    const numberFormat = (n) => {
        if (numberFormatter === false)
            numberFormatter = window.Intl && Intl.NumberFormat ? new Intl.NumberFormat() : null;
        if (numberFormatter === null)
            return '' + n;
        return numberFormatter.format(n);
    };

    function moderationCtrl(opts) {
        let data;
        let loading = false;
        const open = (line) => {
            const userA = line.querySelector('a.user-link');
            const text = line.querySelector('t').innerText;
            const username = userA.href.split('/')[4];
            if (opts.permissions.timeout) {
                loading = true;
                userModInfo(username).then(d => {
                    data = Object.assign(Object.assign({}, d), { text });
                    loading = false;
                    opts.redraw();
                });
            }
            else {
                data = {
                    id: username.toLowerCase(),
                    username,
                    text,
                };
            }
            opts.redraw();
        };
        const close = () => {
            data = undefined;
            loading = false;
            opts.redraw();
        };
        return {
            loading: () => loading,
            data: () => data,
            reasons: opts.reasons,
            permissions: () => opts.permissions,
            open,
            close,
            timeout(reason, text) {
                data &&
                    lichess.pubsub.emit('socket.send', 'timeout', {
                        userId: data.id,
                        reason: reason.key,
                        text,
                    });
                close();
                opts.redraw();
            },
        };
    }
    const lineAction = () => h('i.mod', { attrs: { 'data-icon': '' } });
    function moderationView(ctrl) {
        if (!ctrl)
            return;
        if (ctrl.loading())
            return [h('div.loading')];
        const data = ctrl.data();
        if (!data)
            return;
        const perms = ctrl.permissions();
        const infos = data.history
            ? h('div.infos.block', [
                numberFormat(data.games || 0) + ' games',
                data.troll ? 'TROLL' : undefined,
                data.engine ? 'ENGINE' : undefined,
                data.booster ? 'BOOSTER' : undefined,
            ]
                .map(t => t && h('span', t))
                .concat([
                h('a', {
                    attrs: {
                        href: '/@/' + data.username + '?mod',
                    },
                }, 'profile'),
            ])
                .concat(perms.shadowban
                ? [
                    h('a', {
                        attrs: {
                            href: '/mod/' + data.username + '/communication',
                        },
                    }, 'coms'),
                ]
                : []))
            : undefined;
        const timeout = perms.timeout
            ? h('div.timeout.block', [
                h('strong', 'Timeout 15 minutes for'),
                ...ctrl.reasons.map(r => {
                    return h('a.text', {
                        attrs: { 'data-icon': 'p' },
                        hook: bind$1('click', () => ctrl.timeout(r, data.text)),
                    }, r.name);
                }),
            ])
            : h('div.timeout.block', [
                h('strong', 'Moderation'),
                h('a.text', {
                    attrs: { 'data-icon': 'p' },
                    hook: bind$1('click', () => ctrl.timeout(ctrl.reasons[0], data.text)),
                }, 'Timeout 15 minutes'),
            ]);
        const history = data.history
            ? h('div.history.block', [
                h('strong', 'Timeout history'),
                h('table', h('tbody.slist', {
                    hook: {
                        insert() {
                            lichess.contentLoaded();
                        },
                    },
                }, data.history.map(function (e) {
                    return h('tr', [
                        h('td.reason', e.reason),
                        h('td.mod', e.mod),
                        h('td', h('time.timeago', {
                            attrs: { datetime: e.date },
                        })),
                    ]);
                }))),
            ])
            : undefined;
        return [
            h('div.top', { key: 'mod-' + data.id }, [
                h('span.text', {
                    attrs: { 'data-icon': '' },
                }, [userLink(data.username)]),
                h('a', {
                    attrs: { 'data-icon': 'L' },
                    hook: bind$1('click', ctrl.close),
                }),
            ]),
            h('div.mchat__content.moderation', [h('i.line-text.block', ['"', data.text, '"']), infos, timeout, history]),
        ];
    }

    function makeCtrl (opts, redraw) {
        const data = opts.data;
        data.domVersion = 1; // increment to force redraw
        const maxLines = 200;
        const maxLinesDrop = 50; // how many lines to drop at once
        const palantir = {
            instance: undefined,
            loaded: false,
            enabled: prop(!!data.palantir),
        };
        const allTabs = ['discussion'];
        if (opts.noteId)
            allTabs.push('note');
        if (opts.plugin)
            allTabs.push(opts.plugin.tab.key);
        const tabStorage = lichess.storage.make('chat.tab'), storedTab = tabStorage.get();
        let moderation;
        const vm = {
            tab: allTabs.find(tab => tab === storedTab) || allTabs[0],
            enabled: opts.alwaysEnabled || !lichess.storage.get('nochat'),
            placeholderKey: 'talkInChat',
            loading: false,
            timeout: opts.timeout,
            writeable: opts.writeable,
        };
        /* If discussion is disabled, and we have another chat tab,
         * then select that tab over discussion */
        if (allTabs.length > 1 && vm.tab === 'discussion' && lichess.storage.get('nochat'))
            vm.tab = allTabs[1];
        const post = (text) => {
            text = text.trim();
            if (!text)
                return false;
            if (text == 'You too!' && !data.lines.some(l => l.u != data.userId))
                return false;
            if (text.length > 140) {
                alert('Max length: 140 chars. ' + text.length + ' chars used.');
                return false;
            }
            lichess.pubsub.emit('socket.send', 'talk', text);
            return true;
        };
        const onTimeout = (userId) => {
            let change = false;
            data.lines.forEach(l => {
                if (l.u && l.u.toLowerCase() == userId) {
                    l.d = true;
                    change = true;
                }
            });
            if (userId == data.userId)
                vm.timeout = change = true;
            if (change) {
                data.domVersion++;
                redraw();
            }
        };
        const onReinstate = (userId) => {
            if (userId == data.userId) {
                vm.timeout = false;
                redraw();
            }
        };
        const onMessage = (line) => {
            data.lines.push(line);
            const nb = data.lines.length;
            if (nb > maxLines) {
                data.lines.splice(0, nb - maxLines + maxLinesDrop);
                data.domVersion++;
            }
            redraw();
        };
        const onWriteable = (v) => {
            vm.writeable = v;
            redraw();
        };
        const onPermissions = (obj) => {
            let p;
            for (p in obj)
                opts.permissions[p] = obj[p];
            instanciateModeration();
            redraw();
        };
        const trans = lichess.trans(opts.i18n);
        function instanciateModeration() {
            if (opts.permissions.timeout || opts.permissions.local) {
                moderation = moderationCtrl({
                    reasons: opts.timeoutReasons || [{ key: 'other', name: 'Inappropriate behavior' }],
                    permissions: opts.permissions,
                    redraw,
                });
                opts.loadCss('chat.mod');
            }
        }
        instanciateModeration();
        const note = opts.noteId
            ? noteCtrl({
                id: opts.noteId,
                text: opts.noteText,
                trans,
                redraw,
            })
            : undefined;
        const preset = presetCtrl({
            initialGroup: opts.preset,
            post,
            redraw,
        });
        const subs = [
            ['socket.in.message', onMessage],
            ['socket.in.chat_timeout', onTimeout],
            ['socket.in.chat_reinstate', onReinstate],
            ['chat.writeable', onWriteable],
            ['chat.permissions', onPermissions],
            ['palantir.toggle', palantir.enabled],
        ];
        subs.forEach(([eventName, callback]) => lichess.pubsub.on(eventName, callback));
        const destroy = () => {
            subs.forEach(([eventName, callback]) => lichess.pubsub.off(eventName, callback));
        };
        const emitEnabled = () => lichess.pubsub.emit('chat.enabled', vm.enabled);
        emitEnabled();
        return {
            data,
            opts,
            vm,
            allTabs,
            setTab(t) {
                vm.tab = t;
                tabStorage.set(t);
                // It's a lame way to do it. Give me a break.
                if (t === 'discussion')
                    lichess.requestIdleCallback(() => $('.mchat__say').each(function () {
                        this.focus();
                    }), 500);
                redraw();
            },
            moderation: () => moderation,
            note,
            preset,
            post,
            trans,
            plugin: opts.plugin,
            setEnabled(v) {
                vm.enabled = v;
                emitEnabled();
                if (!v)
                    lichess.storage.set('nochat', '1');
                else
                    lichess.storage.remove('nochat');
                redraw();
            },
            redraw,
            palantir,
            destroy,
        };
    }

    // from https://github.com/bryanwoods/autolink-js/blob/master/autolink.js
    const linkRegex = /(^|[\s\n]|<[A-Za-z]*\/?>)((?:(?:https?|ftp):\/\/|lichess\.org)[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi;
    const newLineRegex = /\n/g;
    const userPattern = /(^|[^\w@#/])@([a-z0-9][a-z0-9_-]{0,28}[a-z0-9])/gi;
    // looks like it has a @mention or #gameid or a url.tld
    function isMoreThanText(str) {
        return /(\n|(@|#|\.)\w{2,})/.test(str);
    }
    function toLink(url) {
        return `<a target="_blank" rel="nofollow noopener noreferrer" href="${url}">${url.replace(/https?:\/\//, '')}</a>`;
    }
    function autolink(str, callback) {
        return str.replace(linkRegex, (_, space, url) => space + callback(url));
    }
    function innerHTML(a, toHtml) {
        return {
            insert(vnode) {
                vnode.elm.innerHTML = toHtml(a);
                vnode.data.cachedA = a;
            },
            postpatch(old, vnode) {
                if (old.data.cachedA !== a) {
                    vnode.elm.innerHTML = toHtml(a);
                }
                vnode.data.cachedA = a;
            },
        };
    }
    function linkReplace(href, body, cls) {
        if (href.includes('&quot;'))
            return href;
        return `<a target="_blank" rel="noopener nofollow noreferrer" href="${href.startsWith('/') || href.includes('://') ? href : '//' + href}"${cls ? ` class="${cls}"` : ''}>${body ? body : href}</a>`;
    }
    function userLinkReplace(_, prefix, user) {
        return prefix + linkReplace('/@/' + user, '@' + user);
    }
    function enrichText(text, allowNewlines = true) {
        let html = autolink(lichess.escapeHtml(text), toLink);
        if (allowNewlines)
            html = html.replace(newLineRegex, '<br>');
        return html;
    }
    function richHTML(text, newLines = true) {
        return innerHTML(text, t => enrichText(t, newLines));
    }
    const linkPattern = /\b\b(?:https?:\/\/)?(lichess\.org\/[-–—\w+&'@#\/%?=()~|!:,.;]+[\w+&@#\/%=~|])/gi;
    const pawnDropPattern = /^[a-h][2-7]$/;
    const movePattern = /\b(\d+)\s*(\.+)\s*(?:[o0-]+[o0]|[NBRQKP\u2654\u2655\u2656\u2657\u2658\u2659]?[a-h]?[1-8]?[x@]?[a-z][1-8](?:=[NBRQK\u2654\u2655\u2656\u2657\u2658\u2659])?)\+?#?[!\?=]{0,5}/gi;
    function moveReplacer(match, turn, dots) {
        if (turn < 1 || turn > 200)
            return match;
        const ply = turn * 2 - (dots.length > 1 ? 0 : 1);
        return '<a class="jump" data-ply="' + ply + '">' + match + '</a>';
    }
    function addPlies(html) {
        return html.replace(movePattern, moveReplacer);
    }
    function userLinkReplacePawn(orig, prefix, user) {
        if (user.match(pawnDropPattern))
            return orig;
        return userLinkReplace(orig, prefix, user);
    }
    function enhance(text, parseMoves) {
        const escaped = lichess.escapeHtml(text);
        const linked = escaped.replace(userPattern, userLinkReplacePawn).replace(linkPattern, linkReplace);
        const plied = parseMoves && linked === escaped ? addPlies(linked) : linked;
        return plied;
    }

    const skip = (txt) => (suspLink(txt) || followMe(txt)) && !isKnownSpammer();
    const selfReport = (txt) => {
        if (isKnownSpammer())
            return;
        const hasSuspLink = suspLink(txt);
        if (hasSuspLink)
            text(`/jslog/${window.location.href.substr(-12)}?n=spam`, { method: 'post' });
        if (hasSuspLink || followMe(txt))
            lichess.storage.set('chat-spam', '1');
    };
    const isKnownSpammer = () => lichess.storage.get('chat-spam') == '1';
    const spamRegex = new RegExp([
        'xcamweb.com',
        '(^|[^i])chess-bot',
        'chess-cheat',
        'coolteenbitch',
        'letcafa.webcam',
        'tinyurl.com/',
        'wooga.info/',
        'bit.ly/',
        'wbt.link/',
        'eb.by/',
        '001.rs/',
        'shr.name/',
        'u.to/',
        '.3-a.net',
        '.ssl443.org',
        '.ns02.us',
        '.myftp.info',
        '.flinkup.com',
        '.serveusers.com',
        'badoogirls.com',
        'hide.su',
        'wyon.de',
        'sexdatingcz.club',
        'qps.ru',
        'tiny.cc/',
    ]
        .map(url => url.replace(/\./g, '\\.').replace(/\//g, '\\/'))
        .join('|'));
    const suspLink = (txt) => !!txt.match(spamRegex);
    const followMeRegex = /follow me|join my team/i;
    const followMe = (txt) => !!txt.match(followMeRegex);
    const teamUrlRegex = /lichess\.org\/team\//i;
    const hasTeamUrl = (txt) => !!txt.match(teamUrlRegex);

    const whisperRegex = /^\/[wW](?:hisper)?\s/;
    function discussionView (ctrl) {
        if (!ctrl.vm.enabled)
            return [];
        const scrollCb = (vnode) => {
            const el = vnode.elm;
            if (ctrl.data.lines.length > 5) {
                const autoScroll = el.scrollTop === 0 || el.scrollTop > el.scrollHeight - el.clientHeight - 100;
                if (autoScroll) {
                    el.scrollTop = 999999;
                    setTimeout((_) => (el.scrollTop = 999999), 300);
                }
            }
        }, hasMod = !!ctrl.moderation();
        const vnodes = [
            h('ol.mchat__messages.chat-v-' + ctrl.data.domVersion, {
                attrs: {
                    role: 'log',
                    'aria-live': 'polite',
                    'aria-atomic': 'false',
                },
                hook: {
                    insert(vnode) {
                        const $el = $(vnode.elm).on('click', 'a.jump', (e) => {
                            lichess.pubsub.emit('jump', e.target.getAttribute('data-ply'));
                        });
                        if (hasMod)
                            $el.on('click', '.mod', (e) => { var _a; return (_a = ctrl.moderation()) === null || _a === void 0 ? void 0 : _a.open(e.target.parentNode); });
                        else
                            $el.on('click', '.flag', (e) => report(ctrl, e.target.parentNode));
                        scrollCb(vnode);
                    },
                    postpatch: (_, vnode) => scrollCb(vnode),
                },
            }, selectLines(ctrl).map(line => renderLine(ctrl, line))),
            renderInput(ctrl),
        ];
        const presets = presetView(ctrl.preset);
        if (presets)
            vnodes.push(presets);
        return vnodes;
    }
    function renderInput(ctrl) {
        if (!ctrl.vm.writeable)
            return;
        if ((ctrl.data.loginRequired && !ctrl.data.userId) || ctrl.data.restricted)
            return h('input.mchat__say', {
                attrs: {
                    placeholder: ctrl.trans('loginToChat'),
                    disabled: true,
                },
            });
        let placeholder;
        if (ctrl.vm.timeout)
            placeholder = ctrl.trans('youHaveBeenTimedOut');
        else if (ctrl.opts.blind)
            placeholder = 'Chat';
        else
            placeholder = ctrl.trans.noarg(ctrl.vm.placeholderKey);
        return h('input.mchat__say', {
            attrs: {
                placeholder,
                autocomplete: 'off',
                maxlength: 140,
                disabled: ctrl.vm.timeout || !ctrl.vm.writeable,
                'aria-label': 'Chat input',
            },
            hook: {
                insert(vnode) {
                    setupHooks(ctrl, vnode.elm);
                },
            },
        });
    }
    let mouchListener;
    const setupHooks = (ctrl, chatEl) => {
        const storage = lichess.tempStorage.make('chat.input');
        const previousText = storage.get();
        if (previousText) {
            chatEl.value = previousText;
            chatEl.focus();
            if (!ctrl.opts.public && previousText.match(whisperRegex))
                chatEl.classList.add('whisper');
        }
        chatEl.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter')
                return;
            setTimeout(() => {
                const el = e.target, txt = el.value, pub = ctrl.opts.public;
                if (txt === '')
                    $('.keyboard-move input').each(function () {
                        this.focus();
                    });
                else {
                    if (!ctrl.opts.kobold)
                        selfReport(txt);
                    if (pub && hasTeamUrl(txt))
                        alert("Please don't advertise teams in the chat.");
                    else
                        ctrl.post(txt);
                    el.value = '';
                    storage.remove();
                    if (!pub)
                        el.classList.remove('whisper');
                }
            });
        });
        chatEl.addEventListener('input', (e) => setTimeout(() => {
            const el = e.target, txt = el.value;
            el.removeAttribute('placeholder');
            if (!ctrl.opts.public)
                el.classList.toggle('whisper', !!txt.match(whisperRegex));
            storage.set(txt);
        }));
        window.Mousetrap.bind('c', () => chatEl.focus());
        // Ensure clicks remove chat focus.
        // See ornicar/chessground#109
        const mouchEvents = ['touchstart', 'mousedown'];
        if (mouchListener)
            mouchEvents.forEach(event => document.body.removeEventListener(event, mouchListener, { capture: true }));
        mouchListener = (e) => {
            if (!e.shiftKey && e.buttons !== 2 && e.button !== 2)
                chatEl.blur();
        };
        chatEl.onfocus = () => mouchEvents.forEach(event => document.body.addEventListener(event, mouchListener, { passive: true, capture: true }));
        chatEl.onblur = () => mouchEvents.forEach(event => document.body.removeEventListener(event, mouchListener, { capture: true }));
    };
    function sameLines(l1, l2) {
        return l1.d && l2.d && l1.u === l2.u;
    }
    function selectLines(ctrl) {
        const ls = [];
        let prev;
        ctrl.data.lines.forEach(line => {
            if (!line.d &&
                (!prev || !sameLines(prev, line)) &&
                (!line.r || (line.u || '').toLowerCase() == ctrl.data.userId) &&
                !skip(line.t))
                ls.push(line);
            prev = line;
        });
        return ls;
    }
    function updateText(parseMoves) {
        return (oldVnode, vnode) => {
            if (vnode.data.lichessChat !== oldVnode.data.lichessChat) {
                vnode.elm.innerHTML = enhance(vnode.data.lichessChat, parseMoves);
            }
        };
    }
    function renderText(t, parseMoves) {
        if (isMoreThanText(t)) {
            const hook = updateText(parseMoves);
            return h('t', {
                lichessChat: t,
                hook: {
                    create: hook,
                    update: hook,
                },
            });
        }
        return h('t', t);
    }
    function report(ctrl, line) {
        const userA = line.querySelector('a.user-link');
        const text = line.querySelector('t').innerText;
        if (userA && confirm(`Report "${text}" to moderators?`))
            flag(ctrl.data.resourceId, userA.href.split('/')[4], text);
    }
    function renderLine(ctrl, line) {
        const textNode = renderText(line.t, ctrl.opts.parseMoves);
        if (line.u === 'lichess')
            return h('li.system', textNode);
        if (line.c)
            return h('li', [h('span.color', '[' + line.c + ']'), textNode]);
        const userNode = thunk('a', line.u, userLink, [line.u, line.title]);
        return h('li', ctrl.moderation()
            ? [line.u ? lineAction() : null, userNode, ' ', textNode]
            : [
                ctrl.data.userId && line.u && ctrl.data.userId != line.u
                    ? h('i.flag', {
                        attrs: {
                            'data-icon': '!',
                            title: 'Report',
                        },
                    })
                    : null,
                userNode,
                ' ',
                textNode,
            ]);
    }

    function view$1 (ctrl) {
        const mod = ctrl.moderation();
        return h('section.mchat' + (ctrl.opts.alwaysEnabled ? '' : '.mchat-optional'), {
            class: {
                'mchat-mod': !!mod,
            },
            hook: {
                destroy: ctrl.destroy,
            },
        }, moderationView(mod) || normalView(ctrl));
    }
    function renderPalantir(ctrl) {
        const p = ctrl.palantir;
        if (!p.enabled())
            return;
        return p.instance
            ? p.instance.render(h)
            : h('div.mchat__tab.palantir.palantir-slot', {
                attrs: {
                    'data-icon': '',
                    title: 'Voice chat',
                },
                hook: bind$1('click', () => {
                    if (!p.loaded) {
                        p.loaded = true;
                        lichess.loadScript('javascripts/vendor/peerjs.min.js').then(() => {
                            lichess.loadModule('palantir').then(() => {
                                p.instance = window.Palantir.palantir({
                                    uid: ctrl.data.userId,
                                    redraw: ctrl.redraw,
                                });
                                ctrl.redraw();
                            });
                        });
                    }
                }),
            });
    }
    function normalView(ctrl) {
        const active = ctrl.vm.tab;
        return [
            h('div.mchat__tabs.nb_' + ctrl.allTabs.length, [
                ...ctrl.allTabs.map(t => renderTab(ctrl, t, active)),
                renderPalantir(ctrl),
            ]),
            h('div.mchat__content.' + active, active === 'note' && ctrl.note
                ? [noteView(ctrl.note)]
                : ctrl.plugin && active === ctrl.plugin.tab.key
                    ? [ctrl.plugin.view()]
                    : discussionView(ctrl)),
        ];
    }
    function renderTab(ctrl, tab, active) {
        return h('div.mchat__tab.' + tab, {
            class: { 'mchat__tab-active': tab === active },
            hook: bind$1('click', () => ctrl.setTab(tab)),
        }, tabName(ctrl, tab));
    }
    function tabName(ctrl, tab) {
        if (tab === 'discussion')
            return [
                h('span', ctrl.data.name),
                ctrl.opts.alwaysEnabled
                    ? undefined
                    : h('input', {
                        attrs: {
                            type: 'checkbox',
                            title: ctrl.trans.noarg('toggleTheChat'),
                            checked: ctrl.vm.enabled,
                        },
                        hook: bind$1('change', (e) => {
                            ctrl.setEnabled(e.target.checked);
                        }),
                    }),
            ];
        if (tab === 'note')
            return [h('span', ctrl.trans.noarg('notes'))];
        if (ctrl.plugin && tab === ctrl.plugin.tab.key)
            return [h('span', ctrl.plugin.tab.name)];
        return [];
    }

    function LichessChat(element, opts) {
        const patch = init$1([classModule, attributesModule]);
        const ctrl = makeCtrl(opts, redraw);
        const blueprint = view$1(ctrl);
        element.innerHTML = '';
        let vnode = patch(element, blueprint);
        function redraw() {
            vnode = patch(vnode, view$1(ctrl));
        }
        return ctrl;
    }

    function onInsert(f) {
        return {
            insert(vnode) {
                f(vnode.elm);
            },
        };
    }
    function bind(eventName, f) {
        return onInsert(el => el.addEventListener(eventName, f));
    }
    function player(p) {
        return h('a.ulpt.user-link.online', {
            attrs: { href: '/@/' + p.name },
            hook: {
                destroy(vnode) {
                    $.powerTip.destroy(vnode.elm);
                },
            },
        }, [
            h(`i.line${p.patron ? '.patron' : ''}`),
            h('span.name', userName(p)),
            h('em', ` ${p.rating}${p.provisional ? '?' : ''}`),
        ]);
    }
    const userName = (u) => (u.title ? [h('span.utitle', u.title), ' ' + u.name] : [u.name]);
    function title(ctrl) {
        return h('h1', [ctrl.data.fullName, h('span.author', ctrl.trans.vdom('by', player(ctrl.data.host)))]);
    }

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

    function created (showText) {
        return (ctrl) => {
            const candidates = ctrl.candidates().sort(byName), accepted = ctrl.accepted().sort(byName), isHost = ctrl.createdByMe();
            const variantIconFor = (a) => {
                const variant = ctrl.data.variants.find(v => a.variant == v.key);
                return (variant &&
                    h('td.variant', {
                        attrs: {
                            'data-icon': variant.icon,
                        },
                    }));
            };
            return [
                h('div.box__top', [
                    title(ctrl),
                    h('div.box__top__actions', ctrl.opts.userId
                        ? isHost
                            ? [startOrCancel(ctrl, accepted), randomButton(ctrl)]
                            : ctrl.containsMe()
                                ? h('a.button', {
                                    hook: bind('click', () => xhr.withdraw(ctrl.data.id)),
                                }, ctrl.trans('withdraw'))
                                : h('a.button.text' + (ctrl.teamBlock() ? '.disabled' : ''), {
                                    attrs: {
                                        disabled: ctrl.teamBlock(),
                                        'data-icon': 'G',
                                    },
                                    hook: ctrl.teamBlock()
                                        ? {}
                                        : bind('click', () => {
                                            if (ctrl.data.variants.length === 1)
                                                xhr.join(ctrl.data.id, ctrl.data.variants[0].key);
                                            else {
                                                modal($('.simul .continue-with'));
                                                $('#modal-wrap .continue-with a').on('click', function () {
                                                    modal.close();
                                                    xhr.join(ctrl.data.id, $(this).data('variant'));
                                                });
                                            }
                                        }),
                                }, ctrl.teamBlock() && ctrl.data.team
                                    ? ctrl.trans('mustBeInTeam', ctrl.data.team.name)
                                    : ctrl.trans('join'))
                        : h('a.button.text', {
                            attrs: {
                                'data-icon': 'G',
                                href: '/login?referrer=' + window.location.pathname,
                            },
                        }, ctrl.trans('signIn'))),
                ]),
                showText(ctrl),
                ctrl.acceptedContainsMe()
                    ? h('p.instructions', 'You have been selected! Hold still, the simul is about to begin.')
                    : isHost && ctrl.data.applicants.length < 6
                        ? h('p.instructions', 'Share this page URL to let people enter the simul!')
                        : null,
                h('div.halves', {
                    hook: {
                        postpatch(_old, vnode) {
                            lichess.powertip.manualUserIn(vnode.elm);
                        },
                    },
                }, [
                    h('div.half.candidates', h('table.slist.slist-pad', h('thead', h('tr', h('th', {
                        attrs: { colspan: 3 },
                    }, [h('strong', candidates.length), ' candidate players']))), h('tbody', candidates.map(applicant => {
                        return h('tr', {
                            key: applicant.player.id,
                            class: {
                                me: ctrl.opts.userId === applicant.player.id,
                            },
                        }, [
                            h('td', player(applicant.player)),
                            variantIconFor(applicant),
                            h('td.action', isHost
                                ? [
                                    h('a.button', {
                                        attrs: {
                                            'data-icon': 'E',
                                            title: 'Accept',
                                        },
                                        hook: bind('click', () => xhr.accept(applicant.player.id)(ctrl.data.id)),
                                    }),
                                ]
                                : []),
                        ]);
                    })))),
                    h('div.half.accepted', [
                        h('table.slist.user_list', h('thead', [
                            h('tr', h('th', {
                                attrs: { colspan: 3 },
                            }, [h('strong', accepted.length), ' accepted players'])),
                            isHost && candidates.length && !accepted.length
                                ? [h('tr.help', h('th', 'Now you get to accept some players, then start the simul'))]
                                : [],
                        ]), h('tbody', accepted.map(applicant => {
                            return h('tr', {
                                key: applicant.player.id,
                                class: {
                                    me: ctrl.opts.userId === applicant.player.id,
                                },
                            }, [
                                h('td', player(applicant.player)),
                                variantIconFor(applicant),
                                h('td.action', isHost
                                    ? [
                                        h('a.button.button-red', {
                                            attrs: {
                                                'data-icon': 'L',
                                            },
                                            hook: bind('click', () => xhr.reject(applicant.player.id)(ctrl.data.id)),
                                        }),
                                    ]
                                    : []),
                            ]);
                        }))),
                    ]),
                ]),
                ctrl.data.quote
                    ? h('blockquote.pull-quote', [h('p', ctrl.data.quote.text), h('footer', ctrl.data.quote.author)])
                    : null,
                h('div.continue-with.none', ctrl.data.variants.map(function (variant) {
                    return h('a.button', {
                        attrs: {
                            'data-variant': variant.key,
                        },
                    }, variant.name);
                })),
            ];
        };
    }
    const byName = (a, b) => (a.player.name > b.player.name ? 1 : -1);
    const randomButton = (ctrl) => ctrl.candidates().length
        ? h('a.button.text', {
            attrs: {
                'data-icon': 'E',
            },
            hook: bind('click', () => {
                const candidates = ctrl.candidates();
                const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
                xhr.accept(randomCandidate.player.id)(ctrl.data.id);
            }),
        }, 'Accept random candidate')
        : null;
    const startOrCancel = (ctrl, accepted) => accepted.length > 1
        ? h('a.button.button-green.text', {
            attrs: {
                'data-icon': 'G',
            },
            hook: bind('click', () => xhr.start(ctrl.data.id)),
        }, `Start (${accepted.length})`)
        : h('a.button.button-red.text', {
            attrs: {
                'data-icon': 'L',
            },
            hook: bind('click', () => {
                if (confirm('Delete this simul?'))
                    xhr.abort(ctrl.data.id);
            }),
        }, ctrl.trans('cancel'));

    // https://github.com/ornicar/scalachess/blob/master/src/main/scala/Status.scala
    const ids = {
        created: 10,
        started: 20,
        aborted: 25,
        mate: 30,
        resign: 31,
        stalemate: 32,
        timeout: 33,
        draw: 34,
        outoftime: 35,
        cheat: 36,
        noStart: 37,
        variantEnd: 60,
    };

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const allKeys = Array.prototype.concat(...files.map(c => ranks.map(r => c + r)));
    const key2pos = (k) => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];
    allKeys.map(key2pos);
    const opposite = (c) => (c === 'white' ? 'black' : 'white');

    function results (ctrl) {
        return h('div.results', [
            h('div', trans(ctrl, 'nbPlaying', p => p.game.status < ids.mate)),
            h('div', trans(ctrl, 'nbWins', p => p.game.winner === p.hostColor)),
            h('div', trans(ctrl, 'nbDraws', p => p.game.status >= ids.mate && !p.game.winner)),
            h('div', trans(ctrl, 'nbLosses', p => p.game.winner === opposite(p.hostColor))),
        ]);
    }
    const NumberFirstRegex = /^(\d+)\s(.+)$/, NumberLastRegex = /^(.+)\s(\d+)$/;
    const splitNumber = (s) => {
        let found;
        if ((found = s.match(NumberFirstRegex)))
            return [h('div.number', found[1]), h('div.text', found[2])];
        if ((found = s.match(NumberLastRegex)))
            return [h('div.number', found[2]), h('div.text', found[1])];
        return h('div.text', s);
    };
    const trans = (ctrl, key, cond) => splitNumber(ctrl.trans.plural(key, ctrl.data.pairings.filter(cond).length));

    function pairings (ctrl) {
        return h('div.game-list.now-playing.box__pad', ctrl.data.pairings.map(miniPairing(ctrl)));
    }
    const renderClock = (color, time) => h(`span.mini-game__clock.mini-game__clock--${color}`, {
        attrs: {
            'data-time': time,
            'data-managed': 1,
        },
    });
    const miniPairing = (ctrl) => (pairing) => {
        const game = pairing.game, player = pairing.player;
        return h(`span.mini-game.mini-game-${game.id}.mini-game--init.is2d`, {
            class: {
                host: ctrl.data.host.gameId === game.id,
            },
            attrs: {
                'data-state': `${game.fen},${game.orient},${game.lastMove}`,
                'data-live': game.clock ? game.id : '',
            },
            hook: onInsert(lichess.powertip.manualUserIn),
        }, [
            h('span.mini-game__player', [
                h('a.mini-game__user.ulpt', {
                    attrs: {
                        href: `/@/${player.name}`,
                    },
                }, [
                    h('span.name', player.title ? [h('span.utitle', player.title), ' ', player.name] : [player.name]),
                    ' ',
                    h('span.rating', player.rating),
                ]),
                game.clock
                    ? renderClock(opposite(game.orient), game.clock[opposite(game.orient)])
                    : h('span.mini-game__result', game.winner ? (game.winner == game.orient ? 0 : 1) : '½'),
            ]),
            h('a.cg-wrap', {
                attrs: {
                    href: `/${game.id}/${game.orient}`,
                },
            }),
            h('span.mini-game__player', [
                h('span'),
                game.clock
                    ? renderClock(game.orient, game.clock[game.orient])
                    : h('span.mini-game__result', game.winner ? (game.winner == game.orient ? 1 : 0) : '½'),
            ]),
        ]);
    };

    function view (ctrl) {
        const handler = ctrl.data.isRunning ? started : ctrl.data.isFinished ? finished : created(showText);
        return h('main.simul', {
            class: {
                'simul-created': ctrl.data.isCreated,
            },
        }, [
            h('aside.simul__side', {
                hook: onInsert(el => {
                    $(el).replaceWith(ctrl.opts.$side);
                    ctrl.opts.chat && lichess.makeChat(ctrl.opts.chat);
                }),
            }),
            h('div.simul__main.box', {
                hook: {
                    postpatch() {
                        lichess.miniGame.initAll();
                    },
                },
            }, handler(ctrl)),
            h('div.chat__members.none', {
                hook: onInsert(lichess.watchers),
            }),
        ]);
    }
    const showText = (ctrl) => h('div.simul-text', [
        h('p', {
            hook: richHTML(ctrl.data.text),
        }),
    ]);
    const started = (ctrl) => [title(ctrl), showText(ctrl), results(ctrl), pairings(ctrl)];
    const finished = (ctrl) => [
        h('div.box__top', [title(ctrl), h('div.box__top__actions', h('div.finished', ctrl.trans('finished')))]),
        showText(ctrl),
        results(ctrl),
        pairings(ctrl),
    ];

    const patch = init$1([classModule, attributesModule]);
    function start(opts) {
        const element = document.querySelector('main.simul');
        lichess.socket = new lichess.StrongSocket(`/simul/${opts.data.id}/socket/v4`, opts.socketVersion, {
            receive: (t, d) => ctrl.socket.receive(t, d),
        });
        opts.socketSend = lichess.socket.send;
        opts.element = element;
        opts.$side = $('.simul__side').clone();
        let vnode;
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        const ctrl = new SimulCtrl(opts, redraw);
        const blueprint = view(ctrl);
        element.innerHTML = '';
        vnode = patch(element, blueprint);
        redraw();
    }
    // that's for the rest of lichess to access the chat
    window.LichessChat = LichessChat;

    exports.start = start;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
