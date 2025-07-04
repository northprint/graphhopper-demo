import { PUBLIC_GRAPHHOPPER_URL } from '$env/static/public';

export interface RouteRequest {
  points: [number, number][];
  profile?: string;
  locale?: string;
  instructions?: boolean;
  calc_points?: boolean;
  points_encoded?: boolean;
  elevation?: boolean;
}

export interface RouteResponse {
  paths: Path[];
  info: {
    copyrights: string[];
    took: number;
  };
}

export interface Path {
  distance: number;
  time: number;
  ascend?: number;
  descend?: number;
  points: {
    coordinates: [number, number][];
  };
  instructions?: Instruction[];
  points_encoded: boolean;
  bbox: [number, number, number, number];
}

export interface Instruction {
  distance: number;
  heading?: number;
  sign: number;
  interval: [number, number];
  text: string;
  time: number;
  street_name: string;
}

/**
 * GraphHopper API client for routing
 */
export class GraphHopperClient {
  private baseUrl: string;

  constructor(baseUrl: string = PUBLIC_GRAPHHOPPER_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Calculate route between points
   */
  async route(request: RouteRequest): Promise<RouteResponse> {
    const params = new URLSearchParams();
    
    // Add points
    request.points.forEach(point => {
      params.append('point', `${point[0]},${point[1]}`);
    });

    // Add optional parameters
    if (request.profile) params.append('profile', request.profile);
    if (request.locale) params.append('locale', request.locale);
    if (request.instructions !== undefined) {
      params.append('instructions', String(request.instructions));
    }
    if (request.calc_points !== undefined) {
      params.append('calc_points', String(request.calc_points));
    }
    if (request.points_encoded !== undefined) {
      params.append('points_encoded', String(request.points_encoded));
    }
    if (request.elevation !== undefined) {
      params.append('elevation', String(request.elevation));
    }

    const response = await fetch(`${this.baseUrl}/route?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get information about the GraphHopper instance
   */
  async info(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/info`);
    
    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check health status
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Default client instance
export const graphhopper = new GraphHopperClient();