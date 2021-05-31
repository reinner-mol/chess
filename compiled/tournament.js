var LichessTournament = (function () {
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
        return state.animation.enabled ? animate(mutation, state) : render$1(mutation, state);
    }
    function render$1(mutation, state) {
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
    function end$2(state) {
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
    function end$1(s, e) {
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
                (config.fen ? anim : render$1)(state => configure(state, config), state);
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
                render$1(unsetPremove, state);
            },
            cancelPredrop() {
                render$1(unsetPredrop, state);
            },
            cancelMove() {
                render$1(state => {
                    cancelMove(state);
                    cancel(state);
                }, state);
            },
            stop() {
                render$1(state => {
                    stop(state);
                    cancel(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$1(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$1(state => (state.drawable.shapes = shapes), state);
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
            const onend = dragOrDraw(s, end$1, end$2);
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
    function render(s) {
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
                render(state);
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
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
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

    function makeSocket (send, ctrl) {
        const handlers = {
            reload() {
                setTimeout(ctrl.askReload, Math.floor(Math.random() * 4000));
            },
            redirect(fullId) {
                ctrl.redirectFirst(fullId.slice(0, 8), true);
                return true; // prevent default redirect
            },
        };
        return {
            send,
            receive(type, data) {
                if (handlers[type])
                    return handlers[type](data);
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

    // when the tournament no longer exists
    const onFail = () => lichess.reload();
    const join$1 = throttle(1000, (ctrl, password, team) => textRaw('/tournament/' + ctrl.data.id + '/join', {
        method: 'POST',
        body: JSON.stringify({
            p: password || null,
            team: team || null,
        }),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => {
        if (!res.ok)
            res.text().then(t => {
                if (t.startsWith('<!DOCTYPE html>'))
                    lichess.reload();
                else
                    alert(t);
            });
    }));
    const withdraw$1 = throttle(1000, (ctrl) => text('/tournament/' + ctrl.data.id + '/withdraw', {
        method: 'POST',
    })
        .catch(onFail));
    const loadPage = throttle(1000, (ctrl, p) => json(`/tournament/${ctrl.data.id}/standing/${p}`).then(data => {
        ctrl.loadPage(data);
        ctrl.redraw();
    }, onFail));
    const loadPageOf = (ctrl, userId) => json(`/tournament/${ctrl.data.id}/page-of/${userId}`);
    const reloadNow = (ctrl) => json(url('/tournament/' + ctrl.data.id, {
        page: ctrl.focusOnMe ? undefined : ctrl.page,
        playerInfo: ctrl.playerInfo.id,
        partial: true,
    }))
        .then(data => {
        ctrl.reload(data);
        ctrl.redraw();
    }, onFail);
    const reloadSoon = throttle(4000, reloadNow);
    const playerInfo$1 = (ctrl, userId) => json(`/tournament/${ctrl.data.id}/player/${userId}`).then(data => {
        ctrl.setPlayerInfoData(data);
        ctrl.redraw();
    }, onFail);
    const teamInfo$1 = (ctrl, teamId) => json(`/tournament/${ctrl.data.id}/team/${teamId}`).then(data => {
        ctrl.setTeamInfo(data);
        ctrl.redraw();
    }, onFail);

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
            insert(vnode) {
                f(vnode.elm);
            },
        };
    }
    function dataIcon(icon) {
        return {
            'data-icon': icon,
        };
    }
    function ratio2percent(r) {
        return Math.round(100 * r) + '%';
    }
    function playerName(p) {
        return p.title ? [h('span.utitle', p.title), ' ' + p.name] : p.name;
    }
    function player(p, asLink, withRating, defender = false, leader = false) {
        return h('a.ulpt.user-link' + (((p.title || '') + p.name).length > 15 ? '.long' : ''), {
            attrs: asLink || 'ontouchstart' in window ? { href: '/@/' + p.name } : { 'data-href': '/@/' + p.name },
            hook: {
                destroy: vnode => $.powerTip.destroy(vnode.elm),
            },
        }, [
            h('span.name' + (defender ? '.defender' : leader ? '.leader' : ''), defender ? { attrs: dataIcon('5') } : leader ? { attrs: dataIcon('8') } : {}, playerName(p)),
            withRating ? h('span.rating', ' ' + p.rating + (p.provisional ? '?' : '')) : null,
        ]);
    }
    function numberRow(name, value, typ) {
        return h('tr', [
            h('th', name),
            h('td', typ === 'raw'
                ? value
                : typ === 'percent'
                    ? value[1] > 0
                        ? ratio2percent(value[0] / value[1])
                        : 0
                    : numberFormat(value)),
        ]);
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

    function button$1(ctrl) {
        return h('button.fbt', {
            class: { active: ctrl.searching },
            attrs: {
                'data-icon': ctrl.searching ? 'L' : 'y',
                title: 'Search tournament players',
            },
            hook: bind('click', ctrl.toggleSearch, ctrl.redraw),
        });
    }
    function input(ctrl) {
        return h('div.search', h('input', {
            hook: onInsert((el) => lichess.userComplete().then(uac => {
                uac({
                    input: el,
                    tour: ctrl.data.id,
                    tag: 'span',
                    focus: true,
                    onSelect(v) {
                        ctrl.jumpToPageOf(v.id);
                        ctrl.redraw();
                    },
                });
                el.focus();
            })),
        }));
    }

    const maxPerPage = 10;
    function button(text, icon, click, enable, ctrl) {
        return h('button.fbt.is', {
            attrs: {
                'data-icon': icon,
                disabled: !enable,
                title: text,
            },
            hook: bind('mousedown', click, ctrl.redraw),
        });
    }
    function scrollToMeButton(ctrl) {
        if (ctrl.data.me)
            return h('button.fbt' + (ctrl.focusOnMe ? '.active' : ''), {
                attrs: {
                    'data-icon': '7',
                    title: 'Scroll to your player',
                },
                hook: bind('mousedown', ctrl.toggleFocusOnMe, ctrl.redraw),
            });
    }
    function renderPager(ctrl, pag) {
        const enabled = !!pag.currentPageResults, page = ctrl.page;
        return pag.nbPages > -1
            ? [
                button$1(ctrl),
                ...(ctrl.searching
                    ? [input(ctrl)]
                    : [
                        button('First', 'W', () => ctrl.userSetPage(1), enabled && page > 1, ctrl),
                        button('Prev', 'Y', ctrl.userPrevPage, enabled && page > 1, ctrl),
                        h('span.page', (pag.nbResults ? pag.from + 1 : 0) + '-' + pag.to + ' / ' + pag.nbResults),
                        button('Next', 'X', ctrl.userNextPage, enabled && page < pag.nbPages, ctrl),
                        button('Last', 'V', ctrl.userLastPage, enabled && page < pag.nbPages, ctrl),
                        scrollToMeButton(ctrl),
                    ]),
            ]
            : [];
    }
    function players(ctrl) {
        const page = ctrl.page, nbResults = ctrl.data.nbPlayers, from = (page - 1) * maxPerPage, to = Math.min(nbResults, page * maxPerPage);
        return {
            currentPage: page,
            maxPerPage,
            from,
            to,
            currentPageResults: ctrl.pages[page],
            nbResults,
            nbPages: Math.ceil(nbResults / maxPerPage),
        };
    }
    function myPage(ctrl) {
        if (ctrl.data.me)
            return Math.floor((ctrl.data.me.rank - 1) / 10) + 1;
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

    let countDownTimeout;
    function doCountDown(targetTime) {
        let started = false;
        return function curCounter() {
            const secondsToStart = (targetTime - performance.now()) / 1000;
            // always play the 0 sound before completing.
            const bestTick = Math.max(0, Math.round(secondsToStart));
            if (bestTick <= 10)
                lichess.sound.play('countDown' + bestTick);
            if (bestTick > 0) {
                const nextTick = Math.min(10, bestTick - 1);
                countDownTimeout = setTimeout(curCounter, 1000 * Math.min(1.1, Math.max(0.8, secondsToStart - nextTick)));
            }
            if (!started && bestTick <= 10) {
                started = true;
                notify$1('The tournament is starting!');
            }
        };
    }
    function end(data) {
        if (data.me && data.isRecentlyFinished && lichess.once('tournament.end.sound.' + data.id)) {
            let key = 'Other';
            if (data.me.rank < 4)
                key = '1st';
            else if (data.me.rank < 11)
                key = '2nd';
            else if (data.me.rank < 21)
                key = '3rd';
            lichess.sound.play('tournament' + key);
        }
    }
    function countDown(data) {
        if (!data.me || !data.secondsToStart) {
            if (countDownTimeout)
                clearTimeout(countDownTimeout);
            countDownTimeout = undefined;
            return;
        }
        if (countDownTimeout)
            return;
        if (data.secondsToStart > 60 * 60 * 24)
            return;
        countDownTimeout = setTimeout(doCountDown(performance.now() + 1000 * data.secondsToStart - 100), 900); // wait 900ms before starting countdown.
        // Preload countdown sounds.
        for (let i = 10; i >= 0; i--) {
            const s = 'countDown' + i;
            lichess.sound.loadStandard(s);
        }
    }

    function isIn(ctrl) {
        return ctrl.data.me && !ctrl.data.me.withdraw;
    }
    function willBePaired(ctrl) {
        return isIn(ctrl) && !ctrl.data.pairingsClosed;
    }

    class TournamentController {
        constructor(opts, redraw) {
            this.pages = {};
            this.joinSpinner = false;
            this.playerInfo = {};
            this.teamInfo = {};
            this.disableClicks = true;
            this.searching = false;
            this.joinWithTeamSelector = false;
            this.lastStorage = lichess.storage.make('last-redirect');
            this.askReload = () => {
                if (this.joinSpinner)
                    reloadNow(this);
                else
                    reloadSoon(this);
            };
            this.reload = (data) => {
                // we joined a private tournament! Reload the page to load the chat
                if (!this.data.me && data.me && this.data['private'])
                    lichess.reload();
                this.data = Object.assign(Object.assign({}, this.data), data);
                this.data.me = data.me; // to account for removal on withdraw
                if (data.playerInfo && data.playerInfo.player.id === this.playerInfo.id)
                    this.playerInfo.data = data.playerInfo;
                this.loadPage(data.standing);
                if (this.focusOnMe)
                    this.scrollToMe();
                end(data);
                countDown(data);
                this.joinSpinner = false;
                this.recountTeams();
                this.redirectToMyGame();
            };
            this.myGameId = () => { var _a; return (_a = this.data.me) === null || _a === void 0 ? void 0 : _a.gameId; };
            this.redirectFirst = (gameId, rightNow) => {
                const delay = rightNow || document.hasFocus() ? 10 : 1000 + Math.random() * 500;
                setTimeout(() => {
                    if (this.lastStorage.get() !== gameId) {
                        this.lastStorage.set(gameId);
                        lichess.redirect('/' + gameId);
                    }
                }, delay);
            };
            this.loadPage = (data) => {
                if (!data.failed || !this.pages[data.page])
                    this.pages[data.page] = data.players;
            };
            this.setPage = (page) => {
                this.page = page;
                loadPage(this, page);
            };
            this.jumpToPageOf = (name) => {
                const userId = name.toLowerCase();
                loadPageOf(this, userId).then(data => {
                    this.loadPage(data);
                    this.page = data.page;
                    this.searching = false;
                    this.focusOnMe = false;
                    this.pages[this.page].filter(p => p.name.toLowerCase() == userId).forEach(this.showPlayerInfo);
                    this.redraw();
                });
            };
            this.userSetPage = (page) => {
                this.focusOnMe = false;
                this.setPage(page);
            };
            this.userNextPage = () => this.userSetPage(this.page + 1);
            this.userPrevPage = () => this.userSetPage(this.page - 1);
            this.userLastPage = () => this.userSetPage(players(this).nbPages);
            this.withdraw = () => {
                withdraw$1(this);
                this.joinSpinner = true;
                this.focusOnMe = false;
            };
            this.join = (team) => {
                this.joinWithTeamSelector = false;
                if (!this.data.verdicts.accepted)
                    return this.data.verdicts.list.forEach(v => {
                        if (v.verdict !== 'ok')
                            alert(v.verdict);
                    });
                if (this.data.teamBattle && !team && !this.data.me) {
                    this.joinWithTeamSelector = true;
                }
                else {
                    let password;
                    if (this.data.private && !this.data.me) {
                        password = prompt(this.trans.noarg('password'));
                        if (password === null) {
                            return;
                        }
                    }
                    join$1(this, password, team);
                    this.joinSpinner = true;
                    this.focusOnMe = true;
                }
            };
            this.scrollToMe = () => {
                const page = myPage(this);
                if (page && page !== this.page)
                    this.setPage(page);
            };
            this.toggleFocusOnMe = () => {
                if (!this.data.me)
                    return;
                this.focusOnMe = !this.focusOnMe;
                if (this.focusOnMe)
                    this.scrollToMe();
            };
            this.showPlayerInfo = player => {
                if (this.data.secondsToStart)
                    return;
                const userId = player.name.toLowerCase();
                this.teamInfo.requested = undefined;
                this.playerInfo = {
                    id: this.playerInfo.id === userId ? null : userId,
                    player: player,
                    data: null,
                };
                if (this.playerInfo.id)
                    playerInfo$1(this, this.playerInfo.id);
            };
            this.setPlayerInfoData = data => {
                if (data.player.id === this.playerInfo.id)
                    this.playerInfo.data = data;
            };
            this.showTeamInfo = (teamId) => {
                this.playerInfo.id = undefined;
                this.teamInfo = {
                    requested: this.teamInfo.requested === teamId ? undefined : teamId,
                    loaded: undefined,
                };
                if (this.teamInfo.requested)
                    teamInfo$1(this, this.teamInfo.requested);
            };
            this.setTeamInfo = (teamInfo) => {
                if (teamInfo.id === this.teamInfo.requested)
                    this.teamInfo.loaded = teamInfo;
            };
            this.toggleSearch = () => (this.searching = !this.searching);
            this.opts = opts;
            this.data = opts.data;
            this.redraw = redraw;
            this.trans = lichess.trans(opts.i18n);
            this.socket = makeSocket(opts.socketSend, this);
            this.page = this.data.standing.page;
            this.focusOnMe = isIn(this);
            setTimeout(() => (this.disableClicks = false), 1500);
            this.loadPage(this.data.standing);
            this.scrollToMe();
            end(this.data);
            countDown(this.data);
            this.recountTeams();
            this.redirectToMyGame();
        }
        recountTeams() {
            if (this.data.teamBattle)
                this.data.teamBattle.hasMoreThanTenTeams = Object.keys(this.data.teamBattle.teams).length > 10;
        }
        redirectToMyGame() {
            const gameId = this.myGameId();
            if (gameId)
                this.redirectFirst(gameId);
        }
    }

    function joinWithTeamSelector(ctrl) {
        const onClose = () => {
            ctrl.joinWithTeamSelector = false;
            ctrl.redraw();
        };
        const tb = ctrl.data.teamBattle;
        return h('div#modal-overlay', {
            hook: bind('click', onClose),
        }, [
            h('div#modal-wrap.team-battle__choice', {
                hook: onInsert(el => {
                    el.addEventListener('click', e => e.stopPropagation());
                }),
            }, [
                h('span.close', {
                    attrs: { 'data-icon': 'L' },
                    hook: bind('click', onClose),
                }),
                h('div.team-picker', [
                    h('h2', 'Pick your team'),
                    h('br'),
                    ...(tb.joinWith.length
                        ? [
                            h('p', 'Which team will you represent in this battle?'),
                            ...tb.joinWith.map(id => h('a.button', {
                                hook: bind('click', () => ctrl.join(id), ctrl.redraw),
                            }, tb.teams[id])),
                        ]
                        : [
                            h('p', 'You must join one of these teams to participate!'),
                            h('ul', shuffleArray(Object.keys(tb.teams)).map((t) => h('li', h('a', {
                                attrs: { href: '/team/' + t },
                            }, tb.teams[t])))),
                        ]),
                ]),
            ]),
        ]);
    }
    function teamStanding(ctrl, klass) {
        const battle = ctrl.data.teamBattle, standing = ctrl.data.teamStanding, bigBattle = battle && Object.keys(battle.teams).length > 10;
        return battle && standing
            ? h('table.slist.tour__team-standing' + (klass ? '.' + klass : ''), [
                h('tbody', [
                    ...standing.map(rt => teamTr(ctrl, battle, rt)),
                    ...(bigBattle ? [extraTeams(ctrl), myTeam(ctrl, battle)] : []),
                ]),
            ])
            : null;
    }
    function extraTeams(ctrl) {
        return h('tr', h('td.more-teams', {
            attrs: { colspan: 4 },
        }, h('a', {
            attrs: {
                href: `/tournament/${ctrl.data.id}/teams`,
            },
        }, ctrl.trans('viewAllXTeams', Object.keys(ctrl.data.teamBattle.teams).length))));
    }
    function myTeam(ctrl, battle) {
        const team = ctrl.data.myTeam;
        return team && team.rank > 10 ? teamTr(ctrl, battle, team) : undefined;
    }
    function teamName(battle, teamId) {
        return h(battle.hasMoreThanTenTeams ? 'team' : 'team.ttc-' + Object.keys(battle.teams).indexOf(teamId), battle.teams[teamId]);
    }
    function teamTr(ctrl, battle, team) {
        const players = [];
        team.players.forEach((p, i) => {
            if (i > 0)
                players.push('+');
            players.push(h('score.ulpt.user-link', {
                key: p.user.name,
                class: { top: i === 0 },
                attrs: {
                    'data-href': '/@/' + p.user.name,
                    'data-name': p.user.name,
                },
                hook: Object.assign({ destroy: vnode => $.powerTip.destroy(vnode.elm) }, bind('click', _ => ctrl.jumpToPageOf(p.user.name), ctrl.redraw)),
            }, [...(i === 0 ? [h('username', playerName(p.user)), ' '] : []), '' + p.score]));
        });
        return h('tr', {
            key: team.id,
            class: {
                active: ctrl.teamInfo.requested == team.id,
            },
            hook: bind('click', _ => ctrl.showTeamInfo(team.id), ctrl.redraw),
        }, [
            h('td.rank', '' + team.rank),
            h('td.team', [teamName(battle, team.id)]),
            h('td.players', players),
            h('td.total', [h('strong', '' + team.score)]),
        ]);
    }
    /* Randomize array element order in-place. Using Durstenfeld shuffle algorithm. */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function orJoinSpinner(ctrl, f) {
        return ctrl.joinSpinner ? spinner() : f();
    }
    function withdraw(ctrl) {
        return orJoinSpinner(ctrl, () => {
            const pause = ctrl.data.isStarted;
            return h('button.fbt.text', {
                attrs: dataIcon(pause ? 'Z' : 'b'),
                hook: bind('click', ctrl.withdraw, ctrl.redraw),
            }, ctrl.trans.noarg(pause ? 'pause' : 'withdraw'));
        });
    }
    function join(ctrl) {
        return orJoinSpinner(ctrl, () => {
            const delay = ctrl.data.me && ctrl.data.me.pauseDelay;
            const joinable = ctrl.data.verdicts.accepted && !delay;
            const button = h('button.fbt.text' + (joinable ? '.highlight' : ''), {
                attrs: {
                    disabled: !joinable,
                    'data-icon': 'G',
                },
                hook: bind('click', _ => ctrl.join(), ctrl.redraw),
            }, ctrl.trans.noarg('join'));
            return delay
                ? h('div.delay-wrap', {
                    attrs: { title: 'Waiting to be able to re-join the tournament' },
                }, [
                    h('div.delay', {
                        hook: {
                            insert(vnode) {
                                const el = vnode.elm;
                                el.style.animation = `tour-delay ${delay}s linear`;
                                setTimeout(() => {
                                    if (delay === ctrl.data.me.pauseDelay) {
                                        ctrl.data.me.pauseDelay = 0;
                                        ctrl.redraw();
                                    }
                                }, delay * 1000);
                            },
                        },
                    }, [button]),
                ])
                : button;
        });
    }
    function joinWithdraw(ctrl) {
        if (!ctrl.opts.userId)
            return h('a.fbt.text.highlight', {
                attrs: {
                    href: '/login?referrer=' + window.location.pathname,
                    'data-icon': 'G',
                },
            }, ctrl.trans('signIn'));
        if (!ctrl.data.isFinished)
            return isIn(ctrl) ? withdraw(ctrl) : join(ctrl);
    }

    const scoreTagNames = ['score', 'streak', 'double'];
    function scoreTag(s) {
        return h(scoreTagNames[(s[1] || 1) - 1], [Array.isArray(s) ? s[0] : s]);
    }
    function playerTr(ctrl, player$1) {
        const userId = player$1.name.toLowerCase(), nbScores = player$1.sheet.scores.length;
        const battle = ctrl.data.teamBattle;
        return h('tr', {
            key: userId,
            class: {
                me: ctrl.opts.userId === userId,
                long: nbScores > 35,
                xlong: nbScores > 80,
                active: ctrl.playerInfo.id === userId,
            },
            hook: bind('click', _ => ctrl.showPlayerInfo(player$1), ctrl.redraw),
        }, [
            h('td.rank', player$1.withdraw
                ? h('i', {
                    attrs: {
                        'data-icon': 'Z',
                        title: ctrl.trans.noarg('pause'),
                    },
                })
                : player$1.rank),
            h('td.player', [
                player(player$1, false, true, userId === ctrl.data.defender),
                ...(battle && player$1.team ? [' ', teamName(battle, player$1.team)] : []),
            ]),
            h('td.sheet', player$1.sheet.scores.map(scoreTag)),
            h('td.total', [
                player$1.sheet.fire && !ctrl.data.isFinished
                    ? h('strong.is-gold', { attrs: dataIcon('Q') }, player$1.sheet.total)
                    : h('strong', player$1.sheet.total),
            ]),
        ]);
    }
    function podiumUsername(p) {
        return h('a.text.ulpt.user-link', {
            attrs: { href: '/@/' + p.name },
        }, playerName(p));
    }
    function podiumStats(p, berserkable, trans) {
        const noarg = trans.noarg, nb = p.nb;
        return h('table.stats', [
            p.performance ? h('tr', [h('th', noarg('performance')), h('td', p.performance)]) : null,
            h('tr', [h('th', noarg('gamesPlayed')), h('td', nb.game)]),
            ...(nb.game
                ? [
                    h('tr', [h('th', noarg('winRate')), h('td', ratio2percent(nb.win / nb.game))]),
                    berserkable ? h('tr', [h('th', noarg('berserkRate')), h('td', ratio2percent(nb.berserk / nb.game))]) : null,
                ]
                : []),
        ]);
    }
    function podiumPosition(p, pos, berserkable, trans) {
        if (p)
            return h('div.' + pos, [h('div.trophy'), podiumUsername(p), podiumStats(p, berserkable, trans)]);
    }
    let lastBody;
    function podium(ctrl) {
        const p = ctrl.data.podium || [];
        return h('div.podium', [
            podiumPosition(p[1], 'second', ctrl.data.berserkable, ctrl.trans),
            podiumPosition(p[0], 'first', ctrl.data.berserkable, ctrl.trans),
            podiumPosition(p[2], 'third', ctrl.data.berserkable, ctrl.trans),
        ]);
    }
    function preloadUserTips(el) {
        lichess.powertip.manualUserIn(el);
    }
    function controls(ctrl, pag) {
        return h('div.tour__controls', [h('div.pager', renderPager(ctrl, pag)), joinWithdraw(ctrl)]);
    }
    function standing(ctrl, pag, klass) {
        const tableBody = pag.currentPageResults ? pag.currentPageResults.map(res => playerTr(ctrl, res)) : lastBody;
        if (pag.currentPageResults)
            lastBody = tableBody;
        return h('table.slist.tour__standing' + (klass ? '.' + klass : ''), {
            class: { loading: !pag.currentPageResults },
        }, [
            h('tbody', {
                hook: {
                    insert: vnode => preloadUserTips(vnode.elm),
                    update(_, vnode) {
                        preloadUserTips(vnode.elm);
                    },
                },
            }, tableBody),
        ]);
    }

    function teamInfo (ctrl) {
        var _a, _b;
        const battle = ctrl.data.teamBattle, data = ctrl.teamInfo.loaded, noarg = ctrl.trans.noarg;
        if (!battle)
            return undefined;
        const teamTag = ctrl.teamInfo.requested ? teamName(battle, ctrl.teamInfo.requested) : null;
        const tag = 'div.tour__team-info.tour__actor-info';
        if (!data || data.id !== ctrl.teamInfo.requested)
            return h(tag, [h('div.stats', [h('h2', [teamTag]), spinner()])]);
        const nbLeaders = ((_b = (_a = ctrl.data.teamStanding) === null || _a === void 0 ? void 0 : _a.find(s => s.id == data.id)) === null || _b === void 0 ? void 0 : _b.players.length) || 0;
        const setup = (vnode) => {
            lichess.powertip.manualUserIn(vnode.elm);
        };
        return h(tag, {
            hook: {
                insert: setup,
                postpatch(_, vnode) {
                    setup(vnode);
                },
            },
        }, [
            h('a.close', {
                attrs: dataIcon('L'),
                hook: bind('click', () => ctrl.showTeamInfo(data.id), ctrl.redraw),
            }),
            h('div.stats', [
                h('h2', [teamTag]),
                h('table', [
                    numberRow('Players', data.nbPlayers),
                    ...(data.rating
                        ? [
                            numberRow(noarg('averageElo'), data.rating, 'raw'),
                            ...(data.perf
                                ? [numberRow('Average performance', data.perf, 'raw'), numberRow('Average score', data.score, 'raw')]
                                : []),
                        ]
                        : []),
                    h('tr', h('th', h('a', {
                        attrs: { href: '/team/' + data.id },
                    }, 'Team page'))),
                ]),
            ]),
            h('div', [
                h('table.players.sublist', data.topPlayers.map((p, i) => h('tr', {
                    key: p.name,
                    hook: bind('click', () => ctrl.jumpToPageOf(p.name)),
                }, [
                    h('th', '' + (i + 1)),
                    h('td', player(p, false, true, false, i < nbLeaders)),
                    h('td.total', [
                        p.fire && !ctrl.data.isFinished
                            ? h('strong.is-gold', { attrs: dataIcon('Q') }, '' + p.score)
                            : h('strong', '' + p.score),
                    ]),
                ]))),
            ]),
        ]);
    }

    function startClock(time) {
        return {
            insert: vnode => $(vnode.elm).clock({ time }),
        };
    }
    const oneDayInSeconds = 60 * 60 * 24;
    function hasFreq(freq, d) {
        return d.schedule && d.schedule.freq === freq;
    }
    function clock(d) {
        if (d.isFinished)
            return;
        if (d.secondsToFinish)
            return h('div.clock', [
                h('div.time', {
                    hook: startClock(d.secondsToFinish),
                }),
            ]);
        if (d.secondsToStart) {
            if (d.secondsToStart > oneDayInSeconds)
                return h('div.clock', [
                    h('time.timeago.shy', {
                        attrs: {
                            title: new Date(d.startsAt).toLocaleString(),
                            datetime: Date.now() + d.secondsToStart * 1000,
                        },
                        hook: {
                            insert(vnode) {
                                vnode.elm.setAttribute('datetime', '' + (Date.now() + d.secondsToStart * 1000));
                            },
                        },
                    }),
                ]);
            return h('div.clock.clock-created', [
                h('span.shy', 'Starting in'),
                h('span.time.text', {
                    hook: startClock(d.secondsToStart),
                }),
            ]);
        }
    }
    function image(d) {
        if (d.isFinished)
            return;
        if (hasFreq('shield', d) || hasFreq('marathon', d))
            return;
        const s = d.spotlight;
        if (s && s.iconImg)
            return h('img.img', {
                attrs: { src: lichess.assetUrl('images/' + s.iconImg) },
            });
        return h('i.img', {
            attrs: dataIcon((s && s.iconFont) || 'g'),
        });
    }
    function title(ctrl) {
        const d = ctrl.data;
        if (hasFreq('marathon', d))
            return h('h1', [h('i.fire-trophy', '\\'), d.fullName]);
        if (hasFreq('shield', d))
            return h('h1', [
                h('a.shield-trophy', {
                    attrs: { href: '/tournament/shields' },
                }, d.perf.icon),
                d.fullName,
            ]);
        return h('h1', (d.greatPlayer
            ? [
                h('a', {
                    attrs: {
                        href: d.greatPlayer.url,
                        target: '_blank',
                        rel: 'noopener',
                    },
                }, d.greatPlayer.name),
                ' Arena',
            ]
            : [d.fullName]).concat(d.private ? [' ', h('span', { attrs: dataIcon('a') })] : []));
    }
    function header (ctrl) {
        return h('div.tour__main__header', [image(ctrl.data), title(ctrl), clock(ctrl.data)]);
    }

    const name$2 = 'created';
    function main$3(ctrl) {
        const pag = players(ctrl);
        return [
            header(ctrl),
            teamStanding(ctrl, 'created'),
            controls(ctrl, pag),
            standing(ctrl, pag, 'created'),
            h('blockquote.pull-quote', [h('p', ctrl.data.quote.text), h('footer', ctrl.data.quote.author)]),
            ctrl.opts.$faq
                ? h('div', {
                    hook: onInsert(el => $(el).replaceWith(ctrl.opts.$faq)),
                })
                : null,
        ];
    }
    function table$2(ctrl) {
        return ctrl.teamInfo.requested ? teamInfo(ctrl) : undefined;
    }

    var created = /*#__PURE__*/Object.freeze({
        __proto__: null,
        name: name$2,
        main: main$3,
        table: table$2
    });

    function featuredPlayer(game, color) {
        const player$1 = game[color];
        const clock = game.c || game.clock; // temporary BC, remove me
        return h('span.mini-game__player', [
            h('span.mini-game__user', [
                h('strong', '#' + player$1.rank),
                player(player$1, true, true, false),
                player$1.berserk
                    ? h('i', {
                        attrs: {
                            'data-icon': '`',
                            title: 'Berserk',
                        },
                    })
                    : null,
            ]),
            clock
                ? h(`span.mini-game__clock.mini-game__clock--${color}`, {
                    attrs: {
                        'data-time': clock[color],
                        'data-managed': 1,
                    },
                })
                : h('span.mini-game__result', game.winner ? (game.winner == color ? 1 : 0) : '½'),
        ]);
    }
    function featured(game) {
        return h(`div.tour__featured.mini-game.mini-game-${game.id}.mini-game--init.is2d`, {
            attrs: {
                'data-state': `${game.fen},${game.orientation},${game.lastMove}`,
                'data-live': game.id,
            },
            hook: onInsert(lichess.powertip.manualUserIn),
        }, [
            featuredPlayer(game, opposite(game.orientation)),
            h('a.cg-wrap', {
                attrs: {
                    href: `/${game.id}/${game.orientation}`,
                },
            }),
            featuredPlayer(game, game.orientation),
        ]);
    }
    function duelPlayerMeta(p) {
        return [h('em.rank', '#' + p.k), p.t ? h('em.utitle', p.t) : null, h('em.rating', '' + p.r)];
    }
    function renderDuel(battle, duelTeams) {
        return (d) => h('a.glpt', {
            key: d.id,
            attrs: { href: '/' + d.id },
        }, [
            battle && duelTeams
                ? h('line.t', [0, 1].map(i => teamName(battle, duelTeams[d.p[i].n.toLowerCase()])))
                : undefined,
            h('line.a', [h('strong', d.p[0].n), h('span', duelPlayerMeta(d.p[1]).reverse())]),
            h('line.b', [h('span', duelPlayerMeta(d.p[0])), h('strong', d.p[1].n)]),
        ]);
    }
    const initMiniGame = (node) => lichess.miniGame.initAll(node.elm);
    function tourTable (ctrl) {
        return h('div.tour__table', {
            hook: {
                insert: initMiniGame,
                postpatch: initMiniGame,
            },
        }, [
            ctrl.data.featured ? featured(ctrl.data.featured) : null,
            ctrl.data.duels.length
                ? h('section.tour__duels', {
                    hook: bind('click', _ => !ctrl.disableClicks),
                }, [h('h2', 'Top games')].concat(ctrl.data.duels.map(renderDuel(ctrl.data.teamBattle, ctrl.data.duelTeams))))
                : null,
        ]);
    }

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

    function result(win, stat) {
        switch (win) {
            case true:
                return '1';
            case false:
                return '0';
            default:
                return stat >= ids.mate ? '½' : '*';
        }
    }
    function playerTitle(player$1) {
        return h('h2', [h('span.rank', player$1.rank + '. '), player(player$1, true, false, false)]);
    }
    function setup(vnode) {
        const el = vnode.elm, p = lichess.powertip;
        p.manualUserIn(el);
        p.manualGameIn(el);
    }
    function playerInfo (ctrl) {
        const data = ctrl.playerInfo.data;
        const noarg = ctrl.trans.noarg;
        const tag = 'div.tour__player-info.tour__actor-info';
        if (!data || data.player.id !== ctrl.playerInfo.id)
            return h(tag, [h('div.stats', [playerTitle(ctrl.playerInfo.player), spinner()])]);
        const nb = data.player.nb, pairingsLen = data.pairings.length, avgOp = pairingsLen
            ? Math.round(data.pairings.reduce(function (a, b) {
                return a + b.op.rating;
            }, 0) / pairingsLen)
            : undefined;
        return h(tag, {
            hook: {
                insert: setup,
                postpatch(_, vnode) {
                    setup(vnode);
                },
            },
        }, [
            h('a.close', {
                attrs: dataIcon('L'),
                hook: bind('click', () => ctrl.showPlayerInfo(data.player), ctrl.redraw),
            }),
            h('div.stats', [
                playerTitle(data.player),
                data.player.team
                    ? h('team', {
                        hook: bind('click', () => ctrl.showTeamInfo(data.player.team), ctrl.redraw),
                    }, [teamName(ctrl.data.teamBattle, data.player.team)])
                    : null,
                h('table', [
                    data.player.performance
                        ? numberRow(noarg('performance'), data.player.performance + (nb.game < 3 ? '?' : ''), 'raw')
                        : null,
                    numberRow(noarg('gamesPlayed'), nb.game),
                    ...(nb.game
                        ? [
                            numberRow(noarg('winRate'), [nb.win, nb.game], 'percent'),
                            numberRow(noarg('berserkRate'), [nb.berserk, nb.game], 'percent'),
                            numberRow(noarg('averageOpponent'), avgOp, 'raw'),
                        ]
                        : []),
                ]),
            ]),
            h('div', [
                h('table.pairings.sublist', {
                    hook: bind('click', e => {
                        const href = e.target.parentNode.getAttribute('data-href');
                        if (href)
                            window.open(href, '_blank', 'noopener');
                    }),
                }, data.pairings.map(function (p, i) {
                    const res = result(p.win, p.status);
                    return h('tr.glpt.' + (res === '1' ? ' win' : res === '0' ? ' loss' : ''), {
                        key: p.id,
                        attrs: { 'data-href': '/' + p.id + '/' + p.color },
                        hook: {
                            destroy: vnode => $.powerTip.destroy(vnode.elm),
                        },
                    }, [
                        h('th', '' + (Math.max(nb.game, pairingsLen) - i)),
                        h('td', playerName(p.op)),
                        h('td', p.op.rating),
                        h('td.is.color-icon.' + p.color),
                        h('td', res),
                    ]);
                })),
            ]),
        ]);
    }

    function joinTheGame(ctrl, gameId) {
        return h('a.tour__ur-playing.button.is.is-after', {
            attrs: { href: '/' + gameId },
        }, [ctrl.trans('youArePlaying'), h('br'), ctrl.trans('joinTheGame')]);
    }
    function notice(ctrl) {
        return willBePaired(ctrl)
            ? h('div.tour__notice.bar-glider', ctrl.trans('standByX', ctrl.data.me.username))
            : h('div.tour__notice.closed', ctrl.trans('tournamentPairingsAreNowClosed'));
    }
    const name$1 = 'started';
    function main$2(ctrl) {
        const gameId = ctrl.myGameId(), pag = players(ctrl);
        return [
            header(ctrl),
            gameId ? joinTheGame(ctrl, gameId) : isIn(ctrl) ? notice(ctrl) : null,
            teamStanding(ctrl, 'started'),
            controls(ctrl, pag),
            standing(ctrl, pag, 'started'),
        ];
    }
    function table$1(ctrl) {
        return ctrl.playerInfo.id ? playerInfo(ctrl) : ctrl.teamInfo.requested ? teamInfo(ctrl) : tourTable(ctrl);
    }

    var started = /*#__PURE__*/Object.freeze({
        __proto__: null,
        name: name$1,
        main: main$2,
        table: table$1
    });

    function confetti(data) {
        if (data.me && data.isRecentlyFinished && lichess.once('tournament.end.canvas.' + data.id))
            return h('canvas#confetti', {
                hook: {
                    insert: _ => lichess.loadScript('javascripts/confetti.js'),
                },
            });
    }
    function stats(data, trans) {
        const noarg = trans.noarg;
        const tableData = [
            numberRow(noarg('averageElo'), data.stats.averageRating, 'raw'),
            numberRow(noarg('gamesPlayed'), data.stats.games),
            numberRow(noarg('movesPlayed'), data.stats.moves),
            numberRow(noarg('whiteWins'), [data.stats.whiteWins, data.stats.games], 'percent'),
            numberRow(noarg('blackWins'), [data.stats.blackWins, data.stats.games], 'percent'),
            numberRow(noarg('draws'), [data.stats.draws, data.stats.games], 'percent'),
        ];
        if (data.berserkable) {
            const berserkRate = [data.stats.berserks / 2, data.stats.games];
            tableData.push(numberRow(noarg('berserkRate'), berserkRate, 'percent'));
        }
        return h('div.tour__stats', [
            h('h2', noarg('tournamentComplete')),
            h('table', tableData),
            h('div.tour__stats__links', [
                ...(data.teamBattle
                    ? [
                        h('a', {
                            attrs: {
                                href: `/tournament/${data.id}/teams`,
                            },
                        }, trans('viewAllXTeams', Object.keys(data.teamBattle.teams).length)),
                        h('br'),
                    ]
                    : []),
                h('a.text', {
                    attrs: {
                        'data-icon': 'x',
                        href: `/api/tournament/${data.id}/games`,
                        download: true,
                    },
                }, 'Download all games'),
                h('a.text', {
                    attrs: {
                        'data-icon': 'x',
                        href: `/api/tournament/${data.id}/results`,
                        download: true,
                    },
                }, 'Download results as NDJSON'),
                h('a.text', {
                    attrs: {
                        'data-icon': 'x',
                        href: `/api/tournament/${data.id}/results?as=csv`,
                        download: true,
                    },
                }, 'Download results as CSV'),
                h('br'),
                h('a.text', {
                    attrs: {
                        'data-icon': '',
                        href: 'https://lichess.org/api#tag/Arena-tournaments',
                    },
                }, 'Arena API documentation'),
            ]),
        ]);
    }
    const name = 'finished';
    function main$1(ctrl) {
        const pag = players(ctrl);
        const teamS = teamStanding(ctrl, 'finished');
        return [
            ...(teamS ? [header(ctrl), teamS] : [h('div.podium-wrap', [confetti(ctrl.data), header(ctrl), podium(ctrl)])]),
            controls(ctrl, pag),
            standing(ctrl, pag),
        ];
    }
    function table(ctrl) {
        return ctrl.playerInfo.id
            ? playerInfo(ctrl)
            : ctrl.teamInfo.requested
                ? teamInfo(ctrl)
                : stats
                    ? stats(ctrl.data, ctrl.trans)
                    : undefined;
    }

    var finished = /*#__PURE__*/Object.freeze({
        __proto__: null,
        name: name,
        main: main$1,
        table: table
    });

    function view (ctrl) {
        let handler;
        if (ctrl.data.isFinished)
            handler = finished;
        else if (ctrl.data.isStarted)
            handler = started;
        else
            handler = created;
        return h('main.' + ctrl.opts.classes, [
            h('aside.tour__side', {
                hook: onInsert(el => {
                    $(el).replaceWith(ctrl.opts.$side);
                    ctrl.opts.chat && lichess.makeChat(ctrl.opts.chat);
                }),
            }),
            h('div.tour__underchat', {
                hook: onInsert(el => {
                    $(el).replaceWith($('.tour__underchat.none').removeClass('none'));
                }),
            }),
            handler.table(ctrl),
            h('div.tour__main', h('div.box.' + handler.name, {
                class: { 'tour__main-finished': ctrl.data.isFinished },
            }, handler.main(ctrl))),
            ctrl.opts.chat
                ? h('div.chat__members.none', {
                    hook: onInsert(lichess.watchers),
                })
                : null,
            ctrl.joinWithTeamSelector ? joinWithTeamSelector(ctrl) : null,
        ]);
    }

    const patch = init$1([classModule, attributesModule]);
    function main (opts) {
        $('body').data('tournament-id', opts.data.id);
        lichess.socket = new lichess.StrongSocket(`/tournament/${opts.data.id}/socket/v5`, opts.data.socketVersion, {
            receive: (t, d) => ctrl.socket.receive(t, d),
        });
        opts.socketSend = lichess.socket.send;
        opts.element = document.querySelector('main.tour');
        opts.classes = opts.element.getAttribute('class');
        opts.$side = $('.tour__side').clone();
        opts.$faq = $('.tour__faq').clone();
        const ctrl = new TournamentController(opts, redraw);
        const blueprint = view(ctrl);
        opts.element.innerHTML = '';
        let vnode = patch(opts.element, blueprint);
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
    }
    // that's for the rest of lichess to access chessground
    // without having to include it a second time
    window.Chessground = Chessground;
    window.LichessChat = LichessChat;

    return main;

}());
