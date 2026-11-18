"use client";

import { A, InfoPage, List, Section } from "./InfoPage";

export function About() {
  return (
    <InfoPage
      content={{
        en: {
          title: "About LetterLinx Classroom Edition",
          lead: "A fast, friendly vocabulary game for the whole class. You choose the words; we hide them on a letter board; your students race to find them — live on the projector.",
          body: (
            <>
              <Section title="Built on LetterLinx">
                <p>
                  LetterLinx is a word game where players drag across neighbouring letter tiles —
                  up, down and diagonally — to spell words. The Classroom Edition turns that into a
                  shared, game-show-style round for any subject: science terms, history names,
                  spelling lists or English-language vocabulary.
                </p>
              </Section>
              <Section title="What teachers can do">
                <List
                  items={[
                    "Create word sets of 3–8 words, with optional clues, in English or Spanish.",
                    "Show the full list, one word at a time, or hide the words entirely (with optional hints).",
                    "Launch a live round with a room code; students join on any device.",
                    "Run it on the projector with a timer, leaderboard, team mode and an end-of-round reveal.",
                    "Review reports: who found which words, how fast, and which words to revisit.",
                  ]}
                />
              </Section>
              <Section title="Designed for classrooms">
                <List
                  items={[
                    "Works on Chromebooks, iPads, phones and laptops, with touch or mouse.",
                    "Students only need a room code and their first name — no student accounts.",
                    "English and Spanish interface, colour-blind-friendly highlights and reduced-motion support.",
                    "Sign in with Clever, Google Classroom or ClassLink, or create an account with email.",
                  ]}
                />
              </Section>
              <Section title="Prototype status">
                <p>
                  This site is a working prototype. Clever, Google Classroom and ClassLink sign-ins
                  are simulated with fictional demo data. See our{" "}
                  <A href="/privacy">privacy policy</A> for how data is handled, and{" "}
                  <A href="/how-to-play">how to play</A> to get started.
                </p>
              </Section>
            </>
          ),
        },
        es: {
          title: "Acerca de LetterLinx Classroom Edition",
          lead: "Un juego de vocabulario rápido y ameno para toda la clase. Tú eliges las palabras; las escondemos en un tablero de letras; tus estudiantes compiten para encontrarlas, en vivo en el proyector.",
          body: (
            <>
              <Section title="Basado en LetterLinx">
                <p>
                  LetterLinx es un juego de palabras en el que se arrastra por fichas de letras
                  vecinas (arriba, abajo y en diagonal) para formar palabras. La Edición para el
                  aula lo convierte en una ronda compartida, al estilo de un concurso, para
                  cualquier materia: ciencias, historia, listas de ortografía o vocabulario de
                  inglés como segunda lengua.
                </p>
              </Section>
              <Section title="Qué pueden hacer los docentes">
                <List
                  items={[
                    "Crear conjuntos de 3 a 8 palabras, con pistas opcionales, en inglés o en español.",
                    "Mostrar la lista completa, una palabra a la vez u ocultarlas (con ayudas opcionales).",
                    "Lanzar una ronda en vivo con un código de sala; los estudiantes se unen desde cualquier dispositivo.",
                    "Proyectarla con temporizador, clasificación, modo por equipos y una revelación final.",
                    "Consultar informes: quién encontró cada palabra, en cuánto tiempo y qué palabras repasar.",
                  ]}
                />
              </Section>
              <Section title="Pensado para el aula">
                <List
                  items={[
                    "Funciona en Chromebooks, iPads, teléfonos y portátiles, con pantalla táctil o ratón.",
                    "Los estudiantes solo necesitan un código y su nombre: no tienen cuentas.",
                    "Interfaz en inglés y español, colores aptos para daltonismo y opción de movimiento reducido.",
                    "Inicia sesión con Clever, Google Classroom o ClassLink, o crea una cuenta con tu correo.",
                  ]}
                />
              </Section>
              <Section title="Estado de prototipo">
                <p>
                  Este sitio es un prototipo funcional. Los inicios de sesión con Clever, Google
                  Classroom y ClassLink están simulados con datos ficticios. Consulta nuestra{" "}
                  <A href="/privacy">política de privacidad</A> y{" "}
                  <A href="/how-to-play">cómo jugar</A> para empezar.
                </p>
              </Section>
            </>
          ),
        },
      }}
    />
  );
}
