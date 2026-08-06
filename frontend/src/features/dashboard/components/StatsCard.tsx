type Props = {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
};

export default function StatsCard({
                                      title,
                                      value,
                                      subtitle,
                                      icon: Icon,
                                      color,
                                      bg,
                                      border,
                                  }: Props) {
    return (
        <div
            className={`
        bg-white
        rounded-2xl
        shadow-sm
        hover:shadow-lg
        transition-all
        duration-300
        p-6
        border-t-4
        ${border}
      `}
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>

                    <h2 className="text-3xl font-bold mt-2">
                        {value}
                    </h2>

                    <p className="text-sm text-gray-400 mt-2">
                        {subtitle}
                    </p>
                </div>

                <div
                    className={`
            w-14
            h-14
            rounded-xl
            flex
            items-center
            justify-center
            ${bg}
          `}
                >
                    <Icon className={`w-7 h-7 ${color}`} />
                </div>
            </div>
        </div>
    );
}