import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from '@/lib/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON_MAP: Record<string, IconName> = {
  BedDouble: 'bed-double',
  UtensilsCrossed: 'silverware-fork-knife',
  Plane: 'airplane',
  Megaphone: 'bullhorn',
  Truck: 'truck',
  ShoppingCart: 'cart',
  Car: 'car',
  Building2: 'domain',
  Stethoscope: 'stethoscope',
  Briefcase: 'briefcase',
  Hammer: 'hammer',
  Scale: 'scale',
  GraduationCap: 'school',
  Landmark: 'bank',
  PartyPopper: 'party-popper',
  Scissors: 'content-cut',
  Wheat: 'grass',
  HeartHandshake: 'hand-heart',
  Folder: 'folder',
  Store: 'store',
  HardHat: 'hard-hat',
  Phone: 'phone',
  Mail: 'email',
  MapPin: 'map-marker',
  DollarSign: 'currency-usd',
  Tag: 'tag',
  FileText: 'file-document',
  Image: 'image',
  Home: 'home',
  Wrench: 'wrench',
  Heart: 'heart',
  Star: 'star',
  Coffee: 'coffee',
  Bus: 'bus',
  Bike: 'bike',
  Package: 'package',
  Gift: 'gift',
  PawPrint: 'paw',
  Flower2: 'flower',
  Trees: 'tree',
  Cloud: 'cloud',
  Zap: 'flash',
  Droplet: 'water',
  Wind: 'weather-windy',
  Sun: 'white-balance-sunny',
  Moon: 'moon-waning-crescent',
  Sparkles: 'star-shooting',
  MessageCircle: 'message-text',
  Navigation: 'navigation',
  ChevronLeft: 'chevron-left',
  ChevronRight: 'chevron-right',
  Eye: 'eye',
  EyeOff: 'eye-off',
  Settings: 'cog',
  HelpCircle: 'help-circle',
  ShieldCheck: 'shield-check',
  User: 'account',
  Plus: 'plus',
  Trash: 'trash-can',
  Edit: 'pencil',
  X: 'close',
  ArrowUp: 'arrow-up',
  ArrowDown: 'arrow-down',
  LogOut: 'logout',
  Send: 'send',
  MapPinned: 'map-marker',
  ChevronDown: 'chevron-down',
  Check: 'check',
  Lock: 'lock',
  Loader: 'progress-clock',
  ImagePlus: 'image-multiple',
  Link: 'link',
  Maximize: 'expand-all',
  Camera: 'camera',
};

export function getIconName(name: string): IconName {
  return ICON_MAP[name] || 'folder';
}

export function Icon({
  name,
  size = 24,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <MaterialCommunityIcons
      name={getIconName(name)}
      size={size}
      color={color || colors.gold200}
    />
  );
}
