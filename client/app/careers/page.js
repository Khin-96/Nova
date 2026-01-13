"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';
import { useState, useEffect } from 'react';
import { Loader2, Briefcase, MapPin, Clock } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CareersPage() {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/careers`);
                if (res.ok) {
                    const data = await res.json();
                    setJobs(data);
                }
            } catch (error) {
                console.error("Failed to load jobs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    return (
        <StaticPageLayout title="Join Our Team">
            <p className="mb-8 text-center text-xl">We are always looking for creative minds to join the NOVA movement.</p>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No open positions at the moment.</p>
                    <p className="text-gray-400 mt-2">Check back later or follow us on social media.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {jobs.map(job => (
                        <div key={job._id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{job.title}</h2>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center"><Briefcase size={16} className="mr-1" /> {job.type}</span>
                                        <span className="flex items-center"><MapPin size={16} className="mr-1" /> {job.location}</span>
                                        <span className="flex items-center"><Clock size={16} className="mr-1" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <a href={`mailto:${job.contactEmail}?subject=Application for ${job.title}`} className="mt-4 md:mt-0 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition inline-block text-center">
                                    Apply Now
                                </a>
                            </div>
                            <p className="text-gray-700 mb-4 whitespace-pre-line">{job.description}</p>
                            {job.requirements && job.requirements.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Requirements:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                        {job.requirements.map((req, i) => (
                                            <li key={i}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </StaticPageLayout>
    );
}
