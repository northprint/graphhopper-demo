import { PUBLIC_GRAPHHOPPER_URL } from '$env/static/public';

export interface RouteRequest {
  points: [number, number][];
  profile?: string;
  locale?: string;
  instructions?: boolean;
  calc_points?: boolean;
  points_encoded?: boolean;
  elevation?: boolean;
  block_area?: string; // Deprecated - will be converted to custom_model
  custom_model?: any; // Custom model for advanced routing
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
    
    // For now, skip block_area functionality as it requires custom GraphHopper configuration
    if (request.block_area) {
      console.warn('Block area functionality is not currently supported by the GraphHopper API. Custom model configuration required.');
      // Commenting out the custom_model approach for now
      /*
      const customModel = {
        // This would require GraphHopper server to be configured with custom model support
      };
      params.append('custom_model', JSON.stringify(customModel));
      */
    } else if (request.custom_model) {
      params.append('custom_model', JSON.stringify(request.custom_model));
    }

    const url = `${this.baseUrl}/route?${params.toString()}`;
    console.log('GraphHopper API request:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GraphHopper API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: url
      });
      throw new Error(`GraphHopper API error: ${response.status} ${response.statusText} - ${errorBody}`);
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