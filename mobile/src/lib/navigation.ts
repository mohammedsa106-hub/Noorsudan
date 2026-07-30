import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Category: { slug: string; name?: string };
  ListingDetail: { id: string };
  Dashboard: undefined;
  Profile: undefined;
  Settings: undefined;
  Help: undefined;
  Admin: undefined;
};

export type CategoryRoute = RouteProp<RootStackParamList, 'Category'>;
export type ListingDetailRoute = RouteProp<RootStackParamList, 'ListingDetail'>;
