export interface Ingress {
  name: string;
  namespace: string;
  host: string;
  path: string;
  discoveryStatus: string;
}

export interface Application {
  id: number;
  name: string;
  ingress: Ingress[];
}

export interface ApplicationsResponse {
  applications: Application[];
}

export interface ApplicationsRequest {
  namespace?: string;
  cluster?: string;
}

export interface ApplicationNavigationItem {
  href: string;  // Relative to application base route
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ApplicationLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export interface ApplicationContext {
  application: Application | null;
  loading: boolean;
  error: string | null;
}