import type { Professional } from '../../types/booking'

interface AvatarStackProps {
  professionals: Professional[]
}

export function AvatarStack({ professionals }: AvatarStackProps) {
  return (
    <span className="ml-2 inline-flex items-center">
      {professionals.map((professional, index) => (
        <span
          key={professional.id}
          className={`-ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px] font-semibold ${professional.avatarClassName} ${index === 0 ? 'ml-0' : ''}`}
          title={professional.name}
          aria-label={professional.name}
        >
          {professional.initials}
        </span>
      ))}
    </span>
  )
}
