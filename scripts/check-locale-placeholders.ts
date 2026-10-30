/**
 * Checks locale JSON files for unsupported single-brace placeholders and
 * verifies the affected trips strings with escapeValue: false and i18next's
 * default {{ }} interpolation delimiters, as used by next-i18next.
 * Run with:
 *
 *   npx tsx scripts/check-locale-placeholders.ts
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import i18next from "i18next";
import enTrips from "../app/i18n/locales/en/trips.json";
import ruTrips from "../app/i18n/locales/ru/trips.json";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const localesDirectory = path.resolve(scriptDirectory, "../app/i18n/locales");
const singleBracePlaceholder = /(?<!\{)\{([^{}]+)\}(?!\})/g;
let failures = 0;

const findJsonFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat();
};

const inspectStrings = (value: unknown, file: string, key = ""): void => {
  if (typeof value === "string") {
    for (const match of value.matchAll(singleBracePlaceholder)) {
      const relativeFile = path.relative(localesDirectory, file).split(path.sep).join("/");
      console.error(`✗ ${relativeFile}:${key}: single-brace placeholder {${match[1]}}`);
      failures += 1;
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectStrings(item, file, `${key}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      inspectStrings(childValue, file, key ? `${key}.${childKey}` : childKey);
    }
  }
};

const checkLocaleFiles = async (): Promise<void> => {
  const files = await findJsonFiles(localesDirectory);

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    inspectStrings(JSON.parse(contents), file);
  }

  if (failures === 0) {
    console.log(`✓ Scanned ${files.length} locale JSON files; no single-brace placeholders found.`);
  }
};

const checkTranslations = async (): Promise<void> => {
  const instance = i18next.createInstance();

  await instance.init({
    lng: "en",
    fallbackLng: false,
    ns: ["trips"],
    defaultNS: "trips",
    resources: {
      en: { trips: enTrips },
      ru: { trips: ruTrips },
    },
    interpolation: { escapeValue: false },
  });

  const expected = {
    en: {
      distance: "Distance: 12.5 km",
      selectedPoint: "Selected point 3. Press Delete to remove.",
      source: "Source: GPX",
      photoTitle: "Timezone for Bob's photo",
    },
    ru: {
      distance: "Расстояние: 12.5 km",
      selectedPoint: "Выбрана точка 3. Нажмите Delete, чтобы удалить.",
      source: "Источник: GPX",
      photoTitle: "Часовой пояс: Bob's photo",
    },
  };

  for (const language of ["en", "ru"] as const) {
    const translate = instance.getFixedT(language, "trips");
    const checks = [
      [
        "trackEditorDistanceLabel",
        translate("trackEditorDistanceLabel", { distance: "12.5 km" }),
        expected[language].distance,
      ],
      [
        "trackEditorMapSelectedPointAria",
        translate("trackEditorMapSelectedPointAria", { index: 3 }),
        expected[language].selectedPoint,
      ],
      [
        "trackTimeSourceBadgeLabel",
        translate("trackTimeSourceBadgeLabel", { source: "GPX" }),
        expected[language].source,
      ],
      [
        "photoTimezoneDialogTitleWithPhoto",
        translate("photoTimezoneDialogTitleWithPhoto", { title: "Bob's photo" }),
        expected[language].photoTitle,
      ],
    ] as const;

    for (const [key, actual, wanted] of checks) {
      if (actual !== wanted) {
        console.error(`✗ ${language}/trips.${key}: expected ${JSON.stringify(wanted)}, got ${JSON.stringify(actual)}`);
        failures += 1;
      } else {
        console.log(`✓ ${language}/trips.${key}`);
      }
    }
  }
};

await checkLocaleFiles();
await checkTranslations();

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("All locale placeholder checks passed.");
}
