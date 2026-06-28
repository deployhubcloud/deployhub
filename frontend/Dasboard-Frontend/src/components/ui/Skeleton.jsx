export default function Skeleton({ className = '' }) {
  return (
    <div className={`bg-white/[0.04] rounded-lg animate-pulse ${className}`} />
  )
}
