import { BACKEND_BASE_URL } from "../api/client";

export interface ChildRecord {
  id: number;
  name: string;
  age: number;
  parentName?: string;
  parentPhone?: string;
  birthDate?: string | null;
  gender?: string | null;
  profilePic?: string | null;
}

export interface ChildApiRecord {
  id: number;
  name: string;
  age: number;
  parent_name?: string | null;
  parent_phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  profile_pic?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  birthDate?: string | null;
  profilePic?: string | null;
}

export type AgeGroupKey = "toddlers" | "preschoolers" | "kinder";

export interface AgeGroupDefinition {
  key: AgeGroupKey;
  label: string;
  ageRange: string;
  description: string;
  accent: string;
  badge: string;
}

export const AGE_GROUPS: AgeGroupDefinition[] = [
  {
    key: "toddlers",
    label: "Toddlers",
    ageRange: "18 months - 30 months",
    description: "Sensory play, routines, and first friendships.",
    accent: "from-amber-400 via-orange-400 to-rose-400",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    key: "preschoolers",
    label: " Preschoolers",
    ageRange: "2.5 - 4 years",
    description: "Guided exploration, art, and early literacy.",
    accent: "from-emerald-400 via-teal-400 to-cyan-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "kinder",
    label: "Kinder",
    ageRange: "4+ years",
    description: "School readiness, projects, and independence.",
    accent: "from-sky-400 via-blue-500 to-indigo-500",
    badge: "bg-sky-100 text-sky-700",
  },
];

export function getAgeGroup(age: number): AgeGroupKey {
  if (age <= 2.5) {
    return "toddlers";
  }

  if (age < 4) {
    return "preschoolers";
  }

  return "kinder";
}

export function getAgeGroupDefinition(group: AgeGroupKey) {
  return AGE_GROUPS.find((item) => item.key === group) ?? AGE_GROUPS[0];
}

export function normalizeChild(record: ChildApiRecord): ChildRecord {
  const rawProfilePic = record.profilePic ?? record.profile_pic ?? null;
  const normalizedProfilePic =
    rawProfilePic && rawProfilePic.startsWith("/uploads/")
      ? `${BACKEND_BASE_URL}${rawProfilePic}`
      : rawProfilePic;

  return {
    id: record.id,
    name: record.name,
    age: record.age,
    parentName: record.parentName ?? record.parent_name ?? undefined,
    parentPhone: record.parentPhone ?? record.parent_phone ?? undefined,
    birthDate: record.birthDate ?? record.birth_date ?? null,
    gender: record.gender ?? null,
    profilePic: normalizedProfilePic,
  };
}
