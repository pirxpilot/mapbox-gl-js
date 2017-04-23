PROJECT=mapbox-gl
NODE_BIN=./node_modules/.bin

find = $(foreach dir,$(1),$(foreach d,$(wildcard $(dir)/*),$(call find,$(d),$(2))) $(wildcard $(dir)/$(strip $(2))))

SRC = $(call find, src, *.js)
DIST = dist/$(PROJECT).js
DIST_WORKER = dist/$(PROJECT)-worker.js
BUILD = $(DIST:%.js=%-dev.js)
BUILD_WORKER = $(DIST_WORKER:%.js=%-dev.js)

BROWSERIFY_OPTIONS = --debug

dist/%.js: dist/%-dev.js
	$(NODE_BIN)/uglifyjs \
		--screw-ie8 \
		--mangle \
		--no-copyright \
		--compress 'warnings=false,drop_console' \
		--in-source-map $<.map \
		--source-map $@.map \
		--output $@ $<

all: check build

check: lint test

build: $(BUILD) $(BUILD_WORKER)

$(BUILD): $(SRC) | node_modules
	mkdir -p $(@D)
	$(NODE_BIN)/browserify src/index.js $(BROWSERIFY_OPTIONS) --standalone mapboxgl \
	| $(NODE_BIN)/exorcist --base $(CURDIR) $@.map > $@

$(BUILD_WORKER): $(SRC) | node_modules
	$(NODE_BIN)/browserify src/source/worker.js  $(BROWSERIFY_OPTIONS) \
	| $(NODE_BIN)/exorcist --base $(CURDIR) $@.map > $@

node_modules: package.json
	yarn && touch $@

dist: $(DIST) $(DIST_WORKER)

lint: | node_modules
	$(NODE_BIN)/eslint --cache --ignore-path .gitignore src test bench docs/_posts/examples/*.html debug/*.html

test: test-unit | node_modules

test-integration: test-render test-query | node_modules

test-unit:
	$(NODE_BIN)/tap --reporter dot --no-coverage test/unit

test-render:
	node test/render.test.js

test-query:
	node test/query.test.js

distclean: clean
	rm -fr node_modules dist

clean:
	rm -fr dist

clean-test:
	find test/integration/*-tests -mindepth 2 -type d -not -exec test -e "{}/style.json" \; -print
	# | xargs -t rm -r

.PHONY: all clean clean-test check lint build dist distclean
.PHONY: test test-unit test-render test-query
