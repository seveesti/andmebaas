ENV = development
NODE = node
NODE_OPTS = --use-strict --require j6pack/register
NPM = npm
MOCHA = ./node_modules/.bin/_mocha
JQ_OPTS = --tab
SASS = $(NODE) ./node_modules/.bin/sass --style expanded --no-source-map
TEST = $$(find test -name "*_test.js")
SHANGE = vendor/shange -d db/migrations -f "config/$(ENV).sqlite3"
LIVERELOAD_PORT = 35738
TRANSLATIONS_URL = https://docs.google.com/spreadsheets/d/1ExuFguyrBhKchO__tm1hbppHVayoYIMFuGTSMbHE-PU/gviz/tq?tqx=out:json&tq&gid=0

SITE_URL = \
	$(shell ENV="$(ENV)" node -e 'console.log(require("./config").siteUrl)')

export ENV
export PORT
export LIVERELOAD_PORT

ifneq ($(filter test spec autotest autospec test/%, $(MAKECMDGOALS)),)
	ENV = test
endif

RSYNC_OPTS = \
	--compress \
	--recursive \
	--links \
	--itemize-changes \
	--omit-dir-times \
	--times \
	--prune-empty-dirs \
	--delete

love: stylesheets

stylesheets:
	@$(SASS) assets:public/assets

autostylesheets: stylesheets
	@$(MAKE) SASS="$(SASS) --watch" "$<"

web: PORT = 6090
web:
	@$(NODE) $(NODE_OPTS) ./bin/$@

livereload:
	@$(NODE) \
		./node_modules/.bin/livereload public --wait 50 --port $(LIVERELOAD_PORT)

test:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot $(TEST)

spec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec $(TEST)

autotest:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot --watch $(TEST)

autospec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec --watch $(TEST)

shrinkwrap:
	$(NPM) shrinkwrap --dev

rebuild:
	cd node_modules/better-sqlite3 && \
	$(NPM) --ignore-scripts false run build-release

config/%.sqlite3:
	sqlite3 "$@" < db/schema.sql

db/create: config/$(ENV).sqlite3

db/status:
	@$(SHANGE) status

db/migrate:
	@$(SHANGE) migrate
	@$(SHANGE) schema > db/schema.sql

db/migration: NAME = $(error "Please set NAME.")
db/migration:
	@$(SHANGE) create "$(NAME)"

translations: lib/i18n/en.json
translations: lib/i18n/et.json

tmp:; mkdir -p tmp

tmp/translations.json: tmp
	curl -H "X-DataSource-Auth: true" "$(TRANSLATIONS_URL)" | sed -e 1d > "$@"

lib/i18n/en.json: JQ_OPTS += --sort-keys --arg lang English
lib/i18n/et.json: JQ_OPTS += --sort-keys --arg lang Estonian
lib/i18n/en.json \
lib/i18n/et.json \
lib/i18n/ru.json: tmp/translations.json
	jq $(JQ_OPTS) -f scripts/translation.jq "$<" > "$@"

menus: lib/i18n/et_header_menu.json
menus: lib/i18n/en_header_menu.json
menus: lib/i18n/et_footer_menu.json
menus: lib/i18n/en_footer_menu.json

lib/i18n/et_header_menu.json:
	curl "$(SITE_URL)/wp-json/wp/v2/menu?lang=et" | jq $(JQ_OPTS) . > "$@"
lib/i18n/et_footer_menu.json:
	curl "$(SITE_URL)/wp-json/acf/v3/options/options" | jq $(JQ_OPTS) . > "$@"

lib/i18n/en_header_menu.json:
	curl "$(SITE_URL)/wp-json/wp/v2/menu?lang=en" | jq $(JQ_OPTS) . > "$@"
lib/i18n/en_footer_menu.json:
	curl "$(SITE_URL)/en/wp-json/acf/v3/options/options" | jq $(JQ_OPTS) . > "$@"

deploy:
	@rsync $(RSYNC_OPTS) \
		--exclude ".*" \
		--exclude "/config/development.*" \
		--exclude "/config/staging.*" \
		--exclude "/config/production.*" \
		--exclude "/config/*.sqlite3" \
		--exclude "/config/*.sqlite3-*" \
		--exclude "/assets/***" \
		--exclude "/test/***" \
		--exclude "/scripts/***" \
		--exclude "/node_modules/better-sqlite3/build/***" \
		--exclude "/node_modules/mocha/***" \
		--exclude "/node_modules/must/***" \
		--exclude "/node_modules/mitm/***" \
		--exclude "/node_modules/sinon/***" \
		--exclude "/node_modules/livereload/***" \
		--exclude "/node_modules/jsdom/***" \
		--exclude "/node_modules/sass/***" \
		--exclude "/tmp/***" \
		. \
		"$(or $(RSYNC_TARGET), $(error "Please set RSYNC_TARGET"))/"

production: RSYNC_TARGET = kell.ee:app/db
production: deploy

production/diff: RSYNC_OPTS += --dry-run
production/diff: production

.PHONY: love
.PHONY: web
.PHONY: livereload
.PHONY: stylesheets autostylesheets
.PHONY: test spec autotest autospec
.PHONY: translations menus
.PHONY: shrinkwrap rebuild
.PHONY: db/create db/status db/migrate db/migration
.PHONY: deploy production production/diff
