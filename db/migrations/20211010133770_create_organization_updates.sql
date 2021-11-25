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
