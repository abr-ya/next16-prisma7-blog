export const createSlug = (word: string) => {
  console.log("createSlug, word: ", word);

  const converter: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ь: "",
    ы: "y",
    ъ: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  word = word.toLowerCase().trim();

  let result = "";
  for (let i = 0; i < word.length; ++i) {
    result += converter[word[i]] || word[i];
  }

  result = result.replace(/[^-0-9a-z]/g, "-");
  result = result.replace(/[-]+/g, "-");
  result = result.replace(/^-|-$/g, "");

  return result;
};
