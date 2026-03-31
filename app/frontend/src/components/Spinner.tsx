interface Props { size?: 'sm' | 'md' | 'lg'; }

export default function Spinner({ size = 'md' }: Props) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <span
      className={`inline-block ${sz} border-2 border-brand/30 border-t-brand rounded-full animate-spin`}
      aria-label="Loading"
    />
  );
}
