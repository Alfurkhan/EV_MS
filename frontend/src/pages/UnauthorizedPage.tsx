export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="text-center">

                <div className="mb-4 text-6xl">
                    🔒
                </div>

                <h1 className="text-3xl font-bold text-slate-800">
                    Access Denied
                </h1>

                <p className="mt-3 text-slate-500">
                    You don't have permission to access this page.
                </p>

            </div>
        </div>
    );
}