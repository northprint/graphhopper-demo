import { PUBLIC_GRAPHHOPPER_URL } from '$env/static/public';

export interface RouteRequest {
  points: [number, number][];
  profile?: string;
  locale?: string;
  instructions?: boolean;
  calc_points?: boolean;
  points_encoded?: boolean;
  elevation?: boolean;
  block_area?: [number, number][][]; // Array of polygons for blocked areas
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
    
    // Add points (GETリクエストでは緯度,経度の順序)
    request.points.forEach(point => {
      params.append('point', `${point[1]},${point[0]}`);
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
    
    // リクエストボディの準備
    let body = null;
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    // 通行止めエリアがある場合はカスタムモデルとして送信
    if (request.block_area && request.block_area.length > 0) {
      const customModel = {
        priority: [
          {
            if: "in_blocked_area",
            multiply_by: 0
          }
        ],
        speed: [
          {
            if: "in_blocked_area",
            limit_to: 0
          }
        ],
        areas: {
          blocked_area: {
            type: "Feature",
            geometry: {
              type: "MultiPolygon",
              coordinates: request.block_area.map(area => [area])
            }
          }
        }
      };

      // POSTリクエストの場合はすべてのパラメータをボディに含める
      body = JSON.stringify({ 
        points: request.points,
        profile: request.profile || 'car',
        custom_model: customModel,
        points_encoded: request.points_encoded !== undefined ? request.points_encoded : false,
        locale: request.locale || 'ja',
        instructions: request.instructions !== undefined ? request.instructions : true,
        elevation: request.elevation !== undefined ? request.elevation : false
      });
      headers['Content-Type'] = 'application/json';
      console.log('Sending POST request with custom model:', body);
      // URLパラメータをクリア
      params.delete('point');
      params.delete('profile');
      params.delete('points_encoded');
      params.delete('locale');
      params.delete('instructions');
      params.delete('elevation');
    } else if (request.custom_model) {
      body = JSON.stringify({ 
        points: request.points,
        profile: request.profile || 'car',
        custom_model: request.custom_model,
        points_encoded: request.points_encoded !== undefined ? request.points_encoded : false,
        locale: request.locale || 'ja',
        instructions: request.instructions !== undefined ? request.instructions : true,
        elevation: request.elevation !== undefined ? request.elevation : false
      });
      headers['Content-Type'] = 'application/json';
      // URLパラメータをクリア
      params.delete('point');
      params.delete('profile');
      params.delete('points_encoded');
      params.delete('locale');
      params.delete('instructions');
      params.delete('elevation');
    }

    const url = `${this.baseUrl}/route?${params.toString()}`;
    console.log('GraphHopper API request:', url);
    
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers,
      body
    });
    
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