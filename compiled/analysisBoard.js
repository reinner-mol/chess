var LichessAnalyse = (function (exports) {
    'use strict';

    function createElement$1(tagName, options) {
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
    function removeChild$1(node, child) {
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
        createElement: createElement$1,
        createElementNS,
        createTextNode,
        createComment,
        insertBefore,
        removeChild: removeChild$1,
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
    function init$2(modules, domApi) {
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
    function init$1(thunk) {
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
            hook: { init: init$1, prepatch },
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

    function boot (cfg) {
        lichess.socket = new lichess.StrongSocket(cfg.data.url.socket, cfg.data.player.version, {
            params: {
                userTv: cfg.data.userTv && cfg.data.userTv.id,
            },
            receive(t, d) {
                analyse.socketReceive(t, d);
            },
        });
        cfg.$side = $('.analyse__side').clone();
        cfg.$underboard = $('.analyse__underboard').clone();
        cfg.socketSend = lichess.socket.send;
        const analyse = start(cfg);
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
    function bind$2(eventName, f) {
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
                    hook: bind$2('click', () => {
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

    const defined$1 = (v) => typeof v !== 'undefined';
    const isEmpty = (a) => !a || a.length === 0;
    const notEmpty = (a) => !isEmpty(a);
    // like mithril prop but with type safety
    const prop = (initialValue) => {
        let value = initialValue;
        const fun = function (v) {
            if (defined$1(v))
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
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined$1(params[k]))
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
                        hook: bind$2('click', () => ctrl.timeout(r, data.text)),
                    }, r.name);
                }),
            ])
            : h('div.timeout.block', [
                h('strong', 'Moderation'),
                h('a.text', {
                    attrs: { 'data-icon': 'p' },
                    hook: bind$2('click', () => ctrl.timeout(ctrl.reasons[0], data.text)),
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
                    hook: bind$2('click', ctrl.close),
                }),
            ]),
            h('div.mchat__content.moderation', [h('i.line-text.block', ['"', data.text, '"']), infos, timeout, history]),
        ];
    }

    function makeCtrl$1 (opts, redraw) {
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

    function view$m (ctrl) {
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
                hook: bind$2('click', () => {
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
            hook: bind$2('click', () => ctrl.setTab(tab)),
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
                        hook: bind$2('change', (e) => {
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
        const patch = init$2([classModule, attributesModule]);
        const ctrl = makeCtrl$1(opts, redraw);
        const blueprint = view$m(ctrl);
        element.innerHTML = '';
        let vnode = patch(element, blueprint);
        function redraw() {
            vnode = patch(vnode, view$m(ctrl));
        }
        return ctrl;
    }

    const piotr = {
        a: 'a1',
        b: 'b1',
        c: 'c1',
        d: 'd1',
        e: 'e1',
        f: 'f1',
        g: 'g1',
        h: 'h1',
        i: 'a2',
        j: 'b2',
        k: 'c2',
        l: 'd2',
        m: 'e2',
        n: 'f2',
        o: 'g2',
        p: 'h2',
        q: 'a3',
        r: 'b3',
        s: 'c3',
        t: 'd3',
        u: 'e3',
        v: 'f3',
        w: 'g3',
        x: 'h3',
        y: 'a4',
        z: 'b4',
        A: 'c4',
        B: 'd4',
        C: 'e4',
        D: 'f4',
        E: 'g4',
        F: 'h4',
        G: 'a5',
        H: 'b5',
        I: 'c5',
        J: 'd5',
        K: 'e5',
        L: 'f5',
        M: 'g5',
        N: 'h5',
        O: 'a6',
        P: 'b6',
        Q: 'c6',
        R: 'd6',
        S: 'e6',
        T: 'f6',
        U: 'g6',
        V: 'h6',
        W: 'a7',
        X: 'b7',
        Y: 'c7',
        Z: 'd7',
        '0': 'e7',
        '1': 'f7',
        '2': 'g7',
        '3': 'h7',
        '4': 'a8',
        '5': 'b8',
        '6': 'c8',
        '7': 'd8',
        '8': 'e8',
        '9': 'f8',
        '!': 'g8',
        '?': 'h8',
    };

    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    function fixCrazySan(san) {
        return san[0] === 'P' ? san.slice(1) : san;
    }
    function readDests(lines) {
        if (typeof lines === 'undefined')
            return null;
        const dests = new Map();
        if (lines)
            for (const line of lines.split(' ')) {
                dests.set(piotr[line[0]], line
                    .slice(1)
                    .split('')
                    .map(c => piotr[c]));
            }
        return dests;
    }
    function readDrops(line) {
        if (typeof line === 'undefined' || line === null)
            return null;
        return line.match(/.{2}/g) || [];
    }
    const altCastles = {
        e1a1: 'e1c1',
        e1h1: 'e1g1',
        e8a8: 'e8c8',
        e8h8: 'e8g8',
    };

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
    function finished(data) {
        return data.game.status.id >= ids.mate;
    }
    function aborted(data) {
        return data.game.status.id === ids.aborted;
    }

    const playable = (data) => data.game.status.id < ids.aborted && !imported(data);
    const playedTurns = (data) => data.game.turns - (data.game.startedAtTurn || 0);
    const bothPlayersHavePlayed = (data) => playedTurns(data) > 1;
    const imported = (data) => data.game.source === 'import';
    const replayable = (data) => imported(data) || finished(data) || (aborted(data) && bothPlayersHavePlayed(data));
    function getPlayer(data, color) {
        if (data.player.color === color)
            return data.player;
        if (data.opponent.color === color)
            return data.opponent;
        return null;
    }

    const root = '';
    function head(path) {
        return path.slice(0, 2);
    }
    function tail(path) {
        return path.slice(2);
    }
    function init(path) {
        return path.slice(0, -2);
    }
    function last$2(path) {
        return path.slice(-2);
    }
    function contains(p1, p2) {
        return p1.startsWith(p2);
    }
    function fromNodeList(nodes) {
        let path = '';
        for (const i in nodes)
            path += nodes[i].id;
        return path;
    }

    function withMainlineChild(node, f) {
        const next = node.children[0];
        return next ? f(next) : undefined;
    }
    function findInMainline(fromNode, predicate) {
        const findFrom = function (node) {
            if (predicate(node))
                return node;
            return withMainlineChild(node, findFrom);
        };
        return findFrom(fromNode);
    }
    // returns a list of nodes collected from the original one
    function collect(from, pickChild) {
        const nodes = [from];
        let n = from, c;
        while ((c = pickChild(n))) {
            nodes.push(c);
            n = c;
        }
        return nodes;
    }
    function pickFirstChild(node) {
        return node.children[0];
    }
    function childById(node, id) {
        return node.children.find(child => child.id === id);
    }
    function last$1(nodeList) {
        return nodeList[nodeList.length - 1];
    }
    function takePathWhile(nodeList, predicate) {
        let path = '';
        for (const i in nodeList) {
            if (predicate(nodeList[i]))
                path += nodeList[i].id;
            else
                break;
        }
        return path;
    }
    function removeChild(parent, id) {
        parent.children = parent.children.filter(function (n) {
            return n.id !== id;
        });
    }
    function countChildrenAndComments(node) {
        const count = {
            nodes: 1,
            comments: (node.comments || []).length,
        };
        node.children.forEach(function (child) {
            const c = countChildrenAndComments(child);
            count.nodes += c.nodes;
            count.comments += c.comments;
        });
        return count;
    }
    // adds n2 into n1
    function merge$1(n1, n2) {
        n1.eval = n2.eval;
        if (n2.glyphs)
            n1.glyphs = n2.glyphs;
        n2.comments &&
            n2.comments.forEach(function (c) {
                if (!n1.comments)
                    n1.comments = [c];
                else if (!n1.comments.some(function (d) {
                    return d.text === c.text;
                }))
                    n1.comments.push(c);
            });
        n2.children.forEach(function (c) {
            const existing = childById(n1, c.id);
            if (existing)
                merge$1(existing, c);
            else
                n1.children.push(c);
        });
    }
    function hasBranching(node, maxDepth) {
        return maxDepth <= 0 || !!node.children[1] || (node.children[0] && hasBranching(node.children[0], maxDepth - 1));
    }
    function mainlineNodeList(from) {
        return collect(from, pickFirstChild);
    }
    function updateAll(root, f) {
        // applies f recursively to all nodes
        function update(node) {
            f(node);
            node.children.forEach(update);
        }
        update(root);
    }

    function build(root) {
        function lastNode() {
            return findInMainline(root, (node) => !node.children.length);
        }
        function nodeAtPath(path) {
            return nodeAtPathFrom(root, path);
        }
        function nodeAtPathFrom(node, path) {
            if (path === '')
                return node;
            const child = childById(node, head(path));
            return child ? nodeAtPathFrom(child, tail(path)) : node;
        }
        function nodeAtPathOrNull(path) {
            return nodeAtPathOrNullFrom(root, path);
        }
        function nodeAtPathOrNullFrom(node, path) {
            if (path === '')
                return node;
            const child = childById(node, head(path));
            return child ? nodeAtPathOrNullFrom(child, tail(path)) : undefined;
        }
        function longestValidPathFrom(node, path) {
            const id = head(path);
            const child = childById(node, id);
            return child ? id + longestValidPathFrom(child, tail(path)) : '';
        }
        function getCurrentNodesAfterPly(nodeList, mainline, ply) {
            const nodes = [];
            for (const i in nodeList) {
                const node = nodeList[i];
                if (node.ply <= ply && mainline[i].id !== node.id)
                    break;
                if (node.ply > ply)
                    nodes.push(node);
            }
            return nodes;
        }
        function pathIsMainline(path) {
            return pathIsMainlineFrom(root, path);
        }
        function pathExists(path) {
            return !!nodeAtPathOrNull(path);
        }
        function pathIsMainlineFrom(node, path) {
            if (path === '')
                return true;
            const pathId = head(path), child = node.children[0];
            if (!child || child.id !== pathId)
                return false;
            return pathIsMainlineFrom(child, tail(path));
        }
        function pathIsForcedVariation(path) {
            return !!getNodeList(path).find(n => n.forceVariation);
        }
        function lastMainlineNodeFrom(node, path) {
            if (path === '')
                return node;
            const pathId = head(path);
            const child = node.children[0];
            if (!child || child.id !== pathId)
                return node;
            return lastMainlineNodeFrom(child, tail(path));
        }
        function getNodeList(path) {
            return collect(root, function (node) {
                const id = head(path);
                if (id === '')
                    return;
                path = tail(path);
                return childById(node, id);
            });
        }
        function updateAt(path, update) {
            const node = nodeAtPathOrNull(path);
            if (node) {
                update(node);
                return node;
            }
            return;
        }
        // returns new path
        function addNode(node, path) {
            const newPath = path + node.id, existing = nodeAtPathOrNull(newPath);
            if (existing) {
                ['dests', 'drops', 'clock'].forEach(key => {
                    if (defined$1(node[key]) && !defined$1(existing[key]))
                        existing[key] = node[key];
                });
                return newPath;
            }
            return updateAt(path, function (parent) {
                parent.children.push(node);
            })
                ? newPath
                : undefined;
        }
        function addNodes(nodes, path) {
            const node = nodes[0];
            if (!node)
                return path;
            const newPath = addNode(node, path);
            return newPath ? addNodes(nodes.slice(1), newPath) : undefined;
        }
        function deleteNodeAt(path) {
            removeChild(parentNode(path), last$2(path));
        }
        function promoteAt(path, toMainline) {
            const nodes = getNodeList(path);
            for (let i = nodes.length - 2; i >= 0; i--) {
                const node = nodes[i + 1];
                const parent = nodes[i];
                if (parent.children[0].id !== node.id) {
                    removeChild(parent, node.id);
                    parent.children.unshift(node);
                    if (!toMainline)
                        break;
                }
                else if (node.forceVariation) {
                    node.forceVariation = false;
                    if (!toMainline)
                        break;
                }
            }
        }
        function setCommentAt(comment, path) {
            return !comment.text
                ? deleteCommentAt(comment.id, path)
                : updateAt(path, function (node) {
                    node.comments = node.comments || [];
                    const existing = node.comments.find(function (c) {
                        return c.id === comment.id;
                    });
                    if (existing)
                        existing.text = comment.text;
                    else
                        node.comments.push(comment);
                });
        }
        function deleteCommentAt(id, path) {
            return updateAt(path, function (node) {
                const comments = (node.comments || []).filter(function (c) {
                    return c.id !== id;
                });
                node.comments = comments.length ? comments : undefined;
            });
        }
        function setGlyphsAt(glyphs, path) {
            return updateAt(path, function (node) {
                node.glyphs = glyphs;
            });
        }
        function parentNode(path) {
            return nodeAtPath(init(path));
        }
        function getParentClock(node, path) {
            if (!('parentClock' in node)) {
                const par = path && parentNode(path);
                if (!par)
                    node.parentClock = node.clock;
                else if (!('clock' in par))
                    node.parentClock = undefined;
                else
                    node.parentClock = par.clock;
            }
            return node.parentClock;
        }
        return {
            root,
            lastPly() {
                var _a;
                return ((_a = lastNode()) === null || _a === void 0 ? void 0 : _a.ply) || root.ply;
            },
            nodeAtPath,
            getNodeList,
            longestValidPath: (path) => longestValidPathFrom(root, path),
            updateAt,
            addNode,
            addNodes,
            addDests(dests, path) {
                return updateAt(path, function (node) {
                    node.dests = dests;
                });
            },
            setShapes(shapes, path) {
                return updateAt(path, function (node) {
                    node.shapes = shapes;
                });
            },
            setCommentAt,
            deleteCommentAt,
            setGlyphsAt,
            setClockAt(clock, path) {
                return updateAt(path, function (node) {
                    node.clock = clock;
                });
            },
            pathIsMainline,
            pathIsForcedVariation,
            lastMainlineNode(path) {
                return lastMainlineNodeFrom(root, path);
            },
            pathExists,
            deleteNodeAt,
            promoteAt,
            forceVariationAt(path, force) {
                return updateAt(path, function (node) {
                    node.forceVariation = force;
                });
            },
            getCurrentNodesAfterPly,
            merge(tree) {
                merge$1(root, tree);
            },
            removeCeval() {
                updateAll(root, function (n) {
                    delete n.ceval;
                    delete n.threat;
                });
            },
            removeComputerVariations() {
                mainlineNodeList(root).forEach(function (n) {
                    n.children = n.children.filter(function (c) {
                        return !c.comp;
                    });
                });
            },
            parentNode,
            getParentClock,
        };
    }

    function canGoForward(ctrl) {
        return ctrl.node.children.length > 0;
    }
    function next(ctrl) {
        const child = ctrl.node.children[0];
        if (child)
            ctrl.userJumpIfCan(ctrl.path + child.id);
    }
    function prev(ctrl) {
        ctrl.userJumpIfCan(init(ctrl.path));
    }
    function last(ctrl) {
        ctrl.userJumpIfCan(fromNodeList(ctrl.mainline));
    }
    function first(ctrl) {
        ctrl.userJump(root);
    }
    function enterVariation(ctrl) {
        const child = ctrl.node.children[1];
        if (child)
            ctrl.userJump(ctrl.path + child.id);
    }
    function exitVariation(ctrl) {
        if (ctrl.onMainline)
            return;
        let found, path = root;
        ctrl.nodeList.slice(1, -1).forEach(function (n) {
            path += n.id;
            if (n.children[1])
                found = path;
        });
        if (found)
            ctrl.userJump(found);
    }

    var control = /*#__PURE__*/Object.freeze({
        __proto__: null,
        canGoForward: canGoForward,
        next: next,
        prev: prev,
        last: last,
        first: first,
        enterVariation: enterVariation,
        exitVariation: exitVariation
    });

    const emptyRedButton = 'button.button.button-red.button-empty';
    const longPressDuration = 610; // used in bindMobileTapHold
    function plyColor(ply) {
        return ply % 2 === 0 ? 'white' : 'black';
    }
    function bindMobileMousedown(el, f, redraw) {
        for (const mousedownEvent of ['touchstart', 'mousedown']) {
            el.addEventListener(mousedownEvent, e => {
                f(e);
                e.preventDefault();
                if (redraw)
                    redraw();
            });
        }
    }
    function bindMobileTapHold(el, f, redraw) {
        let longPressCountdown;
        el.addEventListener('touchstart', e => {
            longPressCountdown = setTimeout(() => {
                f(e);
                if (redraw)
                    redraw();
            }, longPressDuration);
        });
        el.addEventListener('touchmove', () => {
            clearTimeout(longPressCountdown);
        });
        el.addEventListener('touchcancel', () => {
            clearTimeout(longPressCountdown);
        });
        el.addEventListener('touchend', () => {
            clearTimeout(longPressCountdown);
        });
    }
    function listenTo(el, eventName, f, redraw) {
        el.addEventListener(eventName, e => {
            const res = f(e);
            if (res === false)
                e.preventDefault();
            if (redraw)
                redraw();
            return res;
        });
    }
    function bind$1(eventName, f, redraw) {
        return onInsert(el => listenTo(el, eventName, f, redraw));
    }
    function bindSubmit(f, redraw) {
        return bind$1('submit', e => {
            e.preventDefault();
            return f(e);
        }, redraw);
    }
    function onInsert(f) {
        return {
            insert: vnode => f(vnode.elm),
        };
    }
    function readOnlyProp(value) {
        return function () {
            return value;
        };
    }
    function dataIcon(icon) {
        return {
            'data-icon': icon,
        };
    }
    function iconTag(icon) {
        return h('i', { attrs: dataIcon(icon) });
    }
    function plyToTurn$1(ply) {
        return Math.floor((ply - 1) / 2) + 1;
    }
    function nodeFullName(node) {
        if (node.san)
            return plyToTurn$1(node.ply) + (node.ply % 2 === 1 ? '.' : '...') + ' ' + fixCrazySan(node.san);
        return 'Initial position';
    }
    function plural(noun, nb) {
        return nb + ' ' + (nb === 1 ? noun : noun + 's');
    }
    function titleNameToId(titleName) {
        const split = titleName.split(' ');
        return (split.length === 1 ? split[0] : split[1]).toLowerCase();
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
    function baseUrl() {
        return `${window.location.protocol}//${window.location.host}`;
    }
    function option(value, current, name) {
        return h('option', {
            attrs: {
                value: value,
                selected: value === current,
            },
        }, name);
    }
    function scrollTo(el, target) {
        if (el && target)
            el.scrollTop = target.offsetTop - el.offsetHeight / 2 + target.offsetHeight / 2;
    }
    function treeReconstruct(parts) {
        const root = parts[0], nb = parts.length;
        let node = root;
        root.id = '';
        for (let i = 1; i < nb; i++) {
            const n = parts[i];
            if (node.children)
                node.children.unshift(n);
            else
                node.children = [n];
            node = n;
        }
        node.children = node.children || [];
        return root;
    }

    function modal$1(d) {
        return h('div#modal-overlay', Object.assign({}, (!d.noClickAway ? { hook: bind$1('mousedown', d.onClose) } : {})), [
            h('div#modal-wrap.study__modal.' + d.class, {
                hook: onInsert(el => {
                    el.addEventListener('mousedown', e => e.stopPropagation());
                    d.onInsert && d.onInsert(el);
                }),
            }, [
                h('span.close', {
                    attrs: { 'data-icon': 'L' },
                    hook: bind$1('click', d.onClose),
                }),
                h('div', d.content),
            ]),
        ]);
    }
    function button(name) {
        return h('div.form-actions.single', h('button.button', {
            attrs: { type: 'submit' },
        }, name));
    }

    const bind = (ctrl) => {
        const kbd = window.Mousetrap;
        if (!kbd)
            return;
        kbd
            .bind(['left', 'k'], () => {
            prev(ctrl);
            ctrl.redraw();
        })
            .bind(['shift+left', 'shift+k'], () => {
            exitVariation(ctrl);
            ctrl.redraw();
        })
            .bind(['right', 'j'], () => {
            if (!ctrl.fork.proceed())
                next(ctrl);
            ctrl.redraw();
        })
            .bind(['shift+right', 'shift+j'], () => {
            enterVariation(ctrl);
            ctrl.redraw();
        })
            .bind(['up', '0'], () => {
            if (!ctrl.fork.prev())
                first(ctrl);
            ctrl.redraw();
        })
            .bind(['down', '$'], () => {
            if (!ctrl.fork.next())
                last(ctrl);
            ctrl.redraw();
        })
            .bind('shift+c', () => {
            ctrl.showComments = !ctrl.showComments;
            ctrl.autoScroll();
            ctrl.redraw();
        })
            .bind('shift+i', () => {
            ctrl.treeView.toggle();
            ctrl.redraw();
        })
            .bind('z', () => {
            ctrl.toggleComputer();
            ctrl.redraw();
        });
        if (ctrl.embed)
            return;
        kbd.bind('space', () => {
            const gb = ctrl.gamebookPlay();
            if (gb)
                gb.onSpace();
            else if (ctrl.studyPractice)
                return;
            else if (ctrl.ceval.enabled())
                ctrl.playBestMove();
            else
                ctrl.toggleCeval();
        });
        if (ctrl.studyPractice)
            return;
        kbd
            .bind('f', ctrl.flip)
            .bind('?', () => {
            ctrl.keyboardHelp = !ctrl.keyboardHelp;
            ctrl.redraw();
        })
            .bind('l', ctrl.toggleCeval)
            .bind('a', () => {
            ctrl.toggleAutoShapes(!ctrl.showAutoShapes());
            ctrl.redraw();
        })
            .bind('x', ctrl.toggleThreatMode)
            .bind('e', () => {
            ctrl.toggleExplorer();
            ctrl.redraw();
        });
        if (ctrl.study) {
            const keyToMousedown = (key, selector) => {
                kbd.bind(key, () => {
                    $(selector).each(function () {
                        this.dispatchEvent(new Event('mousedown'));
                    });
                });
            };
            keyToMousedown('d', '.study__buttons .comments');
            keyToMousedown('g', '.study__buttons .glyphs');
            // navigation for next and prev chapters
            kbd.bind('p', ctrl.study.goToPrevChapter);
            kbd.bind('n', ctrl.study.goToNextChapter);
        }
    };
    function view$l(ctrl) {
        return modal$1({
            class: 'keyboard-help',
            onInsert(el) {
                lichess.loadCssPath('analyse.keyboard');
                text(url('/analysis/help', { study: !!ctrl.study })).then(html => {
                    el.querySelector('.scrollable').innerHTML = html;
                });
            },
            onClose() {
                ctrl.keyboardHelp = false;
                ctrl.redraw();
            },
            content: [h('div.scrollable', spinner())],
        });
    }

    const colors = ['white', 'black'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const invRanks = [...ranks].reverse();
    const allKeys = Array.prototype.concat(...files.map(c => ranks.map(r => c + r)));
    const pos2key = (pos) => allKeys[8 * pos[0] + pos[1]];
    const key2pos = (k) => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];
    const allPos = allKeys.map(key2pos);
    function memo(f) {
        let v;
        const ret = () => {
            if (v === undefined)
                v = f();
            return v;
        };
        ret.clear = () => {
            v = undefined;
        };
        return ret;
    }
    const timer = () => {
        let startAt;
        return {
            start() {
                startAt = performance.now();
            },
            cancel() {
                startAt = undefined;
            },
            stop() {
                if (!startAt)
                    return 0;
                const time = performance.now() - startAt;
                startAt = undefined;
                return time;
            },
        };
    };
    const opposite$1 = (c) => (c === 'white' ? 'black' : 'white');
    const distanceSq = (pos1, pos2) => {
        const dx = pos1[0] - pos2[0], dy = pos1[1] - pos2[1];
        return dx * dx + dy * dy;
    };
    const samePiece = (p1, p2) => p1.role === p2.role && p1.color === p2.color;
    const posToTranslateBase = (pos, asWhite, xFactor, yFactor) => [
        (asWhite ? pos[0] : 7 - pos[0]) * xFactor,
        (asWhite ? 7 - pos[1] : pos[1]) * yFactor,
    ];
    const posToTranslateAbs = (bounds) => {
        const xFactor = bounds.width / 8, yFactor = bounds.height / 8;
        return (pos, asWhite) => posToTranslateBase(pos, asWhite, xFactor, yFactor);
    };
    const posToTranslateRel = (pos, asWhite) => posToTranslateBase(pos, asWhite, 100, 100);
    const translateAbs = (el, pos) => {
        el.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
    };
    const translateRel = (el, percents) => {
        el.style.transform = `translate(${percents[0]}%,${percents[1]}%)`;
    };
    const setVisible = (el, v) => {
        el.style.visibility = v ? 'visible' : 'hidden';
    };
    const eventPosition$1 = (e) => {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return; // touchend has no position!
    };
    const isRightButton = (e) => e.buttons === 2 || e.button === 2;
    const createEl = (tagName, className) => {
        const el = document.createElement(tagName);
        if (className)
            el.className = className;
        return el;
    };
    function computeSquareCenter(key, asWhite, bounds) {
        const pos = key2pos(key);
        if (!asWhite) {
            pos[0] = 7 - pos[0];
            pos[1] = 7 - pos[1];
        }
        return [
            bounds.left + (bounds.width * pos[0]) / 8 + bounds.width / 16,
            bounds.top + (bounds.height * (7 - pos[1])) / 8 + bounds.height / 16,
        ];
    }

    function diff(a, b) {
        return Math.abs(a - b);
    }
    function pawn(color) {
        return (x1, y1, x2, y2) => diff(x1, x2) < 2 &&
            (color === 'white'
                ? // allow 2 squares from first two ranks, for horde
                    y2 === y1 + 1 || (y1 <= 1 && y2 === y1 + 2 && x1 === x2)
                : y2 === y1 - 1 || (y1 >= 6 && y2 === y1 - 2 && x1 === x2));
    }
    const knight = (x1, y1, x2, y2) => {
        const xd = diff(x1, x2);
        const yd = diff(y1, y2);
        return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
    };
    const bishop = (x1, y1, x2, y2) => {
        return diff(x1, x2) === diff(y1, y2);
    };
    const rook = (x1, y1, x2, y2) => {
        return x1 === x2 || y1 === y2;
    };
    const queen = (x1, y1, x2, y2) => {
        return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
    };
    function king(color, rookFiles, canCastle) {
        return (x1, y1, x2, y2) => (diff(x1, x2) < 2 && diff(y1, y2) < 2) ||
            (canCastle &&
                y1 === y2 &&
                y1 === (color === 'white' ? 0 : 7) &&
                ((x1 === 4 && ((x2 === 2 && rookFiles.includes(0)) || (x2 === 6 && rookFiles.includes(7)))) ||
                    rookFiles.includes(x2)));
    }
    function rookFilesOf(pieces, color) {
        const backrank = color === 'white' ? '1' : '8';
        const files = [];
        for (const [key, piece] of pieces) {
            if (key[1] === backrank && piece.color === color && piece.role === 'rook') {
                files.push(key2pos(key)[0]);
            }
        }
        return files;
    }
    function premove(pieces, key, canCastle) {
        const piece = pieces.get(key);
        if (!piece)
            return [];
        const pos = key2pos(key), r = piece.role, mobility = r === 'pawn'
            ? pawn(piece.color)
            : r === 'knight'
                ? knight
                : r === 'bishop'
                    ? bishop
                    : r === 'rook'
                        ? rook
                        : r === 'queen'
                            ? queen
                            : king(piece.color, rookFilesOf(pieces, piece.color), canCastle);
        return allPos
            .filter(pos2 => (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1]))
            .map(pos2key);
    }

    function callUserFunction(f, ...args) {
        if (f)
            setTimeout(() => f(...args), 1);
    }
    function toggleOrientation(state) {
        state.orientation = opposite$1(state.orientation);
        state.animation.current = state.draggable.current = state.selected = undefined;
    }
    function setPieces(state, pieces) {
        for (const [key, piece] of pieces) {
            if (piece)
                state.pieces.set(key, piece);
            else
                state.pieces.delete(key);
        }
    }
    function setCheck(state, color) {
        state.check = undefined;
        if (color === true)
            color = state.turnColor;
        if (color)
            for (const [k, p] of state.pieces) {
                if (p.role === 'king' && p.color === color) {
                    state.check = k;
                }
            }
    }
    function setPremove(state, orig, dest, meta) {
        unsetPredrop(state);
        state.premovable.current = [orig, dest];
        callUserFunction(state.premovable.events.set, orig, dest, meta);
    }
    function unsetPremove(state) {
        if (state.premovable.current) {
            state.premovable.current = undefined;
            callUserFunction(state.premovable.events.unset);
        }
    }
    function setPredrop(state, role, key) {
        unsetPremove(state);
        state.predroppable.current = { role, key };
        callUserFunction(state.predroppable.events.set, role, key);
    }
    function unsetPredrop(state) {
        const pd = state.predroppable;
        if (pd.current) {
            pd.current = undefined;
            callUserFunction(pd.events.unset);
        }
    }
    function tryAutoCastle(state, orig, dest) {
        if (!state.autoCastle)
            return false;
        const king = state.pieces.get(orig);
        if (!king || king.role !== 'king')
            return false;
        const origPos = key2pos(orig);
        const destPos = key2pos(dest);
        if ((origPos[1] !== 0 && origPos[1] !== 7) || origPos[1] !== destPos[1])
            return false;
        if (origPos[0] === 4 && !state.pieces.has(dest)) {
            if (destPos[0] === 6)
                dest = pos2key([7, destPos[1]]);
            else if (destPos[0] === 2)
                dest = pos2key([0, destPos[1]]);
        }
        const rook = state.pieces.get(dest);
        if (!rook || rook.color !== king.color || rook.role !== 'rook')
            return false;
        state.pieces.delete(orig);
        state.pieces.delete(dest);
        if (origPos[0] < destPos[0]) {
            state.pieces.set(pos2key([6, destPos[1]]), king);
            state.pieces.set(pos2key([5, destPos[1]]), rook);
        }
        else {
            state.pieces.set(pos2key([2, destPos[1]]), king);
            state.pieces.set(pos2key([3, destPos[1]]), rook);
        }
        return true;
    }
    function baseMove(state, orig, dest) {
        const origPiece = state.pieces.get(orig), destPiece = state.pieces.get(dest);
        if (orig === dest || !origPiece)
            return false;
        const captured = destPiece && destPiece.color !== origPiece.color ? destPiece : undefined;
        if (dest === state.selected)
            unselect(state);
        callUserFunction(state.events.move, orig, dest, captured);
        if (!tryAutoCastle(state, orig, dest)) {
            state.pieces.set(dest, origPiece);
            state.pieces.delete(orig);
        }
        state.lastMove = [orig, dest];
        state.check = undefined;
        callUserFunction(state.events.change);
        return captured || true;
    }
    function baseNewPiece(state, piece, key, force) {
        if (state.pieces.has(key)) {
            if (force)
                state.pieces.delete(key);
            else
                return false;
        }
        callUserFunction(state.events.dropNewPiece, piece, key);
        state.pieces.set(key, piece);
        state.lastMove = [key];
        state.check = undefined;
        callUserFunction(state.events.change);
        state.movable.dests = undefined;
        state.turnColor = opposite$1(state.turnColor);
        return true;
    }
    function baseUserMove(state, orig, dest) {
        const result = baseMove(state, orig, dest);
        if (result) {
            state.movable.dests = undefined;
            state.turnColor = opposite$1(state.turnColor);
            state.animation.current = undefined;
        }
        return result;
    }
    function userMove(state, orig, dest) {
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const holdTime = state.hold.stop();
                unselect(state);
                const metadata = {
                    premove: false,
                    ctrlKey: state.stats.ctrlKey,
                    holdTime,
                };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                return true;
            }
        }
        else if (canPremove(state, orig, dest)) {
            setPremove(state, orig, dest, {
                ctrlKey: state.stats.ctrlKey,
            });
            unselect(state);
            return true;
        }
        unselect(state);
        return false;
    }
    function dropNewPiece(state, orig, dest, force) {
        const piece = state.pieces.get(orig);
        if (piece && (canDrop(state, orig, dest) || force)) {
            state.pieces.delete(orig);
            baseNewPiece(state, piece, dest, force);
            callUserFunction(state.movable.events.afterNewPiece, piece.role, dest, {
                premove: false,
                predrop: false,
            });
        }
        else if (piece && canPredrop(state, orig, dest)) {
            setPredrop(state, piece.role, dest);
        }
        else {
            unsetPremove(state);
            unsetPredrop(state);
        }
        state.pieces.delete(orig);
        unselect(state);
    }
    function selectSquare(state, key, force) {
        callUserFunction(state.events.select, key);
        if (state.selected) {
            if (state.selected === key && !state.draggable.enabled) {
                unselect(state);
                state.hold.cancel();
                return;
            }
            else if ((state.selectable.enabled || force) && state.selected !== key) {
                if (userMove(state, state.selected, key)) {
                    state.stats.dragged = false;
                    return;
                }
            }
        }
        if (isMovable(state, key) || isPremovable(state, key)) {
            setSelected(state, key);
            state.hold.start();
        }
    }
    function setSelected(state, key) {
        state.selected = key;
        if (isPremovable(state, key)) {
            state.premovable.dests = premove(state.pieces, key, state.premovable.castle);
        }
        else
            state.premovable.dests = undefined;
    }
    function unselect(state) {
        state.selected = undefined;
        state.premovable.dests = undefined;
        state.hold.cancel();
    }
    function isMovable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function canMove(state, orig, dest) {
        var _a, _b;
        return (orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.get(orig)) === null || _b === void 0 ? void 0 : _b.includes(dest))));
    }
    function canDrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (orig === dest || !state.pieces.has(dest)) &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function isPremovable(state, orig) {
        const piece = state.pieces.get(orig);
        return !!piece && state.premovable.enabled && state.movable.color === piece.color && state.turnColor !== piece.color;
    }
    function canPremove(state, orig, dest) {
        return (orig !== dest && isPremovable(state, orig) && premove(state.pieces, orig, state.premovable.castle).includes(dest));
    }
    function canPredrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        const destPiece = state.pieces.get(dest);
        return (!!piece &&
            (!destPiece || destPiece.color !== state.movable.color) &&
            state.predroppable.enabled &&
            (piece.role !== 'pawn' || (dest[1] !== '1' && dest[1] !== '8')) &&
            state.movable.color === piece.color &&
            state.turnColor !== piece.color);
    }
    function isDraggable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            state.draggable.enabled &&
            (state.movable.color === 'both' ||
                (state.movable.color === piece.color && (state.turnColor === piece.color || state.premovable.enabled))));
    }
    function playPremove(state) {
        const move = state.premovable.current;
        if (!move)
            return false;
        const orig = move[0], dest = move[1];
        let success = false;
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const metadata = { premove: true };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                success = true;
            }
        }
        unsetPremove(state);
        return success;
    }
    function playPredrop(state, validate) {
        const drop = state.predroppable.current;
        let success = false;
        if (!drop)
            return false;
        if (validate(drop)) {
            const piece = {
                role: drop.role,
                color: state.movable.color,
            };
            if (baseNewPiece(state, piece, drop.key)) {
                callUserFunction(state.movable.events.afterNewPiece, drop.role, drop.key, {
                    premove: false,
                    predrop: true,
                });
                success = true;
            }
        }
        unsetPredrop(state);
        return success;
    }
    function cancelMove(state) {
        unsetPremove(state);
        unsetPredrop(state);
        unselect(state);
    }
    function stop(state) {
        state.movable.color = state.movable.dests = state.animation.current = undefined;
        cancelMove(state);
    }
    function getKeyAtDomPos(pos, asWhite, bounds) {
        let file = Math.floor((8 * (pos[0] - bounds.left)) / bounds.width);
        if (!asWhite)
            file = 7 - file;
        let rank = 7 - Math.floor((8 * (pos[1] - bounds.top)) / bounds.height);
        if (!asWhite)
            rank = 7 - rank;
        return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? pos2key([file, rank]) : undefined;
    }
    function getSnappedKeyAtDomPos(orig, pos, asWhite, bounds) {
        const origPos = key2pos(orig);
        const validSnapPos = allPos.filter(pos2 => {
            return queen(origPos[0], origPos[1], pos2[0], pos2[1]) || knight(origPos[0], origPos[1], pos2[0], pos2[1]);
        });
        const validSnapCenters = validSnapPos.map(pos2 => computeSquareCenter(pos2key(pos2), asWhite, bounds));
        const validSnapDistances = validSnapCenters.map(pos2 => distanceSq(pos, pos2));
        const [, closestSnapIndex] = validSnapDistances.reduce((a, b, index) => (a[0] < b ? a : [b, index]), [
            validSnapDistances[0],
            0,
        ]);
        return pos2key(validSnapPos[closestSnapIndex]);
    }
    function whitePov(s) {
        return s.orientation === 'white';
    }

    const initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const roles$1 = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
    };
    const letters = {
        pawn: 'p',
        rook: 'r',
        knight: 'n',
        bishop: 'b',
        queen: 'q',
        king: 'k',
    };
    function read(fen) {
        if (fen === 'start')
            fen = initial;
        const pieces = new Map();
        let row = 7, col = 0;
        for (const c of fen) {
            switch (c) {
                case ' ':
                    return pieces;
                case '/':
                    --row;
                    if (row < 0)
                        return pieces;
                    col = 0;
                    break;
                case '~': {
                    const piece = pieces.get(pos2key([col, row]));
                    if (piece)
                        piece.promoted = true;
                    break;
                }
                default: {
                    const nb = c.charCodeAt(0);
                    if (nb < 57)
                        col += nb - 48;
                    else {
                        const role = c.toLowerCase();
                        pieces.set(pos2key([col, row]), {
                            role: roles$1[role],
                            color: c === role ? 'black' : 'white',
                        });
                        ++col;
                    }
                }
            }
        }
        return pieces;
    }
    function write(pieces) {
        return invRanks
            .map(y => files
            .map(x => {
            const piece = pieces.get((x + y));
            if (piece) {
                const letter = letters[piece.role];
                return piece.color === 'white' ? letter.toUpperCase() : letter;
            }
            else
                return '1';
        })
            .join(''))
            .join('/')
            .replace(/1{2,}/g, s => s.length.toString());
    }

    function configure(state, config) {
        var _a, _b;
        // don't merge destinations and autoShapes. Just override.
        if ((_a = config.movable) === null || _a === void 0 ? void 0 : _a.dests)
            state.movable.dests = undefined;
        if ((_b = config.drawable) === null || _b === void 0 ? void 0 : _b.autoShapes)
            state.drawable.autoShapes = [];
        merge(state, config);
        // if a fen was provided, replace the pieces
        if (config.fen) {
            state.pieces = read(config.fen);
            state.drawable.shapes = [];
        }
        // apply config values that could be undefined yet meaningful
        if ('check' in config)
            setCheck(state, config.check || false);
        if ('lastMove' in config && !config.lastMove)
            state.lastMove = undefined;
        // in case of ZH drop last move, there's a single square.
        // if the previous last move had two squares,
        // the merge algorithm will incorrectly keep the second square.
        else if (config.lastMove)
            state.lastMove = config.lastMove;
        // fix move/premove dests
        if (state.selected)
            setSelected(state, state.selected);
        // no need for such short animations
        if (!state.animation.duration || state.animation.duration < 100)
            state.animation.enabled = false;
        if (!state.movable.rookCastle && state.movable.dests) {
            const rank = state.movable.color === 'white' ? '1' : '8', kingStartPos = ('e' + rank), dests = state.movable.dests.get(kingStartPos), king = state.pieces.get(kingStartPos);
            if (!dests || !king || king.role !== 'king')
                return;
            state.movable.dests.set(kingStartPos, dests.filter(d => !(d === 'a' + rank && dests.includes(('c' + rank))) &&
                !(d === 'h' + rank && dests.includes(('g' + rank)))));
        }
    }
    function merge(base, extend) {
        for (const key in extend) {
            if (isObject(base[key]) && isObject(extend[key]))
                merge(base[key], extend[key]);
            else
                base[key] = extend[key];
        }
    }
    function isObject(o) {
        return typeof o === 'object';
    }

    function anim(mutation, state) {
        return state.animation.enabled ? animate(mutation, state) : render$6(mutation, state);
    }
    function render$6(mutation, state) {
        const result = mutation(state);
        state.dom.redraw();
        return result;
    }
    function makePiece$1(key, piece) {
        return {
            key: key,
            pos: key2pos(key),
            piece: piece,
        };
    }
    function closer(piece, pieces) {
        return pieces.sort((p1, p2) => {
            return distanceSq(piece.pos, p1.pos) - distanceSq(piece.pos, p2.pos);
        })[0];
    }
    function computePlan(prevPieces, current) {
        const anims = new Map(), animedOrigs = [], fadings = new Map(), missings = [], news = [], prePieces = new Map();
        let curP, preP, vector;
        for (const [k, p] of prevPieces) {
            prePieces.set(k, makePiece$1(k, p));
        }
        for (const key of allKeys) {
            curP = current.pieces.get(key);
            preP = prePieces.get(key);
            if (curP) {
                if (preP) {
                    if (!samePiece(curP, preP.piece)) {
                        missings.push(preP);
                        news.push(makePiece$1(key, curP));
                    }
                }
                else
                    news.push(makePiece$1(key, curP));
            }
            else if (preP)
                missings.push(preP);
        }
        for (const newP of news) {
            preP = closer(newP, missings.filter(p => samePiece(newP.piece, p.piece)));
            if (preP) {
                vector = [preP.pos[0] - newP.pos[0], preP.pos[1] - newP.pos[1]];
                anims.set(newP.key, vector.concat(vector));
                animedOrigs.push(preP.key);
            }
        }
        for (const p of missings) {
            if (!animedOrigs.includes(p.key))
                fadings.set(p.key, p.piece);
        }
        return {
            anims: anims,
            fadings: fadings,
        };
    }
    function step(state, now) {
        const cur = state.animation.current;
        if (cur === undefined) {
            // animation was canceled :(
            if (!state.dom.destroyed)
                state.dom.redrawNow();
            return;
        }
        const rest = 1 - (now - cur.start) * cur.frequency;
        if (rest <= 0) {
            state.animation.current = undefined;
            state.dom.redrawNow();
        }
        else {
            const ease = easing(rest);
            for (const cfg of cur.plan.anims.values()) {
                cfg[2] = cfg[0] * ease;
                cfg[3] = cfg[1] * ease;
            }
            state.dom.redrawNow(true); // optimisation: don't render SVG changes during animations
            requestAnimationFrame((now = performance.now()) => step(state, now));
        }
    }
    function animate(mutation, state) {
        // clone state before mutating it
        const prevPieces = new Map(state.pieces);
        const result = mutation(state);
        const plan = computePlan(prevPieces, state);
        if (plan.anims.size || plan.fadings.size) {
            const alreadyRunning = state.animation.current && state.animation.current.start;
            state.animation.current = {
                start: performance.now(),
                frequency: 1 / state.animation.duration,
                plan: plan,
            };
            if (!alreadyRunning)
                step(state, performance.now());
        }
        else {
            // don't animate, just render right away
            state.dom.redraw();
        }
        return result;
    }
    // https://gist.github.com/gre/1650294
    function easing(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    const brushes = ['green', 'red', 'blue', 'yellow'];
    function start$5(state, e) {
        // support one finger touch only
        if (e.touches && e.touches.length > 1)
            return;
        e.stopPropagation();
        e.preventDefault();
        e.ctrlKey ? unselect(state) : cancelMove(state);
        const pos = eventPosition$1(e), orig = getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
        if (!orig)
            return;
        state.drawable.current = {
            orig,
            pos,
            brush: eventBrush(e),
            snapToValidMove: state.drawable.defaultSnapToValidMove,
        };
        processDraw(state);
    }
    function processDraw(state) {
        requestAnimationFrame(() => {
            const cur = state.drawable.current;
            if (cur) {
                const keyAtDomPos = getKeyAtDomPos(cur.pos, whitePov(state), state.dom.bounds());
                if (!keyAtDomPos) {
                    cur.snapToValidMove = false;
                }
                const mouseSq = cur.snapToValidMove
                    ? getSnappedKeyAtDomPos(cur.orig, cur.pos, whitePov(state), state.dom.bounds())
                    : keyAtDomPos;
                if (mouseSq !== cur.mouseSq) {
                    cur.mouseSq = mouseSq;
                    cur.dest = mouseSq !== cur.orig ? mouseSq : undefined;
                    state.dom.redrawNow();
                }
                processDraw(state);
            }
        });
    }
    function move$1(state, e) {
        if (state.drawable.current)
            state.drawable.current.pos = eventPosition$1(e);
    }
    function end$1(state) {
        const cur = state.drawable.current;
        if (cur) {
            if (cur.mouseSq)
                addShape(state.drawable, cur);
            cancel$2(state);
        }
    }
    function cancel$2(state) {
        if (state.drawable.current) {
            state.drawable.current = undefined;
            state.dom.redraw();
        }
    }
    function clear(state) {
        if (state.drawable.shapes.length) {
            state.drawable.shapes = [];
            state.dom.redraw();
            onChange(state.drawable);
        }
    }
    function eventBrush(e) {
        var _a;
        const modA = (e.shiftKey || e.ctrlKey) && isRightButton(e);
        const modB = e.altKey || e.metaKey || ((_a = e.getModifierState) === null || _a === void 0 ? void 0 : _a.call(e, 'AltGraph'));
        return brushes[(modA ? 1 : 0) + (modB ? 2 : 0)];
    }
    function addShape(drawable, cur) {
        const sameShape = (s) => s.orig === cur.orig && s.dest === cur.dest;
        const similar = drawable.shapes.find(sameShape);
        if (similar)
            drawable.shapes = drawable.shapes.filter(s => !sameShape(s));
        if (!similar || similar.brush !== cur.brush)
            drawable.shapes.push(cur);
        onChange(drawable);
    }
    function onChange(drawable) {
        if (drawable.onChange)
            drawable.onChange(drawable.shapes);
    }

    function start$4(s, e) {
        if (!e.isTrusted || (e.button !== undefined && e.button !== 0))
            return; // only touch or left click
        if (e.touches && e.touches.length > 1)
            return; // support one finger touch only
        const bounds = s.dom.bounds(), position = eventPosition$1(e), orig = getKeyAtDomPos(position, whitePov(s), bounds);
        if (!orig)
            return;
        const piece = s.pieces.get(orig);
        const previouslySelected = s.selected;
        if (!previouslySelected && s.drawable.enabled && (s.drawable.eraseOnClick || !piece || piece.color !== s.turnColor))
            clear(s);
        // Prevent touch scroll and create no corresponding mouse event, if there
        // is an intent to interact with the board. If no color is movable
        // (and the board is not for viewing only), touches are likely intended to
        // select squares.
        if (e.cancelable !== false &&
            (!e.touches || !s.movable.color || piece || previouslySelected || pieceCloseTo(s, position)))
            e.preventDefault();
        const hadPremove = !!s.premovable.current;
        const hadPredrop = !!s.predroppable.current;
        s.stats.ctrlKey = e.ctrlKey;
        if (s.selected && canMove(s, s.selected, orig)) {
            anim(state => selectSquare(state, orig), s);
        }
        else {
            selectSquare(s, orig);
        }
        const stillSelected = s.selected === orig;
        const element = pieceElementByKey(s, orig);
        if (piece && element && stillSelected && isDraggable(s, orig)) {
            s.draggable.current = {
                orig,
                piece,
                origPos: position,
                pos: position,
                started: s.draggable.autoDistance && s.stats.dragged,
                element,
                previouslySelected,
                originTarget: e.target,
            };
            element.cgDragging = true;
            element.classList.add('dragging');
            // place ghost
            const ghost = s.dom.elements.ghost;
            if (ghost) {
                ghost.className = `ghost ${piece.color} ${piece.role}`;
                translateAbs(ghost, posToTranslateAbs(bounds)(key2pos(orig), whitePov(s)));
                setVisible(ghost, true);
            }
            processDrag(s);
        }
        else {
            if (hadPremove)
                unsetPremove(s);
            if (hadPredrop)
                unsetPredrop(s);
        }
        s.dom.redraw();
    }
    function pieceCloseTo(s, pos) {
        const asWhite = whitePov(s), bounds = s.dom.bounds(), radiusSq = Math.pow(bounds.width / 8, 2);
        for (const key in s.pieces) {
            const center = computeSquareCenter(key, asWhite, bounds);
            if (distanceSq(center, pos) <= radiusSq)
                return true;
        }
        return false;
    }
    function dragNewPiece(s, piece, e, force) {
        const key = 'a0';
        s.pieces.set(key, piece);
        s.dom.redraw();
        const position = eventPosition$1(e);
        s.draggable.current = {
            orig: key,
            piece,
            origPos: position,
            pos: position,
            started: true,
            element: () => pieceElementByKey(s, key),
            originTarget: e.target,
            newPiece: true,
            force: !!force,
        };
        processDrag(s);
    }
    function processDrag(s) {
        requestAnimationFrame(() => {
            var _a;
            const cur = s.draggable.current;
            if (!cur)
                return;
            // cancel animations while dragging
            if ((_a = s.animation.current) === null || _a === void 0 ? void 0 : _a.plan.anims.has(cur.orig))
                s.animation.current = undefined;
            // if moving piece is gone, cancel
            const origPiece = s.pieces.get(cur.orig);
            if (!origPiece || !samePiece(origPiece, cur.piece))
                cancel$1(s);
            else {
                if (!cur.started && distanceSq(cur.pos, cur.origPos) >= Math.pow(s.draggable.distance, 2))
                    cur.started = true;
                if (cur.started) {
                    // support lazy elements
                    if (typeof cur.element === 'function') {
                        const found = cur.element();
                        if (!found)
                            return;
                        found.cgDragging = true;
                        found.classList.add('dragging');
                        cur.element = found;
                    }
                    const bounds = s.dom.bounds();
                    translateAbs(cur.element, [
                        cur.pos[0] - bounds.left - bounds.width / 16,
                        cur.pos[1] - bounds.top - bounds.height / 16,
                    ]);
                }
            }
            processDrag(s);
        });
    }
    function move(s, e) {
        // support one finger touch only
        if (s.draggable.current && (!e.touches || e.touches.length < 2)) {
            s.draggable.current.pos = eventPosition$1(e);
        }
    }
    function end(s, e) {
        const cur = s.draggable.current;
        if (!cur)
            return;
        // create no corresponding mouse event
        if (e.type === 'touchend' && e.cancelable !== false)
            e.preventDefault();
        // comparing with the origin target is an easy way to test that the end event
        // has the same touch origin
        if (e.type === 'touchend' && cur.originTarget !== e.target && !cur.newPiece) {
            s.draggable.current = undefined;
            return;
        }
        unsetPremove(s);
        unsetPredrop(s);
        // touchend has no position; so use the last touchmove position instead
        const eventPos = eventPosition$1(e) || cur.pos;
        const dest = getKeyAtDomPos(eventPos, whitePov(s), s.dom.bounds());
        if (dest && cur.started && cur.orig !== dest) {
            if (cur.newPiece)
                dropNewPiece(s, cur.orig, dest, cur.force);
            else {
                s.stats.ctrlKey = e.ctrlKey;
                if (userMove(s, cur.orig, dest))
                    s.stats.dragged = true;
            }
        }
        else if (cur.newPiece) {
            s.pieces.delete(cur.orig);
        }
        else if (s.draggable.deleteOnDropOff && !dest) {
            s.pieces.delete(cur.orig);
            callUserFunction(s.events.change);
        }
        if (cur.orig === cur.previouslySelected && (cur.orig === dest || !dest))
            unselect(s);
        else if (!s.selectable.enabled)
            unselect(s);
        removeDragElements(s);
        s.draggable.current = undefined;
        s.dom.redraw();
    }
    function cancel$1(s) {
        const cur = s.draggable.current;
        if (cur) {
            if (cur.newPiece)
                s.pieces.delete(cur.orig);
            s.draggable.current = undefined;
            unselect(s);
            removeDragElements(s);
            s.dom.redraw();
        }
    }
    function removeDragElements(s) {
        const e = s.dom.elements;
        if (e.ghost)
            setVisible(e.ghost, false);
    }
    function pieceElementByKey(s, key) {
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if (el.cgKey === key && el.tagName === 'PIECE')
                return el;
            el = el.nextSibling;
        }
        return;
    }

    function explosion(state, keys) {
        state.exploding = { stage: 1, keys };
        state.dom.redraw();
        setTimeout(() => {
            setStage(state, 2);
            setTimeout(() => setStage(state, undefined), 120);
        }, 120);
    }
    function setStage(state, stage) {
        if (state.exploding) {
            if (stage)
                state.exploding.stage = stage;
            else
                state.exploding = undefined;
            state.dom.redraw();
        }
    }

    // see API types and documentations in dts/api.d.ts
    function start$3(state, redrawAll) {
        function toggleOrientation$1() {
            toggleOrientation(state);
            redrawAll();
        }
        return {
            set(config) {
                if (config.orientation && config.orientation !== state.orientation)
                    toggleOrientation$1();
                (config.fen ? anim : render$6)(state => configure(state, config), state);
            },
            state,
            getFen: () => write(state.pieces),
            toggleOrientation: toggleOrientation$1,
            setPieces(pieces) {
                anim(state => setPieces(state, pieces), state);
            },
            selectSquare(key, force) {
                if (key)
                    anim(state => selectSquare(state, key, force), state);
                else if (state.selected) {
                    unselect(state);
                    state.dom.redraw();
                }
            },
            move(orig, dest) {
                anim(state => baseMove(state, orig, dest), state);
            },
            newPiece(piece, key) {
                anim(state => baseNewPiece(state, piece, key), state);
            },
            playPremove() {
                if (state.premovable.current) {
                    if (anim(playPremove, state))
                        return true;
                    // if the premove couldn't be played, redraw to clear it up
                    state.dom.redraw();
                }
                return false;
            },
            playPredrop(validate) {
                if (state.predroppable.current) {
                    const result = playPredrop(state, validate);
                    state.dom.redraw();
                    return result;
                }
                return false;
            },
            cancelPremove() {
                render$6(unsetPremove, state);
            },
            cancelPredrop() {
                render$6(unsetPredrop, state);
            },
            cancelMove() {
                render$6(state => {
                    cancelMove(state);
                    cancel$1(state);
                }, state);
            },
            stop() {
                render$6(state => {
                    stop(state);
                    cancel$1(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$6(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$6(state => (state.drawable.shapes = shapes), state);
            },
            getKeyAtDomPos(pos) {
                return getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
            },
            redrawAll,
            dragNewPiece(piece, event, force) {
                dragNewPiece(state, piece, event, force);
            },
            destroy() {
                stop(state);
                state.dom.unbind && state.dom.unbind();
                state.dom.destroyed = true;
            },
        };
    }

    function defaults() {
        return {
            pieces: read(initial),
            orientation: 'white',
            turnColor: 'white',
            coordinates: true,
            autoCastle: true,
            viewOnly: false,
            disableContextMenu: false,
            resizable: true,
            addPieceZIndex: false,
            pieceKey: false,
            highlight: {
                lastMove: true,
                check: true,
            },
            animation: {
                enabled: true,
                duration: 200,
            },
            movable: {
                free: true,
                color: 'both',
                showDests: true,
                events: {},
                rookCastle: true,
            },
            premovable: {
                enabled: true,
                showDests: true,
                castle: true,
                events: {},
            },
            predroppable: {
                enabled: false,
                events: {},
            },
            draggable: {
                enabled: true,
                distance: 3,
                autoDistance: true,
                showGhost: true,
                deleteOnDropOff: false,
            },
            dropmode: {
                active: false,
            },
            selectable: {
                enabled: true,
            },
            stats: {
                // on touchscreen, default to "tap-tap" moves
                // instead of drag
                dragged: !('ontouchstart' in window),
            },
            events: {},
            drawable: {
                enabled: true,
                visible: true,
                defaultSnapToValidMove: true,
                eraseOnClick: true,
                shapes: [],
                autoShapes: [],
                brushes: {
                    green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
                    red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
                    blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
                    yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
                    paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
                    paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
                    paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
                    paleGrey: {
                        key: 'pgr',
                        color: '#4a4a4a',
                        opacity: 0.35,
                        lineWidth: 15,
                    },
                },
                pieces: {
                    baseUrl: 'https://lichess1.org/assets/piece/cburnett/',
                },
                prevSvgHash: '',
            },
            hold: timer(),
        };
    }

    function createElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
    function renderSvg(state, svg, customSvg) {
        const d = state.drawable, curD = d.current, cur = curD && curD.mouseSq ? curD : undefined, arrowDests = new Map(), bounds = state.dom.bounds();
        for (const s of d.shapes.concat(d.autoShapes).concat(cur ? [cur] : [])) {
            if (s.dest)
                arrowDests.set(s.dest, (arrowDests.get(s.dest) || 0) + 1);
        }
        const shapes = d.shapes.concat(d.autoShapes).map((s) => {
            return {
                shape: s,
                current: false,
                hash: shapeHash(s, arrowDests, false, bounds),
            };
        });
        if (cur)
            shapes.push({
                shape: cur,
                current: true,
                hash: shapeHash(cur, arrowDests, true, bounds),
            });
        const fullHash = shapes.map(sc => sc.hash).join(';');
        if (fullHash === state.drawable.prevSvgHash)
            return;
        state.drawable.prevSvgHash = fullHash;
        /*
          -- DOM hierarchy --
          <svg class="cg-shapes">      (<= svg)
            <defs>
              ...(for brushes)...
            </defs>
            <g>
              ...(for arrows, circles, and pieces)...
            </g>
          </svg>
          <svg class="cg-custom-svgs"> (<= customSvg)
            <g>
              ...(for custom svgs)...
            </g>
          </svg>
        */
        const defsEl = svg.querySelector('defs');
        const shapesEl = svg.querySelector('g');
        const customSvgsEl = customSvg.querySelector('g');
        syncDefs(d, shapes, defsEl);
        syncShapes(state, shapes.filter(s => !s.shape.customSvg), d.brushes, arrowDests, shapesEl);
        syncShapes(state, shapes.filter(s => s.shape.customSvg), d.brushes, arrowDests, customSvgsEl);
    }
    // append only. Don't try to update/remove.
    function syncDefs(d, shapes, defsEl) {
        const brushes = new Map();
        let brush;
        for (const s of shapes) {
            if (s.shape.dest) {
                brush = d.brushes[s.shape.brush];
                if (s.shape.modifiers)
                    brush = makeCustomBrush(brush, s.shape.modifiers);
                brushes.set(brush.key, brush);
            }
        }
        const keysInDom = new Set();
        let el = defsEl.firstChild;
        while (el) {
            keysInDom.add(el.getAttribute('cgKey'));
            el = el.nextSibling;
        }
        for (const [key, brush] of brushes.entries()) {
            if (!keysInDom.has(key))
                defsEl.appendChild(renderMarker(brush));
        }
    }
    // append and remove only. No updates.
    function syncShapes(state, shapes, brushes, arrowDests, root) {
        const bounds = state.dom.bounds(), hashesInDom = new Map(), // by hash
        toRemove = [];
        for (const sc of shapes)
            hashesInDom.set(sc.hash, false);
        let el = root.firstChild, elHash;
        while (el) {
            elHash = el.getAttribute('cgHash');
            // found a shape element that's here to stay
            if (hashesInDom.has(elHash))
                hashesInDom.set(elHash, true);
            // or remove it
            else
                toRemove.push(el);
            el = el.nextSibling;
        }
        // remove old shapes
        for (const el of toRemove)
            root.removeChild(el);
        // insert shapes that are not yet in dom
        for (const sc of shapes) {
            if (!hashesInDom.get(sc.hash))
                root.appendChild(renderShape(state, sc, brushes, arrowDests, bounds));
        }
    }
    function shapeHash({ orig, dest, brush, piece, modifiers, customSvg }, arrowDests, current, bounds) {
        return [
            bounds.width,
            bounds.height,
            current,
            orig,
            dest,
            brush,
            dest && (arrowDests.get(dest) || 0) > 1,
            piece && pieceHash(piece),
            modifiers && modifiersHash(modifiers),
            customSvg && customSvgHash(customSvg),
        ]
            .filter(x => x)
            .join(',');
    }
    function pieceHash(piece) {
        return [piece.color, piece.role, piece.scale].filter(x => x).join(',');
    }
    function modifiersHash(m) {
        return '' + (m.lineWidth || '');
    }
    function customSvgHash(s) {
        // Rolling hash with base 31 (cf. https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript)
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = (((h << 5) - h) + s.charCodeAt(i)) >>> 0;
        }
        return 'custom-' + h.toString();
    }
    function renderShape(state, { shape, current, hash }, brushes, arrowDests, bounds) {
        let el;
        if (shape.customSvg) {
            const orig = orient(key2pos(shape.orig), state.orientation);
            el = renderCustomSvg(shape.customSvg, orig, bounds);
        }
        else if (shape.piece)
            el = renderPiece(state.drawable.pieces.baseUrl, orient(key2pos(shape.orig), state.orientation), shape.piece, bounds);
        else {
            const orig = orient(key2pos(shape.orig), state.orientation);
            if (shape.dest) {
                let brush = brushes[shape.brush];
                if (shape.modifiers)
                    brush = makeCustomBrush(brush, shape.modifiers);
                el = renderArrow(brush, orig, orient(key2pos(shape.dest), state.orientation), current, (arrowDests.get(shape.dest) || 0) > 1, bounds);
            }
            else
                el = renderCircle(brushes[shape.brush], orig, current, bounds);
        }
        el.setAttribute('cgHash', hash);
        return el;
    }
    function renderCustomSvg(customSvg, pos, bounds) {
        const { width, height } = bounds;
        const w = width / 8;
        const h = height / 8;
        const x = pos[0] * w;
        const y = (7 - pos[1]) * h;
        // Translate to top-left of `orig` square
        const g = setAttributes(createElement('g'), { transform: `translate(${x},${y})` });
        // Give 100x100 coordinate system to the user for `orig` square
        const svg = setAttributes(createElement('svg'), { width: w, height: h, viewBox: '0 0 100 100' });
        g.appendChild(svg);
        svg.innerHTML = customSvg;
        return g;
    }
    function renderCircle(brush, pos, current, bounds) {
        const o = pos2px(pos, bounds), widths = circleWidth(bounds), radius = (bounds.width + bounds.height) / 32;
        return setAttributes(createElement('circle'), {
            stroke: brush.color,
            'stroke-width': widths[current ? 0 : 1],
            fill: 'none',
            opacity: opacity(brush, current),
            cx: o[0],
            cy: o[1],
            r: radius - widths[1] / 2,
        });
    }
    function renderArrow(brush, orig, dest, current, shorten, bounds) {
        const m = arrowMargin(bounds, shorten && !current), a = pos2px(orig, bounds), b = pos2px(dest, bounds), dx = b[0] - a[0], dy = b[1] - a[1], angle = Math.atan2(dy, dx), xo = Math.cos(angle) * m, yo = Math.sin(angle) * m;
        return setAttributes(createElement('line'), {
            stroke: brush.color,
            'stroke-width': lineWidth(brush, current, bounds),
            'stroke-linecap': 'round',
            'marker-end': 'url(#arrowhead-' + brush.key + ')',
            opacity: opacity(brush, current),
            x1: a[0],
            y1: a[1],
            x2: b[0] - xo,
            y2: b[1] - yo,
        });
    }
    function renderPiece(baseUrl, pos, piece, bounds) {
        const o = pos2px(pos, bounds), size = (bounds.width / 8) * (piece.scale || 1), name = piece.color[0] + (piece.role === 'knight' ? 'n' : piece.role[0]).toUpperCase();
        return setAttributes(createElement('image'), {
            className: `${piece.role} ${piece.color}`,
            x: o[0] - size / 2,
            y: o[1] - size / 2,
            width: size,
            height: size,
            href: baseUrl + name + '.svg',
        });
    }
    function renderMarker(brush) {
        const marker = setAttributes(createElement('marker'), {
            id: 'arrowhead-' + brush.key,
            orient: 'auto',
            markerWidth: 4,
            markerHeight: 8,
            refX: 2.05,
            refY: 2.01,
        });
        marker.appendChild(setAttributes(createElement('path'), {
            d: 'M0,0 V4 L3,2 Z',
            fill: brush.color,
        }));
        marker.setAttribute('cgKey', brush.key);
        return marker;
    }
    function setAttributes(el, attrs) {
        for (const key in attrs)
            el.setAttribute(key, attrs[key]);
        return el;
    }
    function orient(pos, color) {
        return color === 'white' ? pos : [7 - pos[0], 7 - pos[1]];
    }
    function makeCustomBrush(base, modifiers) {
        return {
            color: base.color,
            opacity: Math.round(base.opacity * 10) / 10,
            lineWidth: Math.round(modifiers.lineWidth || base.lineWidth),
            key: [base.key, modifiers.lineWidth].filter(x => x).join(''),
        };
    }
    function circleWidth(bounds) {
        const base = bounds.width / 512;
        return [3 * base, 4 * base];
    }
    function lineWidth(brush, current, bounds) {
        return (((brush.lineWidth || 10) * (current ? 0.85 : 1)) / 512) * bounds.width;
    }
    function opacity(brush, current) {
        return (brush.opacity || 1) * (current ? 0.9 : 1);
    }
    function arrowMargin(bounds, shorten) {
        return ((shorten ? 20 : 10) / 512) * bounds.width;
    }
    function pos2px(pos, bounds) {
        return [((pos[0] + 0.5) * bounds.width) / 8, ((7.5 - pos[1]) * bounds.height) / 8];
    }

    function renderWrap(element, s, relative) {
        // .cg-wrap (element passed to Chessground)
        //   cg-helper (12.5%, display: table)
        //     cg-container (800%)
        //       cg-board
        //       svg.cg-shapes
        //         defs
        //         g
        //       svg.cg-custom-svgs
        //         g
        //       coords.ranks
        //       coords.files
        //       piece.ghost
        element.innerHTML = '';
        // ensure the cg-wrap class is set
        // so bounds calculation can use the CSS width/height values
        // add that class yourself to the element before calling chessground
        // for a slight performance improvement! (avoids recomputing style)
        element.classList.add('cg-wrap');
        for (const c of colors)
            element.classList.toggle('orientation-' + c, s.orientation === c);
        element.classList.toggle('manipulable', !s.viewOnly);
        const helper = createEl('cg-helper');
        element.appendChild(helper);
        const container = createEl('cg-container');
        helper.appendChild(container);
        const board = createEl('cg-board');
        container.appendChild(board);
        let svg;
        let customSvg;
        if (s.drawable.visible && !relative) {
            svg = setAttributes(createElement('svg'), { class: 'cg-shapes' });
            svg.appendChild(createElement('defs'));
            svg.appendChild(createElement('g'));
            customSvg = setAttributes(createElement('svg'), { class: 'cg-custom-svgs' });
            customSvg.appendChild(createElement('g'));
            container.appendChild(svg);
            container.appendChild(customSvg);
        }
        if (s.coordinates) {
            const orientClass = s.orientation === 'black' ? ' black' : '';
            container.appendChild(renderCoords(ranks, 'ranks' + orientClass));
            container.appendChild(renderCoords(files, 'files' + orientClass));
        }
        let ghost;
        if (s.draggable.showGhost && !relative) {
            ghost = createEl('piece', 'ghost');
            setVisible(ghost, false);
            container.appendChild(ghost);
        }
        return {
            board,
            container,
            ghost,
            svg,
            customSvg,
        };
    }
    function renderCoords(elems, className) {
        const el = createEl('coords', className);
        let f;
        for (const elem of elems) {
            f = createEl('coord');
            f.textContent = elem;
            el.appendChild(f);
        }
        return el;
    }

    function drop(s, e) {
        if (!s.dropmode.active)
            return;
        unsetPremove(s);
        unsetPredrop(s);
        const piece = s.dropmode.piece;
        if (piece) {
            s.pieces.set('a0', piece);
            const position = eventPosition$1(e);
            const dest = position && getKeyAtDomPos(position, whitePov(s), s.dom.bounds());
            if (dest)
                dropNewPiece(s, 'a0', dest);
        }
        s.dom.redraw();
    }

    function bindBoard(s, boundsUpdated) {
        const boardEl = s.dom.elements.board;
        if (!s.dom.relative && s.resizable && 'ResizeObserver' in window) {
            const observer = new window['ResizeObserver'](boundsUpdated);
            observer.observe(boardEl);
        }
        if (s.viewOnly)
            return;
        // Cannot be passive, because we prevent touch scrolling and dragging of
        // selected elements.
        const onStart = startDragOrDraw(s);
        boardEl.addEventListener('touchstart', onStart, {
            passive: false,
        });
        boardEl.addEventListener('mousedown', onStart, {
            passive: false,
        });
        if (s.disableContextMenu || s.drawable.enabled) {
            boardEl.addEventListener('contextmenu', e => e.preventDefault());
        }
    }
    // returns the unbind function
    function bindDocument(s, boundsUpdated) {
        const unbinds = [];
        // Old versions of Edge and Safari do not support ResizeObserver. Send
        // chessground.resize if a user action has changed the bounds of the board.
        if (!s.dom.relative && s.resizable && !('ResizeObserver' in window)) {
            unbinds.push(unbindable(document.body, 'chessground.resize', boundsUpdated));
        }
        if (!s.viewOnly) {
            const onmove = dragOrDraw(s, move, move$1);
            const onend = dragOrDraw(s, end, end$1);
            for (const ev of ['touchmove', 'mousemove'])
                unbinds.push(unbindable(document, ev, onmove));
            for (const ev of ['touchend', 'mouseup'])
                unbinds.push(unbindable(document, ev, onend));
            const onScroll = () => s.dom.bounds.clear();
            unbinds.push(unbindable(document, 'scroll', onScroll, { capture: true, passive: true }));
            unbinds.push(unbindable(window, 'resize', onScroll, { passive: true }));
        }
        return () => unbinds.forEach(f => f());
    }
    function unbindable(el, eventName, callback, options) {
        el.addEventListener(eventName, callback, options);
        return () => el.removeEventListener(eventName, callback, options);
    }
    function startDragOrDraw(s) {
        return e => {
            if (s.draggable.current)
                cancel$1(s);
            else if (s.drawable.current)
                cancel$2(s);
            else if (e.shiftKey || isRightButton(e)) {
                if (s.drawable.enabled)
                    start$5(s, e);
            }
            else if (!s.viewOnly) {
                if (s.dropmode.active)
                    drop(s, e);
                else
                    start$4(s, e);
            }
        };
    }
    function dragOrDraw(s, withDrag, withDraw) {
        return e => {
            if (s.drawable.current) {
                if (s.drawable.enabled)
                    withDraw(s, e);
            }
            else if (!s.viewOnly)
                withDrag(s, e);
        };
    }

    // ported from https://github.com/veloce/lichobile/blob/master/src/js/chessground/view.js
    // in case of bugs, blame @veloce
    function render$5(s) {
        const asWhite = whitePov(s), posToTranslate = s.dom.relative ? posToTranslateRel : posToTranslateAbs(s.dom.bounds()), translate = s.dom.relative ? translateRel : translateAbs, boardEl = s.dom.elements.board, pieces = s.pieces, curAnim = s.animation.current, anims = curAnim ? curAnim.plan.anims : new Map(), fadings = curAnim ? curAnim.plan.fadings : new Map(), curDrag = s.draggable.current, squares = computeSquareClasses(s), samePieces = new Set(), sameSquares = new Set(), movedPieces = new Map(), movedSquares = new Map(); // by class name
        let k, el, pieceAtKey, elPieceName, anim, fading, pMvdset, pMvd, sMvdset, sMvd;
        // walk over all board dom elements, apply animations and flag moved pieces
        el = boardEl.firstChild;
        while (el) {
            k = el.cgKey;
            if (isPieceNode(el)) {
                pieceAtKey = pieces.get(k);
                anim = anims.get(k);
                fading = fadings.get(k);
                elPieceName = el.cgPiece;
                // if piece not being dragged anymore, remove dragging style
                if (el.cgDragging && (!curDrag || curDrag.orig !== k)) {
                    el.classList.remove('dragging');
                    translate(el, posToTranslate(key2pos(k), asWhite));
                    el.cgDragging = false;
                }
                // remove fading class if it still remains
                if (!fading && el.cgFading) {
                    el.cgFading = false;
                    el.classList.remove('fading');
                }
                // there is now a piece at this dom key
                if (pieceAtKey) {
                    // continue animation if already animating and same piece
                    // (otherwise it could animate a captured piece)
                    if (anim && el.cgAnimating && elPieceName === pieceNameOf(pieceAtKey)) {
                        const pos = key2pos(k);
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                        el.classList.add('anim');
                        translate(el, posToTranslate(pos, asWhite));
                    }
                    else if (el.cgAnimating) {
                        el.cgAnimating = false;
                        el.classList.remove('anim');
                        translate(el, posToTranslate(key2pos(k), asWhite));
                        if (s.addPieceZIndex)
                            el.style.zIndex = posZIndex(key2pos(k), asWhite);
                    }
                    // same piece: flag as same
                    if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.cgFading)) {
                        samePieces.add(k);
                    }
                    // different piece: flag as moved unless it is a fading piece
                    else {
                        if (fading && elPieceName === pieceNameOf(fading)) {
                            el.classList.add('fading');
                            el.cgFading = true;
                        }
                        else {
                            appendValue(movedPieces, elPieceName, el);
                        }
                    }
                }
                // no piece: flag as moved
                else {
                    appendValue(movedPieces, elPieceName, el);
                }
            }
            else if (isSquareNode(el)) {
                const cn = el.className;
                if (squares.get(k) === cn)
                    sameSquares.add(k);
                else
                    appendValue(movedSquares, cn, el);
            }
            el = el.nextSibling;
        }
        // walk over all squares in current set, apply dom changes to moved squares
        // or append new squares
        for (const [sk, className] of squares) {
            if (!sameSquares.has(sk)) {
                sMvdset = movedSquares.get(className);
                sMvd = sMvdset && sMvdset.pop();
                const translation = posToTranslate(key2pos(sk), asWhite);
                if (sMvd) {
                    sMvd.cgKey = sk;
                    translate(sMvd, translation);
                }
                else {
                    const squareNode = createEl('square', className);
                    squareNode.cgKey = sk;
                    translate(squareNode, translation);
                    boardEl.insertBefore(squareNode, boardEl.firstChild);
                }
            }
        }
        // walk over all pieces in current set, apply dom changes to moved pieces
        // or append new pieces
        for (const [k, p] of pieces) {
            anim = anims.get(k);
            if (!samePieces.has(k)) {
                pMvdset = movedPieces.get(pieceNameOf(p));
                pMvd = pMvdset && pMvdset.pop();
                // a same piece was moved
                if (pMvd) {
                    // apply dom changes
                    pMvd.cgKey = k;
                    if (pMvd.cgFading) {
                        pMvd.classList.remove('fading');
                        pMvd.cgFading = false;
                    }
                    const pos = key2pos(k);
                    if (s.addPieceZIndex)
                        pMvd.style.zIndex = posZIndex(pos, asWhite);
                    if (anim) {
                        pMvd.cgAnimating = true;
                        pMvd.classList.add('anim');
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pMvd, posToTranslate(pos, asWhite));
                }
                // no piece in moved obj: insert the new piece
                // assumes the new piece is not being dragged
                else {
                    const pieceName = pieceNameOf(p), pieceNode = createEl('piece', pieceName), pos = key2pos(k);
                    pieceNode.cgPiece = pieceName;
                    pieceNode.cgKey = k;
                    if (anim) {
                        pieceNode.cgAnimating = true;
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pieceNode, posToTranslate(pos, asWhite));
                    if (s.addPieceZIndex)
                        pieceNode.style.zIndex = posZIndex(pos, asWhite);
                    boardEl.appendChild(pieceNode);
                }
            }
        }
        // remove any element that remains in the moved sets
        for (const nodes of movedPieces.values())
            removeNodes(s, nodes);
        for (const nodes of movedSquares.values())
            removeNodes(s, nodes);
    }
    function updateBounds(s) {
        if (s.dom.relative)
            return;
        const asWhite = whitePov(s), posToTranslate = posToTranslateAbs(s.dom.bounds());
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if ((isPieceNode(el) && !el.cgAnimating) || isSquareNode(el)) {
                translateAbs(el, posToTranslate(key2pos(el.cgKey), asWhite));
            }
            el = el.nextSibling;
        }
    }
    function isPieceNode(el) {
        return el.tagName === 'PIECE';
    }
    function isSquareNode(el) {
        return el.tagName === 'SQUARE';
    }
    function removeNodes(s, nodes) {
        for (const node of nodes)
            s.dom.elements.board.removeChild(node);
    }
    function posZIndex(pos, asWhite) {
        let z = 2 + pos[1] * 8 + (7 - pos[0]);
        if (asWhite)
            z = 67 - z;
        return z + '';
    }
    function pieceNameOf(piece) {
        return `${piece.color} ${piece.role}`;
    }
    function computeSquareClasses(s) {
        var _a;
        const squares = new Map();
        if (s.lastMove && s.highlight.lastMove)
            for (const k of s.lastMove) {
                addSquare(squares, k, 'last-move');
            }
        if (s.check && s.highlight.check)
            addSquare(squares, s.check, 'check');
        if (s.selected) {
            addSquare(squares, s.selected, 'selected');
            if (s.movable.showDests) {
                const dests = (_a = s.movable.dests) === null || _a === void 0 ? void 0 : _a.get(s.selected);
                if (dests)
                    for (const k of dests) {
                        addSquare(squares, k, 'move-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
                const pDests = s.premovable.dests;
                if (pDests)
                    for (const k of pDests) {
                        addSquare(squares, k, 'premove-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
            }
        }
        const premove = s.premovable.current;
        if (premove)
            for (const k of premove)
                addSquare(squares, k, 'current-premove');
        else if (s.predroppable.current)
            addSquare(squares, s.predroppable.current.key, 'current-premove');
        const o = s.exploding;
        if (o)
            for (const k of o.keys)
                addSquare(squares, k, 'exploding' + o.stage);
        return squares;
    }
    function addSquare(squares, key, klass) {
        const classes = squares.get(key);
        if (classes)
            squares.set(key, `${classes} ${klass}`);
        else
            squares.set(key, klass);
    }
    function appendValue(map, key, value) {
        const arr = map.get(key);
        if (arr)
            arr.push(value);
        else
            map.set(key, [value]);
    }

    function Chessground(element, config) {
        const maybeState = defaults();
        configure(maybeState, config || {});
        function redrawAll() {
            const prevUnbind = 'dom' in maybeState ? maybeState.dom.unbind : undefined;
            // compute bounds from existing board element if possible
            // this allows non-square boards from CSS to be handled (for 3D)
            const relative = maybeState.viewOnly && !maybeState.drawable.visible, elements = renderWrap(element, maybeState, relative), bounds = memo(() => elements.board.getBoundingClientRect()), redrawNow = (skipSvg) => {
                render$5(state);
                if (!skipSvg && elements.svg)
                    renderSvg(state, elements.svg, elements.customSvg);
            }, boundsUpdated = () => {
                bounds.clear();
                updateBounds(state);
                if (elements.svg)
                    renderSvg(state, elements.svg, elements.customSvg);
            };
            const state = maybeState;
            state.dom = {
                elements,
                bounds,
                redraw: debounceRedraw(redrawNow),
                redrawNow,
                unbind: prevUnbind,
                relative,
            };
            state.drawable.prevSvgHash = '';
            redrawNow(false);
            bindBoard(state, boundsUpdated);
            if (!prevUnbind)
                state.dom.unbind = bindDocument(state, boundsUpdated);
            state.events.insert && state.events.insert(elements);
            return state;
        }
        return start$3(redrawAll(), redrawAll);
    }
    function debounceRedraw(redrawNow) {
        let redrawing = false;
        return () => {
            if (redrawing)
                return;
            redrawing = true;
            requestAnimationFrame(() => {
                redrawNow();
                redrawing = false;
            });
        };
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

    function render$4(ctrl) {
        return h('div.cg-wrap.cgv' + ctrl.cgVersion.js, {
            hook: {
                insert: vnode => {
                    ctrl.chessground = Chessground(vnode.elm, makeConfig(ctrl));
                    ctrl.setAutoShapes();
                    if (ctrl.node.shapes)
                        ctrl.chessground.setShapes(ctrl.node.shapes);
                    ctrl.cgVersion.dom = ctrl.cgVersion.js;
                },
                destroy: _ => ctrl.chessground.destroy(),
            },
        });
    }
    function promote(ground, key, role) {
        const piece = ground.state.pieces.get(key);
        if (piece && piece.role == 'pawn') {
            ground.setPieces(new Map([
                [
                    key,
                    {
                        color: piece.color,
                        role,
                        promoted: true,
                    },
                ],
            ]));
        }
    }
    function makeConfig(ctrl) {
        const d = ctrl.data, pref = d.pref, opts = ctrl.makeCgOpts();
        const config = {
            turnColor: opts.turnColor,
            fen: opts.fen,
            check: opts.check,
            lastMove: opts.lastMove,
            orientation: ctrl.bottomColor(),
            coordinates: pref.coords !== 0 /* Hidden */ && !ctrl.embed,
            addPieceZIndex: pref.is3d,
            viewOnly: !!ctrl.embed,
            movable: {
                free: false,
                color: opts.movable.color,
                dests: opts.movable.dests,
                showDests: pref.destination,
                rookCastle: pref.rookCastle,
            },
            events: {
                move: ctrl.userMove,
                dropNewPiece: ctrl.userNewPiece,
                insert(elements) {
                    if (!ctrl.embed)
                        resizeHandle(elements, 2 /* Always */, ctrl.node.ply);
                    if (!ctrl.embed && ctrl.data.pref.coords == 1 /* Inside */)
                        changeColorHandle();
                },
            },
            premovable: {
                enabled: opts.premovable.enabled,
                showDests: pref.destination,
                events: {
                    set: ctrl.onPremoveSet,
                },
            },
            drawable: {
                enabled: !ctrl.embed,
                eraseOnClick: !ctrl.opts.study || !!ctrl.opts.practice,
                defaultSnapToValidMove: (lichess.storage.get('arrow.snap') || 1) != '0',
            },
            highlight: {
                lastMove: pref.highlight,
                check: pref.highlight,
            },
            animation: {
                duration: pref.animationDuration,
            },
            disableContextMenu: true,
        };
        ctrl.study && ctrl.study.mutateCgConfig(config);
        return config;
    }

    let promoting;
    function start$2(ctrl, orig, dest, capture, callback) {
        const s = ctrl.chessground.state;
        const piece = s.pieces.get(dest);
        if (piece &&
            piece.role == 'pawn' &&
            ((dest[1] == '8' && s.turnColor == 'black') || (dest[1] == '1' && s.turnColor == 'white'))) {
            promoting = {
                orig,
                dest,
                capture,
                callback,
            };
            ctrl.redraw();
            return true;
        }
        return false;
    }
    function finish(ctrl, role) {
        if (promoting) {
            promote(ctrl.chessground, promoting.dest, role);
            if (promoting.callback)
                promoting.callback(promoting.orig, promoting.dest, promoting.capture, role);
        }
        promoting = undefined;
    }
    function cancel(ctrl) {
        if (promoting) {
            promoting = undefined;
            ctrl.chessground.set(ctrl.cgConfig);
            ctrl.redraw();
        }
    }
    function renderPromotion(ctrl, dest, pieces, color, orientation) {
        if (!promoting)
            return;
        let left = (7 - key2pos(dest)[0]) * 12.5;
        if (orientation === 'white')
            left = 87.5 - left;
        const vertical = color === orientation ? 'top' : 'bottom';
        return h('div#promotion-choice.' + vertical, {
            hook: onInsert(el => {
                el.addEventListener('click', _ => cancel(ctrl));
                el.oncontextmenu = () => false;
            }),
        }, pieces.map(function (serverRole, i) {
            const top = (color === orientation ? i : 7 - i) * 12.5;
            return h('square', {
                attrs: {
                    style: `top:${top}%;left:${left}%`,
                },
                hook: bind$1('click', e => {
                    e.stopPropagation();
                    finish(ctrl, serverRole);
                }),
            }, [h(`piece.${serverRole}.${color}`)]);
        }));
    }
    const roles = ['queen', 'knight', 'rook', 'bishop'];
    function view$k(ctrl) {
        if (!promoting)
            return;
        return renderPromotion(ctrl, promoting.dest, ctrl.data.game.variant.key === 'antichess' ? roles.concat('king') : roles, promoting.dest[1] === '8' ? 'white' : 'black', ctrl.chessground.state.orientation);
    }

    function setup() {
        lichess.pubsub.on('speech.enabled', onSpeechChange);
        onSpeechChange(lichess.sound.speech());
    }
    function onSpeechChange(enabled) {
        if (!window.LichessSpeech && enabled)
            lichess.loadModule('speech');
        else if (window.LichessSpeech && !enabled)
            window.LichessSpeech = undefined;
    }
    function node(n) {
        withSpeech(s => s.step(n, true));
    }
    function withSpeech(f) {
        if (window.LichessSpeech)
            f(window.LichessSpeech);
    }

    const storage = lichess.storage;
    function storedProp(k, defaultValue) {
        const sk = 'analyse.' + k, isBoolean = defaultValue === true || defaultValue === false;
        let value;
        return function (v) {
            if (defined$1(v) && v != value) {
                value = v + '';
                storage.set(sk, v);
            }
            else if (!defined$1(value)) {
                value = storage.get(sk);
                if (value === null)
                    value = defaultValue + '';
            }
            return isBoolean ? value === 'true' : value;
        };
    }
    const storedJsonProp = (key, defaultValue) => (v) => {
        if (defined$1(v)) {
            storage.set(key, JSON.stringify(v));
            return v;
        }
        const ret = JSON.parse(storage.get(key));
        return ret !== null ? ret : defaultValue();
    };

    const allSpeeds = ['bullet', 'blitz', 'rapid', 'classical'];
    const allRatings = [1600, 1800, 2000, 2200, 2500];
    function controller(game, onClose, trans, redraw) {
        const variant = game.variant.key === 'fromPosition' ? 'standard' : game.variant.key;
        const available = ['lichess'];
        if (variant === 'standard')
            available.unshift('masters');
        const data = {
            open: prop(false),
            db: {
                available,
                selected: available.length > 1
                    ? storedProp('explorer.db.' + variant, available[0])
                    : function () {
                        return available[0];
                    },
            },
            rating: {
                available: allRatings,
                selected: storedJsonProp('explorer.rating', () => allRatings),
            },
            speed: {
                available: allSpeeds,
                selected: storedJsonProp('explorer.speed', () => allSpeeds),
            },
        };
        const toggleMany = function (c, value) {
            if (!c().includes(value))
                c(c().concat([value]));
            else if (c().length > 1)
                c(c().filter(v => v !== value));
        };
        return {
            trans,
            redraw,
            data,
            toggleOpen() {
                data.open(!data.open());
                if (!data.open())
                    onClose();
            },
            toggleDb(db) {
                data.db.selected(db);
            },
            toggleRating(v) {
                toggleMany(data.rating.selected, v);
            },
            toggleSpeed(v) {
                toggleMany(data.speed.selected, v);
            },
            fullHouse() {
                return (data.db.selected() === 'masters' ||
                    (data.rating.selected().length === data.rating.available.length &&
                        data.speed.selected().length === data.speed.available.length));
            },
        };
    }
    function view$j(ctrl) {
        const d = ctrl.data;
        return [
            h('section.db', [
                h('label', ctrl.trans.noarg('database')),
                h('div.choices', d.db.available.map(function (s) {
                    return h('span', {
                        class: { selected: d.db.selected() === s },
                        hook: bind$1('click', _ => ctrl.toggleDb(s), ctrl.redraw),
                    }, s);
                })),
            ]),
            d.db.selected() === 'masters'
                ? h('div.masters.message', [
                    h('i', { attrs: dataIcon('C') }),
                    h('p', ctrl.trans('masterDbExplanation', 2200, '1952', '2019')),
                ])
                : h('div', [
                    h('section.rating', [
                        h('label', ctrl.trans.noarg('averageElo')),
                        h('div.choices', d.rating.available.map(function (r) {
                            return h('span', {
                                class: { selected: d.rating.selected().includes(r) },
                                hook: bind$1('click', _ => ctrl.toggleRating(r), ctrl.redraw),
                            }, r.toString());
                        })),
                    ]),
                    h('section.speed', [
                        h('label', ctrl.trans.noarg('timeControl')),
                        h('div.choices', d.speed.available.map(function (s) {
                            return h('span', {
                                class: { selected: d.speed.selected().includes(s) },
                                hook: bind$1('click', _ => ctrl.toggleSpeed(s), ctrl.redraw),
                            }, s);
                        })),
                    ]),
                ]),
            h('section.save', h('button.button.button-green.text', {
                attrs: dataIcon('E'),
                hook: bind$1('click', ctrl.toggleOpen),
            }, ctrl.trans.noarg('allSet'))),
        ];
    }

    function opening(opts) {
        const url = new URL(opts.db === 'lichess' ? '/lichess' : '/master', opts.endpoint);
        const params = url.searchParams;
        params.set('fen', opts.rootFen);
        params.set('play', opts.play.join(','));
        if (opts.db === 'lichess') {
            params.set('variant', opts.variant || 'standard');
            if (opts.speeds)
                for (const speed of opts.speeds)
                    params.append('speeds[]', speed);
            if (opts.ratings)
                for (const rating of opts.ratings)
                    params.append('ratings[]', rating.toString());
        }
        if (!opts.withGames) {
            params.set('topGames', '0');
            params.set('recentGames', '0');
        }
        return json(url.href, {
            cache: 'default',
            headers: {},
            credentials: 'omit',
        })
            .then((data) => {
            data.isOpening = true;
            data.fen = opts.fen;
            return data;
        });
    }
    function tablebase(endpoint, variant, fen) {
        const effectiveVariant = variant === 'fromPosition' || variant === 'chess960' ? 'standard' : variant;
        return json(url(`${endpoint}/${effectiveVariant}`, { fen }), {
            cache: 'default',
            headers: {},
            credentials: 'omit',
        })
            .then((data) => {
            data.tablebase = true;
            data.fen = fen;
            return data;
        });
    }

    const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const COLORS = ['white', 'black'];
    const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const CASTLING_SIDES = ['a', 'h'];
    function isDrop(v) {
        return 'role' in v;
    }
    function isNormal(v) {
        return 'from' in v;
    }

    function defined(v) {
        return v !== undefined;
    }
    function opposite(color) {
        return color === 'white' ? 'black' : 'white';
    }
    function squareRank(square) {
        return square >> 3;
    }
    function squareFile(square) {
        return square & 0x7;
    }
    function roleToChar(role) {
        switch (role) {
            case 'pawn':
                return 'p';
            case 'knight':
                return 'n';
            case 'bishop':
                return 'b';
            case 'rook':
                return 'r';
            case 'queen':
                return 'q';
            case 'king':
                return 'k';
        }
    }
    function charToRole(ch) {
        switch (ch) {
            case 'P':
            case 'p':
                return 'pawn';
            case 'N':
            case 'n':
                return 'knight';
            case 'B':
            case 'b':
                return 'bishop';
            case 'R':
            case 'r':
                return 'rook';
            case 'Q':
            case 'q':
                return 'queen';
            case 'K':
            case 'k':
                return 'king';
            default:
                return;
        }
    }
    function parseSquare(str) {
        if (str.length !== 2)
            return;
        const file = str.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = str.charCodeAt(1) - '1'.charCodeAt(0);
        if (file < 0 || file >= 8 || rank < 0 || rank >= 8)
            return;
        return file + 8 * rank;
    }
    function makeSquare(square) {
        return (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]);
    }
    function parseUci(str) {
        if (str[1] === '@' && str.length === 4) {
            const role = charToRole(str[0]);
            const to = parseSquare(str.slice(2));
            if (role && defined(to))
                return { role, to };
        }
        else if (str.length === 4 || str.length === 5) {
            const from = parseSquare(str.slice(0, 2));
            const to = parseSquare(str.slice(2, 4));
            let promotion;
            if (str.length === 5) {
                promotion = charToRole(str[4]);
                if (!promotion)
                    return;
            }
            if (defined(from) && defined(to))
                return { from, to, promotion };
        }
        return;
    }
    function kingCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;
    }

    function colorOf(fen) {
        return fen.split(' ')[1] === 'w' ? 'white' : 'black';
    }
    function winnerOf(fen, move) {
        const stm = colorOf(fen);
        if (move.checkmate || move.variant_loss || move.wdl < 0)
            return stm;
        if (move.variant_win || move.wdl > 0)
            return opposite(stm);
        return undefined;
    }

    function pieceCount(fen) {
        const parts = fen.split(/\s/);
        return parts[0].split(/[nbrqkp]/i).length - 1;
    }
    function tablebasePieces(variant) {
        switch (variant) {
            case 'standard':
            case 'fromPosition':
            case 'chess960':
                return 7;
            case 'atomic':
            case 'antichess':
                return 6;
            default:
                return 0;
        }
    }
    function tablebaseGuaranteed(variant, fen) {
        return pieceCount(fen) <= tablebasePieces(variant);
    }
    function tablebaseRelevant(variant, fen) {
        return pieceCount(fen) - 1 <= tablebasePieces(variant);
    }
    function explorerCtrl (root, opts, allow) {
        const allowed = prop(allow), enabled = root.embed ? prop(false) : storedProp('explorer.enabled', false), loading = prop(true), failing = prop(false), hovering = prop(null), movesAway = prop(0), gameMenu = prop(null);
        if ((location.hash === '#explorer' || location.hash === '#opening') && !root.embed)
            enabled(true);
        let cache = {};
        function onConfigClose() {
            root.redraw();
            cache = {};
            setNode();
        }
        const data = root.data, withGames = root.synthetic || replayable(data) || !!data.opponent.ai, effectiveVariant = data.game.variant.key === 'fromPosition' ? 'standard' : data.game.variant.key, config = controller(data.game, onConfigClose, root.trans, root.redraw);
        const fetch = debounce(() => {
            const fen = root.node.fen;
            const request = withGames && tablebaseRelevant(effectiveVariant, fen)
                ? tablebase(opts.tablebaseEndpoint, effectiveVariant, fen)
                : opening({
                    endpoint: opts.endpoint,
                    db: config.data.db.selected(),
                    variant: effectiveVariant,
                    rootFen: root.nodeList[0].fen,
                    play: root.nodeList.slice(1).map(s => s.uci),
                    fen,
                    speeds: config.data.speed.selected(),
                    ratings: config.data.rating.selected(),
                    withGames,
                });
            request.then((res) => {
                cache[fen] = res;
                movesAway(res.moves.length ? 0 : movesAway() + 1);
                loading(false);
                failing(false);
                root.redraw();
            }, () => {
                loading(false);
                failing(true);
                root.redraw();
            });
        }, 250, true);
        const empty = {
            isOpening: true,
            moves: [],
            fen: '',
        };
        function setNode() {
            if (!enabled())
                return;
            gameMenu(null);
            const node = root.node;
            if (node.ply > 50 && !tablebaseRelevant(effectiveVariant, node.fen)) {
                cache[node.fen] = empty;
            }
            const cached = cache[node.fen];
            if (cached) {
                movesAway(cached.moves.length ? 0 : movesAway() + 1);
                loading(false);
                failing(false);
            }
            else {
                loading(true);
                fetch();
            }
        }
        return {
            allowed,
            enabled,
            setNode,
            loading,
            failing,
            hovering,
            movesAway,
            config,
            withGames,
            gameMenu,
            current: () => cache[root.node.fen],
            toggle() {
                movesAway(0);
                enabled(!enabled());
                setNode();
                root.autoScroll();
            },
            disable() {
                if (enabled()) {
                    enabled(false);
                    gameMenu(null);
                    root.autoScroll();
                }
            },
            setHovering(fen, uci) {
                hovering(uci
                    ? {
                        fen,
                        uci,
                    }
                    : null);
                root.setAutoShapes();
            },
            fetchMasterOpening: (() => {
                const masterCache = {};
                return (fen) => {
                    const val = masterCache[fen];
                    if (val)
                        return Promise.resolve(val);
                    return opening({
                        endpoint: opts.endpoint,
                        db: 'masters',
                        rootFen: fen,
                        play: [],
                        fen,
                    })
                        .then((res) => {
                        masterCache[fen] = res;
                        return res;
                    });
                };
            })(),
            fetchTablebaseHit(fen) {
                return tablebase(opts.tablebaseEndpoint, effectiveVariant, fen).then((res) => {
                    const move = res.moves[0];
                    if (move && move.dtz == null)
                        throw 'unknown tablebase position';
                    return {
                        fen: fen,
                        best: move && move.uci,
                        winner: res.checkmate ? opposite$1(colorOf(fen)) : res.stalemate ? undefined : winnerOf(fen, move),
                    };
                });
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

    function makeCtrl(send, members, setTab, redraw, trans) {
        const open = prop(false), spectators = prop([]);
        return {
            open,
            members,
            spectators,
            toggle() {
                open(!open());
            },
            invite(titleName) {
                send('invite', titleNameToId(titleName));
                setTab();
            },
            redraw,
            trans,
        };
    }
    function view$i(ctrl) {
        const candidates = ctrl
            .spectators()
            .filter(s => !ctrl.members()[titleNameToId(s)]) // remove existing members
            .sort();
        return modal$1({
            class: 'study__invite',
            onClose() {
                ctrl.open(false);
                ctrl.redraw();
            },
            content: [
                h('h2', ctrl.trans.noarg('inviteToTheStudy')),
                h('p.info', { attrs: { 'data-icon': '' } }, ctrl.trans.noarg('pleaseOnlyInvitePeopleYouKnow')),
                h('div.input-wrapper', [
                    // because typeahead messes up with snabbdom
                    h('input', {
                        attrs: { placeholder: ctrl.trans.noarg('searchByUsername') },
                        hook: onInsert(input => lichess.userComplete().then(uac => {
                            uac({
                                input,
                                tag: 'span',
                                onSelect(v) {
                                    input.value = '';
                                    ctrl.invite(v.name);
                                    ctrl.redraw();
                                },
                            });
                            input.focus();
                        })),
                    }),
                ]),
                candidates.length
                    ? h('div.users', candidates.map(function (username) {
                        return h('span.button.button-metal', {
                            key: username,
                            hook: bind$1('click', _ => ctrl.invite(username)),
                        }, username);
                    }))
                    : undefined,
            ],
        });
    }

    function memberActivity(onIdle) {
        let timeout;
        const schedule = () => {
            if (timeout)
                clearTimeout(timeout);
            timeout = setTimeout(onIdle, 100);
        };
        schedule();
        return schedule;
    }
    function ctrl$c(opts) {
        const dict = prop(opts.initDict);
        const confing = prop(null);
        const active = {};
        let online = {};
        let spectatorIds = [];
        const max = 30;
        function owner() {
            return dict()[opts.ownerId];
        }
        function isOwner() {
            return opts.myId === opts.ownerId || (opts.admin && canContribute());
        }
        function myMember() {
            return opts.myId ? dict()[opts.myId] : undefined;
        }
        function canContribute() {
            const m = myMember();
            return !!m && m.role === 'w';
        }
        const inviteForm = makeCtrl(opts.send, dict, () => opts.tab('members'), opts.redraw, opts.trans);
        function setActive(id) {
            if (opts.tab() !== 'members')
                return;
            if (active[id])
                active[id]();
            else
                active[id] = memberActivity(() => {
                    delete active[id];
                    opts.redraw();
                });
            opts.redraw();
        }
        function updateOnline() {
            online = {};
            const members = dict();
            spectatorIds.forEach(function (id) {
                if (members[id])
                    online[id] = true;
            });
            if (opts.tab() === 'members')
                opts.redraw();
        }
        lichess.pubsub.on('socket.in.crowd', d => {
            const names = d.users || [];
            inviteForm.spectators(names);
            spectatorIds = names.map(titleNameToId);
            updateOnline();
        });
        return {
            dict,
            confing,
            myId: opts.myId,
            inviteForm,
            update(members) {
                if (isOwner())
                    confing(Object.keys(members).find(sri => !dict()[sri]) || null);
                const wasViewer = myMember() && !canContribute();
                const wasContrib = myMember() && canContribute();
                dict(members);
                if (wasViewer && canContribute()) {
                    if (lichess.once('study-tour'))
                        opts.startTour();
                    opts.onBecomingContributor();
                    opts.notif.set({
                        text: opts.trans.noarg('youAreNowAContributor'),
                        duration: 3000,
                    });
                }
                else if (wasContrib && !canContribute())
                    opts.notif.set({
                        text: opts.trans.noarg('youAreNowASpectator'),
                        duration: 3000,
                    });
                updateOnline();
            },
            setActive,
            isActive(id) {
                return !!active[id];
            },
            owner,
            myMember,
            isOwner,
            canContribute,
            max,
            setRole(id, role) {
                setActive(id);
                opts.send('setRole', {
                    userId: id,
                    role,
                });
                confing(null);
            },
            kick(id) {
                opts.send('kick', id);
                confing(null);
            },
            leave() {
                opts.send('leave');
            },
            ordered() {
                const d = dict();
                return Object.keys(d)
                    .map(id => d[id])
                    .sort((a, b) => (a.role === 'r' && b.role === 'w' ? 1 : a.role === 'w' && b.role === 'r' ? -1 : 0));
            },
            size() {
                return Object.keys(dict()).length;
            },
            isOnline(userId) {
                return online[userId];
            },
            hasOnlineContributor() {
                const members = dict();
                for (const i in members)
                    if (online[i] && members[i].role === 'w')
                        return true;
                return false;
            },
        };
    }
    function view$h(ctrl) {
        const members = ctrl.members, isOwner = members.isOwner();
        function username(member) {
            const u = member.user;
            return h('span.user-link.ulpt', {
                attrs: { 'data-href': '/@/' + u.name },
            }, (u.title ? u.title + ' ' : '') + u.name);
        }
        function statusIcon(member) {
            const contrib = member.role === 'w';
            return h('span.status', {
                class: {
                    contrib,
                    active: members.isActive(member.user.id),
                    online: members.isOnline(member.user.id),
                },
                attrs: { title: ctrl.trans.noarg(contrib ? 'contributor' : 'spectator') },
            }, [iconTag(contrib ? 'r' : 'v')]);
        }
        function configButton(ctrl, member) {
            if (isOwner && (member.user.id !== members.myId || ctrl.data.admin))
                return h('i.act', {
                    attrs: dataIcon('%'),
                    hook: bind$1('click', _ => {
                        members.confing(members.confing() == member.user.id ? null : member.user.id);
                        console.log(members.confing(), member.user.id);
                    }, ctrl.redraw),
                });
            if (!isOwner && member.user.id === members.myId)
                return h('i.act.leave', {
                    attrs: {
                        'data-icon': 'F',
                        title: ctrl.trans.noarg('leaveTheStudy'),
                    },
                    hook: bind$1('click', members.leave, ctrl.redraw),
                });
            return undefined;
        }
        function memberConfig(member) {
            const roleId = 'member-role';
            return h('m-config', {
                key: member.user.id + '-config',
                hook: onInsert(el => scrollTo($(el).parent('.members')[0], el)),
            }, [
                h('div.role', [
                    h('div.switch', [
                        h('input.cmn-toggle', {
                            attrs: {
                                id: roleId,
                                type: 'checkbox',
                                checked: member.role === 'w',
                            },
                            hook: bind$1('change', e => {
                                members.setRole(member.user.id, e.target.checked ? 'w' : 'r');
                            }, ctrl.redraw),
                        }),
                        h('label', { attrs: { for: roleId } }),
                    ]),
                    h('label', { attrs: { for: roleId } }, ctrl.trans.noarg('contributor')),
                ]),
                h('div.kick', h('a.button.button-red.button-empty.text', {
                    attrs: dataIcon('L'),
                    hook: bind$1('click', _ => members.kick(member.user.id), ctrl.redraw),
                }, ctrl.trans.noarg('kick'))),
            ]);
        }
        const ordered = members.ordered();
        return h('div.study__members', {
            hook: onInsert(() => lichess.pubsub.emit('chat.resize')),
        }, [
            ...ordered
                .map(member => {
                const confing = members.confing() === member.user.id;
                return [
                    h('div', {
                        key: member.user.id,
                        class: { editing: !!confing },
                    }, [h('div.left', [statusIcon(member), username(member)]), configButton(ctrl, member)]),
                    confing ? memberConfig(member) : null,
                ];
            })
                .reduce((a, b) => a.concat(b), []),
            isOwner && ordered.length < members.max
                ? h('div.add', {
                    key: 'add',
                    hook: bind$1('click', members.inviteForm.toggle, ctrl.redraw),
                }, [h('div.left', [h('span.status', iconTag('O')), h('div.user-link', ctrl.trans.noarg('addMembers'))])])
                : null,
            !members.canContribute() && ctrl.data.admin
                ? h('form.admin', {
                    key: ':admin',
                    attrs: {
                        method: 'post',
                        action: `/study/${ctrl.data.id}/admin`,
                    },
                }, [
                    h('button.button.button-red.button-thin', {
                        attrs: { type: 'submit' },
                    }, 'Enter as admin'),
                ])
                : null,
        ]);
    }

    const reload = (baseUrl, id, chapterId) => {
        let url = '/' + baseUrl + '/' + id;
        if (chapterId)
            url += '/' + chapterId;
        return json(url);
    };
    const variants = () => json('/variant', { cache: 'default' });
    const glyphs = () => json(`/study/glyphs/${document.documentElement.lang}.json`, { cache: 'default' });
    const chapterConfig = (studyId, chapterId) => json(`/study/${studyId}/${chapterId}/meta`);
    const practiceComplete = (chapterId, nbMoves) => json(`/practice/complete/${chapterId}/${nbMoves}`, {
        method: 'POST',
    });
    const importPgn = (studyId, data) => json(`/study/${studyId}/import-pgn?sri=${lichess.sri}`, {
        method: 'POST',
        body: form(data),
    });
    const multiBoard = (studyId, page, playing) => json(`/study/${studyId}/multi-board?page=${page}&playing=${playing}`);

    function study(ctrl) {
        var _a;
        if (!((_a = ctrl.study) === null || _a === void 0 ? void 0 : _a.data.chapter.gamebook))
            lichess.loadScript('javascripts/study/tour.js').then(() => {
                window.lichess['studyTour']({
                    userId: ctrl.opts.userId,
                    isContrib: ctrl.study.members.canContribute(),
                    isOwner: ctrl.study.members.isOwner(),
                    setTab: (tab) => {
                        ctrl.study.vm.tab(tab);
                        ctrl.redraw();
                    },
                });
            });
    }
    function chapter(setTab) {
        lichess.loadScript('javascripts/study/tour-chapter.js').then(() => {
            window.lichess['studyTourChapter']({
                setTab,
            });
        });
    }

    const modeChoices = [
        ['normal', 'normalAnalysis'],
        ['practice', 'practiceWithComputer'],
        ['conceal', 'hideNextMoves'],
        ['gamebook', 'interactiveLesson'],
    ];
    const fieldValue = (e, id) => { var _a; return (_a = e.target.querySelector('#chapter-' + id)) === null || _a === void 0 ? void 0 : _a.value; };
    function ctrl$b(send, chapters, setTab, root) {
        const multiPgnMax = 20;
        const vm = {
            variants: [],
            open: false,
            initial: prop(false),
            tab: storedProp('study.form.tab', 'init'),
            editor: null,
            editorFen: prop(null),
            isDefaultName: true,
        };
        function loadVariants() {
            if (!vm.variants.length)
                variants().then(function (vs) {
                    vm.variants = vs;
                    root.redraw();
                });
        }
        function open() {
            vm.open = true;
            loadVariants();
            vm.initial(false);
        }
        function close() {
            vm.open = false;
        }
        return {
            vm,
            open,
            root,
            openInitial() {
                open();
                vm.initial(true);
            },
            close,
            toggle() {
                if (vm.open)
                    close();
                else
                    open();
            },
            submit(d) {
                const study = root.study;
                const dd = Object.assign(Object.assign({}, d), { sticky: study.vm.mode.sticky, initial: vm.initial() });
                if (!dd.pgn)
                    send('addChapter', dd);
                else
                    importPgn(study.data.id, dd);
                close();
                setTab();
            },
            chapters,
            startTour: () => chapter(tab => {
                vm.tab(tab);
                root.redraw();
            }),
            multiPgnMax,
            redraw: root.redraw,
        };
    }
    function view$g(ctrl) {
        const trans = ctrl.root.trans;
        const activeTab = ctrl.vm.tab();
        const makeTab = function (key, name, title) {
            return h('span.' + key, {
                class: { active: activeTab === key },
                attrs: { title },
                hook: bind$1('click', () => ctrl.vm.tab(key), ctrl.root.redraw),
            }, name);
        };
        const gameOrPgn = activeTab === 'game' || activeTab === 'pgn';
        const currentChapter = ctrl.root.study.data.chapter;
        const mode = currentChapter.practice
            ? 'practice'
            : defined$1(currentChapter.conceal)
                ? 'conceal'
                : currentChapter.gamebook
                    ? 'gamebook'
                    : 'normal';
        const noarg = trans.noarg;
        return modal$1({
            class: 'chapter-new',
            onClose() {
                ctrl.close();
                ctrl.redraw();
            },
            noClickAway: true,
            content: [
                activeTab === 'edit'
                    ? null
                    : h('h2', [
                        noarg('newChapter'),
                        h('i.help', {
                            attrs: { 'data-icon': '' },
                            hook: bind$1('click', ctrl.startTour),
                        }),
                    ]),
                h('form.form3', {
                    hook: bindSubmit(e => {
                        ctrl.submit({
                            name: fieldValue(e, 'name'),
                            game: fieldValue(e, 'game'),
                            variant: fieldValue(e, 'variant'),
                            pgn: fieldValue(e, 'pgn'),
                            orientation: fieldValue(e, 'orientation'),
                            mode: fieldValue(e, 'mode'),
                            fen: fieldValue(e, 'fen') || (ctrl.vm.tab() === 'edit' ? ctrl.vm.editorFen() : null),
                            isDefaultName: ctrl.vm.isDefaultName,
                        });
                    }, ctrl.redraw),
                }, [
                    h('div.form-group', [
                        h('label.form-label', {
                            attrs: { for: 'chapter-name' },
                        }, noarg('name')),
                        h('input#chapter-name.form-control', {
                            attrs: {
                                minlength: 2,
                                maxlength: 80,
                            },
                            hook: onInsert(el => {
                                if (!el.value) {
                                    el.value = trans('chapterX', ctrl.vm.initial() ? 1 : ctrl.chapters().length + 1);
                                    el.onchange = function () {
                                        ctrl.vm.isDefaultName = false;
                                    };
                                    el.select();
                                    el.focus();
                                }
                            }),
                        }),
                    ]),
                    h('div.tabs-horiz', [
                        makeTab('init', noarg('empty'), noarg('startFromInitialPosition')),
                        makeTab('edit', noarg('editor'), noarg('startFromCustomPosition')),
                        makeTab('game', 'URL', noarg('loadAGameByUrl')),
                        makeTab('fen', 'FEN', noarg('loadAPositionFromFen')),
                        makeTab('pgn', 'PGN', noarg('loadAGameFromPgn')),
                    ]),
                    activeTab === 'edit'
                        ? h('div.board-editor-wrap', {
                            hook: {
                                insert(vnode) {
                                    Promise.all([
                                        lichess.loadModule('editor'),
                                        json(url('/editor.json', { fen: ctrl.root.node.fen })),
                                    ]).then(([_, data]) => {
                                        data.embed = true;
                                        data.options = {
                                            inlineCastling: true,
                                            orientation: currentChapter.setup.orientation,
                                            onChange: ctrl.vm.editorFen,
                                        };
                                        ctrl.vm.editor = window.LichessEditor(vnode.elm, data);
                                        ctrl.vm.editorFen(ctrl.vm.editor.getFen());
                                    });
                                },
                                destroy: _ => {
                                    ctrl.vm.editor = null;
                                },
                            },
                        }, [spinner()])
                        : null,
                    activeTab === 'game'
                        ? h('div.form-group', [
                            h('label.form-label', {
                                attrs: { for: 'chapter-game' },
                            }, trans('loadAGameFromXOrY', 'lichess.org', 'chessgames.com')),
                            h('textarea#chapter-game.form-control', {
                                attrs: { placeholder: noarg('urlOfTheGame') },
                            }),
                        ])
                        : null,
                    activeTab === 'fen'
                        ? h('div.form-group', [
                            h('input#chapter-fen.form-control', {
                                attrs: {
                                    value: ctrl.root.node.fen,
                                    placeholder: noarg('loadAPositionFromFen'),
                                },
                            }),
                        ])
                        : null,
                    activeTab === 'pgn'
                        ? h('div.form-groupabel', [
                            h('textarea#chapter-pgn.form-control', {
                                attrs: { placeholder: trans.plural('pasteYourPgnTextHereUpToNbGames', ctrl.multiPgnMax) },
                            }),
                            window.FileReader
                                ? h('input#chapter-pgn-file.form-control', {
                                    attrs: {
                                        type: 'file',
                                        accept: '.pgn',
                                    },
                                    hook: bind$1('change', e => {
                                        const file = e.target.files[0];
                                        if (!file)
                                            return;
                                        const reader = new FileReader();
                                        reader.onload = function () {
                                            document.getElementById('chapter-pgn').value = reader.result;
                                        };
                                        reader.readAsText(file);
                                    }),
                                })
                                : null,
                        ])
                        : null,
                    h('div.form-split', [
                        h('div.form-group.form-half', [
                            h('label.form-label', {
                                attrs: { for: 'chapter-variant' },
                            }, noarg('Variant')),
                            h('select#chapter-variant.form-control', {
                                attrs: { disabled: gameOrPgn },
                            }, gameOrPgn
                                ? [h('option', noarg('automatic'))]
                                : ctrl.vm.variants.map(v => option(v.key, currentChapter.setup.variant.key, v.name))),
                        ]),
                        h('div.form-group.form-half', [
                            h('label.form-label', {
                                attrs: { for: 'chapter-orientation' },
                            }, noarg('orientation')),
                            h('select#chapter-orientation.form-control', {
                                hook: bind$1('change', e => {
                                    ctrl.vm.editor && ctrl.vm.editor.setOrientation(e.target.value);
                                }),
                            }, [...(activeTab === 'pgn' ? ['automatic'] : []), 'white', 'black'].map(c => option(c, currentChapter.setup.orientation, noarg(c)))),
                        ]),
                    ]),
                    h('div.form-group', [
                        h('label.form-label', {
                            attrs: { for: 'chapter-mode' },
                        }, noarg('analysisMode')),
                        h('select#chapter-mode.form-control', modeChoices.map(c => option(c[0], mode, noarg(c[1])))),
                    ]),
                    button(noarg('createChapter')),
                ]),
            ],
        });
    }

    function ctrl$a(send, chapterConfig, trans, redraw) {
        const current = prop(null);
        function open(data) {
            current({
                id: data.id,
                name: data.name,
            });
            chapterConfig(data.id).then(d => {
                current(d);
                redraw();
            });
        }
        function isEditing(id) {
            const c = current();
            return c ? c.id === id : false;
        }
        return {
            open,
            toggle(data) {
                if (isEditing(data.id))
                    current(null);
                else
                    open(data);
            },
            current,
            submit(data) {
                const c = current();
                if (c) {
                    send('editChapter', Object.assign({ id: c.id }, data));
                    current(null);
                }
                redraw();
            },
            delete(id) {
                send('deleteChapter', id);
                current(null);
            },
            clearAnnotations(id) {
                send('clearAnnotations', id);
                current(null);
            },
            isEditing,
            trans,
            redraw,
        };
    }
    function view$f(ctrl) {
        const data = ctrl.current();
        return data
            ? modal$1({
                class: 'edit-' + data.id,
                onClose() {
                    ctrl.current(null);
                    ctrl.redraw();
                },
                content: [
                    h('h2', ctrl.trans.noarg('editChapter')),
                    h('form.form3', {
                        hook: bindSubmit(e => {
                            ctrl.submit({
                                name: fieldValue(e, 'name'),
                                mode: fieldValue(e, 'mode'),
                                orientation: fieldValue(e, 'orientation'),
                                description: fieldValue(e, 'description'),
                            });
                        }),
                    }, [
                        h('div.form-group', [
                            h('label.form-label', {
                                attrs: { for: 'chapter-name' },
                            }, ctrl.trans.noarg('name')),
                            h('input#chapter-name.form-control', {
                                attrs: {
                                    minlength: 2,
                                    maxlength: 80,
                                },
                                hook: onInsert(el => {
                                    if (!el.value) {
                                        el.value = data.name;
                                        el.select();
                                        el.focus();
                                    }
                                }),
                            }),
                        ]),
                        ...(isLoaded(data) ? viewLoaded(ctrl, data) : [spinner()]),
                    ]),
                    h('div.destructive', [
                        h(emptyRedButton, {
                            hook: bind$1('click', _ => {
                                if (confirm(ctrl.trans.noarg('clearAllCommentsInThisChapter')))
                                    ctrl.clearAnnotations(data.id);
                            }),
                        }, ctrl.trans.noarg('clearAnnotations')),
                        h(emptyRedButton, {
                            hook: bind$1('click', _ => {
                                if (confirm(ctrl.trans.noarg('deleteThisChapter')))
                                    ctrl.delete(data.id);
                            }),
                        }, ctrl.trans.noarg('deleteChapter')),
                    ]),
                ],
            })
            : undefined;
    }
    function isLoaded(data) {
        return 'orientation' in data;
    }
    function viewLoaded(ctrl, data) {
        const mode = data.practice ? 'practice' : defined$1(data.conceal) ? 'conceal' : data.gamebook ? 'gamebook' : 'normal';
        return [
            h('div.form-split', [
                h('div.form-group.form-half', [
                    h('label.form-label', {
                        attrs: { for: 'chapter-orientation' },
                    }, ctrl.trans.noarg('orientation')),
                    h('select#chapter-orientation.form-control', ['white', 'black'].map(function (color) {
                        return option(color, data.orientation, ctrl.trans.noarg(color));
                    })),
                ]),
                h('div.form-group.form-half', [
                    h('label.form-label', {
                        attrs: { for: 'chapter-mode' },
                    }, ctrl.trans.noarg('analysisMode')),
                    h('select#chapter-mode.form-control', modeChoices.map(c => {
                        return option(c[0], mode, ctrl.trans.noarg(c[1]));
                    })),
                ]),
            ]),
            h('div.form-group', [
                h('label.form-label', {
                    attrs: { for: 'chapter-description' },
                }, ctrl.trans.noarg('pinnedChapterComment')),
                h('select#chapter-description.form-control', [
                    ['', ctrl.trans.noarg('noPinnedComment')],
                    ['1', ctrl.trans.noarg('rightUnderTheBoard')],
                ].map(v => option(v[0], data.description ? '1' : '', v[1]))),
            ]),
            button(ctrl.trans.noarg('saveChapter')),
        ];
    }

    function ctrl$9(initChapters, send, setTab, chapterConfig, root) {
        const list = prop(initChapters);
        const newForm = ctrl$b(send, list, setTab, root);
        const editForm = ctrl$a(send, chapterConfig, root.trans, root.redraw);
        const localPaths = {};
        return {
            newForm,
            editForm,
            list,
            get: (id) => list().find(c => c.id === id),
            size: () => list().length,
            sort(ids) {
                send('sortChapters', ids);
            },
            firstChapterId: () => list()[0].id,
            toggleNewForm() {
                if (newForm.vm.open || list().length < 64)
                    newForm.toggle();
                else
                    alert('You have reached the limit of 64 chapters per study. Please create a new study.');
            },
            localPaths,
        };
    }
    function isFinished(c) {
        const result = findTag(c.tags, 'result');
        return result && result !== '*';
    }
    function findTag(tags, name) {
        const t = tags.find(t => t[0].toLowerCase() === name);
        return t && t[1];
    }
    function resultOf(tags, isWhite) {
        switch (findTag(tags, 'result')) {
            case '1-0':
                return isWhite ? '1' : '0';
            case '0-1':
                return isWhite ? '0' : '1';
            case '1/2-1/2':
                return '1/2';
            default:
                return;
        }
    }
    function view$e(ctrl) {
        const canContribute = ctrl.members.canContribute(), current = ctrl.currentChapter();
        function update(vnode) {
            const newCount = ctrl.chapters.list().length, vData = vnode.data.li, el = vnode.elm;
            if (vData.count !== newCount) {
                if (current.id !== ctrl.chapters.firstChapterId()) {
                    scrollTo(el, el.querySelector('.active'));
                }
            }
            else if (ctrl.vm.loading && vData.loadingId !== ctrl.vm.nextChapterId) {
                vData.loadingId = ctrl.vm.nextChapterId;
                scrollTo(el, el.querySelector('.loading'));
            }
            vData.count = newCount;
            if (canContribute && newCount > 1 && !vData.sortable) {
                const makeSortable = function () {
                    vData.sortable = window['Sortable'].create(el, {
                        draggable: '.draggable',
                        handle: 'ontouchstart' in window ? 'span' : undefined,
                        onSort() {
                            ctrl.chapters.sort(vData.sortable.toArray());
                        },
                    });
                };
                if (window['Sortable'])
                    makeSortable();
                else
                    lichess.loadScript('javascripts/vendor/Sortable.min.js').then(makeSortable);
            }
        }
        return h('div.study__chapters', {
            hook: {
                insert(vnode) {
                    vnode.elm.addEventListener('click', e => {
                        const target = e.target;
                        const id = target.parentNode.getAttribute('data-id') || target.getAttribute('data-id');
                        if (!id)
                            return;
                        if (target.className === 'act') {
                            const chapter = ctrl.chapters.get(id);
                            if (chapter)
                                ctrl.chapters.editForm.toggle(chapter);
                        }
                        else
                            ctrl.setChapter(id);
                    });
                    vnode.data.li = {};
                    update(vnode);
                    lichess.pubsub.emit('chat.resize');
                },
                postpatch(old, vnode) {
                    vnode.data.li = old.data.li;
                    update(vnode);
                },
                destroy: vnode => {
                    const sortable = vnode.data.li.sortable;
                    if (sortable)
                        sortable.destroy();
                },
            },
        }, ctrl.chapters
            .list()
            .map((chapter, i) => {
            var _a;
            const editing = ctrl.chapters.editForm.isEditing(chapter.id), loading = ctrl.vm.loading && chapter.id === ctrl.vm.nextChapterId, active = !ctrl.vm.loading && current && !((_a = ctrl.relay) === null || _a === void 0 ? void 0 : _a.tourShow.active) && current.id === chapter.id;
            return h('div', {
                key: chapter.id,
                attrs: { 'data-id': chapter.id },
                class: { active, editing, loading, draggable: canContribute },
            }, [
                h('span', loading ? h('span.ddloader') : ['' + (i + 1)]),
                h('h3', chapter.name),
                chapter.ongoing ? h('ongoing', { attrs: Object.assign(Object.assign({}, dataIcon('J')), { title: 'Ongoing' }) }) : null,
                !chapter.ongoing && chapter.res ? h('res', chapter.res) : null,
                canContribute ? h('i.act', { attrs: dataIcon('%') }) : null,
            ]);
        })
            .concat(ctrl.members.canContribute()
            ? [
                h('div.add', {
                    hook: bind$1('click', ctrl.chapters.toggleNewForm, ctrl.redraw),
                }, [h('span', iconTag('O')), h('h3', ctrl.trans.noarg('addNewChapter'))]),
            ]
            : []));
    }

    // returns null if not deep enough to know
    function isDrawish(node) {
        if (!hasSolidEval(node))
            return null;
        return !node.ceval.mate && Math.abs(node.ceval.cp) < 150;
    }
    // returns null if not deep enough to know
    function isWinning(node, goalCp, color) {
        if (!hasSolidEval(node))
            return null;
        const cp = node.ceval.mate > 0 ? 99999 : node.ceval.mate < 0 ? -99999 : node.ceval.cp;
        return color === 'white' ? cp >= goalCp : cp <= goalCp;
    }
    // returns null if not deep enough to know
    function myMateIn(node, color) {
        if (!hasSolidEval(node))
            return null;
        if (!node.ceval.mate)
            return false;
        const mateIn = node.ceval.mate * (color === 'white' ? 1 : -1);
        return mateIn > 0 ? mateIn : false;
    }
    function hasSolidEval(node) {
        return node.ceval && node.ceval.depth >= 16;
    }
    function hasBlundered(comment) {
        return comment && (comment.verdict === 'mistake' || comment.verdict === 'blunder');
    }
    // returns null = ongoing, true = win, false = fail
    function makeSuccess (root, goal, nbMoves) {
        const node = root.node;
        if (!node.uci)
            return null;
        const outcome = root.outcome();
        if (outcome && outcome.winner && outcome.winner !== root.bottomColor())
            return false;
        if (outcome && outcome.winner && outcome.winner === root.bottomColor())
            return true;
        if (hasBlundered(root.practice.comment()))
            return false;
        switch (goal.result) {
            case 'drawIn':
            case 'equalIn':
                if (node.threefold)
                    return true;
                if (isDrawish(node) === false)
                    return false;
                if (nbMoves > goal.moves)
                    return false;
                if (outcome && !outcome.winner)
                    return true;
                if (nbMoves >= goal.moves)
                    return isDrawish(node);
                break;
            case 'evalIn':
                if (nbMoves >= goal.moves)
                    return isWinning(node, goal.cp, root.bottomColor());
                break;
            case 'mateIn': {
                if (nbMoves > goal.moves)
                    return false;
                const mateIn = myMateIn(node, root.bottomColor());
                if (mateIn === null)
                    return null;
                if (!mateIn || mateIn + nbMoves > goal.moves)
                    return false;
                break;
            }
            case 'promotion':
                if (!node.uci[4])
                    return null;
                return isWinning(node, goal.cp, root.bottomColor());
        }
        return null;
    }

    function practiceCtrl (root, studyData, data) {
        const goal = prop(root.data.practiceGoal), nbMoves = prop(0), 
        // null = ongoing, true = win, false = fail
        success = prop(null), analysisUrl = prop(''), autoNext = storedProp('practice-auto-next', true);
        lichess.sound.loadOggOrMp3('practiceSuccess', `${lichess.sound.baseUrl}/other/energy3`);
        lichess.sound.loadOggOrMp3('practiceFailure', `${lichess.sound.baseUrl}/other/failure2`);
        function onLoad() {
            root.showAutoShapes = readOnlyProp(true);
            root.showGauge = readOnlyProp(true);
            root.showComputer = readOnlyProp(true);
            goal(root.data.practiceGoal);
            nbMoves(0);
            success(null);
            const chapter = studyData.chapter;
            history.replaceState(null, chapter.name, data.url + '/' + chapter.id);
            analysisUrl('/analysis/standard/' + root.node.fen.replace(/ /g, '_') + '?color=' + root.bottomColor());
        }
        onLoad();
        function computeNbMoves() {
            let plies = root.node.ply - root.tree.root.ply;
            if (root.bottomColor() !== root.data.player.color)
                plies--;
            return Math.ceil(plies / 2);
        }
        function getStudy() {
            return root.study;
        }
        function checkSuccess() {
            const gamebook = getStudy().gamebookPlay();
            if (gamebook) {
                if (gamebook.state.feedback === 'end')
                    onVictory();
                return;
            }
            if (!getStudy().data.chapter.practice) {
                return saveNbMoves();
            }
            if (success() !== null)
                return;
            nbMoves(computeNbMoves());
            const res = success(makeSuccess(root, goal(), nbMoves()));
            if (res)
                onVictory();
            else if (res === false)
                onFailure();
        }
        function onVictory() {
            saveNbMoves();
            lichess.sound.play('practiceSuccess');
            if (studyData.chapter.practice && autoNext())
                setTimeout(getStudy().goToNextChapter, 1000);
        }
        function saveNbMoves() {
            const chapterId = getStudy().currentChapter().id, former = data.completion[chapterId];
            if (typeof former === 'undefined' || nbMoves() < former) {
                data.completion[chapterId] = nbMoves();
                practiceComplete(chapterId, nbMoves());
            }
        }
        function onFailure() {
            root.node.fail = true;
            lichess.sound.play('practiceFailure');
        }
        return {
            onLoad,
            onJump() {
                // reset failure state if no failed move found in mainline history
                if (success() === false && !root.nodeList.find(n => !!n.fail))
                    success(null);
                checkSuccess();
            },
            onCeval: checkSuccess,
            data,
            goal,
            success,
            nbMoves,
            reset() {
                root.tree.root.children = [];
                root.userJump('');
                root.practice.reset();
                onLoad();
                root.practice.resume();
            },
            isWhite: root.bottomIsWhite,
            analysisUrl,
            autoNext,
        };
    }

    function authorDom(author) {
        if (!author)
            return 'Unknown';
        if (typeof author === 'string')
            return author;
        return h('span.user-link.ulpt', {
            attrs: { 'data-href': '/@/' + author.id },
        }, author.name);
    }
    function isAuthorObj(author) {
        return typeof author === 'object';
    }
    function authorText(author) {
        if (!author)
            return 'Unknown';
        if (typeof author === 'string')
            return author;
        return author.name;
    }
    function currentComments(ctrl, includingMine) {
        if (!ctrl.node.comments)
            return;
        const node = ctrl.node, study = ctrl.study, chapter = study.currentChapter(), comments = node.comments;
        if (!comments.length)
            return;
        return h('div', comments.map((comment) => {
            const by = comment.by;
            const isMine = isAuthorObj(by) && by.id === ctrl.opts.userId;
            if (!includingMine && isMine)
                return;
            const canDelete = isMine || study.members.isOwner();
            return h('div.study__comment.' + comment.id, [
                canDelete && study.vm.mode.write
                    ? h('a.edit', {
                        attrs: {
                            'data-icon': 'q',
                            title: 'Delete',
                        },
                        hook: bind$1('click', _ => {
                            if (confirm('Delete ' + authorText(by) + "'s comment?"))
                                study.commentForm.delete(chapter.id, ctrl.path, comment.id);
                        }, ctrl.redraw),
                    })
                    : null,
                isMine && study.vm.mode.write
                    ? h('a.edit', {
                        attrs: {
                            'data-icon': 'm',
                            title: 'Edit',
                        },
                        hook: bind$1('click', _ => {
                            study.commentForm.start(chapter.id, ctrl.path, node);
                        }, ctrl.redraw),
                    })
                    : null,
                authorDom(by),
                ...(node.san ? [' on ', h('span.node', nodeFullName(node))] : []),
                ': ',
                h('div.text', { hook: richHTML(comment.text) }),
            ]);
        }));
    }

    function ctrl$8(root) {
        const current = prop(null), focus = prop(false), opening = prop(false);
        function submit(text) {
            if (!current())
                return;
            doSubmit(text);
        }
        const doSubmit = throttle(500, (text) => {
            const cur = current();
            if (cur)
                root.study.makeChange('setComment', {
                    ch: cur.chapterId,
                    path: cur.path,
                    text,
                });
        });
        function start(chapterId, path, node) {
            opening(true);
            current({
                chapterId,
                path,
                node,
            });
            root.userJump(path);
        }
        return {
            root,
            current,
            focus,
            opening,
            submit,
            start,
            onSetPath(chapterId, path, node, playedMyself) {
                setTimeout(() => {
                    const cur = current();
                    if (cur &&
                        (path !== cur.path || chapterId !== cur.chapterId || cur.node !== node) &&
                        (!focus() || playedMyself)) {
                        cur.chapterId = chapterId;
                        cur.path = path;
                        cur.node = node;
                        root.redraw();
                    }
                }, 100);
            },
            redraw: root.redraw,
            delete(chapterId, path, id) {
                root.study.makeChange('deleteComment', {
                    ch: chapterId,
                    path,
                    id,
                });
            },
        };
    }
    function viewDisabled$1(root, why) {
        return h('div.study__comments', [currentComments(root, true), h('div.study__message', why)]);
    }
    function view$d(root) {
        const study = root.study, ctrl = study.commentForm, current = ctrl.current();
        if (!current)
            return viewDisabled$1(root, 'Select a move to comment');
        function setupTextarea(vnode) {
            const el = vnode.elm, mine = (current.node.comments || []).find(function (c) {
                return isAuthorObj(c.by) && c.by.id && c.by.id === ctrl.root.opts.userId;
            });
            el.value = mine ? mine.text : '';
            if (ctrl.opening() || ctrl.focus())
                requestAnimationFrame(() => el.focus());
            ctrl.opening(false);
        }
        return h('div.study__comments', [
            currentComments(root, !study.members.canContribute()),
            h('form.form3', [
                ctrl.focus() && ctrl.root.path !== current.path
                    ? h('p', [
                        'Commenting position after ',
                        h('a', {
                            hook: bind$1('mousedown', () => ctrl.root.userJump(current.path), ctrl.redraw),
                        }, nodeFullName(current.node)),
                    ])
                    : null,
                h('div.form-group', [
                    h('textarea#comment-text.form-control', {
                        hook: {
                            insert(vnode) {
                                setupTextarea(vnode);
                                const el = vnode.elm;
                                function onChange() {
                                    setTimeout(() => ctrl.submit(el.value), 50);
                                }
                                el.onkeyup = el.onpaste = onChange;
                                el.onfocus = function () {
                                    ctrl.focus(true);
                                    ctrl.redraw();
                                };
                                el.onblur = function () {
                                    ctrl.focus(false);
                                };
                                vnode.data.path = current.chapterId + current.path;
                            },
                            postpatch(old, vnode) {
                                const newKey = current.chapterId + current.path;
                                if (old.data.path !== newKey)
                                    setupTextarea(vnode);
                                vnode.data.path = newKey;
                            },
                        },
                    }),
                ]),
            ]),
        ]);
    }

    function renderGlyph$1(ctrl, node) {
        return function (glyph) {
            return h('a', {
                hook: bind$1('click', _ => {
                    ctrl.toggleGlyph(glyph.id);
                    return false;
                }, ctrl.redraw),
                attrs: { 'data-symbol': glyph.symbol },
                class: {
                    active: !!node.glyphs && !!node.glyphs.find(g => g.id === glyph.id),
                },
            }, [glyph.name]);
        };
    }
    function ctrl$7(root) {
        const all = prop(null);
        function loadGlyphs() {
            if (!all())
                glyphs().then(gs => {
                    all(gs);
                    root.redraw();
                });
        }
        const toggleGlyph = throttle(500, (id) => {
            root.study.makeChange('toggleGlyph', root.study.withPosition({
                id,
            }));
        });
        return {
            root,
            all,
            loadGlyphs,
            toggleGlyph,
            redraw: root.redraw,
        };
    }
    function viewDisabled(why) {
        return h('div.study__glyphs', [h('div.study__message', why)]);
    }
    function view$c(ctrl) {
        const all = ctrl.all(), node = ctrl.root.node;
        return h('div.study__glyphs' + (all ? '' : '.empty'), {
            hook: { insert: ctrl.loadGlyphs },
        }, all
            ? [
                h('div.move', all.move.map(renderGlyph$1(ctrl, node))),
                h('div.position', all.position.map(renderGlyph$1(ctrl, node))),
                h('div.observation', all.observation.map(renderGlyph$1(ctrl, node))),
            ]
            : [h('div.study__message', spinner())]);
    }

    function select(s) {
        return [
            h('label.form-label', {
                attrs: { for: 'study-' + s.key },
            }, s.name),
            h(`select#study-${s.key}.form-control`, s.choices.map(function (o) {
                return h('option', {
                    attrs: {
                        value: o[0],
                        selected: s.selected === o[0],
                    },
                }, o[1]);
            })),
        ];
    }
    function ctrl$6(save, getData, trans, redraw, relay) {
        const initAt = Date.now();
        function isNew() {
            const d = getData();
            return d.from === 'scratch' && !!d.isNew && Date.now() - initAt < 9000;
        }
        const open = prop(false);
        return {
            open,
            openIfNew() {
                if (isNew())
                    open(true);
            },
            save(data, isNew) {
                save(data, isNew);
                open(false);
            },
            getData,
            isNew,
            trans,
            redraw,
            relay,
        };
    }
    function view$b(ctrl) {
        const data = ctrl.getData();
        const isNew = ctrl.isNew();
        const updateName = function (vnode, isUpdate) {
            const el = vnode.elm;
            if (!isUpdate && !el.value) {
                el.value = data.name;
                if (isNew)
                    el.select();
                el.focus();
            }
        };
        const userSelectionChoices = [
            ['nobody', ctrl.trans.noarg('nobody')],
            ['owner', ctrl.trans.noarg('onlyMe')],
            ['contributor', ctrl.trans.noarg('contributors')],
            ['member', ctrl.trans.noarg('members')],
            ['everyone', ctrl.trans.noarg('everyone')],
        ];
        return modal$1({
            class: 'study-edit',
            onClose() {
                ctrl.open(false);
                ctrl.redraw();
            },
            content: [
                h('h2', ctrl.trans.noarg(ctrl.relay ? 'configureLiveBroadcast' : isNew ? 'createStudy' : 'editStudy')),
                h('form.form3', {
                    hook: bindSubmit(e => {
                        const getVal = (name) => {
                            const el = e.target.querySelector('#study-' + name);
                            if (el)
                                return el.value;
                            else
                                throw `Missing form input: ${name}`;
                        };
                        ctrl.save({
                            name: getVal('name'),
                            visibility: getVal('visibility'),
                            computer: getVal('computer'),
                            explorer: getVal('explorer'),
                            cloneable: getVal('cloneable'),
                            chat: getVal('chat'),
                            sticky: getVal('sticky'),
                            description: getVal('description'),
                        }, isNew);
                    }, ctrl.redraw),
                }, [
                    h('div.form-group' + (ctrl.relay ? '.none' : ''), [
                        h('label.form-label', { attrs: { for: 'study-name' } }, ctrl.trans.noarg('name')),
                        h('input#study-name.form-control', {
                            attrs: {
                                minlength: 3,
                                maxlength: 100,
                            },
                            hook: {
                                insert: vnode => updateName(vnode, false),
                                postpatch: (_, vnode) => updateName(vnode, true),
                            },
                        }),
                    ]),
                    h('div.form-split', [
                        h('div.form-group.form-half', select({
                            key: 'visibility',
                            name: ctrl.trans.noarg('visibility'),
                            choices: [
                                ['public', ctrl.trans.noarg('public')],
                                ['unlisted', ctrl.trans.noarg('unlisted')],
                                ['private', ctrl.trans.noarg('inviteOnly')],
                            ],
                            selected: data.visibility,
                        })),
                        h('div.form-group.form-half', select({
                            key: 'cloneable',
                            name: ctrl.trans.noarg('allowCloning'),
                            choices: userSelectionChoices,
                            selected: data.settings.cloneable,
                        })),
                    ]),
                    h('div.form-split', [
                        h('div.form-group.form-half', select({
                            key: 'computer',
                            name: ctrl.trans.noarg('computerAnalysis'),
                            choices: userSelectionChoices.map(c => [c[0], ctrl.trans.noarg(c[1])]),
                            selected: data.settings.computer,
                        })),
                        h('div.form-group.form-half', select({
                            key: 'explorer',
                            name: ctrl.trans.noarg('openingExplorer'),
                            choices: userSelectionChoices,
                            selected: data.settings.explorer,
                        })),
                    ]),
                    h('div.form-split', [
                        h('div.form-group.form-half', select({
                            key: 'chat',
                            name: ctrl.trans.noarg('chat'),
                            choices: userSelectionChoices,
                            selected: data.settings.chat,
                        })),
                        h('div.form-group.form-half', select({
                            key: 'sticky',
                            name: ctrl.trans.noarg('enableSync'),
                            choices: [
                                ['true', ctrl.trans.noarg('yesKeepEveryoneOnTheSamePosition')],
                                ['false', ctrl.trans.noarg('noLetPeopleBrowseFreely')],
                            ],
                            selected: '' + data.settings.sticky,
                        })),
                    ]),
                    h('div.form-group.form-half', select({
                        key: 'description',
                        name: ctrl.trans.noarg('pinnedStudyComment'),
                        choices: [
                            ['false', ctrl.trans.noarg('noPinnedComment')],
                            ['true', ctrl.trans.noarg('rightUnderTheBoard')],
                        ],
                        selected: '' + data.settings.description,
                    })),
                    h(`div.form-actions${ctrl.relay ? '' : '.single'}`, [
                        ...(ctrl.relay
                            ? [
                                h('a.text', {
                                    attrs: { 'data-icon': '', href: `/broadcast/${ctrl.relay.data.tour.id}/edit` },
                                }, 'Tournament settings'),
                                h('a.text', {
                                    attrs: { 'data-icon': '', href: `/broadcast/round/${data.id}/edit` },
                                }, 'Round settings'),
                            ]
                            : []),
                        h('button.button', {
                            attrs: { type: 'submit' },
                        }, ctrl.trans.noarg(isNew ? 'start' : 'save')),
                    ]),
                ]),
                h('div.destructive', [
                    isNew
                        ? null
                        : h('form', {
                            attrs: {
                                action: '/study/' + data.id + '/clear-chat',
                                method: 'post',
                            },
                            hook: bind$1('submit', _ => {
                                return confirm(ctrl.trans.noarg('deleteTheStudyChatHistory'));
                            }),
                        }, [h(emptyRedButton, ctrl.trans.noarg('clearChat'))]),
                    h('form', {
                        attrs: {
                            action: '/study/' + data.id + '/delete',
                            method: 'post',
                        },
                        hook: bind$1('submit', _ => {
                            return isNew || confirm(ctrl.trans.noarg('deleteTheEntireStudy'));
                        }),
                    }, [h(emptyRedButton, ctrl.trans.noarg(isNew ? 'cancel' : 'deleteStudy'))]),
                ]),
            ],
        });
    }

    function ctrl$5(save, getTopics, trans, redraw) {
        const open = prop(false);
        return {
            open,
            getTopics,
            save(data) {
                save(data);
                open(false);
            },
            trans,
            redraw,
        };
    }
    function view$a(ctrl) {
        return h('div.study__topics', [
            ...ctrl.topics.getTopics().map(topic => h('a.topic', {
                attrs: { href: `/study/topic/${encodeURIComponent(topic)}/hot` },
            }, topic)),
            ctrl.members.canContribute()
                ? h('a.manage', {
                    hook: bind$1('click', () => ctrl.topics.open(true), ctrl.redraw),
                }, ['Manage topics'])
                : null,
        ]);
    }
    let tagify;
    function formView(ctrl, userId) {
        return modal$1({
            class: 'study-topics',
            onClose() {
                ctrl.open(false);
                ctrl.redraw();
            },
            content: [
                h('h2', 'Study topics'),
                h('form', {
                    hook: bindSubmit(_ => {
                        const tags = tagify === null || tagify === void 0 ? void 0 : tagify.value;
                        tags && ctrl.save(tags.map(t => t.value));
                    }, ctrl.redraw),
                }, [
                    h('textarea', {
                        hook: onInsert(elm => setupTagify(elm, userId)),
                    }, ctrl.getTopics().join(', ').replace(/[<>]/g, '')),
                    h('button.button', {
                        type: 'submit',
                    }, ctrl.trans.noarg('apply')),
                ]),
            ],
        });
    }
    function setupTagify(elm, userId) {
        lichess.loadCssPath('tagify');
        lichess.loadScript('vendor/tagify/tagify.min.js').then(() => {
            tagify = new window.Tagify(elm, {
                pattern: /.{2,}/,
                maxTags: 30,
            });
            let abortCtrl; // for aborting the call
            tagify.on('input', e => {
                const term = e.detail.value.trim();
                if (term.length < 2)
                    return;
                tagify.settings.whitelist.length = 0; // reset the whitelist
                abortCtrl && abortCtrl.abort();
                abortCtrl = new AbortController();
                // show loading animation and hide the suggestions dropdown
                tagify.loading(true).dropdown.hide.call(tagify);
                json(url('/study/topic/autocomplete', { term, user: userId }), { signal: abortCtrl.signal })
                    .then(list => {
                    tagify.settings.whitelist.splice(0, list.length, ...list); // update whitelist Array in-place
                    tagify.loading(false).dropdown.show.call(tagify, term); // render the suggestions dropdown
                });
            });
            $('.tagify__input').each(function () {
                this.focus();
            });
        });
    }

    function ctrl$4(redraw) {
        let current;
        let timeout;
        return {
            set(n) {
                clearTimeout(timeout);
                current = n;
                timeout = setTimeout(function () {
                    current = undefined;
                    redraw();
                }, n.duration);
            },
            get: () => current,
        };
    }
    function view$9(ctrl) {
        const c = ctrl.get();
        return c ? h('div.notif.' + c.class, c.text) : undefined;
    }

    function sync(promise) {
        const sync = {
            sync: undefined,
            promise: promise.then(v => {
                sync.sync = v;
                return v;
            }),
        };
        return sync;
    }

    function lichessVariantRules(variant) {
        switch (variant) {
            case 'standard':
            case 'chess960':
            case 'fromPosition':
                return 'chess';
            case 'threeCheck':
                return '3check';
            case 'kingOfTheHill':
                return 'kingofthehill';
            case 'racingKings':
                return 'racingkings';
            default:
                return variant;
        }
    }

    function defer() {
        const deferred = {};
        deferred.promise = new Promise((resolve, reject) => {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        return deferred;
    }

    const evalRegex = new RegExp('' +
        /^info depth (\d+) seldepth \d+ multipv (\d+) /.source +
        /score (cp|mate) ([-\d]+) /.source +
        /(?:(upper|lower)bound )?nodes (\d+) nps \S+ /.source +
        /(?:hashfull \d+ )?(?:tbhits \d+ )?time (\S+) /.source +
        /pv (.+)/.source);
    const minDepth$2 = 6;
    class Protocol {
        constructor(send, opts) {
            this.send = send;
            this.opts = opts;
            this.engineNameDeferred = defer();
            this.engineName = sync(this.engineNameDeferred.promise);
            this.expectedPvs = 1;
            this.threads = 1;
            this.hashSize = 16;
        }
        init() {
            // Get engine name/version.
            this.send('uci');
            // Analyse without contempt.
            this.setOption('UCI_AnalyseMode', 'true');
            this.setOption('Analysis Contempt', 'Off');
            // Handle variants ("giveaway" is antichess in old asmjs fallback).
            this.setOption('UCI_Chess960', 'true');
            if (this.opts.variant === 'antichess')
                this.setOption('UCI_Variant', 'giveaway');
            else
                this.setOption('UCI_Variant', lichessVariantRules(this.opts.variant));
        }
        setOption(name, value) {
            this.send(`setoption name ${name} value ${value}`);
        }
        received(text) {
            if (text.startsWith('id name '))
                this.engineNameDeferred.resolve(text.substring('id name '.length));
            else if (text.startsWith('bestmove ')) {
                if (this.work && this.currentEval)
                    this.work.emit(this.currentEval);
                this.work = undefined;
                this.swapWork();
                return;
            }
            if (!this.work || this.work.stopRequested)
                return;
            const matches = text.match(evalRegex);
            if (!matches)
                return;
            const depth = parseInt(matches[1]), multiPv = parseInt(matches[2]), isMate = matches[3] === 'mate', povEv = parseInt(matches[4]), evalType = matches[5], nodes = parseInt(matches[6]), elapsedMs = parseInt(matches[7]), moves = matches[8].split(' ');
            // Sometimes we get #0. Let's just skip it.
            if (isMate && !povEv)
                return;
            // Track max pv index to determine when pv prints are done.
            if (this.expectedPvs < multiPv)
                this.expectedPvs = multiPv;
            if (depth < minDepth$2)
                return;
            const pivot = this.work.threatMode ? 0 : 1;
            const ev = this.work.ply % 2 === pivot ? -povEv : povEv;
            // For now, ignore most upperbound/lowerbound messages.
            // The exception is for multiPV, sometimes non-primary PVs
            // only have an upperbound.
            // See: https://github.com/ddugovic/Stockfish/issues/228
            if (evalType && multiPv === 1)
                return;
            const pvData = {
                moves,
                cp: isMate ? undefined : ev,
                mate: isMate ? ev : undefined,
                depth,
            };
            if (multiPv === 1) {
                this.currentEval = {
                    fen: this.work.currentFen,
                    maxDepth: this.work.maxDepth,
                    depth,
                    knps: nodes / elapsedMs,
                    nodes,
                    cp: isMate ? undefined : ev,
                    mate: isMate ? ev : undefined,
                    pvs: [pvData],
                    millis: elapsedMs,
                };
            }
            else if (this.currentEval) {
                this.currentEval.pvs.push(pvData);
                this.currentEval.depth = Math.min(this.currentEval.depth, depth);
            }
            if (multiPv === this.expectedPvs && this.currentEval) {
                this.work.emit(this.currentEval);
            }
        }
        swapWork() {
            this.stop();
            if (!this.work) {
                this.work = this.nextWork;
                this.nextWork = undefined;
                if (this.work) {
                    this.currentEval = undefined;
                    this.expectedPvs = 1;
                    const threads = this.opts.threads ? this.opts.threads() : 1;
                    if (this.threads != threads) {
                        this.threads = threads;
                        this.setOption('Threads', threads);
                    }
                    const hashSize = this.opts.hashSize ? this.opts.hashSize() : 16;
                    if (this.hashSize != hashSize) {
                        this.hashSize = hashSize;
                        this.setOption('Hash', hashSize);
                    }
                    this.setOption('MultiPV', this.work.multiPv);
                    this.send(['position', 'fen', this.work.initialFen, 'moves'].concat(this.work.moves).join(' '));
                    if (this.work.maxDepth >= 99)
                        this.send('go depth 99');
                    else
                        this.send('go movetime 90000 depth ' + this.work.maxDepth);
                }
            }
        }
        start(nextWork) {
            this.nextWork = nextWork;
            this.swapWork();
        }
        stop() {
            if (this.work && !this.work.stopRequested) {
                this.work.stopRequested = true;
                this.send('stop');
            }
        }
        isComputing() {
            return !!this.work && !this.work.stopRequested;
        }
    }

    class AbstractWorker {
        constructor(protocolOpts, opts) {
            this.protocolOpts = protocolOpts;
            this.opts = opts;
            this.isComputing = () => !!this.protocol.sync && this.protocol.sync.isComputing();
            this.engineName = () => { var _a; return (_a = this.protocol.sync) === null || _a === void 0 ? void 0 : _a.engineName.sync; };
            this.protocol = sync(this.boot());
        }
        stop() {
            return this.protocol.promise.then(protocol => protocol.stop());
        }
        start(work) {
            return this.protocol.promise.then(protocol => protocol.start(work));
        }
    }
    class WebWorker extends AbstractWorker {
        boot() {
            this.worker = new Worker(lichess.assetUrl(this.opts.url, { sameDomain: true }));
            const protocol = new Protocol(this.send.bind(this), this.protocolOpts);
            this.worker.addEventListener('message', e => {
                protocol.received(e.data);
            }, true);
            protocol.init();
            return Promise.resolve(protocol);
        }
        destroy() {
            this.worker.terminate();
        }
        send(cmd) {
            this.worker.postMessage(cmd);
        }
    }
    class ThreadedWasmWorker extends AbstractWorker {
        boot() {
            var _a, _b;
            const version = this.opts.version;
            const progress = this.opts.downloadProgress;
            const cache = this.opts.cache;
            const wasmPath = this.opts.baseUrl + 'stockfish.wasm';
            (_a = ThreadedWasmWorker.protocols)[_b = this.opts.module] || (_a[_b] = lichess
                .loadScript(this.opts.baseUrl + 'stockfish.js', { version })
                .then(_ => progress &&
                new Promise(async (resolve, reject) => {
                    if (cache) {
                        const [found, data] = await cache.get(wasmPath, version);
                        if (found) {
                            resolve(data);
                            return;
                        }
                    }
                    const req = new XMLHttpRequest();
                    req.open('GET', lichess.assetUrl(wasmPath, { version }), true);
                    req.responseType = 'arraybuffer';
                    req.onerror = event => reject(event);
                    req.onprogress = event => progress(event.loaded);
                    req.onload = _ => {
                        progress(0);
                        resolve(req.response);
                    };
                    req.send();
                }))
                .then(async (wasmBinary) => {
                if (cache && wasmBinary) {
                    await cache.set(wasmPath, version, wasmBinary);
                }
                return window[this.opts.module]({
                    wasmBinary,
                    locateFile: (path) => lichess.assetUrl(this.opts.baseUrl + path, { version, sameDomain: path.endsWith('.worker.js') }),
                    wasmMemory: this.opts.wasmMemory,
                });
            })
                .then((sf) => {
                ThreadedWasmWorker.sf[this.opts.module] = sf;
                const protocol = new Protocol(this.send.bind(this), this.protocolOpts);
                sf.addMessageListener(protocol.received.bind(protocol));
                protocol.init();
                return protocol;
            }));
            return ThreadedWasmWorker.protocols[this.opts.module];
        }
        destroy() {
            var _a;
            // Terminated instances to not get freed reliably
            // (https://github.com/ornicar/lila/issues/7334). So instead of
            // destroying, just stop instances and keep them around for reuse.
            (_a = this.protocol.sync) === null || _a === void 0 ? void 0 : _a.stop();
        }
        send(cmd) {
            var _a;
            (_a = ThreadedWasmWorker.sf[this.opts.module]) === null || _a === void 0 ? void 0 : _a.postMessage(cmd);
        }
    }
    ThreadedWasmWorker.protocols = {};
    ThreadedWasmWorker.sf = {};

    function toPov(color, diff) {
        return color === 'white' ? diff : -diff;
    }
    /**
     * https://graphsketch.com/?eqn1_color=1&eqn1_eqn=100+*+%282+%2F+%281+%2B+exp%28-0.005+*+x%29%29+-+1%29&eqn2_color=2&eqn2_eqn=100+*+%282+%2F+%281+%2B+exp%28-0.004+*+x%29%29+-+1%29&eqn3_color=3&eqn3_eqn=&eqn4_color=4&eqn4_eqn=&eqn5_color=5&eqn5_eqn=&eqn6_color=6&eqn6_eqn=&x_min=-1000&x_max=1000&y_min=-100&y_max=100&x_tick=100&y_tick=10&x_label_freq=2&y_label_freq=2&do_grid=0&do_grid=1&bold_labeled_lines=0&bold_labeled_lines=1&line_width=4&image_w=850&image_h=525
     */
    function rawWinningChances(cp) {
        return 2 / (1 + Math.exp(-0.004 * cp)) - 1;
    }
    function cpWinningChances(cp) {
        return rawWinningChances(Math.min(Math.max(-1000, cp), 1000));
    }
    function mateWinningChances(mate) {
        const cp = (21 - Math.min(10, Math.abs(mate))) * 100;
        const signed = cp * (mate > 0 ? 1 : -1);
        return rawWinningChances(signed);
    }
    function evalWinningChances(ev) {
        return typeof ev.mate !== 'undefined' ? mateWinningChances(ev.mate) : cpWinningChances(ev.cp);
    }
    // winning chances for a color
    // 1  infinitely winning
    // -1 infinitely losing
    function povChances(color, ev) {
        return toPov(color, evalWinningChances(ev));
    }
    // computes the difference, in winning chances, between two evaluations
    // 1  = e1 is infinitely better than e2
    // -1 = e1 is infinitely worse  than e2
    function povDiff(color, e1, e2) {
        return (povChances(color, e1) - povChances(color, e2)) / 2;
    }

    function isEvalBetter(a, b) {
        return !b || a.depth > b.depth || (a.depth === b.depth && a.nodes > b.nodes);
    }
    function renderEval$1(e) {
        e = Math.max(Math.min(Math.round(e / 10) / 10, 99), -99);
        return (e > 0 ? '+' : '') + e.toFixed(1);
    }
    function sanIrreversible(variant, san) {
        if (san.startsWith('O-O'))
            return true;
        if (variant === 'crazyhouse')
            return false;
        if (san.includes('x'))
            return true; // capture
        if (san.toLowerCase() === san)
            return true; // pawn move
        return variant === 'threeCheck' && san.includes('+');
    }

    function promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            // @ts-ignore - file size hacks
            request.oncomplete = request.onsuccess = () => resolve(request.result);
            // @ts-ignore - file size hacks
            request.onabort = request.onerror = () => reject(request.error);
        });
    }
    function createStore(dbName, storeName) {
        const request = indexedDB.open(dbName);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        const dbp = promisifyRequest(request);
        return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
    }
    let defaultGetStoreFunc;
    function defaultGetStore() {
        if (!defaultGetStoreFunc) {
            defaultGetStoreFunc = createStore('keyval-store', 'keyval');
        }
        return defaultGetStoreFunc;
    }
    /**
     * Get a value by its key.
     *
     * @param key
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    function get$1(key, customStore = defaultGetStore()) {
        return customStore('readonly', (store) => promisifyRequest(store.get(key)));
    }
    /**
     * Set a value with a key.
     *
     * @param key
     * @param value
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    function set(key, value, customStore = defaultGetStore()) {
        return customStore('readwrite', (store) => {
            store.put(value, key);
            return promisifyRequest(store.transaction);
        });
    }

    class Cache {
        constructor(name) {
            this.store = createStore(`${name}--db`, `${name}--store`);
        }
        async get(key, version) {
            const cachedVersion = await get$1(`${key}--version`, this.store);
            if (cachedVersion !== version) {
                return [false, undefined];
            }
            const data = await get$1(`${key}--data`, this.store);
            return [true, data];
        }
        async set(key, version, data) {
            const cachedVersion = await get$1(`${key}--version`, this.store);
            if (cachedVersion === version) {
                return;
            }
            await set(`${key}--version`, version, this.store);
            await set(`${key}--data`, data, this.store);
        }
    }

    function sharedWasmMemory(initial, maximum) {
        return new WebAssembly.Memory({ shared: true, initial, maximum });
    }
    function sendableSharedWasmMemory(initial, maximum) {
        // Atomics
        if (typeof Atomics !== 'object')
            return;
        // SharedArrayBuffer
        if (typeof SharedArrayBuffer !== 'function')
            return;
        // Shared memory
        const mem = sharedWasmMemory(initial, maximum);
        if (!(mem.buffer instanceof SharedArrayBuffer))
            return;
        // Structured cloning
        try {
            window.postMessage(mem, '*');
        }
        catch (e) {
            return;
        }
        return mem;
    }
    function median(values) {
        values.sort((a, b) => a - b);
        const half = Math.floor(values.length / 2);
        return values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2.0;
    }
    function enabledAfterDisable() {
        const enabledAfter = lichess.tempStorage.get('ceval.enabled-after');
        const disable = lichess.storage.get('ceval.disable');
        return !disable || enabledAfter === disable;
    }
    function cevalCtrl (opts) {
        var _a;
        const storageKey = (k) => {
            return opts.storageKeyPrefix ? `${opts.storageKeyPrefix}.${k}` : k;
        };
        const enableNnue = storedProp('ceval.enable-nnue', !((_a = navigator.connection) === null || _a === void 0 ? void 0 : _a.saveData));
        // select nnue > hce > wasm > asmjs
        const officialStockfish = opts.standardMaterial && ['standard', 'fromPosition', 'chess960'].includes(opts.variant.key);
        let technology = 'asmjs';
        let growableSharedMem = false;
        let supportsNnue = false;
        const source = Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0]);
        if (typeof WebAssembly === 'object' && typeof WebAssembly.validate === 'function' && WebAssembly.validate(source)) {
            technology = 'wasm'; // WebAssembly 1.0
            const sharedMem = sendableSharedWasmMemory(8, 16);
            if (sharedMem) {
                technology = 'hce';
                // i32x4.dot_i16x8_s
                const sourceWithSimd = Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 7, 8, 1, 4, 116, 101, 115, 116, 0, 0, 10, 15, 1, 13, 0, 65, 0, 253, 17, 65, 0, 253, 17, 253, 186, 1, 11]); // prettier-ignore
                supportsNnue = WebAssembly.validate(sourceWithSimd);
                if (supportsNnue && officialStockfish && enableNnue())
                    technology = 'nnue';
                try {
                    sharedMem.grow(8);
                    growableSharedMem = true;
                }
                catch (e) {
                    // memory growth not supported
                }
            }
        }
        const initialAllocationMaxThreads = officialStockfish ? 2 : 1;
        const maxThreads = Math.min(Math.max((navigator.hardwareConcurrency || 1) - 1, 1), growableSharedMem ? 32 : initialAllocationMaxThreads);
        const threads = storedProp(storageKey('ceval.threads'), Math.min(Math.ceil((navigator.hardwareConcurrency || 1) / 4), maxThreads));
        const maxHashSize = Math.min(((navigator.deviceMemory || 0.25) * 1024) / 8, growableSharedMem ? 1024 : 16);
        const hashSize = storedProp(storageKey('ceval.hash-size'), 16);
        const maxDepth = storedProp(storageKey('ceval.max-depth'), 18);
        const multiPv = storedProp(storageKey('ceval.multipv'), opts.multiPvDefault || 1);
        const infinite = storedProp('ceval.infinite', false);
        let curEval = null;
        const allowed = prop(true);
        const enabled = prop(opts.possible && allowed() && enabledAfterDisable());
        const downloadProgress = prop(0);
        let started = false;
        let lastStarted = false; // last started object (for going deeper even if stopped)
        const hovering = prop(null);
        const pvBoard = prop(null);
        const isDeeper = prop(false);
        const protocolOpts = {
            variant: opts.variant.key,
            threads: (technology == 'hce' || technology == 'nnue') && (() => Math.min(parseInt(threads()), maxThreads)),
            hashSize: (technology == 'hce' || technology == 'nnue') && (() => Math.min(parseInt(hashSize()), maxHashSize)),
        };
        let worker;
        // adjusts maxDepth based on nodes per second
        const npsRecorder = (() => {
            const values = [];
            const applies = (ev) => {
                return (ev.knps &&
                    ev.depth >= 16 &&
                    typeof ev.cp !== 'undefined' &&
                    Math.abs(ev.cp) < 500 &&
                    ev.fen.split(/\s/)[0].split(/[nbrqkp]/i).length - 1 >= 10);
            };
            return (ev) => {
                if (!applies(ev))
                    return;
                values.push(ev.knps);
                if (values.length > 9) {
                    const knps = median(values) || 0;
                    let depth = 18;
                    if (knps > 100)
                        depth = 19;
                    if (knps > 150)
                        depth = 20;
                    if (knps > 250)
                        depth = 21;
                    if (knps > 500)
                        depth = 22;
                    if (knps > 1000)
                        depth = 23;
                    if (knps > 2000)
                        depth = 24;
                    if (knps > 3500)
                        depth = 25;
                    if (knps > 5000)
                        depth = 26;
                    if (knps > 7000)
                        depth = 27;
                    // TODO: Maybe we want to get deeper for slow NNUE?
                    depth += 2 * Number(technology === 'nnue');
                    maxDepth(depth);
                    if (values.length > 40)
                        values.shift();
                }
            };
        })();
        let lastEmitFen = null;
        const onEmit = throttle(200, (ev, work) => {
            sortPvsInPlace(ev.pvs, work.ply % 2 === (work.threatMode ? 1 : 0) ? 'white' : 'black');
            npsRecorder(ev);
            curEval = ev;
            opts.emit(ev, work);
            if (ev.fen !== lastEmitFen && enabledAfterDisable()) {
                // amnesty while auto disable not processed
                lastEmitFen = ev.fen;
                lichess.storage.fire('ceval.fen', ev.fen);
            }
        });
        const effectiveMaxDepth = () => (isDeeper() || infinite() ? 99 : parseInt(maxDepth()));
        const sortPvsInPlace = (pvs, color) => pvs.sort(function (a, b) {
            return povChances(color, b) - povChances(color, a);
        });
        const start = (path, steps, threatMode, deeper) => {
            if (!enabled() || !opts.possible || !enabledAfterDisable())
                return;
            isDeeper(deeper);
            const maxD = effectiveMaxDepth();
            const step = steps[steps.length - 1];
            const existing = threatMode ? step.threat : step.ceval;
            if (existing && existing.depth >= maxD) {
                lastStarted = {
                    path,
                    steps,
                    threatMode,
                };
                return;
            }
            const work = {
                initialFen: steps[0].fen,
                moves: [],
                currentFen: step.fen,
                path,
                ply: step.ply,
                maxDepth: maxD,
                multiPv: parseInt(multiPv()),
                threatMode,
                emit(ev) {
                    if (enabled())
                        onEmit(ev, work);
                },
                stopRequested: false,
            };
            if (threatMode) {
                const c = step.ply % 2 === 1 ? 'w' : 'b';
                const fen = step.fen.replace(/ (w|b) /, ' ' + c + ' ');
                work.currentFen = fen;
                work.initialFen = fen;
            }
            else {
                // send fen after latest castling move and the following moves
                for (let i = 1; i < steps.length; i++) {
                    const s = steps[i];
                    if (sanIrreversible(opts.variant.key, s.san)) {
                        work.moves = [];
                        work.initialFen = s.fen;
                    }
                    else
                        work.moves.push(s.uci);
                }
            }
            // Notify all other tabs to disable ceval.
            lichess.storage.fire('ceval.disable');
            lichess.tempStorage.set('ceval.enabled-after', lichess.storage.get('ceval.disable'));
            if (!worker) {
                if (technology == 'nnue')
                    worker = new ThreadedWasmWorker(protocolOpts, {
                        baseUrl: 'vendor/stockfish-nnue.wasm/',
                        module: 'Stockfish',
                        downloadProgress: throttle(200, mb => {
                            downloadProgress(mb);
                            opts.redraw();
                        }),
                        version: '85a969',
                        wasmMemory: sharedWasmMemory(2048, growableSharedMem ? 32768 : 2048),
                        cache: new Cache('ceval-wasm-cache'),
                    });
                else if (technology == 'hce')
                    worker = new ThreadedWasmWorker(protocolOpts, {
                        baseUrl: officialStockfish ? 'vendor/stockfish.wasm/' : 'vendor/stockfish-mv.wasm/',
                        module: officialStockfish ? 'Stockfish' : 'StockfishMv',
                        wasmMemory: sharedWasmMemory(1024, growableSharedMem ? 32768 : 1088),
                    });
                else
                    worker = new WebWorker(protocolOpts, {
                        url: technology == 'wasm' ? 'vendor/stockfish.js/stockfish.wasm.js' : 'vendor/stockfish.js/stockfish.js',
                    });
            }
            worker.start(work);
            started = {
                path,
                steps,
                threatMode,
            };
        };
        function goDeeper() {
            const s = started || lastStarted;
            if (s) {
                stop();
                start(s.path, s.steps, s.threatMode, true);
            }
        }
        function stop() {
            if (!enabled() || !started)
                return;
            worker === null || worker === void 0 ? void 0 : worker.stop();
            lastStarted = started;
            started = false;
        }
        return {
            technology,
            start,
            stop,
            allowed,
            possible: opts.possible,
            enabled,
            downloadProgress,
            multiPv,
            threads: technology == 'hce' || technology == 'nnue' ? threads : undefined,
            hashSize: technology == 'hce' || technology == 'nnue' ? hashSize : undefined,
            maxThreads,
            maxHashSize,
            infinite,
            supportsNnue,
            enableNnue,
            hovering,
            setHovering(fen, uci) {
                hovering(uci
                    ? {
                        fen,
                        uci,
                    }
                    : null);
                opts.setAutoShapes();
            },
            pvBoard,
            setPvBoard(_pvBoard) {
                pvBoard(_pvBoard);
                opts.redraw();
            },
            toggle() {
                if (!opts.possible || !allowed())
                    return;
                stop();
                if (!enabled() && !document.hidden) {
                    const disable = lichess.storage.get('ceval.disable');
                    if (disable)
                        lichess.tempStorage.set('ceval.enabled-after', disable);
                    enabled(true);
                }
                else {
                    lichess.tempStorage.set('ceval.enabled-after', '');
                    enabled(false);
                }
            },
            curDepth: () => (curEval ? curEval.depth : 0),
            effectiveMaxDepth,
            variant: opts.variant,
            isDeeper,
            goDeeper,
            canGoDeeper: () => !isDeeper() && !infinite() && !(worker === null || worker === void 0 ? void 0 : worker.isComputing()),
            isComputing: () => !!started && !!(worker === null || worker === void 0 ? void 0 : worker.isComputing()),
            engineName: () => worker === null || worker === void 0 ? void 0 : worker.engineName(),
            destroy: () => worker === null || worker === void 0 ? void 0 : worker.destroy(),
            redraw: opts.redraw,
        };
    }

    function popcnt32(n) {
        n = n - ((n >>> 1) & 1431655765);
        n = (n & 858993459) + ((n >>> 2) & 858993459);
        return Math.imul((n + (n >>> 4)) & 252645135, 16843009) >> 24;
    }
    function bswap32(n) {
        n = ((n >>> 8) & 16711935) | ((n & 16711935) << 8);
        return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
    }
    function rbit32(n) {
        n = ((n >>> 1) & 1431655765) | ((n & 1431655765) << 1);
        n = ((n >>> 2) & 858993459) | ((n & 858993459) << 2);
        n = ((n >>> 4) & 252645135) | ((n & 252645135) << 4);
        return bswap32(n);
    }
    class SquareSet {
        constructor(lo, hi) {
            this.lo = lo;
            this.hi = hi;
            this.lo = lo | 0;
            this.hi = hi | 0;
        }
        static fromSquare(square) {
            return square >= 32 ? new SquareSet(0, 1 << (square - 32)) : new SquareSet(1 << square, 0);
        }
        static fromRank(rank) {
            return new SquareSet(0xff, 0).shl64(8 * rank);
        }
        static fromFile(file) {
            return new SquareSet(16843009 << file, 16843009 << file);
        }
        static empty() {
            return new SquareSet(0, 0);
        }
        static full() {
            return new SquareSet(4294967295, 4294967295);
        }
        static corners() {
            return new SquareSet(0x81, 2164260864);
        }
        static center() {
            return new SquareSet(402653184, 0x18);
        }
        static backranks() {
            return new SquareSet(0xff, 4278190080);
        }
        static backrank(color) {
            return color === 'white' ? new SquareSet(0xff, 0) : new SquareSet(0, 4278190080);
        }
        static lightSquares() {
            return new SquareSet(1437226410, 1437226410);
        }
        static darkSquares() {
            return new SquareSet(2857740885, 2857740885);
        }
        complement() {
            return new SquareSet(~this.lo, ~this.hi);
        }
        xor(other) {
            return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
        }
        union(other) {
            return new SquareSet(this.lo | other.lo, this.hi | other.hi);
        }
        intersect(other) {
            return new SquareSet(this.lo & other.lo, this.hi & other.hi);
        }
        diff(other) {
            return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
        }
        intersects(other) {
            return this.intersect(other).nonEmpty();
        }
        isDisjoint(other) {
            return this.intersect(other).isEmpty();
        }
        supersetOf(other) {
            return other.diff(this).isEmpty();
        }
        subsetOf(other) {
            return this.diff(other).isEmpty();
        }
        shr64(shift) {
            if (shift >= 64)
                return SquareSet.empty();
            if (shift >= 32)
                return new SquareSet(this.hi >>> (shift - 32), 0);
            if (shift > 0)
                return new SquareSet((this.lo >>> shift) ^ (this.hi << (32 - shift)), this.hi >>> shift);
            return this;
        }
        shl64(shift) {
            if (shift >= 64)
                return SquareSet.empty();
            if (shift >= 32)
                return new SquareSet(0, this.lo << (shift - 32));
            if (shift > 0)
                return new SquareSet(this.lo << shift, (this.hi << shift) ^ (this.lo >>> (32 - shift)));
            return this;
        }
        bswap64() {
            return new SquareSet(bswap32(this.hi), bswap32(this.lo));
        }
        rbit64() {
            return new SquareSet(rbit32(this.hi), rbit32(this.lo));
        }
        minus64(other) {
            const lo = this.lo - other.lo;
            const c = ((lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1)) >>> 31;
            return new SquareSet(lo, this.hi - (other.hi + c));
        }
        equals(other) {
            return this.lo === other.lo && this.hi === other.hi;
        }
        size() {
            return popcnt32(this.lo) + popcnt32(this.hi);
        }
        isEmpty() {
            return this.lo === 0 && this.hi === 0;
        }
        nonEmpty() {
            return this.lo !== 0 || this.hi !== 0;
        }
        has(square) {
            return (square >= 32 ? this.hi & (1 << (square - 32)) : this.lo & (1 << square)) !== 0;
        }
        set(square, on) {
            return on ? this.with(square) : this.without(square);
        }
        with(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi | (1 << (square - 32)))
                : new SquareSet(this.lo | (1 << square), this.hi);
        }
        without(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi & ~(1 << (square - 32)))
                : new SquareSet(this.lo & ~(1 << square), this.hi);
        }
        toggle(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi ^ (1 << (square - 32)))
                : new SquareSet(this.lo ^ (1 << square), this.hi);
        }
        last() {
            if (this.hi !== 0)
                return 63 - Math.clz32(this.hi);
            if (this.lo !== 0)
                return 31 - Math.clz32(this.lo);
            return;
        }
        first() {
            if (this.lo !== 0)
                return 31 - Math.clz32(this.lo & -this.lo);
            if (this.hi !== 0)
                return 63 - Math.clz32(this.hi & -this.hi);
            return;
        }
        withoutFirst() {
            if (this.lo !== 0)
                return new SquareSet(this.lo & (this.lo - 1), this.hi);
            return new SquareSet(0, this.hi & (this.hi - 1));
        }
        moreThanOne() {
            return (this.hi !== 0 && this.lo !== 0) || (this.lo & (this.lo - 1)) !== 0 || (this.hi & (this.hi - 1)) !== 0;
        }
        singleSquare() {
            return this.moreThanOne() ? undefined : this.last();
        }
        isSingleSquare() {
            return this.nonEmpty() && !this.moreThanOne();
        }
        *[Symbol.iterator]() {
            let lo = this.lo;
            let hi = this.hi;
            while (lo !== 0) {
                const idx = 31 - Math.clz32(lo & -lo);
                lo ^= 1 << idx;
                yield idx;
            }
            while (hi !== 0) {
                const idx = 31 - Math.clz32(hi & -hi);
                hi ^= 1 << idx;
                yield 32 + idx;
            }
        }
        *reversed() {
            let lo = this.lo;
            let hi = this.hi;
            while (hi !== 0) {
                const idx = 31 - Math.clz32(hi);
                hi ^= 1 << idx;
                yield 32 + idx;
            }
            while (lo !== 0) {
                const idx = 31 - Math.clz32(lo);
                lo ^= 1 << idx;
                yield idx;
            }
        }
    }

    /**
     * Compute attacks and rays.
     *
     * These are low-level functions that can be used to implement chess rules.
     *
     * Implementation notes: Sliding attacks are computed using
     * [hyperbola quintessence](https://www.chessprogramming.org/Hyperbola_Quintessence).
     * Magic bitboards would deliver faster lookups, but also require
     * initializing considerably larger attack tables. On the web, initialization
     * time is important, so the chosen method may strike a better balance.
     *
     * @packageDocumentation
     */
    function computeRange(square, deltas) {
        let range = SquareSet.empty();
        for (const delta of deltas) {
            const sq = square + delta;
            if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
                range = range.with(sq);
            }
        }
        return range;
    }
    function tabulate(f) {
        const table = [];
        for (let square = 0; square < 64; square++)
            table[square] = f(square);
        return table;
    }
    const KING_ATTACKS = tabulate(sq => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
    const KNIGHT_ATTACKS = tabulate(sq => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
    const PAWN_ATTACKS = {
        white: tabulate(sq => computeRange(sq, [7, 9])),
        black: tabulate(sq => computeRange(sq, [-7, -9])),
    };
    /**
     * Gets squares attacked or defended by a king on `square`.
     */
    function kingAttacks(square) {
        return KING_ATTACKS[square];
    }
    /**
     * Gets squares attacked or defended by a knight on `square`.
     */
    function knightAttacks(square) {
        return KNIGHT_ATTACKS[square];
    }
    /**
     * Gets squares attacked or defended by a pawn of the given `color`
     * on `square`.
     */
    function pawnAttacks(color, square) {
        return PAWN_ATTACKS[color][square];
    }
    const FILE_RANGE = tabulate(sq => SquareSet.fromFile(squareFile(sq)).without(sq));
    const RANK_RANGE = tabulate(sq => SquareSet.fromRank(squareRank(sq)).without(sq));
    const DIAG_RANGE = tabulate(sq => {
        const diag = new SquareSet(134480385, 2151686160);
        const shift = 8 * (squareRank(sq) - squareFile(sq));
        return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
    });
    const ANTI_DIAG_RANGE = tabulate(sq => {
        const diag = new SquareSet(270549120, 16909320);
        const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
        return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
    });
    function hyperbola(bit, range, occupied) {
        let forward = occupied.intersect(range);
        let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
        forward = forward.minus64(bit);
        reverse = reverse.minus64(bit.bswap64());
        return forward.xor(reverse.bswap64()).intersect(range);
    }
    function fileAttacks(square, occupied) {
        return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
    }
    function rankAttacks(square, occupied) {
        const range = RANK_RANGE[square];
        let forward = occupied.intersect(range);
        let reverse = forward.rbit64();
        forward = forward.minus64(SquareSet.fromSquare(square));
        reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
        return forward.xor(reverse.rbit64()).intersect(range);
    }
    /**
     * Gets squares attacked or defended by a bishop on `square`, given `occupied`
     * squares.
     */
    function bishopAttacks(square, occupied) {
        const bit = SquareSet.fromSquare(square);
        return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
    }
    /**
     * Gets squares attacked or defended by a rook on `square`, given `occupied`
     * squares.
     */
    function rookAttacks(square, occupied) {
        return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
    }
    /**
     * Gets squares attacked or defended by a queen on `square`, given `occupied`
     * squares.
     */
    function queenAttacks(square, occupied) {
        return bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
    }
    /**
     * Gets squares attacked or defended by a `piece` on `square`, given
     * `occupied` squares.
     */
    function attacks(piece, square, occupied) {
        switch (piece.role) {
            case 'pawn':
                return pawnAttacks(piece.color, square);
            case 'knight':
                return knightAttacks(square);
            case 'bishop':
                return bishopAttacks(square, occupied);
            case 'rook':
                return rookAttacks(square, occupied);
            case 'queen':
                return queenAttacks(square, occupied);
            case 'king':
                return kingAttacks(square);
        }
    }
    /**
     * Gets all squares of the rank, file or diagonal with the two squares
     * `a` and `b`, or an empty set if they are not aligned.
     */
    function ray(a, b) {
        const other = SquareSet.fromSquare(b);
        if (RANK_RANGE[a].intersects(other))
            return RANK_RANGE[a].with(a);
        if (ANTI_DIAG_RANGE[a].intersects(other))
            return ANTI_DIAG_RANGE[a].with(a);
        if (DIAG_RANGE[a].intersects(other))
            return DIAG_RANGE[a].with(a);
        if (FILE_RANGE[a].intersects(other))
            return FILE_RANGE[a].with(a);
        return SquareSet.empty();
    }
    /**
     * Gets all squares between `a` and `b` (bounds not included), or an empty set
     * if they are not on the same rank, file or diagonal.
     */
    function between(a, b) {
        return ray(a, b)
            .intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b)))
            .withoutFirst();
    }

    function makeSanWithoutSuffix(pos, move) {
        let san = '';
        if (isDrop(move)) {
            if (move.role !== 'pawn')
                san = roleToChar(move.role).toUpperCase();
            san += '@' + makeSquare(move.to);
        }
        else {
            const role = pos.board.getRole(move.from);
            if (!role)
                return '--';
            if (role === 'king' && (pos.board[pos.turn].has(move.to) || Math.abs(move.to - move.from) === 2)) {
                san = move.to > move.from ? 'O-O' : 'O-O-O';
            }
            else {
                const capture = pos.board.occupied.has(move.to) || (role === 'pawn' && squareFile(move.from) !== squareFile(move.to));
                if (role !== 'pawn') {
                    san = roleToChar(role).toUpperCase();
                    // Disambiguation
                    let others;
                    if (role === 'king')
                        others = kingAttacks(move.to).intersect(pos.board.king);
                    else if (role === 'queen')
                        others = queenAttacks(move.to, pos.board.occupied).intersect(pos.board.queen);
                    else if (role === 'rook')
                        others = rookAttacks(move.to, pos.board.occupied).intersect(pos.board.rook);
                    else if (role === 'bishop')
                        others = bishopAttacks(move.to, pos.board.occupied).intersect(pos.board.bishop);
                    else
                        others = knightAttacks(move.to).intersect(pos.board.knight);
                    others = others.intersect(pos.board[pos.turn]).without(move.from);
                    if (others.nonEmpty()) {
                        const ctx = pos.ctx();
                        for (const from of others) {
                            if (!pos.dests(from, ctx).has(move.to))
                                others = others.without(from);
                        }
                        if (others.nonEmpty()) {
                            let row = false;
                            let column = others.intersects(SquareSet.fromRank(squareRank(move.from)));
                            if (others.intersects(SquareSet.fromFile(squareFile(move.from))))
                                row = true;
                            else
                                column = true;
                            if (column)
                                san += FILE_NAMES[squareFile(move.from)];
                            if (row)
                                san += RANK_NAMES[squareRank(move.from)];
                        }
                    }
                }
                else if (capture)
                    san = FILE_NAMES[squareFile(move.from)];
                if (capture)
                    san += 'x';
                san += makeSquare(move.to);
                if (move.promotion)
                    san += '=' + roleToChar(move.promotion).toUpperCase();
            }
        }
        return san;
    }
    function makeSanAndPlay(pos, move) {
        var _a;
        const san = makeSanWithoutSuffix(pos, move);
        pos.play(move);
        if ((_a = pos.outcome()) === null || _a === void 0 ? void 0 : _a.winner)
            return san + '#';
        if (pos.isCheck())
            return san + '+';
        return san;
    }
    function makeSan(pos, move) {
        return makeSanAndPlay(pos.clone(), move);
    }

    function r(r,n){r.prototype=Object.create(n.prototype),r.prototype.constructor=r,r.__proto__=n;}var n,t=function(){function r(){}var t=r.prototype;return t.unwrap=function(r,t){var o=this._chain(function(t){return n.ok(r?r(t):t)},function(r){return t?n.ok(t(r)):n.err(r)});if(o.isErr)throw o.error;return o.value},t.map=function(r,t){return this._chain(function(t){return n.ok(r(t))},function(r){return n.err(t?t(r):r)})},t.chain=function(r,t){return this._chain(r,t||function(r){return n.err(r)})},r}(),o=function(n){function t(r){var t;return (t=n.call(this)||this).value=r,t.isOk=!0,t.isErr=!1,t}return r(t,n),t.prototype._chain=function(r,n){return r(this.value)},t}(t),e=function(n){function t(r){var t;return (t=n.call(this)||this).error=r,t.isOk=!1,t.isErr=!0,t}return r(t,n),t.prototype._chain=function(r,n){return n(this.error)},t}(t);!function(r){r.ok=function(r){return new o(r)},r.err=function(r){return new e(r||new Error)},r.all=function(n){if(Array.isArray(n)){for(var t=[],o=0;o<n.length;o++){var e=n[o];if(e.isErr)return e;t.push(e.value);}return r.ok(t)}for(var u={},i=Object.keys(n),c=0;c<i.length;c++){var a=n[i[c]];if(a.isErr)return a;u[i[c]]=a.value;}return r.ok(u)};}(n||(n={}));

    /**
     * Piece positions on a board.
     *
     * Properties are sets of squares, like `board.occupied` for all occupied
     * squares, `board[color]` for all pieces of that color, and `board[role]`
     * for all pieces of that role. When modifying the properties directly, take
     * care to keep them consistent.
     */
    class Board {
        constructor() { }
        static default() {
            const board = new Board();
            board.reset();
            return board;
        }
        static racingKings() {
            const board = new Board();
            board.occupied = new SquareSet(0xffff, 0);
            board.promoted = SquareSet.empty();
            board.white = new SquareSet(0xf0f0, 0);
            board.black = new SquareSet(0x0f0f, 0);
            board.pawn = SquareSet.empty();
            board.knight = new SquareSet(0x1818, 0);
            board.bishop = new SquareSet(0x2424, 0);
            board.rook = new SquareSet(0x4242, 0);
            board.queen = new SquareSet(0x0081, 0);
            board.king = new SquareSet(0x8100, 0);
            return board;
        }
        static horde() {
            const board = new Board();
            board.occupied = new SquareSet(4294967295, 4294901862);
            board.promoted = SquareSet.empty();
            board.white = new SquareSet(4294967295, 102);
            board.black = new SquareSet(0, 4294901760);
            board.pawn = new SquareSet(4294967295, 16711782);
            board.knight = new SquareSet(0, 1107296256);
            board.bishop = new SquareSet(0, 603979776);
            board.rook = new SquareSet(0, 2164260864);
            board.queen = new SquareSet(0, 134217728);
            board.king = new SquareSet(0, 268435456);
            return board;
        }
        /**
         * Resets all pieces to the default starting position for standard chess.
         */
        reset() {
            this.occupied = new SquareSet(0xffff, 4294901760);
            this.promoted = SquareSet.empty();
            this.white = new SquareSet(0xffff, 0);
            this.black = new SquareSet(0, 4294901760);
            this.pawn = new SquareSet(0xff00, 16711680);
            this.knight = new SquareSet(0x42, 1107296256);
            this.bishop = new SquareSet(0x24, 603979776);
            this.rook = new SquareSet(0x81, 2164260864);
            this.queen = new SquareSet(0x8, 134217728);
            this.king = new SquareSet(0x10, 268435456);
        }
        static empty() {
            const board = new Board();
            board.clear();
            return board;
        }
        clear() {
            this.occupied = SquareSet.empty();
            this.promoted = SquareSet.empty();
            for (const color of COLORS)
                this[color] = SquareSet.empty();
            for (const role of ROLES)
                this[role] = SquareSet.empty();
        }
        clone() {
            const board = new Board();
            board.occupied = this.occupied;
            board.promoted = this.promoted;
            for (const color of COLORS)
                board[color] = this[color];
            for (const role of ROLES)
                board[role] = this[role];
            return board;
        }
        equalsIgnorePromoted(other) {
            if (!this.white.equals(other.white))
                return false;
            return ROLES.every(role => this[role].equals(other[role]));
        }
        equals(other) {
            return this.equalsIgnorePromoted(other) && this.promoted.equals(other.promoted);
        }
        getColor(square) {
            if (this.white.has(square))
                return 'white';
            if (this.black.has(square))
                return 'black';
            return;
        }
        getRole(square) {
            for (const role of ROLES) {
                if (this[role].has(square))
                    return role;
            }
            return;
        }
        get(square) {
            const color = this.getColor(square);
            if (!color)
                return;
            const role = this.getRole(square);
            const promoted = this.promoted.has(square);
            return { color, role, promoted };
        }
        /**
         * Removes and returns the piece from the given `square`, if any.
         */
        take(square) {
            const piece = this.get(square);
            if (piece) {
                this.occupied = this.occupied.without(square);
                this[piece.color] = this[piece.color].without(square);
                this[piece.role] = this[piece.role].without(square);
                if (piece.promoted)
                    this.promoted = this.promoted.without(square);
            }
            return piece;
        }
        /**
         * Put `piece` onto `square`, potentially replacing an existing piece.
         * Returns the existing piece, if any.
         */
        set(square, piece) {
            const old = this.take(square);
            this.occupied = this.occupied.with(square);
            this[piece.color] = this[piece.color].with(square);
            this[piece.role] = this[piece.role].with(square);
            if (piece.promoted)
                this.promoted = this.promoted.with(square);
            return old;
        }
        has(square) {
            return this.occupied.has(square);
        }
        *[Symbol.iterator]() {
            for (const square of this.occupied) {
                yield [square, this.get(square)];
            }
        }
        pieces(color, role) {
            return this[color].intersect(this[role]);
        }
        rooksAndQueens() {
            return this.rook.union(this.queen);
        }
        bishopsAndQueens() {
            return this.bishop.union(this.queen);
        }
        /**
         * Finds the unique unpromoted king of the given `color`, if any.
         */
        kingOf(color) {
            return this.king.intersect(this[color]).diff(this.promoted).singleSquare();
        }
    }

    class MaterialSide {
        constructor() { }
        static empty() {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = 0;
            return m;
        }
        static fromBoard(board, color) {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = board.pieces(color, role).size();
            return m;
        }
        clone() {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = this[role];
            return m;
        }
        equals(other) {
            return ROLES.every(role => this[role] === other[role]);
        }
        add(other) {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = this[role] + other[role];
            return m;
        }
        nonEmpty() {
            return ROLES.some(role => this[role] > 0);
        }
        isEmpty() {
            return !this.nonEmpty();
        }
        hasPawns() {
            return this.pawn > 0;
        }
        hasNonPawns() {
            return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
        }
        count() {
            return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
        }
    }
    class Material {
        constructor(white, black) {
            this.white = white;
            this.black = black;
        }
        static empty() {
            return new Material(MaterialSide.empty(), MaterialSide.empty());
        }
        static fromBoard(board) {
            return new Material(MaterialSide.fromBoard(board, 'white'), MaterialSide.fromBoard(board, 'black'));
        }
        clone() {
            return new Material(this.white.clone(), this.black.clone());
        }
        equals(other) {
            return this.white.equals(other.white) && this.black.equals(other.black);
        }
        add(other) {
            return new Material(this.white.add(other.white), this.black.add(other.black));
        }
        count() {
            return this.white.count() + this.black.count();
        }
        isEmpty() {
            return this.white.isEmpty() && this.black.isEmpty();
        }
        nonEmpty() {
            return !this.isEmpty();
        }
        hasPawns() {
            return this.white.hasPawns() || this.black.hasPawns();
        }
        hasNonPawns() {
            return this.white.hasNonPawns() || this.black.hasNonPawns();
        }
    }
    class RemainingChecks {
        constructor(white, black) {
            this.white = white;
            this.black = black;
        }
        static default() {
            return new RemainingChecks(3, 3);
        }
        clone() {
            return new RemainingChecks(this.white, this.black);
        }
        equals(other) {
            return this.white === other.white && this.black === other.black;
        }
    }

    var InvalidFen;
    (function (InvalidFen) {
        InvalidFen["Fen"] = "ERR_FEN";
        InvalidFen["Board"] = "ERR_BOARD";
        InvalidFen["Pockets"] = "ERR_POCKETS";
        InvalidFen["Turn"] = "ERR_TURN";
        InvalidFen["Castling"] = "ERR_CASTLING";
        InvalidFen["EpSquare"] = "ERR_EP_SQUARE";
        InvalidFen["RemainingChecks"] = "ERR_REMAINING_CHECKS";
        InvalidFen["Halfmoves"] = "ERR_HALFMOVES";
        InvalidFen["Fullmoves"] = "ERR_FULLMOVES";
    })(InvalidFen || (InvalidFen = {}));
    class FenError extends Error {
    }
    function nthIndexOf(haystack, needle, n) {
        let index = haystack.indexOf(needle);
        while (n-- > 0) {
            if (index === -1)
                break;
            index = haystack.indexOf(needle, index + needle.length);
        }
        return index;
    }
    function parseSmallUint(str) {
        return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
    }
    function charToPiece(ch) {
        const role = charToRole(ch);
        return role && { role, color: ch.toLowerCase() === ch ? 'black' : 'white' };
    }
    function parseBoardFen(boardPart) {
        const board = Board.empty();
        let rank = 7;
        let file = 0;
        for (let i = 0; i < boardPart.length; i++) {
            const c = boardPart[i];
            if (c === '/' && file === 8) {
                file = 0;
                rank--;
            }
            else {
                const step = parseInt(c, 10);
                if (step > 0)
                    file += step;
                else {
                    if (file >= 8 || rank < 0)
                        return n.err(new FenError(InvalidFen.Board));
                    const square = file + rank * 8;
                    const piece = charToPiece(c);
                    if (!piece)
                        return n.err(new FenError(InvalidFen.Board));
                    if (boardPart[i + 1] === '~') {
                        piece.promoted = true;
                        i++;
                    }
                    board.set(square, piece);
                    file++;
                }
            }
        }
        if (rank !== 0 || file !== 8)
            return n.err(new FenError(InvalidFen.Board));
        return n.ok(board);
    }
    function parsePockets(pocketPart) {
        if (pocketPart.length > 64)
            return n.err(new FenError(InvalidFen.Pockets));
        const pockets = Material.empty();
        for (const c of pocketPart) {
            const piece = charToPiece(c);
            if (!piece)
                return n.err(new FenError(InvalidFen.Pockets));
            pockets[piece.color][piece.role]++;
        }
        return n.ok(pockets);
    }
    function parseCastlingFen(board, castlingPart) {
        let unmovedRooks = SquareSet.empty();
        if (castlingPart === '-')
            return n.ok(unmovedRooks);
        if (!/^[KQABCDEFGH]{0,2}[kqabcdefgh]{0,2}$/.test(castlingPart)) {
            return n.err(new FenError(InvalidFen.Castling));
        }
        for (const c of castlingPart) {
            const lower = c.toLowerCase();
            const color = c === lower ? 'black' : 'white';
            const backrank = SquareSet.backrank(color).intersect(board[color]);
            let candidates;
            if (lower === 'q')
                candidates = backrank;
            else if (lower === 'k')
                candidates = backrank.reversed();
            else
                candidates = SquareSet.fromSquare(lower.charCodeAt(0) - 'a'.charCodeAt(0)).intersect(backrank);
            for (const square of candidates) {
                if (board.king.has(square) && !board.promoted.has(square))
                    break;
                if (board.rook.has(square)) {
                    unmovedRooks = unmovedRooks.with(square);
                    break;
                }
            }
        }
        return n.ok(unmovedRooks);
    }
    function parseRemainingChecks(part) {
        const parts = part.split('+');
        if (parts.length === 3 && parts[0] === '') {
            const white = parseSmallUint(parts[1]);
            const black = parseSmallUint(parts[2]);
            if (!defined(white) || white > 3 || !defined(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(3 - white, 3 - black));
        }
        else if (parts.length === 2) {
            const white = parseSmallUint(parts[0]);
            const black = parseSmallUint(parts[1]);
            if (!defined(white) || white > 3 || !defined(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(white, black));
        }
        else
            return n.err(new FenError(InvalidFen.RemainingChecks));
    }
    function parseFen(fen) {
        const parts = fen.split(' ');
        const boardPart = parts.shift();
        // Board and pockets
        let board, pockets = n.ok(undefined);
        if (boardPart.endsWith(']')) {
            const pocketStart = boardPart.indexOf('[');
            if (pocketStart === -1)
                return n.err(new FenError(InvalidFen.Fen));
            board = parseBoardFen(boardPart.substr(0, pocketStart));
            pockets = parsePockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
        }
        else {
            const pocketStart = nthIndexOf(boardPart, '/', 7);
            if (pocketStart === -1)
                board = parseBoardFen(boardPart);
            else {
                board = parseBoardFen(boardPart.substr(0, pocketStart));
                pockets = parsePockets(boardPart.substr(pocketStart + 1));
            }
        }
        // Turn
        let turn;
        const turnPart = parts.shift();
        if (!defined(turnPart) || turnPart === 'w')
            turn = 'white';
        else if (turnPart === 'b')
            turn = 'black';
        else
            return n.err(new FenError(InvalidFen.Turn));
        return board.chain(board => {
            // Castling
            const castlingPart = parts.shift();
            const unmovedRooks = defined(castlingPart) ? parseCastlingFen(board, castlingPart) : n.ok(SquareSet.empty());
            // En passant square
            const epPart = parts.shift();
            let epSquare;
            if (defined(epPart) && epPart !== '-') {
                epSquare = parseSquare(epPart);
                if (!defined(epSquare))
                    return n.err(new FenError(InvalidFen.EpSquare));
            }
            // Halfmoves or remaining checks
            let halfmovePart = parts.shift();
            let earlyRemainingChecks;
            if (defined(halfmovePart) && halfmovePart.includes('+')) {
                earlyRemainingChecks = parseRemainingChecks(halfmovePart);
                halfmovePart = parts.shift();
            }
            const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
            if (!defined(halfmoves))
                return n.err(new FenError(InvalidFen.Halfmoves));
            const fullmovesPart = parts.shift();
            const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
            if (!defined(fullmoves))
                return n.err(new FenError(InvalidFen.Fullmoves));
            const remainingChecksPart = parts.shift();
            let remainingChecks = n.ok(undefined);
            if (defined(remainingChecksPart)) {
                if (defined(earlyRemainingChecks))
                    return n.err(new FenError(InvalidFen.RemainingChecks));
                remainingChecks = parseRemainingChecks(remainingChecksPart);
            }
            else if (defined(earlyRemainingChecks)) {
                remainingChecks = earlyRemainingChecks;
            }
            if (parts.length > 0)
                return n.err(new FenError(InvalidFen.Fen));
            return pockets.chain(pockets => unmovedRooks.chain(unmovedRooks => remainingChecks.map(remainingChecks => {
                return {
                    board,
                    pockets,
                    turn,
                    unmovedRooks,
                    remainingChecks,
                    epSquare,
                    halfmoves,
                    fullmoves: Math.max(1, fullmoves),
                };
            })));
        });
    }
    function makePiece(piece, opts) {
        let r = roleToChar(piece.role);
        if (piece.color === 'white')
            r = r.toUpperCase();
        if ((opts === null || opts === void 0 ? void 0 : opts.promoted) && piece.promoted)
            r += '~';
        return r;
    }
    function makeBoardFen(board, opts) {
        let fen = '';
        let empty = 0;
        for (let rank = 7; rank >= 0; rank--) {
            for (let file = 0; file < 8; file++) {
                const square = file + rank * 8;
                const piece = board.get(square);
                if (!piece)
                    empty++;
                else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += makePiece(piece, opts);
                }
                if (file === 7) {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    if (rank !== 0)
                        fen += '/';
                }
            }
        }
        return fen;
    }

    var IllegalSetup;
    (function (IllegalSetup) {
        IllegalSetup["Empty"] = "ERR_EMPTY";
        IllegalSetup["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
        IllegalSetup["ImpossibleCheck"] = "ERR_IMPOSSIBLE_CHECK";
        IllegalSetup["PawnsOnBackrank"] = "ERR_PAWNS_ON_BACKRANK";
        IllegalSetup["Kings"] = "ERR_KINGS";
        IllegalSetup["Variant"] = "ERR_VARIANT";
    })(IllegalSetup || (IllegalSetup = {}));
    class PositionError extends Error {
    }
    function attacksTo(square, attacker, board, occupied) {
        return board[attacker].intersect(rookAttacks(square, occupied)
            .intersect(board.rooksAndQueens())
            .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
            .union(knightAttacks(square).intersect(board.knight))
            .union(kingAttacks(square).intersect(board.king))
            .union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
    }
    function rookCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 3 : 5) : side === 'a' ? 59 : 61;
    }
    class Castles {
        constructor() { }
        static default() {
            const castles = new Castles();
            castles.unmovedRooks = SquareSet.corners();
            castles.rook = {
                white: { a: 0, h: 7 },
                black: { a: 56, h: 63 },
            };
            castles.path = {
                white: { a: new SquareSet(0xe, 0), h: new SquareSet(0x60, 0) },
                black: { a: new SquareSet(0, 0x0e000000), h: new SquareSet(0, 0x60000000) },
            };
            return castles;
        }
        static empty() {
            const castles = new Castles();
            castles.unmovedRooks = SquareSet.empty();
            castles.rook = {
                white: { a: undefined, h: undefined },
                black: { a: undefined, h: undefined },
            };
            castles.path = {
                white: { a: SquareSet.empty(), h: SquareSet.empty() },
                black: { a: SquareSet.empty(), h: SquareSet.empty() },
            };
            return castles;
        }
        clone() {
            const castles = new Castles();
            castles.unmovedRooks = this.unmovedRooks;
            castles.rook = {
                white: { a: this.rook.white.a, h: this.rook.white.h },
                black: { a: this.rook.black.a, h: this.rook.black.h },
            };
            castles.path = {
                white: { a: this.path.white.a, h: this.path.white.h },
                black: { a: this.path.black.a, h: this.path.black.h },
            };
            return castles;
        }
        add(color, side, king, rook) {
            const kingTo = kingCastlesTo(color, side);
            const rookTo = rookCastlesTo(color, side);
            this.unmovedRooks = this.unmovedRooks.with(rook);
            this.rook[color][side] = rook;
            this.path[color][side] = between(rook, rookTo)
                .with(rookTo)
                .union(between(king, kingTo).with(kingTo))
                .without(king)
                .without(rook);
        }
        static fromSetup(setup) {
            const castles = Castles.empty();
            const rooks = setup.unmovedRooks.intersect(setup.board.rook);
            for (const color of COLORS) {
                const backrank = SquareSet.backrank(color);
                const king = setup.board.kingOf(color);
                if (!defined(king) || !backrank.has(king))
                    continue;
                const side = rooks.intersect(setup.board[color]).intersect(backrank);
                const aSide = side.first();
                if (defined(aSide) && aSide < king)
                    castles.add(color, 'a', king, aSide);
                const hSide = side.last();
                if (defined(hSide) && king < hSide)
                    castles.add(color, 'h', king, hSide);
            }
            return castles;
        }
        discardRook(square) {
            if (this.unmovedRooks.has(square)) {
                this.unmovedRooks = this.unmovedRooks.without(square);
                for (const color of COLORS) {
                    for (const side of CASTLING_SIDES) {
                        if (this.rook[color][side] === square)
                            this.rook[color][side] = undefined;
                    }
                }
            }
        }
        discardSide(color) {
            this.unmovedRooks = this.unmovedRooks.diff(SquareSet.backrank(color));
            this.rook[color].a = undefined;
            this.rook[color].h = undefined;
        }
    }
    class Position {
        constructor(rules) {
            this.rules = rules;
        }
        kingAttackers(square, attacker, occupied) {
            return attacksTo(square, attacker, this.board, occupied);
        }
        dropDests(_ctx) {
            return SquareSet.empty();
        }
        playCaptureAt(square, captured) {
            this.halfmoves = 0;
            if (captured.role === 'rook')
                this.castles.discardRook(square);
            if (this.pockets)
                this.pockets[opposite(captured.color)][captured.role]++;
        }
        ctx() {
            const variantEnd = this.isVariantEnd();
            const king = this.board.kingOf(this.turn);
            if (!defined(king))
                return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
            const snipers = rookAttacks(king, SquareSet.empty())
                .intersect(this.board.rooksAndQueens())
                .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
                .intersect(this.board[opposite(this.turn)]);
            let blockers = SquareSet.empty();
            for (const sniper of snipers) {
                const b = between(king, sniper).intersect(this.board.occupied);
                if (!b.moreThanOne())
                    blockers = blockers.union(b);
            }
            const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
            return {
                king,
                blockers,
                checkers,
                variantEnd,
                mustCapture: false,
            };
        }
        // The following should be identical in all subclasses
        clone() {
            var _a, _b;
            const pos = new this.constructor();
            pos.board = this.board.clone();
            pos.pockets = (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone();
            pos.turn = this.turn;
            pos.castles = this.castles.clone();
            pos.epSquare = this.epSquare;
            pos.remainingChecks = (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone();
            pos.halfmoves = this.halfmoves;
            pos.fullmoves = this.fullmoves;
            return pos;
        }
        equalsIgnoreMoves(other) {
            var _a, _b;
            return (this.rules === other.rules &&
                (this.pockets ? this.board.equals(other.board) : this.board.equalsIgnorePromoted(other.board)) &&
                ((other.pockets && ((_a = this.pockets) === null || _a === void 0 ? void 0 : _a.equals(other.pockets))) || (!this.pockets && !other.pockets)) &&
                this.turn === other.turn &&
                this.castles.unmovedRooks.equals(other.castles.unmovedRooks) &&
                this.legalEpSquare() === other.legalEpSquare() &&
                ((other.remainingChecks && ((_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.equals(other.remainingChecks))) ||
                    (!this.remainingChecks && !other.remainingChecks)));
        }
        toSetup() {
            var _a, _b;
            return {
                board: this.board.clone(),
                pockets: (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone(),
                turn: this.turn,
                unmovedRooks: this.castles.unmovedRooks,
                epSquare: this.legalEpSquare(),
                remainingChecks: (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone(),
                halfmoves: Math.min(this.halfmoves, 150),
                fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
            };
        }
        isInsufficientMaterial() {
            return COLORS.every(color => this.hasInsufficientMaterial(color));
        }
        hasDests(ctx) {
            ctx = ctx || this.ctx();
            for (const square of this.board[this.turn]) {
                if (this.dests(square, ctx).nonEmpty())
                    return true;
            }
            return this.dropDests(ctx).nonEmpty();
        }
        isLegal(move, ctx) {
            if (isDrop(move)) {
                if (!this.pockets || this.pockets[this.turn][move.role] <= 0)
                    return false;
                if (move.role === 'pawn' && SquareSet.backranks().has(move.to))
                    return false;
                return this.dropDests(ctx).has(move.to);
            }
            else {
                if (move.promotion === 'pawn')
                    return false;
                if (move.promotion === 'king' && this.rules !== 'antichess')
                    return false;
                if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to)))
                    return false;
                const dests = this.dests(move.from, ctx);
                return dests.has(move.to) || dests.has(this.normalizeMove(move).to);
            }
        }
        isCheck() {
            const king = this.board.kingOf(this.turn);
            return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
        }
        isEnd(ctx) {
            if (ctx ? ctx.variantEnd : this.isVariantEnd())
                return true;
            return this.isInsufficientMaterial() || !this.hasDests(ctx);
        }
        isCheckmate(ctx) {
            ctx = ctx || this.ctx();
            return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
        }
        isStalemate(ctx) {
            ctx = ctx || this.ctx();
            return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
        }
        outcome(ctx) {
            const variantOutcome = this.variantOutcome(ctx);
            if (variantOutcome)
                return variantOutcome;
            ctx = ctx || this.ctx();
            if (this.isCheckmate(ctx))
                return { winner: opposite(this.turn) };
            else if (this.isInsufficientMaterial() || this.isStalemate(ctx))
                return { winner: undefined };
            else
                return;
        }
        allDests(ctx) {
            ctx = ctx || this.ctx();
            const d = new Map();
            if (ctx.variantEnd)
                return d;
            for (const square of this.board[this.turn]) {
                d.set(square, this.dests(square, ctx));
            }
            return d;
        }
        castlingSide(move) {
            if (isDrop(move))
                return;
            const delta = move.to - move.from;
            if (Math.abs(delta) !== 2 && !this.board[this.turn].has(move.to))
                return;
            if (!this.board.king.has(move.from))
                return;
            return delta > 0 ? 'h' : 'a';
        }
        normalizeMove(move) {
            const castlingSide = this.castlingSide(move);
            if (!castlingSide)
                return move;
            const rookFrom = this.castles.rook[this.turn][castlingSide];
            return {
                from: move.from,
                to: defined(rookFrom) ? rookFrom : move.to,
            };
        }
        play(move) {
            const turn = this.turn;
            const epSquare = this.epSquare;
            const castlingSide = this.castlingSide(move);
            this.epSquare = undefined;
            this.halfmoves += 1;
            if (turn === 'black')
                this.fullmoves += 1;
            this.turn = opposite(turn);
            if (isDrop(move)) {
                this.board.set(move.to, { role: move.role, color: turn });
                if (this.pockets)
                    this.pockets[turn][move.role]--;
                if (move.role === 'pawn')
                    this.halfmoves = 0;
            }
            else {
                const piece = this.board.take(move.from);
                if (!piece)
                    return;
                let epCapture;
                if (piece.role === 'pawn') {
                    this.halfmoves = 0;
                    if (move.to === epSquare) {
                        epCapture = this.board.take(move.to + (turn === 'white' ? -8 : 8));
                    }
                    const delta = move.from - move.to;
                    if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
                        this.epSquare = (move.from + move.to) >> 1;
                    }
                    if (move.promotion) {
                        piece.role = move.promotion;
                        piece.promoted = true;
                    }
                }
                else if (piece.role === 'rook') {
                    this.castles.discardRook(move.from);
                }
                else if (piece.role === 'king') {
                    if (castlingSide) {
                        const rookFrom = this.castles.rook[turn][castlingSide];
                        if (defined(rookFrom)) {
                            const rook = this.board.take(rookFrom);
                            this.board.set(kingCastlesTo(turn, castlingSide), piece);
                            if (rook)
                                this.board.set(rookCastlesTo(turn, castlingSide), rook);
                        }
                    }
                    this.castles.discardSide(turn);
                    if (castlingSide)
                        return;
                }
                const capture = this.board.set(move.to, piece) || epCapture;
                if (capture)
                    this.playCaptureAt(move.to, capture);
            }
        }
        legalEpSquare(ctx) {
            if (!defined(this.epSquare))
                return;
            ctx = ctx || this.ctx();
            const ourPawns = this.board.pieces(this.turn, 'pawn');
            const candidates = ourPawns.intersect(pawnAttacks(opposite(this.turn), this.epSquare));
            for (const candidate of candidates) {
                if (this.dests(candidate, ctx).has(this.epSquare))
                    return this.epSquare;
            }
            return;
        }
    }
    class Chess extends Position {
        constructor(rules) {
            super(rules || 'chess');
        }
        static default() {
            const pos = new this();
            pos.board = Board.default();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.default();
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup) {
            const pos = new this();
            pos.board = setup.board.clone();
            pos.pockets = undefined;
            pos.turn = setup.turn;
            pos.castles = Castles.fromSetup(setup);
            pos.epSquare = pos.validEpSquare(setup.epSquare);
            pos.remainingChecks = undefined;
            pos.halfmoves = setup.halfmoves;
            pos.fullmoves = setup.fullmoves;
            return pos.validate().map(_ => pos);
        }
        clone() {
            return super.clone();
        }
        validate() {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.board.king.size() !== 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            if (!defined(this.board.kingOf(this.turn)))
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite(this.turn));
            if (!defined(otherKing))
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            if (SquareSet.backranks().intersects(this.board.pawn))
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            return this.validateCheckers();
        }
        validateCheckers() {
            const ourKing = this.board.kingOf(this.turn);
            if (defined(ourKing)) {
                // Multiple sliding checkers aligned with king.
                const checkers = this.kingAttackers(ourKing, opposite(this.turn), this.board.occupied);
                if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first(), checkers.last()).has(ourKing)))
                    return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                // En passant square aligned with checker and king.
                if (defined(this.epSquare)) {
                    for (const checker of checkers) {
                        if (ray(checker, this.epSquare).has(ourKing))
                            return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                    }
                }
            }
            return n.ok(undefined);
        }
        validEpSquare(square) {
            if (!defined(square))
                return;
            const epRank = this.turn === 'white' ? 5 : 2;
            const forward = this.turn === 'white' ? 8 : -8;
            if (squareRank(square) !== epRank)
                return;
            if (this.board.occupied.has(square + forward))
                return;
            const pawn = square - forward;
            if (!this.board.pawn.has(pawn) || !this.board[opposite(this.turn)].has(pawn))
                return;
            return square;
        }
        castlingDest(side, ctx) {
            if (!defined(ctx.king) || ctx.checkers.nonEmpty())
                return SquareSet.empty();
            const rook = this.castles.rook[this.turn][side];
            if (!defined(rook))
                return SquareSet.empty();
            if (this.castles.path[this.turn][side].intersects(this.board.occupied))
                return SquareSet.empty();
            const kingTo = kingCastlesTo(this.turn, side);
            const kingPath = between(ctx.king, kingTo);
            const occ = this.board.occupied.without(ctx.king);
            for (const sq of kingPath) {
                if (this.kingAttackers(sq, opposite(this.turn), occ).nonEmpty())
                    return SquareSet.empty();
            }
            const rookTo = rookCastlesTo(this.turn, side);
            const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
            if (this.kingAttackers(kingTo, opposite(this.turn), after).nonEmpty())
                return SquareSet.empty();
            return SquareSet.fromSquare(rook);
        }
        canCaptureEp(pawn, ctx) {
            if (!defined(this.epSquare))
                return false;
            if (!pawnAttacks(this.turn, pawn).has(this.epSquare))
                return false;
            if (!defined(ctx.king))
                return true;
            const captured = this.epSquare + (this.turn === 'white' ? -8 : 8);
            const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
            return !this.kingAttackers(ctx.king, opposite(this.turn), occupied).intersects(occupied);
        }
        pseudoDests(square, ctx) {
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo = attacks(piece, square, this.board.occupied);
            if (piece.role === 'pawn') {
                let captureTargets = this.board[opposite(this.turn)];
                if (defined(this.epSquare))
                    captureTargets = captureTargets.with(this.epSquare);
                pseudo = pseudo.intersect(captureTargets);
                const delta = this.turn === 'white' ? 8 : -8;
                const step = square + delta;
                if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
                    pseudo = pseudo.with(step);
                    const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
                    const doubleStep = step + delta;
                    if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
                        pseudo = pseudo.with(doubleStep);
                    }
                }
                return pseudo;
            }
            else {
                pseudo = pseudo.diff(this.board[this.turn]);
            }
            if (square === ctx.king)
                return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
            else
                return pseudo;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo, legal;
            if (piece.role === 'pawn') {
                pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
                const delta = this.turn === 'white' ? 8 : -8;
                const step = square + delta;
                if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
                    pseudo = pseudo.with(step);
                    const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
                    const doubleStep = step + delta;
                    if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
                        pseudo = pseudo.with(doubleStep);
                    }
                }
                if (defined(this.epSquare) && this.canCaptureEp(square, ctx)) {
                    const pawn = this.epSquare - delta;
                    if (ctx.checkers.isEmpty() || ctx.checkers.singleSquare() === pawn) {
                        legal = SquareSet.fromSquare(this.epSquare);
                    }
                }
            }
            else if (piece.role === 'bishop')
                pseudo = bishopAttacks(square, this.board.occupied);
            else if (piece.role === 'knight')
                pseudo = knightAttacks(square);
            else if (piece.role === 'rook')
                pseudo = rookAttacks(square, this.board.occupied);
            else if (piece.role === 'queen')
                pseudo = queenAttacks(square, this.board.occupied);
            else
                pseudo = kingAttacks(square);
            pseudo = pseudo.diff(this.board[this.turn]);
            if (defined(ctx.king)) {
                if (piece.role === 'king') {
                    const occ = this.board.occupied.without(square);
                    for (const to of pseudo) {
                        if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty())
                            pseudo = pseudo.without(to);
                    }
                    return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
                }
                if (ctx.checkers.nonEmpty()) {
                    const checker = ctx.checkers.singleSquare();
                    if (!defined(checker))
                        return SquareSet.empty();
                    pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
                }
                if (ctx.blockers.has(square))
                    pseudo = pseudo.intersect(ray(square, ctx.king));
            }
            if (legal)
                pseudo = pseudo.union(legal);
            return pseudo;
        }
        isVariantEnd() {
            return false;
        }
        variantOutcome(_ctx) {
            return;
        }
        hasInsufficientMaterial(color) {
            if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty())
                return false;
            if (this.board[color].intersects(this.board.knight)) {
                return (this.board[color].size() <= 2 &&
                    this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty());
            }
            if (this.board[color].intersects(this.board.bishop)) {
                const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares()) ||
                    !this.board.bishop.intersects(SquareSet.lightSquares());
                return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
            }
            return true;
        }
    }

    class Crazyhouse extends Chess {
        constructor() {
            super('crazyhouse');
        }
        static default() {
            const pos = super.default();
            pos.pockets = Material.empty();
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
                return pos;
            });
        }
        validate() {
            return super.validate().chain(_ => {
                if (this.pockets && (this.pockets.white.king > 0 || this.pockets.black.king > 0)) {
                    return n.err(new PositionError(IllegalSetup.Kings));
                }
                if ((this.pockets ? this.pockets.count() : 0) + this.board.occupied.size() > 64) {
                    return n.err(new PositionError(IllegalSetup.Variant));
                }
                return n.ok(undefined);
            });
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(color) {
            // No material can leave the game, but we can easily check this for
            // custom positions.
            if (!this.pockets)
                return super.hasInsufficientMaterial(color);
            return (this.board.occupied.size() + this.pockets.count() <= 3 &&
                this.board.pawn.isEmpty() &&
                this.board.promoted.isEmpty() &&
                this.board.rooksAndQueens().isEmpty() &&
                this.pockets.white.pawn <= 0 &&
                this.pockets.black.pawn <= 0 &&
                this.pockets.white.rook <= 0 &&
                this.pockets.black.rook <= 0 &&
                this.pockets.white.queen <= 0 &&
                this.pockets.black.queen <= 0);
        }
        dropDests(ctx) {
            var _a, _b;
            const mask = this.board.occupied
                .complement()
                .intersect(((_a = this.pockets) === null || _a === void 0 ? void 0 : _a[this.turn].hasNonPawns())
                ? SquareSet.full()
                : ((_b = this.pockets) === null || _b === void 0 ? void 0 : _b[this.turn].hasPawns())
                    ? SquareSet.backranks().complement()
                    : SquareSet.empty());
            ctx = ctx || this.ctx();
            if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
                const checker = ctx.checkers.singleSquare();
                if (!defined(checker))
                    return SquareSet.empty();
                return mask.intersect(between(checker, ctx.king));
            }
            else
                return mask;
        }
    }
    class Atomic extends Chess {
        constructor() {
            super('atomic');
        }
        static default() {
            return super.default();
        }
        static fromSetup(setup) {
            return super.fromSetup(setup);
        }
        clone() {
            return super.clone();
        }
        validate() {
            // Like chess, but allow our king to be missing and any number of checkers.
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.board.king.size() > 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite(this.turn));
            if (!defined(otherKing))
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            }
            if (SquareSet.backranks().intersects(this.board.pawn)) {
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            }
            return n.ok(undefined);
        }
        kingAttackers(square, attacker, occupied) {
            if (kingAttacks(square).intersects(this.board.pieces(attacker, 'king'))) {
                return SquareSet.empty();
            }
            return super.kingAttackers(square, attacker, occupied);
        }
        playCaptureAt(square, captured) {
            super.playCaptureAt(square, captured);
            this.board.take(square);
            for (const explode of kingAttacks(square).intersect(this.board.occupied).diff(this.board.pawn)) {
                const piece = this.board.take(explode);
                if (piece && piece.role === 'rook')
                    this.castles.discardRook(explode);
                if (piece && piece.role === 'king')
                    this.castles.discardSide(piece.color);
            }
        }
        hasInsufficientMaterial(color) {
            // Remaining material does not matter if the enemy king is already
            // exploded.
            if (this.board.pieces(opposite(color), 'king').isEmpty())
                return false;
            // Bare king cannot mate.
            if (this.board[color].diff(this.board.king).isEmpty())
                return true;
            // As long as the enemy king is not alone, there is always a chance their
            // own pieces explode next to it.
            if (this.board[opposite(color)].diff(this.board.king).nonEmpty()) {
                // Unless there are only bishops that cannot explode each other.
                if (this.board.occupied.equals(this.board.bishop.union(this.board.king))) {
                    if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.darkSquares())) {
                        return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.lightSquares());
                    }
                    if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.lightSquares())) {
                        return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.darkSquares());
                    }
                }
                return false;
            }
            // Queen or pawn (future queen) can give mate against bare king.
            if (this.board.queen.nonEmpty() || this.board.pawn.nonEmpty())
                return false;
            // Single knight, bishop or rook cannot mate against bare king.
            if (this.board.knight.union(this.board.bishop).union(this.board.rook).isSingleSquare())
                return true;
            // If only knights, more than two are required to mate bare king.
            if (this.board.occupied.equals(this.board.knight.union(this.board.king))) {
                return this.board.knight.size() <= 2;
            }
            return false;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            let dests = SquareSet.empty();
            for (const to of this.pseudoDests(square, ctx)) {
                const after = this.clone();
                after.play({ from: square, to });
                const ourKing = after.board.kingOf(this.turn);
                if (defined(ourKing) &&
                    (!defined(after.board.kingOf(after.turn)) ||
                        after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())) {
                    dests = dests.with(to);
                }
            }
            return dests;
        }
        isVariantEnd() {
            return !!this.variantOutcome();
        }
        variantOutcome(_ctx) {
            for (const color of COLORS) {
                if (this.board.pieces(color, 'king').isEmpty())
                    return { winner: opposite(color) };
            }
            return;
        }
    }
    class Antichess extends Chess {
        constructor() {
            super('antichess');
        }
        static default() {
            const pos = super.default();
            pos.castles = Castles.empty();
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.castles = Castles.empty();
                return pos;
            });
        }
        clone() {
            return super.clone();
        }
        validate() {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (SquareSet.backranks().intersects(this.board.pawn))
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            return n.ok(undefined);
        }
        kingAttackers(_square, _attacker, _occupied) {
            return SquareSet.empty();
        }
        ctx() {
            const ctx = super.ctx();
            const enemy = this.board[opposite(this.turn)];
            for (const from of this.board[this.turn]) {
                if (this.pseudoDests(from, ctx).intersects(enemy)) {
                    ctx.mustCapture = true;
                    break;
                }
            }
            return ctx;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            const dests = this.pseudoDests(square, ctx);
            if (!ctx.mustCapture)
                return dests;
            return dests.intersect(this.board[opposite(this.turn)]);
        }
        hasInsufficientMaterial(color) {
            if (this.board.occupied.equals(this.board.bishop)) {
                const weSomeOnLight = this.board[color].intersects(SquareSet.lightSquares());
                const weSomeOnDark = this.board[color].intersects(SquareSet.darkSquares());
                const theyAllOnDark = this.board[opposite(color)].isDisjoint(SquareSet.lightSquares());
                const theyAllOnLight = this.board[opposite(color)].isDisjoint(SquareSet.darkSquares());
                return (weSomeOnLight && theyAllOnDark) || (weSomeOnDark && theyAllOnLight);
            }
            return false;
        }
        isVariantEnd() {
            return this.board[this.turn].isEmpty();
        }
        variantOutcome(ctx) {
            ctx = ctx || this.ctx();
            if (ctx.variantEnd || this.isStalemate(ctx)) {
                return { winner: this.turn };
            }
            return;
        }
    }
    class KingOfTheHill extends Chess {
        constructor() {
            super('kingofthehill');
        }
        static default() {
            return super.default();
        }
        static fromSetup(setup) {
            return super.fromSetup(setup);
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(_color) {
            return false;
        }
        isVariantEnd() {
            return this.board.king.intersects(SquareSet.center());
        }
        variantOutcome(_ctx) {
            for (const color of COLORS) {
                if (this.board.pieces(color, 'king').intersects(SquareSet.center()))
                    return { winner: color };
            }
            return;
        }
    }
    class ThreeCheck extends Chess {
        constructor() {
            super('3check');
        }
        static default() {
            const pos = super.default();
            pos.remainingChecks = RemainingChecks.default();
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.default();
                return pos;
            });
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(color) {
            return this.board.pieces(color, 'king').equals(this.board[color]);
        }
        isVariantEnd() {
            return !!this.remainingChecks && (this.remainingChecks.white <= 0 || this.remainingChecks.black <= 0);
        }
        variantOutcome(_ctx) {
            if (this.remainingChecks) {
                for (const color of COLORS) {
                    if (this.remainingChecks[color] <= 0)
                        return { winner: color };
                }
            }
            return;
        }
    }
    class RacingKings extends Chess {
        constructor() {
            super('racingkings');
        }
        static default() {
            const pos = new this();
            pos.board = Board.racingKings();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.empty();
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.castles = Castles.empty();
                return pos;
            });
        }
        validate() {
            if (this.isCheck())
                return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
            if (this.board.pawn.nonEmpty())
                return n.err(new PositionError(IllegalSetup.Variant));
            return super.validate();
        }
        clone() {
            return super.clone();
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            // Kings cannot give check.
            if (square === ctx.king)
                return super.dests(square, ctx);
            // TODO: This could be optimized considerably.
            let dests = SquareSet.empty();
            for (const to of super.dests(square, ctx)) {
                // Valid, because there are no promotions (or even pawns).
                const move = { from: square, to };
                const after = this.clone();
                after.play(move);
                if (!after.isCheck())
                    dests = dests.with(to);
            }
            return dests;
        }
        hasInsufficientMaterial(_color) {
            return false;
        }
        isVariantEnd() {
            const goal = SquareSet.fromRank(7);
            const inGoal = this.board.king.intersect(goal);
            if (inGoal.isEmpty())
                return false;
            if (this.turn === 'white' || inGoal.intersects(this.board.black))
                return true;
            // White has reached the backrank. Check if black can catch up.
            const blackKing = this.board.kingOf('black');
            if (defined(blackKing)) {
                const occ = this.board.occupied.without(blackKing);
                for (const target of kingAttacks(blackKing).intersect(goal).diff(this.board.black)) {
                    if (this.kingAttackers(target, 'white', occ).isEmpty())
                        return false;
                }
            }
            return true;
        }
        variantOutcome(ctx) {
            if (ctx ? !ctx.variantEnd : !this.isVariantEnd())
                return;
            const goal = SquareSet.fromRank(7);
            const blackInGoal = this.board.pieces('black', 'king').intersects(goal);
            const whiteInGoal = this.board.pieces('white', 'king').intersects(goal);
            if (blackInGoal && !whiteInGoal)
                return { winner: 'black' };
            if (whiteInGoal && !blackInGoal)
                return { winner: 'white' };
            return { winner: undefined };
        }
    }
    class Horde extends Chess {
        constructor() {
            super('horde');
        }
        static default() {
            const pos = new this();
            pos.board = Board.horde();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.default();
            pos.castles.discardSide('white');
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup);
        }
        validate() {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (!this.board.king.isSingleSquare())
                return n.err(new PositionError(IllegalSetup.Kings));
            if (!this.board.king.diff(this.board.promoted).isSingleSquare())
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite(this.turn));
            if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            for (const color of COLORS) {
                if (this.board.pieces(color, 'pawn').intersects(SquareSet.backrank(opposite(color)))) {
                    return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
                }
            }
            return this.validateCheckers();
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(_color) {
            // TODO: Could detect cases where the horde cannot mate.
            return false;
        }
        isVariantEnd() {
            return this.board.white.isEmpty() || this.board.black.isEmpty();
        }
        variantOutcome(_ctx) {
            if (this.board.white.isEmpty())
                return { winner: 'black' };
            if (this.board.black.isEmpty())
                return { winner: 'white' };
            return;
        }
    }
    function setupPosition(rules, setup) {
        switch (rules) {
            case 'chess':
                return Chess.fromSetup(setup);
            case 'antichess':
                return Antichess.fromSetup(setup);
            case 'atomic':
                return Atomic.fromSetup(setup);
            case 'horde':
                return Horde.fromSetup(setup);
            case 'racingkings':
                return RacingKings.fromSetup(setup);
            case 'kingofthehill':
                return KingOfTheHill.fromSetup(setup);
            case '3check':
                return ThreeCheck.fromSetup(setup);
            case 'crazyhouse':
                return Crazyhouse.fromSetup(setup);
        }
    }

    let gaugeLast = 0;
    const gaugeTicks = [...Array(8).keys()].map(i => h(i === 3 ? 'tick.zero' : 'tick', { attrs: { style: `height: ${(i + 1) * 12.5}%` } }));
    function localEvalInfo(ctrl, evs) {
        const ceval = ctrl.getCeval(), trans = ctrl.trans;
        if (!evs.client) {
            const mb = ceval.downloadProgress() / 1024 / 1024;
            return [
                evs.server && ctrl.nextNodeBest()
                    ? trans.noarg('usingServerAnalysis')
                    : trans.noarg('loadingEngine') + (mb >= 1 ? ` (${mb.toFixed(1)} MiB)` : ''),
            ];
        }
        const t = evs.client.cloud
            ? [
                trans('depthX', evs.client.depth || 0),
                h('span.cloud', { attrs: { title: trans.noarg('cloudAnalysis') } }, 'Cloud'),
            ]
            : [trans('depthX', (evs.client.depth || 0) + '/' + evs.client.maxDepth)];
        if (ceval.canGoDeeper())
            t.push(h('a.deeper', {
                attrs: {
                    title: trans.noarg('goDeeper'),
                    'data-icon': 'O',
                },
                hook: {
                    insert: vnode => vnode.elm.addEventListener('click', () => {
                        ceval.goDeeper();
                        ceval.redraw();
                    }),
                },
            }));
        else if (!evs.client.cloud && evs.client.knps)
            t.push(', ' + Math.round(evs.client.knps) + ' knodes/s');
        return t;
    }
    function threatInfo(ctrl, threat) {
        if (!threat)
            return ctrl.trans.noarg('loadingEngine');
        let t = ctrl.trans('depthX', (threat.depth || 0) + '/' + threat.maxDepth);
        if (threat.knps)
            t += ', ' + Math.round(threat.knps) + ' knodes/s';
        return t;
    }
    function threatButton(ctrl) {
        if (ctrl.disableThreatMode && ctrl.disableThreatMode())
            return null;
        return h('a.show-threat', {
            class: {
                active: ctrl.threatMode(),
                hidden: !!ctrl.getNode().check,
            },
            attrs: {
                'data-icon': '7',
                title: ctrl.trans.noarg('showThreat') + ' (x)',
            },
            hook: {
                insert: vnode => vnode.elm.addEventListener('click', ctrl.toggleThreatMode),
            },
        });
    }
    function engineName(ctrl) {
        const version = ctrl.engineName();
        return [
            h('span', { attrs: { title: version || '' } }, ctrl.technology == 'nnue' ? 'Stockfish 13+' : ctrl.technology == 'hce' ? 'Stockfish 11+' : 'Stockfish 10+'),
            ctrl.technology == 'nnue'
                ? h('span.technology.good', {
                    attrs: { title: 'Multi-threaded WebAssembly with SIMD (efficiently updatable neural network, strongest)' },
                }, 'NNUE')
                : ctrl.technology == 'hce'
                    ? h('span.technology.good', { attrs: { title: 'Multi-threaded WebAssembly (classical hand crafted evaluation)' } }, 'HCE')
                    : ctrl.technology == 'wasm'
                        ? h('span.technology', { attrs: { title: 'Single-threaded WebAssembly fallback (slow)' } }, 'WASM')
                        : h('span.technology', { attrs: { title: 'Single-threaded JavaScript fallback (very slow)' } }, 'ASMJS'),
        ];
    }
    const serverNodes = 4e6;
    function getBestEval(evs) {
        const serverEv = evs.server, localEv = evs.client;
        if (!serverEv)
            return localEv;
        if (!localEv)
            return serverEv;
        // Prefer localEv if it exceeds fishnet node limit or finds a better mate.
        if (localEv.nodes > serverNodes ||
            (typeof localEv.mate !== 'undefined' &&
                (typeof serverEv.mate === 'undefined' || Math.abs(localEv.mate) < Math.abs(serverEv.mate))))
            return localEv;
        return serverEv;
    }
    function renderGauge(ctrl) {
        if (ctrl.ongoing || !ctrl.showEvalGauge())
            return;
        const bestEv = getBestEval(ctrl.currentEvals());
        let ev;
        if (bestEv) {
            ev = povChances('white', bestEv);
            gaugeLast = ev;
        }
        else
            ev = gaugeLast;
        return h('div.eval-gauge', {
            class: {
                empty: ev === null,
                reverse: ctrl.getOrientation() === 'black',
            },
        }, [h('div.black', { attrs: { style: `height: ${100 - (ev + 1) * 50}%` } }), ...gaugeTicks]);
    }
    function renderCeval(ctrl) {
        const instance = ctrl.getCeval(), trans = ctrl.trans;
        if (!instance.allowed() || !instance.possible || !ctrl.showComputer())
            return;
        const enabled = instance.enabled(), evs = ctrl.currentEvals(), threatMode = ctrl.threatMode(), threat = threatMode && ctrl.getNode().threat, bestEv = threat || getBestEval(evs);
        let pearl, percent;
        if (bestEv && typeof bestEv.cp !== 'undefined') {
            pearl = renderEval$1(bestEv.cp);
            percent = evs.client
                ? Math.min(100, Math.round((100 * evs.client.depth) / (evs.client.maxDepth || instance.effectiveMaxDepth())))
                : 0;
        }
        else if (bestEv && defined$1(bestEv.mate)) {
            pearl = '#' + bestEv.mate;
            percent = 100;
        }
        else if (ctrl.outcome()) {
            pearl = '-';
            percent = 0;
        }
        else {
            pearl = enabled ? h('i.ddloader') : h('i');
            percent = 0;
        }
        if (threatMode) {
            if (threat)
                percent = Math.min(100, Math.round((100 * threat.depth) / threat.maxDepth));
            else
                percent = 0;
        }
        const progressBar = enabled
            ? h('div.bar', h('span', {
                class: { threat: threatMode },
                attrs: { style: `width: ${percent}%` },
                hook: {
                    postpatch: (old, vnode) => {
                        if (old.data.percent > percent || !!old.data.threatMode != threatMode) {
                            const el = vnode.elm;
                            const p = el.parentNode;
                            p.removeChild(el);
                            p.appendChild(el);
                        }
                        vnode.data.percent = percent;
                        vnode.data.threatMode = threatMode;
                    },
                },
            }))
            : null;
        const body = enabled
            ? [
                h('pearl', [pearl]),
                h('div.engine', [
                    ...(threatMode ? [trans.noarg('showThreat')] : engineName(instance)),
                    h('span.info', ctrl.outcome()
                        ? [trans.noarg('gameOver')]
                        : threatMode
                            ? [threatInfo(ctrl, threat)]
                            : localEvalInfo(ctrl, evs)),
                ]),
            ]
            : [
                pearl ? h('pearl', [pearl]) : null,
                h('help', [...engineName(instance), h('br'), trans.noarg('inLocalBrowser')]),
            ];
        const switchButton = ctrl.mandatoryCeval && ctrl.mandatoryCeval()
            ? null
            : h('div.switch', {
                attrs: { title: trans.noarg('toggleLocalEvaluation') + ' (l)' },
            }, [
                h('input#analyse-toggle-ceval.cmn-toggle.cmn-toggle--subtle', {
                    attrs: {
                        type: 'checkbox',
                        checked: enabled,
                    },
                    hook: {
                        insert: vnode => vnode.elm.addEventListener('change', ctrl.toggleCeval),
                    },
                }),
                h('label', { attrs: { for: 'analyse-toggle-ceval' } }),
            ]);
        return h('div.ceval' + (enabled ? '.enabled' : ''), {
            class: {
                computing: percent < 100 && instance.isComputing(),
            },
        }, [progressBar, ...body, threatButton(ctrl), switchButton]);
    }
    function getElFen(el) {
        return el.getAttribute('data-fen');
    }
    function getElUci(e) {
        return ($(e.target)
            .closest('div.pv')
            .attr('data-uci') || undefined);
    }
    function getElPvMoves(e) {
        const pvMoves = [];
        $(e.target)
            .closest('div.pv')
            .children()
            .filter('span.pv-san')
            .each(function () {
            pvMoves.push($(this).attr('data-board'));
        });
        return pvMoves;
    }
    function checkHover(el, instance) {
        lichess.requestIdleCallback(() => instance.setHovering(getElFen(el), $(el).find('div.pv:hover').attr('data-uci') || undefined), 500);
    }
    function renderPvs(ctrl) {
        const instance = ctrl.getCeval();
        if (!instance.allowed() || !instance.possible || !instance.enabled())
            return;
        const multiPv = parseInt(instance.multiPv()), node = ctrl.getNode(), setup = parseFen(node.fen).unwrap();
        let pvs, threat = false, pvMoves, pvIndex;
        if (ctrl.threatMode() && node.threat) {
            pvs = node.threat.pvs;
            threat = true;
        }
        else if (node.ceval)
            pvs = node.ceval.pvs;
        else
            pvs = [];
        if (threat) {
            setup.turn = opposite(setup.turn);
            if (setup.turn == 'white')
                setup.fullmoves += 1;
        }
        const pos = setupPosition(lichessVariantRules(instance.variant.key), setup);
        return h('div.pv_box', {
            attrs: { 'data-fen': node.fen },
            hook: {
                insert: vnode => {
                    const el = vnode.elm;
                    el.addEventListener('mouseover', (e) => {
                        const instance = ctrl.getCeval();
                        instance.setHovering(getElFen(el), getElUci(e));
                        const pvBoard = e.target.dataset.board;
                        if (pvBoard) {
                            pvIndex = Number(e.target.dataset.moveIndex);
                            pvMoves = getElPvMoves(e);
                            const [fen, uci] = pvBoard.split('|');
                            instance.setPvBoard({ fen, uci });
                        }
                    });
                    el.addEventListener('wheel', (e) => {
                        e.preventDefault();
                        if (pvIndex != null && pvMoves != null) {
                            if (e.deltaY < 0 && pvIndex > 0)
                                pvIndex -= 1;
                            else if (e.deltaY > 0 && pvIndex < pvMoves.length - 1)
                                pvIndex += 1;
                            const pvBoard = pvMoves[pvIndex];
                            if (pvBoard) {
                                const [fen, uci] = pvBoard.split('|');
                                ctrl.getCeval().setPvBoard({ fen, uci });
                            }
                        }
                    });
                    el.addEventListener('mouseout', () => ctrl.getCeval().setHovering(getElFen(el)));
                    for (const event of ['touchstart', 'mousedown']) {
                        el.addEventListener(event, (e) => {
                            const uci = getElUci(e);
                            if (uci) {
                                ctrl.playUci(uci);
                                e.preventDefault();
                            }
                        });
                    }
                    el.addEventListener('mouseleave', () => {
                        ctrl.getCeval().setPvBoard(null);
                        pvIndex = null;
                    });
                    checkHover(el, instance);
                },
                postpatch: (_, vnode) => checkHover(vnode.elm, instance),
            },
        }, [
            ...[...Array(multiPv).keys()].map(i => renderPv(threat, multiPv, pvs[i], pos.isOk ? pos.value : undefined)),
            renderPvBoard(ctrl),
        ]);
    }
    const MAX_NUM_MOVES = 16;
    function renderPv(threat, multiPv, pv, pos) {
        const data = {};
        const children = [renderPvWrapToggle()];
        if (pv) {
            if (!threat) {
                data.attrs = { 'data-uci': pv.moves[0] };
            }
            if (multiPv > 1) {
                children.push(h('strong', defined$1(pv.mate) ? '#' + pv.mate : renderEval$1(pv.cp)));
            }
            if (pos) {
                children.push(...renderPvMoves(pos.clone(), pv.moves.slice(0, MAX_NUM_MOVES)));
            }
        }
        return h('div.pv.pv--nowrap', data, children);
    }
    function renderPvWrapToggle() {
        return h('span.pv-wrap-toggle', {
            hook: {
                insert: (vnode) => {
                    const el = vnode.elm;
                    for (const event of ['touchstart', 'mousedown']) {
                        el.addEventListener(event, (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            $(el).closest('.pv').toggleClass('pv--nowrap');
                        });
                    }
                },
            },
        });
    }
    function renderPvMoves(pos, pv) {
        const vnodes = [];
        let key = makeBoardFen(pos.board);
        for (let i = 0; i < pv.length; i++) {
            let text;
            if (pos.turn === 'white') {
                text = `${pos.fullmoves}.`;
            }
            else if (i === 0) {
                text = `${pos.fullmoves}...`;
            }
            if (text) {
                vnodes.push(h('span', { key: text }, text));
            }
            const uci = pv[i];
            const san = makeSanAndPlay(pos, parseUci(uci));
            const fen = makeBoardFen(pos.board); // Chessground uses only board fen
            if (san === '--') {
                break;
            }
            key += '|' + uci;
            vnodes.push(h('span.pv-san', {
                key,
                attrs: {
                    'data-move-index': i,
                    'data-board': `${fen}|${uci}`,
                },
            }, san));
        }
        return vnodes;
    }
    function renderPvBoard(ctrl) {
        const instance = ctrl.getCeval();
        const pvBoard = instance.pvBoard();
        if (!pvBoard) {
            return;
        }
        const { fen, uci } = pvBoard;
        const lastMove = uci[1] === '@' ? [uci.slice(2)] : [uci.slice(0, 2), uci.slice(2, 4)];
        const orientation = ctrl.getOrientation();
        const cgConfig = {
            fen,
            lastMove,
            orientation,
            coordinates: false,
            viewOnly: true,
            resizable: false,
            drawable: {
                enabled: false,
                visible: false,
            },
        };
        const cgVNode = h('div.cg-wrap.is2d', {
            hook: {
                insert: (vnode) => (vnode.elm._cg = window.Chessground(vnode.elm, cgConfig)),
                update: (vnode) => vnode.elm._cg.set(cgConfig),
                destroy: (vnode) => vnode.elm._cg.destroy(),
            },
        });
        return h('div.pv-board', h('div.pv-board-square', cgVNode));
    }

    // stop when another tab starts. Listen only once here,
    // as the ctrl can be instantiated several times.
    // gotta do the click on the toggle to have it visually change.
    lichess.storage.make('ceval.disable').listen(() => {
        const toggle = document.getElementById('analyse-toggle-ceval');
        if (toggle === null || toggle === void 0 ? void 0 : toggle.checked)
            toggle.click();
    });

    const plyToTurn = (ply) => Math.floor((ply - 1) / 2) + 1;
    const renderGlyph = (glyph) => h('glyph', {
        attrs: { title: glyph.name },
    }, glyph.symbol);
    const renderEval = (e) => h('eval', e.replace('-', '−'));
    function renderIndexText(ply, withDots) {
        return plyToTurn(ply) + (withDots ? (ply % 2 === 1 ? '.' : '...') : '');
    }
    function renderIndex(ply, withDots) {
        return h('index', renderIndexText(ply, withDots));
    }
    function renderMove(ctx, node) {
        const ev = getBestEval({ client: node.ceval, server: node.eval });
        const nodes = [h('san', fixCrazySan(node.san))];
        if (node.glyphs && ctx.showGlyphs)
            node.glyphs.forEach(g => nodes.push(renderGlyph(g)));
        if (node.shapes)
            nodes.push(h('shapes'));
        if (ev && ctx.showEval) {
            if (defined$1(ev.cp))
                nodes.push(renderEval(renderEval$1(ev.cp)));
            else if (defined$1(ev.mate))
                nodes.push(renderEval('#' + ev.mate));
        }
        return nodes;
    }
    function renderIndexAndMove(ctx, node) {
        if (!node.san)
            return; // initial position
        return [renderIndex(node.ply, ctx.withDots), ...renderMove(ctx, node)];
    }

    function fromPly(ctrl) {
        const renderedMove = renderIndexAndMove({
            withDots: true,
            showEval: false,
        }, ctrl.currentNode());
        return h('div.ply-wrap', h('label.ply', [
            h('input', {
                attrs: { type: 'checkbox' },
                hook: bind$1('change', e => {
                    ctrl.withPly(e.target.checked);
                }, ctrl.redraw),
            }),
            ...(renderedMove
                ? ctrl.trans.vdom('startAtX', h('strong', renderedMove))
                : [ctrl.trans.noarg('startAtInitialPosition')]),
        ]));
    }
    function ctrl$3(data, currentChapter, currentNode, relay, redraw, trans) {
        const withPly = prop(false);
        return {
            studyId: data.id,
            chapter: currentChapter,
            isPrivate() {
                return data.visibility === 'private';
            },
            currentNode,
            withPly,
            relay,
            cloneable: data.features.cloneable,
            redraw,
            trans,
        };
    }
    function view$8(ctrl) {
        const studyId = ctrl.studyId, chapter = ctrl.chapter();
        const isPrivate = ctrl.isPrivate();
        const addPly = (path) => (ctrl.withPly() ? `${path}#${ctrl.currentNode().ply}` : path);
        return h('div.study__share', [
            h('div.downloads', [
                ctrl.cloneable
                    ? h('a.button.text', {
                        attrs: {
                            'data-icon': '4',
                            href: `/study/${studyId}/clone`,
                        },
                    }, ctrl.trans.noarg('cloneStudy'))
                    : null,
                h('a.button.text', {
                    attrs: {
                        'data-icon': 'x',
                        href: `/study/${studyId}.pgn`,
                        download: true,
                    },
                }, ctrl.trans.noarg(ctrl.relay ? 'downloadAllGames' : 'studyPgn')),
                h('a.button.text', {
                    attrs: {
                        'data-icon': 'x',
                        href: `/study/${studyId}/${chapter.id}.pgn`,
                        download: true,
                    },
                }, ctrl.trans.noarg(ctrl.relay ? 'downloadGame' : 'chapterPgn')),
                h('a.button.text', {
                    attrs: {
                        'data-icon': 'x',
                        href: `/study/${studyId}/${chapter.id}.gif`,
                        download: true,
                    },
                }, 'GIF'),
            ]),
            h('form.form3', [
                ...(ctrl.relay
                    ? [
                        ['broadcastUrl', `${ctrl.relay.tourPath()}`],
                        ['currentRoundUrl', `${ctrl.relay.roundPath()}`],
                        ['currentGameUrl', `${ctrl.relay.roundPath()}/${chapter.id}`],
                    ]
                    : [
                        ['studyUrl', `/study/${studyId}`],
                        ['currentChapterUrl', addPly(`/study/${studyId}/${chapter.id}`), true],
                    ]).map(([i18n, path, isFull]) => h('div.form-group', [
                    h('label.form-label', ctrl.trans.noarg(i18n)),
                    h('input.form-control.autoselect', {
                        attrs: {
                            readonly: true,
                            value: `${baseUrl()}${path}`,
                        },
                    }),
                    ...(isFull
                        ? [
                            fromPly(ctrl),
                            !isPrivate
                                ? h('p.form-help.text', {
                                    attrs: { 'data-icon': '' },
                                }, ctrl.trans.noarg('youCanPasteThisInTheForumToEmbed'))
                                : null,
                        ]
                        : []),
                ])),
                h('div.form-group', [
                    h('label.form-label', ctrl.trans.noarg('embedInYourWebsite')),
                    h('input.form-control.autoselect', {
                        attrs: {
                            readonly: true,
                            disabled: isPrivate,
                            value: !isPrivate
                                ? `<iframe width=600 height=371 src="${baseUrl()}${addPly(`/study/embed/${studyId}/${chapter.id}`)}" frameborder=0></iframe>`
                                : ctrl.trans.noarg('onlyPublicStudiesCanBeEmbedded'),
                        },
                    }),
                ].concat(!isPrivate
                    ? [
                        fromPly(ctrl),
                        h('a.form-help.text', {
                            attrs: {
                                href: '/developers#embed-study',
                                target: '_blank',
                                rel: 'noopener',
                                'data-icon': '',
                            },
                        }, ctrl.trans.noarg('readMoreAboutEmbedding')),
                    ]
                    : [])),
                h('div.form-group', [
                    h('label.form-label', 'FEN'),
                    h('input.form-control.autoselect', {
                        attrs: {
                            readonly: true,
                            value: ctrl.currentNode().fen,
                        },
                    }),
                ]),
            ]),
        ]);
    }

    function editable(value, submit) {
        return h('input', {
            key: value,
            attrs: {
                spellcheck: false,
                value,
            },
            hook: onInsert(el => {
                el.onblur = function () {
                    submit(el.value, el);
                };
                el.onkeydown = function (e) {
                    if (e.key === 'Enter')
                        el.blur();
                };
            }),
        });
    }
    function fixed(text) {
        return h('span', text);
    }
    let selectedType;
    function renderPgnTags(chapter, submit, types, trans) {
        let rows = [];
        if (chapter.setup.variant.key !== 'standard')
            rows.push(['Variant', fixed(chapter.setup.variant.name)]);
        rows = rows.concat(chapter.tags.map(tag => [tag[0], submit ? editable(tag[1], submit(tag[0])) : fixed(tag[1])]));
        if (submit) {
            const existingTypes = chapter.tags.map(t => t[0]);
            rows.push([
                h('select', {
                    hook: {
                        insert: vnode => {
                            const el = vnode.elm;
                            selectedType = el.value;
                            el.addEventListener('change', _ => {
                                selectedType = el.value;
                                $(el)
                                    .parents('tr')
                                    .find('input')
                                    .each(function () {
                                    this.focus();
                                });
                            });
                        },
                        postpatch: (_, vnode) => {
                            selectedType = vnode.elm.value;
                        },
                    },
                }, [
                    h('option', trans.noarg('newTag')),
                    ...types.map(t => {
                        if (!existingTypes.includes(t))
                            return option(t, '', t);
                        return undefined;
                    }),
                ]),
                editable('', (value, el) => {
                    if (selectedType) {
                        submit(selectedType)(value);
                        el.value = '';
                    }
                }),
            ]);
        }
        return h('table.study__tags.slist', h('tbody', rows.map(function (r) {
            return h('tr', {
                key: '' + r[0],
            }, [h('th', [r[0]]), h('td', [r[1]])]);
        })));
    }
    function ctrl$2(root, getChapter, types) {
        const submit = throttle(500, function (name, value) {
            root.study.makeChange('setTag', {
                chapterId: getChapter().id,
                name,
                value: value.substr(0, 140),
            });
        });
        return {
            submit(name) {
                return (value) => submit(name, value);
            },
            getChapter,
            types,
        };
    }
    function doRender$1(root) {
        return h('div', renderPgnTags(root.tags.getChapter(), root.vm.mode.write && root.tags.submit, root.tags.types, root.trans));
    }
    function view$7(root) {
        const chapter = root.tags.getChapter(), tagKey = chapter.tags.map(t => t[1]).join(','), key = chapter.id + root.data.name + chapter.name + root.data.likes + tagKey + root.vm.mode.write;
        return thunk('div.' + chapter.id, doRender$1, [root, key]);
    }

    function ctrl$1(root, chapterId) {
        const requested = prop(false), lastPly = prop(false), chartEl = prop(null);
        function unselect(chart) {
            chart.getSelectedPoints().forEach(p => p.select(false));
        }
        lichess.pubsub.on('analysis.change', (_fen, _path, mainlinePly) => {
            if (!lichess.advantageChart || lastPly() === mainlinePly)
                return;
            const lp = lastPly(typeof mainlinePly === 'undefined' ? lastPly() : mainlinePly), el = chartEl(), chart = el && el.highcharts;
            if (chart) {
                if (lp === false)
                    unselect(chart);
                else {
                    const point = chart.series[0].data[lp - 1 - root.tree.root.ply];
                    if (defined$1(point))
                        point.select();
                    else
                        unselect(chart);
                }
            }
            else
                lastPly(false);
        });
        return {
            root,
            reset() {
                requested(false);
                lastPly(false);
            },
            chapterId,
            onMergeAnalysisData() {
                if (lichess.advantageChart)
                    lichess.advantageChart.update(root.data);
            },
            request() {
                root.socket.send('requestAnalysis', chapterId());
                requested(true);
            },
            requested,
            lastPly,
            chartEl,
        };
    }
    function view$6(ctrl) {
        const analysis = ctrl.root.data.analysis;
        if (!ctrl.root.showComputer())
            return disabled();
        if (!analysis)
            return ctrl.requested() ? requested() : requestButton(ctrl);
        return h('div.study__server-eval.ready.' + analysis.id, {
            hook: onInsert(el => {
                ctrl.lastPly(false);
                lichess.requestIdleCallback(() => lichess.loadScript('javascripts/chart/acpl.js').then(() => {
                    lichess.advantageChart(ctrl.root.data, ctrl.root.trans, el);
                    ctrl.chartEl(el);
                }), 800);
            }),
        }, [h('div.study__message', spinner())]);
    }
    function disabled() {
        return h('div.study__server-eval.disabled.padded', 'You disabled computer analysis.');
    }
    function requested() {
        return h('div.study__server-eval.requested.padded', spinner());
    }
    function requestButton(ctrl) {
        const root = ctrl.root;
        return h('div.study__message', root.mainline.length < 5
            ? h('p', root.trans.noarg('theChapterIsTooShortToBeAnalysed'))
            : !root.study.members.canContribute()
                ? [root.trans.noarg('onlyContributorsCanRequestAnalysis')]
                : [
                    h('p', [
                        root.trans.noarg('getAFullComputerAnalysis'),
                        h('br'),
                        root.trans.noarg('makeSureTheChapterIsComplete'),
                    ]),
                    h('a.button.text', {
                        attrs: {
                            'data-icon': '',
                            disabled: root.mainline.length < 5,
                        },
                        hook: bind$1('click', ctrl.request, root.redraw),
                    }, root.trans.noarg('requestAComputerAnalysis')),
                ]);
    }

    function pieceDrop(key, role, color) {
        return {
            orig: key,
            piece: {
                color,
                role,
                scale: 0.8,
            },
            brush: 'green',
        };
    }
    function makeShapesFromUci(color, uci, brush, modifiers) {
        const move = parseUci(uci);
        const to = makeSquare(move.to);
        if (isDrop(move))
            return [{ orig: to, brush }, pieceDrop(to, move.role, color)];
        const shapes = [
            {
                orig: makeSquare(move.from),
                dest: to,
                brush,
                modifiers,
            },
        ];
        if (move.promotion)
            shapes.push(pieceDrop(to, move.promotion, color));
        return shapes;
    }
    function compute(ctrl) {
        const color = ctrl.node.fen.includes(' w ') ? 'white' : 'black';
        const rcolor = opposite$1(color);
        if (ctrl.practice) {
            const hovering = ctrl.practice.hovering();
            if (hovering)
                return makeShapesFromUci(color, hovering.uci, 'green');
            const hint = ctrl.practice.hinting();
            if (hint) {
                if (hint.mode === 'move')
                    return makeShapesFromUci(color, hint.uci, 'paleBlue');
                else
                    return [
                        {
                            orig: (hint.uci[1] === '@' ? hint.uci.slice(2, 4) : hint.uci.slice(0, 2)),
                            brush: 'paleBlue',
                        },
                    ];
            }
            return [];
        }
        const instance = ctrl.getCeval();
        const hovering = ctrl.explorer.hovering() || instance.hovering();
        const { eval: nEval = {}, fen: nFen, ceval: nCeval, threat: nThreat } = ctrl.node;
        let shapes = [], badNode;
        if (ctrl.retro && (badNode = ctrl.retro.showBadNode())) {
            return makeShapesFromUci(color, badNode.uci, 'paleRed', {
                lineWidth: 8,
            });
        }
        if (hovering && hovering.fen === nFen)
            shapes = shapes.concat(makeShapesFromUci(color, hovering.uci, 'paleBlue'));
        if (ctrl.showAutoShapes() && ctrl.showComputer()) {
            if (nEval.best)
                shapes = shapes.concat(makeShapesFromUci(rcolor, nEval.best, 'paleGreen'));
            if (!hovering && parseInt(instance.multiPv())) {
                let nextBest = ctrl.nextNodeBest();
                if (!nextBest && instance.enabled() && nCeval)
                    nextBest = nCeval.pvs[0].moves[0];
                if (nextBest)
                    shapes = shapes.concat(makeShapesFromUci(color, nextBest, 'paleBlue'));
                if (instance.enabled() && nCeval && nCeval.pvs[1] && !(ctrl.threatMode() && nThreat && nThreat.pvs.length > 2)) {
                    nCeval.pvs.forEach(function (pv) {
                        if (pv.moves[0] === nextBest)
                            return;
                        const shift = povDiff(color, nCeval.pvs[0], pv);
                        if (shift >= 0 && shift < 0.2) {
                            shapes = shapes.concat(makeShapesFromUci(color, pv.moves[0], 'paleGrey', {
                                lineWidth: Math.round(12 - shift * 50), // 12 to 2
                            }));
                        }
                    });
                }
            }
        }
        if (instance.enabled() && ctrl.threatMode() && nThreat) {
            const [pv0, ...pv1s] = nThreat.pvs;
            shapes = shapes.concat(makeShapesFromUci(rcolor, pv0.moves[0], pv1s.length > 0 ? 'paleRed' : 'red'));
            pv1s.forEach(function (pv) {
                const shift = povDiff(rcolor, pv, pv0);
                if (shift >= 0 && shift < 0.2) {
                    shapes = shapes.concat(makeShapesFromUci(rcolor, pv.moves[0], 'paleRed', {
                        lineWidth: Math.round(11 - shift * 45), // 11 to 2
                    }));
                }
            });
        }
        if (ctrl.showMoveAnnotation() && ctrl.showComputer()) {
            const { uci, glyphs, san } = ctrl.node;
            if (uci && san && glyphs && glyphs.length > 0) {
                const glyph = glyphs[0];
                const svg = glyphToSvg[glyph.symbol];
                if (svg) {
                    const move = parseUci(uci);
                    const destSquare = san.startsWith('O-O') // castle, short or long
                        ? squareRank(move.to) === 0 // white castle
                            ? san === 'O-O-O'
                                ? 'c1'
                                : 'g1'
                            : san === 'O-O-O'
                                ? 'c8'
                                : 'g8'
                        : makeSquare(move.to);
                    shapes = shapes.concat({
                        orig: destSquare,
                        customSvg: svg,
                    });
                }
            }
        }
        return shapes;
    }
    // NOTE:
    //   Base svg was authored with Inkscape.
    ///  Inkscape's output includes unnecessary attributes so they are cleaned up manually.
    //   On Inkscape, by using "Object to Path", text is converted to path, which enables consistent layout on browser.
    //   Wrap it by `transform="translate(...) scale(...)"` so that it sits at the right top corner.
    //   Small tweak (e.g. changing color, scaling size, etc...) can be done by directly modifying svg below.
    const glyphToSvg = {
        // Inaccuracy
        '?!': `
<defs>
  <filter id="shadow">
    <feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5" />
  </filter>
</defs>
<g transform="translate(77 -18) scale(0.4)">
  <circle style="fill:#56b4e9;filter:url(#shadow)" cx="50" cy="50" r="50" />
  <path style="fill:#ffffff;stroke-width:0.81934" d="m 37.734375,21.947266 c -3.714341,0 -7.128696,0.463992 -10.242187,1.392578 -3.113493,0.928585 -6.009037,2.130656 -8.685547,3.605468 l 4.34375,8.765626 c 2.348774,-1.201699 4.643283,-2.157093 6.882812,-2.867188 2.239529,-0.710095 4.504676,-1.064453 6.798828,-1.064453 2.294152,0 4.069851,0.463993 5.326172,1.392578 1.310944,0.873963 1.966797,2.185668 1.966797,3.933594 0,1.747925 -0.546219,3.276946 -1.638672,4.58789 -1.037831,1.256322 -2.786121,2.757934 -5.24414,4.50586 -2.785757,2.021038 -4.751362,3.961188 -5.898438,5.818359 -1.147076,1.857171 -1.720703,4.149726 -1.720703,6.88086 v 2.951171 h 10.568359 v -2.376953 c 0,-1.147076 0.137043,-2.10247 0.410156,-2.867187 0.327737,-0.764718 0.928772,-1.557613 1.802735,-2.376953 0.873963,-0.81934 2.103443,-1.802143 3.6875,-2.949219 2.130284,-1.584057 3.905982,-3.058262 5.326172,-4.423828 1.420189,-1.42019 2.485218,-2.951164 3.195312,-4.589844 0.710095,-1.63868 1.064453,-3.576877 1.064453,-5.816406 0,-4.205946 -1.583838,-7.675117 -4.751953,-10.40625 -3.113492,-2.731134 -7.510649,-4.095703 -13.191406,-4.095703 z m 24.744141,0.818359 2.048828,39.083984 h 9.75 L 76.324219,22.765625 Z M 35.357422,68.730469 c -1.966416,0 -3.63248,0.51881 -4.998047,1.55664 -1.365567,0.983208 -2.046875,2.731498 -2.046875,5.244141 0,2.403397 0.681308,4.151687 2.046875,5.244141 1.365567,1.03783 3.031631,1.55664 4.998047,1.55664 1.911793,0 3.550449,-0.51881 4.916016,-1.55664 1.365566,-1.092454 2.048828,-2.840744 2.048828,-5.244141 0,-2.512643 -0.683262,-4.260933 -2.048828,-5.244141 -1.365567,-1.03783 -3.004223,-1.55664 -4.916016,-1.55664 z m 34.003906,0 c -1.966416,0 -3.63248,0.51881 -4.998047,1.55664 -1.365566,0.983208 -2.048828,2.731498 -2.048828,5.244141 0,2.403397 0.683262,4.151687 2.048828,5.244141 1.365567,1.03783 3.031631,1.55664 4.998047,1.55664 1.911793,0 3.550449,-0.51881 4.916016,-1.55664 1.365566,-1.092454 2.046875,-2.840744 2.046875,-5.244141 0,-2.512643 -0.681309,-4.260933 -2.046875,-5.244141 -1.365567,-1.03783 -3.004223,-1.55664 -4.916016,-1.55664 z" />
</g>
`,
        // Mistake
        '?': `
<defs>
  <filter id="shadow">
    <feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5" />
  </filter>
</defs>
<g transform="translate(77 -18) scale(0.4)">
  <circle style="fill:#e69f00;filter:url(#shadow)" cx="50" cy="50" r="50" />
  <path style="fill:#ffffff;stroke-width:0.932208" d="m 40.435856,60.851495 q 0,-4.661041 1.957637,-7.830548 1.957637,-3.169507 6.711897,-6.618677 4.194937,-2.983065 5.966132,-5.127144 1.864416,-2.237299 1.864416,-5.220365 0,-2.983065 -2.237299,-4.474598 -2.144079,-1.584754 -6.059353,-1.584754 -3.915273,0 -7.737326,1.21187 -3.822053,1.211871 -7.830548,3.262729 L 28.13071,24.495382 q 4.567819,-2.516962 9.881405,-4.101716 5.313586,-1.584753 11.6526,-1.584753 9.694964,0 15.008549,4.66104 5.406807,4.66104 5.406807,11.839042 0,3.822053 -1.21187,6.618677 -1.211871,2.796624 -3.635612,5.220365 -2.423741,2.33052 -6.059352,5.033923 -2.703403,1.957637 -4.194936,3.355949 -1.491533,1.398312 -2.050858,2.703403 -0.466104,1.305091 -0.466104,3.262728 v 2.703403 H 40.435856 Z m -1.491533,18.923822 q 0,-4.288156 2.33052,-5.966131 2.33052,-1.771195 5.686469,-1.771195 3.262728,0 5.593248,1.771195 2.33052,1.677975 2.33052,5.966131 0,4.101716 -2.33052,5.966132 -2.33052,1.771195 -5.593248,1.771195 -3.355949,0 -5.686469,-1.771195 -2.33052,-1.864416 -2.33052,-5.966132 z" />
</g>
`,
        // Blunder
        '??': `
<defs>
  <filter id="shadow">
    <feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5" />
  </filter>
</defs>
<g transform="translate(77 -18) scale(0.4)">
  <circle style="fill:#df5353;filter:url(#shadow)" cx="50" cy="50" r="50" />
  <path style="fill:#ffffff;stroke-width:0.810558" d="m 31.799294,22.220598 c -3.67453,-10e-7 -7.050841,0.460303 -10.130961,1.378935 -3.08012,0.918633 -5.945403,2.106934 -8.593226,3.565938 l 4.297618,8.67363 c 2.3236,-1.188818 4.592722,-2.135794 6.808247,-2.838277 2.215525,-0.702483 4.45828,-1.053299 6.727842,-1.053299 2.269562,0 4.025646,0.460305 5.268502,1.378937 1.296893,0.864596 1.945788,2.160375 1.945788,3.889565 0,1.72919 -0.541416,3.241939 -1.62216,4.538831 -1.026707,1.242856 -2.756423,2.729237 -5.188097,4.458428 -2.755898,1.999376 -4.700572,3.917682 -5.835354,5.754947 -1.13478,1.837266 -1.702564,4.106388 -1.702564,6.808248 v 2.918681 h 10.4566 v -2.34982 c 0,-1.134781 0.135856,-2.081756 0.406042,-2.838277 0.324222,-0.756521 0.918373,-1.539262 1.782969,-2.349819 0.864595,-0.810559 2.079262,-1.783901 3.646342,-2.918683 2.10745,-1.567078 3.863533,-3.025082 5.268501,-4.376012 1.404967,-1.404967 2.459422,-2.919725 3.161905,-4.540841 0.702483,-1.621116 1.053298,-3.539423 1.053298,-5.754948 0,-4.160865 -1.567492,-7.591921 -4.70165,-10.29378 -3.080121,-2.70186 -7.429774,-4.052384 -13.049642,-4.052384 z m 38.66449,0 c -3.67453,-10e-7 -7.05285,0.460303 -10.132971,1.378935 -3.08012,0.918633 -5.943393,2.106934 -8.591215,3.565938 l 4.295608,8.67363 c 2.323599,-1.188818 4.592721,-2.135794 6.808246,-2.838277 2.215526,-0.702483 4.458281,-1.053299 6.727842,-1.053299 2.269563,0 4.025647,0.460305 5.268502,1.378937 1.296893,0.864596 1.945788,2.160375 1.945788,3.889565 0,1.72919 -0.539406,3.241939 -1.62015,4.538831 -1.026707,1.242856 -2.756423,2.729237 -5.188097,4.458428 -2.755897,1.999376 -4.700572,3.917682 -5.835353,5.754947 -1.134782,1.837266 -1.702564,4.106388 -1.702564,6.808248 v 2.918681 h 10.456599 v -2.34982 c 0,-1.134781 0.133846,-2.081756 0.404032,-2.838277 0.324223,-0.756521 0.918374,-1.539262 1.782969,-2.349819 0.864596,-0.810559 2.081273,-1.783901 3.648352,-2.918683 2.107451,-1.567078 3.863534,-3.025082 5.268502,-4.376012 1.404966,-1.404967 2.45942,-2.919725 3.161904,-4.540841 0.702483,-1.621116 1.053299,-3.539423 1.053299,-5.754948 0,-4.160865 -1.567493,-7.591921 -4.701651,-10.29378 -3.08012,-2.70186 -7.429774,-4.052384 -13.049642,-4.052384 z M 29.449473,68.50341 c -1.945339,0 -3.593943,0.513038 -4.944873,1.539744 -1.350931,0.97267 -2.026192,2.702386 -2.026192,5.188098 0,2.377636 0.675261,4.107352 2.026192,5.188097 1.35093,1.026707 2.999534,1.539745 4.944873,1.539745 1.891302,0 3.51153,-0.513038 4.86246,-1.539745 1.35093,-1.080745 2.026192,-2.810461 2.026192,-5.188097 0,-2.485712 -0.675262,-4.215428 -2.026192,-5.188098 -1.35093,-1.026706 -2.971158,-1.539744 -4.86246,-1.539744 z m 38.662481,0 c -1.945339,0 -3.591933,0.513038 -4.942864,1.539744 -1.35093,0.97267 -2.026192,2.702386 -2.026192,5.188098 0,2.377636 0.675262,4.107352 2.026192,5.188097 1.350931,1.026707 2.997525,1.539745 4.942864,1.539745 1.891302,0 3.513539,-0.513038 4.864469,-1.539745 1.350931,-1.080745 2.026192,-2.810461 2.026192,-5.188097 0,-2.485712 -0.675261,-4.215428 -2.026192,-5.188098 -1.35093,-1.026706 -2.973167,-1.539744 -4.864469,-1.539744 z" />
</g>
`,
    };

    class GamebookPlayCtrl {
        constructor(root, chapterId, trans, redraw) {
            this.root = root;
            this.chapterId = chapterId;
            this.trans = trans;
            this.redraw = redraw;
            this.makeState = () => {
                const node = this.root.node, nodeComment = (node.comments || [])[0], state = {
                    init: this.root.path === '',
                    comment: nodeComment ? nodeComment.text : undefined,
                    showHint: false,
                }, parPath = init(this.root.path), parNode = this.root.tree.nodeAtPath(parPath);
                if (!this.root.onMainline && !this.root.tree.pathIsMainline(parPath))
                    return;
                if (this.root.onMainline && !node.children[0]) {
                    state.feedback = 'end';
                }
                else if (this.isMyMove()) {
                    state.feedback = 'play';
                    state.hint = (node.gamebook || {}).hint;
                }
                else if (this.root.onMainline) {
                    state.feedback = 'good';
                }
                else {
                    state.feedback = 'bad';
                    if (!state.comment) {
                        state.comment = parNode.children[0].gamebook.deviation;
                    }
                }
                this.state = state;
                if (!state.comment) {
                    if (state.feedback === 'good')
                        setTimeout(this.next, this.root.path ? 1000 : 300);
                    else if (state.feedback === 'bad')
                        setTimeout(this.retry, 800);
                }
            };
            this.isMyMove = () => this.root.turnColor() === this.root.data.orientation;
            this.retry = () => {
                let path = this.root.path;
                while (path && !this.root.tree.pathIsMainline(path))
                    path = init(path);
                this.root.userJump(path);
                this.redraw();
            };
            this.next = () => {
                if (!this.isMyMove()) {
                    const child = this.root.node.children[0];
                    if (child)
                        this.root.userJump(this.root.path + child.id);
                }
                this.redraw();
            };
            this.onSpace = () => {
                switch (this.state.feedback) {
                    case 'bad':
                        this.retry();
                        break;
                    case 'end': {
                        this.root.study.goToNextChapter();
                        break;
                    }
                    default:
                        this.next();
                }
            };
            this.onPremoveSet = () => {
                this.next();
            };
            this.hint = () => {
                if (this.state.hint)
                    this.state.showHint = !this.state.showHint;
            };
            this.solution = () => {
                this.root.chessground.setShapes(makeShapesFromUci(this.root.turnColor(), this.root.node.children[0].uci, 'green'));
            };
            this.canJumpTo = (path) => contains(this.root.path, path);
            this.onJump = () => {
                this.makeState();
                // wait for the root ctrl to make the move
                setTimeout(() => this.root.withCg(cg => cg.playPremove()), 100);
            };
            this.onShapeChange = (shapes) => {
                const node = this.root.node;
                if (node.gamebook && node.gamebook.shapes && !shapes.length) {
                    node.shapes = node.gamebook.shapes.slice(0);
                    this.root.jump(this.root.path);
                }
            };
            // ensure all original nodes have a gamebook entry,
            // so we can differentiate original nodes from user-made ones
            updateAll(root.tree.root, n => {
                n.gamebook = n.gamebook || {};
                if (n.shapes)
                    n.gamebook.shapes = n.shapes.slice(0);
            });
            this.makeState();
        }
    }

    class DescriptionCtrl {
        constructor(text, doSave, redraw) {
            this.text = text;
            this.doSave = doSave;
            this.redraw = redraw;
            this.edit = false;
        }
        save(t) {
            this.text = t;
            this.doSave(t);
            this.redraw();
        }
        set(t) {
            this.text = t ? t : undefined;
        }
    }
    function descTitle(chapter) {
        return `${chapter ? 'Chapter' : 'Study'} pinned comment`;
    }
    function view$5(study, chapter) {
        const desc = chapter ? study.chapterDesc : study.studyDesc, contrib = study.members.canContribute() && !study.gamebookPlay();
        if (desc.edit)
            return edit(desc, chapter ? study.data.chapter.id : study.data.id, chapter);
        const isEmpty = desc.text === '-';
        if (!desc.text || (isEmpty && !contrib))
            return;
        return h(`div.study-desc${chapter ? '.chapter-desc' : ''}${isEmpty ? '.empty' : ''}`, [
            contrib && !isEmpty
                ? h('div.contrib', [
                    h('span', descTitle(chapter)),
                    isEmpty
                        ? null
                        : h('a', {
                            attrs: {
                                'data-icon': 'm',
                                title: 'Edit',
                            },
                            hook: bind$1('click', _ => {
                                desc.edit = true;
                            }, desc.redraw),
                        }),
                    h('a', {
                        attrs: {
                            'data-icon': 'q',
                            title: 'Delete',
                        },
                        hook: bind$1('click', () => {
                            if (confirm('Delete permanent description?'))
                                desc.save('');
                        }),
                    }),
                ])
                : null,
            isEmpty
                ? h('a.text.button', {
                    hook: bind$1('click', _ => {
                        desc.edit = true;
                    }, desc.redraw),
                }, descTitle(chapter))
                : h('div.text', { hook: richHTML(desc.text) }),
        ]);
    }
    function edit(ctrl, id, chapter) {
        return h('div.study-desc-form', [
            h('div.title', [
                descTitle(chapter),
                h('button.button.button-empty.button-red', {
                    attrs: {
                        'data-icon': 'L',
                        title: 'Close',
                    },
                    hook: bind$1('click', () => (ctrl.edit = false), ctrl.redraw),
                }),
            ]),
            h('form.form3', [
                h('div.form-group', [
                    h('textarea#form-control.desc-text.' + id, {
                        hook: onInsert(el => {
                            el.value = ctrl.text === '-' ? '' : ctrl.text || '';
                            el.onkeyup = el.onpaste = () => {
                                ctrl.save(el.value.trim());
                            };
                            el.focus();
                        }),
                    }),
                ]),
            ]),
        ]);
    }

    class RelayCtrl {
        constructor(id, data, send, redraw, members, chapter) {
            this.id = id;
            this.data = data;
            this.send = send;
            this.redraw = redraw;
            this.members = members;
            this.log = [];
            this.cooldown = false;
            this.setSync = (v) => {
                this.send('relaySync', v);
                this.redraw();
            };
            this.loading = () => { var _a; return !this.cooldown && ((_a = this.data.sync) === null || _a === void 0 ? void 0 : _a.ongoing); };
            this.applyChapterRelay = (c, r) => {
                if (this.clockInterval)
                    clearInterval(this.clockInterval);
                if (r) {
                    c.relay = this.convertDate(r);
                    if (!isFinished(c))
                        this.clockInterval = setInterval(this.redraw, 1000);
                }
            };
            this.roundById = (id) => this.data.rounds.find(r => r.id == id);
            this.currentRound = () => this.roundById(this.id);
            this.tourPath = () => `/broadcast/${this.data.tour.slug}/${this.data.tour.id}`;
            this.roundPath = (round) => {
                const r = round || this.currentRound();
                return r && `/broadcast/${this.data.tour.slug}/${r.slug}/${r.id}`;
            };
            this.convertDate = (r) => {
                if (typeof r.secondsSinceLastMove !== 'undefined' && !r.lastMoveAt) {
                    r.lastMoveAt = Date.now() - r.secondsSinceLastMove * 1000;
                }
                return r;
            };
            this.socketHandlers = {
                relayData: (d) => {
                    var _a;
                    if (d.sync)
                        d.sync.log = ((_a = this.data.sync) === null || _a === void 0 ? void 0 : _a.log) || [];
                    this.data = d;
                    this.redraw();
                },
                relaySync: (sync) => {
                    var _a;
                    this.data.sync = Object.assign(Object.assign({}, sync), { log: ((_a = this.data.sync) === null || _a === void 0 ? void 0 : _a.log) || sync.log });
                    this.redraw();
                },
                relayLog: (event) => {
                    if (!this.data.sync)
                        return;
                    this.data.sync.log.push(event);
                    this.data.sync.log = this.data.sync.log.slice(-20);
                    this.cooldown = true;
                    setTimeout(() => {
                        this.cooldown = false;
                        this.redraw();
                    }, 4500);
                    this.redraw();
                    if (event.error)
                        console.warn(`relay synchronisation error: ${event.error}`);
                },
            };
            this.socketHandler = (t, d) => {
                const handler = this.socketHandlers[t];
                if (handler && d.id === this.id) {
                    handler(d);
                    return true;
                }
                return false;
            };
            this.applyChapterRelay(chapter, chapter.relay);
            this.tourShow = {
                active: (location.pathname.match(/\//g) || []).length < 5,
                disable: () => {
                    this.tourShow.active = false;
                },
            };
        }
    }

    /* kind like $.data, except simpler */
    const makeKey = (key) => `lichess-${key}`;
    const get = (owner, key) => owner[makeKey(key)];

    class MultiBoardCtrl {
        constructor(studyId, redraw, trans) {
            this.studyId = studyId;
            this.redraw = redraw;
            this.trans = trans;
            this.loading = false;
            this.page = 1;
            this.playing = false;
            this.addNode = (pos, node) => {
                const cp = this.pager && this.pager.currentPageResults.find(cp => cp.id == pos.chapterId);
                if (cp && cp.playing) {
                    cp.fen = node.fen;
                    cp.lastMove = node.uci;
                    this.redraw();
                }
            };
            this.reload = (onInsert) => {
                if (this.pager && !onInsert) {
                    this.loading = true;
                    this.redraw();
                }
                multiBoard(this.studyId, this.page, this.playing).then(p => {
                    this.pager = p;
                    if (p.nbPages < this.page) {
                        if (!p.nbPages)
                            this.page = 1;
                        else
                            this.setPage(p.nbPages);
                    }
                    this.loading = false;
                    this.redraw();
                });
            };
            this.reloadEventually = debounce(this.reload, 1000);
            this.setPage = (page) => {
                if (this.page != page) {
                    this.page = page;
                    this.reload();
                }
            };
            this.nextPage = () => this.setPage(this.page + 1);
            this.prevPage = () => this.setPage(this.page - 1);
            this.lastPage = () => {
                if (this.pager)
                    this.setPage(this.pager.nbPages);
            };
            this.setPlaying = (v) => {
                this.playing = v;
                this.reload();
            };
        }
    }
    function view$4(ctrl, study) {
        const chapterIds = study.chapters
            .list()
            .map(c => c.id)
            .join('');
        return h('div.study__multiboard', {
            class: { loading: ctrl.loading, nopager: !ctrl.pager },
            hook: {
                insert(vnode) {
                    ctrl.reload(true);
                    vnode.data.chapterIds = chapterIds;
                },
                postpatch(old, vnode) {
                    if (old.data.chapterIds !== chapterIds)
                        ctrl.reloadEventually();
                    vnode.data.chapterIds = chapterIds;
                },
            },
        }, ctrl.pager ? renderPager(ctrl.pager, study) : [spinner()]);
    }
    function renderPager(pager, study) {
        const ctrl = study.multiBoard;
        return [
            h('div.top', [renderPagerNav(pager, ctrl), renderPlayingToggle(ctrl)]),
            h('div.now-playing', pager.currentPageResults.map(makePreview(study))),
        ];
    }
    function renderPlayingToggle(ctrl) {
        return h('label.playing', [
            h('input', {
                attrs: { type: 'checkbox' },
                hook: bind$1('change', e => {
                    ctrl.setPlaying(e.target.checked);
                }),
            }),
            ctrl.trans.noarg('playing'),
        ]);
    }
    function renderPagerNav(pager, ctrl) {
        const page = ctrl.page, from = Math.min(pager.nbResults, (page - 1) * pager.maxPerPage + 1), to = Math.min(pager.nbResults, page * pager.maxPerPage);
        return h('div.pager', [
            pagerButton(ctrl.trans.noarg('first'), 'W', () => ctrl.setPage(1), page > 1, ctrl),
            pagerButton(ctrl.trans.noarg('previous'), 'Y', ctrl.prevPage, page > 1, ctrl),
            h('span.page', `${from}-${to} / ${pager.nbResults}`),
            pagerButton(ctrl.trans.noarg('next'), 'X', ctrl.nextPage, page < pager.nbPages, ctrl),
            pagerButton(ctrl.trans.noarg('last'), 'V', ctrl.lastPage, page < pager.nbPages, ctrl),
        ]);
    }
    function pagerButton(text, icon, click, enable, ctrl) {
        return h('button.fbt', {
            attrs: {
                'data-icon': icon,
                disabled: !enable,
                title: text,
            },
            hook: bind$1('mousedown', click, ctrl.redraw),
        });
    }
    function makePreview(study) {
        return (preview) => {
            var _a;
            const contents = preview.players
                ? [
                    makePlayer(preview.players[opposite$1(preview.orientation)]),
                    makeCg(preview),
                    makePlayer(preview.players[preview.orientation]),
                ]
                : [h('div.name', preview.name), makeCg(preview)];
            return h('a.' + preview.id, {
                attrs: { title: preview.name },
                class: {
                    active: !study.multiBoard.loading && study.vm.chapterId == preview.id && !((_a = study.relay) === null || _a === void 0 ? void 0 : _a.tourShow.active),
                },
                hook: bind$1('mousedown', _ => study.setChapter(preview.id)),
            }, contents);
        };
    }
    function makePlayer(player) {
        return h('span.player', [
            player.title ? `${player.title} ${player.name}` : player.name,
            player.rating && h('span', '' + player.rating),
        ]);
    }
    function makeCg(preview) {
        return h('span.mini-board.cg-wrap.is2d', {
            attrs: {
                'data-state': `${preview.fen},${preview.orientation},${preview.lastMove}`,
            },
            hook: {
                insert(vnode) {
                    lichess.miniBoard.init(vnode.elm);
                    vnode.data.fen = preview.fen;
                },
                postpatch(old, vnode) {
                    if (old.data.fen !== preview.fen) {
                        const lm = preview.lastMove;
                        get(vnode.elm, 'chessground').set({
                            fen: preview.fen,
                            lastMove: [lm[0] + lm[1], lm[2] + lm[3]],
                        });
                    }
                    vnode.data.fen = preview.fen;
                },
            },
        });
    }

    // data.position.path represents the server state
    // ctrl.path is the client state
    function makeStudy (data, ctrl, tagTypes, practiceData, relayData) {
        const send = ctrl.socket.send;
        const redraw = ctrl.redraw;
        const vm = (() => {
            const isManualChapter = data.chapter.id !== data.position.chapterId;
            const sticked = data.features.sticky && !ctrl.initialPath && !isManualChapter && !practiceData;
            return {
                loading: false,
                tab: prop(relayData || data.chapters.length > 1 ? 'chapters' : 'members'),
                toolTab: prop('tags'),
                chapterId: sticked ? data.position.chapterId : data.chapter.id,
                // path is at ctrl.path
                mode: {
                    sticky: sticked,
                    write: true,
                },
                // how many events missed because sync=off
                behind: 0,
                // how stale is the study
                updatedAt: Date.now() - data.secondsSinceUpdate * 1000,
                gamebookOverride: undefined,
            };
        })();
        const notif = ctrl$4(redraw);
        const startTour = () => study(ctrl);
        const members = ctrl$c({
            initDict: data.members,
            myId: practiceData ? undefined : ctrl.opts.userId,
            ownerId: data.ownerId,
            send,
            tab: vm.tab,
            startTour,
            notif,
            onBecomingContributor() {
                vm.mode.write = true;
            },
            admin: data.admin,
            redraw,
            trans: ctrl.trans,
        });
        const chapters = ctrl$9(data.chapters, send, () => vm.tab('chapters'), chapterId => chapterConfig(data.id, chapterId), ctrl);
        const currentChapter = () => chapters.get(vm.chapterId);
        const isChapterOwner = () => ctrl.opts.userId === data.chapter.ownerId;
        const multiBoard = new MultiBoardCtrl(data.id, redraw, ctrl.trans);
        const relay = relayData ? new RelayCtrl(data.id, relayData, send, redraw, members, data.chapter) : undefined;
        const form = ctrl$6((d, isNew) => {
            send('editStudy', d);
            if (isNew &&
                data.chapter.setup.variant.key === 'standard' &&
                ctrl.mainline.length === 1 &&
                !data.chapter.setup.fromFen &&
                !relay)
                chapters.newForm.openInitial();
        }, () => data, ctrl.trans, redraw, relay);
        function isWriting() {
            return vm.mode.write && !isGamebookPlay();
        }
        function makeChange(...args) {
            if (isWriting()) {
                send(...args);
                return true;
            }
            return (vm.mode.sticky = false);
        }
        const commentForm = ctrl$8(ctrl);
        const glyphForm = ctrl$7(ctrl);
        const tags = ctrl$2(ctrl, () => data.chapter, tagTypes);
        const studyDesc = new DescriptionCtrl(data.description, debounce(t => {
            data.description = t;
            send('descStudy', t);
        }, 500), redraw);
        const chapterDesc = new DescriptionCtrl(data.chapter.description, debounce(t => {
            data.chapter.description = t;
            send('descChapter', { id: vm.chapterId, desc: t });
        }, 500), redraw);
        const serverEval = ctrl$1(ctrl, () => vm.chapterId);
        const topics = ctrl$5(topics => send('setTopics', topics), () => data.topics || [], ctrl.trans, redraw);
        function addChapterId(req) {
            return Object.assign(Object.assign({}, req), { ch: vm.chapterId });
        }
        function isGamebookPlay() {
            return (data.chapter.gamebook &&
                vm.gamebookOverride !== 'analyse' &&
                (vm.gamebookOverride === 'play' || !members.canContribute()));
        }
        if (vm.mode.sticky && !isGamebookPlay())
            ctrl.userJump(data.position.path);
        else if (data.chapter.relay && !ctrl.initialPath)
            ctrl.userJump(data.chapter.relay.path);
        function configureAnalysis() {
            if (ctrl.embed)
                return;
            const canContribute = members.canContribute();
            // unwrite if member lost privileges
            vm.mode.write = vm.mode.write && canContribute;
            lichess.pubsub.emit('chat.writeable', data.features.chat);
            lichess.pubsub.emit('chat.permissions', { local: canContribute });
            lichess.pubsub.emit('palantir.toggle', data.features.chat && !!members.myMember());
            const computer = !isGamebookPlay() && !!(data.chapter.features.computer || data.chapter.practice);
            if (!computer)
                ctrl.getCeval().enabled(false);
            ctrl.getCeval().allowed(computer);
            if (!data.chapter.features.explorer)
                ctrl.explorer.disable();
            ctrl.explorer.allowed(data.chapter.features.explorer);
        }
        configureAnalysis();
        function configurePractice() {
            if (!data.chapter.practice && ctrl.practice)
                ctrl.togglePractice();
            if (data.chapter.practice)
                ctrl.restartPractice();
            if (practice)
                practice.onLoad();
        }
        function onReload(d) {
            const s = d.study;
            const prevPath = ctrl.path;
            const sameChapter = data.chapter.id === s.chapter.id;
            vm.mode.sticky = (vm.mode.sticky && s.features.sticky) || (!data.features.sticky && s.features.sticky);
            if (vm.mode.sticky)
                vm.behind = 0;
            data.position = s.position;
            data.name = s.name;
            data.visibility = s.visibility;
            data.features = s.features;
            data.settings = s.settings;
            data.chapter = s.chapter;
            data.likes = s.likes;
            data.liked = s.liked;
            data.description = s.description;
            chapterDesc.set(data.chapter.description);
            studyDesc.set(data.description);
            document.title = data.name;
            members.dict(s.members);
            chapters.list(s.chapters);
            ctrl.flipped = false;
            const merge = !vm.mode.write && sameChapter;
            ctrl.reloadData(d.analysis, merge);
            vm.gamebookOverride = undefined;
            configureAnalysis();
            vm.loading = false;
            instanciateGamebookPlay();
            if (relay)
                relay.applyChapterRelay(data.chapter, s.chapter.relay);
            let nextPath;
            if (vm.mode.sticky) {
                vm.chapterId = data.position.chapterId;
                nextPath = (vm.justSetChapterId === vm.chapterId && chapters.localPaths[vm.chapterId]) || data.position.path;
            }
            else {
                nextPath = sameChapter
                    ? prevPath
                    : data.chapter.relay
                        ? data.chapter.relay.path
                        : chapters.localPaths[vm.chapterId] || root;
            }
            // path could be gone (because of subtree deletion), go as far as possible
            ctrl.userJump(ctrl.tree.longestValidPath(nextPath));
            vm.justSetChapterId = undefined;
            configurePractice();
            serverEval.reset();
            commentForm.onSetPath(data.chapter.id, ctrl.path, ctrl.node, false);
            redraw();
            ctrl.startCeval();
        }
        const xhrReload = throttle(700, () => {
            vm.loading = true;
            return reload(practice ? 'practice/load' : 'study', data.id, vm.mode.sticky ? undefined : vm.chapterId)
                .then(onReload, lichess.reload);
        });
        const onSetPath = throttle(300, (path) => {
            if (vm.mode.sticky && path !== data.position.path)
                makeChange('setPath', addChapterId({
                    path,
                }));
        });
        if (members.canContribute())
            form.openIfNew();
        const currentNode = () => ctrl.node;
        const share = ctrl$3(data, currentChapter, currentNode, relay, redraw, ctrl.trans);
        const practice = practiceData && practiceCtrl(ctrl, data, practiceData);
        let gamebookPlay;
        function instanciateGamebookPlay() {
            if (!isGamebookPlay())
                return (gamebookPlay = undefined);
            if (gamebookPlay && gamebookPlay.chapterId === vm.chapterId)
                return;
            gamebookPlay = new GamebookPlayCtrl(ctrl, vm.chapterId, ctrl.trans, redraw);
            vm.mode.sticky = false;
            return undefined;
        }
        instanciateGamebookPlay();
        function mutateCgConfig(config) {
            config.drawable.onChange = (shapes) => {
                if (vm.mode.write) {
                    ctrl.tree.setShapes(shapes, ctrl.path);
                    makeChange('shapes', addChapterId({
                        path: ctrl.path,
                        shapes,
                    }));
                }
                gamebookPlay && gamebookPlay.onShapeChange(shapes);
            };
        }
        function wrongChapter(serverData) {
            if (serverData.p.chapterId !== vm.chapterId) {
                // sticky should really be on the same chapter
                if (vm.mode.sticky && serverData.s)
                    xhrReload();
                return true;
            }
            return false;
        }
        function setMemberActive(who) {
            who && members.setActive(who.u);
            vm.updatedAt = Date.now();
        }
        function withPosition(obj) {
            return Object.assign(Object.assign({}, obj), { ch: vm.chapterId, path: ctrl.path });
        }
        const likeToggler = debounce(() => send('like', { liked: data.liked }), 1000);
        function setChapter(id, force) {
            const alreadySet = id === vm.chapterId && !force;
            if (relay === null || relay === void 0 ? void 0 : relay.tourShow.active) {
                relay.tourShow.disable();
                if (alreadySet)
                    redraw();
            }
            if (alreadySet)
                return;
            if (!vm.mode.sticky || !makeChange('setChapter', id)) {
                vm.mode.sticky = false;
                if (!vm.behind)
                    vm.behind = 1;
                vm.chapterId = id;
                xhrReload();
            }
            vm.loading = true;
            vm.nextChapterId = id;
            vm.justSetChapterId = id;
            redraw();
        }
        const [prevChapter, nextChapter] = [-1, +1].map(delta => () => {
            const chs = chapters.list();
            const i = chs.findIndex(ch => ch.id === vm.chapterId);
            return i < 0 ? undefined : chs[i + delta];
        });
        const socketHandlers = {
            path(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (!vm.mode.sticky) {
                    vm.behind++;
                    return redraw();
                }
                if (position.chapterId !== data.position.chapterId || !ctrl.tree.pathExists(position.path)) {
                    return xhrReload();
                }
                data.position.path = position.path;
                if (who && who.s === lichess.sri)
                    return;
                ctrl.userJump(position.path);
                redraw();
            },
            addNode(d) {
                const position = d.p, node = d.n, who = d.w, sticky = d.s;
                setMemberActive(who);
                if (vm.toolTab() == 'multiBoard' || (relay && relay.tourShow.active))
                    multiBoard.addNode(d.p, d.n);
                if (sticky && !vm.mode.sticky)
                    vm.behind++;
                if (wrongChapter(d)) {
                    if (sticky && !vm.mode.sticky)
                        redraw();
                    return;
                }
                if (sticky && who && who.s === lichess.sri) {
                    data.position.path = position.path + node.id;
                    return;
                }
                if (relay)
                    relay.applyChapterRelay(data.chapter, d.relay);
                const newPath = ctrl.tree.addNode(node, position.path);
                if (!newPath)
                    return xhrReload();
                ctrl.tree.addDests(d.d, newPath);
                if (sticky)
                    data.position.path = newPath;
                if ((sticky && vm.mode.sticky) ||
                    (position.path === ctrl.path && position.path === fromNodeList(ctrl.mainline)))
                    ctrl.jump(newPath);
                redraw();
            },
            deleteNode(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                // deleter already has it done
                if (who && who.s === lichess.sri)
                    return;
                if (!ctrl.tree.pathExists(d.p.path))
                    return xhrReload();
                ctrl.tree.deleteNodeAt(position.path);
                if (vm.mode.sticky)
                    ctrl.jump(ctrl.path);
                redraw();
            },
            promote(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                if (who && who.s === lichess.sri)
                    return;
                if (!ctrl.tree.pathExists(d.p.path))
                    return xhrReload();
                ctrl.tree.promoteAt(position.path, d.toMainline);
                if (vm.mode.sticky)
                    ctrl.jump(ctrl.path);
                redraw();
            },
            reload: xhrReload,
            changeChapter(d) {
                setMemberActive(d.w);
                if (!vm.mode.sticky)
                    vm.behind++;
                data.position = d.p;
                if (vm.mode.sticky)
                    xhrReload();
                else
                    redraw();
            },
            updateChapter(d) {
                setMemberActive(d.w);
                xhrReload();
            },
            descChapter(d) {
                setMemberActive(d.w);
                if (d.w && d.w.s === lichess.sri)
                    return;
                if (data.chapter.id === d.chapterId) {
                    data.chapter.description = d.desc;
                    chapterDesc.set(d.desc);
                }
                redraw();
            },
            descStudy(d) {
                setMemberActive(d.w);
                if (d.w && d.w.s === lichess.sri)
                    return;
                data.description = d.desc;
                studyDesc.set(d.desc);
                redraw();
            },
            setTopics(d) {
                setMemberActive(d.w);
                data.topics = d.topics;
                redraw();
            },
            addChapter(d) {
                setMemberActive(d.w);
                if (d.s && !vm.mode.sticky)
                    vm.behind++;
                if (d.s)
                    data.position = d.p;
                else if (d.w && d.w.s === lichess.sri) {
                    vm.mode.write = true;
                    vm.chapterId = d.p.chapterId;
                }
                xhrReload();
            },
            members(d) {
                members.update(d);
                configureAnalysis();
                redraw();
            },
            chapters(d) {
                chapters.list(d);
                if (!currentChapter()) {
                    vm.chapterId = d[0].id;
                    if (!vm.mode.sticky)
                        xhrReload();
                }
                redraw();
            },
            shapes(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (d.p.chapterId !== vm.chapterId)
                    return;
                if (who && who.s === lichess.sri)
                    return;
                ctrl.tree.setShapes(d.s, ctrl.path);
                if (ctrl.path === position.path)
                    ctrl.withCg(cg => cg.setShapes(d.s));
                redraw();
            },
            validationError(d) {
                alert(d.error);
            },
            setComment(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                ctrl.tree.setCommentAt(d.c, position.path);
                redraw();
            },
            setTags(d) {
                setMemberActive(d.w);
                if (d.chapterId !== vm.chapterId)
                    return;
                data.chapter.tags = d.tags;
                redraw();
            },
            deleteComment(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                ctrl.tree.deleteCommentAt(d.id, position.path);
                redraw();
            },
            glyphs(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                ctrl.tree.setGlyphsAt(d.g, position.path);
                redraw();
            },
            clock(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                ctrl.tree.setClockAt(d.c, position.path);
                redraw();
            },
            forceVariation(d) {
                const position = d.p, who = d.w;
                setMemberActive(who);
                if (wrongChapter(d))
                    return;
                ctrl.tree.forceVariationAt(position.path, d.force);
                redraw();
            },
            conceal(d) {
                if (wrongChapter(d))
                    return;
                data.chapter.conceal = d.ply;
                redraw();
            },
            liking(d) {
                data.likes = d.l.likes;
                if (d.w && d.w.s === lichess.sri)
                    data.liked = d.l.me;
                redraw();
            },
            error(msg) {
                alert(msg);
            },
        };
        return {
            data,
            form,
            members,
            chapters,
            notif,
            commentForm,
            glyphForm,
            serverEval,
            share,
            tags,
            studyDesc,
            chapterDesc,
            topics,
            vm,
            relay,
            multiBoard,
            isUpdatedRecently() {
                return Date.now() - vm.updatedAt < 300 * 1000;
            },
            toggleLike() {
                data.liked = !data.liked;
                redraw();
                likeToggler();
            },
            position() {
                return data.position;
            },
            currentChapter,
            isChapterOwner,
            canJumpTo(path) {
                if (gamebookPlay)
                    return gamebookPlay.canJumpTo(path);
                return (data.chapter.conceal === undefined ||
                    isChapterOwner() ||
                    contains(ctrl.path, path) || // can always go back
                    ctrl.tree.lastMainlineNode(path).ply <= data.chapter.conceal);
            },
            onJump() {
                if (gamebookPlay)
                    gamebookPlay.onJump();
                else
                    chapters.localPaths[vm.chapterId] = ctrl.path; // don't remember position on gamebook
                if (practice)
                    practice.onJump();
            },
            withPosition,
            setPath(path, node, playedMyself) {
                onSetPath(path);
                commentForm.onSetPath(vm.chapterId, path, node, playedMyself);
            },
            deleteNode(path) {
                makeChange('deleteNode', addChapterId({
                    path,
                    jumpTo: ctrl.path,
                }));
            },
            promote(path, toMainline) {
                makeChange('promote', addChapterId({
                    toMainline,
                    path,
                }));
            },
            forceVariation(path, force) {
                makeChange('forceVariation', addChapterId({
                    force,
                    path,
                }));
            },
            setChapter,
            toggleSticky() {
                vm.mode.sticky = !vm.mode.sticky && data.features.sticky;
                xhrReload();
            },
            toggleWrite() {
                vm.mode.write = !vm.mode.write && members.canContribute();
                xhrReload();
            },
            isWriting,
            makeChange,
            startTour,
            userJump: ctrl.userJump,
            currentNode,
            practice,
            gamebookPlay: () => gamebookPlay,
            prevChapter,
            nextChapter,
            goToPrevChapter() {
                const chapter = prevChapter();
                if (chapter)
                    setChapter(chapter.id);
            },
            goToNextChapter() {
                const chapter = nextChapter();
                if (chapter)
                    setChapter(chapter.id);
            },
            setGamebookOverride(o) {
                vm.gamebookOverride = o;
                instanciateGamebookPlay();
                configureAnalysis();
                ctrl.userJump(ctrl.path);
                if (!o)
                    xhrReload();
            },
            mutateCgConfig,
            explorerGame(gameId, insert) {
                makeChange('explorerGame', withPosition({ gameId, insert }));
            },
            onPremoveSet() {
                if (gamebookPlay)
                    gamebookPlay.onPremoveSet();
            },
            redraw,
            trans: ctrl.trans,
            socketHandler: (t, d) => {
                const handler = socketHandlers[t];
                if (handler) {
                    handler(d);
                    return true;
                }
                return !!relay && relay.socketHandler(t, d);
            },
        };
    }

    class Autoplay {
        constructor(ctrl) {
            this.ctrl = ctrl;
        }
        move() {
            if (canGoForward(this.ctrl)) {
                next(this.ctrl);
                this.ctrl.redraw();
                return true;
            }
            this.stop();
            this.ctrl.redraw();
            return false;
        }
        evalToCp(node) {
            if (!node.eval)
                return node.ply % 2 ? 990 : -990; // game over
            if (node.eval.mate)
                return node.eval.mate > 0 ? 990 : -990;
            return node.eval.cp;
        }
        nextDelay() {
            if (typeof this.delay === 'string' && !this.ctrl.onMainline)
                return 1500;
            else if (this.delay === 'realtime') {
                if (this.ctrl.node.ply < 2)
                    return 1000;
                const centis = this.ctrl.data.game.moveCentis;
                if (!centis)
                    return 1500;
                const time = centis[this.ctrl.node.ply - this.ctrl.tree.root.ply];
                // estimate 130ms of lag to improve playback.
                return time * 10 + 130 || 2000;
            }
            else if (this.delay === 'cpl') {
                const slowDown = 30;
                if (this.ctrl.node.ply >= this.ctrl.mainline.length - 1)
                    return 0;
                const currPlyCp = this.evalToCp(this.ctrl.node);
                const nextPlyCp = this.evalToCp(this.ctrl.node.children[0]);
                return Math.max(500, Math.min(10000, Math.abs(currPlyCp - nextPlyCp) * slowDown));
            }
            else
                return this.delay;
        }
        schedule() {
            this.timeout = setTimeout(() => {
                if (this.move())
                    this.schedule();
            }, this.nextDelay());
        }
        start(delay) {
            this.delay = delay;
            this.stop();
            this.schedule();
        }
        stop() {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }
        }
        toggle(delay) {
            if (this.active(delay))
                this.stop();
            else {
                if (!this.active() && !this.move())
                    this.ctrl.jump('');
                this.start(delay);
            }
        }
        active(delay) {
            return (!delay || delay === this.delay) && !!this.timeout;
        }
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

    function boolSetting(o, trans, redraw) {
        const fullId = 'abset-' + o.id;
        return h('div.setting.' + fullId, o.title
            ? {
                attrs: { title: trans.noarg(o.title) },
            }
            : {}, [
            h('label', { attrs: { for: fullId } }, trans.noarg(o.name)),
            h('div.switch', [
                h('input#' + fullId + '.cmn-toggle', {
                    attrs: {
                        type: 'checkbox',
                        checked: o.checked,
                    },
                    hook: bind$1('change', e => o.change(e.target.checked), redraw),
                }),
                h('label', { attrs: { for: fullId } }),
            ]),
        ]);
    }

    function game(data, color, embed) {
        const id = data.game ? data.game.id : data;
        return (embed ? '/embed/' : '/') + id + (color ? '/' + color : '');
    }
    function cont(data, mode) {
        return game(data) + '/continue/' + mode;
    }

    function plyPrefix(node) {
        return `${Math.floor((node.ply + 1) / 2)}${node.ply % 2 === 1 ? '. ' : '... '}`;
    }
    function renderNodesTxt(node, forcePly) {
        if (node.children.length === 0)
            return '';
        let s = '';
        const first = node.children[0];
        if (forcePly || first.ply % 2 === 1)
            s += plyPrefix(first);
        s += fixCrazySan(first.san);
        for (let i = 1; i < node.children.length; i++) {
            const child = node.children[i];
            s += ` (${plyPrefix(child)}${fixCrazySan(child.san)}`;
            const variation = renderNodesTxt(child, false);
            if (variation)
                s += ' ' + variation;
            s += ')';
        }
        const mainline = renderNodesTxt(first, node.children.length > 1);
        if (mainline)
            s += ' ' + mainline;
        return s;
    }
    function renderFullTxt(ctrl) {
        const g = ctrl.data.game;
        let txt = renderNodesTxt(ctrl.tree.root, true);
        const tags = [];
        if (g.variant.key !== 'standard')
            tags.push(['Variant', g.variant.name]);
        if (g.initialFen && g.initialFen !== initialFen)
            tags.push(['FEN', g.initialFen]);
        if (tags.length)
            txt =
                tags
                    .map(function (t) {
                    return '[' + t[0] + ' "' + t[1] + '"]';
                })
                    .join('\n') +
                    '\n\n' +
                    txt;
        return txt;
    }
    function renderNodesHtml(nodes) {
        if (!nodes[0])
            return [];
        if (!nodes[0].san)
            nodes = nodes.slice(1);
        if (!nodes[0])
            return [];
        const tags = [];
        if (nodes[0].ply % 2 === 0)
            tags.push(h('index', Math.floor((nodes[0].ply + 1) / 2) + '...'));
        nodes.forEach(node => {
            if (node.ply === 0)
                return;
            if (node.ply % 2 === 1)
                tags.push(h('index', (node.ply + 1) / 2 + '.'));
            tags.push(h('san', fixCrazySan(node.san)));
        });
        return tags;
    }

    const baseSpeeds = [
        {
            name: 'fast',
            delay: 1000,
        },
        {
            name: 'slow',
            delay: 5000,
        },
    ];
    const realtimeSpeed = {
        name: 'realtimeReplay',
        delay: 'realtime',
    };
    const cplSpeed = {
        name: 'byCPL',
        delay: 'cpl',
    };
    function deleteButton(ctrl, userId) {
        const g = ctrl.data.game;
        if (g.source === 'import' && g.importedBy && g.importedBy === userId)
            return h('form.delete', {
                attrs: {
                    method: 'post',
                    action: '/' + g.id + '/delete',
                },
                hook: bind$1('submit', _ => confirm(ctrl.trans.noarg('deleteThisImportedGame'))),
            }, [
                h('button.button.text.thin', {
                    attrs: {
                        type: 'submit',
                        'data-icon': 'q',
                    },
                }, ctrl.trans.noarg('delete')),
            ]);
        return;
    }
    function autoplayButtons(ctrl) {
        const d = ctrl.data;
        const speeds = [
            ...baseSpeeds,
            ...(d.game.speed !== 'correspondence' && !isEmpty(d.game.moveCentis) ? [realtimeSpeed] : []),
            ...(d.analysis ? [cplSpeed] : []),
        ];
        return h('div.autoplay', speeds.map(speed => {
            return h('a.button.button-empty', {
                hook: bind$1('click', () => ctrl.togglePlay(speed.delay), ctrl.redraw),
            }, ctrl.trans.noarg(speed.name));
        }));
    }
    function rangeConfig(read, write) {
        return {
            insert: vnode => {
                const el = vnode.elm;
                el.value = '' + read();
                el.addEventListener('input', _ => write(parseInt(el.value)));
                el.addEventListener('mouseout', _ => el.blur());
            },
        };
    }
    function formatHashSize(v) {
        if (v < 1000)
            return v + 'MB';
        else
            return Math.round(v / 1024) + 'GB';
    }
    function hiddenInput(name, value) {
        return h('input', {
            attrs: { type: 'hidden', name, value },
        });
    }
    function studyButton(ctrl) {
        if (ctrl.study && ctrl.embed && !ctrl.ongoing)
            return h('a.button.button-empty', {
                attrs: {
                    href: '/study/' + ctrl.study.data.id + '#' + ctrl.study.currentChapter().id,
                    target: '_blank',
                    rel: 'noopener',
                    'data-icon': '4',
                },
            }, ctrl.trans.noarg('openStudy'));
        if (ctrl.study || ctrl.ongoing || ctrl.embed)
            return;
        return h('form', {
            attrs: {
                method: 'post',
                action: '/study/as',
            },
            hook: bind$1('submit', e => {
                const pgnInput = e.target.querySelector('input[name=pgn]');
                if (pgnInput)
                    pgnInput.value = renderFullTxt(ctrl);
            }),
        }, [
            !ctrl.synthetic ? hiddenInput('gameId', ctrl.data.game.id) : hiddenInput('pgn', ''),
            hiddenInput('orientation', ctrl.chessground.state.orientation),
            hiddenInput('variant', ctrl.data.game.variant.key),
            hiddenInput('fen', ctrl.tree.root.fen),
            h('button.button.button-empty', {
                attrs: {
                    type: 'submit',
                    'data-icon': '4',
                },
            }, ctrl.trans.noarg('toStudy')),
        ]);
    }
    class ActionMenuCtrl {
        constructor() {
            this.open = false;
            this.toggle = () => {
                this.open = !this.open;
            };
        }
    }
    function view$3(ctrl) {
        const d = ctrl.data, noarg = ctrl.trans.noarg, canContinue = !ctrl.ongoing && !ctrl.embed && d.game.variant.key === 'standard', ceval = ctrl.getCeval(), mandatoryCeval = ctrl.mandatoryCeval();
        const tools = [
            h('div.action-menu__tools', [
                h('a.button.button-empty', {
                    hook: bind$1('click', ctrl.flip),
                    attrs: dataIcon('B'),
                }, noarg('flipBoard')),
                ctrl.ongoing
                    ? null
                    : h('a.button.button-empty', {
                        attrs: Object.assign({ href: d.userAnalysis ? '/editor?fen=' + ctrl.node.fen : '/' + d.game.id + '/edit?fen=' + ctrl.node.fen, 'data-icon': 'm' }, (ctrl.embed
                            ? {
                                target: '_blank',
                                rel: 'noopener nofollow',
                            }
                            : {
                                rel: 'nofollow',
                            })),
                    }, noarg('boardEditor')),
                canContinue
                    ? h('a.button.button-empty', {
                        hook: bind$1('click', _ => modal($('.continue-with.g_' + d.game.id))),
                        attrs: dataIcon('U'),
                    }, noarg('continueFromHere'))
                    : null,
                studyButton(ctrl),
            ]),
        ];
        const cevalConfig = ceval && ceval.possible && ceval.allowed()
            ? [h('h2', noarg('computerAnalysis'))]
                .concat([
                ctrlBoolSetting({
                    name: 'enable',
                    title: (mandatoryCeval ? 'Required by practice mode' : 'Stockfish') + ' (Hotkey: z)',
                    id: 'all',
                    checked: ctrl.showComputer(),
                    disabled: mandatoryCeval,
                    change: ctrl.toggleComputer,
                }, ctrl),
            ])
                .concat(ctrl.showComputer()
                ? [
                    ctrlBoolSetting({
                        name: 'bestMoveArrow',
                        title: 'Hotkey: a',
                        id: 'shapes',
                        checked: ctrl.showAutoShapes(),
                        change: ctrl.toggleAutoShapes,
                    }, ctrl),
                    ctrlBoolSetting({
                        name: 'evaluationGauge',
                        id: 'gauge',
                        checked: ctrl.showGauge(),
                        change: ctrl.toggleGauge,
                    }, ctrl),
                    ctrlBoolSetting({
                        name: 'Annotations on board',
                        title: 'Display analysis symbols on the board',
                        id: 'move-annotation',
                        checked: ctrl.showMoveAnnotation(),
                        change: ctrl.toggleMoveAnnotation,
                    }, ctrl),
                    ctrlBoolSetting({
                        name: 'infiniteAnalysis',
                        title: 'removesTheDepthLimit',
                        id: 'infinite',
                        checked: ceval.infinite(),
                        change: ctrl.cevalSetInfinite,
                    }, ctrl),
                    ceval.supportsNnue
                        ? ctrlBoolSetting({
                            name: 'Use NNUE',
                            title: 'Downloads 10 MB neural network evaluation file (page reload required after change)',
                            id: 'enable-nnue',
                            checked: ceval.enableNnue(),
                            change: ceval.enableNnue,
                        }, ctrl)
                        : undefined,
                    (id => {
                        const max = 5;
                        return h('div.setting', [
                            h('label', { attrs: { for: id } }, noarg('multipleLines')),
                            h('input#' + id, {
                                attrs: {
                                    type: 'range',
                                    min: 0,
                                    max,
                                    step: 1,
                                },
                                hook: rangeConfig(() => parseInt(ceval.multiPv()), ctrl.cevalSetMultiPv),
                            }),
                            h('div.range_value', ceval.multiPv() + ' / ' + max),
                        ]);
                    })('analyse-multipv'),
                    ceval.threads
                        ? (id => {
                            return h('div.setting', [
                                h('label', { attrs: { for: id } }, noarg('cpus')),
                                h('input#' + id, {
                                    attrs: {
                                        type: 'range',
                                        min: 1,
                                        max: ceval.maxThreads,
                                        step: 1,
                                    },
                                    hook: rangeConfig(() => parseInt(ceval.threads()), ctrl.cevalSetThreads),
                                }),
                                h('div.range_value', `${ceval.threads()} / ${ceval.maxThreads}`),
                            ]);
                        })('analyse-threads')
                        : undefined,
                    ceval.hashSize
                        ? (id => h('div.setting', [
                            h('label', { attrs: { for: id } }, noarg('memory')),
                            h('input#' + id, {
                                attrs: {
                                    type: 'range',
                                    min: 4,
                                    max: Math.floor(Math.log2(ceval.maxHashSize)),
                                    step: 1,
                                },
                                hook: rangeConfig(() => Math.floor(Math.log2(parseInt(ceval.hashSize()))), v => ctrl.cevalSetHashSize(Math.pow(2, v))),
                            }),
                            h('div.range_value', formatHashSize(parseInt(ceval.hashSize()))),
                        ]))('analyse-memory')
                        : undefined,
                ]
                : [])
            : [];
        const notationConfig = [
            ctrlBoolSetting({
                name: noarg('inlineNotation'),
                title: 'Shift+I',
                id: 'inline',
                checked: ctrl.treeView.inline(),
                change(v) {
                    ctrl.treeView.set(v);
                    ctrl.actionMenu.toggle();
                },
            }, ctrl),
        ];
        return h('div.action-menu', tools
            .concat(notationConfig)
            .concat(cevalConfig)
            .concat(ctrl.mainline.length > 4 ? [h('h2', noarg('replayMode')), autoplayButtons(ctrl)] : [])
            .concat([
            deleteButton(ctrl, ctrl.opts.userId),
            canContinue
                ? h('div.continue-with.none.g_' + d.game.id, [
                    h('a.button', {
                        attrs: {
                            href: d.userAnalysis
                                ? '/?fen=' + ctrl.encodeNodeFen() + '#ai'
                                : cont(d, 'ai') + '?fen=' + ctrl.node.fen,
                            rel: 'nofollow',
                        },
                    }, noarg('playWithTheMachine')),
                    h('a.button', {
                        attrs: {
                            href: d.userAnalysis
                                ? '/?fen=' + ctrl.encodeNodeFen() + '#friend'
                                : cont(d, 'friend') + '?fen=' + ctrl.node.fen,
                            rel: 'nofollow',
                        },
                    }, noarg('playWithAFriend')),
                ])
                : null,
        ]));
    }
    function ctrlBoolSetting(o, ctrl) {
        return boolSetting(o, ctrl.trans, ctrl.redraw);
    }

    function emptyMove(conceal) {
        const c = {};
        if (conceal)
            c[conceal] = true;
        return h('move.empty', {
            class: c,
        }, '...');
    }
    function renderChildrenOf$1(ctx, node, opts) {
        const cs = node.children, main = cs[0];
        if (!main)
            return;
        const conceal = opts.noConceal ? null : opts.conceal || ctx.concealOf(true)(opts.parentPath + main.id, main);
        if (conceal === 'hide')
            return;
        if (opts.isMainline) {
            const isWhite = main.ply % 2 === 1, commentTags = renderMainlineCommentsOf(ctx, main, conceal, true).filter(nonEmpty);
            if (!cs[1] && isEmpty(commentTags) && !main.forceVariation)
                return (isWhite ? [renderIndex(main.ply, false)] : []).concat(renderMoveAndChildrenOf$1(ctx, main, {
                    parentPath: opts.parentPath,
                    isMainline: true,
                    conceal,
                }) || []);
            const mainChildren = main.forceVariation
                ? undefined
                : renderChildrenOf$1(ctx, main, {
                    parentPath: opts.parentPath + main.id,
                    isMainline: true,
                    conceal,
                });
            const passOpts = {
                parentPath: opts.parentPath,
                isMainline: !main.forceVariation,
                conceal,
            };
            return (isWhite ? [renderIndex(main.ply, false)] : [])
                .concat(main.forceVariation ? [] : [renderMoveOf$1(ctx, main, passOpts), isWhite ? emptyMove(passOpts.conceal) : null])
                .concat([
                h('interrupt', commentTags.concat(renderLines$1(ctx, main.forceVariation ? cs : cs.slice(1), {
                    parentPath: opts.parentPath,
                    isMainline: passOpts.isMainline,
                    conceal,
                    noConceal: !conceal,
                }))),
            ])
                .concat(isWhite && mainChildren ? [renderIndex(main.ply, false), emptyMove(passOpts.conceal)] : [])
                .concat(mainChildren || []);
        }
        if (!cs[1])
            return renderMoveAndChildrenOf$1(ctx, main, opts);
        return renderInlined$1(ctx, cs, opts) || [renderLines$1(ctx, cs, opts)];
    }
    function renderInlined$1(ctx, nodes, opts) {
        // only 2 branches
        if (!nodes[1] || nodes[2])
            return;
        // only if second branch has no sub-branches
        if (hasBranching(nodes[1], 6))
            return;
        return renderMoveAndChildrenOf$1(ctx, nodes[0], {
            parentPath: opts.parentPath,
            isMainline: false,
            noConceal: opts.noConceal,
            inline: nodes[1],
        });
    }
    function renderLines$1(ctx, nodes, opts) {
        return h('lines', {
            class: { single: !nodes[1] },
        }, nodes.map(n => {
            return (retroLine(ctx, n) ||
                h('line', renderMoveAndChildrenOf$1(ctx, n, {
                    parentPath: opts.parentPath,
                    isMainline: false,
                    withIndex: true,
                    noConceal: opts.noConceal,
                    truncate: n.comp && !contains(ctx.ctrl.path, opts.parentPath + n.id) ? 3 : undefined,
                })));
        }));
    }
    function renderMoveOf$1(ctx, node, opts) {
        return opts.isMainline ? renderMainlineMoveOf(ctx, node, opts) : renderVariationMoveOf(ctx, node, opts);
    }
    function renderMainlineMoveOf(ctx, node, opts) {
        const path = opts.parentPath + node.id, classes = nodeClasses(ctx, node, path);
        if (opts.conceal)
            classes[opts.conceal] = true;
        return h('move', {
            attrs: { p: path },
            class: classes,
        }, renderMove(ctx, node));
    }
    function renderVariationMoveOf(ctx, node, opts) {
        const withIndex = opts.withIndex || node.ply % 2 === 1, path = opts.parentPath + node.id, content = [withIndex ? renderIndex(node.ply, true) : null, fixCrazySan(node.san)], classes = nodeClasses(ctx, node, path);
        if (opts.conceal)
            classes[opts.conceal] = true;
        if (node.glyphs)
            node.glyphs.forEach(g => content.push(renderGlyph(g)));
        return h('move', {
            attrs: { p: path },
            class: classes,
        }, content);
    }
    function renderMoveAndChildrenOf$1(ctx, node, opts) {
        const path = opts.parentPath + node.id;
        if (opts.truncate === 0)
            return [
                h('move', {
                    attrs: { p: path },
                }, [h('index', '[...]')]),
            ];
        return [renderMoveOf$1(ctx, node, opts)]
            .concat(renderInlineCommentsOf(ctx, node))
            .concat(opts.inline ? renderInline$1(ctx, opts.inline, opts) : null)
            .concat(renderChildrenOf$1(ctx, node, {
            parentPath: path,
            isMainline: opts.isMainline,
            noConceal: opts.noConceal,
            truncate: opts.truncate ? opts.truncate - 1 : undefined,
        }) || []);
    }
    function renderInline$1(ctx, node, opts) {
        return h('inline', renderMoveAndChildrenOf$1(ctx, node, {
            withIndex: true,
            parentPath: opts.parentPath,
            isMainline: false,
            noConceal: opts.noConceal,
            truncate: opts.truncate,
        }));
    }
    function renderMainlineCommentsOf(ctx, node, conceal, withColor) {
        if (!ctx.ctrl.showComments || isEmpty(node.comments))
            return [];
        const colorClass = withColor ? (node.ply % 2 === 0 ? '.black ' : '.white ') : '';
        return node.comments.map(comment => {
            if (comment.by === 'lichess' && !ctx.showComputer)
                return;
            let sel = 'comment' + colorClass;
            if (comment.text.startsWith('Inaccuracy.'))
                sel += '.inaccuracy';
            else if (comment.text.startsWith('Mistake.'))
                sel += '.mistake';
            else if (comment.text.startsWith('Blunder.'))
                sel += '.blunder';
            if (conceal)
                sel += '.' + conceal;
            const by = node.comments[1] ? `<span class="by">${authorText(comment.by)}</span>` : '', truncated = truncateComment(comment.text, 400, ctx);
            return h(sel, {
                hook: innerHTML(truncated, text => by + enrichText(text)),
            });
        });
    }
    const emptyConcealOf = function () {
        return function () {
            return null;
        };
    };
    function column (ctrl, concealOf) {
        const root = ctrl.tree.root;
        const ctx = {
            ctrl,
            truncateComments: !ctrl.embed,
            concealOf: concealOf || emptyConcealOf,
            showComputer: ctrl.showComputer() && !ctrl.retro,
            showGlyphs: !!ctrl.study || ctrl.showComputer(),
            showEval: ctrl.showComputer(),
            currentPath: findCurrentPath(ctrl),
        };
        const commentTags = renderMainlineCommentsOf(ctx, root, false, false);
        return h('div.tview2.tview2-column', {
            hook: mainHook(ctrl),
        }, [
            isEmpty(commentTags) ? null : h('interrupt', commentTags),
            root.ply & 1 ? renderIndex(root.ply, false) : null,
            root.ply & 1 ? emptyMove() : null,
        ].concat(renderChildrenOf$1(ctx, root, {
            parentPath: '',
            isMainline: true,
        }) || []));
    }

    function selector(data) {
        return h('select.selector', {
            hook: bind$1('change', e => {
                location.href = '/practice/' + e.target.value;
            }),
        }, [
            h('option', {
                attrs: { disabled: true, selected: true },
            }, 'Practice list'),
            ...data.structure.map(section => h('optgroup', {
                attrs: { label: section.name },
            }, section.studies.map(study => option(section.id + '/' + study.slug + '/' + study.id, '', study.name)))),
        ]);
    }
    function renderGoal(practice, inMoves) {
        const goal = practice.goal();
        switch (goal.result) {
            case 'mate':
                return 'Checkmate the opponent';
            case 'mateIn':
                return 'Checkmate the opponent in ' + plural('move', inMoves);
            case 'drawIn':
                return 'Hold the draw for ' + plural('more move', inMoves);
            case 'equalIn':
                return 'Equalize in ' + plural('move', inMoves);
            case 'evalIn':
                if (practice.isWhite() === goal.cp >= 0)
                    return 'Get a winning position in ' + plural('move', inMoves);
                return 'Defend for ' + plural('move', inMoves);
            case 'promotion':
                return 'Safely promote your pawn';
            default:
                return undefined;
        }
    }
    function underboard$1(ctrl) {
        if (ctrl.vm.loading)
            return [h('div.feedback', spinner())];
        const p = ctrl.practice, gb = ctrl.gamebookPlay(), pinned = ctrl.data.chapter.description;
        if (gb)
            return pinned ? [h('div.feedback.ongoing', [h('div.comment', { hook: richHTML(pinned) })])] : [];
        else if (!ctrl.data.chapter.practice)
            return [view$5(ctrl, true)];
        switch (p.success()) {
            case true:
                return [
                    h('a.feedback.win', ctrl.nextChapter()
                        ? {
                            hook: bind$1('click', ctrl.goToNextChapter),
                        }
                        : {
                            attrs: { href: '/practice' },
                        }, [h('span', 'Success!'), ctrl.nextChapter() ? 'Go to next exercise' : 'Back to practice menu']),
                ];
            case false:
                return [
                    h('a.feedback.fail', {
                        hook: bind$1('click', p.reset, ctrl.redraw),
                    }, [h('span', [renderGoal(p, p.goal().moves)]), h('strong', 'Click to retry')]),
                ];
            default:
                return [
                    h('div.feedback.ongoing', [
                        h('div.goal', [renderGoal(p, p.goal().moves - p.nbMoves())]),
                        pinned ? h('div.comment', { hook: richHTML(pinned) }) : null,
                    ]),
                    boolSetting({
                        name: 'Load next exercise immediately',
                        id: 'autoNext',
                        checked: p.autoNext(),
                        change: p.autoNext,
                    }, ctrl.trans, ctrl.redraw),
                ];
        }
    }
    function side$1(ctrl) {
        const current = ctrl.currentChapter(), data = ctrl.practice.data;
        return h('div.practice__side', [
            h('div.practice__side__title', [
                h('i.' + data.study.id),
                h('div.text', [h('h1', data.study.name), h('em', data.study.desc)]),
            ]),
            h('div.practice__side__chapters', {
                hook: bind$1('click', e => {
                    e.preventDefault();
                    const target = e.target, id = target.parentNode.getAttribute('data-id') || target.getAttribute('data-id');
                    if (id)
                        ctrl.setChapter(id, true);
                    return false;
                }),
            }, ctrl.chapters
                .list()
                .map(function (chapter) {
                const loading = ctrl.vm.loading && chapter.id === ctrl.vm.nextChapterId, active = !ctrl.vm.loading && current && current.id === chapter.id, completion = data.completion[chapter.id] >= 0 ? 'done' : 'ongoing';
                return [
                    h('a.ps__chapter', {
                        key: chapter.id,
                        attrs: {
                            href: data.url + '/' + chapter.id,
                            'data-id': chapter.id,
                        },
                        class: { active, loading },
                    }, [
                        h('span.status.' + completion, {
                            attrs: {
                                'data-icon': (loading || active) && completion === 'ongoing' ? 'G' : 'E',
                            },
                        }),
                        h('h3', chapter.name),
                    ]),
                ];
            })
                .reduce((a, b) => a.concat(b), [])),
            h('div.finally', [
                h('a.back', {
                    attrs: {
                        'data-icon': 'I',
                        href: '/practice',
                        title: 'More practice',
                    },
                }),
                thunk('select.selector', selector, [data]),
            ]),
        ]);
    }

    function playButtons(root) {
        const study = root.study, ctrl = study.gamebookPlay();
        if (!ctrl)
            return;
        const state = ctrl.state, fb = state.feedback, myTurn = fb === 'play';
        return h('div.gamebook-buttons', [
            root.path
                ? h('a.fbt.text.back', {
                    attrs: dataIcon('I'),
                    hook: bind$1('click', () => root.userJump(''), ctrl.redraw),
                }, 'Back')
                : null,
            myTurn
                ? h('a.fbt.text.solution', {
                    attrs: dataIcon('G'),
                    hook: bind$1('click', ctrl.solution, ctrl.redraw),
                }, 'View the solution')
                : undefined,
            overrideButton(study),
        ]);
    }
    function overrideButton(study) {
        if (study.data.chapter.gamebook) {
            const o = study.vm.gamebookOverride;
            if (study.members.canContribute())
                return h('a.fbt.text.preview', {
                    class: { active: o === 'play' },
                    attrs: dataIcon('v'),
                    hook: bind$1('click', () => {
                        study.setGamebookOverride(o === 'play' ? undefined : 'play');
                    }, study.redraw),
                }, 'Preview');
            else {
                const isAnalyse = o === 'analyse', ctrl = study.gamebookPlay();
                if (isAnalyse || (ctrl && ctrl.state.feedback === 'end'))
                    return h('a.fbt.text.preview', {
                        class: { active: isAnalyse },
                        attrs: dataIcon('A'),
                        hook: bind$1('click', () => {
                            study.setGamebookOverride(isAnalyse ? undefined : 'analyse');
                        }, study.redraw),
                    }, 'Analyse');
            }
        }
        return undefined;
    }

    function relayTour (ctrl) {
        const study = ctrl.study;
        const relay = study === null || study === void 0 ? void 0 : study.relay;
        if (study && (relay === null || relay === void 0 ? void 0 : relay.tourShow.active)) {
            const round = relay === null || relay === void 0 ? void 0 : relay.currentRound();
            return h('div.relay-tour', [
                h('div.relay-tour__text', [
                    h('h1', relay.data.tour.name),
                    h('div.relay-tour__round', [
                        h('strong', round.name),
                        ' ',
                        round.ongoing
                            ? ctrl.trans.noarg('playingRightNow')
                            : round.startsAt
                                ? h('time.timeago', {
                                    hook: {
                                        insert(vnode) {
                                            vnode.elm.setAttribute('datetime', '' + round.startsAt);
                                        },
                                    },
                                }, lichess.timeago(round.startsAt))
                                : null,
                    ]),
                    relay.data.tour.markup
                        ? h('div', {
                            hook: innerHTML(relay.data.tour.markup, () => relay.data.tour.markup),
                        })
                        : h('div', relay.data.tour.description),
                ]),
                view$4(study.multiBoard, study),
            ]);
        }
        return undefined;
    }
    function rounds(ctrl) {
        const canContribute = ctrl.members.canContribute();
        const relay = ctrl.relay;
        return h('div.study__relay__rounds', relay.data.rounds
            .map(round => h('div', {
            key: round.id,
            class: { active: ctrl.data.id == round.id },
        }, [
            h('a.link', {
                attrs: { href: relay.roundPath(round) },
            }, round.name),
            round.ongoing
                ? h('ongoing', { attrs: Object.assign(Object.assign({}, dataIcon('J')), { title: 'Ongoing' }) })
                : round.finished
                    ? h('finished', { attrs: Object.assign(Object.assign({}, dataIcon('E')), { title: 'Finished' }) })
                    : null,
            canContribute
                ? h('a.act', {
                    attrs: Object.assign(Object.assign({}, dataIcon('%')), { href: `/broadcast/round/${round.id}/edit` }),
                })
                : null,
        ]))
            .concat(canContribute
            ? [
                h('div.add', h('a.text', {
                    attrs: {
                        href: `/broadcast/${relay.data.tour.id}/new`,
                        'data-icon': 'O',
                    },
                }, ctrl.trans.noarg('addRound'))),
            ]
            : []));
    }

    function toolButton(opts) {
        return h('span.' + opts.tab, {
            attrs: { title: opts.hint },
            class: { active: opts.tab === opts.ctrl.vm.toolTab() },
            hook: bind$1('mousedown', () => {
                if (opts.onClick)
                    opts.onClick();
                opts.ctrl.vm.toolTab(opts.tab);
            }, opts.ctrl.redraw),
        }, [opts.count ? h('count.data-count', { attrs: { 'data-count': opts.count } }) : null, opts.icon]);
    }
    function buttons(root) {
        const ctrl = root.study, canContribute = ctrl.members.canContribute(), showSticky = ctrl.data.features.sticky && (canContribute || (ctrl.vm.behind && ctrl.isUpdatedRecently())), noarg = root.trans.noarg;
        return h('div.study__buttons', [
            h('div.left-buttons.tabs-horiz', [
                // distinct classes (sync, write) allow snabbdom to differentiate buttons
                showSticky
                    ? h('a.mode.sync', {
                        attrs: { title: noarg('allSyncMembersRemainOnTheSamePosition') },
                        class: { on: ctrl.vm.mode.sticky },
                        hook: bind$1('click', ctrl.toggleSticky),
                    }, [ctrl.vm.behind ? h('span.behind', '' + ctrl.vm.behind) : h('i.is'), 'SYNC'])
                    : null,
                ctrl.members.canContribute()
                    ? h('a.mode.write', {
                        attrs: { title: noarg('shareChanges') },
                        class: { on: ctrl.vm.mode.write },
                        hook: bind$1('click', ctrl.toggleWrite),
                    }, [h('i.is'), 'REC'])
                    : null,
                toolButton({
                    ctrl,
                    tab: 'tags',
                    hint: noarg('pgnTags'),
                    icon: iconTag('o'),
                }),
                toolButton({
                    ctrl,
                    tab: 'comments',
                    hint: noarg('commentThisPosition'),
                    icon: iconTag('c'),
                    onClick() {
                        ctrl.commentForm.start(ctrl.vm.chapterId, root.path, root.node);
                    },
                    count: (root.node.comments || []).length,
                }),
                canContribute
                    ? toolButton({
                        ctrl,
                        tab: 'glyphs',
                        hint: noarg('annotateWithGlyphs'),
                        icon: h('i.glyph-icon'),
                        count: (root.node.glyphs || []).length,
                    })
                    : null,
                toolButton({
                    ctrl,
                    tab: 'serverEval',
                    hint: noarg('computerAnalysis'),
                    icon: iconTag(''),
                    count: root.data.analysis && '✓',
                }),
                toolButton({
                    ctrl,
                    tab: 'multiBoard',
                    hint: 'Multiboard',
                    icon: iconTag(''),
                }),
                toolButton({
                    ctrl,
                    tab: 'share',
                    hint: noarg('shareAndExport'),
                    icon: iconTag('$'),
                }),
                !ctrl.relay
                    ? h('span.help', {
                        attrs: { title: 'Need help? Get the tour!', 'data-icon': '' },
                        hook: bind$1('click', ctrl.startTour),
                    })
                    : null,
            ]),
            h('div.right', [overrideButton(ctrl)]),
        ]);
    }
    function metadata(ctrl) {
        var _a;
        const d = ctrl.data, credit = (_a = ctrl.relay) === null || _a === void 0 ? void 0 : _a.data.tour.credit, title = `${d.name}: ${ctrl.currentChapter().name}`;
        return h('div.study__metadata', [
            h('h2', [
                h('span.name', { attrs: { title } }, [
                    title,
                    credit ? h('span.credit', { hook: richHTML(credit, false) }) : undefined,
                ]),
                h('span.liking.text', {
                    class: { liked: d.liked },
                    attrs: {
                        'data-icon': d.liked ? '' : '',
                        title: ctrl.trans.noarg('like'),
                    },
                    hook: bind$1('click', ctrl.toggleLike),
                }, '' + d.likes),
            ]),
            view$a(ctrl),
            view$7(ctrl),
        ]);
    }
    function side(ctrl) {
        var _a;
        const activeTab = ctrl.vm.tab(), tourShow = (_a = ctrl.relay) === null || _a === void 0 ? void 0 : _a.tourShow;
        const makeTab = (key, name) => h('span.' + key, {
            class: { active: !(tourShow === null || tourShow === void 0 ? void 0 : tourShow.active) && activeTab === key },
            hook: bind$1('mousedown', () => {
                tourShow === null || tourShow === void 0 ? void 0 : tourShow.disable();
                ctrl.vm.tab(key);
            }, ctrl.redraw),
        }, name);
        const tourTab = tourShow &&
            h('span.relay-tour.text', {
                class: { active: tourShow.active },
                hook: bind$1('mousedown', () => {
                    tourShow.active = true;
                }, ctrl.redraw),
                attrs: {
                    'data-icon': '',
                },
            }, 'Broadcast');
        const tabs = h('div.tabs-horiz', [
            tourTab,
            makeTab('chapters', ctrl.trans.plural(ctrl.relay ? 'nbGames' : 'nbChapters', ctrl.chapters.size())),
            !tourTab || ctrl.members.canContribute() || ctrl.data.admin
                ? makeTab('members', ctrl.trans.plural('nbMembers', ctrl.members.size()))
                : null,
            ctrl.members.isOwner()
                ? h('span.more', {
                    hook: bind$1('click', () => ctrl.form.open(!ctrl.form.open()), ctrl.redraw),
                }, [iconTag('[')])
                : null,
        ]);
        const content = (tourShow === null || tourShow === void 0 ? void 0 : tourShow.active) ? rounds(ctrl) : (activeTab === 'members' ? view$h : view$e)(ctrl);
        return h('div.study__side', [tabs, content]);
    }
    function contextMenu$1(ctrl, path, node) {
        return ctrl.vm.mode.write
            ? [
                h('a', {
                    attrs: dataIcon('c'),
                    hook: bind$1('click', () => {
                        ctrl.vm.toolTab('comments');
                        ctrl.commentForm.start(ctrl.currentChapter().id, path, node);
                    }),
                }, ctrl.trans.noarg('commentThisMove')),
                h('a.glyph-icon', {
                    hook: bind$1('click', () => {
                        ctrl.vm.toolTab('glyphs');
                        ctrl.userJump(path);
                    }),
                }, ctrl.trans.noarg('annotateWithGlyphs')),
            ]
            : [];
    }
    function overboard(ctrl) {
        if (ctrl.chapters.newForm.vm.open)
            return view$g(ctrl.chapters.newForm);
        if (ctrl.chapters.editForm.current())
            return view$f(ctrl.chapters.editForm);
        if (ctrl.members.inviteForm.open())
            return view$i(ctrl.members.inviteForm);
        if (ctrl.topics.open())
            return formView(ctrl.topics, ctrl.members.myId);
        if (ctrl.form.open())
            return view$b(ctrl.form);
        return undefined;
    }
    function underboard(ctrl) {
        if (ctrl.embed)
            return [];
        if (ctrl.studyPractice)
            return underboard$1(ctrl.study);
        const study = ctrl.study, toolTab = study.vm.toolTab();
        if (study.gamebookPlay())
            return [playButtons(ctrl), view$5(study, true), view$5(study, false), metadata(study)];
        let panel;
        switch (toolTab) {
            case 'tags':
                panel = metadata(study);
                break;
            case 'comments':
                panel = study.vm.mode.write
                    ? view$d(ctrl)
                    : viewDisabled$1(ctrl, study.members.canContribute() ? 'Press REC to comment moves' : 'Only the study members can comment on moves');
                break;
            case 'glyphs':
                panel = ctrl.path
                    ? study.vm.mode.write
                        ? view$c(study.glyphForm)
                        : viewDisabled('Press REC to annotate moves')
                    : viewDisabled('Select a move to annotate');
                break;
            case 'serverEval':
                panel = view$6(study.serverEval);
                break;
            case 'share':
                panel = view$8(study.share);
                break;
            case 'multiBoard':
                panel = view$4(study.multiBoard, study);
                break;
        }
        return [view$9(study.notif), view$5(study, true), view$5(study, false), buttons(ctrl), panel];
    }

    const elementId = 'analyse-cm';
    function getPosition(e) {
        let pos = e;
        if ('touches' in e && e.touches.length > 0)
            pos = e.touches[0];
        if (pos.pageX || pos.pageY)
            return {
                x: pos.pageX,
                y: pos.pageY,
            };
        else if (pos.clientX || pos.clientY)
            return {
                x: pos.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
                y: pos.clientY + document.body.scrollTop + document.documentElement.scrollTop,
            };
        else
            return null;
    }
    function positionMenu(menu, coords) {
        const menuWidth = menu.offsetWidth + 4, menuHeight = menu.offsetHeight + 4, windowWidth = window.innerWidth, windowHeight = window.innerHeight;
        menu.style.left =
            windowWidth - coords.x < menuWidth ? windowWidth - menuWidth + 'px' : (menu.style.left = coords.x + 'px');
        menu.style.top =
            windowHeight - coords.y < menuHeight ? windowHeight - menuHeight + 'px' : (menu.style.top = coords.y + 'px');
    }
    function action(icon, text, handler) {
        return h('a', {
            attrs: { 'data-icon': icon },
            hook: bind$1('click', handler),
        }, text);
    }
    function view$2(opts, coords) {
        const ctrl = opts.root, node = ctrl.tree.nodeAtPath(opts.path), onMainline = ctrl.tree.pathIsMainline(opts.path) && !ctrl.tree.pathIsForcedVariation(opts.path), trans = ctrl.trans.noarg;
        return h('div#' + elementId + '.visible', {
            hook: {
                insert: vnode => {
                    vnode.elm.addEventListener('contextmenu', e => (e.preventDefault(), false));
                    positionMenu(vnode.elm, coords);
                },
                postpatch: (_, vnode) => positionMenu(vnode.elm, coords),
            },
        }, [
            h('p.title', nodeFullName(node)),
            onMainline ? null : action('S', trans('promoteVariation'), () => ctrl.promote(opts.path, false)),
            onMainline ? null : action('E', trans('makeMainLine'), () => ctrl.promote(opts.path, true)),
            action('q', trans('deleteFromHere'), () => ctrl.deleteNode(opts.path)),
        ]
            .concat(ctrl.study ? contextMenu$1(ctrl.study, opts.path, node) : [])
            .concat([onMainline ? action('F', trans('forceVariation'), () => ctrl.forceVariation(opts.path, true)) : null]));
    }
    function contextMenu (e, opts) {
        let pos = getPosition(e);
        if (pos === null) {
            if (opts.root.contextMenuPath)
                return;
            pos = { x: 0, y: 0 };
        }
        const el = ($('#' + elementId)[0] || $('<div id="' + elementId + '">').appendTo($('body'))[0]);
        opts.root.contextMenuPath = opts.path;
        function close(e) {
            if (e.button === 2)
                return; // right click
            opts.root.contextMenuPath = undefined;
            document.removeEventListener('click', close, false);
            $('#' + elementId).removeClass('visible');
            opts.root.redraw();
        }
        document.addEventListener('click', close, false);
        el.innerHTML = '';
        patch(el, view$2(opts, pos));
    }

    function renderChildrenOf(ctx, node, opts) {
        const cs = node.children, main = cs[0];
        if (!main)
            return;
        if (opts.isMainline) {
            if (!cs[1] && !main.forceVariation)
                return renderMoveAndChildrenOf(ctx, main, {
                    parentPath: opts.parentPath,
                    isMainline: true,
                    withIndex: opts.withIndex,
                });
            return (renderInlined(ctx, cs, opts) || [
                ...(main.forceVariation
                    ? []
                    : [
                        renderMoveOf(ctx, main, {
                            parentPath: opts.parentPath,
                            isMainline: true,
                            withIndex: opts.withIndex,
                        }),
                        ...renderInlineCommentsOf(ctx, main),
                    ]),
                h('interrupt', renderLines(ctx, main.forceVariation ? cs : cs.slice(1), {
                    parentPath: opts.parentPath,
                    isMainline: true,
                })),
                ...(main.forceVariation
                    ? []
                    : renderChildrenOf(ctx, main, {
                        parentPath: opts.parentPath + main.id,
                        isMainline: true,
                        withIndex: true,
                    }) || []),
            ]);
        }
        if (!cs[1])
            return renderMoveAndChildrenOf(ctx, main, opts);
        return renderInlined(ctx, cs, opts) || [renderLines(ctx, cs, opts)];
    }
    function renderInlined(ctx, nodes, opts) {
        // only 2 branches
        if (!nodes[1] || nodes[2] || nodes[0].forceVariation)
            return;
        // only if second branch has no sub-branches
        if (hasBranching(nodes[1], 6))
            return;
        return renderMoveAndChildrenOf(ctx, nodes[0], {
            parentPath: opts.parentPath,
            isMainline: opts.isMainline,
            inline: nodes[1],
        });
    }
    function renderLines(ctx, nodes, opts) {
        return h('lines', nodes.map(n => {
            return (retroLine(ctx, n) ||
                h('line', renderMoveAndChildrenOf(ctx, n, {
                    parentPath: opts.parentPath,
                    isMainline: false,
                    withIndex: true,
                    truncate: n.comp && !contains(ctx.ctrl.path, opts.parentPath + n.id) ? 3 : undefined,
                })));
        }));
    }
    function renderMoveAndChildrenOf(ctx, node, opts) {
        const path = opts.parentPath + node.id, comments = renderInlineCommentsOf(ctx, node);
        if (opts.truncate === 0)
            return [h('move', { attrs: { p: path } }, '[...]')];
        return [renderMoveOf(ctx, node, opts)]
            .concat(comments)
            .concat(opts.inline ? renderInline(ctx, opts.inline, opts) : null)
            .concat(renderChildrenOf(ctx, node, {
            parentPath: path,
            isMainline: opts.isMainline,
            truncate: opts.truncate ? opts.truncate - 1 : undefined,
            withIndex: !!comments[0],
        }) || []);
    }
    function renderInline(ctx, node, opts) {
        return h('inline', renderMoveAndChildrenOf(ctx, node, {
            withIndex: true,
            parentPath: opts.parentPath,
            isMainline: false,
        }));
    }
    function renderMoveOf(ctx, node, opts) {
        const path = opts.parentPath + node.id, content = [
            opts.withIndex || node.ply & 1 ? renderIndex(node.ply, true) : null,
            fixCrazySan(node.san),
        ];
        if (node.glyphs && ctx.showGlyphs)
            node.glyphs.forEach(g => content.push(renderGlyph(g)));
        return h('move', {
            attrs: { p: path },
            class: nodeClasses(ctx, node, path),
        }, content);
    }
    function inline (ctrl) {
        const ctx = {
            ctrl,
            truncateComments: false,
            showComputer: ctrl.showComputer() && !ctrl.retro,
            showGlyphs: !!ctrl.study || ctrl.showComputer(),
            showEval: !!ctrl.study || ctrl.showComputer(),
            currentPath: findCurrentPath(ctrl),
        };
        return h('div.tview2.tview2-inline', {
            hook: mainHook(ctrl),
        }, [
            ...renderInlineCommentsOf(ctx, ctrl.tree.root),
            ...(renderChildrenOf(ctx, ctrl.tree.root, {
                parentPath: '',
                isMainline: true,
            }) || []),
        ]);
    }

    let cache = 'init';
    function isCol1 () {
        if (typeof cache == 'string') {
            if (cache == 'init') {
                // only once
                window.addEventListener('resize', () => {
                    cache = 'rec';
                }); // recompute on resize
                if (navigator.userAgent.indexOf('Edge/') > -1)
                    // edge gets false positive on page load, fix later
                    requestAnimationFrame(() => {
                        cache = 'rec';
                    });
            }
            cache = !!getComputedStyle(document.body).getPropertyValue('--col1');
        }
        return cache;
    }

    function ctrl(initialValue = 'column') {
        const value = storedProp('treeView', initialValue);
        function inline() {
            return value() === 'inline';
        }
        function set(i) {
            value(i ? 'inline' : 'column');
        }
        return {
            get: value,
            set,
            toggle() {
                set(!inline());
            },
            inline,
        };
    }
    // entry point, dispatching to selected view
    function render$3(ctrl, concealOf) {
        return (ctrl.treeView.inline() || isCol1()) && !concealOf ? inline(ctrl) : column(ctrl, concealOf);
    }
    function nodeClasses(ctx, node, path) {
        const glyphIds = ctx.showGlyphs && node.glyphs ? node.glyphs.map(g => g.id) : [];
        return {
            active: path === ctx.ctrl.path,
            'context-menu': path === ctx.ctrl.contextMenuPath,
            current: path === ctx.currentPath,
            nongame: !ctx.currentPath &&
                !!ctx.ctrl.gamePath &&
                contains(path, ctx.ctrl.gamePath) &&
                path !== ctx.ctrl.gamePath,
            inaccuracy: glyphIds.includes(6),
            mistake: glyphIds.includes(2),
            blunder: glyphIds.includes(4),
        };
    }
    function findCurrentPath(c) {
        let cur;
        return ((!c.synthetic && playable(c.data) && c.initialPath) ||
            (c.retro && (cur = c.retro.current()) && cur.prev.path) ||
            (c.study && c.study.data.chapter.relay && c.study.data.chapter.relay.path));
    }
    function renderInlineCommentsOf(ctx, node) {
        if (!ctx.ctrl.showComments || isEmpty(node.comments))
            return [];
        return node
            .comments.map(comment => {
            if (comment.by === 'lichess' && !ctx.showComputer)
                return;
            const by = node.comments[1] ? `<span class="by">${authorText(comment.by)}</span>` : '', truncated = truncateComment(comment.text, 300, ctx);
            return h('comment', {
                hook: innerHTML(truncated, text => by + enrichText(text)),
            });
        })
            .filter(nonEmpty);
    }
    function truncateComment(text, len, ctx) {
        return ctx.truncateComments && text.length > len ? text.slice(0, len - 10) + ' [...]' : text;
    }
    function mainHook(ctrl) {
        return {
            insert: vnode => {
                const el = vnode.elm;
                if (ctrl.path !== '')
                    autoScroll(ctrl, el);
                const ctxMenuCallback = (e) => {
                    const path = eventPath(e);
                    if (path !== null) {
                        contextMenu(e, {
                            path,
                            root: ctrl,
                        });
                    }
                    ctrl.redraw();
                    return false;
                };
                el.oncontextmenu = ctxMenuCallback;
                bindMobileTapHold(el, ctxMenuCallback, ctrl.redraw);
                el.addEventListener('mousedown', (e) => {
                    if (defined$1(e.button) && e.button !== 0)
                        return; // only touch or left click
                    const path = eventPath(e);
                    if (path)
                        ctrl.userJump(path);
                    ctrl.redraw();
                });
            },
            postpatch: (_, vnode) => {
                if (ctrl.autoScrollRequested) {
                    autoScroll(ctrl, vnode.elm);
                    ctrl.autoScrollRequested = false;
                }
            },
        };
    }
    function retroLine(ctx, node) {
        return node.comp && ctx.ctrl.retro && ctx.ctrl.retro.hideComputerLine(node)
            ? h('line', ctx.ctrl.trans.noarg('learnFromThisMistake'))
            : undefined;
    }
    function eventPath(e) {
        return (e.target.getAttribute('p') ||
            e.target.parentNode.getAttribute('p'));
    }
    const autoScroll = throttle(200, (ctrl, el) => {
        const cont = el.parentNode;
        if (!cont)
            return;
        const target = el.querySelector('.active');
        if (!target) {
            cont.scrollTop = ctrl.path ? 99999 : 0;
            return;
        }
        cont.scrollTop = target.offsetTop - cont.offsetHeight / 2 + target.offsetHeight;
    });
    const nonEmpty = (x) => !!x;

    const evalPutMinDepth = 20;
    const evalPutMinNodes = 3e6;
    const evalPutMaxMoves = 10;
    function qualityCheck(ev) {
        // below 500k nodes, the eval might come from an imminent threefold repetition
        // and should therefore be ignored
        return ev.nodes > 500000 && (ev.depth >= evalPutMinDepth || ev.nodes > evalPutMinNodes);
    }
    // from client eval to server eval
    function toPutData(variant, ev) {
        const data = {
            fen: ev.fen,
            knodes: Math.round(ev.nodes / 1000),
            depth: ev.depth,
            pvs: ev.pvs.map(pv => {
                return {
                    cp: pv.cp,
                    mate: pv.mate,
                    moves: pv.moves.slice(0, evalPutMaxMoves).join(' '),
                };
            }),
        };
        if (variant !== 'standard')
            data.variant = variant;
        return data;
    }
    // from server eval to client eval
    function toCeval(e) {
        // TODO: this type is not quite right
        const res = {
            fen: e.fen,
            nodes: e.knodes * 1000,
            depth: e.depth,
            pvs: e.pvs.map(from => {
                const to = {
                    moves: from.moves.split(' '), // moves come from the server as a single string
                };
                if (defined$1(from.cp))
                    to.cp = from.cp;
                else
                    to.mate = from.mate;
                return to;
            }),
            cloud: true,
        };
        if (defined$1(res.pvs[0].cp))
            res.cp = res.pvs[0].cp;
        else
            res.mate = res.pvs[0].mate;
        res.cloud = true;
        return res;
    }
    function make$5(opts) {
        const fetchedByFen = {};
        const upgradable = prop(false);
        lichess.pubsub.on('socket.in.crowd', d => upgradable(d.nb > 2));
        return {
            onCeval: throttle(500, function () {
                const node = opts.getNode(), ev = node.ceval;
                if (ev && !ev.cloud && node.fen in fetchedByFen && qualityCheck(ev) && opts.canPut()) {
                    opts.send('evalPut', toPutData(opts.variant, ev));
                }
            }),
            fetch(path, multiPv) {
                const node = opts.getNode();
                if ((node.ceval && node.ceval.cloud) || !opts.canGet())
                    return;
                const serverEval = fetchedByFen[node.fen];
                if (serverEval)
                    return opts.receive(toCeval(serverEval), path);
                else if (node.fen in fetchedByFen)
                    return;
                // waiting for response
                else
                    fetchedByFen[node.fen] = undefined; // mark as waiting
                const obj = {
                    fen: node.fen,
                    path,
                };
                if (opts.variant !== 'standard')
                    obj.variant = opts.variant;
                if (multiPv > 1)
                    obj.mpv = multiPv;
                if (upgradable())
                    obj.up = true;
                opts.send('evalGet', obj);
            },
            onCloudEval(serverEval) {
                fetchedByFen[serverEval.fen] = serverEval;
                opts.receive(toCeval(serverEval), serverEval.path);
            },
        };
    }

    function make$4(cfg, data, redraw) {
        const saveUrl = `/${data.game.id}${data.player.id}/forecasts`;
        let forecasts = cfg.steps || [];
        const loading = prop(false);
        function keyOf(fc) {
            return fc.map(node => node.ply + ':' + node.uci).join(',');
        }
        function contains(fc1, fc2) {
            return fc1.length >= fc2.length && keyOf(fc1).startsWith(keyOf(fc2));
        }
        function findStartingWithNode(node) {
            return forecasts.filter(fc => contains(fc, [node]));
        }
        function collides(fc1, fc2) {
            for (let i = 0, max = Math.min(fc1.length, fc2.length); i < max; i++) {
                if (fc1[i].uci !== fc2[i].uci) {
                    if (cfg.onMyTurn)
                        return i !== 0 && i % 2 === 0;
                    return i % 2 === 1;
                }
            }
            return true;
        }
        function truncate(fc) {
            if (cfg.onMyTurn)
                return (fc.length % 2 !== 1 ? fc.slice(0, -1) : fc).slice(0, 30);
            // must end with player move
            return (fc.length % 2 !== 0 ? fc.slice(0, -1) : fc).slice(0, 30);
        }
        function isLongEnough(fc) {
            return fc.length >= (cfg.onMyTurn ? 1 : 2);
        }
        function fixAll() {
            // remove contained forecasts
            forecasts = forecasts.filter(function (fc, i) {
                return (forecasts.filter(function (f, j) {
                    return i !== j && contains(f, fc);
                }).length === 0);
            });
            // remove colliding forecasts
            forecasts = forecasts.filter(function (fc, i) {
                return (forecasts.filter(function (f, j) {
                    return i < j && collides(f, fc);
                }).length === 0);
            });
        }
        fixAll();
        function reloadToLastPly() {
            loading(true);
            redraw();
            history.replaceState(null, '', '#last');
            lichess.reload();
        }
        function isCandidate(fc) {
            fc = truncate(fc);
            if (!isLongEnough(fc))
                return false;
            const collisions = forecasts.filter(f => contains(f, fc));
            if (collisions.length)
                return false;
            return true;
        }
        function save() {
            if (cfg.onMyTurn)
                return;
            loading(true);
            redraw();
            json(saveUrl, {
                method: 'POST',
                body: JSON.stringify(forecasts),
                headers: { 'Content-Type': 'application/json' },
            })
                .then(data => {
                if (data.reload)
                    reloadToLastPly();
                else {
                    loading(false);
                    forecasts = data.steps || [];
                }
                redraw();
            });
        }
        function playAndSave(node) {
            if (!cfg.onMyTurn)
                return;
            loading(true);
            redraw();
            json(`${saveUrl}/${node.uci}`, {
                method: 'POST',
                body: JSON.stringify(findStartingWithNode(node)
                    .filter(notEmpty)
                    .map(fc => fc.slice(1))),
                headers: { 'Content-Type': 'application/json' },
            })
                .then(data => {
                if (data.reload)
                    reloadToLastPly();
                else {
                    loading(false);
                    forecasts = data.steps || [];
                }
                redraw();
            });
        }
        return {
            addNodes(fc) {
                fc = truncate(fc);
                if (!isCandidate(fc))
                    return;
                forecasts.push(fc);
                fixAll();
                save();
            },
            isCandidate,
            removeIndex(index) {
                forecasts = forecasts.filter((_, i) => i !== index);
                save();
            },
            list: () => forecasts,
            truncate,
            loading,
            onMyTurn: !!cfg.onMyTurn,
            findStartingWithNode,
            playAndSave,
            reloadToLastPly,
        };
    }

    function make$3(root) {
        let prev;
        let selected = 0;
        function displayed() {
            return root.node.children.length > 1;
        }
        return {
            state() {
                const node = root.node;
                if (!prev || prev.id !== node.id) {
                    prev = node;
                    selected = 0;
                }
                return {
                    node,
                    selected,
                    displayed: displayed(),
                };
            },
            next() {
                if (displayed()) {
                    selected = Math.min(root.node.children.length - 1, selected + 1);
                    return true;
                }
                return undefined;
            },
            prev() {
                if (displayed()) {
                    selected = Math.max(0, selected - 1);
                    return true;
                }
                return undefined;
            },
            proceed(it) {
                if (displayed()) {
                    it = defined$1(it) ? it : selected;
                    root.userJumpIfCan(root.path + root.node.children[it].id);
                    return true;
                }
                return undefined;
            },
        };
    }
    function view$1(root, concealOf) {
        if (root.embed || root.retro)
            return;
        const state = root.fork.state();
        if (!state.displayed)
            return;
        const isMainline = concealOf && root.onMainline;
        return h('div.analyse__fork', {
            hook: onInsert(el => {
                el.addEventListener('click', e => {
                    const target = e.target, it = parseInt(target.parentNode.getAttribute('data-it') || target.getAttribute('data-it') || '');
                    root.fork.proceed(it);
                    root.redraw();
                });
            }),
        }, state.node.children.map((node, it) => {
            const conceal = isMainline && concealOf(true)(root.path + node.id, node);
            if (!conceal)
                return h('move', {
                    class: { selected: it === state.selected },
                    attrs: { 'data-it': it },
                }, renderIndexAndMove({
                    withDots: true,
                    showEval: root.showComputer(),
                    showGlyphs: root.showComputer(),
                }, node));
            return undefined;
        }));
    }

    function hasCompChild(node) {
        return !!node.children.find(function (c) {
            return !!c.comp;
        });
    }
    function nextGlyphSymbol(color, symbol, mainline, fromPly) {
        const len = mainline.length;
        if (!len)
            return;
        const fromIndex = fromPly - mainline[0].ply;
        for (let i = 1; i < len; i++) {
            const node = mainline[(fromIndex + i) % len];
            const found = node.ply % 2 === (color === 'white' ? 1 : 0) &&
                node.glyphs &&
                node.glyphs.find(function (g) {
                    return g.symbol === symbol;
                });
            if (found)
                return node;
        }
        return;
    }
    function evalSwings(mainline, nodeFilter) {
        const found = [];
        const threshold = 0.1;
        for (let i = 1; i < mainline.length; i++) {
            const node = mainline[i];
            const prev = mainline[i - 1];
            if (nodeFilter(node) && node.eval && prev.eval) {
                const diff = Math.abs(povDiff('white', prev.eval, node.eval));
                if (diff > threshold && hasCompChild(prev))
                    found.push(node);
            }
        }
        return found;
    }
    function threefoldFen(fen) {
        return fen.split(' ').slice(0, 4).join(' ');
    }
    function detectThreefold(nodeList, node) {
        if (defined$1(node.threefold))
            return;
        const currentFen = threefoldFen(node.fen);
        let nbSimilarPositions = 0, i;
        for (i in nodeList)
            if (threefoldFen(nodeList[i].fen) === currentFen)
                nbSimilarPositions++;
        node.threefold = nbSimilarPositions > 2;
    }

    function make$2(root, playableDepth) {
        const variant = root.data.game.variant.key, running = prop(true), comment = prop(null), hovering = prop(null), hinting = prop(null), played = prop(false);
        function ensureCevalRunning() {
            if (!root.showComputer())
                root.toggleComputer();
            if (!root.ceval.enabled())
                root.toggleCeval();
            if (root.threatMode())
                root.toggleThreatMode();
        }
        function commentable(node, bonus = 0) {
            if (node.tbhit || root.outcome(node))
                return true;
            const ceval = node.ceval;
            return ceval ? ceval.depth + bonus >= 15 || (ceval.depth >= 13 && ceval.millis > 3000) : false;
        }
        function playable(node) {
            const ceval = node.ceval;
            return ceval
                ? ceval.depth >= Math.min(ceval.maxDepth || 99, playableDepth()) ||
                    (ceval.depth >= 15 && (ceval.cloud || ceval.millis > 5000))
                : false;
        }
        function tbhitToEval(hit) {
            return (hit &&
                (hit.winner
                    ? {
                        mate: hit.winner === 'white' ? 10 : -10,
                    }
                    : { cp: 0 }));
        }
        function nodeBestUci(node) {
            return (node.tbhit && node.tbhit.best) || (node.ceval && node.ceval.pvs[0].moves[0]);
        }
        function makeComment(prev, node, path) {
            let verdict, best;
            const outcome = root.outcome(node);
            if (outcome && outcome.winner)
                verdict = 'goodMove';
            else {
                const nodeEval = tbhitToEval(node.tbhit) || (node.threefold || (outcome && !outcome.winner) ? { cp: 0 } : node.ceval);
                const prevEval = tbhitToEval(prev.tbhit) || prev.ceval;
                const shift = -povDiff(root.bottomColor(), nodeEval, prevEval);
                best = nodeBestUci(prev);
                if (best === node.uci || (node.san.startsWith('O-O') && best === altCastles[node.uci]))
                    best = undefined;
                if (!best)
                    verdict = 'goodMove';
                else if (shift < 0.025)
                    verdict = 'goodMove';
                else if (shift < 0.06)
                    verdict = 'inaccuracy';
                else if (shift < 0.14)
                    verdict = 'mistake';
                else
                    verdict = 'blunder';
            }
            return {
                prev,
                node,
                path,
                verdict,
                best: best
                    ? {
                        uci: best,
                        san: root.position(prev).unwrap(pos => makeSan(pos, parseUci(best)), _ => '--'),
                    }
                    : undefined,
            };
        }
        function isMyTurn() {
            return root.turnColor() === root.bottomColor();
        }
        function checkCeval() {
            const node = root.node;
            if (!running()) {
                comment(null);
                return root.redraw();
            }
            if (tablebaseGuaranteed(variant, node.fen) && !defined$1(node.tbhit))
                return;
            ensureCevalRunning();
            if (isMyTurn()) {
                const h = hinting();
                if (h) {
                    h.uci = nodeBestUci(node) || h.uci;
                    root.setAutoShapes();
                }
            }
            else {
                comment(null);
                if (node.san && commentable(node)) {
                    const parentNode = root.tree.parentNode(root.path);
                    if (commentable(parentNode, +1))
                        comment(makeComment(parentNode, node, root.path));
                    else {
                        /*
                         * Looks like the parent node didn't get enough analysis time
                         * to be commentable :-/ it can happen if the player premoves
                         * or just makes a move before the position is sufficiently analysed.
                         * In this case, fall back to comparing to the position before,
                         * Since computer moves are supposed to preserve eval anyway.
                         */
                        const olderNode = root.tree.parentNode(init(root.path));
                        if (commentable(olderNode, +1))
                            comment(makeComment(olderNode, node, root.path));
                    }
                }
                if (!played() && playable(node)) {
                    root.playUci(nodeBestUci(node));
                    played(true);
                }
                else
                    root.redraw();
            }
        }
        function checkCevalOrTablebase() {
            if (tablebaseGuaranteed(variant, root.node.fen))
                root.explorer.fetchTablebaseHit(root.node.fen).then(hit => {
                    if (hit && root.node.fen === hit.fen)
                        root.node.tbhit = hit;
                    checkCeval();
                }, () => {
                    if (!defined$1(root.node.tbhit))
                        root.node.tbhit = null;
                    checkCeval();
                });
            else
                checkCeval();
        }
        function resume() {
            running(true);
            checkCevalOrTablebase();
        }
        lichess.requestIdleCallback(checkCevalOrTablebase, 800);
        return {
            onCeval: checkCeval,
            onJump() {
                played(false);
                hinting(null);
                detectThreefold(root.nodeList, root.node);
                checkCevalOrTablebase();
            },
            isMyTurn,
            comment,
            running,
            hovering,
            hinting,
            resume,
            playableDepth,
            reset() {
                comment(null);
                hinting(null);
            },
            preUserJump(from, to) {
                if (from !== to) {
                    running(false);
                    comment(null);
                }
            },
            postUserJump(from, to) {
                if (from !== to && isMyTurn())
                    resume();
            },
            onUserMove() {
                running(true);
            },
            playCommentBest() {
                const c = comment();
                if (!c)
                    return;
                root.jump(init(c.path));
                if (c.best)
                    root.playUci(c.best.uci);
            },
            commentShape(enable) {
                const c = comment();
                if (!enable || !c || !c.best)
                    hovering(null);
                else
                    hovering({
                        uci: c.best.uci,
                    });
                root.setAutoShapes();
            },
            hint() {
                const best = root.node.ceval ? root.node.ceval.pvs[0].moves[0] : null, prev = hinting();
                if (!best || (prev && prev.mode === 'move'))
                    hinting(null);
                else
                    hinting({
                        mode: prev ? 'move' : 'piece',
                        uci: best,
                    });
                root.setAutoShapes();
            },
            currentNode: () => root.node,
            bottomColor: root.bottomColor,
            redraw: root.redraw,
        };
    }

    function make$1(root, color) {
        const game = root.data.game;
        let candidateNodes = [];
        const explorerCancelPlies = [];
        let solvedPlies = [];
        const current = prop(null);
        const feedback = prop('find');
        const redraw = root.redraw;
        function isPlySolved(ply) {
            return solvedPlies.includes(ply);
        }
        function findNextNode() {
            const colorModulo = color == 'white' ? 1 : 0;
            candidateNodes = evalSwings(root.mainline, n => n.ply % 2 === colorModulo && !explorerCancelPlies.includes(n.ply));
            return candidateNodes.find(n => !isPlySolved(n.ply));
        }
        function jumpToNext() {
            feedback('find');
            const node = findNextNode();
            if (!node) {
                current(null);
                return redraw();
            }
            const fault = {
                node,
                path: root.mainlinePathToPly(node.ply),
            };
            const prevPath = init(fault.path);
            const prev = {
                node: root.tree.nodeAtPath(prevPath),
                path: prevPath,
            };
            const solutionNode = prev.node.children.find(n => !!n.comp);
            current({
                fault,
                prev,
                solution: {
                    node: solutionNode,
                    path: prevPath + solutionNode.id,
                },
                openingUcis: [],
            });
            // fetch opening explorer moves
            if (game.variant.key === 'standard' &&
                game.division &&
                (!game.division.middle || fault.node.ply < game.division.middle)) {
                root.explorer.fetchMasterOpening(prev.node.fen).then((res) => {
                    const cur = current();
                    const ucis = [];
                    res.moves.forEach(m => {
                        if (m.white + m.draws + m.black > 1)
                            ucis.push(m.uci);
                    });
                    if (ucis.includes(fault.node.uci)) {
                        explorerCancelPlies.push(fault.node.ply);
                        setTimeout(jumpToNext, 100);
                    }
                    else {
                        cur.openingUcis = ucis;
                        current(cur);
                    }
                });
            }
            root.userJump(prev.path);
            redraw();
        }
        function onJump() {
            const node = root.node, fb = feedback(), cur = current();
            if (!cur)
                return;
            if (fb === 'eval' && cur.fault.node.ply !== node.ply) {
                feedback('find');
                root.setAutoShapes();
                return;
            }
            if (isSolving() && cur.fault.node.ply === node.ply) {
                if (cur.openingUcis.includes(node.uci))
                    onWin();
                // found in opening explorer
                else if (node.comp)
                    onWin();
                // the computer solution line
                else if (node.eval)
                    onFail();
                // the move that was played in the game
                else {
                    feedback('eval');
                    if (!root.ceval.enabled())
                        root.toggleCeval();
                    checkCeval();
                }
            }
            root.setAutoShapes();
        }
        function isCevalReady(node) {
            return node.ceval ? node.ceval.depth >= 18 || (node.ceval.depth >= 14 && node.ceval.millis > 7000) : false;
        }
        function checkCeval() {
            const node = root.node, cur = current();
            if (!cur || feedback() !== 'eval' || cur.fault.node.ply !== node.ply)
                return;
            if (isCevalReady(node)) {
                const diff = povDiff(color, node.ceval, cur.prev.node.eval);
                if (diff > -0.035)
                    onWin();
                else
                    onFail();
            }
        }
        function onWin() {
            solveCurrent();
            feedback('win');
            redraw();
        }
        function onFail() {
            feedback('fail');
            const bad = {
                node: root.node,
                path: root.path,
            };
            root.userJump(current().prev.path);
            if (!root.tree.pathIsMainline(bad.path) && isEmpty(bad.node.children))
                root.tree.deleteNodeAt(bad.path);
            redraw();
        }
        function viewSolution() {
            feedback('view');
            root.userJump(current().solution.path);
            solveCurrent();
        }
        function skip() {
            solveCurrent();
            jumpToNext();
        }
        function solveCurrent() {
            solvedPlies.push(current().fault.node.ply);
        }
        function hideComputerLine(node) {
            return (node.ply % 2 === 0) !== (color === 'white') && !isPlySolved(node.ply);
        }
        function showBadNode() {
            const cur = current();
            if (cur && isSolving() && cur.prev.path === root.path)
                return cur.fault.node;
            return undefined;
        }
        function isSolving() {
            const fb = feedback();
            return fb === 'find' || fb === 'fail';
        }
        jumpToNext();
        function onMergeAnalysisData() {
            if (isSolving() && !current())
                jumpToNext();
        }
        return {
            current,
            color,
            isPlySolved,
            onJump,
            jumpToNext,
            skip,
            viewSolution,
            hideComputerLine,
            showBadNode,
            onCeval: checkCeval,
            onMergeAnalysisData,
            feedback,
            isSolving,
            completion: () => [solvedPlies.length, candidateNodes.length],
            reset() {
                solvedPlies = [];
                jumpToNext();
            },
            flip() {
                if (root.data.game.variant.key !== 'racingKings')
                    root.flip();
                else {
                    root.retro = make$1(root, opposite$1(color));
                    redraw();
                }
            },
            close: root.toggleRetro,
            trans: root.trans,
            noarg: root.trans.noarg,
            node: () => root.node,
            redraw,
        };
    }

    function make(send, ctrl) {
        let anaMoveTimeout;
        let anaDestsTimeout;
        let anaDestsCache = {};
        function clearCache() {
            anaDestsCache =
                ctrl.data.game.variant.key === 'standard' && ctrl.tree.root.fen.split(' ', 1)[0] === initial
                    ? {
                        '': {
                            path: '',
                            dests: 'iqy muC gvx ltB bqs pxF jrz nvD ksA owE',
                        },
                    }
                    : {};
        }
        clearCache();
        // forecast mode: reload when opponent moves
        if (!ctrl.synthetic)
            setTimeout(function () {
                send('startWatching', ctrl.data.game.id);
            }, 1000);
        function currentChapterId() {
            if (ctrl.study)
                return ctrl.study.vm.chapterId;
            return undefined;
        }
        function addStudyData(req, isWrite = false) {
            const c = currentChapterId();
            if (c) {
                req.ch = c;
                if (isWrite) {
                    if (ctrl.study.isWriting()) {
                        if (!ctrl.study.vm.mode.sticky)
                            req.sticky = false;
                    }
                    else
                        req.write = false;
                }
            }
        }
        const handlers = {
            node(data) {
                clearTimeout(anaMoveTimeout);
                // no strict equality here!
                if (data.ch == currentChapterId())
                    ctrl.addNode(data.node, data.path);
                else
                    console.log('socket handler node got wrong chapter id', data);
            },
            stepFailure() {
                clearTimeout(anaMoveTimeout);
                ctrl.reset();
            },
            dests(data) {
                clearTimeout(anaDestsTimeout);
                if (!data.ch || data.ch === currentChapterId()) {
                    anaDestsCache[data.path] = data;
                    ctrl.addDests(data.dests, data.path);
                }
                else
                    console.log('socket handler node got wrong chapter id', data);
            },
            destsFailure(data) {
                console.log(data);
                clearTimeout(anaDestsTimeout);
            },
            fen(e) {
                if (ctrl.forecast && e.id === ctrl.data.game.id && last$1(ctrl.mainline).fen.indexOf(e.fen) !== 0) {
                    ctrl.forecast.reloadToLastPly();
                }
            },
            analysisProgress(data) {
                ctrl.mergeAnalysisData(data);
            },
            evalHit(e) {
                ctrl.evalCache.onCloudEval(e);
            },
        };
        function withoutStandardVariant(obj) {
            if (obj.variant === 'standard')
                delete obj.variant;
        }
        function sendAnaDests(req) {
            clearTimeout(anaDestsTimeout);
            if (anaDestsCache[req.path])
                setTimeout(function () {
                    handlers.dests(anaDestsCache[req.path]);
                }, 300);
            else {
                withoutStandardVariant(req);
                addStudyData(req);
                send('anaDests', req);
                anaDestsTimeout = setTimeout(function () {
                    console.log(req, 'resendAnaDests');
                    sendAnaDests(req);
                }, 3000);
            }
        }
        function sendAnaMove(req) {
            clearTimeout(anaMoveTimeout);
            withoutStandardVariant(req);
            addStudyData(req, true);
            send('anaMove', req);
            anaMoveTimeout = setTimeout(() => sendAnaMove(req), 3000);
        }
        function sendAnaDrop(req) {
            clearTimeout(anaMoveTimeout);
            withoutStandardVariant(req);
            addStudyData(req, true);
            send('anaDrop', req);
            anaMoveTimeout = setTimeout(() => sendAnaDrop(req), 3000);
        }
        return {
            receive(type, data) {
                const handler = handlers[type];
                if (handler) {
                    handler(data);
                    return true;
                }
                return !!ctrl.study && ctrl.study.socketHandler(type, data);
            },
            sendAnaMove,
            sendAnaDrop,
            sendAnaDests,
            clearCache,
            send,
        };
    }

    function drag(ctrl, color, e) {
        if (e.button !== undefined && e.button !== 0)
            return; // only touch or left click
        if (ctrl.chessground.state.movable.color !== color)
            return;
        const el = e.target;
        const role = el.getAttribute('data-role'), number = el.getAttribute('data-nb');
        if (!role || !color || number === '0')
            return;
        e.stopPropagation();
        e.preventDefault();
        dragNewPiece(ctrl.chessground.state, { color, role }, e);
    }
    function valid(chessground, possibleDrops, piece, pos) {
        if (piece.color !== chessground.state.movable.color)
            return false;
        if (piece.role === 'pawn' && (pos[1] === '1' || pos[1] === '8'))
            return false;
        const drops = readDrops(possibleDrops);
        if (drops === null)
            return true;
        return drops.includes(pos);
    }

    class AnalyseCtrl {
        constructor(opts, redraw) {
            this.opts = opts;
            this.redraw = redraw;
            this.autoScrollRequested = false;
            this.redirecting = false;
            this.onMainline = true;
            // display flags
            this.flipped = false;
            this.showComments = true; // whether to display comments in the move tree
            this.showAutoShapes = storedProp('show-auto-shapes', true);
            this.showGauge = storedProp('show-gauge', true);
            this.showComputer = storedProp('show-computer', true);
            this.showMoveAnnotation = storedProp('show-move-annotation', true);
            this.keyboardHelp = location.hash === '#keyboard';
            this.threatMode = prop(false);
            this.cgVersion = {
                js: 1,
                dom: 1,
            };
            this.setPath = (path) => {
                this.path = path;
                this.nodeList = this.tree.getNodeList(path);
                this.node = last$1(this.nodeList);
                this.mainline = mainlineNodeList(this.tree.root);
                this.onMainline = this.tree.pathIsMainline(path);
                this.fenInput = undefined;
                this.pgnInput = undefined;
            };
            this.flip = () => {
                this.flipped = !this.flipped;
                this.chessground.set({
                    orientation: this.bottomColor(),
                });
                if (this.retro && this.data.game.variant.key !== 'racingKings') {
                    this.retro = make$1(this, this.bottomColor());
                }
                if (this.practice)
                    this.restartPractice();
                this.redraw();
            };
            this.bottomIsWhite = () => this.bottomColor() === 'white';
            this.getDests = throttle(800, () => {
                if (!this.embed && !defined$1(this.node.dests))
                    this.socket.sendAnaDests({
                        variant: this.data.game.variant.key,
                        fen: this.node.fen,
                        path: this.path,
                    });
            });
            this.throttleSound = (name) => throttle(100, () => lichess.sound.play(name));
            this.sound = {
                move: this.throttleSound('move'),
                capture: this.throttleSound('capture'),
                check: this.throttleSound('check'),
            };
            this.onChange = throttle(300, () => {
                lichess.pubsub.emit('analysis.change', this.node.fen, this.path, this.onMainline ? this.node.ply : false);
            });
            this.updateHref = debounce(() => {
                if (!this.opts.study)
                    window.history.replaceState(null, '', '#' + this.node.ply);
            }, 750);
            this.playedLastMoveMyself = () => !!this.justPlayed && !!this.node.uci && this.node.uci.startsWith(this.justPlayed);
            this.userJump = (path) => {
                this.autoplay.stop();
                this.withCg(cg => cg.selectSquare(null));
                if (this.practice) {
                    const prev = this.path;
                    this.practice.preUserJump(prev, path);
                    this.jump(path);
                    this.practice.postUserJump(prev, this.path);
                }
                else
                    this.jump(path);
            };
            this.jumpToMain = (ply) => {
                this.userJump(this.mainlinePathToPly(ply));
            };
            this.jumpToIndex = (index) => {
                this.jumpToMain(index + 1 + this.tree.root.ply);
            };
            this.userNewPiece = (piece, pos) => {
                if (valid(this.chessground, this.node.drops, piece, pos)) {
                    this.justPlayed = roleToChar(piece.role).toUpperCase() + '@' + pos;
                    this.justDropped = piece.role;
                    this.justCaptured = undefined;
                    this.sound.move();
                    const drop = {
                        role: piece.role,
                        pos,
                        variant: this.data.game.variant.key,
                        fen: this.node.fen,
                        path: this.path,
                    };
                    this.socket.sendAnaDrop(drop);
                    this.preparePremoving();
                    this.redraw();
                }
                else
                    this.jump(this.path);
            };
            this.userMove = (orig, dest, capture) => {
                this.justPlayed = orig;
                this.justDropped = undefined;
                const piece = this.chessground.state.pieces.get(dest);
                const isCapture = capture || (piece && piece.role == 'pawn' && orig[0] != dest[0]);
                this.sound[isCapture ? 'capture' : 'move']();
                if (!start$2(this, orig, dest, capture, this.sendMove))
                    this.sendMove(orig, dest, capture);
            };
            this.sendMove = (orig, dest, capture, prom) => {
                const move = {
                    orig,
                    dest,
                    variant: this.data.game.variant.key,
                    fen: this.node.fen,
                    path: this.path,
                };
                if (capture)
                    this.justCaptured = capture;
                if (prom)
                    move.promotion = prom;
                if (this.practice)
                    this.practice.onUserMove();
                this.socket.sendAnaMove(move);
                this.preparePremoving();
                this.redraw();
            };
            this.onPremoveSet = () => {
                if (this.study)
                    this.study.onPremoveSet();
            };
            this.setAutoShapes = () => {
                this.withCg(cg => cg.setAutoShapes(compute(this)));
            };
            this.onNewCeval = (ev, path, isThreat) => {
                this.tree.updateAt(path, (node) => {
                    if (node.fen !== ev.fen && !isThreat)
                        return;
                    if (isThreat) {
                        if (!node.threat || isEvalBetter(ev, node.threat) || node.threat.maxDepth < ev.maxDepth)
                            node.threat = ev;
                    }
                    else if (isEvalBetter(ev, node.ceval))
                        node.ceval = ev;
                    else if (node.ceval && ev.maxDepth > node.ceval.maxDepth)
                        node.ceval.maxDepth = ev.maxDepth;
                    if (path === this.path) {
                        this.setAutoShapes();
                        if (!isThreat) {
                            if (this.retro)
                                this.retro.onCeval();
                            if (this.practice)
                                this.practice.onCeval();
                            if (this.studyPractice)
                                this.studyPractice.onCeval();
                            this.evalCache.onCeval();
                            if (ev.cloud && ev.depth >= this.ceval.effectiveMaxDepth())
                                this.ceval.stop();
                        }
                        this.redraw();
                    }
                });
            };
            this.startCeval = throttle(800, () => {
                if (this.ceval.enabled()) {
                    if (this.canUseCeval()) {
                        this.ceval.start(this.path, this.nodeList, this.threatMode(), false);
                        this.evalCache.fetch(this.path, parseInt(this.ceval.multiPv()));
                    }
                    else
                        this.ceval.stop();
                }
            });
            this.toggleCeval = () => {
                if (!this.showComputer())
                    return;
                this.ceval.toggle();
                this.setAutoShapes();
                this.startCeval();
                if (!this.ceval.enabled()) {
                    this.threatMode(false);
                    if (this.practice)
                        this.togglePractice();
                }
                this.redraw();
            };
            this.toggleThreatMode = () => {
                if (this.node.check)
                    return;
                if (!this.ceval.enabled())
                    this.ceval.toggle();
                if (!this.ceval.enabled())
                    return;
                this.threatMode(!this.threatMode());
                if (this.threatMode() && this.practice)
                    this.togglePractice();
                this.setAutoShapes();
                this.startCeval();
                this.redraw();
            };
            this.disableThreatMode = () => {
                return !!this.practice;
            };
            this.mandatoryCeval = () => {
                return !!this.studyPractice;
            };
            this.cevalSetMultiPv = (v) => {
                this.ceval.multiPv(v);
                this.tree.removeCeval();
                this.cevalReset();
            };
            this.cevalSetThreads = (v) => {
                if (!this.ceval.threads)
                    return;
                this.ceval.threads(v);
                this.cevalReset();
            };
            this.cevalSetHashSize = (v) => {
                if (!this.ceval.hashSize)
                    return;
                this.ceval.hashSize(v);
                this.cevalReset();
            };
            this.cevalSetInfinite = (v) => {
                this.ceval.infinite(v);
                this.cevalReset();
            };
            this.hasFullComputerAnalysis = () => {
                return Object.keys(this.mainline[0].eval || {}).length > 0;
            };
            this.toggleAutoShapes = (v) => {
                this.showAutoShapes(v);
                this.resetAutoShapes();
            };
            this.toggleGauge = () => {
                this.showGauge(!this.showGauge());
            };
            this.toggleMoveAnnotation = (v) => {
                this.showMoveAnnotation(v);
                this.resetAutoShapes();
            };
            this.toggleComputer = () => {
                if (this.ceval.enabled())
                    this.toggleCeval();
                const value = !this.showComputer();
                this.showComputer(value);
                if (!value && this.practice)
                    this.togglePractice();
                this.onToggleComputer();
                lichess.pubsub.emit('analysis.comp.toggle', value);
            };
            this.toggleRetro = () => {
                if (this.retro)
                    this.retro = undefined;
                else {
                    this.retro = make$1(this, this.bottomColor());
                    if (this.practice)
                        this.togglePractice();
                    if (this.explorer.enabled())
                        this.toggleExplorer();
                }
                this.setAutoShapes();
            };
            this.toggleExplorer = () => {
                if (this.practice)
                    this.togglePractice();
                if (this.explorer.enabled() || this.explorer.allowed())
                    this.explorer.toggle();
            };
            this.togglePractice = () => {
                if (this.practice || !this.ceval.possible)
                    this.practice = undefined;
                else {
                    if (this.retro)
                        this.toggleRetro();
                    if (this.explorer.enabled())
                        this.toggleExplorer();
                    this.practice = make$2(this, () => {
                        // push to 20 to store AI moves in the cloud
                        // lower to 18 after task completion (or failure)
                        return this.studyPractice && this.studyPractice.success() === null ? 20 : 18;
                    });
                }
                this.setAutoShapes();
            };
            this.gamebookPlay = () => {
                return this.study && this.study.gamebookPlay();
            };
            this.isGamebook = () => !!(this.study && this.study.data.chapter.gamebook);
            this.data = opts.data;
            this.element = opts.element;
            this.embed = opts.embed;
            this.trans = opts.trans;
            this.treeView = ctrl(opts.embed ? 'inline' : 'column');
            if (this.data.forecast)
                this.forecast = make$4(this.data.forecast, this.data, redraw);
            if (lichess.AnalyseNVUI)
                this.nvui = lichess.AnalyseNVUI(redraw);
            this.instanciateEvalCache();
            this.initialize(this.data, false);
            this.instanciateCeval();
            this.initialPath = root;
            {
                const loc = window.location, hashPly = loc.hash === '#last' ? this.tree.lastPly() : parseInt(loc.hash.substr(1));
                if (hashPly) {
                    // remove location hash - https://stackoverflow.com/questions/1397329/how-to-remove-the-hash-from-window-location-with-javascript-without-page-refresh/5298684#5298684
                    window.history.replaceState(null, '', loc.pathname + loc.search);
                    const mainline = mainlineNodeList(this.tree.root);
                    this.initialPath = takePathWhile(mainline, n => n.ply <= hashPly);
                }
            }
            this.setPath(this.initialPath);
            this.showGround();
            this.onToggleComputer();
            this.startCeval();
            this.explorer.setNode();
            this.study = opts.study
                ? makeStudy(opts.study, this, (opts.tagTypes || '').split(','), opts.practice, opts.relay)
                : undefined;
            this.studyPractice = this.study ? this.study.practice : undefined;
            if (location.hash === '#practice' || (this.study && this.study.data.chapter.practice))
                this.togglePractice();
            else if (location.hash === '#menu')
                lichess.requestIdleCallback(this.actionMenu.toggle, 500);
            bind(this);
            lichess.pubsub.on('jump', (ply) => {
                this.jumpToMain(parseInt(ply));
                this.redraw();
            });
            lichess.pubsub.on('sound_set', (set) => {
                if (!this.music && set === 'music')
                    lichess.loadScript('javascripts/music/replay.js').then(() => {
                        this.music = window.lichessReplayMusic();
                    });
                if (this.music && set !== 'music')
                    this.music = null;
            });
            lichess.pubsub.on('analysis.change.trigger', this.onChange);
            lichess.pubsub.on('analysis.chart.click', index => {
                this.jumpToIndex(index);
                this.redraw();
            });
            setup();
        }
        initialize(data, merge) {
            this.data = data;
            this.synthetic = data.game.id === 'synthetic';
            this.ongoing = !this.synthetic && playable(data);
            const prevTree = merge && this.tree.root;
            this.tree = build(treeReconstruct(this.data.treeParts));
            if (prevTree)
                this.tree.merge(prevTree);
            this.actionMenu = new ActionMenuCtrl();
            this.autoplay = new Autoplay(this);
            if (this.socket)
                this.socket.clearCache();
            else
                this.socket = make(this.opts.socketSend, this);
            this.explorer = explorerCtrl(this, this.opts.explorer, this.explorer ? this.explorer.allowed() : !this.embed);
            this.gamePath =
                this.synthetic || this.ongoing ? undefined : fromNodeList(mainlineNodeList(this.tree.root));
            this.fork = make$3(this);
            lichess.sound.preloadBoardSounds();
        }
        topColor() {
            return opposite(this.bottomColor());
        }
        bottomColor() {
            if (this.data.game.variant.key === 'racingKings')
                return this.flipped ? 'black' : 'white';
            return this.flipped ? opposite(this.data.orientation) : this.data.orientation;
        }
        getOrientation() {
            // required by ui/ceval
            return this.bottomColor();
        }
        getNode() {
            // required by ui/ceval
            return this.node;
        }
        turnColor() {
            return plyColor(this.node.ply);
        }
        togglePlay(delay) {
            this.autoplay.toggle(delay);
            this.actionMenu.open = false;
        }
        uciToLastMove(uci) {
            if (!uci)
                return;
            if (uci[1] === '@')
                return [uci.substr(2, 2), uci.substr(2, 2)];
            return [uci.substr(0, 2), uci.substr(2, 2)];
        }
        showGround() {
            this.onChange();
            if (!defined$1(this.node.dests))
                this.getDests();
            this.withCg(cg => {
                cg.set(this.makeCgOpts());
                this.setAutoShapes();
                if (this.node.shapes)
                    cg.setShapes(this.node.shapes);
            });
        }
        makeCgOpts() {
            const node = this.node, color = this.turnColor(), dests = readDests(this.node.dests), drops = readDrops(this.node.drops), movableColor = this.gamebookPlay()
                ? color
                : this.practice
                    ? this.bottomColor()
                    : !this.embed && ((dests && dests.size > 0) || drops === null || drops.length)
                        ? color
                        : undefined, config = {
                fen: node.fen,
                turnColor: color,
                movable: this.embed
                    ? {
                        color: undefined,
                        dests: new Map(),
                    }
                    : {
                        color: movableColor,
                        dests: (movableColor === color && dests) || new Map(),
                    },
                check: !!node.check,
                lastMove: this.uciToLastMove(node.uci),
            };
            if (!dests && !node.check) {
                // premove while dests are loading from server
                // can't use when in check because it highlights the wrong king
                config.turnColor = opposite(color);
                config.movable.color = color;
            }
            config.premovable = {
                enabled: config.movable.color && config.turnColor !== config.movable.color,
            };
            this.cgConfig = config;
            return config;
        }
        autoScroll() {
            this.autoScrollRequested = true;
        }
        jump(path) {
            const pathChanged = path !== this.path, isForwardStep = pathChanged && path.length == this.path.length + 2;
            this.setPath(path);
            this.showGround();
            if (pathChanged) {
                const playedMyself = this.playedLastMoveMyself();
                if (this.study)
                    this.study.setPath(path, this.node, playedMyself);
                if (isForwardStep) {
                    if (!this.node.uci)
                        this.sound.move();
                    // initial position
                    else if (!playedMyself) {
                        if (this.node.san.includes('x'))
                            this.sound.capture();
                        else
                            this.sound.move();
                    }
                    if (/\+|#/.test(this.node.san))
                        this.sound.check();
                }
                this.threatMode(false);
                this.ceval.stop();
                this.startCeval();
                node(this.node);
            }
            this.justPlayed = this.justDropped = this.justCaptured = undefined;
            this.explorer.setNode();
            this.updateHref();
            this.autoScroll();
            cancel(this);
            if (pathChanged) {
                if (this.retro)
                    this.retro.onJump();
                if (this.practice)
                    this.practice.onJump();
                if (this.study)
                    this.study.onJump();
            }
            if (this.music)
                this.music.jump(this.node);
            lichess.pubsub.emit('ply', this.node.ply);
        }
        canJumpTo(path) {
            return !this.study || this.study.canJumpTo(path);
        }
        userJumpIfCan(path) {
            if (this.canJumpTo(path))
                this.userJump(path);
        }
        mainlinePathToPly(ply) {
            return takePathWhile(this.mainline, n => n.ply <= ply);
        }
        jumpToGlyphSymbol(color, symbol) {
            const node = nextGlyphSymbol(color, symbol, this.mainline, this.node.ply);
            if (node)
                this.jumpToMain(node.ply);
            this.redraw();
        }
        reloadData(data, merge) {
            this.initialize(data, merge);
            this.redirecting = false;
            this.setPath(root);
            this.instanciateCeval();
            this.instanciateEvalCache();
            this.cgVersion.js++;
        }
        changePgn(pgn) {
            this.redirecting = true;
            json('/analysis/pgn', {
                method: 'post',
                body: form({ pgn }),
            })
                .then((data) => {
                this.reloadData(data, false);
                this.userJump(this.mainlinePathToPly(this.tree.lastPly()));
                this.redraw();
            }, error => {
                console.log(error);
                this.redirecting = false;
                this.redraw();
            });
        }
        changeFen(fen) {
            this.redirecting = true;
            window.location.href =
                '/analysis/' +
                    this.data.game.variant.key +
                    '/' +
                    encodeURIComponent(fen).replace(/%20/g, '_').replace(/%2F/g, '/');
        }
        preparePremoving() {
            this.chessground.set({
                turnColor: this.chessground.state.movable.color,
                movable: {
                    color: opposite(this.chessground.state.movable.color),
                },
                premovable: {
                    enabled: true,
                },
            });
        }
        addNode(node, path) {
            const newPath = this.tree.addNode(node, path);
            if (!newPath) {
                console.log("Can't addNode", node, path);
                return this.redraw();
            }
            this.jump(newPath);
            this.redraw();
            this.chessground.playPremove();
        }
        addDests(dests, path) {
            this.tree.addDests(dests, path);
            if (path === this.path) {
                this.showGround();
                if (this.outcome())
                    this.ceval.stop();
            }
            this.withCg(cg => cg.playPremove());
        }
        deleteNode(path) {
            const node = this.tree.nodeAtPath(path);
            if (!node)
                return;
            const count = countChildrenAndComments(node);
            if ((count.nodes >= 10 || count.comments > 0) &&
                !confirm('Delete ' +
                    plural('move', count.nodes) +
                    (count.comments ? ' and ' + plural('comment', count.comments) : '') +
                    '?'))
                return;
            this.tree.deleteNodeAt(path);
            if (contains(this.path, path))
                this.userJump(init(path));
            else
                this.jump(this.path);
            if (this.study)
                this.study.deleteNode(path);
        }
        promote(path, toMainline) {
            this.tree.promoteAt(path, toMainline);
            this.jump(path);
            if (this.study)
                this.study.promote(path, toMainline);
        }
        forceVariation(path, force) {
            this.tree.forceVariationAt(path, force);
            this.jump(path);
            if (this.study)
                this.study.forceVariation(path, force);
        }
        reset() {
            this.showGround();
            this.redraw();
        }
        encodeNodeFen() {
            return this.node.fen.replace(/\s/g, '_');
        }
        currentEvals() {
            return {
                server: this.node.eval,
                client: this.node.ceval,
            };
        }
        nextNodeBest() {
            return withMainlineChild(this.node, (n) => (n.eval ? n.eval.best : undefined));
        }
        instanciateCeval() {
            if (this.ceval)
                this.ceval.destroy();
            const cfg = {
                variant: this.data.game.variant,
                standardMaterial: !this.data.game.initialFen ||
                    parseFen(this.data.game.initialFen).unwrap(setup => COLORS.every(color => {
                        const board = setup.board;
                        const pieces = board[color];
                        const promotedPieces = Math.max(board.queen.intersect(pieces).size() - 1, 0) +
                            Math.max(board.rook.intersect(pieces).size() - 2, 0) +
                            Math.max(board.knight.intersect(pieces).size() - 2, 0) +
                            Math.max(board.bishop.intersect(pieces).intersect(SquareSet.lightSquares()).size() - 1, 0) +
                            Math.max(board.bishop.intersect(pieces).intersect(SquareSet.darkSquares()).size() - 1, 0);
                        return board.pawn.intersect(pieces).size() + promotedPieces <= 8;
                    }), _ => false),
                possible: !this.embed && (this.synthetic || !playable(this.data)),
                emit: (ev, work) => {
                    this.onNewCeval(ev, work.path, work.threatMode);
                },
                setAutoShapes: this.setAutoShapes,
                redraw: this.redraw,
            };
            if (this.opts.study && this.opts.practice) {
                cfg.storageKeyPrefix = 'practice';
                cfg.multiPvDefault = 1;
            }
            this.ceval = cevalCtrl(cfg);
        }
        getCeval() {
            return this.ceval;
        }
        outcome(node) {
            return this.position(node || this.node).unwrap(pos => pos.outcome(), _ => undefined);
        }
        position(node) {
            const setup = parseFen(node.fen).unwrap();
            return setupPosition(lichessVariantRules(this.data.game.variant.key), setup);
        }
        canUseCeval() {
            return !this.node.threefold && !this.outcome();
        }
        cevalReset() {
            this.ceval.stop();
            if (!this.ceval.enabled())
                this.ceval.toggle();
            this.startCeval();
            this.redraw();
        }
        showEvalGauge() {
            return this.hasAnyComputerAnalysis() && this.showGauge() && !this.outcome() && this.showComputer();
        }
        hasAnyComputerAnalysis() {
            return this.data.analysis ? true : this.ceval.enabled();
        }
        resetAutoShapes() {
            if (this.showAutoShapes() || this.showMoveAnnotation())
                this.setAutoShapes();
            else
                this.chessground && this.chessground.setAutoShapes([]);
        }
        onToggleComputer() {
            if (!this.showComputer()) {
                this.tree.removeComputerVariations();
                if (this.ceval.enabled())
                    this.toggleCeval();
                this.chessground && this.chessground.setAutoShapes([]);
            }
            else
                this.resetAutoShapes();
        }
        mergeAnalysisData(data) {
            if (this.study && this.study.data.chapter.id !== data.ch)
                return;
            this.tree.merge(data.tree);
            if (!this.showComputer())
                this.tree.removeComputerVariations();
            this.data.analysis = data.analysis;
            if (data.analysis)
                data.analysis.partial = !!findInMainline(data.tree, n => !n.eval && !!n.children.length);
            if (data.division)
                this.data.game.division = data.division;
            if (this.retro)
                this.retro.onMergeAnalysisData();
            if (this.study)
                this.study.serverEval.onMergeAnalysisData();
            lichess.pubsub.emit('analysis.server.progress', this.data);
            this.redraw();
        }
        playUci(uci) {
            const move = parseUci(uci);
            const to = makeSquare(move.to);
            if (isNormal(move)) {
                const piece = this.chessground.state.pieces.get(makeSquare(move.from));
                const capture = this.chessground.state.pieces.get(to);
                this.sendMove(makeSquare(move.from), to, capture && piece && capture.color !== piece.color ? capture : undefined, move.promotion);
            }
            else
                this.chessground.newPiece({
                    color: this.chessground.state.movable.color,
                    role: move.role,
                }, to);
        }
        explorerMove(uci) {
            this.playUci(uci);
            this.explorer.loading(true);
        }
        playBestMove() {
            const uci = this.nextNodeBest() || (this.node.ceval && this.node.ceval.pvs[0].moves[0]);
            if (uci)
                this.playUci(uci);
        }
        canEvalGet() {
            if (this.node.ply >= 15 && !this.opts.study)
                return false;
            // cloud eval does not support threefold repetition
            const fens = new Set();
            for (let i = this.nodeList.length - 1; i >= 0; i--) {
                const node = this.nodeList[i];
                const fen = node.fen.split(' ').slice(0, 4).join(' ');
                if (fens.has(fen))
                    return false;
                if (node.san && sanIrreversible(this.data.game.variant.key, node.san))
                    return true;
                fens.add(fen);
            }
            return true;
        }
        instanciateEvalCache() {
            this.evalCache = make$5({
                variant: this.data.game.variant.key,
                canGet: () => this.canEvalGet(),
                canPut: () => !!(this.data.evalPut &&
                    this.canEvalGet() &&
                    // if not in study, only put decent opening moves
                    (this.opts.study || (!this.node.ceval.mate && Math.abs(this.node.ceval.cp) < 99))),
                getNode: () => this.node,
                send: this.opts.socketSend,
                receive: this.onNewCeval,
            });
        }
        restartPractice() {
            this.practice = undefined;
            this.togglePractice();
        }
        withCg(f) {
            if (this.chessground && this.cgVersion.js === this.cgVersion.dom)
                return f(this.chessground);
            return undefined;
        }
    }

    /* Based on: */
    /*!
     * hoverIntent v1.10.0 // 2019.02.25 // jQuery v1.7.0+
     * http://briancherne.github.io/jquery-hoverIntent/
     *
     * You may use hoverIntent under the terms of the MIT license. Basically that
     * means you are free to use hoverIntent as long as this header is left intact.
     * Copyright 2007-2019 Brian Cherne
     */
    function menuHover () {
        if ('ontouchstart' in window)
            return;
        const interval = 200, sensitivity = 8;
        // current X and Y position of mouse, updated during mousemove tracking (shared across instances)
        let cX, cY;
        // saves the current pointer position coordinates based on the given mousemove event
        const track = (ev) => {
            cX = ev.pageX;
            cY = ev.pageY;
        };
        // state properties:
        // timeoutId = timeout ID, reused for tracking mouse position and delaying "out" handler
        // isActive = plugin state, true after `over` is called just until `out` is called
        // pX, pY = previously-measured pointer coordinates, updated at each polling interval
        // event = string representing the namespaced event used for mouse tracking
        let state = {};
        $('#topnav.hover').each(function () {
            const $el = $(this).removeClass('hover'), handler = () => $el.toggleClass('hover');
            // compares current and previous mouse positions
            const compare = () => {
                // compare mouse positions to see if pointer has slowed enough to trigger `over` function
                if (Math.sqrt((state.pX - cX) * (state.pX - cX) + (state.pY - cY) * (state.pY - cY)) < sensitivity) {
                    $el.off(state.event, track);
                    delete state.timeoutId;
                    // set hoverIntent state as active for this element (permits `out` handler to trigger)
                    state.isActive = true;
                    handler();
                }
                else {
                    // set previous coordinates for next comparison
                    state.pX = cX;
                    state.pY = cY;
                    // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
                    state.timeoutId = setTimeout(compare, interval);
                }
            };
            // A private function for handling mouse 'hovering'
            const handleHover = function (ev) {
                // clear any existing timeout
                if (state.timeoutId)
                    state.timeoutId = clearTimeout(state.timeoutId);
                // namespaced event used to register and unregister mousemove tracking
                const mousemove = (state.event = 'mousemove');
                // handle the event, based on its type
                if (ev.type == 'mouseover') {
                    // do nothing if already active or a button is pressed (dragging a piece)
                    if (state.isActive || ev.buttons)
                        return;
                    // set "previous" X and Y position based on initial entry point
                    state.pX = ev.pageX;
                    state.pY = ev.pageY;
                    // update "current" X and Y position based on mousemove
                    $el.off(mousemove, track).on(mousemove, track);
                    // start polling interval (self-calling timeout) to compare mouse coordinates over time
                    state.timeoutId = setTimeout(compare, interval);
                }
                else {
                    // "mouseleave"
                    // do nothing if not already active
                    if (!state.isActive)
                        return;
                    // unbind expensive mousemove event
                    $el.off(mousemove, track);
                    // if hoverIntent state is true, then call the mouseOut function after the specified delay
                    state = {};
                    handler();
                }
            };
            $el.on('mouseover', handleHover).on('mouseleave', handleHover);
        });
    }

    function status(ctrl) {
        const noarg = ctrl.trans.noarg, d = ctrl.data;
        switch (d.game.status.name) {
            case 'started':
                return noarg('playingRightNow');
            case 'aborted':
                return noarg('gameAborted');
            case 'mate':
                return noarg('checkmate');
            case 'resign':
                return noarg(d.game.winner == 'white' ? 'blackResigned' : 'whiteResigned');
            case 'stalemate':
                return noarg('stalemate');
            case 'timeout':
                switch (d.game.winner) {
                    case 'white':
                        return noarg('blackLeftTheGame');
                    case 'black':
                        return noarg('whiteLeftTheGame');
                }
                return noarg('draw');
            case 'draw':
                return noarg('draw');
            case 'outoftime':
                return `${d.game.turns % 2 === 0 ? noarg('whiteTimeOut') : noarg('blackTimeOut')}${d.game.winner ? '' : ` • ${noarg('draw')}`}`;
            case 'noStart':
                return (d.game.winner == 'white' ? 'Black' : 'White') + " didn't move";
            case 'cheat':
                return noarg('cheatDetected');
            case 'variantEnd':
                switch (d.game.variant.key) {
                    case 'kingOfTheHill':
                        return noarg('kingInTheCenter');
                    case 'threeCheck':
                        return noarg('threeChecks');
                }
                return noarg('variantEnding');
            case 'unknownFinish':
                return 'Finished';
            default:
                return d.game.status.name;
        }
    }

    function renderClocks(ctrl) {
        if (ctrl.embed)
            return;
        const node = ctrl.node, clock = node.clock;
        if (!clock && clock !== 0)
            return;
        const whitePov = ctrl.bottomIsWhite(), parentClock = ctrl.tree.getParentClock(node, ctrl.path), isWhiteTurn = node.ply % 2 === 0, centis = [parentClock, clock];
        if (!isWhiteTurn)
            centis.reverse();
        const study = ctrl.study, relay = study && study.data.chapter.relay;
        if (relay && relay.lastMoveAt && relay.path === ctrl.path && ctrl.path !== '' && !isFinished(study.data.chapter)) {
            const spent = (Date.now() - relay.lastMoveAt) / 10;
            const i = isWhiteTurn ? 0 : 1;
            if (centis[i])
                centis[i] = Math.max(0, centis[i] - spent);
        }
        const showTenths = !ctrl.study || !ctrl.study.relay;
        return [
            renderClock(centis[0], isWhiteTurn, whitePov ? 'bottom' : 'top', showTenths),
            renderClock(centis[1], !isWhiteTurn, whitePov ? 'top' : 'bottom', showTenths),
        ];
    }
    function renderClock(centis, active, cls, showTenths) {
        return h('div.analyse__clock.' + cls, {
            class: { active },
        }, clockContent(centis, showTenths));
    }
    function clockContent(centis, showTenths) {
        if (!centis && centis !== 0)
            return ['-'];
        const date = new Date(centis * 10), millis = date.getUTCMilliseconds(), sep = ':', baseStr = pad2(date.getUTCMinutes()) + sep + pad2(date.getUTCSeconds());
        if (!showTenths || centis >= 360000)
            return [Math.floor(centis / 360000) + sep + baseStr];
        return centis >= 6000 ? [baseStr] : [baseStr, h('tenths', '.' + Math.floor(millis / 100).toString())];
    }
    function pad2(num) {
        return (num < 10 ? '0' : '') + num;
    }

    function onMyTurn(ctrl, fctrl, cNodes) {
        const firstNode = cNodes[0];
        if (!firstNode)
            return;
        const fcs = fctrl.findStartingWithNode(firstNode);
        if (!fcs.length)
            return;
        const lines = fcs.filter(function (fc) {
            return fc.length > 1;
        });
        return h('button.on-my-turn.button.text', {
            attrs: dataIcon('E'),
            hook: bind$1('click', _ => fctrl.playAndSave(firstNode)),
        }, [
            h('span', [
                h('strong', ctrl.trans('playX', fixCrazySan(cNodes[0].san))),
                lines.length
                    ? h('span', ctrl.trans.plural('andSaveNbPremoveLines', lines.length))
                    : h('span', ctrl.trans.noarg('noConditionalPremoves')),
            ]),
        ]);
    }
    function makeCnodes(ctrl, fctrl) {
        const afterPly = ctrl.tree.getCurrentNodesAfterPly(ctrl.nodeList, ctrl.mainline, ctrl.data.game.turns);
        return fctrl.truncate(afterPly.map(node => ({
            ply: node.ply,
            fen: node.fen,
            uci: node.uci,
            san: node.san,
            check: node.check,
        })));
    }
    function forecastView (ctrl, fctrl) {
        const cNodes = makeCnodes(ctrl, fctrl);
        const isCandidate = fctrl.isCandidate(cNodes);
        return h('div.forecast', {
            class: { loading: fctrl.loading() },
        }, [
            fctrl.loading() ? h('div.overlay', spinner()) : null,
            h('div.box', [
                h('div.top', ctrl.trans.noarg('conditionalPremoves')),
                h('div.list', fctrl.list().map(function (nodes, i) {
                    return h('div.entry.text', {
                        attrs: dataIcon('G'),
                    }, [
                        h('a.del', {
                            hook: bind$1('click', e => {
                                fctrl.removeIndex(i);
                                e.stopPropagation();
                            }, ctrl.redraw),
                        }, 'x'),
                        h('sans', renderNodesHtml(nodes)),
                    ]);
                })),
                h('button.add.text', {
                    class: { enabled: isCandidate },
                    attrs: dataIcon(isCandidate ? 'O' : ''),
                    hook: bind$1('click', _ => fctrl.addNodes(makeCnodes(ctrl, fctrl)), ctrl.redraw),
                }, [
                    isCandidate
                        ? h('span', [h('span', ctrl.trans.noarg('addCurrentVariation')), h('sans', renderNodesHtml(cNodes))])
                        : h('span', ctrl.trans.noarg('playVariationToCreateConditionalPremoves')),
                ]),
            ]),
            fctrl.onMyTurn ? onMyTurn(ctrl, fctrl, cNodes) : null,
        ]);
    }

    const eventNames = ['mousedown', 'touchstart'];
    const oKeys = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    function crazyView (ctrl, color, position) {
        if (!ctrl.node.crazy)
            return;
        const pocket = ctrl.node.crazy.pockets[color === 'white' ? 0 : 1];
        const dropped = ctrl.justDropped;
        const captured = ctrl.justCaptured;
        if (captured)
            captured.role = captured.promoted ? 'pawn' : captured.role;
        const activeColor = color === ctrl.turnColor();
        const usable = !ctrl.embed && activeColor;
        return h(`div.pocket.is2d.pocket-${position}.pos-${ctrl.bottomColor()}`, {
            class: { usable },
            hook: onInsert(el => {
                if (ctrl.embed)
                    return;
                eventNames.forEach(name => {
                    el.addEventListener(name, e => drag(ctrl, color, e));
                });
            }),
        }, oKeys.map(role => {
            let nb = pocket[role] || 0;
            if (activeColor) {
                if (dropped === role)
                    nb--;
                if (captured && captured.role === role)
                    nb++;
            }
            return h('div.pocket-c1', h('div.pocket-c2', h('piece.' + role + '.' + color, {
                attrs: {
                    'data-role': role,
                    'data-color': color,
                    'data-nb': nb,
                },
            })));
        }));
    }

    function isOpening(m) {
        return !!m.isOpening;
    }
    function isTablebase(m) {
        return !!m.tablebase;
    }
    function hasDtz(m) {
        return m.dtz !== null;
    }

    function resultBar(move) {
        const sum = move.white + move.draws + move.black;
        function section(key) {
            const percent = (move[key] * 100) / sum;
            return percent === 0
                ? null
                : h('span.' + key, {
                    attrs: { style: 'width: ' + Math.round((move[key] * 1000) / sum) / 10 + '%' },
                }, percent > 12 ? Math.round(percent) + (percent > 20 ? '%' : '') : '');
        }
        return h('div.bar', ['white', 'draws', 'black'].map(section));
    }
    function moveTableAttributes(ctrl, fen) {
        return {
            attrs: { 'data-fen': fen },
            hook: {
                insert(vnode) {
                    const el = vnode.elm;
                    el.addEventListener('mouseover', e => {
                        ctrl.explorer.setHovering($(el).attr('data-fen'), $(e.target)
                            .parents('tr')
                            .attr('data-uci'));
                    });
                    el.addEventListener('mouseout', _ => {
                        ctrl.explorer.setHovering($(el).attr('data-fen'), null);
                    });
                    el.addEventListener('mousedown', e => {
                        const uci = $(e.target)
                            .parents('tr')
                            .attr('data-uci');
                        if (uci)
                            ctrl.explorerMove(uci);
                    });
                },
                postpatch(old) {
                    setTimeout(() => {
                        const el = old.elm;
                        ctrl.explorer.setHovering($(el).attr('data-fen'), $(el).find('tr:hover').attr('data-uci'));
                    }, 100);
                },
            },
        };
    }
    function showMoveTable(ctrl, data) {
        if (!data.moves.length)
            return null;
        const trans = ctrl.trans.noarg;
        return h('table.moves', [
            h('thead', [
                h('tr', [h('th.title', trans('move')), h('th.title', trans('games')), h('th.title', trans('whiteDrawBlack'))]),
            ]),
            h('tbody', moveTableAttributes(ctrl, data.fen), data.moves.map(move => {
                return h('tr', {
                    key: move.uci,
                    attrs: {
                        'data-uci': move.uci,
                        title: ctrl.trans('averageRatingX', move.averageRating),
                    },
                }, [
                    h('td', move.san[0] === 'P' ? move.san.slice(1) : move.san),
                    h('td', numberFormat(move.white + move.draws + move.black)),
                    h('td', resultBar(move)),
                ]);
            })),
        ]);
    }
    function showResult(winner) {
        if (winner === 'white')
            return h('result.white', '1-0');
        if (winner === 'black')
            return h('result.black', '0-1');
        return h('result.draws', '½-½');
    }
    function showGameTable(ctrl, title, games) {
        if (!ctrl.explorer.withGames || !games.length)
            return null;
        const openedId = ctrl.explorer.gameMenu();
        return h('table.games', [
            h('thead', [h('tr', [h('th.title', { attrs: { colspan: 4 } }, title)])]),
            h('tbody', {
                hook: bind$1('click', e => {
                    const $tr = $(e.target).parents('tr');
                    if (!$tr.length)
                        return;
                    const id = $tr.data('id');
                    if (ctrl.study && ctrl.study.members.canContribute()) {
                        ctrl.explorer.gameMenu(id);
                        ctrl.redraw();
                    }
                    else
                        openGame(ctrl, id);
                }),
            }, games.map(game => {
                return openedId === game.id
                    ? gameActions(ctrl, game)
                    : h('tr', {
                        key: game.id,
                        attrs: { 'data-id': game.id },
                    }, [
                        h('td', [game.white, game.black].map(p => h('span', '' + p.rating))),
                        h('td', [game.white, game.black].map(p => h('span', p.name))),
                        h('td', showResult(game.winner)),
                        h('td', [game.year]),
                    ]);
            })),
        ]);
    }
    function openGame(ctrl, gameId) {
        const orientation = ctrl.chessground.state.orientation, fenParam = ctrl.node.ply > 0 ? '?fen=' + ctrl.node.fen : '';
        let url = '/' + gameId + '/' + orientation + fenParam;
        if (ctrl.explorer.config.data.db.selected() === 'masters')
            url = '/import/master' + url;
        window.open(url, '_blank', 'noopener');
    }
    function gameActions(ctrl, game) {
        function send(insert) {
            ctrl.study.explorerGame(game.id, insert);
            ctrl.explorer.gameMenu(null);
            ctrl.redraw();
        }
        return h('tr', {
            key: game.id + '-m',
        }, [
            h('td.game_menu', {
                attrs: { colspan: 4 },
            }, [
                h('div.game_title', `${game.white.name} - ${game.black.name}, ${showResult(game.winner).text}, ${game.year}`),
                h('div.menu', [
                    h('a.text', {
                        attrs: dataIcon('v'),
                        hook: bind$1('click', _ => openGame(ctrl, game.id)),
                    }, 'View'),
                    ...(ctrl.study
                        ? [
                            h('a.text', {
                                attrs: dataIcon('c'),
                                hook: bind$1('click', _ => send(false), ctrl.redraw),
                            }, 'Cite'),
                            h('a.text', {
                                attrs: dataIcon('O'),
                                hook: bind$1('click', _ => send(true), ctrl.redraw),
                            }, 'Insert'),
                        ]
                        : []),
                    h('a.text', {
                        attrs: dataIcon('L'),
                        hook: bind$1('click', _ => ctrl.explorer.gameMenu(null), ctrl.redraw),
                    }, 'Close'),
                ]),
            ]),
        ]);
    }
    function showTablebase(ctrl, fen, title, moves) {
        if (!moves.length)
            return [];
        return [
            h('div.title', title),
            h('table.tablebase', [
                h('tbody', moveTableAttributes(ctrl, fen), moves.map(move => {
                    return h('tr', {
                        key: move.uci,
                        attrs: { 'data-uci': move.uci },
                    }, [h('td', move.san), h('td', [showDtz(ctrl, fen, move), showDtm(ctrl, fen, move)])]);
                })),
            ]),
        ];
    }
    function showDtm(ctrl, fen, move) {
        if (move.dtm)
            return h('result.' + winnerOf(fen, move), {
                attrs: {
                    title: ctrl.trans.plural('mateInXHalfMoves', Math.abs(move.dtm)) + ' (Depth To Mate)',
                },
            }, 'DTM ' + Math.abs(move.dtm));
        return undefined;
    }
    function showDtz(ctrl, fen, move) {
        const trans = ctrl.trans.noarg;
        if (move.checkmate)
            return h('result.' + winnerOf(fen, move), trans('checkmate'));
        else if (move.variant_win)
            return h('result.' + winnerOf(fen, move), trans('variantLoss'));
        else if (move.variant_loss)
            return h('result.' + winnerOf(fen, move), trans('variantWin'));
        else if (move.stalemate)
            return h('result.draws', trans('stalemate'));
        else if (move.insufficient_material)
            return h('result.draws', trans('insufficientMaterial'));
        else if (move.dtz === null)
            return null;
        else if (move.dtz === 0)
            return h('result.draws', trans('draw'));
        else if (move.zeroing)
            return move.san.includes('x')
                ? h('result.' + winnerOf(fen, move), trans('capture'))
                : h('result.' + winnerOf(fen, move), trans('pawnMove'));
        return h('result.' + winnerOf(fen, move), {
            attrs: {
                title: ctrl.trans.plural('nextCaptureOrPawnMoveInXHalfMoves', Math.abs(move.dtz)),
            },
        }, 'DTZ ' + Math.abs(move.dtz));
    }
    function closeButton(ctrl) {
        return h('button.button.button-empty.text', {
            attrs: dataIcon('L'),
            hook: bind$1('click', ctrl.toggleExplorer, ctrl.redraw),
        }, ctrl.trans.noarg('close'));
    }
    function showEmpty(ctrl, opening) {
        return h('div.data.empty', [
            h('div.title', h('span', {
                attrs: opening ? { title: opening && `${opening.eco} ${opening.name}` } : {},
            }, opening ? [h('strong', opening.eco), ' ', opening.name] : [showTitle(ctrl, ctrl.data.game.variant)])),
            h('div.message', [
                h('strong', ctrl.trans.noarg('noGameFound')),
                ctrl.explorer.config.fullHouse()
                    ? null
                    : h('p.explanation', ctrl.trans.noarg('maybeIncludeMoreGamesFromThePreferencesMenu')),
                closeButton(ctrl),
            ]),
        ]);
    }
    function showGameEnd(ctrl, title) {
        return h('div.data.empty', [
            h('div.title', ctrl.trans.noarg('gameOver')),
            h('div.message', [h('i', { attrs: dataIcon('') }), h('h3', title), closeButton(ctrl)]),
        ]);
    }
    let lastShow;
    function show(ctrl) {
        const trans = ctrl.trans.noarg, data = ctrl.explorer.current();
        if (data && isOpening(data)) {
            const moveTable = showMoveTable(ctrl, data), recentTable = showGameTable(ctrl, trans('recentGames'), data.recentGames || []), topTable = showGameTable(ctrl, trans('topGames'), data.topGames || []);
            if (moveTable || recentTable || topTable)
                lastShow = h('div.data', [
                    data &&
                        data.opening &&
                        h('div.title', h('span', {
                            attrs: data.opening ? { title: data.opening && `${data.opening.eco} ${data.opening.name}` } : {},
                        }, [h('strong', data.opening.eco), ' ', data.opening.name])),
                    moveTable,
                    topTable,
                    recentTable,
                ]);
            else
                lastShow = showEmpty(ctrl, data.opening);
        }
        else if (data && isTablebase(data)) {
            const halfmoves = parseInt(data.fen.split(' ')[4], 10) + 1;
            const zeroed = halfmoves === 1;
            const moves = data.moves;
            const immediateWin = (m) => m.checkmate || m.variant_loss;
            const dtz = (m) => m.checkmate || m.variant_win || m.variant_loss || m.zeroing ? 0 : m.dtz;
            const row = (title, moves) => showTablebase(ctrl, data.fen, title, moves);
            if (moves.length)
                lastShow = h('div.data', [
                    ...row(trans('winning'), moves.filter(m => immediateWin(m) || (m.wdl === -2 && hasDtz(m) && (zeroed || dtz(m) - halfmoves > -100)))),
                    ...row(trans('unknown'), moves.filter(m => !immediateWin(m) &&
                        !m.variant_win &&
                        !m.insufficient_material &&
                        !m.stalemate &&
                        m.wdl === null &&
                        m.dtz === null)),
                    ...row('Winning or 50 moves by prior mistake', moves.filter(m => m.wdl === -2 && hasDtz(m) && !zeroed && dtz(m) - halfmoves === -100)),
                    ...row(trans('winPreventedBy50MoveRule'), moves.filter(m => hasDtz(m) && (m.wdl === -1 || (m.wdl === -2 && !zeroed && dtz(m) - halfmoves < -100)))),
                    ...row(trans('drawn'), moves.filter(m => !immediateWin(m) && !m.variant_win && (m.insufficient_material || m.stalemate || m.wdl === 0))),
                    ...row(trans('lossSavedBy50MoveRule'), moves.filter(m => hasDtz(m) && (m.wdl === 1 || (m.wdl === 2 && !zeroed && dtz(m) + halfmoves > 100)))),
                    ...row('Losing or 50 moves by prior mistake', moves.filter(m => m.wdl === 2 && hasDtz(m) && !zeroed && dtz(m) + halfmoves === 100)),
                    ...row(trans('losing'), moves.filter(m => m.variant_win || (m.wdl === 2 && hasDtz(m) && (zeroed || dtz(m) + halfmoves < 100)))),
                ]);
            else if (data.checkmate)
                lastShow = showGameEnd(ctrl, trans('checkmate'));
            else if (data.stalemate)
                lastShow = showGameEnd(ctrl, trans('stalemate'));
            else if (data.variant_win || data.variant_loss)
                lastShow = showGameEnd(ctrl, trans('variantEnding'));
            else
                lastShow = showEmpty(ctrl);
        }
        return lastShow;
    }
    function showTitle(ctrl, variant) {
        if (variant.key === 'standard' || variant.key === 'fromPosition')
            return ctrl.trans.noarg('openingExplorer');
        return ctrl.trans('xOpeningExplorer', variant.name);
    }
    function showConfig(ctrl) {
        return h('div.config', [h('div.title', showTitle(ctrl, ctrl.data.game.variant))].concat(view$j(ctrl.explorer.config)));
    }
    function showFailing(ctrl) {
        return h('div.data.empty', [
            h('div.title', showTitle(ctrl, ctrl.data.game.variant)),
            h('div.failing.message', [
                h('h3', 'Oops, sorry!'),
                h('p.explanation', 'The explorer is temporarily out of service. Try again soon!'),
                closeButton(ctrl),
            ]),
        ]);
    }
    let lastFen = '';
    function explorerView (ctrl) {
        const explorer = ctrl.explorer;
        if (!explorer.enabled())
            return;
        const data = explorer.current(), config = explorer.config, configOpened = config.data.open(), loading = !configOpened && (explorer.loading() || (!data && !explorer.failing())), content = configOpened ? showConfig(ctrl) : explorer.failing() ? showFailing(ctrl) : show(ctrl);
        return h('section.explorer-box.sub-box', {
            class: {
                loading,
                config: configOpened,
                reduced: !configOpened && (explorer.failing() || explorer.movesAway() > 2),
            },
            hook: {
                insert: vnode => (vnode.elm.scrollTop = 0),
                postpatch(_, vnode) {
                    if (!data || lastFen === data.fen)
                        return;
                    vnode.elm.scrollTop = 0;
                    lastFen = data.fen;
                },
            },
        }, [
            h('div.overlay'),
            content,
            !content || explorer.failing()
                ? null
                : h('span.toconf', {
                    attrs: dataIcon(configOpened ? 'L' : '%'),
                    hook: bind$1('click', () => ctrl.explorer.config.toggleOpen(), ctrl.redraw),
                }),
        ]);
    }

    function skipOrViewSolution(ctrl) {
        return h('div.choices', [
            h('a', {
                hook: bind$1('click', ctrl.viewSolution, ctrl.redraw),
            }, ctrl.noarg('viewTheSolution')),
            h('a', {
                hook: bind$1('click', ctrl.skip),
            }, ctrl.noarg('skipThisMove')),
        ]);
    }
    function jumpToNext(ctrl) {
        return h('a.half.continue', {
            hook: bind$1('click', ctrl.jumpToNext),
        }, [h('i', { attrs: dataIcon('G') }), ctrl.noarg('next')]);
    }
    const minDepth$1 = 8;
    const maxDepth = 18;
    function renderEvalProgress$1(node) {
        return h('div.progress', h('div', {
            attrs: {
                style: `width: ${node.ceval ? (100 * Math.max(0, node.ceval.depth - minDepth$1)) / (maxDepth - minDepth$1) + '%' : 0}`,
            },
        }));
    }
    const feedback = {
        find(ctrl) {
            return [
                h('div.player', [
                    h('div.no-square', h('piece.king.' + ctrl.color)),
                    h('div.instruction', [
                        h('strong', ctrl.trans.vdom('xWasPlayed', h('move', renderIndexAndMove({
                            withDots: true,
                            showGlyphs: true,
                            showEval: false,
                        }, ctrl.current().fault.node)))),
                        h('em', ctrl.noarg(ctrl.color === 'white' ? 'findBetterMoveForWhite' : 'findBetterMoveForBlack')),
                        skipOrViewSolution(ctrl),
                    ]),
                ]),
            ];
        },
        // user has browsed away from the move to solve
        offTrack(ctrl) {
            return [
                h('div.player', [
                    h('div.icon.off', '!'),
                    h('div.instruction', [
                        h('strong', ctrl.noarg('youBrowsedAway')),
                        h('div.choices.off', [
                            h('a', {
                                hook: bind$1('click', ctrl.jumpToNext),
                            }, ctrl.noarg('resumeLearning')),
                        ]),
                    ]),
                ]),
            ];
        },
        fail(ctrl) {
            return [
                h('div.player', [
                    h('div.icon', '✗'),
                    h('div.instruction', [
                        h('strong', ctrl.noarg('youCanDoBetter')),
                        h('em', ctrl.noarg(ctrl.color === 'white' ? 'tryAnotherMoveForWhite' : 'tryAnotherMoveForBlack')),
                        skipOrViewSolution(ctrl),
                    ]),
                ]),
            ];
        },
        win(ctrl) {
            return [
                h('div.half.top', h('div.player', [h('div.icon', '✓'), h('div.instruction', h('strong', ctrl.noarg('goodMove')))])),
                jumpToNext(ctrl),
            ];
        },
        view(ctrl) {
            return [
                h('div.half.top', h('div.player', [
                    h('div.icon', '✓'),
                    h('div.instruction', [
                        h('strong', ctrl.noarg('solution')),
                        h('em', ctrl.trans.vdom('bestWasX', h('strong', renderIndexAndMove({
                            withDots: true,
                            showEval: false,
                        }, ctrl.current().solution.node)))),
                    ]),
                ])),
                jumpToNext(ctrl),
            ];
        },
        eval(ctrl) {
            return [
                h('div.half.top', h('div.player.center', [
                    h('div.instruction', [h('strong', ctrl.noarg('evaluatingYourMove')), renderEvalProgress$1(ctrl.node())]),
                ])),
            ];
        },
        end(ctrl, hasFullComputerAnalysis) {
            if (!hasFullComputerAnalysis())
                return [
                    h('div.half.top', h('div.player', [h('div.icon', spinner()), h('div.instruction', ctrl.noarg('waitingForAnalysis'))])),
                ];
            const nothing = !ctrl.completion()[1];
            return [
                h('div.player', [
                    h('div.no-square', h('piece.king.' + ctrl.color)),
                    h('div.instruction', [
                        h('em', nothing
                            ? ctrl.noarg(ctrl.color === 'white' ? 'noMistakesFoundForWhite' : 'noMistakesFoundForBlack')
                            : ctrl.noarg(ctrl.color === 'white' ? 'doneReviewingWhiteMistakes' : 'doneReviewingBlackMistakes')),
                        h('div.choices.end', [
                            nothing
                                ? null
                                : h('a', {
                                    hook: bind$1('click', ctrl.reset),
                                }, ctrl.noarg('doItAgain')),
                            h('a', {
                                hook: bind$1('click', () => ctrl.flip()),
                            }, ctrl.noarg(ctrl.color === 'white' ? 'reviewBlackMistakes' : 'reviewWhiteMistakes')),
                        ]),
                    ]),
                ]),
            ];
        },
    };
    function renderFeedback$1(root, fb) {
        const ctrl = root.retro;
        const current = ctrl.current();
        if (ctrl.isSolving() && current && root.path !== current.prev.path)
            return feedback.offTrack(ctrl);
        if (fb === 'find')
            return current ? feedback.find(ctrl) : feedback.end(ctrl, root.hasFullComputerAnalysis);
        return feedback[fb](ctrl);
    }
    function retroView (root) {
        const ctrl = root.retro;
        if (!ctrl)
            return;
        const fb = ctrl.feedback(), completion = ctrl.completion();
        return h('div.retro-box.training-box.sub-box', [
            h('div.title', [
                h('span', ctrl.noarg('learnFromYourMistakes')),
                h('span', Math.min(completion[0] + 1, completion[1]) + ' / ' + completion[1]),
            ]),
            h('div.feedback.' + fb, renderFeedback$1(root, fb)),
        ]);
    }

    function commentBest(c, root, ctrl) {
        return c.best
            ? root.trans.vdom(c.verdict === 'goodMove' ? 'anotherWasX' : 'bestWasX', h('move', {
                hook: {
                    insert: vnode => {
                        const el = vnode.elm;
                        el.addEventListener('click', ctrl.playCommentBest);
                        el.addEventListener('mouseover', () => ctrl.commentShape(true));
                        el.addEventListener('mouseout', () => ctrl.commentShape(false));
                    },
                    destroy: () => ctrl.commentShape(false),
                },
            }, c.best.san))
            : [];
    }
    function renderOffTrack(root, ctrl) {
        return h('div.player.off', [
            h('div.icon.off', '!'),
            h('div.instruction', [
                h('strong', root.trans.noarg('youBrowsedAway')),
                h('div.choices', [h('a', { hook: bind$1('click', ctrl.resume, ctrl.redraw) }, root.trans.noarg('resumePractice'))]),
            ]),
        ]);
    }
    function renderEnd$1(root, end) {
        const color = end.winner || root.turnColor();
        return h('div.player', [
            color ? h('div.no-square', h('piece.king.' + color)) : h('div.icon.off', '!'),
            h('div.instruction', [
                h('strong', root.trans.noarg(end.winner ? 'checkmate' : 'draw')),
                end.winner
                    ? h('em', h('color', root.trans.noarg(end.winner === 'white' ? 'whiteWinsGame' : 'blackWinsGame')))
                    : h('em', root.trans.noarg('theGameIsADraw')),
            ]),
        ]);
    }
    const minDepth = 8;
    function renderEvalProgress(node, maxDepth) {
        return h('div.progress', h('div', {
            attrs: {
                style: `width: ${node.ceval ? (100 * Math.max(0, node.ceval.depth - minDepth)) / (maxDepth - minDepth) + '%' : 0}`,
            },
        }));
    }
    function renderRunning(root, ctrl) {
        const hint = ctrl.hinting();
        return h('div.player.running', [
            h('div.no-square', h('piece.king.' + root.turnColor())),
            h('div.instruction', (ctrl.isMyTurn()
                ? [h('strong', root.trans.noarg('yourTurn'))]
                : [
                    h('strong', root.trans.noarg('computerThinking')),
                    renderEvalProgress(ctrl.currentNode(), ctrl.playableDepth()),
                ]).concat(h('div.choices', [
                ctrl.isMyTurn()
                    ? h('a', {
                        hook: bind$1('click', () => root.practice.hint(), ctrl.redraw),
                    }, root.trans.noarg(hint ? (hint.mode === 'piece' ? 'seeBestMove' : 'hideBestMove') : 'getAHint'))
                    : '',
            ]))),
        ]);
    }
    function practiceView (root) {
        const ctrl = root.practice;
        if (!ctrl)
            return;
        const comment = ctrl.comment();
        const running = ctrl.running();
        const end = ctrl.currentNode().threefold ? { winner: undefined } : root.outcome();
        return h('div.practice-box.training-box.sub-box.' + (comment ? comment.verdict : 'no-verdict'), [
            h('div.title', root.trans.noarg('practiceWithComputer')),
            h('div.feedback', !running ? renderOffTrack(root, ctrl) : end ? renderEnd$1(root, end) : renderRunning(root, ctrl)),
            running
                ? h('div.comment', comment
                    ? [h('span.verdict', root.trans.noarg(comment.verdict)), ' '].concat(commentBest(comment, root, ctrl))
                    : [ctrl.isMyTurn() || end ? '' : h('span.wait', root.trans.noarg('evaluatingYourMove'))])
                : running
                    ? h('div.comment')
                    : null,
        ]);
    }

    function running(ctrl) {
        return (!!ctrl.study &&
            ctrl.study.data.chapter.gamebook &&
            !ctrl.gamebookPlay() &&
            ctrl.study.vm.gamebookOverride !== 'analyse');
    }
    function render$2(ctrl) {
        const study = ctrl.study, isMyMove = ctrl.turnColor() === ctrl.data.orientation, isCommented = !!(ctrl.node.comments || []).find(c => c.text.length > 2), hasVariation = ctrl.tree.parentNode(ctrl.path).children.length > 1;
        let content;
        const commentHook = bind$1('click', () => {
            study.commentForm.start(study.vm.chapterId, ctrl.path, ctrl.node);
            study.vm.toolTab('comments');
            lichess.requestIdleCallback(() => $('#comment-text').each(function () {
                this.focus();
            }), 500);
        }, ctrl.redraw);
        if (!ctrl.path) {
            if (isMyMove)
                content = [
                    h('div.legend.todo.clickable', {
                        hook: commentHook,
                        class: { done: isCommented },
                    }, [iconTag('c'), h('p', 'Help the player find the initial move, with a comment.')]),
                    renderHint(ctrl),
                ];
            else
                content = [
                    h('div.legend.clickable', {
                        hook: commentHook,
                    }, [iconTag('c'), h('p', 'Introduce the gamebook with a comment')]),
                    h('div.legend.todo', { class: { done: !!ctrl.node.children[0] } }, [
                        iconTag('G'),
                        h('p', "Put the opponent's first move on the board."),
                    ]),
                ];
        }
        else if (ctrl.onMainline) {
            if (isMyMove)
                content = [
                    h('div.legend.todo.clickable', {
                        hook: commentHook,
                        class: { done: isCommented },
                    }, [iconTag('c'), h('p', 'Explain the opponent move, and help the player find the next move, with a comment.')]),
                    renderHint(ctrl),
                ];
            else
                content = [
                    h('div.legend.clickable', {
                        hook: commentHook,
                    }, [
                        iconTag('c'),
                        h('p', "You may reflect on the player's correct move, with a comment; or leave empty to jump immediately to the next move."),
                    ]),
                    hasVariation
                        ? null
                        : h('div.legend.clickable', {
                            hook: bind$1('click', () => prev(ctrl), ctrl.redraw),
                        }, [iconTag('G'), h('p', 'Add variation moves to explain why specific other moves are wrong.')]),
                    renderDeviation(ctrl),
                ];
        }
        else
            content = [
                h('div.legend.todo.clickable', {
                    hook: commentHook,
                    class: { done: isCommented },
                }, [iconTag('c'), h('p', 'Explain why this move is wrong in a comment')]),
                h('div.legend', [h('p', 'Or promote it as the mainline if it is the right move.')]),
            ];
        return h('div.gamebook-edit', {
            hook: { insert: _ => lichess.loadCssPath('analyse.gamebook.edit') },
        }, content);
    }
    function renderDeviation(ctrl) {
        const field = 'deviation';
        return h('div.deviation', [
            h('div.legend.todo', { class: { done: nodeGamebookValue(ctrl.node, field).length > 2 } }, [
                iconTag('c'),
                h('p', 'When any other wrong move is played:'),
            ]),
            h('textarea', {
                attrs: { placeholder: 'Explain why all other moves are wrong' },
                hook: textareaHook(ctrl, field),
            }),
        ]);
    }
    function renderHint(ctrl) {
        const field = 'hint';
        return h('div.hint', [
            h('div.legend', [iconTag(''), h('p', 'Optional, on-demand hint for the player:')]),
            h('textarea', {
                attrs: { placeholder: 'Give the player a tip so they can find the right move' },
                hook: textareaHook(ctrl, field),
            }),
        ]);
    }
    const saveNode = throttle(500, (ctrl, gamebook) => {
        ctrl.socket.send('setGamebook', {
            path: ctrl.path,
            ch: ctrl.study.vm.chapterId,
            gamebook: gamebook,
        });
        ctrl.redraw();
    });
    function nodeGamebookValue(node, field) {
        return (node.gamebook && node.gamebook[field]) || '';
    }
    function textareaHook(ctrl, field) {
        const value = nodeGamebookValue(ctrl.node, field);
        return {
            insert(vnode) {
                const el = vnode.elm;
                el.value = value;
                el.onkeyup = el.onpaste = () => {
                    const node = ctrl.node;
                    node.gamebook = node.gamebook || {};
                    node.gamebook[field] = el.value.trim();
                    saveNode(ctrl, node.gamebook);
                };
                vnode.data.path = ctrl.path;
            },
            postpatch(old, vnode) {
                if (old.data.path !== ctrl.path)
                    vnode.elm.value = value;
                vnode.data.path = ctrl.path;
            },
        };
    }

    const defaultComments = {
        play: 'What would you play in this position?',
        end: 'Congratulations! You completed this lesson.',
        bad: undefined,
        good: undefined,
    };
    function render$1(ctrl) {
        const state = ctrl.state, comment = state.comment || defaultComments[state.feedback];
        return h('div.gamebook', {
            hook: { insert: _ => lichess.loadCssPath('analyse.gamebook.play') },
        }, [
            comment
                ? h('div.comment', {
                    class: { hinted: state.showHint },
                }, [h('div.content', { hook: richHTML(comment) }), hintZone(ctrl)])
                : undefined,
            h('div.floor', [
                renderFeedback(ctrl, state),
                h('img.mascot', {
                    attrs: {
                        width: 120,
                        height: 120,
                        src: lichess.assetUrl('images/mascot/octopus.svg'),
                    },
                }),
            ]),
        ]);
    }
    function hintZone(ctrl) {
        const state = ctrl.state, clickHook = () => ({
            hook: bind$1('click', ctrl.hint, ctrl.redraw),
        });
        if (state.showHint)
            return h('div', clickHook(), [h('div.hint', { hook: richHTML(state.hint) })]);
        if (state.hint)
            return h('a.hint', clickHook(), 'Get a hint');
        return undefined;
    }
    function renderFeedback(ctrl, state) {
        const fb = state.feedback, color = ctrl.root.turnColor();
        if (fb === 'bad')
            return h('div.feedback.act.bad' + (state.comment ? '.com' : ''), {
                hook: bind$1('click', ctrl.retry),
            }, [iconTag('P'), h('span', 'Retry')]);
        if (fb === 'good' && state.comment)
            return h('div.feedback.act.good.com', {
                hook: bind$1('click', ctrl.next),
            }, [h('span.text', { attrs: dataIcon('G') }, 'Next'), h('kbd', '<space>')]);
        if (fb === 'end')
            return renderEnd(ctrl);
        return h('div.feedback.info.' + fb + (state.init ? '.init' : ''), h('div', fb === 'play'
            ? [
                h('div.no-square', h('piece.king.' + color)),
                h('div.instruction', [
                    h('strong', ctrl.trans.noarg('yourTurn')),
                    h('em', ctrl.trans.noarg(color === 'white' ? 'findTheBestMoveForWhite' : 'findTheBestMoveForBlack')),
                ]),
            ]
            : ['Good move!']));
    }
    function renderEnd(ctrl) {
        const study = ctrl.root.study;
        return h('div.feedback.end', [
            study.nextChapter()
                ? h('a.next.text', {
                    attrs: dataIcon('G'),
                    hook: bind$1('click', study.goToNextChapter),
                }, 'Next chapter')
                : undefined,
            h('a.retry', {
                attrs: dataIcon('P'),
                hook: bind$1('click', () => ctrl.root.userJump(''), ctrl.redraw),
            }, 'Play again'),
            h('a.analyse', {
                attrs: dataIcon('A'),
                hook: bind$1('click', () => study.setGamebookOverride('analyse'), ctrl.redraw),
            }, 'Analyse'),
        ]);
    }

    function renderRatingDiff(rd) {
        if (rd === 0)
            return h('span', '±0');
        if (rd && rd > 0)
            return h('good', '+' + rd);
        if (rd && rd < 0)
            return h('bad', '−' + -rd);
        return;
    }
    function renderPlayer$1(ctrl, color) {
        const p = getPlayer(ctrl.data, color);
        if (p.user)
            return h('a.user-link.ulpt', {
                attrs: { href: '/@/' + p.user.username },
            }, [p.user.username, ' ', renderRatingDiff(p.ratingDiff)]);
        return h('span', p.name ||
            (p.ai && 'Stockfish level ' + p.ai) ||
            (ctrl.study && findTag(ctrl.study.data.chapter.tags, color)) ||
            'Anonymous');
    }
    const advices = [
        { kind: 'inaccuracy', i18n: 'nbInaccuracies', symbol: '?!' },
        { kind: 'mistake', i18n: 'nbMistakes', symbol: '?' },
        { kind: 'blunder', i18n: 'nbBlunders', symbol: '??' },
    ];
    function playerTable(ctrl, color) {
        const d = ctrl.data;
        const acpl = d.analysis[color].acpl;
        return h('div.advice-summary__side', [
            h('div.advice-summary__player', [h(`i.is.color-icon.${color}`), renderPlayer$1(ctrl, color)]),
            ...advices.map(a => {
                const nb = d.analysis[color][a.kind];
                const attrs = nb
                    ? {
                        'data-color': color,
                        'data-symbol': a.symbol,
                    }
                    : {};
                return h(`div.advice-summary__mistake${nb ? '.symbol' : ''}`, { attrs }, ctrl.trans.vdomPlural(a.i18n, nb, h('strong', nb)));
            }),
            h('div.advice-summary__acpl', [
                h('strong', '' + (defined$1(acpl) ? acpl : '?')),
                h('span', ctrl.trans.noarg('averageCentipawnLoss')),
            ]),
        ]);
    }
    function doRender(ctrl) {
        return h('div.advice-summary', {
            hook: {
                insert: vnode => {
                    $(vnode.elm).on('click', 'div.symbol', function () {
                        ctrl.jumpToGlyphSymbol($(this).data('color'), $(this).data('symbol'));
                    });
                },
            },
        }, [
            playerTable(ctrl, 'white'),
            ctrl.study
                ? null
                : h('a.button.text', {
                    class: { active: !!ctrl.retro },
                    attrs: dataIcon('G'),
                    hook: bind$1('click', ctrl.toggleRetro, ctrl.redraw),
                }, ctrl.trans.noarg('learnFromYourMistakes')),
            playerTable(ctrl, 'black'),
        ]);
    }
    function render(ctrl) {
        if (ctrl.studyPractice || ctrl.embed)
            return;
        if (!ctrl.data.analysis || !ctrl.showComputer() || (ctrl.study && ctrl.study.vm.toolTab() !== 'serverEval'))
            return h('div.analyse__acpl');
        // don't cache until the analysis is complete!
        const buster = ctrl.data.analysis.partial ? Math.random() : '';
        let cacheKey = '' + buster + !!ctrl.retro;
        if (ctrl.study)
            cacheKey += ctrl.study.data.chapter.id;
        return h('div.analyse__acpl', thunk('div.advice-summary', doRender, [ctrl, cacheKey]));
    }

    function relayManager (ctrl) {
        var _a, _b;
        return ctrl.members.canContribute()
            ? h('div.relay-admin', {
                hook: onInsert(_ => lichess.loadCssPath('analyse.relay-admin')),
            }, [
                h('h2', [
                    h('span.text', { attrs: dataIcon('') }, 'Broadcast manager'),
                    h('a', {
                        attrs: {
                            href: `/broadcast/round/${ctrl.id}/edit`,
                            'data-icon': '%',
                        },
                    }),
                ]),
                ((_a = ctrl.data.sync) === null || _a === void 0 ? void 0 : _a.url) || ((_b = ctrl.data.sync) === null || _b === void 0 ? void 0 : _b.ids) ? (ctrl.data.sync.ongoing ? stateOn : stateOff)(ctrl) : null,
                renderLog(ctrl),
            ])
            : undefined;
    }
    function logSuccess(e) {
        return [e.moves ? h('strong', '' + e.moves) : e.moves, ` new move${e.moves > 1 ? 's' : ''}`];
    }
    function renderLog(ctrl) {
        var _a, _b;
        const dateFormatter = getDateFormatter();
        const url = (_a = ctrl.data.sync) === null || _a === void 0 ? void 0 : _a.url;
        const logLines = (((_b = ctrl.data.sync) === null || _b === void 0 ? void 0 : _b.log) || [])
            .slice(0)
            .reverse()
            .map(e => {
            const err = e.error &&
                h('a', url
                    ? {
                        attrs: {
                            href: url,
                            target: '_blank',
                            rel: 'noopener nofollow',
                        },
                    }
                    : {}, e.error);
            return h('div' + (err ? '.err' : ''), {
                key: e.at,
                attrs: dataIcon(err ? 'j' : 'E'),
            }, [h('div', [...(err ? [err] : logSuccess(e)), h('time', dateFormatter(new Date(e.at)))])]);
        });
        if (ctrl.loading())
            logLines.unshift(h('div.load', [h('i.ddloader'), 'Polling source...']));
        return h('div.log', logLines);
    }
    function stateOn(ctrl) {
        var _a, _b;
        const url = (_a = ctrl.data.sync) === null || _a === void 0 ? void 0 : _a.url;
        const ids = (_b = ctrl.data.sync) === null || _b === void 0 ? void 0 : _b.ids;
        return h('div.state.on.clickable', {
            hook: bind$1('click', _ => ctrl.setSync(false)),
            attrs: dataIcon('B'),
        }, [
            h('div', url
                ? ['Connected to source', h('br'), url.replace(/https?:\/\//, '')]
                : ids
                    ? ['Connected to', h('br'), ids.length, ' game(s)']
                    : []),
        ]);
    }
    function stateOff(ctrl) {
        return h('div.state.off.clickable', {
            hook: bind$1('click', _ => ctrl.setSync(true)),
            attrs: dataIcon('G'),
        }, [h('div.fat', 'Click to connect')]);
    }
    let cachedDateFormatter;
    function getDateFormatter() {
        if (!cachedDateFormatter)
            cachedDateFormatter =
                window.Intl && Intl.DateTimeFormat
                    ? new Intl.DateTimeFormat(document.documentElement.lang, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                    }).format
                    : function (d) {
                        return d.toLocaleString();
                    };
        return cachedDateFormatter;
    }

    function renderPlayerBars (ctrl) {
        const study = ctrl.study;
        if (!study || ctrl.embed)
            return;
        const tags = study.data.chapter.tags, playerNames = {
            white: findTag(tags, 'white'),
            black: findTag(tags, 'black'),
        };
        if (!playerNames.white && !playerNames.black && !findInMainline(ctrl.tree.root, n => !!n.clock))
            return;
        const clocks = renderClocks(ctrl), ticking = !isFinished(study.data.chapter) && ctrl.turnColor();
        return ['white', 'black'].map(color => renderPlayer(tags, clocks, playerNames, color, ticking === color, ctrl.bottomColor() !== color));
    }
    function renderPlayer(tags, clocks, playerNames, color, ticking, top) {
        const title = findTag(tags, `${color}title`), elo = findTag(tags, `${color}elo`), result = resultOf(tags, color === 'white');
        return h(`div.study__player.study__player-${top ? 'top' : 'bot'}`, {
            class: { ticking },
        }, [
            h('div.left', [
                result && h('span.result', result),
                h('span.info', [
                    title && h('span.utitle', title == 'BOT' ? { attrs: { 'data-bot': true } } : {}, title + ' '),
                    h('span.name', playerNames[color]),
                    elo && h('span.elo', elo),
                ]),
            ]),
            clocks && clocks[color === 'white' ? 0 : 1],
        ]);
    }

    function serverSideUnderboard (element, ctrl) {
        $(element).replaceWith(ctrl.opts.$underboard);
        $('#adv-chart').attr('id', 'acpl-chart');
        const data = ctrl.data, $panels = $('.analyse__underboard__panels > div'), $menu = $('.analyse__underboard__menu'), $timeChart = $('#movetimes-chart'), inputFen = document.querySelector('.analyse__underboard__fen'), unselect = (chart) => {
            chart.getSelectedPoints().forEach(function (point) {
                point.select(false);
            });
        };
        let lastFen;
        if (!lichess.AnalyseNVUI) {
            lichess.pubsub.on('analysis.comp.toggle', (v) => {
                setTimeout(function () {
                    (v ? $menu.find('[data-panel="computer-analysis"]') : $menu.find('span:eq(1)')).trigger('mousedown');
                }, 50);
            });
            lichess.pubsub.on('analysis.change', (fen, _, mainlinePly) => {
                const $chart = $('#acpl-chart');
                if (fen && fen !== lastFen) {
                    inputFen.value = fen;
                    lastFen = fen;
                }
                if ($chart.length) {
                    const chart = $chart[0].highcharts;
                    if (chart) {
                        if (mainlinePly != chart.lastPly) {
                            if (mainlinePly === false)
                                unselect(chart);
                            else {
                                const point = chart.series[0].data[mainlinePly - 1 - data.game.startedAtTurn];
                                if (defined$1(point))
                                    point.select();
                                else
                                    unselect(chart);
                            }
                        }
                        chart.lastPly = mainlinePly;
                    }
                }
                if ($timeChart.length) {
                    const chart = $timeChart[0].highcharts;
                    if (chart) {
                        if (mainlinePly != chart.lastPly) {
                            if (mainlinePly === false)
                                unselect(chart);
                            else {
                                const white = mainlinePly % 2 !== 0;
                                const serie = white ? 0 : 1;
                                const turn = Math.floor((mainlinePly - 1 - data.game.startedAtTurn) / 2);
                                const point = chart.series[serie].data[turn];
                                if (defined$1(point))
                                    point.select();
                                else
                                    unselect(chart);
                            }
                        }
                        chart.lastPly = mainlinePly;
                    }
                }
            });
            lichess.pubsub.on('analysis.server.progress', (d) => {
                if (!lichess.advantageChart)
                    startAdvantageChart();
                else if (lichess.advantageChart.update)
                    lichess.advantageChart.update(d);
                if (d.analysis && !d.analysis.partial)
                    $('#acpl-chart-loader').remove();
            });
        }
        function chartLoader() {
            return `<div id="acpl-chart-loader"><span>Stockfish 13+<br>server analysis</span>${lichess.spinnerHtml}</div>`;
        }
        function startAdvantageChart() {
            if (lichess.advantageChart || lichess.AnalyseNVUI)
                return;
            const loading = !data.treeParts[0].eval || !Object.keys(data.treeParts[0].eval).length;
            const $panel = $panels.filter('.computer-analysis');
            if (!$('#acpl-chart').length)
                $panel.html('<div id="acpl-chart"></div>' + (loading ? chartLoader() : ''));
            else if (loading && !$('#acpl-chart-loader').length)
                $panel.append(chartLoader());
            lichess.loadScript('javascripts/chart/acpl.js').then(function () {
                lichess.advantageChart(data, ctrl.trans, $('#acpl-chart')[0]);
            });
        }
        const storage = lichess.storage.make('analysis.panel');
        const setPanel = function (panel) {
            $menu.children('.active').removeClass('active');
            $menu.find(`[data-panel="${panel}"]`).addClass('active');
            $panels
                .removeClass('active')
                .filter('.' + panel)
                .addClass('active');
            if ((panel == 'move-times' || ctrl.opts.hunter) && !lichess.movetimeChart)
                lichess.loadScript('javascripts/chart/movetime.js').then(() => lichess.movetimeChart(data, ctrl.trans));
            if ((panel == 'computer-analysis' || ctrl.opts.hunter) && $('#acpl-chart').length)
                setTimeout(startAdvantageChart, 200);
        };
        $menu.on('mousedown', 'span', function () {
            const panel = $(this).data('panel');
            storage.set(panel);
            setPanel(panel);
        });
        const stored = storage.get();
        const foundStored = stored &&
            $menu.children(`[data-panel="${stored}"]`).filter(function () {
                const display = window.getComputedStyle(this).display;
                return !!display && display != 'none';
            }).length;
        if (foundStored)
            setPanel(stored);
        else {
            const $menuCt = $menu.children('[data-panel="ctable"]');
            ($menuCt.length ? $menuCt : $menu.children(':first-child')).trigger('mousedown');
        }
        if (!data.analysis) {
            $panels.find('form.future-game-analysis').on('submit', function () {
                if ($(this).hasClass('must-login')) {
                    if (confirm(ctrl.trans('youNeedAnAccountToDoThat')))
                        location.href = '/signup';
                    return false;
                }
                formToXhr(this).then(startAdvantageChart, lichess.reload);
                return false;
            });
        }
        $panels.on('click', '.pgn', function () {
            const selection = window.getSelection(), range = document.createRange();
            range.selectNodeContents(this);
            selection.removeAllRanges();
            selection.addRange(range);
        });
        $panels.on('click', '.embed-howto', function () {
            const url = `${baseUrl()}/embed/${data.game.id}${location.hash}`;
            const iframe = '<iframe src="' + url + '?theme=auto&bg=auto"\nwidth=600 height=397 frameborder=0></iframe>';
            modal($('<strong style="font-size:1.5em">' +
                $(this).html() +
                '</strong><br /><br />' +
                '<pre>' +
                lichess.escapeHtml(iframe) +
                '</pre><br />' +
                iframe +
                '<br /><br />' +
                '<a class="text" data-icon="" href="/developers#embed-game">Read more about embedding games</a>'));
        });
    }

    const runner = (hacks, throttleMs = 100) => {
        let timeout;
        const runHacks = throttle(throttleMs, () => requestAnimationFrame(() => {
            hacks();
            schedule();
        }));
        function schedule() {
            timeout && clearTimeout(timeout);
            timeout = setTimeout(runHacks, 500);
        }
        runHacks();
    };
    let boundChessgroundResize = false;
    const bindChessgroundResizeOnce = (f) => {
        if (!boundChessgroundResize) {
            boundChessgroundResize = true;
            document.body.addEventListener('chessground.resize', f);
        }
    };

    let booted = false;
    function start$1(container) {
        // Chrome, Chromium, Brave, Opera, Safari 12+ are OK
        if (window.chrome)
            return;
        const runHacks = () => fixChatHeight(container);
        runner(runHacks);
        bindChessgroundResizeOnce(runHacks);
        if (!booted) {
            lichess.pubsub.on('chat.resize', runHacks);
            booted = true;
        }
    }
    function fixChatHeight(container) {
        const chat = container.querySelector('.mchat'), board = container.querySelector('.analyse__board .cg-wrap'), side = container.querySelector('.analyse__side');
        if (chat && board && side) {
            const height = board.offsetHeight - side.offsetHeight;
            if (height)
                chat.style.height = `calc(${height}px - 2vmin)`;
        }
    }

    function renderResult(ctrl) {
        let result;
        if (ctrl.data.game.status.id >= 30)
            switch (ctrl.data.game.winner) {
                case 'white':
                    result = '1-0';
                    break;
                case 'black':
                    result = '0-1';
                    break;
                default:
                    result = '½-½';
            }
        const tags = [];
        if (result) {
            tags.push(h('div.result', result));
            const winner = getPlayer(ctrl.data, ctrl.data.game.winner);
            tags.push(h('div.status', [
                status(ctrl),
                winner ? ', ' + ctrl.trans(winner.color == 'white' ? 'whiteIsVictorious' : 'blackIsVictorious') : null,
            ]));
        }
        return tags;
    }
    function makeConcealOf(ctrl) {
        const conceal = ctrl.study && ctrl.study.data.chapter.conceal !== undefined
            ? {
                owner: ctrl.study.isChapterOwner(),
                ply: ctrl.study.data.chapter.conceal,
            }
            : null;
        if (conceal)
            return (isMainline) => (path, node) => {
                if (!conceal || (isMainline && conceal.ply >= node.ply))
                    return null;
                if (contains(ctrl.path, path))
                    return null;
                return conceal.owner ? 'conceal' : 'hide';
            };
        return undefined;
    }
    function renderAnalyse(ctrl, concealOf) {
        return h('div.analyse__moves.areplay', [
            ctrl.embed && ctrl.study ? h('div.chapter-name', ctrl.study.currentChapter().name) : null,
            render$3(ctrl, concealOf),
        ].concat(renderResult(ctrl)));
    }
    function wheel(ctrl, e) {
        const target = e.target;
        if (target.tagName !== 'PIECE' && target.tagName !== 'SQUARE' && target.tagName !== 'CG-BOARD')
            return;
        e.preventDefault();
        if (e.deltaY > 0)
            next(ctrl);
        else if (e.deltaY < 0)
            prev(ctrl);
        ctrl.redraw();
        return false;
    }
    function inputs(ctrl) {
        if (ctrl.ongoing || !ctrl.data.userAnalysis)
            return;
        if (ctrl.redirecting)
            return spinner();
        return h('div.copyables', [
            h('div.pair', [
                h('label.name', 'FEN'),
                h('input.copyable.autoselect.analyse__underboard__fen', {
                    attrs: { spellCheck: false },
                    hook: {
                        insert: vnode => {
                            const el = vnode.elm;
                            el.value = defined$1(ctrl.fenInput) ? ctrl.fenInput : ctrl.node.fen;
                            el.addEventListener('change', _ => {
                                if (el.value !== ctrl.node.fen && el.reportValidity())
                                    ctrl.changeFen(el.value.trim());
                            });
                            el.addEventListener('input', _ => {
                                ctrl.fenInput = el.value;
                                el.setCustomValidity(parseFen(el.value.trim()).isOk ? '' : 'Invalid FEN');
                            });
                        },
                        postpatch: (_, vnode) => {
                            const el = vnode.elm;
                            if (!defined$1(ctrl.fenInput)) {
                                el.value = ctrl.node.fen;
                                el.setCustomValidity('');
                            }
                            else if (el.value != ctrl.fenInput)
                                el.value = ctrl.fenInput;
                        },
                    },
                }),
            ]),
            h('div.pgn', [
                h('div.pair', [
                    h('label.name', 'PGN'),
                    h('textarea.copyable.autoselect', {
                        attrs: { spellCheck: false },
                        hook: Object.assign(Object.assign({}, onInsert(el => {
                            el.value = defined$1(ctrl.pgnInput)
                                ? ctrl.pgnInput
                                : renderFullTxt(ctrl);
                            el.addEventListener('input', e => (ctrl.pgnInput = e.target.value));
                        })), { postpatch: (_, vnode) => {
                                vnode.elm.value = defined$1(ctrl.pgnInput)
                                    ? ctrl.pgnInput
                                    : renderFullTxt(ctrl);
                            } }),
                    }),
                    h('button.button.button-thin.action.text', {
                        attrs: dataIcon('G'),
                        hook: bind$1('click', _ => {
                            const pgn = $('.copyables .pgn textarea').val();
                            if (pgn !== renderFullTxt(ctrl))
                                ctrl.changePgn(pgn);
                        }, ctrl.redraw),
                    }, ctrl.trans.noarg('importPgn')),
                ]),
            ]),
        ]);
    }
    function jumpButton(icon, effect, enabled) {
        return h('button.fbt', {
            class: { disabled: !enabled },
            attrs: { 'data-act': effect, 'data-icon': icon },
        });
    }
    function dataAct(e) {
        const target = e.target;
        return target.getAttribute('data-act') || target.parentNode.getAttribute('data-act');
    }
    function repeater(ctrl, action, e) {
        const repeat = function () {
            control[action](ctrl);
            ctrl.redraw();
            delay = Math.max(100, delay - delay / 15);
            timeout = setTimeout(repeat, delay);
        };
        let delay = 350;
        let timeout = setTimeout(repeat, 500);
        control[action](ctrl);
        const eventName = e.type == 'touchstart' ? 'touchend' : 'mouseup';
        document.addEventListener(eventName, () => clearTimeout(timeout), { once: true });
    }
    function controls(ctrl) {
        const canJumpPrev = ctrl.path !== '', canJumpNext = !!ctrl.node.children[0], menuIsOpen = ctrl.actionMenu.open, noarg = ctrl.trans.noarg;
        return h('div.analyse__controls.analyse-controls', {
            hook: onInsert(el => {
                bindMobileMousedown(el, e => {
                    const action = dataAct(e);
                    if (action === 'prev' || action === 'next')
                        repeater(ctrl, action, e);
                    else if (action === 'first')
                        first(ctrl);
                    else if (action === 'last')
                        last(ctrl);
                    else if (action === 'explorer')
                        ctrl.toggleExplorer();
                    else if (action === 'practice')
                        ctrl.togglePractice();
                    else if (action === 'menu')
                        ctrl.actionMenu.toggle();
                }, ctrl.redraw);
            }),
        }, [
            ctrl.embed
                ? null
                : h('div.features', ctrl.studyPractice
                    ? [
                        h('a.fbt', {
                            attrs: {
                                title: noarg('analysis'),
                                target: '_blank',
                                rel: 'noopener',
                                href: ctrl.studyPractice.analysisUrl(),
                                'data-icon': 'A',
                            },
                        }),
                    ]
                    : [
                        h('button.fbt', {
                            attrs: {
                                title: noarg('openingExplorerAndTablebase'),
                                'data-act': 'explorer',
                                'data-icon': ']',
                            },
                            class: {
                                hidden: menuIsOpen || !ctrl.explorer.allowed() || !!ctrl.retro,
                                active: ctrl.explorer.enabled(),
                            },
                        }),
                        ctrl.ceval.possible && ctrl.ceval.allowed() && !ctrl.isGamebook()
                            ? h('button.fbt', {
                                attrs: {
                                    title: noarg('practiceWithComputer'),
                                    'data-act': 'practice',
                                    'data-icon': '',
                                },
                                class: {
                                    hidden: menuIsOpen || !!ctrl.retro,
                                    active: !!ctrl.practice,
                                },
                            })
                            : null,
                    ]),
            h('div.jumps', [
                jumpButton('W', 'first', canJumpPrev),
                jumpButton('Y', 'prev', canJumpPrev),
                jumpButton('X', 'next', canJumpNext),
                jumpButton('V', 'last', canJumpNext),
            ]),
            ctrl.studyPractice
                ? h('div.noop')
                : h('button.fbt', {
                    class: { active: menuIsOpen },
                    attrs: {
                        title: noarg('menu'),
                        'data-act': 'menu',
                        'data-icon': '[',
                    },
                }),
        ]);
    }
    function forceInnerCoords(ctrl, v) {
        if (ctrl.data.pref.coords === 2 /* Outside */) {
            $('body').toggleClass('coords-in', v).toggleClass('coords-out', !v);
            changeColorHandle();
        }
    }
    function addChapterId(study, cssClass) {
        return cssClass + (study && study.data.chapter ? '.' + study.data.chapter.id : '');
    }
    function view (ctrl) {
        if (ctrl.nvui)
            return ctrl.nvui.render(ctrl);
        const concealOf = makeConcealOf(ctrl), study = ctrl.study, showCevalPvs = !(ctrl.retro && ctrl.retro.isSolving()) && !ctrl.practice, menuIsOpen = ctrl.actionMenu.open, gamebookPlay = ctrl.gamebookPlay(), gamebookPlayView = gamebookPlay && render$1(gamebookPlay), gamebookEditView = running(ctrl) ? render$2(ctrl) : undefined, playerBars = renderPlayerBars(ctrl), clocks = !playerBars && renderClocks(ctrl), gaugeOn = ctrl.showEvalGauge(), needsInnerCoords = !!gaugeOn || !!playerBars, tour = relayTour(ctrl);
        return h('main.analyse.variant-' + ctrl.data.game.variant.key, {
            hook: {
                insert: vn => {
                    forceInnerCoords(ctrl, needsInnerCoords);
                    if (!!playerBars != $('body').hasClass('header-margin')) {
                        requestAnimationFrame(() => {
                            $('body').toggleClass('header-margin', !!playerBars);
                            ctrl.redraw();
                        });
                    }
                    start$1(vn.elm);
                },
                update(_, _2) {
                    forceInnerCoords(ctrl, needsInnerCoords);
                },
                postpatch(old, vnode) {
                    if (old.data.gaugeOn !== gaugeOn)
                        document.body.dispatchEvent(new Event('chessground.resize'));
                    vnode.data.gaugeOn = gaugeOn;
                },
            },
            class: {
                'comp-off': !ctrl.showComputer(),
                'gauge-on': gaugeOn,
                'has-players': !!playerBars,
                'has-clocks': !!clocks,
                'has-relay-tour': !!tour,
                'analyse-hunter': ctrl.opts.hunter,
            },
        }, [
            ctrl.keyboardHelp ? view$l(ctrl) : null,
            study ? overboard(study) : null,
            tour ||
                h(addChapterId(study, 'div.analyse__board.main-board'), {
                    hook: 'ontouchstart' in window || ctrl.gamebookPlay()
                        ? undefined
                        : bind$1('wheel', (e) => wheel(ctrl, e)),
                }, [
                    ...(clocks || []),
                    playerBars ? playerBars[ctrl.bottomIsWhite() ? 1 : 0] : null,
                    render$4(ctrl),
                    playerBars ? playerBars[ctrl.bottomIsWhite() ? 0 : 1] : null,
                    view$k(ctrl),
                ]),
            gaugeOn && !tour ? renderGauge(ctrl) : null,
            menuIsOpen || tour ? null : crazyView(ctrl, ctrl.topColor(), 'top'),
            gamebookPlayView ||
                (tour
                    ? null
                    : h(addChapterId(study, 'div.analyse__tools'), [
                        ...(menuIsOpen
                            ? [view$3(ctrl)]
                            : [
                                renderCeval(ctrl),
                                showCevalPvs ? renderPvs(ctrl) : null,
                                renderAnalyse(ctrl, concealOf),
                                gamebookEditView || view$1(ctrl, concealOf),
                                retroView(ctrl) || practiceView(ctrl) || explorerView(ctrl),
                            ]),
                    ])),
            menuIsOpen || tour ? null : crazyView(ctrl, ctrl.bottomColor(), 'bottom'),
            gamebookPlayView || tour ? null : controls(ctrl),
            ctrl.embed || tour
                ? null
                : h('div.analyse__underboard', {
                    hook: ctrl.synthetic || playable(ctrl.data) ? undefined : onInsert(elm => serverSideUnderboard(elm, ctrl)),
                }, study ? underboard(ctrl) : [inputs(ctrl)]),
            tour ? null : render(ctrl),
            ctrl.embed
                ? null
                : ctrl.studyPractice
                    ? side$1(study)
                    : h('aside.analyse__side', {
                        hook: onInsert(elm => {
                            ctrl.opts.$side && ctrl.opts.$side.length && $(elm).replaceWith(ctrl.opts.$side);
                            $(elm).append($('.context-streamers').clone().removeClass('none'));
                        }),
                    }, ctrl.studyPractice
                        ? [side$1(study)]
                        : study
                            ? [side(study)]
                            : [
                                ctrl.forecast ? forecastView(ctrl, ctrl.forecast) : null,
                                !ctrl.synthetic && playable(ctrl.data)
                                    ? h('div.back-to-game', h('a.button.button-empty.text', {
                                        attrs: {
                                            href: game(ctrl.data, ctrl.data.player.color),
                                            'data-icon': 'i',
                                        },
                                    }, ctrl.trans.noarg('backToGame')))
                                    : null,
                            ]),
            study && study.relay && relayManager(study.relay),
            ctrl.opts.chat &&
                h('section.mchat', {
                    hook: onInsert(_ => {
                        var _a;
                        const chatOpts = ctrl.opts.chat;
                        (_a = chatOpts.instance) === null || _a === void 0 ? void 0 : _a.then(c => c.destroy());
                        chatOpts.parseMoves = true;
                        chatOpts.instance = lichess.makeChat(chatOpts);
                    }),
                }),
            ctrl.embed
                ? null
                : h('div.chat__members.none', {
                    hook: onInsert(lichess.watchers),
                }),
        ]);
    }

    const patch = init$2([classModule, attributesModule]);
    function start(opts) {
        opts.element = document.querySelector('main.analyse');
        opts.trans = lichess.trans(opts.i18n);
        const ctrl = (lichess.analysis = new AnalyseCtrl(opts, redraw));
        const blueprint = view(ctrl);
        opts.element.innerHTML = '';
        let vnode = patch(opts.element, blueprint);
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        menuHover();
        return {
            socketReceive: ctrl.socket.receive,
            path: () => ctrl.path,
            setChapter(id) {
                if (ctrl.study)
                    ctrl.study.setChapter(id);
            },
        };
    }
    // that's for the rest of lichess to access chessground
    // without having to include it a second time
    window.Chessground = Chessground;
    window.LichessChat = LichessChat;

    exports.boot = boot;
    exports.patch = patch;
    exports.start = start;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
