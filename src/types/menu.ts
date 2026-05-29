/** A single dish parsed from a menu image, with optional price and image. */
export interface MenuItem {
  id: string
  name: string
  price: string | null
  description?: string
  ingredients: string[]
  image?: string
}

/** The structured result of processing one or more menu images. */
export interface ProcessedMenu {
  items: MenuItem[]
}