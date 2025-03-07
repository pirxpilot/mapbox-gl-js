PROJECT=mapbox-gl
NODE_BIN=./meta/node_modules/.bin

all: check build
.PHONY: all

find = $(foreach dir,$(1),$(foreach d,$(wildcard $(dir)/*),$(call find,$(d),$(2))) $(wildcard $(dir)/$(strip $(2))))

SRC = $(call find, src, *.js)

BUILD = build/$(PROJECT).js build/$(PROJECT)-worker.js

DEBUG_FLAG ?= true

%/node_modules: %/package.json
	yarn --cwd $(@D) --no-progress
	touch $@

.SECONDEXPANSION:

%/.dir:
	mkdir --parent $(@D)
	touch $@

build/min/package.json: package.json | $$(@D)/.dir
	jq  '{ version }' < $< > $@

GLSL = $(wildcard src/shaders/*.glsl)

build/min/src/shaders/%.glsl.txt: src/shaders/%.glsl  | $$(@D)/.dir meta/node_modules
	$(NODE_BIN)/webpack-glsl-minify \
	    --preserveUniforms=true \
	    --preserveDefines=true \
	    --preserveVariables=true \
		--output=sourceOnly \
		--outDir=build/min \
		--ext=.txt \
		$<

PREBUILD = \
	build/min/package.json \
	$(GLSL:%.glsl=build/min/%.glsl.txt)

prebuild: $(PREBUILD)
.PHONY: prebuild

check: lint test
.PHONY: check

build: $(PREBUILD)
build: $(BUILD)
.PHONY: build

dist: DEBUG_FLAG=false
dist: build
.PHONY: dist

DEPENDENCIES = meta/node_modules $(CURDIR)/node_modules

dependencies: | $(DEPENDENCIES)

ESBUILD_OPTIONS = --define:global=globalThis --define:DEBUG=$(DEBUG_FLAG)

build/$(PROJECT).js: $(SRC) | dependencies
	esbuild --bundle src/index.js \
		$(ESBUILD_OPTIONS) \
		--global-name=mapboxgl \
		--minify \
		--target=es2020 \
		--metafile=${@:.js=.meta.json} \
		--outfile=$@

build/$(PROJECT)-worker.js: $(SRC) | dependencies
	esbuild --bundle src/worker/index.js  \
		$(ESBUILD_OPTIONS) \
		--minify \
		--target=es2020 \
		--metafile=${@:.js=.meta.json} \
		--outfile=$@

lint: | meta/node_modules
	$(NODE_BIN)/biome ci
.PHONY: lint

format: | meta/node_modules
	$(NODE_BIN)/biome format --write
.PHONY: format

test: test-unit

test-integration: test-expression test-query test-render
.NOTPARALLEL: test-expression test-query test-render

test-unit test-render test-query: export NODE_PATH = meta/node_modules

TEST_REPORTER ?= --test-reporter dot

test-unit: dependencies
	node --test $(TEST_REPORTER) "test/unit/**/*.test.js"

test-expression: dependencies dependencies-integration
	node test/expression.test.js

test-render: dependencies dependencies-integration
	node test/render.test.js

test-query: dependencies dependencies-integration
	node test/query.test.js

dependencies-integration: | test/integration/node_modules test/integration/tiles/node_modules

.PHONY: dependencies-integration test test-integration test-unit test-render test-query

distclean: clean
	rm -fr $(DEPENDENCIES)

clean:
	rm -fr build

clean-test:
	find test/integration/*-tests -mindepth 2 -type d -not -exec test -e "{}/style.json" \; -print
	# | xargs -t rm -r

.PHONY: clean clean-test distclean

generate-struct-arrays:
	node meta/bin/generate-struct-arrays.js

.PHONY: generate-struct-arrays

generate-style-code:
	node meta/bin/generate-style-code.js

.PHONY: generate-style-code
