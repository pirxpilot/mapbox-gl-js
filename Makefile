PROJECT=mapbox-gl
NODE_BIN=./node_modules/.bin

find = $(foreach dir,$(1),$(foreach d,$(wildcard $(dir)/*),$(call find,$(d),$(2))) $(wildcard $(dir)/$(strip $(2))))

SRC = $(call find, src, *.js)
DIST = dist/$(PROJECT).js
BUILD = $(DIST:%.js=%-dev.js)

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

check: lint flow test

build: $(BUILD)

# package.json is also using | derequire here
$(BUILD): $(SRC) | node_modules
	$(NODE_BIN)/browserify src/index.js --debug --standalone mapboxgl \
	| $(NODE_BIN)/exorcist --base $(CURDIR)  $@.map > $@

.DELETE_ON_ERROR: dist/$(PROJECT)-dev.js

node_modules: package.json
	yarn && touch $@

dist: $(DIST)

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

flow:
	$(NODE_BIN)/flow .

test-query:

clean:
	rm -fr dist/$(PROJECT)*.js dist/$(PROJECT)*.map

clean-test:
	find test/integration/*-tests -mindepth 2 -type d -not -exec test -e "{}/style.json" \; -print
	# | xargs -t rm -r

.PHONY: all clean clean-test check lint build dist
.PHONY: test test-unit test-render test-query
