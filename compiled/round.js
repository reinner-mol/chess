var LichessRound = (function (exports) {
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
        createElement: createElement$1,
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
    function init$5(modules, domApi) {
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
    function init$4(thunk) {
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
            hook: { init: init$4, prepatch },
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

    const pieceScores = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0,
    };
    const justIcon = (icon) => ({
        attrs: { 'data-icon': icon },
    });
    const uci2move = (uci) => {
        if (!uci)
            return undefined;
        if (uci[1] === '@')
            return [uci.slice(2, 4)];
        return [uci.slice(0, 2), uci.slice(2, 4)];
    };
    const onInsert = (f) => ({
        insert(vnode) {
            f(vnode.elm);
        },
    });
    const bind$1 = (eventName, f, redraw, passive = true) => onInsert(el => {
        el.addEventListener(eventName, e => {
            f(e);
            redraw && redraw();
        }, { passive });
    });
    function parsePossibleMoves(dests) {
        const dec = new Map();
        if (!dests)
            return dec;
        if (typeof dests == 'string')
            for (const ds of dests.split(' ')) {
                dec.set(ds.slice(0, 2), ds.slice(2).match(/.{2}/g));
            }
        else
            for (const k in dests)
                dec.set(k, dests[k].match(/.{2}/g));
        return dec;
    }
    // {white: {pawn: 3 queen: 1}, black: {bishop: 2}}
    function getMaterialDiff(pieces) {
        const diff = {
            white: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
            black: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
        };
        for (const p of pieces.values()) {
            const them = diff[opposite(p.color)];
            if (them[p.role] > 0)
                them[p.role]--;
            else
                diff[p.color][p.role]++;
        }
        return diff;
    }
    function getScore(pieces) {
        let score = 0;
        for (const p of pieces.values()) {
            score += pieceScores[p.role] * (p.color === 'white' ? 1 : -1);
        }
        return score;
    }
    const noChecks = {
        white: 0,
        black: 0,
    };
    function countChecks(steps, ply) {
        const checks = Object.assign({}, noChecks);
        for (const step of steps) {
            if (ply < step.ply)
                break;
            if (step.check) {
                if (step.ply % 2 === 1)
                    checks.white++;
                else
                    checks.black++;
            }
        }
        return checks;
    }
    const spinner = () => h('div.spinner', {
        'aria-label': 'loading',
    }, [
        h('svg', { attrs: { viewBox: '0 0 40 40' } }, [
            h('circle', {
                attrs: { cx: 20, cy: 20, r: 18, fill: 'none' },
            }),
        ]),
    ]);

    function tourStandingCtrl(players, team, name) {
        return {
            set(d) {
                players = d;
            },
            tab: {
                key: 'tourStanding',
                name: name,
            },
            view() {
                return h('div', {
                    hook: onInsert(_ => {
                        lichess.loadCssPath('round.tour-standing');
                    }),
                }, [
                    team
                        ? h('h3.text', {
                            attrs: { 'data-icon': 'f' },
                        }, team.name)
                        : null,
                    h('table.slist', [
                        h('tbody', players.map((p, i) => {
                            return h('tr.' + p.n, [
                                h('td.name', [
                                    h('span.rank', '' + (i + 1)),
                                    h('a.user-link.ulpt', {
                                        attrs: { href: `/@/${p.n}` },
                                    }, (p.t ? p.t + ' ' : '') + p.n),
                                ]),
                                h('td.total', p.f
                                    ? {
                                        class: { 'is-gold': true },
                                        attrs: { 'data-icon': 'Q' },
                                    }
                                    : {}, '' + p.s),
                            ]);
                        })),
                    ]),
                ]);
            },
        };
    }

    function boot (opts) {
        var _a;
        const element = document.querySelector('.round__app'), data = opts.data;
        if (data.tournament)
            $('body').data('tournament-id', data.tournament.id);
        lichess.socket = new lichess.StrongSocket(data.url.socket, data.player.version, {
            params: { userTv: data.userTv && data.userTv.id },
            receive(t, d) {
                round.socketReceive(t, d);
            },
            events: {
                tvSelect(o) {
                    if (data.tv && data.tv.channel == o.channel)
                        lichess.reload();
                    else
                        $('.tv-channels .' + o.channel + ' .champion').html(o.player ? [o.player.title, o.player.name, o.player.rating].filter(x => x).join('&nbsp') : 'Anonymous');
                },
                end() {
                    text(`${data.tv ? '/tv' : ''}/${data.game.id}/${data.player.color}/sides`).then(html => {
                        const $html = $(html), $meta = $html.find('.game__meta');
                        $meta.length && $('.game__meta').replaceWith($meta);
                        $('.crosstable').replaceWith($html.find('.crosstable'));
                        startTournamentClock();
                        lichess.contentLoaded();
                    });
                },
                tourStanding(s) {
                    var _a, _b, _c;
                    ((_a = opts.chat) === null || _a === void 0 ? void 0 : _a.plugin) &&
                        ((_c = (_b = opts.chat) === null || _b === void 0 ? void 0 : _b.instance) === null || _c === void 0 ? void 0 : _c.then(chat => {
                            opts.chat.plugin.set(s);
                            chat.redraw();
                        }));
                },
            },
        });
        function startTournamentClock() {
            if (data.tournament)
                $('.game__tournament .clock').each(function () {
                    $(this).clock({
                        time: parseFloat($(this).data('time')),
                    });
                });
        }
        function getPresetGroup(d) {
            if (d.player.spectator)
                return;
            if (d.steps.length < 4)
                return 'start';
            else if (d.game.status.id >= 30)
                return 'end';
            return;
        }
        opts.element = element;
        opts.socketSend = lichess.socket.send;
        const round = window['LichessRound'].app(opts);
        const chatOpts = opts.chat;
        if (chatOpts) {
            if ((_a = data.tournament) === null || _a === void 0 ? void 0 : _a.top) {
                chatOpts.plugin = tourStandingCtrl(data.tournament.top, data.tournament.team, opts.i18n.standing);
                chatOpts.alwaysEnabled = true;
            }
            else if (!data.simul && !data.swiss) {
                chatOpts.preset = getPresetGroup(data);
                chatOpts.parseMoves = true;
            }
            if (chatOpts.noteId && (chatOpts.noteAge || 0) < 10)
                chatOpts.noteText = '';
            chatOpts.instance = lichess.makeChat(chatOpts);
            if (!data.tournament && !data.simul && !data.swiss)
                opts.onChange = (d) => chatOpts.instance.then(chat => chat.preset.setGroup(getPresetGroup(d)));
        }
        startTournamentClock();
        $('.round__now-playing .move-on input')
            .on('change', round.moveOn.toggle)
            .prop('checked', round.moveOn.get())
            .on('click', 'a', () => {
            lichess.unload.expected = true;
            return true;
        });
        if (location.pathname.lastIndexOf('/round-next/', 0) === 0)
            history.replaceState(null, '', '/' + data.game.id);
        $('#zentog').on('click', () => lichess.pubsub.emit('zen'));
        lichess.storage.make('reload-round-tabs').listen(lichess.reload);
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
    function bind(eventName, f) {
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
                    hook: bind('click', () => {
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
                        hook: bind('click', () => ctrl.timeout(r, data.text)),
                    }, r.name);
                }),
            ])
            : h('div.timeout.block', [
                h('strong', 'Moderation'),
                h('a.text', {
                    attrs: { 'data-icon': 'p' },
                    hook: bind('click', () => ctrl.timeout(ctrl.reasons[0], data.text)),
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
                    hook: bind('click', ctrl.close),
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
    const userPattern = /(^|[^\w@#/])@([a-z0-9][a-z0-9_-]{0,28}[a-z0-9])/gi;
    // looks like it has a @mention or #gameid or a url.tld
    function isMoreThanText(str) {
        return /(\n|(@|#|\.)\w{2,})/.test(str);
    }
    function linkReplace(href, body, cls) {
        if (href.includes('&quot;'))
            return href;
        return `<a target="_blank" rel="noopener nofollow noreferrer" href="${href.startsWith('/') || href.includes('://') ? href : '//' + href}"${cls ? ` class="${cls}"` : ''}>${body ? body : href}</a>`;
    }
    function userLinkReplace(_, prefix, user) {
        return prefix + linkReplace('/@/' + user, '@' + user);
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
                hook: bind('click', () => {
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
            hook: bind('click', () => ctrl.setTab(tab)),
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
                        hook: bind('change', (e) => {
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
        const patch = init$5([classModule, attributesModule]);
        const ctrl = makeCtrl(opts, redraw);
        const blueprint = view$1(ctrl);
        element.innerHTML = '';
        let vnode = patch(element, blueprint);
        function redraw() {
            vnode = patch(vnode, view$1(ctrl));
        }
        return ctrl;
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

    const firstPly = (d) => d.steps[0].ply;
    const lastPly = (d) => lastStep(d).ply;
    const lastStep = (d) => d.steps[d.steps.length - 1];
    const plyStep = (d, ply) => d.steps[ply - firstPly(d)];
    const massage = (d) => {
        if (d.clock) {
            d.clock.showTenths = d.pref.clockTenths;
            d.clock.showBar = d.pref.clockBar;
        }
        if (d.correspondence)
            d.correspondence.showBar = d.pref.clockBar;
        if (['horde', 'crazyhouse'].includes(d.game.variant.key))
            d.pref.showCaptured = false;
        if (d.expiration)
            d.expiration.movedAt = Date.now() - d.expiration.idleMillis;
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
    function started(data) {
        return data.game.status.id >= ids.started;
    }
    function finished(data) {
        return data.game.status.id >= ids.mate;
    }
    function aborted(data) {
        return data.game.status.id === ids.aborted;
    }
    function playing(data) {
        return started(data) && !finished(data) && !aborted(data);
    }

    const playable = (data) => data.game.status.id < ids.aborted && !imported(data);
    const isPlayerPlaying = (data) => playable(data) && !data.player.spectator;
    const isPlayerTurn = (data) => isPlayerPlaying(data) && data.game.player == data.player.color;
    const mandatory = (data) => !!data.tournament || !!data.simul || !!data.swiss;
    const playedTurns = (data) => data.game.turns - (data.game.startedAtTurn || 0);
    const bothPlayersHavePlayed = (data) => playedTurns(data) > 1;
    const abortable = (data) => playable(data) && !bothPlayersHavePlayed(data) && !mandatory(data);
    const takebackable = (data) => playable(data) &&
        data.takebackable &&
        bothPlayersHavePlayed(data) &&
        !data.player.proposingTakeback &&
        !data.opponent.proposingTakeback;
    const drawable = (data) => playable(data) && data.game.turns >= 2 && !data.player.offeringDraw && !hasAi(data);
    const resignable = (data) => playable(data) && !abortable(data);
    // can the current player go berserk?
    const berserkableBy = (data) => !!data.tournament && data.tournament.berserkable && isPlayerPlaying(data) && !bothPlayersHavePlayed(data);
    const moretimeable = (data) => isPlayerPlaying(data) &&
        data.moretimeable &&
        (!!data.clock ||
            (!!data.correspondence && data.correspondence[data.opponent.color] < data.correspondence.increment - 3600));
    const imported = (data) => data.game.source === 'import';
    const replayable = (data) => imported(data) || finished(data) || (aborted(data) && bothPlayersHavePlayed(data));
    function getPlayer(data, color) {
        if (data.player.color === color)
            return data.player;
        if (data.opponent.color === color)
            return data.opponent;
        return null;
    }
    const hasAi = (data) => !!(data.player.ai || data.opponent.ai);
    const userAnalysable = (data) => finished(data) || (playable(data) && (!data.clock || !isPlayerPlaying(data)));
    const isCorrespondence = (data) => data.game.speed === 'correspondence';
    const setOnGame = (data, color, onGame) => {
        const player = getPlayer(data, color);
        onGame = onGame || !!player.ai;
        player.onGame = onGame;
        if (onGame)
            setGone(data, color, false);
    };
    const setGone = (data, color, gone) => {
        const player = getPlayer(data, color);
        player.gone = !player.ai && gone;
        if (player.gone === false && player.user)
            player.user.online = true;
    };
    const nbMoves = (data, color) => Math.floor((data.game.turns + (color == 'white' ? 1 : 0)) / 2);
    const isSwitchable = (data) => !hasAi(data) && (!!data.simul || isCorrespondence(data));

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
        return state.animation.enabled ? animate(mutation, state) : render$4(mutation, state);
    }
    function render$4(mutation, state) {
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
    function step$1(state, now) {
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
            requestAnimationFrame((now = performance.now()) => step$1(state, now));
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
                step$1(state, performance.now());
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
    function start$3(state, e) {
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
    function move$2(state, e) {
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

    function start$2(s, e) {
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
    function move$1(s, e) {
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
    function start$1(state, redrawAll) {
        function toggleOrientation$1() {
            toggleOrientation(state);
            redrawAll();
        }
        return {
            set(config) {
                if (config.orientation && config.orientation !== state.orientation)
                    toggleOrientation$1();
                (config.fen ? anim : render$4)(state => configure(state, config), state);
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
                render$4(unsetPremove, state);
            },
            cancelPredrop() {
                render$4(unsetPredrop, state);
            },
            cancelMove() {
                render$4(state => {
                    cancelMove(state);
                    cancel$1(state);
                }, state);
            },
            stop() {
                render$4(state => {
                    stop(state);
                    cancel$1(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$4(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$4(state => (state.drawable.shapes = shapes), state);
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

    function setDropMode(s, piece) {
        s.dropmode = {
            active: true,
            piece,
        };
        cancel$1(s);
    }
    function cancelDropMode(s) {
        s.dropmode = {
            active: false,
        };
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
            const onmove = dragOrDraw(s, move$1, move$2);
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
                    start$3(s, e);
            }
            else if (!s.viewOnly) {
                if (s.dropmode.active)
                    drop(s, e);
                else
                    start$2(s, e);
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
    function render$3(s) {
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
                render$3(state);
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
        return start$1(redrawAll(), redrawAll);
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

    function makeConfig(ctrl) {
        const data = ctrl.data, hooks = ctrl.makeCgHooks(), step = plyStep(data, ctrl.ply), playing = ctrl.isPlaying();
        return {
            fen: step.fen,
            orientation: boardOrientation(data, ctrl.flip),
            turnColor: step.ply % 2 === 0 ? 'white' : 'black',
            lastMove: uci2move(step.uci),
            check: !!step.check,
            coordinates: data.pref.coords !== 0 /* Hidden */,
            addPieceZIndex: ctrl.data.pref.is3d,
            highlight: {
                lastMove: data.pref.highlight,
                check: data.pref.highlight,
            },
            events: {
                move: hooks.onMove,
                dropNewPiece: hooks.onNewPiece,
                insert(elements) {
                    resizeHandle(elements, ctrl.data.pref.resizeHandle, ctrl.ply);
                    if (data.pref.coords === 1 /* Inside */)
                        changeColorHandle();
                },
            },
            movable: {
                free: false,
                color: playing ? data.player.color : undefined,
                dests: playing ? parsePossibleMoves(data.possibleMoves) : new Map(),
                showDests: data.pref.destination,
                rookCastle: data.pref.rookCastle,
                events: {
                    after: hooks.onUserMove,
                    afterNewPiece: hooks.onUserNewPiece,
                },
            },
            animation: {
                enabled: true,
                duration: data.pref.animationDuration,
            },
            premovable: {
                enabled: data.pref.enablePremove,
                showDests: data.pref.destination,
                castle: data.game.variant.key !== 'antichess',
                events: {
                    set: hooks.onPremove,
                    unset: hooks.onCancelPremove,
                },
            },
            predroppable: {
                enabled: data.pref.enablePremove && data.game.variant.key === 'crazyhouse',
                events: {
                    set: hooks.onPredrop,
                    unset() {
                        hooks.onPredrop(undefined);
                    },
                },
            },
            draggable: {
                enabled: data.pref.moveEvent !== 0 /* Click */,
                showGhost: data.pref.highlight,
            },
            selectable: {
                enabled: data.pref.moveEvent !== 1 /* Drag */,
            },
            drawable: {
                enabled: true,
                defaultSnapToValidMove: (lichess.storage.get('arrow.snap') || 1) != '0',
            },
            disableContextMenu: true,
        };
    }
    function reload$1(ctrl) {
        ctrl.chessground.set(makeConfig(ctrl));
    }
    function promote(ground, key, role) {
        const piece = ground.state.pieces.get(key);
        if (piece && piece.role === 'pawn') {
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
    function boardOrientation(data, flip) {
        if (data.game.variant.key === 'racingKings')
            return flip ? 'black' : 'white';
        else
            return flip ? data.opponent.color : data.player.color;
    }
    function render$2(ctrl) {
        return h('div.cg-wrap', {
            hook: onInsert(el => ctrl.setChessground(Chessground(el, makeConfig(ctrl)))),
        });
    }

    let notifications = [];
    let listening = false;
    function listenToFocus() {
        if (!listening) {
            listening = true;
            window.addEventListener('focus', () => {
                notifications.forEach(n => n.close());
                notifications = [];
            });
        }
    }
    function notify(msg) {
        const storage = lichess.storage.make('just-notified');
        if (document.hasFocus() || Date.now() - parseInt(storage.get(), 10) < 1000)
            return;
        storage.set('' + Date.now());
        if ($.isFunction(msg))
            msg = msg();
        const notification = new Notification('lichess.org', {
            icon: lichess.assetUrl('logo/lichess-favicon-256.png', { noVersion: true }),
            body: msg,
        });
        notification.onclick = () => window.focus();
        notifications.push(notification);
        listenToFocus();
    }
    function notify$1 (msg) {
        if (document.hasFocus() || !('Notification' in window))
            return;
        if (Notification.permission === 'granted') {
            // increase chances that the first tab can put a local storage lock
            setTimeout(notify, 10 + Math.random() * 500, msg);
        }
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

    const reload = (ctrl) => json(ctrl.data.url.round);
    const whatsNext = (ctrl) => json(`/whats-next/${ctrl.data.game.id}${ctrl.data.player.id}`);
    const challengeRematch = (gameId) => json('/challenge/rematch-of/' + gameId, {
        method: 'post',
    });
    const setZen = throttle(1000, zen => text('/pref/zen', {
        method: 'post',
        body: form({ zen: zen ? 1 : 0 }),
    }));

    const throttled = (sound) => throttle(100, () => lichess.sound.play(sound));
    const move = throttled('move');
    const capture$1 = throttled('capture');
    const check = throttled('check');
    const explode = throttled('explosion');

    function backoff(delay, factor, callback) {
        let timer;
        let lastExec = 0;
        return function (...args) {
            const self = this;
            const elapsed = performance.now() - lastExec;
            function exec() {
                timer = undefined;
                lastExec = performance.now();
                delay *= factor;
                callback.apply(self, args);
            }
            if (timer)
                clearTimeout(timer);
            if (elapsed > delay)
                exec();
            else
                timer = setTimeout(exec, delay - elapsed);
        };
    }
    function make(send, ctrl) {
        lichess.socket.sign(ctrl.sign);
        function reload$1(o, isRetry) {
            // avoid reload if possible!
            if (o && o.t) {
                ctrl.setLoading(false);
                handlers[o.t](o.d);
            }
            else
                reload(ctrl).then(data => {
                    if (lichess.socket.getVersion() > data.player.version) {
                        // race condition! try to reload again
                        if (isRetry)
                            lichess.reload();
                        // give up and reload the page
                        else
                            reload$1(o, true);
                    }
                    else
                        ctrl.reload(data);
                }, lichess.reload);
        }
        const handlers = {
            takebackOffers(o) {
                ctrl.setLoading(false);
                ctrl.data.player.proposingTakeback = o[ctrl.data.player.color];
                const fromOp = (ctrl.data.opponent.proposingTakeback = o[ctrl.data.opponent.color]);
                if (fromOp)
                    notify$1(ctrl.noarg('yourOpponentProposesATakeback'));
                ctrl.redraw();
            },
            move: ctrl.apiMove,
            drop: ctrl.apiMove,
            reload: reload$1,
            redirect: ctrl.setRedirecting,
            clockInc(o) {
                if (ctrl.clock) {
                    ctrl.clock.addTime(o.color, o.time);
                    ctrl.redraw();
                }
            },
            cclock(o) {
                if (ctrl.corresClock) {
                    ctrl.data.correspondence.white = o.white;
                    ctrl.data.correspondence.black = o.black;
                    ctrl.corresClock.update(o.white, o.black);
                    ctrl.redraw();
                }
            },
            crowd(o) {
                ['white', 'black'].forEach(c => {
                    if (defined(o[c]))
                        setOnGame(ctrl.data, c, o[c]);
                });
                ctrl.redraw();
            },
            endData: ctrl.endWithData,
            rematchOffer(by) {
                ctrl.data.player.offeringRematch = by === ctrl.data.player.color;
                if ((ctrl.data.opponent.offeringRematch = by === ctrl.data.opponent.color))
                    notify$1(ctrl.noarg('yourOpponentWantsToPlayANewGameWithYou'));
                ctrl.redraw();
            },
            rematchTaken(nextId) {
                ctrl.data.game.rematch = nextId;
                if (!ctrl.data.player.spectator)
                    ctrl.setLoading(true);
                else
                    ctrl.redraw();
            },
            drawOffer(by) {
                if (ctrl.isPlaying()) {
                    ctrl.data.player.offeringDraw = by === ctrl.data.player.color;
                    const fromOp = (ctrl.data.opponent.offeringDraw = by === ctrl.data.opponent.color);
                    if (fromOp)
                        notify$1(ctrl.noarg('yourOpponentOffersADraw'));
                }
                if (by) {
                    let ply = ctrl.lastPly();
                    if ((by == 'white') == (ply % 2 == 0))
                        ply++;
                    ctrl.data.game.drawOffers = (ctrl.data.game.drawOffers || []).concat([ply]);
                }
                ctrl.redraw();
            },
            berserk(color) {
                ctrl.setBerserk(color);
            },
            gone: ctrl.setGone,
            goneIn: ctrl.setGone,
            checkCount(e) {
                ctrl.data.player.checks = ctrl.data.player.color == 'white' ? e.white : e.black;
                ctrl.data.opponent.checks = ctrl.data.opponent.color == 'white' ? e.white : e.black;
                ctrl.redraw();
            },
            simulPlayerMove(gameId) {
                if (ctrl.opts.userId &&
                    ctrl.data.simul &&
                    ctrl.opts.userId == ctrl.data.simul.hostId &&
                    gameId !== ctrl.data.game.id &&
                    ctrl.moveOn.get() &&
                    !isPlayerTurn(ctrl.data)) {
                    ctrl.setRedirecting();
                    move();
                    location.href = '/' + gameId;
                }
            },
            simulEnd(simul) {
                lichess.loadCssPath('modal');
                modal($('<p>Simul complete!</p><br /><br />' +
                    `<a class="button" href="/simul/${simul.id}">Back to ${simul.name} simul</a>`));
            },
        };
        lichess.pubsub.on('ab.rep', n => send('rep', { n }));
        return {
            send,
            handlers,
            moreTime: throttle(300, () => send('moretime')),
            outoftime: backoff(500, 1.1, () => send('flag', ctrl.data.game.player)),
            berserk: throttle(200, () => send('berserk', null, { ackable: true })),
            sendLoading(typ, data) {
                ctrl.setLoading(true);
                send(typ, data);
            },
            receive(typ, data) {
                if (handlers[typ]) {
                    handlers[typ](data);
                    return true;
                }
                return false;
            },
            reload: reload$1,
        };
    }

    const initialTitle = document.title;
    let curFaviconIdx = 0;
    const F = ['/assets/logo/lichess-favicon-32.png', '/assets/logo/lichess-favicon-32-invert.png'].map((path, i) => () => {
        if (curFaviconIdx !== i) {
            document.getElementById('favicon').href = path;
            curFaviconIdx = i;
        }
    });
    let tickerTimer;
    function resetTicker() {
        if (tickerTimer)
            clearTimeout(tickerTimer);
        tickerTimer = undefined;
        F[0]();
    }
    function startTicker() {
        function tick() {
            if (!document.hasFocus()) {
                F[1 - curFaviconIdx]();
                tickerTimer = setTimeout(tick, 1000);
            }
        }
        if (!tickerTimer)
            tickerTimer = setTimeout(tick, 200);
    }
    function init$3() {
        window.addEventListener('focus', resetTicker);
    }
    function set(ctrl, text) {
        if (ctrl.data.player.spectator)
            return;
        if (!text) {
            if (aborted(ctrl.data) || finished(ctrl.data)) {
                text = ctrl.noarg('gameOver');
            }
            else if (isPlayerTurn(ctrl.data)) {
                text = ctrl.noarg('yourTurn');
                if (!document.hasFocus())
                    startTicker();
            }
            else {
                text = ctrl.noarg('waitingForOpponent');
                resetTicker();
            }
        }
        document.title = `${text} - ${initialTitle}`;
    }

    let promoting;
    let prePromotionRole;
    function sendPromotion(ctrl, orig, dest, role, meta) {
        promote(ctrl.chessground, dest, role);
        ctrl.sendMove(orig, dest, role, meta);
        return true;
    }
    function start(ctrl, orig, dest, meta = {}) {
        var _a;
        const d = ctrl.data, piece = ctrl.chessground.state.pieces.get(dest), premovePiece = ctrl.chessground.state.pieces.get(orig);
        if (((piece && piece.role === 'pawn' && !premovePiece) || (premovePiece && premovePiece.role === 'pawn')) &&
            ((dest[1] === '8' && d.player.color === 'white') || (dest[1] === '1' && d.player.color === 'black'))) {
            if (prePromotionRole && meta && meta.premove)
                return sendPromotion(ctrl, orig, dest, prePromotionRole, meta);
            if (!meta.ctrlKey &&
                !promoting &&
                (d.pref.autoQueen === 3 /* Always */ ||
                    (d.pref.autoQueen === 2 /* OnPremove */ && premovePiece) ||
                    ((_a = ctrl.keyboardMove) === null || _a === void 0 ? void 0 : _a.justSelected()))) {
                if (premovePiece)
                    setPrePromotion(ctrl, dest, 'queen');
                else
                    sendPromotion(ctrl, orig, dest, 'queen', meta);
                return true;
            }
            promoting = {
                move: [orig, dest],
                pre: !!premovePiece,
                meta,
            };
            ctrl.redraw();
            return true;
        }
        return false;
    }
    function setPrePromotion(ctrl, dest, role) {
        prePromotionRole = role;
        ctrl.chessground.setAutoShapes([
            {
                orig: dest,
                piece: {
                    color: ctrl.data.player.color,
                    role,
                    opacity: 0.8,
                },
                brush: '',
            },
        ]);
    }
    function cancelPrePromotion(ctrl) {
        if (prePromotionRole) {
            ctrl.chessground.setAutoShapes([]);
            prePromotionRole = undefined;
            ctrl.redraw();
        }
    }
    function finish(ctrl, role) {
        if (promoting) {
            const info = promoting;
            promoting = undefined;
            if (info.pre)
                setPrePromotion(ctrl, info.move[1], role);
            else
                sendPromotion(ctrl, info.move[0], info.move[1], role, info.meta);
            ctrl.redraw();
        }
    }
    function cancel(ctrl) {
        cancelPrePromotion(ctrl);
        ctrl.chessground.cancelPremove();
        if (promoting)
            reload(ctrl).then(ctrl.reload, lichess.reload);
        promoting = undefined;
    }
    function renderPromotion(ctrl, dest, roles, color, orientation) {
        let left = (7 - key2pos(dest)[0]) * 12.5;
        if (orientation === 'white')
            left = 87.5 - left;
        const vertical = color === orientation ? 'top' : 'bottom';
        return h('div#promotion-choice.' + vertical, {
            hook: onInsert(el => {
                el.addEventListener('click', () => cancel(ctrl));
                el.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    return false;
                });
            }),
        }, roles.map((serverRole, i) => {
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
    function view(ctrl) {
        if (!promoting)
            return;
        return renderPromotion(ctrl, promoting.move[1], ctrl.data.game.variant.key === 'antichess' ? roles.concat('king') : roles, ctrl.data.player.color, ctrl.chessground.state.orientation);
    }

    // Register blur events to be sent as move metadata
    let lastFocus = 0;
    let focusCutoff = 0;
    function init$2(withBlur) {
        if (!withBlur)
            focusCutoff = Date.now() + 10000;
        window.addEventListener('focus', () => (lastFocus = Date.now()));
    }
    function get() {
        return lastFocus >= focusCutoff;
    }
    function onMove() {
        focusCutoff = Date.now() + 1000;
    }

    function status$1(ctrl) {
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

    const setup = (ctrl) => {
        lichess.pubsub.on('speech.enabled', onSpeechChange(ctrl));
        onSpeechChange(ctrl)(lichess.sound.speech());
    };
    const onSpeechChange = (ctrl) => (enabled) => {
        if (!window.LichessSpeech && enabled)
            lichess.loadModule('speech').then(() => status(ctrl));
        else if (window.LichessSpeech && !enabled)
            window.LichessSpeech = undefined;
    };
    const status = (ctrl) => {
        if (ctrl.data.game.status.name === 'started')
            window.LichessSpeech.step(ctrl.stepAt(ctrl.ply), false);
        else {
            const s = status$1(ctrl);
            lichess.sound.say(s, false, false, true);
            const w = ctrl.data.game.winner;
            if (w)
                lichess.sound.say(ctrl.noarg(w + 'IsVictorious'), false, false, true);
        }
    };
    const userJump = (ctrl, ply) => withSpeech(s => s.step(ctrl.stepAt(ply), true));
    const step = (step) => withSpeech(s => s.step(step, false));
    const withSpeech = (f) => window.LichessSpeech && f(window.LichessSpeech);

    function game(data, color, embed) {
        const id = data.game ? data.game.id : data;
        return (embed ? '/embed/' : '/') + id + (color ? '/' + color : '');
    }

    function analysisBoardOrientation(data) {
        return data.game.variant.key === 'racingKings' ? 'white' : data.player.color;
    }
    function poolUrl(clock, blocking) {
        return '/#pool/' + clock.initial / 60 + '+' + clock.increment + (blocking ? '/' + blocking.id : '');
    }
    function analysisButton$1(ctrl) {
        const d = ctrl.data, url = game(d, analysisBoardOrientation(d)) + '#' + ctrl.ply;
        return replayable(d)
            ? h('a.fbt', {
                attrs: { href: url },
                hook: bind$1('click', _ => {
                    // force page load in case the URL is the same
                    if (location.pathname === url.split('#')[0])
                        location.reload();
                }),
            }, ctrl.noarg('analysis'))
            : null;
    }
    function rematchButtons(ctrl) {
        const d = ctrl.data, me = !!d.player.offeringRematch, them = !!d.opponent.offeringRematch, noarg = ctrl.noarg;
        return [
            them
                ? h('button.rematch-decline', {
                    attrs: {
                        'data-icon': 'L',
                        title: noarg('decline'),
                    },
                    hook: bind$1('click', () => ctrl.socket.send('rematch-no')),
                }, ctrl.nvui ? noarg('decline') : '')
                : null,
            h('button.fbt.rematch.white', {
                class: {
                    me,
                    glowing: them,
                    disabled: !me && !(d.opponent.onGame || (!d.clock && d.player.user && d.opponent.user)),
                },
                attrs: {
                    title: them ? noarg('yourOpponentWantsToPlayANewGameWithYou') : me ? noarg('rematchOfferSent') : '',
                },
                hook: bind$1('click', e => {
                    const d = ctrl.data;
                    if (d.game.rematch)
                        location.href = game(d.game.rematch, d.opponent.color);
                    else if (d.player.offeringRematch) {
                        d.player.offeringRematch = false;
                        ctrl.socket.send('rematch-no');
                    }
                    else if (d.opponent.onGame) {
                        d.player.offeringRematch = true;
                        ctrl.socket.send('rematch-yes');
                    }
                    else if (!e.currentTarget.classList.contains('disabled'))
                        ctrl.challengeRematch();
                }, ctrl.redraw),
            }, [me ? spinner() : h('span', noarg('rematch'))]),
        ];
    }
    function standard(ctrl, condition, icon, hint, socketMsg, onclick) {
        // disabled if condition callback is provided and is falsy
        const enabled = () => !condition || condition(ctrl.data);
        return h('button.fbt.' + socketMsg, {
            attrs: {
                disabled: !enabled(),
                title: ctrl.noarg(hint),
            },
            hook: bind$1('click', _ => {
                if (enabled())
                    onclick ? onclick() : ctrl.socket.sendLoading(socketMsg);
            }),
        }, [h('span', hint == 'offerDraw' ? ['½'] : ctrl.nvui ? [ctrl.noarg(hint)] : justIcon(icon))]);
    }
    function opponentGone(ctrl) {
        const gone = ctrl.opponentGone();
        return gone === true
            ? h('div.suggestion', [
                h('p', { hook: onSuggestionHook }, ctrl.noarg('opponentLeftChoices')),
                h('button.button', {
                    hook: bind$1('click', () => ctrl.socket.sendLoading('resign-force')),
                }, ctrl.noarg('forceResignation')),
                h('button.button', {
                    hook: bind$1('click', () => ctrl.socket.sendLoading('draw-force')),
                }, ctrl.noarg('forceDraw')),
            ])
            : gone
                ? h('div.suggestion', [h('p', ctrl.trans.vdomPlural('opponentLeftCounter', gone, h('strong', '' + gone)))])
                : null;
    }
    const fbtCancel = (ctrl, f) => h('button.fbt.no', {
        attrs: { title: ctrl.noarg('cancel'), 'data-icon': 'L' },
        hook: bind$1('click', () => f(false)),
    });
    const resignConfirm = (ctrl) => h('div.act-confirm', [
        h('button.fbt.yes', {
            attrs: { title: ctrl.noarg('resign'), 'data-icon': 'b' },
            hook: bind$1('click', () => ctrl.resign(true)),
        }),
        fbtCancel(ctrl, ctrl.resign),
    ]);
    const drawConfirm = (ctrl) => h('div.act-confirm', [
        h('button.fbt.yes.draw-yes', {
            attrs: { title: ctrl.noarg('offerDraw') },
            hook: bind$1('click', () => ctrl.offerDraw(true)),
        }, h('span', '½')),
        fbtCancel(ctrl, ctrl.offerDraw),
    ]);
    function threefoldClaimDraw(ctrl) {
        return ctrl.data.game.threefold
            ? h('div.suggestion', [
                h('p', {
                    hook: onSuggestionHook,
                }, ctrl.noarg('threefoldRepetition')),
                h('button.button', {
                    hook: bind$1('click', () => ctrl.socket.sendLoading('draw-claim')),
                }, ctrl.noarg('claimADraw')),
            ])
            : null;
    }
    function cancelDrawOffer(ctrl) {
        return ctrl.data.player.offeringDraw ? h('div.pending', [h('p', ctrl.noarg('drawOfferSent'))]) : null;
    }
    function answerOpponentDrawOffer(ctrl) {
        return ctrl.data.opponent.offeringDraw
            ? h('div.negotiation.draw', [
                declineButton(ctrl, () => ctrl.socket.sendLoading('draw-no')),
                h('p', ctrl.noarg('yourOpponentOffersADraw')),
                acceptButton(ctrl, 'draw-yes', () => ctrl.socket.sendLoading('draw-yes')),
            ])
            : null;
    }
    function cancelTakebackProposition(ctrl) {
        return ctrl.data.player.proposingTakeback
            ? h('div.pending', [
                h('p', ctrl.noarg('takebackPropositionSent')),
                h('button.button', {
                    hook: bind$1('click', () => ctrl.socket.sendLoading('takeback-no')),
                }, ctrl.noarg('cancel')),
            ])
            : null;
    }
    function acceptButton(ctrl, klass, action, i18nKey = 'accept') {
        const text = ctrl.noarg(i18nKey);
        return ctrl.nvui
            ? h('button.' + klass, {
                hook: bind$1('click', action),
            }, text)
            : h('a.accept', {
                attrs: {
                    'data-icon': 'E',
                    title: text,
                },
                hook: bind$1('click', action),
            });
    }
    function declineButton(ctrl, action, i18nKey = 'decline') {
        const text = ctrl.noarg(i18nKey);
        return ctrl.nvui
            ? h('button', {
                hook: bind$1('click', action),
            }, text)
            : h('a.decline', {
                attrs: {
                    'data-icon': 'L',
                    title: text,
                },
                hook: bind$1('click', action),
            });
    }
    function answerOpponentTakebackProposition(ctrl) {
        return ctrl.data.opponent.proposingTakeback
            ? h('div.negotiation.takeback', [
                declineButton(ctrl, () => ctrl.socket.sendLoading('takeback-no')),
                h('p', ctrl.noarg('yourOpponentProposesATakeback')),
                acceptButton(ctrl, 'takeback-yes', ctrl.takebackYes),
            ])
            : null;
    }
    function submitMove(ctrl) {
        return ctrl.moveToSubmit || ctrl.dropToSubmit
            ? h('div.negotiation.move-confirm', [
                declineButton(ctrl, () => ctrl.submitMove(false), 'cancel'),
                h('p', ctrl.noarg('confirmMove')),
                acceptButton(ctrl, 'confirm-yes', () => ctrl.submitMove(true)),
            ])
            : undefined;
    }
    function backToTournament(ctrl) {
        var _a;
        const d = ctrl.data;
        return ((_a = d.tournament) === null || _a === void 0 ? void 0 : _a.running)
            ? h('div.follow-up', [
                h('a.text.fbt.strong.glowing', {
                    attrs: {
                        'data-icon': 'G',
                        href: '/tournament/' + d.tournament.id,
                    },
                    hook: bind$1('click', ctrl.setRedirecting),
                }, ctrl.noarg('backToTournament')),
                h('form', {
                    attrs: {
                        method: 'post',
                        action: '/tournament/' + d.tournament.id + '/withdraw',
                    },
                }, [h('button.text.fbt.weak', justIcon('Z'), 'Pause')]),
                analysisButton$1(ctrl),
            ])
            : undefined;
    }
    function backToSwiss(ctrl) {
        var _a;
        const d = ctrl.data;
        return ((_a = d.swiss) === null || _a === void 0 ? void 0 : _a.running)
            ? h('div.follow-up', [
                h('a.text.fbt.strong.glowing', {
                    attrs: {
                        'data-icon': 'G',
                        href: '/swiss/' + d.swiss.id,
                    },
                    hook: bind$1('click', ctrl.setRedirecting),
                }, ctrl.noarg('backToTournament')),
                analysisButton$1(ctrl),
            ])
            : undefined;
    }
    function moretime(ctrl) {
        return moretimeable(ctrl.data)
            ? h('a.moretime', {
                attrs: {
                    title: ctrl.data.clock ? ctrl.trans('giveNbSeconds', ctrl.data.clock.moretime) : ctrl.noarg('giveMoreTime'),
                    'data-icon': 'O',
                },
                hook: bind$1('click', ctrl.socket.moreTime),
            })
            : null;
    }
    function followUp(ctrl) {
        const d = ctrl.data, rematchable = !d.game.rematch &&
            (finished(d) || aborted(d)) &&
            !d.tournament &&
            !d.simul &&
            !d.swiss &&
            !d.game.boosted, newable = (finished(d) || aborted(d)) && (d.game.source === 'lobby' || d.game.source === 'pool'), rematchZone = ctrl.challengeRematched
            ? [
                h('div.suggestion.text', {
                    hook: onSuggestionHook,
                }, ctrl.noarg('rematchOfferSent')),
            ]
            : rematchable || d.game.rematch
                ? rematchButtons(ctrl)
                : [];
        return h('div.follow-up', [
            ...rematchZone,
            d.tournament
                ? h('a.fbt', {
                    attrs: { href: '/tournament/' + d.tournament.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            d.swiss
                ? h('a.fbt', {
                    attrs: { href: '/swiss/' + d.swiss.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            newable
                ? h('a.fbt', {
                    attrs: { href: d.game.source === 'pool' ? poolUrl(d.clock, d.opponent.user) : '/?hook_like=' + d.game.id },
                }, ctrl.noarg('newOpponent'))
                : null,
            analysisButton$1(ctrl),
        ]);
    }
    function watcherFollowUp(ctrl) {
        const d = ctrl.data, content = [
            d.game.rematch
                ? h('a.fbt.text', {
                    attrs: {
                        href: `/${d.game.rematch}/${d.opponent.color}`,
                    },
                }, ctrl.noarg('viewRematch'))
                : null,
            d.tournament
                ? h('a.fbt', {
                    attrs: { href: '/tournament/' + d.tournament.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            d.swiss
                ? h('a.fbt', {
                    attrs: { href: '/swiss/' + d.swiss.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            analysisButton$1(ctrl),
        ];
        return content.find(x => !!x) ? h('div.follow-up', content) : null;
    }
    const onSuggestionHook = onInsert(el => lichess.pubsub.emit('round.suggestion', el.textContent));

    function renderClock(ctrl, player, position) {
        const clock = ctrl.clock, millis = clock.millisOf(player.color), isPlayer = ctrl.data.player.color === player.color, isRunning = player.color === clock.times.activeColor;
        const update = (el) => {
            const els = clock.elements[player.color], millis = clock.millisOf(player.color), isRunning = player.color === clock.times.activeColor;
            els.time = el;
            els.clock = el.parentElement;
            el.innerHTML = formatClockTime$1(millis, clock.showTenths(millis), isRunning, clock.opts.nvui);
        };
        const timeHook = {
            insert: vnode => update(vnode.elm),
            postpatch: (_, vnode) => update(vnode.elm),
        };
        return h('div.rclock.rclock-' + position, {
            class: {
                outoftime: millis <= 0,
                running: isRunning,
                emerg: millis < clock.emergMs,
            },
        }, clock.opts.nvui
            ? [
                h('div.time', {
                    attrs: { role: 'timer' },
                    hook: timeHook,
                }),
            ]
            : [
                clock.showBar && bothPlayersHavePlayed(ctrl.data) ? showBar(ctrl, player.color) : undefined,
                h('div.time', {
                    class: {
                        hour: millis > 3600 * 1000,
                    },
                    hook: timeHook,
                }),
                renderBerserk(ctrl, player.color, position),
                isPlayer ? goBerserk(ctrl) : moretime(ctrl),
                tourRank(ctrl, player.color, position),
            ]);
    }
    const pad2 = (num) => (num < 10 ? '0' : '') + num;
    const sepHigh = '<sep>:</sep>';
    const sepLow = '<sep class="low">:</sep>';
    function formatClockTime$1(time, showTenths, isRunning, nvui) {
        const date = new Date(time);
        if (nvui)
            return ((time >= 3600000 ? Math.floor(time / 3600000) + 'H:' : '') +
                date.getUTCMinutes() +
                'M:' +
                date.getUTCSeconds() +
                'S');
        const millis = date.getUTCMilliseconds(), sep = isRunning && millis < 500 ? sepLow : sepHigh, baseStr = pad2(date.getUTCMinutes()) + sep + pad2(date.getUTCSeconds());
        if (time >= 3600000) {
            const hours = pad2(Math.floor(time / 3600000));
            return hours + sepHigh + baseStr;
        }
        else if (showTenths) {
            let tenthsStr = Math.floor(millis / 100).toString();
            if (!isRunning && time < 1000) {
                tenthsStr += '<huns>' + (Math.floor(millis / 10) % 10) + '</huns>';
            }
            return baseStr + '<tenths><sep>.</sep>' + tenthsStr + '</tenths>';
        }
        else {
            return baseStr;
        }
    }
    function showBar(ctrl, color) {
        const clock = ctrl.clock;
        const update = (el) => {
            if (el.animate !== undefined) {
                let anim = clock.elements[color].barAnim;
                if (anim === undefined || !anim.effect || anim.effect.target !== el) {
                    anim = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(0, 1)' }], {
                        duration: clock.barTime,
                        fill: 'both',
                    });
                    clock.elements[color].barAnim = anim;
                }
                const remaining = clock.millisOf(color);
                anim.currentTime = clock.barTime - remaining;
                if (color === clock.times.activeColor) {
                    // Calling play after animations finishes restarts anim
                    if (remaining > 0)
                        anim.play();
                }
                else
                    anim.pause();
            }
            else {
                clock.elements[color].bar = el;
                el.style.transform = 'scale(' + clock.timeRatio(clock.millisOf(color)) + ',1)';
            }
        };
        return h('div.bar', {
            class: { berserk: !!ctrl.goneBerserk[color] },
            hook: {
                insert: vnode => update(vnode.elm),
                postpatch: (_, vnode) => update(vnode.elm),
            },
        });
    }
    function updateElements(clock, els, millis) {
        if (els.time)
            els.time.innerHTML = formatClockTime$1(millis, clock.showTenths(millis), true, clock.opts.nvui);
        if (els.bar)
            els.bar.style.transform = 'scale(' + clock.timeRatio(millis) + ',1)';
        if (els.clock) {
            const cl = els.clock.classList;
            if (millis < clock.emergMs)
                cl.add('emerg');
            else if (cl.contains('emerg'))
                cl.remove('emerg');
        }
    }
    function showBerserk(ctrl, color) {
        return !!ctrl.goneBerserk[color] && ctrl.data.game.turns <= 1 && playable(ctrl.data);
    }
    function renderBerserk(ctrl, color, position) {
        return showBerserk(ctrl, color) ? h('div.berserked.' + position, justIcon('`')) : null;
    }
    function goBerserk(ctrl) {
        if (!berserkableBy(ctrl.data))
            return;
        if (ctrl.goneBerserk[ctrl.data.player.color])
            return;
        return h('button.fbt.go-berserk', {
            attrs: {
                title: 'GO BERSERK! Half the time, no increment, bonus point',
                'data-icon': '`',
            },
            hook: bind$1('click', ctrl.goBerserk),
        });
    }
    function tourRank(ctrl, color, position) {
        var _a, _b;
        const d = ctrl.data, ranks = ((_a = d.tournament) === null || _a === void 0 ? void 0 : _a.ranks) || ((_b = d.swiss) === null || _b === void 0 ? void 0 : _b.ranks);
        return ranks && !showBerserk(ctrl, color)
            ? h('div.tour-rank.' + position, {
                attrs: { title: 'Current tournament rank' },
            }, '#' + ranks[color])
            : null;
    }

    class ClockController {
        constructor(d, opts) {
            this.opts = opts;
            this.emergSound = {
                play: () => lichess.sound.play('lowTime'),
                delay: 20000,
                playable: {
                    white: true,
                    black: true,
                },
            };
            this.elements = {
                white: {},
                black: {},
            };
            this.timeRatio = (millis) => Math.min(1, millis * this.timeRatioDivisor);
            this.setClock = (d, white, black, delay = 0) => {
                const isClockRunning = playable(d) && (playedTurns(d) > 1 || d.clock.running), delayMs = delay * 10;
                this.times = {
                    white: white * 1000,
                    black: black * 1000,
                    activeColor: isClockRunning ? d.game.player : undefined,
                    lastUpdate: performance.now() + delayMs,
                };
                if (isClockRunning)
                    this.scheduleTick(this.times[d.game.player], delayMs);
            };
            this.addTime = (color, time) => {
                this.times[color] += time * 10;
            };
            this.stopClock = () => {
                const color = this.times.activeColor;
                if (color) {
                    const curElapse = this.elapsed();
                    this.times[color] = Math.max(0, this.times[color] - curElapse);
                    this.times.activeColor = undefined;
                    return curElapse;
                }
            };
            this.hardStopClock = () => (this.times.activeColor = undefined);
            this.scheduleTick = (time, extraDelay) => {
                if (this.tickCallback !== undefined)
                    clearTimeout(this.tickCallback);
                this.tickCallback = setTimeout(this.tick, 
                // changing the value of active node confuses the chromevox screen reader
                // so update the clock less often
                this.opts.nvui ? 1000 : (time % (this.showTenths(time) ? 100 : 500)) + 1 + extraDelay);
            };
            // Should only be invoked by scheduleTick.
            this.tick = () => {
                this.tickCallback = undefined;
                const color = this.times.activeColor;
                if (color === undefined)
                    return;
                const now = performance.now();
                const millis = Math.max(0, this.times[color] - this.elapsed(now));
                this.scheduleTick(millis, 0);
                if (millis === 0)
                    this.opts.onFlag();
                else
                    updateElements(this, this.elements[color], millis);
                if (this.opts.soundColor === color) {
                    if (this.emergSound.playable[color]) {
                        if (millis < this.emergMs && !(now < this.emergSound.next)) {
                            this.emergSound.play();
                            this.emergSound.next = now + this.emergSound.delay;
                            this.emergSound.playable[color] = false;
                        }
                    }
                    else if (millis > 1.5 * this.emergMs) {
                        this.emergSound.playable[color] = true;
                    }
                }
            };
            this.elapsed = (now = performance.now()) => Math.max(0, now - this.times.lastUpdate);
            this.millisOf = (color) => this.times.activeColor === color ? Math.max(0, this.times[color] - this.elapsed()) : this.times[color];
            this.isRunning = () => this.times.activeColor !== undefined;
            const cdata = d.clock;
            if (cdata.showTenths === 0 /* Never */)
                this.showTenths = () => false;
            else {
                const cutoff = cdata.showTenths === 1 /* Below10Secs */ ? 10000 : 3600000;
                this.showTenths = time => time < cutoff;
            }
            this.showBar = cdata.showBar && !this.opts.nvui;
            this.barTime = 1000 * (Math.max(cdata.initial, 2) + 5 * cdata.increment);
            this.timeRatioDivisor = 1 / this.barTime;
            this.emergMs = 1000 * Math.min(60, Math.max(10, cdata.initial * 0.125));
            this.setClock(d, cdata.white, cdata.black);
        }
    }

    function ctrl$1(root, data, onFlag) {
        const timePercentDivisor = 0.1 / data.increment;
        const timePercent = (color) => Math.max(0, Math.min(100, times[color] * timePercentDivisor));
        let times;
        function update(white, black) {
            times = {
                white: white * 1000,
                black: black * 1000,
                lastUpdate: performance.now(),
            };
        }
        update(data.white, data.black);
        function tick(color) {
            const now = performance.now();
            times[color] -= now - times.lastUpdate;
            times.lastUpdate = now;
            if (times[color] <= 0)
                onFlag();
        }
        const millisOf = (color) => Math.max(0, times[color]);
        return {
            root,
            data,
            timePercent,
            millisOf,
            update,
            tick,
        };
    }

    class MoveOn {
        constructor(ctrl, key) {
            this.ctrl = ctrl;
            this.key = key;
            this.storage = lichess.storage.makeBoolean(this.key);
            this.toggle = () => {
                this.storage.toggle();
                this.next(true);
            };
            this.get = this.storage.get;
            this.redirect = (href) => {
                this.ctrl.setRedirecting();
                window.location.href = href;
            };
            this.next = (force) => {
                const d = this.ctrl.data;
                if (d.player.spectator || !isSwitchable(d) || isPlayerTurn(d) || !this.get())
                    return;
                if (force)
                    this.redirect('/round-next/' + d.game.id);
                else if (d.simul) {
                    if (d.simul.hostId === this.ctrl.opts.userId && d.simul.nbPlaying > 1)
                        this.redirect('/round-next/' + d.game.id);
                }
                else
                    whatsNext(this.ctrl).then(data => {
                        if (data.next)
                            this.redirect('/' + data.next);
                    });
            };
        }
    }

    /* Tracks moves that were played on the board,
     * sent to the server, possibly acked,
     * but without a move response from the server yet.
     * After a delay, it will trigger a reload.
     * This might fix bugs where the board is in a
     * transient, dirty state, where clocks don't tick,
     * eventually causing the player to flag.
     * It will also help with lila-ws restarts.
     */
    class TransientMove {
        constructor(socket) {
            this.socket = socket;
            this.current = undefined;
            this.register = () => {
                this.current = setTimeout(this.expire, 10000);
            };
            this.clear = () => {
                if (this.current)
                    clearTimeout(this.current);
            };
            this.expire = () => {
                text('/statlog?e=roundTransientExpire', { method: 'post' });
                this.socket.reload({});
            };
        }
    }

    function capture(ctrl, key) {
        const exploding = [], diff = new Map(), orig = key2pos(key), minX = Math.max(0, orig[0] - 1), maxX = Math.min(7, orig[0] + 1), minY = Math.max(0, orig[1] - 1), maxY = Math.min(7, orig[1] + 1);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const k = pos2key([x, y]);
                exploding.push(k);
                const p = ctrl.chessground.state.pieces.get(k);
                const explodes = p && (k === key || p.role !== 'pawn');
                if (explodes)
                    diff.set(k, undefined);
            }
        }
        ctrl.chessground.setPieces(diff);
        ctrl.chessground.explode(exploding);
    }

    const pieceRoles = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    function drag(ctrl, e) {
        if (e.button !== undefined && e.button !== 0)
            return; // only touch or left click
        if (ctrl.replaying() || !ctrl.isPlaying())
            return;
        const el = e.target, role = el.getAttribute('data-role'), color = el.getAttribute('data-color'), number = el.getAttribute('data-nb');
        if (!role || !color || number === '0')
            return;
        e.stopPropagation();
        e.preventDefault();
        dragNewPiece(ctrl.chessground.state, { color, role }, e);
    }
    let dropWithKey = false;
    let dropWithDrag = false;
    let mouseIconsLoaded = false;
    function valid(data, role, key) {
        if (crazyKeys.length === 0)
            dropWithDrag = true;
        else {
            dropWithKey = true;
            if (!mouseIconsLoaded)
                preloadMouseIcons(data);
        }
        if (!isPlayerTurn(data))
            return false;
        if (role === 'pawn' && (key[1] === '1' || key[1] === '8'))
            return false;
        const dropStr = data.possibleDrops;
        if (typeof dropStr === 'undefined' || dropStr === null)
            return true;
        const drops = dropStr.match(/.{2}/g) || [];
        return drops.includes(key);
    }
    function onEnd() {
        const store = lichess.storage.make('crazyKeyHist');
        if (dropWithKey)
            store.set(10);
        else if (dropWithDrag) {
            const cur = parseInt(store.get());
            if (cur > 0 && cur <= 10)
                store.set(cur - 1);
            else if (cur !== 0)
                store.set(3);
        }
    }
    const crazyKeys = [];
    function init$1(ctrl) {
        const k = window.Mousetrap;
        let activeCursor;
        const setDrop = () => {
            if (activeCursor)
                document.body.classList.remove(activeCursor);
            if (crazyKeys.length > 0) {
                const role = pieceRoles[crazyKeys[crazyKeys.length - 1] - 1], color = ctrl.data.player.color, crazyData = ctrl.data.crazyhouse;
                if (!crazyData)
                    return;
                const nb = crazyData.pockets[color === 'white' ? 0 : 1][role];
                setDropMode(ctrl.chessground.state, nb > 0 ? { color, role } : undefined);
                activeCursor = `cursor-${color}-${role}`;
                document.body.classList.add(activeCursor);
            }
            else {
                cancelDropMode(ctrl.chessground.state);
                activeCursor = undefined;
            }
        };
        // This case is needed if the pocket piece becomes available while
        // the corresponding drop key is active.
        //
        // When the drop key is first pressed, the cursor will change, but
        // chessground.setDropMove(state, undefined) is called, which means
        // clicks on the board will not drop a piece.
        // If the piece becomes available, we call into chessground again.
        lichess.pubsub.on('ply', () => {
            if (crazyKeys.length > 0)
                setDrop();
        });
        for (let i = 1; i <= 5; i++) {
            const iStr = i.toString();
            k.bind(iStr, () => {
                if (!crazyKeys.includes(i)) {
                    crazyKeys.push(i);
                    setDrop();
                }
            }).bind(iStr, () => {
                const idx = crazyKeys.indexOf(i);
                if (idx >= 0) {
                    crazyKeys.splice(idx, 1);
                    if (idx === crazyKeys.length) {
                        setDrop();
                    }
                }
            }, 'keyup');
        }
        const resetKeys = () => {
            if (crazyKeys.length > 0) {
                crazyKeys.length = 0;
                setDrop();
            }
        };
        window.addEventListener('blur', resetKeys);
        // Handle focus on input bars – these will hide keyup events
        window.addEventListener('focus', e => {
            if (e.target && e.target.localName === 'input')
                resetKeys();
        }, { capture: true });
        if (lichess.storage.get('crazyKeyHist') !== '0')
            preloadMouseIcons(ctrl.data);
    }
    // zh keys has unacceptable jank when cursors need to dl,
    // so preload when the feature might be used.
    // Images are used in _zh.scss, which should be kept in sync.
    function preloadMouseIcons(data) {
        const colorKey = data.player.color[0];
        for (const pKey of 'PNBRQ')
            fetch(lichess.assetUrl(`piece/cburnett/${colorKey}${pKey}.svg`));
        mouseIconsLoaded = true;
    }

    const sanToRole = {
        P: 'pawn',
        N: 'knight',
        B: 'bishop',
        R: 'rook',
        Q: 'queen',
        K: 'king',
    };
    function ctrl(root, step, redraw) {
        let focus = false;
        let handler;
        let preHandlerBuffer = step.fen;
        let lastSelect = performance.now();
        const cgState = root.chessground.state;
        const select = (key) => {
            if (cgState.selected === key)
                root.chessground.cancelMove();
            else {
                root.chessground.selectSquare(key, true);
                lastSelect = performance.now();
            }
        };
        let usedSan = false;
        return {
            drop(key, piece) {
                const role = sanToRole[piece];
                const crazyData = root.data.crazyhouse;
                const color = root.data.player.color;
                // Square occupied
                if (!role || !crazyData || cgState.pieces.has(key))
                    return;
                // Piece not in Pocket
                if (!crazyData.pockets[color === 'white' ? 0 : 1][role])
                    return;
                if (!valid(root.data, role, key))
                    return;
                root.chessground.cancelMove();
                root.chessground.newPiece({ role, color }, key);
                root.sendNewPiece(role, key, false);
            },
            promote(orig, dest, piece) {
                const role = sanToRole[piece];
                if (!role || role == 'pawn')
                    return;
                root.chessground.cancelMove();
                sendPromotion(root, orig, dest, role, { premove: false });
            },
            update(step, yourMove = false) {
                if (handler)
                    handler(step.fen, cgState.movable.dests, yourMove);
                else
                    preHandlerBuffer = step.fen;
            },
            registerHandler(h) {
                handler = h;
                if (preHandlerBuffer)
                    handler(preHandlerBuffer, cgState.movable.dests);
            },
            hasFocus: () => focus,
            setFocus(v) {
                focus = v;
                redraw();
            },
            san(orig, dest) {
                usedSan = true;
                root.chessground.cancelMove();
                select(orig);
                select(dest);
            },
            select,
            hasSelected: () => cgState.selected,
            confirmMove() {
                root.submitMove(true);
            },
            usedSan,
            jump(delta) {
                root.userJump(root.ply + delta);
                redraw();
            },
            justSelected() {
                return performance.now() - lastSelect < 500;
            },
            clock: () => root.clock,
            resign: root.resign,
        };
    }
    function render$1(ctrl) {
        return h('div.keyboard-move', [
            h('input', {
                attrs: {
                    spellcheck: false,
                    autocomplete: false,
                },
                hook: onInsert(input => lichess.loadModule('round.keyboardMove').then(() => ctrl.registerHandler(lichess.keyboardMove({ input, ctrl })))),
            }),
            ctrl.hasFocus()
                ? h('em', 'Enter SAN (Nc3) or UCI (b1c3) moves, or type / to focus chat')
                : h('strong', 'Press <enter> to focus'),
        ]);
    }

    function aiName(ctrl, level) {
        return ctrl.trans('aiNameLevelAiLevel', 'Stockfish', level);
    }
    function userHtml(ctrl, player, position) {
        const d = ctrl.data, user = player.user, perf = user ? user.perfs[d.game.perf] : null, rating = player.rating ? player.rating : perf && perf.rating, rd = player.ratingDiff, ratingDiff = rd === 0 ? h('span', '±0') : rd && rd > 0 ? h('good', '+' + rd) : rd && rd < 0 ? h('bad', '−' + -rd) : undefined;
        if (user) {
            const connecting = !player.onGame && ctrl.firstSeconds && user.online;
            return h(`div.ruser-${position}.ruser.user-link`, {
                class: {
                    online: player.onGame,
                    offline: !player.onGame,
                    long: user.username.length > 16,
                    connecting,
                },
            }, [
                h('i.line' + (user.patron ? '.patron' : ''), {
                    attrs: {
                        title: connecting ? 'Connecting to the game' : player.onGame ? 'Joined the game' : 'Left the game',
                    },
                }),
                h('a.text.ulpt', {
                    attrs: Object.assign({ 'data-pt-pos': 's', href: '/@/' + user.username }, (ctrl.isPlaying() ? { target: '_blank', rel: 'noopener' } : {})),
                }, user.title
                    ? [
                        h('span.utitle', user.title == 'BOT' ? { attrs: { 'data-bot': true } } : {}, user.title),
                        ' ',
                        user.username,
                    ]
                    : [user.username]),
                rating ? h('rating', rating + (player.provisional ? '?' : '')) : null,
                ratingDiff,
                player.engine
                    ? h('span', {
                        attrs: {
                            'data-icon': 'j',
                            title: ctrl.noarg('thisAccountViolatedTos'),
                        },
                    })
                    : null,
            ]);
        }
        const connecting = !player.onGame && ctrl.firstSeconds;
        return h(`div.ruser-${position}.ruser.user-link`, {
            class: {
                online: player.onGame,
                offline: !player.onGame,
                connecting,
            },
        }, [
            h('i.line', {
                attrs: {
                    title: connecting ? 'Connecting to the game' : player.onGame ? 'Joined the game' : 'Left the game',
                },
            }),
            h('name', player.name || ctrl.noarg('anonymous')),
        ]);
    }
    function userTxt(ctrl, player) {
        if (player.user) {
            return (player.user.title ? player.user.title + ' ' : '') + player.user.username;
        }
        else if (player.ai)
            return aiName(ctrl, player.ai);
        else
            return ctrl.noarg('anonymous');
    }

    let found = false;
    const truncateFen = (fen) => fen.split(' ')[0];
    function subscribe(ctrl) {
        var _a;
        // allow everyone to cheat against the AI
        if (ctrl.data.opponent.ai)
            return;
        // allow registered players to use assistance in casual games
        if (!ctrl.data.game.rated && ctrl.opts.userId)
            return;
        // bots can cheat alright
        if (((_a = ctrl.data.player.user) === null || _a === void 0 ? void 0 : _a.title) == 'BOT')
            return;
        // Notify tabs to disable ceval. Unless this game is loaded directly on a
        // position being analysed, there is plenty of time (7 moves, in most cases)
        // for this to take effect.
        lichess.storage.fire('ceval.disable');
        lichess.storage.make('ceval.fen').listen(e => {
            const d = ctrl.data, step = lastStep(ctrl.data);
            if (!found && step.ply > 14 && ctrl.isPlaying() && e.value && truncateFen(step.fen) == truncateFen(e.value)) {
                text(`/jslog/${d.game.id}${d.player.id}?n=ceval`, { method: 'post' });
                found = true;
            }
        });
    }
    function publish(d, move) {
        if (d.opponent.ai)
            lichess.storage.fire('ceval.fen', move.fen);
    }

    const prev = (ctrl) => ctrl.userJump(ctrl.ply - 1);
    const next = (ctrl) => ctrl.userJump(ctrl.ply + 1);
    const init = (ctrl) => window.Mousetrap.bind(['left', 'h'], () => {
        prev(ctrl);
        ctrl.redraw();
    })
        .bind(['right', 'l'], () => {
        next(ctrl);
        ctrl.redraw();
    })
        .bind(['up', 'k'], () => {
        ctrl.userJump(0);
        ctrl.redraw();
    })
        .bind(['down', 'j'], () => {
        ctrl.userJump(ctrl.data.steps.length - 1);
        ctrl.redraw();
    })
        .bind('f', ctrl.flipNow)
        .bind('z', () => lichess.pubsub.emit('zen'));

    /// <reference types="../types/ab" />
    class RoundController {
        constructor(opts, redraw) {
            var _a;
            this.opts = opts;
            this.redraw = redraw;
            this.firstSeconds = true;
            this.flip = false;
            this.loading = false;
            this.redirecting = false;
            this.goneBerserk = {};
            this.resignConfirm = undefined;
            this.drawConfirm = undefined;
            // will be replaced by view layer
            this.autoScroll = () => { };
            this.challengeRematched = false;
            this.shouldSendMoveTime = false;
            this.sign = Math.random().toString(36);
            this.showExpiration = () => {
                if (!this.data.expiration)
                    return;
                this.redraw();
                setTimeout(this.showExpiration, 250);
            };
            this.onUserMove = (orig, dest, meta) => {
                if (!this.keyboardMove || !this.keyboardMove.usedSan)
                    ;
                if (!start(this, orig, dest, meta))
                    this.sendMove(orig, dest, undefined, meta);
            };
            this.onUserNewPiece = (role, key, meta) => {
                if (!this.replaying() && valid(this.data, role, key)) {
                    this.sendNewPiece(role, key, !!meta.predrop);
                }
                else
                    this.jump(this.ply);
            };
            this.onMove = (orig, dest, captured) => {
                if (captured || this.enpassant(orig, dest)) {
                    if (this.data.game.variant.key === 'atomic') {
                        explode();
                        capture(this, dest);
                    }
                    else
                        capture$1();
                }
                else
                    move();
            };
            this.onPremove = (orig, dest, meta) => {
                start(this, orig, dest, meta);
            };
            this.onCancelPremove = () => {
                cancelPrePromotion(this);
            };
            this.onPredrop = (role, _) => {
                this.preDrop = role;
                this.redraw();
            };
            this.isSimulHost = () => {
                return this.data.simul && this.data.simul.hostId === this.opts.userId;
            };
            this.enpassant = (orig, dest) => {
                var _a;
                if (orig[0] === dest[0] || ((_a = this.chessground.state.pieces.get(dest)) === null || _a === void 0 ? void 0 : _a.role) !== 'pawn')
                    return false;
                const pos = (dest[0] + orig[1]);
                this.chessground.setPieces(new Map([[pos, undefined]]));
                return true;
            };
            this.lastPly = () => lastPly(this.data);
            this.makeCgHooks = () => ({
                onUserMove: this.onUserMove,
                onUserNewPiece: this.onUserNewPiece,
                onMove: this.onMove,
                onNewPiece: move,
                onPremove: this.onPremove,
                onCancelPremove: this.onCancelPremove,
                onPredrop: this.onPredrop,
            });
            this.replaying = () => this.ply !== this.lastPly();
            this.userJump = (ply) => {
                this.cancelMove();
                this.chessground.selectSquare(null);
                if (ply != this.ply && this.jump(ply))
                    userJump(this, this.ply);
                else
                    this.redraw();
            };
            this.isPlaying = () => isPlayerPlaying(this.data);
            this.jump = (ply) => {
                ply = Math.max(firstPly(this.data), Math.min(this.lastPly(), ply));
                const isForwardStep = ply === this.ply + 1;
                this.ply = ply;
                this.justDropped = undefined;
                this.preDrop = undefined;
                const s = this.stepAt(ply), config = {
                    fen: s.fen,
                    lastMove: uci2move(s.uci),
                    check: !!s.check,
                    turnColor: this.ply % 2 === 0 ? 'white' : 'black',
                };
                if (this.replaying())
                    this.chessground.stop();
                else
                    config.movable = {
                        color: this.isPlaying() ? this.data.player.color : undefined,
                        dests: parsePossibleMoves(this.data.possibleMoves),
                    };
                this.chessground.set(config);
                if (s.san && isForwardStep) {
                    if (s.san.includes('x'))
                        capture$1();
                    else
                        move();
                    if (/[+#]/.test(s.san))
                        check();
                }
                this.autoScroll();
                if (this.keyboardMove)
                    this.keyboardMove.update(s);
                lichess.pubsub.emit('ply', ply);
                return true;
            };
            this.replayEnabledByPref = () => {
                const d = this.data;
                return (d.pref.replay === 2 /* Always */ ||
                    (d.pref.replay === 1 /* OnlySlowGames */ &&
                        (d.game.speed === 'classical' || d.game.speed === 'unlimited' || d.game.speed === 'correspondence')));
            };
            this.isLate = () => this.replaying() && playing(this.data);
            this.playerAt = (position) => this.flip ^ (position === 'top') ? this.data.opponent : this.data.player;
            this.flipNow = () => {
                this.flip = !this.nvui && !this.flip;
                this.chessground.set({
                    orientation: boardOrientation(this.data, this.flip),
                });
                this.redraw();
            };
            this.setTitle = () => set(this);
            this.actualSendMove = (tpe, data, meta = {}) => {
                const socketOpts = {
                    sign: this.sign,
                    ackable: true,
                };
                if (this.clock) {
                    socketOpts.withLag = !this.shouldSendMoveTime || !this.clock.isRunning();
                    if (meta.premove && this.shouldSendMoveTime) {
                        this.clock.hardStopClock();
                        socketOpts.millis = 0;
                    }
                    else {
                        const moveMillis = this.clock.stopClock();
                        if (moveMillis !== undefined && this.shouldSendMoveTime) {
                            socketOpts.millis = moveMillis;
                        }
                    }
                }
                this.socket.send(tpe, data, socketOpts);
                this.justDropped = meta.justDropped;
                this.justCaptured = meta.justCaptured;
                this.preDrop = undefined;
                this.transientMove.register();
                this.redraw();
            };
            this.sendMove = (orig, dest, prom, meta) => {
                const move = {
                    u: orig + dest,
                };
                if (prom)
                    move.u += prom === 'knight' ? 'n' : prom[0];
                if (get())
                    move.b = 1;
                this.resign(false);
                if (this.data.pref.submitMove && !meta.premove) {
                    this.moveToSubmit = move;
                    this.redraw();
                }
                else {
                    this.actualSendMove('move', move, {
                        justCaptured: meta.captured,
                        premove: meta.premove,
                    });
                }
            };
            this.sendNewPiece = (role, key, isPredrop) => {
                const drop = {
                    role: role,
                    pos: key,
                };
                if (get())
                    drop.b = 1;
                this.resign(false);
                if (this.data.pref.submitMove && !isPredrop) {
                    this.dropToSubmit = drop;
                    this.redraw();
                }
                else {
                    this.actualSendMove('drop', drop, {
                        justDropped: role,
                        premove: isPredrop,
                    });
                }
            };
            this.showYourMoveNotification = () => {
                const d = this.data;
                if (isPlayerTurn(d))
                    notify$1(() => {
                        let txt = this.noarg('yourTurn');
                        const opponent = userTxt(this, d.opponent);
                        if (this.ply < 1)
                            txt = `${opponent}\njoined the game.\n${txt}`;
                        else {
                            let move = d.steps[d.steps.length - 1].san;
                            const turn = Math.floor((this.ply - 1) / 2) + 1;
                            move = `${turn}${this.ply % 2 === 1 ? '.' : '...'} ${move}`;
                            txt = `${opponent}\nplayed ${move}.\n${txt}`;
                        }
                        return txt;
                    });
                else if (this.isPlaying() && this.ply < 1)
                    notify$1(() => userTxt(this, d.opponent) + '\njoined the game.');
            };
            this.playerByColor = (c) => this.data[c === this.data.player.color ? 'player' : 'opponent'];
            this.apiMove = (o) => {
                var _a, _b;
                const d = this.data, playing = this.isPlaying();
                d.game.turns = o.ply;
                d.game.player = o.ply % 2 === 0 ? 'white' : 'black';
                const playedColor = o.ply % 2 === 0 ? 'black' : 'white', activeColor = d.player.color === d.game.player;
                if (o.status)
                    d.game.status = o.status;
                if (o.winner)
                    d.game.winner = o.winner;
                this.playerByColor('white').offeringDraw = o.wDraw;
                this.playerByColor('black').offeringDraw = o.bDraw;
                d.possibleMoves = activeColor ? o.dests : undefined;
                d.possibleDrops = activeColor ? o.drops : undefined;
                d.crazyhouse = o.crazyhouse;
                this.setTitle();
                if (!this.replaying()) {
                    this.ply++;
                    if (o.role)
                        this.chessground.newPiece({
                            role: o.role,
                            color: playedColor,
                        }, o.uci.substr(2, 2));
                    else {
                        // This block needs to be idempotent, even for castling moves in
                        // Chess960.
                        const keys = uci2move(o.uci), pieces = this.chessground.state.pieces;
                        if (!o.castle ||
                            (((_a = pieces.get(o.castle.king[0])) === null || _a === void 0 ? void 0 : _a.role) === 'king' && ((_b = pieces.get(o.castle.rook[0])) === null || _b === void 0 ? void 0 : _b.role) === 'rook')) {
                            this.chessground.move(keys[0], keys[1]);
                        }
                    }
                    if (o.promotion)
                        promote(this.chessground, o.promotion.key, o.promotion.pieceClass);
                    this.chessground.set({
                        turnColor: d.game.player,
                        movable: {
                            dests: playing ? parsePossibleMoves(d.possibleMoves) : new Map(),
                        },
                        check: !!o.check,
                    });
                    if (o.check)
                        check();
                    onMove();
                    lichess.pubsub.emit('ply', this.ply);
                }
                d.game.threefold = !!o.threefold;
                const step$1 = {
                    ply: this.lastPly() + 1,
                    fen: o.fen,
                    san: o.san,
                    uci: o.uci,
                    check: o.check,
                    crazy: o.crazyhouse,
                };
                d.steps.push(step$1);
                this.justDropped = undefined;
                this.justCaptured = undefined;
                setOnGame(d, playedColor, true);
                this.data.forecastCount = undefined;
                if (o.clock) {
                    this.shouldSendMoveTime = true;
                    const oc = o.clock, delay = playing && activeColor ? 0 : oc.lag || 1;
                    if (this.clock)
                        this.clock.setClock(d, oc.white, oc.black, delay);
                    else if (this.corresClock)
                        this.corresClock.update(oc.white, oc.black);
                }
                if (this.data.expiration) {
                    if (this.data.steps.length > 2)
                        this.data.expiration = undefined;
                    else
                        this.data.expiration.movedAt = Date.now();
                }
                this.redraw();
                if (playing && playedColor == d.player.color) {
                    this.transientMove.clear();
                    this.moveOn.next();
                    publish(d, o);
                }
                if (!this.replaying() && playedColor != d.player.color) {
                    // atrocious hack to prevent race condition
                    // with explosions and premoves
                    // https://github.com/ornicar/lila/issues/343
                    const premoveDelay = d.game.variant.key === 'atomic' ? 100 : 1;
                    setTimeout(() => {
                        if (!this.chessground.playPremove() && !this.playPredrop()) {
                            cancel(this);
                            this.showYourMoveNotification();
                        }
                    }, premoveDelay);
                }
                this.autoScroll();
                this.onChange();
                if (this.keyboardMove)
                    this.keyboardMove.update(step$1, playedColor != d.player.color);
                if (this.music)
                    this.music.jump(o);
                step(step$1);
                return true; // prevents default socket pubsub
            };
            this.playPredrop = () => {
                return this.chessground.playPredrop(drop => {
                    return valid(this.data, drop.role, drop.key);
                });
            };
            this.reload = (d) => {
                if (d.steps.length !== this.data.steps.length)
                    this.ply = d.steps[d.steps.length - 1].ply;
                massage(d);
                this.data = d;
                this.clearJust();
                this.shouldSendMoveTime = false;
                if (this.clock)
                    this.clock.setClock(d, d.clock.white, d.clock.black);
                if (this.corresClock)
                    this.corresClock.update(d.correspondence.white, d.correspondence.black);
                if (!this.replaying())
                    reload$1(this);
                this.setTitle();
                this.moveOn.next();
                this.setQuietMode();
                this.redraw();
                this.autoScroll();
                this.onChange();
                this.setLoading(false);
                if (this.keyboardMove)
                    this.keyboardMove.update(d.steps[d.steps.length - 1]);
            };
            this.endWithData = (o) => {
                var _a, _b;
                const d = this.data;
                d.game.winner = o.winner;
                d.game.status = o.status;
                d.game.boosted = o.boosted;
                this.userJump(this.lastPly());
                this.chessground.stop();
                if (o.ratingDiff) {
                    d.player.ratingDiff = o.ratingDiff[d.player.color];
                    d.opponent.ratingDiff = o.ratingDiff[d.opponent.color];
                }
                if (!d.player.spectator && d.game.turns > 1) {
                    const key = o.winner ? (d.player.color === o.winner ? 'victory' : 'defeat') : 'draw';
                    lichess.sound.play(key);
                    if (key != 'victory' && d.game.turns > 6 && !d.tournament && !d.swiss && lichess.storage.get('courtesy') == '1')
                        (_b = (_a = this.opts.chat) === null || _a === void 0 ? void 0 : _a.instance) === null || _b === void 0 ? void 0 : _b.then(c => c.post('Good game, well played'));
                }
                if (d.crazyhouse)
                    onEnd();
                this.clearJust();
                this.setTitle();
                this.moveOn.next();
                this.setQuietMode();
                this.setLoading(false);
                if (this.clock && o.clock)
                    this.clock.setClock(d, o.clock.wc * 0.01, o.clock.bc * 0.01);
                this.redraw();
                this.autoScroll();
                this.onChange();
                if (d.tv)
                    setTimeout(lichess.reload, 10000);
                status(this);
            };
            this.challengeRematch = () => {
                this.challengeRematched = true;
                challengeRematch(this.data.game.id).then(() => {
                    lichess.pubsub.emit('challenge-app.open');
                    if (lichess.once('rematch-challenge'))
                        setTimeout(() => {
                            lichess.hopscotch(function () {
                                window.hopscotch
                                    .configure({
                                    i18n: { doneBtn: 'OK, got it' },
                                })
                                    .startTour({
                                    id: 'rematch-challenge',
                                    showPrevButton: true,
                                    steps: [
                                        {
                                            title: 'Challenged to a rematch',
                                            content: 'Your opponent is offline, but they can accept this challenge later!',
                                            target: '#challenge-app',
                                            placement: 'bottom',
                                        },
                                    ],
                                });
                            });
                        }, 1000);
                }, _ => {
                    this.challengeRematched = false;
                });
            };
            this.makeCorrespondenceClock = () => {
                if (this.data.correspondence && !this.corresClock)
                    this.corresClock = ctrl$1(this, this.data.correspondence, this.socket.outoftime);
            };
            this.corresClockTick = () => {
                if (this.corresClock && playable(this.data))
                    this.corresClock.tick(this.data.game.player);
            };
            this.setQuietMode = () => {
                const was = lichess.quietMode;
                const is = this.isPlaying();
                if (was !== is) {
                    lichess.quietMode = is;
                    $('body')
                        .toggleClass('playing', is)
                        .toggleClass('no-select', is && this.clock && this.clock.millisOf(this.data.player.color) <= 3e5);
                }
            };
            this.takebackYes = () => {
                this.socket.sendLoading('takeback-yes');
                this.chessground.cancelPremove();
                cancel(this);
            };
            this.resign = (v, immediately) => {
                if (v) {
                    if (this.resignConfirm || !this.data.pref.confirmResign || immediately) {
                        this.socket.sendLoading('resign');
                        clearTimeout(this.resignConfirm);
                    }
                    else {
                        this.resignConfirm = setTimeout(() => this.resign(false), 3000);
                    }
                    this.redraw();
                }
                else if (this.resignConfirm) {
                    clearTimeout(this.resignConfirm);
                    this.resignConfirm = undefined;
                    this.redraw();
                }
            };
            this.goBerserk = () => {
                this.socket.berserk();
                lichess.sound.play('berserk');
            };
            this.setBerserk = (color) => {
                if (this.goneBerserk[color])
                    return;
                this.goneBerserk[color] = true;
                if (color !== this.data.player.color)
                    lichess.sound.play('berserk');
                this.redraw();
                $('<i data-icon="`">').appendTo($(`.game__meta .player.${color} .user-link`));
            };
            this.setLoading = (v, duration = 1500) => {
                clearTimeout(this.loadingTimeout);
                if (v) {
                    this.loading = true;
                    this.loadingTimeout = setTimeout(() => {
                        this.loading = false;
                        this.redraw();
                    }, duration);
                    this.redraw();
                }
                else if (this.loading) {
                    this.loading = false;
                    this.redraw();
                }
            };
            this.setRedirecting = () => {
                this.redirecting = true;
                lichess.unload.expected = true;
                setTimeout(() => {
                    this.redirecting = false;
                    this.redraw();
                }, 2500);
                this.redraw();
            };
            this.submitMove = (v) => {
                const toSubmit = this.moveToSubmit || this.dropToSubmit;
                if (v && toSubmit) {
                    if (this.moveToSubmit)
                        this.actualSendMove('move', this.moveToSubmit);
                    else
                        this.actualSendMove('drop', this.dropToSubmit);
                    lichess.sound.play('confirmation');
                }
                else
                    this.jump(this.ply);
                this.cancelMove();
                if (toSubmit)
                    this.setLoading(true, 300);
            };
            this.cancelMove = () => {
                this.moveToSubmit = undefined;
                this.dropToSubmit = undefined;
            };
            this.onChange = () => {
                if (this.opts.onChange)
                    setTimeout(() => this.opts.onChange(this.data), 150);
            };
            this.setGone = (gone) => {
                setGone(this.data, this.data.opponent.color, gone);
                clearTimeout(this.goneTick);
                if (Number(gone) > 1)
                    this.goneTick = setTimeout(() => {
                        const g = Number(this.opponentGone());
                        if (g > 1)
                            this.setGone(g - 1);
                    }, 1000);
                this.redraw();
            };
            this.opponentGone = () => {
                const d = this.data;
                return d.opponent.gone !== false && !isPlayerTurn(d) && resignable(d) && d.opponent.gone;
            };
            this.canOfferDraw = () => drawable(this.data) && (this.lastDrawOfferAtPly || -99) < this.ply - 20;
            this.offerDraw = (v) => {
                if (this.canOfferDraw()) {
                    if (this.drawConfirm) {
                        if (v)
                            this.doOfferDraw();
                        clearTimeout(this.drawConfirm);
                        this.drawConfirm = undefined;
                    }
                    else if (v) {
                        if (this.data.pref.confirmResign)
                            this.drawConfirm = setTimeout(() => {
                                this.offerDraw(false);
                            }, 3000);
                        else
                            this.doOfferDraw();
                    }
                }
                this.redraw();
            };
            this.doOfferDraw = () => {
                this.lastDrawOfferAtPly = this.ply;
                this.socket.sendLoading('draw-yes', null);
            };
            this.setChessground = (cg) => {
                this.chessground = cg;
                if (this.data.pref.keyboardMove) {
                    this.keyboardMove = ctrl(this, this.stepAt(this.ply), this.redraw);
                    requestAnimationFrame(() => this.redraw());
                }
            };
            this.stepAt = (ply) => plyStep(this.data, ply);
            this.delayedInit = () => {
                const d = this.data;
                if (this.isPlaying() && nbMoves(d, d.player.color) === 0 && !this.isSimulHost()) {
                    lichess.sound.play('genericNotify');
                }
                lichess.requestIdleCallback(() => {
                    const d = this.data;
                    if (this.isPlaying()) {
                        if (!d.simul)
                            init$2(d.steps.length > 2);
                        init$3();
                        this.setTitle();
                        if (d.crazyhouse)
                            init$1(this);
                        window.addEventListener('beforeunload', e => {
                            const d = this.data;
                            if (lichess.unload.expected ||
                                this.nvui ||
                                !playable(d) ||
                                !d.clock ||
                                d.opponent.ai ||
                                this.isSimulHost())
                                return;
                            this.socket.send('bye2');
                            const msg = 'There is a game in progress!';
                            (e || window.event).returnValue = msg;
                            return msg;
                        });
                        if (!this.nvui && d.pref.submitMove) {
                            window.Mousetrap.bind('esc', () => {
                                this.submitMove(false);
                                this.chessground.cancelMove();
                            }).bind('return', () => this.submitMove(true));
                        }
                        subscribe(this);
                    }
                    if (!this.nvui)
                        init(this);
                    setup(this);
                    this.onChange();
                }, 800);
            };
            massage(opts.data);
            const d = (this.data = opts.data);
            this.ply = lastPly(d);
            this.goneBerserk[d.player.color] = d.player.berserk;
            this.goneBerserk[d.opponent.color] = d.opponent.berserk;
            setTimeout(() => {
                this.firstSeconds = false;
                this.redraw();
            }, 3000);
            this.socket = make(opts.socketSend, this);
            if (lichess.RoundNVUI)
                this.nvui = lichess.RoundNVUI(redraw);
            if (d.clock)
                this.clock = new ClockController(d, {
                    onFlag: this.socket.outoftime,
                    soundColor: d.simul || d.player.spectator || !d.pref.clockSound ? undefined : d.player.color,
                    nvui: !!this.nvui,
                });
            else {
                this.makeCorrespondenceClock();
                setInterval(this.corresClockTick, 1000);
            }
            this.setQuietMode();
            this.moveOn = new MoveOn(this, 'move-on');
            this.transientMove = new TransientMove(this.socket);
            this.trans = lichess.trans(opts.i18n);
            this.noarg = this.trans.noarg;
            setTimeout(this.delayedInit, 200);
            setTimeout(this.showExpiration, 350);
            if (!((_a = document.referrer) === null || _a === void 0 ? void 0 : _a.includes('/serviceWorker.')))
                setTimeout(this.showYourMoveNotification, 500);
            // at the end:
            lichess.pubsub.on('jump', ply => {
                this.jump(parseInt(ply));
                this.redraw();
            });
            lichess.pubsub.on('sound_set', set => {
                if (!this.music && set === 'music')
                    lichess.loadScript('javascripts/music/play.js').then(() => {
                        this.music = lichess.playMusic();
                    });
                if (this.music && set !== 'music')
                    this.music = undefined;
            });
            lichess.pubsub.on('zen', () => {
                if (this.isPlaying()) {
                    const zen = !$('body').hasClass('zen');
                    $('body').toggleClass('zen', zen);
                    window.dispatchEvent(new Event('resize'));
                    setZen(zen);
                }
            });
            if (this.isPlaying())
                ;
        }
        clearJust() {
            this.justDropped = undefined;
            this.justCaptured = undefined;
            this.preDrop = undefined;
        }
    }

    const eventNames = ['mousedown', 'touchstart'];
    function pocket(ctrl, color, position) {
        const step = plyStep(ctrl.data, ctrl.ply);
        if (!step.crazy)
            return;
        const droppedRole = ctrl.justDropped, preDropRole = ctrl.preDrop, pocket = step.crazy.pockets[color === 'white' ? 0 : 1], usablePos = position === (ctrl.flip ? 'top' : 'bottom'), usable = usablePos && !ctrl.replaying() && ctrl.isPlaying(), activeColor = color === ctrl.data.player.color;
        const capturedPiece = ctrl.justCaptured;
        const captured = capturedPiece && (capturedPiece['promoted'] ? 'pawn' : capturedPiece.role);
        return h('div.pocket.is2d.pocket-' + position, {
            class: { usable },
            hook: onInsert(el => eventNames.forEach(name => el.addEventListener(name, (e) => {
                if (position === (ctrl.flip ? 'top' : 'bottom') && crazyKeys.length == 0)
                    drag(ctrl, e);
            }))),
        }, pieceRoles.map(role => {
            let nb = pocket[role] || 0;
            if (activeColor) {
                if (droppedRole === role)
                    nb--;
                if (captured === role)
                    nb++;
            }
            return h('div.pocket-c1', h('div.pocket-c2', h('piece.' + role + '.' + color, {
                class: { premove: activeColor && preDropRole === role },
                attrs: {
                    'data-role': role,
                    'data-color': color,
                    'data-nb': nb,
                },
            })));
        }));
    }

    const prefixInteger = (num, length) => (num / Math.pow(10, length)).toFixed(length).substr(2);
    const bold = (x) => `<b>${x}</b>`;
    function formatClockTime(trans, time) {
        const date = new Date(time), minutes = prefixInteger(date.getUTCMinutes(), 2), seconds = prefixInteger(date.getSeconds(), 2);
        let hours, str = '';
        if (time >= 86400 * 1000) {
            // days : hours
            const days = date.getUTCDate() - 1;
            hours = date.getUTCHours();
            str += (days === 1 ? trans('oneDay') : trans.plural('nbDays', days)) + ' ';
            if (hours !== 0)
                str += trans.plural('nbHours', hours);
        }
        else if (time >= 3600 * 1000) {
            // hours : minutes
            hours = date.getUTCHours();
            str += bold(prefixInteger(hours, 2)) + ':' + bold(minutes);
        }
        else {
            // minutes : seconds
            str += bold(minutes) + ':' + bold(seconds);
        }
        return str;
    }
    function renderCorresClock (ctrl, trans, color, position, runningColor) {
        const millis = ctrl.millisOf(color), update = (el) => {
            el.innerHTML = formatClockTime(trans, millis);
        }, isPlayer = ctrl.root.data.player.color === color;
        return h('div.rclock.rclock-correspondence.rclock-' + position, {
            class: {
                outoftime: millis <= 0,
                running: runningColor === color,
            },
        }, [
            ctrl.data.showBar
                ? h('div.bar', [
                    h('span', {
                        attrs: { style: `width: ${ctrl.timePercent(color)}%` },
                    }),
                ])
                : null,
            h('div.time', {
                hook: {
                    insert: vnode => update(vnode.elm),
                    postpatch: (_, vnode) => update(vnode.elm),
                },
            }),
            isPlayer ? null : moretime(ctrl.root),
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

    const scrollMax = 99999, moveTag = 'u8t', indexTag = 'i5z', indexTagUC = indexTag.toUpperCase(), movesTag = 'l4x', rmovesTag = 'rm6';
    const autoScroll = throttle(100, (movesEl, ctrl) => window.requestAnimationFrame(() => {
        if (ctrl.data.steps.length < 7)
            return;
        let st;
        if (ctrl.ply < 3)
            st = 0;
        else if (ctrl.ply == lastPly(ctrl.data))
            st = scrollMax;
        else {
            const plyEl = movesEl.querySelector('.a1t');
            if (plyEl)
                st = isCol1()
                    ? plyEl.offsetLeft - movesEl.offsetWidth / 2 + plyEl.offsetWidth / 2
                    : plyEl.offsetTop - movesEl.offsetHeight / 2 + plyEl.offsetHeight / 2;
        }
        if (typeof st == 'number') {
            if (st == scrollMax)
                movesEl.scrollLeft = movesEl.scrollTop = st;
            else if (isCol1())
                movesEl.scrollLeft = st;
            else
                movesEl.scrollTop = st;
        }
    }));
    const renderDrawOffer = () => h('draw', {
        attrs: {
            title: 'Draw offer',
        },
    }, '½?');
    function renderMove(step, curPly, orEmpty, drawOffers) {
        return step
            ? h(moveTag, {
                class: {
                    a1t: step.ply === curPly,
                },
            }, [step.san[0] === 'P' ? step.san.slice(1) : step.san, drawOffers.has(step.ply) ? renderDrawOffer() : undefined])
            : orEmpty
                ? h(moveTag, '…')
                : undefined;
    }
    function renderResult(ctrl) {
        let result;
        if (finished(ctrl.data))
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
        if (result || aborted(ctrl.data)) {
            const winner = ctrl.data.game.winner;
            return h('div.result-wrap', [
                h('p.result', result || ''),
                h('p.status', {
                    hook: onInsert(() => {
                        if (ctrl.autoScroll)
                            ctrl.autoScroll();
                        else
                            setTimeout(() => ctrl.autoScroll(), 200);
                    }),
                }, [status$1(ctrl), winner ? ' • ' + ctrl.noarg(winner + 'IsVictorious') : '']),
            ]);
        }
        return;
    }
    function renderMoves(ctrl) {
        const steps = ctrl.data.steps, firstPly$1 = firstPly(ctrl.data), lastPly$1 = lastPly(ctrl.data), drawPlies = new Set(ctrl.data.game.drawOffers || []);
        if (typeof lastPly$1 === 'undefined')
            return [];
        const pairs = [];
        let startAt = 1;
        if (firstPly$1 % 2 === 1) {
            pairs.push([null, steps[1]]);
            startAt = 2;
        }
        for (let i = startAt; i < steps.length; i += 2)
            pairs.push([steps[i], steps[i + 1]]);
        const els = [], curPly = ctrl.ply;
        for (let i = 0; i < pairs.length; i++) {
            els.push(h(indexTag, i + 1 + ''));
            els.push(renderMove(pairs[i][0], curPly, true, drawPlies));
            els.push(renderMove(pairs[i][1], curPly, false, drawPlies));
        }
        els.push(renderResult(ctrl));
        return els;
    }
    function analysisButton(ctrl) {
        const forecastCount = ctrl.data.forecastCount;
        return userAnalysable(ctrl.data)
            ? h('a.fbt.analysis', {
                class: {
                    text: !!forecastCount,
                },
                attrs: {
                    title: ctrl.noarg('analysis'),
                    href: game(ctrl.data, ctrl.data.player.color) + '/analysis#' + ctrl.ply,
                    'data-icon': 'A',
                },
            }, forecastCount ? ['' + forecastCount] : [])
            : undefined;
    }
    function renderButtons(ctrl) {
        const d = ctrl.data, firstPly$1 = firstPly(d), lastPly$1 = lastPly(d);
        return h('div.buttons', {
            hook: bind$1('mousedown', e => {
                const target = e.target;
                const ply = parseInt(target.getAttribute('data-ply') || '');
                if (!isNaN(ply))
                    ctrl.userJump(ply);
                else {
                    const action = target.getAttribute('data-act') || target.parentNode.getAttribute('data-act');
                    if (action === 'flip') {
                        if (d.tv)
                            location.href = '/tv/' + d.tv.channel + (d.tv.flip ? '' : '?flip=1');
                        else if (d.player.spectator)
                            location.href = game(d, d.opponent.color);
                        else
                            ctrl.flipNow();
                    }
                }
            }, ctrl.redraw),
        }, [
            h('button.fbt.flip', {
                class: { active: ctrl.flip },
                attrs: {
                    title: ctrl.noarg('flipBoard'),
                    'data-act': 'flip',
                    'data-icon': 'B',
                },
            }),
            ...[
                ['W', firstPly$1],
                ['Y', ctrl.ply - 1],
                ['X', ctrl.ply + 1],
                ['V', lastPly$1],
            ].map((b, i) => {
                const enabled = ctrl.ply !== b[1] && b[1] >= firstPly$1 && b[1] <= lastPly$1;
                return h('button.fbt', {
                    class: { glowing: i === 3 && ctrl.isLate() },
                    attrs: {
                        disabled: !enabled,
                        'data-icon': b[0],
                        'data-ply': enabled ? b[1] : '-',
                    },
                });
            }),
            analysisButton(ctrl) || h('div.noop'),
        ]);
    }
    function initMessage(d, trans) {
        return playable(d) && d.game.turns === 0 && !d.player.spectator
            ? h('div.message', justIcon(''), [
                h('div', [
                    trans(d.player.color === 'white' ? 'youPlayTheWhitePieces' : 'youPlayTheBlackPieces'),
                    ...(d.player.color === 'white' ? [h('br'), h('strong', trans('itsYourTurn'))] : []),
                ]),
            ])
            : null;
    }
    function col1Button(ctrl, dir, icon, disabled) {
        return disabled
            ? null
            : h('button.fbt', {
                attrs: {
                    disabled: disabled,
                    'data-icon': icon,
                    'data-ply': ctrl.ply + dir,
                },
                hook: bind$1('mousedown', e => {
                    e.preventDefault();
                    ctrl.userJump(ctrl.ply + dir);
                    ctrl.redraw();
                }),
            });
    }
    function render(ctrl) {
        const d = ctrl.data, moves = ctrl.replayEnabledByPref() &&
            h(movesTag, {
                hook: onInsert(el => {
                    el.addEventListener('mousedown', e => {
                        let node = e.target, offset = -2;
                        if (node.tagName !== moveTag.toUpperCase())
                            return;
                        while ((node = node.previousSibling)) {
                            offset++;
                            if (node.tagName === indexTagUC) {
                                ctrl.userJump(2 * parseInt(node.textContent || '') + offset);
                                ctrl.redraw();
                                break;
                            }
                        }
                    });
                    ctrl.autoScroll = () => autoScroll(el, ctrl);
                    ctrl.autoScroll();
                }),
            }, renderMoves(ctrl));
        return ctrl.nvui
            ? undefined
            : h(rmovesTag, [
                renderButtons(ctrl),
                initMessage(d, ctrl.trans.noarg) ||
                    (moves
                        ? isCol1()
                            ? h('div.col1-moves', [
                                col1Button(ctrl, -1, 'Y', ctrl.ply == firstPly(d)),
                                moves,
                                col1Button(ctrl, 1, 'X', ctrl.ply == lastPly(d)),
                            ])
                            : moves
                        : renderResult(ctrl)),
            ]);
    }

    let rang = false;
    function renderExpiration (ctrl) {
        const d = playable(ctrl.data) && ctrl.data.expiration;
        if (!d)
            return;
        const timeLeft = Math.max(0, d.movedAt - Date.now() + d.millisToMove), secondsLeft = Math.floor(timeLeft / 1000), myTurn = isPlayerTurn(ctrl.data), emerg = myTurn && timeLeft < 8000;
        if (!rang && emerg) {
            lichess.sound.play('lowTime');
            rang = true;
        }
        const side = myTurn != ctrl.flip ? 'bottom' : 'top';
        return h('div.expiration.expiration-' + side, {
            class: {
                emerg,
                'bar-glider': myTurn,
            },
        }, ctrl.trans.vdomPlural('nbSecondsToPlayTheFirstMove', secondsLeft, h('strong', '' + secondsLeft)));
    }

    function renderPlayer(ctrl, position) {
        const player = ctrl.playerAt(position);
        return ctrl.nvui
            ? undefined
            : player.ai
                ? h('div.user-link.online.ruser.ruser-' + position, [h('i.line'), h('name', aiName(ctrl, player.ai))])
                : userHtml(ctrl, player, position);
    }
    const isLoading = (ctrl) => ctrl.loading || ctrl.redirecting;
    const loader = () => h('i.ddloader');
    const renderTableWith = (ctrl, buttons) => [
        render(ctrl),
        buttons.find(x => !!x) ? h('div.rcontrols', buttons) : null,
    ];
    const renderTableEnd = (ctrl) => renderTableWith(ctrl, [
        isLoading(ctrl) ? loader() : backToTournament(ctrl) || backToSwiss(ctrl) || followUp(ctrl),
    ]);
    const renderTableWatch = (ctrl) => renderTableWith(ctrl, [
        isLoading(ctrl) ? loader() : playable(ctrl.data) ? undefined : watcherFollowUp(ctrl),
    ]);
    const renderTablePlay = (ctrl) => {
        const d = ctrl.data, loading = isLoading(ctrl), submit = submitMove(ctrl), icons = loading || submit
            ? []
            : [
                abortable(d)
                    ? standard(ctrl, undefined, 'L', 'abortGame', 'abort')
                    : standard(ctrl, takebackable, 'i', 'proposeATakeback', 'takeback-yes', ctrl.takebackYes),
                ctrl.drawConfirm
                    ? drawConfirm(ctrl)
                    : standard(ctrl, ctrl.canOfferDraw, '2', 'offerDraw', 'draw-yes', () => ctrl.offerDraw(true)),
                ctrl.resignConfirm
                    ? resignConfirm(ctrl)
                    : standard(ctrl, resignable, 'b', 'resign', 'resign', () => ctrl.resign(true)),
                analysisButton(ctrl),
            ], buttons = loading
            ? [loader()]
            : submit
                ? [submit]
                : [
                    opponentGone(ctrl),
                    threefoldClaimDraw(ctrl),
                    cancelDrawOffer(ctrl),
                    answerOpponentDrawOffer(ctrl),
                    cancelTakebackProposition(ctrl),
                    answerOpponentTakebackProposition(ctrl),
                ];
        return [
            render(ctrl),
            h('div.rcontrols', [
                ...buttons,
                h('div.ricons', {
                    class: { confirm: !!(ctrl.drawConfirm || ctrl.resignConfirm) },
                }, icons),
            ]),
        ];
    };
    function whosTurn(ctrl, color, position) {
        const d = ctrl.data;
        if (finished(d) || aborted(d))
            return;
        return h('div.rclock.rclock-turn.rclock-' + position, [
            d.game.player === color
                ? h('div.rclock-turn__text', d.player.spectator
                    ? ctrl.trans(d.game.player + 'Plays')
                    : ctrl.trans(d.game.player === d.player.color ? 'yourTurn' : 'waitingForOpponent'))
                : null,
        ]);
    }
    function anyClock(ctrl, position) {
        const player = ctrl.playerAt(position);
        if (ctrl.clock)
            return renderClock(ctrl, player, position);
        else if (ctrl.data.correspondence && ctrl.data.game.turns > 1)
            return renderCorresClock(ctrl.corresClock, ctrl.trans, player.color, position, ctrl.data.game.player);
        else
            return whosTurn(ctrl, player.color, position);
    }
    const renderTable = (ctrl) => [
        h('div.round__app__table'),
        renderExpiration(ctrl),
        renderPlayer(ctrl, 'top'),
        ...(ctrl.data.player.spectator
            ? renderTableWatch(ctrl)
            : playable(ctrl.data)
                ? renderTablePlay(ctrl)
                : renderTableEnd(ctrl)),
        renderPlayer(ctrl, 'bottom'),
        /* render clocks after players so they display on top of them in col1,
         * since they occupy the same grid cell. This is required to avoid
         * having two columns with min-content, which causes the horizontal moves
         * to overflow: it couldn't be contained in the parent anymore */
        anyClock(ctrl, 'top'),
        anyClock(ctrl, 'bottom'),
    ];

    function renderMaterial(material, score, position, checks) {
        const children = [];
        let role, i;
        for (role in material) {
            if (material[role] > 0) {
                const content = [];
                for (i = 0; i < material[role]; i++)
                    content.push(h('mpiece.' + role));
                children.push(h('div', content));
            }
        }
        if (checks)
            for (i = 0; i < checks; i++)
                children.push(h('div', h('mpiece.king')));
        if (score > 0)
            children.push(h('score', '+' + score));
        return h('div.material.material-' + position, children);
    }
    function wheel(ctrl, e) {
        if (!ctrl.isPlaying()) {
            e.preventDefault();
            if (e.deltaY > 0)
                next(ctrl);
            else if (e.deltaY < 0)
                prev(ctrl);
            ctrl.redraw();
        }
    }
    const emptyMaterialDiff = {
        white: {},
        black: {},
    };
    function main(ctrl) {
        const d = ctrl.data, cgState = ctrl.chessground && ctrl.chessground.state, topColor = d[ctrl.flip ? 'player' : 'opponent'].color, bottomColor = d[ctrl.flip ? 'opponent' : 'player'].color;
        let material, score = 0;
        if (d.pref.showCaptured) {
            const pieces = cgState ? cgState.pieces : read(plyStep(ctrl.data, ctrl.ply).fen);
            material = getMaterialDiff(pieces);
            score = getScore(pieces) * (bottomColor === 'white' ? 1 : -1);
        }
        else
            material = emptyMaterialDiff;
        const checks = d.player.checks || d.opponent.checks ? countChecks(ctrl.data.steps, ctrl.ply) : noChecks;
        return ctrl.nvui
            ? ctrl.nvui.render(ctrl)
            : h('div.round__app.variant-' + d.game.variant.key, [
                h('div.round__app__board.main-board' + (ctrl.data.pref.blindfold ? '.blindfold' : ''), {
                    hook: 'ontouchstart' in window
                        ? undefined
                        : bind$1('wheel', (e) => wheel(ctrl, e), undefined, false),
                }, [render$2(ctrl), view(ctrl)]),
                pocket(ctrl, topColor, 'top') || renderMaterial(material[topColor], -score, 'top', checks[topColor]),
                ...renderTable(ctrl),
                pocket(ctrl, bottomColor, 'bottom') ||
                    renderMaterial(material[bottomColor], score, 'bottom', checks[bottomColor]),
                ctrl.keyboardMove ? render$1(ctrl.keyboardMove) : null,
            ]);
    }

    const patch = init$5([classModule, attributesModule]);
    function app(opts) {
        const ctrl = new RoundController(opts, redraw);
        const blueprint = main(ctrl);
        opts.element.innerHTML = '';
        let vnode = patch(opts.element, blueprint);
        function redraw() {
            vnode = patch(vnode, main(ctrl));
        }
        window.addEventListener('resize', redraw); // col1 / col2+ transition
        if (ctrl.isPlaying())
            menuHover();
        lichess.sound.preloadBoardSounds();
        return {
            socketReceive: ctrl.socket.receive,
            moveOn: ctrl.moveOn,
        };
    }
    window.LichessChat = LichessChat;
    // that's for the rest of lichess to access chessground
    // without having to include it a second time
    window.Chessground = Chessground;

    exports.app = app;
    exports.boot = boot;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
