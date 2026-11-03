export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export interface UpdateCategoryDto extends CreateCategoryDto {
  isActive: boolean;
}