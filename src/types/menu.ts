export interface MenuItem {
  id: string
  name: string
  price: string | null
  description?: string
  ingredients: string[]
  image?: string
}

export interface ProcessedMenu {
  items: MenuItem[]
}