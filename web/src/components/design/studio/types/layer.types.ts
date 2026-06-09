export interface EditorLayer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  active: boolean;
  thumbnail?: string; // Data URL preview of the layer
  parentId?: string | null; // For future nesting/groups support
}

export interface LayerGroup {
  id: string;
  name: string;
  layerIds: string[];
}
