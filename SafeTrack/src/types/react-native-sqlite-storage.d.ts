declare module 'react-native-sqlite-storage' {
  export interface Database {
    executeSql(sql: string, params?: any[]): Promise<any>;
    transaction(txFunction: (tx: any) => void): Promise<any>;
    close(): Promise<void>;
  }

  export interface SQLiteOptions {
    name: string;
    location?: string;
  }

  export function openDatabase(options: SQLiteOptions): Promise<Database>;
  export function enablePromise(enable: boolean): void;
}