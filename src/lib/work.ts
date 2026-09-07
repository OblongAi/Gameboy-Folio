import deenCoach from "../assets/work/deen-coach.webp";
import scovia from "../assets/work/scovia.webp";
import cvBuilder from "../assets/work/cv-builder.webp";
import sculpted from "../assets/work/sculpted-sweetness.webp";
import theboys from "../assets/work/theboys.webp";
import brent from "../assets/work/brent.webp";

export type WorkItem = {
  id: string;
  title: string;
  tag: string;
  blurb: string;
  href: string;
  still: string;
  live: boolean;
};

export const WORK: WorkItem[] = [
  {
    id: "deen",
    title: "DEEN COACH",
    tag: "LIVE - FITNESS",
    blurb: "Coaching site with a short path from visit to a first message.",
    href: "https://deencoach.lovable.app/",
    still: deenCoach,
    live: true,
  },
  {
    id: "scovia",
    title: "SCOVIA",
    tag: "LIVE - CRM",
    blurb: "A sales CRM in daily use. One pipeline. Less admin.",
    href: "https://grstudioscovia.lovable.app/",
    still: scovia,
    live: true,
  },
  {
    id: "cv",
    title: "CV BUILDER",
    tag: "LIVE - FREE TOOL",
    blurb: "Bilingual CV builder with live preview and a sharp PDF.",
    href: "https://freecvbuilder.lovable.app/",
    still: cvBuilder,
    live: true,
  },
  {
    id: "sculpted",
    title: "SCULPTED",
    tag: "CONCEPT - CAKE",
    blurb: "A patisserie site built around craft and easy booking.",
    href: "https://grstudiosculptedsweetness.lovable.app/",
    still: sculpted,
    live: false,
  },
  {
    id: "theboys",
    title: "THEBOYS",
    tag: "CONCEPT - FASHION",
    blurb: "Editorial clothing concept. High contrast. Cinematic product.",
    href: "https://grstudiotheboysdemo.lovable.app/",
    still: theboys,
    live: false,
  },
  {
    id: "brent",
    title: "BRENT",
    tag: "CONCEPT - FOOD",
    blurb: "Burger brand with appetite-first pictures and a clear order path.",
    href: "https://grstudiobrentdemo.lovable.app/",
    still: brent,
    live: false,
  },
];

export const CONTACT_EMAIL = "glenn@grstudio.site";
export const SITE_URL = "https://grstudio.site";
export const STUDIO_URL = "https://grstudio.site/";

export function mailtoHref() {
  const subject = encodeURIComponent("Start a project with GR Studio");
  const body = encodeURIComponent(
    "Hi Glenn,\n\nI would like to start a project.\n\n",
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
