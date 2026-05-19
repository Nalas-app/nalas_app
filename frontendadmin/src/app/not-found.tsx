"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
    const [path, setPath] = useState("");

    useEffect(() => {
        // Run on client side to get the attempted URL path
        setPath(window.location.pathname);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl text-center border border-gray-100">
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-50">
                    <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        404 - Not Found
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    {path && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                            <code className="text-xs text-gray-600 font-mono break-all">{path}</code>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <Link 
                        href="/dashboard" 
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#689F38] hover:bg-[#558B2F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#689F38] transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                    <button 
                        onClick={() => window.history.back()}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
            
            <div className="mt-8 text-center text-xs text-gray-400 font-medium">
                <p>&copy; {new Date().getFullYear()} Nalas' Inn Ruchee Catering Engine. All rights reserved.</p>
            </div>
        </div>
    );
}
