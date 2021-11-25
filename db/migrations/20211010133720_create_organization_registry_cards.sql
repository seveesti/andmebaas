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
