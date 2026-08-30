// scan.baml — vision analysis contract

class FoodItem {
  name string
  grams float
  kcal int
  p float
  f float
  h float
}

class MealAnalysis {
  plato string
  confidence "alta" | "media" | "baja"
  kcal_total int
  proteinas_total_g float
  grasas_total_g float
  hidratos_total_g float
  items FoodItem[]
}

function AnalyzeMeal(image: image, meal_context: string?) -> MealAnalysis {
  client "openai-generic/MiniMax"
  prompt #"
    Eres un nutricionista profesional. Analiza la foto de comida y devuelve EXCLUSIVAMENTE JSON valido con esta forma exacta:
    {
      "plato": string corto (≤80 chars),
      "confidence": "alta" | "media" | "baja",
      "kcal_total": integer,
      "proteinas_total_g": number,
      "grasas_total_g": number,
      "hidratos_total_g": number,
      "items": [
        { "name": string, "grams": number, "kcal": integer, "p": number, "f": number, "h": number }
      ]
    }
    Contexto del momento del dia: {% if meal_context %}{{ meal_context }}{% else %}no especificado{% endif %}.

    Reglas:
    - Si ves comida empaquetada con etiqueta visible, lee los macros de la etiqueta.
    - Estima cantidades razonables; si dudas, marca confidence='baja'.
    - Suma de items debe coincidir aproximadamente con kcal_total / macros_total.
    - No anadas texto fuera del JSON.
  "#
}
