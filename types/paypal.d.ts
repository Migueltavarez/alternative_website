declare module '@paypal/checkout-server-sdk' {
  export function sandbox(sandboxClientId: string, sandboxClientSecret: string): any;
  export function live(liveClientId: string, liveClientSecret: string): any;
  
  export namespace core {
    class PayPalHttpClient {
      constructor(environment: any);
      execute(request: any): Promise<{ result: any }>;
    }
    
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }
  
  export namespace orders {
    class OrdersCreateRequest {
      constructor();
      requestBody(body: any): this;
    }
    
    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: any): this;
    }
    
    class OrdersGetRequest {
      constructor(orderId: string);
    }
  }
}
