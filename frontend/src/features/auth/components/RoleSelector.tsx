type Props = {
    role: string;
    onChange: (role: string) => void;
};

const roles = [
    "Student",
    "Faculty",
    "Admin",
];

export default function RoleSelector({
                                         role,
                                         onChange,
                                     }: Props) {
    return (
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl mb-8">

            {roles.map((item) => (

                <button
                    key={item}
                    type="button"
                    onClick={() => onChange(item)}
                    className={`
                        h-11
                        rounded-lg
                        font-medium
                        transition-all
                        ${
                        role === item
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-600 hover:bg-white"
                    }
                    `}
                >
                    {item}
                </button>

            ))}

        </div>
    );
}