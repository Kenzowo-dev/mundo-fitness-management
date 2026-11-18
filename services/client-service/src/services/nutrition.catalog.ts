import type { Ingredient, Recipe } from "../../../../shared/types/nutrition.js";

interface Food {
  name: string;
  quantity: number;
  unit: string;
  groups: string[];
  allergens: string[];
  diet: Recipe["diet"];
}

/** Define una porción orientativa y las familias que permiten excluir el alimento. */
function food(name: string, quantity: number, unit: string, groups: string[] = [],
  allergens: string[] = [], diet: Recipe["diet"] = "vegana"): Food {
  return { name, quantity, unit, groups, allergens, diet };
}

export const foods = {
  avena: food("Avena en hojuelas", 40, "g", ["avena", "cereales"], ["gluten"]),
  quinua: food("Quinua cocida", 100, "g", ["quinua", "quinoa"]),
  arroz: food("Arroz integral cocido", 100, "g", ["arroz", "cereales"]),
  papa: food("Papa sancochada", 150, "g", ["papa", "patata", "tubérculos"]),
  camote: food("Camote sancochado", 150, "g", ["camote", "batata", "tubérculos"]),
  choclo: food("Choclo cocido", 90, "g", ["maíz", "choclo", "cereales"]),
  lenteja: food("Lentejas cocidas", 100, "g", ["lenteja", "lentejas", "menestras", "legumbres"]),
  frejol: food("Frejoles cocidos", 100, "g", ["frejol", "frijoles", "frijol", "porotos", "menestras", "legumbres"]),
  garbanzo: food("Garbanzos cocidos", 100, "g", ["garbanzo", "garbanzos", "menestras", "legumbres"]),
  huevo: food("Huevo sancochado", 1, "unidad", ["huevos"], ["huevo"], "vegetariana"),
  pollo: food("Pollo cocido deshilachado", 90, "g", ["pollo", "aves", "carne"], [], "normal"),
  pescado: food("Bonito cocido sin espinas", 90, "g", ["bonito", "pescados"], ["pescado"], "normal"),
  yogur: food("Yogur natural sin azúcar", 125, "g", ["yogurt", "yogur", "lácteos", "lactosa"], ["leche"], "vegetariana"),
  platano: food("Plátano", 1, "unidad", ["banana", "fruta"]),
  mango: food("Mango", 100, "g", ["fruta"]),
  manzana: food("Manzana", 1, "unidad", ["fruta"]),
  papaya: food("Papaya", 120, "g", ["fruta"]),
  pera: food("Pera", 1, "unidad", ["fruta"]),
  naranja: food("Naranja", 1, "unidad", ["fruta", "cítricos"]),
  palta: food("Palta", 50, "g", ["aguacate"]),
  tomate: food("Tomate", 70, "g", ["verduras"]),
  zanahoria: food("Zanahoria", 60, "g", ["verduras"]),
  espinaca: food("Espinaca", 40, "g", ["verduras"]),
  pepino: food("Pepino", 60, "g", ["verduras"]),
  agua: food("Agua potable", 150, "ml"),
};
type Key = keyof typeof foods;
type Dish = [string, Key, Key, Key, string[]?];

/** Construye fichas para una técnica común conservando cantidades, alérgenos y pasos de cada variante. */
function collection(type: Recipe["type"], technique: string, minutes: number, dishes: Dish[]): Recipe[] {
  return dishes.map(([name, base, extra, finish, preparation], index) => {
    const cookedOats = base === "avena";
    const items = [foods[base], foods[extra], foods[finish], ...(cookedOats ? [foods.agua] : [])];
    const ingredients: Ingredient[] = items.map(({ name, quantity, unit }) => ({ name, quantity, unit }));
    const diet = items.some(item => item.diet === "normal") ? "normal"
      : items.some(item => item.diet === "vegetariana") ? "vegetariana" : "vegana";
    const main = type === "Almuerzo" || type === "Cena";
    return {
      id: type + "-" + (index + 1), name, type, ingredients, diet, servings: 1,
      minutes: minutes + (cookedOats ? 5 : index % 3 * 2),
      allergens: [...new Set(items.flatMap(item => item.allergens))],
      economical: ![base, extra, finish].some(key => ["pescado", "palta", "mango", "yogur"].includes(key)),
      description: technique + " con " + ingredients.slice(0, 3).map(item => item.name.toLowerCase()).join(", ") + ".",
      steps: preparation ?? [
        "Lava las frutas y verduras y prepara las cantidades indicadas. Usa los ingredientes cocidos donde indica la lista.",
        cookedOats ? "Hierve el agua, agrega la avena y cocina removiendo hasta que esté suave."
          : main ? "Calienta " + foods[base].name.toLowerCase() + " y " + foods[extra].name.toLowerCase() + " hasta que estén bien calientes."
          : "Coloca " + foods[base].name.toLowerCase() + " en un plato y añade " + foods[extra].name.toLowerCase() + " en trozos o cucharadas.",
        cookedOats ? "Pica las frutas y sírvelas sobre la avena."
          : "Corta o ralla " + foods[finish].name.toLowerCase() + " y distribuye sobre el plato antes de servir.",
      ],
      reason: main ? "Combina una base de cereal o tubérculo con una fuente de proteína y verduras."
        : "Ofrece una forma sencilla de variar los alimentos del día.",
    };
  });
}

export const recipes: Recipe[] = [
  ...collection("Desayuno", "Desayuno de preparación casera", 8, [
    ["Avena con manzana y plátano","avena","manzana","platano"],
    ["Avena tropical","avena","papaya","mango"],
    ["Quinua con pera y plátano","quinua","pera","platano"],
    ["Quinua con mango y papaya","quinua","mango","papaya"],
    ["Camote con palta y tomate","camote","palta","tomate"],
    ["Papa con huevo y espinaca","papa","huevo","espinaca"],
    ["Yogur con mango y pera","yogur","mango","pera"],
    ["Choclo con palta y tomate","choclo","palta","tomate"],
    ["Quinua con naranja y manzana","quinua","naranja","manzana"],
    ["Avena con pera y manzana","avena","pera","manzana"],
  ]),
  ...collection("Almuerzo", "Plato tibio", 15, [
    ["Quinua con lentejas y tomate","quinua","lenteja","tomate"],
    ["Tacu tacu de frejoles con zanahoria","arroz","frejol","zanahoria", [
      "Aplasta los frejoles cocidos con un tenedor y mezcla con el arroz cocido.",
      "Forma una tortilla compacta. Dora por ambos lados en una sartén antiadherente hasta calentar el centro.",
      "Lava y ralla la zanahoria y sírvela junto al tacu tacu.",
    ]],
    ["Papa con garbanzos y espinaca","papa","garbanzo","espinaca"],
    ["Camote con frejoles y tomate","camote","frejol","tomate"],
    ["Choclo con garbanzos y pepino","choclo","garbanzo","pepino"],
    ["Arroz con pollo y zanahoria","arroz","pollo","zanahoria"],
    ["Quinua con bonito y espinaca","quinua","pescado","espinaca"],
    ["Papa rellena de huevo y tomate","papa","huevo","tomate", [
      "Pela y aplasta la papa sancochada mientras está tibia.",
      "Pica el huevo cocido y el tomate lavado. Reserva parte del tomate para servir.",
      "Extiende la papa, coloca el relleno en el centro y cierra con cuidado. Sirve con el tomate reservado.",
    ]],
    ["Quinua con frejoles y pepino","quinua","frejol","pepino"],
    ["Camote con lentejas y espinaca","camote","lenteja","espinaca"],
  ]),
  ...collection("Cena", "Cena tibia", 12, [
    ["Quinua con garbanzos y tomate","quinua","garbanzo","tomate"],
    ["Puré de camote con lentejas y zanahoria","camote","lenteja","zanahoria", [
      "Pela el camote sancochado, caliéntalo y aplástalo con un tenedor.",
      "Ralla la zanahoria lavada y caliéntala con las lentejas y un poco de su líquido de cocción.",
      "Sirve las lentejas junto al puré de camote.",
    ]],
    ["Arroz con garbanzos y espinaca","arroz","garbanzo","espinaca"],
    ["Papa con frejoles y pepino","papa","frejol","pepino"],
    ["Choclo con lentejas y tomate","choclo","lenteja","tomate"],
    ["Arroz con bonito y pepino","arroz","pescado","pepino"],
    ["Camote con pollo y espinaca","camote","pollo","espinaca"],
    ["Quinua con huevo y zanahoria","quinua","huevo","zanahoria"],
    ["Arroz con lentejas y tomate","arroz","lenteja","tomate"],
    ["Papa con garbanzos y zanahoria","papa","garbanzo","zanahoria"],
  ]),
  ...collection("Merienda", "Colación sencilla", 5, [
    ["Papaya con plátano y naranja","papaya","platano","naranja"],
    ["Manzana con pera y mango","manzana","pera","mango"],
    ["Quinua con plátano y papaya","quinua","platano","papaya"],
    ["Yogur con manzana y pera","yogur","manzana","pera"],
    ["Choclo con pepino y palta","choclo","pepino","palta"],
    ["Camote con naranja y mango","camote","naranja","mango"],
    ["Papa con tomate y palta","papa","tomate","palta"],
    ["Mango con papaya y pera","mango","papaya","pera"],
    ["Yogur con plátano y mango","yogur","platano","mango"],
    ["Quinua con manzana y papaya","quinua","manzana","papaya"],
  ]),
];
