PRAGMA writable_schema = 1;

UPDATE sqlite_master SET sql = replace(
	sql,
	'FOREIGN KEY (registry_code) REFERENCES organizations (registry_code),' ||
	char(10),
	''
)
WHERE name = 'organization_registry_cards';

PRAGMA writable_schema = 0;
