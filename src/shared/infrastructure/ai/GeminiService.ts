const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export class GeminiService {
  /**
   * Generates content from the Gemini model.
   * Falls back to a local intelligent simulator if API key is not present.
   */
  static async chat(message: string, chatHistory: { role: 'user' | 'model'; parts: string }[] = []): Promise<string> {
    if (!GEMINI_API_KEY) {
      console.warn("⚠️ EXPO_PUBLIC_GEMINI_API_KEY no detectado. Usando PetGemini Simulator...");
      return this.simulateResponse(message);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: "Eres PetGemini, un asistente virtual experto en adopción de mascotas, razas, comportamiento animal y salud. Debes responder de forma empática, futurista, corta y amigable. Siempre promueve la adopción responsable." }]
              },
              ...chatHistory.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.parts }]
              })),
              {
                role: 'user',
                parts: [{ text: message }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error("Formato de respuesta inválido de Gemini API");
    } catch (e: any) {
      console.error("Error llamando a la API de Gemini, cayendo en Simulador:", e.message || e);
      return this.simulateResponse(message);
    }
  }

  private static simulateResponse(message: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const query = message.toLowerCase();
        let reply = "¡Hola! Soy PetGemini AI. Estoy aquí para guiarte en el viaje de la adopción responsable. 🐾 ¿De qué mascota te gustaría hablar hoy?";

        if (query.includes("apartamento") || query.includes("pequeño") || query.includes("piso")) {
          reply = "Para un apartamento o espacio reducido, te recomiendo razas pequeñas o medianas con energía moderada, como un Pug, un Poodle enano, o un gato común. Los felinos se adaptan de maravilla a los espacios verticales. ¿Te gustaría ver gatitos o perritos de este tipo en adopción? 🐱🐶";
        } else if (query.includes("gato") || query.includes("felino")) {
          reply = "Los gatos son maravillosos compañeros: independientes, limpios y extremadamente cariñosos a su manera. En PetAdopt tenemos gatos cachorros y adultos listos para darte su amor. ¿Buscas un compañero tranquilo o juguetón?";
        } else if (query.includes("perro") || query.includes("canino")) {
          reply = "¡Los perros son leales y llenos de vida! Recuerda considerar el tiempo de paseo diario y el espacio. Adoptar un perro rescatado transformará tu vida. ¿Te interesa un cachorro para entrenar o un adulto ya educado?";
        } else if (query.includes("introducir") || query.includes("juntar") || query.includes("socializar")) {
          reply = "Para socializar un perro y un gato, hazlo lentamente: 1) Manténlos en habitaciones separadas al principio. 2) Intercambia sus cobijas para que se acostumbren a sus olores. 3) Haz la presentación física con el perro con correa y dale premios por comportamiento tranquilo. ¡Paciencia es la clave! 🤝";
        } else if (query.includes("alimentar") || query.includes("comer") || query.includes("comida")) {
          reply = "La alimentación adecuada depende de la edad, tamaño y salud de tu mascota. Evita darle chocolate, cebolla, uvas o comida con condimentos humanos. ¿Tienes un cachorro o un adulto para sugerirte una dieta óptima?";
        } else if (query.includes("vacuna") || query.includes("veterinario") || query.includes("salud")) {
          reply = "La salud de tu mascota es primordial. Para perros, las vacunas clave son la quíntuple y la antirrábica. Para gatos, la triple felina. Siempre realiza chequeos cada 6 meses con tu veterinario de confianza. 🩺";
        } else if (query.includes("gracias") || query.includes("ok") || query.includes("hola")) {
          reply = "¡De nada! En PetAdopt queremos que tu experiencia sea mágica. ¿Deseas que te ayude a encontrar albergues cercanos o a analizar qué mascota se alinea mejor con tu estilo de vida? 🌟";
        } else if (query.includes("requisito") || query.includes("solicitud") || query.includes("adoptar")) {
          reply = "Adoptar es muy sencillo en PetAdopt: 1) Ve a la ficha de la mascota, 2) Toca en 'Iniciar Solicitud', 3) Chatea con el refugio y programa una visita. Debes ser mayor de edad, proveer un hogar seguro y tener mucho amor para dar.";
        }

        resolve(reply);
      }, 1000);
    });
  }
}
