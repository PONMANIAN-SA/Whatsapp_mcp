interface Props {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}

export default function StatCard({ icon, label, value, sub, colorClass = 'text-white' }: Props) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="text-3xl mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold mt-0.5 truncate ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
