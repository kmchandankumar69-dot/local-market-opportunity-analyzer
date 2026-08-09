-- schema.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  name TEXT,
  geojson JSONB,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  area_id INT REFERENCES areas(id),
  source TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE surveys (
  id SERIAL PRIMARY KEY,
  area_id INT REFERENCES areas(id),
  responses JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE opportunities (
  id SERIAL PRIMARY KEY,
  area_id INT REFERENCES areas(id),
  category TEXT,
  score NUMERIC,
  components JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_business_category ON businesses(category);
