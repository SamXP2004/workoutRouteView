import { Bike, Footprints, Mountain, PersonStanding } from 'lucide-react'

export default function ActivityIcon({ category, size = 18 }) {
  if (category === 'ride') return <Bike size={size} />
  if (category === 'hike') return <Mountain size={size} />
  if (category === 'run') return <PersonStanding size={size} />
  return <Footprints size={size} />
}
