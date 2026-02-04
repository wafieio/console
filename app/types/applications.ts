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