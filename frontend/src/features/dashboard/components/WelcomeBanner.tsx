export default function WelcomeBanner() {
    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? "Good Morning"
            : hour < 18
                ? "Good Afternoon"
                : "Good Evening";

    return (
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold">
                {greeting} 👋
            </h1>

            <p className="text-blue-100 mt-2 text-lg">
                Welcome back, Furkhan.
            </p>

            <p className="text-blue-200 mt-1">
                Here's what's happening in your school today.
            </p>
        </div>
    );
}