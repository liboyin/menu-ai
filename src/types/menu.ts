export interface MenuItem {
  id: string
  name: string
  price: string
  description?: string
  ingredients: string[]
  image?: string
}

export interface ProcessedMenu {
  items: MenuItem[]
}