import type { Locale } from "@ethio/core";

/** Die 12 Hauptkategorien. Später kommen sie aus der Tabelle shop.categories. */
export const CATEGORIES: { id: string; color: string; name: Record<Locale, string> }[] = [
  { id: "phones", color: "#2563eb", name: { en: "Phones & Electronics", am: "ስልኮችና ኤሌክትሮኒክስ", om: "Bilbilaa fi Elektirooniksii" } },
  { id: "computers", color: "#0891b2", name: { en: "Computers & Accessories", am: "ኮምፒውተሮችና መለዋወጫዎች", om: "Kompiitaraa fi Meeshaalee" } },
  { id: "fashion", color: "#c026d3", name: { en: "Clothing & Fashion", am: "አልባሳትና ፋሽን", om: "Uffata fi Faashinii" } },
  { id: "shoes", color: "#9333ea", name: { en: "Shoes & Bags", am: "ጫማዎችና ቦርሳዎች", om: "Kophee fi Boorsaa" } },
  { id: "beauty", color: "#db2777", name: { en: "Beauty & Care", am: "ኮስሞቲክስና እንክብካቤ", om: "Kosmetiksii fi Kunuunsa" } },
  { id: "food", color: "#16a34a", name: { en: "Food & Groceries", am: "ምግብ", om: "Nyaata" } },
  { id: "furniture", color: "#a16207", name: { en: "Furniture & Decor", am: "የቤት ዕቃዎችና ማስዋቢያ", om: "Meeshaalee Manaa" } },
  { id: "appliances", color: "#ea580c", name: { en: "Home Appliances", am: "የቤት ውስጥ መገልገያዎች", om: "Meeshaalee Elektirikii Manaa" } },
  { id: "books", color: "#4f46e5", name: { en: "Books & Stationery", am: "መጻሕፍትና የጽሕፈት መሳሪያዎች", om: "Kitaabota fi Meeshaalee Barreeffamaa" } },
  { id: "sport", color: "#059669", name: { en: "Sports & Leisure", am: "ስፖርትና መዝናኛ", om: "Ispoortii fi Bashannana" } },
  { id: "auto", color: "#475569", name: { en: "Car & Motorbike", am: "የመኪናና ሞተር ሳይክል መለዋወጫ", om: "Meeshaalee Konkolaataa fi Motoraa" } },
  { id: "baby", color: "#e11d48", name: { en: "Baby & Kids", am: "የሕፃናትና ልጆች ዕቃዎች", om: "Meeshaalee Daa'immanii" } },
];
