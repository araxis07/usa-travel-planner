
export enum Region {
  ALL = "All Regions",
  NORTHEAST = "Northeast",
  SOUTHEAST = "Southeast",
  MIDWEST = "Midwest",
  SOUTHWEST = "Southwest",
  WEST = "West",
}

export enum Category {
  ALL = "All Categories",
  CITY = "City",
  NATIONAL_PARK = "National Park",
  HISTORICAL = "Historical",
  COASTAL = "Coastal",
}

export interface Destination {
  id: number;
  name: string;
  state: string;
  stateCode: string;
  region: Region;
  category: Category;
  description: string;
  longDescription: string;
  imageUrl: string;
  bestTimeToVisit: string;
  activities: string[];
  rating: number;
}

export interface ItineraryItem extends Destination {
  notes?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  imageUrl: string;
}
