"use client";

import { useSyncExternalStore } from "react";
import { club } from "@/content/club";
import { teams } from "@/content/teams";
import { InquiryForm, type Field } from "./inquiry-form";

const noop = () => () => {};

const teamOptions = [
  ...teams.map((t) => ({ value: t.slug, label: `${t.shortName}${t.competition ? ` — ${t.competition}` : ""}` })),
  { value: "inconnu", label: "Je ne sais pas encore" },
];

const joinFields: Field[] = [
  { name: "nom", label: "Nom et prénom du joueur", type: "text", required: true, autoComplete: "name" },
  { name: "annee", label: "Année de naissance", type: "year", required: true, help: "Elle détermine la catégorie d'âge." },
  { name: "categorie", label: "Équipe souhaitée", type: "select", required: true, options: teamOptions },
  { name: "contact", label: "Personne de contact (parent si mineur)", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", required: true, autoComplete: "email" },
  { name: "telephone", label: "Téléphone", type: "tel", autoComplete: "tel", help: "Facultatif." },
  { name: "message", label: "Message", type: "textarea", help: "Expérience, club précédent, questions…" },
  { name: "accord", label: "J'accepte que le club utilise ces informations pour me recontacter au sujet de cette demande.", type: "checkbox", required: true },
];

export function JoinForm() {
  // Preselect the team when arriving from a team page (/rejoindre?equipe=slug).
  const equipe = useSyncExternalStore(
    noop,
    () => {
      const v = new URLSearchParams(window.location.search).get("equipe") ?? "";
      return teams.some((t) => t.slug === v) ? v : "";
    },
    () => "",
  );
  return (
    <InquiryForm
      key={equipe}
      formName="Inscription"
      fields={joinFields}
      to={club.contact.email}
      subject="Demande d'inscription — Villeneuve-Sports"
      submitLabel="Envoyer la demande"
      initialValues={{ categorie: equipe }}
    />
  );
}

const sponsorFields: Field[] = [
  { name: "entreprise", label: "Entreprise ou organisation", type: "text", required: true, autoComplete: "organization" },
  { name: "nom", label: "Nom et prénom", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", required: true, autoComplete: "email" },
  { name: "telephone", label: "Téléphone", type: "tel", autoComplete: "tel", help: "Facultatif." },
  {
    name: "soutien",
    label: "Type de soutien envisagé",
    type: "select",
    required: true,
    options: [
      { value: "visibilite", label: "Visibilité au stade" },
      { value: "juniors", label: "Soutien au mouvement junior" },
      { value: "equipement", label: "Équipement / matériel" },
      { value: "evenement", label: "Événement du club" },
      { value: "autre", label: "Autre / à discuter" },
    ],
  },
  { name: "message", label: "Votre projet", type: "textarea", required: true, minLength: 20 },
  { name: "accord", label: "J'accepte que le club utilise ces informations pour me recontacter.", type: "checkbox", required: true },
];

export function SponsorForm() {
  return (
    <InquiryForm
      formName="Partenariat"
      fields={sponsorFields}
      to={club.contact.email}
      subject="Partenariat — Villeneuve-Sports"
      submitLabel="Envoyer la proposition"
    />
  );
}

const contactFields: Field[] = [
  { name: "nom", label: "Nom et prénom", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", required: true, autoComplete: "email" },
  {
    name: "sujet",
    label: "Sujet",
    type: "select",
    required: true,
    options: [
      { value: "general", label: "Question générale" },
      { value: "inscription", label: "Inscription d'un joueur" },
      { value: "equipe", label: "Une équipe en particulier" },
      { value: "partenariat", label: "Partenariat" },
      { value: "benevolat", label: "Bénévolat / encadrement" },
      { value: "presse", label: "Presse / médias" },
    ],
  },
  { name: "message", label: "Message", type: "textarea", required: true, minLength: 10 },
  { name: "accord", label: "J'accepte que le club utilise ces informations pour me répondre.", type: "checkbox", required: true },
];

export function ContactForm() {
  return (
    <InquiryForm formName="Contact" fields={contactFields} to={club.contact.email} subject="Contact — Villeneuve-Sports" submitLabel="Envoyer" />
  );
}
