import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/config/axios";

export interface Billboard {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  dimensions: string;
  locationType: "INDOOR" | "OUTDOOR" | "DIGITAL" | "STATIC" | "TRANSIT";
  pricePerDay: number;
  isAvailable: boolean;
  ownerId: string;
  createdAt: string;
}

interface BillboardState {
  ownerBillboards: Billboard[];
  loading: boolean;
  error: string | null;
}

const initialState: BillboardState = {
  ownerBillboards: [],
  loading: false,
  error: null,
};

// Thunks
export const fetchOwnerBillboards = createAsyncThunk(
  "billboards/fetchOwnerBillboards",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/owner/billboards");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to fetch owner billboards."
      );
    }
  }
);

export const createBillboard = createAsyncThunk(
  "billboards/createBillboard",
  async (billboardData: Omit<Billboard, "id" | "ownerId" | "createdAt" | "isAvailable">, { rejectWithValue }) => {
    try {
      const response = await api.post("/owner/billboards", billboardData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to create billboard."
      );
    }
  }
);

export const updateBillboard = createAsyncThunk(
  "billboards/updateBillboard",
  async ({ id, data }: { id: string; data: Partial<Billboard> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/owner/billboards/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to update billboard."
      );
    }
  }
);

export const deleteBillboard = createAsyncThunk(
  "billboards/deleteBillboard",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/owner/billboards/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to delete billboard."
      );
    }
  }
);

const billboardSlice = createSlice({
  name: "billboards",
  initialState,
  reducers: {
    clearBillboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Owner Billboards
    builder.addCase(fetchOwnerBillboards.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOwnerBillboards.fulfilled, (state, action: PayloadAction<Billboard[]>) => {
      state.loading = false;
      state.ownerBillboards = action.payload;
    });
    builder.addCase(fetchOwnerBillboards.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Create Billboard
    builder.addCase(createBillboard.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBillboard.fulfilled, (state, action: PayloadAction<Billboard>) => {
      state.loading = false;
      state.ownerBillboards.push(action.payload);
    });
    builder.addCase(createBillboard.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update Billboard
    builder.addCase(updateBillboard.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateBillboard.fulfilled, (state, action: PayloadAction<Billboard>) => {
      state.loading = false;
      const idx = state.ownerBillboards.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.ownerBillboards[idx] = action.payload;
      }
    });
    builder.addCase(updateBillboard.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete Billboard
    builder.addCase(deleteBillboard.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBillboard.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.ownerBillboards = state.ownerBillboards.filter((b) => b.id !== action.payload);
    });
    builder.addCase(deleteBillboard.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearBillboardError } = billboardSlice.actions;
export default billboardSlice.reducer;
