var LichessPuzzle = (function () {
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
    function node(n, cut) {
        withSpeech(s => s.step(n, cut));
    }
    function success() {
        lichess.sound.say('Success!');
    }
    function withSpeech(f) {
        if (window.LichessSpeech)
            f(window.LichessSpeech);
    }

    const defined$1 = (v) => typeof v !== 'undefined';
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

    function complete(puzzleId, theme, win, replay, streak) {
        return json(`/training/complete/${theme}/${puzzleId}`, {
            method: 'POST',
            body: form(Object.assign(Object.assign({ win }, (replay ? { replayDays: replay.days } : {})), (streak ? { streakId: streak.nextId(), streakScore: streak.data.index } : {}))),
        });
    }
    function vote(puzzleId, vote) {
        return json(`/training/${puzzleId}/vote`, {
            method: 'POST',
            body: form({ vote }),
        });
    }
    function voteTheme(puzzleId, theme, vote) {
        return json(`/training/${puzzleId}/vote/${theme}`, {
            method: 'POST',
            body: defined$1(vote) ? form({ vote }) : undefined,
        });
    }
    const setZen = throttle(1000, zen => text('/pref/zen', {
        method: 'post',
        body: form({ zen: zen ? 1 : 0 }),
    }));

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

    const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const COLORS = ['white', 'black'];
    const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const CASTLING_SIDES = ['a', 'h'];
    function isDrop(v) {
        return 'role' in v;
    }

    function defined(v) {
        return v !== undefined;
    }
    function opposite$1(color) {
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
    /**
     * Converts a move to UCI notation, like `g1f3` for a normal move,
     * `a7a8q` for promotion to a queen, and `Q@f7` for a Crazyhouse drop.
     */
    function makeUci(move) {
        if (isDrop(move))
            return `${roleToChar(move.role).toUpperCase()}@${makeSquare(move.to)}`;
        return makeSquare(move.from) + makeSquare(move.to) + (move.promotion ? roleToChar(move.promotion) : '');
    }
    function kingCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;
    }

    function chessgroundDests(pos, opts) {
        const result = new Map();
        const ctx = pos.ctx();
        for (const [from, squares] of pos.allDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = Array.from(squares, makeSquare);
                if (!(opts === null || opts === void 0 ? void 0 : opts.chess960) && from === ctx.king && squareFile(from) === 4) {
                    // Chessground needs both types of castling dests and filters based on
                    // a rookCastles setting.
                    if (squares.has(0))
                        d.push('c1');
                    else if (squares.has(56))
                        d.push('c8');
                    if (squares.has(7))
                        d.push('g1');
                    else if (squares.has(63))
                        d.push('g8');
                }
                result.set(makeSquare(from), d);
            }
        }
        return result;
    }
    function scalachessCharPair(move) {
        if (isDrop(move))
            return String.fromCharCode(35 + move.to, 35 + 64 + 8 * 5 + ['queen', 'rook', 'bishop', 'knight', 'pawn'].indexOf(move.role));
        else
            return String.fromCharCode(35 + move.from, move.promotion
                ? 35 + 64 + 8 * ['queen', 'rook', 'bishop', 'knight', 'king'].indexOf(move.promotion) + squareFile(move.to)
                : 35 + move.to);
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
    const minDepth = 6;
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
            if (depth < minDepth)
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
    function get(key, customStore = defaultGetStore()) {
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
            const cachedVersion = await get(`${key}--version`, this.store);
            if (cachedVersion !== version) {
                return [false, undefined];
            }
            const data = await get(`${key}--data`, this.store);
            return [true, data];
        }
        async set(key, version, data) {
            const cachedVersion = await get(`${key}--version`, this.store);
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
    function parseSan(pos, san) {
        const ctx = pos.ctx();
        // Castling
        let castlingSide;
        if (san === 'O-O' || san === 'O-O+' || san === 'O-O#')
            castlingSide = 'h';
        else if (san === 'O-O-O' || san === 'O-O-O+' || san === 'O-O-O#')
            castlingSide = 'a';
        if (castlingSide) {
            const rook = pos.castles.rook[pos.turn][castlingSide];
            if (!defined(ctx.king) || !defined(rook) || !pos.dests(ctx.king, ctx).has(rook))
                return;
            return {
                from: ctx.king,
                to: rook,
            };
        }
        // Normal move
        const match = san.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);
        if (!match) {
            // Drop
            const match = san.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);
            if (!match)
                return;
            const move = {
                role: charToRole(match[1]) || 'pawn',
                to: parseSquare(match[2]),
            };
            return pos.isLegal(move, ctx) ? move : undefined;
        }
        const role = charToRole(match[1]) || 'pawn';
        const to = parseSquare(match[4]);
        const promotion = charToRole(match[5]);
        if (!!promotion !== (role === 'pawn' && SquareSet.backranks().has(to)))
            return;
        if (promotion === 'king' && pos.rules !== 'antichess')
            return;
        let candidates = pos.board.pieces(pos.turn, role);
        if (match[2])
            candidates = candidates.intersect(SquareSet.fromFile(match[2].charCodeAt(0) - 'a'.charCodeAt(0)));
        if (match[3])
            candidates = candidates.intersect(SquareSet.fromRank(match[3].charCodeAt(0) - '1'.charCodeAt(0)));
        // Optimization: Reduce set of candidates
        const pawnAdvance = role === 'pawn' ? SquareSet.fromFile(squareFile(to)) : SquareSet.empty();
        candidates = candidates.intersect(pawnAdvance.union(attacks({ color: opposite$1(pos.turn), role }, to, pos.board.occupied)));
        // Check uniqueness and legality
        let from;
        for (const candidate of candidates) {
            if (pos.dests(candidate, ctx).has(to)) {
                if (defined(from))
                    return; // Ambiguous
                from = candidate;
            }
        }
        if (!defined(from))
            return; // Illegal
        return {
            from,
            to,
            promotion,
        };
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

    const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const INITIAL_EPD = INITIAL_BOARD_FEN + ' w KQkq -';
    const INITIAL_FEN = INITIAL_EPD + ' 0 1';
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
    function makePiece$1(piece, opts) {
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
                    fen += makePiece$1(piece, opts);
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
    function makePocket(material) {
        return ROLES.map(role => roleToChar(role).repeat(material[role])).join('');
    }
    function makePockets(pocket) {
        return makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
    }
    function makeCastlingFen(board, unmovedRooks, opts) {
        const shredder = opts === null || opts === void 0 ? void 0 : opts.shredder;
        let fen = '';
        for (const color of COLORS) {
            const backrank = SquareSet.backrank(color);
            const king = board.kingOf(color);
            if (!defined(king) || !backrank.has(king))
                continue;
            const candidates = board.pieces(color, 'rook').intersect(backrank);
            for (const rook of unmovedRooks.intersect(candidates).reversed()) {
                if (!shredder && rook === candidates.first() && rook < king) {
                    fen += color === 'white' ? 'Q' : 'q';
                }
                else if (!shredder && rook === candidates.last() && king < rook) {
                    fen += color === 'white' ? 'K' : 'k';
                }
                else {
                    const file = FILE_NAMES[squareFile(rook)];
                    fen += color === 'white' ? file.toUpperCase() : file;
                }
            }
        }
        return fen || '-';
    }
    function makeRemainingChecks(checks) {
        return `${checks.white}+${checks.black}`;
    }
    function makeFen(setup, opts) {
        return [
            makeBoardFen(setup.board, opts) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ''),
            setup.turn[0],
            makeCastlingFen(setup.board, setup.unmovedRooks, opts),
            defined(setup.epSquare) ? makeSquare(setup.epSquare) : '-',
            ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
            ...((opts === null || opts === void 0 ? void 0 : opts.epd) ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]),
        ].join(' ');
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
            .union(pawnAttacks(opposite$1(attacker), square).intersect(board.pawn)));
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
                this.pockets[opposite$1(captured.color)][captured.role]++;
        }
        ctx() {
            const variantEnd = this.isVariantEnd();
            const king = this.board.kingOf(this.turn);
            if (!defined(king))
                return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
            const snipers = rookAttacks(king, SquareSet.empty())
                .intersect(this.board.rooksAndQueens())
                .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
                .intersect(this.board[opposite$1(this.turn)]);
            let blockers = SquareSet.empty();
            for (const sniper of snipers) {
                const b = between(king, sniper).intersect(this.board.occupied);
                if (!b.moreThanOne())
                    blockers = blockers.union(b);
            }
            const checkers = this.kingAttackers(king, opposite$1(this.turn), this.board.occupied);
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
            return defined(king) && this.kingAttackers(king, opposite$1(this.turn), this.board.occupied).nonEmpty();
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
                return { winner: opposite$1(this.turn) };
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
            this.turn = opposite$1(turn);
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
            const candidates = ourPawns.intersect(pawnAttacks(opposite$1(this.turn), this.epSquare));
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
            const otherKing = this.board.kingOf(opposite$1(this.turn));
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
                const checkers = this.kingAttackers(ourKing, opposite$1(this.turn), this.board.occupied);
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
            if (!this.board.pawn.has(pawn) || !this.board[opposite$1(this.turn)].has(pawn))
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
                if (this.kingAttackers(sq, opposite$1(this.turn), occ).nonEmpty())
                    return SquareSet.empty();
            }
            const rookTo = rookCastlesTo(this.turn, side);
            const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
            if (this.kingAttackers(kingTo, opposite$1(this.turn), after).nonEmpty())
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
            return !this.kingAttackers(ctx.king, opposite$1(this.turn), occupied).intersects(occupied);
        }
        pseudoDests(square, ctx) {
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo = attacks(piece, square, this.board.occupied);
            if (piece.role === 'pawn') {
                let captureTargets = this.board[opposite$1(this.turn)];
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
                pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite$1(this.turn)]);
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
                        if (this.kingAttackers(to, opposite$1(this.turn), occ).nonEmpty())
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
                    this.board[opposite$1(color)].diff(this.board.king).diff(this.board.queen).isEmpty());
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
            const otherKing = this.board.kingOf(opposite$1(this.turn));
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
            if (this.board.pieces(opposite$1(color), 'king').isEmpty())
                return false;
            // Bare king cannot mate.
            if (this.board[color].diff(this.board.king).isEmpty())
                return true;
            // As long as the enemy king is not alone, there is always a chance their
            // own pieces explode next to it.
            if (this.board[opposite$1(color)].diff(this.board.king).nonEmpty()) {
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
                    return { winner: opposite$1(color) };
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
            const enemy = this.board[opposite$1(this.turn)];
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
            return dests.intersect(this.board[opposite$1(this.turn)]);
        }
        hasInsufficientMaterial(color) {
            if (this.board.occupied.equals(this.board.bishop)) {
                const weSomeOnLight = this.board[color].intersects(SquareSet.lightSquares());
                const weSomeOnDark = this.board[color].intersects(SquareSet.darkSquares());
                const theyAllOnDark = this.board[opposite$1(color)].isDisjoint(SquareSet.lightSquares());
                const theyAllOnLight = this.board[opposite$1(color)].isDisjoint(SquareSet.darkSquares());
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
            const otherKing = this.board.kingOf(opposite$1(this.turn));
            if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            for (const color of COLORS) {
                if (this.board.pieces(color, 'pawn').intersects(SquareSet.backrank(opposite$1(color)))) {
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
            setup.turn = opposite$1(setup.turn);
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
    const opposite = (c) => (c === 'white' ? 'black' : 'white');
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

    function makeAutoShapesFromUci(uci, brush, modifiers) {
        return [
            {
                orig: uci.slice(0, 2),
                dest: uci.slice(2, 4),
                brush: brush,
                modifiers: modifiers,
            },
        ];
    }
    function computeAutoShapes (opts) {
        const n = opts.vm.node, hovering = opts.ceval.hovering(), color = opts.ground.state.movable.color;
        let shapes = [];
        if (hovering && hovering.fen === n.fen)
            shapes = shapes.concat(makeAutoShapesFromUci(hovering.uci, 'paleBlue'));
        if (opts.vm.showAutoShapes() && opts.vm.showComputer()) {
            if (n.eval)
                shapes = shapes.concat(makeAutoShapesFromUci(n.eval.best, 'paleGreen'));
            if (!hovering) {
                let nextBest = opts.nextNodeBest;
                if (!nextBest && opts.ceval.enabled() && n.ceval)
                    nextBest = n.ceval.pvs[0].moves[0];
                if (nextBest)
                    shapes = shapes.concat(makeAutoShapesFromUci(nextBest, 'paleBlue'));
                if (opts.ceval.enabled() &&
                    n.ceval &&
                    n.ceval.pvs &&
                    n.ceval.pvs[1] &&
                    !(opts.threatMode && n.threat && n.threat.pvs[2])) {
                    n.ceval.pvs.forEach(function (pv) {
                        if (pv.moves[0] === nextBest)
                            return;
                        const shift = povDiff(color, n.ceval.pvs[0], pv);
                        if (shift > 0.2 || isNaN(shift) || shift < 0)
                            return;
                        shapes = shapes.concat(makeAutoShapesFromUci(pv.moves[0], 'paleGrey', {
                            lineWidth: Math.round(12 - shift * 50), // 12 to 2
                        }));
                    });
                }
            }
        }
        if (opts.ceval.enabled() && opts.threatMode && n.threat) {
            if (n.threat.pvs[1]) {
                shapes = shapes.concat(makeAutoShapesFromUci(n.threat.pvs[0].moves[0], 'paleRed'));
                n.threat.pvs.slice(1).forEach(function (pv) {
                    const shift = povDiff(opposite(color), pv, n.threat.pvs[0]);
                    if (shift > 0.2 || isNaN(shift) || shift < 0)
                        return;
                    shapes = shapes.concat(makeAutoShapesFromUci(pv.moves[0], 'paleRed', {
                        lineWidth: Math.round(11 - shift * 45), // 11 to 2
                    }));
                });
            }
            else
                shapes = shapes.concat(makeAutoShapesFromUci(n.threat.pvs[0].moves[0], 'red'));
        }
        return shapes;
    }

    const root = '';
    function size(path) {
        return path.length / 2;
    }
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

    function next(ctrl) {
        const child = ctrl.vm.node.children[0];
        if (!child)
            return;
        ctrl.userJump(ctrl.vm.path + child.id);
    }
    function prev(ctrl) {
        ctrl.userJump(init(ctrl.vm.path));
    }
    function last(ctrl) {
        const toInit = !contains(ctrl.vm.path, ctrl.vm.initialPath);
        ctrl.userJump(toInit ? ctrl.vm.initialPath : fromNodeList(ctrl.vm.mainline));
    }
    function first(ctrl) {
        const toInit = ctrl.vm.path !== ctrl.vm.initialPath && contains(ctrl.vm.path, ctrl.vm.initialPath);
        ctrl.userJump(toInit ? ctrl.vm.initialPath : root);
    }

    function keyboard (ctrl) {
        window.Mousetrap.bind(['left', 'k'], () => {
            prev(ctrl);
            ctrl.redraw();
        })
            .bind(['right', 'j'], () => {
            next(ctrl);
            ctrl.redraw();
        })
            .bind(['up', '0'], () => {
            first(ctrl);
            ctrl.redraw();
        })
            .bind(['down', '$'], () => {
            last(ctrl);
            ctrl.redraw();
        })
            .bind('l', ctrl.toggleCeval)
            .bind('x', ctrl.toggleThreatMode)
            .bind('space', () => {
            if (ctrl.vm.mode === 'view') {
                if (ctrl.getCeval().enabled())
                    ctrl.playBestMove();
                else
                    ctrl.toggleCeval();
            }
        })
            .bind('z', () => lichess.pubsub.emit('zen'))
            .bind('f', ctrl.flip);
    }

    function bindMobileMousedown(el, f, redraw) {
        for (const mousedownEvent of ['touchstart', 'mousedown']) {
            el.addEventListener(mousedownEvent, e => {
                f(e);
                e.preventDefault();
                if (redraw)
                    redraw();
            }, { passive: false });
        }
    }
    function bind(eventName, f, redraw) {
        return onInsert(el => el.addEventListener(eventName, e => {
            const res = f(e);
            if (redraw)
                redraw();
            return res;
        }));
    }
    function onInsert(f) {
        return {
            insert: vnode => f(vnode.elm),
        };
    }
    const dataIcon = (icon) => ({
        'data-icon': icon,
    });

    function makePromotion (vm, getGround, redraw) {
        let promoting = false;
        function start(orig, dest, callback) {
            const g = getGround(), piece = g.state.pieces.get(dest);
            if (piece &&
                piece.role == 'pawn' &&
                ((dest[1] == '8' && g.state.turnColor == 'black') || (dest[1] == '1' && g.state.turnColor == 'white'))) {
                promoting = {
                    orig,
                    dest,
                    callback,
                };
                redraw();
                return true;
            }
            return false;
        }
        function promote(g, key, role) {
            const piece = g.state.pieces.get(key);
            if (piece && piece.role == 'pawn') {
                g.setPieces(new Map([
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
        function finish(role) {
            if (promoting) {
                promote(getGround(), promoting.dest, role);
                promoting.callback(promoting.orig, promoting.dest, role);
            }
            promoting = false;
        }
        function cancel() {
            if (promoting) {
                promoting = false;
                getGround().set(vm.cgConfig);
                redraw();
            }
        }
        function renderPromotion(dest, pieces, color, orientation) {
            if (!promoting)
                return;
            let left = (7 - key2pos(dest)[0]) * 12.5;
            if (orientation === 'white')
                left = 87.5 - left;
            const vertical = color === orientation ? 'top' : 'bottom';
            return h('div#promotion-choice.' + vertical, {
                hook: onInsert(el => {
                    el.addEventListener('click', cancel);
                    el.oncontextmenu = () => false;
                }),
            }, pieces.map(function (serverRole, i) {
                const top = (color === orientation ? i : 7 - i) * 12.5;
                return h('square', {
                    attrs: {
                        style: 'top: ' + top + '%;left: ' + left + '%',
                    },
                    hook: bind('click', e => {
                        e.stopPropagation();
                        finish(serverRole);
                    }),
                }, [h('piece.' + serverRole + '.' + color)]);
            }));
        }
        return {
            start,
            cancel,
            view() {
                if (!promoting)
                    return;
                const pieces = ['queen', 'knight', 'rook', 'bishop'];
                return renderPromotion(promoting.dest, pieces, opposite(getGround().state.turnColor), getGround().state.orientation);
            },
        };
    }

    const altCastles = {
        e1a1: 'e1c1',
        e1h1: 'e1g1',
        e8a8: 'e8c8',
        e8h8: 'e8g8',
    };

    function isAltCastle(str) {
        return str in altCastles;
    }
    function moveTest(vm, puzzle) {
        if (vm.mode === 'view')
            return;
        if (!contains(vm.path, vm.initialPath))
            return;
        const playedByColor = vm.node.ply % 2 === 1 ? 'white' : 'black';
        if (playedByColor !== vm.pov)
            return;
        const nodes = vm.nodeList.slice(size(vm.initialPath) + 1).map(node => ({
            uci: node.uci,
            castle: node.san.startsWith('O-O'),
            checkmate: node.san.endsWith('#'),
        }));
        for (const i in nodes) {
            if (nodes[i].checkmate)
                return (vm.node.puzzle = 'win');
            const uci = nodes[i].uci, solUci = puzzle.solution[i];
            if (uci != solUci && (!nodes[i].castle || !isAltCastle(uci) || altCastles[uci] != solUci))
                return (vm.node.puzzle = 'fail');
        }
        const nextUci = puzzle.solution[nodes.length];
        if (!nextUci)
            return (vm.node.puzzle = 'win');
        // from here we have a next move
        vm.node.puzzle = 'good';
        return {
            move: parseUci(nextUci),
            fen: vm.node.fen,
            path: vm.path,
        };
    }

    class PuzzleSession {
        constructor(theme, userId, streak) {
            this.theme = theme;
            this.userId = userId;
            this.streak = streak;
            this.maxSize = 100;
            this.maxAge = 1000 * 3600;
            this.default = () => ({
                theme: this.theme,
                rounds: [],
                at: Date.now(),
            });
            this.store = this.streak
                ? prop(this.default())
                : storedJsonProp(`puzzle.session.${this.userId || 'anon'}`, this.default);
            this.clear = () => this.update(s => (Object.assign(Object.assign({}, s), { rounds: [] })));
            this.get = () => {
                const prev = this.store();
                return prev.theme == this.theme && prev.at > Date.now() - this.maxAge ? prev : this.default();
            };
            this.update = (f) => this.store(f(this.get()));
            this.complete = (id, result) => this.update(s => {
                const i = s.rounds.findIndex(r => r.id == id);
                if (i == -1) {
                    s.rounds.push({ id, result });
                    if (s.rounds.length > this.maxSize)
                        s.rounds.shift();
                }
                else
                    s.rounds[i].result = result;
                s.at = Date.now();
                return s;
            });
            this.setRatingDiff = (id, ratingDiff) => this.update(s => {
                s.rounds.forEach(r => {
                    if (r.id == id)
                        r.ratingDiff = ratingDiff;
                });
                return s;
            });
            this.isNew = () => this.store().rounds.length < 2;
        }
    }

    class PuzzleStreak {
        constructor(data) {
            var _a;
            this.fail = false;
            this.onComplete = (win, current) => {
                if (win) {
                    if (this.nextId()) {
                        this.data.index++;
                        if (current)
                            this.data.current = {
                                puzzle: current.puzzle,
                                game: current.game,
                            };
                        this.store(this.data);
                    }
                    else {
                        this.store(null);
                        lichess.reload();
                    }
                }
                else {
                    this.fail = true;
                    this.store(null);
                }
            };
            this.nextId = () => this.data.ids[this.data.index + 1];
            this.skip = () => {
                this.data.skip = false;
                this.store(this.data);
            };
            this.store = storedJsonProp(`puzzle.streak.${((_a = data.user) === null || _a === void 0 ? void 0 : _a.id) || 'anon'}`, () => null);
            this.data = this.store() || {
                ids: data.streak.split(' '),
                index: 0,
                skip: true,
                current: {
                    puzzle: data.puzzle,
                    game: data.game,
                },
            };
        }
    }

    function pgnToTree(pgn) {
        const pos = Chess.default();
        const root = {
            ply: 0,
            id: '',
            fen: INITIAL_FEN,
            children: [],
        };
        let current = root;
        pgn.forEach((san, i) => {
            const move = parseSan(pos, san);
            pos.play(move);
            const nextNode = makeNode(pos, move, i + 1, san);
            current.children.push(nextNode);
            current = nextNode;
        });
        return root;
    }
    function mergeSolution(root, initialPath, solution, pov) {
        const initialNode = root.nodeAtPath(initialPath);
        const pos = Chess.fromSetup(parseFen(initialNode.fen).unwrap()).unwrap();
        const fromPly = initialNode.ply;
        const nodes = solution.map((uci, i) => {
            const move = parseUci(uci);
            const san = makeSan(pos, move);
            pos.play(move);
            const node = makeNode(pos, move, fromPly + i + 1, san);
            if ((pov == 'white') == (node.ply % 2 == 1))
                node.puzzle = 'good';
            return node;
        });
        root.addNodes(nodes, initialPath);
    }
    const makeNode = (pos, move, ply, san) => ({
        ply,
        san,
        fen: makeFen(pos.toSetup()),
        id: scalachessCharPair(move),
        uci: makeUci(move),
        check: pos.isCheck() ? makeSquare(pos.toSetup().board.kingOf(pos.turn)) : undefined,
        children: [],
    });

    function makeCtrl (opts, redraw) {
        var _a;
        const vm = {
            next: defer(),
        };
        let data, tree, ceval;
        const hasStreak = !!opts.data.streak;
        const autoNext = storedProp(`puzzle.autoNext${hasStreak ? '.streak' : ''}`, hasStreak);
        const ground = prop(undefined);
        const threatMode = prop(false);
        const streak = opts.data.streak ? new PuzzleStreak(opts.data) : undefined;
        const streakFailStorage = lichess.storage.make('puzzle.streak.fail');
        if (streak) {
            opts.data = Object.assign(Object.assign({}, opts.data), streak.data.current);
            streakFailStorage.listen(_ => failStreak(streak));
        }
        const session = new PuzzleSession(opts.data.theme.key, (_a = opts.data.user) === null || _a === void 0 ? void 0 : _a.id, hasStreak);
        // required by ceval
        vm.showComputer = () => vm.mode === 'view';
        vm.showAutoShapes = () => true;
        const throttleSound = (name) => throttle(100, () => lichess.sound.play(name));
        const loadSound = (file, volume, delay) => {
            setTimeout(() => lichess.sound.loadOggOrMp3(file, `${lichess.sound.baseUrl}/${file}`), delay || 1000);
            return () => lichess.sound.play(file, volume);
        };
        const sound = {
            move: throttleSound('move'),
            capture: throttleSound('capture'),
            check: throttleSound('check'),
            good: loadSound('lisp/PuzzleStormGood', 0.7, 500),
            end: loadSound('lisp/PuzzleStormEnd', 1, 1000),
        };
        let flipped = false;
        function setPath(path) {
            vm.path = path;
            vm.nodeList = tree.getNodeList(path);
            vm.node = last$1(vm.nodeList);
            vm.mainline = mainlineNodeList(tree.root);
        }
        function withGround(f) {
            const g = ground();
            return g && f(g);
        }
        function initiate(fromData) {
            data = fromData;
            tree = build(pgnToTree(data.game.pgn.split(' ')));
            const initialPath = fromNodeList(mainlineNodeList(tree.root));
            vm.mode = 'play';
            vm.next = defer();
            vm.round = undefined;
            vm.justPlayed = undefined;
            vm.resultSent = false;
            vm.lastFeedback = 'init';
            vm.initialPath = initialPath;
            vm.initialNode = tree.nodeAtPath(initialPath);
            vm.pov = vm.initialNode.ply % 2 == 1 ? 'black' : 'white';
            setPath(init(initialPath));
            setTimeout(() => {
                jump(initialPath);
                redraw();
            }, 500);
            // just to delay button display
            vm.canViewSolution = false;
            setTimeout(() => {
                vm.canViewSolution = true;
                redraw();
            }, 4000);
            withGround(g => {
                g.setAutoShapes([]);
                g.setShapes([]);
                showGround(g);
            });
            instanciateCeval();
        }
        function position() {
            const setup = parseFen(vm.node.fen).unwrap();
            return Chess.fromSetup(setup).unwrap();
        }
        function makeCgOpts() {
            const node = vm.node;
            const color = node.ply % 2 === 0 ? 'white' : 'black';
            const dests = chessgroundDests(position());
            const nextNode = vm.node.children[0];
            const canMove = vm.mode === 'view' || (color === vm.pov && (!nextNode || nextNode.puzzle == 'fail'));
            const movable = canMove
                ? {
                    color: dests.size > 0 ? color : undefined,
                    dests,
                }
                : {
                    color: undefined,
                    dests: new Map(),
                };
            const config = {
                fen: node.fen,
                orientation: flipped ? opposite$1(vm.pov) : vm.pov,
                turnColor: color,
                movable: movable,
                premovable: {
                    enabled: false,
                },
                check: !!node.check,
                lastMove: uciToLastMove(node.uci),
            };
            if (node.ply >= vm.initialNode.ply) {
                if (vm.mode !== 'view' && color !== vm.pov && !nextNode) {
                    config.movable.color = vm.pov;
                    config.premovable.enabled = true;
                }
            }
            vm.cgConfig = config;
            return config;
        }
        function showGround(g) {
            g.set(makeCgOpts());
        }
        function userMove(orig, dest) {
            vm.justPlayed = orig;
            if (!promotion.start(orig, dest, playUserMove))
                playUserMove(orig, dest);
        }
        function playUci(uci) {
            sendMove(parseUci(uci));
        }
        function playUserMove(orig, dest, promotion) {
            sendMove({
                from: parseSquare(orig),
                to: parseSquare(dest),
                promotion,
            });
        }
        function sendMove(move) {
            sendMoveAt(vm.path, position(), move);
        }
        function sendMoveAt(path, pos, move) {
            move = pos.normalizeMove(move);
            const san = makeSanAndPlay(pos, move);
            const check = pos.isCheck() ? pos.board.kingOf(pos.turn) : undefined;
            addNode({
                ply: 2 * (pos.fullmoves - 1) + (pos.turn == 'white' ? 0 : 1),
                fen: makeFen(pos.toSetup()),
                id: scalachessCharPair(move),
                uci: makeUci(move),
                san,
                check: defined$1(check) ? makeSquare(check) : undefined,
                children: [],
            }, path);
        }
        function uciToLastMove(uci) {
            // assuming standard chess
            return defined$1(uci) ? [uci.substr(0, 2), uci.substr(2, 2)] : undefined;
        }
        function addNode(node$1, path) {
            const newPath = tree.addNode(node$1, path);
            jump(newPath);
            withGround(g => g.playPremove());
            const progress = moveTest(vm, data.puzzle);
            if (progress)
                applyProgress(progress);
            reorderChildren(path);
            redraw();
            node(node$1, false);
        }
        function reorderChildren(path, recursive) {
            const node = tree.nodeAtPath(path);
            node.children.sort((c1, _) => {
                const p = c1.puzzle;
                if (p == 'fail')
                    return 1;
                if (p == 'good' || p == 'win')
                    return -1;
                return 0;
            });
            if (recursive)
                node.children.forEach(child => reorderChildren(path + child.id, true));
        }
        function revertUserMove() {
            setTimeout(() => {
                withGround(g => g.cancelPremove());
                userJump(init(vm.path));
                redraw();
            }, 100);
        }
        function applyProgress(progress) {
            if (progress === 'fail') {
                vm.lastFeedback = 'fail';
                revertUserMove();
                if (vm.mode === 'play') {
                    if (streak) {
                        failStreak(streak);
                        streakFailStorage.fire();
                    }
                    else {
                        vm.canViewSolution = true;
                        vm.mode = 'try';
                        sendResult(false);
                    }
                }
            }
            else if (progress == 'win') {
                if (streak)
                    sound.good();
                vm.lastFeedback = 'win';
                if (vm.mode != 'view') {
                    const sent = vm.mode == 'play' ? sendResult(true) : Promise.resolve();
                    vm.mode = 'view';
                    withGround(showGround);
                    sent.then(_ => (autoNext() ? nextPuzzle() : startCeval()));
                }
            }
            else if (progress) {
                vm.lastFeedback = 'good';
                setTimeout(() => {
                    const pos = Chess.fromSetup(parseFen(progress.fen).unwrap()).unwrap();
                    sendMoveAt(progress.path, pos, progress.move);
                }, opts.pref.animation.duration * (autoNext() ? 1 : 1.5));
            }
        }
        function failStreak(streak) {
            vm.mode = 'view';
            streak.onComplete(false);
            setTimeout(viewSolution, 500);
            sound.end();
        }
        function sendResult(win) {
            if (vm.resultSent)
                return Promise.resolve();
            vm.resultSent = true;
            session.complete(data.puzzle.id, win);
            return complete(data.puzzle.id, data.theme.key, win, data.replay, streak).then((res) => {
                var _a;
                if ((res === null || res === void 0 ? void 0 : res.replayComplete) && data.replay)
                    return lichess.redirect(`/training/dashboard/${data.replay.days}`);
                if ((res === null || res === void 0 ? void 0 : res.next.user) && data.user) {
                    data.user.rating = res.next.user.rating;
                    data.user.provisional = res.next.user.provisional;
                    vm.round = res.round;
                    if ((_a = res.round) === null || _a === void 0 ? void 0 : _a.ratingDiff)
                        session.setRatingDiff(data.puzzle.id, res.round.ratingDiff);
                }
                if (win)
                    success();
                vm.next.resolve(res.next);
                if (streak && win)
                    streak.onComplete(true, res.next);
                redraw();
            });
        }
        function nextPuzzle() {
            ceval.stop();
            vm.next.promise.then(initiate).then(redraw);
            if (!streak && !data.replay) {
                const path = `/training/${data.theme.key}`;
                if (location.pathname != path)
                    history.replaceState(null, '', path);
            }
        }
        function instanciateCeval() {
            if (ceval)
                ceval.destroy();
            ceval = cevalCtrl({
                redraw,
                storageKeyPrefix: 'puzzle',
                multiPvDefault: 3,
                variant: {
                    short: 'Std',
                    name: 'Standard',
                    key: 'standard',
                },
                standardMaterial: true,
                possible: true,
                emit: function (ev, work) {
                    tree.updateAt(work.path, function (node) {
                        if (work.threatMode) {
                            if (!node.threat || node.threat.depth <= ev.depth || node.threat.maxDepth < ev.maxDepth)
                                node.threat = ev;
                        }
                        else if (!node.ceval || node.ceval.depth <= ev.depth || node.ceval.maxDepth < ev.maxDepth)
                            node.ceval = ev;
                        if (work.path === vm.path) {
                            setAutoShapes();
                            redraw();
                        }
                    });
                },
                setAutoShapes: setAutoShapes,
            });
        }
        function setAutoShapes() {
            withGround(g => {
                g.setAutoShapes(computeAutoShapes({
                    vm: vm,
                    ceval: ceval,
                    ground: g,
                    threatMode: threatMode(),
                    nextNodeBest: nextNodeBest(),
                }));
            });
        }
        function canUseCeval() {
            return vm.mode === 'view' && !outcome();
        }
        function startCeval() {
            if (ceval.enabled() && canUseCeval())
                doStartCeval();
        }
        const doStartCeval = throttle(800, function () {
            ceval.start(vm.path, vm.nodeList, threatMode());
        });
        const nextNodeBest = () => withMainlineChild(vm.node, n => { var _a; return (_a = n.eval) === null || _a === void 0 ? void 0 : _a.best; });
        const getCeval = () => ceval;
        function toggleCeval() {
            ceval.toggle();
            setAutoShapes();
            startCeval();
            if (!ceval.enabled())
                threatMode(false);
            vm.autoScrollRequested = true;
            redraw();
        }
        function toggleThreatMode() {
            if (vm.node.check)
                return;
            if (!ceval.enabled())
                ceval.toggle();
            if (!ceval.enabled())
                return;
            threatMode(!threatMode());
            setAutoShapes();
            startCeval();
            redraw();
        }
        function outcome() {
            return position().outcome();
        }
        function jump(path) {
            const pathChanged = path !== vm.path, isForwardStep = pathChanged && path.length === vm.path.length + 2;
            setPath(path);
            withGround(showGround);
            if (pathChanged) {
                if (isForwardStep) {
                    if (!vm.node.uci)
                        sound.move();
                    // initial position
                    else if (!vm.justPlayed || vm.node.uci.includes(vm.justPlayed)) {
                        if (vm.node.san.includes('x'))
                            sound.capture();
                        else
                            sound.move();
                    }
                    if (/\+|#/.test(vm.node.san))
                        sound.check();
                }
                threatMode(false);
                ceval.stop();
                startCeval();
            }
            promotion.cancel();
            vm.justPlayed = undefined;
            vm.autoScrollRequested = true;
            lichess.pubsub.emit('ply', vm.node.ply);
        }
        function userJump(path) {
            var _a;
            if (((_a = tree.nodeAtPath(path)) === null || _a === void 0 ? void 0 : _a.puzzle) == 'fail' && vm.mode != 'view')
                return;
            withGround(g => g.selectSquare(null));
            jump(path);
            node(vm.node, true);
        }
        function viewSolution() {
            sendResult(false);
            vm.mode = 'view';
            mergeSolution(tree, vm.initialPath, data.puzzle.solution, vm.pov);
            reorderChildren(vm.initialPath, true);
            // try and play the solution next move
            const next = vm.node.children[0];
            if (next && next.puzzle === 'good')
                userJump(vm.path + next.id);
            else {
                const firstGoodPath = takePathWhile(vm.mainline, node => node.puzzle != 'good');
                if (firstGoodPath)
                    userJump(firstGoodPath + tree.nodeAtPath(firstGoodPath).children[0].id);
            }
            vm.autoScrollRequested = true;
            vm.voteDisabled = true;
            redraw();
            startCeval();
            setTimeout(() => {
                vm.voteDisabled = false;
                redraw();
            }, 500);
        }
        const skip = () => {
            if (!streak || !streak.data.skip || vm.mode != 'play')
                return;
            streak.skip();
            userJump(fromNodeList(vm.mainline));
            const moveIndex = size(vm.path) - size(vm.initialPath);
            const solution = data.puzzle.solution[moveIndex];
            playUci(solution);
            playBestMove();
        };
        const flip = () => {
            flipped = !flipped;
            withGround(g => g.toggleOrientation());
            redraw();
        };
        const vote$1 = (v) => {
            if (!vm.voteDisabled) {
                vote(data.puzzle.id, v);
                nextPuzzle();
            }
        };
        const voteTheme$1 = (theme, v) => {
            if (vm.round) {
                vm.round.themes = vm.round.themes || {};
                if (v === vm.round.themes[theme]) {
                    delete vm.round.themes[theme];
                    voteTheme(data.puzzle.id, theme, undefined);
                }
                else {
                    if (v || data.puzzle.themes.includes(theme))
                        vm.round.themes[theme] = v;
                    else
                        delete vm.round.themes[theme];
                    voteTheme(data.puzzle.id, theme, v);
                }
                redraw();
            }
        };
        initiate(opts.data);
        const promotion = makePromotion(vm, ground, redraw);
        function playBestMove() {
            const uci = nextNodeBest() || (vm.node.ceval && vm.node.ceval.pvs[0].moves[0]);
            if (uci)
                playUci(uci);
        }
        keyboard({
            vm,
            userJump,
            getCeval,
            toggleCeval,
            toggleThreatMode,
            redraw,
            playBestMove,
            flip,
            flipped: () => flipped,
        });
        // If the page loads while being hidden (like when changing settings),
        // chessground is not displayed, and the first move is not fully applied.
        // Make sure chessground is fully shown when the page goes back to being visible.
        document.addEventListener('visibilitychange', () => lichess.requestIdleCallback(() => jump(vm.path), 500));
        setup();
        lichess.pubsub.on('zen', () => {
            const zen = !$('body').hasClass('zen');
            $('body').toggleClass('zen', zen);
            window.dispatchEvent(new Event('resize'));
            setZen(zen);
        });
        $('body').addClass('playing'); // for zen
        $('#zentog').on('click', () => lichess.pubsub.emit('zen'));
        return {
            vm,
            getData() {
                return data;
            },
            getTree() {
                return tree;
            },
            ground,
            makeCgOpts,
            userJump,
            viewSolution,
            nextPuzzle,
            vote: vote$1,
            voteTheme: voteTheme$1,
            getCeval,
            pref: opts.pref,
            difficulty: opts.difficulty,
            trans: lichess.trans(opts.i18n),
            autoNext,
            autoNexting: () => vm.lastFeedback == 'win' && autoNext(),
            outcome,
            toggleCeval,
            toggleThreatMode,
            threatMode,
            currentEvals() {
                return { client: vm.node.ceval };
            },
            nextNodeBest,
            userMove,
            playUci,
            showEvalGauge() {
                return vm.showComputer() && ceval.enabled();
            },
            getOrientation() {
                return withGround(g => g.state.orientation);
            },
            getNode() {
                return vm.node;
            },
            showComputer: vm.showComputer,
            promotion,
            redraw,
            ongoing: false,
            playBestMove,
            session,
            allThemes: opts.themes && {
                dynamic: opts.themes.dynamic.split(' '),
                static: new Set(opts.themes.static.split(' ')),
            },
            streak,
            skip,
            flip,
            flipped: () => flipped,
        };
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

    let numberFormatter = false;
    const numberFormat = (n) => {
        if (numberFormatter === false)
            numberFormatter = window.Intl && Intl.NumberFormat ? new Intl.NumberFormat() : null;
        if (numberFormatter === null)
            return '' + n;
        return numberFormatter.format(n);
    };

    function puzzleBox(ctrl) {
        const data = ctrl.getData();
        return h('div.puzzle__side__metas', [puzzleInfos(ctrl, data.puzzle), gameInfos(ctrl, data.game, data.puzzle)]);
    }
    function puzzleInfos(ctrl, puzzle) {
        return h('div.infos.puzzle', {
            attrs: dataIcon('-'),
        }, [
            h('div', [
                ctrl.streak
                    ? null
                    : h('p', ctrl.trans.vdom('puzzleId', h('a', {
                        attrs: Object.assign({ href: `/training/${puzzle.id}` }, (ctrl.streak ? { target: '_blank' } : {})),
                    }, '#' + puzzle.id))),
                h('p', ctrl.trans.vdom('ratingX', !ctrl.streak && ctrl.vm.mode === 'play'
                    ? h('span.hidden', ctrl.trans.noarg('hidden'))
                    : h('strong', puzzle.rating))),
                h('p', ctrl.trans.vdom('playedXTimes', h('strong', numberFormat(puzzle.plays)))),
            ]),
        ]);
    }
    function gameInfos(ctrl, game, puzzle) {
        const gameName = `${game.clock} • ${game.perf.name}`;
        return h('div.infos', {
            attrs: dataIcon(game.perf.icon),
        }, [
            h('div', [
                h('p', ctrl.trans.vdom('fromGameLink', ctrl.vm.mode == 'play'
                    ? h('span', gameName)
                    : h('a', {
                        attrs: { href: `/${game.id}/${ctrl.vm.pov}#${puzzle.initialPly}` },
                    }, gameName))),
                h('div.players', game.players.map(p => h('div.player.color-icon.is.text.' + p.color, p.userId != 'anon'
                    ? h('a.user-link.ulpt', {
                        attrs: { href: '/@/' + p.userId },
                    }, p.title && p.title != 'BOT' ? [h('span.utitle', p.title), ' ' + p.name] : p.name)
                    : p.name))),
            ]),
        ]);
    }
    const renderStreak$1 = (streak, noarg) => h('div.puzzle__side__streak', streak.data.index == 0
        ? h('div.puzzle__side__streak__info', [
            h('h1.text', {
                attrs: dataIcon('}'),
            }, 'Puzzle Streak'),
            h('p', noarg('streakDescription')),
        ])
        : h('div.puzzle__side__streak__score.text', {
            attrs: dataIcon('}'),
        }, streak.data.index));
    const userBox = (ctrl) => {
        var _a;
        const data = ctrl.getData();
        if (!data.user)
            return h('div.puzzle__side__user', [
                h('p', ctrl.trans.noarg('toGetPersonalizedPuzzles')),
                h('a.button', { attrs: { href: '/signup' } }, ctrl.trans.noarg('signUp')),
            ]);
        const diff = (_a = ctrl.vm.round) === null || _a === void 0 ? void 0 : _a.ratingDiff;
        return h('div.puzzle__side__user', [
            h('div.puzzle__side__user__rating', ctrl.trans.vdom('yourPuzzleRatingX', h('strong', [
                data.user.rating - (diff || 0),
                ...(diff && diff > 0 ? [' ', h('good.rp', '+' + diff)] : []),
                ...(diff && diff < 0 ? [' ', h('bad.rp', '−' + -diff)] : []),
            ]))),
        ]);
    };
    const streakBox = (ctrl) => h('div.puzzle__side__user', renderStreak$1(ctrl.streak, ctrl.trans.noarg));
    const difficulties = [
        ['easiest', -600],
        ['easier', -300],
        ['normal', 0],
        ['harder', 300],
        ['hardest', 600],
    ];
    function replay(ctrl) {
        const replay = ctrl.getData().replay;
        if (!replay)
            return;
        const i = replay.i + (ctrl.vm.mode == 'play' ? 0 : 1);
        return h('div.puzzle__side__replay', [
            h('a', {
                attrs: {
                    href: `/training/dashboard/${replay.days}`,
                },
            }, ['« ', `Replaying ${ctrl.trans.noarg(ctrl.getData().theme.key)} puzzles`]),
            h('div.puzzle__side__replay__bar', {
                attrs: {
                    style: `--p:${replay.of ? Math.round((100 * i) / replay.of) : 1}%`,
                    'data-text': `${i} / ${replay.of}`,
                },
            }),
        ]);
    }
    function config(ctrl) {
        const id = 'puzzle-toggle-autonext';
        return h('div.puzzle__side__config', [
            h('div.puzzle__side__config__jump', [
                h('div.switch', [
                    h(`input#${id}.cmn-toggle.cmn-toggle--subtle`, {
                        attrs: {
                            type: 'checkbox',
                            checked: ctrl.autoNext(),
                        },
                        hook: {
                            insert: vnode => vnode.elm.addEventListener('change', () => ctrl.autoNext(!ctrl.autoNext())),
                        },
                    }),
                    h('label', { attrs: { for: id } }),
                ]),
                h('label', { attrs: { for: id } }, ctrl.trans.noarg('jumpToNextPuzzleImmediately')),
            ]),
            !ctrl.getData().replay && !ctrl.streak && ctrl.difficulty
                ? h('form.puzzle__side__config__difficulty', {
                    attrs: {
                        action: `/training/difficulty/${ctrl.getData().theme.key}`,
                        method: 'post',
                    },
                }, [
                    h('label', {
                        attrs: { for: 'puzzle-difficulty' },
                    }, ctrl.trans.noarg('difficultyLevel')),
                    h('select#puzzle-difficulty.puzzle__difficulty__selector', {
                        attrs: { name: 'difficulty' },
                        hook: onInsert(elm => elm.addEventListener('change', () => elm.parentNode.submit())),
                    }, difficulties.map(([key, delta]) => h('option', {
                        attrs: {
                            value: key,
                            selected: key == ctrl.difficulty,
                            title: !!delta &&
                                ctrl.trans.plural(delta < 0 ? 'nbPointsBelowYourPuzzleRating' : 'nbPointsAboveYourPuzzleRating', Math.abs(delta)),
                        },
                    }, [ctrl.trans.noarg(key), delta ? ` (${delta > 0 ? '+' : ''}${delta})` : '']))),
                ])
                : null,
            h('div.puzzle__side__config__toggles', [
                h('a.puzzle__side__config__zen.button.button-empty', {
                    hook: bind('click', () => lichess.pubsub.emit('zen')),
                    attrs: {
                        title: 'Keyboard: z',
                    },
                }, ctrl.trans.noarg('zenMode')),
                h('a.puzzle__side__config__flip.button', {
                    class: { active: ctrl.flipped(), 'button-empty': !ctrl.flipped() },
                    hook: bind('click', ctrl.flip),
                    attrs: {
                        title: 'Keyboard: f',
                    },
                }, ctrl.trans.noarg('flipBoard')),
            ]),
        ]);
    }

    const studyUrl = 'https://lichess.org/study/viiWlKjv';
    function theme(ctrl) {
        const t = ctrl.getData().theme;
        return ctrl.streak || ctrl.getData().replay
            ? null
            : h('div.puzzle__side__theme', [
                h('a', { attrs: { href: '/training/themes' } }, h('h2', ['« ', t.name])),
                h('p', [
                    t.desc,
                    t.chapter &&
                        h('a.puzzle__side__theme__chapter.text', {
                            attrs: {
                                href: `${studyUrl}/${t.chapter}`,
                                target: '_blank',
                            },
                        }, [' ', ctrl.trans.noarg('example')]),
                ]),
                ctrl.vm.mode != 'view' || ctrl.autoNexting() ? null : editor(ctrl),
            ]);
    }
    const invisibleThemes = new Set(['master', 'masterVsMaster', 'superGM']);
    const editor = (ctrl) => {
        var _a;
        const data = ctrl.getData(), trans = ctrl.trans.noarg, votedThemes = ((_a = ctrl.vm.round) === null || _a === void 0 ? void 0 : _a.themes) || {};
        const visibleThemes = data.puzzle.themes
            .filter(t => !invisibleThemes.has(t))
            .concat(Object.keys(votedThemes).filter(t => votedThemes[t] && !data.puzzle.themes.includes(t)))
            .sort();
        const allThemes = location.pathname == '/training/daily' ? null : ctrl.allThemes;
        const availableThemes = allThemes ? allThemes.dynamic.filter(t => !votedThemes[t]) : null;
        if (availableThemes)
            availableThemes.sort((a, b) => (trans(a) < trans(b) ? -1 : 1));
        return h('div.puzzle__themes', [
            h('div.puzzle__themes_list', {
                hook: bind('click', e => {
                    const target = e.target;
                    const theme = target.getAttribute('data-theme');
                    if (theme)
                        ctrl.voteTheme(theme, target.classList.contains('vote-up'));
                }),
            }, visibleThemes.map(key => h('div.puzzle__themes__list__entry', {
                class: {
                    strike: votedThemes[key] === false,
                },
            }, [
                h('a', {
                    attrs: {
                        href: `/training/${key}`,
                        title: trans(`${key}Description`),
                    },
                }, trans(key)),
                !allThemes
                    ? null
                    : h('div.puzzle__themes__votes', allThemes.static.has(key)
                        ? [
                            h('div.puzzle__themes__lock', h('i', {
                                attrs: dataIcon('a'),
                            })),
                        ]
                        : [
                            h('span.puzzle__themes__vote.vote-up', {
                                class: { active: votedThemes[key] },
                                attrs: { 'data-theme': key },
                            }),
                            h('span.puzzle__themes__vote.vote-down', {
                                class: { active: votedThemes[key] === false },
                                attrs: { 'data-theme': key },
                            }),
                        ]),
            ]))),
            ...(availableThemes
                ? [
                    h(`select.puzzle__themes__selector.cache-bust-${availableThemes.length}`, {
                        hook: Object.assign(Object.assign({}, bind('change', e => {
                            const theme = e.target.value;
                            if (theme)
                                ctrl.voteTheme(theme, true);
                        })), { postpatch(_, vnode) {
                                vnode.elm.value = '';
                            } }),
                    }, [
                        h('option', {
                            attrs: { value: '', selected: true },
                        }, trans('addAnotherTheme')),
                        ...availableThemes.map(theme => h('option', {
                            attrs: {
                                value: theme,
                                title: trans(`${theme}Description`),
                            },
                        }, trans(theme))),
                    ]),
                    h('a.puzzle__themes__study.text', {
                        attrs: {
                            'data-icon': '',
                            href: studyUrl,
                            target: '_blank',
                        },
                    }, 'About puzzle themes'),
                ]
                : []),
        ]);
    };

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
        state.orientation = opposite(state.orientation);
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
        state.turnColor = opposite(state.turnColor);
        return true;
    }
    function baseUserMove(state, orig, dest) {
        const result = baseMove(state, orig, dest);
        if (result) {
            state.movable.dests = undefined;
            state.turnColor = opposite(state.turnColor);
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

    const initial$1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const roles = {
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
            fen = initial$1;
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
                            role: roles[role],
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
        return state.animation.enabled ? animate(mutation, state) : render$2(mutation, state);
    }
    function render$2(mutation, state) {
        const result = mutation(state);
        state.dom.redraw();
        return result;
    }
    function makePiece(key, piece) {
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
            prePieces.set(k, makePiece(k, p));
        }
        for (const key of allKeys) {
            curP = current.pieces.get(key);
            preP = prePieces.get(key);
            if (curP) {
                if (preP) {
                    if (!samePiece(curP, preP.piece)) {
                        missings.push(preP);
                        news.push(makePiece(key, curP));
                    }
                }
                else
                    news.push(makePiece(key, curP));
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
    function start$2(state, e) {
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
            cancel$1(state);
        }
    }
    function cancel$1(state) {
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

    function start$1(s, e) {
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
                cancel(s);
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
    function cancel(s) {
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
    function start(state, redrawAll) {
        function toggleOrientation$1() {
            toggleOrientation(state);
            redrawAll();
        }
        return {
            set(config) {
                if (config.orientation && config.orientation !== state.orientation)
                    toggleOrientation$1();
                (config.fen ? anim : render$2)(state => configure(state, config), state);
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
                render$2(unsetPremove, state);
            },
            cancelPredrop() {
                render$2(unsetPredrop, state);
            },
            cancelMove() {
                render$2(state => {
                    cancelMove(state);
                    cancel(state);
                }, state);
            },
            stop() {
                render$2(state => {
                    stop(state);
                    cancel(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$2(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$2(state => (state.drawable.shapes = shapes), state);
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
            pieces: read(initial$1),
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
                cancel(s);
            else if (s.drawable.current)
                cancel$1(s);
            else if (e.shiftKey || isRightButton(e)) {
                if (s.drawable.enabled)
                    start$2(s, e);
            }
            else if (!s.viewOnly) {
                if (s.dropmode.active)
                    drop(s, e);
                else
                    start$1(s, e);
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
    function render$1(s) {
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
                render$1(state);
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
        return start(redrawAll(), redrawAll);
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

    function chessground (ctrl) {
        return h('div.cg-wrap', {
            hook: {
                insert: vnode => ctrl.ground(Chessground(vnode.elm, makeConfig(ctrl))),
                destroy: _ => ctrl.ground().destroy(),
            },
        });
    }
    function makeConfig(ctrl) {
        const opts = ctrl.makeCgOpts();
        return {
            fen: opts.fen,
            orientation: opts.orientation,
            turnColor: opts.turnColor,
            check: opts.check,
            lastMove: opts.lastMove,
            coordinates: ctrl.pref.coords !== 0 /* Hidden */,
            addPieceZIndex: ctrl.pref.is3d,
            movable: {
                free: false,
                color: opts.movable.color,
                dests: opts.movable.dests,
                showDests: ctrl.pref.destination,
                rookCastle: ctrl.pref.rookCastle,
            },
            draggable: {
                enabled: ctrl.pref.moveEvent > 0,
                showGhost: ctrl.pref.highlight,
            },
            selectable: {
                enabled: ctrl.pref.moveEvent !== 1,
            },
            events: {
                move: ctrl.userMove,
                insert(elements) {
                    resizeHandle(elements, 2 /* Always */, ctrl.vm.node.ply, _ => true);
                    if (ctrl.pref.coords === 1 /* Inside */)
                        changeColorHandle();
                },
            },
            premovable: {
                enabled: opts.premovable.enabled,
            },
            drawable: {
                enabled: true,
                defaultSnapToValidMove: (lichess.storage.get('arrow.snap') || 1) != '0',
            },
            highlight: {
                lastMove: ctrl.pref.highlight,
                check: ctrl.pref.highlight,
            },
            animation: {
                enabled: true,
                duration: ctrl.pref.animation.duration,
            },
            disableContextMenu: true,
        };
    }

    const renderVote = (ctrl) => {
        var _a;
        return h('div.puzzle__vote', ctrl.autoNexting()
            ? []
            : [
                ctrl.session.isNew() && ((_a = ctrl.getData().user) === null || _a === void 0 ? void 0 : _a.provisional)
                    ? h('div.puzzle__vote__help', [
                        h('p', ctrl.trans.noarg('didYouLikeThisPuzzle')),
                        h('p', ctrl.trans.noarg('voteToLoadNextOne')),
                    ])
                    : null,
                h('div.puzzle__vote__buttons', {
                    class: {
                        enabled: !ctrl.vm.voteDisabled,
                    },
                }, [
                    h('div.vote.vote-up', {
                        hook: bind('click', () => ctrl.vote(true)),
                    }),
                    h('div.vote.vote-down', {
                        hook: bind('click', () => ctrl.vote(false)),
                    }),
                ]),
            ]);
    };
    const renderContinue = (ctrl) => h('a.continue', {
        hook: bind('click', ctrl.nextPuzzle),
    }, [h('i', { attrs: dataIcon('G') }), ctrl.trans.noarg('continueTraining')]);
    const renderStreak = (ctrl) => {
        var _a;
        return [
            h('div.complete', [
                h('span.game-over', 'GAME OVER'),
                h('span', ctrl.trans.vdom('yourStreakX', h('strong', (_a = ctrl.streak) === null || _a === void 0 ? void 0 : _a.data.index))),
            ]),
            h('a.continue', {
                attrs: { href: '/streak' },
            }, [h('i', { attrs: dataIcon('G') }), ctrl.trans('newStreak')]),
        ];
    };
    function afterView (ctrl) {
        const data = ctrl.getData();
        const win = ctrl.vm.lastFeedback == 'win';
        return h('div.puzzle__feedback.after', ctrl.streak && !win
            ? renderStreak(ctrl)
            : [
                h('div.complete', ctrl.trans.noarg(win ? 'puzzleSuccess' : 'puzzleComplete')),
                data.user ? renderVote(ctrl) : renderContinue(ctrl),
                h('div.puzzle__more', [
                    h('a', {
                        attrs: {
                            'data-icon': '',
                            href: `/analysis/${ctrl.vm.node.fen.replace(/ /g, '_')}?color=${ctrl.vm.pov}#practice`,
                            title: ctrl.trans.noarg('playWithTheMachine'),
                            target: '_blank',
                        },
                    }),
                    data.user
                        ? h('a', {
                            hook: bind('click', ctrl.nextPuzzle),
                        }, ctrl.trans.noarg(ctrl.streak ? 'continueTheStreak' : 'continueTraining'))
                        : undefined,
                ]),
            ]);
    }

    const viewSolution = (ctrl) => {
        var _a;
        return ctrl.streak
            ? h('div.view_solution.skip', {
                class: { show: !!((_a = ctrl.streak) === null || _a === void 0 ? void 0 : _a.data.skip) },
            }, [
                h('a.button.button-empty', {
                    hook: bind('click', ctrl.skip),
                    attrs: {
                        title: ctrl.trans.noarg('streakSkipExplanation'),
                    },
                }, ctrl.trans.noarg('skip')),
            ])
            : h('div.view_solution', {
                class: { show: ctrl.vm.canViewSolution },
            }, [
                h('a.button.button-empty', {
                    hook: bind('click', ctrl.viewSolution),
                }, ctrl.trans.noarg('viewTheSolution')),
            ]);
    };
    const initial = (ctrl) => h('div.puzzle__feedback.play', [
        h('div.player', [
            h('div.no-square', h('piece.king.' + ctrl.vm.pov)),
            h('div.instruction', [
                h('strong', ctrl.trans.noarg('yourTurn')),
                h('em', ctrl.trans.noarg(ctrl.vm.pov === 'white' ? 'findTheBestMoveForWhite' : 'findTheBestMoveForBlack')),
            ]),
        ]),
        viewSolution(ctrl),
    ]);
    const good = (ctrl) => h('div.puzzle__feedback.good', [
        h('div.player', [
            h('div.icon', '✓'),
            h('div.instruction', [h('strong', ctrl.trans.noarg('bestMove')), h('em', ctrl.trans.noarg('keepGoing'))]),
        ]),
        viewSolution(ctrl),
    ]);
    const fail = (ctrl) => h('div.puzzle__feedback.fail', [
        h('div.player', [
            h('div.icon', '✗'),
            h('div.instruction', [
                h('strong', ctrl.trans.noarg('notTheMove')),
                h('em', ctrl.trans.noarg('trySomethingElse')),
            ]),
        ]),
        viewSolution(ctrl),
    ]);
    function feedbackView (ctrl) {
        if (ctrl.vm.mode === 'view')
            return afterView(ctrl);
        switch (ctrl.vm.lastFeedback) {
            case 'init':
                return initial(ctrl);
            case 'good':
                return good(ctrl);
            case 'fail':
                return fail(ctrl);
        }
        return;
    }

    const autoScroll = throttle(150, (ctrl, el) => {
        const cont = el.parentNode;
        const target = el.querySelector('.active');
        if (!target) {
            cont.scrollTop = ctrl.vm.path === root ? 0 : 99999;
            return;
        }
        cont.scrollTop = target.offsetTop - cont.offsetHeight / 2 + target.offsetHeight;
    });
    function pathContains(ctx, path) {
        return contains(ctx.ctrl.vm.path, path);
    }
    function plyToTurn(ply) {
        return Math.floor((ply - 1) / 2) + 1;
    }
    function renderIndex(ply, withDots) {
        return h('index', plyToTurn(ply) + (withDots ? (ply % 2 === 1 ? '.' : '...') : ''));
    }
    function renderChildrenOf(ctx, node, opts) {
        const cs = node.children, main = cs[0];
        if (!main)
            return [];
        if (opts.isMainline) {
            const isWhite = main.ply % 2 === 1;
            if (!cs[1])
                return [
                    isWhite ? renderIndex(main.ply, false) : null,
                    ...renderMoveAndChildrenOf(ctx, main, {
                        parentPath: opts.parentPath,
                        isMainline: true,
                    }),
                ];
            const mainChildren = renderChildrenOf(ctx, main, {
                parentPath: opts.parentPath + main.id,
                isMainline: true,
            }), passOpts = {
                parentPath: opts.parentPath,
                isMainline: true,
            };
            return [
                isWhite ? renderIndex(main.ply, false) : null,
                renderMoveOf(ctx, main, passOpts),
                isWhite ? emptyMove() : null,
                h('interrupt', renderLines(ctx, cs.slice(1), {
                    parentPath: opts.parentPath,
                    isMainline: true,
                })),
                ...(isWhite && mainChildren ? [renderIndex(main.ply, false), emptyMove()] : []),
                ...mainChildren,
            ];
        }
        return cs[1] ? [renderLines(ctx, cs, opts)] : renderMoveAndChildrenOf(ctx, main, opts);
    }
    function renderLines(ctx, nodes, opts) {
        return h('lines', {
            class: { single: !!nodes[1] },
        }, nodes.map(function (n) {
            return h('line', renderMoveAndChildrenOf(ctx, n, {
                parentPath: opts.parentPath,
                isMainline: false,
                withIndex: true,
            }));
        }));
    }
    function renderMoveOf(ctx, node, opts) {
        return opts.isMainline ? renderMainlineMoveOf(ctx, node, opts) : renderVariationMoveOf(ctx, node, opts);
    }
    function renderMainlineMoveOf(ctx, node, opts) {
        const path = opts.parentPath + node.id;
        const classes = {
            active: path === ctx.ctrl.vm.path,
            current: path === ctx.ctrl.vm.initialPath,
            hist: node.ply < ctx.ctrl.vm.initialNode.ply,
        };
        if (node.puzzle)
            classes[node.puzzle] = true;
        return h('move', {
            attrs: { p: path },
            class: classes,
        }, renderMove(ctx, node));
    }
    function renderGlyph(glyph) {
        return h('glyph', {
            attrs: { title: glyph.name },
        }, glyph.symbol);
    }
    function puzzleGlyph(ctx, node) {
        switch (node.puzzle) {
            case 'good':
            case 'win':
                return renderGlyph({
                    name: ctx.ctrl.trans.noarg('bestMove'),
                    symbol: '✓',
                });
            case 'fail':
                return renderGlyph({
                    name: ctx.ctrl.trans.noarg('puzzleFailed'),
                    symbol: '✗',
                });
            case 'retry':
                return renderGlyph({
                    name: ctx.ctrl.trans.noarg('goodMove'),
                    symbol: '?!',
                });
            default:
                return;
        }
    }
    function renderMove(ctx, node) {
        const ev = node.eval || node.ceval;
        return [
            node.san,
            ev &&
                (defined$1(ev.cp) ? renderEval(renderEval$1(ev.cp)) : defined$1(ev.mate) ? renderEval('#' + ev.mate) : undefined),
            puzzleGlyph(ctx, node),
        ];
    }
    function renderVariationMoveOf(ctx, node, opts) {
        const withIndex = opts.withIndex || node.ply % 2 === 1;
        const path = opts.parentPath + node.id;
        const active = path === ctx.ctrl.vm.path;
        const classes = {
            active,
            parent: !active && pathContains(ctx, path),
        };
        if (node.puzzle)
            classes[node.puzzle] = true;
        return h('move', {
            attrs: { p: path },
            class: classes,
        }, [withIndex ? renderIndex(node.ply, true) : null, node.san, puzzleGlyph(ctx, node)]);
    }
    function renderMoveAndChildrenOf(ctx, node, opts) {
        return [
            renderMoveOf(ctx, node, opts),
            ...renderChildrenOf(ctx, node, {
                parentPath: opts.parentPath + node.id,
                isMainline: opts.isMainline,
            }),
        ];
    }
    function emptyMove() {
        return h('move.empty', '...');
    }
    function renderEval(e) {
        return h('eval', e);
    }
    function eventPath(e) {
        const target = e.target;
        return target.getAttribute('p') || target.parentNode.getAttribute('p');
    }
    function render(ctrl) {
        const root$1 = ctrl.getTree().root;
        const ctx = {
            ctrl: ctrl,
            showComputer: false,
        };
        return h('div.tview2.tview2-column', {
            hook: {
                insert: vnode => {
                    const el = vnode.elm;
                    if (ctrl.path !== root)
                        autoScroll(ctrl, el);
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
                    if (ctrl.vm.autoScrollNow) {
                        autoScroll(ctrl, vnode.elm);
                        ctrl.vm.autoScrollNow = false;
                        ctrl.autoScrollRequested = false;
                    }
                    else if (ctrl.vm.autoScrollRequested) {
                        if (ctrl.vm.path !== root)
                            autoScroll(ctrl, vnode.elm);
                        ctrl.vm.autoScrollRequested = false;
                    }
                },
            },
        }, [
            ...(root$1.ply % 2 === 1 ? [renderIndex(root$1.ply, false), emptyMove()] : []),
            ...renderChildrenOf(ctx, root$1, {
                parentPath: '',
                isMainline: true,
            }),
        ]);
    }

    function renderAnalyse(ctrl) {
        return h('div.puzzle__moves.areplay', [render(ctrl)]);
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
    function dataAct(e) {
        const target = e.target;
        return target.getAttribute('data-act') || target.parentNode.getAttribute('data-act');
    }
    function jumpButton(icon, effect, disabled, glowing = false) {
        return h('button.fbt', {
            class: { disabled, glowing },
            attrs: {
                'data-act': effect,
                'data-icon': icon,
            },
        });
    }
    function controls(ctrl) {
        const node = ctrl.vm.node;
        const nextNode = node.children[0];
        const goNext = ctrl.vm.mode == 'play' && nextNode && nextNode.puzzle != 'fail';
        return h('div.puzzle__controls.analyse-controls', {
            hook: onInsert(el => {
                bindMobileMousedown(el, e => {
                    const action = dataAct(e);
                    if (action === 'prev')
                        prev(ctrl);
                    else if (action === 'next')
                        next(ctrl);
                    else if (action === 'first')
                        first(ctrl);
                    else if (action === 'last')
                        last(ctrl);
                }, ctrl.redraw);
            }),
        }, [
            h('div.jumps', [
                jumpButton('W', 'first', !node.ply),
                jumpButton('Y', 'prev', !node.ply),
                jumpButton('X', 'next', !nextNode, goNext),
                jumpButton('V', 'last', !nextNode, goNext),
            ]),
        ]);
    }
    let cevalShown = false;
    function view (ctrl) {
        const showCeval = ctrl.vm.showComputer(), gaugeOn = ctrl.showEvalGauge();
        if (cevalShown !== showCeval) {
            if (!cevalShown)
                ctrl.vm.autoScrollNow = true;
            cevalShown = showCeval;
        }
        return h(`main.puzzle.puzzle-${ctrl.getData().replay ? 'replay' : 'play'}${ctrl.streak ? '.puzzle--streak' : ''}`, {
            class: { 'gauge-on': gaugeOn },
            hook: {
                postpatch(old, vnode) {
                    if (old.data.gaugeOn !== gaugeOn) {
                        if (ctrl.pref.coords === 2 /* Outside */) {
                            $('body').toggleClass('coords-in', gaugeOn).toggleClass('coords-out', !gaugeOn);
                            changeColorHandle();
                        }
                        document.body.dispatchEvent(new Event('chessground.resize'));
                    }
                    vnode.data.gaugeOn = gaugeOn;
                },
            },
        }, [
            h('aside.puzzle__side', [
                replay(ctrl),
                puzzleBox(ctrl),
                ctrl.streak ? streakBox(ctrl) : userBox(ctrl),
                config(ctrl),
                theme(ctrl),
            ]),
            h('div.puzzle__board.main-board' + (ctrl.pref.blindfold ? '.blindfold' : ''), {
                hook: 'ontouchstart' in window ? undefined : bind('wheel', e => wheel(ctrl, e)),
            }, [chessground(ctrl), ctrl.promotion.view()]),
            renderGauge(ctrl),
            h('div.puzzle__tools', [
                // we need the wrapping div here
                // so the siblings are only updated when ceval is added
                h('div.ceval-wrap', {
                    class: { none: !showCeval },
                }, showCeval ? [renderCeval(ctrl), renderPvs(ctrl)] : []),
                renderAnalyse(ctrl),
                feedbackView(ctrl),
            ]),
            controls(ctrl),
            session(ctrl),
        ]);
    }
    function session(ctrl) {
        var _a;
        const rounds = ctrl.session.get().rounds, current = ctrl.getData().puzzle.id;
        return h('div.puzzle__session', [
            ...rounds.map(round => {
                const rd = round.ratingDiff ? (round.ratingDiff > 0 ? '+' + round.ratingDiff : round.ratingDiff) : null;
                return h(`a.result-${round.result}${rd ? '' : '.result-empty'}`, {
                    key: round.id,
                    class: {
                        current: current == round.id,
                    },
                    attrs: Object.assign({ href: `/training/${ctrl.session.theme}/${round.id}` }, (ctrl.streak ? { target: '_blank' } : {})),
                }, rd);
            }),
            rounds.find(r => r.id == current)
                ? ctrl.streak
                    ? null
                    : h('a.session-new', {
                        key: 'new',
                        attrs: {
                            href: `/training/${ctrl.session.theme}`,
                        },
                    })
                : h('a.result-cursor.current', {
                    key: current,
                    attrs: ctrl.streak
                        ? {}
                        : {
                            href: `/training/${ctrl.session.theme}/${current}`,
                        },
                }, (_a = ctrl.streak) === null || _a === void 0 ? void 0 : _a.data.index),
        ]);
    }

    const patch = init$1([classModule, attributesModule]);
    function main (opts) {
        const element = document.querySelector('main.puzzle');
        const ctrl = makeCtrl(opts, redraw);
        const blueprint = view(ctrl);
        element.innerHTML = '';
        let vnode = patch(element, blueprint);
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        menuHover();
    }
    // that's for the rest of lichess to access chessground
    // without having to include it a second time
    window.Chessground = Chessground;

    return main;

}());
