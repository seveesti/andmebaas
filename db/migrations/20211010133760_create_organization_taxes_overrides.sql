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

CREATE UNIQUE INDEX
	index_organization_taxes_updates_on_organization_year_quarter
ON organization_taxes_updates (registry_code, year, quarter);
