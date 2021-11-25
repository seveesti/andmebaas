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
