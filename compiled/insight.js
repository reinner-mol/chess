var LichessInsight = (function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, basedir, module) {
		return module = {
			path: basedir,
			exports: {},
			require: function (path, base) {
				return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
			}
		}, fn(module, module.exports), module.exports;
	}

	function getAugmentedNamespace(n) {
		if (n.__esModule) return n;
		var a = Object.defineProperty({}, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
	}

	var mithril = createCommonjsModule(function (module) {
	var m = (function app(window, undefined$1) {
	  	var VERSION = "v0.2.1-lila";
		function isFunction(object) {
			return typeof object === "function";
		}
		function isObject(object) {
			return type.call(object) === "[object Object]";
		}
		function isString(object) {
			return type.call(object) === "[object String]";
		}
		var isArray = Array.isArray || function (object) {
			return type.call(object) === "[object Array]";
		};
		var type = {}.toString;
		var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
		var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
		var noop = function () {};

		// caching commonly used variables
		var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

		// self invoking function needed because of the way mocks work
		function initialize(window) {
			$document = window.document;
			$location = window.location;
			$cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
			$requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
		}

		initialize(window);

		m.version = function() {
			return VERSION;
		};

		/**
		 * @typedef {String} Tag
		 * A string that looks like -> div.classname#id[param=one][param2=two]
		 * Which describes a DOM node
		 */

		/**
		 *
		 * @param {Tag} The DOM node tag
		 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
		 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
		 *
		 */
		function m(tag, pairs) {
			for (var args = [], i = 1; i < arguments.length; i++) {
				args[i - 1] = arguments[i];
			}
			if (isObject(tag)) return parameterize(tag, args);
			var hasAttrs = pairs != null && isObject(pairs) && !("tag" in pairs || "view" in pairs || "subtree" in pairs);
			var attrs = hasAttrs ? pairs : {};
			var classAttrName = "class" in attrs ? "class" : "className";
			var cell = {tag: "div", attrs: {}};
			var match, classes = [];
			if (!isString(tag)) throw new Error("selector in m(selector, attrs, children) should be a string");
			while ((match = parser.exec(tag)) != null) {
				if (match[1] === "" && match[2]) cell.tag = match[2];
				else if (match[1] === "#") cell.attrs.id = match[2];
				else if (match[1] === ".") classes.push(match[2]);
				else if (match[3][0] === "[") {
					var pair = attrParser.exec(match[3]);
					cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true);
				}
			}

			var children = hasAttrs ? args.slice(1) : args;
			if (children.length === 1 && isArray(children[0])) {
				cell.children = children[0];
			}
			else {
				cell.children = children;
			}

			for (var attrName in attrs) {
				if (attrs.hasOwnProperty(attrName)) {
					if (attrName === classAttrName && attrs[attrName] != null && attrs[attrName] !== "") {
						classes.push(attrs[attrName]);
						cell.attrs[attrName] = ""; //create key in correct iteration order
					}
					else cell.attrs[attrName] = attrs[attrName];
				}
			}
			if (classes.length) cell.attrs[classAttrName] = classes.join(" ");

			return cell;
		}
		function forEach(list, f) {
			for (var i = 0; i < list.length && !f(list[i], i++);) {}
		}
		function forKeys(list, f) {
			forEach(list, function (attrs, i) {
				return (attrs = attrs && attrs.attrs) && attrs.key != null && f(attrs, i);
			});
		}
		// This function was causing deopts in Chrome.
		// Well no longer
		function dataToString(data) {
	    if (data == null) return '';
	    if (typeof data === 'object') return data;
	    if (data.toString() == null) return ""; // prevent recursion error on FF
	    return data;
		}
		// This function was causing deopts in Chrome.
		function injectTextNode(parentElement, first, index, data) {
			try {
				insertNode(parentElement, first, index);
				first.nodeValue = data;
			} catch (e) {} //IE erroneously throws error when appending an empty text node after a null
		}

		function flatten(list) {
			//recursively flatten array
			for (var i = 0; i < list.length; i++) {
				if (isArray(list[i])) {
					list = list.concat.apply([], list);
					//check current index again and flatten until there are no more nested arrays at that index
					i--;
				}
			}
			return list;
		}

		function insertNode(parentElement, node, index) {
			parentElement.insertBefore(node, parentElement.childNodes[index] || null);
		}

		var DELETION = 1, INSERTION = 2, MOVE = 3;

		function handleKeysDiffer(data, existing, cached, parentElement) {
			forKeys(data, function (key, i) {
				existing[key = key.key] = existing[key] ? {
					action: MOVE,
					index: i,
					from: existing[key].index,
					element: cached.nodes[existing[key].index] || $document.createElement("div")
				} : {action: INSERTION, index: i};
			});
			var actions = [];
			for (var prop in existing) actions.push(existing[prop]);
			var changes = actions.sort(sortChanges), newCached = new Array(cached.length);
			newCached.nodes = cached.nodes.slice();

			forEach(changes, function (change) {
				var index = change.index;
				if (change.action === DELETION) {
					clear(cached[index].nodes, cached[index]);
					newCached.splice(index, 1);
				}
				if (change.action === INSERTION) {
					var dummy = $document.createElement("div");
					dummy.key = data[index].attrs.key;
					insertNode(parentElement, dummy, index);
					newCached.splice(index, 0, {
						attrs: {key: data[index].attrs.key},
						nodes: [dummy]
					});
					newCached.nodes[index] = dummy;
				}

				if (change.action === MOVE) {
					var changeElement = change.element;
					var maybeChanged = parentElement.childNodes[index];
					if (maybeChanged !== changeElement && changeElement !== null) {
						parentElement.insertBefore(changeElement, maybeChanged || null);
					}
					newCached[index] = cached[change.from];
					newCached.nodes[index] = changeElement;
				}
			});

			return newCached;
		}

		function diffKeys(data, cached, existing, parentElement) {
			var keysDiffer = data.length !== cached.length;
			if (!keysDiffer) {
				forKeys(data, function (attrs, i) {
					var cachedCell = cached[i];
					return keysDiffer = cachedCell && cachedCell.attrs && cachedCell.attrs.key !== attrs.key;
				});
			}

			return keysDiffer ? handleKeysDiffer(data, existing, cached, parentElement) : cached;
		}

		function diffArray(data, cached, nodes) {
			//diff the array itself

			//update the list of DOM nodes by collecting the nodes from each item
			forEach(data, function (_, i) {
				if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes);
			});
			//remove items from the end of the array if the new array is shorter than the old one. if errors ever happen here, the issue is most likely
			//a bug in the construction of the `cached` data structure somewhere earlier in the program
			forEach(cached.nodes, function (node, i) {
				if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]]);
			});
			if (data.length < cached.length) cached.length = data.length;
			cached.nodes = nodes;
		}

		function buildArrayKeys(data) {
			var guid = 0;
			forKeys(data, function () {
				forEach(data, function (attrs) {
					if ((attrs = attrs && attrs.attrs) && attrs.key == null) attrs.key = "__mithril__" + guid++;
				});
				return 1;
			});
		}

		function maybeRecreateObject(data, cached, dataAttrKeys) {
			//if an element is different enough from the one in cache, recreate it
			if (data.tag !== cached.tag ||
					dataAttrKeys.sort().join() !== Object.keys(cached.attrs).sort().join() ||
					data.attrs.id !== cached.attrs.id ||
					data.attrs.key !== cached.attrs.key ||
					(m.redraw.strategy() === "all" && (!cached.configContext || cached.configContext.retain !== true)) ||
					(m.redraw.strategy() === "diff" && cached.configContext && cached.configContext.retain === false)) {
				if (cached.nodes.length) clear(cached.nodes);
				if (cached.configContext && isFunction(cached.configContext.onunload)) cached.configContext.onunload();
				if (cached.controllers) {
					forEach(cached.controllers, function (controller) {
						if (controller.unload) controller.onunload({preventDefault: noop});
					});
				}
			}
		}

		function getObjectNamespace(data, namespace) {
			return data.attrs.xmlns ? data.attrs.xmlns :
				data.tag === "svg" ? "http://www.w3.org/2000/svg" :
				data.tag === "math" ? "http://www.w3.org/1998/Math/MathML" :
				namespace;
		}

		function unloadCachedControllers(cached, views, controllers) {
			if (controllers.length) {
				cached.views = views;
				cached.controllers = controllers;
				forEach(controllers, function (controller) {
					if (controller.onunload && controller.onunload.$old) controller.onunload = controller.onunload.$old;
					if (pendingRequests && controller.onunload) {
						var onunload = controller.onunload;
						controller.onunload = noop;
						controller.onunload.$old = onunload;
					}
				});
			}
		}

		function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
			//schedule configs to be called. They are called after `build`
			//finishes running
			if (isFunction(data.attrs.config)) {
				var context = cached.configContext = cached.configContext || {};

				//bind
				configs.push(function() {
					return data.attrs.config.call(data, node, !isNew, context, cached);
				});
			}
		}

		function buildUpdatedNode(cached, data, editable, hasKeys, namespace, views, configs, controllers) {
			var node = cached.nodes[0];
			if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
			cached.children = build(node, data.tag, undefined$1, undefined$1, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
			cached.nodes.intact = true;

			if (controllers.length) {
				cached.views = views;
				cached.controllers = controllers;
			}

			return node;
		}

		function handleNonexistentNodes(data, parentElement, index) {
			var nodes;
			if (data.$trusted) {
				nodes = injectHTML(parentElement, index, data);
			}
			else {
				nodes = [$document.createTextNode(data)];
				if (!parentElement.nodeName.match(voidElements)) insertNode(parentElement, nodes[0], index);
			}

			var cached = typeof data === "string" || typeof data === "number" || typeof data === "boolean" ? new data.constructor(data) : data;
			cached.nodes = nodes;
			return cached;
		}

		function reattachNodes(data, cached, parentElement, editable, index, parentTag) {
			var nodes = cached.nodes;
			if (!editable || editable !== $document.activeElement) {
				if (data.$trusted) {
					clear(nodes, cached);
					nodes = injectHTML(parentElement, index, data);
				}
				//corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
				//we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
				else if (parentTag === "textarea") {
					parentElement.value = data;
				}
				else if (editable) {
					editable.innerHTML = data;
				}
				else {
					//was a trusted string
					if (nodes[0].nodeType === 1 || nodes.length > 1) {
						clear(cached.nodes, cached);
						nodes = [$document.createTextNode(data)];
					}
					injectTextNode(parentElement, nodes[0], index, data);
				}
			}
			cached = new data.constructor(data);
			cached.nodes = nodes;
			return cached;
		}

		function handleText(cached, data, index, parentElement, shouldReattach, editable, parentTag) {
			//handle text nodes
			return cached.nodes.length === 0 ? handleNonexistentNodes(data, parentElement, index) :
				cached.valueOf() !== data.valueOf() || shouldReattach === true ?
					reattachNodes(data, cached, parentElement, editable, index, parentTag) :
				(cached.nodes.intact = true, cached);
		}

		function getSubArrayCount(item) {
			if (item.$trusted) {
				//fix offset of next element if item was a trusted string w/ more than one html element
				//the first clause in the regexp matches elements
				//the second clause (after the pipe) matches text nodes
				var match = item.match(/<[^\/]|\>\s*[^<]/g);
				if (match != null) return match.length;
			}
			else if (isArray(item)) {
				return item.length;
			}
			return 1;
		}

		function buildArray(data, cached, parentElement, index, parentTag, shouldReattach, editable, namespace, configs) {
			data = flatten(data);
			var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

			//keys algorithm: sort elements without recreating them if keys are present
			//1) create a map of all existing keys, and mark all for deletion
			//2) add new keys to map and mark them for addition
			//3) if key exists in new list, change action from deletion to a move
			//4) for each key, handle its corresponding action as marked in previous steps
			var existing = {}, shouldMaintainIdentities = false;
			forKeys(cached, function (attrs, i) {
				shouldMaintainIdentities = true;
				existing[cached[i].attrs.key] = {action: DELETION, index: i};
			});

			buildArrayKeys(data);
			if (shouldMaintainIdentities) cached = diffKeys(data, cached, existing, parentElement);
			//end key algorithm

			var cacheCount = 0;
			//faster explicitly written
			for (var i = 0, len = data.length; i < len; i++) {
				//diff each item in the array
				var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);

				if (item !== undefined$1) {
					intact = intact && item.nodes.intact;
					subArrayCount += getSubArrayCount(item);
					cached[cacheCount++] = item;
				}
			}

			if (!intact) diffArray(data, cached, nodes);
			return cached
		}

		function makeCache(data, cached, index, parentIndex, parentCache) {
			if (cached != null) {
				if (type.call(cached) === type.call(data)) return cached;

				if (parentCache && parentCache.nodes) {
					var offset = index - parentIndex, end = offset + (isArray(data) ? data : cached.nodes).length;
					clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end));
				} else if (cached.nodes) {
					clear(cached.nodes, cached);
				}
			}

			cached = new data.constructor();
			//if constructor creates a virtual dom element, use a blank object
			//as the base cached node instead of copying the virtual el (#277)
			if (cached.tag) cached = {};
			cached.nodes = [];
			return cached;
		}

		function constructNode(data, namespace) {
			return namespace === undefined$1 ?
				data.attrs.is ? $document.createElement(data.tag, data.attrs.is) : $document.createElement(data.tag) :
				data.attrs.is ? $document.createElementNS(namespace, data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag);
		}

		function constructAttrs(data, node, namespace, hasKeys) {
			return hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs;
		}

		function constructChildren(data, node, cached, editable, namespace, configs) {
			return data.children != null && data.children.length > 0 ?
				build(node, data.tag, undefined$1, undefined$1, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
				data.children;
		}

		function reconstructCached(data, attrs, children, node, namespace, views, controllers) {
			var cached = {tag: data.tag, attrs: attrs, children: children, nodes: [node]};
			unloadCachedControllers(cached, views, controllers);
			if (cached.children && !cached.children.nodes) cached.children.nodes = [];
			//edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
			if (data.tag === "select" && "value" in data.attrs) setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
			return cached
		}

		function getController(views, view, cachedControllers, controller) {
			var controllerIndex = m.redraw.strategy() === "diff" && views ? views.indexOf(view) : -1;
			return controllerIndex > -1 ? cachedControllers[controllerIndex] :
				typeof controller === "function" ? new controller() : {};
		}

		function updateLists(views, controllers, view, controller) {
			if (controller.onunload != null) unloaders.push({controller: controller, handler: controller.onunload});
			views.push(view);
			controllers.push(controller);
		}

		function checkView(data, view, cached, cachedControllers, controllers, views) {
			var controller = getController(cached.views, view, cachedControllers, data.controller);
			//Faster to coerce to number and check for NaN
			var key = +(data && data.attrs && data.attrs.key);
			data = pendingRequests === 0 || forcing || cachedControllers && cachedControllers.indexOf(controller) > -1 ? data.view(controller) : {tag: "placeholder"};
			if (data.subtree === "retain") return cached;
			if (key === key) (data.attrs = data.attrs || {}).key = key;
			updateLists(views, controllers, view, controller);
			return data;
		}

		function markViews(data, cached, views, controllers) {
			var cachedControllers = cached && cached.controllers;
			while (data.view != null) data = checkView(data, data.view.$original || data.view, cached, cachedControllers, controllers, views);
			return data;
		}

		function buildObject(data, cached, editable, parentElement, index, shouldReattach, namespace, configs) {
			var views = [], controllers = [];
			data = markViews(data, cached, views, controllers);
			if (!data.tag && controllers.length) throw new Error("Component template must return a virtual element, not an array, string, etc.");
			data.attrs = data.attrs || {};
			cached.attrs = cached.attrs || {};
			var dataAttrKeys = Object.keys(data.attrs);
			var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0);
			maybeRecreateObject(data, cached, dataAttrKeys);
			if (!isString(data.tag)) return;
			var isNew = cached.nodes.length === 0;
			namespace = getObjectNamespace(data, namespace);
			var node;
			if (isNew) {
				node = constructNode(data, namespace);
				//set attributes first, then create children
				var attrs = constructAttrs(data, node, namespace, hasKeys);
				var children = constructChildren(data, node, cached, editable, namespace, configs);
				cached = reconstructCached(data, attrs, children, node, namespace, views, controllers);
			}
			else {
				node = buildUpdatedNode(cached, data, editable, hasKeys, namespace, views, configs, controllers);
			}
			if (isNew || shouldReattach === true && node != null) insertNode(parentElement, node, index);
			//schedule configs to be called. They are called after `build`
			//finishes running
			scheduleConfigsToBeCalled(configs, data, node, isNew, cached);
			return cached
		}

		function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
			//`build` is a recursive function that manages creation/diffing/removal
			//of DOM elements based on comparison between `data` and `cached`
			//the diff algorithm can be summarized as this:
			//1 - compare `data` and `cached`
			//2 - if they are different, copy `data` to `cached` and update the DOM
			//    based on what the difference is
			//3 - recursively apply this algorithm for every array and for the
			//    children of every virtual element

			//the `cached` data structure is essentially the same as the previous
			//redraw's `data` data structure, with a few additions:
			//- `cached` always has a property called `nodes`, which is a list of
			//   DOM elements that correspond to the data represented by the
			//   respective virtual element
			//- in order to support attaching `nodes` as a property of `cached`,
			//   `cached` is *always* a non-primitive object, i.e. if the data was
			//   a string, then cached is a String instance. If data was `null` or
			//   `undefined`, cached is `new String("")`
			//- `cached also has a `configContext` property, which is the state
			//   storage object exposed by config(element, isInitialized, context)
			//- when `cached` is an Object, it represents a virtual element; when
			//   it's an Array, it represents a list of elements; when it's a
			//   String, Number or Boolean, it represents a text node

			//`parentElement` is a DOM element used for W3C DOM API calls
			//`parentTag` is only used for handling a corner case for textarea
			//values
			//`parentCache` is used to remove nodes in some multi-node cases
			//`parentIndex` and `index` are used to figure out the offset of nodes.
			//They're artifacts from before arrays started being flattened and are
			//likely refactorable
			//`data` and `cached` are, respectively, the new and old nodes being
			//diffed
			//`shouldReattach` is a flag indicating whether a parent node was
			//recreated (if so, and if this node is reused, then this node must
			//reattach itself to the new parent)
			//`editable` is a flag that indicates whether an ancestor is
			//contenteditable
			//`namespace` indicates the closest HTML namespace as it cascades down
			//from an ancestor
			//`configs` is a list of config functions to run after the topmost
			//`build` call finishes running

			//there's logic that relies on the assumption that null and undefined
			//data are equivalent to empty strings
			//- this prevents lifecycle surprises from procedural helpers that mix
			//  implicit and explicit return statements (e.g.
			//  function foo() {if (cond) return m("div")}
			//- it simplifies diffing code
			data = dataToString(data);
			if (data.subtree === "retain") return cached;
			cached = makeCache(data, cached, index, parentIndex, parentCache);
			return isArray(data) ? buildArray(data, cached, parentElement, index, parentTag, shouldReattach, editable, namespace, configs) :
				data != null && isObject(data) ? buildObject(data, cached, editable, parentElement, index, shouldReattach, namespace, configs) :
				!isFunction(data) ? handleText(cached, data, index, parentElement, shouldReattach, editable, parentTag) :
				cached;
		}
		function sortChanges(a, b) { return a.action - b.action || a.index - b.index; }
		function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
			for (var attrName in dataAttrs) {
				var dataAttr = dataAttrs[attrName];
				var cachedAttr = cachedAttrs[attrName];
				if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
					cachedAttrs[attrName] = dataAttr;
					//`config` isn't a real attributes, so ignore it
					if (attrName === "config" || attrName === "key") continue;
					//hook event handlers to the auto-redrawing system
					else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
					node[attrName] = autoredraw(dataAttr, node);
					}
					//handle `style: {...}`
					else if (attrName === "style" && dataAttr != null && isObject(dataAttr)) {
					for (var rule in dataAttr) {
							if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule];
					}
					for (var rule in cachedAttr) {
							if (!(rule in dataAttr)) node.style[rule] = "";
					}
					}
					//handle SVG
					else if (namespace != null) {
					if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
					else node.setAttribute(attrName === "className" ? "class" : attrName, dataAttr);
					}
					//handle cases that are properties (but ignore cases where we should use setAttribute instead)
					//- list and form are typically used as strings, but are DOM element references in js
					//- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
					else if (attrName in node && attrName !== "list" && attrName !== "style" && attrName !== "form" && attrName !== "type" && attrName !== "width" && attrName !== "height") {
					//#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
					if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr;
					}
					else node.setAttribute(attrName, dataAttr);
				}
				//#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
				else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
					node.value = dataAttr;
				}
			}
			return cachedAttrs;
		}
		function clear(nodes, cached) {
			for (var i = nodes.length - 1; i > -1; i--) {
				if (nodes[i] && nodes[i].parentNode) {
					try { nodes[i].parentNode.removeChild(nodes[i]); }
					catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
					cached = [].concat(cached);
					if (cached[i]) unload(cached[i]);
				}
			}
			//release memory if nodes is an array. This check should fail if nodes is a NodeList (see loop above)
			if (nodes.length) nodes.length = 0;
		}
		function unload(cached) {
			if (cached.configContext && isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload();
				cached.configContext.onunload = null;
			}
			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (isFunction(controller.onunload)) controller.onunload({preventDefault: noop});
				});
			}
			if (cached.children) {
				if (isArray(cached.children)) forEach(cached.children, unload);
				else if (cached.children.tag) unload(cached.children);
			}
		}

		var insertAdjacentBeforeEnd = (function () {
			var rangeStrategy = function (parentElement, data) {
				parentElement.appendChild($document.createRange().createContextualFragment(data));
			};
			var insertAdjacentStrategy = function (parentElement, data) {
				parentElement.insertAdjacentHTML("beforeend", data);
			};

			try {
				$document.createRange().createContextualFragment('x');
				return rangeStrategy;
			} catch (e) {
				return insertAdjacentStrategy;
			}
		})();

		function injectHTML(parentElement, index, data) {
			var nextSibling = parentElement.childNodes[index];
			if (nextSibling) {
				var isElement = nextSibling.nodeType !== 1;
				var placeholder = $document.createElement("span");
				if (isElement) {
					parentElement.insertBefore(placeholder, nextSibling || null);
					placeholder.insertAdjacentHTML("beforebegin", data);
					parentElement.removeChild(placeholder);
				}
				else nextSibling.insertAdjacentHTML("beforebegin", data);
			}
			else insertAdjacentBeforeEnd(parentElement, data);

			var nodes = [];
			while (parentElement.childNodes[index] !== nextSibling) {
				nodes.push(parentElement.childNodes[index]);
				index++;
			}
			return nodes;
		}
		function autoredraw(callback, object) {
			return function(e) {
				e = e || event;
				m.redraw.strategy("diff");
				m.startComputation();
				try { return callback.call(object, e); }
				finally {
					endFirstComputation();
				}
			};
		}

		var html;
		var documentNode = {
			appendChild: function(node) {
				if (html === undefined$1) html = $document.createElement("html");
				if ($document.documentElement && $document.documentElement !== node) {
					$document.replaceChild(node, $document.documentElement);
				}
				else $document.appendChild(node);
				this.childNodes = $document.childNodes;
			},
			insertBefore: function(node) {
				this.appendChild(node);
			},
			childNodes: []
		};
		var nodeCache = [], cellCache = {};
		m.render = function(root, cell, forceRecreation) {
			var configs = [];
			if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
			var id = getCellCacheKey(root);
			var isDocumentRoot = root === $document;
			var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
			if (isDocumentRoot && cell.tag !== "html") cell = {tag: "html", attrs: {}, children: cell};
			if (cellCache[id] === undefined$1) clear(node.childNodes);
			if (forceRecreation === true) reset(root);
			cellCache[id] = build(node, null, undefined$1, undefined$1, cell, cellCache[id], false, 0, null, undefined$1, configs);
			forEach(configs, function (config) { config(); });
		};
		function getCellCacheKey(element) {
			var index = nodeCache.indexOf(element);
			return index < 0 ? nodeCache.push(element) - 1 : index;
		}

		m.trust = function(value) {
			value = new String(value);
			value.$trusted = true;
			return value;
		};

		function gettersetter(store) {
			var prop = function() {
				if (arguments.length) store = arguments[0];
				return store;
			};

			prop.toJSON = function() {
				return store;
			};

			return prop;
		}

		m.prop = function (store) {
			//note: using non-strict equality check here because we're checking if store is null OR undefined
			if ((store != null && isObject(store) || isFunction(store)) && isFunction(store.then)) {
				return propify(store);
			}

			return gettersetter(store);
		};

		var roots = [], components = [], controllers = [], lastRedrawId = null, lastRedrawCallTime = 0, computePreRedrawHook = null, computePostRedrawHook = null, topComponent, unloaders = [];
		var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
		function parameterize(component, args) {
			var controller = function() {
				return (component.controller || noop).apply(this, args) || this;
			};
			if (component.controller) controller.prototype = component.controller.prototype;
			var view = function(ctrl) {
				var currentArgs = arguments.length > 1 ? args.concat([].slice.call(arguments, 1)) : args;
				return component.view.apply(component, currentArgs ? [ctrl].concat(currentArgs) : [ctrl]);
			};
			view.$original = component.view;
			var output = {controller: controller, view: view};
			if (args[0] && args[0].key != null) output.attrs = {key: args[0].key};
			return output;
		}
		m.component = function(component) {
			for (var args = [], i = 1; i < arguments.length; i++) args.push(arguments[i]);
			return parameterize(component, args);
		};
		m.mount = m.module = function(root, component) {
			if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
			var index = roots.indexOf(root);
			if (index < 0) index = roots.length;

			var isPrevented = false;
			var event = {preventDefault: function() {
				isPrevented = true;
				computePreRedrawHook = computePostRedrawHook = null;
			}};

			forEach(unloaders, function (unloader) {
				unloader.handler.call(unloader.controller, event);
				unloader.controller.onunload = null;
			});

			if (isPrevented) {
				forEach(unloaders, function (unloader) {
					unloader.controller.onunload = unloader.handler;
				});
			}
			else unloaders = [];

			if (controllers[index] && isFunction(controllers[index].onunload)) {
				controllers[index].onunload(event);
			}

			var isNullComponent = component === null;

			if (!isPrevented) {
				m.redraw.strategy("all");
				m.startComputation();
				roots[index] = root;
				var currentComponent = component ? (topComponent = component) : (topComponent = component = {controller: noop});
				var controller = new (component.controller || noop)();
				//controllers may call m.mount recursively (via m.route redirects, for example)
				//this conditional ensures only the last recursive m.mount call is applied
				if (currentComponent === topComponent) {
					controllers[index] = controller;
					components[index] = component;
				}
				endFirstComputation();
				if (isNullComponent) {
					removeRootElement(root, index);
				}
				return controllers[index];
			}
			if (isNullComponent) {
				removeRootElement(root, index);
			}
		};

		function removeRootElement(root, index) {
			roots.splice(index, 1);
			controllers.splice(index, 1);
			components.splice(index, 1);
			reset(root);
			nodeCache.splice(getCellCacheKey(root), 1);
		}

		var redrawing = false, forcing = false;
		m.redraw = function(force) {
			if (redrawing) return;
			redrawing = true;
			if (force) forcing = true;
			try {
				//lastRedrawId is a positive number if a second redraw is requested before the next animation frame
				//lastRedrawID is null if it's the first redraw and not an event handler
				if (lastRedrawId && !force) {
					//when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
					//when rAF: always reschedule redraw
					if ($requestAnimationFrame === window.requestAnimationFrame || new Date - lastRedrawCallTime > FRAME_BUDGET) {
						if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
						lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET);
					}
				}
				else {
					redraw();
					lastRedrawId = $requestAnimationFrame(function() { lastRedrawId = null; }, FRAME_BUDGET);
				}
			}
			finally {
				redrawing = forcing = false;
			}
		};
		m.redraw.strategy = m.prop();
		function redraw() {
			if (computePreRedrawHook) {
				computePreRedrawHook();
				computePreRedrawHook = null;
			}
			forEach(roots, function (root, i) {
				var component = components[i];
				if (controllers[i]) {
					var args = [controllers[i]];
					m.render(root, component.view ? component.view(controllers[i], args) : "");
				}
			});
			//after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
			if (computePostRedrawHook) {
				computePostRedrawHook();
				computePostRedrawHook = null;
			}
			lastRedrawId = null;
			lastRedrawCallTime = new Date;
			m.redraw.strategy("diff");
		}

		var pendingRequests = 0;
		m.startComputation = function() { pendingRequests++; };
		m.endComputation = function() {
			if (pendingRequests > 1) pendingRequests--;
			else {
				pendingRequests = 0;
				m.redraw();
			}
		};

		function endFirstComputation() {
			if (m.redraw.strategy() === "none") {
				pendingRequests--;
				m.redraw.strategy("diff");
			}
			else m.endComputation();
		}

		m.withAttr = function(prop, withAttrCallback, callbackThis) {
			return function(e) {
				e = e || event;
				var currentTarget = e.currentTarget || this;
				var _this = callbackThis || this;
				withAttrCallback.call(_this, prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop));
			};
		};

		//routing
		var modes = {pathname: "", hash: "#", search: "?"};
		var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;
		m.route = function(root, arg1, arg2, vdom) {
			//m.route()
			if (arguments.length === 0) return currentRoute;
			//m.route(el, defaultRoute, routes)
			else if (arguments.length === 3 && isString(arg1)) {
				redirect = function(source) {
					var path = currentRoute = normalizeRoute(source);
					if (!routeByValue(root, arg2, path)) {
						if (isDefaultRoute) throw new Error("Ensure the default route matches one of the routes defined in m.route");
						isDefaultRoute = true;
						m.route(arg1, true);
						isDefaultRoute = false;
					}
				};
				var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
				window[listener] = function() {
					var path = $location[m.route.mode];
					if (m.route.mode === "pathname") path += $location.search;
					if (currentRoute !== normalizeRoute(path)) redirect(path);
				};

				computePreRedrawHook = setScroll;
				window[listener]();
			}
			//config: m.route
			else if (root.addEventListener || root.attachEvent) {
				root.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + vdom.attrs.href;
				if (root.addEventListener) {
					root.removeEventListener("click", routeUnobtrusive);
					root.addEventListener("click", routeUnobtrusive);
				}
				else {
					root.detachEvent("onclick", routeUnobtrusive);
					root.attachEvent("onclick", routeUnobtrusive);
				}
			}
			//m.route(route, params, shouldReplaceHistoryEntry)
			else if (isString(root)) {
				var oldRoute = currentRoute;
				currentRoute = root;
				var args = arg1 || {};
				var queryIndex = currentRoute.indexOf("?");
				var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {};
				for (var i in args) params[i] = args[i];
				var querystring = buildQueryString(params);
				var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute;
				if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

				var shouldReplaceHistoryEntry = (arguments.length === 3 ? arg2 : arg1) === true || oldRoute === root;

				if (window.history.pushState) {
					computePreRedrawHook = setScroll;
					computePostRedrawHook = function() {
						window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
					};
					redirect(modes[m.route.mode] + currentRoute);
				}
				else {
					$location[m.route.mode] = currentRoute;
					redirect(modes[m.route.mode] + currentRoute);
				}
			}
		};
		m.route.param = function(key) {
			if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()");
			if( !key ){
				return routeParams;
			}
			return routeParams[key];
		};
		m.route.mode = "search";
		function normalizeRoute(route) {
			return route.slice(modes[m.route.mode].length);
		}
		function routeByValue(root, router, path) {
			routeParams = {};

			var queryStart = path.indexOf("?");
			if (queryStart !== -1) {
				routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
				path = path.substr(0, queryStart);
			}

			// Get all routes and check if there's
			// an exact match for the current path
			var keys = Object.keys(router);
			var index = keys.indexOf(path);
			if(index !== -1){
				m.mount(root, router[keys [index]]);
				return true;
			}

			for (var route in router) {
				if (route === path) {
					m.mount(root, router[route]);
					return true;
				}

				var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

				if (matcher.test(path)) {
					path.replace(matcher, function() {
						var keys = route.match(/:[^\/]+/g) || [];
						var values = [].slice.call(arguments, 1, -2);
						forEach(keys, function (key, i) {
							routeParams[key.replace(/:|\./g, "")] = decodeURIComponent(values[i]);
						});
						m.mount(root, router[route]);
					});
					return true;
				}
			}
		}
		function routeUnobtrusive(e) {
			e = e || event;

			if (e.ctrlKey || e.metaKey || e.which === 2) return;

			if (e.preventDefault) e.preventDefault();
			else e.returnValue = false;

			var currentTarget = e.currentTarget || e.srcElement;
			var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
			while (currentTarget && currentTarget.nodeName.toUpperCase() !== "A") currentTarget = currentTarget.parentNode;
			m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args);
		}
		function setScroll() {
			if (m.route.mode !== "hash" && $location.hash) $location.hash = $location.hash;
			else window.scrollTo(0, 0);
		}
		function buildQueryString(object, prefix) {
			var duplicates = {};
			var str = [];
			for (var prop in object) {
				var key = prefix ? prefix + "[" + prop + "]" : prop;
				var value = object[prop];

				if (value === null) {
					str.push(encodeURIComponent(key));
				} else if (isObject(value)) {
					str.push(buildQueryString(value, key));
				} else if (isArray(value)) {
					var keys = [];
					duplicates[key] = duplicates[key] || {};
					forEach(value, function (item) {
						if (!duplicates[key][item]) {
							duplicates[key][item] = true;
							keys.push(encodeURIComponent(key) + "=" + encodeURIComponent(item));
						}
					});
					str.push(keys.join("&"));
				} else if (value !== undefined$1) {
					str.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
				}
			}
			return str.join("&");
		}
		function parseQueryString(str) {
			if (str === "" || str == null) return {};
			if (str.charAt(0) === "?") str = str.slice(1);

			var pairs = str.split("&"), params = {};
			forEach(pairs, function (string) {
				var pair = string.split("=");
				var key = decodeURIComponent(pair[0]);
				var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null;
				if (params[key] != null) {
					if (!isArray(params[key])) params[key] = [params[key]];
					params[key].push(value);
				}
				else params[key] = value;
			});

			return params;
		}
		m.route.buildQueryString = buildQueryString;
		m.route.parseQueryString = parseQueryString;

		function reset(root) {
			var cacheKey = getCellCacheKey(root);
			clear(root.childNodes, cellCache[cacheKey]);
			cellCache[cacheKey] = undefined$1;
		}

		m.deferred = function () {
			var deferred = new Deferred();
			deferred.promise = propify(deferred.promise);
			return deferred;
		};
		function propify(promise, initialValue) {
			var prop = m.prop(initialValue);
			promise.then(prop);
			prop.then = function(resolve, reject) {
				return propify(promise.then(resolve, reject), initialValue);
			};
			prop["catch"] = prop.then.bind(null, null);
			prop["finally"] = function(callback) {
				var _callback = function() {return m.deferred().resolve(callback()).promise;};
				return prop.then(function(value) {
					return propify(_callback().then(function() {return value;}), initialValue);
				}, function(reason) {
					return propify(_callback().then(function() {throw new Error(reason);}), initialValue);
				});
			};
			return prop;
		}
		//Promiz.mithril.js | Zolmeister | MIT
		//a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
		//1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
		//2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
		function Deferred(successCallback, failureCallback) {
			var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
			var self = this, state = 0, promiseValue = 0, next = [];

			self.promise = {};

			self.resolve = function(value) {
				if (!state) {
					promiseValue = value;
					state = RESOLVING;

					fire();
				}
				return this;
			};

			self.reject = function(value) {
				if (!state) {
					promiseValue = value;
					state = REJECTING;

					fire();
				}
				return this;
			};

			self.promise.then = function(successCallback, failureCallback) {
				var deferred = new Deferred(successCallback, failureCallback);
				if (state === RESOLVED) {
					deferred.resolve(promiseValue);
				}
				else if (state === REJECTED) {
					deferred.reject(promiseValue);
				}
				else {
					next.push(deferred);
				}
				return deferred.promise
			};

			function finish(type) {
				state = type || REJECTED;
				next.map(function(deferred) {
					state === RESOLVED ? deferred.resolve(promiseValue) : deferred.reject(promiseValue);
				});
			}

			function thennable(then, successCallback, failureCallback, notThennableCallback) {
				if (((promiseValue != null && isObject(promiseValue)) || isFunction(promiseValue)) && isFunction(then)) {
					try {
						// count protects against abuse calls from spec checker
						var count = 0;
						then.call(promiseValue, function(value) {
							if (count++) return;
							promiseValue = value;
							successCallback();
						}, function (value) {
							if (count++) return;
							promiseValue = value;
							failureCallback();
						});
					}
					catch (e) {
						m.deferred.onerror(e);
						promiseValue = e;
						failureCallback();
					}
				} else {
					notThennableCallback();
				}
			}

			function fire() {
				// check if it's a thenable
				var then;
				try {
					then = promiseValue && promiseValue.then;
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					state = REJECTING;
					return fire();
				}

				thennable(then, function() {
					state = RESOLVING;
					fire();
				}, function() {
					state = REJECTING;
					fire();
				}, function() {
					try {
						if (state === RESOLVING && isFunction(successCallback)) {
							promiseValue = successCallback(promiseValue);
						}
						else if (state === REJECTING && isFunction(failureCallback)) {
							promiseValue = failureCallback(promiseValue);
							state = RESOLVING;
						}
					}
					catch (e) {
						m.deferred.onerror(e);
						promiseValue = e;
						return finish();
					}

					if (promiseValue === self) {
						promiseValue = TypeError();
						finish();
					} else {
						thennable(then, function () {
							finish(RESOLVED);
						}, finish, function () {
							finish(state === RESOLVING && RESOLVED);
						});
					}
				});
			}
		}
		m.deferred.onerror = function(e) {
			if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) {
				pendingRequests = 0;
				throw e;
			}
		};

		m.sync = function(args) {
			var method = "resolve";

			function synchronizer(pos, resolved) {
				return function(value) {
					results[pos] = value;
					if (!resolved) method = "reject";
					if (--outstanding === 0) {
						deferred.promise(results);
						deferred[method](results);
					}
					return value;
				};
			}

			var deferred = m.deferred();
			var outstanding = args.length;
			var results = new Array(outstanding);
			if (args.length > 0) {
				forEach(args, function (arg, i) {
					arg.then(synchronizer(i, true), synchronizer(i, false));
				});
			}
			else deferred.resolve([]);

			return deferred.promise;
		};
		function identity(value) { return value; }

		function ajax(options) {
			if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
				var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
				var script = $document.createElement("script");

				window[callbackKey] = function(resp) {
					script.parentNode.removeChild(script);
					options.onload({
						type: "load",
						target: {
							responseText: resp
						}
					});
					window[callbackKey] = undefined$1;
				};

				script.onerror = function() {
					script.parentNode.removeChild(script);

					options.onerror({
						type: "error",
						target: {
							status: 500,
							responseText: JSON.stringify({
								error: "Error making jsonp request"
							})
						}
					});
					window[callbackKey] = undefined$1;

					return false;
				};

				script.onload = function() {
					return false;
				};

				script.src = options.url
					+ (options.url.indexOf("?") > 0 ? "&" : "?")
					+ (options.callbackKey ? options.callbackKey : "callback")
					+ "=" + callbackKey
					+ "&" + buildQueryString(options.data || {});
				$document.body.appendChild(script);
			}
			else {
				var xhr = new window.XMLHttpRequest();
				xhr.open(options.method, options.url, true, options.user, options.password);
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4) {
						if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
						else options.onerror({type: "error", target: xhr});
					}
				};
				if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
					xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				}
				if (options.deserialize === JSON.parse) {
					xhr.setRequestHeader("Accept", "application/json, text/*");
				}
				if (isFunction(options.config)) {
					var maybeXhr = options.config(xhr, options);
					if (maybeXhr != null) xhr = maybeXhr;
				}

				var data = options.method === "GET" || !options.data ? "" : options.data;
				if (data && (!isString(data) && data.constructor !== window.FormData)) {
					throw new Error("Request data should be either be a string or FormData. Check the `serialize` option in `m.request`");
				}
				xhr.send(data);
				return xhr;
			}
		}

		function bindData(xhrOptions, data, serialize) {
			if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
				var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
				var querystring = buildQueryString(data);
				xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "");
			}
			else xhrOptions.data = serialize(data);
			return xhrOptions;
		}

		function parameterizeUrl(url, data) {
			var tokens = url.match(/:[a-z]\w+/gi);
			if (tokens && data) {
				forEach(tokens, function (token) {
					var key = token.slice(1);
					url = url.replace(token, data[key]);
					delete data[key];
				});
			}
			return url;
		}

		m.request = function(xhrOptions) {
			if (xhrOptions.background !== true) m.startComputation();
			var deferred = new Deferred();
			var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
			var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
			var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
			var extract = isJSONP ? function(jsonp) { return jsonp.responseText } : xhrOptions.extract || function(xhr) {
				if (xhr.responseText.length === 0 && deserialize === JSON.parse) {
					return null
				} else {
					return xhr.responseText
				}
			};
			xhrOptions.method = (xhrOptions.method || "GET").toUpperCase();
			xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
			xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
			xhrOptions.onload = xhrOptions.onerror = function(e) {
				try {
					e = e || event;
					var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
					var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
					if (e.type === "load") {
						if (isArray(response) && xhrOptions.type) {
							forEach(response, function (res, i) {
								response[i] = new xhrOptions.type(res);
							});
						} else if (xhrOptions.type) {
							response = new xhrOptions.type(response);
						}
					}

					deferred[e.type === "load" ? "resolve" : "reject"](response);
				} catch (e) {
					m.deferred.onerror(e);
					deferred.reject(e);
				}

				if (xhrOptions.background !== true) m.endComputation();
			};

			ajax(xhrOptions);
			deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
			return deferred.promise;
		};

		//testing API
		m.deps = function(mock) {
			initialize(window = mock || window);
			return window;
		};
		//for internal testing only, do not use `m.deps.factory`
		m.deps.factory = app;

		return m;
	})(typeof window !== "undefined" ? window : {});

	if (module != null && module.exports) module.exports = m;
	});

	// Ensures calls to the wrapped function are spaced by the given delay.
	// Any extra calls are dropped, except the last one.
	function throttle$1(delay, callback) {
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

	var throttle$2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': throttle$1
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(throttle$2);

	var throttle = require$$0.default;

	var ctrl = function (env, domElement) {
	  this.ui = env.ui;
	  this.user = env.user;
	  this.own = env.myUserId === this.user.id;
	  this.dimensions = [].concat.apply(
	    [],
	    this.ui.dimensionCategs.map(function (c) {
	      return c.items;
	    })
	  );
	  this.metrics = [].concat.apply(
	    [],
	    this.ui.metricCategs.map(function (c) {
	      return c.items;
	    })
	  );

	  var findMetric = function (key) {
	    return this.metrics.find(function (x) {
	      return x.key === key;
	    });
	  }.bind(this);

	  var findDimension = function (key) {
	    return this.dimensions.find(function (x) {
	      return x.key === key;
	    });
	  }.bind(this);

	  this.vm = {
	    metric: findMetric(env.initialQuestion.metric),
	    dimension: findDimension(env.initialQuestion.dimension),
	    filters: env.initialQuestion.filters,
	    loading: true,
	    broken: false,
	    answer: null,
	    panel: Object.keys(env.initialQuestion.filters).length ? 'filter' : 'preset',
	  };

	  this.setPanel = function (p) {
	    this.vm.panel = p;
	    mithril.redraw();
	  }.bind(this);

	  var reset = function () {
	    this.vm.metric = this.metrics[0];
	    this.vm.dimension = this.dimensions[0];
	    this.vm.filters = {};
	  }.bind(this);

	  var askQuestion = throttle(
	    1000,
	    function () {
	      if (!this.validCombinationCurrent()) reset();
	      this.pushState();
	      this.vm.loading = true;
	      this.vm.broken = false;
	      mithril.redraw();
	      setTimeout(
	        function () {
	          mithril.request({
	            method: 'post',
	            url: env.postUrl,
	            data: {
	              metric: this.vm.metric.key,
	              dimension: this.vm.dimension.key,
	              filters: this.vm.filters,
	            },
	            deserialize: function (d) {
	              try {
	                return JSON.parse(d);
	              } catch (e) {
	                throw new Error(d);
	              }
	            },
	          }).then(
	            function (answer) {
	              this.vm.answer = answer;
	              this.vm.loading = false;
	            }.bind(this),
	            function () {
	              this.vm.loading = false;
	              this.vm.broken = true;
	              mithril.redraw();
	            }.bind(this)
	          );
	        }.bind(this),
	        1
	      );
	    }.bind(this)
	  );

	  this.makeUrl = function (dKey, mKey, filters) {
	    var url = [env.pageUrl, mKey, dKey].join('/');
	    var filters = Object.keys(filters)
	      .map(function (filterKey) {
	        return filterKey + ':' + filters[filterKey].join(',');
	      })
	      .join('/');
	    if (filters.length) url += '/' + filters;
	    return url;
	  };

	  this.makeCurrentUrl = function () {
	    return this.makeUrl(this.vm.dimension.key, this.vm.metric.key, this.vm.filters);
	  }.bind(this);

	  this.pushState = function () {
	    history.replaceState({}, null, this.makeCurrentUrl());
	  }.bind(this);

	  this.validCombination = function (dimension, metric) {
	    return dimension && metric && (dimension.position === 'game' || metric.position === 'move');
	  };
	  this.validCombinationCurrent = function () {
	    return this.validCombination(this.vm.dimension, this.vm.metric);
	  }.bind(this);

	  this.setMetric = function (key) {
	    this.vm.metric = findMetric(key);
	    if (!this.validCombinationCurrent())
	      this.vm.dimension = this.dimensions.find(
	        function (d) {
	          return this.validCombination(d, this.vm.metric);
	        }.bind(this)
	      );
	    this.vm.panel = 'filter';
	    askQuestion();
	  }.bind(this);

	  this.setDimension = function (key) {
	    this.vm.dimension = findDimension(key);
	    if (!this.validCombinationCurrent())
	      this.vm.metric = this.metrics.find(
	        function (m) {
	          return this.validCombination(this.vm.dimension, m);
	        }.bind(this)
	      );
	    this.vm.panel = 'filter';
	    askQuestion();
	  }.bind(this);

	  this.setFilter = function (dimensionKey, valueKeys) {
	    if (!valueKeys.length) delete this.vm.filters[dimensionKey];
	    else this.vm.filters[dimensionKey] = valueKeys;
	    askQuestion();
	  }.bind(this);

	  this.setQuestion = function (q) {
	    this.vm.dimension = findDimension(q.dimension);
	    this.vm.metric = findMetric(q.metric);
	    this.vm.filters = q.filters;
	    askQuestion();
	    $(domElement).find('select.ms').multipleSelect('open');
	    setTimeout(function () {
	      $(domElement).find('select.ms').multipleSelect('close');
	    }, 1000);
	  }.bind(this);

	  this.clearFilters = function () {
	    if (Object.keys(this.vm.filters).length) {
	      this.vm.filters = {};
	      askQuestion();
	    }
	  }.bind(this);

	  // this.trans = lichess.trans(env.i18n);

	  askQuestion();
	};

	var axis = function (ctrl) {
	  return mithril('div.axis-form', [
	    mithril(
	      'select.ms.metric',
	      {
	        multiple: true,
	        config: function (e, isUpdate) {
	          $(e).multipleSelect({
	            width: '200px',
	            maxHeight: '400px',
	            single: true,
	            onClick: function (v) {
	              ctrl.setMetric(v.value);
	            },
	          });
	        },
	      },
	      ctrl.ui.metricCategs.map(function (categ) {
	        return mithril(
	          'optgroup',
	          {
	            label: categ.name,
	          },
	          categ.items.map(function (y) {
	            return mithril(
	              'option',
	              {
	                title: y.description.replace(/<a[^>]*>[^>]+<\/a[^>]*>/, ''),
	                value: y.key,
	                // disabled: !ctrl.validCombination(ctrl.vm.dimension, y),
	                selected: ctrl.vm.metric.key === y.key,
	              },
	              y.name
	            );
	          })
	        );
	      })
	    ),
	    mithril('span.by', 'by'),
	    mithril(
	      'select.ms.dimension',
	      {
	        multiple: true,
	        config: function (e, isUpdate) {
	          $(e).multipleSelect({
	            width: '200px',
	            maxHeight: '400px',
	            single: true,
	            onClick: function (v) {
	              ctrl.setDimension(v.value);
	            },
	          });
	        },
	      },
	      ctrl.ui.dimensionCategs.map(function (categ) {
	        return mithril(
	          'optgroup',
	          {
	            label: categ.name,
	          },
	          categ.items.map(function (x) {
	            if (x.key === 'period') return;
	            return mithril(
	              'option',
	              {
	                title: x.description.replace(/<a[^>]*>[^>]+<\/a[^>]*>/, ''),
	                value: x.key,
	                // disabled: !ctrl.validCombination(x, ctrl.vm.metric),
	                selected: ctrl.vm.dimension.key === x.key,
	              },
	              x.name
	            );
	          })
	        );
	      })
	    ),
	  ]);
	};

	function select(ctrl) {
	  return function (dimension) {
	    if (dimension.key === 'date') return;
	    var single = dimension.key === 'period';
	    return mithril(
	      'select',
	      {
	        multiple: true,
	        config: function (e, isUpdate) {
	          if (isUpdate && ctrl.vm.filters[dimension.key]) return;
	          $(e).multipleSelect({
	            placeholder: dimension.name,
	            width: '100%',
	            selectAll: false,
	            filter: dimension.key === 'opening',
	            single: single,
	            minimumCountSelected: 10,
	            onClick: function (view) {
	              var values = single ? [view.value] : $(e).multipleSelect('getSelects');
	              ctrl.setFilter(dimension.key, values);
	            },
	          });
	        },
	      },
	      dimension.values.map(function (value) {
	        var selected = ctrl.vm.filters[dimension.key];
	        return mithril(
	          'option',
	          {
	            value: value.key,
	            selected: selected && selected.includes(value.key),
	          },
	          value.name
	        );
	      })
	    );
	  };
	}

	var filters = function (ctrl) {
	  return mithril('div.filters', [
	    mithril(
	      'div.items',
	      ctrl.ui.dimensionCategs.map(function (categ) {
	        return mithril('div.categ.box', [mithril('div.top', categ.name), categ.items.map(select(ctrl))]);
	      })
	    ),
	  ]);
	};

	var presets = function (ctrl) {
	  return mithril(
	    'div.box.presets',
	    ctrl.ui.presets.map(function (p) {
	      var active = ctrl.makeUrl(p.dimension, p.metric, p.filters) === ctrl.makeCurrentUrl();
	      return mithril(
	        'a',
	        {
	          class: 'preset text' + (active ? ' active' : ''),
	          'data-icon': '7',
	          onclick: function () {
	            ctrl.setQuestion(p);
	          },
	        },
	        p.name
	      );
	    })
	  );
	};

	function metricDataTypeFormat(dt) {
	  if (dt === 'seconds') return '{point.y:.1f}';
	  if (dt === 'average') return '{point.y:,.1f}';
	  if (dt === 'percent') return '{point.y:.1f}%';
	  return '{point.y:,.0f}';
	}

	function dimensionDataTypeFormat(dt) {
	  if (dt === 'date') return '{value:%Y-%m-%d}';
	  return '{value}';
	}

	function yAxisTypeFormat(dt) {
	  if (dt === 'seconds') return '{value:.1f}';
	  if (dt === 'average') return '{value:,.1f}';
	  if (dt === 'percent') return '{value:.0f}%';
	  return '{value:,.0f}';
	}

	var colors = {
	  green: '#759900',
	  red: '#dc322f',
	  orange: '#d59120',
	  blue: '#007599',
	};
	var resultColors = {
	  Victory: colors.green,
	  Draw: colors.blue,
	  Defeat: colors.red,
	};

	var theme = (function () {
	  var light = $('body').hasClass('light');
	  var t = {
	    light: light,
	    text: {
	      weak: light ? '#808080' : '#9a9a9a',
	      strong: light ? '#505050' : '#c0c0c0',
	    },
	    line: {
	      weak: light ? '#ccc' : '#404040',
	      strong: light ? '#a0a0a0' : '#606060',
	      fat: '#d85000', // light ? '#a0a0a0' : '#707070'
	    },
	  };
	  if (!light)
	    t.colors = [
	      '#2b908f',
	      '#90ee7e',
	      '#f45b5b',
	      '#7798BF',
	      '#aaeeee',
	      '#ff0066',
	      '#eeaaee',
	      '#55BF3B',
	      '#DF5353',
	      '#7798BF',
	      '#aaeeee',
	    ];
	  return t;
	})();

	function makeChart(el, data) {
	  var sizeSerie = {
	    name: data.sizeSerie.name,
	    data: data.sizeSerie.data,
	    yAxis: 1,
	    type: 'column',
	    stack: 'size',
	    animation: {
	      duration: 300,
	    },
	    color: 'rgba(120,120,120,0.2)',
	  };
	  var valueSeries = data.series.map(function (s) {
	    var c = {
	      name: s.name,
	      data: s.data,
	      yAxis: 0,
	      type: 'column',
	      stack: s.stack,
	      // animation: {
	      //   duration: 300
	      // },
	      dataLabels: {
	        enabled: true,
	        format: s.stack ? '{point.percentage:.0f}%' : metricDataTypeFormat(s.dataType),
	      },
	      tooltip: {
	        // headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
	        pointFormat: (function () {
	          return (
	            '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>' +
	            metricDataTypeFormat(s.dataType) +
	            '</b><br/>'
	          );
	        })(),
	        shared: true,
	      },
	    };
	    if (data.valueYaxis.name === 'Game result') c.color = resultColors[s.name];
	    return c;
	  });
	  var chartConf = {
	    chart: {
	      type: 'column',
	      alignTicks: data.valueYaxis.dataType !== 'percent',
	      spacing: [20, 7, 20, 5],
	      backgroundColor: null,
	      borderWidth: 0,
	      borderRadius: 0,
	      plotBackgroundColor: null,
	      plotShadow: false,
	      plotBorderWidth: 0,
	      style: {
	        font: "12px 'Noto Sans', 'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif",
	      },
	    },
	    title: {
	      text: null,
	    },
	    xAxis: {
	      type: data.xAxis.dataType === 'date' ? 'datetime' : 'linear',
	      categories: data.xAxis.categories.map(function (v) {
	        return data.xAxis.dataType === 'date' ? v * 1000 : v;
	      }),
	      crosshair: true,
	      labels: {
	        format: dimensionDataTypeFormat(data.xAxis.dataType),
	        style: {
	          color: theme.text.weak,
	          fontSize: 9,
	        },
	      },
	      title: {
	        style: {
	          color: theme.text.weak,
	          fontSize: 9,
	        },
	      },
	      gridLineColor: theme.line.weak,
	      lineColor: theme.line.strong,
	      tickColor: theme.line.strong,
	    },
	    yAxis: [data.valueYaxis, data.sizeYaxis].map(function (a, i) {
	      var isPercent = data.valueYaxis.dataType === 'percent';
	      var isSize = i % 2 === 1;
	      var c = {
	        opposite: isSize,
	        min: !isSize && isPercent ? 0 : undefined,
	        max: !isSize && isPercent ? 100 : undefined,
	        labels: {
	          format: yAxisTypeFormat(a.dataType),
	          style: {
	            color: theme.text.weak,
	            fontSize: 9,
	          },
	        },
	        title: {
	          text: i === 1 ? a.name : false,
	          style: {
	            color: theme.text.weak,
	            fontSize: 9,
	          },
	        },
	        gridLineColor: theme.line.weak,
	      };
	      if (isSize && isPercent) {
	        c.minorGridLineWidth = 0;
	        c.gridLineWidth = 0;
	        c.alternateGridColor = null;
	      }
	      return c;
	    }),
	    plotOptions: {
	      column: {
	        animation: {
	          duration: 300,
	        },
	        stacking: 'normal',
	        dataLabels: {
	          color: theme.text.strong,
	        },
	        marker: {
	          lineColor: theme.text.weak,
	        },
	        borderColor: theme.line.strong,
	      },
	    },
	    series: valueSeries.concat(sizeSerie),
	    credits: {
	      enabled: false,
	    },
	    labels: {
	      style: {
	        color: theme.text.strong,
	      },
	    },
	    tooltip: {
	      backgroundColor: {
	        linearGradient: {
	          x1: 0,
	          y1: 0,
	          x2: 0,
	          y2: 1,
	        },
	        stops: theme.light
	          ? [
	              [0, 'rgba(200, 200, 200, .8)'],
	              [1, 'rgba(250, 250, 250, .8)'],
	            ]
	          : [
	              [0, 'rgba(56, 56, 56, .8)'],
	              [1, 'rgba(16, 16, 16, .8)'],
	            ],
	      },
	      style: {
	        fontWeight: 'bold',
	        color: theme.text.strong,
	      },
	    },
	    legend: {
	      enabled: true,
	      itemStyle: {
	        color: theme.text.weak,
	      },
	      itemHiddenStyle: {
	        color: theme.text.weak,
	      },
	    },
	  };
	  if (theme.colors) chartConf.colors = theme.colors;
	  Highcharts.chart(el, chartConf);
	}

	function empty(txt) {
	  return mithril('div.chart.empty', [mithril('i[data-icon=7]'), txt]);
	}

	var chart = function (ctrl) {
	  if (!ctrl.validCombinationCurrent()) return empty('Invalid dimension/metric combination');
	  if (!ctrl.vm.answer.series.length) return empty('No data. Try widening or clearing the filters.');
	  return [
	    mithril('div.chart', {
	      config: function (el) {
	        if (ctrl.vm.loading) return;
	        makeChart(el, ctrl.vm.answer);
	      },
	    }),
	    ctrl.vm.loading ? mithril.trust(lichess.spinnerHtml) : null,
	  ];
	};

	var numeral = createCommonjsModule(function (module) {
	/*! @preserve
	 * numeral.js
	 * version : 1.5.6
	 * author : Adam Draper
	 * license : MIT
	 * http://adamwdraper.github.com/Numeral-js/
	 */

	(function() {

	    /************************************
	        Variables
	    ************************************/

	    var numeral,
	        VERSION = '1.5.6',
	        // internal storage for language config files
	        languages = {},
	        defaults = {
	            currentLanguage: 'en',
	            zeroFormat: null,
	            nullFormat: null,
	            defaultFormat: '0,0'
	        },
	        options = {
	            currentLanguage: defaults.currentLanguage,
	            zeroFormat: defaults.zeroFormat,
	            nullFormat: defaults.nullFormat,
	            defaultFormat: defaults.defaultFormat
	        },
	        byteSuffixes = {
	            bytes: ['B','KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
	            iec: ['B','KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
	        };


	    /************************************
	        Constructors
	    ************************************/


	    // Numeral prototype object
	    function Numeral(number) {
	        this._value = number;
	    }

	    /**
	     * Implementation of toFixed() that treats floats more like decimals
	     *
	     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
	     * problems for accounting- and finance-related software.
	     */
	    function toFixed (value, maxDecimals, roundingFunction, optionals) {
	        var splitValue = value.toString().split('.'),
	            minDecimals = maxDecimals - (optionals || 0),
	            boundedPrecision,
	            optionalsRegExp,
	            power,
	            output;

	        // Use the smallest precision value possible to avoid errors from floating point representation
	        if (splitValue.length === 2) {
	          boundedPrecision = Math.min(Math.max(splitValue[1].length, minDecimals), maxDecimals);
	        } else {
	          boundedPrecision = minDecimals;
	        }

	        power = Math.pow(10, boundedPrecision);

	        //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
	        // Multiply up by precision, round accurately, then divide and use native toFixed():
	        output = (roundingFunction(value * power) / power).toFixed(boundedPrecision);

	        if (optionals > maxDecimals - boundedPrecision) {
	            optionalsRegExp = new RegExp('\\.?0{1,' + (optionals - (maxDecimals - boundedPrecision)) + '}$');
	            output = output.replace(optionalsRegExp, '');
	        }

	        return output;
	    }

	    /************************************
	        Formatting
	    ************************************/

	    // determine what type of formatting we need to do
	    function formatNumeral(n, format, roundingFunction) {
	        var output;

	        if (n._value === 0 && options.zeroFormat !== null) {
	            output = options.zeroFormat;
	        } else if (n._value === null && options.nullFormat !== null) {
	            output = options.nullFormat;
	        } else {
	            // figure out what kind of format we are dealing with
	            if (format.indexOf('$') > -1) {
	                output = formatCurrency(n, format, roundingFunction);
	            } else if (format.indexOf('%') > -1) {
	                output = formatPercentage(n, format, roundingFunction);
	            } else if (format.indexOf(':') > -1) {
	                output = formatTime(n);
	            } else if (format.indexOf('b') > -1 || format.indexOf('ib') > -1) {
	                output = formatBytes(n, format, roundingFunction);
	            } else if (format.indexOf('o') > -1) {
	                output = formatOrdinal(n, format, roundingFunction);
	            } else {
	                output = formatNumber(n._value, format, roundingFunction);
	            }
	        }

	        return output;
	    }

	    function formatCurrency(n, format, roundingFunction) {
	        var symbolIndex = format.indexOf('$'),
	            openParenIndex = format.indexOf('('),
	            minusSignIndex = format.indexOf('-'),
	            space = '',
	            spliceIndex,
	            output;

	        // check for space before or after currency
	        if (format.indexOf(' $') > -1) {
	            space = ' ';
	            format = format.replace(' $', '');
	        } else if (format.indexOf('$ ') > -1) {
	            space = ' ';
	            format = format.replace('$ ', '');
	        } else {
	            format = format.replace('$', '');
	        }

	        // format the number
	        output = formatNumber(n._value, format, roundingFunction);

	        // position the symbol
	        if (symbolIndex <= 1) {
	            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
	                output = output.split('');
	                spliceIndex = 1;
	                if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex) {
	                    // the symbol appears before the "(" or "-"
	                    spliceIndex = 0;
	                }
	                output.splice(spliceIndex, 0, languages[options.currentLanguage].currency.symbol + space);
	                output = output.join('');
	            } else {
	                output = languages[options.currentLanguage].currency.symbol + space + output;
	            }
	        } else {
	            if (output.indexOf(')') > -1) {
	                output = output.split('');
	                output.splice(-1, 0, space + languages[options.currentLanguage].currency.symbol);
	                output = output.join('');
	            } else {
	                output = output + space + languages[options.currentLanguage].currency.symbol;
	            }
	        }

	        return output;
	    }

	    function formatPercentage(n, format, roundingFunction) {
	        var space = '',
	            output,
	            value = n._value * 100;

	        // check for space before %
	        if (format.indexOf(' %') > -1) {
	            space = ' ';
	            format = format.replace(' %', '');
	        } else {
	            format = format.replace('%', '');
	        }

	        output = formatNumber(value, format, roundingFunction);

	        if (output.indexOf(')') > -1) {
	            output = output.split('');
	            output.splice(-1, 0, space + '%');
	            output = output.join('');
	        } else {
	            output = output + space + '%';
	        }

	        return output;
	    }

	    function formatBytes(n, format, roundingFunction) {
	        var output,
	            suffixes = format.indexOf('ib') > -1 ? byteSuffixes.iec : byteSuffixes.bytes,
	            value = n._value,
	            suffix = '',
	            power,
	            min,
	            max;

	        // check for space before
	        if (format.indexOf(' b') > -1 || format.indexOf(' ib') > -1) {
	            suffix = ' ';
	            format = format.replace(' ib', '').replace(' b', '');
	        } else {
	            format = format.replace('ib', '').replace('b', '');
	        }

	        for (power = 0; power <= suffixes.length; power++) {
	            min = Math.pow(1024, power);
	            max = Math.pow(1024, power + 1);

	            if (value === null || value === 0 || value >= min && value < max) {
	                suffix += suffixes[power];

	                if (min > 0) {
	                    value = value / min;
	                }

	                break;
	            }
	        }

	        output = formatNumber(value, format, roundingFunction);

	        return output + suffix;
	    }

	    function formatOrdinal(n, format, roundingFunction) {
	        var output,
	            ordinal = '';

	        // check for space before
	        if (format.indexOf(' o') > -1) {
	            ordinal = ' ';
	            format = format.replace(' o', '');
	        } else {
	            format = format.replace('o', '');
	        }

	        ordinal += languages[options.currentLanguage].ordinal(n._value);

	        output = formatNumber(n._value, format, roundingFunction);

	        return output + ordinal;
	    }

	    function formatTime(n) {
	        var hours = Math.floor(n._value / 60 / 60),
	            minutes = Math.floor((n._value - (hours * 60 * 60)) / 60),
	            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));

	        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
	    }

	    function formatNumber(value, format, roundingFunction) {
	        var negP = false,
	            signed = false,
	            optDec = false,
	            abbr = '',
	            abbrK = false, // force abbreviation to thousands
	            abbrM = false, // force abbreviation to millions
	            abbrB = false, // force abbreviation to billions
	            abbrT = false, // force abbreviation to trillions
	            abbrForce = false, // force abbreviation
	            abs,
	            w,
	            precision,
	            thousands,
	            d = '',
	            neg = false;

	        if (value === null) {
	            value = 0;
	        }

	        abs = Math.abs(value);

	        // see if we should use parentheses for negative number or if we should prefix with a sign
	        // if both are present we default to parentheses
	        if (format.indexOf('(') > -1) {
	            negP = true;
	            format = format.slice(1, -1);
	        } else if (format.indexOf('+') > -1) {
	            signed = true;
	            format = format.replace(/\+/g, '');
	        }

	        // see if abbreviation is wanted
	        if (format.indexOf('a') > -1) {
	            // check if abbreviation is specified
	            abbrK = format.indexOf('aK') >= 0;
	            abbrM = format.indexOf('aM') >= 0;
	            abbrB = format.indexOf('aB') >= 0;
	            abbrT = format.indexOf('aT') >= 0;
	            abbrForce = abbrK || abbrM || abbrB || abbrT;

	            // check for space before abbreviation
	            if (format.indexOf(' a') > -1) {
	                abbr = ' ';
	            }

	            format = format.replace(new RegExp(abbr + 'a[KMBT]?'), '');

	            if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
	                // trillion
	                abbr = abbr + languages[options.currentLanguage].abbreviations.trillion;
	                value = value / Math.pow(10, 12);
	            } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
	                // billion
	                abbr = abbr + languages[options.currentLanguage].abbreviations.billion;
	                value = value / Math.pow(10, 9);
	            } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
	                // million
	                abbr = abbr + languages[options.currentLanguage].abbreviations.million;
	                value = value / Math.pow(10, 6);
	            } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
	                // thousand
	                abbr = abbr + languages[options.currentLanguage].abbreviations.thousand;
	                value = value / Math.pow(10, 3);
	            }
	        }


	        if (format.indexOf('[.]') > -1) {
	            optDec = true;
	            format = format.replace('[.]', '.');
	        }

	        w = value.toString().split('.')[0];
	        precision = format.split('.')[1];
	        thousands = format.indexOf(',');

	        if (precision) {
	            if (precision.indexOf('[') > -1) {
	                precision = precision.replace(']', '');
	                precision = precision.split('[');
	                d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
	            } else {
	                d = toFixed(value, precision.length, roundingFunction);
	            }

	            w = d.split('.')[0];

	            if (d.indexOf('.') > -1) {
	                d = languages[options.currentLanguage].delimiters.decimal + d.split('.')[1];
	            } else {
	                d = '';
	            }

	            if (optDec && Number(d.slice(1)) === 0) {
	                d = '';
	            }
	        } else {
	            w = toFixed(value, null, roundingFunction);
	        }

	        // format number
	        if (w.indexOf('-') > -1) {
	            w = w.slice(1);
	            neg = true;
	        }

	        if (thousands > -1) {
	            w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[options.currentLanguage].delimiters.thousands);
	        }

	        if (format.indexOf('.') === 0) {
	            w = '';
	        }

	        return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((abbr) ? abbr : '') + ((negP && neg) ? ')' : '');
	    }


	    /************************************
	        Unformatting
	    ************************************/

	    // revert to number
	    function unformatNumeral(n, string) {
	        var stringOriginal = string,
	            thousandRegExp,
	            millionRegExp,
	            billionRegExp,
	            trillionRegExp,
	            bytesMultiplier = false,
	            power,
	            value;

	        if (string.indexOf(':') > -1) {
	            value = unformatTime(string);
	        } else {
	            if (string === options.zeroFormat || string === options.nullFormat) {
	                value = 0;
	            } else {
	                if (languages[options.currentLanguage].delimiters.decimal !== '.') {
	                    string = string.replace(/\./g, '').replace(languages[options.currentLanguage].delimiters.decimal, '.');
	                }

	                // see if abbreviations are there so that we can multiply to the correct number
	                thousandRegExp = new RegExp('[^a-zA-Z]' + languages[options.currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[options.currentLanguage].currency.symbol + ')?(?:\\))?)?$');
	                millionRegExp = new RegExp('[^a-zA-Z]' + languages[options.currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[options.currentLanguage].currency.symbol + ')?(?:\\))?)?$');
	                billionRegExp = new RegExp('[^a-zA-Z]' + languages[options.currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[options.currentLanguage].currency.symbol + ')?(?:\\))?)?$');
	                trillionRegExp = new RegExp('[^a-zA-Z]' + languages[options.currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[options.currentLanguage].currency.symbol + ')?(?:\\))?)?$');

	                // see if bytes are there so that we can multiply to the correct number
	                for (power = 1; power <= byteSuffixes.bytes.length; power++) {
	                    bytesMultiplier = ((string.indexOf(byteSuffixes.bytes[power]) > -1) || (string.indexOf(byteSuffixes.iec[power]) > -1))? Math.pow(1024, power) : false;

	                    if (bytesMultiplier) {
	                        break;
	                    }
	                }

	                // do some math to create our number
	                value = bytesMultiplier ? bytesMultiplier : 1;
	                value *= stringOriginal.match(thousandRegExp) ? Math.pow(10, 3) : 1;
	                value *= stringOriginal.match(millionRegExp) ? Math.pow(10, 6) : 1;
	                value *= stringOriginal.match(billionRegExp) ? Math.pow(10, 9) : 1;
	                value *= stringOriginal.match(trillionRegExp) ? Math.pow(10, 12) : 1;
	                // check for percentage
	                value *= string.indexOf('%') > -1 ? 0.01 : 1;
	                // check for negative number
	                value *= (string.split('-').length + Math.min(string.split('(').length - 1, string.split(')').length - 1)) % 2 ? 1 : -1;
	                // remove non numbers
	                value *= Number(string.replace(/[^0-9\.]+/g, ''));
	                // round if we are talking about bytes
	                value = bytesMultiplier ? Math.ceil(value) : value;
	            }
	        }

	        n._value = value;

	        return n._value;
	    }
	    function unformatTime(string) {
	        var timeArray = string.split(':'),
	            seconds = 0;
	        // turn hours and minutes into seconds and add them all up
	        if (timeArray.length === 3) {
	            // hours
	            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
	            // minutes
	            seconds = seconds + (Number(timeArray[1]) * 60);
	            // seconds
	            seconds = seconds + Number(timeArray[2]);
	        } else if (timeArray.length === 2) {
	            // minutes
	            seconds = seconds + (Number(timeArray[0]) * 60);
	            // seconds
	            seconds = seconds + Number(timeArray[1]);
	        }
	        return Number(seconds);
	    }


	    /************************************
	        Top Level Functions
	    ************************************/

	    numeral = function(input) {
	        if (numeral.isNumeral(input)) {
	            input = input.value();
	        } else if (input === 0 || typeof input === 'undefined') {
	            input = 0;
	        } else if (input === null) {
	            input = null;
	        } else if (!Number(input)) {
	            input = numeral.fn.unformat(input);
	        } else {
	            input = Number(input);
	        }

	        return new Numeral(input);
	    };

	    // version number
	    numeral.version = VERSION;

	    // compare numeral object
	    numeral.isNumeral = function(obj) {
	        return obj instanceof Numeral;
	    };


	    // This function will load languages and then set the global language.  If
	    // no arguments are passed in, it will simply return the current global
	    // language key.
	    numeral.language = function(key, values) {
	        if (!key) {
	            return options.currentLanguage;
	        }

	        key = key.toLowerCase();

	        if (key && !values) {
	            if (!languages[key]) {
	                throw new Error('Unknown language : ' + key);
	            }

	            options.currentLanguage = key;
	        }

	        if (values || !languages[key]) {
	            loadLanguage(key, values);
	        }

	        return numeral;
	    };

	    numeral.reset = function() {
	        for (var property in defaults) {
	            options[property] = defaults[property];
	        }
	    };

	    // This function provides access to the loaded language data.  If
	    // no arguments are passed in, it will simply return the current
	    // global language object.
	    numeral.languageData = function(key) {
	        if (!key) {
	            return languages[options.currentLanguage];
	        }

	        if (!languages[key]) {
	            throw new Error('Unknown language : ' + key);
	        }

	        return languages[key];
	    };

	    numeral.language('en', {
	        delimiters: {
	            thousands: ',',
	            decimal: '.'
	        },
	        abbreviations: {
	            thousand: 'k',
	            million: 'm',
	            billion: 'b',
	            trillion: 't'
	        },
	        ordinal: function(number) {
	            var b = number % 10;
	            return (~~(number % 100 / 10) === 1) ? 'th' :
	                (b === 1) ? 'st' :
	                (b === 2) ? 'nd' :
	                (b === 3) ? 'rd' : 'th';
	        },
	        currency: {
	            symbol: '$'
	        }
	    });

	    numeral.zeroFormat = function(format) {
	        options.zeroFormat = typeof(format) === 'string' ? format : null;
	    };

	    numeral.nullFormat = function (format) {
	        options.nullFormat = typeof(format) === 'string' ? format : null;
	    };

	    numeral.defaultFormat = function(format) {
	        options.defaultFormat = typeof(format) === 'string' ? format : '0.0';
	    };

	    numeral.validate = function(val, culture) {
	        var _decimalSep,
	            _thousandSep,
	            _currSymbol,
	            _valArray,
	            _abbrObj,
	            _thousandRegEx,
	            languageData,
	            temp;

	        //coerce val to string
	        if (typeof val !== 'string') {
	            val += '';
	            if (console.warn) {
	                console.warn('Numeral.js: Value is not string. It has been co-erced to: ', val);
	            }
	        }

	        //trim whitespaces from either sides
	        val = val.trim();

	        //if val is just digits return true
	        if ( !! val.match(/^\d+$/)) {
	            return true;
	        }

	        //if val is empty return false
	        if (val === '') {
	            return false;
	        }

	        //get the decimal and thousands separator from numeral.languageData
	        try {
	            //check if the culture is understood by numeral. if not, default it to current language
	            languageData = numeral.languageData(culture);
	        } catch (e) {
	            languageData = numeral.languageData(numeral.language());
	        }

	        //setup the delimiters and currency symbol based on culture/language
	        _currSymbol = languageData.currency.symbol;
	        _abbrObj = languageData.abbreviations;
	        _decimalSep = languageData.delimiters.decimal;
	        if (languageData.delimiters.thousands === '.') {
	            _thousandSep = '\\.';
	        } else {
	            _thousandSep = languageData.delimiters.thousands;
	        }

	        // validating currency symbol
	        temp = val.match(/^[^\d]+/);
	        if (temp !== null) {
	            val = val.substr(1);
	            if (temp[0] !== _currSymbol) {
	                return false;
	            }
	        }

	        //validating abbreviation symbol
	        temp = val.match(/[^\d]+$/);
	        if (temp !== null) {
	            val = val.slice(0, -1);
	            if (temp[0] !== _abbrObj.thousand && temp[0] !== _abbrObj.million && temp[0] !== _abbrObj.billion && temp[0] !== _abbrObj.trillion) {
	                return false;
	            }
	        }

	        _thousandRegEx = new RegExp(_thousandSep + '{2}');

	        if (!val.match(/[^\d.,]/g)) {
	            _valArray = val.split(_decimalSep);
	            if (_valArray.length > 2) {
	                return false;
	            } else {
	                if (_valArray.length < 2) {
	                    return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx));
	                } else {
	                    if (_valArray[0].length === 1) {
	                        return ( !! _valArray[0].match(/^\d+$/) && !_valArray[0].match(_thousandRegEx) && !! _valArray[1].match(/^\d+$/));
	                    } else {
	                        return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx) && !! _valArray[1].match(/^\d+$/));
	                    }
	                }
	            }
	        }

	        return false;
	    };

	    /************************************
	        Helpers
	    ************************************/

	    function loadLanguage(key, values) {
	        languages[key] = values;
	    }

	    /************************************
	        Floating-point helpers
	    ************************************/

	    // The floating-point helper functions and implementation
	    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

	    // Production steps of ECMA-262, Edition 5, 15.4.4.21
	    // Reference: http://es5.github.io/#x15.4.4.21
	    if (!Array.prototype.reduce) {
	        Array.prototype.reduce = function(callback /*, initialValue*/) {
	            if (this === null) {
	                throw new TypeError('Array.prototype.reduce called on null or undefined');
	            }

	            if (typeof callback !== 'function') {
	                throw new TypeError(callback + ' is not a function');
	            }

	            var t = Object(this), len = t.length >>> 0, k = 0, value;

	            if (arguments.length === 2) {
	                value = arguments[1];
	            } else {
	                while (k < len && !(k in t)) {
	                    k++;
	                }

	                if (k >= len) {
	                    throw new TypeError('Reduce of empty array with no initial value');
	                }

	                value = t[k++];
	            }
	            for (; k < len; k++) {
	                if (k in t) {
	                    value = callback(value, t[k], k, t);
	                }
	            }
	            return value;
	        };
	    }

	    /**
	     * Computes the multiplier necessary to make x >= 1,
	     * effectively eliminating miscalculations caused by
	     * finite precision.
	     */
	    function multiplier(x) {
	        var parts = x.toString().split('.');
	        if (parts.length < 2) {
	            return 1;
	        }
	        return Math.pow(10, parts[1].length);
	    }

	    /**
	     * Given a variable number of arguments, returns the maximum
	     * multiplier that must be used to normalize an operation involving
	     * all of them.
	     */
	    function correctionFactor() {
	        var args = Array.prototype.slice.call(arguments);
	        return args.reduce(function(prev, next) {
	            var mp = multiplier(prev),
	                mn = multiplier(next);
	            return mp > mn ? mp : mn;
	        }, -Infinity);
	    }


	    /************************************
	        Numeral Prototype
	    ************************************/


	    numeral.fn = Numeral.prototype = {

	        clone: function() {
	            return numeral(this);
	        },

	        format: function (inputString, roundingFunction) {
	            return formatNumeral(this,
	                inputString ? inputString : options.defaultFormat,
	                roundingFunction !== undefined ? roundingFunction : Math.round
	            );
	        },

	        unformat: function (inputString) {
	            if (Object.prototype.toString.call(inputString) === '[object Number]') {
	                return inputString;
	            }

	            return unformatNumeral(this, inputString ? inputString : options.defaultFormat);
	        },

	        value: function() {
	            return this._value;
	        },

	        valueOf: function() {
	            return this._value;
	        },

	        set: function(value) {
	            this._value = Number(value);
	            return this;
	        },

	        add: function(value) {
	            var corrFactor = correctionFactor.call(null, this._value, value);

	            function cback(accum, curr, currI, O) {
	                return accum + corrFactor * curr;
	            }
	            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
	            return this;
	        },

	        subtract: function(value) {
	            var corrFactor = correctionFactor.call(null, this._value, value);

	            function cback(accum, curr, currI, O) {
	                return accum - corrFactor * curr;
	            }
	            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;
	            return this;
	        },

	        multiply: function(value) {
	            function cback(accum, curr, currI, O) {
	                var corrFactor = correctionFactor(accum, curr);
	                return (accum * corrFactor) * (curr * corrFactor) /
	                    (corrFactor * corrFactor);
	            }
	            this._value = [this._value, value].reduce(cback, 1);
	            return this;
	        },

	        divide: function(value) {
	            function cback(accum, curr, currI, O) {
	                var corrFactor = correctionFactor(accum, curr);
	                return (accum * corrFactor) / (curr * corrFactor);
	            }
	            this._value = [this._value, value].reduce(cback);
	            return this;
	        },

	        difference: function(value) {
	            return Math.abs(numeral(this._value).subtract(value).value());
	        }

	    };

	    /************************************
	        Exposing Numeral
	    ************************************/

	    // CommonJS module is defined
	    if (module.exports) {
	        module.exports = numeral;
	    }

	    /*global ender:false */
	    if (typeof ender === 'undefined') {
	        // here, `this` means `window` in the browser, or `global` on the server
	        // add `numeral` as a global object via a string identifier,
	        // for Closure Compiler 'advanced' mode
	        this['numeral'] = numeral;
	    }
	}).call(commonjsGlobal);
	});

	function formatNumber(dt, n) {
	  if (dt === 'percent') n = n / 100;
	  var f;
	  if (dt === 'seconds') f = '0.00';
	  else if (dt === 'average') f = '0.00';
	  else if (dt === 'percent') f = '0.0%';
	  else f = '0,0';
	  return numeral(n).format(f);
	}

	function formatSerieName(dt, n) {
	  if (dt === 'date') return new Date(n * 1000).toLocaleDateString();
	  return n;
	}

	var table = {
	  vert: function (ctrl) {
	    var answer = ctrl.vm.answer;
	    if (!answer) return null;
	    return mithril('table.slist', [
	      mithril(
	        'thead',
	        mithril('tr', [
	          mithril('th', answer.xAxis.name),
	          answer.series.map(function (serie) {
	            return mithril('th', serie.name);
	          }),
	          mithril('th', answer.sizeYaxis.name),
	        ])
	      ),
	      mithril(
	        'tbody',
	        answer.xAxis.categories.map(function (c, i) {
	          return mithril('tr', [
	            mithril('th', formatSerieName(answer.xAxis.dataType, c)),
	            answer.series.map(function (serie) {
	              return mithril('td.data', formatNumber(serie.dataType, serie.data[i]));
	            }),
	            mithril('td.size', formatNumber(answer.sizeSerie.dataType, answer.sizeSerie.data[i])),
	          ]);
	        })
	      ),
	    ]);
	  },
	};

	var help = function (ctrl) {
	  return mithril('div.help.box', [
	    mithril('div.top', 'Definitions'),
	    mithril(
	      'div.content',
	      ['metric', 'dimension'].map(function (type) {
	        var data = ctrl.vm[type];
	        return mithril('section.' + type, [mithril('h3', data.name), mithril('p', mithril.trust(data.description))]);
	      })
	    ),
	  ]);
	};

	var shareStates = ['nobody', 'friends only', 'everybody'];

	var info = function (ctrl) {
	  var shareText = 'Shared with ' + shareStates[ctrl.user.shareId] + '.';
	  return mithril('div.info.box', [
	    mithril('div.top', [
	      mithril(
	        'a.username.user-link.insight-ulpt',
	        {
	          href: '/@/' + ctrl.user.name,
	        },
	        ctrl.user.name
	      ),
	    ]),
	    mithril('div.content', [
	      mithril('p', ['Insights over ', mithril('strong', ctrl.user.nbGames), ' rated games.']),
	      mithril(
	        'p.share',
	        ctrl.own
	          ? mithril(
	              'a',
	              {
	                href: '/account/preferences/privacy',
	                target: '_blank',
	                rel: 'noopener',
	              },
	              shareText
	            )
	          : shareText
	      ),
	    ]),
	    mithril('div.refresh', {
	      config: function (e, isUpdate) {
	        if (isUpdate) return;
	        var $ref = $('.insight-stale');
	        if ($ref.length) {
	          $(e).html($ref.show());
	          lichess.refreshInsightForm();
	        }
	      },
	    }),
	  ]);
	};

	function miniGame(game) {
	  return mithril(
	    'a',
	    {
	      key: game.id,
	      href: `/${game.id}/${game.color}`,
	    },
	    [
	      mithril('span.mini-board.is2d', {
	        'data-state': `${game.fen},${game.color},${game.lastMove}`,
	        config(el, isUpdate) {
	          if (!isUpdate) lichess.miniBoard.init(el);
	        },
	      }),
	      mithril('span.vstext', [
	        mithril('span.vstext__pl', [
	          game.user1.name,
	          mithril('br'),
	          game.user1.title ? game.user1.title + ' ' : '',
	          game.user1.rating,
	        ]),
	        mithril('span.vstext__op', [
	          game.user2.name,
	          mithril('br'),
	          game.user2.rating,
	          game.user2.title ? ' ' + game.user2.title : '',
	        ]),
	      ]),
	    ]
	  );
	}

	var boards = function (ctrl) {
	  if (!ctrl.vm.answer) return;

	  return mithril('div.game-sample.box', [
	    mithril('div.top', 'Some of the games used to generate this insight'),
	    mithril('div.boards', ctrl.vm.answer.games.map(miniGame)),
	  ]);
	};

	function cache(view, dataToKey) {
	  var prev = null;
	  return function (data) {
	    var key = dataToKey(data);
	    if (prev === key)
	      return {
	        subtree: 'retain',
	      };
	    prev = key;
	    return view(data);
	  };
	}

	var renderMain = cache(
	  function (ctrl) {
	    if (ctrl.vm.broken)
	      return mithril('div.broken', [mithril('i[data-icon=j]'), 'Insights are unavailable.', mithril('br'), 'Please try again later.']);
	    if (!ctrl.vm.answer) return;
	    return mithril('div', [chart(ctrl), table.vert(ctrl), boards(ctrl)]);
	  },
	  function (ctrl) {
	    var q = ctrl.vm.answer ? ctrl.vm.answer.question : null;
	    return q ? ctrl.makeUrl(q.dimension, q.metric, q.filters) : ctrl.vm.broken;
	  }
	);

	var view = function (ctrl) {
	  return mithril(
	    'div',
	    {
	      class: ctrl.vm.loading ? 'loading' : 'ready',
	    },
	    [
	      mithril('div.left-side', [
	        info(ctrl),
	        mithril('div.panel-tabs', [
	          mithril(
	            'a[data-panel="preset"]',
	            {
	              class: 'tab preset' + (ctrl.vm.panel === 'preset' ? ' active' : ''),
	              onclick: function () {
	                ctrl.setPanel('preset');
	              },
	            },
	            'Presets'
	          ),
	          mithril(
	            'a[data-panel="filter"]',
	            {
	              class: 'tab filter' + (ctrl.vm.panel === 'filter' ? ' active' : ''),
	              onclick: function () {
	                ctrl.setPanel('filter');
	              },
	            },
	            'Filters'
	          ),
	          Object.keys(ctrl.vm.filters).length
	            ? mithril(
	                'a.clear',
	                {
	                  title: 'Clear all filters',
	                  'data-icon': 'L',
	                  onclick: ctrl.clearFilters,
	                },
	                'CLEAR'
	              )
	            : null,
	        ]),
	        ctrl.vm.panel === 'filter' ? filters(ctrl) : null,
	        ctrl.vm.panel === 'preset' ? presets(ctrl) : null,
	        help(ctrl),
	      ]),
	      mithril('header', [
	        axis(ctrl),
	        mithril(
	          'h2',
	          {
	            class: 'text',
	            'data-icon': '7',
	          },
	          'Chess Insights'
	        ),
	      ]),
	      mithril('div.insight__main.box', renderMain(ctrl)),
	    ]
	  );
	};

	var main = function (element, opts) {
	  var controller = new ctrl(opts, element);

	  mithril.module(element, {
	    controller: function () {
	      return controller;
	    },
	    view: view,
	  });

	  return controller;
	};

	return main;

}());
