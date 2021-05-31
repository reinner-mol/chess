var LichessLobby = (function () {
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
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
    };

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
    const hooks$1 = [
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
        for (i = 0; i < hooks$1.length; ++i) {
            cbs[hooks$1[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                const hook = modules[j][hooks$1[i]];
                if (hook !== undefined) {
                    cbs[hooks$1[i]].push(hook);
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
    const timer$1 = () => {
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
    const eventPosition = (e) => {
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
        return state.animation.enabled ? animate(mutation, state) : render$5(mutation, state);
    }
    function render$5(mutation, state) {
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
        const pos = eventPosition(e), orig = getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
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
            state.drawable.current.pos = eventPosition(e);
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
        const bounds = s.dom.bounds(), position = eventPosition(e), orig = getKeyAtDomPos(position, whitePov(s), bounds);
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
        const position = eventPosition(e);
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
            s.draggable.current.pos = eventPosition(e);
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
        const eventPos = eventPosition(e) || cur.pos;
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
                (config.fen ? anim : render$5)(state => configure(state, config), state);
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
                render$5(unsetPremove, state);
            },
            cancelPredrop() {
                render$5(unsetPredrop, state);
            },
            cancelMove() {
                render$5(state => {
                    cancelMove(state);
                    cancel(state);
                }, state);
            },
            stop() {
                render$5(state => {
                    stop(state);
                    cancel(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$5(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$5(state => (state.drawable.shapes = shapes), state);
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
            hold: timer$1(),
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
            const position = eventPosition(e);
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
    function render$4(s) {
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
                render$4(state);
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

    const variantConfirms = {
        chess960: "This is a Chess960 game!\n\nThe starting position of the pieces on the players' home ranks is randomized.",
        kingOfTheHill: 'This is a King of the Hill game!\n\nThe game can be won by bringing the king to the center.',
        threeCheck: 'This is a Three-check game!\n\nThe game can be won by checking the opponent three times.',
        antichess: 'This is an Antichess game!\n\nIf you can take a piece, you must. The game can be won by losing all your pieces, or by being stalemated.',
        atomic: "This is an Atomic chess game!\n\nCapturing a piece causes an explosion, taking out your piece and surrounding non-pawns. Win by mating or exploding your opponent's king.",
        horde: 'This is a Horde chess game!\nBlack must take all White pawns to win. White must checkmate the Black king.',
        racingKings: 'This is a Racing Kings game!\n\nPlayers must race their kings to the eighth rank. Checks are not allowed.',
        crazyhouse: 'This is a Crazyhouse game!\n\nEvery time a piece is captured, the capturing player gets a piece of the same type and of their color in their pocket.',
    };
    function storageKey(key) {
        return 'lobby.variant.' + key;
    }
    function variantConfirm (variant) {
        return Object.keys(variantConfirms).every(function (key) {
            const v = variantConfirms[key];
            if (variant === key && !lichess.storage.get(storageKey(key))) {
                const c = confirm(v);
                if (c)
                    lichess.storage.set(storageKey(key), '1');
                return c;
            }
            else
                return true;
        });
    }

    function ratingOrder(a, b) {
        return (a.rating || 0) > (b.rating || 0) ? -1 : 1;
    }
    function timeOrder(a, b) {
        return a.t < b.t ? -1 : 1;
    }
    function sort$2(ctrl, hooks) {
        hooks.sort(ctrl.sort === 'time' ? timeOrder : ratingOrder);
    }
    function init(hook) {
        hook.action = hook.sri === lichess.sri ? 'cancel' : 'join';
        hook.variant = hook.variant || 'standard';
    }
    function initAll$1(ctrl) {
        ctrl.data.hooks.forEach(init);
    }
    function add(ctrl, hook) {
        init(hook);
        ctrl.data.hooks.push(hook);
    }
    function setAll(ctrl, hooks) {
        ctrl.data.hooks = hooks;
        initAll$1(ctrl);
    }
    function remove(ctrl, id) {
        ctrl.data.hooks = ctrl.data.hooks.filter(h => h.id !== id);
        ctrl.stepHooks.forEach(h => {
            if (h.id === id)
                h.disabled = true;
        });
    }
    function syncIds(ctrl, ids) {
        ctrl.data.hooks = ctrl.data.hooks.filter(h => ids.includes(h.id));
    }
    function find$1(ctrl, id) {
        return ctrl.data.hooks.find(h => h.id === id);
    }

    function order(a, b) {
        return a.rating > b.rating ? -1 : 1;
    }
    function sort$1(ctrl) {
        ctrl.data.seeks.sort(order);
    }
    function initAll(ctrl) {
        ctrl.data.seeks.forEach(function (seek) {
            seek.action = ctrl.data.me && seek.username === ctrl.data.me.username ? 'cancelSeek' : 'joinSeek';
        });
        sort$1(ctrl);
    }
    function find(ctrl, id) {
        return ctrl.data.seeks.find(s => s.id === id);
    }

    const tab$1 = {
        key: 'lobby.tab',
        fix(t) {
            if (t)
                return t;
            return 'pools';
        },
    };
    const mode = {
        key: 'lobby.mode',
        fix(m) {
            if (m)
                return m;
            return 'list';
        },
    };
    const sort = {
        key: 'lobby.sort',
        fix(s) {
            if (s)
                return s;
            return 'rating';
        },
    };
    function makeStore$1(conf, userId) {
        const fullKey = conf.key + ':' + (userId || '-');
        return {
            set(v) {
                const t = conf.fix(v);
                lichess.storage.set(fullKey, ('' + t));
                return t;
            },
            get() {
                return conf.fix(lichess.storage.get(fullKey));
            },
        };
    }
    function make(userId) {
        return {
            tab: makeStore$1(tab$1, userId),
            mode: makeStore$1(mode, userId),
            sort: makeStore$1(sort, userId),
        };
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

    const seeks = dist(() => json('/lobby/seeks'), 2000);
    const nowPlaying = () => json('/account/now-playing').then(o => o.nowPlaying);
    const anonPoolSeek = (pool) => json('/setup/hook/' + lichess.sri, {
        method: 'POST',
        body: form({
            variant: 1,
            timeMode: 1,
            time: pool.lim,
            increment: pool.inc,
            days: 1,
            color: 'random',
        }),
    });

    function makeKey(poolId) {
        return 'lobby-pool-range-' + poolId;
    }
    function set(poolId, range) {
        const key = makeKey(poolId);
        if (range)
            lichess.storage.set(key, range);
        else
            lichess.storage.remove(key);
    }
    function get(poolId) {
        return lichess.storage.get(makeKey(poolId));
    }

    class LobbySocket {
        constructor(send, ctrl) {
            this.send = send;
            this.receive = (tpe, data) => {
                if (this.handlers[tpe]) {
                    this.handlers[tpe](data);
                    return true;
                }
                return false;
            };
            this.send = send;
            this.handlers = {
                had(hook) {
                    add(ctrl, hook);
                    if (hook.action === 'cancel')
                        ctrl.flushHooks(true);
                    ctrl.redraw();
                },
                hrm(ids) {
                    ids.match(/.{8}/g).forEach(function (id) {
                        remove(ctrl, id);
                    });
                    ctrl.redraw();
                },
                hooks(hooks) {
                    setAll(ctrl, hooks);
                    ctrl.flushHooks(true);
                    ctrl.redraw();
                },
                hli(ids) {
                    syncIds(ctrl, ids.match(/.{8}/g));
                    ctrl.redraw();
                },
                reload_seeks() {
                    if (ctrl.tab === 'seeks')
                        seeks().then(ctrl.setSeeks);
                },
            };
            lichess.idleTimer(3 * 60 * 1000, () => send('idle', true), () => {
                send('idle', false);
                ctrl.awake();
            });
        }
        realTimeIn() {
            this.send('hookIn');
        }
        realTimeOut() {
            this.send('hookOut');
        }
        poolIn(member) {
            // last arg=true: must not retry
            // because if poolIn is sent before socket opens,
            // then poolOut is sent,
            // then poolIn shouldn't be sent again after socket opens.
            // poolIn is sent anyway on socket open event.
            this.send('poolIn', member, {}, true);
        }
        poolOut(member) {
            this.send('poolOut', member.id);
        }
    }

    const toFormLines = (form) => Array.from(new FormData(form).entries())
        .filter(([k, _]) => !k.includes('_range'))
        .reduce((o, [k, v]) => (Object.assign(Object.assign({}, o), { [k]: v })), {});
    const toFormObject = (lines) => Object.keys(lines).reduce((o, k) => {
        const i = k.indexOf('[');
        const fk = i > 0 ? k.slice(0, i) : k;
        return i > 0 ? Object.assign(Object.assign({}, o), { [fk]: [...(o[fk] || []), lines[k]] }) : Object.assign(Object.assign({}, o), { [fk]: lines[k] });
    }, {});
    const makeStore = (storage) => ({
        get: () => JSON.parse(storage.get() || 'null'),
        set: lines => storage.set(JSON.stringify(lines)),
    });

    class Filter {
        constructor(storage, root) {
            this.root = root;
            this.open = false;
            this.toggle = () => {
                this.open = !this.open;
            };
            this.set = (data) => {
                this.data = data && {
                    form: data,
                    filter: toFormObject(data),
                };
            };
            this.save = (form) => {
                const lines = toFormLines(form);
                this.store.set(lines);
                this.set(lines);
                this.root.onSetFilter();
            };
            this.filter = (hooks) => {
                if (!this.data)
                    return { visible: hooks, hidden: 0 };
                const f = this.data.filter, ratingRange = f.ratingRange && f.ratingRange.split('-').map((r) => parseInt(r, 10)), seen = [], visible = [];
                let variant, hidden = 0;
                hooks.forEach(hook => {
                    var _a, _b, _c, _d;
                    variant = hook.variant;
                    if (hook.action === 'cancel')
                        visible.push(hook);
                    else {
                        if (!((_a = f.variant) === null || _a === void 0 ? void 0 : _a.includes(variant)) ||
                            !((_b = f.speed) === null || _b === void 0 ? void 0 : _b.includes((hook.s || 1).toString() /* ultrabullet = bullet */)) ||
                            (((_c = f.mode) === null || _c === void 0 ? void 0 : _c.length) == 1 && f.mode[0] != (hook.ra || 0).toString()) ||
                            (((_d = f.increment) === null || _d === void 0 ? void 0 : _d.length) == 1 && f.increment[0] != hook.i.toString()) ||
                            (ratingRange && (!hook.rating || hook.rating < ratingRange[0] || hook.rating > ratingRange[1]))) {
                            hidden++;
                        }
                        else {
                            const hash = hook.ra + variant + hook.t + hook.rating;
                            if (!seen.includes(hash))
                                visible.push(hook);
                            seen.push(hash);
                        }
                    }
                });
                return { visible, hidden };
            };
            this.store = makeStore(storage);
            this.set(this.store.get());
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

    class Setup {
        constructor(makeStorage, root) {
            this.makeStorage = makeStorage;
            this.root = root;
            this.save = (form) => this.stores[form.getAttribute('data-type')].set(toFormLines(form));
            this.sliderTimes = [
                0,
                1 / 4,
                1 / 2,
                3 / 4,
                1,
                3 / 2,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20,
                25,
                30,
                35,
                40,
                45,
                60,
                75,
                90,
                105,
                120,
                135,
                150,
                165,
                180,
            ];
            this.sliderTime = (v) => (v < this.sliderTimes.length ? this.sliderTimes[v] : 180);
            this.sliderIncrement = (v) => {
                if (v <= 20)
                    return v;
                switch (v) {
                    case 21:
                        return 25;
                    case 22:
                        return 30;
                    case 23:
                        return 35;
                    case 24:
                        return 40;
                    case 25:
                        return 45;
                    case 26:
                        return 60;
                    case 27:
                        return 90;
                    case 28:
                        return 120;
                    case 29:
                        return 150;
                    default:
                        return 180;
                }
            };
            this.sliderDays = (v) => {
                if (v <= 3)
                    return v;
                switch (v) {
                    case 4:
                        return 5;
                    case 5:
                        return 7;
                    case 6:
                        return 10;
                    default:
                        return 14;
                }
            };
            this.sliderInitVal = (v, f, max) => {
                for (let i = 0; i < max; i++) {
                    if (f(i) === v)
                        return i;
                }
                return undefined;
            };
            this.hookToPoolMember = (color, form) => {
                const data = Array.from(new FormData(form).entries());
                const hash = {};
                for (const i in data)
                    hash[data[i][0]] = data[i][1];
                const valid = color == 'random' && hash.variant == 1 && hash.mode == 1 && hash.timeMode == 1, id = parseFloat(hash.time) + '+' + parseInt(hash.increment);
                return valid && this.root.pools.find(p => p.id === id)
                    ? {
                        id,
                        range: hash.ratingRange,
                    }
                    : undefined;
            };
            this.prepareForm = ($modal) => {
                const self = this, $form = $modal.find('form'), $timeModeSelect = $form.find('#sf_timeMode'), $modeChoicesWrap = $form.find('.mode_choice'), $modeChoices = $modeChoicesWrap.find('input'), $casual = $modeChoices.eq(0), $rated = $modeChoices.eq(1), $variantSelect = $form.find('#sf_variant'), $fenPosition = $form.find('.fen_position'), $fenInput = $fenPosition.find('input'), forceFromPosition = !!$fenInput.val(), $timeInput = $form.find('.time_choice [name=time]'), $incrementInput = $form.find('.increment_choice [name=increment]'), $daysInput = $form.find('.days_choice [name=days]'), typ = $form.data('type'), $ratings = $modal.find('.ratings > div'), randomColorVariants = $form.data('random-color-variants').split(','), $submits = $form.find('.color-submits__button'), toggleButtons = () => {
                    const variantId = $variantSelect.val(), timeMode = $timeModeSelect.val(), limit = parseFloat($timeInput.val()), inc = parseFloat($incrementInput.val()), 
                    // no rated variants with less than 30s on the clock and no rated unlimited in the lobby
                    cantBeRated = (typ === 'hook' && timeMode === '0') ||
                        (variantId != '1' && (timeMode != '1' || (limit < 0.5 && inc == 0) || (limit == 0 && inc < 2)));
                    let rated = $rated.prop('checked');
                    if (cantBeRated && rated) {
                        $casual.prop('checked', true);
                        save();
                        rated = false;
                    }
                    $rated.prop('disabled', !!cantBeRated).siblings('label').toggleClass('disabled', cantBeRated);
                    const timeOk = timeMode != '1' || limit > 0 || inc > 0, aiOk = typ != 'ai' || variantId != '3' || limit >= 1 || timeMode != '1';
                    const disable = ($e, d) => $e.prop('disabled', d).toggleClass('disabled', d);
                    if (timeOk && aiOk) {
                        disable($submits, false);
                        if (rated && randomColorVariants.includes(variantId)) {
                            disable($submits.filter(':not(.random)'), true);
                        }
                    }
                    else
                        disable($submits, true);
                }, save = () => this.save($form[0]);
                const c = this.stores[typ].get();
                if (c) {
                    Object.keys(c).forEach(k => {
                        $form.find(`[name="${k}"]`).each(function () {
                            if (k === 'timeMode' && $form.data('forceTimeMode'))
                                return;
                            if (this.type == 'checkbox')
                                this.checked = true;
                            else if (this.type == 'radio')
                                this.checked = this.value == c[k];
                            else if (k != 'fen' || !this.value)
                                this.value = c[k];
                        });
                    });
                }
                const showRating = () => {
                    const timeMode = $timeModeSelect.val();
                    let key = 'correspondence';
                    switch ($variantSelect.val()) {
                        case '1':
                        case '3':
                            if (timeMode == '1') {
                                const time = parseFloat($timeInput.val()) * 60 + parseFloat($incrementInput.val()) * 40;
                                if (time < 30)
                                    key = 'ultraBullet';
                                else if (time < 180)
                                    key = 'bullet';
                                else if (time < 480)
                                    key = 'blitz';
                                else if (time < 1500)
                                    key = 'rapid';
                                else
                                    key = 'classical';
                            }
                            break;
                        case '10':
                            key = 'crazyhouse';
                            break;
                        case '2':
                            key = 'chess960';
                            break;
                        case '4':
                            key = 'kingOfTheHill';
                            break;
                        case '5':
                            key = 'threeCheck';
                            break;
                        case '6':
                            key = 'antichess';
                            break;
                        case '7':
                            key = 'atomic';
                            break;
                        case '8':
                            key = 'horde';
                            break;
                        case '9':
                            key = 'racingKings';
                            break;
                    }
                    const $selected = $ratings
                        .hide()
                        .filter('.' + key)
                        .show();
                    $modal.find('.ratings input').val($selected.find('strong').text());
                    save();
                };
                if (typ == 'hook') {
                    if ($form.data('anon')) {
                        $timeModeSelect
                            .val('1')
                            .children('.timeMode_2, .timeMode_0')
                            .prop('disabled', true)
                            .attr('title', this.root.trans('youNeedAnAccountToDoThat'));
                    }
                    const ajaxSubmit = (color) => {
                        const form = $form[0];
                        const rating = parseInt($modal.find('.ratings input').val()) || 1500;
                        if (form.ratingRange)
                            form.ratingRange.value = [
                                rating + parseInt(form.ratingRange_range_min.value),
                                rating + parseInt(form.ratingRange_range_max.value),
                            ].join('-');
                        save();
                        const poolMember = this.hookToPoolMember(color, form);
                        modal.close();
                        if (poolMember) {
                            this.root.enterPool(poolMember);
                        }
                        else {
                            this.root.setTab($timeModeSelect.val() === '1' ? 'real_time' : 'seeks');
                            text($form.attr('action').replace(/sri-placeholder/, lichess.sri), {
                                method: 'post',
                                body: (() => {
                                    const data = new FormData($form[0]);
                                    data.append('color', color);
                                    return data;
                                })(),
                            });
                        }
                        this.root.redraw();
                        return false;
                    };
                    $submits
                        .on('click', function () {
                        return ajaxSubmit($(this).val());
                    })
                        .prop('disabled', false);
                    $form.on('submit', () => ajaxSubmit('random'));
                }
                else
                    $form.one('submit', () => {
                        $submits.hide();
                        $form.find('.color-submits').append(lichess.spinnerHtml);
                    });
                if (this.root.opts.blindMode) {
                    $variantSelect[0].focus();
                    $timeInput.add($incrementInput).on('change', () => {
                        toggleButtons();
                        showRating();
                    });
                }
                else {
                    $timeInput.add($incrementInput).each(function () {
                        const $input = $(this), $value = $input.siblings('span'), $range = $input.siblings('.range'), isTimeSlider = $input.parent().hasClass('time_choice'), showTime = (v) => {
                            if (v == 1 / 4)
                                return '¼';
                            if (v == 1 / 2)
                                return '½';
                            if (v == 3 / 4)
                                return '¾';
                            return '' + v;
                        }, valueToTime = (v) => (isTimeSlider ? self.sliderTime : self.sliderIncrement)(v), show = (time) => $value.text(isTimeSlider ? showTime(time) : '' + time);
                        show(parseFloat($input.val()));
                        $range.attr({
                            min: '0',
                            max: '' + (isTimeSlider ? 38 : 30),
                            value: '' +
                                self.sliderInitVal(parseFloat($input.val()), isTimeSlider ? self.sliderTime : self.sliderIncrement, 100),
                        });
                        $range.on('input', () => {
                            const time = valueToTime(parseInt($range.val()));
                            show(time);
                            $input.val('' + time);
                            showRating();
                            toggleButtons();
                        });
                    });
                    $daysInput.each(function () {
                        const $input = $(this), $value = $input.siblings('span'), $range = $input.siblings('.range');
                        $value.text($input.val());
                        $range.attr({
                            min: '1',
                            max: '7',
                            value: '' + self.sliderInitVal(parseInt($input.val()), self.sliderDays, 20),
                        });
                        $range.on('input', () => {
                            const days = self.sliderDays(parseInt($range.val()));
                            $value.text('' + days);
                            $input.val('' + days);
                            save();
                        });
                    });
                    $form.find('.rating-range').each(function () {
                        const $this = $(this), $minInput = $this.find('.rating-range__min'), $maxInput = $this.find('.rating-range__max'), minStorage = self.makeStorage('lobby.ratingRange.min'), maxStorage = self.makeStorage('lobby.ratingRange.max'), update = (e) => {
                            const min = $minInput.val(), max = $maxInput.val();
                            minStorage.set(min);
                            maxStorage.set(max);
                            $this.find('.rating-min').text(`-${min.replace('-', '')}`);
                            $this.find('.rating-max').text(`+${max}`);
                            if (e)
                                save();
                        };
                        $minInput
                            .attr({
                            min: '-500',
                            max: '0',
                            step: '50',
                            value: minStorage.get() || '-500',
                        })
                            .on('input', update);
                        $maxInput
                            .attr({
                            min: '0',
                            max: '500',
                            step: '50',
                            value: maxStorage.get() || '500',
                        })
                            .on('input', update);
                        update();
                    });
                }
                $timeModeSelect
                    .on('change', function () {
                    const timeMode = $(this).val();
                    $form.find('.time_choice, .increment_choice').toggle(timeMode == '1');
                    $form.find('.days_choice').toggle(timeMode == '2');
                    toggleButtons();
                    showRating();
                })
                    .trigger('change');
                const validateFen = debounce(() => {
                    $fenInput.removeClass('success failure');
                    const fen = $fenInput.val();
                    if (fen) {
                        const [path, params] = $fenInput.parent().data('validate-url').split('?'); // Separate "strict=1" for AI match
                        text(url(path, { fen }) + (params ? `&${params}` : '')).then(data => {
                            $fenInput.addClass('success');
                            $fenPosition.find('.preview').html(data);
                            $fenPosition.find('a.board_editor').each(function () {
                                this.href = this.href.replace(/editor\/.+$/, 'editor/' + fen);
                            });
                            $submits.removeClass('nope');
                            lichess.contentLoaded();
                        }, _ => {
                            $fenInput.addClass('failure');
                            $fenPosition.find('.preview').html('');
                            $submits.addClass('nope');
                        });
                    }
                }, 200);
                $fenInput.on('keyup', validateFen);
                if (forceFromPosition)
                    $variantSelect.val('3');
                $variantSelect
                    .on('change', function () {
                    const isFen = $(this).val() == '3';
                    $fenPosition.toggle(isFen);
                    $modeChoicesWrap.toggle(!isFen);
                    if (isFen) {
                        $casual.trigger('click');
                        requestAnimationFrame(() => document.body.dispatchEvent(new Event('chessground.resize')));
                    }
                    showRating();
                    toggleButtons();
                })
                    .trigger('change');
                $modeChoices.on('change', save);
                $form.find('div.level').each(function () {
                    const $infos = $(this).find('.ai_info > div');
                    $(this)
                        .find('label')
                        .on('mouseenter', function () {
                        $infos
                            .hide()
                            .filter('.' + $(this).attr('for'))
                            .show();
                    });
                    $(this)
                        .find('#config_level')
                        .on('mouseleave', function () {
                        const level = $(this).find('input:checked').val();
                        $infos
                            .hide()
                            .filter('.sf_level_' + level)
                            .show();
                    })
                        .trigger('mouseout');
                    $(this).find('input').on('change', save);
                });
            };
            this.stores = {
                hook: makeStore(makeStorage('lobby.setup.hook')),
                friend: makeStore(makeStorage('lobby.setup.friend')),
                ai: makeStore(makeStorage('lobby.setup.ai')),
            };
        }
    }

    class LobbyController {
        constructor(opts, redraw) {
            this.opts = opts;
            this.redraw = redraw;
            this.stepHooks = [];
            this.stepping = false;
            this.redirecting = false;
            this.alreadyWatching = [];
            this.flushHooks = (now) => {
                if (this.flushHooksTimeout)
                    clearTimeout(this.flushHooksTimeout);
                if (now)
                    this.doFlushHooks();
                else {
                    this.stepping = true;
                    if (this.tab === 'real_time')
                        this.redraw();
                    setTimeout(() => {
                        this.stepping = false;
                        this.doFlushHooks();
                    }, 500);
                }
                this.flushHooksTimeout = this.flushHooksSchedule();
            };
            this.flushHooksSchedule = () => setTimeout(this.flushHooks, 8000);
            this.setTab = (tab) => {
                if (tab !== this.tab) {
                    if (tab === 'seeks')
                        seeks().then(this.setSeeks);
                    else if (tab === 'real_time')
                        this.socket.realTimeIn();
                    else if (this.tab === 'real_time') {
                        this.socket.realTimeOut();
                        this.data.hooks = [];
                    }
                    this.tab = this.stores.tab.set(tab);
                }
                this.filter.open = false;
            };
            this.setMode = (mode) => {
                this.mode = this.stores.mode.set(mode);
                this.filter.open = false;
            };
            this.setSort = (sort) => {
                this.sort = this.stores.sort.set(sort);
            };
            this.onSetFilter = () => {
                this.flushHooks(true);
                if (this.tab !== 'real_time')
                    this.redraw();
            };
            this.clickHook = (id) => {
                const hook = find$1(this, id);
                if (!hook || hook.disabled || this.stepping || this.redirecting)
                    return;
                if (hook.action === 'cancel' || variantConfirm(hook.variant))
                    this.socket.send(hook.action, hook.id);
            };
            this.clickSeek = (id) => {
                const seek = find(this, id);
                if (!seek || this.redirecting)
                    return;
                if (seek.action === 'cancelSeek' || variantConfirm(seek.variant))
                    this.socket.send(seek.action, seek.id);
            };
            this.setSeeks = (seeks) => {
                this.data.seeks = seeks;
                initAll(this);
                this.redraw();
            };
            this.clickPool = (id) => {
                if (!this.data.me) {
                    anonPoolSeek(this.pools.find(p => p.id == id));
                    this.setTab('real_time');
                }
                else if (this.poolMember && this.poolMember.id === id)
                    this.leavePool();
                else {
                    this.enterPool({ id });
                    this.redraw();
                }
            };
            this.enterPool = (member) => {
                set(member.id, member.range);
                this.setTab('pools');
                this.poolMember = member;
                this.poolIn();
            };
            this.leavePool = () => {
                if (!this.poolMember)
                    return;
                this.socket.poolOut(this.poolMember);
                this.poolMember = undefined;
                this.redraw();
            };
            this.poolIn = () => {
                if (!this.poolMember)
                    return;
                this.poolInStorage.fire();
                this.socket.poolIn(this.poolMember);
            };
            this.gameActivity = (gameId) => {
                if (this.data.nowPlaying.find(p => p.gameId === gameId))
                    nowPlaying().then(povs => {
                        this.data.nowPlaying = povs;
                        this.startWatching();
                        this.redraw();
                    });
            };
            this.setRedirecting = () => {
                this.redirecting = true;
                setTimeout(() => {
                    this.redirecting = false;
                    this.redraw();
                }, 4000);
                this.redraw();
            };
            this.awake = () => {
                switch (this.tab) {
                    case 'real_time':
                        this.data.hooks = [];
                        this.socket.realTimeIn();
                        break;
                    case 'seeks':
                        seeks().then(this.setSeeks);
                        break;
                }
            };
            this.data = opts.data;
            this.data.hooks = [];
            this.pools = opts.pools;
            this.playban = opts.playban;
            this.isBot = opts.data.me && opts.data.me.isBot;
            this.filter = new Filter(lichess.storage.make('lobby.filter'), this);
            this.setup = new Setup(lichess.storage.make, this);
            initAll$1(this);
            initAll(this);
            this.socket = new LobbySocket(opts.socketSend, this);
            this.stores = make(this.data.me ? this.data.me.username.toLowerCase() : null);
            (this.tab = this.isBot ? 'now_playing' : this.stores.tab.get()),
                (this.mode = this.stores.mode.get()),
                (this.sort = this.stores.sort.get()),
                (this.trans = opts.trans);
            this.poolInStorage = lichess.storage.make('lobby.pool-in');
            this.poolInStorage.listen(_ => {
                // when another tab joins a pool
                this.leavePool();
                redraw();
            });
            this.flushHooksSchedule();
            this.startWatching();
            if (this.playban) {
                if (this.playban.remainingSecond < 86400)
                    setTimeout(lichess.reload, this.playban.remainingSeconds * 1000);
            }
            else {
                setInterval(() => {
                    if (this.poolMember)
                        this.poolIn();
                    else if (this.tab === 'real_time' && !this.data.hooks.length)
                        this.socket.realTimeIn();
                }, 10 * 1000);
                this.joinPoolFromLocationHash();
            }
            lichess.pubsub.on('socket.open', () => {
                if (this.tab === 'real_time') {
                    this.data.hooks = [];
                    this.socket.realTimeIn();
                }
                else if (this.tab === 'pools' && this.poolMember)
                    this.poolIn();
            });
            window.addEventListener('beforeunload', () => {
                if (this.poolMember)
                    this.socket.poolOut(this.poolMember);
            });
        }
        doFlushHooks() {
            this.stepHooks = this.data.hooks.slice(0);
            if (this.tab === 'real_time')
                this.redraw();
        }
        startWatching() {
            const newIds = this.data.nowPlaying.map(p => p.gameId).filter(id => !this.alreadyWatching.includes(id));
            if (newIds.length) {
                setTimeout(() => this.socket.send('startWatching', newIds.join(' ')), 2000);
                newIds.forEach(id => this.alreadyWatching.push(id));
            }
        }
        // after click on round "new opponent" button
        // also handles onboardink link for anon users
        joinPoolFromLocationHash() {
            if (location.hash.startsWith('#pool/')) {
                const regex = /^#pool\/(\d+\+\d+)(?:\/(.+))?$/, match = regex.exec(location.hash), member = { id: match[1], blocking: match[2] }, range = get(member.id);
                if (range)
                    member.range = range;
                if (match) {
                    this.setTab('pools');
                    if (this.data.me)
                        this.enterPool(member);
                    else
                        setTimeout(() => this.clickPool(member.id), 1500);
                    history.replaceState(null, '', '/');
                }
            }
        }
    }

    function bind(eventName, f, redraw) {
        return {
            insert(vnode) {
                vnode.elm.addEventListener(eventName, e => {
                    const res = f(e);
                    if (redraw)
                        redraw();
                    return res;
                });
            },
        };
    }
    function tds(bits) {
        return bits.map(function (bit) {
            return h('td', [bit]);
        });
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
    const perfIcons = {
        Blitz: ')',
        'Racing Kings': '',
        UltraBullet: '{',
        Bullet: 'T',
        Classical: '+',
        Rapid: '#',
        'Three-check': '.',
        Antichess: '@',
        Horde: '_',
        Atomic: '>',
        Crazyhouse: '',
        Chess960: "'",
        Correspondence: ';',
        'King of the Hill': '(',
    };

    function tab(ctrl, key, active, content) {
        return h('span', {
            class: {
                active: key === active,
                glowing: key !== active && key === 'pools' && !!ctrl.poolMember,
            },
            hook: bind('mousedown', _ => ctrl.setTab(key), ctrl.redraw),
        }, content);
    }
    function renderTabs (ctrl) {
        const nbPlaying = ctrl.data.nbNowPlaying;
        const myTurnPovsNb = ctrl.data.nowPlaying.filter(p => p.isMyTurn).length;
        const active = ctrl.tab;
        return [
            ctrl.isBot ? undefined : tab(ctrl, 'pools', active, [ctrl.trans.noarg('quickPairing')]),
            ctrl.isBot ? undefined : tab(ctrl, 'real_time', active, [ctrl.trans.noarg('lobby')]),
            ctrl.isBot ? undefined : tab(ctrl, 'seeks', active, [ctrl.trans.noarg('correspondence')]),
            active === 'now_playing' || nbPlaying || ctrl.isBot
                ? tab(ctrl, 'now_playing', active, [
                    ctrl.trans.plural('nbGamesInPlay', nbPlaying >= 100 ? '100+' : nbPlaying),
                    myTurnPovsNb > 0 ? h('i.unread', myTurnPovsNb >= 9 ? '9+' : myTurnPovsNb) : null,
                ])
                : null,
        ];
    }

    function renderRange(range) {
        return h('div.range', range.replace('-', '–'));
    }
    function hooks(ctrl) {
        return bind('click', e => {
            const id = e.target.getAttribute('data-id') ||
                e.target.parentNode.getAttribute('data-id');
            if (id === 'custom')
                $('.config_hook').trigger('mousedown');
            else if (id)
                ctrl.clickPool(id);
        }, ctrl.redraw);
    }
    function render$3(ctrl) {
        const member = ctrl.poolMember;
        return ctrl.pools
            .map(pool => {
            const active = !!member && member.id === pool.id, transp = !!member && !active;
            return h('div', {
                class: {
                    active,
                    transp: !active && transp,
                },
                attrs: { 'data-id': pool.id },
            }, [
                h('div.clock', pool.lim + '+' + pool.inc),
                active && member.range ? renderRange(member.range) : h('div.perf', pool.perf),
                active ? spinner() : null,
            ]);
        })
            .concat(h('div.custom', {
            class: { transp: !!member },
            attrs: { 'data-id': 'custom' },
        }, ctrl.trans.noarg('custom')));
    }

    function renderHook$1(ctrl, hook) {
        const noarg = ctrl.trans.noarg;
        return h('tr.hook.' + hook.action, {
            key: hook.id,
            class: { disabled: hook.disabled },
            attrs: {
                title: hook.disabled ? '' : hook.action === 'join' ? noarg('joinTheGame') + ' | ' + hook.perf : noarg('cancel'),
                'data-id': hook.id,
            },
        }, tds([
            h('span.is.is2.color-icon.' + (hook.c || 'random')),
            hook.rating
                ? h('span.ulink.ulpt', {
                    attrs: { 'data-href': '/@/' + hook.u },
                }, hook.u)
                : noarg('anonymous'),
            (hook.rating ? hook.rating : '') + (hook.prov ? '?' : ''),
            hook.clock,
            h('span', {
                attrs: { 'data-icon': perfIcons[hook.perf] },
            }, noarg(hook.ra ? 'rated' : 'casual')),
        ]));
    }
    function isStandard(value) {
        return function (hook) {
            return (hook.variant === 'standard') === value;
        };
    }
    function isMine(hook) {
        return hook.action === 'cancel';
    }
    function isNotMine(hook) {
        return !isMine(hook);
    }
    function toggle$2(ctrl) {
        return h('i.toggle', {
            key: 'set-mode-chart',
            attrs: { title: ctrl.trans.noarg('graph'), 'data-icon': '9' },
            hook: bind('mousedown', _ => ctrl.setMode('chart'), ctrl.redraw),
        });
    }
    function render$2(ctrl, allHooks) {
        const mine = allHooks.find(isMine), max = mine ? 13 : 14, hooks = allHooks.slice(0, max), render = (hook) => renderHook$1(ctrl, hook), standards = hooks.filter(isNotMine).filter(isStandard(true));
        sort$2(ctrl, standards);
        const variants = hooks
            .filter(isNotMine)
            .filter(isStandard(false))
            .slice(0, Math.max(0, max - standards.length - 1));
        sort$2(ctrl, variants);
        const renderedHooks = [
            ...standards.map(render),
            variants.length
                ? h('tr.variants', {
                    key: 'variants',
                }, [
                    h('td', {
                        attrs: { colspan: 5 },
                    }, '— ' + ctrl.trans('variant') + ' —'),
                ])
                : null,
            ...variants.map(render),
        ];
        if (mine)
            renderedHooks.unshift(render(mine));
        return h('table.hooks__list', [
            h('thead', h('tr', [
                h('th'),
                h('th', ctrl.trans('player')),
                h('th', {
                    class: {
                        sortable: true,
                        sort: ctrl.sort === 'rating',
                    },
                    hook: bind('click', _ => ctrl.setSort('rating'), ctrl.redraw),
                }, [h('i.is'), ctrl.trans('rating')]),
                h('th', {
                    class: {
                        sortable: true,
                        sort: ctrl.sort === 'time',
                    },
                    hook: bind('click', _ => ctrl.setSort('time'), ctrl.redraw),
                }, [h('i.is'), ctrl.trans('time')]),
                h('th', ctrl.trans('mode')),
            ])),
            h('tbody', {
                class: { stepping: ctrl.stepping },
                hook: bind('click', e => {
                    let el = e.target;
                    do {
                        el = el.parentNode;
                        if (el.nodeName === 'TR')
                            return ctrl.clickHook(el.getAttribute('data-id'));
                    } while (el.nodeName !== 'TABLE');
                }, ctrl.redraw),
            }, renderedHooks),
        ]);
    }

    const percents = (v) => v + '%';
    const ratingLog = (a) => Math.log(a / 150 + 1);
    function ratingY(e) {
        const rating = Math.max(1000, Math.min(2200, e || 1500));
        let ratio;
        const mid = 2 / 5;
        if (rating == 1500) {
            ratio = mid;
        }
        else if (rating > 1500) {
            ratio = mid + (ratingLog(rating - 1500) / ratingLog(1300)) * 2 * mid;
        }
        else {
            ratio = mid - (ratingLog(1500 - rating) / ratingLog(500)) * mid;
        }
        return Math.round(ratio * 94);
    }
    const clockMax = 2000;
    const clockX = (dur) => {
        const durLog = (a) => Math.log((a - 30) / 200 + 1);
        return Math.round((durLog(Math.min(clockMax, dur || clockMax)) / durLog(clockMax)) * 100);
    };
    function renderPlot(ctrl, hook) {
        const bottom = Math.max(0, ratingY(hook.rating) - 2), left = Math.max(0, clockX(hook.t) - 2), klass = [hook.id, 'plot.new', hook.ra ? 'rated' : 'casual', hook.action === 'cancel' ? 'cancel' : ''].join('.');
        return h('span#' + klass, {
            key: hook.id,
            attrs: {
                'data-icon': perfIcons[hook.perf],
                style: `bottom:${percents(bottom)};left:${percents(left)}`,
            },
            hook: {
                insert(vnode) {
                    $(vnode.elm).powerTip({
                        placement: hook.rating > 1800 ? 'se' : 'ne',
                        closeDelay: 200,
                        popupId: 'hook',
                        preRender() {
                            $('#hook')
                                .html(renderHook(ctrl, hook))
                                .find('.inner-clickable')
                                .on('click', () => ctrl.clickHook(hook.id));
                        },
                    });
                    setTimeout(function () {
                        vnode.elm.classList.remove('new');
                    }, 20);
                },
                destroy(vnode) {
                    $.powerTip.destroy(vnode.elm);
                },
            },
        });
    }
    function renderHook(ctrl, hook) {
        const color = hook.c || 'random';
        let html = '<div class="inner">';
        if (hook.rating) {
            html += '<a class="opponent ulpt is color-icon ' + color + '" href="/@/' + hook.u + '">';
            html += ' ' + hook.u + ' (' + hook.rating + (hook.prov ? '?' : '') + ')';
            html += '</a>';
        }
        else {
            html += '<span class="opponent anon ' + color + '">' + ctrl.trans('anonymous') + '</span>';
        }
        html += '<div class="inner-clickable">';
        html += `<div>${hook.clock}</div>`;
        html += '<i data-icon="' + perfIcons[hook.perf] + '"> ' + ctrl.trans(hook.ra ? 'rated' : 'casual') + '</i>';
        html += '</div></div>';
        return html;
    }
    const xMarks = [1, 2, 3, 5, 7, 10, 15, 20, 30];
    function renderXAxis() {
        const tags = [];
        xMarks.forEach(v => {
            const l = clockX(v * 60);
            tags.push(h('span.x.label', {
                attrs: { style: 'left:' + percents(l - 1.5) },
            }, '' + v));
            tags.push(h('div.grid.vert', {
                attrs: { style: 'width:' + percents(l) },
            }));
        });
        return tags;
    }
    const yMarks = [1000, 1200, 1400, 1500, 1600, 1800, 2000];
    function renderYAxis() {
        const tags = [];
        yMarks.forEach(function (v) {
            const b = ratingY(v);
            tags.push(h('span.y.label', {
                attrs: { style: 'bottom:' + percents(b + 1) },
            }, '' + v));
            tags.push(h('div.grid.horiz', {
                attrs: { style: 'height:' + percents(b + 0.8) },
            }));
        });
        return tags;
    }
    function toggle$1(ctrl) {
        return h('i.toggle', {
            key: 'set-mode-list',
            attrs: { title: ctrl.trans.noarg('list'), 'data-icon': '?' },
            hook: bind('mousedown', _ => ctrl.setMode('list'), ctrl.redraw),
        });
    }
    function render$1(ctrl, hooks) {
        return h('div.hooks__chart', [
            h('div.canvas', {
                hook: bind('click', e => {
                    if (e.target.classList.contains('plot'))
                        ctrl.clickHook(e.target.id);
                }, ctrl.redraw),
            }, hooks.map(hook => renderPlot(ctrl, hook))),
            ...renderYAxis(),
            ...renderXAxis(),
        ]);
    }

    function initialize(ctrl, el) {
        var _a;
        const f = (_a = ctrl.filter.data) === null || _a === void 0 ? void 0 : _a.form, $div = $(el), $ratingRange = $div.find('.rating-range'), $rangeInput = $ratingRange.find('input[name="ratingRange"]'), $minInput = $ratingRange.find('.rating-range__min'), $maxInput = $ratingRange.find('.rating-range__max');
        if (f)
            Object.keys(f).forEach(k => {
                const input = $div.find(`input[name="${k}"]`)[0];
                if (!input)
                    return;
                if (input.type == 'checkbox')
                    input.checked = true;
                else
                    input.value = f[k];
            });
        else
            $div.find('input').prop('checked', true);
        const save = () => ctrl.filter.save($div.find('form')[0]);
        $div.find('input').on('change', save);
        $div
            .find('form')
            .on('reset', (e) => {
            e.preventDefault();
            ctrl.filter.set(null);
            ctrl.filter.open = false;
            ctrl.redraw();
        })
            .on('submit', (e) => {
            e.preventDefault();
            ctrl.filter.open = false;
            ctrl.redraw();
        });
        function changeRatingRange(e) {
            $minInput.attr('max', $maxInput.val());
            $maxInput.attr('min', $minInput.val());
            const txt = $minInput.val() + '-' + $maxInput.val();
            $rangeInput.val(txt);
            $ratingRange.siblings('.range').text(txt);
            if (e)
                save();
        }
        const rangeValues = $rangeInput.val() ? $rangeInput.val().split('-') : [];
        $minInput
            .attr({
            step: '50',
            value: rangeValues[0] || $minInput.attr('min'),
        })
            .on('input', changeRatingRange);
        $maxInput
            .attr({
            step: '50',
            value: rangeValues[1] || $maxInput.attr('max'),
        })
            .on('input', changeRatingRange);
        changeRatingRange();
    }
    function toggle(ctrl, nbFiltered) {
        const filter = ctrl.filter;
        return h('i.toggle.toggle-filter', {
            class: { gamesFiltered: nbFiltered > 0, active: filter.open },
            hook: bind('mousedown', filter.toggle, ctrl.redraw),
            attrs: {
                'data-icon': filter.open ? 'L' : '%',
                title: ctrl.trans.noarg('filterGames'),
            },
        });
    }
    const render = (ctrl) => h('div.hook__filters', {
        hook: {
            insert(vnode) {
                const el = vnode.elm;
                if (el.filterLoaded)
                    return;
                text('/setup/filter').then(html => {
                    el.innerHTML = html;
                    el.filterLoaded = true;
                    initialize(ctrl, el);
                });
            },
        },
    });

    function renderRealTime (ctrl) {
        let filterBody, body, nbFiltered, modeToggle, res;
        if (ctrl.filter.open)
            filterBody = render(ctrl);
        switch (ctrl.mode) {
            case 'chart':
                res = ctrl.filter.filter(ctrl.data.hooks);
                nbFiltered = res.hidden;
                body = filterBody || render$1(ctrl, res.visible);
                modeToggle = ctrl.filter.open ? null : toggle$1(ctrl);
                break;
            default:
                res = ctrl.filter.filter(ctrl.stepHooks);
                nbFiltered = res.hidden;
                body = filterBody || render$2(ctrl, res.visible);
                modeToggle = ctrl.filter.open ? null : toggle$2(ctrl);
        }
        const filterToggle = toggle(ctrl, nbFiltered);
        return [filterToggle, modeToggle, body];
    }

    function renderSeek(ctrl, seek) {
        const klass = seek.action === 'joinSeek' ? 'join' : 'cancel', noarg = ctrl.trans.noarg;
        return h('tr.seek.' + klass, {
            key: seek.id,
            attrs: {
                title: seek.action === 'joinSeek' ? noarg('joinTheGame') + ' - ' + seek.perf.name : noarg('cancel'),
                'data-id': seek.id,
            },
        }, tds([
            h('span.is.is2.color-icon.' + (seek.color || 'random')),
            seek.rating
                ? h('span.ulpt', {
                    attrs: { 'data-href': '/@/' + seek.username },
                }, seek.username)
                : 'Anonymous',
            seek.rating + (seek.provisional ? '?' : ''),
            seek.days ? ctrl.trans.plural('nbDays', seek.days) : '∞',
            h('span', [
                h('span.varicon', {
                    attrs: { 'data-icon': seek.perf.icon },
                }),
                noarg(seek.mode === 1 ? 'rated' : 'casual'),
            ]),
        ]));
    }
    function createSeek(ctrl) {
        if (ctrl.data.me && ctrl.data.seeks.length < 8)
            return h('div.create', [
                h('a.button', {
                    hook: bind('click', () => {
                        $('.lobby__start .config_hook')
                            .each(function () {
                            this.dataset.hrefAddon = '?time=correspondence';
                        })
                            .trigger('mousedown')
                            .trigger('click');
                    }),
                }, ctrl.trans('createAGame')),
            ]);
        return;
    }
    function renderSeeks (ctrl) {
        return [
            h('table.hooks__list', [
                h('thead', [
                    h('tr', ['', 'player', 'rating', 'time', 'mode'].map(header => h('th', ctrl.trans(header)))),
                ]),
                h('tbody', {
                    hook: bind('click', e => {
                        let el = e.target;
                        do {
                            el = el.parentNode;
                            if (el.nodeName === 'TR') {
                                if (!ctrl.data.me) {
                                    if (confirm(ctrl.trans('youNeedAnAccountToDoThat')))
                                        location.href = '/signup';
                                    return;
                                }
                                return ctrl.clickSeek(el.getAttribute('data-id'));
                            }
                        } while (el.nodeName !== 'TABLE');
                    }),
                }, ctrl.data.seeks.map(s => renderSeek(ctrl, s))),
            ]),
            createSeek(ctrl),
        ];
    }

    function timer(pov) {
        const date = Date.now() + pov.secondsLeft * 1000;
        return h('time.timeago', {
            hook: {
                insert(vnode) {
                    vnode.elm.setAttribute('datetime', '' + date);
                },
            },
        }, lichess.timeago(date));
    }
    function renderPlaying (ctrl) {
        return h('div.now-playing', ctrl.data.nowPlaying.map(pov => h('a.' + pov.variant.key, {
            key: `${pov.gameId}${pov.lastMove}`,
            attrs: { href: '/' + pov.fullId },
        }, [
            h('span.mini-board.cg-wrap.is2d', {
                attrs: {
                    'data-state': `${pov.fen},${pov.color},${pov.lastMove}`,
                },
                hook: {
                    insert(vnode) {
                        lichess.miniBoard.init(vnode.elm);
                    },
                },
            }),
            h('span.meta', [
                pov.opponent.ai ? ctrl.trans('aiNameLevelAiLevel', 'Stockfish', pov.opponent.ai) : pov.opponent.username,
                h('span.indicator', pov.isMyTurn
                    ? pov.secondsLeft && pov.hasMoved
                        ? timer(pov)
                        : [ctrl.trans.noarg('yourTurn')]
                    : h('span', '\xa0')), // &nbsp;
            ]),
        ])));
    }

    function view (ctrl) {
        let body, data = {};
        if (ctrl.redirecting)
            body = spinner();
        else
            switch (ctrl.tab) {
                case 'pools':
                    body = render$3(ctrl);
                    data = { hook: hooks(ctrl) };
                    break;
                case 'real_time':
                    body = renderRealTime(ctrl);
                    break;
                case 'seeks':
                    body = renderSeeks(ctrl);
                    break;
                case 'now_playing':
                    body = renderPlaying(ctrl);
                    break;
            }
        return h('div.lobby__app.lobby__app-' + ctrl.tab, [
            h('div.tabs-horiz', renderTabs(ctrl)),
            h('div.lobby__app__content.l' + (ctrl.redirecting ? 'redir' : ctrl.tab), data, body),
        ]);
    }

    const patch = init$1([classModule, attributesModule]);
    function main(opts) {
        const ctrl = new LobbyController(opts, redraw);
        const blueprint = view(ctrl);
        opts.element.innerHTML = '';
        let vnode = patch(opts.element, blueprint);
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        return {
            socketReceive: ctrl.socket.receive,
            setTab(tab) {
                ctrl.setTab(tab);
                ctrl.redraw();
            },
            gameActivity: ctrl.gameActivity,
            setRedirecting: ctrl.setRedirecting,
            enterPool: ctrl.enterPool,
            leavePool: ctrl.leavePool,
            setup: ctrl.setup,
            redraw: ctrl.redraw,
        };
    }
    // that's for the rest of lichess to access chessground
    // without having to include it a second time
    window.Chessground = Chessground;

    let numberFormatter = false;
    const numberFormat = (n) => {
        if (numberFormatter === false)
            numberFormatter = window.Intl && Intl.NumberFormat ? new Intl.NumberFormat() : null;
        if (numberFormatter === null)
            return '' + n;
        return numberFormatter.format(n);
    };

    function LichessLobby(opts) {
        opts.element = document.querySelector('.lobby__app');
        opts.pools = [
            // mirrors modules/pool/src/main/PoolList.scala
            { id: '1+0', lim: 1, inc: 0, perf: 'Bullet' },
            { id: '2+1', lim: 2, inc: 1, perf: 'Bullet' },
            { id: '3+0', lim: 3, inc: 0, perf: 'Blitz' },
            { id: '3+2', lim: 3, inc: 2, perf: 'Blitz' },
            { id: '5+0', lim: 5, inc: 0, perf: 'Blitz' },
            { id: '5+3', lim: 5, inc: 3, perf: 'Blitz' },
            { id: '10+0', lim: 10, inc: 0, perf: 'Rapid' },
            { id: '10+5', lim: 10, inc: 5, perf: 'Rapid' },
            { id: '15+10', lim: 15, inc: 10, perf: 'Rapid' },
            { id: '30+0', lim: 30, inc: 0, perf: 'Classical' },
            { id: '30+20', lim: 30, inc: 20, perf: 'Classical' },
        ];
        const nbRoundSpread = spreadNumber('#nb_games_in_play > strong', 8), nbUserSpread = spreadNumber('#nb_connected_players > strong', 10), getParameterByName = (name) => {
            const match = RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        };
        lichess.socket = new lichess.StrongSocket('/lobby/socket/v5', false, {
            receive(t, d) {
                lobby.socketReceive(t, d);
            },
            events: {
                n(_, msg) {
                    nbUserSpread(msg.d);
                    setTimeout(() => nbRoundSpread(msg.r), lichess.socket.pingInterval() / 2);
                },
                reload_timeline() {
                    text('/timeline').then(html => {
                        $('.timeline').html(html);
                        lichess.contentLoaded();
                    });
                },
                featured(o) {
                    $('.lobby__tv').html(o.html);
                    lichess.contentLoaded();
                },
                redirect(e) {
                    lobby.leavePool();
                    lobby.setRedirecting();
                    lichess.redirect(e);
                },
                fen(e) {
                    lobby.gameActivity(e.id);
                },
            },
        });
        lichess.StrongSocket.firstConnect.then(() => {
            var _a;
            const gameId = getParameterByName('hook_like');
            if (!gameId)
                return;
            const ratingRange = (_a = lobby.setup.stores.hook.get()) === null || _a === void 0 ? void 0 : _a.ratingRange;
            text(`/setup/hook/${lichess.sri}/like/${gameId}?rr=${ratingRange || ''}`, { method: 'post' });
            lobby.setTab('real_time');
            history.replaceState(null, '', '/');
        });
        opts.blindMode = $('body').hasClass('blind-mode');
        opts.trans = lichess.trans(opts.i18n);
        opts.socketSend = lichess.socket.send;
        const lobby = main(opts);
        const $startButtons = $('.lobby__start'), clickEvent = opts.blindMode ? 'click' : 'mousedown';
        $startButtons
            .find('a:not(.disabled)')
            .on(clickEvent, function () {
            $(this).addClass('active').siblings().removeClass('active');
            lichess.loadCssPath('lobby.setup');
            lobby.leavePool();
            let url = this.href;
            if (this.dataset.hrefAddon) {
                url += this.dataset.hrefAddon;
                delete this.dataset.hrefAddon;
            }
            fetch(url, Object.assign(Object.assign({}, defaultInit), { headers: xhrHeader })).then(res => res.text().then(text => {
                if (res.ok) {
                    lobby.setup.prepareForm(modal($(text), 'game-setup', () => $startButtons.find('.active').removeClass('active')));
                    lichess.contentLoaded();
                }
                else {
                    alert(text);
                    lichess.reload();
                }
            }));
        })
            .on('click', e => e.preventDefault());
        if (['#ai', '#friend', '#hook'].includes(location.hash)) {
            $startButtons
                .find('.config_' + location.hash.replace('#', ''))
                .each(function () {
                this.dataset.hrefAddon = location.search;
            })
                .trigger(clickEvent);
            if (location.hash === '#hook') {
                if (/time=realTime/.test(location.search))
                    lobby.setTab('real_time');
                else if (/time=correspondence/.test(location.search))
                    lobby.setTab('seeks');
            }
            history.replaceState(null, '', '/');
        }
        suggestBgSwitch();
    }
    function suggestBgSwitch() {
        const m = window.matchMedia('(prefers-color-scheme: dark)');
        if (m.media == 'not all')
            return;
        const current = document.body.getAttribute('data-theme');
        if (m.matches == (current == 'dark'))
            return;
        let dasher;
        const getDasher = () => {
            dasher =
                dasher ||
                    lichess.loadModule('dasher').then(() => window.LichessDasher(document.createElement('div'), { playing: false }));
            return dasher;
        };
        $('.bg-switch')
            .addClass('active')
            .on('click', () => getDasher().then(dasher => dasher.subs.background.set(document.body.classList.contains('dark') ? 'light' : 'dark')));
    }
    function spreadNumber(selector, nbSteps) {
        const el = document.querySelector(selector);
        let previous = parseInt(el.getAttribute('data-count'));
        const display = (prev, cur, it) => {
            el.textContent = numberFormat(Math.round((prev * (nbSteps - 1 - it) + cur * (it + 1)) / nbSteps));
        };
        let timeouts = [];
        return (nb, overrideNbSteps) => {
            if (!el || (!nb && nb !== 0))
                return;
            if (overrideNbSteps)
                nbSteps = Math.abs(overrideNbSteps);
            timeouts.forEach(clearTimeout);
            timeouts = [];
            const interv = Math.abs(lichess.socket.pingInterval() / nbSteps);
            const prev = previous || nb;
            previous = nb;
            for (let i = 0; i < nbSteps; i++)
                timeouts.push(setTimeout(() => display(prev, nb, i), Math.round(i * interv)));
        };
    }

    return LichessLobby;

}());
