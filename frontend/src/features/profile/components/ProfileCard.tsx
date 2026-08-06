import type { Profile } from "../types/profile";

type Props = {
    profile: Profile;
};

export default function ProfileCard({ profile }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow p-8 max-w-3xl">

            <div className="flex items-center gap-5">

                <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">

                    {profile.fullName.charAt(0)}

                </div>

                <div>

                    <h1 className="text-3xl font-bold">
                        {profile.fullName}
                    </h1>

                    <p className="text-slate-500">
                        {profile.email}
                    </p>

                </div>

            </div>

            <div className="grid grid-cols-2 gap-6 mt-10">

                <Info
                    label="Phone"
                    value={
                        profile.phoneNumber
                            ? `${profile.countryCode ?? ""} ${profile.phoneNumber}`
                            : "Not Added"
                    }
                />

                <Info
                    label="Status"
                    value={
                        profile.accountEnabled
                            ? "🟢 Active"
                            : "🔴 Disabled"
                    }
                />

                <Info
                    label="Created"
                    value={new Date(profile.createdAt).toLocaleDateString()}
                />

                <Info
                    label="Last Login"
                    value={new Date(profile.lastLoginAt).toLocaleString()}
                />

            </div>

        </div>
    );
}

function Info({
                  label,
                  value,
              }: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-sm text-slate-500">
                {label}
            </p>

            <p className="font-semibold mt-1">
                {value}
            </p>
        </div>
    );
}