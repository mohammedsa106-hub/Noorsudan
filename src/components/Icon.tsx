import { type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';

type IconComponent = ComponentType<{ className?: string; size?: number }>;
const cache = new Map<string, IconComponent>();

export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  let Cmp = cache.get(name);
  if (!Cmp) {
    const found = (LucideIcons as unknown as Record<string, IconComponent>)[name];
    if (found) {
      cache.set(name, found);
      Cmp = found;
    }
  }
  if (!Cmp) {
    const Fallback = (LucideIcons as unknown as Record<string, IconComponent>).Folder;
    return <Fallback className={className} size={size} />;
  }
  return <Cmp className={className} size={size} />;
}
