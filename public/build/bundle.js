
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function time_ranges_to_array(ranges) {
        const array = [];
        for (let i = 0; i < ranges.length; i += 1) {
            array.push({ start: ranges.start(i), end: ranges.end(i) });
        }
        return array;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/components/AnimatedCard.svelte generated by Svelte v3.38.2 */

    const file$6 = "src/components/AnimatedCard.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let span;
    	let t0_value = `${/*digit*/ ctx[1] < 10 ? 0 : ""}` + "";
    	let t0;
    	let t1;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(/*digit*/ ctx[1]);
    			attr_dev(span, "class", "svelte-vy3ote");
    			add_location(span, file$6, 5, 2, 106);
    			attr_dev(div, "class", div_class_value = "flipCard " + /*animation*/ ctx[0] + " svelte-vy3ote");
    			add_location(div, file$6, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*digit*/ 2 && t0_value !== (t0_value = `${/*digit*/ ctx[1] < 10 ? 0 : ""}` + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*digit*/ 2) set_data_dev(t1, /*digit*/ ctx[1]);

    			if (dirty & /*animation*/ 1 && div_class_value !== (div_class_value = "flipCard " + /*animation*/ ctx[0] + " svelte-vy3ote")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AnimatedCard", slots, []);
    	let { animation } = $$props;
    	let { digit } = $$props;
    	const writable_props = ["animation", "digit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AnimatedCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("animation" in $$props) $$invalidate(0, animation = $$props.animation);
    		if ("digit" in $$props) $$invalidate(1, digit = $$props.digit);
    	};

    	$$self.$capture_state = () => ({ animation, digit });

    	$$self.$inject_state = $$props => {
    		if ("animation" in $$props) $$invalidate(0, animation = $$props.animation);
    		if ("digit" in $$props) $$invalidate(1, digit = $$props.digit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [animation, digit];
    }

    class AnimatedCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { animation: 0, digit: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnimatedCard",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*animation*/ ctx[0] === undefined && !("animation" in props)) {
    			console.warn("<AnimatedCard> was created without expected prop 'animation'");
    		}

    		if (/*digit*/ ctx[1] === undefined && !("digit" in props)) {
    			console.warn("<AnimatedCard> was created without expected prop 'digit'");
    		}
    	}

    	get animation() {
    		throw new Error("<AnimatedCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<AnimatedCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get digit() {
    		throw new Error("<AnimatedCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set digit(value) {
    		throw new Error("<AnimatedCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/StaticCard.svelte generated by Svelte v3.38.2 */

    const file$5 = "src/components/StaticCard.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let span;
    	let t0_value = `${/*digit*/ ctx[1] < 10 ? 0 : ""}` + "";
    	let t0;
    	let t1;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(/*digit*/ ctx[1]);
    			attr_dev(span, "class", "svelte-11x0z9t");
    			add_location(span, file$5, 5, 2, 93);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*position*/ ctx[0]) + " svelte-11x0z9t"));
    			add_location(div, file$5, 4, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*digit*/ 2 && t0_value !== (t0_value = `${/*digit*/ ctx[1] < 10 ? 0 : ""}` + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*digit*/ 2) set_data_dev(t1, /*digit*/ ctx[1]);

    			if (dirty & /*position*/ 1 && div_class_value !== (div_class_value = "" + (null_to_empty(/*position*/ ctx[0]) + " svelte-11x0z9t"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StaticCard", slots, []);
    	let { position } = $$props;
    	let { digit } = $$props;
    	const writable_props = ["position", "digit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StaticCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    		if ("digit" in $$props) $$invalidate(1, digit = $$props.digit);
    	};

    	$$self.$capture_state = () => ({ position, digit });

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    		if ("digit" in $$props) $$invalidate(1, digit = $$props.digit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [position, digit];
    }

    class StaticCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { position: 0, digit: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StaticCard",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*position*/ ctx[0] === undefined && !("position" in props)) {
    			console.warn("<StaticCard> was created without expected prop 'position'");
    		}

    		if (/*digit*/ ctx[1] === undefined && !("digit" in props)) {
    			console.warn("<StaticCard> was created without expected prop 'digit'");
    		}
    	}

    	get position() {
    		throw new Error("<StaticCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<StaticCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get digit() {
    		throw new Error("<StaticCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set digit(value) {
    		throw new Error("<StaticCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FlipContainer.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/components/FlipContainer.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let staticcard0;
    	let t0;
    	let staticcard1;
    	let t1;
    	let animatedcard0;
    	let t2;
    	let animatedcard1;
    	let current;

    	staticcard0 = new StaticCard({
    			props: {
    				position: "upperCard",
    				digit: /*digit*/ ctx[0]
    			},
    			$$inline: true
    		});

    	staticcard1 = new StaticCard({
    			props: {
    				position: "lowerCard",
    				digit: /*previousDigit*/ ctx[1]
    			},
    			$$inline: true
    		});

    	animatedcard0 = new AnimatedCard({
    			props: {
    				digit: /*flip*/ ctx[4]
    				? /*digit*/ ctx[0]
    				: /*previousDigit*/ ctx[1],
    				animation: /*animation*/ ctx[2]
    			},
    			$$inline: true
    		});

    	animatedcard1 = new AnimatedCard({
    			props: {
    				digit: /*flip*/ ctx[4]
    				? /*previousDigit*/ ctx[1]
    				: /*digit*/ ctx[0],
    				animation: /*animation2*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(staticcard0.$$.fragment);
    			t0 = space();
    			create_component(staticcard1.$$.fragment);
    			t1 = space();
    			create_component(animatedcard0.$$.fragment);
    			t2 = space();
    			create_component(animatedcard1.$$.fragment);
    			attr_dev(div, "class", "flip-container svelte-jwx7y5");
    			add_location(div, file$4, 21, 0, 639);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(staticcard0, div, null);
    			append_dev(div, t0);
    			mount_component(staticcard1, div, null);
    			append_dev(div, t1);
    			mount_component(animatedcard0, div, null);
    			append_dev(div, t2);
    			mount_component(animatedcard1, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const staticcard0_changes = {};
    			if (dirty & /*digit*/ 1) staticcard0_changes.digit = /*digit*/ ctx[0];
    			staticcard0.$set(staticcard0_changes);
    			const staticcard1_changes = {};
    			if (dirty & /*previousDigit*/ 2) staticcard1_changes.digit = /*previousDigit*/ ctx[1];
    			staticcard1.$set(staticcard1_changes);
    			const animatedcard0_changes = {};

    			if (dirty & /*flip, digit, previousDigit*/ 19) animatedcard0_changes.digit = /*flip*/ ctx[4]
    			? /*digit*/ ctx[0]
    			: /*previousDigit*/ ctx[1];

    			if (dirty & /*animation*/ 4) animatedcard0_changes.animation = /*animation*/ ctx[2];
    			animatedcard0.$set(animatedcard0_changes);
    			const animatedcard1_changes = {};

    			if (dirty & /*flip, previousDigit, digit*/ 19) animatedcard1_changes.digit = /*flip*/ ctx[4]
    			? /*previousDigit*/ ctx[1]
    			: /*digit*/ ctx[0];

    			if (dirty & /*animation2*/ 8) animatedcard1_changes.animation = /*animation2*/ ctx[3];
    			animatedcard1.$set(animatedcard1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(staticcard0.$$.fragment, local);
    			transition_in(staticcard1.$$.fragment, local);
    			transition_in(animatedcard0.$$.fragment, local);
    			transition_in(animatedcard1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(staticcard0.$$.fragment, local);
    			transition_out(staticcard1.$$.fragment, local);
    			transition_out(animatedcard0.$$.fragment, local);
    			transition_out(animatedcard1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(staticcard0);
    			destroy_component(staticcard1);
    			destroy_component(animatedcard0);
    			destroy_component(animatedcard1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FlipContainer", slots, []);
    	let { digit } = $$props;
    	let previousDigit, animation, animation2, flip;
    	const previousDigitState = writable(digit);

    	const previousDigitUnsub = previousDigitState.subscribe(val => {
    		$$invalidate(1, previousDigit = val);
    	});

    	afterUpdate(() => {
    		$$invalidate(1, previousDigit = digit + 1);
    		$$invalidate(4, flip = animation === "fold");
    		$$invalidate(3, animation2 = animation || "unfold");
    		$$invalidate(2, animation = flip ? "unfold" : "fold");
    	});

    	onDestroy(() => {
    		previousDigitUnsub();
    	});

    	const writable_props = ["digit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FlipContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("digit" in $$props) $$invalidate(0, digit = $$props.digit);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onDestroy,
    		writable,
    		AnimatedCard,
    		StaticCard,
    		digit,
    		previousDigit,
    		animation,
    		animation2,
    		flip,
    		previousDigitState,
    		previousDigitUnsub
    	});

    	$$self.$inject_state = $$props => {
    		if ("digit" in $$props) $$invalidate(0, digit = $$props.digit);
    		if ("previousDigit" in $$props) $$invalidate(1, previousDigit = $$props.previousDigit);
    		if ("animation" in $$props) $$invalidate(2, animation = $$props.animation);
    		if ("animation2" in $$props) $$invalidate(3, animation2 = $$props.animation2);
    		if ("flip" in $$props) $$invalidate(4, flip = $$props.flip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [digit, previousDigit, animation, animation2, flip];
    }

    class FlipContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { digit: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FlipContainer",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*digit*/ ctx[0] === undefined && !("digit" in props)) {
    			console.warn("<FlipContainer> was created without expected prop 'digit'");
    		}
    	}

    	get digit() {
    		throw new Error("<FlipContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set digit(value) {
    		throw new Error("<FlipContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Countdown.svelte generated by Svelte v3.38.2 */
    const file$3 = "src/components/Countdown.svelte";

    function create_fragment$3(ctx) {
    	let div4;
    	let flipcontainer0;
    	let t0;
    	let flipcontainer1;
    	let t1;
    	let flipcontainer2;
    	let t2;
    	let flipcontainer3;
    	let t3;
    	let div0;
    	let p0;
    	let t5;
    	let div1;
    	let p1;
    	let t7;
    	let div2;
    	let p2;
    	let t9;
    	let div3;
    	let p3;
    	let current;

    	flipcontainer0 = new FlipContainer({
    			props: { digit: /*days*/ ctx[0] },
    			$$inline: true
    		});

    	flipcontainer1 = new FlipContainer({
    			props: { digit: /*hours*/ ctx[1] },
    			$$inline: true
    		});

    	flipcontainer2 = new FlipContainer({
    			props: { digit: /*mintues*/ ctx[2] },
    			$$inline: true
    		});

    	flipcontainer3 = new FlipContainer({
    			props: { digit: /*seconds*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			create_component(flipcontainer0.$$.fragment);
    			t0 = space();
    			create_component(flipcontainer1.$$.fragment);
    			t1 = space();
    			create_component(flipcontainer2.$$.fragment);
    			t2 = space();
    			create_component(flipcontainer3.$$.fragment);
    			t3 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Days";
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "Hours";
    			t7 = space();
    			div2 = element("div");
    			p2 = element("p");
    			p2.textContent = "Minutes";
    			t9 = space();
    			div3 = element("div");
    			p3 = element("p");
    			p3.textContent = "Seconds";
    			add_location(p0, file$3, 29, 32, 979);
    			attr_dev(div0, "class", "countdown__label svelte-1ma8fb4");
    			add_location(div0, file$3, 29, 2, 949);
    			add_location(p1, file$3, 30, 32, 1029);
    			attr_dev(div1, "class", "countdown__label svelte-1ma8fb4");
    			add_location(div1, file$3, 30, 2, 999);
    			add_location(p2, file$3, 31, 32, 1080);
    			attr_dev(div2, "class", "countdown__label svelte-1ma8fb4");
    			add_location(div2, file$3, 31, 2, 1050);
    			add_location(p3, file$3, 32, 32, 1133);
    			attr_dev(div3, "class", "countdown__label svelte-1ma8fb4");
    			add_location(div3, file$3, 32, 2, 1103);
    			attr_dev(div4, "class", "countdown svelte-1ma8fb4");
    			add_location(div4, file$3, 24, 0, 784);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			mount_component(flipcontainer0, div4, null);
    			append_dev(div4, t0);
    			mount_component(flipcontainer1, div4, null);
    			append_dev(div4, t1);
    			mount_component(flipcontainer2, div4, null);
    			append_dev(div4, t2);
    			mount_component(flipcontainer3, div4, null);
    			append_dev(div4, t3);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(div4, t5);
    			append_dev(div4, div1);
    			append_dev(div1, p1);
    			append_dev(div4, t7);
    			append_dev(div4, div2);
    			append_dev(div2, p2);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, p3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const flipcontainer0_changes = {};
    			if (dirty & /*days*/ 1) flipcontainer0_changes.digit = /*days*/ ctx[0];
    			flipcontainer0.$set(flipcontainer0_changes);
    			const flipcontainer1_changes = {};
    			if (dirty & /*hours*/ 2) flipcontainer1_changes.digit = /*hours*/ ctx[1];
    			flipcontainer1.$set(flipcontainer1_changes);
    			const flipcontainer2_changes = {};
    			if (dirty & /*mintues*/ 4) flipcontainer2_changes.digit = /*mintues*/ ctx[2];
    			flipcontainer2.$set(flipcontainer2_changes);
    			const flipcontainer3_changes = {};
    			if (dirty & /*seconds*/ 8) flipcontainer3_changes.digit = /*seconds*/ ctx[3];
    			flipcontainer3.$set(flipcontainer3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flipcontainer0.$$.fragment, local);
    			transition_in(flipcontainer1.$$.fragment, local);
    			transition_in(flipcontainer2.$$.fragment, local);
    			transition_in(flipcontainer3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flipcontainer0.$$.fragment, local);
    			transition_out(flipcontainer1.$$.fragment, local);
    			transition_out(flipcontainer2.$$.fragment, local);
    			transition_out(flipcontainer3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(flipcontainer0);
    			destroy_component(flipcontainer1);
    			destroy_component(flipcontainer2);
    			destroy_component(flipcontainer3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Countdown", slots, []);
    	const END_TIME = Date.now() + 777600000;

    	const TIME_COUNTDOWN = readable(END_TIME - Date.now(), set => {
    		set(END_TIME - Date.now());

    		const interval = setInterval(
    			() => {
    				set(END_TIME - Date.now());
    			},
    			1000
    		);

    		return () => clearInterval(interval);
    	});

    	let days, hours, mintues, seconds = 0;

    	let timeRemainingUnsubscribe = TIME_COUNTDOWN.subscribe(time => {
    		const date = new Date(time);
    		$$invalidate(0, days = date.getDay());
    		$$invalidate(1, hours = date.getHours());
    		$$invalidate(2, mintues = date.getMinutes());
    		$$invalidate(3, seconds = date.getSeconds());
    	});

    	onDestroy(() => {
    		timeRemainingUnsubscribe();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Countdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		FlipContainer,
    		readable,
    		onDestroy,
    		time_ranges_to_array,
    		END_TIME,
    		TIME_COUNTDOWN,
    		days,
    		hours,
    		mintues,
    		seconds,
    		timeRemainingUnsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("hours" in $$props) $$invalidate(1, hours = $$props.hours);
    		if ("mintues" in $$props) $$invalidate(2, mintues = $$props.mintues);
    		if ("seconds" in $$props) $$invalidate(3, seconds = $$props.seconds);
    		if ("timeRemainingUnsubscribe" in $$props) timeRemainingUnsubscribe = $$props.timeRemainingUnsubscribe;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [days, hours, mintues, seconds];
    }

    class Countdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Countdown",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Main.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/components/Main.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let countdown;
    	let current;
    	countdown = new Countdown({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "We're launching soon";
    			t1 = space();
    			div = element("div");
    			create_component(countdown.$$.fragment);
    			attr_dev(h1, "class", "title svelte-1k4657y");
    			add_location(h1, file$2, 4, 2, 82);
    			attr_dev(div, "class", "clock svelte-1k4657y");
    			add_location(div, file$2, 6, 2, 129);
    			attr_dev(main, "class", "svelte-1k4657y");
    			add_location(main, file$2, 3, 0, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(countdown, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(countdown);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Main", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Countdown });
    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/components/Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let div;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let img2;
    	let img2_src_value;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			attr_dev(img0, "class", "footer__img svelte-1bahufi");
    			if (img0.src !== (img0_src_value = "../assets/icon-facebook.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Facebook icon");
    			add_location(img0, file$1, 2, 4, 56);
    			attr_dev(img1, "class", "footer__img svelte-1bahufi");
    			if (img1.src !== (img1_src_value = "../assets/icon-instagram.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Instagram icon");
    			add_location(img1, file$1, 7, 4, 164);
    			attr_dev(img2, "class", "footer__img svelte-1bahufi");
    			if (img2.src !== (img2_src_value = "../assets/icon-pinterest.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Pinterest icon");
    			add_location(img2, file$1, 12, 4, 274);
    			attr_dev(div, "class", "footer svelte-1bahufi");
    			add_location(div, file$1, 1, 2, 31);
    			attr_dev(footer, "class", "attribution svelte-1bahufi");
    			add_location(footer, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, img0);
    			append_dev(div, t0);
    			append_dev(div, img1);
    			append_dev(div, t1);
    			append_dev(div, img2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main1;
    	let main0;
    	let t;
    	let footer;
    	let current;
    	main0 = new Main({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main1 = element("main");
    			create_component(main0.$$.fragment);
    			t = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main1, "class", "svelte-6w1703");
    			add_location(main1, file, 4, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main1, anchor);
    			mount_component(main0, main1, null);
    			append_dev(main1, t);
    			mount_component(footer, main1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(main0.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(main0.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main1);
    			destroy_component(main0);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Main, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
