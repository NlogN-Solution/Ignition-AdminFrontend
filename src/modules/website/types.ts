/**
 * The public catalogue and CMS, as the console sees them.
 *
 * Mirrors backend/app/schemas/{catalogue,content}.py and the public-catalogue
 * columns added to `universities` / `programs` in
 * backend/app/schemas/academic.py.
 *
 * Almost everything is nullable, and that is the contract rather than
 * looseness: the public site hides any section whose field is absent, so an
 * empty field here is literally a section the site is not rendering. The
 * editor surfaces that as a completeness indicator instead of hiding it.
 */

export const UK_REGIONS = [
  "England — North",
  "England — Midlands",
  "England — South",
  "Scotland",
  "Wales",
  "Northern Ireland",
] as const;
export type UkRegion = (typeof UK_REGIONS)[number];

export const COURSE_SUBJECTS = [
  "Computing",
  "Engineering",
  "Health",
  "Sciences",
  "Business",
  "Law",
  "Arts & Design",
  "Social Sciences",
  "Education",
  "Humanities",
] as const;
export type CourseSubject = (typeof COURSE_SUBJECTS)[number];

export const COURSE_LEVELS = [
  "Foundation",
  "Undergraduate",
  "Top-Up",
  "Integrated Masters",
  "Postgraduate",
] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

/** Keys, not display strings — the university's own wording lives on `label`. */
export const ENTRY_ROUTES = [
  "undergraduate",
  "international_year_one",
  "international_foundation_year",
  "pre_masters",
  "postgraduate",
  "top_up",
  "extended_masters",
  "mres",
  "dba",
  "nursing",
] as const;
export type EntryRoute = (typeof ENTRY_ROUTES)[number];

export const ENTRY_ROUTE_LABELS: Record<EntryRoute, string> = {
  undergraduate: "Undergraduate",
  international_year_one: "International Year One",
  international_foundation_year: "International Foundation Year",
  pre_masters: "Pre-Masters",
  postgraduate: "Postgraduate",
  top_up: "Top-Up",
  extended_masters: "Extended Masters",
  mres: "MRes",
  dba: "DBA",
  nursing: "Nursing",
};

export interface Ranking {
  title: string;
  position?: string;
  scope?: string;
  category?: string;
  source: string;
  year: number;
  note?: string;
  href?: string;
}

export interface Award {
  title: string;
  organisation: string;
  year: number;
  detail?: string;
  href?: string;
}

export interface Milestone {
  year: string;
  label: string;
}

export interface Employer {
  name: string;
  logo?: string;
  sector?: string;
}

export interface Employability {
  employedRate?: string;
  employedSource?: string;
  medianSalary?: string;
  placementRate?: string;
  employers?: Employer[];
  services?: string[];
}

export interface Accommodation {
  guaranteed?: boolean;
  weeklyFrom?: number;
  weeklyTo?: number;
  note?: string;
}

export interface EntryProfile {
  typical?: string;
  english?: string;
  tariff?: string;
  ielts?: string;
}

export interface Imagery {
  hero?: string;
  card?: string;
  gallery?: { src: string; caption?: string }[];
}

/** The website columns on `universities`, on top of the operational ones. */
export interface WebsiteUniversity {
  id: string;
  country_id: string;
  name: string;
  short_name: string | null;
  website: string | null;
  city: string | null;
  logo_url: string | null;
  ranking: number | null;
  is_partner: boolean;
  is_active: boolean;
  acceptance_rate: number | null;
  faculties: string[] | null;
  highlights: string[] | null;

  slug: string | null;
  region: UkRegion | null;
  tagline: string | null;
  overview: string | null;
  student_experience: string | null;
  careers_text: string | null;
  tuition_min: number | null;
  tuition_max: number | null;
  living_cost_monthly: number | null;
  accommodation: Accommodation | null;
  entry: EntryProfile | null;
  placement_year: boolean;
  international_support: string[] | null;
  facilities: string[] | null;
  subjects: string[] | null;
  monogram: string | null;
  founded: string | null;
  kind: string | null;
  campus: string | null;
  student_population: string | null;
  international_students: string | null;
  student_staff_ratio: string | null;
  history: string[] | null;
  milestones: Milestone[] | null;
  rankings: Ranking[] | null;
  awards: Award[] | null;
  employability: Employability | null;
  interview_profile: Record<string, unknown> | null;
  imagery: Imagery | null;
  flyer_url: string | null;
  is_published: boolean;
  is_example: boolean;

  created_at: string;
  updated_at: string;
}

export type WebsiteUniversityPayload = Partial<
  Omit<WebsiteUniversity, "id" | "created_at" | "updated_at">
>;

export interface UniversityRouteRead {
  id: string;
  university_id: string;
  route_key: EntryRoute;
  label: string | null;
  applicant_country_id: string | null;
  academic_criteria: string | null;
  english_criteria: string | null;
  english_waiver: string | null;
  fee_structure: string | null;
  scholarship_text: string | null;
  gap_policy: string | null;
  cas_deposit: string | null;
  enrolment_fee: string | null;
  deadlines: string | null;
  previous_refusal: string | null;
  /** Criteria labels the importer did not recognise. Nothing is discarded. */
  extras: Record<string, string> | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type UniversityRoutePayload = Partial<Omit<UniversityRouteRead, "id" | "created_at" | "updated_at">> & {
  university_id: string;
  route_key: EntryRoute;
};

/** One university's offering of a course. There are ~4,800 of these. */
export interface WebsiteProgram {
  id: string;
  university_id: string;
  name: string;
  degree_level: string | null;
  is_active: boolean;
  slug: string | null;
  course_profile_id: string | null;
  route_id: string | null;
  subject: CourseSubject | null;
  course_level: CourseLevel | null;
  qualification: string | null;
  campus: string | null;
  duration_years: number | null;
  placement: boolean;
  extra_requirements: string | null;
  fee_tier: string | null;
  is_published: boolean;
  is_example: boolean;
  created_at: string;
  updated_at: string;
}

export type WebsiteProgramPayload = Partial<Omit<WebsiteProgram, "id" | "created_at" | "updated_at">>;

export interface CourseProfileRead {
  id: string;
  slug: string;
  title: string;
  qualification: string | null;
  subject: CourseSubject | null;
  course_level: CourseLevel | null;
  duration_years: number | null;
  placement: boolean;
  overview: string | null;
  what_you_study: string | null;
  modules: { year: string; items: string[] }[] | null;
  skills: string[] | null;
  entry: Record<string, string> | null;
  career_outcomes: string[] | null;
  related_careers: string[] | null;
  image_url: string | null;
  is_published: boolean;
  is_example: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type CourseProfilePayload = Partial<Omit<CourseProfileRead, "id" | "created_at" | "updated_at">> & {
  slug: string;
  title: string;
};

export interface ScholarshipRead {
  id: string;
  slug: string;
  name: string;
  provider: string | null;
  kind: string | null;
  university_id: string | null;
  levels: string[] | null;
  subjects: string[] | null;
  nationality_group: string | null;
  /** Prose, not a number — "£2,000 for each year (1st, 2nd & 3rd)". */
  amount: string | null;
  deadline: string | null;
  eligibility: string | null;
  apply_via: string | null;
  source: { label?: string; href?: string } | null;
  is_published: boolean;
  is_example: boolean;
  created_at: string;
  updated_at: string;
}

export type ScholarshipPayload = Partial<Omit<ScholarshipRead, "id" | "created_at" | "updated_at">> & {
  slug: string;
  name: string;
};

export interface MediaAssetRead {
  id: string;
  url: string;
  public_id: string | null;
  kind: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt_text: string | null;
  caption: string | null;
  folder: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportRow {
  entity: string;
  created: number;
  updated: number;
  unchanged: number;
  retired: number;
}

export interface ImportPreview {
  applied: boolean;
  universities: number;
  routes: number;
  offerings: number;
  rows: ImportRow[];
  problems: string[];
  /** The extractor's full report.md — the derivations a human must review. */
  report: string;
}
