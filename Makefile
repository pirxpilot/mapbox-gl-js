PROJECT=mapbox-gl
NODE_BIN=./build/node_modules/.bin

find = $(foreach dir,$(1),$(foreach d,$(wildcard $(dir)/*),$(call find,$(d),$(2))) $(wildcard $(dir)/$(strip $(2))))

SRC = $(call find, src, *.js)

BUILD = dist/$(PROJECT).js dist/$(PROJECT)-worker.js
DIST = $(BUILD:%.js=%.min.js)

DEBUG_FLAG ?= true

%/node_modules: %/package.json
	yarn --cwd $(@D) --no-progress
	touch $@

%.min.js: %.js
	$(NODE_BIN)/terser \
	    --mangle \
		--define DEBUG=$(DEBUG_FLAG) \
		--compress drop_console \
		--compress pure_funcs=['assert'] \
		--source-map filename='$@.map' \
		--source-map content='$<.map' \
		--output $@ \
		-- $<

.SECONDEXPANSION:

%/.dir:
	mkdir --parent $(@D)
	touch $@

build/min/package.json: package.json | $$(@D)/.dir
	jq  '{ version }' < $< > $@

GLSL = $(wildcard src/shaders/*.glsl)

build/min/src/shaders/%.glsl.txt: src/shaders/%.glsl  | $$(@D)/.dir
	$(NODE_BIN)/webpack-glsl-minify \
	    --preserveUniforms=true \
	    --preserveDefines=true \
	    --preserveVariables=true \
		--output=sourceOnly \
		--outDir=build/min \
		--ext=.txt \
		$<

JQ_FILTER = walk(if type == "object" then delpaths([["doc"],["example"],["sdk-support"]]) else . end)

build/min/style-spec/reference/%.json: src/style-spec/reference/%.json  | $$(@D)/.dir
	jq '$(JQ_FILTER)' $< > $@

PREBUILD = \
	build/min/package.json \
	build/min/style-spec/reference/v8.json \
	$(GLSL:%.glsl=build/min/%.glsl.txt)

prebuild: $(PREBUILD)

.PHONY: prebuild

all: check build

check: lint test

build: $(PREBUILD)
build: $(BUILD)

dist: DEBUG_FLAG=false
dist: $(PREBUILD)
dist: $(DIST)

distdir:
	mkdir -p dist

DEPENDENCIES = build/node_modules $(CURDIR)/node_modules src/style-spec/node_modules

dependencies: | $(DEPENDENCIES)

ESBUILD_OPTIONS = --define:global=globalThis --define:DEBUG=$(DEBUG_FLAG)

dist/$(PROJECT).js: $(SRC) | dependencies distdir
	esbuild --bundle src/index.js \
		$(ESBUILD_OPTIONS) \
		--global-name=mapboxgl \
		--outfile=$@

dist/$(PROJECT)-worker.js: $(SRC) | dependencies distdir
	esbuild --bundle src/source/worker.js  \
		$(ESBUILD_OPTIONS) \
		--outfile=$@

lint: dependencies
	$(NODE_BIN)/eslint --cache --ignore-path .gitignore src test

test: test-unit

test-integration: test-render test-query

test-unit: dependencies
	NODE_PATH=build/node_modules \
	$(NODE_BIN)/tap --reporter dot --no-coverage test/unit

test-render: dependencies
	node test/render.test.js

test-query: dependencies
	node test/query.test.js

distclean: clean
	rm -fr $(DEPENDENCIES) .eslintcache

clean:
	rm -fr dist build/min

clean-test:
	find test/integration/*-tests -mindepth 2 -type d -not -exec test -e "{}/style.json" \; -print
	# | xargs -t rm -r

.PHONY: all clean clean-test check lint build dist distclean dependencies
.PHONY: test test-unit test-render test-query
