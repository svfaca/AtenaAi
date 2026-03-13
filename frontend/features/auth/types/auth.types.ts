export type AuthUser = {
  id: string | number
  name: string
  full_name?: string
  nickname?: string
  email: string
  role: "student" | "teacher" | "admin" | string
  profile_image?: string
  avatar_url?: string
  interests?: string[]
  birth_date?: string
  gender?: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = {
  name: string
  email: string
  password: string
  birthdate?: string
  gender?: string
  role?: "student" | "teacher"
  interests?: string[]
  profileImage?: File
}

export type SignupFormData = {
  email: string
  password: string
  confirmPassword: string
  name: string
  birthdate: string
  gender: string
  genderCustom?: string
  role: "student" | "teacher" | ""
  interests: string[]
  profileImage?: File
}

export type AuthResponse = {
  user: AuthUser
  message?: string
  reactivated?: boolean
}
