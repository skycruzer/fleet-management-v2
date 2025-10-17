/**
 * Supabase Database Types
 *
 * To generate types from your Supabase database, run:
 * npm run db:types
 *
 * This will generate TypeScript types based on your database schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Add your table definitions here after running db:types
      // Example:
      // pilots: {
      //   Row: {
      //     id: string
      //     name: string
      //     email: string
      //     created_at: string
      //   }
      //   Insert: {
      //     id?: string
      //     name: string
      //     email: string
      //     created_at?: string
      //   }
      //   Update: {
      //     id?: string
      //     name?: string
      //     email?: string
      //     created_at?: string
      //   }
      // }
    }
    Views: {
      // Add your view definitions here
    }
    Functions: {
      // Add your function definitions here
    }
    Enums: {
      // Add your enum definitions here
    }
  }
}
