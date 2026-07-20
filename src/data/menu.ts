import { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'mcchicken',
    name: 'McChicken',
    description: 'Crispy chicken patty with creamy mayonnaise and fresh lettuce.',
    price: 199,
    emoji: '🍔',
    category: 'Burgers'
  },
  {
    id: 'mcveggie',
    name: 'McVeggie',
    description: 'Delicious veg patty made with green peas, carrots, and potatoes.',
    price: 149,
    emoji: '🍔',
    category: 'Burgers'
  },
  {
    id: 'mcaloo-tikki',
    name: 'McAloo Tikki',
    description: 'Classic Indian favorite with a crispy potato and peas patty.',
    price: 89,
    emoji: '🥔',
    category: 'Burgers'
  },
  {
    id: 'fries',
    name: 'French Fries',
    description: 'World-famous crispy golden fries, salted to perfection.',
    price: 89,
    sizes: [
      { label: 'Medium', price: 89 },
      { label: 'Large', price: 119 }
    ],
    emoji: '🍟',
    category: 'Sides'
  },
  {
    id: 'mcnuggets',
    name: 'McNuggets (6pc)',
    description: 'Tender chicken nuggets with a crispy golden coating, served with dip.',
    price: 149,
    emoji: '🍗',
    category: 'Sides'
  },
  {
    id: 'mcegg',
    name: 'McEgg',
    description: 'Freshly steamed egg, topped with spicy mayonnaise and onions.',
    price: 129,
    emoji: '🍳',
    category: 'Burgers'
  },
  {
    id: 'coke',
    name: 'Coca-Cola',
    description: 'Ice-cold carbonated beverage to refresh your meal.',
    price: 60,
    emoji: '🥤',
    category: 'Drinks'
  },
  {
    id: 'mcflurry-oreo',
    name: 'McFlurry Oreo',
    description: 'Creamy soft-serve vanilla ice cream mixed with crunchy Oreo crumbs.',
    price: 99,
    emoji: '🍦',
    category: 'Desserts'
  }
];
