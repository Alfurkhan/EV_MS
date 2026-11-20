type Props = {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
};

export default function StatsCard({ title, value, subtitle, icon: Icon }: Props) {
    return (
        <div className="rounded-2xl border-t-4 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg" style={{ borderTopColor: "var(--ev-primary)" }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <h2 className="mt-2 text-3xl font-bold">{value}</h2>
                    <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--ev-primary-soft)" }}>
                    <Icon className="h-7 w-7" style={{ color: "var(--ev-primary)" }} />
                </div>
            </div>
        </div>
    );
}
