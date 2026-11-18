"use client";

import { A, InfoPage, List, Section, Steps } from "./InfoPage";

export function HowToPlay() {
  return (
    <InfoPage
      content={{
        en: {
          title: "How to play",
          lead: "Rounds take a few minutes to set up and two to three minutes to play.",
          body: (
            <>
              <Section title="For students">
                <Steps
                  items={[
                    <>
                      Go to <strong>/join</strong> on this site (or scan your Clever badge or
                      ClassLink QuickCard).
                    </>,
                    "Type the 6-character room code shown on the projector, then tap your name.",
                    "When the countdown ends, find the hidden words: press on a letter and drag across neighbouring tiles — up, down, sideways or diagonally — then let go.",
                    "A word counts along any path that spells it. Tiles can be reused for different words.",
                    "Finding words sooner earns more points. Wrong guesses don’t cost anything.",
                  ]}
                />
              </Section>
              <Section title="For teachers">
                <Steps
                  items={[
                    <>
                      <strong>Sign in</strong> with Clever, Google Classroom or ClassLink, or create
                      an account with your email and add your classes.
                    </>,
                    <>
                      <strong>Create a word set:</strong> 3–8 words, 3–9 letters each, up to 45
                      letters in total. Add clues if you’d like to play in clue mode.
                    </>,
                    <>
                      <strong>Launch a round:</strong> pick a class and word set, choose how words
                      are shown, the timer and team mode, then <strong>Open projector</strong>.
                    </>,
                    "Put the projector screen up. Students join with the room code; their names pop in.",
                    <>
                      Press <strong>Start round</strong>. Use Pause, Hide names, Hide leaderboard or
                      End round at any time.
                    </>,
                    "When the round ends, the board reveals every word’s path. Open the report to see results.",
                  ]}
                />
              </Section>
              <Section title="Ways to show the words">
                <List
                  items={[
                    <>
                      <strong>Show the full list</strong> — every word appears above the board.
                    </>,
                    <>
                      <strong>Show one at a time</strong> — the next word appears once the current
                      one is found.
                    </>,
                    <>
                      <strong>Hide the words</strong> — students search on their own. You can allow
                      a limited number of hints, which flash a word’s tiles in order.
                    </>,
                    <>
                      <strong>Clue mode</strong> — shows your clue instead of the word until it’s
                      found.
                    </>,
                  ]}
                />
              </Section>
              <Section title="Scoring">
                <List
                  items={[
                    <>
                      <strong>10 points per letter.</strong> Longer words are worth more: CELL is 40
                      points, MEMBRANE is 80.
                    </>,
                    <>
                      <strong>Speed bonus of up to 50%.</strong> A word found right at the start
                      earns half its letter points again. The bonus shrinks steadily as the timer
                      runs down and is gone at the end (in untimed rounds it shrinks over the first
                      three minutes).
                    </>,
                    "No penalty for wrong guesses, and a word only scores the first time you find it.",
                    <>
                      <strong>Hints:</strong> if the teacher sets hints to cost points, a word found
                      within 15 seconds of its hint scores half.
                    </>,
                    "Ties on the leaderboard go to whoever found more words, then to whoever finished first.",
                  ]}
                />
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm">
                  <strong>Example:</strong> in a 2-minute round, a 6-letter word found after 1
                  minute scores 60 letter points + a 15-point speed bonus ={" "}
                  <strong>75 points</strong>.
                </p>
              </Section>
              <Section title="Team mode">
                <p>
                  Turn on <strong>Team mode</strong> on the launch screen and choose 2 to 6 teams to
                  make the round a team competition.
                </p>
                <List
                  items={[
                    "When you start the round, students are split evenly across the teams in the order they joined. Anyone who joins later goes to the smallest team.",
                    "Everyone plays and scores on their own device exactly as usual; each student sees which team they’re on.",
                    "The projector shows each team’s total score (the sum of its players’ scores) instead of individual names, and the end-of-round screen shows the final team standings.",
                    "Reports still show every student’s results, with their team.",
                  ]}
                />
              </Section>
              <Section title="Try it on your own">
                <p>
                  Use <A href="/play">a practice round</A> to play the student view, or open the
                  projector and press <strong>Simulate class</strong> to fill a round with pretend
                  students.
                </p>
              </Section>
            </>
          ),
        },
        es: {
          title: "Cómo jugar",
          lead: "Preparar una ronda toma unos minutos y jugarla, dos o tres.",
          body: (
            <>
              <Section title="Para estudiantes">
                <Steps
                  items={[
                    <>
                      Entra en <strong>/join</strong> en este sitio (o escanea tu credencial de
                      Clever o tu QuickCard de ClassLink).
                    </>,
                    "Escribe el código de 6 caracteres que aparece en el proyector y toca tu nombre.",
                    "Cuando termine la cuenta regresiva, busca las palabras: presiona una letra y arrastra por fichas vecinas (arriba, abajo, a los lados o en diagonal) y luego suelta.",
                    "Una palabra cuenta por cualquier camino que la forme. Puedes usar las mismas fichas para otras palabras.",
                    "Encontrar palabras antes da más puntos. Equivocarse no resta nada.",
                  ]}
                />
              </Section>
              <Section title="Para docentes">
                <Steps
                  items={[
                    <>
                      <strong>Inicia sesión</strong> con Clever, Google Classroom o ClassLink, o
                      crea una cuenta con tu correo y agrega tus clases.
                    </>,
                    <>
                      <strong>Crea un conjunto de palabras:</strong> de 3 a 8 palabras, de 3 a 9
                      letras cada una y hasta 45 letras en total. Agrega pistas si quieres jugar en
                      modo pistas.
                    </>,
                    <>
                      <strong>Lanza una ronda:</strong> elige clase y conjunto, cómo se muestran las
                      palabras, el temporizador y el modo por equipos, y luego{" "}
                      <strong>Abrir proyector</strong>.
                    </>,
                    "Proyecta la pantalla. Los estudiantes se unen con el código y sus nombres van apareciendo.",
                    <>
                      Pulsa <strong>Empezar ronda</strong>. Puedes pausar, ocultar nombres, ocultar
                      la clasificación o terminar la ronda en cualquier momento.
                    </>,
                    "Al terminar, el tablero revela el camino de cada palabra. Abre el informe para ver los resultados.",
                  ]}
                />
              </Section>
              <Section title="Formas de mostrar las palabras">
                <List
                  items={[
                    <>
                      <strong>Mostrar la lista completa</strong>: todas las palabras aparecen sobre
                      el tablero.
                    </>,
                    <>
                      <strong>Mostrar una a la vez</strong>: la siguiente aparece al encontrar la
                      actual.
                    </>,
                    <>
                      <strong>Ocultar las palabras</strong>: los estudiantes buscan por su cuenta.
                      Puedes permitir algunas ayudas, que iluminan las fichas de una palabra en
                      orden.
                    </>,
                    <>
                      <strong>Modo pistas</strong>: muestra tu pista en lugar de la palabra hasta
                      que se encuentre.
                    </>,
                  ]}
                />
              </Section>
              <Section title="Puntuación">
                <List
                  items={[
                    <>
                      <strong>10 puntos por letra.</strong> Las palabras largas valen más: CELL vale
                      40 puntos y MEMBRANE, 80.
                    </>,
                    <>
                      <strong>Bono de velocidad de hasta el 50%.</strong> Una palabra encontrada
                      justo al principio gana la mitad de sus puntos otra vez. El bono baja poco a
                      poco mientras corre el tiempo y desaparece al final (en rondas sin tiempo,
                      baja durante los tres primeros minutos).
                    </>,
                    "Equivocarse no resta puntos, y cada palabra solo puntúa la primera vez que la encuentras.",
                    <>
                      <strong>Ayudas:</strong> si el docente configura las ayudas con costo, una
                      palabra encontrada en los 15 segundos siguientes a su ayuda vale la mitad.
                    </>,
                    "Los empates en la clasificación se deciden por quién encontró más palabras y, después, por quién terminó primero.",
                  ]}
                />
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm">
                  <strong>Ejemplo:</strong> en una ronda de 2 minutos, una palabra de 6 letras
                  encontrada al minuto vale 60 puntos por letras + 15 de bono ={" "}
                  <strong>75 puntos</strong>.
                </p>
              </Section>
              <Section title="Modo por equipos">
                <p>
                  Activa el <strong>Modo por equipos</strong> en la pantalla de lanzamiento y elige
                  de 2 a 6 equipos para convertir la ronda en una competencia entre equipos.
                </p>
                <List
                  items={[
                    "Al empezar la ronda, los estudiantes se reparten en partes iguales entre los equipos según el orden en que se unieron. Quien se une más tarde va al equipo más pequeño.",
                    "Cada uno juega y suma puntos en su propio dispositivo como siempre, y ve en qué equipo está.",
                    "El proyector muestra el total de cada equipo (la suma de los puntos de sus integrantes) en lugar de nombres, y la pantalla final muestra la clasificación por equipos.",
                    "Los informes siguen mostrando los resultados de cada estudiante, con su equipo.",
                  ]}
                />
              </Section>
              <Section title="Pruébalo por tu cuenta">
                <p>
                  Usa <A href="/play">una ronda de práctica</A> para jugar la vista del estudiante,
                  o abre el proyector y pulsa <strong>Simular clase</strong> para llenar una ronda
                  con estudiantes ficticios.
                </p>
              </Section>
            </>
          ),
        },
      }}
    />
  );
}
