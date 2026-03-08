"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

export default function TourGuide() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const startTour = () => {
        if (!user) return;

        let steps: any[] = [];

        // Base step for everyone
        steps.push({
            element: '[data-tour="sidebar-profile"]',
            popover: {
                title: 'Your Profile',
                description: 'Manage your personal information, resume, and settings here.',
                side: "right", align: 'start'
            }
        });

        // Role specific steps
        if (user.role === 'STUDENT') {
            steps = [
                {
                    element: '[data-tour="sidebar-dashboard"]',
                    popover: {
                        title: 'Welcome to HireHub!',
                        description: 'Your central dashboard to track applications, upcoming interviews, and recent announcements.',
                        side: "right", align: 'start'
                    }
                },
                {
                    element: '[data-tour="sidebar-companies"]',
                    popover: {
                        title: 'Explore Companies',
                        description: 'Browse active placement drives, view company details, and apply for roles.',
                        side: "right", align: 'start'
                    }
                },
                {
                    element: '[data-tour="sidebar-challenges"]',
                    popover: {
                        title: 'Practice Coding',
                        description: 'Sharpen your skills with our built-in coding platform before technical interviews.',
                        side: "right", align: 'start'
                    }
                },
                {
                    element: '[data-tour="sidebar-resume-builder"]',
                    popover: {
                        title: 'Resume Builder',
                        description: 'Create a professional ATS-friendly resume to stand out to recruiters.',
                        side: "right", align: 'start'
                    }
                },
                ...steps
            ];
        } else if (user.role === 'COMPANY') {
            steps = [
                ...steps,
                {
                    element: '[data-tour="sidebar-drives"]',
                    popover: {
                        title: 'Manage Drives',
                        description: 'Create and oversee your recruitment drives and track applicant progress.',
                        side: "right", align: 'start'
                    }
                },
                {
                    element: '[data-tour="sidebar-interviews"]',
                    popover: {
                        title: 'Schedule Interviews',
                        description: 'Plan and manage technical and HR interview slots for shortlisted candidates.',
                        side: "right", align: 'start'
                    }
                }
            ];
        } else if (user.role === 'STAFF' || user.role === 'ADMIN') {
            steps = [
                ...steps,
                {
                    element: '[data-tour="sidebar-students"]',
                    popover: {
                        title: 'Student Directory',
                        description: 'Monitor student profiles, verify details, and track their placement progress.',
                        side: "right", align: 'start'
                    }
                },
                {
                    element: '[data-tour="sidebar-reports"]',
                    popover: {
                        title: 'Analytics & Reports',
                        description: 'Generate comprehensive placement statistics and visualize hiring trends.',
                        side: "right", align: 'start'
                    }
                }
            ];
            
            if (user.role === 'ADMIN') {
                steps.push({
                    element: '[data-tour="sidebar-admin"]',
                    popover: {
                        title: 'Admin Control Panel',
                        description: 'Manage users, approvals, system settings, and view the audit logs.',
                        side: "right", align: 'start'
                    }
                });
            }
        }

        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: steps,
            popoverClass: 'driverjs-theme',
            onHighlightStarted: (element: any) => {
                if (element && element.scrollIntoView) {
                    // Scroll the parent container so driver.js calculates position correctly
                    element.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
            },
            onDestroyStarted: () => {
                if (!driverObj.hasNextStep() || confirm("Are you sure you want to exit the tour?")) {
                    driverObj.destroy();
                    localStorage.setItem('hirehub_tour_completed', 'true');
                }
            }
        });

        driverObj.drive();
    };

    useEffect(() => {
        if (mounted && user) {
            const hasCompletedTour = localStorage.getItem('hirehub_tour_completed');
            if (!hasCompletedTour) {
                // Auto start tour for first-time users after a short delay
                setTimeout(startTour, 1500);
            }
        }
    }, [mounted, user]);

    if (!mounted || !user) return null;

    return (
        <button
            onClick={startTour}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group"
            title="Take a Platform Tour"
        >
            <HelpCircle className="w-6 h-6" />
            <span className="absolute right-full mr-4 bg-slate-900 dark:bg-slate-800 text-white text-xs py-1 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Platform Tour
            </span>
        </button>
    );
}
