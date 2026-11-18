"use client";

import { CONTACT_EMAIL } from "./contact";
import { A, InfoPage, List, Section } from "./InfoPage";

const Mail = () => (
  <a
    href={`mailto:${CONTACT_EMAIL}`}
    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-lg font-extrabold text-white shadow-sm hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
    data-testid="contact-email"
  >
    ✉ {CONTACT_EMAIL}
  </a>
);

export function Contact() {
  return (
    <InfoPage
      content={{
        en: {
          title: "Contact us",
          lead: "Questions, ideas for your classroom, or something not working? We’d love to hear from you.",
          body: (
            <>
              <Mail />
              <Section title="To help us help you, include">
                <List
                  items={[
                    "What you were trying to do and what happened instead",
                    "The device and browser you were using (for example, Chromebook with Chrome)",
                    "The room code, if it was during a live round",
                  ]}
                />
                <p>
                  Please don’t include student names or other personal information about students in
                  your message.
                </p>
              </Section>
              <Section title="Privacy and data requests">
                <p>
                  To ask about your data, export it or delete your account, email us from the
                  address on your account. See the <A href="/privacy">privacy policy</A> for
                  details.
                </p>
              </Section>
              <Section title="Looking for help?">
                <p>
                  Many questions are answered in <A href="/how-to-play">How to play</A> and the{" "}
                  <A href="/faq">FAQ</A>.
                </p>
              </Section>
            </>
          ),
        },
        es: {
          title: "Contáctanos",
          lead: "¿Preguntas, ideas para tu aula o algo que no funciona? Nos encantará saber de ti.",
          body: (
            <>
              <Mail />
              <Section title="Para ayudarte mejor, incluye">
                <List
                  items={[
                    "Qué intentabas hacer y qué pasó",
                    "El dispositivo y el navegador que usabas (por ejemplo, Chromebook con Chrome)",
                    "El código de sala, si fue durante una ronda en vivo",
                  ]}
                />
                <p>
                  Por favor, no incluyas nombres ni otros datos personales de estudiantes en tu
                  mensaje.
                </p>
              </Section>
              <Section title="Privacidad y solicitudes sobre datos">
                <p>
                  Para preguntar por tus datos, exportarlos o eliminar tu cuenta, escríbenos desde
                  el correo de tu cuenta. Consulta la <A href="/privacy">política de privacidad</A>.
                </p>
              </Section>
              <Section title="¿Buscas ayuda?">
                <p>
                  Muchas respuestas están en <A href="/how-to-play">Cómo jugar</A> y en las{" "}
                  <A href="/faq">preguntas frecuentes</A>.
                </p>
              </Section>
            </>
          ),
        },
      }}
    />
  );
}
