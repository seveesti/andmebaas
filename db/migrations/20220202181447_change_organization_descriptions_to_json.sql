ALTER TABLE organizations
RENAME COLUMN short_description TO short_descriptions;

ALTER TABLE organizations
RENAME COLUMN long_description TO long_descriptions;

UPDATE organizations SET
	short_descriptions = CASE
		WHEN short_descriptions IS NULL THEN '{}'
		ELSE json_object('et', short_descriptions)
		END,

	long_descriptions = CASE
		WHEN long_descriptions IS NULL THEN '{}'
		ELSE json_object('et', long_descriptions)
		END;

PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'short_descriptions TEXT',
	'short_descriptions TEXT NOT NULL DEFAULT ''{}'''
)
WHERE name = 'organizations';

UPDATE sqlite_master SET sql = replace(
	sql,
	'long_descriptions TEXT',
	'long_descriptions TEXT NOT NULL DEFAULT ''{}'''
)
WHERE name = 'organizations';

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT short_description_length CHECK (length(short_descriptions) > 0)',
	'CONSTRAINT short_descriptions_json CHECK (json_valid(short_descriptions))'
)
WHERE name = 'organizations';

UPDATE sqlite_master SET sql = replace(
	sql,
	'CONSTRAINT long_description_length CHECK (length(long_descriptions) > 0)',
	'CONSTRAINT long_descriptions_json CHECK (json_valid(long_descriptions))'
)
WHERE name = 'organizations';

PRAGMA writable_schema = 0;
