import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: any
  children?: ChildItem[]
  item?: any
  url?: any
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: any
  id?: number
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: any
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  {
    heading: 'Menu', 
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/dashboard',
        isPro: false,
      },
      {
        name: 'Users',
        icon: 'solar:users-group-rounded-linear',
        id: uniqueId(),
        url: '/users',
        isPro: false,
      },
      {
        name: 'Categories',
        icon: 'solar:user-check-linear',
        id: uniqueId(),
        url: '/categories',
        isPro: false,
      },
      {
        name: 'Custom Layouts',
        icon: 'solar:card-linear',
        id: uniqueId(),
        url: '/custom-layouts',
        isPro: false,
      },
      {
        name: 'Templates',
        icon: 'solar:layers-minimalistic-linear',
        id: uniqueId(),
        url: '/template-admin',
        isPro: false,
      },
      {
        name: 'Billing Support',
        icon: 'solar:inbox-line-linear',
        id: uniqueId(),
        url: '/billing-support',
        isPro: false,
      },
      {
        name: 'SMTP',
        icon: 'solar:letter-linear',
        id: uniqueId(),
        url: '/smtp',
        isPro: false,
      },
      {
        name: 'Admin Mail',
        icon: 'solar:mailbox-linear',
        id: uniqueId(),
        url: '/admin-mail',
        isPro: false,
      },
      {
        name: 'Settings',
        icon: 'solar:settings-linear',
        id: uniqueId(),
        url: '/admin-profile',
        isPro: false,
      }
    ],
  }
]

export default SidebarContent
