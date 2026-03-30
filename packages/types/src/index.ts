export type UniversityType = 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'PRIVADA'
export type PlanType = 'FREE' | 'PREMIUM' | 'PRO'
export type DegreeType = 'BACHARELADO' | 'LICENCIATURA' | 'TECNOLOGO' | 'POS_GRADUACAO' | 'MBA' | 'MESTRADO' | 'DOUTORADO'
export type ModalityType = 'PRESENCIAL' | 'EAD' | 'HIBRIDO'
export type ShiftType = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL'
export type LeadStatus = 'NEW' | 'OPENED' | 'CONTACTED' | 'ENROLLED' | 'LOST'
export type UserRole = 'OWNER' | 'MANAGER' | 'VIEWER'
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SearchParams {
  q?: string
  city?: string
  state?: string
  modality?: ModalityType
  shift?: ShiftType
  degree?: DegreeType
  type?: UniversityType
  area?: string
  prouni?: boolean
  fies?: boolean
  page?: number
  limit?: number
}

export interface LeadPayload {
  name: string
  email: string
  phone: string
  message?: string
  universityId: string
  courseId?: string
  source?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}
