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
