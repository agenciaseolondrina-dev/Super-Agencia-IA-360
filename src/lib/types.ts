// Database Types — mirrors Supabase schema

export type CarouselStatus = 'draft' | 'draft_with_copy' | 'approved' | 'generating' | 'generated' | 'hires_ready';
export type JobType = 'generate_layout' | 'generate_bg' | 'render_preview' | 'validate' | 'render_hires';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type AssetType = 'logo' | 'icon' | 'pattern' | 'photo';

export interface Client {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  brand_fonts: {
    heading?: string;
    body?: string;
  };
  instagram_handle: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Carousel {
  id: string;
  project_id: string;
  title: string;
  status: CarouselStatus;
  style_preset: string;
  niche: string | null;
  theme: string | null;
  objective: string | null;
  tone: string | null;
  cta_final: string | null;
  slides_count: number;
  prompt_template_id: string | null;
  layout_json: LayoutSpec | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  slides?: Slide[];
}

export interface Slide {
  id: string;
  carousel_id: string;
  position: number;
  headline: string;
  subheadline: string | null;
  bullets: string[];
  cta_text: string | null;
  cta_url: string | null;
  bg_prompt: string | null;
  bg_url: string | null;
  preview_url: string | null;
  hires_url: string | null;
  layout_overrides: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  client_id: string;
  type: AssetType;
  filename: string;
  storage_path: string;
  storage_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  prompt_id: string;
  name: string;
  objective: string;
  template: string;
  variables: string[];
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  carousel_id: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Layout Spec types
export interface SafeZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextElement {
  type: 'headline' | 'subheadline' | 'bullet' | 'cta';
  content?: string;
  items?: string[];
  x: number;
  y: number;
  width: number;
  font_family: string;
  font_size: number;
  font_weight: 'bold' | 'semibold' | 'normal';
  color: string;
  text_align: 'left' | 'center' | 'right';
  line_height: number;
  bg_color?: string;
  border_radius?: number;
  padding?: string;
}

export interface LogoPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface SlideLayout {
  position: number;
  safe_zone: SafeZone;
  text_elements: TextElement[];
  logo: LogoPlacement;
  bg_safe_zone_position: 'top' | 'center' | 'bottom';
  bg_safe_zone_pct: number;
}

export interface LayoutSpec {
  canvas: { width: number; height: number };
  slides: SlideLayout[];
}
