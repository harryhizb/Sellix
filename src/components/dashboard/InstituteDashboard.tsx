import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, CalendarDays, BookOpen, Users, TrendingUp } from "lucide-react";

export function InstituteDashboard({ business }: { business: any }) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Welcome back{business?.name ? `, ${business.name}` : ''}!
                </h1>
                <p className="text-muted-foreground mt-2">Here's your Institute & Education overview.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Registrations" value="0" icon={<GraduationCap className="w-5 h-5 text-primary" />} trend="+0%" trendUp={true} />
                <StatCard title="Courses" value="0" icon={<BookOpen className="w-5 h-5 text-primary" />} trend="+0%" trendUp={true} />
                <StatCard title="Upcoming Events" value="0" icon={<CalendarDays className="w-5 h-5 text-primary" />} trend="+0%" trendUp={true} />
                <StatCard title="Inquiries" value="0" icon={<Users className="w-5 h-5 text-primary" />} trend="+0%" trendUp={true} />
            </div>

            <Card className="border border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your institute</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <QuickActionCard title="Manage Courses" description="Add or update academic programs" href="/dashboard/courses" />
                        <QuickActionCard title="Schedule Events" description="Plan upcoming activities" href="/dashboard/events" />
                        <QuickActionCard title="View Admissions" description="Process student registrations" href="/dashboard/registrations" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string; value: string; icon: React.ReactNode; trend: string; trendUp: boolean }) {
    return (
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
                    <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
                    {trend} from last month
                </p>
            </CardContent>
        </Card>
    );
}

function QuickActionCard({ title, description, href }: { title: string; description: string; href: string }) {
    return (
        <a href={href} className="block group">
            <div className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group-hover:bg-accent/50">
                <h3 className="font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </a>
    );
}
