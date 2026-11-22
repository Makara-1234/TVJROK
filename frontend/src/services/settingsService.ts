
import api from "../api/axios";

export interface RestaurantSettings {
  id: string;
  restaurantName: string;
  phoneNumber: string;
  address: string;
  logoUrl: string | null;
  khqrImageUrl: string | null;
  currencyCode: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
}

export interface UpdateRestaurantSettings {
  restaurantName: string;
  phoneNumber: string;
  address: string;
  logoUrl: string | null;
  khqrImageUrl: string | null;
  currencyCode: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
}

const settingsService = {
  getSettings: async (): Promise<RestaurantSettings> => {
    const response = await api.get<RestaurantSettings>("/settings");
    return response.data;
  },

  updateSettings: async (
    data: UpdateRestaurantSettings
  ): Promise<RestaurantSettings> => {
    const response = await api.put<RestaurantSettings>(
      "/settings",
      data
    );
    return response.data;
  },

  uploadKhqr: async (file: File): Promise<RestaurantSettings> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<RestaurantSettings>(
      "/settings/khqr",
      formData
    );

    return response.data;
  },
};

export default settingsService;
