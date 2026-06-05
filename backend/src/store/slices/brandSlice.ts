import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/config/axios";

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Typography {
  headings: string;
  body: string;
}

export interface BrandAsset {
  id: string;
  customerId: string;
  name: string;
  logoUrl?: string | null;
  assetUrl: string; // guidelines url
  colorPalette?: ColorPalette | null;
  typography?: Typography | null;
  createdAt: string;
  updatedAt: string;
}

interface BrandState {
  brandAssets: BrandAsset[];
  loading: boolean;
  error: string | null;
}

const initialState: BrandState = {
  brandAssets: [],
  loading: false,
  error: null,
};

// Thunks
export const fetchBrandAssets = createAsyncThunk(
  "brand/fetchBrandAssets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/brand");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to fetch brand assets."
      );
    }
  }
);

export const createBrandAsset = createAsyncThunk(
  "brand/createBrandAsset",
  async (
    assetData: Omit<BrandAsset, "id" | "customerId" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/brand", assetData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to register brand asset library."
      );
    }
  }
);

export const updateBrandAsset = createAsyncThunk(
  "brand/updateBrandAsset",
  async (
    { id, data }: { id: string; data: Partial<BrandAsset> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/brand/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to update brand asset."
      );
    }
  }
);

export const deleteBrandAsset = createAsyncThunk(
  "brand/deleteBrandAsset",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/brand/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to delete brand asset library."
      );
    }
  }
);

export const uploadFile = createAsyncThunk(
  "brand/uploadFile",
  async ({ file, purpose }: { file: File; purpose: "logo" | "guideline" }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);
      const response = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "File upload failed."
      );
    }
  }
);

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    clearBrandError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Brand Assets
    builder.addCase(fetchBrandAssets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBrandAssets.fulfilled, (state, action: PayloadAction<BrandAsset[]>) => {
      state.loading = false;
      state.brandAssets = action.payload;
    });
    builder.addCase(fetchBrandAssets.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Create Brand Asset
    builder.addCase(createBrandAsset.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBrandAsset.fulfilled, (state, action: PayloadAction<BrandAsset>) => {
      state.loading = false;
      state.brandAssets.push(action.payload);
    });
    builder.addCase(createBrandAsset.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update Brand Asset
    builder.addCase(updateBrandAsset.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateBrandAsset.fulfilled, (state, action: PayloadAction<BrandAsset>) => {
      state.loading = false;
      const idx = state.brandAssets.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) {
        state.brandAssets[idx] = action.payload;
      }
    });
    builder.addCase(updateBrandAsset.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete Brand Asset
    builder.addCase(deleteBrandAsset.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBrandAsset.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.brandAssets = state.brandAssets.filter((a) => a.id !== action.payload);
    });
    builder.addCase(deleteBrandAsset.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Upload File
    builder.addCase(uploadFile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(uploadFile.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(uploadFile.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearBrandError } = brandSlice.actions;
export default brandSlice.reducer;
