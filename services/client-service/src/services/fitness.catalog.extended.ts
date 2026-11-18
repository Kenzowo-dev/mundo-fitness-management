import type { CatalogExercise } from "./fitness.catalog.js";

// Ejercicios adicionales para ampliar la personalización.
// Mantener identificadores estables para los planes ya generados.
export const FITNESS_ADDITIONAL_EXERCISES: CatalogExercise[] = [
    {
        "id":  "reverse-lunge",
        "name":  "Zancada hacia atrás",
        "category":  "strength",
        "muscleGroups":  [
                             "quadriceps",
                             "glutes"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Trabaja piernas y estabilidad mediante un paso hacia atrás.",
        "instructions":  [
                             "Da un paso corto hacia atrás",
                             "Flexiona ambas rodillas dentro de un rango cómodo",
                             "Empuja con la pierna delantera para volver",
                             "Alterna las piernas"
                         ],
        "alternatives":  [
                             "bodyweight-squat"
                         ]
    },
    {
        "id":  "calf-raise",
        "name":  "Elevación de talones",
        "category":  "strength",
        "muscleGroups":  [
                             "calves"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Fortalece las pantorrillas de forma controlada.",
        "instructions":  [
                             "Colócate de pie cerca de un apoyo firme",
                             "Eleva lentamente los talones",
                             "Mantén el equilibrio sin impulsarte",
                             "Desciende de forma controlada"
                         ],
        "alternatives":  [

                         ]
    },
    {
        "id":  "hip-hinge",
        "name":  "Bisagra de cadera",
        "category":  "strength",
        "muscleGroups":  [
                             "hamstrings",
                             "glutes"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Practica el movimiento de cadera para trabajar la cadena posterior.",
        "instructions":  [
                             "Coloca los pies al ancho de las caderas",
                             "Lleva la cadera hacia atrás manteniendo la espalda estable",
                             "Flexiona ligeramente las rodillas",
                             "Vuelve a ponerte erguido sin movimientos bruscos"
                         ],
        "alternatives":  [
                             "dumbbell-romanian-deadlift"
                         ]
    },
    {
        "id":  "dumbbell-romanian-deadlift",
        "name":  "Peso muerto rumano con mancuernas",
        "category":  "strength",
        "muscleGroups":  [
                             "hamstrings",
                             "glutes"
                         ],
        "equipment":  [
                          "dumbbells"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio de fuerza para glúteos y parte posterior de las piernas.",
        "instructions":  [
                             "Sostén las mancuernas cerca de los muslos",
                             "Lleva la cadera hacia atrás manteniendo la espalda estable",
                             "Desciende las mancuernas cerca de las piernas",
                             "Regresa de forma controlada"
                         ],
        "alternatives":  [
                             "hip-hinge"
                         ]
    },
    {
        "id":  "dumbbell-curl",
        "name":  "Curl de bíceps con mancuernas",
        "category":  "strength",
        "muscleGroups":  [
                             "biceps"
                         ],
        "equipment":  [
                          "dumbbells"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Fortalece los bíceps mediante una flexión controlada de los codos.",
        "instructions":  [
                             "Sujeta las mancuernas a los lados",
                             "Mantén los codos próximos al cuerpo",
                             "Flexiona los brazos sin balancear el tronco",
                             "Desciende lentamente"
                         ],
        "alternatives":  [

                         ]
    },
    {
        "id":  "dumbbell-floor-press",
        "name":  "Press de pecho en el suelo",
        "category":  "strength",
        "muscleGroups":  [
                             "chest",
                             "triceps"
                         ],
        "equipment":  [
                          "dumbbells"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Fortalece pecho y tríceps usando mancuernas y un recorrido limitado.",
        "instructions":  [
                             "Recuéstate boca arriba con las rodillas flexionadas",
                             "Sujeta las mancuernas con los codos cerca del suelo",
                             "Empuja hacia arriba sin chocar las mancuernas",
                             "Desciende lentamente hasta un rango cómodo"
                         ],
        "alternatives":  [
                             "wall-pushup",
                             "pushup"
                         ]
    },
    {
        "id":  "dumbbell-goblet-squat",
        "name":  "Sentadilla goblet",
        "category":  "strength",
        "muscleGroups":  [
                             "quadriceps",
                             "glutes"
                         ],
        "equipment":  [
                          "dumbbells"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Variante de sentadilla con una mancuerna frente al pecho.",
        "instructions":  [
                             "Sostén una mancuerna cerca del pecho",
                             "Separa los pies a una distancia cómoda",
                             "Flexiona caderas y rodillas manteniendo el control",
                             "Regresa a la posición inicial"
                         ],
        "alternatives":  [
                             "bodyweight-squat"
                         ]
    },
    {
        "id":  "seated-knee-extension",
        "name":  "Extensión de rodilla sentado",
        "category":  "strength",
        "muscleGroups":  [
                             "quadriceps"
                         ],
        "equipment":  [
                          "chair"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio sencillo para activar los músculos delanteros del muslo.",
        "instructions":  [
                             "Siéntate en una silla estable",
                             "Extiende lentamente una rodilla sin forzarla",
                             "Baja la pierna de manera controlada",
                             "Alterna las piernas"
                         ],
        "alternatives":  [
                             "chair-squat"
                         ]
    },
    {
        "id":  "dead-bug",
        "name":  "Dead bug",
        "category":  "strength",
        "muscleGroups":  [
                             "core"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Entrena la estabilidad del abdomen y la coordinación.",
        "instructions":  [
                             "Recuéstate boca arriba con brazos y rodillas elevados",
                             "Mantén el abdomen activo sin arquear la espalda",
                             "Extiende lentamente un brazo y la pierna contraria",
                             "Regresa y alterna los lados"
                         ],
        "alternatives":  [
                             "bird-dog"
                         ]
    },
    {
        "id":  "forearm-plank-knees",
        "name":  "Plancha con rodillas apoyadas",
        "category":  "strength",
        "muscleGroups":  [
                             "core"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate"
                   ],
        "lowImpact":  true,
        "description":  "Variante accesible de plancha para fortalecer el tronco.",
        "instructions":  [
                             "Apoya antebrazos y rodillas sobre una superficie firme",
                             "Mantén el cuerpo alineado desde hombros hasta rodillas",
                             "Respira de forma continua",
                             "Descansa si pierdes la postura"
                         ],
        "alternatives":  [
                             "dead-bug"
                         ]
    },
    {
        "id":  "forearm-plank",
        "name":  "Plancha de antebrazos",
        "category":  "strength",
        "muscleGroups":  [
                             "core"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio de estabilidad abdominal sin desplazamiento.",
        "instructions":  [
                             "Apoya los antebrazos y las puntas de los pies",
                             "Mantén el cuerpo alineado",
                             "Evita hundir o elevar excesivamente la cadera",
                             "Respira normalmente durante el esfuerzo"
                         ],
        "alternatives":  [
                             "forearm-plank-knees"
                         ]
    },
    {
        "id":  "chest-press-machine",
        "name":  "Press de pecho en máquina",
        "category":  "strength",
        "muscleGroups":  [
                             "chest",
                             "triceps"
                         ],
        "equipment":  [
                          "machines"
                      ],
        "locations":  [
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Trabajo de pecho mediante una máquina guiada.",
        "instructions":  [
                             "Ajusta el asiento y selecciona una carga cómoda",
                             "Coloca las manos en las empuñaduras",
                             "Empuja sin bloquear bruscamente los codos",
                             "Regresa lentamente"
                         ],
        "alternatives":  [
                             "dumbbell-floor-press",
                             "pushup"
                         ]
    },
    {
        "id":  "seated-row-machine",
        "name":  "Remo sentado en máquina",
        "category":  "strength",
        "muscleGroups":  [
                             "back",
                             "biceps"
                         ],
        "equipment":  [
                          "machines"
                      ],
        "locations":  [
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Fortalece espalda y brazos con una máquina de remo.",
        "instructions":  [
                             "Ajusta el asiento y selecciona una carga manejable",
                             "Mantén el pecho erguido",
                             "Lleva las empuñaduras hacia el torso",
                             "Regresa lentamente sin perder el control"
                         ],
        "alternatives":  [
                             "dumbbell-row"
                         ]
    },
    {
        "id":  "leg-curl-machine",
        "name":  "Curl femoral en máquina",
        "category":  "strength",
        "muscleGroups":  [
                             "hamstrings"
                         ],
        "equipment":  [
                          "machines"
                      ],
        "locations":  [
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio guiado para fortalecer la parte posterior de los muslos.",
        "instructions":  [
                             "Ajusta la máquina a tu estatura",
                             "Selecciona una carga ligera para comenzar",
                             "Flexiona las rodillas sin movimientos bruscos",
                             "Regresa lentamente"
                         ],
        "alternatives":  [
                             "hip-hinge"
                         ]
    },
    {
        "id":  "leg-extension-machine",
        "name":  "Extensión de piernas en máquina",
        "category":  "strength",
        "muscleGroups":  [
                             "quadriceps"
                         ],
        "equipment":  [
                          "machines"
                      ],
        "locations":  [
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio guiado para los cuádriceps.",
        "instructions":  [
                             "Ajusta el respaldo y el apoyo de piernas",
                             "Selecciona una carga apropiada",
                             "Extiende las rodillas sin bloquearlas bruscamente",
                             "Regresa lentamente"
                         ],
        "alternatives":  [
                             "seated-knee-extension"
                         ]
    },
    {
        "id":  "dumbbell-lateral-raise",
        "name":  "Elevación lateral con mancuernas",
        "category":  "strength",
        "muscleGroups":  [
                             "shoulders"
                         ],
        "equipment":  [
                          "dumbbells"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Fortalece los hombros con movimientos laterales controlados.",
        "instructions":  [
                             "Sostén mancuernas ligeras a los lados",
                             "Mantén los codos ligeramente flexionados",
                             "Eleva los brazos hasta un rango cómodo",
                             "Desciende lentamente"
                         ],
        "alternatives":  [
                             "dumbbell-press"
                         ]
    },
    {
        "id":  "march-in-place",
        "name":  "Marcha en el sitio",
        "category":  "cardio",
        "muscleGroups":  [
                             "legs",
                             "cardiovascular"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Actividad cardiovascular sin necesidad de desplazarse.",
        "instructions":  [
                             "Colócate de pie con espacio libre alrededor",
                             "Alterna la elevación suave de las rodillas",
                             "Mantén un ritmo que permita respirar cómodamente",
                             "Reduce la velocidad de manera gradual"
                         ],
        "alternatives":  [
                             "walking"
                         ]
    },
    {
        "id":  "side-step-cardio",
        "name":  "Pasos laterales",
        "category":  "cardio",
        "muscleGroups":  [
                             "legs",
                             "cardiovascular"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Actividad cardiovascular de bajo impacto con desplazamientos laterales.",
        "instructions":  [
                             "Da un paso lateral corto",
                             "Acerca el otro pie sin saltar",
                             "Alterna ambos sentidos",
                             "Mantén un ritmo estable y cómodo"
                         ],
        "alternatives":  [
                             "walking",
                             "march-in-place"
                         ]
    },
    {
        "id":  "low-impact-jacks",
        "name":  "Jumping jacks sin salto",
        "category":  "cardio",
        "muscleGroups":  [
                             "legs",
                             "cardiovascular"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Variante cardiovascular sin saltos de apertura y cierre.",
        "instructions":  [
                             "Separa una pierna hacia un lado mientras elevas los brazos",
                             "Regresa al centro sin saltar",
                             "Repite alternando las piernas",
                             "Mantén un ritmo controlado"
                         ],
        "alternatives":  [
                             "march-in-place"
                         ]
    },
    {
        "id":  "shadow-boxing",
        "name":  "Boxeo de sombra suave",
        "category":  "cardio",
        "muscleGroups":  [
                             "shoulders",
                             "cardiovascular"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Movimiento cardiovascular suave de brazos y pasos cortos.",
        "instructions":  [
                             "Adopta una posición estable",
                             "Extiende los brazos al frente de manera alternada",
                             "Evita hiperextender los codos",
                             "Acompaña con pasos cortos y controlados"
                         ],
        "alternatives":  [
                             "march-in-place"
                         ]
    },
    {
        "id":  "seated-march",
        "name":  "Marcha sentado",
        "category":  "cardio",
        "muscleGroups":  [
                             "legs",
                             "cardiovascular"
                         ],
        "equipment":  [
                          "chair"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate"
                   ],
        "lowImpact":  true,
        "description":  "Actividad cardiovascular suave realizada en una silla estable.",
        "instructions":  [
                             "Siéntate con la espalda erguida y los pies apoyados",
                             "Eleva una rodilla suavemente",
                             "Baja el pie y alterna de lado",
                             "Mantén una respiración cómoda"
                         ],
        "alternatives":  [
                             "march-in-place"
                         ]
    },
    {
        "id":  "cat-cow",
        "name":  "Movilidad gato-vaca",
        "category":  "mobility",
        "muscleGroups":  [
                             "back",
                             "core"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Moviliza suavemente la columna desde cuatro apoyos.",
        "instructions":  [
                             "Colócate sobre manos y rodillas",
                             "Redondea suavemente la espalda dentro de un rango cómodo",
                             "Invierte el movimiento sin forzar la columna",
                             "Repite despacio acompañando la respiración"
                         ],
        "alternatives":  [
                             "bird-dog"
                         ]
    },
    {
        "id":  "thoracic-rotation",
        "name":  "Rotación torácica en cuatro apoyos",
        "category":  "mobility",
        "muscleGroups":  [
                             "back",
                             "shoulders"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Favorece la movilidad de la parte superior de la espalda.",
        "instructions":  [
                             "Colócate en cuatro apoyos",
                             "Lleva una mano hacia la parte posterior de la cabeza",
                             "Gira suavemente el tronco sin forzar el cuello",
                             "Regresa y alterna los lados"
                         ],
        "alternatives":  [
                             "cat-cow"
                         ]
    },
    {
        "id":  "ankle-rocks",
        "name":  "Movilidad de tobillos",
        "category":  "mobility",
        "muscleGroups":  [
                             "ankles"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Moviliza los tobillos con un movimiento controlado.",
        "instructions":  [
                             "Colócate de pie frente a una pared",
                             "Apoya las manos para mantener el equilibrio",
                             "Desplaza suavemente una rodilla hacia delante sin levantar el talón",
                             "Regresa y cambia de pierna"
                         ],
        "alternatives":  [
                             "calf-raise"
                         ]
    },
    {
        "id":  "wall-slides",
        "name":  "Deslizamientos de brazos en pared",
        "category":  "mobility",
        "muscleGroups":  [
                             "shoulders"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio suave de movilidad para hombros y parte superior de la espalda.",
        "instructions":  [
                             "Colócate de espaldas cerca de una pared",
                             "Apoya los brazos en una posición cómoda",
                             "Deslízalos lentamente hacia arriba sin forzar",
                             "Regresa de manera controlada"
                         ],
        "alternatives":  [

                         ]
    },
    {
        "id":  "hip-circles",
        "name":  "Círculos suaves de cadera",
        "category":  "mobility",
        "muscleGroups":  [
                             "hips"
                         ],
        "equipment":  [

                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate",
                       "advanced"
                   ],
        "lowImpact":  true,
        "description":  "Movilidad general de cadera mediante círculos pequeños.",
        "instructions":  [
                             "Colócate de pie cerca de un apoyo estable",
                             "Realiza círculos pequeños con la cadera",
                             "Mantén el tronco controlado",
                             "Cambia el sentido del movimiento"
                         ],
        "alternatives":  [

                         ]
    },
    {
        "id":  "seated-torso-rotation",
        "name":  "Rotación de tronco sentado",
        "category":  "mobility",
        "muscleGroups":  [
                             "back",
                             "core"
                         ],
        "equipment":  [
                          "chair"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate"
                   ],
        "lowImpact":  true,
        "description":  "Ejercicio de movilidad suave en una silla estable.",
        "instructions":  [
                             "Siéntate con ambos pies apoyados",
                             "Gira lentamente el tronco hacia un lado",
                             "Evita impulsarte con los brazos",
                             "Regresa al centro y alterna lados"
                         ],
        "alternatives":  [
                             "thoracic-rotation"
                         ]
    },
    {
        "id":  "seated-shoulder-press",
        "name":  "Press de hombros sentado",
        "category":  "strength",
        "muscleGroups":  [
                             "shoulders",
                             "triceps"
                         ],
        "equipment":  [
                          "dumbbells",
                          "chair"
                      ],
        "locations":  [
                          "home",
                          "gym"
                      ],
        "levels":  [
                       "beginner",
                       "intermediate"
                   ],
        "lowImpact":  true,
        "description":  "Variante sentada de press de hombros con mancuernas.",
        "instructions":  [
                             "Siéntate en una silla estable con respaldo adecuado",
                             "Coloca las mancuernas ligeras cerca de los hombros",
                             "Empuja hacia arriba en un recorrido cómodo",
                             "Desciende lentamente sin arquear la espalda"
                         ],
        "alternatives":  [
                             "dumbbell-press"
                         ]
    }
];
