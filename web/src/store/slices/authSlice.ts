import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/config/axios";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "CUSTOMER" | "OWNER" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT" | "PARTNER" | "SUB_USER";
  mfaEnabled?: boolean;
  isEmailVerified?: boolean;
  profile?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  mfaRequired: boolean;
  mfaUserId: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  loading: false,
  error: null,
  initialized: false,
  mfaRequired: false,
  mfaUserId: null,
};

// Thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password?: string; mfaToken?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const data = response.data.data;
      if (data.mfaRequired) {
        return { mfaRequired: true, userId: data.userId };
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken);
      }
      return { accessToken: data.accessToken, user: data.user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Login failed. Please verify credentials."
      );
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Registration failed."
      );
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (payload: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/verify-email", payload);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Verification code is incorrect."
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: { email: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/forgot-password", payload);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to submit request."
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/reset-password", payload);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to reset password."
      );
    }
  }
);

export const socialLogin = createAsyncThunk(
  "auth/socialLogin",
  async (payload: { provider: string; email: string; firstName: string; lastName: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/social", payload);
      const { accessToken, user } = response.data.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
      }
      return { accessToken, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Social login failed."
      );
    }
  }
);

export const toggleMfa = createAsyncThunk(
  "auth/toggleMfa",
  async (payload: { enabled: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post("/profile/mfa", payload);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to update Multi-factor status."
      );
    }
  }
);

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/profile");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to load profile."
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await api.put("/profile", profileData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || "Failed to update profile."
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      return null;
    } catch (error: any) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      return null;
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
    forceLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.mfaRequired = false;
      state.mfaUserId = null;
      state.initialized = true;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
    },
    cancelMfaRequirement: (state) => {
      state.mfaRequired = false;
      state.mfaUserId = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      if (action.payload.mfaRequired) {
        state.mfaRequired = true;
        state.mfaUserId = action.payload.userId;
      } else {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.mfaRequired = false;
        state.mfaUserId = null;
      }
    });
    builder.addCase(login.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(register.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Verify Email
    builder.addCase(verifyEmail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyEmail.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(verifyEmail.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Social Login
    builder.addCase(socialLogin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(socialLogin.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.mfaRequired = false;
      state.mfaUserId = null;
    });
    builder.addCase(socialLogin.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.user = action.payload;
      state.initialized = true;
    });
    builder.addCase(fetchProfile.rejected, (state) => {
      state.loading = false;
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Toggle MFA
    builder.addCase(toggleMfa.fulfilled, (state, action: PayloadAction<any>) => {
      if (state.user) {
        state.user.mfaEnabled = action.payload.mfaEnabled;
      }
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.mfaRequired = false;
      state.mfaUserId = null;
      state.loading = false;
    });
  },
});

export const { clearError, setInitialized, forceLogout, cancelMfaRequirement } = authSlice.actions;
export default authSlice.reducer;
