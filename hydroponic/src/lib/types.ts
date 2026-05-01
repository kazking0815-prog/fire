export type Plant = {
  id: string;
  name: string;
  species: string;
  systemType?: string;
  startDate: string;
  notes?: string;
  createdAt: string;
};

export type GrowthRecord = {
  id: string;
  plantId: string;
  date: string;
  waterTempC?: number;
  ph?: number;
  ecMs?: number;
  roomTempC?: number;
  humidity?: number;
  lightHours?: number;
  heightCm?: number;
  leafCount?: number;
  photoPath?: string;
  memo?: string;
  createdAt: string;
};

export type Database = {
  plants: Plant[];
  records: GrowthRecord[];
};
