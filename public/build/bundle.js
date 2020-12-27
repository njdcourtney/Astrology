
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    const zodiac = {
        Aries: {
            id: 0,
            label: "Aries (March 21 - April 19)",
            desc: "Active, Demanding, Determined, Effective, Ambitious",
        },
        Taurus: {
            id: 1,
            label: "Taurus (April 20 - May 20)",
            desc: "Security, Subtle strength, Appreciation, Instruction, Patience",      
        },
        Gemini: {
            id: 2,
            label: "Gemini (May 21 - June 20)",
            desc: "Communication, Indecision, Inquisitive, Intelligent, Changeable",
        },
        Cancer: {
            id: 3,
            label: "Cancer (June 21 - July 22)",
            desc: "Emotion, Diplomatic, Intensity, Impulsive, Selective",
        },
        Leo: {
            id: 4,
            label: "Leo (July 23 - August 22)",
            desc: "Ruling, Warmth, Generosity, Faithful, Initiative",
        },
        Virgo: {
            id: 5,
            label: "Virgo (August 23 - September 22)",
            desc: "Analyzing, Practical, Reflective, Observation, Thoughtful",
        },
        Libra: {
            id: 6,
            label: "Libra (September 23 - October 22)",
            desc: "Balance, Justice, Truth, Beauty, Perfection",
        },
        Scorpio: {
            id: 7,
            label: "Scorpio (October 23 - November 21)",
            desc: "Transient, Self-Willed, Purposeful, Unyielding",
        },
        Sagittarius: {
            id: 8,
            label: "Sagittarius (November 22 - December 21)",
            desc: "Philosophical, Motion, Experimentation, Optimism",   
        },
        Capricorn: {
            id: 9,
            label: "Capricorn (December 22 - January 19)",
            desc: "Determination, Dominance, Perservering, Practical, Willful",
        },
        Aquarius: {
            id: 10,
            label: "Aquarius (January 20 - February 18)",
            desc: "Knowledge, Humanitarian, Serious, Insightful, Duplicitous",
        },
        Pisces: {
            id: 11,
            label: "Pisces (February 19 - March 20)",
            desc: "Fluctuation, Depth, Imagination, Reactive, Indecisive",
        },
    };

    /* src/horoscopes/alignment.md generated by Svelte v3.31.0 */

    const file = "src/horoscopes/alignment.md";

    function create_fragment(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "12,581 extrasolar planets were aligned with various balls of gas when this post was written.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Affecting precisely nothing.";
    			add_location(p0, file, 0, 0, 0);
    			add_location(p1, file, 1, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
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

    const META = {};

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Alignment", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Alignment> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META });
    	return [];
    }

    class Alignment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alignment",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/horoscopes/barnum.md generated by Svelte v3.31.0 */

    const file$1 = "src/horoscopes/barnum.md";

    function create_fragment$1(ctx) {
    	let p;
    	let t0;
    	let a;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("You believe in astrology? Here's some bedtime reading for you: ");
    			a = element("a");
    			a.textContent = "https://en.wikipedia.org/wiki/Barnum_effect";
    			attr_dev(a, "href", "https://en.wikipedia.org/wiki/Barnum_effect");
    			add_location(a, file$1, 0, 70, 70);
    			add_location(p, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
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

    const META$1 = {};

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Barnum", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Barnum> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$1 });
    	return [];
    }

    class Barnum extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Barnum",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/horoscopes/cocktails.md generated by Svelte v3.31.0 */

    const file$2 = "src/horoscopes/cocktails.md";

    function create_fragment$2(ctx) {
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;
    	let t7;
    	let p0;
    	let t9;
    	let p1;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "10 ml schnapps";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "40ml vodka";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "40ml orange juice";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "40 ml cranberry juice.";
    			t7 = space();
    			p0 = element("p");
    			p0.textContent = "Pour into a glass filled with ice and stir.";
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = "Your life would be infinitely better if you spent your time making cocktails instead of reading horoscopes.";
    			add_location(li0, file$2, 1, 0, 5);
    			add_location(li1, file$2, 2, 0, 29);
    			add_location(li2, file$2, 3, 0, 49);
    			add_location(li3, file$2, 4, 0, 76);
    			add_location(ul, file$2, 0, 0, 0);
    			add_location(p0, file$2, 6, 0, 115);
    			add_location(p1, file$2, 7, 0, 166);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p1);
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

    const META$2 = {};

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cocktails", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cocktails> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$2 });
    	return [];
    }

    class Cocktails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cocktails",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/horoscopes/concern.md generated by Svelte v3.31.0 */

    const file$3 = "src/horoscopes/concern.md";

    function create_fragment$3(ctx) {
    	let p0;
    	let em;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			em = element("em");
    			em.textContent = "concerned face";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "What went wrong with your life that made you need the crutch of astrology to make it better?";
    			add_location(em, file$3, 0, 3, 3);
    			add_location(p0, file$3, 0, 0, 0);
    			add_location(p1, file$3, 1, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, em);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
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

    const META$3 = {};

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Concern", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Concern> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$3 });
    	return [];
    }

    class Concern extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Concern",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/horoscopes/foot.md generated by Svelte v3.31.0 */

    const file$4 = "src/horoscopes/foot.md";

    function create_fragment$4(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Your foot is the length of your arm from your wrist to your elbow.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "This is the sort of useful information you don't get from horoscopes.";
    			add_location(p0, file$4, 0, 0, 0);
    			add_location(p1, file$4, 1, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
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

    const META$4 = {};

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Foot", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Foot> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$4 });
    	return [];
    }

    class Foot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Foot",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/horoscopes/for_dummies.md generated by Svelte v3.31.0 */

    const file$5 = "src/horoscopes/for_dummies.md";

    function create_fragment$5(ctx) {
    	let p0;
    	let t0;
    	let a;
    	let t2;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Spend less time reading horoscopes and go read this book: ");
    			a = element("a");
    			a.textContent = "http://www.amazon.co.uk/Astronomy-Dummies-Stephen-P-Maran/dp/1118376978/";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "You might learn something.";
    			attr_dev(a, "href", "http://www.amazon.co.uk/Astronomy-Dummies-Stephen-P-Maran/dp/1118376978/");
    			add_location(a, file$5, 0, 61, 61);
    			add_location(p0, file$5, 0, 0, 0);
    			add_location(p1, file$5, 1, 0, 225);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, a);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
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

    const META$5 = {};

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("For_dummies", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<For_dummies> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$5 });
    	return [];
    }

    class For_dummies extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "For_dummies",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/horoscopes/jupiter.md generated by Svelte v3.31.0 */

    const file$6 = "src/horoscopes/jupiter.md";

    function create_fragment$6(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Look up at the stars on a clear, moonless night. You should see Jupiter, burning brightly.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "That's it. It's just pretty. It doesn't affect your future in anyway.";
    			add_location(p0, file$6, 0, 0, 0);
    			add_location(p1, file$6, 1, 0, 98);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
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

    const META$6 = {};

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Jupiter", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jupiter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$6 });
    	return [];
    }

    class Jupiter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jupiter",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/horoscopes/lamppost.md generated by Svelte v3.31.0 */

    const file$7 = "src/horoscopes/lamppost.md";

    function create_fragment$7(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "As you walk out and about, take some time to look up at the stars once in a while.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "When you walk into a lamp post, it will serve you right.";
    			add_location(p0, file$7, 0, 0, 0);
    			add_location(p1, file$7, 1, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$7 = {};

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lamppost", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lamppost> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$7 });
    	return [];
    }

    class Lamppost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lamppost",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/horoscopes/mars_aquarius.md generated by Svelte v3.31.0 */

    const file$8 = "src/horoscopes/mars_aquarius.md";

    function create_fragment$8(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "When Mars is in conjunction with Aquarius, nothing of note will happen.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "The world doesn't work that way.";
    			add_location(p0, file$8, 0, 0, 0);
    			add_location(p1, file$8, 1, 0, 79);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$8 = {};

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Mars_aquarius", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Mars_aquarius> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$8 });
    	return [];
    }

    class Mars_aquarius extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mars_aquarius",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/horoscopes/may_or_may_not.md generated by Svelte v3.31.0 */

    const file$9 = "src/horoscopes/may_or_may_not.md";

    function create_fragment$9(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "A tall (or possibly short) dark (or possibly blonde) man (or possibly woman) will (or possibly may) walk (or possibly run, hop or skip) into your life (or possibly not).";
    			add_location(p, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$9 = {};

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("May_or_may_not", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<May_or_may_not> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$9 });
    	return [];
    }

    class May_or_may_not extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "May_or_may_not",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/horoscopes/nice-things.md generated by Svelte v3.31.0 */

    const file$a = "src/horoscopes/nice-things.md";

    function create_fragment$a(ctx) {
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;
    	let t7;
    	let p;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Ferraris and Lamborghinis.";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Beautiful people.";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "Rich food";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "Fantastic houses.";
    			t7 = space();
    			p = element("p");
    			p.textContent = "These are just some of the things a horoscope cannot guarantee you.";
    			add_location(li0, file$a, 1, 0, 5);
    			add_location(li1, file$a, 2, 0, 41);
    			add_location(li2, file$a, 3, 0, 68);
    			add_location(li3, file$a, 4, 0, 87);
    			add_location(ul, file$a, 0, 0, 0);
    			add_location(p, file$a, 6, 0, 120);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$a = {};

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nice_things", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nice_things> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$a });
    	return [];
    }

    class Nice_things extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nice_things",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/horoscopes/nice_person.md generated by Svelte v3.31.0 */

    const file$b = "src/horoscopes/nice_person.md";

    function create_fragment$b(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Someone will be unexpectedly nice to you today - but not if you sit and read horoscopes on the internet all day.";
    			add_location(p, file$b, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$b = {};

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nice_person", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nice_person> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$b });
    	return [];
    }

    class Nice_person extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nice_person",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/horoscopes/no-effect.md generated by Svelte v3.31.0 */

    const file$c = "src/horoscopes/no-effect.md";

    function create_fragment$c(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "The Sun, Moon and stars will have absolutely no effect on your life";
    			add_location(p, file$c, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$c = {};

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("No_effect", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<No_effect> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$c });
    	return [];
    }

    class No_effect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "No_effect",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/horoscopes/norse.md generated by Svelte v3.31.0 */

    const file$d = "src/horoscopes/norse.md";

    function create_fragment$d(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "The Norse believed that three women, the Norns, weaved a great tapestry which foretold the fate of all gods and men. These women lived in a well beneath a great tree.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Your belief in astrology is just as likely to be right.";
    			add_location(p0, file$d, 0, 0, 0);
    			add_location(p1, file$d, 1, 0, 174);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$d = {};

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Norse", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Norse> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$d });
    	return [];
    }

    class Norse extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Norse",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/horoscopes/plasma.md generated by Svelte v3.31.0 */

    const file$e = "src/horoscopes/plasma.md";

    function create_fragment$e(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "The stars would love to guide your destiny. But they're hamstrung by being just balls of fusion plasma.";
    			add_location(p, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$e = {};

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Plasma", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Plasma> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$e });
    	return [];
    }

    class Plasma extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Plasma",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/horoscopes/roses.md generated by Svelte v3.31.0 */

    const file$f = "src/horoscopes/roses.md";

    function create_fragment$f(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Rose are red, violets are blue, horoscopes are dumb, and so are you.";
    			add_location(p, file$f, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const META$f = {};

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Roses", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Roses> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ META: META$f });
    	return [];
    }

    class Roses extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Roses",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src/Horoscope.svelte generated by Svelte v3.31.0 */
    const file$g = "src/Horoscope.svelte";

    function create_fragment$g(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let p;
    	let t2_value = zodiac[/*sign*/ ctx[0]].desc + "";
    	let t2;
    	let t3;
    	let hr;
    	let t4;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*horoscopes*/ ctx[2][/*selector*/ ctx[1]];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(/*sign*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			add_location(h2, file$g, 37, 0, 1494);
    			attr_dev(p, "class", "lead");
    			add_location(p, file$g, 38, 0, 1510);
    			add_location(hr, file$g, 39, 0, 1550);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t4, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*sign*/ 1) set_data_dev(t0, /*sign*/ ctx[0]);
    			if ((!current || dirty & /*sign*/ 1) && t2_value !== (t2_value = zodiac[/*sign*/ ctx[0]].desc + "")) set_data_dev(t2, t2_value);

    			if (switch_value !== (switch_value = /*horoscopes*/ ctx[2][/*selector*/ ctx[1]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Horoscope", slots, []);
    	let { sign } = $$props;

    	let horoscopes = [
    		Alignment,
    		Barnum,
    		Cocktails,
    		Concern,
    		Foot,
    		For_dummies,
    		Jupiter,
    		Lamppost,
    		Mars_aquarius,
    		May_or_may_not,
    		Nice_things,
    		Nice_person,
    		No_effect,
    		Norse,
    		Plasma,
    		Roses
    	];

    	// Calculate the day of the year
    	let today = new Date(2020, 11, 31);

    	let doY = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    	const writable_props = ["sign"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Horoscope> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("sign" in $$props) $$invalidate(0, sign = $$props.sign);
    	};

    	$$self.$capture_state = () => ({
    		sign,
    		zodiac,
    		Alignment,
    		Barnum,
    		Cocktails,
    		Concern,
    		Foot,
    		ForDummies: For_dummies,
    		Jupiter,
    		Lampost: Lamppost,
    		MarsAquarius: Mars_aquarius,
    		MayOrMayNot: May_or_may_not,
    		NiceThings: Nice_things,
    		NicePerson: Nice_person,
    		NoEffect: No_effect,
    		Norse,
    		Plasma,
    		Roses,
    		horoscopes,
    		today,
    		doY,
    		selector
    	});

    	$$self.$inject_state = $$props => {
    		if ("sign" in $$props) $$invalidate(0, sign = $$props.sign);
    		if ("horoscopes" in $$props) $$invalidate(2, horoscopes = $$props.horoscopes);
    		if ("today" in $$props) today = $$props.today;
    		if ("doY" in $$props) $$invalidate(4, doY = $$props.doY);
    		if ("selector" in $$props) $$invalidate(1, selector = $$props.selector);
    	};

    	let selector;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sign*/ 1) {
    			// Work out which Horoscope to display
    			 $$invalidate(1, selector = (doY + zodiac[sign].id) % horoscopes.length);
    		}
    	};

    	return [sign, selector, horoscopes];
    }

    class Horoscope extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { sign: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Horoscope",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sign*/ ctx[0] === undefined && !("sign" in props)) {
    			console.warn("<Horoscope> was created without expected prop 'sign'");
    		}
    	}

    	get sign() {
    		throw new Error("<Horoscope>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sign(value) {
    		throw new Error("<Horoscope>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1 } = globals;
    const file$h = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (23:5) {#each Object.keys(zodiac) as sign }
    function create_each_block(ctx) {
    	let option;
    	let t_value = zodiac[/*sign*/ ctx[2]].label + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*sign*/ ctx[2];
    			option.value = option.__value;
    			add_location(option, file$h, 23, 6, 803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(23:5) {#each Object.keys(zodiac) as sign }",
    		ctx
    	});

    	return block;
    }

    // (31:1) {#if zodiac[starSign] !== undefined }
    function create_if_block(ctx) {
    	let horoscope;
    	let current;

    	horoscope = new Horoscope({
    			props: { sign: /*starSign*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(horoscope.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(horoscope, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const horoscope_changes = {};
    			if (dirty & /*starSign*/ 1) horoscope_changes.sign = /*starSign*/ ctx[0];
    			horoscope.$set(horoscope_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(horoscope.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(horoscope.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(horoscope, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(31:1) {#if zodiac[starSign] !== undefined }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let nav;
    	let a;
    	let t1;
    	let div2;
    	let div1;
    	let h1;
    	let t3;
    	let p;
    	let t4;
    	let br;
    	let t5;
    	let t6;
    	let form;
    	let div0;
    	let label;
    	let t8;
    	let select;
    	let option;
    	let t9;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Object.keys(zodiac);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = zodiac[/*starSign*/ ctx[0]] !== undefined && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a = element("a");
    			a.textContent = "Nathan Courtney";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Real Astrology";
    			t3 = space();
    			p = element("p");
    			t4 = text("I graduated in 2004 with a Ph.D. in Astrophysics.");
    			br = element("br");
    			t5 = text(" After years of painstaking research I present the results of my work, a scientifically accurate horoscope.");
    			t6 = space();
    			form = element("form");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Choose your star sign";
    			t8 = space();
    			select = element("select");
    			option = element("option");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			if (if_block) if_block.c();
    			attr_dev(a, "class", "navbar-brand");
    			attr_dev(a, "href", "//www.nathancourtney.me.uk");
    			add_location(a, file$h, 9, 1, 187);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-dark bg-primary");
    			add_location(nav, file$h, 8, 0, 125);
    			add_location(h1, file$h, 14, 2, 324);
    			add_location(br, file$h, 15, 68, 416);
    			attr_dev(p, "class", "lead");
    			add_location(p, file$h, 15, 2, 350);
    			attr_dev(label, "for", "starSignSelect");
    			add_location(label, file$h, 19, 4, 575);
    			option.hidden = true;
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file$h, 21, 5, 730);
    			attr_dev(select, "class", "form-control form-control-lg");
    			attr_dev(select, "id", "starSignSelect");
    			if (/*starSign*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[1].call(select));
    			add_location(select, file$h, 20, 4, 637);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$h, 18, 3, 546);
    			add_location(form, file$h, 17, 2, 536);
    			attr_dev(div1, "class", "jumbotron");
    			add_location(div1, file$h, 13, 1, 298);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$h, 12, 0, 273);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(p, br);
    			append_dev(p, t5);
    			append_dev(div1, t6);
    			append_dev(div1, form);
    			append_dev(form, div0);
    			append_dev(div0, label);
    			append_dev(div0, t8);
    			append_dev(div0, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*starSign*/ ctx[0]);
    			append_dev(div2, t9);
    			if (if_block) if_block.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, zodiac*/ 0) {
    				each_value = Object.keys(zodiac);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*starSign, Object, zodiac*/ 1) {
    				select_option(select, /*starSign*/ ctx[0]);
    			}

    			if (zodiac[/*starSign*/ ctx[0]] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*starSign*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let starSign = "";
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		starSign = select_value(this);
    		$$invalidate(0, starSign);
    	}

    	$$self.$capture_state = () => ({ zodiac, Horoscope, starSign });

    	$$self.$inject_state = $$props => {
    		if ("starSign" in $$props) $$invalidate(0, starSign = $$props.starSign);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [starSign, select_change_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
