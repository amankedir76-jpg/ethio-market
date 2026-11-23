import {
  Armchair, Baby, BookOpen, Car, Footprints, Laptop, Refrigerator, Shirt, ShoppingBasket, Smartphone, Sparkles, Trophy, Tag,
} from "lucide-react";

/** Symbol und Farbe pro Kategorie (Kategorien selbst kommen aus der Datenbank). */
const MAP: Record<string, { Icon: typeof Tag; color: string }> = {
  phones: { Icon: Smartphone, color: "#2563eb" },
  computers: { Icon: Laptop, color: "#0891b2" },
  fashion: { Icon: Shirt, color: "#c026d3" },
  shoes: { Icon: Footprints, color: "#9333ea" },
  beauty: { Icon: Sparkles, color: "#db2777" },
  food: { Icon: ShoppingBasket, color: "#16a34a" },
  furniture: { Icon: Armchair, color: "#a16207" },
  appliances: { Icon: Refrigerator, color: "#ea580c" },
  books: { Icon: BookOpen, color: "#4f46e5" },
  sport: { Icon: Trophy, color: "#059669" },
  auto: { Icon: Car, color: "#475569" },
  baby: { Icon: Baby, color: "#e11d48" },
};

export function CategoryIcon({ id, size = 26 }: { id: string; size?: number }) {
  const { Icon, color } = MAP[id] ?? { Icon: Tag, color: "#0f7a4f" };
  return (
    <span className="cat-icon" style={{ background: `${color}1a`, color }}>
      <Icon size={size} aria-hidden />
    </span>
  );
}
