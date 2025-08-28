export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          user_type: "admin" | "worker" | "employer"
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          user_type: "admin" | "worker" | "employer"
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          user_type?: "admin" | "worker" | "employer"
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string
          end_time: string
          location: string
          event_type: string
          status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
          employer_id: string
          budget: number
          guests_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time: string
          end_time: string
          location: string
          event_type: string
          status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
          employer_id: string
          budget: number
          guests_count: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string
          end_time?: string
          location?: string
          event_type?: string
          status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
          employer_id?: string
          budget?: number
          guests_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      workers: {
        Row: {
          id: string
          user_id: string
          specialization: string
          hourly_rate: number
          experience_years: number
          availability_status: "available" | "busy" | "unavailable"
          rating: number
          total_events: number
          loyalty_points: number
          loyalty_level: "bronze" | "silver" | "gold" | "platinum"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization: string
          hourly_rate: number
          experience_years: number
          availability_status?: "available" | "busy" | "unavailable"
          rating?: number
          total_events?: number
          loyalty_points?: number
          loyalty_level?: "bronze" | "silver" | "gold" | "platinum"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string
          hourly_rate?: number
          experience_years?: number
          availability_status?: "available" | "busy" | "unavailable"
          rating?: number
          total_events?: number
          loyalty_points?: number
          loyalty_level?: "bronze" | "silver" | "gold" | "platinum"
          created_at?: string
          updated_at?: string
        }
      }
      employers: {
        Row: {
          id: string
          user_id: string
          company_name: string
          company_website: string | null
          business_type: string
          total_events: number
          total_spent: number
          rating: number
          status: "active" | "inactive" | "premium"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          company_website?: string | null
          business_type: string
          total_events?: number
          total_spent?: number
          rating?: number
          status?: "active" | "inactive" | "premium"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          company_website?: string | null
          business_type?: string
          total_events?: number
          total_spent?: number
          rating?: number
          status?: "active" | "inactive" | "premium"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
