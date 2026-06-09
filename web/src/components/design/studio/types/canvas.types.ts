import { fabric } from "fabric";

export type ElementType = "text" | "image" | "rect" | "circle" | "svg" | "triangle" | "star";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  gradientFill?: string | null;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  locked?: boolean;
  visible?: boolean;
  name?: string;
  
  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;
  gradientText?: boolean;
  curvedText?: boolean;
  curveRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeColor?: string;
  outlineWidth?: number;

  // Shape specific
  rx?: number; // corner radius x
  ry?: number; // corner radius y
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  } | null;

  // Image specific
  src?: string;
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
  };
}

export interface ZoomSettings {
  level: number; // 0.1 to 5.0 (10% to 500%)
  min: number;
  max: number;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface TemplateType {
  id: string;
  name: string;
  width: number;
  height: number;
  canvasJson: string;
  isTemplate: boolean;
  categoryId?: string | null;
}
