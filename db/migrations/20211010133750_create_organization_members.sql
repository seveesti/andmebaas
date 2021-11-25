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
