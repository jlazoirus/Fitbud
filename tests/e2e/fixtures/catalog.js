// Catálogo determinista para la suite E2E (REQ-96).
// Mismas columnas que supabase/seed.sql: name, category, kcal, protein_g, carbs_g, fat_g (por 100 g).
// Valores redondos para que los cálculos de macros sean predecibles en los asserts.

let _id = 1;
const ing = (name, category, kcal, protein_g, carbs_g, fat_g) => ({
  id: _id++, name, category, kcal, protein_g, carbs_g, fat_g,
});

export const INGREDIENTS = [
  ing("Pechuga de pollo", "Proteína", 165, 31, 0, 3.6),
  ing("Atún en agua", "Proteína", 116, 26, 0, 1),
  ing("Yogur griego 0%", "Proteína", 59, 10, 3.6, 0.4),
  ing("Proteína en polvo", "Proteína", 400, 80, 8, 4),
  ing("Tofu firme", "Proteína", 145, 16, 3, 9),
  ing("Arroz blanco cocido", "Carbohidrato", 130, 2.7, 28, 0.3),
  ing("Avena", "Carbohidrato", 389, 16.9, 66, 6.9),
  ing("Papa cocida", "Carbohidrato", 87, 1.9, 20, 0.1),
  ing("Plátano", "Fruta", 89, 1.1, 23, 0.3),
  ing("Aceite de oliva", "Grasa", 884, 0, 0, 100),
  ing("Palta", "Grasa", 160, 2, 9, 15),
  ing("Almendras", "Grasa", 579, 21, 22, 50),
  ing("Brócoli", "Verdura", 34, 2.8, 7, 0.4),
  ing("Espinaca", "Verdura", 23, 2.9, 3.6, 0.4),
];

const byName = new Map(INGREDIENTS.map((i) => [i.name.toLowerCase(), i]));

/** Macros de `grams` gramos de un ingrediente del catálogo. */
export function macrosOf(name, grams) {
  const row = byName.get(name.toLowerCase());
  if (!row) throw new Error(`Ingrediente fuera del catálogo E2E: ${name}`);
  const k = grams / 100;
  return {
    kcal: row.kcal * k,
    p: row.protein_g * k,
    c: row.carbs_g * k,
    f: row.fat_g * k,
  };
}

/**
 * Construye las comidas de un día que cumplen exactamente las metas de macros,
 * resolviendo gramos de pollo/arroz/aceite por álgebra lineal:
 *   proteína = .31·pollo + .027·arroz
 *   carbos   = .28·arroz
 *   grasa    = .036·pollo + .003·arroz + 1.00·aceite
 * La kcal resultante queda dentro del ±15 % que exige validateGeneratedDay.
 */
export function buildMealsForTargets(target, slotIds) {
  const slots = slotIds.length ? slotIds : ["desayuno"];
  const per = {
    p: target.p / slots.length,
    c: target.c / slots.length,
    f: target.f / slots.length,
  };
  const arroz = per.c / 0.28;
  const pollo = Math.max(10, (per.p - 0.027 * arroz) / 0.31);
  const aceite = Math.max(0, per.f - 0.036 * pollo - 0.003 * arroz);
  const NAMES = [
    "Bowl de pollo con arroz al olivo",
    "Salteado de pollo y arroz",
    "Pollo dorado con arroz y oliva",
    "Arroz con pollo al toque de oliva",
    "Plato criollo de pollo y arroz",
    "Pollo a la plancha con arroz",
  ];
  return slots.map((slot_id, i) => {
    const ingredientes = [
      { nombre: "Pechuga de pollo", gramos: Math.round(pollo) },
      { nombre: "Arroz blanco cocido", gramos: Math.round(arroz) },
      { nombre: "Aceite de oliva", gramos: Math.round(aceite * 10) / 10 },
    ].filter((x) => x.gramos > 0);
    const tot = ingredientes.reduce(
      (acc, x) => {
        const m = macrosOf(x.nombre, x.gramos);
        return { kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f };
      },
      { kcal: 0, p: 0, c: 0, f: 0 },
    );
    return {
      slot_id,
      nombre: `${NAMES[i % NAMES.length]}`,
      ingredientes,
      kcal: Math.round(tot.kcal),
      proteina_g: Math.round(tot.p),
      carbohidratos_g: Math.round(tot.c),
      grasa_g: Math.round(tot.f),
    };
  });
}
