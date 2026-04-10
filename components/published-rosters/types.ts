// Maurice Rondeau — Published Rosters shared types

export interface RosterAssignmentRow {
  pilot_id: string | null
  pilot_last_name: string
  pilot_first_name: string
  rank: string
  day_number: number
  activity_code: string
}

export interface ActivityCodeInfo {
  code: string
  name: string
  category: string
  color: string
}
