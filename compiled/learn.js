var LichessLearn = (function () {
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

	var mithril$1 = createCommonjsModule(function (module) {
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

	var util$2 = {
	  toLevel: function (l, it) {
	    l.id = it + 1;
	    if (!l.color) l.color = / w /.test(l.fen) ? 'white' : 'black';
	    if (l.apples) l.detectCapture = false;
	    else l.apples = [];
	    if (typeof l.detectCapture === 'undefined') l.detectCapture = 'unprotected';
	    if (l.fen.split(' ').length === 4) l.fen += ' 0 1';
	    return l;
	  },
	  assetUrl: $('body').data('asset-url') + '/assets/',
	  roleToSan: {
	    pawn: 'P',
	    knight: 'N',
	    bishop: 'B',
	    rook: 'R',
	    queen: 'Q',
	  },
	  arrow: function (vector, brush) {
	    return {
	      brush: brush || 'paleGreen',
	      orig: vector.slice(0, 2),
	      dest: vector.slice(2, 4),
	    };
	  },
	  circle: function (key, brush) {
	    return {
	      brush: brush || 'green',
	      orig: key,
	    };
	  },
	  readKeys: function (keys) {
	    return typeof keys === 'string' ? keys.split(' ') : keys;
	  },
	  setFenTurn: function (fen, turn) {
	    return fen.replace(/ (w|b) /, ' ' + turn + ' ');
	  },
	  pieceImg: function (role) {
	    return mithril$1('div.is2d.no-square', mithril$1('piece.white.' + role));
	  },
	  roundSvg: function (url) {
	    return mithril$1(
	      'div.round-svg',
	      mithril$1('img', {
	        src: url,
	      })
	    );
	  },
	  withLinebreaks: function (text) {
	    return mithril$1.trust(lichess.escapeHtml(text).replace(/\n/g, '<br>'));
	  },
	  decomposeUci: function (uci) {
	    return [uci.slice(0, 2), uci.slice(2, 4), uci.slice(4, 5)];
	  },
	};

	var apple = 50;
	var capture$1 = 50;
	var scenario$1 = 50;

	var levelBonus = {
	  1: 500,
	  2: 300,
	  3: 100,
	};

	function getLevelBonus(l, nbMoves) {
	  var late = nbMoves - l.nbMoves;
	  if (late <= 0) return levelBonus[1];
	  if (late <= Math.max(1, l.nbMoves / 8)) return levelBonus[2];
	  return levelBonus[3];
	}

	function getLevelMaxScore(l) {
	  var score = util$2.readKeys(l.apples).length * apple;
	  if (l.pointsForCapture) score += (l.captures || 0) * capture$1;
	  return score + levelBonus[1];
	}

	function getLevelRank(l, score) {
	  var max = getLevelMaxScore(l);
	  if (score >= max) return 1;
	  if (score >= max - 200) return 2;
	  return 3;
	}

	function getStageMaxScore(s) {
	  return s.levels.reduce(function (sum, s) {
	    return sum + getLevelMaxScore(s);
	  }, 0);
	}

	function getStageRank(s, score) {
	  var max = getStageMaxScore(s);
	  if (typeof score !== 'number') score = score.reduce((a, b) => a + b, 0);
	  if (score >= max) return 1;
	  if (score >= max - Math.max(200, s.levels.length * 150)) return 2;
	  return 3;
	}

	var pieceValues = {
	  q: 90,
	  r: 50,
	  b: 30,
	  n: 30,
	  p: 10,
	};

	var score = {
	  apple: apple,
	  capture: capture$1,
	  scenario: scenario$1,
	  getLevelRank: getLevelRank,
	  getLevelBonus: getLevelBonus,
	  getStageRank: getStageRank,
	  pieceValue: function (p) {
	    return pieceValues[p] || 0;
	  },
	  gtz: function (s) {
	    return s > 0;
	  },
	};

	var arrow$i = util$2.arrow;

	var rook$1 = {
	  key: 'rook',
	  title: 'theRook',
	  subtitle: 'itMovesInStraightLines',
	  image: util$2.assetUrl + 'images/learn/pieces/R.svg',
	  intro: 'rookIntro',
	  illustration: util$2.pieceImg('rook'),
	  levels: [
	    {
	      goal: 'rookGoal',
	      fen: '8/8/8/8/8/8/4R3/8 w - -',
	      apples: 'e7',
	      nbMoves: 1,
	      shapes: [arrow$i('e2e7')],
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/2R5/8/8/8/8/8/8 w - -',
	      apples: 'c5 g5',
	      nbMoves: 2,
	      shapes: [arrow$i('c7c5'), arrow$i('c5g5')],
	    },
	    {
	      goal: 'theFewerMoves',
	      fen: '8/8/8/8/3R4/8/8/8 w - -',
	      apples: 'a4 g3 g4',
	      nbMoves: 3,
	    },
	    {
	      goal: 'theFewerMoves',
	      fen: '7R/8/8/8/8/8/8/8 w - -',
	      apples: 'f8 g1 g7 g8 h7',
	      nbMoves: 5,
	    },
	    {
	      goal: 'useTwoRooks',
	      fen: '8/1R6/8/8/3R4/8/8/8 w - -',
	      apples: 'a4 g3 g7 h4',
	      nbMoves: 4,
	    },
	    {
	      goal: 'useTwoRooks',
	      fen: '8/8/8/8/8/5R2/8/R7 w - -',
	      apples: 'b7 d1 d5 f2 f7 g4 g7',
	      nbMoves: 7,
	    },
	  ].map(util$2.toLevel),
	  complete: 'rookComplete',
	};

	var arrow$h = util$2.arrow;

	var bishop$1 = {
	  key: 'bishop',
	  title: 'theBishop',
	  subtitle: 'itMovesDiagonally',
	  image: util$2.assetUrl + 'images/learn/pieces/B.svg',
	  intro: 'bishopIntro',
	  illustration: util$2.pieceImg('bishop'),
	  levels: [
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/8/5B2/8/8 w - -',
	      apples: 'd5 g8',
	      nbMoves: 2,
	      shapes: [arrow$h('f3d5'), arrow$h('d5g8')],
	    },
	    {
	      goal: 'theFewerMoves',
	      fen: '8/8/8/8/8/1B6/8/8 w - -',
	      apples: 'a2 b1 b5 d1 d3 e2',
	      nbMoves: 6,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/3B4/8/8/8 w - -',
	      apples: 'a1 b6 c1 e3 g7 h6',
	      nbMoves: 6,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/2B5/8/8/8 w - -',
	      apples: 'a4 b1 b3 c2 d3 e2',
	      nbMoves: 6,
	    },
	    {
	      goal: 'youNeedBothBishops',
	      fen: '8/8/8/8/8/8/8/2B2B2 w - -',
	      apples: 'd3 d4 d5 e3 e4 e5',
	      nbMoves: 6,
	    },
	    {
	      goal: 'youNeedBothBishops',
	      fen: '8/3B4/8/8/8/2B5/8/8 w - -',
	      apples: 'a3 c2 e7 f5 f6 g8 h4 h7',
	      nbMoves: 11,
	    },
	  ].map(util$2.toLevel),
	  complete: 'bishopComplete',
	};

	var arrow$g = util$2.arrow;

	var queen$1 = {
	  key: 'queen',
	  title: 'theQueen',
	  subtitle: 'queenCombinesRookAndBishop',
	  image: util$2.assetUrl + 'images/learn/pieces/Q.svg',
	  intro: 'queenIntro',
	  illustration: util$2.pieceImg('queen'),
	  levels: [
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/8/8/4Q3/8 w - -',
	      apples: 'e5 b8',
	      nbMoves: 2,
	      shapes: [arrow$g('e2e5'), arrow$g('e5b8')],
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/3Q4/8/8/8 w - -',
	      apples: 'a3 f2 f8 h3',
	      nbMoves: 4,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/2Q5/8/8/8 w - -',
	      apples: 'a3 d6 f1 f8 g3 h6',
	      nbMoves: 6,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/6Q1/8/8/8/8/8/8 w - -',
	      apples: 'a2 b5 d3 g1 g8 h2 h5',
	      nbMoves: 7,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/8/8/8/4Q3 w - -',
	      apples: 'a6 d1 f2 f6 g6 g8 h1 h4',
	      nbMoves: 9,
	    },
	  ].map(util$2.toLevel),
	  complete: 'queenComplete',
	};

	var arrow$f = util$2.arrow;

	var king$1 = {
	  key: 'king',
	  title: 'theKing',
	  subtitle: 'theMostImportantPiece',
	  image: util$2.assetUrl + 'images/learn/pieces/K.svg',
	  intro: 'kingIntro',
	  illustration: util$2.pieceImg('king'),
	  levels: [
	    {
	      goal: 'theKingIsSlow',
	      fen: '8/8/8/8/8/3K4/8/8 w - -',
	      apples: 'e6',
	      nbMoves: 3,
	      shapes: [arrow$f('d3d4'), arrow$f('d4d5'), arrow$f('d5e6')],
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/8/8/8/4K3 w - -',
	      apples: 'c2 d3 e2 e3',
	      nbMoves: 4,
	    },
	    {
	      goal: 'lastOne',
	      fen: '8/8/8/4K3/8/8/8/8 w - -',
	      apples: 'b5 c5 d6 e3 f3 g4',
	      nbMoves: 8,
	    },
	  ].map(function (s, i) {
	    s = util$2.toLevel(s, i);
	    s.emptyApples = true;
	    return s;
	  }),
	  complete: 'kingComplete',
	};

	var arrow$e = util$2.arrow;

	var knight$1 = {
	  key: 'knight',
	  title: 'theKnight',
	  subtitle: 'itMovesInAnLShape',
	  image: util$2.assetUrl + 'images/learn/pieces/N.svg',
	  intro: 'knightIntro',
	  illustration: util$2.pieceImg('knight'),
	  levels: [
	    {
	      goal: 'knightsHaveAFancyWay',
	      fen: '8/8/8/8/4N3/8/8/8 w - -',
	      apples: 'c5 d7',
	      nbMoves: 2,
	      shapes: [arrow$e('e4c5'), arrow$e('c5d7')],
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/8/8/8/1N6 w - -',
	      apples: 'c3 d4 e2 f3 f7 g5 h8',
	      nbMoves: 8,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/2N5/8/8/8/8/8/8 w - -',
	      apples: 'b6 d5 d7 e6 f4',
	      nbMoves: 5,
	    },
	    {
	      goal: 'knightsCanJumpOverObstacles',
	      fen: '8/8/8/8/5N2/8/8/8 w - -',
	      apples: 'e3 e4 e5 f3 f5 g3 g4 g5',
	      nbMoves: 9,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/8/8/8/8/3N4/8/8 w - -',
	      apples: 'c3 e2 e4 f2 f4 g6',
	      nbMoves: 6,
	    },
	    {
	      goal: 'grabAllTheStars',
	      fen: '8/2N5/8/8/8/8/8/8 w - -',
	      apples: 'b4 b5 c6 c8 d4 d5 e3 e7 f5',
	      nbMoves: 9,
	    },
	  ].map(util$2.toLevel),
	  complete: 'knightComplete',
	};

	var readKeys = util$2.readKeys;

	function pieceMatch(piece, matcher) {
	  if (!piece) return false;
	  for (var k in matcher) if (piece[k] !== matcher[k]) return false;
	  return true;
	}

	function pieceOnAnyOf(matcher, keys) {
	  return function (level) {
	    for (var i in keys) if (pieceMatch(level.chess.get(keys[i]), matcher)) return true;
	    return false;
	  };
	}

	function fenToMatcher(fenPiece) {
	  return {
	    type: fenPiece.toLowerCase(),
	    color: fenPiece.toLowerCase() === fenPiece ? 'b' : 'w',
	  };
	}

	var assert = {
	  pieceOn: function (fenPiece, key) {
	    return function (level) {
	      return pieceMatch(level.chess.get(key), fenToMatcher(fenPiece));
	    };
	  },
	  pieceNotOn: function (fenPiece, key) {
	    return function (level) {
	      return !pieceMatch(level.chess.get(key), fenToMatcher(fenPiece));
	    };
	  },
	  noPieceOn: function (keys) {
	    keys = readKeys(keys);
	    return function (level) {
	      for (var key in level.chess.occupation()) if (!keys.includes(key)) return true;
	      return false;
	    };
	  },
	  whitePawnOnAnyOf: function (keys) {
	    return pieceOnAnyOf(fenToMatcher('P'), readKeys(keys));
	  },
	  extinct: function (color) {
	    return function (level) {
	      var fen = level.chess.fen().split(' ')[0].replace(/\//g, '');
	      return fen === (color === 'white' ? fen.toLowerCase() : fen.toUpperCase());
	    };
	  },
	  check: function (level) {
	    return level.chess.instance.in_check();
	  },
	  mate: function (level) {
	    return level.chess.instance.in_checkmate();
	  },
	  lastMoveSan: function (san) {
	    return function (level) {
	      var moves = level.chess.instance.history();
	      return moves[moves.length - 1] === san;
	    };
	  },
	  checkIn: function (nbMoves) {
	    return function (level) {
	      return level.vm.nbMoves <= nbMoves && level.chess.instance.in_check();
	    };
	  },
	  noCheckIn: function (nbMoves) {
	    return function (level) {
	      return level.vm.nbMoves >= nbMoves && !level.chess.instance.in_check();
	    };
	  },
	  not: function (assert) {
	    return function (level) {
	      return !assert(level);
	    };
	  },
	  and: function () {
	    var asserts = [].slice.call(arguments);
	    return function (level) {
	      return asserts.every(function (a) {
	        return a(level);
	      });
	    };
	  },
	  or: function () {
	    var asserts = [].slice.call(arguments);
	    return function (level) {
	      return asserts.some(function (a) {
	        return a(level);
	      });
	    };
	  },
	  scenarioComplete: function (level) {
	    return level.scenario.isComplete();
	  },
	  scenarioFailed: function (level) {
	    return level.scenario.isFailed();
	  },
	};

	var arrow$d = util$2.arrow;

	var pawn$1 = {
	  key: 'pawn',
	  title: 'thePawn',
	  subtitle: 'itMovesForwardOnly',
	  image: util$2.assetUrl + 'images/learn/pieces/P.svg',
	  intro: 'pawnIntro',
	  illustration: util$2.pieceImg('pawn'),
	  levels: [
	    {
	      goal: 'pawnsMoveOneSquareOnly',
	      fen: '8/8/8/P7/8/8/8/8 w - -',
	      apples: 'f3',
	      nbMoves: 4,
	      shapes: [arrow$d('a5a6'), arrow$d('a6a7'), arrow$d('a7a8'), arrow$d('a8f3')],
	      explainPromotion: true,
	    },
	    {
	      goal: 'mostOfTheTimePromotingToAQueenIsBest',
	      fen: '8/8/8/5P2/8/8/8/8 w - -',
	      apples: 'b6 c4 d7 e5 a8',
	      nbMoves: 8,
	    },
	    {
	      goal: 'pawnsMoveForward',
	      fen: '8/8/8/8/8/4P3/8/8 w - -',
	      apples: 'c6 d5 d7',
	      nbMoves: 4,
	      shapes: [arrow$d('e3e4'), arrow$d('e4d5'), arrow$d('d5c6'), arrow$d('c6d7')],
	      failure: assert.noPieceOn('e3 e4 c6 d5 d7'),
	    },
	    {
	      goal: 'captureThenPromote',
	      fen: '8/8/8/8/8/1P6/8/8 w - -',
	      apples: 'b4 b6 c4 c6 c7 d6',
	      nbMoves: 8,
	    },
	    {
	      goal: 'captureThenPromote',
	      fen: '8/8/8/8/8/3P4/8/8 w - -',
	      apples: 'c4 b5 b6 d5 d7 e6 c8',
	      failure: assert.whitePawnOnAnyOf('b5 d4 d6 c7'),
	      nbMoves: 8,
	    },
	    {
	      goal: 'useAllThePawns',
	      fen: '8/8/8/8/8/P1PP3P/8/8 w - -',
	      apples: 'b5 c5 d4 e5 g4',
	      nbMoves: 7,
	    },
	    {
	      goal: 'aPawnOnTheSecondRank',
	      fen: '8/8/8/8/8/8/4P3/8 w - -',
	      apples: 'd6',
	      nbMoves: 3,
	      shapes: [arrow$d('e2e4')],
	      failure: assert.whitePawnOnAnyOf('e3'),
	      cssClass: 'highlight-2nd-rank',
	    },
	    {
	      goal: 'grabAllTheStarsNoNeedToPromote',
	      fen: '8/8/8/8/8/8/2PPPP2/8 w - -',
	      apples: 'c5 d5 e5 f5 d3 e4',
	      nbMoves: 9,
	    },
	  ].map(util$2.toLevel),
	  complete: 'pawnComplete',
	};

	var arrow$c = util$2.arrow;

	var imgUrl$b = util$2.assetUrl + 'images/learn/bowman.svg';

	var capture = {
	  key: 'capture',
	  title: 'capture',
	  subtitle: 'takeTheEnemyPieces',
	  image: imgUrl$b,
	  intro: 'captureIntro',
	  illustration: util$2.roundSvg(imgUrl$b),
	  levels: [
	    {
	      // rook
	      goal: 'takeTheBlackPieces',
	      fen: '8/2p2p2/8/8/8/2R5/8/8 w - -',
	      nbMoves: 2,
	      captures: 2,
	      shapes: [arrow$c('c3c7'), arrow$c('c7f7')],
	      success: assert.extinct('black'),
	    },
	    {
	      // queen
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '8/2r2p2/8/8/5Q2/8/8/8 w - -',
	      nbMoves: 2,
	      captures: 2,
	      shapes: [arrow$c('f4c7'), arrow$c('f4f7', 'red'), arrow$c('c7f7', 'yellow')],
	      success: assert.extinct('black'),
	    },
	    {
	      // bishop
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '8/5r2/8/1r3p2/8/3B4/8/8 w - -',
	      nbMoves: 5,
	      captures: 3,
	      success: assert.extinct('black'),
	    },
	    {
	      // queen
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '8/5b2/5p2/3n2p1/8/6Q1/8/8 w - -',
	      nbMoves: 7,
	      captures: 4,
	      success: assert.extinct('black'),
	    },
	    {
	      // knight
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '8/3b4/2p2q2/8/3p1N2/8/8/8 w - -',
	      nbMoves: 6,
	      captures: 4,
	      success: assert.extinct('black'),
	    },
	  ].map(function (l, i) {
	    l.pointsForCapture = true;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'captureComplete',
	};

	var arrow$b = util$2.arrow;

	var imgUrl$a = util$2.assetUrl + 'images/learn/bolt-shield.svg';

	var protection = {
	  key: 'protection',
	  title: 'protection',
	  subtitle: 'keepYourPiecesSafe',
	  image: imgUrl$a,
	  intro: 'protectionIntro',
	  illustration: util$2.roundSvg(imgUrl$a),
	  levels: [
	    {
	      goal: 'escape',
	      fen: '8/8/8/4bb2/8/8/P2P4/R2K4 w - -',
	      shapes: [arrow$b('e5a1', 'red'), arrow$b('a1c1')],
	    },
	    {
	      // escape
	      goal: 'escape',
	      fen: '8/8/2q2N2/8/8/8/8/8 w - -',
	    },
	    {
	      // protect
	      goal: 'noEscape',
	      fen: '8/N2q4/8/8/8/8/6R1/8 w - -',
	      scenario: [
	        {
	          move: 'g2a2',
	          shapes: [arrow$b('a2a7', 'green')],
	        },
	      ],
	    },
	    {
	      goal: 'noEscape',
	      fen: '8/8/1Bq5/8/2P5/8/8/8 w - -',
	    },
	    {
	      goal: 'noEscape',
	      fen: '1r6/8/5b2/8/8/5N2/P2P4/R1B5 w - -',
	      shapes: [arrow$b('f6a1', 'red'), arrow$b('d2d4')],
	    },
	    {
	      goal: 'dontLetThemTakeAnyUndefendedPiece',
	      fen: '8/1b6/8/8/8/3P2P1/5NRP/r7 w - -',
	    },
	    {
	      goal: 'dontLetThemTakeAnyUndefendedPiece',
	      fen: 'rr6/3q4/4n3/4P1B1/7P/P7/1B1N1PP1/R5K1 w - -',
	    },
	    {
	      goal: 'dontLetThemTakeAnyUndefendedPiece',
	      fen: '8/3q4/8/1N3R2/8/2PB4/8/8 w - -',
	    },
	  ].map(function (l, i) {
	    l.nbMoves = 1;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'protectionComplete',
	};

	var arrow$a = util$2.arrow;

	var imgUrl$9 = util$2.assetUrl + 'images/learn/battle-gear.svg';

	var combat = {
	  key: 'combat',
	  title: 'combat',
	  subtitle: 'captureAndDefendPieces',
	  image: imgUrl$9,
	  intro: 'combatIntro',
	  illustration: util$2.roundSvg(imgUrl$9),
	  levels: [
	    {
	      // rook
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '8/8/8/8/P2r4/6B1/8/8 w - -',
	      nbMoves: 3,
	      captures: 1,
	      shapes: [arrow$a('a4a5'), arrow$a('g3f2'), arrow$a('f2d4'), arrow$a('d4a4', 'yellow')],
	      success: assert.extinct('black'),
	    },
	    {
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '2r5/8/3b4/2P5/8/1P6/2B5/8 w - -',
	      nbMoves: 4,
	      captures: 2,
	      success: assert.extinct('black'),
	    },
	    {
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '1r6/8/5n2/3P4/4P1P1/1Q6/8/8 w - -',
	      nbMoves: 4,
	      captures: 2,
	      success: assert.extinct('black'),
	    },
	    {
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '2r5/8/3N4/5b2/8/8/PPP5/8 w - -',
	      nbMoves: 4,
	      captures: 2,
	      success: assert.extinct('black'),
	    },
	    {
	      goal: 'takeTheBlackPiecesAndDontLoseYours',
	      fen: '8/6q1/8/4P1P1/8/4B3/r2P2N1/8 w - -',
	      nbMoves: 8,
	      captures: 2,
	      success: assert.extinct('black'),
	    },
	  ].map(function (l, i) {
	    l.pointsForCapture = true;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'combatComplete',
	};

	var arrow$9 = util$2.arrow;

	var imgUrl$8 = util$2.assetUrl + 'images/learn/winged-sword.svg';

	var check1 = {
	  key: 'check1',
	  title: 'checkInOne',
	  subtitle: 'attackTheOpponentsKing',
	  image: imgUrl$8,
	  intro: 'checkInOneIntro',
	  illustration: util$2.roundSvg(imgUrl$8),
	  levels: [
	    {
	      goal: 'checkInOneGoal',
	      fen: '4k3/8/2b5/8/8/8/8/R7 w - -',
	      shapes: [arrow$9('a1e1')],
	    },
	    {
	      goal: 'checkInOneGoal',
	      fen: '8/8/4k3/3n4/8/1Q6/8/8 w - -',
	    },
	    {
	      goal: 'checkInOneGoal',
	      fen: '3qk3/1pp5/3p4/4p3/8/3B4/6r1/8 w - -',
	    },
	    {
	      goal: 'checkInOneGoal',
	      fen: '2r2q2/2n5/8/4k3/8/2N1P3/3P2B1/8 w - -',
	    },
	    {
	      goal: 'checkInOneGoal',
	      fen: '8/2b1q2n/1ppk4/2N5/8/8/8/8 w - -',
	    },
	    {
	      goal: 'checkInOneGoal',
	      fen: '6R1/1k3r2/8/4Q3/8/2n5/8/8 w - -',
	    },
	    {
	      goal: 'checkInOneGoal',
	      fen: '7r/4k3/8/3n4/4N3/8/2R5/4Q3 w - -',
	    },
	  ].map(function (l, i) {
	    l.nbMoves = 1;
	    l.failure = assert.not(assert.check);
	    l.success = assert.check;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'checkInOneComplete',
	};

	var arrow$8 = util$2.arrow;

	var imgUrl$7 = util$2.assetUrl + 'images/learn/guards.svg';

	var outOfCheck = {
	  key: 'outOfCheck',
	  title: 'outOfCheck',
	  subtitle: 'defendYourKing',
	  image: imgUrl$7,
	  intro: 'outOfCheckIntro',
	  illustration: util$2.roundSvg(imgUrl$7),
	  levels: [
	    {
	      goal: 'escapeWithTheKing',
	      fen: '8/8/8/4q3/8/8/8/4K3 w - -',
	      shapes: [arrow$8('e5e1', 'red'), arrow$8('e1f1')],
	    },
	    {
	      goal: 'escapeWithTheKing',
	      fen: '8/2n5/5b2/8/2K5/8/2q5/8 w - -',
	    },
	    {
	      goal: 'theKingCannotEscapeButBlock',
	      fen: '8/7r/6r1/8/R7/7K/8/8 w - -',
	    },
	    {
	      goal: 'youCanGetOutOfCheckByTaking',
	      fen: '8/8/8/3b4/8/4N3/KBn5/1R6 w - -',
	    },
	    {
	      goal: 'thisKnightIsCheckingThroughYourDefenses',
	      fen: '4q3/8/8/8/8/5nb1/3PPP2/3QKBNr w - -',
	    },
	    {
	      goal: 'escapeOrBlock',
	      fen: '8/8/7p/2q5/5n2/1N1KP2r/3R4/8 w - -',
	    },
	    {
	      goal: 'escapeOrBlock',
	      fen: '8/6b1/8/8/q4P2/2KN4/3P4/8 w - -',
	    },
	  ].map(function (l, i) {
	    l.detectCapture = false;
	    l.offerIllegalMove = true;
	    l.nbMoves = 1;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'outOfCheckComplete',
	};

	var arrow$7 = util$2.arrow;

	var imgUrl$6 = util$2.assetUrl + 'images/learn/guillotine.svg';

	var checkmate1 = {
	  key: 'checkmate1',
	  title: 'mateInOne',
	  subtitle: 'defeatTheOpponentsKing',
	  image: imgUrl$6,
	  intro: 'mateInOneIntro',
	  illustration: util$2.roundSvg(imgUrl$6),
	  levels: [
	    {
	      // rook
	      goal: 'attackYourOpponentsKing',
	      fen: '3qk3/3ppp2/8/8/2B5/5Q2/8/8 w - -',
	      shapes: [arrow$7('f3f7')],
	    },
	    {
	      // smothered
	      goal: 'attackYourOpponentsKing',
	      fen: '6rk/6pp/7P/6N1/8/8/8/8 w - -',
	    },
	    {
	      // rook
	      goal: 'attackYourOpponentsKing',
	      fen: 'R7/8/7k/2r5/5n2/8/6Q1/8 w - -',
	    },
	    {
	      // Q+N
	      goal: 'attackYourOpponentsKing',
	      fen: '2rb4/2k5/5N2/1Q6/8/8/8/8 w - -',
	    },
	    {
	      // discovered
	      goal: 'attackYourOpponentsKing',
	      fen: '1r2kb2/ppB1p3/2P2p2/2p1N3/B7/8/8/3R4 w - -',
	    },
	    {
	      // tricky
	      goal: 'attackYourOpponentsKing',
	      fen: '8/pk1N4/n7/b7/6B1/1r3b2/8/1RR5 w - -',
	      scenario: [
	        {
	          move: 'g4f3',
	          shapes: [arrow$7('b1b7', 'yellow'), arrow$7('f3b7', 'yellow')],
	        },
	      ],
	    },
	    {
	      // tricky
	      goal: 'attackYourOpponentsKing',
	      fen: 'r1b5/ppp5/2N2kpN/5q2/8/Q7/8/4B3 w - -',
	    },
	  ].map(function (l, i) {
	    l.nbMoves = 1;
	    l.failure = assert.not(assert.mate);
	    l.success = assert.mate;
	    l.showFailureFollowUp = true;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'mateInOneComplete',
	};

	var and = assert.and;
	var arrow$6 = util$2.arrow;

	var imgUrl$5 = util$2.assetUrl + 'images/learn/rally-the-troops.svg';

	var setup = {
	  key: 'setup',
	  title: 'boardSetup',
	  subtitle: 'howTheGameStarts',
	  image: imgUrl$5,
	  intro: 'boardSetupIntro',
	  illustration: util$2.roundSvg(imgUrl$5),
	  levels: [
	    {
	      // rook
	      goal: 'thisIsTheInitialPosition',
	      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - -',
	      nbMoves: 1,
	    },
	    {
	      goal: 'firstPlaceTheRooks',
	      fen: 'r6r/pppppppp/8/8/8/8/8/2RR4 w - -',
	      apples: 'a1 h1',
	      nbMoves: 2,
	      shapes: [arrow$6('c1a1'), arrow$6('d1h1')],
	      success: and(assert.pieceOn('R', 'a1'), assert.pieceOn('R', 'h1')),
	    },
	    {
	      goal: 'thenPlaceTheKnights',
	      fen: 'rn4nr/pppppppp/8/8/8/8/2NN4/R6R w - -',
	      apples: 'b1 g1',
	      nbMoves: 4,
	      success: and(assert.pieceOn('N', 'b1'), assert.pieceOn('N', 'g1')),
	    },
	    {
	      goal: 'placeTheBishops',
	      fen: 'rnb2bnr/pppppppp/8/8/4BB2/8/8/RN4NR w - -',
	      apples: 'c1 f1',
	      nbMoves: 4,
	      success: and(assert.pieceOn('B', 'c1'), assert.pieceOn('B', 'f1')),
	    },
	    {
	      goal: 'placeTheQueen',
	      fen: 'rnbq1bnr/pppppppp/8/8/5Q2/8/8/RNB2BNR w - -',
	      apples: 'd1',
	      nbMoves: 2,
	      success: assert.pieceOn('Q', 'd1'),
	    },
	    {
	      goal: 'placeTheKing',
	      fen: 'rnbqkbnr/pppppppp/8/8/5K2/8/8/RNBQ1BNR w - -',
	      apples: 'e1',
	      nbMoves: 3,
	      success: assert.pieceOn('K', 'e1'),
	    },
	    {
	      goal: 'pawnsFormTheFrontLine',
	      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - -',
	      nbMoves: 1,
	      cssClass: 'highlight-2nd-rank highlight-7th-rank',
	    },
	  ].map(function (l, i) {
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'boardSetupComplete',
	  cssClass: 'no-go-home',
	};

	var arrow$5 = util$2.arrow,
	  circle$2 = util$2.circle;

	var imgUrl$4 = util$2.assetUrl + 'images/learn/castle.svg';

	var castledKingSide = assert.lastMoveSan('O-O');
	var castledQueenSide = assert.lastMoveSan('O-O-O');
	var cantCastleKingSide = assert.and(
	  assert.not(castledKingSide),
	  assert.or(assert.pieceNotOn('K', 'e1'), assert.pieceNotOn('R', 'h1'))
	);
	var cantCastleQueenSide = assert.and(
	  assert.not(castledQueenSide),
	  assert.or(assert.pieceNotOn('K', 'e1'), assert.pieceNotOn('R', 'a1'))
	);

	var castling = {
	  key: 'castling',
	  title: 'castling',
	  subtitle: 'theSpecialKingMove',
	  image: imgUrl$4,
	  intro: 'castlingIntro',
	  illustration: util$2.roundSvg(imgUrl$4),
	  levels: [
	    {
	      goal: 'castleKingSide',
	      fen: 'rnbqkbnr/pppppppp/8/8/2B5/4PN2/PPPP1PPP/RNBQK2R w KQkq -',
	      nbMoves: 1,
	      shapes: [arrow$5('e1g1')],
	      success: castledKingSide,
	      failure: cantCastleKingSide,
	    },
	    {
	      goal: 'castleQueenSide',
	      fen: 'rnbqkbnr/pppppppp/8/8/4P3/1PN5/PBPPQPPP/R3KBNR w KQkq -',
	      nbMoves: 1,
	      shapes: [arrow$5('e1c1')],
	      success: castledQueenSide,
	      failure: cantCastleQueenSide,
	    },
	    {
	      goal: 'theKnightIsInTheWay',
	      fen: 'rnbqkbnr/pppppppp/8/8/8/4P3/PPPPBPPP/RNBQK1NR w KQkq -',
	      nbMoves: 2,
	      shapes: [arrow$5('e1g1'), arrow$5('g1f3')],
	      success: castledKingSide,
	      failure: cantCastleKingSide,
	    },
	    {
	      goal: 'castleKingSideMovePiecesFirst',
	      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',
	      nbMoves: 4,
	      shapes: [arrow$5('e1g1')],
	      success: castledKingSide,
	      failure: cantCastleKingSide,
	    },
	    {
	      goal: 'castleQueenSideMovePiecesFirst',
	      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',
	      nbMoves: 6,
	      shapes: [arrow$5('e1c1')],
	      success: castledQueenSide,
	      failure: cantCastleQueenSide,
	    },
	    {
	      goal: 'youCannotCastleIfMoved',
	      fen: 'rnbqkbnr/pppppppp/8/8/3P4/1PN1PN2/PBPQBPPP/R3K1R1 w Qkq -',
	      nbMoves: 1,
	      shapes: [arrow$5('e1g1', 'red'), arrow$5('e1c1')],
	      success: castledQueenSide,
	      failure: cantCastleQueenSide,
	    },
	    {
	      goal: 'youCannotCastleIfAttacked',
	      fen: 'rn1qkbnr/ppp1pppp/3p4/8/2b5/4PN2/PPPP1PPP/RNBQK2R w KQkq -',
	      nbMoves: 2,
	      shapes: [arrow$5('c4f1', 'red'), circle$2('e1'), circle$2('f1'), circle$2('g1')],
	      success: castledKingSide,
	      failure: cantCastleKingSide,
	      detectCapture: false,
	    },
	    {
	      goal: 'findAWayToCastleKingSide',
	      fen: 'rnb2rk1/pppppppp/8/8/8/4Nb1n/PPPP1P1P/RNB1KB1R w KQkq -',
	      nbMoves: 2,
	      shapes: [arrow$5('e1g1')],
	      success: castledKingSide,
	      failure: cantCastleKingSide,
	      detectCapture: false,
	    },
	    {
	      goal: 'findAWayToCastleQueenSide',
	      fen: '1r1k2nr/p2ppppp/7b/7b/4P3/2nP4/P1P2P2/RN2K3 w Q -',
	      nbMoves: 4,
	      shapes: [arrow$5('e1c1')],
	      success: castledQueenSide,
	      failure: cantCastleQueenSide,
	      detectCapture: false,
	    },
	  ].map(function (l, i) {
	    l.autoCastle = true;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'castlingComplete',
	};

	var arrow$4 = util$2.arrow;

	var imgUrl$3 = util$2.assetUrl + 'images/learn/spinning-blades.svg';

	var enpassant = {
	  key: 'enpassant',
	  title: 'enPassant',
	  subtitle: 'theSpecialPawnMove',
	  image: imgUrl$3,
	  intro: 'enPassantIntro',
	  illustration: util$2.roundSvg(imgUrl$3),
	  levels: [
	    {
	      goal: 'blackJustMovedThePawnByTwoSquares',
	      fen: 'rnbqkbnr/pppppppp/8/2P5/8/8/PP1PPPPP/RNBQKBNR b KQkq -',
	      color: 'white',
	      nbMoves: 1,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      detectCapture: false,
	      scenario: [
	        {
	          move: 'd7d5',
	          shapes: [arrow$4('c5d6')],
	        },
	        'c5d6',
	      ],
	      captures: 1,
	    },
	    {
	      goal: 'enPassantOnlyWorksImmediately',
	      fen: 'rnbqkbnr/ppp1pppp/8/2Pp3P/8/8/PP1PPPP1/RNBQKBNR b KQkq -',
	      color: 'white',
	      nbMoves: 1,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      detectCapture: false,
	      scenario: [
	        {
	          move: 'g7g5',
	          shapes: [arrow$4('h5g6'), arrow$4('c5d6', 'red')],
	        },
	        'h5g6',
	      ],
	      captures: 1,
	    },
	    {
	      goal: 'enPassantOnlyWorksOnFifthRank',
	      fen: 'rnbqkbnr/pppppppp/P7/2P5/8/8/PP1PPPP1/RNBQKBNR b KQkq -',
	      color: 'white',
	      nbMoves: 1,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      detectCapture: false,
	      scenario: [
	        {
	          move: 'b7b5',
	          shapes: [arrow$4('c5b6'), arrow$4('a6b7', 'red')],
	        },
	        'c5b6',
	      ],
	      captures: 1,
	      cssClass: 'highlight-5th-rank',
	    },
	    {
	      goal: 'takeAllThePawnsEnPassant',
	      fen: 'rnbqkbnr/pppppppp/8/2PPP2P/8/8/PP1P1PP1/RNBQKBNR b KQkq -',
	      color: 'white',
	      nbMoves: 4,
	      detectCapture: false,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      scenario: ['b7b5', 'c5b6', 'f7f5', 'e5f6', 'c7c5', 'd5c6', 'g7g5', 'h5g6'],
	      captures: 4,
	    },
	  ].map(util$2.toLevel),
	  complete: 'enPassantComplete',
	};

	var arrow$3 = util$2.arrow,
	  circle$1 = util$2.circle;

	var imgUrl$2 = util$2.assetUrl + 'images/learn/scales.svg';

	var stalemate = {
	  key: 'stalemate',
	  title: 'stalemate',
	  subtitle: 'theGameIsADraw',
	  image: imgUrl$2,
	  intro: 'stalemateIntro',
	  illustration: util$2.roundSvg(imgUrl$2),
	  levels: [
	    {
	      goal: 'stalemateGoal',
	      fen: 'k7/8/8/6B1/8/1R6/8/8 w - -',
	      shapes: [arrow$3('g5e3')],
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      scenario: [
	        {
	          move: 'g5e3',
	          shapes: [
	            arrow$3('e3a7', 'blue'),
	            arrow$3('b3b7', 'blue'),
	            arrow$3('b3b8', 'blue'),
	            circle$1('a7', 'blue'),
	            circle$1('b7', 'blue'),
	            circle$1('b8', 'blue'),
	          ],
	        },
	      ],
	      nextButton: true,
	      showFailureFollowUp: true,
	    },
	    {
	      goal: 'stalemateGoal',
	      fen: '8/7p/4N2k/8/8/3N4/8/1K6 w - -',
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      scenario: [
	        {
	          move: 'd3f4',
	          shapes: [
	            arrow$3('e6g7', 'blue'),
	            arrow$3('e6g5', 'blue'),
	            arrow$3('f4g6', 'blue'),
	            arrow$3('f4h5', 'blue'),
	            circle$1('g7', 'blue'),
	            circle$1('g5', 'blue'),
	            circle$1('g6', 'blue'),
	            circle$1('h5', 'blue'),
	          ],
	        },
	      ],
	      nextButton: true,
	      showFailureFollowUp: true,
	    },
	    {
	      goal: 'stalemateGoal',
	      fen: '4k3/6p1/5p2/p4P2/PpB2N2/1K6/8/3R4 w - -',
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      scenario: [
	        {
	          move: 'f4g6',
	          shapes: [arrow$3('c4f7', 'blue'), arrow$3('d1d8', 'blue'), arrow$3('g6e7', 'blue'), arrow$3('g6f8', 'blue')],
	        },
	      ],
	      nextButton: true,
	      showFailureFollowUp: true,
	    },
	    {
	      goal: 'stalemateGoal',
	      fen: '8/6pk/6np/7K/8/3B4/8/1R6 w - -',
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      scenario: [
	        {
	          move: 'b1b8',
	          shapes: [arrow$3('b8g8', 'blue'), arrow$3('b8h8', 'blue'), arrow$3('d3h7', 'red'), arrow$3('g6e7', 'red')],
	        },
	      ],
	      nextButton: true,
	      showFailureFollowUp: true,
	    },
	    {
	      goal: 'stalemateGoal',
	      fen: '7R/pk6/p1pP4/K7/3BB2p/7p/1r5P/8 w - -',
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      scenario: [
	        {
	          move: 'd4b2',
	          shapes: [
	            arrow$3('h8a8', 'blue'),
	            arrow$3('a5b6', 'blue'),
	            arrow$3('d6c7', 'blue'),
	            arrow$3('e4b7', 'red'),
	            arrow$3('c6c5', 'red'),
	          ],
	        },
	      ],
	      nextButton: true,
	      showFailureFollowUp: true,
	    },
	  ].map(function (l, i) {
	    l.detectCapture = false;
	    l.nbMoves = 1;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'stalemateComplete',
	};

	var arrow$2 = util$2.arrow;

	var imgUrl$1 = util$2.assetUrl + 'images/learn/sprint.svg';

	var value = {
	  key: 'value',
	  title: 'pieceValue',
	  subtitle: 'evaluatePieceStrength',
	  image: imgUrl$1,
	  intro: 'pieceValueIntro',
	  illustration: util$2.roundSvg(imgUrl$1),
	  levels: [
	    {
	      // rook
	      goal: 'queenOverBishop',
	      fen: '8/8/2qrbnp1/3P4/8/8/8/8 w - -',
	      scenario: ['d5c6'],
	      nbMoves: 1,
	      captures: 1,
	      shapes: [arrow$2('d5c6')],
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      detectCapture: false,
	    },
	    {
	      goal: 'pieceValueExchange',
	      fen: '8/8/4b3/1p6/6r1/8/4Q3/8 w - -',
	      scenario: ['e2e6'],
	      nbMoves: 1,
	      captures: 1,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      detectCapture: true,
	    },
	    {
	      goal: 'pieceValueLegal',
	      fen: '5b2/8/6N1/2q5/3Kn3/2rp4/3B4/8 w - -',
	      scenario: ['d4e4'],
	      nbMoves: 1,
	      captures: 1,
	      offerIllegalMove: true,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	    },
	    {
	      goal: 'takeThePieceWithTheHighestValue',
	      fen: '1k4q1/pp6/8/3B4/2P5/1P1p2P1/P3Kr1P/3n4 w - -',
	      scenario: ['e2d1'],
	      nbMoves: 1,
	      captures: 1,
	      offerIllegalMove: true,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	      detectCapture: false,
	    },
	    {
	      goal: 'takeThePieceWithTheHighestValue',
	      fen: '7k/3bqp1p/7r/5N2/6K1/6n1/PPP5/R1B5 w - -',
	      scenario: ['c1h6'],
	      nbMoves: 1,
	      captures: 1,
	      offerIllegalMove: true,
	      success: assert.scenarioComplete,
	      failure: assert.scenarioFailed,
	    },
	  ].map(function (l, i) {
	    l.pointsForCapture = true;
	    l.showPieceValues = true;
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'pieceValueComplete',
	};

	var arrow$1 = util$2.arrow;

	var imgUrl = util$2.assetUrl + 'images/learn/crossed-swords.svg';

	var check2 = {
	  key: 'check2',
	  title: 'checkInTwo',
	  subtitle: 'twoMovesToGiveCheck',
	  image: imgUrl,
	  intro: 'checkInTwoIntro',
	  illustration: util$2.roundSvg(imgUrl),
	  levels: [
	    {
	      goal: 'checkInTwoGoal',
	      fen: '2k5/2pb4/8/2R5/8/8/8/8 w - -',
	      shapes: [arrow$1('c5a5'), arrow$1('a5a8')],
	    },
	    {
	      goal: 'checkInTwoGoal',
	      fen: '8/8/5k2/8/8/1N6/5b2/8 w - -',
	    },
	    {
	      goal: 'checkInTwoGoal',
	      fen: '6k1/2r3pp/8/1N6/8/8/4B3/8 w - -',
	    },
	    {
	      goal: 'checkInTwoGoal',
	      fen: 'r3k3/7b/8/4B3/8/8/4N3/4R3 w - -',
	    },
	    {
	      goal: 'checkInTwoGoal',
	      fen: 'r1bqkb1r/pppp1p1p/2n2np1/4p3/2B5/4PN2/PPPP1PPP/RNBQK2R w KQkq -',
	    },
	    {
	      goal: 'checkInTwoGoal',
	      fen: '8/8/8/2k5/q7/4N3/3B4/8 w - -',
	    },
	    {
	      goal: 'checkInTwoGoal',
	      fen: 'r6r/1Q2nk2/1B3p2/8/8/8/8/8 w - -',
	    },
	  ].map(function (l, i) {
	    l.nbMoves = 2;
	    l.failure = assert.noCheckIn(2);
	    l.success = assert.checkIn(2);
	    return util$2.toLevel(l, i);
	  }),
	  complete: 'checkInTwoComplete',
	};

	var categs = [
	  {
	    key: 'chess-pieces',
	    name: 'chessPieces',
	    stages: [
	      rook$1,
	      bishop$1,
	      queen$1,
	      king$1,
	      knight$1,
	      pawn$1,
	    ],
	  },
	  {
	    key: 'fundamentals',
	    name: 'fundamentals',
	    stages: [
	      capture,
	      protection,
	      combat,
	      check1,
	      outOfCheck,
	      checkmate1,
	    ],
	  },
	  {
	    key: 'intermediate',
	    name: 'intermediate',
	    stages: [setup, castling, enpassant, stalemate],
	  },
	  {
	    key: 'advanced',
	    name: 'advanced',
	    stages: [
	      value,
	      // require('./draw'),
	      // require('./fork'),
	      check2,
	    ],
	  },
	];

	var stageId = 1;
	var stages = [];

	categs = categs.map(function (c) {
	  c.stages = c.stages.map(function (stage) {
	    stage.id = stageId++;
	    stages.push(stage);
	    return stage;
	  });
	  return c;
	});

	var stagesByKey = {};
	stages.forEach(function (s) {
	  stagesByKey[s.key] = s;
	});

	var stagesById = {};
	stages.forEach(function (s) {
	  stagesById[s.id] = s;
	});

	var list$1 = {
	  list: stages,
	  byId: stagesById,
	  byKey: stagesByKey,
	  categs: categs,
	  stageIdToCategId: function (stageId) {
	    var stage = stagesById[stageId];
	    for (var id in categs)
	      if (
	        categs[id].stages.some(function (s) {
	          return s.key === stage.key;
	        })
	      )
	        return id;
	  },
	};

	function makeStars$3(nb) {
	  var stars = [];
	  for (var i = 0; i < 4 - nb; i++)
	    stars.push(
	      mithril$1('i', {
	        'data-icon': 't',
	      })
	    );
	  return stars;
	}

	function ribbon(ctrl, s, status, res) {
	  if (status === 'future') return;
	  var content;
	  if (status === 'ongoing') {
	    var p = ctrl.stageProgress(s);
	    content = p[0] ? p.join(' / ') : ctrl.trans.noarg('play');
	  } else content = makeStars$3(score.getStageRank(s, res.scores));
	  if (status !== 'future')
	    return mithril$1(
	      'span.ribbon-wrapper',
	      mithril$1(
	        'span.ribbon',
	        {
	          class: status,
	        },
	        content
	      )
	    );
	}

	function titleVerbosityClass(title) {
	  return title.length > 13 ? (title.length > 18 ? ' vvv' : ' vv') : '';
	}

	var mapView = function (ctrl) {
	  return mithril$1('div.learn.learn--map', [
	    mithril$1('div.learn__side', ctrl.opts.side.view()),
	    mithril$1('div.learn__main.learn-stages', [
	      list$1.categs.map(function (categ) {
	        return mithril$1('div.categ', [
	          mithril$1('h2', ctrl.trans.noarg(categ.name)),
	          mithril$1(
	            'div.categ_stages',
	            categ.stages.map(function (s) {
	              var res = ctrl.data.stages[s.key];
	              var complete = ctrl.isStageIdComplete(s.id);
	              var prevComplete = ctrl.isStageIdComplete(s.id - 1);
	              var status = 'future';
	              if (complete) status = 'done';
	              else if (prevComplete || res) status = 'ongoing';
	              var title = ctrl.trans.noarg(s.title);
	              return mithril$1(
	                'a',
	                {
	                  class: 'stage ' + status + titleVerbosityClass(title),
	                  href: '/' + s.id,
	                  config: mithril$1.route,
	                },
	                [
	                  ribbon(ctrl, s, status, res),
	                  mithril$1('img', {
	                    src: s.image,
	                  }),
	                  mithril$1('div.text', [mithril$1('h3', title), mithril$1('p.subtitle', ctrl.trans.noarg(s.subtitle))]),
	                ]
	              );
	            })
	          ),
	        ]);
	      }),
	      //whatNext(ctrl), //molly delete
	    ]),
	  ]);
	};

	const timeouts$1 = [];

	function setTimeout$1(f, t) {
	  timeouts$1.push(window.setTimeout(f, t));
	}

	function clearTimeouts() {
	  timeouts$1.forEach(t => clearTimeout(t));
	  timeouts$1.length = 0;
	}

	var timeouts$2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		setTimeout: setTimeout$1,
		clearTimeouts: clearTimeouts
	});

	var timeouts = /*@__PURE__*/getAugmentedNamespace(timeouts$2);

	var mapMain = function (opts, trans) {
	  return {
	    controller: function () {
	      timeouts.clearTimeouts();

	      opts.stageId = null;
	      opts.route = 'map';
	      return {
	        opts: opts,
	        data: opts.storage.data,
	        trans: trans,
	        isStageIdComplete: function (stageId) {
	          var stage = list$1.byId[stageId];
	          if (!stage) return true;
	          var result = opts.storage.data.stages[stage.key];
	          if (!result) return false;
	          return result.scores.filter(score.gtz).length >= stage.levels.length;
	        },
	        stageProgress: function (stage) {
	          var result = opts.storage.data.stages[stage.key];
	          var complete = result ? result.scores.filter(score.gtz).length : 0;
	          return [complete, stage.levels.length];
	        },
	      };
	    },
	    view: mapView,
	  };
	};

	function renderInStage(ctrl) {
	  return mithril$1('div.learn__side-map', [
	    mithril$1('div.stages', [
	      mithril$1(
	        'a.back',
	        {
	          href: '/',
	          config: mithril$1.route,
	        },
	        [
	          mithril$1('img', {
	            src: util$2.assetUrl + 'images/learn/brutal-helm.svg',
	          }),
	          ctrl.trans.noarg('menu'),
	        ]
	      ),
	      // stages.categs.map(function (categ, categId) {
	      //   return m(
	      //     'div.categ',
	      //     {
	      //       class: categId == ctrl.categId() ? 'active' : '',
	      //     },
	      //     [
	      //       m(
	      //         'h2',
	      //         {
	      //           onclick: function () {
	      //             ctrl.categId(categId);
	      //           },
	      //         },
	      //         ctrl.trans.noarg(categ.name)
	      //       ),
	      //       m(
	      //         'div.categ_stages',
	      //         categ.stages.map(function (s) {
	      //           var result = ctrl.data.stages[s.key];
	      //           var status = s.id === ctrl.active() ? 'active' : result ? 'done' : 'future';
	      //           return m(
	      //             'a',
	      //             {
	      //               class: 'stage ' + status,
	      //               href: '/' + s.id,
	      //               config: m.route,
	      //             },
	      //             [
	      //               m('img', {
	      //                 src: s.image,
	      //               }),
	      //               m('span', ctrl.trans.noarg(s.title)),
	      //             ]
	      //           );
	      //         })
	      //       ),
	      //     ]
	      //   );
	      // }),
	    ]),
	  ]);
	}

	function renderHome(ctrl) {
	  var progress = ctrl.progress();
	  return mithril$1('div.learn__side-home', [
	    //m('i.fat'),
	    mithril$1('h1', ctrl.trans.noarg('learnChess')),
	    mithril$1('h2', ctrl.trans.noarg('byPlaying')),
	    mithril$1('div.progress', [
	      mithril$1('div.text', ctrl.trans('progressX', progress + '%')),
	      mithril$1('div.bar', {
	        style: {
	          width: progress + '%',
	        },
	      }),
	    ]),
	    mithril$1('div.actions', [
	      progress > 0
	        ? mithril$1(
	            'a.confirm',
	            {
	              onclick: function () {
	                if (confirm(ctrl.trans.noarg('youWillLoseAllYourProgress'))) ctrl.reset();
	              },
	            },
	            ctrl.trans.noarg('resetMyProgress')
	          )
	        : null,
	    ]),
	  ]);
	}

	var mapSide = function (opts, trans) {
	  return {
	    controller: function () {
	      var categId = mithril$1.prop(0);
	      mithril$1.redraw.strategy('diff');
	      return {
	        data: opts.storage.data,
	        categId: categId,
	        active: function () {
	          return opts.stageId;
	        },
	        inStage: function () {
	          return opts.route === 'run';
	        },
	        setStage: function (stage) {
	          categId(list$1.stageIdToCategId(stage.id));
	        },
	        progress: function () {
	          var max = list$1.list.length * 10;
	          var data = opts.storage.data.stages;
	          var total = Object.keys(data).reduce(function (t, key) {
	            var rank = score.getStageRank(list$1.byKey[key], data[key].scores);
	            if (rank === 1) return t + 10;
	            if (rank === 2) return t + 8;
	            return t + 5;
	          }, 0);
	          return Math.round((total / max) * 100);
	        },
	        reset: opts.storage.reset,
	        trans: trans,
	      };
	    },
	    view: function (ctrl) {
	      if (ctrl.inStage()) return renderInStage(ctrl);
	      else return renderHome(ctrl);
	    },
	  };
	};

	var item = {
	  ctrl: function (blueprint) {
	    var items = {};
	    util$2.readKeys(blueprint.apples).forEach(function (key) {
	      items[key] = 'apple';
	    });

	    var get = function (key) {
	      return items[key];
	    };

	    var list = function () {
	      return Object.keys(items).map(get);
	    };

	    return {
	      get: get,
	      withItem: function (key, f) {
	        if (items[key]) return f(items[key]);
	      },
	      remove: function (key) {
	        delete items[key];
	      },
	      hasItem: function (item) {
	        return list().includes(item);
	      },
	      appleKeys: function () {
	        var keys = [];
	        for (var k in items) if (items[k] === 'apple') keys.push(k);
	        return keys;
	      },
	    };
	  },
	  view: function (item) {
	    return mithril$1('item.' + item);
	  },
	};

	var mithril = createCommonjsModule(function (module) {
	var m = (function app(window, undefined$1) {
	  	var VERSION = "v0.2.1";
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

	var files = "abcdefgh".split('');
	var ranks = [1, 2, 3, 4, 5, 6, 7, 8];
	var invRanks = [8, 7, 6, 5, 4, 3, 2, 1];
	var fileNumbers = {
	  a: 1,
	  b: 2,
	  c: 3,
	  d: 4,
	  e: 5,
	  f: 6,
	  g: 7,
	  h: 8
	};

	function pos2key(pos) {
	  return files[pos[0] - 1] + pos[1];
	}

	function key2pos$2(pos) {
	  return [fileNumbers[pos[0]], parseInt(pos[1])];
	}

	function invertKey(key) {
	  return files[8 - fileNumbers[key[0]]] + (9 - parseInt(key[1]));
	}

	var allPos = (function() {
	  var ps = [];
	  invRanks.forEach(function(y) {
	    ranks.forEach(function(x) {
	      ps.push([x, y]);
	    });
	  });
	  return ps;
	})();
	var allKeys = allPos.map(pos2key);
	var invKeys = allKeys.slice(0).reverse();

	function opposite$1(color) {
	  return color === 'white' ? 'black' : 'white';
	}

	function containsX(xs, x) {
	  return xs && xs.indexOf(x) !== -1;
	}

	function distance(pos1, pos2) {
	  return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[1] - pos2[1], 2));
	}

	// this must be cached because of the access to document.body.style
	var cachedTransformProp;

	function computeTransformProp() {
	  return 'transform' in document.body.style ?
	    'transform' : 'webkitTransform' in document.body.style ?
	    'webkitTransform' : 'mozTransform' in document.body.style ?
	    'mozTransform' : 'oTransform' in document.body.style ?
	    'oTransform' : 'msTransform';
	}

	function transformProp() {
	  if (!cachedTransformProp) cachedTransformProp = computeTransformProp();
	  return cachedTransformProp;
	}

	var cachedIsTrident = null;

	function isTrident$1() {
	  if (cachedIsTrident === null)
	    cachedIsTrident = window.navigator.userAgent.indexOf('Trident/') > -1;
	  return cachedIsTrident;
	}

	function translate(pos) {
	  return 'translate(' + pos[0] + 'px,' + pos[1] + 'px)';
	}

	function eventPosition(e) {
	  if (e.clientX || e.clientX === 0) return [e.clientX, e.clientY];
	  if (e.touches && e.targetTouches[0]) return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
	}

	function partialApply(fn, args) {
	  return fn.bind.apply(fn, [null].concat(args));
	}

	function partial() {
	  return partialApply(arguments[0], Array.prototype.slice.call(arguments, 1));
	}

	function isRightButton(e) {
	  return e.buttons === 2 || e.button === 2;
	}

	function memo(f) {
	  var v, ret = function() {
	    if (v === undefined) v = f();
	    return v;
	  };
	  ret.clear = function() {
	    v = undefined;
	  };
	  return ret;
	}

	var util$1 = {
	  files: files,
	  ranks: ranks,
	  invRanks: invRanks,
	  allPos: allPos,
	  allKeys: allKeys,
	  invKeys: invKeys,
	  pos2key: pos2key,
	  key2pos: key2pos$2,
	  invertKey: invertKey,
	  opposite: opposite$1,
	  translate: translate,
	  containsX: containsX,
	  distance: distance,
	  eventPosition: eventPosition,
	  partialApply: partialApply,
	  partial: partial,
	  transformProp: transformProp,
	  isTrident: isTrident$1,
	  requestAnimationFrame: (window.requestAnimationFrame || window.setTimeout).bind(window),
	  isRightButton: isRightButton,
	  memo: memo
	};

	function diff(a, b) {
	  return Math.abs(a - b);
	}

	function pawn(color, x1, y1, x2, y2) {
	  return diff(x1, x2) < 2 && (
	    color === 'white' ? (
	      // allow 2 squares from 1 and 8, for horde
	      y2 === y1 + 1 || (y1 <= 2 && y2 === (y1 + 2) && x1 === x2)
	    ) : (
	      y2 === y1 - 1 || (y1 >= 7 && y2 === (y1 - 2) && x1 === x2)
	    )
	  );
	}

	function knight(x1, y1, x2, y2) {
	  var xd = diff(x1, x2);
	  var yd = diff(y1, y2);
	  return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
	}

	function bishop(x1, y1, x2, y2) {
	  return diff(x1, x2) === diff(y1, y2);
	}

	function rook(x1, y1, x2, y2) {
	  return x1 === x2 || y1 === y2;
	}

	function queen(x1, y1, x2, y2) {
	  return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
	}

	function king(color, rookFiles, canCastle, x1, y1, x2, y2) {
	  return (
	    diff(x1, x2) < 2 && diff(y1, y2) < 2
	  ) || (
	    canCastle && y1 === y2 && y1 === (color === 'white' ? 1 : 8) && (
	      (x1 === 5 && (x2 === 3 || x2 === 7)) || util$1.containsX(rookFiles, x2)
	    )
	  );
	}

	function rookFilesOf(pieces, color) {
	  return Object.keys(pieces).filter(function(key) {
	    var piece = pieces[key];
	    return piece && piece.color === color && piece.role === 'rook';
	  }).map(function(key) {
	    return util$1.key2pos(key)[0];
	  });
	}

	var premove = function(pieces, key, canCastle) {
	  var piece = pieces[key];
	  var pos = util$1.key2pos(key);
	  var mobility;
	  switch (piece.role) {
	    case 'pawn':
	      mobility = pawn.bind(null, piece.color);
	      break;
	    case 'knight':
	      mobility = knight;
	      break;
	    case 'bishop':
	      mobility = bishop;
	      break;
	    case 'rook':
	      mobility = rook;
	      break;
	    case 'queen':
	      mobility = queen;
	      break;
	    case 'king':
	      mobility = king.bind(null, piece.color, rookFilesOf(pieces, piece.color), canCastle);
	      break;
	  }
	  return util$1.allPos.filter(function(pos2) {
	    return (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1]);
	  }).map(util$1.pos2key);
	};

	// https://gist.github.com/gre/1650294
	var easing = {
	  easeInOutCubic: function(t) {
	    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
	  },
	};

	function makePiece(k, piece, invert) {
	  var key = invert ? util$1.invertKey(k) : k;
	  return {
	    key: key,
	    pos: util$1.key2pos(key),
	    role: piece.role,
	    color: piece.color
	  };
	}

	function samePiece(p1, p2) {
	  return p1.role === p2.role && p1.color === p2.color;
	}

	function closer(piece, pieces) {
	  return pieces.sort(function(p1, p2) {
	    return util$1.distance(piece.pos, p1.pos) - util$1.distance(piece.pos, p2.pos);
	  })[0];
	}

	function computePlan(prev, current) {
	  var bounds = current.bounds(),
	    width = bounds.width / 8,
	    height = bounds.height / 8,
	    anims = {},
	    animedOrigs = [],
	    fadings = [],
	    missings = [],
	    news = [],
	    invert = prev.orientation !== current.orientation,
	    prePieces = {},
	    white = current.orientation === 'white';
	  for (var pk in prev.pieces) {
	    var piece = makePiece(pk, prev.pieces[pk], invert);
	    prePieces[piece.key] = piece;
	  }
	  for (var i = 0; i < util$1.allKeys.length; i++) {
	    var key = util$1.allKeys[i];
	    if (key !== current.movable.dropped[1]) {
	      var curP = current.pieces[key];
	      var preP = prePieces[key];
	      if (curP) {
	        if (preP) {
	          if (!samePiece(curP, preP)) {
	            missings.push(preP);
	            news.push(makePiece(key, curP, false));
	          }
	        } else
	          news.push(makePiece(key, curP, false));
	      } else if (preP)
	        missings.push(preP);
	    }
	  }
	  news.forEach(function(newP) {
	    var preP = closer(newP, missings.filter(util$1.partial(samePiece, newP)));
	    if (preP) {
	      var orig = white ? preP.pos : newP.pos;
	      var dest = white ? newP.pos : preP.pos;
	      var vector = [(orig[0] - dest[0]) * width, (dest[1] - orig[1]) * height];
	      anims[newP.key] = [vector, vector];
	      animedOrigs.push(preP.key);
	    }
	  });
	  missings.forEach(function(p) {
	    if (
	      p.key !== current.movable.dropped[0] &&
	      !util$1.containsX(animedOrigs, p.key) &&
	      !(current.items ? current.items.render(p.pos, p.key) : false)
	    )
	      fadings.push({
	        piece: p,
	        opacity: 1
	      });
	  });

	  return {
	    anims: anims,
	    fadings: fadings
	  };
	}

	function roundBy(n, by) {
	  return Math.round(n * by) / by;
	}

	function go(data) {
	  if (!data.animation.current.start) return; // animation was canceled
	  var rest = 1 - (new Date().getTime() - data.animation.current.start) / data.animation.current.duration;
	  if (rest <= 0) {
	    data.animation.current = {};
	    data.render();
	  } else {
	    var ease = easing.easeInOutCubic(rest);
	    for (var key in data.animation.current.anims) {
	      var cfg = data.animation.current.anims[key];
	      cfg[1] = [roundBy(cfg[0][0] * ease, 10), roundBy(cfg[0][1] * ease, 10)];
	    }
	    for (var i in data.animation.current.fadings) {
	      data.animation.current.fadings[i].opacity = roundBy(ease, 100);
	    }
	    data.render();
	    util$1.requestAnimationFrame(function() {
	      go(data);
	    });
	  }
	}

	function animate(transformation, data) {
	  // clone data
	  var prev = {
	    orientation: data.orientation,
	    pieces: {}
	  };
	  // clone pieces
	  for (var key in data.pieces) {
	    prev.pieces[key] = {
	      role: data.pieces[key].role,
	      color: data.pieces[key].color
	    };
	  }
	  var result = transformation();
	  if (data.animation.enabled) {
	    var plan = computePlan(prev, data);
	    if (Object.keys(plan.anims).length > 0 || plan.fadings.length > 0) {
	      var alreadyRunning = data.animation.current.start;
	      data.animation.current = {
	        start: new Date().getTime(),
	        duration: data.animation.duration,
	        anims: plan.anims,
	        fadings: plan.fadings
	      };
	      if (!alreadyRunning) go(data);
	    } else {
	      // don't animate, just render right away
	      data.renderRAF();
	    }
	  } else {
	    // animations are now disabled
	    data.renderRAF();
	  }
	  return result;
	}

	// transformation is a function
	// accepts board data and any number of arguments,
	// and mutates the board.
	var anim$1 = function(transformation, data, skip) {
	  return function() {
	    var transformationArgs = [data].concat(Array.prototype.slice.call(arguments, 0));
	    if (!data.render) return transformation.apply(null, transformationArgs);
	    else if (data.animation.enabled && !skip)
	      return animate(util$1.partialApply(transformation, transformationArgs), data);
	    else {
	      var result = transformation.apply(null, transformationArgs);
	      data.renderRAF();
	      return result;
	    }
	  };
	};

	var startAt;

	var start$3 = function() {
	  startAt = new Date();
	};

	var cancel$2 = function() {
	  startAt = null;
	};

	var stop$1 = function() {
	  if (!startAt) return 0;
	  var time = new Date() - startAt;
	  startAt = null;
	  return time;
	};

	var hold = {
	  start: start$3,
	  cancel: cancel$2,
	  stop: stop$1
	};

	function callUserFunction(f) {
	  setTimeout(f, 1);
	}

	function toggleOrientation(data) {
	  data.orientation = util$1.opposite(data.orientation);
	}

	function reset(data) {
	  data.lastMove = null;
	  setSelected(data, null);
	  unsetPremove(data);
	  unsetPredrop(data);
	}

	function setPieces(data, pieces) {
	  Object.keys(pieces).forEach(function(key) {
	    if (pieces[key]) data.pieces[key] = pieces[key];
	    else delete data.pieces[key];
	  });
	  data.movable.dropped = [];
	}

	function setCheck(data, color) {
	  var checkColor = color || data.turnColor;
	  Object.keys(data.pieces).forEach(function(key) {
	    if (data.pieces[key].color === checkColor && data.pieces[key].role === 'king') data.check = key;
	  });
	}

	function setPremove(data, orig, dest, meta) {
	  unsetPredrop(data);
	  data.premovable.current = [orig, dest];
	  callUserFunction(util$1.partial(data.premovable.events.set, orig, dest, meta));
	}

	function unsetPremove(data) {
	  if (data.premovable.current) {
	    data.premovable.current = null;
	    callUserFunction(data.premovable.events.unset);
	  }
	}

	function setPredrop(data, role, key) {
	  unsetPremove(data);
	  data.predroppable.current = {
	    role: role,
	    key: key
	  };
	  callUserFunction(util$1.partial(data.predroppable.events.set, role, key));
	}

	function unsetPredrop(data) {
	  if (data.predroppable.current.key) {
	    data.predroppable.current = {};
	    callUserFunction(data.predroppable.events.unset);
	  }
	}

	function tryAutoCastle(data, orig, dest) {
	  if (!data.autoCastle) return;
	  var king = data.pieces[dest];
	  if (king.role !== 'king') return;
	  var origPos = util$1.key2pos(orig);
	  if (origPos[0] !== 5) return;
	  if (origPos[1] !== 1 && origPos[1] !== 8) return;
	  var destPos = util$1.key2pos(dest),
	    oldRookPos, newRookPos, newKingPos;
	  if (destPos[0] === 7 || destPos[0] === 8) {
	    oldRookPos = util$1.pos2key([8, origPos[1]]);
	    newRookPos = util$1.pos2key([6, origPos[1]]);
	    newKingPos = util$1.pos2key([7, origPos[1]]);
	  } else if (destPos[0] === 3 || destPos[0] === 1) {
	    oldRookPos = util$1.pos2key([1, origPos[1]]);
	    newRookPos = util$1.pos2key([4, origPos[1]]);
	    newKingPos = util$1.pos2key([3, origPos[1]]);
	  } else return;
	  delete data.pieces[orig];
	  delete data.pieces[dest];
	  delete data.pieces[oldRookPos];
	  data.pieces[newKingPos] = {
	    role: 'king',
	    color: king.color
	  };
	  data.pieces[newRookPos] = {
	    role: 'rook',
	    color: king.color
	  };
	}

	function baseMove(data, orig, dest) {
	  var success = anim$1(function() {
	    if (orig === dest || !data.pieces[orig]) return false;
	    var captured = (
	      data.pieces[dest] &&
	      data.pieces[dest].color !== data.pieces[orig].color
	    ) ? data.pieces[dest] : null;
	    callUserFunction(util$1.partial(data.events.move, orig, dest, captured));
	    data.pieces[dest] = data.pieces[orig];
	    delete data.pieces[orig];
	    data.lastMove = [orig, dest];
	    data.check = null;
	    tryAutoCastle(data, orig, dest);
	    callUserFunction(data.events.change);
	    return true;
	  }, data)();
	  if (success) data.movable.dropped = [];
	  return success;
	}

	function baseNewPiece(data, piece, key) {
	  if (data.pieces[key]) return false;
	  callUserFunction(util$1.partial(data.events.dropNewPiece, piece, key));
	  data.pieces[key] = piece;
	  data.lastMove = [key, key];
	  data.check = null;
	  callUserFunction(data.events.change);
	  data.movable.dropped = [];
	  data.movable.dests = {};
	  data.turnColor = util$1.opposite(data.turnColor);
	  data.renderRAF();
	  return true;
	}

	function baseUserMove(data, orig, dest) {
	  var result = baseMove(data, orig, dest);
	  if (result) {
	    data.movable.dests = {};
	    data.turnColor = util$1.opposite(data.turnColor);
	  }
	  return result;
	}

	function apiMove(data, orig, dest) {
	  return baseMove(data, orig, dest);
	}

	function apiNewPiece(data, piece, key) {
	  return baseNewPiece(data, piece, key);
	}

	function userMove(data, orig, dest) {
	  if (!dest) {
	    hold.cancel();
	    setSelected(data, null);
	    if (data.movable.dropOff === 'trash') {
	      delete data.pieces[orig];
	      callUserFunction(data.events.change);
	    }
	  } else if (canMove(data, orig, dest)) {
	    if (baseUserMove(data, orig, dest)) {
	      var holdTime = hold.stop();
	      setSelected(data, null);
	      callUserFunction(util$1.partial(data.movable.events.after, orig, dest, {
	        premove: false,
	        ctrlKey: data.stats.ctrlKey,
	        holdTime: holdTime
	      }));
	      return true;
	    }
	  } else if (canPremove(data, orig, dest)) {
	    setPremove(data, orig, dest, {
	      ctrlKey: data.stats.ctrlKey
	    });
	    setSelected(data, null);
	  } else if (isMovable(data, dest) || isPremovable(data, dest)) {
	    setSelected(data, dest);
	    hold.start();
	  } else setSelected(data, null);
	}

	function dropNewPiece(data, orig, dest) {
	  if (canDrop(data, orig, dest)) {
	    var piece = data.pieces[orig];
	    delete data.pieces[orig];
	    baseNewPiece(data, piece, dest);
	    data.movable.dropped = [];
	    callUserFunction(util$1.partial(data.movable.events.afterNewPiece, piece.role, dest, {
	      predrop: false
	    }));
	  } else if (canPredrop(data, orig, dest)) {
	    setPredrop(data, data.pieces[orig].role, dest);
	  } else {
	    unsetPremove(data);
	    unsetPredrop(data);
	  }
	  delete data.pieces[orig];
	  setSelected(data, null);
	}

	function selectSquare(data, key, force) {
	  if (data.selected) {
	    if (key) {
	      if (data.selected === key && !data.draggable.enabled) {
	        setSelected(data, null);
	        hold.cancel();
	      } else if ((data.selectable.enabled || force) && data.selected !== key) {
	        if (userMove(data, data.selected, key)) data.stats.dragged = false;
	      } else hold.start();
	    } else {
	      setSelected(data, null);
	      hold.cancel();
	    }
	  } else if (isMovable(data, key) || isPremovable(data, key)) {
	    setSelected(data, key);
	    hold.start();
	  }
	  if (key) callUserFunction(util$1.partial(data.events.select, key));
	}

	function setSelected(data, key) {
	  data.selected = key;
	  if (key && isPremovable(data, key))
	    data.premovable.dests = premove(data.pieces, key, data.premovable.castle);
	  else
	    data.premovable.dests = null;
	}

	function isMovable(data, orig) {
	  var piece = data.pieces[orig];
	  return piece && (
	    data.movable.color === 'both' || (
	      data.movable.color === piece.color &&
	      data.turnColor === piece.color
	    ));
	}

	function canMove(data, orig, dest) {
	  return orig !== dest && isMovable(data, orig) && (
	    data.movable.free || util$1.containsX(data.movable.dests[orig], dest)
	  );
	}

	function canDrop(data, orig, dest) {
	  var piece = data.pieces[orig];
	  return piece && dest && (orig === dest || !data.pieces[dest]) && (
	    data.movable.color === 'both' || (
	      data.movable.color === piece.color &&
	      data.turnColor === piece.color
	    ));
	}


	function isPremovable(data, orig) {
	  var piece = data.pieces[orig];
	  return piece && data.premovable.enabled &&
	    data.movable.color === piece.color &&
	    data.turnColor !== piece.color;
	}

	function canPremove(data, orig, dest) {
	  return orig !== dest &&
	    isPremovable(data, orig) &&
	    util$1.containsX(premove(data.pieces, orig, data.premovable.castle), dest);
	}

	function canPredrop(data, orig, dest) {
	  var piece = data.pieces[orig];
	  return piece && dest &&
	    (!data.pieces[dest] || data.pieces[dest].color !== data.movable.color) &&
	    data.predroppable.enabled &&
	    (piece.role !== 'pawn' || (dest[1] !== '1' && dest[1] !== '8')) &&
	    data.movable.color === piece.color &&
	    data.turnColor !== piece.color;
	}

	function isDraggable(data, orig) {
	  var piece = data.pieces[orig];
	  return piece && data.draggable.enabled && (
	    data.movable.color === 'both' || (
	      data.movable.color === piece.color && (
	        data.turnColor === piece.color || data.premovable.enabled
	      )
	    )
	  );
	}

	function playPremove(data) {
	  var move = data.premovable.current;
	  if (!move) return;
	  var orig = move[0],
	    dest = move[1],
	    success = false;
	  if (canMove(data, orig, dest)) {
	    if (baseUserMove(data, orig, dest)) {
	      callUserFunction(util$1.partial(data.movable.events.after, orig, dest, {
	        premove: true
	      }));
	      success = true;
	    }
	  }
	  unsetPremove(data);
	  return success;
	}

	function playPredrop(data, validate) {
	  var drop = data.predroppable.current,
	    success = false;
	  if (!drop.key) return;
	  if (validate(drop)) {
	    var piece = {
	      role: drop.role,
	      color: data.movable.color
	    };
	    if (baseNewPiece(data, piece, drop.key)) {
	      callUserFunction(util$1.partial(data.movable.events.afterNewPiece, drop.role, drop.key, {
	        predrop: true
	      }));
	      success = true;
	    }
	  }
	  unsetPredrop(data);
	  return success;
	}

	function cancelMove(data) {
	  unsetPremove(data);
	  unsetPredrop(data);
	  selectSquare(data, null);
	}

	function stop(data) {
	  data.movable.color = null;
	  data.movable.dests = {};
	  cancelMove(data);
	}

	function getKeyAtDomPos(data, pos, bounds) {
	  if (!bounds && !data.bounds) return;
	  bounds = bounds || data.bounds(); // use provided value, or compute it
	  var file = Math.ceil(8 * ((pos[0] - bounds.left) / bounds.width));
	  file = data.orientation === 'white' ? file : 9 - file;
	  var rank = Math.ceil(8 - (8 * ((pos[1] - bounds.top) / bounds.height)));
	  rank = data.orientation === 'white' ? rank : 9 - rank;
	  if (file > 0 && file < 9 && rank > 0 && rank < 9) return util$1.pos2key([file, rank]);
	}

	// {white: {pawn: 3 queen: 1}, black: {bishop: 2}}
	function getMaterialDiff(data) {
	  var counts = {
	    king: 0,
	    queen: 0,
	    rook: 0,
	    bishop: 0,
	    knight: 0,
	    pawn: 0
	  };
	  for (var k in data.pieces) {
	    var p = data.pieces[k];
	    counts[p.role] += ((p.color === 'white') ? 1 : -1);
	  }
	  var diff = {
	    white: {},
	    black: {}
	  };
	  for (var role in counts) {
	    var c = counts[role];
	    if (c > 0) diff.white[role] = c;
	    else if (c < 0) diff.black[role] = -c;
	  }
	  return diff;
	}

	var pieceScores = {
	  pawn: 1,
	  knight: 3,
	  bishop: 3,
	  rook: 5,
	  queen: 9,
	  king: 0
	};

	function getScore(data) {
	  var score = 0;
	  for (var k in data.pieces) {
	    score += pieceScores[data.pieces[k].role] * (data.pieces[k].color === 'white' ? 1 : -1);
	  }
	  return score;
	}

	var board$1 = {
	  reset: reset,
	  toggleOrientation: toggleOrientation,
	  setPieces: setPieces,
	  setCheck: setCheck,
	  selectSquare: selectSquare,
	  setSelected: setSelected,
	  isDraggable: isDraggable,
	  canMove: canMove,
	  userMove: userMove,
	  dropNewPiece: dropNewPiece,
	  apiMove: apiMove,
	  apiNewPiece: apiNewPiece,
	  playPremove: playPremove,
	  playPredrop: playPredrop,
	  unsetPremove: unsetPremove,
	  unsetPredrop: unsetPredrop,
	  cancelMove: cancelMove,
	  stop: stop,
	  getKeyAtDomPos: getKeyAtDomPos,
	  getMaterialDiff: getMaterialDiff,
	  getScore: getScore
	};

	var initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

	var roles = {
	  p: "pawn",
	  r: "rook",
	  n: "knight",
	  b: "bishop",
	  q: "queen",
	  k: "king"
	};

	var letters = {
	  pawn: "p",
	  rook: "r",
	  knight: "n",
	  bishop: "b",
	  queen: "q",
	  king: "k"
	};

	function read(fen) {
	  if (fen === 'start') fen = initial;
	  var pieces = {};
	  fen.replace(/ .+$/, '').replace(/~/g, '').split('/').forEach(function(row, y) {
	    var x = 0;
	    row.split('').forEach(function(v) {
	      var nb = parseInt(v);
	      if (nb) x += nb;
	      else {
	        x++;
	        pieces[util$1.pos2key([x, 8 - y])] = {
	          role: roles[v.toLowerCase()],
	          color: v === v.toLowerCase() ? 'black' : 'white'
	        };
	      }
	    });
	  });

	  return pieces;
	}

	function write(pieces) {
	  return [8, 7, 6, 5, 4, 3, 2].reduce(
	    function(str, nb) {
	      return str.replace(new RegExp(Array(nb + 1).join('1'), 'g'), nb);
	    },
	    util$1.invRanks.map(function(y) {
	      return util$1.ranks.map(function(x) {
	        var piece = pieces[util$1.pos2key([x, y])];
	        if (piece) {
	          var letter = letters[piece.role];
	          return piece.color === 'white' ? letter.toUpperCase() : letter;
	        } else return '1';
	      }).join('');
	    }).join('/'));
	}

	var fen$1 = {
	  initial: initial,
	  read: read,
	  write: write
	};

	var merge = createCommonjsModule(function (module) {
	(function(isNode) {

		/**
		 * Merge one or more objects 
		 * @param bool? clone
		 * @param mixed,... arguments
		 * @return object
		 */

		var Public = function(clone) {

			return merge(clone === true, false, arguments);

		}, publicName = 'merge';

		/**
		 * Merge two or more objects recursively 
		 * @param bool? clone
		 * @param mixed,... arguments
		 * @return object
		 */

		Public.recursive = function(clone) {

			return merge(clone === true, true, arguments);

		};

		/**
		 * Clone the input removing any reference
		 * @param mixed input
		 * @return mixed
		 */

		Public.clone = function(input) {

			var output = input,
				type = typeOf(input),
				index, size;

			if (type === 'array') {

				output = [];
				size = input.length;

				for (index=0;index<size;++index)

					output[index] = Public.clone(input[index]);

			} else if (type === 'object') {

				output = {};

				for (index in input)

					output[index] = Public.clone(input[index]);

			}

			return output;

		};

		/**
		 * Merge two objects recursively
		 * @param mixed input
		 * @param mixed extend
		 * @return mixed
		 */

		function merge_recursive(base, extend) {

			if (typeOf(base) !== 'object')

				return extend;

			for (var key in extend) {

				if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {

					base[key] = merge_recursive(base[key], extend[key]);

				} else {

					base[key] = extend[key];

				}

			}

			return base;

		}

		/**
		 * Merge two or more objects
		 * @param bool clone
		 * @param bool recursive
		 * @param array argv
		 * @return object
		 */

		function merge(clone, recursive, argv) {

			var result = argv[0],
				size = argv.length;

			if (clone || typeOf(result) !== 'object')

				result = {};

			for (var index=0;index<size;++index) {

				var item = argv[index],

					type = typeOf(item);

				if (type !== 'object') continue;

				for (var key in item) {

					var sitem = clone ? Public.clone(item[key]) : item[key];

					if (recursive) {

						result[key] = merge_recursive(result[key], sitem);

					} else {

						result[key] = sitem;

					}

				}

			}

			return result;

		}

		/**
		 * Get type of variable
		 * @param mixed input
		 * @return string
		 *
		 * @see http://jsperf.com/typeofvar
		 */

		function typeOf(input) {

			return ({}).toString.call(input).slice(8, -1).toLowerCase();

		}

		if (isNode) {

			module.exports = Public;

		} else {

			window[publicName] = Public;

		}

	})(module && 'object' === 'object' && module.exports);
	});

	var configure$1 = function(data, config) {

	  if (!config) return;

	  // don't merge destinations. Just override.
	  if (config.movable && config.movable.dests) delete data.movable.dests;

	  merge.recursive(data, config);

	  // if a fen was provided, replace the pieces
	  if (data.fen) {
	    data.pieces = fen$1.read(data.fen);
	    data.check = config.check;
	    data.drawable.shapes = [];
	    delete data.fen;
	  }

	  if (data.check === true) board$1.setCheck(data);

	  // forget about the last dropped piece
	  data.movable.dropped = [];

	  // fix move/premove dests
	  if (data.selected) board$1.setSelected(data, data.selected);

	  // no need for such short animations
	  if (!data.animation.duration || data.animation.duration < 40)
	    data.animation.enabled = false;

	  if (!data.movable.rookCastle) {
	    var rank = data.movable.color === 'white' ? 1 : 8;
	    var kingStartPos = 'e' + rank;
	    if (data.movable.dests) {
	      var dests = data.movable.dests[kingStartPos];
	      if (!dests || data.pieces[kingStartPos].role !== 'king') return;
	      data.movable.dests[kingStartPos] = dests.filter(function(d) {
	        if ((d === 'a' + rank) && dests.indexOf('c' + rank) !== -1) return false;
	        if ((d === 'h' + rank) && dests.indexOf('g' + rank) !== -1) return false;
	        return true;
	      });
	    }
	  }
	};

	var data = function(cfg) {
	  var defaults = {
	    pieces: fen$1.read(fen$1.initial),
	    orientation: 'white', // board orientation. white | black
	    turnColor: 'white', // turn to play. white | black
	    check: null, // square currently in check "a2" | null
	    lastMove: null, // squares part of the last move ["c3", "c4"] | null
	    selected: null, // square currently selected "a1" | null
	    coordinates: true, // include coords attributes
	    render: null, // function that rerenders the board
	    renderRAF: null, // function that rerenders the board using requestAnimationFrame
	    element: null, // DOM element of the board, required for drag piece centering
	    bounds: null, // function that calculates the board bounds
	    autoCastle: false, // immediately complete the castle by moving the rook after king move
	    viewOnly: false, // don't bind events: the user will never be able to move pieces around
	    disableContextMenu: false, // because who needs a context menu on a chessboard
	    resizable: true, // listens to chessground.resize on document.body to clear bounds cache
	    pieceKey: false, // add a data-key attribute to piece elements
	    highlight: {
	      lastMove: true, // add last-move class to squares
	      check: true, // add check class to squares
	      dragOver: true // add drag-over class to square when dragging over it
	    },
	    animation: {
	      enabled: true,
	      duration: 200,
	      /*{ // current
	       *  start: timestamp,
	       *  duration: ms,
	       *  anims: {
	       *    a2: [
	       *      [-30, 50], // animation goal
	       *      [-20, 37]  // animation current status
	       *    ], ...
	       *  },
	       *  fading: [
	       *    {
	       *      pos: [80, 120], // position relative to the board
	       *      opacity: 0.34,
	       *      role: 'rook',
	       *      color: 'black'
	       *    }
	       *  }
	       *}*/
	      current: {}
	    },
	    movable: {
	      free: true, // all moves are valid - board editor
	      color: 'both', // color that can move. white | black | both | null
	      dests: {}, // valid moves. {"a2" ["a3" "a4"] "b1" ["a3" "c3"]} | null
	      dropOff: 'revert', // when a piece is dropped outside the board. "revert" | "trash"
	      dropped: [], // last dropped [orig, dest], not to be animated
	      showDests: true, // whether to add the move-dest class on squares
	      events: {
	        after: function(orig, dest, metadata) {}, // called after the move has been played
	        afterNewPiece: function(role, pos) {} // called after a new piece is dropped on the board
	      },
	      rookCastle: true // castle by moving the king to the rook
	    },
	    premovable: {
	      enabled: true, // allow premoves for color that can not move
	      showDests: true, // whether to add the premove-dest class on squares
	      castle: true, // whether to allow king castle premoves
	      dests: [], // premove destinations for the current selection
	      current: null, // keys of the current saved premove ["e2" "e4"] | null
	      events: {
	        set: function(orig, dest) {}, // called after the premove has been set
	        unset: function() {} // called after the premove has been unset
	      }
	    },
	    predroppable: {
	      enabled: false, // allow predrops for color that can not move
	      current: {}, // current saved predrop {role: 'knight', key: 'e4'} | {}
	      events: {
	        set: function(role, key) {}, // called after the predrop has been set
	        unset: function() {} // called after the predrop has been unset
	      }
	    },
	    draggable: {
	      enabled: true, // allow moves & premoves to use drag'n drop
	      distance: 3, // minimum distance to initiate a drag, in pixels
	      autoDistance: true, // lets chessground set distance to zero when user drags pieces
	      centerPiece: true, // center the piece on cursor at drag start
	      showGhost: true, // show ghost of piece being dragged
	      /*{ // current
	       *  orig: "a2", // orig key of dragging piece
	       *  rel: [100, 170] // x, y of the piece at original position
	       *  pos: [20, -12] // relative current position
	       *  dec: [4, -8] // piece center decay
	       *  over: "b3" // square being moused over
	       *  bounds: current cached board bounds
	       *  started: whether the drag has started, as per the distance setting
	       *}*/
	      current: {}
	    },
	    selectable: {
	      // disable to enforce dragging over click-click move
	      enabled: true
	    },
	    stats: {
	      // was last piece dragged or clicked?
	      // needs default to false for touch
	      dragged: !('ontouchstart' in window)
	    },
	    events: {
	      change: function() {}, // called after the situation changes on the board
	      // called after a piece has been moved.
	      // capturedPiece is null or like {color: 'white', 'role': 'queen'}
	      move: function(orig, dest, capturedPiece) {},
	      dropNewPiece: function(role, pos) {},
	      capture: function(key, piece) {}, // DEPRECATED called when a piece has been captured
	      select: function(key) {} // called when a square is selected
	    },
	    items: null, // items on the board { render: key -> vdom }
	    drawable: {
	      enabled: false, // allows SVG drawings
	      eraseOnClick: true,
	      onChange: function(shapes) {},
	      // user shapes
	      shapes: [
	        // {brush: 'green', orig: 'e8'},
	        // {brush: 'yellow', orig: 'c4', dest: 'f7'}
	      ],
	      // computer shapes
	      autoShapes: [
	        // {brush: 'paleBlue', orig: 'e8'},
	        // {brush: 'paleRed', orig: 'c4', dest: 'f7'}
	      ],
	      /*{ // current
	       *  orig: "a2", // orig key of drawing
	       *  pos: [20, -12] // relative current position
	       *  dest: "b3" // square being moused over
	       *  bounds: // current cached board bounds
	       *  brush: 'green' // brush name for shape
	       *}*/
	      current: {},
	      brushes: {
	        green: {
	          key: 'g',
	          color: '#15781B',
	          opacity: 1,
	          lineWidth: 10
	        },
	        red: {
	          key: 'r',
	          color: '#882020',
	          opacity: 1,
	          lineWidth: 10
	        },
	        blue: {
	          key: 'b',
	          color: '#003088',
	          opacity: 1,
	          lineWidth: 10
	        },
	        yellow: {
	          key: 'y',
	          color: '#e68f00',
	          opacity: 1,
	          lineWidth: 10
	        },
	        paleBlue: {
	          key: 'pb',
	          color: '#003088',
	          opacity: 0.4,
	          lineWidth: 15
	        },
	        paleGreen: {
	          key: 'pg',
	          color: '#15781B',
	          opacity: 0.4,
	          lineWidth: 15
	        },
	        paleRed: {
	          key: 'pr',
	          color: '#882020',
	          opacity: 0.4,
	          lineWidth: 15
	        },
	        paleGrey: {
	          key: 'pgr',
	          color: '#4a4a4a',
	          opacity: 0.35,
	          lineWidth: 15
	        }
	      },
	      // drawable SVG pieces, used for crazyhouse drop
	      pieces: {
	        baseUrl: 'https://lichess1.org/assets/piece/cburnett/'
	      }
	    }
	  };

	  configure$1(defaults, cfg || {});

	  return defaults;
	};

	var brushes = ['green', 'red', 'blue', 'yellow'];

	function start$2(data, e) {
	  if (e.touches && e.touches.length > 1) return; // support one finger touch only
	  e.stopPropagation();
	  e.preventDefault();
	  board$1.cancelMove(data);
	  var position = util$1.eventPosition(e);
	  var bounds = data.bounds();
	  var orig = board$1.getKeyAtDomPos(data, position, bounds);
	  data.drawable.current = {
	    orig: orig,
	    epos: position,
	    bounds: bounds,
	    brush: brushes[(e.shiftKey & util$1.isRightButton(e)) + (e.altKey ? 2 : 0)]
	  };
	  processDraw(data);
	}

	function processDraw(data) {
	  util$1.requestAnimationFrame(function() {
	    var cur = data.drawable.current;
	    if (cur.orig) {
	      var dest = board$1.getKeyAtDomPos(data, cur.epos, cur.bounds);
	      if (cur.orig === dest) cur.dest = undefined;
	      else cur.dest = dest;
	    }
	    data.render();
	    if (cur.orig) processDraw(data);
	  });
	}

	function move$1(data, e) {
	  if (data.drawable.current.orig)
	    data.drawable.current.epos = util$1.eventPosition(e);
	}

	function end$1(data, e) {
	  var drawable = data.drawable;
	  var orig = drawable.current.orig;
	  var dest = drawable.current.dest;
	  if (orig && dest) addLine(drawable, orig, dest);
	  else if (orig) addCircle(drawable, orig);
	  drawable.current = {};
	  data.render();
	}

	function cancel$1(data) {
	  if (data.drawable.current.orig) data.drawable.current = {};
	}

	function clear(data) {
	  if (data.drawable.shapes.length) {
	    data.drawable.shapes = [];
	    data.render();
	    onChange(data.drawable);
	  }
	}

	function not(f) {
	  return function(x) {
	    return !f(x);
	  };
	}

	function addCircle(drawable, key) {
	  var brush = drawable.current.brush;
	  var sameCircle = function(s) {
	    return s.orig === key && !s.dest;
	  };
	  var similar = drawable.shapes.filter(sameCircle)[0];
	  if (similar) drawable.shapes = drawable.shapes.filter(not(sameCircle));
	  if (!similar || similar.brush !== brush) drawable.shapes.push({
	    brush: brush,
	    orig: key
	  });
	  onChange(drawable);
	}

	function addLine(drawable, orig, dest) {
	  var brush = drawable.current.brush;
	  var sameLine = function(s) {
	    return s.orig && s.dest && (
	      (s.orig === orig && s.dest === dest) ||
	      (s.dest === orig && s.orig === dest)
	    );
	  };
	  var exists = drawable.shapes.filter(sameLine).length > 0;
	  if (exists) drawable.shapes = drawable.shapes.filter(not(sameLine));
	  else drawable.shapes.push({
	    brush: brush,
	    orig: orig,
	    dest: dest
	  });
	  onChange(drawable);
	}

	function onChange(drawable) {
	  drawable.onChange(drawable.shapes);
	}

	var draw = {
	  start: start$2,
	  move: move$1,
	  end: end$1,
	  cancel: cancel$1,
	  clear: clear,
	  processDraw: processDraw
	};

	var originTarget;

	function hashPiece(piece) {
	  return piece ? piece.color + piece.role : '';
	}

	function computeSquareBounds(data, bounds, key) {
	  var pos = util$1.key2pos(key);
	  if (data.orientation !== 'white') {
	    pos[0] = 9 - pos[0];
	    pos[1] = 9 - pos[1];
	  }
	  return {
	    left: bounds.left + bounds.width * (pos[0] - 1) / 8,
	    top: bounds.top + bounds.height * (8 - pos[1]) / 8,
	    width: bounds.width / 8,
	    height: bounds.height / 8
	  };
	}

	function start$1(data, e) {
	  if (e.button !== undefined && e.button !== 0) return; // only touch or left click
	  if (e.touches && e.touches.length > 1) return; // support one finger touch only
	  e.stopPropagation();
	  e.preventDefault();
	  originTarget = e.target;
	  var previouslySelected = data.selected;
	  var position = util$1.eventPosition(e);
	  var bounds = data.bounds();
	  var orig = board$1.getKeyAtDomPos(data, position, bounds);
	  var piece = data.pieces[orig];
	  if (!previouslySelected && (
	    data.drawable.eraseOnClick ||
	    (!piece || piece.color !== data.turnColor)
	  )) draw.clear(data);
	  if (data.viewOnly) return;
	  var hadPremove = !!data.premovable.current;
	  var hadPredrop = !!data.predroppable.current.key;
	  data.stats.ctrlKey = e.ctrlKey;
	  board$1.selectSquare(data, orig);
	  var stillSelected = data.selected === orig;
	  if (piece && stillSelected && board$1.isDraggable(data, orig)) {
	    var squareBounds = computeSquareBounds(data, bounds, orig);
	    data.draggable.current = {
	      previouslySelected: previouslySelected,
	      orig: orig,
	      piece: hashPiece(piece),
	      rel: position,
	      epos: position,
	      pos: [0, 0],
	      dec: data.draggable.centerPiece ? [
	        position[0] - (squareBounds.left + squareBounds.width / 2),
	        position[1] - (squareBounds.top + squareBounds.height / 2)
	      ] : [0, 0],
	      bounds: bounds,
	      started: data.draggable.autoDistance && data.stats.dragged
	    };
	  } else {
	    if (hadPremove) board$1.unsetPremove(data);
	    if (hadPredrop) board$1.unsetPredrop(data);
	  }
	  processDrag(data);
	}

	function processDrag(data) {
	  util$1.requestAnimationFrame(function() {
	    var cur = data.draggable.current;
	    if (cur.orig) {
	      // cancel animations while dragging
	      if (data.animation.current.start && data.animation.current.anims[cur.orig])
	        data.animation.current = {};
	      // if moving piece is gone, cancel
	      if (hashPiece(data.pieces[cur.orig]) !== cur.piece) cancel(data);
	      else {
	        if (!cur.started && util$1.distance(cur.epos, cur.rel) >= data.draggable.distance)
	          cur.started = true;
	        if (cur.started) {
	          cur.pos = [
	            cur.epos[0] - cur.rel[0],
	            cur.epos[1] - cur.rel[1]
	          ];
	          cur.over = board$1.getKeyAtDomPos(data, cur.epos, cur.bounds);
	        }
	      }
	    }
	    data.render();
	    if (cur.orig) processDrag(data);
	  });
	}

	function move(data, e) {
	  if (e.touches && e.touches.length > 1) return; // support one finger touch only
	  if (data.draggable.current.orig)
	    data.draggable.current.epos = util$1.eventPosition(e);
	}

	function end(data, e) {
	  var cur = data.draggable.current;
	  var orig = cur ? cur.orig : null;
	  if (!orig) return;
	  // comparing with the origin target is an easy way to test that the end event
	  // has the same touch origin
	  if (e.type === "touchend" && originTarget !== e.target && !cur.newPiece) {
	    data.draggable.current = {};
	    return;
	  }
	  board$1.unsetPremove(data);
	  board$1.unsetPredrop(data);
	  var eventPos = util$1.eventPosition(e);
	  var dest = eventPos ? board$1.getKeyAtDomPos(data, eventPos, cur.bounds) : cur.over;
	  if (cur.started) {
	    if (cur.newPiece) board$1.dropNewPiece(data, orig, dest);
	    else {
	      if (orig !== dest) data.movable.dropped = [orig, dest];
	      data.stats.ctrlKey = e.ctrlKey;
	      if (board$1.userMove(data, orig, dest)) data.stats.dragged = true;
	    }
	  }
	  if (orig === cur.previouslySelected && (orig === dest || !dest))
	    board$1.setSelected(data, null);
	  else if (!data.selectable.enabled) board$1.setSelected(data, null);
	  data.draggable.current = {};
	}

	function cancel(data) {
	  if (data.draggable.current.orig) {
	    data.draggable.current = {};
	    board$1.selectSquare(data, null);
	  }
	}

	var drag$1 = {
	  start: start$1,
	  move: move,
	  end: end,
	  cancel: cancel,
	  processDrag: processDrag // must be exposed for board editors
	};

	var ctrl = function(cfg) {

	  this.data = data(cfg);

	  this.vm = {
	    exploding: false
	  };

	  this.getFen = function() {
	    return fen$1.write(this.data.pieces);
	  }.bind(this);

	  this.getOrientation = function() {
	    return this.data.orientation;
	  }.bind(this);

	  this.set = anim$1(configure$1, this.data);

	  this.toggleOrientation = function() {
	    anim$1(board$1.toggleOrientation, this.data)();
	    if (this.data.redrawCoords) this.data.redrawCoords(this.data.orientation);
	  }.bind(this);

	  this.setPieces = anim$1(board$1.setPieces, this.data);

	  this.selectSquare = anim$1(board$1.selectSquare, this.data, true);

	  this.apiMove = anim$1(board$1.apiMove, this.data);

	  this.apiNewPiece = anim$1(board$1.apiNewPiece, this.data);

	  this.playPremove = anim$1(board$1.playPremove, this.data);

	  this.playPredrop = anim$1(board$1.playPredrop, this.data);

	  this.cancelPremove = anim$1(board$1.unsetPremove, this.data, true);

	  this.cancelPredrop = anim$1(board$1.unsetPredrop, this.data, true);

	  this.setCheck = anim$1(board$1.setCheck, this.data, true);

	  this.cancelMove = anim$1(function(data) {
	    board$1.cancelMove(data);
	    drag$1.cancel(data);
	  }.bind(this), this.data, true);

	  this.stop = anim$1(function(data) {
	    board$1.stop(data);
	    drag$1.cancel(data);
	  }.bind(this), this.data, true);

	  this.explode = function(keys) {
	    if (!this.data.render) return;
	    this.vm.exploding = {
	      stage: 1,
	      keys: keys
	    };
	    this.data.renderRAF();
	    setTimeout(function() {
	      this.vm.exploding.stage = 2;
	      this.data.renderRAF();
	      setTimeout(function() {
	        this.vm.exploding = false;
	        this.data.renderRAF();
	      }.bind(this), 120);
	    }.bind(this), 120);
	  }.bind(this);

	  this.setAutoShapes = function(shapes) {
	    anim$1(function(data) {
	      data.drawable.autoShapes = shapes;
	    }, this.data, false)();
	  }.bind(this);

	  this.setShapes = function(shapes) {
	    anim$1(function(data) {
	      data.drawable.shapes = shapes;
	    }, this.data, false)();
	  }.bind(this);
	};

	var key2pos$1 = util$1.key2pos;
	var isTrident = util$1.isTrident;

	function circleWidth(current, bounds) {
	  return (current ? 3 : 4) / 512 * bounds.width;
	}

	function lineWidth(brush, current, bounds) {
	  return (brush.lineWidth || 10) * (current ? 0.85 : 1) / 512 * bounds.width;
	}

	function opacity(brush, current) {
	  return (brush.opacity || 1) * (current ? 0.9 : 1);
	}

	function arrowMargin(current, bounds) {
	  return isTrident() ? 0 : ((current ? 10 : 20) / 512 * bounds.width);
	}

	function pos2px(pos, bounds) {
	  var squareSize = bounds.width / 8;
	  return [(pos[0] - 0.5) * squareSize, (8.5 - pos[1]) * squareSize];
	}

	function circle(brush, pos, current, bounds) {
	  var o = pos2px(pos, bounds);
	  var width = circleWidth(current, bounds);
	  var radius = bounds.width / 16;
	  return {
	    tag: 'circle',
	    attrs: {
	      stroke: brush.color,
	      'stroke-width': width,
	      fill: 'none',
	      opacity: opacity(brush, current),
	      cx: o[0],
	      cy: o[1],
	      r: radius - width / 2
	    }
	  };
	}

	function arrow(brush, orig, dest, current, bounds) {
	  var m = arrowMargin(current, bounds);
	  var a = pos2px(orig, bounds);
	  var b = pos2px(dest, bounds);
	  var dx = b[0] - a[0],
	    dy = b[1] - a[1],
	    angle = Math.atan2(dy, dx);
	  var xo = Math.cos(angle) * m,
	    yo = Math.sin(angle) * m;
	  return {
	    tag: 'line',
	    attrs: {
	      stroke: brush.color,
	      'stroke-width': lineWidth(brush, current, bounds),
	      'stroke-linecap': 'round',
	      'marker-end': isTrident() ? null : 'url(#arrowhead-' + brush.key + ')',
	      opacity: opacity(brush, current),
	      x1: a[0],
	      y1: a[1],
	      x2: b[0] - xo,
	      y2: b[1] - yo
	    }
	  };
	}

	function piece(cfg, pos, piece, bounds) {
	  var o = pos2px(pos, bounds);
	  var size = bounds.width / 8 * (piece.scale || 1);
	  var name = piece.color === 'white' ? 'w' : 'b';
	  name += (piece.role === 'knight' ? 'n' : piece.role[0]).toUpperCase();
	  var href = cfg.baseUrl + name + '.svg';
	  return {
	    tag: 'image',
	    attrs: {
	      class: piece.color + ' ' + piece.role,
	      x: o[0] - size / 2,
	      y: o[1] - size / 2,
	      width: size,
	      height: size,
	      href: href
	    }
	  };
	}

	function defs(brushes) {
	  return {
	    tag: 'defs',
	    children: [
	      brushes.map(function(brush) {
	        return {
	          tag: 'marker',
	          attrs: {
	            id: 'arrowhead-' + brush.key,
	            orient: 'auto',
	            markerWidth: 4,
	            markerHeight: 8,
	            refX: 2.05,
	            refY: 2.01
	          },
	          children: [{
	            tag: 'path',
	            attrs: {
	              d: 'M0,0 V4 L3,2 Z',
	              fill: brush.color
	            }
	          }]
	        }
	      })
	    ]
	  };
	}

	function orient(pos, color) {
	  return color === 'white' ? pos : [9 - pos[0], 9 - pos[1]];
	}

	function renderShape(data, current, bounds) {
	  return function(shape, i) {
	    if (shape.piece) return piece(
	      data.drawable.pieces,
	      orient(key2pos$1(shape.orig), data.orientation),
	      shape.piece,
	      bounds);
	    else if (shape.brush) {
	      var brush = shape.brushModifiers ?
	        makeCustomBrush(data.drawable.brushes[shape.brush], shape.brushModifiers, i) :
	        data.drawable.brushes[shape.brush];
	      var orig = orient(key2pos$1(shape.orig), data.orientation);
	      if (shape.orig && shape.dest) return arrow(
	        brush,
	        orig,
	        orient(key2pos$1(shape.dest), data.orientation),
	        current, bounds);
	      else if (shape.orig) return circle(
	        brush,
	        orig,
	        current, bounds);
	    }
	  };
	}

	function makeCustomBrush(base, modifiers, i) {
	  return {
	    key: 'cb_' + i,
	    color: modifiers.color || base.color,
	    opacity: modifiers.opacity || base.opacity,
	    lineWidth: modifiers.lineWidth || base.lineWidth
	  };
	}

	function computeUsedBrushes(d, drawn, current) {
	  var brushes = [];
	  var keys = [];
	  var shapes = (current && current.dest) ? drawn.concat(current) : drawn;
	  for (var i in shapes) {
	    var shape = shapes[i];
	    if (!shape.dest) continue;
	    var brushKey = shape.brush;
	    if (shape.brushModifiers)
	      brushes.push(makeCustomBrush(d.brushes[brushKey], shape.brushModifiers, i));
	    else {
	      if (keys.indexOf(brushKey) === -1) {
	        brushes.push(d.brushes[brushKey]);
	        keys.push(brushKey);
	      }
	    }
	  }
	  return brushes;
	}

	// don't use mithril keys here, they're buggy with SVG
	// likely because of var dummy = $document.createElement("div");
	// in handleKeysDiffer
	var svg = function(ctrl) {
	  if (!ctrl.data.bounds) return;
	  var d = ctrl.data.drawable;
	  var allShapes = d.shapes.concat(d.autoShapes);
	  if (!allShapes.length && !d.current.orig) return;
	  var bounds = ctrl.data.bounds();
	  if (bounds.width !== bounds.height) return;
	  var usedBrushes = computeUsedBrushes(d, allShapes, d.current);
	  var renderedShapes = allShapes.map(renderShape(ctrl.data, false, bounds));
	  var renderedCurrent = renderShape(ctrl.data, true, bounds)(d.current, 9999);
	  if (renderedCurrent) renderedShapes.push(renderedCurrent);
	  return {
	    tag: 'svg',
	    attrs: {
	      key: 'svg'
	    },
	    children: [
	      defs(usedBrushes),
	      renderedShapes
	    ]
	  };
	};

	function renderCoords(elems, klass, orient) {
	  var el = document.createElement('coords');
	  el.className = klass;
	  elems.forEach(function(content) {
	    var f = document.createElement('coord');
	    f.textContent = content;
	    el.appendChild(f);
	  });
	  return el;
	}

	var coords = function(orientation, el) {

	  util$1.requestAnimationFrame(function() {
	    var coords = document.createDocumentFragment();
	    var orientClass = orientation === 'black' ? ' black' : '';
	    coords.appendChild(renderCoords(util$1.ranks, 'ranks' + orientClass));
	    coords.appendChild(renderCoords(util$1.files, 'files' + orientClass));
	    el.appendChild(coords);
	  });

	  var orientation;

	  return function(o) {
	    if (o === orientation) return;
	    orientation = o;
	    var coords = el.querySelectorAll('coords');
	    for (i = 0; i < coords.length; ++i)
	      coords[i].classList.toggle('black', o === 'black');
	  };
	};

	var pieceTag = 'piece';
	var squareTag = 'square';

	function pieceClass(p) {
	  return p.role + ' ' + p.color;
	}

	function renderPiece(d, key, ctx) {
	  var attrs = {
	    key: 'p' + key,
	    style: {},
	    class: pieceClass(d.pieces[key])
	  };
	  var translate = posToTranslate(util$1.key2pos(key), ctx);
	  var draggable = d.draggable.current;
	  if (draggable.orig === key && draggable.started) {
	    translate[0] += draggable.pos[0] + draggable.dec[0];
	    translate[1] += draggable.pos[1] + draggable.dec[1];
	    attrs.class += ' dragging';
	  } else if (d.animation.current.anims) {
	    var animation = d.animation.current.anims[key];
	    if (animation) {
	      translate[0] += animation[1][0];
	      translate[1] += animation[1][1];
	    }
	  }
	  attrs.style[ctx.transformProp] = util$1.translate(translate);
	  if (d.pieceKey) attrs['data-key'] = key;
	  return {
	    tag: pieceTag,
	    attrs: attrs
	  };
	}

	function renderSquare(key, classes, ctx) {
	  var attrs = {
	    key: 's' + key,
	    class: classes,
	    style: {}
	  };
	  attrs.style[ctx.transformProp] = util$1.translate(posToTranslate(util$1.key2pos(key), ctx));
	  return {
	    tag: squareTag,
	    attrs: attrs
	  };
	}

	function posToTranslate(pos, ctx) {
	  return [
	    (ctx.asWhite ? pos[0] - 1 : 8 - pos[0]) * ctx.bounds.width / 8, (ctx.asWhite ? 8 - pos[1] : pos[1] - 1) * ctx.bounds.height / 8
	  ];
	}

	function renderGhost(key, piece, ctx) {
	  if (!piece) return;
	  var attrs = {
	    key: 'g' + key,
	    style: {},
	    class: pieceClass(piece) + ' ghost'
	  };
	  attrs.style[ctx.transformProp] = util$1.translate(posToTranslate(util$1.key2pos(key), ctx));
	  return {
	    tag: pieceTag,
	    attrs: attrs
	  };
	}

	function renderFading(cfg, ctx) {
	  var attrs = {
	    key: 'f' + cfg.piece.key,
	    class: 'fading ' + pieceClass(cfg.piece),
	    style: {
	      opacity: cfg.opacity
	    }
	  };
	  attrs.style[ctx.transformProp] = util$1.translate(posToTranslate(cfg.piece.pos, ctx));
	  return {
	    tag: pieceTag,
	    attrs: attrs
	  };
	}

	function addSquare(squares, key, klass) {
	  if (squares[key]) squares[key].push(klass);
	  else squares[key] = [klass];
	}

	function renderSquares(ctrl, ctx) {
	  var d = ctrl.data;
	  var squares = {};
	  if (d.lastMove && d.highlight.lastMove) d.lastMove.forEach(function(k) {
	    addSquare(squares, k, 'last-move');
	  });
	  if (d.check && d.highlight.check) addSquare(squares, d.check, 'check');
	  if (d.selected) {
	    addSquare(squares, d.selected, 'selected');
	    var over = d.draggable.current.over;
	    var dests = d.movable.dests[d.selected];
	    if (dests) dests.forEach(function(k) {
	      if (k === over) addSquare(squares, k, 'move-dest drag-over');
	      else if (d.movable.showDests) addSquare(squares, k, 'move-dest' + (d.pieces[k] ? ' oc' : ''));
	    });
	    var pDests = d.premovable.dests;
	    if (pDests) pDests.forEach(function(k) {
	      if (k === over) addSquare(squares, k, 'premove-dest drag-over');
	      else if (d.movable.showDests) addSquare(squares, k, 'premove-dest' + (d.pieces[k] ? ' oc' : ''));
	    });
	  }
	  var premove = d.premovable.current;
	  if (premove) premove.forEach(function(k) {
	    addSquare(squares, k, 'current-premove');
	  });
	  else if (d.predroppable.current.key)
	    addSquare(squares, d.predroppable.current.key, 'current-premove');

	  if (ctrl.vm.exploding) ctrl.vm.exploding.keys.forEach(function(k) {
	    addSquare(squares, k, 'exploding' + ctrl.vm.exploding.stage);
	  });

	  var dom = [];
	  if (d.items) {
	    for (var i = 0; i < 64; i++) {
	      var key = util$1.allKeys[i];
	      var square = squares[key];
	      var item = d.items.render(util$1.key2pos(key), key);
	      if (square || item) {
	        var sq = renderSquare(key, square ? square.join(' ') + (item ? ' has-item' : '') : 'has-item', ctx);
	        if (item) sq.children = [item];
	        dom.push(sq);
	      }
	    }
	  } else {
	    for (var key in squares)
	      dom.push(renderSquare(key, squares[key].join(' '), ctx));
	  }
	  return dom;
	}

	function renderContent(ctrl) {
	  var d = ctrl.data;
	  if (!d.bounds) return;
	  var ctx = {
	    asWhite: d.orientation === 'white',
	    bounds: d.bounds(),
	    transformProp: util$1.transformProp()
	  };
	  var children = renderSquares(ctrl, ctx);
	  if (d.animation.current.fadings)
	    d.animation.current.fadings.forEach(function(p) {
	      children.push(renderFading(p, ctx));
	    });

	  // must insert pieces in the right order
	  // for 3D to display correctly
	  var keys = ctx.asWhite ? util$1.allKeys : util$1.invKeys;
	  if (d.items) {
	    for (var i = 0; i < 64; i++) {
	      if (d.pieces[keys[i]] && !d.items.render(util$1.key2pos(keys[i]), keys[i]))
	        children.push(renderPiece(d, keys[i], ctx));
	    }
	  } else {
	    for (var i = 0; i < 64; i++) {
	      if (d.pieces[keys[i]]) children.push(renderPiece(d, keys[i], ctx));
	    }
	    // the hack to drag new pieces on the board (editor and crazyhouse)
	    // is to put it on a0 then set it as being dragged
	    if (d.draggable.current && d.draggable.current.newPiece) 
	      children.push(renderPiece(d, 'a0', ctx));
	  }

	  if (d.draggable.showGhost) {
	    var dragOrig = d.draggable.current.orig;
	    if (dragOrig && !d.draggable.current.newPiece)
	      children.push(renderGhost(dragOrig, d.pieces[dragOrig], ctx));
	  }
	  if (d.drawable.enabled) children.push(svg(ctrl));
	  return children;
	}

	function startDragOrDraw(d) {
	  return function(e) {
	    if (util$1.isRightButton(e) && d.draggable.current.orig) {
	      if (d.draggable.current.newPiece) delete d.pieces[d.draggable.current.orig];
	      d.draggable.current = {};
	      d.selected = null;
	    } else if ((e.shiftKey || util$1.isRightButton(e)) && d.drawable.enabled) draw.start(d, e);
	    else drag$1.start(d, e);
	  };
	}

	function dragOrDraw(d, withDrag, withDraw) {
	  return function(e) {
	    if ((e.shiftKey || util$1.isRightButton(e)) && d.drawable.enabled) withDraw(d, e);
	    else if (!d.viewOnly) withDrag(d, e);
	  };
	}

	function bindEvents(ctrl, el, context) {
	  var d = ctrl.data;
	  var onstart = startDragOrDraw(d);
	  var onmove = dragOrDraw(d, drag$1.move, draw.move);
	  var onend = dragOrDraw(d, drag$1.end, draw.end);
	  var startEvents = ['touchstart', 'mousedown'];
	  var moveEvents = ['touchmove', 'mousemove'];
	  var endEvents = ['touchend', 'mouseup'];
	  startEvents.forEach(function(ev) {
	    el.addEventListener(ev, onstart);
	  });
	  moveEvents.forEach(function(ev) {
	    document.addEventListener(ev, onmove);
	  });
	  endEvents.forEach(function(ev) {
	    document.addEventListener(ev, onend);
	  });
	  context.onunload = function() {
	    startEvents.forEach(function(ev) {
	      el.removeEventListener(ev, onstart);
	    });
	    moveEvents.forEach(function(ev) {
	      document.removeEventListener(ev, onmove);
	    });
	    endEvents.forEach(function(ev) {
	      document.removeEventListener(ev, onend);
	    });
	  };
	}

	function renderBoard(ctrl) {
	  var d = ctrl.data;
	  return {
	    tag: 'cg-board',
	    attrs: {
	      config: function(el, isUpdate, context) {
	        if (isUpdate) return;
	        if (!d.viewOnly || d.drawable.enabled)
	          bindEvents(ctrl, el, context);
	        // this function only repaints the board itself.
	        // it's called when dragging or animating pieces,
	        // to prevent the full application embedding chessground
	        // rendering on every animation frame
	        d.render = function() {
	          mithril.render(el, renderContent(ctrl));
	        };
	        d.renderRAF = function() {
	          util$1.requestAnimationFrame(d.render);
	        };
	        d.bounds = util$1.memo(el.getBoundingClientRect.bind(el));
	        d.element = el;
	        d.render();
	      }
	    },
	    children: []
	  };
	}

	var view = function(ctrl) {
	  var d = ctrl.data;
	  return {
	    tag: 'div',
	    attrs: {
	      config: function(el, isUpdate) {
	        if (isUpdate) {
	          if (d.redrawCoords) d.redrawCoords(d.orientation);
	          return;
	        }
	        if (d.coordinates) d.redrawCoords = coords(d.orientation, el);
	        el.addEventListener('contextmenu', function(e) {
	          if (d.disableContextMenu || d.drawable.enabled) {
	            e.preventDefault();
	            return false;
	          }
	        });
	        if (!d.stats.boundWindowEvents) {
	          d.stats.boundWindowEvents = 1;
	          if (d.resizable)
	            document.body.addEventListener('chessground.resize', function(e) {
	              d.bounds.clear();
	              d.render();
	            }, false);
	          ['onscroll', 'onresize'].forEach(function(n) {
	            var prev = window[n];
	            window[n] = function() {
	              prev && prev();
	              d.bounds.clear();
	            };
	          });
	        }
	      },
	      class: [
	        'cg-wrap',
	        'orientation-' + d.orientation,
	        d.viewOnly ? 'view-only' : 'manipulable'
	      ].join(' ')
	    },
	    children: [{
	      tag: 'cg-helper',
	      children: [{
	        tag: 'cg-container',
	        children: [renderBoard(ctrl)]
	      }]
	    }]
	  };
	};

	var api = function(controller) {

	  return {
	    set: controller.set,
	    toggleOrientation: controller.toggleOrientation,
	    getOrientation: controller.getOrientation,
	    getPieces: function() {
	      return controller.data.pieces;
	    },
	    getMaterialDiff: function() {
	      return board$1.getMaterialDiff(controller.data);
	    },
	    getFen: controller.getFen,
	    move: controller.apiMove,
	    newPiece: controller.apiNewPiece,
	    setPieces: controller.setPieces,
	    setCheck: controller.setCheck,
	    playPremove: controller.playPremove,
	    playPredrop: controller.playPredrop,
	    cancelPremove: controller.cancelPremove,
	    cancelPredrop: controller.cancelPredrop,
	    cancelMove: controller.cancelMove,
	    stop: controller.stop,
	    explode: controller.explode,
	    setAutoShapes: controller.setAutoShapes,
	    setShapes: controller.setShapes,
	    data: controller.data // directly exposes chessground state for more messing around
	  };
	};

	// for usage outside of mithril
	function init(element, config) {

	  var controller = new ctrl(config);

	  mithril.render(element, view(controller));

	  return api(controller);
	}

	var main$1 = init;
	var controller = ctrl;
	var view_1 = view;
	var fen = fen$1;
	var util = util$1;
	var configure = configure$1;
	var anim = anim$1;
	var board = board$1;
	var drag = drag$1;
	main$1.controller = controller;
	main$1.view = view_1;
	main$1.fen = fen;
	main$1.util = util;
	main$1.configure = configure;
	main$1.anim = anim;
	main$1.board = board;
	main$1.drag = drag;

	var raf = main$1.util.requestAnimationFrame;



	var cg = new main$1.controller();

	var ground = {
	  instance: cg,
	  set: function (opts) {
	    var check = opts.chess.instance.in_check();
	    cg.set({
	      fen: opts.chess.fen(),
	      lastMove: null,
	      selected: null,
	      orientation: opts.orientation,
	      coordinates: true,
	      pieceKey: true,
	      turnColor: opts.chess.color(),
	      check: check,
	      autoCastle: opts.autoCastle,
	      movable: {
	        free: false,
	        color: opts.chess.color(),
	        dests: opts.chess.dests({
	          illegal: opts.offerIllegalMove,
	        }),
	      },
	      events: {
	        move: opts.onMove,
	      },
	      items: opts.items,
	      premovable: {
	        enabled: true,
	      },
	      drawable: {
	        enabled: true,
	        eraseOnClick: true,
	      },
	      highlight: {
	        lastMove: true,
	        dragOver: true,
	      },
	      animation: {
	        enabled: false, // prevent piece animation during transition
	        duration: 200,
	      },
	      disableContextMenu: true,
	    });
	    setTimeout(function () {
	      cg.set({
	        animation: {
	          enabled: true,
	        },
	      });
	    }, 200);
	    if (opts.shapes) cg.setShapes(opts.shapes.slice(0));
	    return cg;
	  },
	  stop: cg.stop,
	  color: function (color, dests) {
	    cg.set({
	      turnColor: color,
	      movable: {
	        color: color,
	        dests: dests,
	      },
	    });
	  },
	  fen: function (fen, color, dests, lastMove) {
	    var config = {
	      turnColor: color,
	      fen: fen,
	      movable: {
	        color: color,
	        dests: dests,
	      },
	    };
	    if (lastMove) config.lastMove = lastMove;
	    cg.set(config);
	  },
	  check: function (chess) {
	    var checks = chess.checks();
	    cg.set({
	      check: checks ? checks[0].dest : null,
	    });
	    if (checks)
	      cg.setShapes(
	        checks.map(function (move) {
	          return util$2.arrow(move.orig + move.dest, 'yellow');
	        })
	      );
	  },
	  promote: function (key, role) {
	    var pieces = {};
	    var piece = cg.data.pieces[key];
	    if (piece && piece.role === 'pawn') {
	      pieces[key] = {
	        color: piece.color,
	        role: role,
	        promoted: true,
	      };
	      cg.setPieces(pieces);
	    }
	  },
	  data: function () {
	    return cg.data;
	  },
	  pieces: function () {
	    return cg.data.pieces;
	  },
	  get: function (key) {
	    return cg.data.pieces[key];
	  },
	  showCapture: function (move) {
	    raf(function () {
	      var $square = $('#learn-app piece[data-key=' + move.orig + ']');
	      $square.addClass('wriggle');
	      timeouts.setTimeout(function () {
	        $square.removeClass('wriggle');
	        cg.setShapes([]);
	        cg.apiMove(move.orig, move.dest);
	      }, 600);
	    });
	  },
	  showCheckmate: function (chess) {
	    var turn = chess.instance.turn() === 'w' ? 'b' : 'w';
	    var fen = [cg.getFen(), turn, '- - 0 1'].join(' ');
	    chess.instance.load(fen);
	    var kingKey = chess.kingKey(turn === 'w' ? 'black' : 'white');
	    var shapes = chess.instance
	      .moves({
	        verbose: true,
	      })
	      .filter(function (m) {
	        return m.to === kingKey;
	      })
	      .map(function (m) {
	        return util$2.arrow(m.from + m.to, 'red');
	      });
	    cg.set({
	      check: shapes.length ? kingKey : null,
	    });
	    cg.setShapes(shapes);
	  },
	  setShapes: function (shapes) {
	    cg.setShapes(shapes);
	  },
	  resetShapes: function () {
	    cg.setShapes([]);
	  },
	  select: cg.selectSquare,
	};

	var scenario = function (blueprint, opts) {
	  var steps = (blueprint || []).map(function (step) {
	    if (step.move) return step;
	    return {
	      move: step,
	      shapes: [],
	    };
	  });

	  var it = 0;
	  var isFailed = false;

	  var fail = function () {
	    isFailed = true;
	    return false;
	  };

	  var opponent = function () {
	    var step = steps[it];
	    if (!step) return;
	    var move = util$2.decomposeUci(step.move);
	    var res = opts.chess.move(move[0], move[1], move[2]);
	    if (!res) return fail();
	    it++;
	    ground.fen(opts.chess.fen(), opts.chess.color(), opts.makeChessDests(), move);
	    if (step.shapes)
	      timeouts.setTimeout(function () {
	        ground.setShapes(step.shapes);
	      }, 500);
	  };

	  return {
	    isComplete: function () {
	      return it === steps.length;
	    },
	    isFailed: function () {
	      return isFailed;
	    },
	    opponent: opponent,
	    player: function (move) {
	      var step = steps[it];
	      if (!step) return;
	      if (step.move !== move) return fail();
	      it++;
	      if (step.shapes) ground.setShapes(step.shapes);
	      timeouts.setTimeout(opponent, 1000);
	      return true;
	    },
	  };
	};

	var chess$1 = createCommonjsModule(function (module, exports) {
	/*
	 * Copyright (c) 2016, Jeff Hlywa (jhlywa@gmail.com)
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are met:
	 *
	 * 1. Redistributions of source code must retain the above copyright notice,
	 *    this list of conditions and the following disclaimer.
	 * 2. Redistributions in binary form must reproduce the above copyright notice,
	 *    this list of conditions and the following disclaimer in the documentation
	 *    and/or other materials provided with the distribution.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
	 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
	 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
	 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
	 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
	 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
	 * POSSIBILITY OF SUCH DAMAGE.
	 *
	 *----------------------------------------------------------------------------*/

	/* minified license below  */

	/* @license
	 * Copyright (c) 2016, Jeff Hlywa (jhlywa@gmail.com)
	 * Released under the BSD license
	 * https://github.com/jhlywa/chess.js/blob/master/LICENSE
	 */

	var Chess = function(fen) {

	  /* jshint indent: false */

	  var BLACK = 'b';
	  var WHITE = 'w';

	  var EMPTY = -1;

	  var PAWN = 'p';
	  var KNIGHT = 'n';
	  var BISHOP = 'b';
	  var ROOK = 'r';
	  var QUEEN = 'q';
	  var KING = 'k';

	  var SYMBOLS = 'pnbrqkPNBRQK';

	  var DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	  var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

	  var PAWN_OFFSETS = {
	    b: [16, 32, 17, 15],
	    w: [-16, -32, -17, -15]
	  };

	  var PIECE_OFFSETS = {
	    n: [-18, -33, -31, -14,  18, 33, 31,  14],
	    b: [-17, -15,  17,  15],
	    r: [-16,   1,  16,  -1],
	    q: [-17, -16, -15,   1,  17, 16, 15,  -1],
	    k: [-17, -16, -15,   1,  17, 16, 15,  -1]
	  };

	  var ATTACKS = [
	    20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20, 0,
	     0,20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0,
	     0, 0,20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0,
	     0, 0, 0,20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0,
	     0, 0, 0, 0,20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0,
	     0, 0, 0, 0, 0,20, 2, 24,  2,20, 0, 0, 0, 0, 0, 0,
	     0, 0, 0, 0, 0, 2,53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
	    24,24,24,24,24,24,56,  0, 56,24,24,24,24,24,24, 0,
	     0, 0, 0, 0, 0, 2,53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
	     0, 0, 0, 0, 0,20, 2, 24,  2,20, 0, 0, 0, 0, 0, 0,
	     0, 0, 0, 0,20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0,
	     0, 0, 0,20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0,
	     0, 0,20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0,
	     0,20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0,
	    20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20
	  ];

	  var RAYS = [
	     17,  0,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0,  0, 15, 0,
	      0, 17,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0, 15,  0, 0,
	      0,  0, 17,  0,  0,  0,  0, 16,  0,  0,  0,  0, 15,  0,  0, 0,
	      0,  0,  0, 17,  0,  0,  0, 16,  0,  0,  0, 15,  0,  0,  0, 0,
	      0,  0,  0,  0, 17,  0,  0, 16,  0,  0, 15,  0,  0,  0,  0, 0,
	      0,  0,  0,  0,  0, 17,  0, 16,  0, 15,  0,  0,  0,  0,  0, 0,
	      0,  0,  0,  0,  0,  0, 17, 16, 15,  0,  0,  0,  0,  0,  0, 0,
	      1,  1,  1,  1,  1,  1,  1,  0, -1, -1,  -1,-1, -1, -1, -1, 0,
	      0,  0,  0,  0,  0,  0,-15,-16,-17,  0,  0,  0,  0,  0,  0, 0,
	      0,  0,  0,  0,  0,-15,  0,-16,  0,-17,  0,  0,  0,  0,  0, 0,
	      0,  0,  0,  0,-15,  0,  0,-16,  0,  0,-17,  0,  0,  0,  0, 0,
	      0,  0,  0,-15,  0,  0,  0,-16,  0,  0,  0,-17,  0,  0,  0, 0,
	      0,  0,-15,  0,  0,  0,  0,-16,  0,  0,  0,  0,-17,  0,  0, 0,
	      0,-15,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,-17,  0, 0,
	    -15,  0,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,  0,-17
	  ];

	  var SHIFTS = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 };

	  var FLAGS = {
	    NORMAL: 'n',
	    CAPTURE: 'c',
	    BIG_PAWN: 'b',
	    EP_CAPTURE: 'e',
	    PROMOTION: 'p',
	    KSIDE_CASTLE: 'k',
	    QSIDE_CASTLE: 'q'
	  };

	  var BITS = {
	    NORMAL: 1,
	    CAPTURE: 2,
	    BIG_PAWN: 4,
	    EP_CAPTURE: 8,
	    PROMOTION: 16,
	    KSIDE_CASTLE: 32,
	    QSIDE_CASTLE: 64
	  };

	  var RANK_1 = 7;
	  var RANK_2 = 6;
	  var RANK_7 = 1;
	  var RANK_8 = 0;

	  var SQUARES = {
	    a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
	    a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
	    a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
	    a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
	    a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
	    a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
	    a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
	    a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
	  };

	  var ROOKS = {
	    w: [{square: SQUARES.a1, flag: BITS.QSIDE_CASTLE},
	        {square: SQUARES.h1, flag: BITS.KSIDE_CASTLE}],
	    b: [{square: SQUARES.a8, flag: BITS.QSIDE_CASTLE},
	        {square: SQUARES.h8, flag: BITS.KSIDE_CASTLE}]
	  };

	  var board = new Array(128);
	  var kings = {w: EMPTY, b: EMPTY};
	  var turn = WHITE;
	  var castling = {w: 0, b: 0};
	  var ep_square = EMPTY;
	  var half_moves = 0;
	  var move_number = 1;
	  var history = [];
	  var header = {};

	  /* if the user passes in a fen string, load it, else default to
	   * starting position
	   */
	  if (typeof fen === 'undefined') {
	    load(DEFAULT_POSITION);
	  } else {
	    load(fen);
	  }

	  function clear() {
	    board = new Array(128);
	    kings = {w: EMPTY, b: EMPTY};
	    turn = WHITE;
	    castling = {w: 0, b: 0};
	    ep_square = EMPTY;
	    half_moves = 0;
	    move_number = 1;
	    history = [];
	    header = {};
	    update_setup(generate_fen());
	  }

	  function reset() {
	    load(DEFAULT_POSITION);
	  }

	  function load(fen) {
	    var tokens = fen.split(/\s+/);
	    var position = tokens[0];
	    var square = 0;

	    if (!validate_fen(fen).valid) {
	      return false;
	    }

	    clear();

	    for (var i = 0; i < position.length; i++) {
	      var piece = position.charAt(i);

	      if (piece === '/') {
	        square += 8;
	      } else if (is_digit(piece)) {
	        square += parseInt(piece, 10);
	      } else {
	        var color = (piece < 'a') ? WHITE : BLACK;
	        put({type: piece.toLowerCase(), color: color}, algebraic(square));
	        square++;
	      }
	    }

	    turn = tokens[1];

	    if (tokens[2].indexOf('K') > -1) {
	      castling.w |= BITS.KSIDE_CASTLE;
	    }
	    if (tokens[2].indexOf('Q') > -1) {
	      castling.w |= BITS.QSIDE_CASTLE;
	    }
	    if (tokens[2].indexOf('k') > -1) {
	      castling.b |= BITS.KSIDE_CASTLE;
	    }
	    if (tokens[2].indexOf('q') > -1) {
	      castling.b |= BITS.QSIDE_CASTLE;
	    }

	    ep_square = (tokens[3] === '-') ? EMPTY : SQUARES[tokens[3]];
	    half_moves = parseInt(tokens[4], 10);
	    move_number = parseInt(tokens[5], 10);

	    update_setup(generate_fen());

	    return true;
	  }

	  /* TODO: this function is pretty much crap - it validates structure but
	   * completely ignores content (e.g. doesn't verify that each side has a king)
	   * ... we should rewrite this, and ditch the silly error_number field while
	   * we're at it
	   */
	  function validate_fen(fen) {
	    var errors = {
	       0: 'No errors.',
	       1: 'FEN string must contain six space-delimited fields.',
	       2: '6th field (move number) must be a positive integer.',
	       3: '5th field (half move counter) must be a non-negative integer.',
	       4: '4th field (en-passant square) is invalid.',
	       5: '3rd field (castling availability) is invalid.',
	       6: '2nd field (side to move) is invalid.',
	       7: '1st field (piece positions) does not contain 8 \'/\'-delimited rows.',
	       8: '1st field (piece positions) is invalid [consecutive numbers].',
	       9: '1st field (piece positions) is invalid [invalid piece].',
	      10: '1st field (piece positions) is invalid [row too large].',
	      11: 'Illegal en-passant square',
	    };

	    /* 1st criterion: 6 space-seperated fields? */
	    var tokens = fen.split(/\s+/);
	    if (tokens.length !== 6) {
	      return {valid: false, error_number: 1, error: errors[1]};
	    }

	    /* 2nd criterion: move number field is a integer value > 0? */
	    if (isNaN(tokens[5]) || (parseInt(tokens[5], 10) <= 0)) {
	      return {valid: false, error_number: 2, error: errors[2]};
	    }

	    /* 3rd criterion: half move counter is an integer >= 0? */
	    if (isNaN(tokens[4]) || (parseInt(tokens[4], 10) < 0)) {
	      return {valid: false, error_number: 3, error: errors[3]};
	    }

	    /* 4th criterion: 4th field is a valid e.p.-string? */
	    if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
	      return {valid: false, error_number: 4, error: errors[4]};
	    }

	    /* 5th criterion: 3th field is a valid castle-string? */
	    if( !/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
	      return {valid: false, error_number: 5, error: errors[5]};
	    }

	    /* 6th criterion: 2nd field is "w" (white) or "b" (black)? */
	    if (!/^(w|b)$/.test(tokens[1])) {
	      return {valid: false, error_number: 6, error: errors[6]};
	    }

	    /* 7th criterion: 1st field contains 8 rows? */
	    var rows = tokens[0].split('/');
	    if (rows.length !== 8) {
	      return {valid: false, error_number: 7, error: errors[7]};
	    }

	    /* 8th criterion: every row is valid? */
	    for (var i = 0; i < rows.length; i++) {
	      /* check for right sum of fields AND not two numbers in succession */
	      var sum_fields = 0;
	      var previous_was_number = false;

	      for (var k = 0; k < rows[i].length; k++) {
	        if (!isNaN(rows[i][k])) {
	          if (previous_was_number) {
	            return {valid: false, error_number: 8, error: errors[8]};
	          }
	          sum_fields += parseInt(rows[i][k], 10);
	          previous_was_number = true;
	        } else {
	          if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
	            return {valid: false, error_number: 9, error: errors[9]};
	          }
	          sum_fields += 1;
	          previous_was_number = false;
	        }
	      }
	      if (sum_fields !== 8) {
	        return {valid: false, error_number: 10, error: errors[10]};
	      }
	    }

	    if ((tokens[3][1] == '3' && tokens[1] == 'w') ||
	        (tokens[3][1] == '6' && tokens[1] == 'b')) {
	          return {valid: false, error_number: 11, error: errors[11]};
	    }

	    /* everything's okay! */
	    return {valid: true, error_number: 0, error: errors[0]};
	  }

	  function generate_fen() {
	    var empty = 0;
	    var fen = '';

	    for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
	      if (board[i] == null) {
	        empty++;
	      } else {
	        if (empty > 0) {
	          fen += empty;
	          empty = 0;
	        }
	        var color = board[i].color;
	        var piece = board[i].type;

	        fen += (color === WHITE) ?
	                 piece.toUpperCase() : piece.toLowerCase();
	      }

	      if ((i + 1) & 0x88) {
	        if (empty > 0) {
	          fen += empty;
	        }

	        if (i !== SQUARES.h1) {
	          fen += '/';
	        }

	        empty = 0;
	        i += 8;
	      }
	    }

	    var cflags = '';
	    if (castling[WHITE] & BITS.KSIDE_CASTLE) { cflags += 'K'; }
	    if (castling[WHITE] & BITS.QSIDE_CASTLE) { cflags += 'Q'; }
	    if (castling[BLACK] & BITS.KSIDE_CASTLE) { cflags += 'k'; }
	    if (castling[BLACK] & BITS.QSIDE_CASTLE) { cflags += 'q'; }

	    /* do we have an empty castling flag? */
	    cflags = cflags || '-';
	    var epflags = (ep_square === EMPTY) ? '-' : algebraic(ep_square);

	    return [fen, turn, cflags, epflags, half_moves, move_number].join(' ');
	  }

	  function set_header(args) {
	    for (var i = 0; i < args.length; i += 2) {
	      if (typeof args[i] === 'string' &&
	          typeof args[i + 1] === 'string') {
	        header[args[i]] = args[i + 1];
	      }
	    }
	    return header;
	  }

	  /* called when the initial board setup is changed with put() or remove().
	   * modifies the SetUp and FEN properties of the header object.  if the FEN is
	   * equal to the default position, the SetUp and FEN are deleted
	   * the setup is only updated if history.length is zero, ie moves haven't been
	   * made.
	   */
	  function update_setup(fen) {
	    if (history.length > 0) return;

	    if (fen !== DEFAULT_POSITION) {
	      header['SetUp'] = '1';
	      header['FEN'] = fen;
	    } else {
	      delete header['SetUp'];
	      delete header['FEN'];
	    }
	  }

	  function get(square) {
	    var piece = board[SQUARES[square]];
	    return (piece) ? {type: piece.type, color: piece.color} : null;
	  }

	  function put(piece, square) {
	    /* check for valid piece object */
	    if (!('type' in piece && 'color' in piece)) {
	      return false;
	    }

	    /* check for piece */
	    if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
	      return false;
	    }

	    /* check for valid square */
	    if (!(square in SQUARES)) {
	      return false;
	    }

	    var sq = SQUARES[square];

	    /* don't let the user place more than one king */
	    if (piece.type == KING &&
	        !(kings[piece.color] == EMPTY || kings[piece.color] == sq)) {
	      return false;
	    }

	    board[sq] = {type: piece.type, color: piece.color};
	    if (piece.type === KING) {
	      kings[piece.color] = sq;
	    }

	    update_setup(generate_fen());

	    return true;
	  }

	  function remove(square) {
	    var piece = get(square);
	    board[SQUARES[square]] = null;
	    if (piece && piece.type === KING) {
	      kings[piece.color] = EMPTY;
	    }

	    update_setup(generate_fen());

	    return piece;
	  }

	  function build_move(board, from, to, flags, promotion) {
	    var move = {
	      color: turn,
	      from: from,
	      to: to,
	      flags: flags,
	      piece: board[from].type
	    };

	    if (promotion) {
	      move.flags |= BITS.PROMOTION;
	      move.promotion = promotion;
	    }

	    if (board[to]) {
	      move.captured = board[to].type;
	    } else if (flags & BITS.EP_CAPTURE) {
	        move.captured = PAWN;
	    }
	    return move;
	  }

	  function generate_moves(options) {
	    function add_move(board, moves, from, to, flags) {
	      /* if pawn promotion */
	      if (board[from].type === PAWN &&
	         (rank(to) === RANK_8 || rank(to) === RANK_1)) {
	          var pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
	          for (var i = 0, len = pieces.length; i < len; i++) {
	            moves.push(build_move(board, from, to, flags, pieces[i]));
	          }
	      } else {
	       moves.push(build_move(board, from, to, flags));
	      }
	    }

	    var moves = [];
	    var us = turn;
	    var them = swap_color(us);
	    var second_rank = {b: RANK_7, w: RANK_2};

	    var first_sq = SQUARES.a8;
	    var last_sq = SQUARES.h1;
	    var single_square = false;

	    /* do we want legal moves? */
	    var legal = (typeof options !== 'undefined' && 'legal' in options) ?
	                options.legal : true;

	    /* are we generating moves for a single square? */
	    if (typeof options !== 'undefined' && 'square' in options) {
	      if (options.square in SQUARES) {
	        first_sq = last_sq = SQUARES[options.square];
	        single_square = true;
	      } else {
	        /* invalid square */
	        return [];
	      }
	    }

	    for (var i = first_sq; i <= last_sq; i++) {
	      /* did we run off the end of the board */
	      if (i & 0x88) { i += 7; continue; }

	      var piece = board[i];
	      if (piece == null || piece.color !== us) {
	        continue;
	      }

	      if (piece.type === PAWN) {
	        /* single square, non-capturing */
	        var square = i + PAWN_OFFSETS[us][0];
	        if (board[square] == null) {
	            add_move(board, moves, i, square, BITS.NORMAL);

	          /* double square */
	          var square = i + PAWN_OFFSETS[us][1];
	          if (second_rank[us] === rank(i) && board[square] == null) {
	            add_move(board, moves, i, square, BITS.BIG_PAWN);
	          }
	        }

	        /* pawn captures */
	        for (j = 2; j < 4; j++) {
	          var square = i + PAWN_OFFSETS[us][j];
	          if (square & 0x88) continue;

	          if (board[square] != null &&
	              board[square].color === them) {
	              add_move(board, moves, i, square, BITS.CAPTURE);
	          } else if (square === ep_square) {
	              add_move(board, moves, i, ep_square, BITS.EP_CAPTURE);
	          }
	        }
	      } else {
	        for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
	          var offset = PIECE_OFFSETS[piece.type][j];
	          var square = i;

	          while (true) {
	            square += offset;
	            if (square & 0x88) break;

	            if (board[square] == null) {
	              add_move(board, moves, i, square, BITS.NORMAL);
	            } else {
	              if (board[square].color === us) break;
	              add_move(board, moves, i, square, BITS.CAPTURE);
	              break;
	            }

	            /* break, if knight or king */
	            if (piece.type === 'n' || piece.type === 'k') break;
	          }
	        }
	      }
	    }

	    /* check for castling if: a) we're generating all moves, or b) we're doing
	     * single square move generation on the king's square
	     */
	    if ((!single_square) || last_sq === kings[us]) {
	      /* king-side castling */
	      if (castling[us] & BITS.KSIDE_CASTLE) {
	        var castling_from = kings[us];
	        var castling_to = castling_from + 2;

	        if (board[castling_from + 1] == null &&
	            board[castling_to]       == null &&
	            !attacked(them, kings[us]) &&
	            !attacked(them, castling_from + 1) &&
	            !attacked(them, castling_to)) {
	          add_move(board, moves, kings[us] , castling_to,
	                   BITS.KSIDE_CASTLE);
	        }
	      }

	      /* queen-side castling */
	      if (castling[us] & BITS.QSIDE_CASTLE) {
	        var castling_from = kings[us];
	        var castling_to = castling_from - 2;

	        if (board[castling_from - 1] == null &&
	            board[castling_from - 2] == null &&
	            board[castling_from - 3] == null &&
	            !attacked(them, kings[us]) &&
	            !attacked(them, castling_from - 1) &&
	            !attacked(them, castling_to)) {
	          add_move(board, moves, kings[us], castling_to,
	                   BITS.QSIDE_CASTLE);
	        }
	      }
	    }

	    /* return all pseudo-legal moves (this includes moves that allow the king
	     * to be captured)
	     */
	    if (!legal) {
	      return moves;
	    }

	    /* filter out illegal moves */
	    var legal_moves = [];
	    for (var i = 0, len = moves.length; i < len; i++) {
	      make_move(moves[i]);
	      if (!king_attacked(us)) {
	        legal_moves.push(moves[i]);
	      }
	      undo_move();
	    }

	    return legal_moves;
	  }

	  /* convert a move from 0x88 coordinates to Standard Algebraic Notation
	   * (SAN)
	   *
	   * @param {boolean} sloppy Use the sloppy SAN generator to work around over
	   * disambiguation bugs in Fritz and Chessbase.  See below:
	   *
	   * r1bqkbnr/ppp2ppp/2n5/1B1pP3/4P3/8/PPPP2PP/RNBQK1NR b KQkq - 2 4
	   * 4. ... Nge7 is overly disambiguated because the knight on c6 is pinned
	   * 4. ... Ne7 is technically the valid SAN
	   */
	  function move_to_san(move, sloppy) {

	    var output = '';

	    if (move.flags & BITS.KSIDE_CASTLE) {
	      output = 'O-O';
	    } else if (move.flags & BITS.QSIDE_CASTLE) {
	      output = 'O-O-O';
	    } else {
	      var disambiguator = get_disambiguator(move, sloppy);

	      if (move.piece !== PAWN) {
	        output += move.piece.toUpperCase() + disambiguator;
	      }

	      if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
	        if (move.piece === PAWN) {
	          output += algebraic(move.from)[0];
	        }
	        output += 'x';
	      }

	      output += algebraic(move.to);

	      if (move.flags & BITS.PROMOTION) {
	        output += '=' + move.promotion.toUpperCase();
	      }
	    }

	    make_move(move);
	    if (in_check()) {
	      if (in_checkmate()) {
	        output += '#';
	      } else {
	        output += '+';
	      }
	    }
	    undo_move();

	    return output;
	  }

	  // parses all of the decorators out of a SAN string
	  function stripped_san(move) {
	    return move.replace(/=/,'').replace(/[+#]?[?!]*$/,'');
	  }

	  function attacked(color, square) {
	    if (square < 0) return false;
	    for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
	      /* did we run off the end of the board */
	      if (i & 0x88) { i += 7; continue; }

	      /* if empty square or wrong color */
	      if (board[i] == null || board[i].color !== color) continue;

	      var piece = board[i];
	      var difference = i - square;
	      var index = difference + 119;

	      if (ATTACKS[index] & (1 << SHIFTS[piece.type])) {
	        if (piece.type === PAWN) {
	          if (difference > 0) {
	            if (piece.color === WHITE) return true;
	          } else {
	            if (piece.color === BLACK) return true;
	          }
	          continue;
	        }

	        /* if the piece is a knight or a king */
	        if (piece.type === 'n' || piece.type === 'k') return true;

	        var offset = RAYS[index];
	        var j = i + offset;

	        var blocked = false;
	        while (j !== square) {
	          if (board[j] != null) { blocked = true; break; }
	          j += offset;
	        }

	        if (!blocked) return true;
	      }
	    }

	    return false;
	  }

	  function king_attacked(color) {
	    return attacked(swap_color(color), kings[color]);
	  }

	  function in_check() {
	    return king_attacked(turn);
	  }

	  function in_checkmate() {
	    return in_check() && generate_moves().length === 0;
	  }

	  function in_stalemate() {
	    return !in_check() && generate_moves().length === 0;
	  }

	  function insufficient_material() {
	    var pieces = {};
	    var bishops = [];
	    var num_pieces = 0;
	    var sq_color = 0;

	    for (var i = SQUARES.a8; i<= SQUARES.h1; i++) {
	      sq_color = (sq_color + 1) % 2;
	      if (i & 0x88) { i += 7; continue; }

	      var piece = board[i];
	      if (piece) {
	        pieces[piece.type] = (piece.type in pieces) ?
	                              pieces[piece.type] + 1 : 1;
	        if (piece.type === BISHOP) {
	          bishops.push(sq_color);
	        }
	        num_pieces++;
	      }
	    }

	    /* k vs. k */
	    if (num_pieces === 2) { return true; }

	    /* k vs. kn .... or .... k vs. kb */
	    else if (num_pieces === 3 && (pieces[BISHOP] === 1 ||
	                                 pieces[KNIGHT] === 1)) { return true; }

	    /* kb vs. kb where any number of bishops are all on the same color */
	    else if (num_pieces === pieces[BISHOP] + 2) {
	      var sum = 0;
	      var len = bishops.length;
	      for (var i = 0; i < len; i++) {
	        sum += bishops[i];
	      }
	      if (sum === 0 || sum === len) { return true; }
	    }

	    return false;
	  }

	  function in_threefold_repetition() {
	    /* TODO: while this function is fine for casual use, a better
	     * implementation would use a Zobrist key (instead of FEN). the
	     * Zobrist key would be maintained in the make_move/undo_move functions,
	     * avoiding the costly that we do below.
	     */
	    var moves = [];
	    var positions = {};
	    var repetition = false;

	    while (true) {
	      var move = undo_move();
	      if (!move) break;
	      moves.push(move);
	    }

	    while (true) {
	      /* remove the last two fields in the FEN string, they're not needed
	       * when checking for draw by rep */
	      var fen = generate_fen().split(' ').slice(0,4).join(' ');

	      /* has the position occurred three or move times */
	      positions[fen] = (fen in positions) ? positions[fen] + 1 : 1;
	      if (positions[fen] >= 3) {
	        repetition = true;
	      }

	      if (!moves.length) {
	        break;
	      }
	      make_move(moves.pop());
	    }

	    return repetition;
	  }

	  function push(move) {
	    history.push({
	      move: move,
	      kings: {b: kings.b, w: kings.w},
	      turn: turn,
	      castling: {b: castling.b, w: castling.w},
	      ep_square: ep_square,
	      half_moves: half_moves,
	      move_number: move_number
	    });
	  }

	  function make_move(move) {
	    var us = turn;
	    var them = swap_color(us);
	    push(move);

	    board[move.to] = board[move.from];
	    board[move.from] = null;

	    /* if ep capture, remove the captured pawn */
	    if (move.flags & BITS.EP_CAPTURE) {
	      if (turn === BLACK) {
	        board[move.to - 16] = null;
	      } else {
	        board[move.to + 16] = null;
	      }
	    }

	    /* if pawn promotion, replace with new piece */
	    if (move.flags & BITS.PROMOTION) {
	      board[move.to] = {type: move.promotion, color: us};
	    }

	    /* if we moved the king */
	    if (board[move.to].type === KING) {
	      kings[board[move.to].color] = move.to;

	      /* if we castled, move the rook next to the king */
	      if (move.flags & BITS.KSIDE_CASTLE) {
	        var castling_to = move.to - 1;
	        var castling_from = move.to + 1;
	        board[castling_to] = board[castling_from];
	        board[castling_from] = null;
	      } else if (move.flags & BITS.QSIDE_CASTLE) {
	        var castling_to = move.to + 1;
	        var castling_from = move.to - 2;
	        board[castling_to] = board[castling_from];
	        board[castling_from] = null;
	      }

	      /* turn off castling */
	      castling[us] = '';
	    }

	    /* turn off castling if we move a rook */
	    if (castling[us]) {
	      for (var i = 0, len = ROOKS[us].length; i < len; i++) {
	        if (move.from === ROOKS[us][i].square &&
	            castling[us] & ROOKS[us][i].flag) {
	          castling[us] ^= ROOKS[us][i].flag;
	          break;
	        }
	      }
	    }

	    /* turn off castling if we capture a rook */
	    if (castling[them]) {
	      for (var i = 0, len = ROOKS[them].length; i < len; i++) {
	        if (move.to === ROOKS[them][i].square &&
	            castling[them] & ROOKS[them][i].flag) {
	          castling[them] ^= ROOKS[them][i].flag;
	          break;
	        }
	      }
	    }

	    /* if big pawn move, update the en passant square */
	    if (move.flags & BITS.BIG_PAWN) {
	      if (turn === 'b') {
	        ep_square = move.to - 16;
	      } else {
	        ep_square = move.to + 16;
	      }
	    } else {
	      ep_square = EMPTY;
	    }

	    /* reset the 50 move counter if a pawn is moved or a piece is captured */
	    if (move.piece === PAWN) {
	      half_moves = 0;
	    } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
	      half_moves = 0;
	    } else {
	      half_moves++;
	    }

	    if (turn === BLACK) {
	      move_number++;
	    }
	    turn = swap_color(turn);
	  }

	  function undo_move() {
	    var old = history.pop();
	    if (old == null) { return null; }

	    var move = old.move;
	    kings = old.kings;
	    turn = old.turn;
	    castling = old.castling;
	    ep_square = old.ep_square;
	    half_moves = old.half_moves;
	    move_number = old.move_number;

	    var us = turn;
	    var them = swap_color(turn);

	    board[move.from] = board[move.to];
	    board[move.from].type = move.piece;  // to undo any promotions
	    board[move.to] = null;

	    if (move.flags & BITS.CAPTURE) {
	      board[move.to] = {type: move.captured, color: them};
	    } else if (move.flags & BITS.EP_CAPTURE) {
	      var index;
	      if (us === BLACK) {
	        index = move.to - 16;
	      } else {
	        index = move.to + 16;
	      }
	      board[index] = {type: PAWN, color: them};
	    }


	    if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
	      var castling_to, castling_from;
	      if (move.flags & BITS.KSIDE_CASTLE) {
	        castling_to = move.to + 1;
	        castling_from = move.to - 1;
	      } else if (move.flags & BITS.QSIDE_CASTLE) {
	        castling_to = move.to - 2;
	        castling_from = move.to + 1;
	      }

	      board[castling_to] = board[castling_from];
	      board[castling_from] = null;
	    }

	    return move;
	  }

	  /* this function is used to uniquely identify ambiguous moves */
	  function get_disambiguator(move, sloppy) {
	    var moves = generate_moves({legal: !sloppy});

	    var from = move.from;
	    var to = move.to;
	    var piece = move.piece;

	    var ambiguities = 0;
	    var same_rank = 0;
	    var same_file = 0;

	    for (var i = 0, len = moves.length; i < len; i++) {
	      var ambig_from = moves[i].from;
	      var ambig_to = moves[i].to;
	      var ambig_piece = moves[i].piece;

	      /* if a move of the same piece type ends on the same to square, we'll
	       * need to add a disambiguator to the algebraic notation
	       */
	      if (piece === ambig_piece && from !== ambig_from && to === ambig_to) {
	        ambiguities++;

	        if (rank(from) === rank(ambig_from)) {
	          same_rank++;
	        }

	        if (file(from) === file(ambig_from)) {
	          same_file++;
	        }
	      }
	    }

	    if (ambiguities > 0) {
	      /* if there exists a similar moving piece on the same rank and file as
	       * the move in question, use the square as the disambiguator
	       */
	      if (same_rank > 0 && same_file > 0) {
	        return algebraic(from);
	      }
	      /* if the moving piece rests on the same file, use the rank symbol as the
	       * disambiguator
	       */
	      else if (same_file > 0) {
	        return algebraic(from).charAt(1);
	      }
	      /* else use the file symbol */
	      else {
	        return algebraic(from).charAt(0);
	      }
	    }

	    return '';
	  }

	  function ascii() {
	    var s = '   +------------------------+\n';
	    for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
	      /* display the rank */
	      if (file(i) === 0) {
	        s += ' ' + '87654321'[rank(i)] + ' |';
	      }

	      /* empty piece */
	      if (board[i] == null) {
	        s += ' . ';
	      } else {
	        var piece = board[i].type;
	        var color = board[i].color;
	        var symbol = (color === WHITE) ?
	                     piece.toUpperCase() : piece.toLowerCase();
	        s += ' ' + symbol + ' ';
	      }

	      if ((i + 1) & 0x88) {
	        s += '|\n';
	        i += 8;
	      }
	    }
	    s += '   +------------------------+\n';
	    s += '     a  b  c  d  e  f  g  h\n';

	    return s;
	  }

	  // convert a move from Standard Algebraic Notation (SAN) to 0x88 coordinates
	  function move_from_san(move, sloppy) {
	    // strip off any move decorations: e.g Nf3+?!
	    var clean_move = stripped_san(move);

	    // if we're using the sloppy parser run a regex to grab piece, to, and from
	    // this should parse invalid SAN like: Pe2-e4, Rc1c4, Qf3xf7
	    if (sloppy) {
	      var matches = clean_move.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/);
	      if (matches) {
	        var piece = matches[1];
	        var from = matches[2];
	        var to = matches[3];
	        var promotion = matches[4];
	      }
	    }

	    var moves = generate_moves();
	    for (var i = 0, len = moves.length; i < len; i++) {
	      // try the strict parser first, then the sloppy parser if requested
	      // by the user
	      if ((clean_move === stripped_san(move_to_san(moves[i]))) ||
	          (sloppy && clean_move === stripped_san(move_to_san(moves[i], true)))) {
	        return moves[i];
	      } else {
	        if (matches &&
	            (!piece || piece.toLowerCase() == moves[i].piece) &&
	            SQUARES[from] == moves[i].from &&
	            SQUARES[to] == moves[i].to &&
	            (!promotion || promotion.toLowerCase() == moves[i].promotion)) {
	          return moves[i];
	        }
	      }
	    }

	    return null;
	  }


	  /*****************************************************************************
	   * UTILITY FUNCTIONS
	   ****************************************************************************/
	  function rank(i) {
	    return i >> 4;
	  }

	  function file(i) {
	    return i & 15;
	  }

	  function algebraic(i){
	    var f = file(i), r = rank(i);
	    return 'abcdefgh'.substring(f,f+1) + '87654321'.substring(r,r+1);
	  }

	  function swap_color(c) {
	    return c === WHITE ? BLACK : WHITE;
	  }

	  function is_digit(c) {
	    return '0123456789'.indexOf(c) !== -1;
	  }

	  /* pretty = external move object */
	  function make_pretty(ugly_move) {
	    var move = clone(ugly_move);
	    move.san = move_to_san(move, false);
	    move.to = algebraic(move.to);
	    move.from = algebraic(move.from);

	    var flags = '';

	    for (var flag in BITS) {
	      if (BITS[flag] & move.flags) {
	        flags += FLAGS[flag];
	      }
	    }
	    move.flags = flags;

	    return move;
	  }

	  function clone(obj) {
	    var dupe = (obj instanceof Array) ? [] : {};

	    for (var property in obj) {
	      if (typeof property === 'object') {
	        dupe[property] = clone(obj[property]);
	      } else {
	        dupe[property] = obj[property];
	      }
	    }

	    return dupe;
	  }

	  function trim(str) {
	    return str.replace(/^\s+|\s+$/g, '');
	  }

	  /*****************************************************************************
	   * DEBUGGING UTILITIES
	   ****************************************************************************/
	  function perft(depth) {
	    var moves = generate_moves({legal: false});
	    var nodes = 0;
	    var color = turn;

	    for (var i = 0, len = moves.length; i < len; i++) {
	      make_move(moves[i]);
	      if (!king_attacked(color)) {
	        if (depth - 1 > 0) {
	          var child_nodes = perft(depth - 1);
	          nodes += child_nodes;
	        } else {
	          nodes++;
	        }
	      }
	      undo_move();
	    }

	    return nodes;
	  }

	  return {
	    /***************************************************************************
	     * PUBLIC CONSTANTS (is there a better way to do this?)
	     **************************************************************************/
	    WHITE: WHITE,
	    BLACK: BLACK,
	    PAWN: PAWN,
	    KNIGHT: KNIGHT,
	    BISHOP: BISHOP,
	    ROOK: ROOK,
	    QUEEN: QUEEN,
	    KING: KING,
	    SQUARES: (function() {
	                /* from the ECMA-262 spec (section 12.6.4):
	                 * "The mechanics of enumerating the properties ... is
	                 * implementation dependent"
	                 * so: for (var sq in SQUARES) { keys.push(sq); } might not be
	                 * ordered correctly
	                 */
	                var keys = [];
	                for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
	                  if (i & 0x88) { i += 7; continue; }
	                  keys.push(algebraic(i));
	                }
	                return keys;
	              })(),
	    FLAGS: FLAGS,

	    /***************************************************************************
	     * PUBLIC API
	     **************************************************************************/
	    load: function(fen) {
	      return load(fen);
	    },

	    reset: function() {
	      return reset();
	    },

	    moves: function(options) {
	      /* The internal representation of a chess move is in 0x88 format, and
	       * not meant to be human-readable.  The code below converts the 0x88
	       * square coordinates to algebraic coordinates.  It also prunes an
	       * unnecessary move keys resulting from a verbose call.
	       */

	      var ugly_moves = generate_moves(options);
	      var moves = [];

	      for (var i = 0, len = ugly_moves.length; i < len; i++) {

	        /* does the user want a full move object (most likely not), or just
	         * SAN
	         */
	        if (typeof options !== 'undefined' && 'verbose' in options &&
	            options.verbose) {
	          moves.push(make_pretty(ugly_moves[i]));
	        } else {
	          moves.push(move_to_san(ugly_moves[i], false));
	        }
	      }

	      return moves;
	    },

	    in_check: function() {
	      return in_check();
	    },

	    in_checkmate: function() {
	      return in_checkmate();
	    },

	    in_stalemate: function() {
	      return in_stalemate();
	    },

	    in_draw: function() {
	      return half_moves >= 100 ||
	             in_stalemate() ||
	             insufficient_material() ||
	             in_threefold_repetition();
	    },

	    insufficient_material: function() {
	      return insufficient_material();
	    },

	    in_threefold_repetition: function() {
	      return in_threefold_repetition();
	    },

	    game_over: function() {
	      return half_moves >= 100 ||
	             in_checkmate() ||
	             in_stalemate() ||
	             insufficient_material() ||
	             in_threefold_repetition();
	    },

	    validate_fen: function(fen) {
	      return validate_fen(fen);
	    },

	    fen: function() {
	      return generate_fen();
	    },

	    pgn: function(options) {
	      /* using the specification from http://www.chessclub.com/help/PGN-spec
	       * example for html usage: .pgn({ max_width: 72, newline_char: "<br />" })
	       */
	      var newline = (typeof options === 'object' &&
	                     typeof options.newline_char === 'string') ?
	                     options.newline_char : '\n';
	      var max_width = (typeof options === 'object' &&
	                       typeof options.max_width === 'number') ?
	                       options.max_width : 0;
	      var result = [];
	      var header_exists = false;

	      /* add the PGN header headerrmation */
	      for (var i in header) {
	        /* TODO: order of enumerated properties in header object is not
	         * guaranteed, see ECMA-262 spec (section 12.6.4)
	         */
	        result.push('[' + i + ' \"' + header[i] + '\"]' + newline);
	        header_exists = true;
	      }

	      if (header_exists && history.length) {
	        result.push(newline);
	      }

	      /* pop all of history onto reversed_history */
	      var reversed_history = [];
	      while (history.length > 0) {
	        reversed_history.push(undo_move());
	      }

	      var moves = [];
	      var move_string = '';

	      /* build the list of moves.  a move_string looks like: "3. e3 e6" */
	      while (reversed_history.length > 0) {
	        var move = reversed_history.pop();

	        /* if the position started with black to move, start PGN with 1. ... */
	        if (!history.length && move.color === 'b') {
	          move_string = move_number + '. ...';
	        } else if (move.color === 'w') {
	          /* store the previous generated move_string if we have one */
	          if (move_string.length) {
	            moves.push(move_string);
	          }
	          move_string = move_number + '.';
	        }

	        move_string = move_string + ' ' + move_to_san(move, false);
	        make_move(move);
	      }

	      /* are there any other leftover moves? */
	      if (move_string.length) {
	        moves.push(move_string);
	      }

	      /* is there a result? */
	      if (typeof header.Result !== 'undefined') {
	        moves.push(header.Result);
	      }

	      /* history should be back to what is was before we started generating PGN,
	       * so join together moves
	       */
	      if (max_width === 0) {
	        return result.join('') + moves.join(' ');
	      }

	      /* wrap the PGN output at max_width */
	      var current_width = 0;
	      for (var i = 0; i < moves.length; i++) {
	        /* if the current move will push past max_width */
	        if (current_width + moves[i].length > max_width && i !== 0) {

	          /* don't end the line with whitespace */
	          if (result[result.length - 1] === ' ') {
	            result.pop();
	          }

	          result.push(newline);
	          current_width = 0;
	        } else if (i !== 0) {
	          result.push(' ');
	          current_width++;
	        }
	        result.push(moves[i]);
	        current_width += moves[i].length;
	      }

	      return result.join('');
	    },

	    load_pgn: function(pgn, options) {
	      // allow the user to specify the sloppy move parser to work around over
	      // disambiguation bugs in Fritz and Chessbase
	      var sloppy = (typeof options !== 'undefined' && 'sloppy' in options) ?
	                    options.sloppy : false;

	      function mask(str) {
	        return str.replace(/\\/g, '\\');
	      }

	      function has_keys(object) {
	        for (var key in object) {
	          return true;
	        }
	        return false;
	      }

	      function parse_pgn_header(header, options) {
	        var newline_char = (typeof options === 'object' &&
	                            typeof options.newline_char === 'string') ?
	                            options.newline_char : '\r?\n';
	        var header_obj = {};
	        var headers = header.split(new RegExp(mask(newline_char)));
	        var key = '';
	        var value = '';

	        for (var i = 0; i < headers.length; i++) {
	          key = headers[i].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
	          value = headers[i].replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');
	          if (trim(key).length > 0) {
	            header_obj[key] = value;
	          }
	        }

	        return header_obj;
	      }

	      var newline_char = (typeof options === 'object' &&
	                          typeof options.newline_char === 'string') ?
	                          options.newline_char : '\r?\n';
	      var regex = new RegExp('^(\\[(.|' + mask(newline_char) + ')*\\])' +
	                             '(' + mask(newline_char) + ')*' +
	                             '1.(' + mask(newline_char) + '|.)*$', 'g');

	      /* get header part of the PGN file */
	      var header_string = pgn.replace(regex, '$1');

	      /* no info part given, begins with moves */
	      if (header_string[0] !== '[') {
	        header_string = '';
	      }

	      reset();

	      /* parse PGN header */
	      var headers = parse_pgn_header(header_string, options);
	      for (var key in headers) {
	        set_header([key, headers[key]]);
	      }

	      /* load the starting position indicated by [Setup '1'] and
	      * [FEN position] */
	      if (headers['SetUp'] === '1') {
	          if (!(('FEN' in headers) && load(headers['FEN']))) {
	            return false;
	          }
	      }

	      /* delete header to get the moves */
	      var ms = pgn.replace(header_string, '').replace(new RegExp(mask(newline_char), 'g'), ' ');

	      /* delete comments */
	      ms = ms.replace(/(\{[^}]+\})+?/g, '');

	      /* delete recursive annotation variations */
	      var rav_regex = /(\([^\(\)]+\))+?/g;
	      while (rav_regex.test(ms)) {
	        ms = ms.replace(rav_regex, '');
	      }

	      /* delete move numbers */
	      ms = ms.replace(/\d+\.(\.\.)?/g, '');

	      /* delete ... indicating black to move */
	      ms = ms.replace(/\.\.\./g, '');

	      /* delete numeric annotation glyphs */
	      ms = ms.replace(/\$\d+/g, '');

	      /* trim and get array of moves */
	      var moves = trim(ms).split(new RegExp(/\s+/));

	      /* delete empty entries */
	      moves = moves.join(',').replace(/,,+/g, ',').split(',');
	      var move = '';

	      for (var half_move = 0; half_move < moves.length - 1; half_move++) {
	        move = move_from_san(moves[half_move], sloppy);

	        /* move not possible! (don't clear the board to examine to show the
	         * latest valid position)
	         */
	        if (move == null) {
	          return false;
	        } else {
	          make_move(move);
	        }
	      }

	      /* examine last move */
	      move = moves[moves.length - 1];
	      if (POSSIBLE_RESULTS.indexOf(move) > -1) {
	        if (has_keys(header) && typeof header.Result === 'undefined') {
	          set_header(['Result', move]);
	        }
	      }
	      else {
	        move = move_from_san(move, sloppy);
	        if (move == null) {
	          return false;
	        } else {
	          make_move(move);
	        }
	      }
	      return true;
	    },

	    header: function() {
	      return set_header(arguments);
	    },

	    ascii: function() {
	      return ascii();
	    },

	    turn: function() {
	      return turn;
	    },

	    move: function(move, options) {
	      /* The move function can be called with in the following parameters:
	       *
	       * .move('Nxb7')      <- where 'move' is a case-sensitive SAN string
	       *
	       * .move({ from: 'h7', <- where the 'move' is a move object (additional
	       *         to :'h8',      fields are ignored)
	       *         promotion: 'q',
	       *      })
	       */

	      // allow the user to specify the sloppy move parser to work around over
	      // disambiguation bugs in Fritz and Chessbase
	      var sloppy = (typeof options !== 'undefined' && 'sloppy' in options) ?
	                    options.sloppy : false;

	      var move_obj = null;

	      if (typeof move === 'string') {
	        move_obj = move_from_san(move, sloppy);
	      } else if (typeof move === 'object') {
	        var moves = generate_moves();

	        /* convert the pretty move object to an ugly move object */
	        for (var i = 0, len = moves.length; i < len; i++) {
	          if (move.from === algebraic(moves[i].from) &&
	              move.to === algebraic(moves[i].to) &&
	              (!('promotion' in moves[i]) ||
	              move.promotion === moves[i].promotion)) {
	            move_obj = moves[i];
	            break;
	          }
	        }
	      }

	      /* failed to find move */
	      if (!move_obj) {
	        return null;
	      }

	      /* need to make a copy of move because we can't generate SAN after the
	       * move is made
	       */
	      var pretty_move = make_pretty(move_obj);

	      make_move(move_obj);

	      return pretty_move;
	    },

	    undo: function() {
	      var move = undo_move();
	      return (move) ? make_pretty(move) : null;
	    },

	    clear: function() {
	      return clear();
	    },

	    put: function(piece, square) {
	      return put(piece, square);
	    },

	    get: function(square) {
	      return get(square);
	    },

	    remove: function(square) {
	      return remove(square);
	    },

	    perft: function(depth) {
	      return perft(depth);
	    },

	    square_color: function(square) {
	      if (square in SQUARES) {
	        var sq_0x88 = SQUARES[square];
	        return ((rank(sq_0x88) + file(sq_0x88)) % 2 === 0) ? 'light' : 'dark';
	      }

	      return null;
	    },

	    history: function(options) {
	      var reversed_history = [];
	      var move_history = [];
	      var verbose = (typeof options !== 'undefined' && 'verbose' in options &&
	                     options.verbose);

	      while (history.length > 0) {
	        reversed_history.push(undo_move());
	      }

	      while (reversed_history.length > 0) {
	        var move = reversed_history.pop();
	        if (verbose) {
	          move_history.push(make_pretty(move));
	        } else {
	          move_history.push(move_to_san(move));
	        }
	        make_move(move);
	      }

	      return move_history;
	    }

	  };
	};

	/* export Chess object if using node or any other CommonJS compatible
	 * environment */
	exports.Chess = Chess;
	});

	var Chess = chess$1.Chess;


	var chess = function (fen, appleKeys) {
	  var chess = new Chess(fen);

	  // adds enemy pawns on apples, for collisions
	  if (appleKeys) {
	    var color = chess.turn() === 'w' ? 'b' : 'w';
	    appleKeys.forEach(function (key) {
	      chess.put(
	        {
	          type: 'p',
	          color: color,
	        },
	        key
	      );
	    });
	  }

	  function getColor() {
	    return chess.turn() == 'w' ? 'white' : 'black';
	  }

	  function setColor(c) {
	    var turn = c === 'white' ? 'w' : 'b';
	    var newFen = util$2.setFenTurn(chess.fen(), turn);
	    chess.load(newFen);
	    if (getColor() !== c) {
	      // the en passant square prevents setting color
	      newFen = newFen.replace(/ (w|b) ([kKqQ-]{1,4}) \w\d /, ' ' + turn + ' $2 - ');
	      chess.load(newFen);
	    }
	  }

	  var findCaptures = function () {
	    return chess
	      .moves({
	        verbose: true,
	      })
	      .filter(function (move) {
	        return move.captured;
	      })
	      .map(function (move) {
	        return {
	          orig: move.from,
	          dest: move.to,
	        };
	      });
	  };

	  return {
	    dests: function (opts) {
	      opts = opts || {};
	      var dests = {};
	      chess.SQUARES.forEach(function (s) {
	        var ms = chess.moves({
	          square: s,
	          verbose: true,
	          legal: !opts.illegal,
	        });
	        if (ms.length)
	          dests[s] = ms.map(function (m) {
	            return m.to;
	          });
	      });
	      return dests;
	    },
	    color: function (c) {
	      if (c) setColor(c);
	      else return getColor();
	    },
	    fen: chess.fen,
	    move: function (orig, dest, prom) {
	      return chess.move({
	        from: orig,
	        to: dest,
	        promotion: prom ? util$2.roleToSan[prom].toLowerCase() : null,
	      });
	    },
	    occupation: function () {
	      var map = {};
	      chess.SQUARES.forEach(function (s) {
	        var p = chess.get(s);
	        if (p) map[s] = p;
	      });
	      return map;
	    },
	    kingKey: function (color) {
	      for (var i in chess.SQUARES) {
	        var p = chess.get(chess.SQUARES[i]);
	        if (p && p.type === 'k' && p.color === (color === 'white' ? 'w' : 'b')) return chess.SQUARES[i];
	      }
	    },
	    findCapture: function () {
	      return findCaptures()[0];
	    },
	    findUnprotectedCapture: function () {
	      return findCaptures().find(function (capture) {
	        var clone = new Chess(chess.fen());
	        clone.move({ from: capture.orig, to: capture.dest });
	        return !clone
	          .moves({
	            verbose: true,
	          })
	          .some(function (m) {
	            return m.captured && m.to === capture.dest;
	          });
	      });
	    },
	    checks: function () {
	      if (!chess.in_check()) return null;
	      var color = getColor();
	      setColor(color === 'white' ? 'black' : 'white');
	      var checks = chess
	        .moves({
	          verbose: true,
	        })
	        .filter(function (move) {
	          return move.captured === 'k';
	        })
	        .map(function (move) {
	          return {
	            orig: move.from,
	            dest: move.to,
	          };
	        });
	      setColor(color);
	      return checks;
	    },
	    playRandomMove: function () {
	      var moves = chess.moves({
	        verbose: true,
	      });
	      if (moves.length) {
	        var move = moves[Math.floor(Math.random() * moves.length)];
	        chess.move(move);
	        return {
	          orig: move.from,
	          dest: move.to,
	        };
	      }
	    },
	    get: chess.get,
	    undo: chess.undo,
	    instance: chess,
	  };
	};

	const make = (file, volume) => {
	  lichess.sound.loadOggOrMp3(file, `${lichess.sound.baseUrl}/${file}`);
	  return () => lichess.sound.play(file, volume);
	};

	var sound = {
	  move: () => lichess.sound.play('move'),
	  take: make('sfx/Tournament3rd', 0.4),
	  levelStart: make('other/ping'),
	  levelEnd: make('other/energy3'),
	  stageStart: make('other/guitar'),
	  stageEnd: make('other/gewonnen'),
	  failure: make('other/no-go'),
	};

	var opposite = main$1.util.opposite;
	var key2pos = main$1.util.key2pos;

	var promoting = false;

	function start(orig, dest, callback) {
	  var piece = ground.pieces()[dest];
	  if (
	    piece &&
	    piece.role == 'pawn' &&
	    ((dest[1] == 1 && piece.color == 'black') || (dest[1] == 8 && piece.color == 'white'))
	  ) {
	    promoting = {
	      orig: orig,
	      dest: dest,
	      callback: callback,
	    };
	    mithril$1.redraw();
	    return true;
	  }
	  return false;
	}

	function finish(role) {
	  if (promoting) ground.promote(promoting.dest, role);
	  if (promoting.callback) promoting.callback(promoting.orig, promoting.dest, role);
	  promoting = false;
	}

	function renderPromotion$1(ctrl, dest, pieces, color, orientation, explain) {
	  if (!promoting) return;

	  var left = (8 - key2pos(dest)[0]) * 12.5;
	  if (orientation === 'white') left = 87.5 - left;

	  var vertical = color === orientation ? 'top' : 'bottom';

	  return mithril$1('div#promotion-choice.' + vertical, [
	    pieces.map(function (serverRole, i) {
	      return mithril$1(
	        'square',
	        {
	          style: vertical + ': ' + i * 12.5 + '%;left: ' + left + '%',
	          onclick: function (e) {
	            e.stopPropagation();
	            finish(serverRole);
	          },
	        },
	        mithril$1('piece.' + serverRole + '.' + color)
	      );
	    }),
	    explain ? renderExplanation(ctrl) : null,
	  ]);
	}

	function renderExplanation(ctrl) {
	  return mithril$1('div.explanation', [
	    mithril$1('h2', ctrl.trans.noarg('pawnPromotion')),
	    mithril$1('p', ctrl.trans.noarg('yourPawnReachedTheEndOfTheBoard')),
	    mithril$1('p', ctrl.trans.noarg('itNowPromotesToAStrongerPiece')),
	    mithril$1('p', ctrl.trans.noarg('selectThePieceYouWant')),
	  ]);
	}

	var promotion = {
	  start: start,

	  view: function (ctrl, stage) {
	    if (!promoting) return;
	    var pieces = ['queen', 'knight', 'rook', 'bishop'];

	    return renderPromotion$1(
	      ctrl,
	      promoting.dest,
	      pieces,
	      opposite(ground.data().turnColor),
	      ground.data().orientation,
	      stage.blueprint.explainPromotion
	    );
	  },

	  reset: function () {
	    promoting = false;
	  },
	};

	var makeItems = item.ctrl;
	var itemView = item.view;








	var level = function (blueprint, opts) {
	  var items = makeItems({
	    apples: blueprint.apples,
	  });

	  var vm = {
	    lastStep: false,
	    completed: false,
	    willComplete: false,
	    failed: false,
	    score: 0,
	    nbMoves: 0,
	  };

	  var complete = function () {
	    vm.willComplete = true;
	    timeouts.setTimeout(
	      function () {
	        vm.lastStep = false;
	        vm.completed = true;
	        sound.levelEnd();
	        vm.score += score.getLevelBonus(blueprint, vm.nbMoves);
	        ground.stop();
	        mithril$1.redraw();
	        if (!blueprint.nextButton) timeouts.setTimeout(opts.onComplete, 1200);
	      },
	      ground.data().stats.dragged ? 1 : 250
	    );
	  };

	  // cheat
	  // Mousetrap.bind(['shift+enter'], complete);

	  var assertData = function () {
	    return {
	      scenario: scenario$1,
	      chess: chess$1,
	      vm: vm,
	    };
	  };

	  var detectFailure = function () {
	    var failed = blueprint.failure && blueprint.failure(assertData());
	    if (failed) sound.failure();
	    return failed;
	  };

	  var detectSuccess = function () {
	    if (blueprint.success) return blueprint.success(assertData());
	    else return !items.hasItem('apple');
	  };

	  var detectCapture = function () {
	    if (!blueprint.detectCapture) return false;
	    var fun = blueprint.detectCapture === 'unprotected' ? 'findUnprotectedCapture' : 'findCapture';
	    var move = chess$1[fun]();
	    if (!move) return;
	    vm.failed = true;
	    ground.stop();
	    ground.showCapture(move);
	    sound.failure();
	    return true;
	  };

	  var sendMove = function (orig, dest, prom) {
	    vm.nbMoves++;
	    var move = chess$1.move(orig, dest, prom);
	    if (move) ground.fen(chess$1.fen(), blueprint.color, {});
	    else {
	      // moving into check
	      vm.failed = true;
	      ground.showCheckmate(chess$1);
	      sound.failure();
	      return mithril$1.redraw();
	    }
	    var took = false,
	      inScenario,
	      captured = false;
	    items.withItem(move.to, function (item) {
	      if (item === 'apple') {
	        vm.score += score.apple;
	        items.remove(move.to);
	        took = true;
	      }
	    });
	    if (!took && move.captured && blueprint.pointsForCapture) {
	      if (blueprint.showPieceValues) vm.score += score.pieceValue(move.captured);
	      else vm.score += score.capture;
	      took = true;
	    }
	    ground.check(chess$1);
	    if (scenario$1.player(move.from + move.to + (move.promotion || ''))) {
	      vm.score += score.scenario;
	      inScenario = true;
	    } else {
	      captured = detectCapture();
	      vm.failed = vm.failed || captured || detectFailure();
	    }
	    if (!vm.failed && detectSuccess()) complete();
	    if (vm.willComplete) return;
	    if (took) sound.take();
	    else if (inScenario) sound.take();
	    else sound.move();
	    if (vm.failed) {
	      if (blueprint.showFailureFollowUp && !captured)
	        timeouts.setTimeout(function () {
	          var rm = chess$1.playRandomMove();
	          ground.fen(chess$1.fen(), blueprint.color, {}, [rm.orig, rm.dest]);
	        }, 600);
	    } else {
	      ground.select(dest);
	      if (!inScenario) {
	        chess$1.color(blueprint.color);
	        ground.color(blueprint.color, makeChessDests());
	      }
	    }
	    mithril$1.redraw();
	  };

	  var makeChessDests = function () {
	    return chess$1.dests({
	      illegal: blueprint.offerIllegalMove,
	    });
	  };

	  var onMove = function (orig, dest) {
	    var piece = ground.get(dest);
	    if (!piece || piece.color !== blueprint.color) return;
	    if (!promotion.start(orig, dest, sendMove)) sendMove(orig, dest);
	  };

	  var chess$1 = chess(blueprint.fen, blueprint.emptyApples ? [] : items.appleKeys());

	  var scenario$1 = scenario(blueprint.scenario, {
	    chess: chess$1,
	    makeChessDests: makeChessDests,
	  });

	  promotion.reset();

	  ground.set({
	    chess: chess$1,
	    offerIllegalMove: blueprint.offerIllegalMove,
	    autoCastle: blueprint.autoCastle,
	    orientation: blueprint.color,
	    onMove: onMove,
	    items: {
	      render: function (pos, key) {
	        return items.withItem(key, itemView);
	      },
	    },
	    shapes: blueprint.shapes,
	  });

	  return {
	    blueprint: blueprint,
	    items: items,
	    vm: vm,
	    scenario: scenario$1,
	    start: function () {
	      sound.levelStart();
	      if (chess$1.color() !== blueprint.color) timeouts.setTimeout(scenario$1.opponent, 1000);
	    },
	    onComplete: opts.onComplete,
	  };
	};

	var star = mithril$1('i[data-icon=t]');

	function makeStars$2(level, score$1) {
	  var rank = score.getLevelRank(level, score$1);
	  var stars = [];
	  for (var i = 3; i >= rank; i--) stars.push(star);
	  return mithril$1('span.stars.st' + stars.length, stars);
	}

	var progress = {
	  ctrl: function (stage, level, data) {
	    return {
	      stage: stage,
	      level: level,
	      score: function (level) {
	        return data.stages[stage.key] ? data.stages[stage.key].scores[level.id - 1] : 0;
	      },
	    };
	  },
	  view: function (ctrl) {
	    return mithril$1(
	      'div.progress',
	      ctrl.stage.levels.map(function (level) {
	        var score = ctrl.score(level);
	        var status = level.id === ctrl.level.blueprint.id ? 'active' : score ? 'done' : 'future';
	        var label = score ? makeStars$2(level, score) : mithril$1('span.id', level.id);
	        return mithril$1(
	          'a',
	          {
	            href: '/' + ctrl.stage.id + '/' + level.id,
	            config: mithril$1.route,
	            class: status,
	          },
	          label
	        );
	      })
	    );
	  },
	  makeStars: makeStars$2,
	};

	var makeProgress = progress.ctrl;



	var runCtrl = function (opts, trans) {
	  timeouts.clearTimeouts();

	  var stage = list$1.byId[mithril$1.route.param('stage')];
	  if (!stage) mithril$1.route('/');
	  opts.side.ctrl.setStage(stage);

	  var levelId =
	    mithril$1.route.param('level') ||
	    (function () {
	      var result = opts.storage.data.stages[stage.key];
	      var it = 0;
	      if (result) while (result.scores[it]) it++;
	      if (it >= stage.levels.length) it = 0;
	      return it + 1;
	    })();

	  var level$1 = level(stage.levels[levelId - 1], {
	    stage: stage,
	    onComplete: function () {
	      opts.storage.saveScore(stage, level$1.blueprint, level$1.vm.score);
	      if (level$1.blueprint.id < stage.levels.length) mithril$1.route('/' + stage.id + '/' + (level$1.blueprint.id + 1));
	      else {
	        vm.stageCompleted(true);
	        sound.stageEnd();
	      }
	      mithril$1.redraw();
	    },
	  });

	  var stageScore = function () {
	    var res = opts.storage.data.stages[stage.key];
	    return res
	      ? res.scores.reduce(function (a, b) {
	          return a + b;
	        })
	      : 0;
	  };

	  opts.route = 'run';
	  opts.stageId = stage.id;

	  var vm = {
	    stageStarting: mithril$1.prop(level$1.blueprint.id === 1 && stageScore() === 0),
	    stageCompleted: mithril$1.prop(false),
	  };

	  var getNext = function () {
	    return list$1.byId[stage.id + 1];
	  };
	  if (vm.stageStarting()) sound.stageStart();
	  else level$1.start();

	  // setTimeout(function() {
	  //   if (level.blueprint.id < stage.levels.length)
	  //     m.route('/' + stage.id + '/' + (level.blueprint.id + 1));
	  //   else if (getNext()) m.route('/' + (getNext().id));
	  // }, 1500);

	  mithril$1.redraw.strategy('diff');

	  return {
	    opts: opts,
	    stage: stage,
	    level: level$1,
	    vm: vm,
	    progress: makeProgress(stage, level$1, opts.storage.data),
	    stageScore: stageScore,
	    getNext: getNext,
	    hideStartingPane: function () {
	      if (!vm.stageStarting()) return;
	      vm.stageStarting(false);
	      level$1.start();
	    },
	    restart: function () {
	      mithril$1.route('/' + stage.id + '/' + level$1.blueprint.id);
	    },
	    trans: trans,
	  };
	};

	function shuffle(a) {
	  var j, x, i;
	  for (i = a.length; i; i -= 1) {
	    j = Math.floor(Math.random() * i);
	    x = a[i - 1];
	    a[i - 1] = a[j];
	    a[j] = x;
	  }
	}

	var list = [
	  'awesome',
	  'excellent',
	  'greatJob',
	  'perfect',
	  'outstanding',
	  'wayToGo',
	  'yesYesYes',
	  'youreGoodAtThis',
	  'nailedIt',
	  'rightOn',
	];
	shuffle(list);

	var it = 0;

	var congrats = function () {
	  return list[it++ % list.length];
	};

	var stageStarting = function (ctrl) {
	  return mithril$1(
	    'div.learn__screen-overlay',
	    {
	      onclick: ctrl.hideStartingPane,
	    },
	    mithril$1('div.learn__screen', [
	      mithril$1('h1', ctrl.trans('stageX', ctrl.stage.id) + ': ' + ctrl.trans.noarg(ctrl.stage.title)),
	      ctrl.stage.illustration,
	      mithril$1('p', util$2.withLinebreaks(ctrl.trans.noarg(ctrl.stage.intro))),
	      mithril$1(
	        'div.buttons',
	        mithril$1(
	          'a.next',
	          {
	            onclick: ctrl.hideStartingPane,
	          },
	          ctrl.trans.noarg('letsGo')
	        )
	      ),
	    ])
	  );
	};

	let numberFormatter = false;
	const numberFormat = (n) => {
	    if (numberFormatter === false)
	        numberFormatter = window.Intl && Intl.NumberFormat ? new Intl.NumberFormat() : null;
	    if (numberFormatter === null)
	        return '' + n;
	    return numberFormatter.format(n);
	};
	const numberSpread$1 = (el, nbSteps, duration, previous) => {
	    let displayed;
	    const display = (prev, cur, it) => {
	        const val = numberFormat(Math.round((prev * (nbSteps - 1 - it) + cur * (it + 1)) / nbSteps));
	        if (val !== displayed) {
	            el.textContent = val;
	            displayed = val;
	        }
	    };
	    let timeouts = [];
	    return (nb, overrideNbSteps) => {
	        if (!el || (!nb && nb !== 0))
	            return;
	        if (overrideNbSteps)
	            nbSteps = Math.abs(overrideNbSteps);
	        timeouts.forEach(clearTimeout);
	        timeouts = [];
	        const prev = previous === 0 ? 0 : previous || nb;
	        previous = nb;
	        const interv = Math.abs(duration / nbSteps);
	        for (let i = 0; i < nbSteps; i++)
	            timeouts.push(setTimeout(display.bind(null, prev, nb, i), Math.round(i * interv)));
	    };
	};

	var number = /*#__PURE__*/Object.freeze({
		__proto__: null,
		numberFormat: numberFormat,
		numberSpread: numberSpread$1
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(number);

	var numberSpread = require$$0.numberSpread;

	function makeStars$1(rank) {
	  var stars = [];
	  for (var i = 3; i > 0; i--) stars.push(mithril$1('div.star-wrap', rank <= i ? mithril$1('i.star') : null));
	  return stars;
	}

	var stageComplete = function (ctrl) {
	  var stage = ctrl.stage;
	  var next = ctrl.getNext();
	  var score$1 = ctrl.stageScore();
	  return mithril$1(
	    'div.learn__screen-overlay',
	    {
	      onclick: function (e) {
	        if (e.target.classList.contains('learn__screen-overlay')) mithril$1.route('/');
	      },
	    },
	    mithril$1('div.learn__screen', [
	      mithril$1('div.stars', makeStars$1(score.getStageRank(stage, score$1))),
	      mithril$1('h1', ctrl.trans('stageXComplete', stage.id)),
	      mithril$1('span.score', [
	        ctrl.trans.noarg('yourScore') + ': ',
	        mithril$1(
	          'span',
	          {
	            config: function (el, isUpdate) {
	              if (!isUpdate)
	                setTimeout(function () {
	                  numberSpread(el, 50, 3000, 0)(score$1);
	                }, 300);
	            },
	          },
	          0
	        ),
	      ]),
	      mithril$1('p', util$2.withLinebreaks(ctrl.trans.noarg(stage.complete))),
	      mithril$1('div.buttons', [
	        next
	          ? mithril$1(
	              'a.next',
	              {
	                href: '/' + next.id,
	                config: mithril$1.route,
	              },
	              [ctrl.trans.noarg('next') + ': ', ctrl.trans.noarg(next.title) + ' ', mithril$1('i[data-icon=H]')]
	            )
	          : null,
	        mithril$1(
	          'a.back.text[data-icon=I]',
	          {
	            href: '/',
	            config: mithril$1.route,
	          },
	          ctrl.trans.noarg('backToMenu')
	        ),
	      ]),
	    ])
	  );
	};

	var renderPromotion = promotion.view;
	var renderProgress = progress.view;
	var makeStars = progress.makeStars;

	function renderFailed(ctrl) {
	  return mithril$1(
	    'div.result.failed',
	    {
	      onclick: ctrl.restart,
	    },
	    [mithril$1('h2', ctrl.trans.noarg('puzzleFailed')), mithril$1('button', ctrl.trans.noarg('retry'))]
	  );
	}
	function renderCompletedMsg(ctrl, level) {
	  return mithril$1(
	    'div.learn__screen-overlay',
	    // {
	    //   onclick: level.onComplete,
	    // },
	    mithril$1('div.learn__screen', [
	      mithril$1('h2', ctrl.trans.noarg(congrats())),
	      makeStars(level.blueprint, level.vm.score),
	      mithril$1(
	        'div.buttons',
	        mithril$1(
	          'a.next',
	          {
	            onclick: level.onComplete,
	          },
	          ctrl.trans.noarg('next')
	        )
	      ),
	    ])
	  );
	}

	var runView = function (ctrl) {
	  var stage = ctrl.stage;
	  var level = ctrl.level;

	  return mithril$1(
	    'div',
	    {
	      class:
	        'learn learn--run ' +
	        stage.cssClass +
	        ' ' +
	        level.blueprint.cssClass +
	        (level.vm.starting ? ' starting' : '') +
	        (level.vm.completed && !level.blueprint.nextButton ? ' completed' : '') +
	        (level.vm.lastStep ? ' last-step' : '') +
	        (level.blueprint.showPieceValues ? ' piece-values' : ''),
	    },
	    [
	      mithril$1('div.learn__side', ctrl.opts.side.view()),
	      mithril$1('div.learn__main.main-board', [
	        ctrl.vm.stageStarting() ? stageStarting(ctrl) : null,
	        ctrl.vm.stageCompleted() ? stageComplete(ctrl) : null,
	        // level.vm.failed && !ctrl.vm.stageCompleted()? renderFailedMsg(ctrl, level) : null,
	        // level.vm.completed && !ctrl.vm.stageCompleted()? renderCompletedMsg(ctrl, level) : null,
	        main$1.view(ground.instance),
	        renderPromotion(ctrl, level),
	      ]),
	      mithril$1('div.learn__table', [
	        mithril$1('div.wrap', [
	          mithril$1('div.title', [
	            mithril$1('img', {
	              src: stage.image,
	            }),
	            mithril$1('div.text', [mithril$1('h2', ctrl.trans.noarg(stage.title)), mithril$1('p.subtitle', ctrl.trans.noarg(stage.subtitle))]),
	          ]),
	          level.vm.failed
	            ? renderFailed(ctrl)
	            : level.vm.completed
	            ? renderCompletedMsg(ctrl, level)
	            : mithril$1('div.goal', util$2.withLinebreaks(ctrl.trans.noarg(level.blueprint.goal))),
	          // m('div.goal', util.withLinebreaks(ctrl.trans.noarg(level.blueprint.goal))),
	          renderProgress(ctrl.progress),
	        ]),
	      ]),
	    ]
	  );
	};

	var runMain = function (opts, trans) {
	  return {
	    controller: function () {
	      return runCtrl(opts, trans);
	    },
	    view: runView,
	  };
	};

	var key = 'learn.progress';

	var defaultValue = {
	  stages: {},
	};

	function xhrSaveScore(stageKey, levelId, score) {
	  return mithril$1.request({
	    method: 'POST',
	    url: '/learn/score',
	    data: {
	      stage: stageKey,
	      level: levelId,
	      score: score,
	    },
	  });
	}

	function xhrReset() {
	  return mithril$1.request({
	    method: 'POST',
	    url: '/learn/reset',
	  });
	}

	var storage = function (data) {
	  data = data || JSON.parse(lichess.storage.get(key)) || defaultValue;

	  return {
	    data: data,
	    saveScore: function (stage, level, score) {
	      if (!data.stages[stage.key])
	        data.stages[stage.key] = {
	          scores: [],
	        };
	      if (data.stages[stage.key].scores[level.id - 1] > score) return;
	      data.stages[stage.key].scores[level.id - 1] = score;
	      if (data._id) xhrSaveScore(stage.key, level.id, score);
	      else lichess.storage.set(key, JSON.stringify(data));
	    },
	    reset: function () {
	      data.stages = {};
	      if (data._id)
	        xhrReset().then(function () {
	          location.reload();
	        });
	      else {
	        lichess.storage.remove(key);
	        location.reload();
	      }
	    },
	  };
	};

	var main = function (element, opts) {
	  opts.storage = storage(opts.data);
	  delete opts.data;

	  mithril$1.route.mode = 'hash';

	  var trans = lichess.trans(opts.i18n);
	  var side = mapSide(opts, trans);
	  var sideCtrl = side.controller();

	  opts.side = {
	    ctrl: sideCtrl,
	    view: function () {
	      return side.view(sideCtrl);
	    },
	  };

	  mithril$1.route(element, '/', {
	    '/': mapMain(opts, trans),
	    '/:stage/:level': runMain(opts, trans),
	    '/:stage': runMain(opts, trans),
	  });

	  return {};
	};

	return main;

}());
