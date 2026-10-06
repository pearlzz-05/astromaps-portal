CREATE DATABASE astromaps_db;

\c astromaps_db;

CREATE TABLE IF NOT EXISTS celestial_objects (
    id SERIAL PRIMARY KEY,
    catalog_id VARCHAR(50) UNIQUE NOT NULL,
    object_name VARCHAR(100) NOT NULL,
    ra DECIMAL(9,6) NOT NULL,
    dec DECIMAL(9,6) NOT NULL,
    type VARCHAR(50)
);

INSERT INTO celestial_objects (catalog_id, object_name, ra, dec, type) VALUES
('M42', 'Orion Nebula', 83.8221, -5.2333, 'Emission Nebula'),
('M31', 'Andromeda Galaxy', 10.6847, 41.2687, 'Spiral Galaxy')
ON CONFLICT (catalog_id) DO NOTHING;