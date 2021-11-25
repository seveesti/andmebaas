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
