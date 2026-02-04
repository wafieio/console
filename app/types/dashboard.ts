export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface PageMeta {
  title: string;
  description: string;
}