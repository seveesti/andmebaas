CREATE TABLE organizations (
	registry_code TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	official_name TEXT,
	founded_on TEXT,
	url TEXT,
	other_urls TEXT NOT NULL DEFAULT '[]',
	email TEXT,
	short_description TEXT,
	long_description TEXT,
	board_members TEXT NOT NULL DEFAULT '[]',
	business_models TEXT NOT NULL DEFAULT '[]',
	regions TEXT NOT NULL DEFAULT '[]',
	sustainability_goals TEXT NOT NULL DEFAULT '[]',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	published_at TEXT,

	CONSTRAINT registry_code_length CHECK (length(registry_code) > 0),
	CONSTRAINT registry_code_format CHECK (registry_code NOT GLOB '[^0-9]'),

	CONSTRAINT founded_on_format
	CHECK (founded_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),

	CONSTRAINT name_length CHECK (length(name) > 0),
	CONSTRAINT official_name_length CHECK (length(official_name) > 0),
	CONSTRAINT url_length CHECK (length(url) > 0),
	CONSTRAINT email_length CHECK (length(email) > 0),
	CONSTRAINT short_description_length CHECK (length(short_description) > 0),
	CONSTRAINT long_description_length CHECK (length(long_description) > 0),
	CONSTRAINT other_urls_json CHECK (json_valid(other_urls) > 0),
	CONSTRAINT board_members_json CHECK (json_valid(board_members) > 0),
	CONSTRAINT business_models_json CHECK (json_valid(business_models) > 0),
	CONSTRAINT regions_json CHECK (json_valid(regions) > 0),
	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT published_at_format CHECK (published_at GLOB '*-*-*T*:*:*Z'),

	CONSTRAINT sustainability_goals_json
	CHECK (json_valid(sustainability_goals) > 0)
);
