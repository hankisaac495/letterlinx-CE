"use client";

import { A, InfoPage } from "./InfoPage";

function Qa({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 open:ring-blue-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-bold text-slate-900 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none">
        {q}
        <span aria-hidden="true" className="text-blue-700 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-2 text-slate-700">{children}</div>
    </details>
  );
}

export function Faq() {
  return (
    <InfoPage
      content={{
        en: {
          title: "Frequently asked questions",
          body: (
            <div className="flex flex-col gap-3">
              <Qa q="Do students need accounts or email addresses?">
                <p>
                  No. Students join with the room code and tap their name (first name and last
                  initial), or use a Clever badge or ClassLink QuickCard.
                </p>
              </Qa>
              <Qa q="What devices does it work on?">
                <p>
                  Chromebooks, iPads, phones and laptops in a current browser, with touch or a
                  mouse. The projector view works best on a large screen in full-screen mode.
                </p>
              </Qa>
              <Qa q="Can students play on their own devices?">
                <p>
                  Yes. When the projector shows <strong>Live across devices</strong>, students can
                  join from anywhere with the code. If it shows <strong>This browser only</strong>,
                  rounds work between tabs of one browser (handy for a solo demo).
                </p>
              </Qa>
              <Qa q="How many words can a set have?">
                <p>
                  3 to 8 words, each 3–9 letters, with up to 45 letters in total so the 6 × 9 board
                  always has room. Letters only — no spaces, numbers or hyphens.
                </p>
              </Qa>
              <Qa q="Does it support Spanish?">
                <p>
                  Yes. Word sets can be in Spanish (Ñ is its own letter; accents are fine and
                  ignored for matching), and the whole interface can be switched to Spanish from the
                  banner.
                </p>
              </Qa>
              <Qa q="How is scoring calculated?">
                <p>
                  10 points per letter, plus a speed bonus of up to 50% for finding words earlier in
                  the round. Wrong guesses cost nothing. If hints are set to cost points, a word
                  found within 15 seconds of its hint scores half.
                </p>
              </Qa>
              <Qa q="Can I keep the projector from giving answers away?">
                <p>
                  Yes. In <strong>Hide the words</strong> and clue modes, the projector never shows
                  the target words until the round ends, and the feed just says a student “found a
                  word”. You can also hide names and the leaderboard at any time.
                </p>
              </Qa>
              <Qa q="Where is my data saved?">
                <p>
                  With an email account, your classes, word sets and reports are saved to your
                  account, so you can sign in from any computer. Demo sign-ins (Clever, Google
                  Classroom, ClassLink) keep data in the browser you’re using. See the{" "}
                  <A href="/privacy">privacy policy</A>.
                </p>
              </Qa>
              <Qa q="Are the Clever, Google Classroom and ClassLink sign-ins real?">
                <p>
                  Not yet. In this prototype they’re simulated with fictional schools and students
                  so you can try the full experience. Real connections are planned.
                </p>
              </Qa>
              <Qa q="Is there sound?">
                <p>
                  Yes — soft, game-show-style effects. Sound is off by default on student devices
                  and on for the projector; every screen has a mute button and the projector has a
                  volume slider.
                </p>
              </Qa>
              <Qa q="Is it accessible?">
                <p>
                  Found words use colour-blind-friendly colours plus numbered badges, animations
                  respect your device’s reduced-motion setting, teacher screens work with a
                  keyboard, and projector letters are sized to read from the back of the room.
                </p>
              </Qa>
              <Qa q="What if a word set includes an inappropriate word?">
                <p>
                  Word sets are checked against a basic profanity filter, and random filler letters
                  are re-drawn if they accidentally spell one.
                </p>
              </Qa>
            </div>
          ),
        },
        es: {
          title: "Preguntas frecuentes",
          body: (
            <div className="flex flex-col gap-3">
              <Qa q="¿Los estudiantes necesitan cuentas o correo electrónico?">
                <p>
                  No. Se unen con el código de sala y tocan su nombre (nombre e inicial del
                  apellido), o usan una credencial de Clever o una QuickCard de ClassLink.
                </p>
              </Qa>
              <Qa q="¿En qué dispositivos funciona?">
                <p>
                  Chromebooks, iPads, teléfonos y portátiles con un navegador actual, con pantalla
                  táctil o ratón. La vista del proyector funciona mejor en una pantalla grande y a
                  pantalla completa.
                </p>
              </Qa>
              <Qa q="¿Pueden jugar desde sus propios dispositivos?">
                <p>
                  Sí. Cuando el proyector muestra <strong>En vivo en todos los dispositivos</strong>
                  , pueden unirse desde cualquier lugar con el código. Si muestra{" "}
                  <strong>Solo este navegador</strong>, las rondas funcionan entre pestañas de un
                  mismo navegador (útil para una demostración).
                </p>
              </Qa>
              <Qa q="¿Cuántas palabras puede tener un conjunto?">
                <p>
                  De 3 a 8 palabras, de 3 a 9 letras cada una y hasta 45 letras en total, para que
                  el tablero de 6 × 9 siempre tenga espacio. Solo letras: sin espacios, números ni
                  guiones.
                </p>
              </Qa>
              <Qa q="¿Funciona en español?">
                <p>
                  Sí. Los conjuntos pueden estar en español (la Ñ es su propia letra; las tildes se
                  aceptan y se ignoran al comparar) y toda la interfaz puede cambiarse a español
                  desde la franja superior.
                </p>
              </Qa>
              <Qa q="¿Cómo se calculan los puntos?">
                <p>
                  10 puntos por letra, más un bono de velocidad de hasta el 50% por encontrar
                  palabras antes. Equivocarse no resta nada. Si las ayudas cuestan puntos, una
                  palabra encontrada en los 15 segundos siguientes a su ayuda vale la mitad.
                </p>
              </Qa>
              <Qa q="¿Puedo evitar que el proyector revele las respuestas?">
                <p>
                  Sí. En <strong>Ocultar las palabras</strong> y en modo pistas, el proyector no
                  muestra las palabras hasta el final y el registro solo dice que alguien “encontró
                  una palabra”. También puedes ocultar nombres y la clasificación en cualquier
                  momento.
                </p>
              </Qa>
              <Qa q="¿Dónde se guardan mis datos?">
                <p>
                  Con una cuenta de correo, tus clases, conjuntos e informes se guardan en tu cuenta
                  y puedes entrar desde cualquier computadora. Los inicios de sesión de demostración
                  (Clever, Google Classroom, ClassLink) guardan los datos en el navegador que usas.
                  Consulta la <A href="/privacy">política de privacidad</A>.
                </p>
              </Qa>
              <Qa q="¿Los inicios de sesión de Clever, Google Classroom y ClassLink son reales?">
                <p>
                  Todavía no. En este prototipo están simulados con escuelas y estudiantes ficticios
                  para que puedas probar toda la experiencia. Las conexiones reales están previstas.
                </p>
              </Qa>
              <Qa q="¿Tiene sonido?">
                <p>
                  Sí, efectos suaves al estilo de un concurso. El sonido está apagado por defecto en
                  los dispositivos de los estudiantes y encendido en el proyector; cada pantalla
                  tiene un botón para silenciar y el proyector tiene control de volumen.
                </p>
              </Qa>
              <Qa q="¿Es accesible?">
                <p>
                  Las palabras encontradas usan colores aptos para daltonismo y números, las
                  animaciones respetan la opción de movimiento reducido, las pantallas del docente
                  funcionan con teclado y las letras del proyector se leen desde el fondo del aula.
                </p>
              </Qa>
              <Qa q="¿Y si un conjunto incluye una palabra inapropiada?">
                <p>
                  Los conjuntos pasan por un filtro básico de groserías, y las letras de relleno se
                  cambian si por casualidad forman una.
                </p>
              </Qa>
            </div>
          ),
        },
      }}
    />
  );
}
