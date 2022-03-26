CREATE TABLE organization_taxes (
	registry_code TEXT NOT NULL,
	year INTEGER NOT NULL,
	quarter INTEGER NOT NULL,
	emtak TEXT,
	revenue REAL NOT NULL,
	taxes REAL NOT NULL,
	employee_count INTEGER NOT NULL,
	employment_taxes REAL NOT NULL,

	CONSTRAINT registry_code_length CHECK (length(registry_code) > 0),
	CONSTRAINT registry_code_format CHECK (registry_code NOT GLOB '[^0-9]'),
	CONSTRAINT year_natural CHECK (year > 0),
	CONSTRAINT quarter_four CHECK (quarter >= 1 AND quarter <= 4),
	CONSTRAINT emtak_length CHECK (length(emtak) > 0),
	CONSTRAINT taxes_positive CHECK (taxes >= 0),
	CONSTRAINT employee_count_positive CHECK (employee_count >= 0),
	CONSTRAINT employment_taxes_positive CHECK (employment_taxes >= 0)
);
CREATE UNIQUE INDEX index_organization_taxes_on_organization_year_quarter
ON organization_taxes (registry_code, year, quarter);
CREATE INDEX index_organization_taxes_on_year_quarter
ON organization_taxes (year, quarter);
CREATE TABLE organizations (
	registry_code TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	official_name TEXT,
	founded_on TEXT,
	url TEXT,
	other_urls TEXT NOT NULL DEFAULT '[]',
	email TEXT,
	short_descriptions TEXT NOT NULL DEFAULT '{}',
	long_descriptions TEXT NOT NULL DEFAULT '{}',
	board_members TEXT NOT NULL DEFAULT '[]',
	business_models TEXT NOT NULL DEFAULT '[]',
	regions TEXT NOT NULL DEFAULT '[]',
	sustainability_goals TEXT NOT NULL DEFAULT '[]',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	published_at TEXT, logo BLOB, logo_type TEXT, sev_member INTEGER NOT NULL DEFAULT 0,

	CONSTRAINT registry_code_length CHECK (length(registry_code) > 0),
	CONSTRAINT registry_code_format CHECK (registry_code NOT GLOB '[^0-9]'),

	CONSTRAINT founded_on_format
	CHECK (founded_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),

	CONSTRAINT name_length CHECK (length(name) > 0),
	CONSTRAINT official_name_length CHECK (length(official_name) > 0),
	CONSTRAINT url_length CHECK (length(url) > 0),
	CONSTRAINT email_length CHECK (length(email) > 0),
	CONSTRAINT short_descriptions_json CHECK (json_valid(short_descriptions)),
	CONSTRAINT long_descriptions_json CHECK (json_valid(long_descriptions)),
	CONSTRAINT other_urls_json CHECK (json_valid(other_urls) > 0),
	CONSTRAINT board_members_json CHECK (json_valid(board_members) > 0),
	CONSTRAINT business_models_json CHECK (json_valid(business_models) > 0),
	CONSTRAINT regions_json CHECK (json_valid(regions) > 0),
	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT published_at_format CHECK (published_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT logo_length CHECK (length(logo) > 0),
	CONSTRAINT logo_type_length CHECK (length(logo_type) > 0),
	CONSTRAINT logo_with_type CHECK ((logo IS NULL) = (logo_type IS NULL)),

	CONSTRAINT sustainability_goals_json
	CHECK (json_valid(sustainability_goals) > 0)
);
CREATE TABLE organization_registry_cards (
	registry_code TEXT NOT NULL,
	issued_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	content BLOB NOT NULL,
	content_type TEXT NOT NULL,

	PRIMARY KEY (registry_code, issued_at),
	FOREIGN KEY (registry_code) REFERENCES organizations (registry_code),

	CONSTRAINT issued_at_format CHECK (issued_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT content_length CHECK (length(content) > 0),
	CONSTRAINT content_type_length CHECK (length(content_type) > 0)
);
CREATE TABLE accounts (
	id INTEGER PRIMARY KEY,
	email TEXT UNIQUE COLLATE NOCASE NOT NULL,
	name TEXT,
	encrypted_password TEXT,
	administrative INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  invite_token_sha256 BLOB UNIQUE NOT NULL,
	invite_accepted_at TEXT,

	CONSTRAINT name_length CHECK (length(name) > 0),
	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT updated_at_format CHECK (updated_at GLOB '*-*-*T*:*:*Z'),

	CONSTRAINT invite_accepted_at_format
	CHECK (invite_accepted_at GLOB '*-*-*T*:*:*Z'),

	CONSTRAINT email_length CHECK (length(email) > 0),
	CONSTRAINT encrypted_password_length CHECK (length(encrypted_password) > 0),

	CONSTRAINT invite_token_sha256_length
	CHECK (length(invite_token_sha256) == 32)
);
CREATE TABLE sessions (
	id INTEGER PRIMARY KEY NOT NULL,
	account_id INTEGER NOT NULL,
  token_sha256 BLOB UNIQUE NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT,

	FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,

	CONSTRAINT token_sha256_length CHECK (length(token_sha256) == 32),
	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT deleted_at_format CHECK (deleted_at GLOB '*-*-*T*:*:*Z')
);
CREATE TABLE organization_members (
	registry_code INTEGER NOT NULL,
	account_id INTEGER NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	created_by_id INTEGER NOT NULL,

	PRIMARY KEY (registry_code, account_id),

	FOREIGN KEY (registry_code) REFERENCES organizations (registry_code)
	ON DELETE CASCADE,

	FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
	FOREIGN KEY (created_by_id) REFERENCES accounts (id),

	CONSTRAINT created_at_format CHECK (created_at GLOB '*-*-*T*:*:*Z')
);
CREATE TABLE organization_taxes_updates (
	registry_code TEXT NOT NULL,
	year INTEGER NOT NULL,
	quarter INTEGER NOT NULL,
	revenue REAL,
	taxes REAL,
	employee_count INTEGER,
	employment_taxes REAL,

	FOREIGN KEY (registry_code) REFERENCES organizations (registry_code)
	ON DELETE CASCADE,

	CONSTRAINT year_natural CHECK (year > 0),
	CONSTRAINT quarter_four CHECK (quarter >= 1 AND quarter <= 4),
	CONSTRAINT taxes_positive CHECK (taxes >= 0),
	CONSTRAINT employee_count_positive CHECK (employee_count >= 0),
	CONSTRAINT employment_taxes_positive CHECK (employment_taxes >= 0)
);
CREATE UNIQUE INDEX index_organization_taxes_updates_on_organization_year_quarter
ON organization_taxes_updates (registry_code, year, quarter);
CREATE TABLE organization_updates (
	id INTEGER PRIMARY KEY NOT NULL,
	registry_code TEXT NOT NULL,
	at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	by_id INTEGER NOT NULL,
	attributes TEXT NOT NULL DEFAULT '[]',

	FOREIGN KEY (registry_code) REFERENCES organizations (registry_code)
	ON DELETE CASCADE,

	FOREIGN KEY (by_id) REFERENCES accounts (id)
	ON DELETE CASCADE,

	CONSTRAINT at_format CHECK (at GLOB '*-*-*T*:*:*Z'),
	CONSTRAINT attributes_json CHECK (json_valid(attributes) > 0)
);
CREATE INDEX index_organization_updates
ON organization_updates (registry_code);

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE migrations (version TEXT PRIMARY KEY NOT NULL);
INSERT INTO migrations VALUES('20211010133700');
INSERT INTO migrations VALUES('20211010133710');
INSERT INTO migrations VALUES('20211010133720');
INSERT INTO migrations VALUES('20211010133730');
INSERT INTO migrations VALUES('20211010133740');
INSERT INTO migrations VALUES('20211010133750');
INSERT INTO migrations VALUES('20211010133760');
INSERT INTO migrations VALUES('20211010133770');
INSERT INTO migrations VALUES('20211010133780');
INSERT INTO migrations VALUES('20220202181447');
INSERT INTO migrations VALUES('20220326120704');
COMMIT;
