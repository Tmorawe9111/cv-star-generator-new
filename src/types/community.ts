/**
 * Community post types for guided post templates.
 * Target: Non-academics (trainees, craftspeople, care workers).
 */

export type PostType =
  | "projekt"
  | "suche"
  | "frage"
  | "erfolg"
  | "empfehlung"
  | "freitext";

export type PostFieldType = "text" | "textarea" | "image" | "select";

export interface PostField {
  key: string;
  label: string;
  type: PostFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface PostTemplate {
  type: PostType;
  icon: string;
  label: string;
  placeholder: string;
  fields: PostField[];
}

/** Template field values stored in post_meta */
export type PostMeta = Record<string, string | string[] | undefined>;
