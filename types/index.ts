export interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  avatarUrl?: string
}

export interface Emergency {
  id: string
  userId: string
  ambulanceId?: string
  status: 'pending' | 'assigned' | 'on_route' | 'arrived' | 'completed' | 'cancelled'
  type: string
  userLat: number
  userLng: number
  address: string
  notes?: string
  estimatedArrivalMinutes?: number
  totalAmount?: number
  platformFee?: number
  companyAmount?: number
  discountApplied?: boolean
  assignedAt?: string
  arrivedAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
  createdAt: string
  user?: User
  ambulance?: Ambulance
}

export interface Ambulance {
  id: string
  plate: string
  type: string
  status: 'available' | 'on_route' | 'busy' | 'offline'
  locationLat?: number
  locationLng?: number
  companyId: string
  conductorId?: string
  conductor?: User
  company?: Company
}

export interface Company {
  id: string
  name: string
  ruc: string
  phone?: string
  email?: string
  address?: string
  isVerified: boolean
  createdAt?: string
}

export interface Subscription {
  id: string
  userId: string
  planName: string
  status: 'active' | 'inactive' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  amount: number
  user?: User
}

export interface Payment {
  id: string
  userId: string
  emergencyId?: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: string
  createdAt: string
  user?: User
}

export interface DashboardMetrics {
  activeEmergencies: number
  availableAmbulances: number
  avgResponseTimeMinutes: number
  todayRevenue: number
}

export interface EmergencyByHour {
  hour: string
  count: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoginResponse {
  accessToken: string
  user: User
}
