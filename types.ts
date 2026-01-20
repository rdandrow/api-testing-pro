
export type ToolType = 'Playwright' | 'Cypress';

export interface CodeExample {
  title: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  playwrightCode: string;
  cypressCode: string;
  expectedJson: any;
  jsonSchema?: any;
  validationPoints?: string[];
  requestBody?: any; // New: Predefined body for the playground
}

export interface Scenario {
  id: string;
  title: string;
  icon: string;
  examples: CodeExample[];
}

export interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}
