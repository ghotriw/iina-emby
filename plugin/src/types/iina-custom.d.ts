declare namespace IINA {
  export interface HTTPRequestOptions<DataType = unknown> {
    params?: Record<string, string>;
    headers?: Record<string, string>;
    data?: DataType;
  }

  namespace API {
    export interface HTTP {
      get<ReqData = unknown, ResData = unknown>(url: string, options?: HTTPRequestOptions<ReqData>): Promise<HTTPResponse<ResData>>;
      post<ReqData = unknown, ResData = unknown>(url: string, options?: HTTPRequestOptions<ReqData>): Promise<HTTPResponse<ResData>>;
      put<ReqData = unknown, ResData = unknown>(url: string, options?: HTTPRequestOptions<ReqData>): Promise<HTTPResponse<ResData>>;
      delete<ReqData = unknown, ResData = unknown>(url: string, options?: HTTPRequestOptions<ReqData>): Promise<HTTPResponse<ResData>>;
    }

    export interface Event {
      on(event: "iina.file-loaded", callback: (url?: string) => void): string;
      on(event: "iina.window-loaded", callback: () => void): string;
      on(event: "iina.window-will-close", callback: () => void): string;
      on(event: "iina.application-will-terminate", callback: () => void): string;
      on(event: "mpv.pause.changed", callback: (paused: boolean) => void): string;
      on(event: "mpv.end-file", callback: () => void): string;
      on(event: `mpv.${string}`, callback: (...args: unknown[]) => void): string;
      on(event: string, callback: (...args: unknown[]) => void): string;
    }

    export interface StandaloneWindow {
      setProperty(
        props: Partial<{
          title: string;
          resizable: boolean;
          hudWindow: boolean;
          fullSizeContentView: boolean;
          hideTitleBar: boolean;
        }>,
      ): void;
    }
  }
}
