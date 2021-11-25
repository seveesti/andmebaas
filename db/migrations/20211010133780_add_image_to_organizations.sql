ALTER TABLE organizations ADD COLUMN logo BLOB;
ALTER TABLE organizations ADD COLUMN logo_type TEXT;

PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'
	CONSTRAINT sustainability_goals_json',
	'	CONSTRAINT logo_length CHECK (length(logo) > 0),
	CONSTRAINT logo_type_length CHECK (length(logo_type) > 0),
	CONSTRAINT logo_with_type CHECK ((logo IS NULL) = (logo_type IS NULL)),

	CONSTRAINT sustainability_goals_json'
)
WHERE name = 'organizations';

PRAGMA writable_schema = 0;
