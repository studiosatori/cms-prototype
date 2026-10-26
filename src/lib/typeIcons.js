import {
  FileText, Gem, Newspaper, MapPin, Calendar, ShoppingBag, Ticket, Route, Building2, Utensils,
  BedDouble, Image, BookOpen, Tag, Star, Landmark, Camera, Layers,
} from "lucide-react";

// The single place that maps a content type's `icon` key to a lucide icon.
// Adding an icon here makes it available everywhere, including the picker.
export const TYPE_ICONS = {
  "file-text": FileText,
  newspaper: Newspaper,
  "book-open": BookOpen,
  layers: Layers,
  gem: Gem,
  tag: Tag,
  star: Star,
  image: Image,
  camera: Camera,
  "map-pin": MapPin,
  landmark: Landmark,
  "building-2": Building2,
  utensils: Utensils,
  "bed-double": BedDouble,
  calendar: Calendar,
  route: Route,
  ticket: Ticket,
  "shopping-bag": ShoppingBag,
};

export const TYPE_ICON_KEYS = Object.keys(TYPE_ICONS);

export function typeIcon(key) {
  return TYPE_ICONS[key] ?? FileText;
}
