INSERT INTO "Schools"
    ("code", "name", "nit", "city", "department", "levelsOffered", "brandColor", "isPartner", "status", "isActive", "isDeleted")
VALUES
    ('colegio-san-rafael', 'Colegio San Rafael', '900000001-1', 'Santa Marta', 'Magdalena', 'Preescolar a 11°', '#d9982b', TRUE, 'active', TRUE, FALSE),
    ('gimnasio-del-mar', 'Gimnasio del Mar', '900000002-9', 'Santa Marta', 'Magdalena', 'Preescolar a 11°', '#1b9aa5', TRUE, 'active', TRUE, FALSE),
    ('liceo-cartagena-bilingue', 'Liceo Cartagena Bilingüe', '900000003-7', 'Cartagena', 'Bolívar', 'Preescolar a 11°', '#a4385b', TRUE, 'active', TRUE, FALSE),
    ('colegio-bolivariano', 'Colegio Bolivariano', '900000004-5', 'Barranquilla', 'Atlántico', 'Preescolar a 11°', '#287654', TRUE, 'active', TRUE, FALSE),
    ('ie-tayrona', 'I.E. Tayrona', '900000005-3', 'Santa Marta', 'Magdalena', 'Preescolar a 11°', '#8050a1', TRUE, 'active', TRUE, FALSE),
    ('colegio-nuestra-senora-del-carmen', 'Colegio Nuestra Señora del Carmen', '900000006-1', 'Cartagena', 'Bolívar', 'Preescolar a 11°', '#c35740', TRUE, 'active', TRUE, FALSE),
    ('gimnasio-moderno-caribe', 'Gimnasio Moderno Caribe', '900000007-9', 'Barranquilla', 'Atlántico', 'Preescolar a 11°', '#3e70a8', TRUE, 'active', TRUE, FALSE),
    ('colegio-las-americas', 'Colegio Las Américas', '900000008-7', 'Bogotá', 'Cundinamarca', 'Preescolar a 11°', '#b48a2d', TRUE, 'active', TRUE, FALSE),
    ('liceo-simon-bolivar', 'Liceo Simón Bolívar', '900000009-5', 'Santa Marta', 'Magdalena', 'Preescolar a 11°', '#237f8a', TRUE, 'active', TRUE, FALSE),
    ('colegio-don-bosco', 'Colegio Don Bosco', '900000010-9', 'Valledupar', 'Cesar', 'Preescolar a 11°', '#984865', TRUE, 'active', TRUE, FALSE),
    ('instituto-magdalena', 'Instituto Magdalena', '900000011-7', 'Ciénaga', 'Magdalena', 'Preescolar a 11°', '#5d8a4c', TRUE, 'active', TRUE, FALSE)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "city" = EXCLUDED."city",
    "department" = EXCLUDED."department",
    "levelsOffered" = EXCLUDED."levelsOffered",
    "brandColor" = EXCLUDED."brandColor",
    "isPartner" = EXCLUDED."isPartner",
    "status" = EXCLUDED."status",
    "isActive" = EXCLUDED."isActive",
    "isDeleted" = EXCLUDED."isDeleted",
    "deletedAt" = NULL,
    "updatedAt" = NOW();
