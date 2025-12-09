SELECT a.id, a.name, a.docs FROM "Assembly" a WHERE a.docs IS NOT NULL AND a.docs != '[]' LIMIT 5;
