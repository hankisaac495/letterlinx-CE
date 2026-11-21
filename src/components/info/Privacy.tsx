"use client";

import { CONTACT_EMAIL } from "./contact";
import { InfoPage, List, Section } from "./InfoPage";

const mail = (
  <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
    {CONTACT_EMAIL}
  </a>
);

function DraftNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200"
      role="note"
    >
      {children}
    </p>
  );
}

/**
 * Describes what the prototype actually collects and stores. Kept deliberately factual;
 * it makes no legal-compliance claims and should be reviewed by counsel before wider use.
 */
export function Privacy() {
  return (
    <InfoPage
      content={{
        en: {
          title: "Privacy policy",
          updated: "Last updated: November 18, 2026",
          body: (
            <>
              <DraftNotice>
                LetterLinx Classroom Edition is a prototype, and this policy is a draft pending
                legal review. It describes how the prototype handles information today.
              </DraftNotice>
              <Section title="Our approach">
                <p>
                  We collect as little as we can: enough for teachers to run rounds and see results.
                  Students don’t create accounts and never give us an email address or password. We
                  don’t show ads, sell data, or use analytics or tracking tools.
                </p>
              </Section>
              <Section title="Information about teachers">
                <List
                  items={[
                    <>
                      <strong>Email accounts:</strong> your email address, name and optional title.
                      Passwords are handled by our sign-in provider and stored only in hashed form;
                      we never see them.
                    </>,
                    <>
                      <strong>Classes you enter:</strong> class name, period, grade, subject, and
                      your students’ first names and last initials.
                    </>,
                    <>
                      <strong>Word sets</strong> you create, and <strong>round results</strong> (see
                      below).
                    </>,
                    <>
                      <strong>Clever, Google Classroom and ClassLink sign-ins</strong> are currently
                      simulated with fictional demo data. No real accounts or rosters are accessed.
                    </>,
                  ]}
                />
              </Section>
              <Section title="Information about students">
                <List
                  items={[
                    "Students are identified only by first name and last initial — chosen from their class list or typed in.",
                    "During a round we process each student’s progress: words found, when they were found, hints used and score.",
                    "This progress is shown to the class on the projector (teachers can hide names) and saved in the teacher’s reports.",
                    "We don’t collect student emails, passwords, photos, locations or contact details.",
                  ]}
                />
              </Section>
              <Section title="How we use information">
                <List
                  items={[
                    "To run live rounds: connecting student devices to the projector and keeping scores.",
                    "To save teachers’ classes, word sets and reports so they’re available when they sign in.",
                    "To send account emails, such as confirming your address or resetting your password.",
                  ]}
                />
                <p>
                  We don’t use student information for advertising, profiling, or any purpose other
                  than running the game for their teacher.
                </p>
              </Section>
              <Section title="Where information is stored">
                <List
                  items={[
                    <>
                      <strong>Supabase</strong> provides sign-in, the database for email accounts,
                      and real-time messaging between devices during rounds. Each teacher’s records
                      are protected so only that teacher’s account can read or change them.
                    </>,
                    <>
                      <strong>Vercel</strong> hosts the website. Like most web hosts, it keeps
                      standard server logs (such as IP addresses and browser type) for security and
                      reliability.
                    </>,
                    <>
                      <strong>Your browser</strong> stores preferences (language, sound) and a
                      working copy of your data. Demo sign-ins and browser-only accounts are stored
                      only in that browser.
                    </>,
                  ]}
                />
                <p>Information is sent over encrypted connections (HTTPS).</p>
              </Section>
              <Section title="Cookies and local storage">
                <p>
                  We use your browser’s local storage only to make the app work: keeping you signed
                  in, remembering your language and sound settings, and saving your work. While the
                  site is a prototype, one cookie remembers that you entered the demo password. We
                  don’t use advertising or tracking cookies.
                </p>
              </Section>
              <Section title="Keeping and deleting information">
                <List
                  items={[
                    "Teachers can edit or delete classes and word sets at any time.",
                    "Information stays in your account until you delete it or ask us to delete your account.",
                    <>
                      To delete your account and all its data, or to get a copy of it, email {mail}{" "}
                      from your account’s address.
                    </>,
                    "Data stored only in a browser can be removed by clearing that browser’s site data.",
                  ]}
                />
              </Section>
              <Section title="Schools and children">
                <p>
                  LetterLinx Classroom Edition is meant to be used by students under a teacher’s
                  direction. Teachers and schools decide which students take part and are
                  responsible for using the service in line with their school’s policies. If you
                  believe a student’s information was shared with us inappropriately, contact us and
                  we’ll delete it.
                </p>
              </Section>
              <Section title="Changes">
                <p>
                  If we change this policy, we’ll update the date above and, for significant
                  changes, let account holders know.
                </p>
              </Section>
              <Section title="Contact">
                <p>Questions or requests: {mail}</p>
              </Section>
            </>
          ),
        },
        es: {
          title: "Política de privacidad",
          updated: "Última actualización: 18 de noviembre de 2026",
          body: (
            <>
              <DraftNotice>
                LetterLinx Classroom Edition es un prototipo y esta política es un borrador
                pendiente de revisión legal. Describe cómo el prototipo trata la información
                actualmente.
              </DraftNotice>
              <Section title="Nuestro enfoque">
                <p>
                  Recopilamos lo mínimo: lo necesario para que los docentes dirijan rondas y vean
                  resultados. Los estudiantes no crean cuentas y nunca nos dan un correo ni una
                  contraseña. No mostramos anuncios, no vendemos datos ni usamos herramientas de
                  analítica o rastreo.
                </p>
              </Section>
              <Section title="Información sobre docentes">
                <List
                  items={[
                    <>
                      <strong>Cuentas de correo:</strong> tu correo, nombre y trato opcional. Las
                      contraseñas las gestiona nuestro proveedor de inicio de sesión y solo se
                      guardan cifradas; nunca las vemos.
                    </>,
                    <>
                      <strong>Clases que escribes:</strong> nombre de la clase, periodo, grado,
                      materia, y el nombre e inicial del apellido de tus estudiantes.
                    </>,
                    <>
                      <strong>Conjuntos de palabras</strong> que creas y{" "}
                      <strong>resultados de rondas</strong> (ver abajo).
                    </>,
                    <>
                      <strong>
                        Los inicios de sesión con Clever, Google Classroom y ClassLink
                      </strong>{" "}
                      están simulados con datos ficticios. No se accede a cuentas ni listas reales.
                    </>,
                  ]}
                />
              </Section>
              <Section title="Información sobre estudiantes">
                <List
                  items={[
                    "Los estudiantes se identifican solo con su nombre y la inicial del apellido, elegidos de la lista de su clase o escritos.",
                    "Durante una ronda tratamos el progreso de cada estudiante: palabras encontradas, cuándo, ayudas usadas y puntos.",
                    "Ese progreso se muestra a la clase en el proyector (el docente puede ocultar los nombres) y se guarda en los informes del docente.",
                    "No recopilamos correos, contraseñas, fotos, ubicación ni datos de contacto de estudiantes.",
                  ]}
                />
              </Section>
              <Section title="Cómo usamos la información">
                <List
                  items={[
                    "Para dirigir rondas en vivo: conectar los dispositivos con el proyector y llevar los puntos.",
                    "Para guardar las clases, conjuntos e informes del docente y que estén disponibles al iniciar sesión.",
                    "Para enviar correos de la cuenta, como confirmar tu dirección o restablecer tu contraseña.",
                  ]}
                />
                <p>
                  No usamos información de estudiantes para publicidad, perfiles ni ningún fin
                  distinto de dirigir el juego para su docente.
                </p>
              </Section>
              <Section title="Dónde se guarda la información">
                <List
                  items={[
                    <>
                      <strong>Supabase</strong> ofrece el inicio de sesión, la base de datos de las
                      cuentas de correo y la mensajería en tiempo real entre dispositivos durante
                      las rondas. Los registros de cada docente están protegidos para que solo su
                      cuenta pueda leerlos o cambiarlos.
                    </>,
                    <>
                      <strong>Vercel</strong> aloja el sitio web. Como la mayoría de los servicios
                      de alojamiento, guarda registros estándar del servidor (como direcciones IP y
                      tipo de navegador) por seguridad y fiabilidad.
                    </>,
                    <>
                      <strong>Tu navegador</strong> guarda preferencias (idioma, sonido) y una copia
                      de trabajo de tus datos. Los inicios de sesión de demostración y las cuentas
                      solo locales se guardan únicamente en ese navegador.
                    </>,
                  ]}
                />
                <p>La información viaja por conexiones cifradas (HTTPS).</p>
              </Section>
              <Section title="Cookies y almacenamiento local">
                <p>
                  Usamos el almacenamiento local del navegador solo para que la aplicación funcione:
                  mantener tu sesión, recordar el idioma y el sonido, y guardar tu trabajo. Mientras
                  el sitio sea un prototipo, una cookie recuerda que escribiste la contraseña de
                  demostración. No usamos cookies de publicidad ni de rastreo.
                </p>
              </Section>
              <Section title="Conservación y eliminación">
                <List
                  items={[
                    "Los docentes pueden editar o eliminar clases y conjuntos en cualquier momento.",
                    "La información permanece en tu cuenta hasta que la elimines o nos pidas eliminar tu cuenta.",
                    <>
                      Para eliminar tu cuenta y todos sus datos, u obtener una copia, escribe a{" "}
                      {mail} desde el correo de tu cuenta.
                    </>,
                    "Los datos guardados solo en un navegador se eliminan borrando los datos del sitio en ese navegador.",
                  ]}
                />
              </Section>
              <Section title="Escuelas y menores">
                <p>
                  LetterLinx Classroom Edition está pensado para que los estudiantes lo usen bajo la
                  dirección de un docente. Los docentes y las escuelas deciden qué estudiantes
                  participan y son responsables de usar el servicio conforme a las políticas de su
                  escuela. Si crees que se compartió información de un estudiante de forma
                  inapropiada, contáctanos y la eliminaremos.
                </p>
              </Section>
              <Section title="Cambios">
                <p>
                  Si cambiamos esta política, actualizaremos la fecha de arriba y, si los cambios
                  son importantes, avisaremos a los titulares de cuentas.
                </p>
              </Section>
              <Section title="Contacto">
                <p>Preguntas o solicitudes: {mail}</p>
              </Section>
            </>
          ),
        },
      }}
    />
  );
}
