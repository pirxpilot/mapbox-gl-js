PROJECT=mapbox-gl
NODE_BIN=./build/node_modules/.bin

find = $(foreach dir,$(1),$(foreach d,$(wildcard $(dir)/*),$(call find,$(d),$(2))) $(wildcard $(dir)/$(strip $(2))))

SRC = $(call find, src, *.js)

BUILD = dist/$(PROJECT).js dist/$(PROJECT)-worker.js
DIST = $(BUILD:%.js=%.min.js)

BROWSERIFY_OPTIONS = --debug

%/node_modules: %/package.json
	(cd $(@D) && yarn --no-progress) && touch $@

%.min.js: %.js
	$(NODE_BIN)/terser \
		--mangle \
		--compress warnings=false \
		--compress drop_console \
		--compress pure_funcs=['assert'] \
		--source-map filename='$@.map' \
		--source-map content='$<.map' \
		--source-map "root='/ui/script'" \
		--output $@ \
		-- $<

%.js: %.debug.js
	$(NODE_BIN)/exorcist --error-on-missing --base $(CURDIR) $@.map < $< > $@

all: check build

check: lint test

build: $(BUILD)

dist: $(DIST)

distdir:
	mkdir -p dist

dependencies: build/node_modules $(CURDIR)/node_modules

dist/$(PROJECT).debug.js: $(SRC) | dependencies distdir
	$(NODE_BIN)/browserify src/index.js \
		$(BROWSERIFY_OPTIONS) \
		--outfile $@ \
		--standalone mapboxgl

dist/$(PROJECT)-worker.debug.js: $(SRC) | dependencies distdir
	$(NODE_BIN)/browserify src/source/worker.js  \
		$(BROWSERIFY_OPTIONS) \
		--outfile $@

.INTERMEDIATE: dist/$(PROJECT).debug.js dist/$(PROJECT)-worker.debug.js

.DELETE_ON_ERROR: $(BUILD) $(DIST)

lint: | dependencies
	$(NODE_BIN)/eslint --cache --ignore-path .gitignore src test bench debug/*.html

test: test-unit | dependencies

test-integration: test-render test-query | dependencies

test-unit:
	NODE_PATH=build/node_modules \
	$(NODE_BIN)/tap --reporter dot --no-coverage test/unit

test-render:
	node test/render.test.js

test-query:
	node test/query.test.js

distclean: clean
	rm -fr build/node_modules node_modules .eslintcache

clean:
	rm -fr dist

clean-test:
	find test/integration/*-tests -mindepth 2 -type d -not -exec test -e "{}/style.json" \; -print
	# | xargs -t rm -r

.PHONY: all clean clean-test check lint build dist distclean
.PHONY: test test-unit test-render test-query
