ALTER TABLE "TrackActivityType" RENAME COLUMN "name" TO "nameEn";
ALTER TABLE "TrackActivityType" ADD COLUMN "nameRu" TEXT;

UPDATE "TrackActivityType"
SET "nameRu" = CASE "key"
  WHEN 'walking' THEN 'Ходьба'
  WHEN 'running' THEN 'Бег'
  WHEN 'cycling' THEN 'Велосипед'
  WHEN 'skiing' THEN 'Лыжи'
  WHEN 'rowing' THEN 'Гребля'
  WHEN 'other' THEN 'Другое'
  ELSE "nameRu"
END
WHERE "key" IN ('walking', 'running', 'cycling', 'skiing', 'rowing', 'other');
